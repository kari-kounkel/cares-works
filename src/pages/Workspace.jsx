import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { fetchAllSavedWork } from "../toolSessions";
import { N, N_RGB, NeonBox, NeonBtn, HERO_TEXT_GRAD_BLUE } from "../design/neon";

const S = {
  slate: N.ink, orange: N.blue, orangeDark: N.blueDark, orangeLight: `rgba(${N_RGB.blue},0.1)`,
  paper: N.white, cream: "#f7f9fc", ink: N.ink, rule: N.rule,
  muted: N.muted, gold: N.orange, green: N.green,
  pink: N.pink, pinkTint: `rgba(${N_RGB.pink},0.1)`,
  grad: `linear-gradient(135deg, ${N.blue}, ${N.blueDark})`,
};

const MOBILE = `
  @media (max-width: 760px) {
    .ws-cols { flex-direction: column !important; }
    .ws-clients { width: 100% !important; }
  }
`;

const fieldStyle = {
  width: "100%", padding: "9px 12px", fontSize: 14, fontFamily: "'Figtree', sans-serif",
  background: "#fff", border: "1px solid " + S.rule, borderRadius: 8, outline: "none",
  color: S.ink, boxSizing: "border-box",
};
const labelStyle = { fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: S.muted, marginBottom: 5, display: "block" };

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Workspace({ session }) {
  const email = session?.user?.email;
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const [toolWork, setToolWork] = useState([]);
  const [toolFilter, setToolFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", company: "" });
  const [showAddEntry, setShowAddEntry] = useState(false);
  const blankEntry = { entry_date: new Date().toISOString().slice(0, 10), title: "", what_done: "", whats_next: "" };
  const [newEntry, setNewEntry] = useState(blankEntry);
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from("workspace_clients")
      .select("*")
      .eq("archived", false)
      .order("name", { ascending: true });
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { if (email) fetchAllSavedWork(session).then(setToolWork); }, [session, email]);

  const fetchEntries = useCallback(async (clientId) => {
    setEntriesLoading(true);
    const { data } = await supabase
      .from("workspace_log")
      .select("*")
      .eq("client_id", clientId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    setEntries(data || []);
    setEntriesLoading(false);
  }, []);

  const selectClient = (id) => {
    setSelectedId(id);
    setShowAddEntry(false);
    setNewEntry(blankEntry);
    fetchEntries(id);
  };

  const addClient = async () => {
    if (!newClient.name.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("workspace_clients")
      .insert({ user_email: email, name: newClient.name.trim(), company: newClient.company.trim() || null })
      .select()
      .single();
    setSaving(false);
    setNewClient({ name: "", company: "" });
    setShowAddClient(false);
    await fetchClients();
    if (data) selectClient(data.id);
  };

  const addEntry = async () => {
    if (!selectedId) return;
    if (!newEntry.what_done.trim() && !newEntry.whats_next.trim() && !newEntry.title.trim()) return;
    setSaving(true);
    await supabase.from("workspace_log").insert({
      user_email: email,
      client_id: selectedId,
      entry_date: newEntry.entry_date,
      title: newEntry.title.trim() || null,
      what_done: newEntry.what_done.trim() || null,
      whats_next: newEntry.whats_next.trim() || null,
    });
    setSaving(false);
    setNewEntry(blankEntry);
    setShowAddEntry(false);
    fetchEntries(selectedId);
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from("workspace_log").delete().eq("id", id);
    fetchEntries(selectedId);
  };

  const selectedClient = clients.find(c => c.id === selectedId);
  const startHere = entries.find(e => e.whats_next && e.whats_next.trim());

  // Filter + tint helpers for the saved-work grid
  const filteredWork = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return toolWork.filter(w => {
      if (toolFilter && w.tool_title !== toolFilter) return false;
      if (q) {
        const hay = ((w.name || "") + " " + (w.tool_title || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [toolWork, toolFilter, searchQuery]);

  const toolTint = (title) => {
    if (!title) return { color: N.blue, rgb: N_RGB.blue };
    if (/steward|budget|ledger/i.test(title)) return { color: N.orange, rgb: N_RGB.orange };
    if (/checklist|payroll/i.test(title)) return { color: N.blue, rgb: N_RGB.blue };
    if (/discovery|assessment/i.test(title)) return { color: N.pink, rgb: N_RGB.pink };
    if (/communication|template|debrief/i.test(title)) return { color: N.pink, rgb: N_RGB.pink };
    if (/vendor|profit|calculator/i.test(title)) return { color: N.blue, rgb: N_RGB.blue };
    return { color: N.blue, rgb: N_RGB.blue };
  };

  const relativeTime = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    const now = Date.now();
    const mins = Math.round((now - then) / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : mins + " min ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const days = Math.round(hrs / 24);
    if (days < 7) return days + "d ago";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <style>{MOBILE}</style>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 6 }}>
          <span style={HERO_TEXT_GRAD_BLUE}>My Work.</span> Everything in one place.
        </h1>
        <p style={{ color: N.muted, fontSize: 15 }}>Every saved session across every tool. Search it, open it, pick up where you left off — the QBO way.</p>
      </div>

      {/* RECENT — top 4 most recent as neon-outlined cards */}
      {toolWork.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.muted, fontWeight: 700, marginBottom: 12 }}>PICK UP WHERE YOU LEFT OFF</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {toolWork.slice(0, 4).map(w => {
              const t = toolTint(w.tool_title);
              return (
                <button key={w.id}
                  onClick={() => { const h = w.href; if (h && h.startsWith("/steward")) { window.location.href = h; } else if (h) { navigate(h); } else { navigate("/tools/" + w.tool_slug); } }}
                  style={{ padding: 0, background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}>
                  <NeonBox color={t.color} rgb={t.rgb} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontSize: 20 }}>{w.tool_icon || "🗂️"}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.color, fontWeight: 700 }}>{w.tool_title || "Tool"}</span>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, lineHeight: 1.25 }}>{w.name || "Untitled"}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginTop: "auto" }}>
                      {relativeTime(w.updated_at)} · Reopen →
                    </div>
                  </NeonBox>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL SAVED WORK — searchable + filterable list */}
      <div style={{ marginBottom: 34 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: 0 }}>All your saved work</h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.06em" }}>
            {filteredWork.length} of {toolWork.length} items
          </span>
        </div>
        <p style={{ color: N.muted, fontSize: 14, marginBottom: 14 }}>Every session, every tool, one searchable place.</p>

        {toolWork.length === 0 ? (
          <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.6} style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: N.muted, fontSize: 14, lineHeight: 1.55 }}>
              Nothing saved yet. When you save inside a tool — a Steward board, a Ledger org, a checklist — it lands here automatically.
            </div>
          </NeonBox>
        ) : (
          <>
            {/* SEARCH */}
            <div style={{ marginBottom: 12, position: "relative" }}>
              <input type="text" placeholder="Search saved work…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "11px 40px 11px 40px", fontSize: 14, fontFamily: "'Figtree', sans-serif", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 10, outline: "none", color: N.ink, boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = N.blue; e.target.style.boxShadow = "0 0 0 3px rgba(0,128,255,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = N.rule; e.target.style.boxShadow = "none"; }} />
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: N.muted, pointerEvents: "none" }}>🔍</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: N.muted, fontSize: 18, cursor: "pointer" }}>×</button>
              )}
            </div>

            {/* TOOL FILTER CHIPS */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {["", ...Array.from(new Set(toolWork.map(w => w.tool_title).filter(Boolean)))].map(tt => {
                const active = toolFilter === tt;
                const tint = tt ? toolTint(tt) : { color: N.ink, rgb: N_RGB.ink };
                return (
                  <button key={tt || "all"} onClick={() => setToolFilter(tt)}
                    style={{ padding: "7px 14px", borderRadius: 100, border: active ? "none" : "1.5px solid " + N.rule, background: active ? tint.color : N.white, color: active ? N.white : N.muted, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", boxShadow: active ? `0 3px 12px ${tint.color}66` : "none" }}>
                    {tt || "All tools"}
                  </button>
                );
              })}
            </div>

            {/* LIST */}
            {filteredWork.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: N.muted, fontSize: 14, background: N.white, border: "1px dashed " + N.rule, borderRadius: 10 }}>
                No matches. Try clearing the search or filter.
              </div>
            ) : (
              <div style={{ background: N.white, border: "1.5px solid " + N.rule, borderRadius: 12, overflow: "hidden", boxShadow: "0 0 20px rgba(0,128,255,0.08)" }}>
                {filteredWork.map((w, i) => {
                  const t = toolTint(w.tool_title);
                  return (
                    <button key={w.id}
                      onClick={() => { const h = w.href; if (h && h.startsWith("/steward")) { window.location.href = h; } else if (h) { navigate(h); } else { navigate("/tools/" + w.tool_slug); } }}
                      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: N.white, border: "none", borderTop: i ? "1px solid " + N.rule : "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = `rgba(${t.rgb},0.05)`}
                      onMouseLeave={e => e.currentTarget.style.background = N.white}>
                      <span style={{ fontSize: 19, flexShrink: 0 }}>{w.tool_icon || "🗂️"}</span>
                      <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14.5, color: N.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name || "Untitled"}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: t.color, fontWeight: 700, flexShrink: 0 }}>{w.tool_title || "Tool"}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, width: 72, textAlign: "right", flexShrink: 0 }}>{relativeTime(w.updated_at)}</span>
                      <span style={{ color: t.color, fontWeight: 700, flexShrink: 0 }}>→</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="ws-cols" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* CLIENT LIST */}
        <div className="ws-clients" style={{ width: 280, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: S.muted }}>Clients</div>
            <button onClick={() => setShowAddClient(!showAddClient)}
              style={{ background: "transparent", border: "none", color: S.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              {showAddClient ? "Cancel" : "+ Add client"}
            </button>
          </div>

          {showAddClient && (
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <label style={labelStyle}>Client name</label>
              <input style={{ ...fieldStyle, marginBottom: 10 }} value={newClient.name} autoFocus
                onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") addClient(); }} placeholder="Acme Co." />
              <label style={labelStyle}>Company / note (optional)</label>
              <input style={{ ...fieldStyle, marginBottom: 12 }} value={newClient.company}
                onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") addClient(); }} placeholder="Retail — monthly books" />
              <button onClick={addClient} disabled={saving || !newClient.name.trim()}
                style={{ width: "100%", padding: "9px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", opacity: saving || !newClient.name.trim() ? 0.5 : 1 }}>
                {saving ? "Saving…" : "Add client"}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ color: S.muted, fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "12px 4px" }}>Loading…</div>
          ) : clients.length === 0 ? (
            <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 10, padding: "20px 16px", textAlign: "center", color: S.muted, fontSize: 13 }}>
              No clients yet. Add your first one to start a record.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {clients.map(c => {
                const active = c.id === selectedId;
                return (
                  <button key={c.id} onClick={() => selectClient(c.id)}
                    style={{ textAlign: "left", padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                      border: "1px solid " + (active ? S.orange : S.rule), background: active ? S.orangeLight : "#fff", transition: "all 0.12s" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: S.slate }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 12, color: S.muted, marginTop: 1 }}>{c.company}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CLIENT DETAIL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedClient ? (
            <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "56px 24px", textAlign: "center", color: S.muted }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>🗂️</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 6 }}>Pick a client</div>
              <p style={{ fontSize: 14 }}>Select a client on the left to see their record — or add a new one.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate }}>{selectedClient.name}</h2>
                {selectedClient.company && <div style={{ fontSize: 13, color: S.muted }}>{selectedClient.company}</div>}
              </div>

              {/* START HERE TODAY */}
              <div style={{ background: S.slate, borderRadius: 12, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 90% 50%, rgba(232,119,58,0.18) 0%, transparent 65%)" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: S.orange, marginBottom: 8 }}>Start here today</div>
                  {startHere ? (
                    <>
                      <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.55 }}>{startHere.whats_next}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
                        From your {fmtDate(startHere.entry_date)} entry
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>No next step logged yet. Add an entry below and note what comes next.</div>
                  )}
                </div>
              </div>

              {/* ADD ENTRY */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: S.muted }}>Activity Log</div>
                <button onClick={() => setShowAddEntry(!showAddEntry)}
                  style={{ background: showAddEntry ? "transparent" : S.grad, border: showAddEntry ? "1px solid " + S.rule : "none", color: showAddEntry ? S.muted : "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  {showAddEntry ? "Cancel" : "+ Log an entry"}
                </button>
              </div>

              {showAddEntry && (
                <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: 18, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 150 }}>
                      <label style={labelStyle}>Date</label>
                      <input type="date" style={fieldStyle} value={newEntry.entry_date}
                        onChange={e => setNewEntry({ ...newEntry, entry_date: e.target.value })} />
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={labelStyle}>Title (optional)</label>
                      <input style={fieldStyle} value={newEntry.title} placeholder="Monthly close, site visit…"
                        onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} />
                    </div>
                  </div>
                  <label style={labelStyle}>What I did</label>
                  <textarea style={{ ...fieldStyle, marginBottom: 12, resize: "vertical", lineHeight: 1.5 }} rows={3} value={newEntry.what_done}
                    placeholder="Reconciled March, sent the invoice batch, flagged two vendor questions…"
                    onChange={e => setNewEntry({ ...newEntry, what_done: e.target.value })} />
                  <label style={labelStyle}>What's next</label>
                  <textarea style={{ ...fieldStyle, marginBottom: 14, resize: "vertical", lineHeight: 1.5 }} rows={2} value={newEntry.whats_next}
                    placeholder="Pick up here next time…"
                    onChange={e => setNewEntry({ ...newEntry, whats_next: e.target.value })} />
                  <button onClick={addEntry} disabled={saving}
                    style={{ padding: "9px 22px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", opacity: saving ? 0.5 : 1 }}>
                    {saving ? "Saving…" : "Save entry"}
                  </button>
                </div>
              )}

              {/* TIMELINE */}
              {entriesLoading ? (
                <div style={{ color: S.muted, fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "12px 4px" }}>Loading…</div>
              ) : entries.length === 0 ? (
                <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 10, padding: "28px 20px", textAlign: "center", color: S.muted, fontSize: 14 }}>
                  No entries yet. Log what you did today — next time you'll know exactly where you left off.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {entries.map(e => (
                    <div key={e.id} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em", color: "#fff", background: S.orange, padding: "3px 9px", borderRadius: 100 }}>{fmtDate(e.entry_date)}</span>
                          {e.title && <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate }}>{e.title}</span>}
                        </div>
                        <button onClick={() => deleteEntry(e.id)} title="Delete entry"
                          style={{ background: "transparent", border: "none", color: S.muted, fontSize: 16, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>×</button>
                      </div>
                      {e.what_done && (
                        <div style={{ marginBottom: e.whats_next ? 8 : 0 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: S.green, marginRight: 6 }}>Did</span>
                          <span style={{ fontSize: 14, color: S.ink, lineHeight: 1.55 }}>{e.what_done}</span>
                        </div>
                      )}
                      {e.whats_next && (
                        <div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: S.orange, marginRight: 6 }}>Next</span>
                          <span style={{ fontSize: 14, color: S.ink, lineHeight: 1.55 }}>{e.whats_next}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
