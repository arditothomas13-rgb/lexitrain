// ------------------------------------------------------
//  LexiTrain — API quiz-get-words.js (VERSION STABLE)
//  Nettoie la wordlist, enlève les mots inexistants,
//  renvoie uniquement les mots prêts pour le quiz.
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const lang = req.query.lang === "fr" ? "fr" : "en"; // default: EN
    
    const KV_URL   = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    // ------------------------------------------------------
    // 1) CHARGER LA WORDLIST (listKey)
    // ------------------------------------------------------
    const listKey = `wordlist:${lang}`;

    const listRes = await fetch(`${KV_URL}/get/${listKey}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const listData = await listRes.json();
    let words = [];

    if (listData?.result) {
      try {
        words = JSON.parse(listData.result);
      } catch {
        words = [];
      }
    }

    if (words.length === 0) {
      return res.status(200).json({ toReview: [] });
    }

    // ------------------------------------------------------
    // 2) NETTOYER LA WORDLIST → garder seulement les mots
    //    qui existent vraiment dans le dictionnaire KV
    // ------------------------------------------------------
    const validWords = [];

    for (let w of words) {
      const dictKey = `dict:${w.toLowerCase()}`;

      const dictRes = await fetch(`${KV_URL}/get/${dictKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });

      const dictJson = await dictRes.json();

      if (dictJson?.result) {
        validWords.push(w);
      }
    }

    if (validWords.length === 0) {
      return res.status(200).json({ toReview: [] });
    }

    // ------------------------------------------------------
    // 3) CHARGER LES DONNÉES SRS POUR CHAQUE MOT
    // ------------------------------------------------------
    const now = new Date();
    const toReview = [];

    for (let word of validWords) {
      const reviewKey = `review:${word}`;

      const reviewRes = await fetch(`${KV_URL}/get/${reviewKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });

      const reviewData = await reviewRes.json();

      if (!reviewData?.result) {
        toReview.push(word);
        continue;
      }

      let review = null;
      try {
        review = JSON.parse(reviewData.result);
      } catch {
        toReview.push(word);
        continue;
      }

      if (review.memorized) continue;

      // Mot jamais révisé
      if (!review.last_reviewed_at || !review.next_review_at) {
        toReview.push(word);
        continue;
      }

      const nextReview = new Date(review.next_review_at);

      if (nextReview <= now) {
        toReview.push(word);
      }
    }

    // ------------------------------------------------------
    // 4) RENVoyer le JSON FINAL
    // ------------------------------------------------------
    return res.status(200).json({
      count: toReview.length,
      toReview
    });

  } catch (err) {
    console.error("QUIZ GET WORDS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
