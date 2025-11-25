// ------------------------------------------------------
//  Vercel API Route — translate.js (version mise à jour)
//  Multi-sense Dictionary Engine (Oxford + Reverso)
//  Règle ajoutée : verbs = "to <word> (verb)"
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
    // PROMPT MULTI-SENS + FORMATAGE VERBES “to <word> (verb)”
    // ------------------------------------------------------
    const prompt = `
You are an advanced dictionary engine (Oxford + Cambridge + Reverso).

For the word: "${word}"

Your task is to detect ALL grammatical senses, including:
- noun
- verb
- adjective
- adverb
- phrasal verbs
- idioms
- expressions

Return ONLY valid JSON with EXACTLY this structure:

{
  "entries": [
    {
      "label": "word (noun)",            // FOR VERBS: MUST be "to word (verb)"
      "definition": "…",                 // definition in source language
      "translations": ["…","…"],         // FR <-> EN depending on detected direction
      "examples": [
        { "src": "…", "dest": "…" },
        { "src": "…", "dest": "…" }
      ],
      "synonyms": ["…","…","…"]
    }
  ]
}

STRICT RULES:
- For ANY verb sense, ALWAYS format the label as:
  "to ${word} (verb)"
- For nouns: "${word} (noun)"
- For adjectives: "${word} (adjective)"
- For phrasal verbs: "to ${word} <particle> (phrasal verb)"
- Return one "entry" per grammatical sense.
- Minimum 2 entries if the word has multiple meanings (ex: “house”, “book”, “light”).
- Auto-detect source language (EN/FR).
- Definitions + synonyms = source language.
- Translations = target language.
- Always return exactly 2 examples per entry.
- Never output text outside JSON.
- JSON MUST be valid.
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
    // SAVE TO KV
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
      // We do not block the user
    }

    // ------------------------------------------------------
    // RETURN RESULT
    // ------------------------------------------------------
    return res.status(200).json(parsed);

  } catch (e) {
    console.error("SERVER ERROR (translate.js):", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
