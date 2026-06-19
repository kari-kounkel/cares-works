import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

// Generic cloud-memory wrapper for a single-file HTML cockpit.
// The tool runs verbatim in a same-origin srcdoc iframe. A small injected
// bridge (1) pre-seeds localStorage from the user's cloud row before the tool
// reads it, and (2) tees every localStorage.setItem back to the parent, which
// upserts it into public.kari_tool_data (per-user). No per-tool code needed.

export default function KariCockpitFrame({ session, toolKey, html, title }) {
  const [data, setData] = useState(null); // map: localStorageKey -> stringValue
  const uid = session?.user?.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("kari_tool_data").select("data")
        .eq("user_id", uid).eq("tool_key", toolKey).maybeSingle();
      if (!cancelled) setData(row?.data || {});
    })();

    const onMsg = (e) => {
      if (e?.data?.__kari !== "save") return;
      setData((prev) => {
        const next = { ...(prev || {}), [e.data.k]: e.data.v };
        supabase.from("kari_tool_data").upsert(
          { user_id: uid, tool_key: toolKey, data: next, updated_at: new Date().toISOString() },
          { onConflict: "user_id,tool_key" }
        );
        return next;
      });
    };
    window.addEventListener("message", onMsg);
    return () => { cancelled = true; window.removeEventListener("message", onMsg); };
  }, [uid, toolKey]);

  const srcDoc = useMemo(() => {
    if (data === null) return "";
    const safe = JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
    const bridge =
      "<script>(function(){var D=" + safe + ";" +
      "for(var k in D){try{localStorage.setItem(k,D[k]);}catch(e){}}" +
      "var o=localStorage.setItem.bind(localStorage);" +
      "localStorage.setItem=function(k,v){o(k,v);try{parent.postMessage({__kari:'save',k:k,v:v},'*');}catch(e){}};" +
      "})();<\/script>";
    return html.replace(/<body[^>]*>/i, (m) => m + bridge);
  }, [data, html]);

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", flexDirection: "column", fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #e8e0d0", background: "#fff" }}>
        <button onClick={() => navigate("/kari")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e8773a", background: "none", border: "none", cursor: "pointer" }}>← Cockpits</button>
        <span style={{ fontSize: 12, color: "#8a8270" }}>{title} · saves to your account automatically</span>
      </div>
      {data === null ? (
        <div style={{ padding: 40, fontFamily: "'DM Mono', monospace", color: "#8a8270", fontSize: 13 }}>Loading your saved data…</div>
      ) : (
        <iframe title={title} srcDoc={srcDoc} style={{ flex: 1, width: "100%", border: "none", minHeight: "calc(100vh - 45px)" }} />
      )}
    </div>
  );
}
