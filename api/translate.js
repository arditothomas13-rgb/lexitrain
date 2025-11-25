// ------------------------------------------------------
//  LexiTrain — API translate.js (PRO VERSION)
//  EN ⇄ FR • Lang detection • Auto-switch • Clean senses
//  + WORDLIST CLOUD (auto-save for dictionary)
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

1) DETECT THE TRUE LANGUAGE: "en" or "fr".
Return in "detected_lang".

2) ONLY return senses for the detected language (Option B).

3) If detected_lang ≠ from → set "auto_switch": true.

4) NEVER invent senses.
No fake phrasal verbs, no added "to", no weak forms.

5) If input begins with "to ", treat it as a verb and keep EXACT form.

6) JSON FORMAT STRICT:

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

7) Definitions + synonyms in source language.
8) Translations in target language.
9) Examples:
- src in source lang
- dest in target lang

Return ONLY clean JSON.
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
    // SAVE THE RESULT IN KV (CACHE)
    // ------------------------------------------------------
    try {
      const cacheKey = `${word.toLowerCase()}_${from}_${to}`;
      await fetch(`${KV_URL}/set/${cacheKey}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed)
      });
    } catch (err) {
      console.error("KV CACHE SAVE ERROR:", err);
    }

    // ------------------------------------------------------
    // SAVE WORD IN GLOBAL WORD LIST (CLOUD DICTIONARY)
    // ------------------------------------------------------
    try {
      // listKey depends on detected language
      const detected = parsed.detected_lang === "fr" ? "wordlist:fr" : "wordlist:en";

      // Load existing list
      const existing = await fetch(`${KV_URL}/get/${detected}`, {
        headers: { "Authorization": `Bearer ${KV_TOKEN}` }
      }).then(r => r.json());

      let list = [];
      if (existing?.result) {
        try { list = JSON.parse(existing.result); } catch {}
      }

      const normalized = word.toLowerCase();

      if (!list.includes(normalized)) {
        list.push(normalized);

        // Save updated list
        await fetch(`${KV_URL}/set/${detected}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${KV_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(list)
        });
      }

    } catch (err) {
      console.error("KV WORDLIST SAVE ERROR:", err);
    }

    // ------------------------------------------------------
    // RETURN
    // ------------------------------------------------------
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
