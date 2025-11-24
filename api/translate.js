export default async function handler(req, res) {
  try {
    const { word, fromLang, toLang } = req.body;

    const prompt = `
Analyse le mot : "${word}"

Retourne STRICTEMENT ce JSON (pas d'autre texte hors JSON) :

{
  "translations": "HTML propre et concis",
  "definitions": "HTML propre, simple, ou vide si aucune",
  "synonyms": "HTML propre, simple, ou vide si aucun",
  "examples": "HTML propre avec phrases bilingues"
}

Rappels :
- Pas de markdown.
- Pas de \`\`\`.
- Juste du HTML simple (<ul><li>, <b>, <br>...).
    `;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await openaiRes.json();

    const json = JSON.parse(data.choices[0].message.content.trim());

    res.status(200).json({
      ok: true,
      word,
      ...json
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}
