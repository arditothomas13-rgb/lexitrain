// ------------------------------------------------------
//  API — get-word.js (FIXED)
//  Returns full dictionary entry for a given word
// ------------------------------------------------------
export default async function handler(req, res) {
  try {
    const word = req.query.word?.toLowerCase();

    if (!word) {
      return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const result = await fetch(`${KV_URL}/get/${word}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await result.json();

    if (!data?.result) {
      return res.status(404).json({ error: "Word not found in dictionary" });
    }

    // data.result is a STRING → must parse!
    const parsed = JSON.parse(data.result);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("GET WORD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
