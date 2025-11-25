// ------------------------------------------------------
//  Vercel API Route — translate.js
//  GPT → Multi-sense Dictionary Output (JSON strict)
// ------------------------------------------------------

export default async function handler(req, res) {
  const word = req.query.word;

  // -------------------------------------------
  // Validate query
  // -------------------------------------------
  if (!word) {
    return res.status(400).json({ error: "Missing 'word' parameter" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in Vercel environment variables."
    });
  }

  // -------------------------------------------
  // STRICT DICTIONARY PROMPT
  // -------------------------------------------
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
- Auto-detect if input is EN or FR.
- If English → definitions & synonyms in EN, translations in FR.
- If French → definitions & synonyms in FR, translations in EN.
- Multiple senses → multiple entries.
- "label" must follow the format: "run (verb)" or "maison (nom)".
- Definitions MUST be short, in the source language.
- Examples MUST be: sentence in source + translated sentence.
- No explanation, no comments, no introduction, no text outside JSON.
`;

  try {
    // -------------------------------------------
    // CALL OPENAI
    // -------------------------------------------
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You return ONLY valid JSON. No explanations." },
          { role: "user", content: prompt }
        ],
        max_tokens: 700,
        temperature: 0.3
      })
    });

    const data = await completion.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    // -------------------------------------------
    // PARSE JSON SAFELY
    // -------------------------------------------
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({
        error: "Model returned invalid JSON.",
        raw: raw
      });
    }

    // -------------------------------------------
    // RETURN CLEAN JSON
    // -------------------------------------------
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("GPT API ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
