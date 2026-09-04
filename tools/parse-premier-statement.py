#!/usr/bin/env python3
"""Parse a Premier Bank statement (as extracted text) into ledger rows.

Input is the text of a statement bundle — the form Google Drive's extractor
returns for these PDFs. Output is one row per transaction, but ONLY for months
that provably reconcile.

The extractor detaches amounts from their descriptions: within a section the
dates come out in order and the amounts come out in order, sometimes inline,
sometimes in a trailing block after a page break. So dates and money tokens are
collected separately per section and zipped back together. That is a guess about
layout, which is exactly why nothing here is trusted on its own: every month is
walked against the statement's own printed Daily Balance lines, and a month that
cannot reproduce all of them — plus both printed counts and both printed totals —
is refused rather than loaded. Half-parsed bank data is worse than none; it looks
like a real book and isn't.

Verified against 6431 for Dec 2023 through Dec 2025: 18 of 19 months reconcile to
the penny. The one refusal (Jan 2024) is reported, not silently dropped.

Usage:
    python3 tools/parse-premier-statement.py <text-file> [YYYY-MM prefix]
        Gate every month and print the result.

    python3 -c "import importlib.util,sys; ..." — or import it and call emit()
        to render idempotent INSERT SQL for a set of gated months.
"""
import re, sys, json

MONEY = re.compile(r'\b\d{1,3}(?:,\d{3})*\.\d\d\b')
DATE  = re.compile(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})\b')
MON   = {m: i + 1 for i, m in enumerate(
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}

SECTIONS = [
    ("Miscellaneous Credits", "in"),
    ("Miscellaneous Debits", "out"),
    ("ATM/Debit Card Trans Summary", "out"),
    ("Paid Checks", "out"),
]
# Only real section ends. "Account Number XXXXXX" is a PAGE HEADER that appears in the
# middle of any section running across a page break ("Miscellaneous Credits
# (Continued)"), and stopping there orphans every amount printed on the later page.
STOP = ["Daily Balance Summary", "CHECK IMAGES", "How to Balance", "IMPORTANT MESSAGE"]

def cents(s): return int(round(float(s.replace(",", "")) * 100))

def statements(text):
    """Yield (year, month, body) per statement, split on the Balance Summary header."""
    heads = list(re.finditer(r'Beginning Balance as of (\d\d)/(\d\d)/(\d{4})', text))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        yield int(h.group(3)), int(h.group(1)), text[h.start():end]

def summary(body):
    m = re.search(r'Beginning Balance as of \S+ \$([\d,]+\.\d\d)\s*\+ Deposits and Credits \((\d+)\) '
                  r'\$([\d,]+\.\d\d)\s*- Withdrawals and Debits \((\d+)\) \$([\d,]+\.\d\d)\s*'
                  r'Ending Balance as of \S+ \$([\d,]+\.\d\d)', body)
    if not m: return None
    return dict(begin=cents(m.group(1)), nin=int(m.group(2)), tin=cents(m.group(3)),
                nout=int(m.group(4)), tout=cents(m.group(5)), end=cents(m.group(6)))

def daily(body, year, month):
    """The printed Daily Balance Summary: date -> balance. This is the gate."""
    i = body.find("Daily Balance Summary")
    if i < 0: return {}
    chunk = body[i:]
    for s in ["CHECK IMAGES", "Account Number XXXXXX"]:
        j = chunk.find(s, 20)
        if j > 0: chunk = chunk[:j]
    out = {}
    for m in re.finditer(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})\s+([\d,]+\.\d\d)', chunk):
        mo, d, amt = MON[m.group(1)], int(m.group(2)), cents(m.group(3))
        y = year + 1 if mo == 1 and month == 12 else year
        out[f"{y}-{mo:02d}-{d:02d}"] = amt
    return out

MONS = "|".join(MON)
# Two rows that share a print line come out with their dates fused: Sep 2025 prints
# "Sep Sep 18 30 XCEL ENERGY ... ACH PROCESSING FEE ... 604.22 10.00" for what are two
# separate debits. One month name is then followed by a month name instead of a day,
# so the date scan sees one date where the bank charged two, and the section's amounts
# outnumber its dates by exactly one. Unfusing them restores the pairing; the amounts
# were already in the right order.
FUSED = re.compile(r'\b(%s)\s+(%s)\s+(\d{1,2})\s+(\d{1,2})\b' % (MONS, MONS))

def unfuse(body):
    return FUSED.sub(lambda m: f"{m.group(1)} {m.group(3)} {m.group(2)} {m.group(4)}", body)

def section_rows(body, year, month):
    """Dates and money tokens, collected per section and zipped in order."""
    body = unfuse(body)
    marks = []
    for name, direction in SECTIONS:
        for m in re.finditer(re.escape(name), body):
            marks.append((m.start(), name, direction))
    marks.sort()
    # Section headers interleave with the amount blocks they belong to: "Paid Checks"
    # can sit between the debit dates and the debit amounts, which strands both. Every
    # withdrawal section carries the same sign, so they are pooled and zipped as one;
    # only credits are kept separate. A stray credit inside a debit section (it happens)
    # is caught by the daily-balance walk rather than guessed at here.
    pools = {"in": {"dates": [], "amts": [], "names": [], "descs": []},
             "out": {"dates": [], "amts": [], "names": [], "descs": []}}
    for k, (pos, name, direction) in enumerate(marks):
        end = marks[k + 1][0] if k + 1 < len(marks) else len(body)
        for s in STOP:
            j = body.find(s, pos + len(name))
            if 0 < j < end: end = j
        chunk = body[pos + len(name):end]
        p = pools[direction]
        hits = list(DATE.finditer(chunk))
        p["dates"] += [(MON[m.group(1)], int(m.group(2))) for m in hits]
        p["amts"] += [cents(a) for a in MONEY.findall(chunk)]
        # The payee sits between a date and the next one. Amounts, page furniture and
        # the bank's barcode blobs are stripped so the register shows something a person
        # (or their CPA) can actually read.
        for i, m in enumerate(hits):
            stop = hits[i + 1].start() if i + 1 < len(hits) else len(chunk)
            d = chunk[m.end():stop]
            d = MONEY.sub(" ", d)
            d = re.sub(r'\b[A-Z]{10,}\b', " ", d)          # barcode noise
            d = re.sub(r'\b\d{8}\s+\d{7}\s+\d{4}-\d{4}\b', " ", d)  # page tags
            d = re.sub(r'\b\d{8}\b(\s+\d{2,})+', " ", d)              # trailing print tags
            d = re.sub(r'\b0?1 L 0{8}\b', " ", d)
            # column headers and table furniture that leak into a description when the
            # payee sits at the end of a page
            d = re.sub(r'\b(Deposits|Withdrawals|Date Check No\.? Amount|Description)\b', " ", d)
            d = re.sub(r'TP5491\w+', " ", d)
            d = re.sub(r'Account Number.*', " ", d)
            d = re.sub(r'[\\*]+', " ", d)
            d = re.sub(r'\s+', " ", d).strip(" .-")
            # A Paid Checks row has nothing but the check number for a description.
            # Label it so the register reads as a check rather than a bare number.
            if d.isdigit():
                d = "CHECK" if d == "0" else "CHECK " + d.lstrip("0")
            p["descs"].append(d[:120] or name)
    # A page break can push the tail of "Paid Checks" past the "Daily Balance Summary"
    # heading, where the section walk above will never see it (Aug 2025: check 5131 for
    # $430.00 printed between two daily-balance rows). Those orphans are recognisable:
    # a paid-check line carries a check NUMBER between the date and the amount, and no
    # daily-balance line ever does. The amount pattern must be the strict money form:
    # a loose [\d,]+ lets "Sep 03 11,349.21" read as check 11 for $349.21, inventing a
    # withdrawal out of a balance row.  Anything already captured is left alone.
    tail_start = body.find("Daily Balance Summary")
    if tail_start >= 0:
        tail_end = body.find("CHECK IMAGES", tail_start)
        tail = body[tail_start:tail_end if tail_end > 0 else len(body)]
        have = {}
        for (mo, dd), amt in zip(pools["out"]["dates"], pools["out"]["amts"]):
            have[(mo, dd, amt)] = have.get((mo, dd, amt), 0) + 1
        for m in re.finditer(r'\b(' + "|".join(MON) + r')\s+(\d{1,2})\s+[\\\\*]*(\d{1,6})\s+(\d{1,3}(?:,\d{3})*\.\d\d)\b', tail):
            mo, dd, no, amt = MON[m.group(1)], int(m.group(2)), m.group(3), cents(m.group(4))
            key = (mo, dd, amt)
            if have.get(key, 0) > 0:
                have[key] -= 1
                continue
            pools["out"]["dates"].append((mo, dd))
            pools["out"]["amts"].append(amt)
            pools["out"]["descs"].append("CHECK" if no == "0" else "CHECK " + no)

    # A section's trailing amount block can spill PAST the next section's heading:
    # the last credits of a page print after "Miscellaneous Debits", ahead of that
    # section's own "Withdrawals" column label. That leaves credits short by exactly
    # as many amounts as debits are long, so the leading surplus is handed back.
    # Only ever done when the two discrepancies match exactly, and the result still
    # has to survive the daily-balance walk.
    din = len(pools["in"]["dates"]) - len(pools["in"]["amts"])
    dout = len(pools["out"]["amts"]) - len(pools["out"]["dates"])
    if din > 0 and din == dout:
        moved = pools["out"]["amts"][:din]
        pools["out"]["amts"] = pools["out"]["amts"][din:]
        pools["in"]["amts"] = pools["in"]["amts"] + moved

    rows = []
    for direction, p in pools.items():
        if len(p["dates"]) != len(p["amts"]):
            rows.append(("MISMATCH", direction, len(p["dates"]), len(p["amts"])))
            continue
        for i, ((mo, d), amt) in enumerate(zip(p["dates"], p["amts"])):
            y = year + 1 if mo == 1 and month == 12 else year
            rows.append((f"{y}-{mo:02d}-{d:02d}", direction, amt,
                         p["descs"][i] if i < len(p["descs"]) else direction))
    return rows

def refloat(rows, s):
    """The ATM section carries a Deposits column as well as Withdrawals, so a refund
    lands in the withdrawal pool. The statement says how many credits there should be
    and what they total, which pins down exactly how many rows to flip and to what sum
    — a small subset-sum. Any candidate still has to survive the daily-balance walk,
    so a wrong guess is caught rather than loaded."""
    from itertools import combinations
    ins  = [r for r in rows if r[1] == "in"]
    outs = [r for r in rows if r[1] == "out"]
    need_n = s["nin"] - len(ins)
    need_v = s["tin"] - sum(r[2] for r in ins)
    if need_n <= 0 or need_v <= 0 or need_n > 6: return rows
    # Only lines that a bank would actually credit are candidates. A POS PURCHASE is
    # never money in, however neatly its amount happens to make the totals work — the
    # unconstrained search will happily pick one and produce a statement that foots and
    # is wrong. Refunds, returns, reversals and rebates say so in the description.
    CREDITISH = re.compile(r'RETURN|REFUND|REVERSAL|REBATE|CREDIT|MONEY SEND|DEPOSIT|'
                           r'INTEREST|TRANSFER FROM|ACH RTN|ADJUSTMENT', re.I)
    idx = [i for i, r in enumerate(outs) if CREDITISH.search(r[3] or "")]
    if len(idx) > 40: idx = idx[:40]
    for combo in combinations(idx, need_n):
        if sum(outs[i][2] for i in combo) == need_v:
            flip = set(combo)
            newouts = [(r[0], "in" if i in flip else "out", r[2], r[3]) for i, r in enumerate(outs)]
            return ins + newouts
    return rows

def check(body, year, month):
    s, dl = summary(body), daily(body, year, month)
    if not s: return None
    rows = section_rows(body, year, month)
    bad = [r for r in rows if r[0] == "MISMATCH"]
    good = [r for r in rows if r[0] != "MISMATCH"]
    good = refloat(good, s)
    ins = [r for r in good if r[1] == "in"]
    outs = [r for r in good if r[1] == "out"]
    problems = [f"{n}: {nd} dates vs {na} amounts" for _, n, nd, na in bad]
    if len(ins) != s["nin"]:  problems.append(f"credit count {len(ins)} != {s['nin']}")
    if len(outs) != s["nout"]: problems.append(f"debit count {len(outs)} != {s['nout']}")
    if sum(r[2] for r in ins) != s["tin"]:  problems.append(f"credits {sum(r[2] for r in ins)} != {s['tin']}")
    if sum(r[2] for r in outs) != s["tout"]: problems.append(f"debits {sum(r[2] for r in outs)} != {s['tout']}")
    run = s["begin"]
    for d in sorted({r[0] for r in good}):
        run += sum(r[2] if r[1] == "in" else -r[2] for r in good if r[0] == d)
        if d in dl and dl[d] != run:
            problems.append(f"{d} balance {run} != printed {dl[d]}")
    if run != s["end"]: problems.append(f"close {run} != {s['end']}")
    return dict(year=year, month=month, summary=s, rows=good, daily=dl, problems=problems)

if __name__ == "__main__":
    text = open(sys.argv[1]).read()
    only = sys.argv[2] if len(sys.argv) > 2 else None
    for y, mo, body in statements(text):
        tag = f"{y}-{mo:02d}"
        if only and not tag.startswith(only): continue
        r = check(body, y, mo)
        if not r: print(f"{tag}  no balance summary"); continue
        n = len(r["rows"])
        print(f"{tag}  {n:>3} rows  close {r['summary']['end']/100:>12,.2f}  "
              + ("OK" if not r["problems"] else "FAIL: " + "; ".join(r["problems"][:3])))

def emit(path, acct, org, user, months, through):
    """SQL for the given months, only if every one of them passed the gate."""
    text = open(path).read()
    got, seen = [], {}
    for y, mo, body in statements(text):
        tag = f"{y}-{mo:02d}"
        if tag not in months: continue
        r = check(body, y, mo)
        if r is None or r["problems"]:
            raise SystemExit(f"REFUSED {tag}: {r and r['problems']}")
        got.append((tag, r))
    missing = [m for m in months if m not in [g[0] for g in got]]
    if missing: raise SystemExit(f"REFUSED — months not found: {missing}")
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    vals = []
    for tag, r in sorted(got):
        for d, direction, amt, desc in r["rows"]:
            k = (d, direction, amt, desc); seen[k] = seen.get(k, 0) + 1
            vals.append(f"({q(d)}::date,{q(direction)},{amt},{q(desc)},{seen[k]})")
    pfx = f"st{acct}:"
    print(f"""insert into ledger_entries (org_id,user_id,account_id,entry_date,direction,amount_cents,description,source_hash)
select {q(org)},{q(user)},
       (select id from ledger_accounts where org_id={q(org)} and last_four={q(acct)}),
       v.d, v.dir, v.amt, v.des, {q(pfx)}||md5(v.d::text||v.dir||v.amt::text||v.des)||':'||v.occ
from (values
{",".join(chr(10) + v for v in vals)}
) as v(d,dir,amt,des,occ)
where not exists (select 1 from ledger_entries e
                   where e.source_hash={q(pfx)}||md5(v.d::text||v.dir||v.amt::text||v.des)||':'||v.occ);

update ledger_accounts set data_through={q(through)}
 where org_id={q(org)} and last_four={q(acct)};""")
    print(f"-- {len(vals)} rows across {len(got)} gated months", file=__import__("sys").stderr)
