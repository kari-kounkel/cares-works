import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#E8500A", orangeLight: "#FFF4EE", slate: "#1E293B",
  slateLight: "#F8FAFC", muted: "#64748B", border: "#E2E8F0",
  green: "#15803D", greenLight: "#F0FDF4", red: "#DC2626",
  white: "#FFFFFF",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const SECTIONS = [
  {
    title: "Bank & Credit Card Reconciliation",
    icon: "🏦",
    items: [
      "Reconcile all bank accounts to the penny — no rounding, no skipping",
      "Reconcile all credit card accounts",
      "Confirm no transactions are sitting in Undeposited Funds that shouldn't be",
      "Review and clear any old outstanding checks (90+ days) — contact payee or void",
      "Confirm all bank feeds are up to date and no transactions are excluded by accident",
    ],
  },
  {
    title: "Accounts Receivable",
    icon: "📥",
    items: [
      "Run the A/R Aging report — review anything over 30 days",
      "Follow up on invoices over 30 days past due",
      "Write off or flag any invoices that are clearly uncollectible",
      "Confirm all payments received are applied to the correct invoice (no unapplied credits)",
      "Review open estimates — close or convert any that are stale",
    ],
  },
  {
    title: "Accounts Payable",
    icon: "📤",
    items: [
      "Run the A/P Aging report — confirm nothing is past due unexpectedly",
      "Confirm all vendor bills received this period are entered",
      "Review any bills marked as paid but still showing open",
      "Check for duplicate vendor entries — merge if needed",
      "Confirm 1099 vendor tracking is on for all applicable contractors",
    ],
  },
  {
    title: "Payroll",
    icon: "💼",
    items: [
      "Confirm all payroll runs are posted and match your payroll service reports",
      "Verify employer tax liabilities are recorded and paid",
      "Check that payroll accounts (wages, taxes, benefits) are categorized correctly",
      "Confirm owner draws or distributions are categorized correctly — not as payroll expenses",
      "Review any manual payroll journal entries for accuracy",
    ],
  },
  {
    title: "Categorization & Cleanup",
    icon: "🗂️",
    items: [
      "Review the Uncategorized Expenses and Uncategorized Income accounts — clear to zero",
      "Check the Ask My Accountant account — resolve or note every item",
      "Review for personal expenses mixed into business — reclassify or record as owner draw",
      "Confirm all split transactions are correctly allocated",
      "Review any transactions with missing names or memo fields — fill in what you can",
    ],
  },
  {
    title: "Reports & Close",
    icon: "📊",
    items: [
      "Run and review P&L — compare to prior period, flag anything unusual",
      "Run and review Balance Sheet — confirm assets, liabilities, and equity look right",
      "Confirm net income on P&L matches the change in equity on Balance Sheet",
      "Save or export period-end reports to your records",
      "Lock the period in QBO if you're confident everything is clean (Accounting → Close Books)",
    ],
  },
];

export default function QuickbooksTriage({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [period, setPeriod] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    async function checkMember() {
      if (!session) { setLoading(false); return; }
      try {
        const { data } = await supabase.from("members").select("plan").eq("email", session.user.email).single();
        setIsMember(!!data);
      } catch (_) { setIsMember(false); }
      setLoading(false);
    }
    checkMember();
  }, [session]);

  const toggle = (sectionIdx, itemIdx) => {
    const key = sectionIdx + "-" + itemIdx;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalItems = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((totalChecked / totalItems) * 100);

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Period End QuickBooks Triage is a CARES Works member tool. Close your books clean every single period.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #FED7AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>Money Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Period End QuickBooks Triage</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "24px", maxWidth: "640px" }}>
        30 items. Six categories. Run this every month and you will never face a CPA with a box of receipts and a prayer again.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Period (e.g. March 2025)</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Enter period..."
            style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "16px", color: S.slate, boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", fontWeight: "800", color: pct === 100 ? S.green : S.orange }}>{pct}%</div>
          <div style={{ fontSize: "12px", color: S.muted }}>{totalChecked} of {totalItems} complete</div>
        </div>
      </div>

      {SECTIONS.map((section, sIdx) => {
        const sectionChecked = section.items.filter((_, iIdx) => checked[sIdx + "-" + iIdx]).length;
        return (
          <div key={sIdx} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ background: S.slate, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>{section.icon}</span>
                <h2 style={{ color: S.white, fontSize: "14px", fontWeight: "700", margin: 0 }}>{section.title}</h2>
              </div>
              <span style={{ fontSize: "12px", color: sectionChecked === section.items.length ? "#86EFAC" : "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                {sectionChecked}/{section.items.length}
              </span>
            </div>
            {section.items.map((item, iIdx) => {
              const key = sIdx + "-" + iIdx;
              const done = !!checked[key];
              return (
                <div
                  key={iIdx}
                  onClick={() => toggle(sIdx, iIdx)}
                  style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 20px", borderBottom: iIdx < section.items.length - 1 ? "1px solid " + S.border : "none", cursor: "pointer", background: done ? S.greenLight : (iIdx % 2 === 0 ? S.white : S.slateLight), transition: "background 0.15s" }}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid " + (done ? S.green : S.border), background: done ? S.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: "14px", color: done ? S.green : S.slate, lineHeight: "1.55", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>{item}</span>
                </div>
              );
            })}
          </div>
        );
      })}

      {pct === 100 && (
        <div style={{ background: S.greenLight, border: "2px solid #BBF7D0", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
          <p style={{ margin: 0, color: S.green, fontSize: "16px", fontWeight: "700" }}>
            {period ? period + " is closed clean." : "Period closed clean."} Go enjoy something.
          </p>
        </div>
      )}

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Stuck on something in QBO that doesn't look right? Ask Kari. Bring the account name and what you're seeing.
        </p>
      </div>
    </div>
  );
}
