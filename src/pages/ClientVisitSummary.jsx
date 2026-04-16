import { navigate } from "../App";
import { useState } from "react";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a",
  rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const MOBILE_TOOL = `
  @media (max-width: 640px) {
    .tool-header { padding: 0 16px !important; }
    .tool-page { padding: 28px 16px 60px !important; }
    .tool-h1 { font-size: 26px !important; }
    .tool-cta { padding: 24px 20px !important; }
    .tool-cta h3 { font-size: 20px !important; }
    .tool-section { padding: 20px 16px !important; }
  }
`;


const inp = (extra = {}) => ({
  width: "100%", padding: "10px 14px", background: "#fff",
  border: "1px solid " + S.rule, borderRadius: 8, color: S.ink,
  fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: "none",
  lineHeight: 1.5, boxSizing: "border-box", ...extra,
});

const lbl = {
  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em",
  textTransform: "uppercase", color: S.muted, marginBottom: 6, display: "block",
};

const TASK_CATEGORIES = [
  {
    label: "Bookkeeping", icon: "📗",
    tasks: [
      "Reconciled bank accounts", "Reconciled credit cards", "Categorized transactions",
      "Reviewed accounts payable", "Reviewed accounts receivable", "Posted journal entries",
      "Reviewed payroll entries", "Cleaned up chart of accounts", "Ran P&L and balance sheet",
    ],
  },
  {
    label: "QuickBooks", icon: "💻",
    tasks: [
      "Reviewed company file setup", "Fixed misclassified transactions", "Ran reconciliation report",
      "Cleared old uncleared transactions", "Updated vendor records", "Reviewed class or location tracking",
      "Exported or imported data", "Reviewed sales tax settings", "Demonstrated a feature or workflow",
    ],
  },
  {
    label: "Payroll", icon: "💰",
    tasks: [
      "Reviewed pay period records", "Audited employee setup", "Confirmed tax withholdings",
      "Reviewed deductions and garnishments", "Confirmed quarterly filings are current",
      "Reviewed direct deposit setup", "Discussed year-end requirements",
    ],
  },
  {
    label: "HR and Personnel", icon: "👥",
    tasks: [
      "Reviewed I-9 files", "Audited employee records", "Reviewed offer letters or job descriptions",
      "Discussed discipline or separation", "Reviewed onboarding process", "Reviewed handbook or policies",
      "Discussed benefits or deductions", "Reviewed workers comp setup",
    ],
  },
  {
    label: "Operations and Systems", icon: "⚙️",
    tasks: [
      "Reviewed internal processes", "Identified workflow bottlenecks", "Discussed software tools",
      "Reviewed filing or recordkeeping systems", "Evaluated vendor or contractor relationships",
      "Discussed cash flow management", "Reviewed insurance coverage",
    ],
  },
  {
    label: "Training and Coaching", icon: "🎓",
    tasks: [
      "Trained owner or staff on a process", "Reviewed Culture Under Construction module",
      "Discussed leadership or management situation", "Reviewed a communication challenge",
      "Coached on client or vendor relationship", "Discussed hiring or team structure",
    ],
  },
  {
    label: "Tax and Compliance", icon: "🧾",
    tasks: [
      "Reviewed prior year returns", "Discussed estimated payments", "Reviewed sales tax compliance",
      "Discussed entity structure", "Reviewed contractor vs employee classification",
      "Reviewed business licenses or registrations", "Discussed depreciation or asset tracking",
    ],
  },
];

export default function ClientVisitSummary() {
  const [form, setForm] = useState({
    clientName: "", businessName: "", visitDate: "", consultantName: "",
    stillNeeded: "", whatHappensNext: "", nextVisit: "",
    clientInitials: "", consultantInitials: "",
    priority1: "", priority2: "", priority3: "",
    notes: "",
  });
  const [checked, setChecked] = useState(() => {
    const init = {};
    TASK_CATEGORIES.forEach(cat => cat.tasks.forEach((_, i) => { init[cat.label + i] = false; }));
    return init;
  });
  const [openCat, setOpenCat] = useState("Bookkeeping");

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const completedCount = Object.values(checked).filter(Boolean).length;
  const completedTasks = TASK_CATEGORIES.flatMap(cat =>
    cat.tasks.filter((_, i) => checked[cat.label + i]).map(t => t)
  );

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_TOOL}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@media print { .no-print { display: none !important; } header { display: none !important; } body { background: #fff; } .print-summary { page-break-inside: avoid; } }`}</style>

      <header className="no-print" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>CARES <span style={{ color: S.orange }}>Works.</span></a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => window.print()} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Print / Save PDF</button>
          <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
        </div>
      </header>

      <div className="tool-page" style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div className="no-print" style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Free Tool — Client Management</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: S.slate, lineHeight: 1.15, marginBottom: 16 }}>Client Visit Summary</h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 560, marginBottom: 24 }}>
            Check what you did, fill in what is still needed, note what happens next. Print it, leave it, send it. Done before you start the car.
          </p>
          <div style={{ width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        {/* CLIENT INFO */}
        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted, marginBottom: 16 }}>Visit Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={lbl}>Client Name</span>
              <input style={inp()} value={form.clientName} onChange={set("clientName")} placeholder="Full name" />
            </div>
            <div>
              <span style={lbl}>Business Name</span>
              <input style={inp()} value={form.businessName} onChange={set("businessName")} placeholder="Business or org name" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <span style={lbl}>Visit Date</span>
              <input type="date" style={inp()} value={form.visitDate} onChange={set("visitDate")} />
            </div>
            <div>
              <span style={lbl}>Consultant</span>
              <input style={inp()} value={form.consultantName} onChange={set("consultantName")} placeholder="Your name" />
            </div>
          </div>
        </div>

        {/* TASK CHECKLIST */}
        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted }}>What We Did Today</div>
            {completedCount > 0 && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: S.orange, letterSpacing: "0.08em" }}>{completedCount} task{completedCount !== 1 ? "s" : ""} completed</div>
            )}
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {TASK_CATEGORIES.map(cat => {
              const catCount = cat.tasks.filter((_, i) => checked[cat.label + i]).length;
              const active = openCat === cat.label;
              return (
                <button key={cat.label} onClick={() => setOpenCat(active ? null : cat.label)}
                  style={{ padding: "6px 14px", borderRadius: 100, border: "1.5px solid " + (active ? S.orange : S.rule), background: active ? S.orange : "#fff", color: active ? "#fff" : S.muted, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  {cat.icon} {cat.label}
                  {catCount > 0 && <span style={{ background: active ? "rgba(255,255,255,0.3)" : S.orangeLight, color: active ? "#fff" : S.orange, borderRadius: 100, padding: "1px 7px", fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{catCount}</span>}
                </button>
              );
            })}
          </div>

          {/* Task items for active category */}
          {openCat && (
            <div style={{ background: S.cream, borderRadius: 10, overflow: "hidden", border: "1px solid " + S.rule }}>
              {TASK_CATEGORIES.find(c => c.label === openCat).tasks.map((task, i) => {
                const key = openCat + i;
                const done = checked[key];
                return (
                  <div key={key} onClick={() => toggle(key)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < TASK_CATEGORIES.find(c => c.label === openCat).tasks.length - 1 ? "1px solid " + S.rule : "none", cursor: "pointer", background: done ? "#f0faf0" : "transparent", transition: "background 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid " + (done ? "#5a9a5a" : S.rule), background: done ? "#5a9a5a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: done ? S.muted : S.ink, textDecoration: done ? "line-through" : "none" }}>{task}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed summary — always visible, shows what was checked across all categories */}
          {completedCount > 0 && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: S.orangeLight, borderRadius: 10, border: "1px solid #f0c8a0" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: S.orange, marginBottom: 8 }}>Completed This Visit</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {completedTasks.map((t, i) => (
                  <span key={i} style={{ background: "#fff", border: "1px solid #f0c8a0", borderRadius: 100, padding: "3px 10px", fontSize: 12, color: S.ink }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STILL NEEDED + NEXT STEPS */}
        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted, marginBottom: 16 }}>Open Items</div>

          <div style={{ marginBottom: 16 }}>
            <span style={lbl}>Still Needed From Client</span>
            <textarea rows={3} style={inp({ resize: "vertical" })} value={form.stillNeeded} onChange={set("stillNeeded")} placeholder="Documents, decisions, access, logins..." />
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={lbl}>What Happens Next</span>
            <textarea rows={3} style={inp({ resize: "vertical" })} value={form.whatHappensNext} onChange={set("whatHappensNext")} placeholder="Next steps, deliverables, who does what by when..." />
          </div>

          <div style={{ marginBottom: 0 }}>
            <span style={{ ...lbl, marginBottom: 12 }}>Top 3 Priorities Before Next Visit</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["priority1", "priority2", "priority3"].map((f, i) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: S.orangeLight, border: "1.5px solid " + S.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <input style={inp()} value={form[f]} onChange={set(f)} placeholder={"Priority " + (i + 1)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NOTES + NEXT VISIT + INITIALS */}
        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: "28px 32px", marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted, marginBottom: 16 }}>Notes and Sign-Off</div>

          <div style={{ marginBottom: 16 }}>
            <span style={lbl}>Additional Notes</span>
            <textarea rows={3} style={inp({ resize: "vertical" })} value={form.notes} onChange={set("notes")} placeholder="Anything else worth capturing..." />
          </div>

          <div style={{ marginBottom: 24 }}>
            <span style={lbl}>Next Scheduled Visit</span>
            <input type="date" style={inp({ maxWidth: 220 })} value={form.nextVisit} onChange={set("nextVisit")} />
          </div>

          <div style={{ height: 1, background: S.rule, margin: "0 0 24px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <span style={lbl}>Client Initials</span>
              <input style={inp({ maxWidth: 80, textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "0.1em" })} value={form.clientInitials} onChange={set("clientInitials")} maxLength={4} placeholder="—" />
              <div style={{ fontSize: 11, color: S.muted, marginTop: 6 }}>Confirms receipt</div>
            </div>
            <div>
              <span style={lbl}>Consultant Initials</span>
              <input style={inp({ maxWidth: 80, textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "0.1em" })} value={form.consultantInitials} onChange={set("consultantInitials")} maxLength={4} placeholder="—" />
              <div style={{ fontSize: 11, color: S.muted, marginTop: 6 }}>Confirms accuracy</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="no-print" style={{ background: S.slate, borderRadius: 14, padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(232,119,58,0.15) 0%, transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>CARES Works Membership</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 10, lineHeight: 1.2 }}>There are 15 more tools like this one.</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 24, maxWidth: 460 }}>New tool every week. Monthly Debrief with real answers. Court of Accounts — a business parable that actually teaches something. $27/month.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: S.grad, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Join Monthly — $27/mo</a>
              <a href="https://buy.stripe.com/5kQ8wPd7F3Lk6eT3Yg18c07" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.gold, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>Or annual — $197/year</a>
            </div>
          </div>
        </div>

      </div>
      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
