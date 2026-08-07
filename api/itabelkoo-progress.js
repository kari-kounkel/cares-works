import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Shared progress for the ITA BEL KOO curriculum page:
// checkboxes and skill ratings sync here, so anyone opening the page
// (Tanya, Tim, Kari) sees the same checkmarks.
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("itabelkoo_progress").select("k,v");
    if (error) return res.status(500).json({ error: error.message });
    const out = {};
    (data || []).forEach((r) => { out[r.k] = r.v; });
    return res.status(200).json(out);
  }

  if (req.method === "POST") {
    const { k, v } = req.body || {};
    if (!k) return res.status(400).json({ error: "missing key" });
    const { error } = await supabase.from("itabelkoo_progress").upsert(
      { k: String(k).slice(0, 50), v: String(v ?? "").slice(0, 10), updated_at: new Date().toISOString() },
      { onConflict: "k" }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
