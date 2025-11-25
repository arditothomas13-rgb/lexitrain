import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    try {
        const word = req.query.word?.toLowerCase().trim();
        if (!word) {
            return res.status(400).json({ error: "Missing word" });
        }

        // Prompt structuré pour ton format spécifique LexiTrain
        const prompt = `
Tu es un dictionnaire type Reverso/WordReference.
Analyse le mot : "${word}"

Retourne EXACTEMENT ce JSON :

{
  "entries": [
    {
      "label": "Nom — livre",
      "definition": "définition brève",
      "translations": ["translation1", "translation2"],
      "examples": [
        { "src": "phrase source", "dest": "traduction" }
      ],
      "synonyms": ["syn1", "syn2"]
    }
  ]
}

Jamais de texte autour, uniquement du JSON valide.
        `;

        const openaiRes = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: prompt
            })
        });

        const ai = await openaiRes.json();
        const jsonText = ai.output_text || "{}";

        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            return res.status(500).json({
                error: "Invalid JSON returned by the AI",
                raw: jsonText
            });
        }

        // Sauvegarde KV
        await kv.set(`word:${word}`, parsed.entries);

        return res.status(200).json(parsed);

    } catch (err) {
        console.error("translate.js error", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
