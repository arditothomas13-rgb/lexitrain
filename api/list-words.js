// ------------------------------------------------------
//   LexiTrain — API list-words.js (PRO VERSION)
//   Reads only dedicated word lists:
//   - wordlist:en
//   - wordlist:fr
//   Fast, clean, no SCAN, no pollution
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const lang = req.query.lang === "fr" ? "fr" : "en"; // default EN
    const search = req.query.q?.toLowerCase() || "";

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({
        error: "Missing KV environment variables."
      });
    }

    // ------------------------------------------------------
    // LOAD THE WORD LIST FROM KV
    // ------------------------------------------------------
    const key = `wordlist:${lang}`;

    const existing = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    }).then(r => r.json());

    let words = [];

    if (existing?.result) {
      try {
        words = JSON.parse(existing.result);
      } catch {
        words = [];
      }
    }

    // ------------------------------------------------------
    // FILTER BY SEARCH (optional)
    // ------------------------------------------------------
    if (search.length > 0) {
      words = words.filter(w => w.includes(search));
    }

    // Alphabetical sort
    words.sort((a, b) => a.localeCompare(b));

    // ------------------------------------------------------
    // RETURN JSON RESPONSE
    // ------------------------------------------------------
    return res.status(200).json({
      words
    });

  } catch (err) {
    console.error("KV LIST ERROR:", err);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
}
