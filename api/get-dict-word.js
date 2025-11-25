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

        // Rien trouvé → format propre
        if (!json || !json.result) {
            return res.status(200).json({
                word,
                main_translation: "",
                translations: [],
                examples: [],
                distractors: [],
                error: "Not found"
            });
        }

        let parsed = {};
        try {
            parsed = JSON.parse(json.result);
        } catch {
            return res.status(200).json({
                word,
                main_translation: "",
                translations: [],
                examples: [],
                distractors: [],
                error: "Invalid JSON"
            });
        }

        // Normalisation stricte — TOUT est garanti
        return res.status(200).json({
            word: parsed.word || word,
            main_translation: parsed.main_translation || "",
            translations: Array.isArray(parsed.translations)
                ? parsed.translations
                : [],
            examples: Array.isArray(parsed.examples)
                ? parsed.examples
                : [],
            distractors: Array.isArray(parsed.distractors)
                ? parsed.distractors
                : []
        });

    } catch (err) {
        console.error("DICT FETCH ERROR", err);
        return res.status(500).json({ error: "Server error" });
    }
}
