import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

// Generic cloud-memory wrapper for a single-file HTML cockpit.
// HTML source is EITHER passed in (htmlProp, non-sensitive tools bundled from
// the repo) OR fetched from the gated public.kari_cockpit_html table (tools with
// real client data, kept out of the public repo). The tool runs verbatim in a
// srcdoc iframe with an injected bridge that:
//   1. seeds localStorage from the user's saved kari_tool_data (BEFORE the tool's
//      own scripts read it — injected at the top of <head>),
//   2. captures EVERY localStorage change (setItem/removeItem/clear AND a 2s
//      full-snapshot poll, so it catches property-assignment writes too) and
//      posts the full snapshot up to the parent, which debounce-upserts it.
// The srcDoc is built ONCE from the initial data — it does NOT rebuild on save,
// so editing never reloads the iframe.

export default function KariCockpitFrame({ session, toolKey, slug, html: htmlProp, title }) {
  const uid = session?.user?.id;
  const key = toolKey || (slug ? slug.replace(/-/g, "_") : "cockpit");

  const [html, setHtml] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const initialDataRef = useRef({});   // cloud data at load — feeds the seed, set once
  const latestRef = useRef(null);       // most recent snapshot from the iframe
  const timerRef = useRef(null);        // debounce timer

  // Load HTML + the user's saved data ONCE.
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
      initialDataRef.current = row?.data || {};
      setHtml(h?.html || htmlProp || "<p style='font-family:sans-serif;padding:40px'>This cockpit isn't loaded into your account yet.</p>");
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [uid, key, slug, htmlProp]);

  // Listen for snapshots from the iframe; debounce-upsert. Also flush on unmount
  // / page hide so the last edits are never lost when navigating away.
  useEffect(() => {
    const flush = () => {
      const snap = latestRef.current;
      if (!snap) return;
      supabase.from("kari_tool_data").upsert(
        { user_id: uid, tool_key: key, data: snap, updated_at: new Date().toISOString() },
        { onConflict: "user_id,tool_key" }
      ).then(({ error }) => { if (!error) setSavedAt(Date.now()); });
    };
    const onMsg = (e) => {
      if (e?.data?.__kari !== "save") return;
      latestRef.current = e.data.snap || {};
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 500);
    };
    const onHide = () => { if (timerRef.current) clearTimeout(timerRef.current); flush(); };
    window.addEventListener("message", onMsg);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("pagehide", onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [uid, key]);

  // Build the iframe document ONCE (depends only on html + loaded, NOT on saves).
  const srcDoc = useMemo(() => {
    if (!loaded || html === null) return "";
    const safe = JSON.stringify(initialDataRef.current || {}).replace(/<\/script/gi, "<\\/script");
    const bridge =
      "<script>(function(){" +
      "var D=" + safe + ";" +
      "try{for(var k in D){localStorage.setItem(k,D[k]);}}catch(e){}" +
      "function snap(){var o={};try{for(var i=0;i<localStorage.length;i++){var kk=localStorage.key(i);o[kk]=localStorage.getItem(kk);}}catch(e){}return o;}" +
      "var last=JSON.stringify(snap());" +
      "function flush(){try{var s=snap();var j=JSON.stringify(s);if(j!==last){last=j;parent.postMessage({__kari:'save',snap:s},'*');}}catch(e){}}" +
      "var _s=localStorage.setItem.bind(localStorage);localStorage.setItem=function(k,v){_s(k,v);setTimeout(flush,0);};" +
      "var _r=localStorage.removeItem.bind(localStorage);localStorage.removeItem=function(k){_r(k);setTimeout(flush,0);};" +
      "var _c=localStorage.clear.bind(localStorage);localStorage.clear=function(){_c();setTimeout(flush,0);};" +
      "setInterval(flush,2000);" +
      "window.addEventListener('pagehide',flush);" +
      "document.addEventListener('visibilitychange',function(){if(document.hidden)flush();});" +
      "})();<\/script>";
    // Inject as early as possible so the seed runs before the tool reads storage.
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + bridge);
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => m + bridge);
    return bridge + html;
  }, [loaded, html]);

  const ready = loaded && html !== null;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <button onClick={() => navigate("/kari")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#0080ff", background: "none", border: "none", cursor: "pointer" }}>← Cockpits</button>
        <span style={{ fontSize: 12, color: "#64748b" }}>{title || "Cockpit"} · {savedAt ? "saved to your account ✓" : "saves to your account automatically"}</span>
      </div>
      {!ready ? (
        <div style={{ padding: 40, fontFamily: "'DM Mono', monospace", color: "#64748b", fontSize: 13 }}>Loading your saved data…</div>
      ) : (
        <iframe title={title || "Cockpit"} srcDoc={srcDoc} style={{ flex: 1, width: "100%", border: "none", minHeight: "calc(100vh - 45px)" }} />
      )}
    </div>
  );
}
