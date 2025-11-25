import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    try {
        const word = req.query.word?.trim();
        if (!word) {
            return res.status(400).json({ error: "Missing word" });
        }

        // Ajout en haut de liste
        await kv.lpush("history", word);

        // Limite à 10
        await kv.ltrim("history", 0, 9);

        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error("history-add.js error", err);
        res.status(500).json({ error: "Error adding to history" });
    }
}
