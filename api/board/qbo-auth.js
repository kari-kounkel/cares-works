// Step 1 of the QuickBooks connect flow. Mirrors google-auth.js.
//
// Which company the A/R panel shows is decided at Intuit's consent screen —
// whichever company is picked there is the realmId we store on the way back.

import { requireUser, signState, originOf, json, QBO_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  if (!process.env.QBO_CLIENT_ID) {
    return json(res, 503, { error: "qbo_not_configured" });
  }

  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID,
    response_type: "code",
    scope: QBO_SCOPES,
    redirect_uri: `${originOf(req)}/api/board/qbo-callback`,
    state: signState({ uid: user.id, provider: "qbo" }),
  });

  return json(res, 200, { url: `https://appcenter.intuit.com/connect/oauth2?${params}` });
}
