// /api/dict-auto-add.js
export default async function handler(req, res) {
    try {
        let body = req.body || {};

        // Vercel peut envoyer le body en string
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

        const dictLang = lang === "fr" ? "fr" : "en";

        const first = entries[0];

        const translations = Array.isArray(first.translations)
            ? first.translations
            : [];

        const examples = Array.isArray(first.examples)
            ? first.examples
            : [];

        const synonyms = Array.isArray(first.synonyms)
            ? first.synonyms
            : [];

        // Distracteurs pour le quiz
        const distractors = translations.slice(1, 4);
        while (distractors.length < 3) {
            distractors.push("option incorrecte");
        }

        const dictEntry = {
            word,
            lang: dictLang,
            entries,
            definition: first.definition || "",
            translations,
            main_translation: translations[0] || "",
            examples,
            synonyms,
            distractors
        };

        const key = `dict:${word.toLowerCase()}`;

        // Sauvegarde de l'entrée complète
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

        // Mise à jour de la wordlist correspondante
        const wordlistKey = `wordlist:${dictLang}`;

        try {
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

            if (!list.includes(word)) {
                list.push(word);
            }

            list = list.filter(w => typeof w === "string" && w.trim().length > 0);
            list.sort((a, b) => a.localeCompare(b));

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
        }

        return res.status(200).json({ status: "added", dictEntry });
    } catch (err) {
        console.error("DICT AUTO ADD error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
