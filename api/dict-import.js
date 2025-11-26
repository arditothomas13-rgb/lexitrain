// /api/dict-import.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    try {
        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        // 1) On lit le fichier premium100.json situé dans le dossier /api
        const filePath = path.join(process.cwd(), "api", "premium100.json");
        const fileData = fs.readFileSync(filePath, "utf-8");
        const json = JSON.parse(fileData);

        // 2) On en déduit une liste de mots
        let words = [];

        if (Array.isArray(json)) {
            // Cas 1 : ["accept","achieve",...]
            if (typeof json[0] === "string") {
                words = json;
            } else {
                // Cas 2 : [{ word: "accept", ...}, ...]
                words = json
                    .map(item => item && item.word)
                    .filter(Boolean);
            }
        } else if (Array.isArray(json.words)) {
            // Cas 3 : { "words": ["accept","achieve",...] }
            const arr = json.words;
            if (typeof arr[0] === "string") {
                words = arr;
            } else {
                words = arr
                    .map(item => item && item.word)
                    .filter(Boolean);
            }
        }

        // Nettoyage + tri
        words = Array.from(new Set(words))  // enlève les doublons
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        // 3) On stocke ça dans la wordlist EN de Redis
        const resp = await fetch(`${KV_URL}/set/wordlist:en`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(words)
        });

        if (!resp.ok) {
            const txt = await resp.text();
            console.error("DICT IMPORT KV ERROR:", txt);
            return res.status(500).json({ error: "KV set error" });
        }

        return res.status(200).json({ status: "ok", count: words.length });
    } catch (err) {
        console.error("DICT IMPORT error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
