/* ============================================================
   LexiTrain — APP.JS PRO (EN ⇄ FR + AutoSwitch + Clean UX)
   + DICO FR/EN dynamique (wordlist:fr / wordlist:en)
============================================================ */

/* -----------------------------
   GLOBAL LANGUAGE STATE
----------------------------- */
let fromLang = "en";   // source
let toLang = "fr";     // target
let dictionaryLang = "en"; // dico par défaut

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

const navTranslate = document.getElementById("navTranslate");
const openDictionary = document.getElementById("openDictionary");

const dictionaryList = document.getElementById("dictionaryList");
const dictionarySearch = document.getElementById("dictionarySearch");

const alphabetScroller = document.getElementById("alphabetScroller");
const letterPopup = document.getElementById("letterPopup");

const historyList = document.getElementById("historyList");
const langSwap = document.getElementById("langSwap");

/* === NEW : boutons FR/EN du Dico === */
const btnDicEn = document.getElementById("dicLangEn");
const btnDicFr = document.getElementById("dicLangFr");

/* -----------------------------
   AUTO SWITCH MESSAGE
----------------------------- */
function showAutoSwitchMessage(msg) {
    const div = document.createElement("div");
    div.className = "autoswitch-msg";
    div.innerText = msg;
    resultCard.prepend(div);

    setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 350);
    }, 1800);
}

/* ============================================================
   UPDATE LANGUAGE UI
============================================================ */
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

/* ============================================================
   MANUAL SWAP BUTTON
============================================================ */
langSwap.addEventListener("click", () => {
    const oldFrom = fromLang;
    fromLang = toLang;
    toLang = oldFrom;

    updateLanguageUI();
    if (inputField.value.trim()) translateWord(true);
});

/* ============================================================
   PAGE NAVIGATION
============================================================ */
navTranslate.addEventListener("click", () => {
    pageTranslate.style.display = "block";
    pageDictionary.style.display = "none";
});

openDictionary.addEventListener("click", () => {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "block";
    loadDictionary();
});

/* ============================================================
   API CALL WITH LANGS
============================================================ */
async function fetchWord(word) {
    try {
        const res = await fetch(
            `/api/translate.js?word=${encodeURIComponent(word)}&from=${fromLang}&to=${toLang}`
        );
        return await res.json();
    } catch (err) {
        console.error(err);
        return { error: "Impossible d'obtenir la traduction." };
    }
}

/* ============================================================
   LOADER
============================================================ */
function showLoader() {
    resultCard.style.display = "block";
    resultTitle.textContent = "⏳ Traduction en cours...";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = `
        <div style="text-align:center; padding:34px; font-size:30px; opacity:0.6;">
            ⏳
        </div>
    `;
}

/* ============================================================
   CLEAR RESULT
============================================================ */
function clearResult() {
    resultTitle.textContent = "";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = "";
}

/* ============================================================
   RENDER TABS
============================================================ */
function renderSenseTabs(entries) {
    senseTabs.innerHTML = "";

    entries.forEach((entry, index) => {
        const pill = document.createElement("div");
        pill.className = "sense-pill";
        if (index === 0) pill.classList.add("active");
        pill.textContent = entry.label;

        pill.addEventListener("click", () => {
            document.querySelectorAll(".sense-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            pill.scrollIntoView({ behavior: "smooth", inline: "center" });
            renderSenseContent(entry);
        });

        senseTabs.appendChild(pill);
    });

    const first = document.querySelector(".sense-pill.active");
    if (first) first.scrollIntoView({ behavior: "smooth", inline: "center" });
}

/* ============================================================
   RENDER CONTENT
============================================================ */
function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    /* Définition */
    if (entry.definition) {
        const def = document.createElement("div");
        def.className = "glass translation-list";
        def.innerHTML = `
            <div class="sense-block-title">Definition</div>
            <div>${entry.definition}</div>
        `;
        senseContent.appendChild(def);
    }

    /* Traductions */
    const tList = document.createElement("div");
    tList.className = "glass translation-list";

    const label = toLang === "fr" ? "Traduction" : "Translation";
    tList.innerHTML = `<div class="sense-block-title">${label}</div>`;

    entry.translations.forEach(t => {
        const i = document.createElement("div");
        i.className = "translation-item";
        i.textContent = t;
        tList.appendChild(i);
    });
    senseContent.appendChild(tList);

    /* Exemples */
    const eList = document.createElement("div");
    eList.className = "glass examples-list";
    eList.innerHTML = `<div class="sense-block-title">Examples</div>`;

    entry.examples.forEach(ex => {
        const block = document.createElement("div");
        block.className = "example-block";
        block.innerHTML = `
            <div class="example-text">• ${ex.src}</div>
            <div class="example-translation">→ ${ex.dest}</div>
        `;
        eList.appendChild(block);
    });
    senseContent.appendChild(eList);

    /* Synonymes */
    if (entry.synonyms && entry.synonyms.length > 0) {
        const sWrap = document.createElement("div");
        sWrap.className = "glass synonyms-wrapper";

        entry.synonyms.forEach(s => {
            const tag = document.createElement("div");
            tag.className = "synonym-tag";
            tag.textContent = s;

            // NEW : clic => nouvelle recherche
            tag.addEventListener("click", () => {
                inputField.value = s;
                translateWord();
            });

            sWrap.appendChild(tag);
        });

        const sTitle = document.createElement("div");
        sTitle.className = "sense-block-title";
        sTitle.textContent = "Synonyms";
        senseContent.appendChild(sTitle);
        senseContent.appendChild(sWrap);
    }
}

/* ============================================================
   TRANSLATE + AUTO SWITCH
============================================================ */
async function translateWord(isSwap = false) {
    const word = inputField.value.trim();
    if (!word) return;

    clearResult();
    showLoader();

    let data = await fetchWord(word);

    if (data.error) {
        resultTitle.textContent = "❌ Erreur";
        senseContent.innerHTML = `<div>${data.error}</div>`;
        return;
    }

    /* AUTO SWITCH */
    if (data.auto_switch && !isSwap) {
        const oldFrom = fromLang;
        fromLang = toLang;
        toLang = oldFrom;

        updateLanguageUI();

        showAutoSwitchMessage(
            `🔄 Détection automatique → passage ${fromLang.toUpperCase()} → ${toLang.toUpperCase()}`
        );

        return translateWord(true);
    }

    resultTitle.textContent = word;

    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    addToHistory(word);
}

/* ============================================================
   USER ACTIONS
============================================================ */
translateBtn.addEventListener("click", translateWord);
inputField.addEventListener("keypress", e => {
    if (e.key === "Enter") translateWord();
});

/* ============================================================
   HISTORY
============================================================ */
function loadHistory() {
    const hist = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    historyList.innerHTML = "";

    hist.forEach(word => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.textContent = word;

        item.addEventListener("click", () => {
            inputField.value = word;
            translateWord();
        });

        historyList.appendChild(item);
    });
}
loadHistory();

function addToHistory(word) {
    let hist = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    hist = [word, ...hist.filter(w => w !== word)].slice(0, 10);
    localStorage.setItem("lexitrain_history", JSON.stringify(hist));
    loadHistory();
}

/* ============================================================
   DICO — LOAD FROM wordlist:en / wordlist:fr
============================================================ */
async function loadDictionary(search = "") {
    dictionaryList.innerHTML = "Chargement...";

    try {
        const res = await fetch(`/api/list-words.js?lang=${dictionaryLang}&q=${search}`);
        const data = await res.json();

        dictionaryList.innerHTML = "";

        const words = data.words || [];
        words.forEach(w => {
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
        dictionaryList.innerHTML = "Erreur de chargement.";
    }
}

/* === RADIO BUTTONS DU DICO === */
btnDicEn.addEventListener("click", () => {
    dictionaryLang = "en";
    loadDictionary();
});

btnDicFr.addEventListener("click", () => {
    dictionaryLang = "fr";
    loadDictionary();
});

/* ============================================================
   SCROLLER A-Z (iOS)
============================================================ */
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function renderAlphabetScroller() {
    alphabetScroller.innerHTML = "";
    alphabet.forEach(letter => {
        const div = document.createElement("div");
        div.className = "alpha-letter";
        div.textContent = letter;
        alphabetScroller.appendChild(div);
    });
}
renderAlphabetScroller();

function showLetterPopup(letter) {
    letterPopup.textContent = letter;
    letterPopup.style.display = "block";
    letterPopup.style.opacity = "1";
    setTimeout(() => {
        letterPopup.style.opacity = "0";
        setTimeout(() => (letterPopup.style.display = "none"), 180);
    }, 500);
}

alphabetScroller.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    const rect = alphabetScroller.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    const index = Math.floor((y / rect.height) * alphabet.length);

    if (alphabet[index]) {
        const letter = alphabet[index];
        showLetterPopup(letter);
        scrollToLetter(letter);
    }
});

function scrollToLetter(letter) {
    const items = [...dictionaryList.children];
    const target = items.find(i => i.textContent[0]?.toUpperCase() === letter);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}
