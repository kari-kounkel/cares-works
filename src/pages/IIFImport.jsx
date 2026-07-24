import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#0080ff", orangeLight: "#e6f0ff", slate: "#0a0a14",
  slateLight: "#f7f9fc", muted: "#64748b", border: "#e2e8f0",
  green: "#22c55e", greenLight: "#f0fdf4", red: "#ef4444",
  white: "#ffffff",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const WHAT_IS = [
  "IIF stands for Intuit Interchange Format. It is QuickBooks Desktop's native import file type.",
  "IIF files are tab-delimited text files with a .iif extension. They look intimidating. They are not.",
  "You use IIF files to import lists (accounts, customers, vendors, items) and transactions into QB Desktop.",
  "QuickBooks Online does NOT use IIF. QBO uses CSV imports instead. Make sure you know which version you're using before you spend time building an IIF file.",
];

const STEPS = [
  {
    step: "Back up your company file first",
    detail: "This is not optional. A bad import can corrupt your data. File → Back Up Company → Create Local Backup. Do this before every import, every time.",
    warn: true,
  },
  {
    step: "Build or obtain your IIF file",
    detail: "The file needs the correct header rows for what you're importing. Header structures differ by type: !ACCNT for accounts, !CUST for customers, !TRNS for transactions. Most payroll and third-party tools generate these automatically.",
    warn: false,
  },
  {
    step: "Open QuickBooks Desktop",
    detail: "Go to File → Utilities → Import → IIF Files.",
    warn: false,
  },
  {
    step: "Select your IIF file",
    detail: "Navigate to the file, click OK. QuickBooks will process the import. If it works, you'll see a confirmation. If it fails, you'll get an error — see the Common Errors section below.",
    warn: false,
  },
  {
    step: "Verify the import",
    detail: "Go to the relevant list or register and confirm the data landed where it should. Check at least 5–10 records. Don't assume it worked just because there was no error.",
    warn: false,
  },
  {
    step: "Run a report to confirm",
    detail: "For transaction imports: run the Transaction List by Date for the import period. Confirm amounts, accounts, and names look correct.",
    warn: false,
  },
];

const ERRORS = [
  {
    error: "\"This file cannot be imported\"",
    fix: "The file has formatting issues — usually extra blank lines, wrong delimiter (should be tab, not comma), or a Windows vs Mac line-ending problem. Open in Notepad and check the structure.",
  },
  {
    error: "\"Duplicate name exists\"",
    fix: "You're importing a customer, vendor, or account that already exists. Either remove those rows from your IIF file or merge the duplicate in QB first.",
  },
  {
    error: "\"Account not found\" on transaction import",
    fix: "The account name in your IIF file doesn't match exactly what's in your Chart of Accounts. Check spelling, spacing, and capitalization — IIF matching is exact.",
  },
  {
    error: "Transactions imported but to wrong accounts",
    fix: "The account names in the IIF file need to match your CoA precisely. Export your CoA first (Lists → Chart of Accounts → Export), then use those exact names in your IIF.",
  },
  {
    error: "Import completes but nothing shows up",
    fix: "Check the date range. QB Desktop may be filtering by fiscal year. Also confirm you're looking in the right register or list.",
  },
];

const WHEN_NOT = [
  "You're using QuickBooks Online — use CSV import instead",
  "You're importing bank transactions — use the bank feed or a CSV instead",
  "You have fewer than 20 transactions — just enter them manually",
  "The tool you're exporting from offers a direct QBO integration — use that first",
];

export default function IIFImport({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>QB IIF Import is a CARES Works member tool. Stop manually entering transactions. Import them correctly.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Money Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>QB IIF Import</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        IIF files are QuickBooks Desktop's import format. They look like hieroglyphics. They work like a charm if you know the rules.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: S.slate, marginBottom: "14px" }}>What Is an IIF File?</h2>
        {WHAT_IS.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < WHAT_IS.length - 1 ? "10px" : 0 }}>
            <span style={{ color: S.orange, fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>→</span>
            <p style={{ margin: 0, color: S.slate, fontSize: "14px", lineHeight: "1.6" }}>{item}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff1f1", border: "2px solid #fecaca", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
        <p style={{ margin: 0, color: S.red, fontSize: "14px", fontWeight: "700", lineHeight: "1.6" }}>
          ⚠️ IIF imports are QB Desktop only. If you're using QuickBooks Online, stop here — you want CSV import, not IIF.
        </p>
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Step-by-Step Import Process</h2>
        </div>
        {STEPS.map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", borderBottom: i < STEPS.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: s.warn ? S.red : S.orange, color: S.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>{i + 1}</div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: s.warn ? S.red : S.slate }}>{s.step}</p>
                <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}>{s.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Common Errors and Fixes</h2>
        </div>
        {ERRORS.map((e, i) => (
          <div key={i} style={{ padding: "16px 20px", borderBottom: i < ERRORS.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: S.red }}>{e.error}</p>
            <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}><strong style={{ color: S.slate }}>Fix: </strong>{e.fix}</p>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>When NOT to Use IIF</h2>
        </div>
        {WHEN_NOT.map((item, i) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: i < WHEN_NOT.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight, display: "flex", gap: "12px" }}>
            <span style={{ color: S.red, fontWeight: "700", flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          IIF import is throwing an error you can't crack? Ask Kari. Paste the error message and describe what you're trying to import.
        </p>
      </div>
    </div>
  );
}
