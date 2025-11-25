// ------------------------------------------------------
//  Vercel API Route — translate.js
//  GPT → Multi-sense Dictionary Output (JSON strict)
//  + Save result to Vercel KV
// ------------------------------------------------------

export default async function handler(req, res) {
  const word = req.query.word?.toLowerCase();

  if (!word) {
    return res.status(400).json({ error: "Missing 'word' parameter" });
  }

  // -----------------------------
  // ENV VARS
  // -----------------------------
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!OPENAI_API_KEY || !KV_URL || !KV_TOKEN) {
    return res.status(500).json({
      error: "Missing KV or OPENAI API environment variables."
    });
  }

  // -----------------------------
  // PROMPT STRICT
  // -----------------------------
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
    }
  ]
}

Rules:
- Auto-detect EN/FR.
- Definitions + synonyms in source language.
- Translations in target language.
- Examples: sentence in source, translated in target.
- No text outside JSON.
`;

  // -----------------------------
  // CALL OPENAI
  // -----------------------------
  let parsed;

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
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

    parsed = JSON.parse(raw);

  } catch (err) {
    return res.status(500).json({
      error: "Invalid JSON returned by GPT",
      details: err.message
    });
  }

  // -----------------------------
  // SAVE TO VERCEL KV
  // -----------------------------
  try {
    await fetch(`${KV_URL}/set/${word}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(parsed)
    });
  } catch (err) {
    console.error("KV SAVE ERROR:", err);
    // On continue quand même, la traduction doit s’afficher
  }

  // -----------------------------
  // RETURN RESULT TO FRONTEND
  // -----------------------------
  return res.status(200).json(parsed);
}
