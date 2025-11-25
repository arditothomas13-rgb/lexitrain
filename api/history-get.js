import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    try {
        const hist = await kv.lrange("history", 0, -1);

        return res.status(200).json({
            entries: hist || []
        });

    } catch (err) {
        console.error("history-get.js error", err);
        res.status(500).json({ error: "Cannot read history" });
    }
}
