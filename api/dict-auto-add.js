// /api/dict-auto-add.js
export default async function handler(req, res) {
    try {
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

        const distractors = translations.slice(1, 4);
        while (distractors.length < 3) distractors.push("option incorrecte");

        const dictEntry = {
            word,
            lang: dictLang,
            entries,

            definition: entry.definition || "",
            translations,
            main_translation: translations[0] || "",
            examples,
            synonyms,
            distractors
        };

        const dictKey = `dict:${word.toLowerCase()}`;

        // 1) Sauvegarde de la fiche complète
        const resp = await fetch(`${KV_URL}/set/${dictKey}`, {
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

        // 2) Mise à jour de wordlist:<lang> = ["mot1","mot2",...]
        const wordlistKey = `wordlist:${dictLang}`;
        let list = [];

        try {
            const wlResp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`
                }
            });

            const wlData = await wlResp.json();
            if (wlData && wlData.result) {
                try {
                    const parsed = JSON.parse(wlData.result);
                    if (Array.isArray(parsed)) {
                        list = parsed;
                    }
                } catch {
                    list = [];
                }
            }
        } catch (e) {
            console.error("WORDLIST GET ERROR:", e);
        }

        if (!Array.isArray(list)) list = [];
        if (!list.includes(word)) list.push(word);

        list.sort((a, b) => a.localeCompare(b));

        try {
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
