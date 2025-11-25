// ------------------------------------------------------
//   Vercel API Route — list-words.js
//   Optimisé pour LexiTrain — Lazy loading + Cache KV
//   Objectif : retourner la liste des mots déjà traduits
//   pour le dictionnaire interne
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const search = req.query.q?.toLowerCase() || "";

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing KV environment variables."
      });
    }

    // ----------------------------------------------
    // FETCH ALL KEYS FROM KV
    // ----------------------------------------------
    // Vercel KV supports SCAN pattern:
    //   GET /scan/<cursor>?pattern=*
    //
    // We scan incrementally to avoid timeouts.
    // ----------------------------------------------

    async function scanAllKeys() {
      let cursor = 0;
      const allKeys = [];

      do {
        const response = await fetch(`${KV_URL}/scan/${cursor}?pattern=*`, {
          headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        const data = await response.json();
        cursor = data.cursor;

        if (Array.isArray(data.keys)) {
          allKeys.push(...data.keys);
        }

      } while (cursor !== 0);

      return allKeys;
    }

    const allWords = await scanAllKeys();

    // ----------------------------------------------
    // FILTER + SORT
    // ----------------------------------------------
    let result = allWords;

    if (search.length > 0) {
      result = allWords.filter(w => w.toLowerCase().includes(search));
    }

    result.sort((a, b) => a.localeCompare(b));

    // ----------------------------------------------
    // RETURN JSON RESPONSE
    // ----------------------------------------------
    return res.status(200).json({
      words: result
    });

  } catch (err) {
    console.error("KV LIST ERROR:", err);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
}
