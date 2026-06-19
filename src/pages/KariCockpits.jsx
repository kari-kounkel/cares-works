import { useEffect } from "react";
import { navigate } from "../App";

// Kari's PRIVATE cockpit hub — tools.caresmn.com/kari
// Gated to her login. Each cockpit's data lives in public.kari_tool_data
// (per-user, RLS) so it follows her across machines and nothing sensitive
// is baked into a public page. Tools flip from "connecting" -> active as
// each one is wired to the cloud store.

const S = {
  paper: "#faf8f4", ink: "#1e1e2a", slate: "#3d4560", orange: "#e8773a",
  orangeDark: "#c95f22", muted: "#7a7585", rule: "#ddd8cc", white: "#fff",
  green: "#5a9a5a", cream: "#f2ede3",
};

// status: "active" (wired to cloud, has route) or "connecting" (not yet wired)
const COCKPITS = [
  { key: "ap_reconciliation", emoji: "📊", name: "AP Reconciliation Cockpit", desc: "Vendor A/P aging — reconcile, note, track where you left off.", status: "connecting" },
  { key: "ap_verify",         emoji: "✅", name: "AP Verify Worksheet",        desc: "Tick off each invoice against Bob's read; catch mismatches.", status: "connecting" },
  { key: "property_leasing",  emoji: "🏢", name: "Property / Rent-Roll Cockpit", desc: "Rent roll, occupancy, underrent gap, bank/DSCR view.", status: "connecting" },
  { key: "amortization",      emoji: "🧮", name: "Amortization & Journal Engine", desc: "Loan schedules + the journal entries that go with them.", status: "connecting" },
  { key: "confession",        emoji: "⚖️", name: "Confession of Judgment Calculator", desc: "MN §279.37 payment schedule + budget planner.", status: "connecting" },
  { key: "upstairs_map",      emoji: "🗺️", name: "Upstairs Floor Map",          desc: "The building's upstairs layout.", status: "connecting" },
  { key: "rollout_tracker",   emoji: "🚀", name: "Monday 7AM Rollout Tracker",  desc: "The FlowSuite × MMP launch checklist by day + owner.", status: "connecting" },
  { key: "desktop_audit",     emoji: "🗂️", name: "Desktop Audit Cockpit",       desc: "Every folder across both OneDrives, with gap flags + notes.", status: "connecting" },
];

export default function KariCockpits({ session }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const open = (c) => { if (c.status === "active") navigate("/kari/" + c.key); };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', system-ui, sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ borderBottom: "1px solid " + S.rule, background: S.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: S.orange }}>Private · CARES Consulting</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginTop: 4 }}>Kari's Cockpits</div>
          </div>
          <button onClick={() => navigate("/dashboard")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Dashboard</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
        <p style={{ color: S.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 720, marginBottom: 28 }}>
          Your tools, in one place — and their data saves to your account, so it follows you from any computer. Tools light up here as each one's connected to your cloud store.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {COCKPITS.map((c) => {
            const active = c.status === "active";
            return (
              <div key={c.key} onClick={() => open(c)} style={{
                background: S.white, border: "1px solid " + S.rule, borderRadius: 14,
                padding: "18px 18px 16px", cursor: active ? "pointer" : "default",
                opacity: active ? 1 : 0.72, boxShadow: "0 18px 40px -30px rgba(43,49,71,0.4)",
                transition: "transform .12s", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 26 }}>{c.emoji}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase",
                    padding: "3px 8px", borderRadius: 6,
                    background: active ? "#edf4ef" : S.cream, color: active ? S.green : S.muted,
                    border: "1px solid " + (active ? "#bcd8c7" : S.rule),
                  }}>{active ? "Open ↗" : "Connecting…"}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate }}>{c.name}</div>
                <div style={{ fontSize: 13.5, color: S.muted, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted }}>
          Logged in as {session?.user?.email}. Data saves to your account (private, encrypted at rest).
        </div>
      </div>
    </div>
  );
}
