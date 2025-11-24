import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { word, fromLang, toLang } = req.body;

    if (!word) {
      return res.status(400).json({ error: "Aucun mot fourni." });
    }

    // Sécurité : clé dans Vercel
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Nouveau PROMPT SUPER PROPRE
    const prompt = `
Tu es un dictionnaire professionnel (Reverso + Cambridge + Larousse).
Réponds UNIQUEMENT en HTML, sans backticks, sans bloc de code.

Mot : "${word}" (${fromLang} → ${toLang})

Structure OBLIGATOIRE :

<div class="entry">
  <h2>Traductions</h2>
  <ul>
    <li>...</li>
  </ul>

  <h2>Synonymes</h2>
  <ul>
    <li>...</li>
  </ul>

  <h2>Exemples</h2>
  <ul>
    <li>Phrase source.<br>↳ Traduction.</li>
  </ul>

  <h2>Autres sens</h2>
  <div class="sense">
    <h3>Sens alternatif</h3>
    <ul><li>…</li></ul>
    <h4>Exemples</h4>
    <ul><li>…</li></ul>
  </div>
</div>

RÈGLES STRICTES :
- Toujours donner au minimum : 3 traductions, 3 synonymes, 1 exemple
- S’il existe plusieurs sens : les séparer nettement
- Jamais de texte hors HTML
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.2
    });

    const html = completion.choices?.[0]?.message?.content || "";

    res.status(200).json({ result: html });
  } catch (error) {
    console.error("Erreur API :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}
