// Week Ahead panel — the next 7 days from Google Calendar.
//
// Returns only what the panel draws. Descriptions, attendees, conferencing
// data and organiser details never leave Google.

import { requireUser, googleAccessToken, json, needsConnect } from "./_lib.js";

const WINDOW_DAYS = 7;
const MAX_CALENDARS = 8;
const MAX_EVENTS = 60;

export default async function handler(req, res) {
  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  const { token, error } = await googleAccessToken(user.id);
  if (error) return needsConnect(res, "google", error);

  const get = (url) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => ({
      ok: r.ok,
      status: r.status,
      body: await r.json().catch(() => ({})),
    }));

  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + WINDOW_DAYS * 86400_000).toISOString();

    // Kari's week is whatever is ticked in her Google Calendar sidebar, not just
    // "primary" — a board that hides the calendar the appointment is actually on
    // is worse than no board.
    const list = await get("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=50");
    if (!list.ok) {
      return needsConnect(res, "google", list.body?.error?.message || `calendar_list_${list.status}`);
    }

    const calendars = (list.body.items || [])
      .filter((c) => c.selected !== false && !c.deleted)
      .slice(0, MAX_CALENDARS);

    const pages = await Promise.all(
      calendars.map((cal) => {
        const q = new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",      // expand recurring series into real occurrences
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
        const allDay = Boolean(e.start?.date);
        events.push({
          id: e.id,
          title: e.summary || "(no title)",
          allDay,
          // Timed events keep their offset so the browser renders them in the
          // viewer's zone. All-day events stay bare YYYY-MM-DD — turning those
          // into timestamps is how an all-day event slides to the wrong day.
          start: e.start?.dateTime || e.start?.date || null,
          end: e.end?.dateTime || e.end?.date || null,
          location: e.location ? String(e.location).slice(0, 90) : null,
          link: e.htmlLink || null,
          calendar: cal.summary || null,
          color: cal.backgroundColor || null,
        });
      }
    }

    // A rough chronological sort so the cap below keeps the soonest events.
    // The real day-grouping happens in the browser, because only the browser
    // knows the viewer's time zone.
    const at = (e) => (e.allDay ? Date.parse(e.start + "T00:00:00Z") : Date.parse(e.start));
    events.sort((a, b) => (at(a) || 0) - (at(b) || 0));

    return json(res, 200, {
      ok: true,
      asOf: new Date().toISOString(),
      windowDays: WINDOW_DAYS,
      calendars: calendars.length,
      events: events.slice(0, MAX_EVENTS),
    });
  } catch (err) {
    return json(res, 200, { ok: false, error: err.message || "calendar_failed" });
  }
}
