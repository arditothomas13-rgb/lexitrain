// ------------------------------------------------------
//  LexiTrain — API review-update.js
//  Crée + met à jour les données SRS pour un mot
//  Plug & Play, compatible Upstash KV (Vercel KV)
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const { word, correct } = req.query;

    if (!word) {
      return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    if (correct === undefined) {
      return res.status(400).json({ error: "Missing 'correct' parameter (true/false)" });
    }

    const isCorrect = correct === "true";

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const reviewKey = `review:${word.toLowerCase()}`;

    // ------------------------------------------------------
    // 1) LECTURE DE LA DONNÉE EXISTANTE
    // ------------------------------------------------------
    const existing = await fetch(`${KV_URL}/get/${reviewKey}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    }).then(r => r.json());

    let review = {
      srs_level: 0,
      last_reviewed_at: null,
      next_review_at: null,
      memorized: false,
      correct_count: 0,
      wrong_count: 0
    };

    if (existing?.result) {
      try {
        review = JSON.parse(existing.result);
      } catch {
        // Si JSON cassé → reset clean
      }
    }

    // ------------------------------------------------------
    // 2) MISE À JOUR SRS
    // ------------------------------------------------------
    const now = new Date();

    if (isCorrect) {
      review.srs_level = Math.min(review.srs_level + 1, 7);
      review.correct_count += 1;
    } else {
      review.srs_level = Math.max(review.srs_level - 1, 0);
      review.wrong_count += 1;
    }

    review.last_reviewed_at = now.toISOString();

    // Intervalles (jours) pour SRS
    const intervals = [1, 2, 4, 7, 15, 30, 60, 120];
    const addedDays = intervals[review.srs_level] || 1;

    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + addedDays);

    review.next_review_at = nextReview.toISOString();

    // Marqué comme mémorisé si niveau haut
    review.memorized = review.srs_level >= 6;

    // ------------------------------------------------------
    // 3) SAUVEGARDE
    // ------------------------------------------------------
    await fetch(`${KV_URL}/set/${reviewKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(review)
    });

    // ------------------------------------------------------
    // 4) RÉPONSE
    // ------------------------------------------------------
    return res.status(200).json({
      ok: true,
      word,
      correct: isCorrect,
      review
    });

  } catch (err) {
    console.error("REVIEW UPDATE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
