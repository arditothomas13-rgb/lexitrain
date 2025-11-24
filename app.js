/* -------------------------------------
   LANGUES ACTUELLES
------------------------------------- */
let fromLang = "en";
let toLang = "fr";

/* -------------------------------------
   ELEMENTS DOM
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
   DETECTION AUTOMATIQUE
------------------------------------- */
function detectLanguage(text) {
  const hasAccents = /[éèêàùûîïçœ]/i.test(text);
  const isEnglishWord = /^[a-zA-Z\s]+$/.test(text);

  if (hasAccents) return "fr";
  if (isEnglishWord) return "en";
  return "unknown";
}

/* -------------------------------------
   SWAP MANUEL
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

langSwap.addEventListener("click", swapLanguages);

/* -------------------------------------
   APPEL BACKEND VERCEL
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, fromLang, toLang })
    });

    const data = await res.json();
    return data.result || "⚠️ Erreur : aucun résultat reçu.";
  } catch (e) {
    return "⚠️ Erreur serveur.";
  }
}

/* -------------------------------------
   ACTION TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  const detected = detectLanguage(text);

  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  resultBox.innerHTML = "⏳ Analyse en cours…";
  resultBox.style.opacity = 1;

  const html = await fetchDefinition(text, fromLang, toLang);

  resultBox.innerHTML = `
    <div style="font-size:22px; font-weight:700; margin-bottom:12px;">
      ${text}
    </div>
    <div style="opacity:.9; text-align:left; line-height:1.6;">
      ${html}
    </div>
  `;
});
