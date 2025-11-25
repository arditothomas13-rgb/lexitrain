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
              // Normalisation stricte — TOUT est garanti

        // 1) Construire un tableau d'entries homogène
        let entries = [];

        if (Array.isArray(parsed.entries) && parsed.entries.length) {
            // Cas "moderne" : on a déjà entries en base
            entries = parsed.entries.map(e => ({
                label: e.label || "",
                definition: e.definition || "",
                translations: Array.isArray(e.translations) ? e.translations : [],
                examples: Array.isArray(e.examples) ? e.examples : [],
                synonyms: Array.isArray(e.synonyms) ? e.synonyms : []
            }));
        } else {
            // Cas "ancien" : on reconstruit une seule entrée à partir des champs plats
            entries = [{
                label: "",
                definition: parsed.definition || "",
                translations: Array.isArray(parsed.translations) ? parsed.translations : [],
                examples: Array.isArray(parsed.examples) ? parsed.examples : [],
                synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : []
            }];
        }

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
                : [],
            entries   // 👈 très important pour réutiliser l'UI
        });


    } catch (err) {
        console.error("DICT FETCH ERROR", err);
        return res.status(500).json({ error: "Server error" });
    }
}
