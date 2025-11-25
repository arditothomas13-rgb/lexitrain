// ------------------------------------------------------
//   LexiTrain — API kv-get.js
//   Lecture propre d'une clé KV (cache cloud)
//   Appelé par app.js avant GPT
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(400).json({
        error: "Missing 'key' parameter."
      });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing KV environment variables."
      });
    }

    // ------------------------------------------------------
    //  READ FROM KV
    // ------------------------------------------------------
    const response = await fetch(`${KV_URL}/get/${key}`, {
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`
      }
    });

    const data = await response.json();

    // Vercel KV returns:
    // { "result": "<string or null>" }
    // or error code
    return res.status(200).json({
      key,
      result: data.result || null
    });

  } catch (err) {
    console.error("KV GET ERROR:", err);

    return res.status(500).json({
      error: "Internal KV GET error"
    });
  }
}
