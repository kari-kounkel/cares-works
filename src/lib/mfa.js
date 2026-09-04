// MFA helpers — Supabase Auth TOTP (authenticator app).
// Policy: CARES Access Control Policy v1.0 §6 — MFA is required before Plaid Link
// is surfaced, and any user who has enrolled must verify every session.
import { supabase } from "../supabaseClient";

// Returns { enrolled, verified, factorId }
//   enrolled  = user has a verified TOTP factor on file
//   verified  = this session has passed the second factor (AAL2)
export async function getMfaState() {
  const [{ data: factors }, { data: aal }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const totp = (factors?.totp || []).filter(f => f.status === "verified");
  return {
    enrolled: totp.length > 0,
    factorId: totp[0]?.id || null,
    verified: aal?.currentLevel === "aal2",
    needsChallenge: aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2",
  };
}

// Remove abandoned (unverified) factors so a fresh enrollment starts clean.
export async function cleanupUnverifiedFactors() {
  const { data } = await supabase.auth.mfa.listFactors();
  const stale = (data?.all || []).filter(f => f.status !== "verified");
  for (const f of stale) { try { await supabase.auth.mfa.unenroll({ factorId: f.id }); } catch (_) {} }
}

// Send the user to set up MFA, then back to where they were.
export function goToMfaSetup(next) {
  const target = next || (window.location.pathname + window.location.search);
  window.location.href = "/account/security?next=" + encodeURIComponent(target);
}

// "Remember this device" — skips the login-time code prompt for 30 days on this browser.
// Connecting a bank still requires a fresh code (see LedgerWorkspace.connectPlaid).
const TRUST_KEY = "cw_mfa_trusted_until";
export function isTrustedDevice() {
  try { return Number(localStorage.getItem(TRUST_KEY) || 0) > Date.now(); } catch (_) { return false; }
}
export function trustThisDevice(days = 30) {
  try { localStorage.setItem(TRUST_KEY, String(Date.now() + days * 86400000)); } catch (_) {}
}
export function forgetThisDevice() {
  try { localStorage.removeItem(TRUST_KEY); } catch (_) {}
}
