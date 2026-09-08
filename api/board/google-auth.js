// Step 1 of the Google connect flow.
//
// The page (authenticated) POSTs here and gets back a consent URL to send the
// browser to. We don't redirect from here, because a redirect would arrive at
// Google with no way to prove which CARES Works user asked for it — the signed
// `state` is what carries that.

import { requireUser, signState, originOf, json, GOOGLE_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  if (!process.env.GOOGLE_CLIENT_ID) {
    return json(res, 503, { error: "google_not_configured" });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${originOf(req)}/api/board/google-callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    // offline + consent every time: Google hands back a refresh token only on a
    // fresh consent, and reconnecting after a Testing-mode expiry has to get one.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: signState({ uid: user.id, provider: "google" }),
  });

  return json(res, 200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}
