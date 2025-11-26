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

        let list = [];

        try {
            // Lecture de la wordlist dans KV
            const resp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                },
            });

            const data = await resp.json();

            if (data && data.result) {
                try {
                    const parsed = JSON.parse(data.result);
                    if (Array.isArray(parsed)) {
                        list = parsed;
                    }
                } catch (e) {
                    console.error("LIST WORDS parse error:", e);
                }
            }
        } catch (e) {
            console.error("LIST WORDS KV error:", e);
        }

        if (!Array.isArray(list)) {
            list = [];
        }

        // Nettoyage de base : on garde seulement les chaînes non vides
        list = list.filter(
            (w) => typeof w === "string" && w.trim().length > 0
        );

        // 🔎 Normalisation pour supprimer les doublons
        const normalize = (w) => {
            if (!w) return "";
            let lw = w.toLowerCase().trim();

            // Pour l'anglais uniquement : si ça finit par "s" on enlève le "s"
            if (dictLang === "en") {
                if (lw.length > 3 && lw.endsWith("s") && !lw.endsWith("ss")) {
                    lw = lw.slice(0, -1);
                }
            }
            return lw;
        };

        // On garde seulement un mot par forme normalisée
        const seen = new Set();
        list = list.filter((w) => {
            const key = normalize(w);
            if (seen.has(key)) return false; // doublon → on l'enlève
            seen.add(key);
            return true;
        });

        // Filtre par recherche (champ du haut dans le dico)
        const query = (q || "").toLowerCase();
        if (query) {
            list = list.filter((w) => w.toLowerCase().includes(query));
        }

        // Tri alphabétique
        list.sort((a, b) => a.localeCompare(b));

        return res.status(200).json({ words: list });
    } catch (err) {
        console.error("LIST WORDS error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
