export default async function handler(req, res) {
  try {
    // IMPORTANT : Vercel parse automatiquement le JSON
    const { word, fromLang, toLang } = req.body || {};

    if (!word) {
      return res.status(400).json({ error: "Missing 'word' in body" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing API Key" });
    }

    const prompt = `
Tu es un dictionnaire premium. Pour le mot "${word}", produis :

<b>Traductions :</b><br>
• 2 à 5 traductions<br><br>

<b>Synonymes :</b><br>
• synonymes utiles<br><br>

<b>Exemples :</b><br>
• phrase en ${fromLang} + traduction ${toLang}<br><br>

Sépare les sens s'il y en a plusieurs.
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
        max_tokens: 500
      })
    });

    const data = await apiRes.json();

    return res.status(200).json({
      result: data.choices?.[0]?.message?.content || "Aucun résultat"
    });

  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: err.message });
  }
}
