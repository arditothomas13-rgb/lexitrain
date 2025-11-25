// ------------------------------------------------------
//  Vercel API Route — translate.js (version corrigée)
//  Multi-sense Dictionary Engine (Oxford + Reverso)
//  Output 100% compatible avec l'UI LexiTrain
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const word = req.query.word?.toLowerCase();

    if (!word) {
      return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!OPENAI_API_KEY || !KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing KV or OPENAI API environment variables."
      });
    }

    // ------------------------------------------------------
    // NEW MULTI-SENSE PROMPT (Oxford + Cambridge + Reverso)
    // ------------------------------------------------------
    const prompt = `
You are an advanced dictionary engine (Oxford + Cambridge + Reverso).

For the word: "${word}"

Your task is to detect *all grammatical senses*, including:

- noun
- verb
- adjective
- adverb
- phrasal verbs
- idioms
- expressions
- alternative meanings

Return ONLY valid JSON with this exact structure:

{
  "entries": [
    {
      "label": "book (noun)",              // includes word + POS
      "definition": "…",                   // definition in source language
      "translations": ["…","…"],           // FR <-> EN depending on direction
      "examples": [
        { "src": "…", "dest": "…" },
        { "src": "…", "dest": "…" }
      ],
      "synonyms": ["…","…","…"]
    }
  ]
}

STRICT RULES:
- Return AS MANY entries as there are distinct senses.
- Each entry corresponds to ONE grammatical sense.
- If the word has multiple meanings (ex: “run”, “book”, “light”…), return minimum 2–6 entries.
- Auto-detect source language (EN or FR).
- Definitions + synonyms ALWAYS in source language.
- Translations ALWAYS in target language.
- Examples: 2 per entry.
- No commentary or text outside JSON.
- JSON must be valid and parsable.
`;

    // ------------------------------------------------------
    // CALL OPENAI
    // ------------------------------------------------------
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You output ONLY valid JSON. No explanations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 900
      })
    });

    const rawData = await completion.json();
    const raw = rawData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON PARSE ERROR:", raw);
      return res.status(500).json({
        error: "Invalid JSON returned by GPT",
        raw: raw
      });
    }

    // ------------------------------------------------------
    // SAVE RESULT INTO VERCEL KV
    // ------------------------------------------------------
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
      // Not blocking: user still gets the result
    }

    return res.status(200).json(parsed);

  } catch (e) {
    console.error("SERVER ERROR (translate.js):", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
