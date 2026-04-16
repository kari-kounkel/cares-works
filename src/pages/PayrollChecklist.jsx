import { useState } from "react";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeDark: "#c95f22",
  orangeLight: "#fdf0e8", paper: "#faf8f4", cream: "#f2ede3",
  ink: "#1e1e2a", rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const PAY_PERIOD_SECTIONS = [
  {
    label: "Before You Run", icon: "📋",
    items: [
      "Confirm pay period start and end dates are correct",
      "Verify all employees have hours submitted and approved",
      "Check for new hires — confirm they are in the system with correct pay rate",
      "Check for terminations — confirm last day and any final pay owed",
      "Confirm pay rate changes are entered and effective-dated correctly",
      "Review PTO, sick, or holiday hours logged this period",
      "Check for garnishments, child support, or levy orders due this cycle",
      "Verify direct deposit information is current for all employees",
    ],
  },
  {
    label: "Deductions and Withholdings", icon: "💼",
    items: [
      "Health insurance premiums deducted at correct employee amount",
      "Dental and vision deductions applied if applicable",
      "401(k) or retirement contributions calculated correctly",
      "HSA or FSA contributions pulled at correct election amount",
      "Union dues deducted if applicable",
      "Confirm standing deductions (uniforms, tools, etc.) are still active",
      "Garnishments calculated per court order — do not guess on these",
    ],
  },
  {
    label: "Tax Withholdings", icon: "🧾",
    items: [
      "Federal income tax withheld based on current W-4 on file",
      "State income tax withheld at correct rate for employee's work state",
      "Social Security withheld at 6.2% up to wage base",
      "Medicare withheld at 1.45% (plus 0.9% additional for wages over $200k)",
      "Local or city tax withheld if applicable",
      "Confirm any employees with exempt status still have valid W-4 on file",
    ],
  },
  {
    label: "Review Before Submitting", icon: "🔍",
    items: [
      "Spot-check gross pay for 3-5 employees against hours times rate",
      "Confirm net pay totals look reasonable — no zeros, no wild swings",
      "Verify total payroll liability matches your cash available",
      "Confirm employer tax amounts (FUTA, SUTA, matching FICA) are calculated",
      "Review any manual check or adjustment from last period is cleared",
      "Confirm pay date is a business banking day — not a holiday or weekend",
    ],
  },
  {
    label: "After You Submit", icon: "✅",
    items: [
      "Save payroll confirmation or reference number",
      "Record payroll journal entry in QuickBooks or accounting system",
      "File or note payroll tax deposit due date (semi-weekly or monthly)",
      "Distribute pay stubs or confirm employee self-service access",
      "Update payroll register for the period",
      "Flag anything that needs to be corrected next cycle",
    ],
  },
];

const QUARTERLY_SECTIONS = [
  {
    label: "Federal Quarterly Filing (941)", icon: "🏛️",
    items: [
      "Confirm total wages paid this quarter",
      "Reconcile federal income tax withheld against payroll records",
      "Confirm Social Security and Medicare taxes for employer and employee",
      "File Form 941 by deadline (April 30 / July 31 / Oct 31 / Jan 31)",
      "Confirm EFTPS deposit amounts match what is reported on 941",
      "Review for any adjustments or corrections needed from prior quarter",
    ],
  },
  {
    label: "State Unemployment (SUTA)", icon: "📤",
    items: [
      "Calculate total taxable wages for each employee this quarter",
      "Apply correct SUTA rate for your state",
      "File quarterly unemployment wage report with state agency",
      "Pay SUTA balance due by state deadline",
      "Confirm new employee wage base resets are handled if applicable",
      "Review for any employees who have exceeded the SUTA wage base",
    ],
  },
  {
    label: "Federal Unemployment (FUTA)", icon: "🏦",
    items: [
      "Calculate FUTA liability for the quarter (6% on first $7,000 per employee)",
      "Apply FUTA credit reduction if your state has an outstanding loan balance",
      "Deposit FUTA if cumulative liability exceeds $500 — do not wait for year end",
      "Track each employee's FUTA wage base — stops at $7,000 gross",
    ],
  },
  {
    label: "Estimated Tax Payments (if applicable)", icon: "💸",
    items: [
      "Confirm whether business owner or S-corp shareholders owe estimated payments",
      "Calculate Q1 (Apr 15), Q2 (Jun 15), Q3 (Sep 15), Q4 (Jan 15) amounts",
      "Submit via EFTPS or state portal — confirm payment posted",
      "Document payment for recordkeeping and year-end reconciliation",
    ],
  },
  {
    label: "Quarter-End Reconciliation", icon: "🔍",
    items: [
      "Reconcile gross payroll in accounting system to payroll provider reports",
      "Confirm all payroll liabilities are zeroed out or properly accrued",
      "Review officer compensation if S-corp — confirm reasonable salary is on track",
      "Check for any uncashed payroll checks — report as unclaimed property if needed",
      "Verify workers comp audit is up to date if your carrier requires it",
    ],
  },
];

const ANNUAL_SECTIONS = [
  {
    label: "W-2 Preparation", icon: "📄",
    items: [
      "Confirm legal name and SSN for every employee against HR records",
      "Verify all taxable wages, tips, and other compensation are captured",
      "Include taxable fringe benefits (personal use of company vehicle, group term life over $50k, etc.)",
      "Confirm Box 12 codes are correct (401k, HSA, health premiums under Section 125)",
      "Verify state wages and state income tax withheld are correct for each state worked",
      "File W-2s with SSA by January 31",
      "Distribute W-2s to employees by January 31",
    ],
  },
  {
    label: "1099 Filing", icon: "🧾",
    items: [
      "Pull list of all contractors, vendors, and freelancers paid during the year",
      "Confirm a W-9 is on file for every payee — if not, request before filing",
      "Identify all payments over $600 to non-incorporated individuals (1099-NEC)",
      "Identify rents paid over $600 to non-incorporated landlords (1099-MISC Box 1)",
      "Confirm attorney payments over $600 regardless of incorporation status",
      "File 1099-NEC with IRS by January 31",
      "File 1099-MISC with IRS by February 28 (paper) or March 31 (e-file)",
      "Distribute 1099s to recipients by January 31",
      "File 1096 transmittal form if filing paper returns",
    ],
  },
  {
    label: "Annual Federal Filing (940)", icon: "🏛️",
    items: [
      "Calculate total FUTA liability for the year",
      "Apply credit for state unemployment taxes paid (up to 5.4%)",
      "File Form 940 by January 31",
      "Pay any remaining FUTA balance with filing",
      "Confirm all quarterly FUTA deposits are reflected",
    ],
  },
  {
    label: "Year-End Reconciliation", icon: "✅",
    items: [
      "Reconcile all four 941s to total annual wages on W-2s",
      "Confirm total federal deposits match total tax liability for the year",
      "Reconcile payroll expense in accounting system to W-2 totals",
      "Archive all payroll records (keep a minimum of 4 years)",
      "Update employee pay rates, withholding elections, and benefit elections for new year",
      "Confirm new year SUTA rate notice received and updated in payroll system",
      "Confirm new year workers comp certificate of insurance is on file",
    ],
  },
];

const PERIODS = ["Q1", "Q2", "Q3", "Q4"];

function initChecks(sections) {
  const init = {};
  sections.forEach(s => s.items.forEach((_, i) => { init[s.label + i] = false; }));
  return init;
}

function ChecklistSection({ section, checked, toggle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: S.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{section.icon}</div>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: S.slate }}>{section.label}</h3>
      </div>
      <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, overflow: "hidden" }}>
        {section.items.map((item, i) => {
          const key = section.label + i;
          const done = checked[key];
          return (
            <div key={key} onClick={() => toggle(key)}
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 20px", borderBottom: i < section.items.length - 1 ? "1px solid " + S.rule : "none", cursor: "pointer", background: done ? "#f8fdf8" : "#fff", transition: "background 0.15s" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid " + (done ? "#5a9a5a" : S.rule), background: done ? "#5a9a5a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
                {done && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: done ? S.muted : S.ink, textDecoration: done ? "line-through" : "none", transition: "all 0.15s" }}>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({ checked, total }) {
  const count = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "18px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.08em" }}>{count} of {total} complete</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: pct === 100 ? "#5a9a5a" : S.orange, fontWeight: 700, letterSpacing: "0.08em" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: S.rule, borderRadius: 100 }}>
          <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? "#5a9a5a" : S.grad, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
    </div>
  );
}

export default function PayrollChecklist() {
  const [tab, setTab] = useState("payperiod");
  const [quarterTab, setQuarterTab] = useState("Q1");

  const totalPayPeriod = PAY_PERIOD_SECTIONS.reduce((a, s) => a + s.items.length, 0);
  const [ppChecked, setPpChecked] = useState(() => initChecks(PAY_PERIOD_SECTIONS));
  const togglePP = (k) => setPpChecked(prev => ({ ...prev, [k]: !prev[k] }));
  const resetPP = () => setPpChecked(initChecks(PAY_PERIOD_SECTIONS));

  const totalQuarterly = QUARTERLY_SECTIONS.reduce((a, s) => a + s.items.length, 0);
  const [qChecked, setQChecked] = useState({
    Q1: initChecks(QUARTERLY_SECTIONS),
    Q2: initChecks(QUARTERLY_SECTIONS),
    Q3: initChecks(QUARTERLY_SECTIONS),
    Q4: initChecks(QUARTERLY_SECTIONS),
  });
  const toggleQ = (period, k) => setQChecked(prev => ({ ...prev, [period]: { ...prev[period], [k]: !prev[period][k] } }));
  const resetQ = (period) => setQChecked(prev => ({ ...prev, [period]: initChecks(QUARTERLY_SECTIONS) }));

  const totalAnnual = ANNUAL_SECTIONS.reduce((a, s) => a + s.items.length, 0);
  const [annChecked, setAnnChecked] = useState(() => initChecks(ANNUAL_SECTIONS));
  const toggleAnn = (k) => setAnnChecked(prev => ({ ...prev, [k]: !prev[k] }));
  const resetAnn = () => setAnnChecked(initChecks(ANNUAL_SECTIONS));

  const tabs = [
    { id: "payperiod", label: "Pay Period" },
    { id: "quarterly", label: "Quarterly" },
    { id: "annual", label: "Annual + 1099" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>CARES <span style={{ color: S.orange }}>Works.</span></a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => window.print()} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Print / Save PDF</button>
          <a href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Free Tool — Payroll</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: S.slate, lineHeight: 1.15, marginBottom: 16 }}>
            The Payroll Checklist<br /><em style={{ color: S.muted, fontSize: 32 }}>Nobody Gave You.</em>
          </h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 560, marginBottom: 24 }}>
            Three checklists in one — pay period runs, quarterly filings, and year-end. Each tracks independently so nothing gets tangled.
          </p>
          <div style={{ width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        {/* TAB BAR */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: 4, width: "fit-content" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: tab === t.id ? S.slate : "transparent", color: tab === t.id ? "#fff" : S.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PAY PERIOD TAB */}
        {tab === "payperiod" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted }}>Current Pay Period</div>
              <button onClick={resetPP} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: S.muted, background: "none", border: "1px solid " + S.rule, borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.08em" }}>Reset</button>
            </div>
            <ProgressBar checked={ppChecked} total={totalPayPeriod} />
            {PAY_PERIOD_SECTIONS.map(s => <ChecklistSection key={s.label} section={s} checked={ppChecked} toggle={togglePP} />)}
            {Object.values(ppChecked).filter(Boolean).length === totalPayPeriod && (
              <div style={{ background: "linear-gradient(135deg, #f0faf0, #fff)", border: "1.5px solid #a8d8a8", borderRadius: 12, padding: "24px 28px", textAlign: "center", marginTop: 8 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.slate, marginBottom: 6 }}>Payroll is done. Go breathe.</div>
                <p style={{ fontSize: 14, color: S.muted }}>Every box checked. Your people get paid. That is the whole job.</p>
              </div>
            )}
          </>
        )}

        {/* QUARTERLY TAB */}
        {tab === "quarterly" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {PERIODS.map(p => {
                const count = Object.values(qChecked[p]).filter(Boolean).length;
                const done = count === totalQuarterly;
                return (
                  <button key={p} onClick={() => setQuarterTab(p)}
                    style={{ padding: "8px 22px", borderRadius: 100, border: "1.5px solid " + (quarterTab === p ? S.orange : S.rule), background: quarterTab === p ? S.orange : "#fff", color: quarterTab === p ? "#fff" : S.muted, fontSize: 13, fontWeight: quarterTab === p ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    {p}
                    {done && <span style={{ fontSize: 12 }}>✅</span>}
                    {!done && count > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7 }}>{count}/{totalQuarterly}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted }}>{quarterTab} Filing</div>
              <button onClick={() => resetQ(quarterTab)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: S.muted, background: "none", border: "1px solid " + S.rule, borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.08em" }}>Reset {quarterTab}</button>
            </div>
            <ProgressBar checked={qChecked[quarterTab]} total={totalQuarterly} />
            {QUARTERLY_SECTIONS.map(s => (
              <ChecklistSection key={s.label} section={s} checked={qChecked[quarterTab]} toggle={(k) => toggleQ(quarterTab, k)} />
            ))}
          </>
        )}

        {/* ANNUAL TAB */}
        {tab === "annual" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted }}>Year-End Filing</div>
              <button onClick={resetAnn} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: S.muted, background: "none", border: "1px solid " + S.rule, borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.08em" }}>Reset</button>
            </div>
            <ProgressBar checked={annChecked} total={totalAnnual} />
            {ANNUAL_SECTIONS.map(s => <ChecklistSection key={s.label} section={s} checked={annChecked} toggle={toggleAnn} />)}
            {Object.values(annChecked).filter(Boolean).length === totalAnnual && (
              <div style={{ background: "linear-gradient(135deg, #f0faf0, #fff)", border: "1.5px solid #a8d8a8", borderRadius: 12, padding: "24px 28px", textAlign: "center", marginTop: 8 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.slate, marginBottom: 6 }}>Year-end is closed. You did it.</div>
                <p style={{ fontSize: 14, color: S.muted }}>W-2s out. 1099s filed. 940 done. Go into January like a professional.</p>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div style={{ marginTop: 48, background: S.slate, borderRadius: 14, padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
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
