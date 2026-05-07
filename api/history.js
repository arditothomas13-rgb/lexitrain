// /api/history.js
// GET  → retourne l'historique
// POST → ajoute un mot à l'historique

export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Missing KV config" });
  }

  try {
    if (req.method === "GET") {
      // === history-get ===
      const result = await fetch(`${KV_URL}/get/history:list`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await result.json();
      return res.status(200).json({ history: data?.result || [] });

    } else if (req.method === "POST") {
      // === history-add ===
      const { word } = req.query;
      if (!word) return res.status(400).json({ error: "Missing word" });

      const getRes = await fetch(`${KV_URL}/get/history:list`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await getRes.json();
      let list = data?.result || [];

      list = list.filter(w => w !== word);
      list.unshift(word);
      if (list.length > 10) list = list.slice(0, 10);

      await fetch(`${KV_URL}/set/history:list`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(list)
      });

      return res.status(200).json({ ok: true, history: list });

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
