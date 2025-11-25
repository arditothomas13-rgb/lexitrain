// /api/dict-import.js
// ---------------------------------------------
// Import massifs pour dictionnaire Premium
// Input: POST JSON: [{ word, definition, translations... }]
// ---------------------------------------------

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "POST only" });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "Missing Upstash KV config" });
    }

    let batch = [];

    try {
        batch = req.body;
        if (!Array.isArray(batch)) {
            return res.status(400).json({ error: "Body must be an array" });
        }
    } catch {
        return res.status(400).json({ error: "Invalid JSON" });
    }

    // 1 — Ajout dans dict:WORD
    let imported = 0;
    let words = [];

    for (const entry of batch) {
        if (!entry.word) continue;

        const key = `dict:${entry.word.toLowerCase()}`;
        words.push(entry.word.toLowerCase());

        await fetch(`${KV_URL}/set/${key}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                value: JSON.stringify(entry)
            })
        });

        imported++;
    }

    // 2 — Mettre à jour wordlist:en
    const uniq = [...new Set(words)].sort();

    await fetch(`${KV_URL}/set/wordlist:en`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${KV_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ value: JSON.stringify(uniq) })
    });

    return res.status(200).json({
        status: "ok",
        imported,
        updatedWordlist: uniq.length
    });
}
