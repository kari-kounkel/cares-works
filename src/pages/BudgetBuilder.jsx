// BudgetBuilder.jsx — FREE Budget Builder (annual sales goal → 12-month budget + net profit target)
// Extracted from FlowSuite Pro's Budget tool, streamlined, math verified.
// Fixes carried in from the legacy tool:
//   1) monthly distribution sums to exactly 100% (legacy summed to 100.01%)
//   2) monthly cents reconcile exactly to the annual figure (no rounding drift)
//   3) export Net row uses correct signs (legacy exported Net = -income - expenses)
// FREE tier: goal, lines, 12-month grid, net-profit target calculator, Excel export, print.
// PAID tier (Budget Builder Pro on karikounkel.shop): saving, scenarios/snapshots, CSV history import.
import { useMemo, useState } from "react";
import { N, NeonBox, NeonBtn, GhostBtn, PageShell } from "../design/neon";

// ---------- calculation engine (shared with Budget Builder Pro) ----------
const LINE_TYPES = ["income", "cogs", "expense", "other_income", "other_expense"];
const POSITIVE_TYPES = ["income", "other_income"];
const TYPE_LABELS = { income: "Income", cogs: "COGS", expense: "Expenses", other_income: "Other Income", other_expense: "Other Expenses" };
const round2 = (n) => Math.round(n * 100) / 100;

function distributeAnnual(annual) {
  const a = Number(annual) || 0;
  const base = round2(a / 12);
  const months = new Array(12).fill(base);
  months[11] = round2(a - base * 11);
  return months;
}

function monthsFor(line, salesGoalAnnual, overrides) {
  let months;
  if (line.allocation_method === "percent_sales") {
    const pct = (Number(line.percent_of_sales) || 0) / 100;
    months = distributeAnnual((Number(salesGoalAnnual) || 0) * pct);
  } else if (line.allocation_method === "fixed_monthly") {
    const v = round2(Number(line.fixed_monthly) || 0);
    months = new Array(12).fill(v);
  } else {
    months = (line.manual_months || new Array(12).fill(0)).map((v) => round2(Number(v) || 0));
  }
  if (overrides) {
    months = months.map((v, i) => (overrides[i] != null && overrides[i] !== "" ? round2(Number(overrides[i]) || 0) : v));
  }
  return months;
}

const annualFor = (months) => round2(months.reduce((s, v) => s + v, 0));

function netProfitTarget(revenueAnnual, targetPct, currentNet) {
  const rev = Number(revenueAnnual) || 0;
  const t = (Number(targetPct) || 0) / 100;
  const targetNet = round2(rev * t);
  const expenseCap = round2(rev - targetNet);
  const gap = round2((Number(currentNet) || 0) - targetNet);
  const currentPct = rev > 0 ? ((Number(currentNet) || 0) / rev) * 100 : null;
  return { targetNet, expenseCap, gap, currentPct };
}
// ---------- end engine ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = (n) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
let nextId = 1;
const newId = () => "L" + nextId++;

const SAMPLE_LINES = () => ([
  { id: newId(), line_name: "Sales", line_type: "income", allocation_method: "percent_sales", percent_of_sales: 100, fixed_monthly: 0 },
  { id: newId(), line_name: "Cost of Goods Sold", line_type: "cogs", allocation_method: "percent_sales", percent_of_sales: 35, fixed_monthly: 0 },
  { id: newId(), line_name: "Payroll & Wages", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: 22, fixed_monthly: 0 },
  { id: newId(), line_name: "Payroll Taxes", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: 2.5, fixed_monthly: 0 },
  { id: newId(), line_name: "Rent", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 2500 },
  { id: newId(), line_name: "Utilities", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 450 },
  { id: newId(), line_name: "Insurance", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 600 },
  { id: newId(), line_name: "Software & Subscriptions", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 350 },
  { id: newId(), line_name: "Marketing", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: 4, fixed_monthly: 0 },
  { id: newId(), line_name: "Office Supplies", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 200 },
  { id: newId(), line_name: "Professional Fees", line_type: "expense", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 400 },
  { id: newId(), line_name: "Vehicle & Mileage", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: 1.5, fixed_monthly: 0 },
  { id: newId(), line_name: "Interest Income", line_type: "other_income", allocation_method: "fixed_monthly", percent_of_sales: 0, fixed_monthly: 25 },
]);

const inputStyle = {
  padding: "9px 12px", border: "1.5px solid " + N.rule, borderRadius: 8, fontSize: 14,
  fontFamily: "'Figtree', sans-serif", color: N.text, outline: "none", background: N.white,
};
const cellInput = {
  width: 76, padding: "4px 6px", border: "1px solid " + N.rule, borderRadius: 6,
  fontSize: 12, textAlign: "right", fontFamily: "'DM Mono', monospace", color: N.text, background: N.white,
};
const th = {
  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
  color: N.muted, fontWeight: 700, padding: "8px 6px", textAlign: "right", whiteSpace: "nowrap",
  borderBottom: "2px solid " + N.rule,
};

export default function BudgetBuilder() {
  const [salesGoal, setSalesGoal] = useState(500000);
  const [goalInput, setGoalInput] = useState("500000");
  const [fiscalStart, setFiscalStart] = useState(0); // 0 = Jan
  const [lines, setLines] = useState(SAMPLE_LINES);
  const [overrides, setOverrides] = useState({}); // lineId -> [12] of number|null
  const [targetPct, setTargetPct] = useState(13);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ line_name: "", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: "", fixed_monthly: "" });
  const [exporting, setExporting] = useState(false);

  const monthLabels = useMemo(() => MONTHS.map((_, i) => MONTHS[(fiscalStart + i) % 12]), [fiscalStart]);

  const valueMap = useMemo(() => {
    const m = {};
    lines.forEach((l) => { m[l.id] = monthsFor(l, salesGoal, overrides[l.id]); });
    return m;
  }, [lines, salesGoal, overrides]);

  const totals = useMemo(() => {
    let income = 0, outgo = 0;
    const netMonths = new Array(12).fill(0);
    lines.forEach((l) => {
      const a = annualFor(valueMap[l.id]);
      const pos = POSITIVE_TYPES.includes(l.line_type);
      if (pos) income = round2(income + a); else outgo = round2(outgo + a);
      valueMap[l.id].forEach((v, i) => { netMonths[i] = round2(netMonths[i] + (pos ? v : -v)); });
    });
    const net = round2(income - outgo);
    return { income, outgo, net, netMonths, margin: income > 0 ? (net / income) * 100 : null };
  }, [lines, valueMap]);

  const calc = netProfitTarget(totals.income, targetPct, totals.net);

  const applyGoal = () => {
    const v = Number(String(goalInput).replace(/[^0-9.]/g, "")) || 0;
    setSalesGoal(v);
    setOverrides({}); // recompute clears cell overrides, same as legacy "Save & recompute"
  };

  const setCell = (lineId, mi, val) => {
    setOverrides((o) => {
      const arr = (o[lineId] || new Array(12).fill(null)).slice();
      arr[mi] = val === "" ? null : val;
      return { ...o, [lineId]: arr };
    });
  };

  const addLine = () => {
    if (!draft.line_name.trim()) return;
    setLines((ls) => [...ls, {
      id: newId(),
      line_name: draft.line_name.trim(),
      line_type: draft.line_type,
      allocation_method: draft.allocation_method,
      percent_of_sales: Number(draft.percent_of_sales) || 0,
      fixed_monthly: Number(draft.fixed_monthly) || 0,
    }]);
    setDraft({ line_name: "", line_type: "expense", allocation_method: "percent_sales", percent_of_sales: "", fixed_monthly: "" });
    setAdding(false);
  };

  const removeLine = (id) => {
    setLines((ls) => ls.filter((l) => l.id !== id));
    setOverrides((o) => { const c = { ...o }; delete c[id]; return c; });
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      if (!window.XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const rows = [["Line", "Type", "Method", ...monthLabels, "Annual", "% of Sales"]];
      LINE_TYPES.forEach((t) => {
        lines.filter((l) => l.line_type === t).forEach((l) => {
          const m = valueMap[l.id];
          const a = annualFor(m);
          rows.push([
            l.line_name, TYPE_LABELS[l.line_type],
            l.allocation_method === "percent_sales" ? (l.percent_of_sales + "% of sales") : l.allocation_method === "fixed_monthly" ? "Fixed monthly" : "Manual",
            ...m, a, salesGoal > 0 ? round2((a / salesGoal) * 100) + "%" : "",
          ]);
        });
      });
      rows.push([]);
      rows.push(["NET PROFIT", "", "", ...totals.netMonths, totals.net, totals.margin != null ? round2(totals.margin) + "%" : ""]);
      rows.push(["Annual Sales Goal", "", "", ...new Array(12).fill(""), salesGoal, ""]);
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 16 }, ...new Array(12).fill({ wch: 10 }), { wch: 12 }, { wch: 10 }];
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Budget");
      window.XLSX.writeFile(wb, "budget-builder.xlsx");
    } catch (e) {
      alert("Export hit a snag — check your connection and try again.");
    }
    setExporting(false);
  };

  const sectionRows = (type) => {
    const sect = lines.filter((l) => l.line_type === type);
    if (!sect.length) return null;
    const sectMonths = new Array(12).fill(0);
    sect.forEach((l) => valueMap[l.id].forEach((v, i) => (sectMonths[i] = round2(sectMonths[i] + v))));
    return (
      <tbody key={type}>
        <tr>
          <td colSpan={15} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: N.blue, fontWeight: 700, padding: "14px 6px 6px" }}>
            {TYPE_LABELS[type]}
          </td>
        </tr>
        {sect.map((l) => {
          const m = valueMap[l.id];
          const a = annualFor(m);
          return (
            <tr key={l.id} style={{ borderBottom: "1px solid " + N.rule }}>
              <td style={{ padding: "6px", fontSize: 13, color: N.text, whiteSpace: "nowrap" }}>
                <button onClick={() => removeLine(l.id)} title="Delete line" style={{ border: "none", background: "none", color: N.mutedLite, cursor: "pointer", fontSize: 12, marginRight: 6 }}>✕</button>
                {l.line_name}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.mutedLite, marginLeft: 6 }}>
                  {l.allocation_method === "percent_sales" ? l.percent_of_sales + "%" : l.allocation_method === "fixed_monthly" ? "fixed" : "manual"}
                </span>
              </td>
              {m.map((v, i) => (
                <td key={i} style={{ padding: "3px 2px", textAlign: "right" }}>
                  <input
                    style={cellInput}
                    value={overrides[l.id] && overrides[l.id][i] != null ? overrides[l.id][i] : v}
                    onChange={(e) => setCell(l.id, i, e.target.value.replace(/[^0-9.\-]/g, ""))}
                  />
                </td>
              ))}
              <td style={{ padding: "6px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: N.ink, whiteSpace: "nowrap" }}>{fmt2(a)}</td>
              <td style={{ padding: "6px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted }}>
                {salesGoal > 0 ? round2((a / salesGoal) * 100) + "%" : "—"}
              </td>
            </tr>
          );
        })}
        <tr>
          <td style={{ padding: "6px", fontSize: 12, fontWeight: 700, color: N.muted }}>Subtotal</td>
          {sectMonths.map((v, i) => (
            <td key={i} style={{ padding: "6px 2px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: N.muted }}>{fmt(v)}</td>
          ))}
          <td style={{ padding: "6px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: N.ink }}>{fmt2(annualFor(sectMonths))}</td>
          <td />
        </tr>
      </tbody>
    );
  };

  // Neon discipline: blue is the brand; green glow is reserved for a positive net verdict. Everything else stays quiet.
  const quietBox = { background: N.white, borderRadius: 14, border: "1.5px solid " + N.rule };
  const card = (label, value, sub, color, glow) => {
    const inner = (
      <>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: N.muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: color }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: N.muted, marginTop: 4 }}>{sub}</div>}
      </>
    );
    return glow
      ? <NeonBox color={N.green} rgb="34,197,94" style={{ padding: "18px 22px", flex: "1 1 220px" }}>{inner}</NeonBox>
      : <div style={{ ...quietBox, padding: "18px 22px", flex: "1 1 220px" }}>{inner}</div>;
  };

  return (
    <PageShell tabs={[{ label: "All Tools", href: "/dashboard" }, { label: "Budget Builder", href: "/tools/budget-builder", active: true }]}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 24px 60px" }}>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 8 }}>Free Tool · Nothing here saves — export before you go</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: N.ink, margin: 0 }}>Budget Builder</h1>
          <p style={{ fontSize: 15, color: N.muted, maxWidth: 640, lineHeight: 1.6 }}>
            Set an annual sales goal, let your lines allocate themselves across 12 months, and see exactly what
            net profit you're steering toward. Edit any cell to override a month.
          </p>
        </div>

        {/* Goal + controls */}
        <NeonBox color={N.blue} rgb="0,128,255" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: N.muted, marginBottom: 6 }}>Annual Sales Goal</div>
              <input style={{ ...inputStyle, fontSize: 20, fontWeight: 700, width: 190 }} value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyGoal()} />
            </div>
            <NeonBtn color={N.blue} onClick={applyGoal}>Save &amp; recompute</NeonBtn>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: N.muted, marginBottom: 6 }}>Fiscal year starts</div>
              <select style={inputStyle} value={fiscalStart} onChange={(e) => setFiscalStart(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }} />
            <GhostBtn onClick={() => window.print()}>Print</GhostBtn>
            <NeonBtn color={N.blue} onClick={exportExcel}>{exporting ? "Exporting…" : "Export to Excel"}</NeonBtn>
          </div>
        </NeonBox>

        {/* Summary cards */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          {card("Projected Income", fmt(totals.income), null, N.blue, false)}
          {card("Projected Outgo", fmt(totals.outgo), "COGS + expenses + other expenses", N.ink, false)}
          {card("Projected Net Profit", fmt(totals.net), totals.margin != null ? round2(totals.margin) + "% margin" : "add an income line", totals.net >= 0 ? N.green : N.red, totals.net >= 0)}
        </div>

        {/* Net profit target calculator */}
        <div style={{ ...quietBox, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 6 }}>Net Profit Target</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[10, 13, 15, 20, 24].map((p) => (
                  <button key={p} onClick={() => setTargetPct(p)} style={{
                    padding: "7px 13px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: "1.5px solid " + (targetPct === p ? N.blue : N.rule),
                    background: targetPct === p ? N.blue : N.white, color: targetPct === p ? N.white : N.muted,
                  }}>{p}%</button>
                ))}
                <input style={{ ...inputStyle, width: 70 }} type="number" value={targetPct} onChange={(e) => setTargetPct(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: N.muted }}>Target net at {Number(targetPct) || 0}%</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{fmt(calc.targetNet)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: N.muted }}>Spending ceiling to hit it</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{fmt(calc.expenseCap)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: N.muted }}>{calc.gap >= 0 ? "Cushion above target" : "Gap to close"}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: calc.gap >= 0 ? N.green : N.red }}>{fmt(Math.abs(calc.gap))}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <NeonBox color={N.blue} rgb="0,128,255" scale={0.7} style={{ padding: "10px 14px 16px", overflowX: "auto", marginBottom: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left" }}>Line</th>
                {monthLabels.map((m) => <th key={m} style={th}>{m}</th>)}
                <th style={th}>Annual</th>
                <th style={th}>% Sales</th>
              </tr>
            </thead>
            {LINE_TYPES.map(sectionRows)}
            <tbody>
              <tr style={{ borderTop: "2px solid " + N.ink }}>
                <td style={{ padding: "10px 6px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, color: N.ink }}>NET PROFIT</td>
                {totals.netMonths.map((v, i) => (
                  <td key={i} style={{ padding: "10px 2px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: v >= 0 ? N.green : N.red }}>{fmt(v)}</td>
                ))}
                <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: totals.net >= 0 ? N.green : N.red }}>{fmt2(totals.net)}</td>
                <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted }}>{totals.margin != null ? round2(totals.margin) + "%" : "—"}</td>
              </tr>
            </tbody>
          </table>

          {/* Add line */}
          <div style={{ marginTop: 12 }}>
            {!adding ? (
              <GhostBtn color={N.blue} onClick={() => setAdding(true)}>+ Add budget line</GhostBtn>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: 14, background: "#e6f0ff", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: N.muted, marginBottom: 4 }}>Line name</div>
                  <input style={inputStyle} value={draft.line_name} onChange={(e) => setDraft({ ...draft, line_name: e.target.value })} placeholder="e.g. Shipping" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: N.muted, marginBottom: 4 }}>Type</div>
                  <select style={inputStyle} value={draft.line_type} onChange={(e) => setDraft({ ...draft, line_type: e.target.value })}>
                    {LINE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: N.muted, marginBottom: 4 }}>Method</div>
                  <select style={inputStyle} value={draft.allocation_method} onChange={(e) => setDraft({ ...draft, allocation_method: e.target.value })}>
                    <option value="percent_sales">% of sales</option>
                    <option value="fixed_monthly">Fixed monthly</option>
                    <option value="manual_monthly">Manual by month</option>
                  </select>
                </div>
                {draft.allocation_method === "percent_sales" && (
                  <div>
                    <div style={{ fontSize: 11, color: N.muted, marginBottom: 4 }}>% of sales</div>
                    <input style={{ ...inputStyle, width: 90 }} type="number" value={draft.percent_of_sales} onChange={(e) => setDraft({ ...draft, percent_of_sales: e.target.value })} placeholder="4.5" />
                  </div>
                )}
                {draft.allocation_method === "fixed_monthly" && (
                  <div>
                    <div style={{ fontSize: 11, color: N.muted, marginBottom: 4 }}>$ per month</div>
                    <input style={{ ...inputStyle, width: 110 }} type="number" value={draft.fixed_monthly} onChange={(e) => setDraft({ ...draft, fixed_monthly: e.target.value })} placeholder="2500" />
                  </div>
                )}
                <NeonBtn color={N.blue} onClick={addLine}>Add line</NeonBtn>
                <GhostBtn onClick={() => setAdding(false)}>Cancel</GhostBtn>
              </div>
            )}
          </div>
        </NeonBox>

        {/* Pro upsell */}
        <div style={{ ...quietBox, padding: "22px 24px" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 8 }}>Want it to remember you?</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 8 }}>Budget Builder <span style={{ color: N.blue, fontStyle: "italic" }}>Pro</span></div>
              <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.6, margin: 0 }}>
                Save unlimited budgets, snapshot scenarios side by side, sandbox what-ifs without touching
                your plan, and import your real P&amp;L history to auto-build a budget scaled to your goal.
              </p>
            </div>
            <a href="https://karikounkel.shop" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <NeonBtn color={N.blue} mono>Get Pro →</NeonBtn>
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
