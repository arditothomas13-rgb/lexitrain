export default async function handler(req, res) {
    const { word, from, to } = req.query;

    if (!word) return res.status(400).json({ error: "Missing word" });

    try {
        const base = `https://${req.headers.host}`;

        const gpt = await fetch(
            `${base}/api/translate?word=${encodeURIComponent(word)}&from=${from || "en"}&to=${to || "fr"}`
        );

        const fresh = await gpt.json();

        // Auto enrichissement du DICT
        await fetch(`${base}/api/dict-auto-add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, entries: fresh.entries })
        });

        return res.status(200).json(fresh);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Translation error" });
    }
}
