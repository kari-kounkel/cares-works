// Client workpapers — tools.caresmn.com/<slug>/<token>. No login; the token is the key.
// Shows the year's profit & loss built from the bank statements, one line per open question
// with a one-line answer, and the full transaction list. Answers save through
// submit_workpaper_answer into public.workpaper_answers (no email).

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, FONT_LINK, WASH_BG_LITE } from "../design/neon";

function money(v) {
  if (v == null) return "";
  const r = Math.round(v * 100) / 100;
  const s = Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return r < 0 ? "(" + s + ")" : s;
}
const sum = (arr) => Math.round(arr.reduce((t, x) => t + x.amount, 0) * 100) / 100;

const CSS = `
.wp{min-height:100vh;background:${WASH_BG_LITE};color:${N.text};font-family:'Figtree',system-ui,sans-serif;font-size:15px;line-height:1.5;padding:0 20px}
.wp *{box-sizing:border-box}
.wp-wrap{max-width:900px;margin:0 auto;padding-block:28px 72px;display:flex;flex-direction:column;gap:22px}
.wp-brand{display:flex;align-items:center;gap:10px}
.wp-brand img{height:32px;width:auto}
.wp-brand span{font-family:'DM Serif Display',serif;font-size:18px;color:${N.ink}}
.wp-brand b{color:${N.blue};font-weight:400}
.wp-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${N.blue}}
.wp h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(28px,4vw,38px);line-height:1.12;margin:4px 0 6px;color:${N.ink};text-wrap:balance}
.wp h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;margin:0 0 4px;color:${N.ink}}
.wp-sub{color:${N.muted};margin:0;font-size:14px}
.wp-sheet{background:#fff;border:1px solid ${N.rule};border-radius:12px;padding:20px 22px}
.wp-sheet.focus{border:1.5px solid ${N.blue}}
.wp-lede{color:${N.muted};margin:0 0 12px;font-size:14px}
.wp-q{list-style:none;margin:0;padding:0}
.wp-q li{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid ${N.rule}}
.wp-q li:first-child{border-top:0}
.wp-q .text{font-size:14px;color:${N.ink}}
.wp-q .saved{font-size:13px;color:#15803d;grid-column:2 / 4}
.wp input,.wp select{font:inherit;font-size:14px;color:${N.text};background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:6px 9px;width:100%;min-width:0}
.wp input:focus-visible,.wp select:focus-visible,.wp button:focus-visible{outline:2px solid ${N.blue};outline-offset:1px}
.wp-btn{font-family:'Figtree',sans-serif;font-weight:700;font-size:13px;color:#fff;background:${N.blue};border:0;border-radius:999px;padding:6px 14px;cursor:pointer;white-space:nowrap}
.wp-btn:disabled{opacity:.45;cursor:default}
.wp-err{color:${N.red};font-size:12.5px;grid-column:1 / 4}
.wp table{width:100%;border-collapse:collapse;font-size:14px}
.wp th,.wp td{padding:6px 8px;text-align:left;border-bottom:1px solid ${N.rule};vertical-align:top}
.wp thead th{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:${N.muted};font-weight:500;border-bottom:1.5px solid ${N.ink}}
.wp .num{text-align:right;font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
.wp tr.band td{background:#f5f9ff;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${N.blueDark};padding-top:9px}
.wp tr.tot td{font-weight:600;border-top:1px solid ${N.ink}}
.wp .tie{color:#15803d;font-weight:600}
.wp tr.acctrow td{font-weight:500}
.wp-toggle{border:1px solid ${N.blue};background:#f5f9ff;border-radius:999px;padding:1px 9px;cursor:pointer;color:${N.blueDark};font-size:12px;font-weight:600;white-space:nowrap;margin-bottom:3px}
.wp tr.acctrow:hover td{background:#f8fbff}
.wp .amt{font:inherit;font-family:'DM Mono',monospace;background:none;border:0;border-bottom:1px dashed ${N.blue};color:${N.blueDark};cursor:pointer;padding:0 1px}
.wp .amt:hover{background:#eef5ff}
.wp tr.open td{background:#f5f9ff}
.wp tr.drillrow>td{padding:0 0 12px 0;border-bottom:1px solid ${N.rule}}
.wp .drill{border:1px solid #d6e6ff;border-radius:8px;background:#fbfdff;margin:4px 0 0}
.wp .drill-box{max-height:340px;overflow:auto}
.wp .drill table{font-size:12.5px}
.wp .drill thead th{position:sticky;top:0;background:#fbfdff}
.wp .drill-sum{font-family:'DM Mono',monospace;font-size:12.5px;padding:7px 10px;border-top:1px solid #d6e6ff;color:${N.red}}
.wp .drill-sum.ok{color:#15803d}
.wp .star{color:${N.blue};font-weight:700;margin-left:3px}
.wp-foot-note{font-size:13px;color:${N.muted};margin:10px 0 0}
.wp .coa{display:inline-block;min-width:62px;font-family:'DM Mono',monospace;font-size:12.5px;color:${N.muted}}
.wp tr.grp td{font-weight:600;color:${N.ink};border-bottom:0;padding-bottom:2px}
.wp tr.sub td{border-bottom:0;padding-top:3px;padding-bottom:3px}
.wp tr.sub td:first-child{padding-left:30px}
.wp tr.subtot td{font-weight:600;border-top:1px solid ${N.rule}}
.wp tr.subtot td:first-child{padding-left:30px}
.wp tr.net td{font-weight:700;border-top:1px solid ${N.ink};border-bottom:3px double ${N.ink}}
.wp .muted{color:${N.muted}} .wp .mono{font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums}
.wp .acct{font-family:'DM Mono',monospace;font-size:11.5px;border:1px solid ${N.rule};border-radius:4px;padding:0 5px;background:#f8fafc;white-space:nowrap}
.wp-scroll{overflow-x:auto}
.wp-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;align-items:center}
.wp-filters input{flex:2;min-width:180px}.wp-filters select{flex:1;min-width:150px;width:auto}
.wp-count{font-family:'DM Mono',monospace;font-size:12.5px;color:${N.muted};margin-left:auto}
.wp-txbox{max-height:620px;overflow:auto;border:1px solid ${N.rule};border-radius:8px}
.wp-txbox table{font-size:13px}
.wp-txbox thead th{position:sticky;top:0;background:#fff}
@media (max-width:700px){.wp-q li{grid-template-columns:1fr auto}.wp-q .text{grid-column:1 / 3}.wp-q .saved{grid-column:1 / 3}.wp-sheet{padding:16px}}
`;

// Every amount on the P&L is a button that opens the transactions behind it: date, the
// statement (account + month) to check it against, the bank's description, and the amount,
// with the total proven back to the number clicked.
const Drill = createContext(null);

function DrillTable({ cats, sign, amount }) {
  const { tx, year } = useContext(Drill);
  const list = tx.filter(t => cats.includes(t.category)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const total = Math.round(list.reduce((t, x) => t + x.amount, 0) * sign * 100) / 100;
  const ok = Math.abs(total - amount) < 0.005;
  return (
    <div className="drill">
      <div className="drill-box"><table>
        <thead><tr><th>Date</th><th>Check it on statement</th><th>Bank description</th><th className="num">Amount</th></tr></thead>
        <tbody>{list.map((t, i) => (
          <tr key={i}>
            <td className="mono">{t.date.slice(5)}/{year}</td>
            <td className="mono">{t.acct} · {MONTHS[Number(t.date.slice(5, 7)) - 1]} {year}</td>
            <td>{t.desc}{t.payee && <div className="muted" style={{ fontSize: 12 }}>{t.payee}</div>}</td>
            <td className="num">{money(t.amount * sign)}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className={"drill-sum" + (ok ? " ok" : "")}>{list.length} transaction{list.length === 1 ? "" : "s"} = {money(total)} {ok ? "✓ matches" : "— does not match " + money(amount)}</div>
    </div>
  );
}

function PLRow({ id, label, cats, amount, sign = 1, className = "", star = null }) {
  const { open, setOpen } = useContext(Drill);
  const isOpen = open === id;
  return [
    <tr key={id} className={className + (isOpen ? " open" : "")}>
      <td>{label}{star}</td>
      <td className="num"><button className="amt" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen} title="Show the transactions behind this number">{money(amount)}</button></td>
    </tr>,
    isOpen && <tr key={id + "d"} className="drillrow"><td colSpan={2}><DrillTable cats={cats} sign={sign} amount={amount} /></td></tr>,
  ];
}

// Chart-of-accounts sections: a one-line account shows as a single row; a parent with
// sub-accounts shows its heading, the indented sub-accounts, and a subtotal.
// An asterisk marks any account (or parent account) that has a question above.
const lineCat = (l) => l.acct + " " + l.name;
function Groups({ groups, qs = [], sign }) {
  const star = (acct) => qs.includes(acct) ? <span className="star" title="Has a question above">*</span> : null;
  return groups.map(g => g.lines.length === 1 && g.lines[0].acct === g.acct
    ? <PLRow key={g.acct} id={"g" + g.acct} label={<><span className="coa">{g.acct}</span>{g.name}</>} star={star(g.acct)} cats={[lineCat(g.lines[0])]} amount={g.total} sign={sign} />
    : [
        <tr key={g.acct + "h"} className="grp"><td colSpan={2}><span className="coa">{g.acct}</span>{g.name}{star(g.acct)}</td></tr>,
        ...g.lines.map(l => <PLRow key={l.acct + l.name} id={"l" + l.acct + l.name} className="sub" label={<><span className="coa">{l.acct}</span>{l.name}</>} star={star(l.acct)} cats={[lineCat(l)]} amount={l.amount} sign={sign} />),
        <PLRow key={g.acct + "t"} id={"t" + g.acct} className="subtot" label={"Total " + g.acct + " " + g.name} cats={g.lines.map(lineCat)} amount={g.total} sign={sign} />,
      ]);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function TieOut({ a }) {
  const [open, setOpen] = useState(false);
  const ties = a.months.every(m => Math.abs(m.diff) < 0.005);
  return (
    <tbody>
      <tr className="acctrow" onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
        <td><button className="wp-toggle" onClick={e => { e.stopPropagation(); setOpen(!open); }} aria-expanded={open}>{open ? "▾ Hide months" : "▸ Show months"}</button> <span className="acct">{a.acct}</span> {a.name} <span className="muted" style={{ fontSize: 12 }}>· {a.count} transactions</span></td>
        <td className="num">{money(a.begin)}</td><td className="num">{money(a.deposits)}</td><td className="num">{money(a.withdrawals)}</td><td className="num">{money(a.end)}</td>
        <td className="num tie">{ties ? "✓ 12 of 12" : "✗"}</td>
      </tr>
      {open && a.months.map(m => (
        <tr key={m.month} className="sub">
          <td>{MONTHS[m.month - 1]} <span className="muted" style={{ fontSize: 12 }}>· {m.count}</span></td>
          <td className="num">{money(m.begin)}</td><td className="num">{money(m.deposits)}</td><td className="num">{money(m.withdrawals)}</td><td className="num">{money(m.end)}</td>
          <td className="num tie">{Math.abs(m.diff) < 0.005 ? "✓" : money(m.diff)}</td>
        </tr>
      ))}
    </tbody>
  );
}

function Question({ item, saved, onSave, n }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    if (!text.trim()) return;
    setBusy(true); setErr("");
    const res = await onSave(item.key, text);
    setBusy(false);
    if (res.ok) setText(""); else setErr(res.error);
  }
  return (
    <li>
      <span className="text">{n}. {item.q}</span>
      <input id={"ans-" + item.key} aria-label={item.q} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder={saved.length ? "Add more…" : "Answer"} />
      <button className="wp-btn" disabled={busy || !text.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      {saved.length > 0 && <span className="saved">✓ Saved: {saved.map(a => a.answer).join(" · ")}</span>}
      {err && <span className="wp-err">{err}</span>}
    </li>
  );
}

export default function WorkpaperPublic({ slug, token }) {
  const [state, setState] = useState({ loading: true, data: null });
  const [answers, setAnswers] = useState([]);
  const [q, setQ] = useState(""); const [fa, setFa] = useState(""); const [fc, setFc] = useState("");
  const [drillOpen, setDrillOpen] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_workpaper_by_token", { p_slug: slug, p_token: token });
      const row = !error && Array.isArray(data) && data.length ? data[0] : null;
      setState({ loading: false, data: row });
      if (row) { setAnswers(row.answers || []); document.title = row.title; }
    })();
  }, [slug, token]);

  async function saveAnswer(itemKey, text) {
    const { error } = await supabase.rpc("submit_workpaper_answer", { p_slug: slug, p_token: token, p_item_key: itemKey, p_answer: text, p_answered_by: null });
    if (error) return { ok: false, error: "Not saved — " + error.message + ". Press Save again." };
    const { data } = await supabase.rpc("get_workpaper_by_token", { p_slug: slug, p_token: token });
    if (Array.isArray(data) && data.length) setAnswers(data[0].answers || []);
    return { ok: true };
  }

  const p = state.data?.payload;
  const tx = useMemo(() => p ? p.transactions.map(t => ({ date: p.year + "-" + t[0], acct: t[1], desc: t[2], amount: t[3], category: p.tx_categories[t[4]], payee: p.tx_payees[t[5]] })) : [], [p]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tx.filter(t => (!fa || t.acct === fa) && (!fc || t.category === fc) &&
      (!s || (t.date + " " + t.desc + " " + t.category + " " + t.payee + " " + money(t.amount) + " " + t.amount).toLowerCase().includes(s)));
  }, [tx, q, fa, fc]);

  if (state.loading) return <div className="wp" style={{ display: "grid", placeItems: "center", color: N.muted }}><style>{CSS}</style>Loading…</div>;
  if (!p) return (
    <div className="wp" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
      <style>{CSS}</style><link href={FONT_LINK} rel="stylesheet" />
      <div className="wp-sheet" style={{ maxWidth: 420 }}><h2>Link not available</h2><p className="muted">This link has expired or isn't correct.</p></div>
    </div>
  );

  const pl = p.pl;
  return (
    <div className="wp">
      <style>{CSS}</style>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="wp-wrap">
        <header>
          <div className="wp-brand"><img src="/cares-works-neon-logo.png" alt="" /><span>CARES <b>Works.</b></span></div>
          <div className="wp-eyebrow" style={{ marginTop: 16 }}>Profit &amp; loss · January 1 – December 31, {p.year}</div>
          <h1>{state.data.title}</h1>
          <p className="wp-sub">All {p.transactions_count} transactions from {p.statements} Premier Bank statements, accounts {p.accounts.map(a => a.acct).join(", ")}.</p>
        </header>

        <section className="wp-sheet focus" id="questions">
          <h2>Questions</h2>
          <p className="wp-lede">Answer on the line and press Save. It's saved right away so the {p.year} books can be reconciled by journal entry.</p>
          <ol className="wp-q">
            {p.open_items.map((it, i) => <Question key={it.key} n={i + 1} item={it} saved={answers.filter(a => a.item_key === it.key)} onSave={saveAnswer} />)}
          </ol>
        </section>

        <section className="wp-sheet" id="pl">
          <h2>Profit &amp; loss — {p.year}</h2>
          <p className="wp-lede">Click any amount to see the transactions behind it and which bank statement to check each one on.</p>
          <Drill.Provider value={{ tx, year: p.year, open: drillOpen, setOpen: setDrillOpen }}>
          <div className="wp-scroll"><table>
            <tbody>
              <tr className="band"><td colSpan={2}>Income</td></tr>
              <Groups groups={pl.income_groups} qs={pl.question_accts} sign={1} />
              <PLRow id="ti" className="tot" label="Total income" cats={pl.income_groups.flatMap(g => g.lines.map(lineCat))} amount={pl.total_income} sign={1} />
              <tr className="band"><td colSpan={2}>Expenses</td></tr>
              <Groups groups={pl.expense_groups} qs={pl.question_accts} sign={-1} />
              <PLRow id="te" className="tot" label="Total expenses" cats={pl.expense_groups.flatMap(g => g.lines.map(lineCat))} amount={pl.total_expenses} sign={-1} />
              <tr className="net"><td>Net income</td><td className="num">{money(pl.net)}</td></tr>
              <tr className="band"><td colSpan={2}>Not yet classified</td></tr>
              {pl.identify.map(l => <PLRow key={l.category} id={"i" + l.category} label={l.category} star={<span className="star">*</span>} cats={[l.category]} amount={l.amount} sign={1} />)}
              <tr className="band"><td colSpan={2}>Transfers</td></tr>
              {pl.transfers.map(l => <PLRow key={l.category} id={"x" + l.category} label={l.category} cats={[l.category]} amount={l.amount} sign={1} />)}
              <tr className="tot"><td>Change in bank balances for the year</td><td className="num">{money(pl.cash_change)}</td></tr>
            </tbody>
          </table></div>
          </Drill.Provider>
          <p className="wp-foot-note"><span className="star">*</span> Has a question above.</p>
        </section>

        {p.proof && (
          <section className="wp-sheet" id="tieout">
            <h2>Bank tie-out</h2>
            <p className="wp-lede">Every statement checked: beginning balance + deposits − withdrawals = ending balance, and every transaction is in the list below. Click an account to see its month-by-month beginning and ending balances.</p>
            <div className="wp-scroll"><table>
              <thead><tr><th>Account</th><th className="num">Jan 1, {p.year}</th><th className="num">Deposits</th><th className="num">Withdrawals</th><th className="num">Dec 31, {p.year}</th><th className="num">Ties</th></tr></thead>
              {p.proof.map(a => <TieOut key={a.acct} a={a} />)}
              <tbody>
                <tr className="tot">
                  <td>All four accounts</td>
                  <td className="num">{money(p.proof.reduce((t, a) => t + a.begin, 0))}</td>
                  <td className="num">{money(p.proof.reduce((t, a) => t + a.deposits, 0))}</td>
                  <td className="num">{money(p.proof.reduce((t, a) => t + a.withdrawals, 0))}</td>
                  <td className="num">{money(p.proof.reduce((t, a) => t + a.end, 0))}</td>
                  <td className="num tie">✓</td>
                </tr>
              </tbody>
            </table></div>
          </section>
        )}

        <section className="wp-sheet" id="transactions">
          <h2>Transactions</h2>
          <div className="wp-filters">
            <input id="wp-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search payee or amount" aria-label="Search transactions" />
            <select id="wp-fa" value={fa} onChange={e => setFa(e.target.value)} aria-label="Account"><option value="">All accounts</option>{p.accounts.map(a => <option key={a.acct} value={a.acct}>{a.acct} · {a.name}</option>)}</select>
            <select id="wp-fc" value={fc} onChange={e => setFc(e.target.value)} aria-label="Category"><option value="">All categories</option>{p.tx_categories.map(c => <option key={c}>{c}</option>)}</select>
            <span className="wp-count">{shown.length} of {tx.length} · {money(sum(shown))}</span>
          </div>
          <div className="wp-txbox"><table>
            <thead><tr><th>Date</th><th>Acct</th><th>Description</th><th className="num">Amount</th><th>Category</th></tr></thead>
            <tbody>{shown.map((t, i) => (
              <tr key={i}><td className="mono">{t.date}</td><td><span className="acct">{t.acct}</span></td>
                <td>{t.desc}{t.payee && <div className="muted" style={{ fontSize: 12 }}>{t.payee}</div>}</td>
                <td className="num">{money(t.amount)}</td><td>{t.category}</td></tr>
            ))}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}
