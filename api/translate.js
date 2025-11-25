// --------------------------------------------
//  translate.js — Version Serverless Vercel
// --------------------------------------------
//
// IMPORTANT :
// Vercel exécute ce fichier comme un endpoint backend.
// Il doit exporter "default function handler(req, res)".
// --------------------------------------------

export default async function handler(req, res) {
    const word = req.query.word;

    if (!word) {
        return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    try {
        // Ici tu mets TON ALGO actuel de parsing / tes data / ton mapping
        // Pour le moment, je laisse un "mock" structurel qui suit ton format "entries".

        // ⚠️ Remplace ce bloc par ta vraie logique interne si tu avais un dictionnaire
        const mock = {
            entries: [
                {
                    label: "Nom — livre",
                    translations: ["livre", "ouvrage"],
                    examples: [
                        { src: "I read a book.", dest: "Je lis un livre." },
                        { src: "This book is amazing.", dest: "Ce livre est incroyable." }
                    ],
                    synonyms: ["volume", "ouvrage", "manuel"]
                },
                {
                    label: "Verbe — réserver",
                    translations: ["réserver", "retenir"],
                    examples: [
                        { src: "I booked a table.", dest: "J’ai réservé une table." },
                        { src: "She booked a flight.", dest: "Elle a réservé un vol." }
                    ],
                    synonyms: ["réserver", "retenir", "prévoir"]
                }
            ]
        };

        // Envoie ton objet final
        return res.status(200).json(mock);

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Server error" });
    }
}
