// /api/get-dict-word.js
export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) {
    return res.status(400).json({ error: "Missing word" });
  }

  try {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "KV not configured" });
    }

    // 1 — Récupérer le JSON du dictionnaire
    const r = await fetch(`${KV_URL}/get/dict:${word.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const json = await r.json();
    if (!json.result) {
      return res.status(404).json({ error: "Not found" });
    }

    // 2 — Parse ton entrée premium
    const entry = JSON.parse(json.result);

    // 3 — Transforme au format attendu par app.js
    return res.status(200).json({
      main_translation: entry.main_translation || null,
      translations: entry.translations || [],
      examples: entry.examples || [],
      distractors: entry.distractors || []
    });

  } catch (err) {
    console.error("DICT ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}
