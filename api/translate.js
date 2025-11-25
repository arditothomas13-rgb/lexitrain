// ------------------------------------------------------
//  LexiTrain — API translate.js (PRO VERSION FINAL)
//  • EN ⇄ FR
//  • AI-powered dictionary (clean senses)
//  • Auto-switch
//  • Cache (KV) + Wordlist (FR/EN)
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const rawWord = req.query.word?.trim();
    const from = req.query.from || "en";
    const to   = req.query.to   || "fr";

    if (!rawWord) {
      return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const KV_URL   = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!OPENAI_API_KEY || !KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing required environment variables."
      });
    }

    // ------------------------------------------------------
    // NORMALISATION DU MOT
    // ------------------------------------------------------
    const word = rawWord
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    // ------------------------------------------------------
    // PROMPT PREMIUM
    // ------------------------------------------------------
    const prompt = `
You are a bilingual EN-FR dictionary engine (Oxford/Cambridge level).

Input word: "${rawWord}"
Normalized: "${word}"
Requested direction: ${from} → ${to}

Rules to follow strictly:

1) DETECT LANGUAGE:
   - Output "detected_lang": "en" or "fr"
   - If unsure: choose the most natural/common usage.

2) AUTO-SWITCH:
   If detected_lang ≠ requested "from", set:
   "auto_switch": true

3) SENSES:
   - Return ONLY senses belonging to the DETECTED language.
   - Do NOT mix languages.
   - If English verb begins with “to ” → KEEP EXACT input.
   - NEVER add "to" automatically.

4) NO INVENTIONS:
   - No fake phrasal verbs
   - No rare/made-up meanings
   - No transformations like "to to X"

5) FORMAT STRICT JSON:
{
  "detected_lang": "en",
  "auto_switch": false,
  "entries": [
    {
      "label": "to ignite (verb)",
      "definition": "... in source language",
      "translations": ["..."],
      "examples": [
        { "src": "...", "dest": "..." }
      ],
      "synonyms": ["..."]
    }
  ]
}

6) DEFINITIONS + SYNONYMS:
   → ALWAYS in the detected language

7) TRANSLATIONS:
   → ALWAYS in the target language (after autoswitch)

8) EXAMPLES:
   "src" in detected_lang
   "dest" in the target language

Return ONLY clean JSON. No comments. No extra text.
`;

    // ------------------------------------------------------
    // CALL OPENAI
    // ------------------------------------------------------
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.15,
          max_tokens: 1000,
          messages: [
            { role: "system", content: "You output ONLY valid JSON. No explanations." },
            { role: "user",   content: prompt }
          ]
        })
      }
    );

    const rawJson = await response.json();
    const raw = rawJson?.choices?.[0]?.message?.content || "{}";

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
    // NORMALISATION DU RESULTAT
    // ------------------------------------------------------
    if (!Array.isArray(parsed.entries)) {
      parsed.entries = [];
    }

    // Clean entries (supprime vide, force array, etc.)
    parsed.entries = parsed.entries.map(e => ({
      label: e.label || "",
      definition: e.definition || "",
      translations: Array.isArray(e.translations) ? e.translations : [],
      examples: Array.isArray(e.examples) ? e.examples : [],
      synonyms: Array.isArray(e.synonyms) ? e.synonyms : []
    }));

    // ------------------------------------------------------
    // SAVE IN KV CACHE
    // ------------------------------------------------------
    try {
      const cacheKey = `${word}_${from}_${to}`;

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
    // SAVE WORD IN DICTIONARY (wordlist:en / wordlist:fr)
    // ------------------------------------------------------
    try {
      const detectedLang = parsed.detected_lang === "fr" ? "fr" : "en";
      const listKey = `wordlist:${detectedLang}`;

      const existing = await fetch(`${KV_URL}/get/${listKey}`, {
        headers: { "Authorization": `Bearer ${KV_TOKEN}` }
      }).then(r => r.json());

      let list = [];
      if (existing?.result) {
        try {
          list = JSON.parse(existing.result);
        } catch {}
      }

      // Ajoutez mot normalisé
      const normalized = word.toLowerCase();

      if (!list.includes(normalized)) {
        list.push(normalized);

        await fetch(`${KV_URL}/set/${listKey}`, {
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
    // RETURN FINAL JSON
    // ------------------------------------------------------
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
