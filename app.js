// -----------------------------------------
// Lazy-loading du dictionnaire Premium 10k
// -----------------------------------------
let DICT = null;

async function loadDictionary() {
    if (DICT) return DICT;

    try {
        const response = await fetch(
            "https://fidji-bucket.s3.eu-west-3.amazonaws.com/lexitrain-dictionary-10k.json"
        );
        DICT = await response.json();
        console.log("📘 Dictionnaire chargé :", DICT);
    } catch (err) {
        console.error("Erreur lors du chargement du dictionnaire :", err);
        alert("Impossible de charger le dictionnaire. Réessaye plus tard.");
    }

    return DICT;
}

// -----------------------------------------
// Détection automatique de langue
// -----------------------------------------
function detectLanguage(text) {
    const frenchAccents = /[éèêëàâîïùûç]/i;
    const englishCommonWords = ["the", "and", "to", "with", "for", "from", "in"];

    if (frenchAccents.test(text)) return "fr";
    if (englishCommonWords.some(w => text.toLowerCase().includes(w))) return "en";

    return /^[a-zA-Z]+$/.test(text) ? "en" : "fr";
}

// -----------------------------------------
// Fonction de traduction intelligente
// -----------------------------------------
function translateTerm(term, dictionary) {
    const clean = term.toLowerCase().trim();

    if (!dictionary[clean]) {
        return {
            meanings: ["(Aucune traduction trouvée)"],
            synonyms: [],
            examples: []
        };
    }

    return dictionary[clean];
}

// -----------------------------------------
// Affichage des résultats
// -----------------------------------------
function displayResult(data) {
    const box = document.getElementById("resultBox");
    box.style.display = "block";

    // Traductions
    document.getElementById("meanings").innerHTML =
        `<h3>Traductions :</h3><p>${data.meanings.join(", ")}</p>`;

    // Synonymes
    document.getElementById("synonyms").innerHTML =
        data.synonyms && data.synonyms.length
            ? `<h3>Synonymes :</h3><p>${data.synonyms.join(", ")}</p>`
            : "";

    // Exemples
    document.getElementById("examples").innerHTML =
        data.examples && data.examples.length
            ? `<h3>Exemples :</h3>${data.examples
                  .map(
                      ex => `<p>• ${ex.en}<br><span class="fr">↳ ${ex.fr}</span></p>`
                  )
                  .join("")}`
            : "";
}

// -----------------------------------------
// Interversion des langues UI
// -----------------------------------------
function switchLanguages() {
    const langA = document.getElementById("langA");
    const langB = document.getElementById("langB");
    const flagA = document.getElementById("flagA");
    const flagB = document.getElementById("flagB");

    // swap texte
    let tmp = langA.textContent;
    langA.textContent = langB.textContent;
    langB.textContent = tmp;

    // swap drapeaux
    let tmpFlag = flagA.textContent;
    flagA.textContent = flagB.textContent;
    flagB.textContent = tmpFlag;
}

// -----------------------------------------
// Action bouton Traduire
// -----------------------------------------
document.getElementById("btnTranslate").addEventListener("click", async () => {
    const input = document.getElementById("inputText").value.trim();
    if (!input) return;

    // 1) charger le dictionnaire (lazy-load)
    const dictionary = await loadDictionary();

    // 2) détection automatique
    const detected = detectLanguage(input);

    console.log("Langue détectée :", detected);

    // 3) traduction
    const result = translateTerm(input, dictionary);

    // 4) affichage
    displayResult(result);
});

// -----------------------------------------
// Action bouton d’inversion des langues
// -----------------------------------------
document.getElementById("switchBtn").addEventListener("click", () => {
    switchLanguages();
});
