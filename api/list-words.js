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

        const resp = await fetch(`${KV_URL}/get/${wordlistKey}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`
            }
        });

        const data = await resp.json();
        let list = [];

        if (data && data.result) {
            const raw = data.result;

            try {
                // On essaye de parser le JSON stocké
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                    // Cas simple : ["accept","achieve",...]
                    list = parsed;
                } else if (parsed && typeof parsed === "object") {
                    // Cas où on a stocké { value: "[\"accept\",...]" }
                    if (Array.isArray(parsed.value)) {
                        list = parsed.value;
                    } else if (typeof parsed.value === "string") {
                        try {
                            const inner = JSON.parse(parsed.value);
                            if (Array.isArray(inner)) {
                                list = inner;
                            }
                        } catch {
                            // ignore
                        }
                    }
                }
            } catch {
                // Si ce n'est pas du JSON, fallback simple : split par virgule
                list = raw
                    .split(",")
                    .map(w => w.trim())
                    .filter(Boolean);
            }
        }

        // Nettoyage
        list = (list || []).filter(Boolean);

        // Filtre de recherche
        const query = (q || "").toLowerCase();
        if (query) {
            list = list.filter(w => w.toLowerCase().includes(query));
        }

        // Tri alphabétique
        list.sort((a, b) => a.localeCompare(b));

        return res.status(200).json({ words: list });
    } catch (err) {
        console.error("LIST WORDS error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
