import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

// Kari's PRIVATE cockpit hub — tools.caresmn.com/kari
// Gated to her login (App.jsx). The tile list lives in public.kari_cockpits
// (per-user, RLS) so Kari adds/edits/removes tiles herself — no code change.
// Each cockpit's DATA lives in public.kari_tool_data (wired per-tool in Pass 2).

const S = {
  paper: "#faf8f4", ink: "#1e1e2a", slate: "#3d4560", orange: "#e8773a",
  orangeDark: "#c95f22", muted: "#7a7585", rule: "#ddd8cc", white: "#fff",
  green: "#5a9a5a", cream: "#f2ede3",
};

export default function KariCockpits({ session }) {
  const [cockpits, setCockpits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ emoji: "🧩", name: "", descr: "", url: "" });

  const uid = session?.user?.id;

  async function load() {
    const { data } = await supabase
      .from("kari_cockpits")
      .select("*")
      .eq("user_id", uid)
      .order("sort", { ascending: true });
    setCockpits(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    load();
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function addCockpit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const sort = (cockpits[cockpits.length - 1]?.sort || 0) + 1;
    await supabase.from("kari_cockpits").insert({
      user_id: uid, sort,
      emoji: form.emoji || "🧩", name: form.name.trim(),
      descr: form.descr.trim(), url: form.url.trim(),
      status: form.url.trim() ? "active" : "connecting",
    });
    setForm({ emoji: "🧩", name: "", descr: "", url: "" });
    setShowAdd(false);
    load();
  }

  async function removeCockpit(id) {
    if (!window.confirm("Remove this tile from your menu? (The tool itself isn't deleted.)")) return;
    await supabase.from("kari_cockpits").delete().eq("id", id);
    load();
  }

  function openCockpit(c) {
    if (c.status !== "active" || !c.url) return;
    if (/^https?:\/\//.test(c.url)) window.open(c.url, "_blank", "noopener");
    else navigate(c.url);
  }

  const input = { fontFamily: "inherit", fontSize: 14, padding: "9px 11px", border: "1px solid " + S.rule, borderRadius: 8, background: S.white, color: S.ink, width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', system-ui, sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ borderBottom: "1px solid " + S.rule, background: S.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: S.orange }}>Private · CARES Consulting</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginTop: 4 }}>Kari's Cockpits</div>
          </div>
          <button onClick={() => navigate("/dashboard")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Dashboard</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <p style={{ color: S.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
            Your tools, in one place — data saves to your account so it follows you to any computer. Add or remove tiles yourself; tools light up as each is connected to your cloud store.
          </p>
          <button onClick={() => setShowAdd((v) => !v)} style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: S.orange, color: S.white, border: "none", borderRadius: 9, padding: "10px 18px", cursor: "pointer", whiteSpace: "nowrap" }}>
            {showAdd ? "Cancel" : "+ Add a tool"}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addCockpit} style={{ background: S.white, border: "1px solid " + S.rule, borderRadius: 14, padding: 18, marginBottom: 22, display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, maxWidth: 560 }}>
            <input style={{ ...input, textAlign: "center", fontSize: 22 }} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} aria-label="emoji" />
            <input style={input} placeholder="Tool name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div />
            <input style={input} placeholder="Short description" value={form.descr} onChange={(e) => setForm({ ...form, descr: e.target.value })} />
            <div />
            <input style={input} placeholder="Link (optional — paste a URL to make it open right away)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <div />
            <button type="submit" style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: S.slate, color: S.white, border: "none", borderRadius: 9, padding: "10px 18px", cursor: "pointer", justifySelf: "start" }}>Add to my menu</button>
          </form>
        )}

        {loading ? (
          <div style={{ color: S.muted, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Loading your cockpits…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {cockpits.map((c) => {
              const active = c.status === "active" && c.url;
              return (
                <div key={c.id} style={{
                  background: S.white, border: "1px solid " + S.rule, borderRadius: 14,
                  padding: "18px 18px 16px", cursor: active ? "pointer" : "default",
                  opacity: active ? 1 : 0.72, boxShadow: "0 18px 40px -30px rgba(43,49,71,0.4)",
                  display: "flex", flexDirection: "column", gap: 8, position: "relative",
                }}>
                  <div onClick={() => openCockpit(c)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 26 }}>{c.emoji}</span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "3px 8px", borderRadius: 6,
                      background: active ? "#edf4ef" : S.cream, color: active ? S.green : S.muted,
                      border: "1px solid " + (active ? "#bcd8c7" : S.rule),
                    }}>{active ? "Open ↗" : "Connecting…"}</span>
                  </div>
                  <div onClick={() => openCockpit(c)} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate }}>{c.name}</div>
                  <div onClick={() => openCockpit(c)} style={{ fontSize: 13.5, color: S.muted, lineHeight: 1.5 }}>{c.descr}</div>
                  <button onClick={() => removeCockpit(c.id)} title="Remove from menu" style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: S.rule, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 4 }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted }}>
          Logged in as {session?.user?.email}. Your menu + data save to your account (private, RLS-protected).
        </div>
      </div>
    </div>
  );
}
