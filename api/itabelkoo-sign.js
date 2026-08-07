import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Receives Tim's signed agreement: name, signature image, and his focus-list links.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { signer, signature, items } = req.body || {};
  if (!signer || !signature) return res.status(400).json({ error: "missing fields" });
  if (String(signature).length > 500000) return res.status(413).json({ error: "signature too large" });

  const { error } = await supabase.from("itabelkoo_signed").insert({
    signer_name: String(signer).slice(0, 200),
    signature_data: String(signature),
    focus_items: Array.isArray(items) ? items.slice(0, 20) : [],
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
