// ------------------------------------------------------
//  LexiTrain — API translate.js (PRO VERSION)
//  EN ⇄ FR • Lang detection • Auto-switch • Clean senses
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const word = req.query.word?.trim();
    const from = req.query.from || "en";
    const to = req.query.to || "fr";

    if (!word) {
      return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!OPENAI_API_KEY || !KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing required environment variables."
      });
    }

    // ------------------------------------------------------
    // PREMIUM PROMPT WITH LANGUAGE DETECTION
    // ------------------------------------------------------
    const prompt = `
You are a bilingual EN-FR dictionary engine (Oxford/Cambridge quality).

For the word: "${word}"
Requested direction: ${from} → ${to}

Your tasks:

1) DETECT THE TRUE LANGUAGE of the user's input.
Return in a field "detected_lang": "en" or "fr".
If unsure, choose the most common usage.

2) ONLY return senses for the detected language.
(Option B: keep ONLY the senses in the detected language.)

Examples:
- If word is French and direction is EN→FR, return "auto_switch": true
- If word is English and direction is FR→EN, return "auto_switch": true

3) NEVER invent senses:
- No fake phrasal verbs
- No invented adjectives/nouns/verbs
- No "to to blaze"
- No weak/uncommon forms

4) If the input starts with "to " then it's a verb → keep EXACT input
Never add extra "to".
Never modify the user’s form.

5) OUTPUT FORMAT (STRICT JSON):

{
  "detected_lang": "en",
  "auto_switch": false,
  "entries": [
    {
      "label": "to blaze (verb)",
      "definition": "…",
      "translations": ["…"],
      "examples": [
        { "src": "…", "dest": "…" }
      ],
      "synonyms": ["…"]
    }
  ]
}

6) DEFINITIONS & SYNONYMS:
- Always in the source language (detected_lang)

7) TRANSLATIONS:
- Always in the target language (the "to" lang after auto-switch if needed)

8) EXAMPLES:
- "src": in source language
- "dest": in target language

Return ONLY JSON. No comments.
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
        max_tokens: 950
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
    //  SAVE IN KV (CACHE)
    // ------------------------------------------------------
    try {
      await fetch(`${KV_URL}/set/${word.toLowerCase()}_${from}_${to}`, {
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

    // ------------------------------------------------------
    //  RETURN DATA
    // ------------------------------------------------------
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
