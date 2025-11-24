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
Tu es un moteur de dictionnaire très structuré.
Tu dois produire STRICTEMENT du JSON.
Jamais de texte autour. Jamais de Markdown.
Format JSON OBLIGATOIRE :

{
  "translations": "<html propre>",
  "definitions": "<html propre>",
  "synonyms": "<html propre>",
  "examples": "<html propre>"
}

Règles :
- Pas de \`\`\`.
- Pas de texte avant ou après le JSON.
- Utilise du HTML simple : <ul><li><b><br>.
- Toujours retourner toutes les clés, même vides.
`;

    const userPrompt = `
Mot : "${word}"
Langue source : ${fromLang}
Langue cible : ${toLang}

Retourne :
- traductions
- définitions
- synonymes
- exemples (bilingues)
EN JSON STRICT.
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

    // Vérification robuste
    if (!data.choices || !data.choices[0]) {
      console.error("Réponse OpenAI invalide :", data);
      return res.status(500).json({ ok: false, error: "Erreur API OpenAI." });
    }

    // Extraction du contenu
    let raw = data.choices[0].message.content.trim();

    // Sécurisation du JSON (cas : texte parasite → extraction via regex)
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("JSON introuvable :", raw);
      return res.status(500).json({ ok: false, error: "Format JSON invalide." });
    }

    const json = JSON.parse(match[0]);

    return res.status(200).json({
      ok: true,
      word,
      ...json
    });

  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}
