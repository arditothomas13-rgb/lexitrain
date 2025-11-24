// ---------------------------------------------------------
// LEXITRAIN — DICTIONARY ENGINE
// Moteur intelligent pour dictionnaire FR ↔ EN (scalable)
// ---------------------------------------------------------

// CACHE INTERNE
const LexiCache = {
    dictionary_en_fr: null,
    dictionary_fr_en: null,
    synonyms: null,
    examples: null,
    idioms: null,
    loaded: false
};


// ---------------------------------------------------------
// 1) NORMALISATION DES MOTS
// ---------------------------------------------------------
function normalizeWord(word) {
    return word.toLowerCase().trim();
}


// ---------------------------------------------------------
// 2) DÉTECTION AUTOMATIQUE DE LA LANGUE
// ---------------------------------------------------------
function detectLanguage(text) {
    text = text.trim().toLowerCase();

    const accents = /[éèêëàâîïùûç]/i;
    const commonEnglish = ["the", "is", "on", "with", "from", "that", "this", "and"];

    if (accents.test(text)) return "fr";
    if (commonEnglish.some(w => text.includes(w))) return "en";

    // fallback par alphabet
    return /^[a-z]+$/i.test(text) ? "en" : "fr";
}


// ---------------------------------------------------------
// 3) FUZZY SEARCH (recherche floue)
// Permet de trouver : wolf, wolfed, wolf down, wolfing…
–---------------------------------------------------------
function fuzzySearch(term, dictionary) {
    term = normalizeWord(term);
    if (dictionary[term]) return term;

    // recherche approximative (commence par…)
    const keys = Object.keys(dictionary);
    const found = keys.find(k => k.startsWith(term));

    return found || null;
}


// ---------------------------------------------------------
// 4) CHARGEMENT DES FICHIERS DICTIONNAIRE
// Appelé une seule fois au démarrage
// ---------------------------------------------------------
async function loadLexiDictionary() {
    if (LexiCache.loaded) return;

    const files = [
        { key: "dictionary_en_fr", path: "./data/dictionary_en_fr.json" },
        { key: "dictionary_fr_en", path: "./data/dictionary_fr_en.json" },
        { key: "synonyms", path: "./data/synonyms.json" },
        { key: "examples", path: "./data/examples.json" },
        { key: "idioms", path: "./data/idioms_phrasal.json" }
    ];

    for (let f of files) {
        try {
            const res = await fetch(f.path);
            LexiCache[f.key] = await res.json();
        } catch (err) {
            console.warn("⚠ Impossible de charger :", f.path);
            LexiCache[f.key] = {};
        }
    }

    LexiCache.loaded = true;
    console.log("📘 LexiTrain dictionary loaded.");
}


// ---------------------------------------------------------
// 5) MOTEUR DE TRADUCTION INTELLIGENTE
// ---------------------------------------------------------
function smartTranslate(term, fromLang, toLang) {
    term = normalizeWord(term);

    const dict =
        fromLang === "en"
            ? LexiCache.dictionary_en_fr
            : LexiCache.dictionary_fr_en;

    if (!dict) {
        return {
            meanings: ["(Dictionnaire non chargé)"],
            synonyms: [],
            examples: []
        };
    }

    // recherche directe
    let key = dict[term] ? term : fuzzySearch(term, dict);

    if (!key) {
        return {
            meanings: ["(Aucune traduction trouvée)"],
            synonyms: [],
            examples: []
        };
    }

    const meanings = dict[key] || [];

    // SYNONYMES
    const syn = LexiCache.synonyms[key] || [];

    // EXEMPLES
    const ex = LexiCache.examples[key] || [];

    return {
        meanings,
        synonyms: syn,
        examples: ex
    };
}


// ---------------------------------------------------------
// 6) API PUBLIQUE DU MOTEUR
// ---------------------------------------------------------
const LexiEngine = {
    load: loadLexiDictionary,
    detectLanguage,
    translate: smartTranslate
};

export default LexiEngine;
