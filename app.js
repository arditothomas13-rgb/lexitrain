// ----------------------
// DICTIONNAIRE INTELLIGENT
// ----------------------
const dictionary = {
    "book": {
        fr: {
            meanings: ["livre", "ouvrage", "volume"],
            synonyms: ["manuel", "brochure"],
            examples: [
                { en: "I bought a book yesterday.", fr: "J'ai acheté un livre hier." },
                { en: "This book changed my life.", fr: "Ce livre a changé ma vie." }
            ]
        }
    },

    "wolfed down": {
        fr: {
            meanings: ["engloutir", "dévorer rapidement"],
            synonyms: ["ingurgiter", "avaler d’un trait"],
            examples: [
                { en: "He wolfed down his burger in seconds.", fr: "Il a englouti son burger en quelques secondes." },
                { en: "She wolfed down the pasta.", fr: "Elle a dévoré les pâtes." }
            ]
        }
    },

    "livre": {
        en: {
            meanings: ["book"],
            synonyms: ["volume", "novel"],
            examples: [
                { fr: "Ce livre est incroyable.", en: "This book is amazing." },
                { fr: "J'ai perdu mon livre.", en: "I lost my book." }
            ]
        }
    }
};


// ----------------------
// LANGUAGE DETECTION
// ----------------------
function detectLanguage(text) {
    const frenchAccents = /[éèêëàâîïùûç]/i;
    const englishWords = ["the", "and", "of", "to", "with", "from"];

    if (frenchAccents.test(text)) return "fr";
    if (englishWords.some(w => text.toLowerCase().includes(w))) return "en";

    // fallback
    return text.match(/[a-zA-Z]/) ? "en" : "fr";
}


// ----------------------
// SMART TRANSLATION ENGINE
// ----------------------
function smartTranslate(term, from, to) {
    term = term.toLowerCase().trim();

    if (dictionary[term] && dictionary[term][to]) {
        return dictionary[term][to];
    }

    return {
        meanings: ["(Aucune traduction exacte trouvée)"],
        synonyms: [],
        examples: []
    };
}


// ----------------------
// DISPLAY RESULT
// ----------------------
function displayResult(data) {
    const box = document.getElementById("resultBox");
    box.style.display = "block";

    document.getElementById("meanings").innerHTML =
        `<h3>Traductions :</h3><p>${data.meanings.join(", ")}</p>`;

    document.getElementById("synonyms").innerHTML =
        data.synonyms.length ?
        `<h3>Synonymes :</h3><p>${data.synonyms.join(", ")}</p>` :
        "";

    document.getElementById("examples").innerHTML =
        data.examples.length ?
        `<h3>Exemples :</h3>${data.examples.map(
            ex => `<p>• ${ex.en}<br><span class='fr'>↳ ${ex.fr}</span></p>`
        ).join("")}` :
        "";
}



// ----------------------
// SWITCH LANGUAGES
// ----------------------
function switchLanguages() {
    const langA = document.getElementById("langA");
    const langB = document.getElementById("langB");
    const flagA = document.getElementById("flagA");
    const flagB = document.getElementById("flagB");

    // Swap textes
    let tmp = langA.textContent;
    langA.textContent = langB.textContent;
    langB.textContent = tmp;

    // Swap drapeaux
    let tempFlag = flagA.textContent;
    flagA.textContent = flagB.textContent;
    flagB.textContent = tempFlag;
}



// ----------------------
// MAIN TRANSLATE BUTTON
// ----------------------
function handleTranslate() {
    const value = document.getElementById("inputText").value.trim();
    if (!value) return;

    const detected = detectLanguage(value);
    let from = detected;
    let to = detected === "fr" ? "en" : "fr";

    const result = smartTranslate(value.toLowerCase(), from, to);

    displayResult(result);
}
