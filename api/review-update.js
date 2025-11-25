// ------------------------------------------------------
//  LexiTrain — API review-update.js (VERSION STABLE)
//  Mise à jour SRS sécurisée + normalisation garantie
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

    const KV_URL   = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const reviewKey = `review:${word.toLowerCase()}`;

    // ------------------------------------------------------
    // 1) LECTURE DONNÉES EXISTANTES
    // ------------------------------------------------------
    let review = {
      srs_level: 0,
      last_reviewed_at: null,
      next_review_at: null,
      memorized: false,
      correct_count: 0,
      wrong_count: 0
    };

    try {
      const existing = await fetch(`${KV_URL}/get/${reviewKey}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      }).then(r => r.json());

      if (existing?.result) {
        const parsed = JSON.parse(existing.result);

        // Sécurisation / normalisation obligatoire
        review = {
          srs_level: Number(parsed.srs_level) || 0,
          last_reviewed_at: parsed.last_reviewed_at || null,
          next_review_at: parsed.next_review_at || null,
          memorized: Boolean(parsed.memorized),
          correct_count: Number(parsed.correct_count) || 0,
          wrong_count: Number(parsed.wrong_count) || 0
        };
      }
    } catch {
      // JSON cassé → on reset clean automatiquement
    }

    // ------------------------------------------------------
    // 2) SRS UPDATE
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

    // Intervalles SRS en jours
    const intervals = [1, 2, 4, 7, 15, 30, 60, 120];
    const index = Math.min(Math.max(review.srs_level, 0), intervals.length - 1);
    const addedDays = intervals[index];

    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + addedDays);

    review.next_review_at = nextReview.toISOString();
    review.memorized = review.srs_level >= 6;

    // ------------------------------------------------------
    // 3) SAUVEGARDE KV
    // ------------------------------------------------------
    const saveRes = await fetch(`${KV_URL}/set/${reviewKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(review)
    });

    if (!saveRes.ok) {
      return res.status(500).json({ error: "KV Save failed" });
    }

    // ------------------------------------------------------
    // 4) RÉPONSE OK
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
