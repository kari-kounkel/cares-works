// Proposals index — Kari's list of every client proposal.
// Route: /proposals

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE } from "../design/neon";

const STATUS_STYLE = {
  draft:    { color: N.muted, bg: "#eef2f7", label: "Draft" },
  sent:     { color: N.blue,  bg: "rgba(0,128,255,0.12)", label: "Sent" },
  accepted: { color: "#16a34a", bg: "rgba(34,197,94,0.14)", label: "Accepted" },
  paused:   { color: "#f59e0b", bg: "rgba(245,158,11,0.14)", label: "Paused" },
  lost:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Lost" },
};

function money(cents) {
  if (cents == null) return "—";
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProposalsIndex({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, [session]);

  async function createNew() {
    if (!newSlug.trim() || !newClient.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("proposals").insert({
      slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      owner_email: session.user.email,
      client_name: newClient.trim(),
      title: newTitle.trim() || null,
      status: "draft",
    }).select().single();
    setSaving(false);
    if (error) { alert(error.message); return; }
    navigate("/proposals/" + data.slug);
  }

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />

      <header style={{ background: N.white, borderBottom: `1px solid ${N.rule}`, padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.blue, fontWeight: 700 }}>CARES WORKS</div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, margin: "4px 0 0" }}>Proposals</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="/dashboard" style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${N.rule}`, borderRadius: 8, color: N.muted, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700 }}>← DASHBOARD</a>
            <button onClick={() => setShowNew(true)}
              style={{ padding: "8px 16px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 12px rgba(${N_RGB.blue},0.35)` }}>
              + NEW PROPOSAL
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: N.muted, padding: 60 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 8 }}>No proposals yet.</div>
            <p style={{ color: N.muted, fontSize: 14, marginBottom: 18 }}>Click "+ NEW PROPOSAL" to start one. Each proposal gets a shareable page + a place to track invoices and checks.</p>
          </NeonBox>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map(p => {
              const s = STATUS_STYLE[p.status] || STATUS_STYLE.draft;
              return (
                <a key={p.id} href={"/proposals/" + p.slug}
                  style={{ display: "block", padding: "18px 22px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 12, textDecoration: "none", color: "inherit", transition: "border-color .15s, box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = N.blue; e.currentTarget.style.boxShadow = `0 4px 20px rgba(${N_RGB.blue},0.15)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = N.rule; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>{p.client_name}</div>
                      {p.title && <div style={{ fontSize: 13, color: N.muted, marginTop: 4 }}>{p.title}</div>}
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginTop: 6, letterSpacing: "0.04em" }}>
                        /proposals/{p.slug}{p.client_contact ? " · " + p.client_contact : ""}{p.sent_on ? " · SENT " + fmtDate(p.sent_on) : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 100, background: s.bg, color: s.color, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>{s.label.toUpperCase()}</span>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(p.value_cents)}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {showNew && (
        <div onClick={() => !saving && setShowNew(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 480, width: "100%", borderRadius: 14, padding: "24px 28px", border: `2px solid ${N.blue}`, boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 40px rgba(${N_RGB.blue},0.25)` }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: 0 }}>+ New proposal</h3>
            <p style={{ color: N.muted, fontSize: 13, marginTop: 6, marginBottom: 16 }}>Start with the client + slug. You can fill everything else on the next page.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700 }}>CLIENT NAME *</span>
                <input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="ProGraphics Enterprises Inc."
                  style={{ padding: "9px 12px", border: `1.5px solid ${N.rule}`, borderRadius: 8, fontSize: 14, fontFamily: "'Figtree', sans-serif" }} autoFocus />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700 }}>SLUG * (short, url-safe)</span>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="prographics"
                  style={{ padding: "9px 12px", border: `1.5px solid ${N.rule}`, borderRadius: 8, fontSize: 14, fontFamily: "'DM Mono', monospace" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700 }}>TITLE</span>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="A Custom Digital Ledger for ProGraphics"
                  style={{ padding: "9px 12px", border: `1.5px solid ${N.rule}`, borderRadius: 8, fontSize: 14, fontFamily: "'Figtree', sans-serif" }} />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button onClick={() => setShowNew(false)} disabled={saving}
                  style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${N.rule}`, borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, color: N.muted, cursor: "pointer" }}>CANCEL</button>
                <button onClick={createNew} disabled={saving}
                  style={{ padding: "9px 18px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "CREATING…" : "CREATE →"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SignatureFooter />
    </div>
  );
}
