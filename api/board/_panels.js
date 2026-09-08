// The three data feeds behind the Command Board, as plain functions.
//
// They live here rather than in one file each because Vercel's Hobby plan caps
// a deployment at 12 Serverless Functions and this repo already runs seven.
// api/board/data.js is the single function that routes to them.
//
// Each returns a body object; none of them throw upward. A feed that can't
// answer returns a shape the panel knows how to draw as a state, not an error.

import { googleAccessToken, qboAccessToken, qboApiBase } from "./_lib.js";

const needsConnect = (provider, reason) => ({ ok: false, needsConnect: provider, reason: reason || null });

const bearer = (token) => (url) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => ({
    ok: r.ok,
    status: r.status,
    body: await r.json().catch(() => ({})),
  }));

// --- Week Ahead --------------------------------------------------------------

const WINDOW_DAYS = 7;
const MAX_CALENDARS = 8;
const MAX_EVENTS = 60;

export async function calendarPanel(user) {
  const { token, error } = await googleAccessToken(user.id);
  if (error) return needsConnect("google", error);
  const get = bearer(token);

  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + WINDOW_DAYS * 86400_000).toISOString();

    // Kari's week is whatever is ticked in her Google Calendar sidebar, not just
    // "primary" — a board that hides the calendar an appointment is actually on
    // is worse than no board.
    const list = await get("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=50");
    if (!list.ok) return needsConnect("google", list.body?.error?.message || `calendar_list_${list.status}`);

    const calendars = (list.body.items || [])
      .filter((c) => c.selected !== false && !c.deleted)
      .slice(0, MAX_CALENDARS);

    const pages = await Promise.all(
      calendars.map((cal) => {
        const q = new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",   // expand recurring series into real occurrences
          orderBy: "startTime",
          maxResults: "50",
        });
        return get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${q}`)
          .then((r) => ({ cal, r }));
      })
    );

    const events = [];
    for (const { cal, r } of pages) {
      if (!r.ok) continue; // one unreadable calendar must not blank the panel
      for (const e of r.body.items || []) {
        if (e.status === "cancelled") continue;
        events.push({
          id: e.id,
          title: e.summary || "(no title)",
          allDay: Boolean(e.start?.date),
          // Timed events keep their offset so the browser renders them in the
          // viewer's zone. All-day events stay bare YYYY-MM-DD — turning those
          // into timestamps is how an all-day event slides to the wrong day.
          start: e.start?.dateTime || e.start?.date || null,
          end: e.end?.dateTime || e.end?.date || null,
          location: e.location ? String(e.location).slice(0, 90) : null,
          link: e.htmlLink || null,
          calendar: cal.summary || null,
        });
      }
    }

    // A rough chronological sort so the cap below keeps the soonest events. The
    // real day-grouping happens in the browser, which is the only place that
    // knows the viewer's time zone.
    const at = (e) => (e.allDay ? Date.parse(e.start + "T00:00:00Z") : Date.parse(e.start));
    events.sort((a, b) => (at(a) || 0) - (at(b) || 0));

    return {
      ok: true,
      asOf: new Date().toISOString(),
      windowDays: WINDOW_DAYS,
      calendars: calendars.length,
      events: events.slice(0, MAX_EVENTS),
    };
  } catch (err) {
    return { ok: false, error: err.message || "calendar_failed" };
  }
}

// --- Still Unread ------------------------------------------------------------

const SHOW = 12; // messages actually listed on the panel

export async function mailPanel(user, query) {
  const { token, error } = await googleAccessToken(user.id);
  if (error) return needsConnect("google", error);
  const get = bearer(token);
  const api = "https://gmail.googleapis.com/gmail/v1/users/me";

  // "Today" means the viewer's calendar today, so the browser tells us which day
  // that is. Falls back to a rolling 24h if it didn't.
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(query?.today || ""))
    ? String(query.today).replace(/-/g, "/")
    : null;

  const countOf = async (q) => {
    const r = await get(`${api}/messages?q=${encodeURIComponent(q)}&maxResults=1`);
    return r.ok ? r.body.resultSizeEstimate ?? 0 : null;
  };

  try {
    const [inboxLabel, listing, staleCount, todayCount] = await Promise.all([
      get(`${api}/labels/INBOX`),
      get(`${api}/messages?q=${encodeURIComponent("is:unread in:inbox")}&maxResults=${SHOW}`),
      countOf("is:unread in:inbox older_than:7d"),
      countOf(today ? `is:unread in:inbox after:${today}` : "is:unread in:inbox newer_than:1d"),
    ]);

    if (!listing.ok) return needsConnect("google", listing.body?.error?.message || `gmail_${listing.status}`);

    const ids = (listing.body.messages || []).map((m) => m.id);
    const details = await Promise.all(
      ids.map((id) =>
        get(`${api}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
      )
    );

    const messages = [];
    for (const d of details) {
      if (!d.ok) continue; // a single unreadable message must not blank the panel
      const m = d.body;
      const headers = {};
      for (const h of m.payload?.headers || []) headers[h.name.toLowerCase()] = h.value;

      // "Kari Kounkel <kari@…>" → "Kari Kounkel"; a bare address stays as-is.
      const raw = headers.from || "";
      const named = raw.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/);
      const from = (named ? named[1] : raw).trim() || raw || "(unknown sender)";

      messages.push({
        id: m.id,
        threadId: m.threadId,
        from,
        subject: headers.subject || "(no subject)",
        snippet: (m.snippet || "").slice(0, 160),
        receivedAt: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null,
        link: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
      });
    }

    messages.sort((a, b) => Date.parse(b.receivedAt || 0) - Date.parse(a.receivedAt || 0));

    return {
      ok: true,
      asOf: new Date().toISOString(),
      // threadsUnread is the exact number Gmail itself shows next to Inbox.
      unread: inboxLabel.ok ? inboxLabel.body.threadsUnread ?? null : null,
      overAWeek: staleCount,
      today: todayCount,
      showing: messages.length,
      messages,
    };
  } catch (err) {
    return { ok: false, error: err.message || "gmail_failed" };
  }
}

// --- Who Owes You ------------------------------------------------------------

const TOP_CUSTOMERS = 8;

const money = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// QBO report rows nest arbitrarily (sections inside sections). Flatten to the
// leaf rows that actually carry a customer and their columns.
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

export async function arPanel(user) {
  const { token, realmId, error } = await qboAccessToken(user.id);
  if (error) return needsConnect("qbo", error);
  if (!realmId) return needsConnect("qbo", "no_company");

  try {
    const url =
      `${qboApiBase()}/v3/company/${realmId}/reports/AgedReceivables` +
      `?minorversion=75&aging_method=Report_Date`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      if (r.status === 401 || r.status === 403) return needsConnect("qbo", "unauthorized");
      return { ok: false, error: `quickbooks_${r.status}`, detail: detail.slice(0, 200) };
    }

    const report = await r.json();
    const cols = report.Columns?.Column || [];
    const rows = report.Rows?.Row || [];

    // Column 0 is the customer; the last is the row total; everything between is
    // an aging bucket, named by QBO itself (Current, 1 - 30, 31 - 60, …).
    const bucketIdx = cols
      .map((c, i) => ({ label: (c.ColTitle || "").trim(), i }))
      .filter((c) => c.i > 0 && c.i < cols.length - 1 && c.label);
    const totalIdx = cols.length - 1;
    const currentIdx = bucketIdx.find((b) => /current/i.test(b.label))?.i ?? 1;

    const totalRow = grandTotal(rows);
    const buckets = bucketIdx.map((b) => ({ label: b.label, amount: money(totalRow?.[b.i]?.value) }));

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

    return {
      ok: true,
      asOf: new Date().toISOString(),
      reportDate: report.Header?.EndPeriod || report.Header?.Time || null,
      openAR,
      current,
      pastDue: openAR - current,
      buckets,
      // A negative bucket isn't a debt — it's money received and not applied to
      // an invoice. Flagged rather than silently summed into "who owes you".
      unappliedCredits: buckets.some((b) => b.amount < 0) || customers.some((c) => c.total < 0),
      customers,
    };
  } catch (err) {
    return { ok: false, error: err.message || "quickbooks_failed" };
  }
}
