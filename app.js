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
  const english = /^[a-z]+$/i;

  if (frenchChars.test(text)) return "fr";
  if (english.test(text)) return "en";
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
   APPEL API (Vercel) — HTML structuré
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
   ONGLET UI
------------------------------------- */
function buildTabs(translationsHTML) {
  return `
    <div class="tabs-container">
      <div class="tabs">
        <button class="tab active" data-tab="t1">Traduction</button>
        <button class="tab" data-tab="t2">Définition</button>
        <button class="tab" data-tab="t3">Synonymes</button>
        <button class="tab" data-tab="t4">Exemples</button>
      </div>

      <div class="tab-content active" id="t1">
        ${translationsHTML}
      </div>

      <div class="tab-content" id="t2">
        <i>Aucune définition fournie pour le moment.</i>
      </div>

      <div class="tab-content" id="t3">
        <i>Synonymes chargés via l’onglet principal.</i>
      </div>

      <div class="tab-content" id="t4">
        <i>Exemples disponibles dans la section principale.</i>
      </div>
    </div>
  `;
}

function activateTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
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

  // Détection auto + swap si besoin
  const detected = detectLanguage(text);

  if (detected === "fr" && fromLang === "en") swapLanguages();
  if (detected === "en" && fromLang === "fr") swapLanguages();

  // Loading
  resultBox.innerHTML = "⏳ Traduction en cours...";
  resultBox.style.opacity = 1;

  // Appel backend sécurisé
  const htmlResult = await fetchDefinition(text, fromLang, toLang);

  if (!htmlResult) {
    resultBox.innerHTML = `
      <div style="color:#c62828;">⚠️ Erreur lors de la traduction.</div>
    `;
    return;
  }

  // Insertion avec onglets
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
