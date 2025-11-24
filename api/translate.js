export default async function handler(req, res) {
  try {
    const { word, fromLang, toLang } = req.body || {};

    if (!word) {
      return res.status(400).json({ error: "Missing word" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const prompt = `
Dictionnaire premium. Mot : "${word}".
Langue source : ${fromLang}, langue cible : ${toLang}.

Format HTML obligatoire :

<b>Traductions :</b><br>
• …<br><br>

<b>Synonymes :</b><br>
• …<br><br>

<b>Exemples :</b><br>
• phrase ${fromLang} + traduction ${toLang}<br><br>

Si plusieurs sens → sépare en sections.
Réponses courtes, précises, type Oxford/Reverso.
    `;

    const apiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-translate",
        input: prompt,
        max_output_tokens: 400
      })
    });

    const data = await apiRes.json();

    const result =
      data.output_text ||
      data?.output[0]?.content[0]?.text ||
      "Aucun résultat.";

    return res.status(200).json({ result });

  } catch (err) {
    console.error("Erreur API :", err);
    return res.status(500).json({ error: err.message });
  }
}
