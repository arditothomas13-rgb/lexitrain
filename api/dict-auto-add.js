export default async function handler(req, res) {
    try {
        const { word, entries } = req.body || {};

        if (!word || !entries || !entries[0]) {
            return res.status(400).json({ error: "Missing word or entries" });
        }

        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        const entry = entries[0];

        const translations = Array.isArray(entry.translations)
            ? entry.translations
            : [];

        const examples = Array.isArray(entry.examples)
            ? entry.examples
            : [];

        const synonyms = Array.isArray(entry.synonyms)
            ? entry.synonyms
            : [];

        // Distracteurs pour le quiz
        const distractors = translations.slice(1, 4);
        while (distractors.length < 3) distractors.push("option incorrecte");

        const dictEntry = {
            word,
            lang: "en",   // dico anglais

            // On garde TOUTES les entrées (tous les sens, déf, ex, synonymes)
            entries,

            // Champs "plats" pour compatibilité (quiz, anciennes routes…)
            definition: entry.definition || "",
            translations,
            main_translation: translations[0] || "",
            examples,
            synonyms,
            distractors
        };

        const key = `dict:${word.toLowerCase()}`;

        const resp = await fetch(`${KV_URL}/set/${key}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dictEntry)
        });

        if (!resp.ok) {
            const txt = await resp.text();
            console.error("DICT AUTO ADD KV ERROR:", txt);
            return res.status(500).json({ error: "KV set error" });
        }

        return res.status(200).json({ status: "added", dictEntry });
    } catch (err) {
        console.error("DICT AUTO ADD error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
