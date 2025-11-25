export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const response = await fetch(`${KV_URL}/keys/dict:*`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });

    const data = await response.json();

    if (!data?.result) {
      return res.status(200).json([]);
    }

    // data.result = ["dict:achieve", "dict:avoid", ...]
    const words = data.result.map(k => k.replace("dict:", ""));

    return res.status(200).json(words);

  } catch (err) {
    console.error("LIST ERROR", err);
    return res.status(500).json({ error: err.message });
  }
}
