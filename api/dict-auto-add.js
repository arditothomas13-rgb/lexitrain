// /api/dict-auto-add.js
export default async function handler(req, res) {
    try {
        // Vercel peut envoyer le body déjà parsé ou en string
        let body = req.body || {};

        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch {
                return res.status(400).json({ error: "Invalid JSON body" });
            }
        }

        const { word, entries, lang } = body;

        if (!word || !entries || !entries[0]) {
            return res.status(400).json({ error: "Missing word or entries" });
        }

        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        // 🌍 Langue du mot : "en" ou "fr" (par défaut en)
        const dictLang = lang === "fr" ? "fr" : "en";

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
        while (distractors.length < 3) {
            distractors.push("option incorrecte");
        }

        const dictEntry = {
            word,
            lang: dictLang,
            entries, // on garde tous les sens

            // Champs "plats" pour compatibilité (quiz, anciennes routes…)
            definition: entry.definition || "",
            translations,
            main_translation: translations[0] || "",
            examples,
            synonyms,
            distractors
        };

        const key = `dict:${word.toLowerCase()}`;

        // 1️⃣ On enregistre la fiche complète dans KV
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

        // 2️⃣ On met à jour la wordlist correspondante (EN ou FR)
        const wordlistKey = `wordlist:${dictLang}`;

        try {
            // On récupère l'ancienne liste
            const listResp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`
                }
            });

            let listData = await listResp.json();
            let list = [];

            if (listData && listData.result) {
                try {
                    const parsed = JSON.parse(listData.result);
                    if (Array.isArray(parsed)) {
                        list = parsed;
                    }
                } catch (e) {
                    console.error("WORDLIST PARSE ERROR:", e);
                }
            }

                        // Fonction de normalisation identique à /api/list-words.js
            const normalize = (w) => {
                if (!w) return "";
                let lw = w.toLowerCase().trim();

                if (dictLang === "en") {
                    if (lw.length > 3 && lw.endsWith("s") && !lw.endsWith("ss")) {
                        lw = lw.slice(0, -1);
                    }
                }

                return lw;
            };

            const newKey = normalize(word);

            // On vérifie s'il existe déjà un mot "équivalent"
            const exists = list.some(w => normalize(w) === newKey);

            if (!exists) {
                list.push(word);
            }

            list = list
                .filter(w => typeof w === "string" && w.trim().length > 0)
                .sort((a, b) => a.localeCompare(b));


            // On sauvegarde la nouvelle liste
            await fetch(`${KV_URL}/set/${wordlistKey}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(list)
            });
        } catch (e) {
            console.error("WORDLIST SET ERROR:", e);
            // on n'échoue pas la requête juste pour la wordlist
        }

        return res.status(200).json({ status: "added", dictEntry });
    } catch (err) {
        console.error("DICT AUTO ADD error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
