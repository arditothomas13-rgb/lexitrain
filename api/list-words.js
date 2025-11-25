// ------------------------------------------------------
//  API — list-words.js
//  Returns alphabetically sorted list of saved words
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const result = await fetch(`${KV_URL}/keys`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await result.json();

    let keys = Array.isArray(data?.result) ? data.result : [];

    keys = keys.sort((a, b) => a.localeCompare(b));

    return res.status(200).json({ words: keys });

  } catch (err) {
    console.error("LIST WORDS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
