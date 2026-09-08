// Who Owes You panel — the A/R Aging Summary report from QuickBooks Online.
//
// QBO reports come back as a nested Columns/Rows structure rather than plain
// records, so most of this file is turning that into the handful of numbers
// the panel draws.

import { requireUser, qboAccessToken, qboApiBase, json, needsConnect } from "./_lib.js";

const TOP_CUSTOMERS = 8;

const money = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Rows nest arbitrarily (sections inside sections). Flatten to the leaf rows
// that actually carry a customer and their columns.
function leafRows(rows, out = []) {
  for (const row of rows || []) {
    if (row.ColData) out.push(row.ColData);
    if (row.Rows?.Row) leafRows(row.Rows.Row, out);
  }
  return out;
}

function grandTotal(rows) {
  for (const row of rows || []) {
    if (row.group === "GrandTotal" && row.Summary?.ColData) return row.Summary.ColData;
    if (row.Rows?.Row) {
      const found = grandTotal(row.Rows.Row);
      if (found) return found;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  const { token, realmId, error } = await qboAccessToken(user.id);
  if (error) return needsConnect(res, "qbo", error);
  if (!realmId) return needsConnect(res, "qbo", "no_company");

  try {
    const url =
      `${qboApiBase()}/v3/company/${realmId}/reports/AgedReceivables` +
      `?minorversion=75&aging_method=Report_Date`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      if (r.status === 401 || r.status === 403) return needsConnect(res, "qbo", "unauthorized");
      return json(res, 200, { ok: false, error: `quickbooks_${r.status}`, detail: detail.slice(0, 200) });
    }

    const report = await r.json();
    const cols = report.Columns?.Column || [];
    const rows = report.Rows?.Row || [];

    // Column 0 is the customer; the last is the row total; everything between
    // is an aging bucket, named by QBO itself (Current, 1 - 30, 31 - 60, …).
    const bucketIdx = cols
      .map((c, i) => ({ label: (c.ColTitle || "").trim(), i }))
      .filter((c) => c.i > 0 && c.i < cols.length - 1 && c.label);
    const totalIdx = cols.length - 1;
    const currentIdx = bucketIdx.find((b) => /current/i.test(b.label))?.i ?? 1;

    const totalRow = grandTotal(rows);
    const buckets = bucketIdx.map((b) => ({
      label: b.label,
      amount: money(totalRow?.[b.i]?.value),
    }));

    const openAR = totalRow ? money(totalRow[totalIdx]?.value) : buckets.reduce((s, b) => s + b.amount, 0);
    const current = money(totalRow?.[currentIdx]?.value);

    const customers = leafRows(rows)
      .map((cd) => ({
        name: cd[0]?.value || "",
        id: cd[0]?.id || null,
        total: money(cd[totalIdx]?.value),
        current: money(cd[currentIdx]?.value),
      }))
      // Drop the report's own TOTAL line and anyone sitting at zero.
      .filter((c) => c.name && !/^total\b/i.test(c.name) && c.total !== 0)
      .map((c) => ({ name: c.name, id: c.id, total: c.total, pastDue: c.total - c.current }))
      .sort((a, b) => b.pastDue - a.pastDue)
      .slice(0, TOP_CUSTOMERS);

    return json(res, 200, {
      ok: true,
      asOf: new Date().toISOString(),
      company: report.Header?.ReportName ? report.Header.Option?.find?.((o) => o.Name === "companyName")?.Value || null : null,
      reportDate: report.Header?.EndPeriod || report.Header?.Time || null,
      openAR,
      current,
      pastDue: openAR - current,
      buckets,
      // A negative bucket isn't a debt — it's money received and not applied to
      // an invoice. Flagged rather than silently summed into "who owes you".
      unappliedCredits: buckets.some((b) => b.amount < 0) || customers.some((c) => c.total < 0),
      customers,
    });
  } catch (err) {
    return json(res, 200, { ok: false, error: err.message || "quickbooks_failed" });
  }
}
