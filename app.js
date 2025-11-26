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
// Éléments de la nouvelle interface "chat" du quiz
const chatMessages = document.getElementById("chatMessages");
const chatAnswer = document.getElementById("chatAnswer");
const chatSend = document.getElementById("chatSend");
const chatStatus = document.getElementById("chatStatus");


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
        // ✅ Utiliser l’API de traduction complète
        const res = await fetch(
            `/api/translate?word=${encodeURIComponent(word)}&from=${fromLang}&to=${toLang}`
        );
        const apiData = await res.json();
        setLocalCache(cacheKey, apiData);
        return apiData;
    }

    return { error: "Donnée indisponible hors-ligne" };
}

/**************************************************************
 * FETCH POUR LE QUIZ (EN ⇄ FR, uniquement depuis le cache)
 **************************************************************/
async function fetchWordForQuiz(word) {
    const normalized = (word || "").toLowerCase().trim();
    if (!normalized) return null;

    // On essaie les deux sens : EN→FR puis FR→EN
    const cacheKeys = [
        `${normalized}_en_fr`,
        `${normalized}_fr_en`
    ];

    for (const cacheKey of cacheKeys) {
        try {
            const res = await fetch(
                `/api/kv-get?key=${encodeURIComponent(cacheKey)}`
            );
            if (!res.ok) continue;

            const data = await res.json();
            if (!data || !data.result) continue;

            try {
                const parsed = JSON.parse(data.result);
                if (!parsed || parsed.error) continue;
                return parsed; // On renvoie le premier résultat valide
            } catch (e) {
                console.error("QUIZ kv-get parse error", e);
                continue;
            }
        } catch (err) {
            console.error("QUIZ fetchWordForQuiz KV error", err);
        }
    }

    // Aucun sens trouvé dans le cache
    return null;
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

if (!data || data.error || !Array.isArray(data.entries) || data.entries.length === 0) {
    resultTitle.textContent = word;
    senseTabs.innerHTML = "";
    senseContent.innerHTML = `<div>${
        data && data.error
            ? data.error
            : "Aucune traduction trouvée pour ce mot."
    }</div>`;
    return;
}

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
 *  Nouvelle version : chat dans la carte Quiz
 **************************************************************/

// État du quiz
let chatQuizInitialized = false;
let chatQuizWords = [];
let chatQuizIndex = 0;
let chatQuizScore = 0;
let chatQuizExpectingAnswer = false;
let chatQuizCurrentWord = "";
let chatQuizCurrentAnswers = [];
let chatQuizExpectedLang = "fr";

// Appelé quand on ouvre l’onglet Quiz
async function startQuiz() {
    if (!chatMessages || !chatAnswer || !chatSend || !chatStatus) {
        console.warn("Éléments du chat Quiz introuvables dans le DOM.");
        return;
    }

    // Réinitialiser l’état
    chatQuizWords = [];
    chatQuizIndex = 0;
    chatQuizScore = 0;
    chatQuizExpectingAnswer = false;
    chatQuizCurrentWord = "";
    chatQuizCurrentAnswers = [];

    // Réinitialiser l’UI
    chatMessages.innerHTML = "";
    addProfChatMessage(
        "👋 Salut ! Je suis ton prof de vocabulaire.\n" +
        "Je vais te poser 5 questions sur les mots que tu as déjà traduits.\n" +
        "Prêt(e) ? Écris « OK » pour commencer."
    );
    chatStatus.textContent =
        "Écris « OK » puis appuie sur Entrée ou sur Envoyer.";
    chatAnswer.value = "";
    chatAnswer.disabled = false;
    chatSend.disabled = false;

    // On connecte les events une seule fois
    if (!chatQuizInitialized) {
        chatSend.addEventListener("click", onChatSend);
        chatAnswer.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                onChatSend();
            }
        });
        chatQuizInitialized = true;
    }
}

// Ajout d’un message du prof
function addProfChatMessage(text) {
    const div = document.createElement("div");
    div.className = "chat-message prof";
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Ajout d’un message de l’élève
function addUserChatMessage(text) {
    const div = document.createElement("div");
    div.className = "chat-message user";
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Quand on clique sur "Envoyer" ou on appuie sur Entrée
async function onChatSend() {
    if (!chatAnswer) return;
    const raw = chatAnswer.value.trim();
    if (!raw) return;

    addUserChatMessage(raw);
    chatAnswer.value = "";

    // Si le quiz n’a pas encore démarré, on attend "OK" / "continuer" / "encore"
    if (!chatQuizWords.length) {
        const norm = normalizeAnswer(raw);
        const startWords = ["ok", "continue", "continuer", "encore"];

        if (startWords.includes(norm)) {
            chatStatus.textContent = "Je prépare tes questions…";
            await prepareChatQuizWords();
            if (!chatQuizWords.length) {
                return;
            }
            chatQuizIndex = 0;
            chatQuizScore = 0;
            await askChatQuizQuestion();
        } else {
            addProfChatMessage(
                "Pour démarrer, écris simplement « OK », « continuer » ou « encore » 😄"
            );
        }
        return;
    }

    // En plein quiz → on traite la réponse
    if (chatQuizExpectingAnswer) {
        await handleChatQuizAnswer(raw);
    } else {
        // Quiz terminé : si l’utilisateur écrit OK / continuer / encore → nouveau tour
        const norm = normalizeAnswer(raw);
        const restartWords = ["ok", "continue", "continuer", "encore"];

        if (restartWords.includes(norm)) {
            startQuiz();
        } else {
            addProfChatMessage(
                "Si tu veux refaire un tour, écris « OK », « continuer » ou « encore » 🤓"
            );
        }
    }
}


// Préparer la liste des mots à interroger
async function prepareChatQuizWords() {
    try {
        const res = await fetch(`/api/list-words?lang=en`);
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        let words = Array.isArray(data.words) ? data.words : [];

        if (!words.length) {
            addProfChatMessage(
                "Pour l’instant tu n’as encore aucun mot à réviser. " +
                "Va d’abord traduire quelques mots 😉"
            );
            chatStatus.textContent = "";
            return;
        }

        // On mélange la liste pour varier
        shuffle(words);

        const MAX_CANDIDATES = 40;     // on ne scanne pas toute la planète
        const TARGET_QUESTIONS = 5;
        const eligible = [];

        // On ne garde que les mots qui ont une vraie traduction en cache
        for (const w of words.slice(0, MAX_CANDIDATES)) {
            const dataForWord = await fetchWordForQuiz(w);
            const answers = extractTranslationsForQuiz(dataForWord);

            if (answers && answers.length) {
                eligible.push(w);
            }

            if (eligible.length >= TARGET_QUESTIONS) break;
        }

        if (!eligible.length) {
            addProfChatMessage(
                "Je ne trouve aucun mot avec une traduction complète en base.\n" +
                "Essaie d’abord de traduire quelques mots avec le dictionnaire, puis relance le quiz 😊"
            );
            chatStatus.textContent = "";
            return;
        }

        chatQuizWords = eligible;

    } catch (e) {
        console.error("prepareChatQuizWords error", e);
        addProfChatMessage(
            "Oups, impossible de préparer le quiz pour le moment."
        );
        chatStatus.textContent = "";
    }
}

// Poser la question suivante
async function askChatQuizQuestion() {
    chatQuizExpectingAnswer = false;
    chatQuizCurrentWord = "";
    chatQuizCurrentAnswers = [];

    if (chatQuizIndex >= chatQuizWords.length) {
        endChatQuiz();
        return;
    }

    const word = chatQuizWords[chatQuizIndex];

    try {
        const data = await fetchWordForQuiz(word);
        const answers = extractTranslationsForQuiz(data);

        if (!answers || !answers.length) {
            // Pas de traduction exploitable → on saute ce mot
            chatQuizIndex++;
            await askChatQuizQuestion();
            return;
        }

        chatQuizCurrentWord = word;
        chatQuizCurrentAnswers = answers;
        chatQuizExpectingAnswer = true;

        const detected = (data && data.detected_lang || "").toLowerCase();
        let questionText = "";

        if (detected === "fr") {
            // Mot français → on attend une réponse en anglais
            chatQuizExpectedLang = "en";
            questionText =
                `Question ${chatQuizIndex + 1} / ${chatQuizWords.length} :\n` +
                `Comment dit-on « ${word} » en anglais ?`;
            chatStatus.textContent =
                "Tape ta réponse en anglais puis appuie sur Entrée ou sur Envoyer.";
        } else {
            // Par défaut : mot anglais → réponse en français
            chatQuizExpectedLang = "fr";
            questionText =
                `Question ${chatQuizIndex + 1} / ${chatQuizWords.length} :\n` +
                `Comment dit-on « ${word} » en français ?`;
            chatStatus.textContent =
                "Tape ta réponse en français puis appuie sur Entrée ou sur Envoyer.";
        }

        addProfChatMessage(questionText);
    } catch (e) {
        console.error("askChatQuizQuestion error", e);
        chatQuizIndex++;
        await askChatQuizQuestion();
    }
}

// Vérifier la réponse de l’utilisateur
async function handleChatQuizAnswer(rawAnswer) {
    const user = normalizeAnswer(rawAnswer);
    const acceptedNorm = chatQuizCurrentAnswers.map(normalizeAnswer);

    const isCorrect = acceptedNorm.some((ans) => {
        if (!ans) return false;
        return user === ans || user.includes(ans) || ans.includes(user);
    });

    if (isCorrect) {
        chatQuizScore++;
        addProfChatMessage(
            `✅ Exact ! On peut dire « ${chatQuizCurrentAnswers[0]} ».`
        );
    } else {
        addProfChatMessage(
            `❌ Pas tout à fait.\n` +
            `On peut dire : ${chatQuizCurrentAnswers
                .slice(0, 3)
                .join(", ")}`
        );
    }

    // Mise à jour SRS en arrière-plan
    fetch(
        `/api/review-update?word=${encodeURIComponent(
            chatQuizCurrentWord
        )}&correct=${isCorrect ? "true" : "false"}`
    ).catch(() => {});

    chatQuizExpectingAnswer = false;
    chatQuizIndex++;

    setTimeout(() => {
        askChatQuizQuestion();
    }, 900);
}

// Fin du quiz
function endChatQuiz() {
    addProfChatMessage(
        `✨ C’est fini pour ce tour !\n` +
        `Tu as obtenu ${chatQuizScore} / ${chatQuizWords.length} 🌟`
    );
    chatStatus.textContent =
        "Écris « OK », « continuer » ou « encore » pour refaire un quiz avec de nouveaux mots.";

    chatQuizWords = [];
    chatQuizExpectingAnswer = false;
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
