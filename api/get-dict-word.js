// /api/get-dict-word.js
// ------------------------------------------------------
// Retourne un mot PREMIUM depuis Upstash KV
// dict:word → { main_translation, translations, examples, distractors }
// ------------------------------------------------------

export default async function handler(req, res) {
    const word = req.query.word;
    if (!word) {
        return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const key = `dict:${word.toLowerCase()}`;

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "Missing KV config" });
    }

    try {
        const cloud = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        const json = await cloud.json();

        if (!json || !json.result) {
            return res.status(200).json({ error: "Not found" });
        }

        const parsed = JSON.parse(json.result);

        // Normalisation (au cas où)
        return res.status(200).json({
            word: parsed.word,
            main_translation: parsed.main_translation,
            translations: parsed.translations || [],
            distractors: parsed.distractors || [],
            examples: parsed.examples || []
        });

    } catch (err) {
        console.error("DICT FETCH ERROR", err);
        return res.status(500).json({ error: "Server error" });
    }
}
