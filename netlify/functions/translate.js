import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const { word, fromLang, toLang } = JSON.parse(event.body);

    if (!word) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No word provided" })
      };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" })
      };
    }
    // Prompt premium façon Reverso/Oxford
    const prompt = `
Tu es un super dictionnaire premium (Oxford + Reverso).
Génère une fiche claire, concise et structurée pour le mot : "${word}"

Langue source : ${fromLang}
Langue cible : ${toLang}

Donne la réponse ICI EXACTEMENT dans ce format HTML :

<b>Traductions :</b><br>
• 2 à 5 traductions claires<br><br>

<b>Synonymes :</b><br>
• synonymes utiles dans la langue cible<br><br>

<b>Exemples :</b><br>
• phrase en ${fromLang} + traduction en ${toLang}<br>
• 2 à 4 exemples maximum<br><br>

Si le mot possède plusieurs sens (ex : “book” nom + “to book” verbe),
sépare les sections distinctement, toujours en HTML.

⚠️ Ne fais pas de longues explications.
⚠️ Ne donne jamais d’IPA ou de phonétique.
⚠️ Ne mets pas de paragraphes hors structure demandée.
    `;

    // Appel OpenAI
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      })
    });

    const data = await apiResponse.json();

    const result = data?.choices?.[0]?.message?.content || "Aucun résultat";

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };

  } catch (error) {
    console.error("Erreur translate.js :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
