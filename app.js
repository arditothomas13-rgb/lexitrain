/* -------------------------------------
   LANGUE COURANTE
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
   APPEL API — via Netlify Function SÉCURISÉE
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  const res = await fetch("/.netlify/functions/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, fromLang, toLang })
  });

  const data = await res.json();
  return data.result || "Erreur : aucun résultat reçu.";
}

/* -------------------------------------
   ACTION : CLIQUE SUR TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  let text = input.value.trim();
  if (!text) return;

  // Détecter automatiquement la langue
  const detected = detectLanguage(text);

  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  // Loading
  resultBox.innerHTML = "⏳ Analyse en cours...";
  resultBox.style.opacity = 1;

  // Appel backend sécurisé
  const htmlResult = await fetchDefinition(text, fromLang, toLang);

  resultBox.innerHTML = `
    <div style="font-size:20px; font-weight:700; margin-bottom:8px;">
      ${text}
    </div>
    <div style="opacity:.85; text-align:left; line-height:1.55;">
      ${htmlResult}
    </div>
  `;
});

/* -------------------------------------
   SWAP MANUEL UTILISATEUR
------------------------------------- */
langSwap.addEventListener("click", swapLanguages);
