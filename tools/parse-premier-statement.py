#!/usr/bin/env python3
"""
Parse a Premier Bank statement PDF (as text) into ledger transactions.

Input is the text of a multi-month statement bundle — the form Google Drive's
extractor returns. Output is one row per transaction, but ONLY for the months
that provably reconcile: for each statement the parsed credits and debits must
match the count AND the dollar total the bank printed in its own Balance
Summary, and the running balance must land on the printed ending balance.

A month that does not reconcile is reported and skipped rather than imported.
Half-parsed bank data is worse than none — it looks like a real book and isn't.

Usage:  python3 tools/parse-premier-statement.py <text-file> [--json out.json]
"""
import re, sys, json, collections

MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
MONTH_NO = {m: i + 1 for i, m in enumerate(MONTHS)}
AMT = r"-?[\d,]+\.\d{2}"

def cents(s):
    return int(round(float(s.replace(",", "").replace("$", "")) * 100))

def clean(t):
    # The extractor interleaves the printed address barcodes as long uppercase runs.
    t = re.sub(r"\b[A-Z]{18,}\b", " ", t)
    t = t.replace("\\*", "*")
    return re.sub(r"[ \t]+", " ", t)

STMT_RE = re.compile(
    r"Beginning Balance as of (\d{2}/\d{2}/\d{4}) \$(" + AMT + r")"
    r" \+ Deposits and Credits \((\d+)\) \$(" + AMT + r")"
    r" - Withdrawals and Debits \((\d+)\) \$(" + AMT + r")"
    r" Ending Balance as of (\d{2}/\d{2}/\d{4}) \$(" + AMT + r")")

# Section headings that switch what the following date-anchored lines MEAN.
# "Miscellaneous Debits (Continued)" appears after every page break on a busy
# month, so sections must be tracked as a running state across the whole
# statement body rather than sliced between one heading and the next.
CONT = r"(?: \(Continued\))?"
SECTION_MARKS = [
    (re.compile(r"Miscellaneous Credits" + CONT),       "in"),
    (re.compile(r"Miscellaneous Debits" + CONT),        "out"),
    (re.compile(r"Deposits and Other Credits" + CONT),  "in"),
    (re.compile(r"Paid Checks"),                        "out"),
    # Card activity is one section carrying BOTH columns, so direction is decided
    # per row. The reconciliation gate is what proves that call: if the month's
    # credit/debit counts and totals then match what the bank printed, the split
    # was right. If it doesn't, the month is skipped rather than guessed at.
    (re.compile(r"ATM/Debit Card Trans Summary" + CONT), "card"),
    (re.compile(r"Daily Balance Summary"),              None),   # dates here are balances
    (re.compile(r"CHECK IMAGES"),                       None),
    (re.compile(r"IMPORTANT MESSAGE"),                  None),
    (re.compile(r"Balance Summary"),                    None),
]

# Money coming back IN on a card line.
CARD_CREDIT = re.compile(r"\b(RETURN|REFUND|REVERSAL|CREDIT|DEPOSIT)\b", re.I)

DATE_RE = re.compile(r"\b(" + "|".join(MONTHS) + r") (\d{1,2})\b")

def marks(body):
    """Every section boundary in the body, in order, as (position, direction|None)."""
    found = []
    for rx, dirn in SECTION_MARKS:
        for m in rx.finditer(body):
            found.append((m.start(), m.end(), dirn))
    found.sort()
    # "Miscellaneous Debits" also matches inside "Miscellaneous Debits (Continued)";
    # keep the longest match starting at each position.
    dedup, seen = [], set()
    for st, en, dirn in found:
        if st in seen:
            continue
        seen.add(st)
        best = max((x for x in found if x[0] == st), key=lambda x: x[1])
        dedup.append((st, best[1], best[2]))
    return dedup

def parse_body(body, year):
    """Walk the statement body, tracking which section we're in, and collect
    every date-anchored transaction that falls inside a credits/debits/checks
    section. Returns (rows, unparseable_count)."""
    bounds = marks(body)
    rows, bad = [], 0
    hits = list(DATE_RE.finditer(body))
    for i, h in enumerate(hits):
        # which section is this date inside?
        dirn, best = None, -1
        for st, en, d in bounds:
            if en <= h.start() and en > best:
                best, dirn = en, d
        if dirn is None:
            continue
        nxt = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        # don't run past the next section heading
        for st, en, _ in bounds:
            if h.end() < st < nxt:
                nxt = st
        chunk = body[h.end():nxt]
        amts = re.findall(AMT, chunk)
        if not amts:
            bad += 1
            continue
        amt = amts[-1]
        desc = chunk[:chunk.rfind(amt)].strip(" .-")
        desc = re.sub(r"\s+", " ", desc).strip()
        desc = re.sub(r"\s*(Deposits|Withdrawals|Date Description)\s*$", "", desc).strip()
        d = dirn
        if d == "card":
            d = "in" if CARD_CREDIT.search(desc) else "out"
        rows.append((d, MONTH_NO[h.group(1)], int(h.group(2)), desc or "TRANSACTION", cents(amt)))
    return rows, bad

def parse(text):
    t = clean(text)
    stmts = list(STMT_RE.finditer(t))
    results, problems = [], []
    for i, m in enumerate(stmts):
        beg_date, beg, ncr, cr_tot, ndb, db_tot, end_date, end = m.groups()
        body = t[m.end(): stmts[i + 1].start() if i + 1 < len(stmts) else len(t)]
        year = int(end_date.split("/")[2])

        rows, bad_rows = parse_body(body, year)

        got_cr = sum(r[4] for r in rows if r[0] == "in")
        got_db = sum(r[4] for r in rows if r[0] == "out")
        n_cr = sum(1 for r in rows if r[0] == "in")
        n_db = sum(1 for r in rows if r[0] == "out")
        want_cr, want_db = cents(cr_tot), cents(db_tot)
        ok = (got_cr == want_cr and got_db == want_db
              and n_cr == int(ncr) and n_db == int(ndb)
              and bad_rows == 0
              and cents(beg) + got_cr - got_db == cents(end))
        rec = dict(period=end_date, beg=cents(beg), end=cents(end),
                   want=(int(ncr), want_cr, int(ndb), want_db),
                   got=(n_cr, got_cr, n_db, got_db), ok=ok,
                   rows=[dict(date=f"{year}-{mo:02d}-{da:02d}", direction=dr,
                              amount_cents=am, description=de)
                         for (dr, mo, da, de, am) in rows])
        (results if ok else problems).append(rec)
    return results, problems

def contiguous_run(good, problems):
    """A register's running balance is opening + every line since. Import a month
    with a gap before it and every balance after that gap is wrong — quietly, and
    it still looks like a real book. So only the unbroken run of reconciled
    statements from the earliest one is safe to import; return that, plus what
    was reconciled but held back behind a gap."""
    everything = sorted(good + problems, key=lambda r: (r["period"][6:], r["period"][:2]))
    run = []
    for st in everything:
        if st["ok"]:
            run.append(st)
        else:
            break
    held = [st["period"] for st in everything[len(run):] if st["ok"]]
    return run, held


if __name__ == "__main__":
    text = open(sys.argv[1], encoding="utf-8").read()
    good, bad = parse(text)
    tot = sum(len(g["rows"]) for g in good)
    print(f"reconciled statements: {len(good)}   transactions: {tot}")
    for g in good:
        print(f"  ok   {g['period']}  {g['got'][0]:>3} credits {g['got'][1]/100:>12,.2f} | "
              f"{g['got'][2]:>3} debits {g['got'][3]/100:>12,.2f}  -> {g['end']/100:>10,.2f}")
    if bad:
        print(f"\nNOT reconciled (skipped): {len(bad)}")
        for b in bad:
            print(f"  SKIP {b['period']}  bank says {b['want'][0]}cr/{b['want'][1]/100:,.2f} "
                  f"{b['want'][2]}db/{b['want'][3]/100:,.2f}  |  parsed "
                  f"{b['got'][0]}cr/{b['got'][1]/100:,.2f} {b['got'][2]}db/{b['got'][3]/100:,.2f}")
    run, held = contiguous_run(good, bad)
    print(f"\nsafe to import (unbroken run from the opening balance): "
          f"{len(run)} statement(s), {sum(len(r['rows']) for r in run)} transactions")
    if held:
        print(f"reconciled but HELD BACK behind a gap: {', '.join(held)}")
        print("  -> importing these would put a wrong running balance on every later line.")
        print("  -> fix by supplying the missing month(s), or export this account as CSV instead.")

    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
        json.dump(dict(importable=run, held=held,
                       not_reconciled=[b["period"] for b in bad]), open(out, "w"), indent=1)
        print(f"\nwrote {out}")
