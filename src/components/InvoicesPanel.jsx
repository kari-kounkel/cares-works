// InvoicesPanel.jsx — the invoice maker's money, on the Command Board.
//
// Presentational, like WorkPanel: it takes rows and a refresh callback and owns
// none of the fetching. The rows are invoice_docs joined to their brand's name
// and color, which RLS already limits to whoever is signed in.
//
// "Who Owes You" next door reads QuickBooks and is about ProGraphics. This one
// is her own invoices, which live nowhere else.

import { N, N_RGB } from "../design/neon";
import { Panel, Quiet, Tiles } from "./boardChrome";
import { navigate } from "../App";

const usd = (cents) =>
  "$" + ((cents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TONE = {
  draft: { fg: "#64748b", bg: "#f1f5f9", label: "Draft" },
  sent: { fg: "#1d4ed8", bg: "#eff6ff", label: "Sent" },
  viewed: { fg: "#a16207", bg: "#fefce8", label: "Opened" },
  paid: { fg: "#15803d", bg: "#f0fdf4", label: "Paid" },
};

export default function InvoicesPanel({ rows = [], asOf, onRefresh }) {
  const open = rows.filter((r) => r.status !== "paid" && r.status !== "draft");
  const drafts = rows.filter((r) => r.status === "draft");
  const outstanding = open.reduce((s, r) => s + Math.max((r.total_cents || 0) - (r.amount_paid_cents || 0), 0), 0);

  // Paid this calendar month, by the day the money actually landed.
  const now = new Date();
  const paidThisMonth = rows
    .filter((r) => {
      if (!r.paid_at) return false;
      const d = new Date(r.paid_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, r) => s + (r.amount_paid_cents || 0), 0);

  // Anything unpaid that has been opened is the interesting pile; then the rest.
  const attention = [...open].sort((a, b) => {
    const rank = (r) => (r.status === "viewed" ? 0 : 1);
    return rank(a) - rank(b) || String(b.issue_date).localeCompare(String(a.issue_date));
  });

  return (
    <Panel
      color={N.pink}
      rgb={N_RGB.pink}
      title="Invoices"
      subtitle="Every brand you bill under"
      asOf={asOf}
      onRefresh={onRefresh}
    >
      <Tiles
        items={[
          { label: "Outstanding", value: usd(outstanding), color: outstanding ? N.ink : N.mutedLite },
          { label: "Paid this month", value: usd(paidThisMonth), color: N.green },
          { label: "Open", value: String(open.length) },
          { label: "Drafts", value: String(drafts.length), color: drafts.length ? N.ink : N.mutedLite },
        ]}
      />

      {rows.length === 0 ? (
        <Quiet>No invoices yet.</Quiet>
      ) : attention.length === 0 ? (
        <Quiet>Nothing outstanding — everything sent has been paid.</Quiet>
      ) : (
        <div>
          {attention.slice(0, 6).map((r) => {
            const tone = TONE[r.status] || TONE.sent;
            return (
              <a
                key={r.id}
                href={"/inv/" + r.public_token}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: `1px solid ${N.rule}`, textDecoration: "none", color: N.text,
                }}
              >
                <span style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: r.brand_color || N.rule }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.bill_to_name || "(no customer)"}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: N.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.brand_name}{r.number ? " · " + r.number : ""}
                  </span>
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {usd(Math.max((r.total_cents || 0) - (r.amount_paid_cents || 0), 0))}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: tone.fg, background: tone.bg, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {tone.label}
                </span>
              </a>
            );
          })}
          {attention.length > 6 ? (
            <div style={{ fontSize: 12, color: N.muted, marginTop: 8 }}>+ {attention.length - 6} more</div>
          ) : null}
        </div>
      )}

      <button
        onClick={() => navigate("/invoices")}
        style={{
          marginTop: 14, fontFamily: "'Figtree', sans-serif", fontSize: 12.5, fontWeight: 700,
          background: "none", border: `1px solid ${N.rule}`, borderRadius: 8, padding: "8px 14px",
          cursor: "pointer", color: N.ink,
        }}
      >
        Make an invoice →
      </button>
    </Panel>
  );
}
