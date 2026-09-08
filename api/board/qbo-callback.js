// Step 2 of the QuickBooks connect flow.
//
// Intuit sends back `realmId` alongside the code — that's the company Kari
// picked on the consent screen, and every later API call is scoped to it.

import { verifyState, saveConnection, encrypt, originOf, QBO_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  const base = originOf(req);
  const back = (q) => {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(302, { Location: `${base}/board?${q}` });
    res.end();
  };

  const { code, state, realmId, error } = req.query || {};
  if (error) return back(`board_error=qbo_${encodeURIComponent(error)}`);
  if (!code) return back("board_error=qbo_no_code");
  if (!realmId) return back("board_error=qbo_no_realm");

  const claims = verifyState(state);
  if (!claims || claims.provider !== "qbo") return back("board_error=qbo_bad_state");

  try {
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
        redirect_uri: `${base}/api/board/qbo-callback`,
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
  } catch (err) {
    return back(`board_error=qbo_${encodeURIComponent(err.message || "exchange_failed")}`);
  }
}
