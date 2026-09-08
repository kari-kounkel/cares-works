// Step 2 of the Google connect flow — where Google sends the browser back.
//
// No Authorization header here (it's a top-level navigation), so the user's
// identity comes from the HMAC-signed `state` we minted in google-auth.js.
// Always ends in a redirect to /board so Kari lands back on the page, never on
// raw JSON.

import { verifyState, saveConnection, encrypt, originOf, GOOGLE_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  const base = originOf(req);
  const back = (q) => {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(302, { Location: `${base}/board?${q}` });
    res.end();
  };

  const { code, state, error } = req.query || {};
  if (error) return back(`board_error=google_${encodeURIComponent(error)}`);
  if (!code) return back("board_error=google_no_code");

  const claims = verifyState(state);
  if (!claims || claims.provider !== "google") return back("board_error=google_bad_state");

  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${base}/api/board/google-callback`,
        grant_type: "authorization_code",
      }),
    });
    const data = await r.json().catch(() => ({}));

    if (!r.ok || !data.refresh_token) {
      // No refresh token usually means Google reused an existing grant. Revoking
      // the app's access at myaccount.google.com/permissions and reconnecting
      // forces a fresh one.
      return back(`board_error=google_${encodeURIComponent(data.error || "no_refresh_token")}`);
    }

    await saveConnection(claims.uid, "google", {
      refresh_token_enc: encrypt(data.refresh_token),
      access_token_enc: data.access_token ? encrypt(data.access_token) : null,
      access_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      scopes: data.scope || GOOGLE_SCOPES,
      last_error: null,
    });

    return back("connected=google");
  } catch (err) {
    return back(`board_error=google_${encodeURIComponent(err.message || "exchange_failed")}`);
  }
}
