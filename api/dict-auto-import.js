// /api/dict-auto-import.js
//-------------------------------------------------------

import dict from "../data/dict-premium.json";

export default async function handler(req, res) {
    try {
        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        if (!Array.isArray(dict)) {
            return res.status(400).json({ error: "Invalid dict format" });
        }

        let imported = 0;

        // Importer chaque mot vers KV
        for (const entry of dict) {
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

            imported++;
            await new Promise(r => setTimeout(r, 30)); // anti rate-limit
        }

        // Mettre à jour la wordlist EN
        const words = dict.map(e => e.word.toLowerCase());

        await fetch(`${KV_URL}/set/wordlist:en`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                value: JSON.stringify(words)
            })
        });

        return res.status(200).json({
            ok: true,
            imported,
            message: "Premium dict imported successfully."
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
