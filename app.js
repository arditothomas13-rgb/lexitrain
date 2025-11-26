/**************************************************************
 * LexiTrain — APP.JS PRO (Traduction + Dico Premium + Quiz)
 **************************************************************/

/* -----------------------------
   GLOBAL LANGUAGE STATE
----------------------------- */
let fromLang = "en";
let toLang = "fr";
let dictionaryLang = "en";

/* -----------------------------
   DOM ELEMENTS
----------------------------- */
const inputField = document.getElementById("input");
const translateBtn = document.getElementById("translateBtn");

const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");
const senseTabs = document.getElementById("senseTabs");
const senseContent = document.getElementById("senseContent");

const fromFlag = document.getElementById("fromFlag");
const fromLabel = document.getElementById("fromLabel");
const toFlag = document.getElementById("toFlag");
const toLabel = document.getElementById("toLabel");

const pageTranslate = document.getElementById("page-translate");
const pageDictionary = document.getElementById("page-dictionary");
const pageQuiz = document.getElementById("page-quiz");

const navTranslate = document.getElementById("navTranslate");
const openDictionary = document.getElementById("openDictionary");
const openQuiz = document.getElementById("openQuiz");

const dictionaryList = document.getElementById("dictionaryList");
const dictionarySearch = document.getElementById("dictionarySearch");

const alphabetScroller = document.getElementById("alphabetScroller");
const letterPopup = document.getElementById("letterPopup");

const historyList = document.getElementById("historyList");

const btnDicEn = document.getElementById("dicLangEn");
const btnDicFr = document.getElementById("dicLangFr");

const quizLoader = document.getElementById("quizLoader");
const quizCard = document.getElementById("quizCard");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizResult = document.getElementById("quizResult");
const quizScore = document.getElementById("quizScore");
const quizRestart = document.getElementById("quizRestart");
const autoSwitchMessageContainer = document.getElementById("autoSwitchMessageContainer");


/**************************************************************
 * OFFLINE CACHE
 **************************************************************/
function getLocalCache(key) {
    try {
        return JSON.parse(localStorage.getItem("lexitrain_cache:" + key));
    } catch {
        return null;
    }
}
function setLocalCache(key, value) {
    try {
        localStorage.setItem("lexitrain_cache:" + key, JSON.stringify(value));
    } catch {}
}

/* -----------------------------
   LANGUAGE SWAP
----------------------------- */

// Bouton swap (ajoute cet ID dans ton HTML si pas présent)
const swapBtn = document.getElementById("swapBtn");

// Fonction switch EN/FR
function swapLanguages() {
    const temp = fromLang;
    fromLang = toLang;
    toLang = temp;

    updateLanguageUI(); // met à jour drapeaux + labels
}

// Listener sur le bouton
if (swapBtn) {
    swapBtn.addEventListener("click", swapLanguages);
}

/**************************************************************
 * UI LANGUAGE UPDATE
 **************************************************************/
function updateLanguageUI() {
    if (fromLang === "en") {
        fromFlag.textContent = "🇬🇧";
        fromLabel.textContent = "Anglais";
        toFlag.textContent = "🇫🇷";
        toLabel.textContent = "Français";
    } else {
        fromFlag.textContent = "🇫🇷";
        fromLabel.textContent = "Français";
        toFlag.textContent = "🇬🇧";
        toLabel.textContent = "Anglais";
    }
}

/**************************************************************
 * AUTO DETECTION LANGUE (EN / FR)
 **************************************************************/

function detectLanguage(text) {
    const lower = text.toLowerCase().trim();
    if (!lower) return null;

    // Accents français typiques
    const hasAccent = /[àâäçéèêëîïôöùûüÿœç]/i.test(lower);

    const frenchWords = [
        "le","la","les","des","un","une","du","au","aux",
        "je","tu","il","elle","on","nous","vous","ils","elles",
        "ne","pas","mais","ou","et","donc","or","ni","car",
        "être","avoir","faire"
    ];
    const englishWords = [
        "the","and","of","to","in","is","you","that","it",
        "for","on","with","as","this","but","his","her","by","from"
    ];

    let frScore = 0;
    let enScore = 0;

    // Un accent = très fort indice français
    if (hasAccent) frScore += 3;

    const tokens = lower.split(/\s+/).filter(Boolean);

    // Mots outils FR / EN
    for (const t of tokens) {
        if (frenchWords.includes(t)) frScore += 2;
        if (englishWords.includes(t)) enScore += 2;
    }

    // Terminaisons / patterns typiques
    const frenchPatterns = /(ou|oi|ai|eau|eur|euse|ment|tion|age|ance|ence|eux|eaux|ette|arde)$/;
    const englishPatterns = /(ing|ed|ly|ness|ous|able|ible|ment|tion)$/;

    for (const t of tokens) {
        if (frenchPatterns.test(t)) frScore++;
        if (englishPatterns.test(t)) enScore++;
    }

    // 💡 Heuristique spéciale pour les verbes français simples : -er, -ir, -re
    if (tokens.length === 1) {
        const t = tokens[0];
        if (/(er|ir|re)$/.test(t) && t.length > 3) {
            frScore += 2;
        }
    }

    // Rien de probant → on ne touche à rien
    if (frScore === 0 && enScore === 0) return null;

    if (frScore >= enScore + 1) return "fr";
    if (enScore >= frScore + 1) return "en";

    // Trop serré → on ne change pas non plus
    return null;
}

function showLanguageWarning(fromLabel, toLabel) {
    if (!autoSwitchMessageContainer) return;
    autoSwitchMessageContainer.textContent =
        `Mauvaise langue détectée, je bascule de ${fromLabel} vers ${toLabel}.`;
    autoSwitchMessageContainer.style.display = "block";
}

function hideLanguageWarning() {
    if (!autoSwitchMessageContainer) return;
    autoSwitchMessageContainer.style.display = "none";
    autoSwitchMessageContainer.textContent = "";
}

/**************************************************************
 * NAVIGATION
 **************************************************************/
function openTranslatePage() {
    pageTranslate.style.display = "block";
    pageDictionary.style.display = "none";
    pageQuiz.style.display = "none";
}

navTranslate.addEventListener("click", openTranslatePage);

openDictionary.addEventListener("click", () => {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "block";
    pageQuiz.style.display = "none";
    loadDictionary();
});

openQuiz.addEventListener("click", () => {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "none";
    pageQuiz.style.display = "block";

    startQuiz();
});

/**************************************************************
 * SMART FETCH WORD (GPT + Cache)
 **************************************************************/
async function fetchWord(word, cacheOnly = false) {
    const cacheKey = `${word}_${fromLang}_${toLang}`.toLowerCase();

    const local = getLocalCache(cacheKey);
    if (local) return local;

    try {
        const cloud = await fetch(`/api/kv-get?key=${cacheKey}`);
        const data = await cloud.json();
        if (data.result) {
            const parsed = JSON.parse(data.result);
            setLocalCache(cacheKey, parsed);
            return parsed;
        }
    } catch {}

    if (!cacheOnly) {
        const res = await fetch(
            `/api/get-word?word=${encodeURIComponent(word)}&from=${fromLang}&to=${toLang}`
        );
        const apiData = await res.json();
        setLocalCache(cacheKey, apiData);
        return apiData;
    }

    return { error: "Donnée indisponible hors-ligne" };
}

/**************************************************************
 * TRANSLATION RENDER
 **************************************************************/
function showLoader() {
    // Affiche la carte de résultat
    resultCard.style.display = "block";

    // Titre central avec effet dégradé façon Apple
    resultTitle.innerHTML = `
        <div class="status-title">
            Traduction en cours…
        </div>
    `;

    // On vide les onglets et le contenu précédent
    senseTabs.innerHTML = "";
    senseContent.innerHTML = `
        <div class="status-loader">
            <div class="status-loader-icon">⏳</div>
        </div>
    `;
}

function clearResult() {
    resultTitle.textContent = "";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = "";
}

function renderSenseTabs(entries) {
    senseTabs.innerHTML = "";
    entries.forEach((e, i) => {
        const pill = document.createElement("div");
        pill.className = "sense-pill";
        if (i === 0) pill.classList.add("active");
        pill.textContent = e.label;
        pill.addEventListener("click", () => {
            document
                .querySelectorAll(".sense-pill")
                .forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            renderSenseContent(e);
        });
        senseTabs.appendChild(pill);
    });
}

function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    // Bloc définition
    if (entry.definition) {
        senseContent.innerHTML += `
            <div class="glass translation-list">
                <div class="sense-block-title">Definition</div>
                <div>${entry.definition}</div>
            </div>
        `;
    }

    // Bloc traductions
    senseContent.innerHTML += `
        <div class="glass translation-list">
            <div class="sense-block-title">Traductions</div>
            ${entry.translations
                .map(t => `<div class="translation-item">${t}</div>`)
                .join("")}
        </div>
    `;

    // Bloc exemples EN + FR
    const examplesHtml =
        entry.examples && entry.examples.length
            ? entry.examples
                  .map(ex => {
                      // Cas ancien : juste une chaîne de texte
                      if (typeof ex === "string") {
                          return `<div>• ${ex}</div>`;
                      }

                      const src = ex.src || "";
                      const dest = ex.dest || "";

                      // Cas complet : phrase source + traduction
                      if (src && dest) {
                          return `
                              <div class="example-item">
                                  <div>• ${src}</div>
                                  <div class="example-dest">${dest}</div>
                              </div>
                          `;
                      }

                      // Si jamais il manque un des deux, on affiche ce qu'on peut
                      return `<div>• ${src || dest}</div>`;
                  })
                  .join("")
            : `<div>Aucun exemple disponible</div>`;

    senseContent.innerHTML += `
        <div class="glass examples-list">
            <div class="sense-block-title">Exemples</div>
            ${examplesHtml}
        </div>
    `;

    // Bloc synonymes
    if (entry.synonyms && entry.synonyms.length) {
        senseContent.innerHTML += `
            <div class="sense-block-title">Synonymes</div>
            <div class="glass synonyms-wrapper">
                ${entry.synonyms
                    .map(s => `<div class="synonym-tag" data-word="${s}">${s}</div>`)
                    .join("")}
            </div>
        `;

        document.querySelectorAll(".synonym-tag").forEach(tag => {
            tag.addEventListener("click", () => {
                inputField.value = tag.dataset.word;
                translateWord();
            });
        });
    }
}

/**************************************************************
 * TRANSLATE ACTION
 **************************************************************/
async function translateWord(isSwap = false, cacheOnly = false) {
    const word = inputField.value.trim();
    if (!word) return;

    // 🔍 Détection automatique de langue (seulement en mode normal)
    if (!cacheOnly) {
        const detected = detectLanguage(word);

        if (detected && detected !== fromLang) {
            const oldFromLabel = fromLang === "en" ? "Anglais" : "Français";
            const newFromLabel = detected === "en" ? "Anglais" : "Français";

            // On bascule le sens de traduction
            fromLang = detected;
            toLang = detected === "en" ? "fr" : "en";
            updateLanguageUI();

            showLanguageWarning(oldFromLabel, newFromLabel);
        } else {
            // Rien de suspect → on masque le message
            hideLanguageWarning();
        }
    }

    clearResult();
    showLoader();

    const data = await fetchWord(word, cacheOnly);

    if (data.error) {
        resultTitle.textContent = "❌ Erreur";
        senseContent.innerHTML = `<div>${data.error}</div>`;
        return;
    }

    resultTitle.textContent = word;
    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    // Ajouter à l'historique et au dico seulement si on n'est pas en mode "cacheOnly"
    if (!cacheOnly) {
        addToHistory(word);

        // 🧠 Auto-ajout au dictionnaire (EN ou FR selon fromLang après éventuel switch)
        try {
            await fetch("/api/dict-auto-add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    word,
                    entries: data.entries,
                    lang: fromLang // "en" ou "fr"
                })
            });
        } catch (e) {
            console.error("DICT AUTO ADD client error:", e);
        }
    }
}

/**************************************************************
 * HISTORY
 **************************************************************/
function loadHistory() {
    const list = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    historyList.innerHTML = "";

    list.forEach(word => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.textContent = word;

        item.addEventListener("click", async () => {
            inputField.value = word;
            translateWord(false, true);
            openTranslatePage();
        });

        historyList.appendChild(item);
    });
}
loadHistory();

function addToHistory(word) {
    let list = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    list = [word, ...list.filter(x => x !== word)].slice(0, 20);
    localStorage.setItem("lexitrain_history", JSON.stringify(list));
    loadHistory();
}

/**************************************************************
 * DICTIONARY LANGUAGE TOGGLE
 **************************************************************/
if (btnDicEn && btnDicFr) {
    btnDicEn.addEventListener("click", () => {
        dictionaryLang = "en";
        btnDicEn.classList.add("active");
        btnDicFr.classList.remove("active");
        loadDictionary(dictionarySearch.value.toLowerCase());
    });

    btnDicFr.addEventListener("click", () => {
        dictionaryLang = "fr";
        btnDicFr.classList.add("active");
        btnDicEn.classList.remove("active");
        loadDictionary(dictionarySearch.value.toLowerCase());
    });
}

/**************************************************************
 * DICTIONARY
 **************************************************************/
async function loadDictionary(q = "") {
    dictionaryList.innerHTML = "Chargement...";

    const res = await fetch(`/api/list-words?lang=${dictionaryLang}&q=${q}`);
    const data = await res.json();

    dictionaryList.innerHTML = "";

    (data.words || []).forEach(w => {
        const item = document.createElement("div");
        item.className = "dic-item";
        item.textContent = w;

        item.addEventListener("click", async () => {
            pageTranslate.style.display = "block";
            pageDictionary.style.display = "none";

            resultCard.style.display = "block";
            resultTitle.textContent = w;
            senseTabs.innerHTML = "";
            senseContent.innerHTML = "Chargement...";

            const res = await fetch(`/api/get-dict-word?word=${w}`);
            const dic = await res.json();

            if (!dic || dic.error) {
                senseContent.innerHTML = "<div>❌ Mot introuvable</div>";
                return;
            }

            // On reconstruit des entries au bon format pour réutiliser l'UI existante
            const entries = Array.isArray(dic.entries) && dic.entries.length
                ? dic.entries
                : [{
                    label: "",
                    definition: dic.definition || "",
                    translations: dic.translations || [],
                    examples: dic.examples || [],
                    synonyms: dic.synonyms || []
                }];

            renderSenseTabs(entries);
            renderSenseContent(entries[0]);
        });

        dictionaryList.appendChild(item);
    });
}

dictionarySearch.addEventListener("input", e => {
    loadDictionary(e.target.value.toLowerCase());
});

/**************************************************************
 * QUIZ — mode "chat professeur"
 *  1) L'app pose une question
 *  2) Tu écris la réponse
 *  3) Elle valide + explique
 **************************************************************/

const quizState = {
    questions: [],
    index: 0,
    score: 0,
    inputEl: null,
    submitEl: null,
    feedbackEl: null,
};

async function startQuiz() {
    quizLoader.style.display = "block";
    quizCard.style.display = "none";
    quizResult.style.display = "none";
    quizLoader.textContent = "Préparation du quiz…";

    quizState.questions = [];
    quizState.index = 0;
    quizState.score = 0;

    try {
        // 1) Récupérer des mots EN et FR
        const [enRes, frRes] = await Promise.all([
            fetch("/api/quiz-get-words?lang=en"),
            fetch("/api/quiz-get-words?lang=fr"),
        ]);

        const enData = await enRes.json();
        const frData = await frRes.json();

        let enWords = Array.isArray(enData.toReview) ? enData.toReview : [];
        let frWords = Array.isArray(frData.toReview) ? frData.toReview : [];

        // On limite le nombre par langue
        const MAX_PER_LANG = 10;
        enWords = enWords.slice(0, MAX_PER_LANG);
        frWords = frWords.slice(0, MAX_PER_LANG);

        const specs = [
            ...enWords.map((w) => ({ word: w, direction: "en_fr" })), // EN → FR
            ...frWords.map((w) => ({ word: w, direction: "fr_en" })), // FR → EN
        ];

        if (!specs.length) {
            quizLoader.textContent = "Aucun mot disponible pour le quiz.";
            return;
        }

        // 2) Précharger les traductions pour ces mots (via /api/get-word)
        const questionsRaw = await Promise.all(
            specs.map(async (spec) => {
                const from = spec.direction === "en_fr" ? "en" : "fr";
                const to = spec.direction === "en_fr" ? "fr" : "en";

                try {
                    const res = await fetch(
                        `/api/get-word?word=${encodeURIComponent(
                            spec.word
                        )}&from=${from}&to=${to}`
                    );
                    const data = await res.json();

                    if (!data || !Array.isArray(data.entries) || !data.entries.length) {
                        return null;
                    }

                    // On agrège toutes les traductions possibles
                    const translationsSet = new Set();
                    data.entries.forEach((entry) => {
                        if (Array.isArray(entry.translations)) {
                            entry.translations.forEach((t) => {
                                if (typeof t === "string" && t.trim()) {
                                    translationsSet.add(t.trim());
                                }
                            });
                        }
                    });

                    const translations = [...translationsSet];
                    if (!translations.length) return null;

                    const definition =
                        (data.entries[0] && data.entries[0].definition) || "";
                    const examples = Array.isArray(data.entries[0].examples)
                        ? data.entries[0].examples
                        : [];

                    return {
                        word: spec.word,
                        direction: spec.direction,
                        translations,
                        definition,
                        examples,
                    };
                } catch (e) {
                    console.error("QUIZ get-word error", e);
                    return null;
                }
            })
        );

        quizState.questions = questionsRaw.filter(Boolean);

        if (!quizState.questions.length) {
            quizLoader.textContent =
                "Impossible de préparer le quiz (aucune traduction trouvée).";
            return;
        }

        // Mélange et limite le nombre de questions
        shuffle(quizState.questions);
        const MAX_QUESTIONS = 15;
        quizState.questions = quizState.questions.slice(0, MAX_QUESTIONS);

        // Prépare l'UI (zone de saisie + bouton + feedback)
        setupQuizInputUI();

        quizLoader.style.display = "none";
        quizCard.style.display = "block";
        showNextQuizQuestion();

        // Bouton "Recommencer"
        if (quizRestart) {
            quizRestart.onclick = startQuiz;
        }
    } catch (err) {
        console.error("QUIZ ERROR", err);
        quizLoader.textContent = "Erreur lors du chargement du quiz.";
    }
}

/**
 * Crée l'input, le bouton "Valider" et la zone de feedback
 */
function setupQuizInputUI() {
    quizOptions.innerHTML = "";

    // Conteneur input + bouton
    const wrapper = document.createElement("div");
    wrapper.className = "quiz-input-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Écris ta réponse ici…";
    input.className = "quiz-answer-input";

    const button = document.createElement("button");
    button.textContent = "Valider";
    button.className = "quiz-submit-btn";

    wrapper.appendChild(input);
    wrapper.appendChild(button);

    const feedback = document.createElement("div");
    feedback.className = "quiz-feedback";

    quizOptions.appendChild(wrapper);
    quizOptions.appendChild(feedback);

    quizState.inputEl = input;
    quizState.submitEl = button;
    quizState.feedbackEl = feedback;

    const submitHandler = () => handleQuizSubmit();

    button.addEventListener("click", submitHandler);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitHandler();
    });
}

/**
 * Affiche la question suivante ou le score final
 */
function showNextQuizQuestion() {
    if (quizState.index >= quizState.questions.length) {
        quizCard.style.display = "none";
        quizResult.style.display = "block";
        quizScore.textContent = `Score : ${quizState.score} / ${quizState.questions.length}`;
        return;
    }

    const q = quizState.questions[quizState.index];

    if (q.direction === "en_fr") {
        quizQuestion.textContent = `Comment dit-on « ${q.word} » en français ?`;
    } else {
        quizQuestion.textContent = `Comment dit-on « ${q.word} » en anglais ?`;
    }

    quizState.inputEl.value = "";
    quizState.feedbackEl.innerHTML = "";
    quizState.inputEl.focus();
}

/**
 * Valide la réponse de l'utilisateur et affiche l'explication
 */
function handleQuizSubmit() {
    const q = quizState.questions[quizState.index];
    if (!q) return;

    const userAnswer = (quizState.inputEl.value || "").trim();
    if (!userAnswer) return;

    const isCorrect = isAnswerCorrect(userAnswer, q.translations);

    const allTranslations = q.translations.slice(0, 3).join(", ");
    let explanation = "";

    if (isCorrect) {
        quizState.score++;
        explanation = `✅ Correct !<br>« ${q.word} » se traduit par : <strong>${allTranslations}</strong>.`;
    } else {
        explanation = `❌ Pas tout à fait.<br>« ${q.word} » se traduit par : <strong>${allTranslations}</strong>.<br><small>Ta réponse : « ${userAnswer} »</small>`;
    }

    quizState.feedbackEl.innerHTML = explanation;

    // Mise à jour SRS en arrière-plan
    fetch(
        `/api/review-update?word=${encodeURIComponent(
            q.word
        )}&correct=${isCorrect ? "true" : "false"}`
    ).catch(() => {});

    // Question suivante après une petite pause
    setTimeout(() => {
        quizState.index++;
        showNextQuizQuestion();
    }, 1300);
}

/**
 * Normalise les textes pour comparer sans accents / majuscules
 */
function normalizeText(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // enlève les accents
        .replace(/[^a-z]/g, ""); // garde seulement les lettres
}

/**
 * Renvoie true si la réponse correspond à une des traductions
 */
function isAnswerCorrect(answer, translations) {
    const normAnswer = normalizeText(answer);
    if (!normAnswer) return false;

    for (const t of translations) {
        if (typeof t !== "string") continue;
        const normT = normalizeText(t);
        if (normT && normT === normAnswer) {
            return true;
        }
    }
    return false;
}

// Mélange générique (réutilisé un peu partout)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**************************************************************
 * EVENTS
 **************************************************************/
translateBtn.addEventListener("click", () => translateWord());
inputField.addEventListener("keydown", e => {
    if (e.key === "Enter") translateWord();
});

/**************************************************************
 * END
 **************************************************************/
