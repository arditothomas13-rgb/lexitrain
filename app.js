// -----------------------------------------
// LEXITRAIN — APP.JS (SAFE + PREMIUM READY)
// -----------------------------------------

let dictionary = null;      // Loaded lazily
let dictionaryLoaded = false;

// WHERE IS THE PREMIUM JSON ?
const DICT_URL = "./assets/data/lexitrain-premium.json";

// DOM ELEMENTS
const inputText = document.getElementById("inputText");
const translateBtn = document.getElementById("translateBtn");
const resultBox = document.getElementById("resultBox");
const meaningsDOM = document.getElementById("meanings");
const synonymsDOM = document.getElementById("synonyms");
const examplesDOM = document.getElementById("examples");

// LANG SWITCH
const langA = document.getElementById("langA");
const langB = document.getElementById("langB");
const flagA = document.getElementById("flagA");
const flagB = document.getElementById("flagB");

// -----------------------------------------
// 1 — LOAD DICTIONARY (lazy)
// -----------------------------------------
async function loadDictionary() {
    if (dictionaryLoaded) return;

    try {
        const res = await fetch(DICT_URL);
        dictionary = await res.json();
        dictionaryLoaded = true;
    } catch (err) {
        console.error("Erreur chargement dictionnaire :", err);
        alert("Impossible de charger le dictionnaire premium.");
    }
}

// -----------------------------------------
// 2 — DETECT LANGUAGE
// -----------------------------------------
function detectLanguage(text) {
    const accents = /[éèêëàâîïùûç]/i;
    const englishHints = ["the ", "and ", "with ", "from ", "ing", "ed"];

    if (accents.test(text)) return "fr";
    if (englishHints.some(h => text.toLowerCase().includes(h))) return "en";

    // fallback simple
    return /^[a-zA-Z]+$/.test(text) ? "en" : "fr";
}

// -----------------------------------------
// 3 — SMART TRANSLATE
// -----------------------------------------
function translateSmart(term, from, to) {
    if (!dictionary || !dictionary[term]) {
        return {
            meanings: ["(Aucune traduction exacte trouvée)"],
            synonyms: [],
            examples: []
        };
    }

    if (!dictionary[term][to]) {
        return {
            meanings: ["(Aucune traduction dans cette langue)"],
            synonyms: [],
            examples: []
        };
    }

    return dictionary[term][to];
}

// -----------------------------------------
// 4 — DISPLAY RESULT
// -----------------------------------------
function displayResult(data) {
    resultBox.style.display = "block";

    meaningsDOM.innerHTML =
        `<h3>Traductions :</h3><p>${data.meanings.join(", ")}</p>`;

    synonymsDOM.innerHTML =
        data.synonyms.length
            ? `<h3>Synonymes :</h3><p>${data.synonyms.join(", ")}</p>`
            : "";

    examplesDOM.innerHTML =
        data.examples.length
            ? `<h3>Exemples :</h3>` +
              data.examples
                .map(ex => `<p>• ${ex.en}<br><span class="fr">↳ ${ex.fr}</span></p>`)
                .join("")
            : "";
}

// -----------------------------------------
// 5 — HANDLE TRANSLATE BUTTON
// -----------------------------------------
translateBtn.addEventListener("click", async () => {
    const term = inputText.value.trim().toLowerCase();
    if (!term) return;

    await loadDictionary();

    const detected = detectLanguage(term);
    const from = detected;
    const to = detected === "fr" ? "en" : "fr";

    const result = translateSmart(term, from, to);
    displayResult(result);
});

// -----------------------------------------
// 6 — SWITCH LANGUAGES
// -----------------------------------------
function switchLanguages() {
    let tmp = langA.textContent;
    langA.textContent = langB.textContent;
    langB.textContent = tmp;

    let tmpFlag = flagA.textContent;
    flagA.textContent = flagB.textContent;
    flagB.textContent = tmpFlag;
}

document.getElementById("switchBtn").addEventListener("click", switchLanguages);
