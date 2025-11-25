// ------------------------------------------------------
//  LexiTrain — API quiz-get-words.js
//  Sélectionne automatiquement les mots à réviser (SRS)
//  Plug & Play — Compatible Upstash KV (Vercel KV)
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
    // 1) CHARGER LA WORDLIST
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

    // Si pas de mot → retourner vide
    if (words.length === 0) {
      return res.status(200).json({ toReview: [] });
    }

    // ------------------------------------------------------
    // 2) CHARGER LES DONNÉES SRS POUR CHAQUE MOT
    // ------------------------------------------------------
    const now = new Date();
    const toReview = [];

    for (let word of words) {
      const reviewKey = `review:${word}`;

      const reviewRes = await fetch(`${KV_URL}/get/${reviewKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });

      const reviewData = await reviewRes.json();

      // Si pas encore révisé → à réviser maintenant
      if (!reviewData?.result) {
        toReview.push(word);
        continue;
      }

      // Parse review JSON
      let review = null;
      try {
        review = JSON.parse(reviewData.result);
      } catch {
        // JSON cassé → réviser maintenant
        toReview.push(word);
        continue;
      }

      // Déjà mémorisé → on ignore
      if (review.memorized) {
        continue;
      }

      // Jamais révisé → réviser
      if (!review.last_reviewed_at || !review.next_review_at) {
        toReview.push(word);
        continue;
      }

      const nextReview = new Date(review.next_review_at);

      // Si la révision est due ou en retard → réviser
      if (nextReview <= now) {
        toReview.push(word);
      }
    }

    // ------------------------------------------------------
    // 3) TRIER LES MOTS PAR URGENCE (optionnel)
    // ------------------------------------------------------
    toReview.sort((a, b) => a.localeCompare(b));

    // ------------------------------------------------------
    // 4) RETOURNER LE JSON FINAL
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
