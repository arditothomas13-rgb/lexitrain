/* ============================================================
   LexiTrain — APP.JS PRO (EN ⇄ FR + AutoSwitch + Clean UX)
============================================================ */

/* -----------------------------
   GLOBAL LANGUAGE STATE
----------------------------- */
let fromLang = "en";
let toLang = "fr";

/* -----------------------------
   DOM
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

/* -----------------------------
   MESSAGE "AUTO SWITCH" (iOS subtle)
----------------------------- */
function showAutoSwitchMessage(msg) {
    const div = document.createElement("div");
    div.style.background = "rgba(255,255,255,0.75)";
    div.style.backdropFilter = "blur(14px)";
    div.style.padding = "12px 18px";
    div.style.borderRadius = "16px";
    div.style.marginBottom = "14px";
    div.style.fontSize = "15px";
    div.style.fontWeight = "500";
    div.style.textAlign = "center";
    div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";

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

    const word = inputField.value.trim();
    if (word) translateWord(true); // Re-traduire après swap
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
   CALL translate.js WITH LANGS
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
            try { navigator.vibrate(10); } catch(e){}
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
        const exDiv = document.createElement("div");
        exDiv.className = "example-block";
        exDiv.innerHTML = `
            <div class="example-text">• ${ex.src}</div>
            <div class="example-translation">→ ${ex.dest}</div>
        `;
        eList.appendChild(exDiv);
    });

    senseContent.appendChild(eList);

  /* Synonymes */
if (entry.synonyms && entry.synonyms.length > 0) {
    const sTitle = document.createElement("div");
    sTitle.className = "sense-block-title";
    sTitle.textContent = fromLang === "en" ? "Synonyms (EN)" : "Synonymes (FR)";
    senseContent.appendChild(sTitle);

    const sWrap = document.createElement("div");
    sWrap.className = "glass synonyms-wrapper";

    entry.synonyms.forEach(s => {
        const tag = document.createElement("div");
        tag.className = "synonym-tag";
        tag.textContent = s;

        // 🔥 Cliquer sur un synonyme lance une nouvelle traduction
        tag.addEventListener("click", () => {
            inputField.value = s;
            translateWord();
            try { navigator.vibrate(10); } catch(e){}
        });

        sWrap.appendChild(tag);
    });

    senseContent.appendChild(sWrap);
}

/* ============================================================
   TRANSLATE ACTION (with auto-switch)
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

    /* AUTO SWITCH ------------------------------------- */
    if (data.auto_switch && !isSwap) {
        const oldFrom = fromLang;
        fromLang = toLang;
        toLang = oldFrom;
        updateLanguageUI();

        showAutoSwitchMessage(
            `🔄 Le mot est ${data.detected_lang === "fr" ? "français" : "anglais"} — passage automatique ${fromLang.toUpperCase()} → ${toLang.toUpperCase()}.`
        );

        // Relance traduction dans le bon sens
        return translateWord(true);
    }

    resultTitle.textContent = word;

    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    addToHistory(word);
}

translateBtn.addEventListener("click", () => translateWord());
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
   DICTIONNAIRE
============================================================ */
async function loadDictionary(search = "") {
    try {
        const res = await fetch(`/api/list-words.js?q=${search}`);
        const data = await res.json();

        dictionaryList.innerHTML = "";
        const words = (data.words || []).sort();

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
        console.error(err);
    }
}

dictionarySearch.addEventListener("input", e => {
    loadDictionary(e.target.value.toLowerCase());
});

/* ============================================================
   SCROLLER A-Z iOS
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
