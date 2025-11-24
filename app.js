// ----------------------------
// VARIABLES
// ----------------------------
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");
const resultBox = document.getElementById("resultBox");

const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");

let currentTab = "translation";

// ----------------------------
// SWAP DES LANGUES
// ----------------------------
langSwap.addEventListener("click", () => {
    const tmpLabel = fromLabel.textContent;
    const tmpFlag = fromFlag.textContent;

    fromLabel.textContent = toLabel.textContent;
    fromFlag.textContent = toFlag.textContent;
    toLabel.textContent = tmpLabel;
    toFlag.textContent = tmpFlag;
});

// ----------------------------
// ACTION DU BOUTON TRADUIRE
// ----------------------------
translateBtn.addEventListener("click", async () => {
    const word = input.value.trim();
    if (!word) return;

    showLoadingState();

    try {
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                word,
                from: fromLabel.textContent === "Anglais" ? "en" : "fr",
                to: toLabel.textContent === "Français" ? "fr" : "en"
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error("Erreur API");

        renderResult(word, data);

    } catch (error) {
        resultBox.innerHTML = `
            <h2>${word}</h2>
            <div class="tabs">
                <button class="active">Traduction</button>
            </div>
            <div class="tab-content">
                <p style="color:#cc0000;">⚠️ Erreur serveur.</p>
            </div>
        `;
        resultBox.style.opacity = 1;
    }
});

// ----------------------------
// AFFICHAGE "TRADUCTION EN COURS"
// ----------------------------
function showLoadingState() {
    resultBox.style.opacity = 1;
    resultBox.innerHTML = `
        <h2>Analyse...</h2>
        <p class="loading">⏳ Traduction en cours...</p>
    `;
}

// ----------------------------
// AFFICHAGE RÉSULTAT + ONGLET
// ----------------------------
function renderResult(word, data) {

    resultBox.innerHTML = `
        <h2>${word}</h2>

        <div class="tabs">
            <button data-tab="translation" class="active">Traduction</button>
            <button data-tab="definition">Définition</button>
            <button data-tab="synonyms">Synonymes</button>
            <button data-tab="examples">Exemples</button>
        </div>

        <div id="tabContent" class="tab-content"></div>
    `;

    const tabContent = document.getElementById("tabContent");

    // Contenu
    const sections = {
        translation: buildList("Traductions :", data.translations),
        definition: buildList("Définitions :", data.definitions),
        synonyms: buildList("Synonymes :", data.synonyms),
        examples: buildExamples(data.examples)
    };

    // Affiche l’onglet par défaut
    tabContent.innerHTML = sections["translation"];

    // Gestion du clic onglets
    document.querySelectorAll(".tabs button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            tabContent.innerHTML = sections[btn.dataset.tab];
        });
    });
}

// ----------------------------
// CONSTRUCTION LISTE BASIQUE
// ----------------------------
function buildList(title, arr) {
    if (!arr || arr.length === 0) return `<p>Aucune donnée disponible.</p>`;

    return `
        <h3>${title}</h3>
        <ul>
            ${arr.map(x => `<li>${x}</li>`).join("")}
        </ul>
    `;
}

// ----------------------------
// CONSTRUCTION DES EXEMPLES
// ----------------------------
function buildExamples(arr) {
    if (!arr || arr.length === 0) return `<p>Aucun exemple disponible.</p>`;

    return `
        <h3>Exemples :</h3>
        <ul>
            ${arr.map(ex => `<li>${ex}</li>`).join("")}
        </ul>
    `;
}
