import { createClient } from "npm:@supabase/supabase-js@2";

// Emails the workpaper owner when a client answers an open item on a tokenized
// workpaper page (tools.caresmn.com/<slug>/<token>). The answer itself is saved by
// the submit_workpaper_answer RPC before this runs; this function only reads what
// was saved and sends the notice. Access is by token: an unknown token, or an item
// with no answer in the last 15 minutes, sends nothing.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function esc(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const { slug, token, item_key } = await req.json();
    if (!slug || !token || !item_key) return json({ error: "slug, token and item_key required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link } = await admin.from("workpaper_links").select("id, title, notify_email, payload").eq("slug", slug).eq("token", token).eq("active", true).maybeSingle();
    if (!link) return json({ error: "Link not found" }, 404);

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: ans } = await admin.from("workpaper_answers").select("answer, answered_by, created_at").eq("link_id", link.id).eq("item_key", item_key).gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!ans) return json({ error: "No recent answer" }, 404);

    const item = (link.payload?.open_items || []).find((i: { key: string }) => i.key === item_key) || { title: item_key };
    const to = String(link.notify_email || "").trim();
    if (!to) return json({ ok: true, emailed: false });

    const pageUrl = "https://tools.caresmn.com/" + slug + "/" + token;
    const who = ans.answered_by ? esc(ans.answered_by) : "Client";
    const subject = "Answer received — " + (link.title || "workpapers") + ": " + item.title;
    const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6">' +
      "<p><b>" + who + "</b> answered an open item on <b>" + esc(link.title) + "</b>.</p>" +
      '<p style="margin:0;color:#64748b;font-size:13px">Open item</p><p style="margin:0 0 12px"><b>' + esc(item.title) + "</b></p>" +
      '<p style="margin:0;color:#64748b;font-size:13px">Answer</p><div style="border-left:3px solid #0080ff;padding:8px 14px;background:#f5f9ff;white-space:pre-wrap">' + esc(ans.answer) + "</div>" +
      '<p><a href="' + pageUrl + '">Open the workpapers</a></p>' +
      '<p style="color:#94a3b8;font-size:12px">Sent via CARES Works.</p></div>';
    const text = who + " answered \"" + item.title + "\" on " + link.title + ":\n\n" + ans.answer + "\n\n" + pageUrl;

    const hubUrl = Deno.env.get("HUB_URL");
    const hubSecret = Deno.env.get("HUB_WEBHOOK_SECRET");
    if (!hubUrl || !hubSecret) return json({ ok: true, emailed: false, reason: "Email isn't configured (HUB_URL / HUB_WEBHOOK_SECRET)." });

    const hubRes = await fetch(hubUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hub-secret": hubSecret },
      body: JSON.stringify({ action: "notify", channel: "email", type: "workpaper-answer", source: "cares-works", to, subject, body: text, html, from_name: "CARES Works" }),
    });
    const detail = await hubRes.json().catch(() => ({}));
    return json({ ok: true, emailed: hubRes.ok, detail: hubRes.ok ? undefined : detail });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
