export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const response = await fetch(`${KV_URL}/keys/dict:*`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await response.json();

    // Cas 1 — aucune clé trouvée
    if (!data?.result) {
      return res.status(200).json({ words: [] });
    }

    // Cas 2 — toutes les clés trouvées
    const words = data.result.map(key => key.replace("dict:", ""));

    return res.status(200).json({ words });

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
