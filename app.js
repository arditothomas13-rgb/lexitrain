// ---------------------------------------------
// LexiTrain — Version Apple Premium
// Navigation + Traduction + Historique + Dico
// ---------------------------------------------

/* ---------------------------------------------
   ELEMENTS DOM
--------------------------------------------- */
const inputField = document.getElementById("input");
const translateBtn = document.getElementById("translateBtn");
const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");

const senseTabs = document.getElementById("senseTabs");
const senseContent = document.getElementById("senseContent");

// Pages
const pageTranslate = document.getElementById("page-translate");
const pageDictionary = document.getElementById("page-dictionary");

// Nav buttons
const openDictionaryBtn = document.getElementById("openDictionary");
const navTranslateBtn = document.getElementById("navTranslate");

// Dico
const dictionaryList = document.getElementById("dictionaryList");
const dictionarySearch = document.getElementById("dictionarySearch");

// Historique
const historyList = document.getElementById("historyList");

/* ---------------------------------------------
   API CALL — translate.js
--------------------------------------------- */
async function fetchWord(word) {
    try {
        const response = await fetch(`/api/translate.js?word=${encodeURIComponent(word)}`);
        return await response.json();
    } catch (err) {
        console.error("Erreur API translate.js :", err);
        return { error: "Impossible de récupérer la traduction." };
    }
}

/* ---------------------------------------------
   RENDER : Onglets des sens (pill)
--------------------------------------------- */
function renderSenseTabs(entries) {
    senseTabs.innerHTML = "";

    entries.forEach((entry, index) => {
        const pill = document.createElement("div");
        pill.className = "sense-pill";
        if (index === 0) pill.classList.add("active");

        pill.textContent = entry.label;

        pill.addEventListener("click", () => {
            document.querySelectorAll(".sense-pill")
                .forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            renderSenseContent(entry);
        });

        senseTabs.appendChild(pill);
    });
}

/* ---------------------------------------------
   RENDER : Contenu du sens sélectionné
--------------------------------------------- */
function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    /* ---- Définition ---- */
    if (entry.definition) {
        const defSection = document.createElement("div");
        defSection.className = "glass translation-list";
        defSection.innerHTML = `
            <div class="sense-block-title">Definition</div>
            <div class="definition-text">${entry.definition}</div>
        `;
        senseContent.appendChild(defSection);
    }

    /* ---- Traductions ---- */
    const tBlock = document.createElement("div");
    tBlock.className = "glass translation-list";
    tBlock.innerHTML = `<div class="sense-block-title">Translations</div>`;

    entry.translations.forEach(t => {
        const item = document.createElement("div");
        item.className = "translation-item";
        item.textContent = t;
        tBlock.appendChild(item);
    });

    senseContent.appendChild(tBlock);

    /* ---- Exemples ---- */
    const eBlock = document.createElement("div");
    eBlock.className = "glass examples-list";
    eBlock.innerHTML = `<div class="sense-block-title">Examples</div>`;

    entry.examples.forEach(ex => {
        const exampleDiv = document.createElement("div");
        exampleDiv.className = "example-block";

        exampleDiv.innerHTML = `
            <div class="example-text">• ${ex.src}</div>
            <div class="example-translation">→ ${ex.dest}</div>
        `;

        eBlock.appendChild(exampleDiv);
    });

    senseContent.appendChild(eBlock);

    /* ---- Synonymes ---- */
    const synTitle = document.createElement("div");
    synTitle.className = "sense-block-title";
    synTitle.textContent = "Synonyms";
    senseContent.appendChild(synTitle);

    const sBlock = document.createElement("div");
    sBlock.className = "glass synonyms-wrapper";

    entry.synonyms.forEach(syn => {
        const tag = document.createElement("div");
        tag.className = "synonym-tag";
        tag.textContent = syn;
        sBlock.appendChild(tag);
    });

    senseContent.appendChild(sBlock);
}

/* ---------------------------------------------
   ACTION : Traduire un mot
--------------------------------------------- */
async function translateWord() {
    const word = inputField.value.trim();
    if (!word) return;

    resultTitle.textContent = word;
    resultCard.style.display = "block";

    const data = await fetchWord(word);

    if (data.error) {
        senseTabs.innerHTML = "";
        senseContent.innerHTML = `<div class="error">${data.error}</div>`;
        return;
    }

    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    // ---- AJOUTER À L’HISTORIQUE ----
    await fetch(`/api/history-add.js?word=${encodeURIComponent(word)}`);
    await loadHistory();
}

/* ---------------------------------------------
   LISTENERS Traduction
--------------------------------------------- */
translateBtn.addEventListener("click", translateWord);

inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") translateWord();
});

/* ---------------------------------------------
   PAGE SWITCHING
--------------------------------------------- */
function openTranslatePage() {
    pageTranslate.style.display = "block";
    pageDictionary.style.display = "none";
}

function openDictionaryPage() {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "block";
}

/* ---------------------------------------------
   Ouvrir la page DICO
--------------------------------------------- */
openDictionaryBtn.addEventListener("click", () => {
    openDictionaryPage();
    loadDictionary();
});

/* ---------------------------------------------
   Revenir à Traduire
--------------------------------------------- */
navTranslateBtn.addEventListener("click", () => {
    openTranslatePage();
});

/* ---------------------------------------------
   API LIST-WORDS : Charger liste des mots KV
--------------------------------------------- */
async function loadDictionary(search = "") {
    try {
        const res = await fetch(`/api/list-words.js?q=${search}`);
        const data = await res.json();

        dictionaryList.innerHTML = "";

        data.words.forEach(w => {
            const item = document.createElement("div");
            item.className = "dic-item";
            item.textContent = w;

            item.addEventListener("click", () => {
                inputField.value = w;
                openTranslatePage();
                translateWord();
            });

            dictionaryList.appendChild(item);
        });

    } catch (err) {
        console.error("Erreur list-words:", err);
    }
}

/* ---------------------------------------------
   Recherche dynamique dans le Dico
--------------------------------------------- */
dictionarySearch.addEventListener("input", (e) => {
    loadDictionary(e.target.value.toLowerCase());
});

/* ---------------------------------------------
   HISTORIQUE — charger depuis KV
--------------------------------------------- */
async function loadHistory() {
    try {
        const res = await fetch("/api/history-get.js");
        const data = await res.json();

        historyList.innerHTML = "";

        data.history.forEach(w => {
            const item = document.createElement("div");
            item.className = "history-item";
            item.textContent = w;

            item.addEventListener("click", () => {
                inputField.value = w;
                translateWord();
            });

            historyList.appendChild(item);
        });

    } catch (err) {
        console.error("HISTORY ERROR:", err);
    }
}

/* ---------------------------------------------
   CHARGER L’HISTORIQUE AU DÉMARRAGE
--------------------------------------------- */
loadHistory();
