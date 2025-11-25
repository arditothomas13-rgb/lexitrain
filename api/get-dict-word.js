export default async function handler(req, res) {
  const word = req.query.word?.toLowerCase();
  if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Missing KV config" });
  }

  try {
    // On récupère la clé : "dict:word"
    const key = `dict:${word}`;

    const cloud = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });

    const data = await cloud.json();

    if (!data?.result) {
      return res.status(404).json({ error: "Word not found in premium dict" });
    }

    const parsed = JSON.parse(data.result);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("DICT GET ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}
