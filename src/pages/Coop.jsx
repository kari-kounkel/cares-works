// The Coop — Chasing Chickens working draft. Route: /chickens (session-gated, Kari only via RLS).
// Static content (chapters, passages, questions) ships as /chickens/coop-data.json.
// Edits (answers, drafts, titles, statuses, timeline, plan) live in Supabase:
//   coop_chapters(id text, user_id uuid, data jsonb)  coop_docs(id text, user_id uuid, data jsonb)  — see sql/coop.sql
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const CSS = `
.coop{--bg:#FBF8F2;--paper:#FFFFFF;--soft:#F4EFE4;--ink:#1E1913;--ink-soft:#66594B;--ink-dim:#9A8B79;--edge:rgba(27,74,102,.16);--blue:#1B4A66;--blue-mid:#2C6E93;--blue-pale:#D6E6EF;--rust:#C25B33;--rust-pale:#F6E1D8;--straw:#D9A441;--straw-pale:#F7EBCB;--straw-deep:#A87A22;--kraft:#B8804A;--ok:#4E7D3A;--ok-pale:#E1EDD8;--focus:#2C6E93;
 background:var(--bg);color:var(--ink);font-family:Mulish,system-ui,sans-serif;font-size:15px;line-height:1.5;min-height:100vh}
.coop *{box-sizing:border-box}.coop button,.coop input,.coop textarea,.coop select{font:inherit;color:inherit}
.coop .top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:18px;padding:10px 20px;background:var(--paper);border-bottom:1px solid var(--edge)}
.coop .top h1{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:22px;margin:0;color:var(--blue)}
.coop .top .sub{color:var(--ink-dim);font-size:13px}
.coop .tabs{display:flex;gap:4px;margin-left:8px}
.coop .tabs button{border:0;background:transparent;padding:6px 12px;border-radius:6px;color:var(--ink-soft);font-weight:600;cursor:pointer}
.coop .tabs button[aria-selected="true"]{background:var(--blue-pale);color:var(--blue)}
.coop :is(button,textarea,input,select,[contenteditable]):focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.coop .spacer{flex:1}
.coop .prog{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.coop .bar{width:140px;height:8px;background:var(--soft);border-radius:4px;overflow:hidden}.coop .bar i{display:block;height:100%;background:var(--straw);transition:width .4s}
.coop .save{font-size:12px;color:var(--ink-dim);min-width:110px;text-align:right}.coop .save.err{color:var(--rust)}
.coop .wrap{display:grid;grid-template-columns:290px 1fr;min-height:calc(100vh - 53px)}
.coop nav{border-right:1px solid var(--edge);background:var(--paper);padding:14px 0 40px;overflow-y:auto;position:sticky;top:53px;height:calc(100vh - 53px)}
.coop nav .mv{padding:10px 18px 4px;font-family:Fraunces,Georgia,serif;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--kraft);display:flex;justify-content:space-between;align-items:baseline}
.coop nav .mv b{font-family:Mulish;font-weight:600;color:var(--ink-dim);font-size:11px;letter-spacing:0;text-transform:none}
.coop nav .ch{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:transparent;padding:6px 18px;cursor:pointer;color:var(--ink-soft);line-height:1.3}
.coop nav .ch:hover{background:var(--soft)}.coop nav .ch[aria-current="true"]{background:var(--blue-pale);color:var(--blue);font-weight:600}
.coop nav .ch .n{font-variant-numeric:tabular-nums;color:var(--ink-dim);width:18px;flex:none;font-size:12px}
.coop nav .ch .pip{width:9px;height:9px;border-radius:50%;flex:none;background:var(--rust)}.coop .pip.some{background:var(--straw)}.coop .pip.all{background:var(--ok)}.coop .pip.done{background:var(--blue-mid)}
.coop main{padding:28px 40px 120px;max-width:860px}
.coop .crumb{color:var(--kraft);font-family:Fraunces,Georgia,serif;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.coop h2.title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:34px;line-height:1.1;margin:0 0 6px;text-wrap:balance;border-bottom:1px dashed transparent}
.coop h2.title[contenteditable]:hover,.coop h2.title[contenteditable]:focus{border-bottom-color:var(--edge);outline:none}
.coop .why{color:var(--ink-soft);font-style:italic;margin:0 0 18px;max-width:65ch}
.coop .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 22px}.coop .row label{font-size:12px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.06em}
.coop select.status,.coop select.st{border:1px solid var(--edge);background:var(--paper);border-radius:6px;padding:5px 8px}
.coop .note{background:var(--straw-pale);border-left:4px solid var(--straw);padding:14px 18px;border-radius:0 6px 6px 0;margin:0 0 20px;max-width:70ch}.coop .note p{margin:0 0 8px}.coop .note p:last-child{margin:0}
.coop section.q{background:var(--paper);border:1px solid var(--edge);border-radius:8px;padding:16px 18px 6px;margin:0 0 26px}
.coop section.q h3{margin:0 0 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--blue-mid)}.coop section.q .hint{font-size:13px;color:var(--ink-dim);margin:0 0 12px}
.coop .qi{display:grid;grid-template-columns:24px 1fr;gap:6px 10px;padding:10px 0;border-top:1px solid var(--edge)}.coop .qi:first-of-type{border-top:0}
.coop .qi .k{font-family:Fraunces,Georgia,serif;color:var(--rust);font-weight:600;padding-top:2px}.coop .qi.answered .k{color:var(--ok)}
.coop .qi .qt{max-width:65ch}.coop .qi .qt:focus{outline:none;background:var(--soft);border-radius:4px}
.coop .qi textarea{grid-column:2;width:100%;min-height:54px;resize:vertical;border:1px solid var(--edge);border-radius:6px;padding:8px 10px;background:var(--bg);line-height:1.5;font-family:Fraunces,Georgia,serif;font-size:16px}
.coop .qi textarea::placeholder{color:var(--ink-dim);font-family:Mulish;font-size:13px}
.coop .qi .tools{grid-column:2;display:flex;gap:12px;font-size:12px}.coop .qi .tools button{border:0;background:none;color:var(--ink-dim);cursor:pointer;padding:0}.coop .qi .tools button:hover{color:var(--rust)}
.coop .addq{border:1px dashed var(--edge);background:transparent;border-radius:6px;padding:8px 12px;color:var(--ink-soft);cursor:pointer;margin:10px 0 12px;width:100%;text-align:left}.coop .addq:hover{background:var(--soft)}
.coop h3.sec{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-dim);margin:30px 0 10px}
.coop .pass{font-family:Fraunces,Georgia,serif;font-size:17px;line-height:1.6;max-width:66ch;margin:0 0 6px}.coop .pass p{margin:0 0 .9em}.coop .pass.sup{border-left:3px solid var(--edge);padding-left:14px}
.coop .src{font-size:12px;color:var(--ink-dim);margin:0 0 26px}.coop .src b{font-weight:600;color:var(--ink-soft)}
.coop details.alt{margin:0 0 30px;max-width:66ch}.coop details.alt summary{cursor:pointer;color:var(--ink-soft);font-size:13px}.coop details.alt .pass{font-size:15px;color:var(--ink-soft);margin-top:10px}
.coop textarea.draft{width:100%;min-height:220px;resize:vertical;border:1px solid var(--edge);border-radius:8px;padding:14px 16px;background:var(--paper);font-family:Fraunces,Georgia,serif;font-size:17px;line-height:1.6}
.coop textarea.notes{width:100%;min-height:70px;resize:vertical;border:1px solid var(--edge);border-radius:8px;padding:10px 12px;background:var(--paper);font-size:14px}
.coop .pager{display:flex;justify-content:space-between;margin-top:40px;gap:10px}.coop .pager button,.coop .btn{border:1px solid var(--edge);background:var(--paper);border-radius:6px;padding:8px 14px;cursor:pointer;color:var(--blue)}
.coop table.tl{border-collapse:collapse;width:100%;max-width:900px}.coop table.tl th{text-align:left;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-dim);padding:8px 10px;border-bottom:1px solid var(--edge)}
.coop table.tl td{padding:8px 10px;border-bottom:1px solid var(--edge);vertical-align:top}.coop table.tl td[contenteditable]:focus{outline:none;background:var(--soft)}.coop table.tl .d{white-space:nowrap;font-variant-numeric:tabular-nums;width:150px}
.coop .plan p{max-width:68ch}.coop .plan h3{font-family:Fraunces,Georgia,serif;font-size:20px;margin:26px 0 6px}
.coop .loading{padding:60px;color:var(--ink-dim);font-style:italic}
@media (max-width:820px){.coop .wrap{grid-template-columns:1fr}.coop nav{position:static;height:auto;max-height:40vh}.coop main{padding:20px 18px 100px}.coop .top{flex-wrap:wrap;gap:10px}.coop .bar{width:90px}}
`;

const STATUSES = ["open", "answering", "drafted", "done"];
const fresh = (c) => ({ title: c.title, questions: c.questions.map((q) => ({ q, a: "" })), draft: "", notes: "", status: "open" });

export default function Coop({ session }) {
  const uid = session?.user?.id;
  const [data, setData] = useState(null);
  const [edits, setEdits] = useState({});          // chapterId -> {title, questions, draft, notes, status}
  const [timeline, setTimeline] = useState(null);  // rows
  const [plan, setPlan] = useState({});
  const [tab, setTab] = useState("chapters");
  const [current, setCurrent] = useState(null);
  const [saveMsg, setSaveMsg] = useState({ t: "loading…", err: false });
  const dirty = useRef(new Set());
  const timer = useRef(null);
  const latest = useRef({ edits, timeline, plan });
  latest.current = { edits, timeline, plan };

  // load static content + saved edits
  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, ch, docs] = await Promise.all([
        fetch("/chickens/coop-data.json").then((r) => r.json()),
        supabase.from("coop_chapters").select("id,data").eq("user_id", uid),
        supabase.from("coop_docs").select("id,data").eq("user_id", uid),
      ]);
      if (!alive) return;
      const chapters = []; d.movements.forEach((m) => m.chapters.forEach((c) => { c.mvId = m.id; chapters.push(c); }));
      d.byId = Object.fromEntries(chapters.map((c) => [c.id, c])); d.flat = chapters;
      setData(d);
      const e = {}; (ch.data || []).forEach((r) => { e[r.id] = r.data; }); setEdits(e);
      const tl = (docs.data || []).find((r) => r.id === "timeline"); setTimeline(tl ? tl.data.rows : d.timeline.map((r) => ({ ...r })));
      const pl = (docs.data || []).find((r) => r.id === "plan"); setPlan(pl ? pl.data : {});
      const hash = window.location.hash.slice(1);   // a stale bookmark must not white-screen the page
      setCurrent(d.byId[hash] ? hash : chapters[0].id);
      setSaveMsg({ t: ch.error || docs.error ? "could not load saved work" : "synced", err: !!(ch.error || docs.error) });
    })();
    return () => { alive = false; };
  }, [uid]);

  const view = useCallback((id) => edits[id] || (data ? fresh(data.byId[id]) : null), [edits, data]);

  const flush = useCallback(async () => {
    const ids = [...dirty.current]; dirty.current.clear();
    const { edits: E, timeline: T, plan: P } = latest.current;
    const now = new Date().toISOString();
    const errs = [];
    for (const id of ids) {
      let res;
      if (id === "timeline") res = await supabase.from("coop_docs").upsert({ id: "timeline", user_id: uid, data: { rows: T }, updated_at: now });
      else if (id === "plan") res = await supabase.from("coop_docs").upsert({ id: "plan", user_id: uid, data: P, updated_at: now });
      else res = await supabase.from("coop_chapters").upsert({ id, user_id: uid, data: E[id], updated_at: now });
      if (res.error) { errs.push(res.error.message); dirty.current.add(id); }
    }
    setSaveMsg(errs.length ? { t: "not saved — " + errs[0], err: true } : { t: "saved " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), err: false });
  }, [uid]);

  const queue = (id) => { dirty.current.add(id); setSaveMsg({ t: "saving…", err: false }); clearTimeout(timer.current); timer.current = setTimeout(flush, 800); };
  useEffect(() => () => { clearTimeout(timer.current); if (dirty.current.size) flush(); }, [flush]);

  const change = (id, fn) => { setEdits((prev) => { const v = { ...(prev[id] || fresh(data.byId[id])) }; fn(v); return { ...prev, [id]: v }; }); queue(id); };
  const counts = (id) => { const v = view(id); const t = v.questions.length, a = v.questions.filter((q) => q.a && q.a.trim()).length; return { t, a, done: v.status === "done" }; };

  if (!data || !current) return <div className="coop"><style>{CSS}</style><div className="loading">Opening the coop…</div></div>;

  let totT = 0, totA = 0; data.flat.forEach((c) => { const k = counts(c.id); totT += k.t; totA += k.a; });
  const go = (id) => { setCurrent(id); setTab("chapters"); window.location.hash = id; window.scrollTo(0, 0); };

  return (
    <div className="coop">
      <style>{CSS}</style>
      <div className="top">
        <div><h1>The Coop</h1><div className="sub">Chasing Chickens · working draft</div></div>
        <div className="tabs" role="tablist">
          {[["chapters", "Chapters"], ["timeline", "Timeline"], ["plan", "The plan"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="spacer" />
        <div className="prog"><span>{totA} / {totT} answered</span><div className="bar"><i style={{ width: (totT ? (100 * totA) / totT : 0) + "%" }} /></div></div>
        <div className={"save" + (saveMsg.err ? " err" : "")}>{saveMsg.t}</div>
      </div>
      <div className="wrap">
        <nav aria-label="Chapters">
          {data.movements.map((m) => {
            const ans = m.chapters.reduce((s, c) => s + counts(c.id).a, 0), tot = m.chapters.reduce((s, c) => s + counts(c.id).t, 0);
            return (<div key={m.id}>
              <div className="mv"><span>{m.num} · {m.name}</span><b>{ans}/{tot}</b></div>
              {m.chapters.map((c, i) => { const k = counts(c.id); const cls = k.done ? "done" : k.a === 0 ? "" : k.a >= k.t ? "all" : "some";
                return <button key={c.id} className="ch" aria-current={tab === "chapters" && c.id === current} onClick={() => go(c.id)}><span className="n">{i + 1}</span><span className={"pip " + cls} /><span>{view(c.id).title}</span></button>; })}
            </div>);
          })}
        </nav>
        <main>
          {tab === "chapters" && <Chapter data={data} c={data.byId[current]} v={view(current)} change={(fn) => change(current, fn)} go={go} view={view} />}
          {tab === "timeline" && <Timeline rows={timeline} setRows={(fn) => { setTimeline((r) => { const n = fn([...r]); return n; }); queue("timeline"); }} />}
          {tab === "plan" && <Plan data={data} plan={plan} setPlan={(f, val) => { setPlan((p) => ({ ...p, [f]: val })); queue("plan"); }} />}
        </main>
      </div>
    </div>
  );
}

function Paras({ text }) { return text.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l, i) => <p key={i}>{l}</p>); }

function Chapter({ data, c, v, change, go, view }) {
  const m = data.movements.find((x) => x.id === c.mvId);
  const mvIdx = m.chapters.indexOf(c), idx = data.flat.indexOf(c);
  const prev = data.flat[idx - 1], next = data.flat[idx + 1];
  const onEnterBlur = (e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } };
  return (<>
    <div className="crumb">{m.num} · {m.name} · chapter {mvIdx + 1} of {m.chapters.length}</div>
    <h2 className="title" contentEditable suppressContentEditableWarning spellCheck={false} onKeyDown={onEnterBlur} onBlur={(e) => change((x) => { x.title = e.target.textContent.trim() || c.title; })}>{v.title}</h2>
    <p className="why">{c.why}</p>
    <div className="row"><label>Status</label><select className="status" value={v.status} onChange={(e) => change((x) => { x.status = e.target.value; })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
    {mvIdx === 0 && <div className="note"><p><b>{m.name}.</b> {m.note}</p>{m.bigQuestions.length > 0 && <p><b>Big questions for this movement:</b> {m.bigQuestions.join(" · ")}</p>}</div>}
    <section className="q">
      <h3>Questions</h3>
      <p className="hint">What exactly happened, and what was funny. Answer in the box under each — voice memo, paste, whatever. Click a question to reword it.</p>
      {v.questions.map((q, i) => (
        <div key={i} className={"qi" + (q.a && q.a.trim() ? " answered" : "")}>
          <div className="k">{i + 1}</div>
          <div className="qt" contentEditable suppressContentEditableWarning spellCheck={false} onKeyDown={onEnterBlur} onBlur={(e) => change((x) => { x.questions[i].q = e.target.textContent; })}>{q.q}</div>
          <textarea value={q.a} placeholder="your answer" onChange={(e) => change((x) => { x.questions[i].a = e.target.value; })} />
          <div className="tools"><button onClick={() => { if (q.a.trim() && !window.confirm("This question has an answer. Remove it anyway?")) return; change((x) => { x.questions.splice(i, 1); }); }}>remove question</button></div>
        </div>))}
      <button className="addq" onClick={() => change((x) => { x.questions.push({ q: "New question", a: "" }); })}>+ add a question of your own</button>
    </section>
    <h3 className="sec">Your draft of this chapter</h3>
    <textarea className="draft" value={v.draft} placeholder="When you're ready to write it, write it here. Nothing below changes." onChange={(e) => change((x) => { x.draft = e.target.value; })} />
    <h3 className="sec">What you've already said — exactly as you said it</h3>
    {c.passages.map((p, i) => (<div key={i}>
      <div className={"pass" + (p.role === "keeper" ? "" : " sup")}><Paras text={p.text} /></div>
      <div className="src"><b>{p.date}</b> · {p.chat}{p.excerpt ? " · excerpt" : ""}{p.role !== "keeper" ? " · supporting" : ""}</div>
    </div>))}
    {c.alternates.length > 0 && <details className="alt"><summary>Also told {c.alternates.length === 1 ? "once more" : c.alternates.length + " more times"} — the other versions</summary>
      {c.alternates.map((a, i) => (<div key={i}><div className="src" style={{ margin: "12px 0 4px" }}><b>{a.date}</b> · {a.chat} — {a.note}</div><div className="pass"><Paras text={a.text} /></div></div>))}
    </details>}
    <h3 className="sec">Notes to self / to Nate</h3>
    <textarea className="notes" value={v.notes} placeholder="move this · cut that · ask me about…" onChange={(e) => change((x) => { x.notes = e.target.value; })} />
    <div className="pager">
      {prev ? <button onClick={() => go(prev.id)}>← {view(prev.id).title}</button> : <span />}
      {next && <button onClick={() => go(next.id)}>{view(next.id).title} →</button>}
    </div>
  </>);
}

function Timeline({ rows, setRows }) {
  const upd = (id, f, val) => setRows((r) => r.map((x) => (x.id === id ? { ...x, [f]: val } : x)));
  return (<>
    <div className="crumb">Timeline</div>
    <h2 className="title">The spine, in your order</h2>
    <p className="why">Every cell is editable. Status: told = a scene exists · mentioned = named but not told · none = nothing yet.</p>
    <div className="row"><button className="btn" onClick={() => setRows((r) => [...r, { id: "t" + Date.now(), date: "", event: "", status: "" }])}>+ add a row</button></div>
    <table className="tl"><thead><tr><th>Date</th><th>What happened</th><th>In the draft?</th><th /></tr></thead><tbody>
      {rows.map((r) => (<tr key={r.id}>
        <td className="d" contentEditable suppressContentEditableWarning onBlur={(e) => upd(r.id, "date", e.target.textContent)}>{r.date}</td>
        <td contentEditable suppressContentEditableWarning onBlur={(e) => upd(r.id, "event", e.target.textContent)}>{r.event}</td>
        <td><select className="st" value={r.status} onChange={(e) => upd(r.id, "status", e.target.value)}><option value="">—</option><option value="told">told</option><option value="mentioned">mentioned</option><option value="none">none</option></select></td>
        <td><button className="btn" title="remove row" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}>×</button></td>
      </tr>))}
    </tbody></table>
  </>);
}

function Plan({ data, plan, setPlan }) {
  return (<>
    <div className="crumb">The plan</div>
    <h2 className="title">Six movements</h2>
    <div className="plan">
      {data.movements.map((m) => <div key={m.id}><h3>{m.num} · {m.name}</h3><p>{m.note}</p></div>)}
      <h3>The rule for this book, in your words</h3>
      <textarea className="notes" style={{ minHeight: 60 }} value={plan.rule ?? "Strong, self-deprecating humor — and honestly, brutally raw. This is exactly what happened. Without judgment."} onChange={(e) => setPlan("rule", e.target.value)} />
      <h3>What to open next</h3>
      <textarea className="notes" value={plan.next ?? "Ten Days' Notice — The Rebuild, chapter 2."} onChange={(e) => setPlan("next", e.target.value)} />
      <h3>Running notes</h3>
      <textarea className="draft" style={{ minHeight: 160, fontFamily: "Mulish", fontSize: 15 }} value={plan.notes ?? ""} placeholder="anything" onChange={(e) => setPlan("notes", e.target.value)} />
    </div>
  </>);
}
