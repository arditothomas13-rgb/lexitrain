if (!word || !entries || !entries[0]) {
    return res.status(400).json({ error: "Missing word or entries" });
}
``` :contentReference[oaicite:1]{index=1}  

Donc : **erreur 400 côté API**, rien n’est enregistré en base →  
les nouveaux mots que tu traduis n’apparaissent plus dans le Dico (même si tout s’affiche bien côté traduction, parce que ça vient d’un autre cache `kv-get`).

---

## ✅ Étape 1 — Rendre `dict-auto-add` compatible avec les deux formats

On va faire en sorte que l’API :

- accepte **soit** `{ word, entries }` (nouveau format),
- **soit** `{ word, definition, translations, examples, synonyms }` (ancien format),
- reconstruise toujours un tableau `entries` propre,
- puis enregistre normalement.

👉 Sur GitHub, ouvre **`api/dict-auto-add.js`**  
👉 Remplace **tout le fichier** par ceci :

```js
export default async function handler(req, res) {
    try {
        const body = req.body || {};
        const { word } = body;

        if (!word) {
            return res.status(400).json({ error: "Missing word" });
        }

        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        // 1️⃣ Normaliser entries (nouveau + ancien format)
        let entries = [];

        if (Array.isArray(body.entries) && body.entries.length) {
            // Nouveau format déjà correct
            entries = body.entries;
        } else {
            // Ancien format : on reconstruit UNE entrée à partir des champs "plats"
            const definition = body.definition || "";

            let translations = [];
            if (Array.isArray(body.translations)) {
                translations = body.translations;
            } else if (typeof body.translations === "string" && body.translations) {
                translations = [body.translations];
            }

            const examples = Array.isArray(body.examples)
                ? body.examples
                : body.examples
                ? [body.examples]
                : [];

            const synonyms = Array.isArray(body.synonyms)
                ? body.synonyms
                : body.synonyms
                ? [body.synonyms]
                : [];

            entries = [
                {
                    label: body.label || "",
                    definition,
                    translations,
                    examples,
                    synonyms
                }
            ];
        }

        if (!entries[0]) {
            return res.status(400).json({ error: "No valid entries" });
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

        // 2️⃣ Distracteurs pour le quiz
        const distractors = translations.slice(1, 4);
        while (distractors.length < 3) distractors.push("option incorrecte");

        // 3️⃣ Objet complet enregistré dans KV
        const dictEntry = {
            word,
            lang: body.lang || "en",
            entries, // toutes les entrées complètes

            // Champs plats pour compatibilité
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
