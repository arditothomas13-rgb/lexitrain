/* -------------------------------------
   CONFIG
------------------------------------- */
const OPENAI_API_KEY = "TA_CLE_ICI"; // ← Mets ta clé ici

let fromLang = "en";
let toLang = "fr";

/* -------------------------------------
   ELEMENTS DU DOM
------------------------------------- */
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");
const resultBox = document.getElementById("resultBox");
const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");

/* -------------------------------------
   DETECTION AUTOMATIQUE LANGUE
------------------------------------- */
function detectLanguage(text) {
  const hasAccents = /[éèêàùûîïçœ]/i.test(text);
  const isEnglishWord = /^[a-zA-Z]+$/.test(text);

  if (hasAccents) return "fr";
  if (isEnglishWord) return "en";

  return "unknown";
}

/* -------------------------------------
   SWAP LANGUES
------------------------------------- */
function swapLanguages() {
  [fromLang, toLang] = [toLang, fromLang];

  const tmpLabel = fromLabel.textContent;
  fromLabel.textContent = toLabel.textContent;
  toLabel.textContent = tmpLabel;

  const tmpFlag = fromFlag.textContent;
  fromFlag.textContent = toFlag.textContent;
  toFlag.textContent = tmpFlag;

  langSwap.classList.add("swap-anim");
  setTimeout(() => langSwap.classList.remove("swap-anim"), 300);
}

/* -------------------------------------
   APPEL OPENAI — FICHE PREMIUM
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  const prompt = `
Tu es un dictionnaire premium type Oxford + Reverso.
Pour le mot : "${word}"

Donne-moi un résultat structuré EXACTEMENT ainsi en HTML :

<b>Traductions :</b><br>
• liste de traductions principales (simples et lisibles)<br><br>

<b>Synonymes :</b><br>
• synonymes dans la langue cible<br><br>

<b>Exemples :</b><br>
• phrase en ${fromLang} + traduction ${toLang}<br>
• 2 à 4 exemples maximum<br><br>

S’il existe plusieurs sens (ex : Book = nom / To book = verbe),
donne les deux sections distinctes.
Ne donne pas d’explication longue, reste clair et concret.
  `;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Aucune définition trouvée";
}

/* -------------------------------------
   ACTION : CLIQUE SUR TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  let text = input.value.trim();
  if (!text) return;

  // Détecter automatiquement la langue
  const detected = detectLanguage(text);

  if (detected === "fr" && fromLang === "en") {
    swapLanguages();
  }
  if (detected === "en" && fromLang === "fr") {
    swapLanguages();
  }

  // Affichage loading
  resultBox.innerHTML = "⏳ Analyse en cours...";
  resultBox.style.opacity = 1;

  // Appel OpenAI pour une fiche complète
  const definition = await fetchDefinition(text, fromLang, toLang);

  resultBox.innerHTML = `
    <div style="font-size:20px; font-weight:700; margin-bottom:8px;">${text}</div>
    <div style="opacity:.85; text-align:left; line-height:1.55;">
      ${definition}
    </div>
  `;
});

/* -------------------------------------
   SWAP MANUEL UTILISATEUR
------------------------------------- */
langSwap.addEventListener("click", swapLanguages);
