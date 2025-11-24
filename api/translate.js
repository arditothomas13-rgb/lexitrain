export default async function handler(req, res) {
  try {
    const { word, fromLang, toLang } = req.body || {};

    if (!word) {
      return res.status(400).json({ error: "Missing word" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const prompt = `
Dictionnaire professionnel type Oxford/Reverso.

Mot : "${word}"
Source : ${fromLang}
Cible : ${toLang}

Donne UNIQUEMENT du HTML :

<b>Traductions :</b><br>
• ...<br><br>

<b>Synonymes :</b><br>
• ...<br><br>

<b>Exemples :</b><br>
• phrase ${fromLang} + traduction ${toLang}<br><br>

Plusieurs sens → sépare les sections.
Réponses courtes et propres.
    `;

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.2
      })
    });

    const data = await apiRes.json();

    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      return res.status(500).json({ error: "OpenAI returned no result" });
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error("Erreur translate.js :", err);
    return res.status(500).json({ error: err.message });
  }
}
