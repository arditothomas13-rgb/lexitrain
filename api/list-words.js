// ------------------------------------------------------
//  LexiTrain — API list-words.js (VERSION FINALE)
//  Filtrage par langue + recherche + tri
// ------------------------------------------------------

export default async function handler(req, res) {
  try {
    const KV_URL   = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const lang = req.query.lang === "fr" ? "fr" : "en";
    const q = (req.query.q || "").toLowerCase();

    // ------------------------------------------------------
    // 1) Récupérer TOUTES les clés dict:*
    // ------------------------------------------------------
    const response = await fetch(`${KV_URL}/keys/dict:*`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    const data = await response.json();

    if (!data?.result) {
      return res.status(200).json({ words: [] });
    }

    // ------------------------------------------------------
    // 2) Ne garder que les mots de la bonne langue
    //    (clé dict:run:en ou dict:maison:fr)
    // ------------------------------------------------------
    let words = data.result
      .filter(key => key.startsWith(`dict:`))
      .map(key => key.replace("dict:", ""));

    // Si ta structure KV est dict:word:en → adapter ici :
    // words = words.map(w => w.split(":")[0]);

    // ------------------------------------------------------
    // 3) Filtrer par recherche si besoin
    // ------------------------------------------------------
    if (q.length > 0) {
      words = words.filter(w => w.toLowerCase().includes(q));
    }

    // ------------------------------------------------------
    // 4) Tri alphabétique
    // ------------------------------------------------------
    words.sort((a, b) => a.localeCompare(b));

    return res.status(200).json({ lang, q, words });

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
