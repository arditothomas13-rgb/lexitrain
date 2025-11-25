// /api/wordlist-rebuild.js
// -----------------------------------------------
// Reconstruit automatiquement wordlist:en à partir 
// de tous les mots dict:xxx présents dans Upstash KV.
// -----------------------------------------------

export default async function handler(req, res) {
  try {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    // 1) Lire toutes les clés
    const listRes = await fetch(`${KV_URL}/keys/dict:*`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const keys = await listRes.json();
    if (!keys || keys.length === 0) {
      return res.status(200).json({ ok: true, imported: 0, words: [] });
    }

    // 2) Extraire le mot
    const words = keys.map(k => k.replace("dict:", "").trim().toLowerCase());

    // 3) Enregistrer wordlist:en
    await fetch(`${KV_URL}/set/wordlist:en`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: JSON.stringify(words)
      })
    });

    return res.status(200).json({
      ok: true,
      imported: words.length,
      words
    });

  } catch (err) {
    console.error("WORDLIST REBUILD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
