// Shared plumbing for the Command Board API routes.
//
// Files under api/ starting with "_" are not deployed as functions — this is a
// library, not an endpoint.
//
// Three jobs:
//   1. Prove who is calling (Supabase JWT in an Authorization header).
//   2. Keep provider tokens encrypted at rest and out of the browser entirely.
//   3. Hand each panel route a fresh access token, refreshing when it's stale.

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

// Accounting scope only. We read the A/R Aging Summary report; nothing is written.
export const QBO_SCOPES = "com.intuit.quickbooks.accounting";

// --- Supabase ---------------------------------------------------------------

// Service-role client. Bypasses RLS, so it is the only thing that can read
// board_connections — which is exactly why it never leaves the server.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Every panel route calls this first. Same session the /kari gate uses — the
// page sends its Supabase access token, we ask Supabase who it belongs to.
export async function requireUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// --- Encryption -------------------------------------------------------------

function key() {
  const raw = process.env.BOARD_TOKEN_KEY;
  if (!raw) throw new Error("BOARD_TOKEN_KEY is not configured");
  // Any length passphrase in, a fixed 32 bytes out.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(":");
}

export function decrypt(blob) {
  if (!blob) return null;
  const [v, ivB64, tagB64, ctB64] = String(blob).split(":");
  if (v !== "v1") throw new Error("unrecognised ciphertext");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  d.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([d.update(Buffer.from(ctB64, "base64")), d.final()]).toString("utf8");
}

// --- OAuth state ------------------------------------------------------------
//
// The consent redirect is a plain browser navigation, so it carries no
// Authorization header. Instead the connect button asks us (authenticated) for
// a URL, and we bake a signed, short-lived token into `state`. The callback
// trusts the signature, not the query string — a forged state can't attach
// someone else's Google account to Kari's row.

const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function signState(payload) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + 10 * 60 * 1000 }));
  const sig = crypto.createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state) {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", key()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Connections ------------------------------------------------------------

export async function getConnection(userId, provider) {
  const { data } = await db()
    .from("board_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  return data || null;
}

export async function saveConnection(userId, provider, fields) {
  const row = { user_id: userId, provider, updated_at: new Date().toISOString(), ...fields };
  const { error } = await db()
    .from("board_connections")
    .upsert(row, { onConflict: "user_id,provider" });
  if (error) throw new Error(error.message);
}

export async function noteError(userId, provider, message) {
  await db()
    .from("board_connections")
    .update({ last_error: message, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", provider);
}

// --- Base URL ---------------------------------------------------------------

export function originOf(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "tools.caresmn.com";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

// --- Responses --------------------------------------------------------------

export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

// A panel that has never been connected, or whose refresh token has expired,
// is not an error the page should blank itself over — it's a state with a
// button. Every panel route answers with this shape so the client can render
// "Connect Google" / "Reconnect QuickBooks" instead of a stack trace.
export function needsConnect(res, provider, reason) {
  return json(res, 200, { ok: false, needsConnect: provider, reason: reason || null });
}

// --- Token refresh ----------------------------------------------------------

// True when we have an unexpired cached access token (with a minute of slack).
function stillFresh(conn) {
  if (!conn?.access_token_enc || !conn.access_expires_at) return false;
  return new Date(conn.access_expires_at).getTime() - 60_000 > Date.now();
}

export async function googleAccessToken(userId) {
  const conn = await getConnection(userId, "google");
  if (!conn) return { error: "not_connected" };
  if (stillFresh(conn)) return { token: decrypt(conn.access_token_enc) };

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: decrypt(conn.refresh_token_enc),
    grant_type: "refresh_token",
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({}));

  if (!r.ok || !data.access_token) {
    // In Testing mode Google expires refresh tokens after ~7 days; that lands
    // here as invalid_grant and the page shows its reconnect state.
    const reason = data.error === "invalid_grant" ? "expired" : data.error || "refresh_failed";
    await noteError(userId, "google", reason);
    return { error: reason };
  }

  await saveConnection(userId, "google", {
    access_token_enc: encrypt(data.access_token),
    access_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    last_error: null,
  });
  return { token: data.access_token };
}

export async function qboAccessToken(userId) {
  const conn = await getConnection(userId, "qbo");
  if (!conn) return { error: "not_connected" };
  if (stillFresh(conn)) return { token: decrypt(conn.access_token_enc), realmId: conn.realm_id };

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
      grant_type: "refresh_token",
      refresh_token: decrypt(conn.refresh_token_enc),
    }),
  });
  const data = await r.json().catch(() => ({}));

  if (!r.ok || !data.access_token) {
    const reason = data.error === "invalid_grant" ? "expired" : data.error || "refresh_failed";
    await noteError(userId, "qbo", reason);
    return { error: reason };
  }

  // Intuit rotates the refresh token periodically and only tells you once —
  // miss this and the connection silently dies in ~100 days.
  const patch = {
    access_token_enc: encrypt(data.access_token),
    access_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    last_error: null,
  };
  if (data.refresh_token) patch.refresh_token_enc = encrypt(data.refresh_token);
  await saveConnection(userId, "qbo", patch);

  return { token: data.access_token, realmId: conn.realm_id };
}

// QBO has two hosts: sandbox companies and real ones. QBO_ENV picks.
export function qboApiBase() {
  return (process.env.QBO_ENV || "production").toLowerCase() === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}
