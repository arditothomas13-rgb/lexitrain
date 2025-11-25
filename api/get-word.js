// /api/get-word.js
// --------------------------------------------------------

export default async function handler(req, res) {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });

    const key = `word_${word.toLowerCase()}`;

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "Missing KV config" });
    }

    // 1️⃣ — ESSAYER DE LIRE EN KV
    try {
        const cloud = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        const data = await cloud.json();

        if (data?.result) {
            return res.status(200).json(JSON.parse(data.result));
        }
    } catch (err) {
        console.error("KV GET error:", err);
    }

    // 2️⃣ — FALLBACK GPT AVEC URL FIABLE
    try {
        // 🔥 URL correcte même en production
        const baseUrl = `https://${req.headers.host}`;

        const gpt = await fetch(
            `${baseUrl}/api/translate?word=${encodeURIComponent(word)}&from=en&to=fr`
        );

        const fresh = await gpt.json();

        // 3️⃣ — STOCKAGE EN KV
        await fetch(`${KV_URL}/set/${key}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fresh)
        });

        return res.status(200).json(fresh);

    } catch (err) {
        console.error("Translate fallback error:", err);
        return res.status(500).json({ error: "Unable to translate word" });
    }
}
