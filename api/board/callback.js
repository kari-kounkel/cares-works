// Step 2 of both connect flows — where Google and Intuit send the browser back.
//
// One registered redirect URI for both providers: no Authorization header
// survives a top-level navigation, so the user AND the provider both come out
// of the HMAC-signed `state` we minted in auth.js. A forged state can't attach
// someone else's account to Kari's row.
//
// Always ends in a redirect to /board, so she lands on the page rather than on
// raw JSON.

import { verifyState, saveConnection, encrypt, originOf, GOOGLE_SCOPES, QBO_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  const base = originOf(req);
  const back = (q) => {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(302, { Location: `${base}/board?${q}` });
    res.end();
  };

  const { code, state, realmId, error } = req.query || {};
  const claims = verifyState(state);
  if (!claims) return back("board_error=bad_state");

  const provider = claims.provider;
  if (error) return back(`board_error=${provider}_${encodeURIComponent(error)}`);
  if (!code) return back(`board_error=${provider}_no_code`);

  try {
    const redirect = `${base}/api/board/callback`;

    if (provider === "google") {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: String(code),
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirect,
          grant_type: "authorization_code",
        }),
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data.refresh_token) {
        // No refresh token usually means Google reused an existing grant.
        // Revoking the app at myaccount.google.com/permissions and reconnecting
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
    }

    if (provider === "qbo") {
      // realmId is the company Kari picked on Intuit's consent screen. Every
      // later API call is scoped to it.
      if (!realmId) return back("board_error=qbo_no_realm");

      const basic = Buffer.from(
        `${process.env.QBO_CLIENT_ID || ""}:${process.env.QBO_CLIENT_SECRET || ""}`
      ).toString("base64");

      const r = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: String(code),
          redirect_uri: redirect,
        }),
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data.refresh_token) {
        return back(`board_error=qbo_${encodeURIComponent(data.error || "exchange_failed")}`);
      }

      await saveConnection(claims.uid, "qbo", {
        refresh_token_enc: encrypt(data.refresh_token),
        access_token_enc: data.access_token ? encrypt(data.access_token) : null,
        access_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
        realm_id: String(realmId),
        scopes: QBO_SCOPES,
        last_error: null,
      });
      return back("connected=qbo");
    }

    return back("board_error=unknown_provider");
  } catch (err) {
    return back(`board_error=${provider}_${encodeURIComponent(err.message || "exchange_failed")}`);
  }
}
