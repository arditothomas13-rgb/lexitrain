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
 * FETCH POUR LE QUIZ (EN ➜ FR) — réutilise /api/get-dict-word
 **************************************************************/
async function fetchWordForQuiz(word) {
    try {
        const res = await fetch(
            `/api/get-dict-word?word=${encodeURIComponent(word)}`
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (!data || data.error) return null;

        return data;
    } catch (err) {
        console.error("QUIZ fetchWordForQuiz error", err);
        return null;
    }
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
 * QUIZ — MODE PROFESSEUR (CHAT)
 *  - Pose une question : "Comment dit-on X en français ?"
 *  - Tu écris ta réponse
 *  - L'app corrige + explique
 **************************************************************/

async function startQuiz() {
    // État initial : on affiche le loader
    quizLoader.style.display = "block";
    quizCard.style.display = "none";
    quizResult.style.display = "none";
    quizLoader.textContent = "Préparation du quiz…";

    try {
        // 1) Récupérer la liste des mots anglais du dictionnaire
        const res = await fetch(`/api/list-words?lang=en`);
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }

        const data = await res.json();
        let words = Array.isArray(data.words) ? data.words : [];
       if (!words.length) {
            quizLoader.innerHTML = "Aucun mot à réviser 🎉";
            return;
        }

        // On mélange et on limite le nombre de questions
        shuffle(words);
        const MAX_QUESTIONS = 10;
        words = words.slice(0, MAX_QUESTIONS);

        let index = 0;
        let score = 0;

        // 2) Fonction qui affiche une question, une par une
            async function askNextQuestion() {
        // 1) Chercher le prochain mot qui a une traduction exploitable
        let wordData = null;
        let acceptedAnswers = [];

        while (index < words.length && !wordData) {
            const candidate = words[index];

            // On va lire les infos de ce mot (via /api/get-dict-word)
            const data = await fetchWordForQuiz(candidate);

            if (!data) {
                // Rien trouvé pour ce mot → on passe silencieusement au suivant
                index++;
                continue;
            }

            const answers = extractTranslationsForQuiz(data);

            if (!answers || !answers.length) {
                // On a un mot mais aucune traduction vraiment exploitable → suivant
                index++;
                continue;
            }

            // OK : on a enfin un mot avec des traductions
            wordData = data;
            acceptedAnswers = answers;
        }

        // 2) Si on n’a trouvé aucun mot valable → fin du quiz
        if (!wordData) {
            quizLoader.style.display = "none";
            quizCard.style.display = "none";
            quizResult.style.display = "block";
            quizScore.textContent = `Score : ${score} / ${words.length}`;
            return;
        }

        const word = words[index];

        // 3) Afficher la carte de question (chat prof)
        quizLoader.style.display = "none";
        quizCard.style.display = "block";
        quizOptions.innerHTML = "";
        quizQuestion.textContent = `Comment dit-on « ${word} » en français ?`;

        // --- UI "chat" ---
        const form = document.createElement("form");
        form.className = "quiz-chat-form";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "quiz-input";
        input.placeholder = "Ta réponse en français";

        const button = document.createElement("button");
        button.type = "submit";
        button.className = "quiz-submit";
        button.textContent = "Valider";

        const feedback = document.createElement("div");
        feedback.className = "quiz-feedback";
        feedback.textContent = "Tape ta réponse puis clique sur « Valider ».";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "quiz-next";
        nextButton.textContent = "Question suivante";
        nextButton.style.display = "none";

        form.appendChild(input);
        form.appendChild(button);
        quizOptions.appendChild(form);
        quizOptions.appendChild(feedback);
        quizOptions.appendChild(nextButton);

        input.focus();

        // 4) Quand tu envoies ta réponse
        form.addEventListener("submit", (evt) => {
            evt.preventDefault();

            const userRaw = input.value;
            const user = normalizeAnswer(userRaw);
            if (!user) return;

            const normalizedAccepted = acceptedAnswers.map(normalizeAnswer);

            const isCorrect = normalizedAccepted.some((ans) => {
                if (!ans) return false;
                return user === ans || user.includes(ans) || ans.includes(user);
            });

            if (isCorrect) {
                score++;
                feedback.innerHTML = `✅ Correct !<br>Réponse attendue : <strong>${acceptedAnswers[0]}</strong>`;
                feedback.classList.remove("wrong");
                feedback.classList.add("correct");
            } else {
                feedback.innerHTML = `❌ Pas tout à fait.<br>Réponses possibles : <strong>${acceptedAnswers.join(
                    ", "
                )}</strong>`;
                feedback.classList.remove("correct");
                feedback.classList.add("wrong");
            }

            // Mise à jour SRS en arrière-plan
            fetch(
                `/api/review-update?word=${encodeURIComponent(
                    word
                )}&correct=${isCorrect ? "true" : "false"}`
            ).catch(() => {});

            // On bloque la réponse, et on laisse l’utilisateur passer à la suite
            input.disabled = true;
            button.disabled = true;
            nextButton.style.display = "inline-block";
        });

        // 5) Passer manuellement à la question suivante
        nextButton.addEventListener("click", () => {
            index++;
            askNextQuestion();
        });
    }


/**************************************************************
 * UTILITAIRES QUIZ
 **************************************************************/
// Mélange générique (garde la même fonction que tu avais)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Normalise une réponse texte (minuscules, sans accents, sans ponctuation)
function normalizeAnswer(str) {
    if (!str) return "";
    return str
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // enlève les accents
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

// Récupère une petite liste de traductions possibles à partir de la réponse API
function extractTranslationsForQuiz(data) {
    if (!data || data.error) return [];

    const set = new Set();

    if (data.main_translation) set.add(data.main_translation);

    if (Array.isArray(data.translations)) {
        data.translations.forEach((t) => t && set.add(t));
    }

    if (Array.isArray(data.entries)) {
        data.entries.forEach((e) => {
            if (Array.isArray(e.translations)) {
                e.translations.forEach((t) => t && set.add(t));
            }
        });
    }

    // On limite pour éviter un pavé
    return Array.from(set).slice(0, 5);
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
