// ============================================
// VARIABLES
// ============================================
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");
const resultBox = document.getElementById("resultBox");

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
    const oldFlag = fromFlag.textContent;

    fromLabel.textContent = toLabel.textContent;
    fromFlag.textContent = toFlag.textContent;

    toLabel.textContent = oldLabel;
    toFlag.textContent = oldFlag;
});

// ============================================
// CLIQUE SUR "TRADUIRE"
// ============================================
translateBtn.addEventListener("click", doTranslate);

async function doTranslate() {
    const word = input.value.trim();
    if (!word) return;

    showLoading();

    const from = fromLabel.textContent === "Anglais" ? "en" : "fr";
    const to = toLabel.textContent === "Français" ? "fr" : "en";

    try {
        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, from, to })
        });

        const data = await res.json();

        if (!res.ok) throw new Error("API error");

        renderResult(word, data);

    } catch (err) {
        resultBox.innerHTML = `
            <h2>${word}</h2>
            <p style="color:#cc0000;">⚠️ Erreur serveur.</p>
        `;
    }
}

// ============================================
// LOADING
// ============================================
function showLoading() {
    resultBox.style.opacity = 1;
    resultBox.innerHTML = `
        <h2>Analyse...</h2>
        <p>⏳ Traduction en cours...</p>
    `;
}

// ============================================
// AFFICHAGE DU RÉSULTAT + ONGLET
// ============================================
function renderResult(word, data) {
    resultBox.innerHTML = `
        <h2>${word}</h2>

        <div class="tabs">
            <button class="active" data-tab="translation">Traduction</button>
            <button data-tab="definition">Définition</button>
            <button data-tab="synonyms">Synonymes</button>
            <button data-tab="examples">Exemples</button>
        </div>

        <div id="tabContent" class="tab-content"></div>
    `;

    const tabContent = document.getElementById("tabContent");

    const sections = {
        translation: formatList("Traductions", data.translations),
        definition: formatList("Définitions", data.definitions),
        synonyms: formatList("Synonymes", data.synonyms),
        examples: formatExamples(data.examples)
    };

    // Onglet par défaut
    tabContent.innerHTML = sections.translation;

    // Écouteurs onglets
    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabContent.innerHTML = sections[btn.dataset.tab];
        });
    });
}

// ============================================
// BUILDERS DE CONTENU
// ============================================
function formatList(title, arr) {
    if (!arr || arr.length === 0) {
        return `<p>Aucune donnée disponible.</p>`;
    }

    return `
        <h3>${title}</h3>
        <ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>
    `;
}

function formatExamples(arr) {
    if (!arr || arr.length === 0) return `<p>Aucun exemple disponible.</p>`;

    return `
        <h3>Exemples</h3>
        <ul>${arr.map(ex => `<li>${ex}</li>`).join("")}</ul>
    `;
}
