import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

// Generic cloud-memory wrapper for a single-file HTML cockpit.
// HTML source is EITHER passed in (htmlProp, for non-sensitive tools bundled
// from the repo) OR fetched from the gated public.kari_cockpit_html table
// (for tools with real client data — kept out of the public repo entirely).
// The tool runs verbatim in a same-origin srcdoc iframe; an injected bridge
// pre-seeds localStorage from the user's kari_tool_data row and tees every
// setItem back to the parent, which upserts it (per-user).

export default function KariCockpitFrame({ session, toolKey, slug, html: htmlProp, title }) {
  const [data, setData] = useState(null);                 // map: lsKey -> stringValue
  const [html, setHtml] = useState(htmlProp || null);     // null = needs fetch
  const uid = session?.user?.id;
  const key = toolKey || (slug ? slug.replace(/-/g, "_") : "cockpit");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dataReq = supabase.from("kari_tool_data").select("data")
        .eq("user_id", uid).eq("tool_key", key).maybeSingle();
      const htmlReq = htmlProp
        ? Promise.resolve({ data: { html: htmlProp } })
        : supabase.from("kari_cockpit_html").select("html")
            .eq("user_id", uid).eq("slug", slug).maybeSingle();
      const [{ data: row }, { data: h }] = await Promise.all([dataReq, htmlReq]);
      if (cancelled) return;
      setData(row?.data || {});
      setHtml(h?.html || htmlProp || "<p style='font-family:sans-serif;padding:40px'>This cockpit isn't loaded into your account yet.</p>");
    })();

    const onMsg = (e) => {
      if (e?.data?.__kari !== "save") return;
      setData((prev) => {
        const next = { ...(prev || {}), [e.data.k]: e.data.v };
        supabase.from("kari_tool_data").upsert(
          { user_id: uid, tool_key: key, data: next, updated_at: new Date().toISOString() },
          { onConflict: "user_id,tool_key" }
        );
        return next;
      });
    };
    window.addEventListener("message", onMsg);
    return () => { cancelled = true; window.removeEventListener("message", onMsg); };
  }, [uid, key, slug, htmlProp]);

  const srcDoc = useMemo(() => {
    if (data === null || html === null) return "";
    const safe = JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
    const bridge =
      "<script>(function(){var D=" + safe + ";" +
      "for(var k in D){try{localStorage.setItem(k,D[k]);}catch(e){}}" +
      "var o=localStorage.setItem.bind(localStorage);" +
      "localStorage.setItem=function(k,v){o(k,v);try{parent.postMessage({__kari:'save',k:k,v:v},'*');}catch(e){}};" +
      "})();<\/script>";
    return html.replace(/<body[^>]*>/i, (m) => m + bridge);
  }, [data, html]);

  const ready = data !== null && html !== null;

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", flexDirection: "column", fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #e8e0d0", background: "#fff" }}>
        <button onClick={() => navigate("/kari")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e8773a", background: "none", border: "none", cursor: "pointer" }}>← Cockpits</button>
        <span style={{ fontSize: 12, color: "#8a8270" }}>{title || "Cockpit"} · saves to your account automatically</span>
      </div>
      {!ready ? (
        <div style={{ padding: 40, fontFamily: "'DM Mono', monospace", color: "#8a8270", fontSize: 13 }}>Loading your saved data…</div>
      ) : (
        <iframe title={title || "Cockpit"} srcDoc={srcDoc} style={{ flex: 1, width: "100%", border: "none", minHeight: "calc(100vh - 45px)" }} />
      )}
    </div>
  );
}
