// ------------------------------------------------------
//  API — history-get.js
//  Returns recent translation history
// ------------------------------------------------------

export default async function handler(req, res) {
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "Missing KV config" });
  }

  try {
    const result = await fetch(`${KV_URL}/get/history:list`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await result.json();

    return res.status(200).json({
      history: data?.result || []
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
