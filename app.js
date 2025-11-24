/* -------------------------------------
   LANGUES COURANTES
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
   DETECTION AUTO
------------------------------------- */
function detectLanguage(text) {
  const hasAccents = /[éèêàùûîïçœ]/i.test(text);
  const isEnglish = /^[a-zA-Z\s]+$/.test(text);

  if (hasAccents) return "fr";
  if (isEnglish) return "en";
  return "unknown";
}

/* -------------------------------------
   SWAP LANGUES
------------------------------------- */
function swapLanguages() {
  [fromLang, toLang] = [toLang, fromLang];

  // Textes
  const temp = fromLabel.textContent;
  fromLabel.textContent = toLabel.textContent;
  toLabel.textContent = temp;

  // Drapeaux
  const tempFlag = fromFlag.textContent;
  fromFlag.textContent = toFlag.textContent;
  toFlag.textContent = tempFlag;

  langSwap.classList.add("swap-anim");
  setTimeout(() => langSwap.classList.remove("swap-anim"), 300);
}

/* -------------------------------------
   FETCH TRADUCTION VIA API VERCEL
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, fromLang, toLang })
    });

    const data = await res.json();

    if (data.error) return `<span style="color:#c00">⚠ ${data.error}</span>`;

    return data.result;

  } catch (e) {
    return `<span style="color:#c00">⚠ Erreur de connexion.</span>`;
  }
}

/* -------------------------------------
   ACTION : TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  let text = input.value.trim();
  if (!text) return;

  // Détection auto
  const detected = detectLanguage(text);
  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  // Affichage loading
  resultBox.innerHTML = "⏳ Analyse en cours...";
  resultBox.style.opacity = 1;

  // Appel backend
  const html = await fetchDefinition(text, fromLang, toLang);

  resultBox.innerHTML = `
    <div style="font-size:20px; font-weight:700; margin-bottom:8px;">${text}</div>
    <div style="text-align:left; line-height:1.55;">${html}</div>
  `;
});

/* -------------------------------------
   SWAP MANUEL
------------------------------------- */
langSwap.addEventListener("click", swapLanguages);
