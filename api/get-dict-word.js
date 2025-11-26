// /api/get-dict-word.js
// ------------------------------------------------------
// Retourne un mot du dictionnaire depuis Upstash KV
// dict:<word> → { main_translation, translations, examples, distractors, entries… }
// ------------------------------------------------------

export default async function handler(req, res) {
    try {
        const word = req.query.word;

        if (!word) {
            return res.status(400).json({ error: "Missing 'word' parameter" });
        }

        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        const key = `dict:${word.toLowerCase()}`;

        const resp = await fetch(`${KV_URL}/get/${key}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`
            }
        });

        const data = await resp.json();

        if (!data || !data.result) {
            return res.status(404).json({ error: "Word not found" });
        }

        let parsed = {};
        try {
            parsed = JSON.parse(data.result);
        } catch (e) {
            console.error("GET DICT WORD parse error:", e);
        }

        const entries = Array.isArray(parsed.entries) && parsed.entries.length
            ? parsed.entries
            : [{
                label: parsed.label || "",
                definition: parsed.definition || "",
                translations: Array.isArray(parsed.translations)
                    ? parsed.translations
                    : (parsed.main_translation ? [parsed.main_translation] : []),
                examples: Array.isArray(parsed.examples) ? parsed.examples : [],
                synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : []
            }];

        return res.status(200).json({
            word: parsed.word || word,
            lang: parsed.lang || "en",
            definition: parsed.definition || "",
            translations: Array.isArray(parsed.translations) ? parsed.translations : [],
            main_translation: parsed.main_translation || (parsed.translations && parsed.translations[0]) || "",
            examples: Array.isArray(parsed.examples) ? parsed.examples : [],
            synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
            distractors: Array.isArray(parsed.distractors) ? parsed.distractors : [],
            entries
        });
    } catch (err) {
        console.error("DICT FETCH ERROR", err);
        return res.status(500).json({ error: "Server error" });
    }
}
