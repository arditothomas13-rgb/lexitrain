import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    try {
        // Liste toutes les clés KV
        const keys = await kv.keys("word:*");

        const words = keys.map(k => k.replace("word:", ""));

        return res.status(200).json({ words });

    } catch (err) {
        console.error("list-words.js error", err);
        res.status(500).json({ error: "Unable to fetch dictionary" });
    }
}
