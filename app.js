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
  const frenchChars = /[éèêàùûîïçœ]/i;
  const englishChars = /^[a-z]+$/i;

  if (frenchChars.test(text)) return "fr";
  if (englishChars.test(text)) return "en";
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
   APPEL API (Vercel)
------------------------------------- */
async function fetchDefinition(word, fromLang, toLang) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, fromLang, toLang })
  });

  const data = await res.json();
  if (data.error) return null;

  return data.result;
}

/* -------------------------------------
   CREATION ONGLET UI & AFFICHAGE
------------------------------------- */
function buildTabs(contentHTML) {
  return `
    <div class="tabs-container">

      <div class="tabs">
        <button class="tab active" data-tab="panel-1">Traduction</button>
        <button class="tab" data-tab="panel-2">Définition</button>
        <button class="tab" data-tab="panel-3">Synonymes</button>
        <button class="tab" data-tab="panel-4">Exemples</button>
      </div>

      <div id="panel-1" class="tab-content active">
        ${contentHTML}
      </div>

      <div id="panel-2" class="tab-content">
        <i>Aucune définition disponible.</i>
      </div>

      <div id="panel-3" class="tab-content">
        <i>Synonymes chargés dans la section principale.</i>
      </div>

      <div id="panel-4" class="tab-content">
        <i>Exemples disponibles dans la section principale.</i>
      </div>

    </div>
  `;
}

function activateTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(id).classList.add("active");
    });
  });
}

/* -------------------------------------
   ACTION : CLIQUE SUR TRADUIRE
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  let text = input.value.trim();
  if (!text) return;

  const detected = detectLanguage(text);

  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  resultBox.innerHTML = "⏳ Traduction en cours...";
  resultBox.style.opacity = 1;

  const htmlResult = await fetchDefinition(text, fromLang, toLang);

  if (!htmlResult) {
    resultBox.innerHTML = `<div style="color:#c62828;">⚠️ Erreur lors de la traduction.</div>`;
    return;
  }

  resultBox.innerHTML = `
    <div class="bubble-title">${text}</div>
    ${buildTabs(htmlResult)}
  `;

  activateTabs();
});

/* -------------------------------------
   SWAP MANUEL UTILISATEUR
------------------------------------- */
langSwap.addEventListener("click", swapLanguages);
