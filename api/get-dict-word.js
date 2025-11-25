export default async function handler(req, res) {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: "Missing word parameter" });

    const key = `dict:${word.toLowerCase()}`;

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    try {
        const response = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        const data = await response.json();

        if (!data?.result) {
            return res.status(404).json({ error: "Not found in dictionary DICT" });
        }

        return res.status(200).json(JSON.parse(data.result));
    } catch (err) {
        console.error("DICT GET error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
