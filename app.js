/* -------------------------------------
   LANGUES ACTUELLES
------------------------------------- */
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
   DETECTION AUTOMATIQUE DE LANGUE
------------------------------------- */
function detectLanguage(text) {
  const hasAccents = /[éèêàùûîïçœ]/i.test(text);
  const isEnglishWord = /^[a-zA-Z]+$/.test(text);

  if (hasAccents) return "fr";
  if (isEnglishWord) return "en";
  return "unknown";
}

/* -------------------------------------
   SWAP DES LANGUES
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
   APPEL API — VERCEL
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ word, fromLang, toLang })
    });

    const data = await res.json();

    if (!data.result) {
      return "⚠️ Erreur : aucun résultat reçu.";
    }

    return data.result;

  } catch (err) {
    console.error("Erreur API :", err);
    return "❌ Erreur lors de la traduction.";
  }
}

/* -------------------------------------
   BOUTON : TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  // Détection auto
  const detected = detectLanguage(text);
  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  // Affichage du loader
  resultBox.innerHTML = "<span style='opacity:0.7'>⏳ Analyse en cours...</span>";
  resultBox.style.opacity = 1;

  // Appel API
  const html = await fetchDefinition(text, fromLang, toLang);

  // Affichage du résultat final
  resultBox.innerHTML = `
    <div style="font-size:20px; font-weight:700; margin-bottom:8px;">
      ${text}
    </div>
    <div style="opacity:.85; text-align:left; line-height:1.55;">
      ${html}
    </div>
  `;
});

/* -------------------------------------
   SWAP MANUEL
------------------------------------- */
langSwap.addEventListener("click", swapLanguages);
