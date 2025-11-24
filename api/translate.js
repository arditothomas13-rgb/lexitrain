export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const { word, fromLang, toLang } = req.body;

    if (!word) {
      return res.status(400).json({ error: "Aucun mot fourni." });
    }

    // Sécurité : vérifier la clé OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Clé OpenAI manquante." });
    }

    // ----------- PROMPT PREMIUM -----------
    const prompt = `
Tu es un dictionnaire premium (Oxford + Reverso + Larousse).

Génère une FICHE LEXICALE structurée en HTML pour le mot : "${word}"

Format EXACT OBLIGATOIRE (ne rajoute pas \`\`\`html !) :

<b>Traductions :</b><br>
• liste de traductions principales<br><br>

<b>Synonymes :</b><br>
• liste courte<br><br>

<b>Exemples :</b><br>
• phrase en ${fromLang} + traduction en ${toLang}<br>
• 2 à 4 exemples<br><br>

Si le mot a plusieurs sens (nom + verbe), sépare-les clairement.
    `;

    // ---------- APPEL OPENAI ----------
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: 0.4
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Réponse OpenAI invalide." });
    }

    const result = data.choices[0].message.content;

    return res.status(200).json({ result });

  } catch (err) {
    console.error("Erreur API :", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
