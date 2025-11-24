/* -------------------------------------
   LANGUES
------------------------------------- */
let fromLang = "en";
let toLang = "fr";

/* -------------------------------------
   ELEMENTS
------------------------------------- */
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateBtn");
const resultCard = document.getElementById("resultCard");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");
const swapBtn = document.getElementById("langSwap");

/* -------------------------------------
   DETECTION LANGUE
------------------------------------- */
function detectLanguage(text) {
  const hasAccents = /[éèêàùûîïçœ]/i.test(text);
  const isEnglish = /^[a-zA-Z]+$/.test(text);

  if (hasAccents) return "fr";
  if (isEnglish) return "en";
  return "unknown";
}

/* -------------------------------------
   SWAP LANGUES
------------------------------------- */
function swapLanguages() {
  [fromLang, toLang] = [toLang, fromLang];

  let tmp = fromLabel.textContent;
  fromLabel.textContent = toLabel.textContent;
  toLabel.textContent = tmp;

  let tmp2 = fromFlag.textContent;
  fromFlag.textContent = toFlag.textContent;
  toFlag.textContent = tmp2;

  swapBtn.classList.add("swap-anim");
  setTimeout(() => swapBtn.classList.remove("swap-anim"), 250);
}

/* -------------------------------------
   API — VERCEL FUNCTION
------------------------------------- */
async function callApi(word) {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, fromLang, toLang })
    });

    const data = await res.json();
    if (!data || !data.result) return null;
    return data.result;

  } catch (e) {
    console.error("Erreur API :", e);
    return null;
  }
}

/* -------------------------------------
   ACTION — Traduire
------------------------------------- */
translateBtn.addEventListener("click", async () => {
  let text = input.value.trim();
  if (!text) return;

  /* Auto-detect + auto-swap */
  const detected = detectLanguage(text);
  if (detected !== fromLang && detected !== "unknown") {
    swapLanguages();
  }

  // Loading
  resultCard.style.display = "block";
  document.getElementById("tab-traduction").innerHTML = "⏳ Traduction en cours...";
  document.getElementById("tab-definition").innerHTML = "";
  document.getElementById("tab-synonymes").innerHTML = "";
  document.getElementById("tab-exemples").innerHTML = "";
  document.getElementById("result-title").innerText = text;

  const response = await callApi(text);

  if (!response) {
    document.getElementById("tab-traduction").innerHTML = "⚠️ Erreur serveur.";
    return;
  }

  // Injection des 4 sections
  document.getElementById("tab-traduction").innerHTML = response.traductions || "Aucune traduction.";
  document.getElementById("tab-definition").innerHTML = response.definitions || "Aucune définition disponible.";
  document.getElementById("tab-synonymes").innerHTML = response.synonymes || "Aucun synonyme disponible.";
  document.getElementById("tab-exemples").innerHTML = response.exemples || "Aucun exemple disponible.";
});

/* -------------------------------------
   ONGLET SYSTEM
------------------------------------- */
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;

    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

/* -------------------------------------
   SWAP Manuel
------------------------------------- */
swapBtn.addEventListener("click", swapLanguages);
