// /api/dict-import.js
import premiumWords from "../../premium100.json";

export default async function handler(req, res) {
    try {
        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        const wordlist = [];

        for (const item of premiumWords) {
            const word = item.word;
            if (!word) continue;

            const translations = Array.isArray(item.translations)
                ? item.translations
                : [];

            const examplesEn = Array.isArray(item.examples)
                ? item.examples
                : [];

            const examplesFr = Array.isArray(item.examples_fr)
                ? item.examples_fr
                : [];

            const synonyms = Array.isArray(item.synonyms)
                ? item.synonyms
                : [];

            const distractors = Array.isArray(item.distractors)
                ? item.distractors
                : [];

            const examples = examplesEn.map((src, idx) => ({
                src,
                dest: examplesFr[idx] || ""
            }));

            const definition = item.definition || "";

            const entry = {
                label: item.label || "",       // optionnel
                definition,
                translations,
                examples,
                synonyms
            };

            const dictEntry = {
                word,
                lang: "en",       // pack premium anglais

                entries: [entry],

                definition,
                translations,
                main_translation: item.main_translation || translations[0] || "",
                examples,
                synonyms,
                distractors
            };

            const dictKey = `dict:${word.toLowerCase()}`;

            await fetch(`${KV_URL}/set/${dictKey}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dictEntry)
            });

            if (!wordlist.includes(word)) {
                wordlist.push(word);
            }
        }

        // On stocke une wordlist EN propre : ["accept","achieve",...]
        wordlist.sort((a, b) => a.localeCompare(b));

        await fetch(`${KV_URL}/set/wordlist:en`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(wordlist)
        });

        return res.status(200).json({ status: "ok", count: wordlist.length });
    } catch (err) {
        console.error("DICT IMPORT error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
