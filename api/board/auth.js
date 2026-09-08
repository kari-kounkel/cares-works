// Step 1 of both connect flows: /api/board/auth?provider=google|qbo
//
// The page (authenticated) POSTs here and gets back a consent URL to send the
// browser to. We don't redirect from here, because a redirect would arrive at
// the provider with no way to prove which CARES Works user asked for it — the
// signed `state` is what carries that.

import { requireUser, signState, originOf, json, GOOGLE_SCOPES, QBO_SCOPES } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const provider = String(req.query?.provider || "");
  if (provider !== "google" && provider !== "qbo") return json(res, 400, { error: "unknown_provider" });

  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  // Both providers come back to the same URL; the signed state says which is
  // which. One redirect URI to register instead of two.
  const redirect = `${originOf(req)}/api/board/callback`;
  const state = signState({ uid: user.id, provider });

  if (provider === "google") {
    if (!process.env.GOOGLE_CLIENT_ID) return json(res, 503, { error: "google_not_configured" });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirect,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      // offline + consent every time: Google hands back a refresh token only on
      // a fresh consent, and reconnecting after a Testing-mode expiry needs one.
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return json(res, 200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  }

  if (!process.env.QBO_CLIENT_ID) return json(res, 503, { error: "qbo_not_configured" });
  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID,
    response_type: "code",
    scope: QBO_SCOPES,
    redirect_uri: redirect,
    state,
  });
  return json(res, 200, { url: `https://appcenter.intuit.com/connect/oauth2?${params}` });
}
