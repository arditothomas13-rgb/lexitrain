// ------------------------------------------------------
//  Vercel API — translate.js
//  Version 100% dynamique (OpenAI → multi-sens entries)
// ------------------------------------------------------

export default async function handler(req, res) {
  const word = req.query.word;

  if (!word) {
    return res.status(400).json({ error: "Missing 'word' parameter" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in server environment."
    });
  }

  // ---------------------------------------------------
  // PROMPT STRICT POUR FORCER LE FORMAT 'entries'
  // ---------------------------------------------------
  const prompt = `
You are an advanced dictionary engine (Oxford + Cambridge + Reverso).

For the word: "${word}"

Return ONLY valid JSON with this exact structure:

{
  "entries": [
    {
      "label": "book (noun)",
      "definition": "a written work...",
      "translations": ["...", "..."],
      "examples": [
        { "src": "...", "dest": "..." },
        { "src": "...", "dest": "..." }
      ],
      "synonyms": ["...", "...", "..."]
    },
    {
      "label": "to book (verb)",
      "definition": "to reserve...",
      "translations": ["...", "..."],
      "examples": [
        { "src": "...", "dest": "..." },
        { "src": "...", "dest": "..." }
      ],
      "synonyms": ["...", "...", "..."]
    }
  ]
}

Rules:
- Always detect whether the word is English or French.
- If English → definitions & synonyms must be in English; translations in French.
- If French → definitions & synonyms must be in French; translations in English.
- If multiple senses exist, return multiple entries.
- "label" must follow the format: "book (noun)" or "to run (verb)" etc.
- Definitions MUST be short and in the source language.
- Examples MUST be: one sentence in the source language + translation in the target language.
- No text outside JSON. No explanations. No comments.
`;

  try {
    // ---------------------------------------------------
    // APPEL À OPENAI
    // ---------------------------------------------------
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You return ONLY valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    const data = await completion.json();

    const raw = data.choices?.[0]?.message?.content || "{}";

    // ---------------------------------------------------
    // PARSING JSON
    // ---------------------------------------------------
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: raw
      });
    }

    // ---------------------------------------------------
    // OK → renvoyer la réponse propre
    // ---------------------------------------------------
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("GPT API ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
