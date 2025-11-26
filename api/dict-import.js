// /api/dict-import.js
// Importe tous les mots du fichier premium100.json
// dans Upstash KV :
//   • dict:<word>
//   • wordlist:en
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    try {
        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        // Lecture du fichier JSON local
        const filePath = path.join(process.cwd(), "api", "premium100.json");
        const fileData = fs.readFileSync(filePath, "utf-8");
        const words = JSON.parse(fileData);

        if (!Array.isArray(words)) {
            return res.status(400).json({ error: "Invalid premium100.json format" });
        }

        const importedWords = [];

        for (const item of words) {
            if (!item || !item.word) continue;

            const word = item.word;
            const baseTranslations = Array.isArray(item.translations)
                ? item.translations
                : [];
            const baseExamples = Array.isArray(item.examples)
                ? item.examples
                : [];
            const baseSynonyms = Array.isArray(item.synonyms)
                ? item.synonyms
                : [];

            const entry = {
                label: item.label || "",
                definition: item.definition || "",
                translations: baseTranslations.length
                    ? baseTranslations
                    : (item.main_translation ? [item.main_translation] : []),
                examples: baseExamples,
                synonyms: baseSynonyms
            };

            const translations = entry.translations;
            const examples = entry.examples;
            const synonyms = entry.synonyms;

            const distractors = Array.isArray(item.distractors) && item.distractors.length
                ? item.distractors
                : translations.slice(1, 4);

            while (distractors.length < 3) {
                distractors.push("option incorrecte");
            }

            const dictEntry = {
                word,
                lang: "en",
                entries: [entry],
                definition: entry.definition || "",
                translations,
                main_translation: item.main_translation || translations[0] || "",
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
                console.error("DICT IMPORT KV ERROR for", word, ":", txt);
                return res.status(500).json({ error: "KV set error on word " + word });
            }

            importedWords.push(word);
        }

        // Mise à jour de la wordlist EN avec tous les mots importés
        const wordlistKey = "wordlist:en";
        importedWords.sort((a, b) => a.localeCompare(b));

        await fetch(`${KV_URL}/set/${wordlistKey}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(importedWords)
        });

        return res.status(200).json({
            status: "ok",
            count: importedWords.length
        });
    } catch (err) {
        console.error("DICT IMPORT error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
