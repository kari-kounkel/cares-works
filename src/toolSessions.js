import { supabase } from "./supabaseClient";

// Unified "saved work" / "pick up where you left off" index.
// Any tool calls logToolSession(...) whenever a signed-in user saves or opens
// a piece of work. The dashboard reads the most recent rows back.
//
// One row per (user, tool, ref_id) — re-saving the same record refreshes it
// instead of piling up duplicates. ref_id is the tool's own record id
// (e.g. a saved checklist id); pass "" for tools that have a single workspace.

export async function logToolSession({ email, slug, title, icon, refId = "", name, href }) {
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
        href: href || null,
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

// The real "what have I saved" — reads each tool's actual table (the source of
// truth), so existing work shows up immediately without any forward-logging or
// backfill. RLS scopes every query to the signed-in user. Add a tool's table
// here when it gains per-user cloud saves.
export async function fetchAllSavedWork(session) {
  const email = session?.user?.email;
  if (!email) return [];
  const [orgs, checks, boards, assess, cockpits, kdata] = await Promise.all([
    supabase.from("ledger_orgs").select("id,name,updated_at").order("updated_at", { ascending: false }),
    supabase.from("user_checklists").select("id,name,updated_at").eq("user_email", email).order("updated_at", { ascending: false }),
    supabase.from("steward_boards").select("id,name,updated_at").eq("user_email", email).order("updated_at", { ascending: false }),
    supabase.from("client_assessments").select("id,client_name,created_at").eq("user_email", email).order("created_at", { ascending: false }),
    supabase.from("kari_cockpits").select("name,emoji,url,status,created_at").eq("status", "active"),
    supabase.from("kari_tool_data").select("tool_key,updated_at"),
  ]);
  const out = [];
  (orgs.data || []).forEach(o => out.push({ id: "ledger-" + o.id, tool_title: "CARES Ledger", tool_icon: "📒", name: o.name, updated_at: o.updated_at, href: "/tools/ledger?org=" + o.id }));
  (checks.data || []).forEach(c => out.push({ id: "check-" + c.id, tool_title: "Checklist", tool_icon: "🛠️", name: c.name, updated_at: c.updated_at, href: "/tools/checklist-builder?open=" + c.id }));
  (boards.data || []).forEach(b => out.push({ id: "steward-" + b.id, tool_title: "Steward", tool_icon: "📊", name: b.name, updated_at: b.updated_at, href: "/steward?board=" + b.id }));
  (assess.data || []).forEach(a => out.push({ id: "qbo-" + a.id, tool_title: "QBO Discovery", tool_icon: "📋", name: a.client_name, updated_at: a.created_at, href: "/tools/qbo-discovery?load=" + a.id }));
  const lastWorked = {};
  (kdata.data || []).forEach(d => { lastWorked[String(d.tool_key || "").replace(/_/g, "-")] = d.updated_at; });
  (cockpits.data || []).forEach(c => {
    const slug = String(c.url || "").replace("/kari/", "");
    out.push({ id: "kari-" + slug, tool_title: "Cockpit", tool_icon: c.emoji || "🗂️", name: c.name, updated_at: lastWorked[slug] || c.created_at, href: c.url });
  });
  out.sort((x, y) => String(y.updated_at || "").localeCompare(String(x.updated_at || "")));
  return out;
}
