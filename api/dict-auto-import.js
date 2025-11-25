// /api/dict-auto-import.js
// ------------------------------------------------------
// Importe automatiquement la base PREMIUM depuis /data/dict-premium.json
// et pousse chaque entrée dans Upstash KV.
// ------------------------------------------------------

import dictPremium from "../data/dict-premium.json";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(400).json({ error: "POST only" });
    }

    try {
        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        if (!Array.isArray(dictPremium)) {
            return res.status(500).json({ error: "dict-premium.json is not a valid array" });
        }

        // Import all words
        for (const entry of dictPremium) {
            const key = `dict:${entry.word.toLowerCase()}`;

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
        }

        return res.status(200).json({
            ok: true,
            imported: dictPremium.length
        });

    } catch (err) {
        console.error("AUTO IMPORT ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
}
