export default async function handler(req, res) {
    const { word, entries } = req.body;

    if (!word || !entries || !entries[0]) {
        return res.status(400).json({ error: "Missing word or entries" });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    const entry = entries[0];

    // DISTRACTEURS automatiques basés sur GPT
    const distractors = entry.translations.slice(1, 4);
    while (distractors.length < 3) distractors.push("option incorrecte");

    const dictEntry = {
        word,
        lang: "en",
        definition: entry.definition || "",
        translations: entry.translations || [],
        main_translation: entry.translations[0],
        distractors
    };

    const key = `dict:${word.toLowerCase()}`;

    try {
        await fetch(`${KV_URL}/set/${key}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dictEntry)
        });

        return res.status(200).json({ status: "added", dictEntry });
    } catch (err) {
        console.error("DICT AUTO ADD error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
