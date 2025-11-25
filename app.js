/* ============================================================
   LexiTrain — APP.JS PRO (EN ⇄ FR + AutoSwitch + DICO + Offline)
   + Fix slider iOS
   + Fix dico EN/FR
   + Fix clics dico
   + Fix historique (sans GPT)
============================================================ */

/* -----------------------------
   GLOBAL LANGUAGE STATE
----------------------------- */
let fromLang = "en";   // source language
let toLang = "fr";     // target language
let dictionaryLang = "en"; // language displayed in dictionary

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

const btnDicEn = document.getElementById("dicLangEn");
const btnDicFr = document.getElementById("dicLangFr");

/* ============================================================
   LOCAL OFFLINE CACHE
============================================================ */
function getLocalCache(key) {
    try {
        const raw = localStorage.getItem("lexitrain_cache:" + key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function setLocalCache(key, value) {
    try {
        localStorage.setItem("lexitrain_cache:" + key, JSON.stringify(value));
    } catch {}
}

/* ============================================================
   AUTO SWITCH MESSAGE
============================================================ */
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
   PAGE SWITCHING
============================================================ */
function openTranslatePage() {
    pageTranslate.style.display = "block";
    pageDictionary.style.display = "none";
}

navTranslate.addEventListener("click", openTranslatePage);

openDictionary.addEventListener("click", () => {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "block";
    loadDictionary();
});

/* ============================================================
   SWAP EN/FR
============================================================ */
langSwap.addEventListener("click", () => {
    const old = fromLang;
    fromLang = toLang;
    toLang = old;

    updateLanguageUI();

    if (inputField.value.trim()) translateWord(true);
});

/* ============================================================
   SMART FETCH WORD
============================================================ */
async function fetchWord(word, cacheOnly = false) {

    const cacheKey = `${word.toLowerCase()}_${fromLang}_${toLang}`;

    // 1 — LOCAL CACHE
    const local = getLocalCache(cacheKey);
    if (local) return { ...local, fromCache: "local" };

    // 2 — CLOUD CACHE
    try {
        const cloud = await fetch(`/api/kv-get.js?key=${cacheKey}`);
        const data = await cloud.json();

        if (data.result) {
            const parsed = JSON.parse(data.result);
            setLocalCache(cacheKey, parsed);
            return { ...parsed, fromCache: "cloud" };
        }
    } catch {}

    // 3 — GPT (only if NOT cacheOnly)
    if (!cacheOnly) {
        const res = await fetch(
            `/api/translate.js?word=${encodeURIComponent(word)}&from=${fromLang}&to=${toLang}`
        );
        const apiData = await res.json();

        setLocalCache(cacheKey, apiData);

        return apiData;
    }

    return { error: "Donnée indisponible hors-ligne" };
}

/* ============================================================
   LOADING UI
============================================================ */
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

/* ============================================================
   RENDER TABS + CONTENT
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
            renderSenseContent(entry);
        });

        senseTabs.appendChild(pill);
    });
}

function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    if (entry.definition) {
        senseContent.innerHTML += `
            <div class="glass translation-list">
                <div class="sense-block-title">Definition</div>
                <div>${entry.definition}</div>
            </div>`;
    }

    const tLabel = toLang === "fr" ? "Traduction" : "Translation";

    senseContent.innerHTML += `
        <div class="glass translation-list">
            <div class="sense-block-title">${tLabel}</div>
            ${entry.translations.map(t => `<div class="translation-item">${t}</div>`).join("")}
        </div>
    `;

    senseContent.innerHTML += `
        <div class="glass examples-list">
            <div class="sense-block-title">Examples</div>
            ${entry.examples.map(ex => `
                <div class="example-block">
                    <div class="example-text">• ${ex.src}</div>
                    <div class="example-translation">→ ${ex.dest}</div>
                </div>`).join("")}
        </div>
    `;

    if (entry.synonyms?.length) {
        senseContent.innerHTML += `
            <div class="sense-block-title">Synonyms</div>
            <div class="glass synonyms-wrapper">
                ${entry.synonyms
                    .map(
                        s => `<div class="synonym-tag" data-word="${s}">${s}</div>`
                    )
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

/* ============================================================
   TRANSLATE
============================================================ */
async function translateWord(isSwap = false, cacheOnly = false) {
    const word = inputField.value.trim();
    if (!word) return;

    clearResult();
    showLoader();

    let data = await fetchWord(word, cacheOnly);

    if (data.error) {
        resultTitle.textContent = "❌ Erreur";
        senseContent.innerHTML = `<div>${data.error}</div>`;
        return;
    }

    if (data.auto_switch && !isSwap) {
        const old = fromLang;
        fromLang = toLang;
        toLang = old;

        updateLanguageUI();

        showAutoSwitchMessage(
            `🔄 Détection automatique : ${fromLang.toUpperCase()} → ${toLang.toUpperCase()}`
        );

        return translateWord(true);
    }

    resultTitle.textContent = word;
    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    addToHistory(word);
}

/* ============================================================
   HISTORY
============================================================ */
function loadHistory() {
    const list = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    historyList.innerHTML = "";

    list.forEach(word => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.textContent = word;

        item.addEventListener("click", () => {
            inputField.value = word;
            translateWord(false, true); // CACHE ONLY
        });

        historyList.appendChild(item);
    });
}
loadHistory();

function addToHistory(word) {
    let list = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    list = [word, ...list.filter(w => w !== word)].slice(0, 20);
    localStorage.setItem("lexitrain_history", JSON.stringify(list));
    loadHistory();
}

/* ============================================================
   DICTIONNAIRE
============================================================ */
async function loadDictionary(q = "") {
    dictionaryList.innerHTML = "Chargement...";

    const res = await fetch(`/api/list-words.js?lang=${dictionaryLang}&q=${q}`);
    const data = await res.json();

    dictionaryList.innerHTML = "";

    (data.words || []).forEach(w => {
        const item = document.createElement("div");
        item.className = "dic-item";
        item.textContent = w;

        item.addEventListener("click", () => {
            inputField.value = w;
            openTranslatePage();
            translateWord(false, true);
        });

        dictionaryList.appendChild(item);
    });
}

dictionarySearch.addEventListener("input", e => {
    loadDictionary(e.target.value.toLowerCase());
});

/* Switch FR/EN in dictionary */
btnDicEn.addEventListener("click", () => {
    dictionaryLang = "en";
    btnDicEn.classList.add("active");
    btnDicFr.classList.remove("active");
    loadDictionary();
});

btnDicFr.addEventListener("click", () => {
    dictionaryLang = "fr";
    btnDicFr.classList.add("active");
    btnDicEn.classList.remove("active");
    loadDictionary();
});

/* ============================================================
   ALPHABET SCROLLER
============================================================ */
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function renderAlphabetScroller() {
    alphabetScroller.innerHTML = alphabet
        .map(l => `<div class="alpha-letter">${l}</div>`)
        .join("");
}
renderAlphabetScroller();

alphabetScroller.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    const rect = alphabetScroller.getBoundingClientRect();
    const pos = touch.clientY - rect.top;
    const index = Math.floor((pos / rect.height) * alphabet.length);

    const letter = alphabet[index];
    if (!letter) return;

    letterPopup.textContent = letter;
    letterPopup.style.display = "block";
    letterPopup.style.opacity = "1";

    setTimeout(() => (letterPopup.style.opacity = "0"), 200);

    const words = [...dictionaryList.children];
    const target = words.find(item => item.textContent[0].toUpperCase() === letter);

    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
});
