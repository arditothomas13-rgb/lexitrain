// ------------------------------------------------------
//  API — history-add.js
//  Add a word to recent history (max 10)
// ------------------------------------------------------

export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) {
    return res.status(400).json({ error: "Missing word" });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Missing KV config" });
  }

  try {
    // Récupère l'historique
    const getRes = await fetch(`${KV_URL}/get/history:list`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await getRes.json();
    let list = data?.result || [];

    // Supprimer si existe déjà
    list = list.filter(w => w !== word);

    // Ajouter en tête
    list.unshift(word);

    // Limite : 10 mots max
    if (list.length > 10) list = list.slice(0, 10);

    // Sauvegarde dans KV
    await fetch(`${KV_URL}/set/history:list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(list)
    });

    return res.status(200).json({ ok: true, history: list });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
