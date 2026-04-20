import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#E8500A",
  orangeLight: "#FFF4EE",
  slate: "#1E293B",
  slateLight: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  red: "#DC2626",
  redLight: "#FFF1F1",
  green: "#15803D",
  greenLight: "#F0FDF4",
  blue: "#1D4ED8",
  blueLight: "#EFF6FF",
  white: "#FFFFFF",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const CATEGORIES = [
  {
    name: "Transaction Recording",
    tasks: [
      { task: "Record daily income and sales transactions", tag: "yes" },
      { task: "Record and categorize expenses", tag: "yes" },
      { task: "Enter vendor bills and invoices", tag: "yes" },
      { task: "Reconcile bank accounts monthly", tag: "yes" },
      { task: "Reconcile credit card statements", tag: "yes" },
      { task: "Manage petty cash log", tag: "yes" },
    ],
  },
  {
    name: "Accounts Receivable and Payable",
    tasks: [
      { task: "Generate and send customer invoices", tag: "yes" },
      { task: "Track overdue invoices and follow up", tag: "yes" },
      { task: "Apply payments received to open invoices", tag: "yes" },
      { task: "Process vendor payments (with your approval on each)", tag: "yes" },
      { task: "Negotiate vendor payment terms", tag: "no" },
      { task: "Authorize wire transfers without your per-transaction sign-off", tag: "no" },
    ],
  },
  {
    name: "Payroll Support",
    tasks: [
      { task: "Enter employee hours and payroll data", tag: "yes" },
      { task: "Track PTO, garnishments, and standing deductions", tag: "yes" },
      { task: "Run payroll (requires dedicated payroll software or service)", tag: "outsource" },
      { task: "Calculate and remit payroll taxes", tag: "outsource" },
      { task: "File quarterly 941s and state payroll returns", tag: "outsource" },
      { task: "Prepare year-end W-2s and 1099s", tag: "outsource" },
    ],
  },
  {
    name: "Financial Reporting",
    tasks: [
      { task: "Generate monthly P&L reports", tag: "yes" },
      { task: "Pull balance sheet on request", tag: "yes" },
      { task: "Organize receipts and supporting documents", tag: "yes" },
      { task: "Prepare business tax returns", tag: "no" },
      { task: "Build cash flow forecasts and financial models", tag: "outsource" },
      { task: "Perform financial strategy analysis", tag: "no" },
    ],
  },
  {
    name: "Compliance and Year-End",
    tasks: [
      { task: "Gather and organize documents for your CPA", tag: "yes" },
      { task: "Track deductible expenses throughout the year", tag: "yes" },
      { task: "File simple single-state sales tax returns", tag: "outsource" },
      { task: "Handle multi-state or complex sales tax compliance", tag: "no" },
      { task: "Respond to IRS or state tax notices", tag: "no" },
      { task: "Make tax strategy or entity election recommendations", tag: "no" },
    ],
  },
];

const NEVER_LIST = [
  {
    item: "Sign checks or authorize payments without your explicit per-transaction approval",
    note: null,
  },
  {
    item: "Hold exclusive access to your accounting software — you must always retain owner-level login",
    note: "If they leave or are terminated, you cannot be locked out of your own books.",
  },
  {
    item: "Set their own compensation or adjust their own timesheets in your system",
    note: null,
  },
  {
    item: "Make tax strategy decisions — that belongs to a licensed CPA",
    note: null,
  },
  {
    item: "Sign or submit any tax return on your behalf",
    note: null,
  },
  {
    item: "Communicate directly with the IRS without you present or copied on every exchange",
    note: null,
  },
  {
    item: "Access your personal bank accounts or personal credit cards",
    note: null,
  },
  {
    item: "Approve their own expense reimbursements",
    note: "Every approval chain needs a check — including theirs.",
  },
];

const TAG = {
  yes: { label: "Yes", bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  no: { label: "No", bg: "#FFF1F1", color: "#DC2626", border: "#FECACA" },
  outsource: { label: "Outsource", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
};

export default function BookkeeperScope({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    async function checkMember() {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("members")
          .select("plan")
          .eq("user_id", session.user.id)
          .single();
        setIsMember(!!(data && data.plan));
      } catch (_) {
        setIsMember(false);
      }
      setLoading(false);
    }
    checkMember();
  }, [session]);

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: S.muted, fontSize: "15px" }}>
        Loading...
      </div>
    );
  }

  if (!isMember) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: S.slateLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: S.white,
            borderRadius: "16px",
            padding: "40px 36px",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: S.slate,
              marginBottom: "12px",
            }}
          >
            Members Only Tool
          </h2>
          <p
            style={{
              color: S.muted,
              marginBottom: "8px",
              lineHeight: "1.65",
              fontSize: "15px",
            }}
          >
            The Bookkeeper Scope Matrix is a CARES Works member tool.
          </p>
          <p
            style={{
              color: S.muted,
              marginBottom: "28px",
              lineHeight: "1.65",
              fontSize: "15px",
            }}
          >
            Know exactly what to hand off, what to keep, and what could land you in a dispute you
            cannot win. Thirty tasks. Three answers. No more guessing.
          </p>
          <a
            href={MONTHLY_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              background: S.orange,
              color: S.white,
              padding: "14px 24px",
              borderRadius: "8px",
              fontWeight: "700",
              textDecoration: "none",
              marginBottom: "12px",
              fontSize: "16px",
            }}
          >
            Join for $27/month
          </a>
          <a
            href={ANNUAL_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              background: S.white,
              color: S.orange,
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "700",
              textDecoration: "none",
              border: "2px solid " + S.orange,
              fontSize: "15px",
            }}
          >
            $270/year — save 2 months
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "32px 16px 60px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            background: S.orangeLight,
            color: S.orange,
            fontSize: "11px",
            fontWeight: "700",
            padding: "4px 10px",
            borderRadius: "20px",
            border: "1px solid #FED7AA",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Money Tools
        </span>
      </div>

      <h1
        style={{
          fontSize: "30px",
          fontWeight: "800",
          color: S.slate,
          marginBottom: "10px",
          lineHeight: "1.2",
        }}
      >
        Bookkeeper Scope Matrix
      </h1>
      <p
        style={{
          color: S.muted,
          fontSize: "15px",
          lineHeight: "1.7",
          marginBottom: "28px",
          maxWidth: "640px",
        }}
      >
        30 bookkeeping tasks. Three answers: your bookkeeper owns it, it stays out of their lane,
        or it needs a specialist. Stop guessing who does what — and stop giving away access
        you will regret.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
        <span
          style={{
            background: TAG.yes.bg,
            color: TAG.yes.color,
            border: "1px solid " + TAG.yes.border,
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          Yes — Bookkeeper owns this
        </span>
        <span
          style={{
            background: TAG.no.bg,
            color: TAG.no.color,
            border: "1px solid " + TAG.no.border,
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          No — Keep it out of their hands
        </span>
        <span
          style={{
            background: TAG.outsource.bg,
            color: TAG.outsource.color,
            border: "1px solid " + TAG.outsource.border,
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          Outsource — Needs a specialist
        </span>
      </div>

      {CATEGORIES.map((cat) => (
        <div
          key={cat.name}
          style={{
            marginBottom: "24px",
            background: S.white,
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid " + S.border,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ background: S.slate, padding: "12px 20px" }}>
            <h2
              style={{
                color: S.white,
                fontSize: "14px",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              {cat.name}
            </h2>
          </div>
          {cat.tasks.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 20px",
                borderBottom: i < cat.tasks.length - 1 ? "1px solid " + S.border : "none",
                background: i % 2 === 0 ? S.white : S.slateLight,
                gap: "12px",
              }}
            >
              <span style={{ color: S.slate, fontSize: "14px", lineHeight: "1.5", flex: 1 }}>
                {item.task}
              </span>
              <span
                style={{
                  background: TAG[item.tag].bg,
                  color: TAG[item.tag].color,
                  border: "1px solid " + TAG[item.tag].border,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {TAG[item.tag].label}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div
        style={{
          background: "#FFF1F1",
          border: "2px solid #DC2626",
          borderRadius: "14px",
          padding: "28px",
          marginTop: "8px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
          <span style={{ fontSize: "28px", lineHeight: 1 }}>🚨</span>
          <div>
            <h2
              style={{
                color: "#DC2626",
                fontSize: "19px",
                fontWeight: "800",
                margin: "0 0 6px",
              }}
            >
              Never Let a Bookkeeper Do These Things
            </h2>
            <p style={{ color: "#991B1B", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
              This is the lawsuit section. Every item below is a real way owners lose money,
              lose control, or end up in a dispute they cannot easily win.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {NEVER_LIST.map((entry, i) => (
            <div
              key={i}
              style={{
                background: S.white,
                borderRadius: "8px",
                padding: "14px 16px",
                border: "1px solid #FECACA",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: S.slate,
                  fontSize: "14px",
                  fontWeight: "600",
                  lineHeight: "1.5",
                }}
              >
                {entry.item}
              </p>
              {entry.note && (
                <p
                  style={{
                    margin: "6px 0 0",
                    color: S.muted,
                    fontSize: "13px",
                    fontStyle: "italic",
                    lineHeight: "1.5",
                  }}
                >
                  {entry.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "14px 18px",
            background: "#FEF2F2",
            borderRadius: "8px",
            border: "1px solid #FECACA",
          }}
        >
          <p style={{ margin: 0, color: "#DC2626", fontSize: "13px", fontWeight: "700", lineHeight: "1.6" }}>
            Sidebar: A bookkeeper who resists any of the above is not protecting you.
            They are protecting themselves. That is your sign to look harder at the books.
          </p>
        </div>
      </div>

      <div
        style={{
          background: S.orangeLight,
          border: "1px solid #FED7AA",
          borderRadius: "12px",
          padding: "18px 22px",
        }}
      >
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure how much access to give your bookkeeper, or whether you even need one full-time?
          Hit the Ask Kari button. That is literally what it is there for.
        </p>
      </div>
    </div>
  );
}
