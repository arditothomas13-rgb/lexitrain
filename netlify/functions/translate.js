export default async function handler(req, res) {
  try {
    const { word, fromLang, toLang } = req.body;

    if (!word) {
      return res.status(400).json({ error: "No word provided" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const prompt = `
Tu es un super dictionnaire premium (Oxford + Reverso).
Génère une fiche claire, concise et structurée pour le mot : "${word}"

Langue source : ${fromLang}
Langue cible : ${toLang}

Donne la réponse ICI EXACTEMENT dans ce format HTML :

<b>Traductions :</b><br>
• 2 à 5 traductions claires<br><br>

<b>Synonymes :</b><br>
• synonymes utiles dans la langue cible<br><br>

<b>Exemples :</b><br>
• phrase en ${fromLang} + traduction en ${toLang}<br>
• 2 à 4 exemples maximum<br><br>

Si le mot possède plusieurs sens (ex : “book” nom + “to book” verbe),
sépare les sections distinctement, toujours en HTML.
    `;

    // APPEL OPENAI
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      })
    });

    const data = await apiRes.json();

    return res.status(200).json({
      result: data.choices?.[0]?.message?.content || "Aucun résultat"
    });

  } catch (err) {
    console.error("Erreur translate.js :", err);
    return res.status(500).json({ error: err.message });
  }
}
