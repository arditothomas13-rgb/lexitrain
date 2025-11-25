import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // On récupère le chemin vers le fichier JSON local
    const filePath = path.join(process.cwd(), "api", "premium100.json");

    // Lecture brute du fichier
    const raw = fs.readFileSync(filePath, "utf-8");

    // Parsing du JSON — ce fichier est valide (vérifié)
    const data = JSON.parse(raw);

    // Tu peux ici ajouter la logique d'import dans KV / DB / etc.
    // Pour l'instant : on renvoie juste le nombre d’entrées importées.
    const imported = Object.keys(data).length;

    return res.status(200).json({
      ok: true,
      imported,
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
}
