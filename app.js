// ============================================
// VARIABLES
// ============================================
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton"); // <-- FIX
const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");

// Langues
const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");

// ============================================
// SWAP DES LANGUES
// ============================================
langSwap.addEventListener("click", () => {
    const oldLabel = fromLabel.textContent;
    const oldFlag  = fromFlag.textContent;

    fromLabel.textContent = toLabel.textContent;
    fromFlag.textContent  = toFlag.textContent;

    toLabel.textContent = oldLabel;
    toFlag.textContent  = oldFlag;
});

// ============================================
// CLIQUE SUR "TRADUIRE"
// ============================================
translateBtn.addEventListener("click", doTranslate);

async function doTranslate() {
    const word = input.value.trim();
    if (!word) return;

    showLoading(word);

    const from = fromLabel.textContent === "Anglais" ? "en" : "fr";
    const to   = toLabel.textContent === "Français" ? "fr" : "en";

    try {
        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, from, to })
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Erreur API");

        renderResult(word, data);

    } catch (err) {
        renderError(word);
    }
}

// ============================================
// AFFICHAGE LOADING
// ============================================
function showLoading(word) {
    resultCard.style.display = "block";
    resultTitle.textContent = word;

    document.getElementById("tab-traduction").innerHTML =
        `<p>⏳ Traduction en cours...</p>`;
    document.getElementById("tab-definition").innerHTML = "";
    document.getElementById("tab-synonymes").innerHTML = "";
    document.getElementById("tab-exemples").innerHTML = "";
}

// ============================================
// AFFICHAGE ERREUR
// ============================================
function renderError(word) {
    resultCard.style.display = "block";
    resultTitle.textContent = word;

    document.getElementById("tab-traduction").innerHTML =
        `<p style="color:#c00;">⚠️ Erreur serveur.</p>`;
    document.getElementById("tab-definition").innerHTML = "";
    document.getElementById("tab-synonymes").innerHTML = "";
    document.getElementById("tab-exemples").innerHTML = "";
}

// ============================================
// AFFICHAGE RÉSULTAT + ONGLET
// ============================================
function renderResult(word, data) {
    resultCard.style.display = "block";
    resultTitle.textContent = word;

    document.getElementById("tab-traduction").innerHTML =
        formatList("Traductions", data.translations);

    document.getElementById("tab-definition").innerHTML =
        formatList("Définitions", data.definitions);

    document.getElementById("tab-synonymes").innerHTML =
        formatList("Synonymes", data.synonyms);

    document.getElementById("tab-exemples").innerHTML =
        formatExamples(data.examples);

    setupTabs();
}

// ============================================
// FORMATTERS
// ============================================
function formatList(title, arr) {
    if (!arr || arr.length === 0) return `<p>Aucune donnée disponible.</p>`;
    return `<h3>${title}</h3><ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
}

function formatExamples(arr) {
    if (!arr || arr.length === 0) return `<p>Aucun exemple disponible.</p>`;
    return `<h3>Exemples</h3><ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
}

// ============================================
// GESTION DES ONGLET
// ============================================
function setupTabs() {
    document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(btn.dataset.target).classList.add("active");
        });
    });
}
