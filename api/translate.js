// ------------------------------------------------------
//  Vercel API Route — translate.js (Version PRO CLEAN)
//  No fake categories — No duplicated "to to"
//  Only REAL Oxford/Cambridge senses
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const word = req.query.word?.trim();

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
    //  NEW PREMIUM PROMPT (NO FAKE CATEGORIES)
    // ------------------------------------------------------
    const prompt = `
You are a professional dictionary engine (Oxford + Cambridge quality).

For the word: "${word}"

You MUST return ONLY real linguistic senses.
Never invent a category.
Never output a sense if the usage is not attested or useful.

Follow these rules:

1) DETECT THE REAL TYPE(S):
- noun
- verb
- adjective
- adverb
- expression / idiom
- phrasal verb (ONLY if it is a REAL, established phrasal verb)
Examples allowed: "wolf down", "blaze a trail", "run out", "break down"
NEVER include weak/uncommon phrasal verbs like "book up", "blaze up" unless they are real in dictionaries.

2) DO NOT MODIFY THE USER INPUT
If the user types:
- "to blaze" → keep "to blaze"
- "wolf down" → keep exactly "wolf down"
- "blazers" → keep "blazers" (noun, plural)
NEVER add extra "to", NEVER output "to to blaze".

3) IF THE WORD IS ALREADY A PHRASE
Example: "wolf down"
→ DO NOT split into invented noun/verb senses unless they exist in real dictionaries.

4) OUTPUT FORMAT (strict JSON):

{
  "entries": [
    {
      "label": "to wolf down (verb)",         // or "wolf down (phrasal verb)"
      "definition": "…",
      "translations": ["…"],
      "examples": [
        { "src": "…", "dest": "…" }
      ],
      "synonyms": ["…"]
    }
  ]
}

5) LANGUAGE:
- Detect if the user word is EN or FR.
- Definitions + synonyms in source language.
- Translations in target language.
- Examples: natural, authentic.

6) QUALITY:
- Only include REAL senses found in high-quality dictionaries.
- Skip irrelevant categories.
- Skip senses that are too rare, slang, or unhelpful.

Return ONLY valid JSON.
No explanation.
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
          { role: "system", content: "You output ONLY valid JSON. No extra text." },
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
      return res.status(500).json({
        error: "Invalid JSON returned by GPT",
        raw: raw
      });
    }

    // ------------------------------------------------------
    // SAVE RESULT IN KV (CACHE)
    // ------------------------------------------------------
    try {
      await fetch(`${KV_URL}/set/${word.toLowerCase()}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed)
      });
    } catch (err) {
      console.error("KV SAVE ERROR:", err);
    }

    return res.status(200).json(parsed);

  } catch (e) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
