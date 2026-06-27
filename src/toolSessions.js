import { supabase } from "./supabaseClient";

// Unified "saved work" / "pick up where you left off" index.
// Any tool calls logToolSession(...) whenever a signed-in user saves or opens
// a piece of work. The dashboard reads the most recent rows back.
//
// One row per (user, tool, ref_id) — re-saving the same record refreshes it
// instead of piling up duplicates. ref_id is the tool's own record id
// (e.g. a saved checklist id); pass "" for tools that have a single workspace.

export async function logToolSession({ email, slug, title, icon, refId = "", name }) {
  if (!email || !slug) return;
  try {
    await supabase.from("tool_sessions").upsert(
      {
        user_email: email,
        tool_slug: slug,
        tool_title: title || null,
        tool_icon: icon || null,
        ref_id: refId || "",
        name: name || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email,tool_slug,ref_id" }
    );
  } catch (e) {
    // Non-fatal — saving the work itself already succeeded.
  }
}

export async function fetchRecentSessions(email, limit = 4) {
  if (!email) return [];
  const { data } = await supabase
    .from("tool_sessions")
    .select("*")
    .eq("user_email", email)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data || [];
}
