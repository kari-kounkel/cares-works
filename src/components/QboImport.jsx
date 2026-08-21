// QboImport.jsx — bring a QuickBooks export into the register.
//
// This is the migration. A client leaving QBO has to arrive with the coded
// history intact, not just the cash, so the flow is: read the file, show what's
// in it and what won't come across, let the bookkeeper map the accounts, and
// only then write. Nothing is saved until the numbers on screen have been seen.
//
// A real component with its own state rather than an inline renderer — that way
// the parent re-rendering on every keystroke can't remount it and steal focus.

import { useState, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { N } from "../design/neon";
import { parseQbo } from "../lib/qboImport";

const btn = {
  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
  padding: "9px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid " + N.blue,
  background: N.blue, color: "#fff", fontFamily: "'Figtree', sans-serif",
};
const btnQuiet = { ...btn, background: N.white, color: N.muted, borderColor: N.rule };
const input = {
  width: "100%", padding: "9px 11px", fontSize: 14, fontFamily: "'Figtree', sans-serif",
  border: "1px solid " + N.rule, borderRadius: 8, outline: "none", color: N.text,
  boxSizing: "border-box", background: N.white,
};
const mono = { fontFamily: "'DM Mono', monospace", fontVariantNumeric: "tabular-nums" };
const money = c => (c < 0 ? "−$" : "$") + Math.abs(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LEVEL = {
  error:  { bg: "#fdecea", bd: "#f5b8b2", fg: "#a32f24", label: "Problem" },
  review: { bg: "#fff7e0", bd: "#f0d89a", fg: "#8a5a00", label: "Needs a look" },
  skip:   { bg: "#f4f7fb", bd: N.rule,    fg: N.muted,   label: "Not imported" },
};

export default function QboImport({ orgId, session, accounts = [], categories = [], onImported }) {
  const [text, setText] = useState("");
  const [map, setMap] = useState({});          // QBO account name -> our account id
  const [createCats, setCreateCats] = useState(true);
  const [busy, setBusy] = useState(null);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  const bankNames = useMemo(() => accounts.map(a => a.name), [accounts]);
  const parsed = useMemo(
    () => (text.trim() ? parseQbo(text, { bankAccounts: bankNames }) : null),
    [text, bankNames]
  );

  const knownCats = useMemo(
    () => new Set(categories.filter(c => !c.archived).map(c => c.name.toLowerCase())),
    [categories]
  );
  const newCats = useMemo(() => {
    if (!parsed?.summary) return [];
    return parsed.summary.categories.filter(c => !knownCats.has(c.toLowerCase()));
  }, [parsed, knownCats]);

  // Pre-select an obvious account match so the common case needs no clicking.
  const guessFor = qboName => {
    const k = qboName.toLowerCase();
    const hit = accounts.find(a => {
      const n = a.name.toLowerCase();
      if (n === k) return true;
      const four = (a.last_four || "").trim();
      return four ? k.includes(four) : (n.includes(k) || k.includes(n));
    });
    return hit ? hit.id : "";
  };
  const mapFor = qboName => (map[qboName] !== undefined ? map[qboName] : guessFor(qboName));

  const readFile = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setText(String(r.result || "")); setDone(null); };
    r.readAsText(f);
  };

  const unmapped = parsed?.summary
    ? Object.keys(parsed.summary.byAccount).filter(n => !mapFor(n))
    : [];

  async function runImport() {
    if (!parsed?.rows.length || !orgId) return;
    setBusy("importing"); setDone(null);
    try {
      // Create any category the export uses that this org doesn't have yet, so the
      // coding survives the move instead of landing as "uncategorized".
      if (createCats && newCats.length) {
        await supabase.from("ledger_categories").insert(newCats.map((name, i) => ({
          org_id: orgId, user_id: session.user.id, name,
          kind: "expense", cat_type: "expense", sort_order: 800 + i, archived: false,
        })));
      }

      // Stable identity per row so re-importing the same file doesn't double it.
      const seen = {};
      const payload = [];
      for (const r of parsed.rows) {
        const acct = mapFor(r.bankAccount);
        if (!acct) continue;
        const base = `qbo:${r.date}:${r.direction}:${r.amount_cents}:${(r.description || "").slice(0, 60)}`;
        seen[base] = (seen[base] || 0) + 1;
        payload.push({
          org_id: orgId, user_id: session.user.id, account_id: acct,
          entry_date: r.date, direction: r.direction, amount_cents: r.amount_cents,
          description: r.description || "TRANSACTION",
          category: r.category || null,
          reference: r.ref || null,
          source_hash: `${base}:${seen[base]}`,
        });
      }
      if (!payload.length) { setBusy(null); setDone({ err: "Nothing to import — map the accounts first." }); return; }

      let added = 0, skipped = 0;
      for (let i = 0; i < payload.length; i += 200) {
        const chunk = payload.slice(i, i + 200);
        const { data, error } = await supabase
          .from("ledger_entries").upsert(chunk, { onConflict: "source_hash", ignoreDuplicates: true }).select("id");
        if (error) throw error;
        added += (data || []).length;
        skipped += chunk.length - (data || []).length;
      }
      setBusy(null);
      setDone({ added, skipped, cats: createCats ? newCats.length : 0 });
      if (onImported) onImported();
    } catch (e) {
      setBusy(null);
      setDone({ err: String(e.message || e) });
    }
  }

  const s = parsed?.summary;
  const problems = (parsed?.warnings || []).filter(w => w.level === "error");
  const notes = (parsed?.warnings || []).filter(w => w.level !== "error");

  return (
    <div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Import from QuickBooks</div>
      <div style={{ fontSize: 13, color: N.muted, marginBottom: 16, maxWidth: "68ch" }}>
        Bring the history across with its coding intact. In QBO, run <b>Reports → Transaction List by Date</b> (or a
        General Ledger) for all dates and export to CSV — a Journal Entries export works too. Nothing is saved until
        you've seen the numbers below and pressed Import.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => fileRef.current && fileRef.current.click()} style={btn}>Choose a CSV…</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={readFile} style={{ display: "none" }} />
        {text && <button onClick={() => { setText(""); setDone(null); setMap({}); }} style={btnQuiet}>Clear</button>}
      </div>

      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setDone(null); }}
        placeholder="…or paste the CSV here."
        spellCheck={false}
        style={{ ...input, minHeight: 110, fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.5, resize: "vertical" }}
      />

      {parsed && problems.length > 0 && (
        <div style={{ background: LEVEL.error.bg, border: "1px solid " + LEVEL.error.bd, color: LEVEL.error.fg, borderRadius: 10, padding: "11px 14px", marginTop: 12, fontSize: 13 }}>
          {problems.map((w, i) => <div key={i} style={{ marginTop: i ? 5 : 0 }}>{w.msg}</div>)}
        </div>
      )}

      {s && s.count > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
            {[
              ["FORMAT", parsed.format === "journal" ? "Journal entries" : "Transaction list"],
              ["LINES", String(s.count)],
              ["PERIOD", `${s.first} → ${s.last}`],
              ["MONEY IN", money(s.inCents)],
              ["MONEY OUT", money(s.outCents)],
              ["NET", money(s.net)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "#f4f7fb", border: "1px solid " + N.rule, borderRadius: 10, padding: "8px 13px" }}>
                <div style={{ fontSize: 9.5, color: N.muted, letterSpacing: ".1em", fontFamily: "'DM Mono', monospace" }}>{k}</div>
                <div style={{ ...mono, fontSize: 15, fontWeight: 700, color: N.ink }}>{v}</div>
              </div>
            ))}
          </div>

          {/* --- account mapping --- */}
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid " + N.rule, background: "#f7fafd", fontSize: 13, fontWeight: 700, color: N.ink }}>
              Which account is which?
            </div>
            {Object.entries(s.byAccount).map(([qboName, n]) => (
              <div key={qboName} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid " + N.rule, flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 190, fontSize: 13.5 }}>
                  <b style={{ color: N.ink }}>{qboName}</b>
                  <span style={{ color: N.muted, fontSize: 12 }}> · {n} line{n === 1 ? "" : "s"}</span>
                </span>
                <span style={{ color: N.muted, fontSize: 12 }}>→</span>
                <select
                  value={mapFor(qboName)}
                  onChange={e => setMap(m => ({ ...m, [qboName]: e.target.value }))}
                  style={{ ...input, width: 260, borderColor: mapFor(qboName) ? N.rule : "#f0d89a", background: mapFor(qboName) ? N.white : "#fdf5e3" }}
                >
                  <option value="">Don't import these…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* --- categories --- */}
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "13px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: N.text }}>
              <b style={{ color: N.ink }}>{s.categories.length}</b> account{s.categories.length === 1 ? "" : "s"} used for coding in this export
              {newCats.length > 0
                ? <> — <b style={{ color: N.blueDark }}>{newCats.length}</b> {newCats.length === 1 ? "is" : "are"} not in this chart of accounts yet.</>
                : <> — all of them already exist here.</>}
              {s.uncategorized > 0 && <> <span style={{ color: "#8a5a00" }}>{s.uncategorized} line{s.uncategorized === 1 ? "" : "s"} carry no coding and will come in blank.</span></>}
            </div>
            {newCats.length > 0 && (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={createCats} onChange={e => setCreateCats(e.target.checked)} />
                  Add the missing ones to the chart of accounts so the coding survives the move
                </label>
                <div style={{ fontSize: 12, color: N.muted, marginTop: 7, lineHeight: 1.6 }}>
                  {newCats.slice(0, 24).join(" · ")}{newCats.length > 24 ? ` … and ${newCats.length - 24} more` : ""}
                </div>
              </>
            )}
          </div>

          {notes.length > 0 && (
            <details style={{ background: "#f7fafd", border: "1px solid " + N.rule, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: N.ink }}>
                {notes.length} line{notes.length === 1 ? "" : "s"} won't come across — see why
              </summary>
              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                {notes.slice(0, 60).map((w, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: LEVEL[w.level] ? LEVEL[w.level].fg : N.muted }}>{w.msg}</div>
                ))}
                {notes.length > 60 && <div style={{ fontSize: 12, color: N.muted }}>… and {notes.length - 60} more.</div>}
              </div>
            </details>
          )}

          {unmapped.length > 0 && (
            <div style={{ background: LEVEL.review.bg, border: "1px solid " + LEVEL.review.bd, color: LEVEL.review.fg, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
              {unmapped.length} account{unmapped.length === 1 ? "" : "s"} above {unmapped.length === 1 ? "is" : "are"} set to "don't import" — those lines will be left out.
            </div>
          )}

          <button onClick={runImport} disabled={!!busy} style={{ ...btn, background: busy ? N.mutedLite : N.blue, borderColor: busy ? N.mutedLite : N.blue, fontSize: 14, padding: "11px 20px" }}>
            {busy ? "Importing…" : `Import ${parsed.rows.filter(r => mapFor(r.bankAccount)).length} lines`}
          </button>
        </>
      )}

      {done && (
        <div style={{
          marginTop: 12, borderRadius: 10, padding: "11px 14px", fontSize: 13,
          background: done.err ? LEVEL.error.bg : "#eafaf0",
          border: "1px solid " + (done.err ? LEVEL.error.bd : "#bff0d3"),
          color: done.err ? LEVEL.error.fg : N.pinkDark,
        }}>
          {done.err
            ? <>Import failed: {done.err}</>
            : <><b>{done.added} line{done.added === 1 ? "" : "s"} imported.</b>
                {done.skipped > 0 && <> {done.skipped} were already here and were left alone.</>}
                {done.cats > 0 && <> {done.cats} new account{done.cats === 1 ? "" : "s"} added to the chart of accounts.</>}
                {" "}Open the Register to see them.</>}
        </div>
      )}
    </div>
  );
}
