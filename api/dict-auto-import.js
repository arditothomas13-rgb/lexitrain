// /api/dict-auto-import.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    // 1) Charger le JSON (tableau de mots)
    const filePath = path.join(process.cwd(), "api", "premium100.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "JSON must be an array" });
    }

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    let imported = 0;

    // 2) Importer chaque mot correctement
    for (const entry of data) {
      const word = entry.word?.toLowerCase();

      if (!word) continue;

      const response = await fetch(`${KV_URL}/set/dict:${word}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value: JSON.stringify(entry)
        })
      });

      imported++;
    }

    return res.status(200).json({ ok: true, imported });

  } catch (err) {
    console.error("IMPORT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
