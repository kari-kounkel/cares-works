// Still Unread panel — unread INBOX threads from Gmail.
//
// Bodies are never fetched. We ask for metadata headers plus Gmail's own
// snippet, and the three tile counts come from cheap count-only queries rather
// than from pulling every message down.

import { requireUser, googleAccessToken, json, needsConnect } from "./_lib.js";

const SHOW = 12; // messages actually listed on the panel

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

  const api = "https://gmail.googleapis.com/gmail/v1/users/me";

  // "Today" means the viewer's calendar today, so the browser tells us which
  // day that is. Falls back to a rolling 24h if it didn't.
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.today || ""))
    ? String(req.query.today).replace(/-/g, "/")
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

    if (!listing.ok) {
      return needsConnect(res, "google", listing.body?.error?.message || `gmail_${listing.status}`);
    }

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
        // Gmail's internalDate is epoch ms as a string.
        receivedAt: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null,
        link: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
      });
    }

    messages.sort((a, b) => Date.parse(b.receivedAt || 0) - Date.parse(a.receivedAt || 0));

    return json(res, 200, {
      ok: true,
      asOf: new Date().toISOString(),
      // threadsUnread is the exact number Gmail itself shows next to Inbox.
      unread: inboxLabel.ok ? inboxLabel.body.threadsUnread ?? null : null,
      overAWeek: staleCount,
      today: todayCount,
      showing: messages.length,
      messages,
    });
  } catch (err) {
    return json(res, 200, { ok: false, error: err.message || "gmail_failed" });
  }
}
