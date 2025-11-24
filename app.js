let fromLang = "en";
let toLang = "fr";

const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");
const resultBox = document.getElementById("resultBox");

const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

function detectLanguage(text) {
  const accents = /[éèêàùûîïçœ]/i.test(text);
  const english = /^[a-zA-Z]+$/i.test(text);

  if (accents) return "fr";
  if (english) return "en";
  return "unknown";
}

function swapLanguages() {
  [fromLang, toLang] = [toLang, fromLang];

  [fromLabel.textContent, toLabel.textContent] =
    [toLabel.textContent, fromLabel.textContent];

  [fromFlag.textContent, toFlag.textContent] =
    [toFlag.textContent, fromFlag.textContent];
}

async function fetchDefinition(word) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, fromLang, toLang })
  });

  return await res.json();
}

function activateTab(tabName) {
  tabs.forEach(t => t.classList.remove("active"));
  tabContents.forEach(c => c.classList.remove("active"));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(tabName).classList.add("active");
}

translateBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  const detected = detectLanguage(text);

  if (detected !== "unknown" && detected !== fromLang) {
    swapLanguages();
  }

  resultBox.innerHTML = `
    <div class="loading">⏳ Traduction en cours...</div>
  `;

  const data = await fetchDefinition(text);

  if (!data.ok) {
    resultBox.innerHTML = `<div class="error">⚠️ Erreur serveur.</div>`;
    return;
  }

  resultBox.innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="translations">Traduction</button>
      <button class="tab" data-tab="definitions">Définition</button>
      <button class="tab" data-tab="synonyms">Synonymes</button>
      <button class="tab" data-tab="examples">Exemples</button>
    </div>

    <div id="translations" class="tab-content active">${data.translations}</div>
    <div id="definitions" class="tab-content">${data.definitions || "Aucune définition disponible."}</div>
    <div id="synonyms" class="tab-content">${data.synonyms || "Aucun synonyme disponible."}</div>
    <div id="examples" class="tab-content">${data.examples || "Aucun exemple disponible."}</div>
  `;

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
});

langSwap.addEventListener("click", swapLanguages);
