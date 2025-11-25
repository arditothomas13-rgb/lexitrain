// --------------------------------------------
//  translate.js — Vercel Serverless Endpoint
// --------------------------------------------

export default async function handler(req, res) {
    const word = req.query.word;

    if (!word) {
        return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    // Exemple book — version finale A
    const result = {
        entries: [
            {
                label: "book (noun)",
                definition: "a written work, such as a novel or textbook.",
                translations: ["livre", "ouvrage"],
                examples: [
                    { src: "I read a book.", dest: "Je lis un livre." },
                    { src: "This book is amazing.", dest: "Ce livre est incroyable." }
                ],
                synonyms: ["volume", "text", "publication", "manual"]
            },
            {
                label: "to book (verb)",
                definition: "to reserve something.",
                translations: ["réserver", "retenir"],
                examples: [
                    { src: "I booked a table.", dest: "J’ai réservé une table." },
                    { src: "She booked a flight.", dest: "Elle a réservé un vol." }
                ],
                synonyms: ["reserve", "schedule", "arrange", "secure"]
            }
        ]
    };

    return res.status(200).json(result);
}
