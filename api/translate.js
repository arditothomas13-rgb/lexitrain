export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Méthode non autorisée." });
    }

    const { word, fromLang, toLang } = req.body;

    if (!word) {
      return res.status(400).json({ ok: false, error: "Mot manquant." });
    }

    const systemPrompt = `
Tu es un moteur de dictionnaire. Retourne du JSON strict :

{
  "translations": "<html>",
  "definitions": "<html>",
  "synonyms": "<html>",
  "examples": "<html>"
}

PAS de texte autour.
`;

    const userPrompt = `
Mot : "${word}"
Source : ${fromLang}
Cible : ${toLang}

Retourne traductions, définitions, synonymes, exemples.
Format JSON STRICT, une seule réponse, pas de markdown.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ ok: false, error: "Réponse OpenAI invalide." });
    }

    const raw = data.choices[0].message.content.trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ ok: false, error: "JSON invalide." });
    }

    const json = JSON.parse(match[0]);

    return res.status(200).json({ ok: true, word, ...json });

  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({ ok: false, error: "Erreur fatale." });
  }
}
