// /api/list-words.js
export default async function handler(req, res) {
    try {
        const { lang = "en", q = "" } = req.query || {};

        const KV_URL = process.env.KV_REST_API_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN;

        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "Missing KV config" });
        }

        // 🇬🇧 => wordlist:en | 🇫🇷 => wordlist:fr
        const dictLang = lang === "fr" ? "fr" : "en";
        const wordlistKey = `wordlist:${dictLang}`;

        // On tente de lire la wordlist dans KV
        const resp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`
            }
        });

        const data = await resp.json();
        let list = [];

        if (data && data.result) {
            try {
                const parsed = JSON.parse(data.result);
                if (Array.isArray(parsed)) {
                    list = parsed;
                }
            } catch (e) {
                console.error("LIST WORDS parse error:", e);
                list = [];
            }
        }

        // Sécurité
        list = (list || []).filter(Boolean);

        // Filtre de recherche
        const query = (q || "").toLowerCase();
        if (query) {
            list = list.filter(w => w.toLowerCase().includes(query));
        }

        // Tri
        list.sort((a, b) => a.localeCompare(b));

        return res.status(200).json({ words: list });
    } catch (err) {
        console.error("LIST WORDS error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
