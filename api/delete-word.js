// /api/delete-word.js
// Supprime un mot de la wordlist (en ou fr)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lang = "en", word = "" } = req.query || {};
    const trimmed = (word || "").trim();

    if (!trimmed) {
      return res.status(400).json({ error: "Missing word" });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const dictLang = lang === "fr" ? "fr" : "en";
    const wordlistKey = `wordlist:${dictLang}`;

    // 1) On lit la wordlist existante
    let list = [];
    try {
      const resp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`
        }
      });

      const data = await resp.json();
      if (data && data.result) {
        const parsed = JSON.parse(data.result);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      }
    } catch (e) {
      console.error("DELETE WORD — read error:", e);
    }

    // 2) On enlève le mot (en respectant la casse exacte)
    const newList = list.filter((w) => w !== trimmed);

    // 3) On réenregistre la liste dans KV
    await fetch(`${KV_URL}/set/${wordlistKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: JSON.stringify(newList)
      })
    });

    return res.status(200).json({ ok: true, words: newList });
  } catch (err) {
    console.error("DELETE WORD error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
