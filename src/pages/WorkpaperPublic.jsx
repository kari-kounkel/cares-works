// Client workpapers — tools.caresmn.com/<slug>/<token>. No login; the token is the key.
// Shows a set of tax workpapers (payload built from bank statements + QuickBooks) and lets
// the client answer each open item. Answers save through submit_workpaper_answer and are
// emailed to the owner by the workpaper-answer-notify function.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, FONT_LINK, WASH_BG_LITE } from "../design/neon";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function money(v, blankZero = true) {
  if (v == null) return "";
  const r = Math.round(v * 100) / 100;
  if (blankZero && Math.abs(r) < 0.005) return "–";
  const s = Math.abs(r).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return r < 0 ? "(" + s + ")" : s;
}
function when(ts) {
  try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}

const CSS = `
.wp{min-height:100vh;background:${WASH_BG_LITE};color:${N.text};font-family:'Figtree',system-ui,sans-serif;font-size:15px;line-height:1.55;padding:0 20px}
.wp *{box-sizing:border-box}
.wp-wrap{max-width:1180px;margin:0 auto;padding-block:28px 72px;display:grid;grid-template-columns:190px minmax(0,1fr);gap:36px}
.wp-top{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:18px;padding-bottom:22px;border-bottom:1px solid ${N.rule}}
.wp-brand{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.wp-brand img{height:34px;width:auto}
.wp-brand span{font-family:'DM Serif Display',serif;font-size:19px;color:${N.ink}}
.wp-brand b{color:${N.blue};font-weight:400}
.wp-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${N.blue}}
.wp h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(28px,4vw,40px);line-height:1.12;margin:6px 0 8px;color:${N.ink};text-wrap:balance}
.wp h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;margin:0 0 4px;color:${N.ink};text-wrap:balance}
.wp-sub{color:${N.muted};max-width:64ch;margin:0}
.wp-stamp{display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:13px;color:${N.muted}}
.wp-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:3px 11px;font-weight:600;font-size:12.5px;border:1.5px solid}
.wp-pill.ok{border-color:${N.green};color:#15803d;background:rgba(34,197,94,.08)}
.wp-pill.blue{border-color:${N.blue};color:${N.blueDark};background:rgba(0,128,255,.07)}
.wp-nav{position:sticky;top:20px;align-self:start;display:flex;flex-direction:column;gap:2px;font-size:13.5px}
.wp-nav .lbl{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:${N.muted};margin-bottom:8px}
.wp-nav a{color:${N.muted};text-decoration:none;padding:5px 10px;border-left:2px solid transparent}
.wp-nav a:hover,.wp-nav a:focus-visible{color:${N.ink};border-left-color:${N.blue};outline:none}
.wp-main{display:flex;flex-direction:column;gap:26px;min-width:0}
.wp-sheet{background:#fff;border:1px solid ${N.rule};border-radius:12px;padding:24px 26px}
.wp-sheet.focus{border:1.5px solid ${N.blue};box-shadow:0 0 0 4px rgba(0,128,255,.07)}
.wp-lede{color:${N.muted};margin:0 0 18px;max-width:74ch;font-size:14px}
.wp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:${N.rule};border:1px solid ${N.rule};border-radius:10px;overflow:hidden}
.wp-kpi{background:#fff;padding:16px 18px}
.wp-kpi .k{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${N.muted}}
.wp-kpi .v{font-family:'DM Mono',monospace;font-size:21px;margin-top:6px;color:${N.ink};font-variant-numeric:tabular-nums}
.wp-kpi .n{font-size:12.5px;color:${N.muted}}
.wp-scroll{overflow-x:auto}
.wp table{width:100%;border-collapse:collapse;font-size:13.5px}
.wp th,.wp td{padding:7px 10px;text-align:left;vertical-align:top;border-bottom:1px solid ${N.rule}}
.wp thead th{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:${N.muted};font-weight:500;border-bottom:1.5px solid ${N.ink};white-space:nowrap}
.wp .num{text-align:right;font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
.wp .var{color:${N.red}}
.wp tr.band th{background:#f5f9ff;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${N.blueDark};font-weight:500}
.wp tr.tot td{font-weight:600;border-top:1px solid ${N.ink}}
.wp tr.net td{font-weight:700;border-top:1px solid ${N.ink};border-bottom:3px double ${N.ink}}
.wp tr.proof td{color:${N.muted}} .wp tr.proof.ok td{color:#15803d;font-weight:600}
.wp .cats{font-size:11.5px;color:${N.muted};margin-top:2px;max-width:50ch}
.wp .acct{font-family:'DM Mono',monospace;font-size:11.5px;border:1px solid ${N.rule};border-radius:4px;padding:0 5px;color:${N.ink};background:#f8fafc;white-space:nowrap}
.wp .mono{font-family:'DM Mono',monospace;font-variant-numeric:tabular-nums} .wp .muted{color:${N.muted}}
.wp-oi{list-style:none;margin:0;padding:0;counter-reset:oi}
.wp-oi>li{counter-increment:oi;border-top:1px solid ${N.rule};padding:16px 0 16px 42px;position:relative}
.wp-oi>li::before{content:counter(oi);position:absolute;left:0;top:16px;width:28px;height:28px;border-radius:50%;border:1.5px solid ${N.blue};color:${N.blue};font-family:'DM Mono',monospace;font-size:12px;display:grid;place-items:center}
.wp-oi>li.done::before{content:"✓";border-color:${N.green};color:#15803d;background:rgba(34,197,94,.08)}
.wp-oi-head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-weight:600;color:${N.ink}}
.wp-oi p{margin:3px 0 10px;color:${N.muted};font-size:14px;max-width:80ch}
.wp-ans{border-left:3px solid ${N.green};background:rgba(34,197,94,.06);padding:8px 12px;margin:0 0 8px;white-space:pre-wrap;font-size:14px;color:${N.text}}
.wp-ans .by{font-family:'DM Mono',monospace;font-size:11px;color:${N.muted};margin-top:4px;white-space:normal}
.wp textarea,.wp input,.wp select{font:inherit;font-size:14px;color:${N.text};background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;width:100%}
.wp textarea{min-height:74px;resize:vertical}
.wp textarea:focus-visible,.wp input:focus-visible,.wp select:focus-visible,.wp summary:focus-visible,.wp button:focus-visible{outline:2px solid ${N.blue};outline-offset:1px}
.wp-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}
.wp-btn{font-family:'Figtree',sans-serif;font-weight:700;font-size:14px;color:#fff;background:${N.blue};border:0;border-radius:999px;padding:8px 18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,128,255,.35)}
.wp-btn:disabled{opacity:.5;cursor:default;box-shadow:none}
.wp-msg{font-size:13px} .wp-msg.ok{color:#15803d} .wp-msg.err{color:${N.red}}
.wp-name{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#f5f9ff;border:1px solid #d6e6ff;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:14px}
.wp-name input{max-width:280px}
.wp details{border-top:1px solid ${N.rule}} .wp details:last-of-type{border-bottom:1px solid ${N.rule}}
.wp summary{cursor:pointer;padding:11px 2px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-weight:600;color:${N.ink}}
.wp summary .meta{font-weight:400;color:${N.muted};font-size:12.5px;margin-left:auto;font-family:'DM Mono',monospace}
.wp .tie{color:#15803d}
.wp-filters{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;align-items:flex-end}
.wp-filters label{display:flex;flex-direction:column;gap:3px;font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:${N.muted};min-width:160px;flex:1}
.wp-count{font-family:'DM Mono',monospace;font-size:12.5px;color:${N.muted};margin-left:auto}
.wp-txbox{max-height:640px;overflow:auto;border:1px solid ${N.rule};border-radius:8px}
.wp-txbox thead th{position:sticky;top:0;background:#fff;z-index:1}
.wp-txbox .note{color:${N.blueDark};font-size:12px}
.wp-foot{font-size:13px;color:${N.muted};display:grid;gap:6px}
@media (max-width:860px){.wp-wrap{grid-template-columns:1fr}.wp-nav{position:static;flex-direction:row;flex-wrap:wrap}.wp-nav .lbl{width:100%}.wp-nav a{border-left:0;padding:4px 8px}.wp-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.wp-stamp{align-items:flex-start}.wp-sheet{padding:18px 16px}.wp-oi>li{padding-left:38px}}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

function OpenItem({ item, answers, onSave, name }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const mine = answers.filter(a => a.item_key === item.key);
  async function save() {
    if (!text.trim()) return;
    setBusy(true); setMsg(null);
    const res = await onSave(item.key, text, name);
    setBusy(false);
    if (res.ok) { setText(""); setMsg({ ok: true, t: "Saved. Kari has been sent your answer." }); }
    else setMsg({ ok: false, t: res.error || "That didn't save. Check your connection and press Save answer again." });
  }
  return (
    <li className={mine.length ? "done" : ""}>
      <div className="wp-oi-head"><span>{item.title}</span>{item.amount != null && <span className="mono">{money(item.amount, false)}</span>}</div>
      <p>{item.detail}</p>
      {mine.map((a, i) => (
        <div className="wp-ans" key={i}>{a.answer}<div className="by">{a.answered_by || "Answer"} · {when(a.created_at)}</div></div>
      ))}
      <label htmlFor={"ans-" + item.key} className="muted" style={{ fontSize: 12.5 }}>{mine.length ? "Add to your answer" : "Your answer"}</label>
      <textarea id={"ans-" + item.key} value={text} onChange={e => setText(e.target.value)} placeholder="Type your answer here…" />
      <div className="wp-row">
        <button className="wp-btn" disabled={busy || !text.trim()} onClick={save}>{busy ? "Saving…" : "Save answer"}</button>
        {msg && <span className={"wp-msg " + (msg.ok ? "ok" : "err")}>{msg.t}</span>}
      </div>
    </li>
  );
}

export default function WorkpaperPublic({ slug, token }) {
  const [state, setState] = useState({ loading: true, data: null });
  const [answers, setAnswers] = useState([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState(""); const [fa, setFa] = useState(""); const [fc, setFc] = useState(""); const [fo, setFo] = useState("");

  async function load() {
    const { data, error } = await supabase.rpc("get_workpaper_by_token", { p_slug: slug, p_token: token });
    const row = !error && Array.isArray(data) && data.length ? data[0] : null;
    setState({ loading: false, data: row });
    if (row) setAnswers(row.answers || []);
  }
  useEffect(() => { load(); }, [slug, token]);
  useEffect(() => { if (state.data) document.title = state.data.title; }, [state.data]);

  async function saveAnswer(itemKey, text, who) {
    const { error } = await supabase.rpc("submit_workpaper_answer", { p_slug: slug, p_token: token, p_item_key: itemKey, p_answer: text, p_answered_by: who || null });
    if (error) return { ok: false, error: "That didn't save: " + error.message };
    supabase.functions.invoke("workpaper-answer-notify", { body: { slug, token, item_key: itemKey } }).catch(() => {});
    const { data } = await supabase.rpc("get_workpaper_by_token", { p_slug: slug, p_token: token });
    if (Array.isArray(data) && data.length) setAnswers(data[0].answers || []);
    return { ok: true };
  }

  const p = state.data?.payload;
  const tx = useMemo(() => {
    if (!p) return [];
    return p.transactions.map(t => ({ date: p.year + "-" + t[0], acct: t[1], desc: t[2], amount: t[3], category: p.tx_categories[t[4]], payee: p.tx_payees[t[5]], info: p.tx_infos[t[6]] }));
  }, [p]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tx.filter(t => (!fa || t.acct === fa) && (!fc || t.category === fc) && (fo !== "info" || t.info) &&
      (!s || (t.date + " " + t.desc + " " + t.category + " " + t.payee + " " + t.info + " " + money(t.amount, false) + " " + t.amount).toLowerCase().includes(s)));
  }, [tx, q, fa, fc, fo]);

  if (state.loading) return <div className="wp" style={{ display: "grid", placeItems: "center", color: N.muted }}><style>{CSS}</style>Loading…</div>;
  if (!p) return (
    <div className="wp" style={{ display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <style>{CSS}</style><link href={FONT_LINK} rel="stylesheet" />
      <div className="wp-sheet" style={{ maxWidth: 440 }}><h2>Link not available</h2><p className="muted">This link has expired or isn't correct. Ask the person who sent it for a new one.</p></div>
    </div>
  );

  const answeredCount = new Set(answers.map(a => a.item_key)).size;
  const s = p.summary;
  const net = p.net;
  return (
    <div className="wp">
      <style>{CSS}</style>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="wp-wrap">
        <header className="wp-top">
          <div>
            <div className="wp-brand"><img src="/cares-works-neon-logo.png" alt="" /><span>CARES <b>Works.</b></span></div>
            <div className="wp-eyebrow">Tax workpapers · calendar year {p.year}</div>
            <h1>{state.data.title}</h1>
            <p className="wp-sub">Every {p.year} transaction in the four Premier Bank accounts carried in the {p.entity} QuickBooks file ({p.accounts.map(a => a.acct).join(", ")}), classified from the bank statements and compared with QuickBooks, which stops in July {p.year}.</p>
          </div>
          <div className="wp-stamp">
            <span className="wp-pill ok">✓ {s.statements_tied} of {s.statements} statements tie · ${money(s.proof_diff, false)} difference</span>
            <span className="wp-pill blue">{answeredCount} of {p.open_items.length} open items answered</span>
            <span>Prepared {new Date(p.prepared + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {p.prepared_by}</span>
          </div>
        </header>

        <nav className="wp-nav" aria-label="Sections">
          <span className="lbl">Sections</span>
          <a href="#open">Open items</a><a href="#summary">Summary</a><a href="#pl">Profit &amp; loss vs QuickBooks</a><a href="#cash">Cash vs QuickBooks</a>
          <a href="#proof">Bank proof</a><a href="#loans">Loans &amp; mortgages</a><a href="#checks">Checks &amp; slips</a><a href="#register">Transaction register</a>
        </nav>

        <main className="wp-main">
          <section className="wp-sheet focus" id="open">
            <h2>Open items</h2>
            <p className="wp-lede">These answers finish the {p.year} books. Type an answer under any item and press Save answer — it's saved right away and sent to Kari. Come back to this link any time to add more.</p>
            <div className="wp-name">
              <label htmlFor="wp-who">Your name</label>
              <input id="wp-who" value={name} onChange={e => setName(e.target.value)} placeholder="So Kari knows who answered" />
            </div>
            <ol className="wp-oi">
              {p.open_items.map(it => <OpenItem key={it.key} item={it} answers={answers} onSave={saveAnswer} name={name} />)}
            </ol>
          </section>

          <section className="wp-sheet" id="summary">
            <h2>Summary</h2>
            <p className="wp-lede">Bank figures cover the full year. QuickBooks figures are its {p.year} reports, which contain January–July only.</p>
            <div className="wp-kpis">
              <div className="wp-kpi"><div className="k">Net income · bank</div><div className="v">{money(s.net_bank, false)}</div><div className="n">Jan–Dec, all four accounts</div></div>
              <div className="wp-kpi"><div className="k">Net income · QuickBooks</div><div className="v">{money(s.net_qbo, false)}</div><div className="n">Entries stop July {p.year}</div></div>
              <div className="wp-kpi"><div className="k">Aug–Dec, not in QuickBooks</div><div className="v">{money(s.net_aug_dec, false)}</div><div className="n">Net, from the bank</div></div>
              <div className="wp-kpi"><div className="k">Transactions classified</div><div className="v">{s.transactions}</div><div className="n">From {s.statements} monthly statements</div></div>
            </div>
          </section>

          <section className="wp-sheet" id="pl">
            <h2>Profit &amp; loss vs QuickBooks</h2>
            <p className="wp-lede">Bank activity grouped to the QuickBooks line it compares with. Differences of $1,000 or more are in red; the categories feeding each line are listed under it.</p>
            <div className="wp-scroll"><table>
              <thead><tr><th>QuickBooks line</th><th className="num">Bank Jan–Jul</th><th className="num">QuickBooks {p.year}</th><th className="num">Bank – QBO</th><th className="num">Bank Aug–Dec</th><th className="num">Bank full year</th></tr></thead>
              <tbody>
                {p.pl.map(sec => [
                  <tr className="band" key={sec.section + "h"}><th colSpan={6}>{sec.section}</th></tr>,
                  ...sec.lines.map(l => (
                    <tr key={sec.section + l.line}>
                      <td>{l.line}{l.categories.length > 0 && <div className="cats">{l.categories.join(", ")}</div>}</td>
                      {l.values.map((v, i) => <td key={i} className={"num" + (i === 2 && Math.abs(v) >= 1000 ? " var" : "")}>{money(v)}</td>)}
                    </tr>
                  )),
                  <tr className="tot" key={sec.section + "t"}><td>Total {sec.section.toLowerCase()}</td>{sec.total.map((v, i) => <td key={i} className="num">{money(v, false)}</td>)}</tr>,
                ])}
                <tr className="net"><td>Net income</td>{net.map((v, i) => <td key={i} className="num">{money(v, false)}</td>)}</tr>
                <tr className="band"><th colSpan={6}>Transfers &amp; owner items — not income or expense</th></tr>
                {p.owner.map(o => <tr key={o.category}><td>{o.category}</td><td className="num">{money(o.values[0])}</td><td></td><td></td><td className="num">{money(o.values[1])}</td><td className="num">{money(o.values[2])}</td></tr>)}
                <tr className="proof"><td colSpan={5}>Net change in cash — workpapers</td><td className="num">{money(p.proof_line.workpapers, false)}</td></tr>
                <tr className="proof"><td colSpan={5}>Net change in cash — bank statements</td><td className="num">{money(p.proof_line.bank, false)}</td></tr>
                <tr className="proof ok"><td colSpan={5}>Difference</td><td className="num">{money(Math.round((p.proof_line.workpapers - p.proof_line.bank) * 100) / 100, false)}</td></tr>
              </tbody>
            </table></div>
          </section>

          <section className="wp-sheet" id="cash">
            <h2>Cash vs QuickBooks</h2>
            <p className="wp-lede">Statement balances against the QuickBooks balance sheet (cash basis).</p>
            <div className="wp-scroll"><table>
              <thead><tr><th>Account</th><th className="num">Bank</th><th className="num">QuickBooks</th><th className="num">Difference</th></tr></thead>
              <tbody>
                {["12/31/2024", "12/31/2025"].map(d => [
                  <tr className="band" key={d}><th colSpan={4}>{d}</th></tr>,
                  ...p.cash.filter(c => c.date === d).map(c => {
                    const diff = Math.round((c.bank - c.qbo) * 100) / 100;
                    return <tr key={d + c.acct}><td><span className="acct">{c.acct}</span> {c.name}</td><td className="num">{money(c.bank, false)}</td><td className="num">{money(c.qbo, false)}</td><td className={"num" + (Math.abs(diff) >= 1 ? " var" : "")}>{money(diff)}</td></tr>;
                  }),
                ])}
                <tr className="band"><th colSpan={4}>Loans in QuickBooks</th></tr>
                <tr><td>Mortgages at 12/31/2025</td><td></td><td className="num">{money(p.qbo_mortgages, false)}</td><td className="muted" style={{ fontSize: 12.5 }}>Liability carries a debit balance – loans never set up</td></tr>
              </tbody>
            </table></div>
          </section>

          <section className="wp-sheet" id="proof">
            <h2>Bank proof</h2>
            <p className="wp-lede">Each statement was checked for transaction count, deposit and withdrawal totals, every printed daily balance, and the ending balance.</p>
            {p.proof.map((a, idx) => (
              <details key={a.acct} open={idx === 0}>
                <summary><span className="acct">{a.acct}</span> {a.name}<span className="meta">{a.count} transactions · 12 of 12 months tie · {money(a.months[0].begin, false)} → {money(a.months[11].end, false)}</span></summary>
                <div className="wp-scroll"><table>
                  <thead><tr><th>Month</th><th className="num">Beginning</th><th className="num">Deposits</th><th className="num">Withdrawals</th><th className="num">Ending</th><th className="num">Ties</th></tr></thead>
                  <tbody>{a.months.map(m => <tr key={m.month}><td>{MONTHS[m.month - 1]}</td><td className="num">{money(m.begin, false)}</td><td className="num">{money(m.deposits)}</td><td className="num">{money(m.withdrawals)}</td><td className="num">{money(m.end, false)}</td><td className="num tie">{Math.abs(m.diff) < 0.005 ? "✓" : money(m.diff)}</td></tr>)}</tbody>
                </table></div>
              </details>
            ))}
          </section>

          <section className="wp-sheet" id="loans">
            <h2>Loans &amp; mortgages</h2>
            <p className="wp-lede">Payments by lender as named on the bank description. Interest and principal come from the 1098s or year-end loan statements.</p>
            <div className="wp-scroll"><table>
              <thead><tr><th>Lender</th><th>Accounts</th><th className="num">Payments</th><th className="num">Paid {p.year}</th></tr></thead>
              <tbody>
                {p.loans.map(l => <tr key={l.lender}><td>{l.lender}</td><td>{l.accounts.map(a => <span key={a} className="acct" style={{ marginRight: 4 }}>{a}</span>)}</td><td className="num">{l.count}</td><td className="num">{money(l.paid, false)}</td></tr>)}
                <tr className="tot"><td>Total</td><td></td><td></td><td className="num">{money(p.loans.reduce((t, l) => t + l.paid, 0), false)}</td></tr>
              </tbody>
            </table></div>
          </section>

          <section className="wp-sheet" id="checks">
            <h2>Checks &amp; counter slips</h2>
            <p className="wp-lede">Payees read from the check and teller-slip images printed in the 4161 and 0449 statements. The 1398 statements carry no images.</p>
            <div className="wp-scroll"><table>
              <thead><tr><th>Date</th><th>Acct</th><th>Bank description</th><th className="num">Amount</th><th>Payee / note</th><th>Category</th></tr></thead>
              <tbody>{p.checks.map((c, i) => <tr key={i}><td className="mono">{c.date}</td><td><span className="acct">{c.acct}</span></td><td className="mono">{c.desc}</td><td className="num">{money(c.amount, false)}</td><td>{c.payee}</td><td className="muted">{c.category}</td></tr>)}</tbody>
            </table></div>
          </section>

          <section className="wp-sheet" id="register">
            <h2>Transaction register</h2>
            <p className="wp-lede">All {tx.length} transactions. Filter by account or category, or search any text or amount.</p>
            <div className="wp-filters">
              <label htmlFor="wp-q">Search<input id="wp-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Payee, amount, note…" /></label>
              <label htmlFor="wp-fa">Account<select id="wp-fa" value={fa} onChange={e => setFa(e.target.value)}><option value="">All accounts</option>{p.accounts.map(a => <option key={a.acct} value={a.acct}>{a.acct} · {a.name}</option>)}</select></label>
              <label htmlFor="wp-fc">Category<select id="wp-fc" value={fc} onChange={e => setFc(e.target.value)}><option value="">All categories</option>{p.tx_categories.map(c => <option key={c}>{c}</option>)}</select></label>
              <label htmlFor="wp-fo">Show<select id="wp-fo" value={fo} onChange={e => setFo(e.target.value)}><option value="">Everything</option><option value="info">Needs an answer</option></select></label>
              <span className="wp-count">{shown.length} of {tx.length} · net {money(shown.reduce((t, x) => t + x.amount, 0), false)}</span>
            </div>
            <div className="wp-txbox"><table>
              <thead><tr><th>Date</th><th>Acct</th><th>Description</th><th className="num">Amount</th><th>Category</th></tr></thead>
              <tbody>{shown.map((t, i) => (
                <tr key={i}><td className="mono">{t.date}</td><td><span className="acct">{t.acct}</span></td>
                  <td>{t.desc}{t.payee && <div className="muted" style={{ fontSize: 12 }}>{t.payee}</div>}{t.info && <div className="note">{t.info}</div>}</td>
                  <td className="num">{money(t.amount, false)}</td><td>{t.category}</td></tr>
              ))}</tbody>
            </table></div>
          </section>

          <footer className="wp-sheet wp-foot">
            <h2>Sources</h2>
            <div>Premier Bank statements January–December {p.year} for accounts {p.accounts.map(a => a.acct).join(", ")}, including check and deposit-slip images.</div>
            <div>QuickBooks Online, {p.entity}: Profit &amp; Loss and Balance Sheets (cash basis) for 2024 and {p.year}.</div>
            <div>0449 is carried in this QuickBooks file but belongs to Social Services of MN; 1398 and 2259 are Matthew Emerson's accounts.</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
