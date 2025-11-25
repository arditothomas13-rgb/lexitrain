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
Tu es un moteur de dictionnaire professionnel.
Tu produis un JSON STRICT, jamais autre chose.
Jamais de markdown. Jamais de texte avant/après.

FORMAT FINAL EXACT :

{
  "senses": [
      {
        "label": "nom" ou "verbe" ou "expression",
        "translations": "<html propre>",
        "synonyms": "<html propre>",
        "examples": "<html propre>"
      }
  ]
}

RÈGLES :
- HTML ultra simple (<ul><li><b><br>).
- Chaque sens doit contenir AU MOINS 3 exemples bilingues.
- Style Apple minimal : phrases propres EN puis FR sur la ligne suivante.
- Exemples toujours en contexte réel.
- Si plusieurs sens existent → séparer proprement (ex: book : nom + verbe).
`;

    const userPrompt = `
Mot : "${word}"
Langue source : ${fromLang}
Langue cible : ${toLang}

Retourne uniquement le JSON strict demandé.
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

    let raw = data.choices[0].message.content.trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("JSON introuvable :", raw);
      return res.status(500).json({ ok: false, error: "Format JSON invalide." });
    }

    const json = JSON.parse(match[0]);

    return res.status(200).json({ ok: true, word, ...json });

  } catch (err) {
    console.error("Erreur serveur:", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}
