import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import rawHtml from "../cockpits/the_one_list.html?raw";

// The One List, wired to the cloud. The original HTML runs verbatim in a
// same-origin srcdoc iframe; we (1) inject the user's saved ticks straight
// into the tool's `ticks` variable, and (2) tee its save() to postMessage so
// every change upserts to public.kari_tool_data for THIS user. No data lives
// in the page — it loads from the gated store at runtime.

const TOOL_KEY = "the_one_list";

export default function KariOneList({ session }) {
  const [ticks, setTicks] = useState(null); // null = still loading
  const uid = session?.user?.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("kari_tool_data")
        .select("data")
        .eq("user_id", uid)
        .eq("tool_key", TOOL_KEY)
        .maybeSingle();
      if (!cancelled) setTicks(data?.data || {});
    })();

    const onMsg = async (e) => {
      if (e?.data?.__kari === "save") {
        try {
          await supabase.from("kari_tool_data").upsert(
            { user_id: uid, tool_key: TOOL_KEY, data: JSON.parse(e.data.data), updated_at: new Date().toISOString() },
            { onConflict: "user_id,tool_key" }
          );
        } catch (_) { /* keep going; localStorage still holds it */ }
      }
    };
    window.addEventListener("message", onMsg);
    return () => { cancelled = true; window.removeEventListener("message", onMsg); };
  }, [uid]);

  const srcDoc = useMemo(() => {
    if (ticks === null) return "";
    return rawHtml
      .replace(
        "let ticks=JSON.parse(localStorage.getItem(KEY)||'{}');",
        "let ticks=" + JSON.stringify(ticks) + ";"
      )
      .replace(
        "localStorage.setItem(KEY,JSON.stringify(ticks));",
        "localStorage.setItem(KEY,JSON.stringify(ticks));try{parent.postMessage({__kari:'save',data:JSON.stringify(ticks)},'*');}catch(e){}"
      );
  }, [ticks]);

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f0", display: "flex", flexDirection: "column", fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #e8e0d0", background: "#fff" }}>
        <button onClick={() => navigate("/kari")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e8773a", background: "none", border: "none", cursor: "pointer" }}>← Cockpits</button>
        <span style={{ fontSize: 12, color: "#8a8270" }}>The One List · saves to your account automatically</span>
      </div>
      {ticks === null ? (
        <div style={{ padding: 40, fontFamily: "'DM Mono', monospace", color: "#8a8270", fontSize: 13 }}>Loading your saved progress…</div>
      ) : (
        <iframe title="The One List" srcDoc={srcDoc} style={{ flex: 1, width: "100%", border: "none", minHeight: "calc(100vh - 45px)" }} />
      )}
    </div>
  );
}
