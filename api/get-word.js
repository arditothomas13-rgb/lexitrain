// ------------------------------------------------------
//  LexiTrain — API quiz-get-words.js (VERSION RAPIDE)
//  • Lit directement wordlist:<lang> dans Upstash
//  • Renvoie une liste de mots mélangés (sans SRS pour l'instant)
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const lang = req.query.lang === "fr" ? "fr" : "en"; // par défaut : EN

    const KV_URL   = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const wordlistKey = `wordlist:${lang}`;

    const resp = await fetch(
      `${KV_URL}/get/${encodeURIComponent(wordlistKey)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`
        }
      }
    );

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("QUIZ WORDLIST ERROR", txt);
      return res.status(500).json({ error: "Cannot read wordlist" });
    }

    const data = await resp.json();

    // Upstash renvoie généralement { result: "JSON" }
    let raw = data.result ?? data.value ?? data.data ?? null;

    let list = [];

    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === "string") {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (!Array.isArray(list)) list = [];

    // Nettoyage : conserver uniquement les strings non vides
    list = list
      .filter((w) => typeof w === "string" && w.trim().length > 0)
      .map((w) => w.trim());

    // Mélange (Fisher–Yates)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    // On limite le volume envoyé au front
    const MAX = 50;
    const toReview = list.slice(0, MAX);

    return res.status(200).json({
      count: toReview.length,
      toReview
    });

  } catch (err) {
    console.error("QUIZ GET WORDS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
