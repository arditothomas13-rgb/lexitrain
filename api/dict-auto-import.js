// /api/dict-auto-import.js

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(400).json({ error: "POST only" });
    }

    try {
        // 1) Charger dict-premium.json correctement (méthode compatible Vercel)
        const filePath = path.join(process.cwd(), "data", "dict-premium.json");
        const raw = fs.readFileSync(filePath, "utf8");
        const words = JSON.parse(raw);

        if (!Array.isArray(words)) {
            return res.status(400).json({ error: "JSON must be an array" });
        }

        let imported = 0;

        // 2) Pour chaque mot → injecter dans Upstash KV
        for (const entry of words) {
            const key = `dict:${entry.word.toLowerCase()}`;

            await fetch(process.env.KV_REST_API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    key,
                    value: JSON.stringify(entry)
                })
            });

            imported++;
        }

        // 3) Succès 🎉
        return res.status(200).json({
            ok: true,
            imported
        });

    } catch (err) {
        console.error("IMPORT ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
}
