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

    updateLanguageUI();   // met à jour drapeaux + labels
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
    resultCard.style.display = "block";
    resultTitle.textContent = "Traduction en cours...";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = `<div class="loader">⏳</div>`;
}
function clearResult() {
    resultTitle.textContent = "";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = "";
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
       // Ajouter à l'historique seulement si on n'est pas en mode "cacheOnly"
    if (!cacheOnly) {
        addToHistory(word);
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
 * QUIZ
 **************************************************************/
async function startQuiz() {
    quizLoader.style.display = "block";
    quizCard.style.display = "none";
    quizResult.style.display = "none";

    const res = await fetch(`/api/quiz-get-words`);
    const data = await res.json();
    let words = data.toReview || [];

    if (words.length === 0) {
        quizLoader.innerHTML = "Aucun mot à réviser 🎉";
        return;
    }

    shuffle(words);

    let index = 0;
    let score = 0;

    async function showQuestion() {
        if (index >= words.length) return endQuiz();

        const word = words[index];
        quizLoader.style.display = "none";
        quizCard.style.display = "block";
        quizOptions.innerHTML = "";

        const cloud = await fetch(`/api/get-dict-word?word=${word}`);
        const dic = await cloud.json();

        if (!dic) {
            index++;
            return showQuestion();
        }

        const translations = [dic.main_translation, ...dic.distractors];

        quizQuestion.textContent = `Que veut dire : « ${word} » ?`;

        const options = buildOptions(translations[0], translations);

        options.forEach(opt => {
            const div = document.createElement("div");
            div.className = "quiz-option";
            div.textContent = opt.label;

            div.addEventListener("click", () => {
                if (opt.correct) {
                    div.classList.add("correct");
                    score++;
                } else {
                    div.classList.add("wrong");
                }

                fetch(`/api/review-update?word=${word}&correct=${opt.correct}`);

                setTimeout(() => {
                    index++;
                    showQuestion();
                }, 600);
            });

            quizOptions.appendChild(div);
        });
    }

    function endQuiz() {
        quizCard.style.display = "none";
        quizResult.style.display = "block";
        quizScore.textContent = `Score : ${score} / ${words.length}`;
    }

    quizRestart.addEventListener("click", startQuiz);

    showQuestion();
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildOptions(correct, all) {
    const choices = [correct, ...all.filter(x => x !== correct).slice(0, 3)];
    return shuffle(
        choices.map(c => ({
            label: c,
            correct: c === correct
        }))
    );
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
