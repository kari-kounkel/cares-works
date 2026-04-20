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
  purple: "#6D28D9",
  purpleLight: "#F5F3FF",
  blue: "#1D4ED8",
  blueLight: "#EFF6FF",
  white: "#FFFFFF",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const DOES = [
  "Build and maintain 13-week and annual cash flow forecasts",
  "Create, manage, and analyze annual budgets and variances",
  "Develop financial models for major decisions — pricing, hiring, expansion",
  "Design KPI dashboards and financial reporting systems",
  "Prepare financial packages for investors, lenders, or board members",
  "Lead pricing strategy analysis and gross margin modeling",
  "Analyze profitability by product, service line, or department",
  "Support M&A, partnership, or acquisition due diligence",
  "Identify financial risk and recommend mitigation strategies",
  "Translate financial data into plain-language decisions for leadership",
];

const DOESNT = [
  "Day-to-day bookkeeping or transaction entry",
  "Accounts payable or receivable data entry",
  "Monthly bank reconciliations",
  "Payroll processing",
  "Business tax return preparation",
  "Running routine reports from your accounting software",
  "Managing vendor relationships operationally",
  "Chasing overdue invoices or collections follow-up",
];

const ADVISES = [
  "Whether to take on debt or new financing — and what structure makes sense",
  "Major hiring decisions and their 12-month financial impact",
  "Pricing changes and how they affect margins and revenue mix",
  "When to expand, add locations, or enter new markets",
  "Whether to sell, merge, or wind down a business line",
  "Capital expenditure timing and equipment financing options",
  "Owner compensation, distributions, and retained earnings strategy",
];

const NEVER_LIST = [
  {
    item: "Sign off on numbers they have not personally reviewed",
    note: "Their name means they stand behind it. Pressure to rubber-stamp is a resignation letter in disguise.",
  },
  {
    item: "Cover for discrepancies or irregularities — even ones they did not create",
    note: null,
  },
  {
    item: "Make decisions that are legally or fiduciarily yours as owner",
    note: "They advise. You decide. Every single time.",
  },
  {
    item: "Function as a yes-machine",
    note: "If your CFO never pushes back, you do not have a CFO. You have an expensive mirror.",
  },
  {
    item: "Take consequences for decisions you made against their advice",
    note: "Document their recommendations. If you override them, that is your call — and your accountability.",
  },
  {
    item: "Be the only person who understands your finances",
    note: "A fractional CFO who does not build your internal capacity is building their own job security at your expense.",
  },
];

const COL = {
  does: { label: "Does", bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", icon: "✅" },
  doesnt: { label: "Doesn't", bg: "#FFF1F1", color: "#DC2626", border: "#FECACA", icon: "🚫" },
  advises: { label: "Advises — You Decide", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE", icon: "💬" },
};

export default function FractionalCFOScope({ session }) {
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
          <p style={{ color: S.muted, marginBottom: "8px", lineHeight: "1.65", fontSize: "15px" }}>
            The Fractional CFO Scope Matrix is a CARES Works member tool.
          </p>
          <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>
            Know exactly what a fractional CFO does, what they do not touch, and where your
            authority stays yours. Before you hire — or fire — get clear on the scope.
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
        maxWidth: "960px",
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
        Fractional CFO Scope Matrix
      </h1>
      <p
        style={{
          color: S.muted,
          fontSize: "15px",
          lineHeight: "1.7",
          marginBottom: "32px",
          maxWidth: "680px",
        }}
      >
        Three columns. What a fractional CFO does, what they do not touch, and what they
        advise on while you retain the final call. Know the scope before you sign the contract —
        and before you write the first check.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {[
          { key: "does", items: DOES },
          { key: "doesnt", items: DOESNT },
          { key: "advises", items: ADVISES },
        ].map(({ key, items }) => (
          <div
            key={key}
            style={{
              background: S.white,
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid " + S.border,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                background: COL[key].bg,
                borderBottom: "2px solid " + COL[key].border,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>{COL[key].icon}</span>
              <h2
                style={{
                  color: COL[key].color,
                  fontSize: "15px",
                  fontWeight: "800",
                  margin: 0,
                }}
              >
                {COL[key].label}
              </h2>
            </div>
            <div style={{ padding: "8px 0" }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "11px 18px",
                    borderBottom: i < items.length - 1 ? "1px solid " + S.border : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: COL[key].color,
                      flexShrink: 0,
                      marginTop: "7px",
                    }}
                  />
                  <span style={{ color: S.slate, fontSize: "13px", lineHeight: "1.55" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            background: S.slateLight,
            border: "1px solid " + S.border,
            borderRadius: "10px",
            padding: "14px 18px",
          }}
        >
          <p style={{ margin: 0, color: S.muted, fontSize: "13px", lineHeight: "1.6" }}>
            <strong style={{ color: S.slate }}>On the Advises column:</strong> Advisory is real work. A fractional CFO who models three debt scenarios for you before you call the bank has done their job even if you decide not to borrow. You are paying for the clarity to decide well — not for someone to decide for you.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#FFF1F1",
          border: "2px solid #DC2626",
          borderRadius: "14px",
          padding: "28px",
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
              Never Ask Your CFO to Do These Things
            </h2>
            <p style={{ color: "#991B1B", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
              This is where the trust breaks and the relationship costs you more than it was worth.
              Each item below has ended a working partnership — or started a legal one.
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
            Sidebar: The fractional CFO who says no to the wrong things is worth more than the one who says yes to everything. Compliance is not loyalty. Pushback is the job.
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
          Not sure whether you need a fractional CFO, a bookkeeper, or just a better system?
          Hit the Ask Kari button. That question has a real answer and it depends on your numbers.
        </p>
      </div>
    </div>
  );
}
