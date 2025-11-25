/* ============================================================
   LexiTrain — JS Complet
   (Traduction + Dico + Historique + Alphabet iOS)
============================================================ */

/* -----------------------------
   ELEMENTS DOM
----------------------------- */
const inputField = document.getElementById("input");
const translateBtn = document.getElementById("translateBtn");

const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");
const senseLabels = document.getElementById("senseLabels");
const senseTabs = document.getElementById("senseTabs");
const senseContent = document.getElementById("senseContent");

const pageTranslate = document.getElementById("page-translate");
const pageDictionary = document.getElementById("page-dictionary");

const navTranslate = document.getElementById("navTranslate");
const openDictionary = document.getElementById("openDictionary");

const dictionaryList = document.getElementById("dictionaryList");
const dictionarySearch = document.getElementById("dictionarySearch");

const alphabetScroller = document.getElementById("alphabetScroller");
const letterPopup = document.getElementById("letterPopup");

const historyList = document.getElementById("historyList");



/* ============================================================
   PAGE NAVIGATION
============================================================ */
function openTranslatePage() {
    pageTranslate.style.display = "block";
    pageDictionary.style.display = "none";
}

function openDictionaryPage() {
    pageTranslate.style.display = "none";
    pageDictionary.style.display = "block";
    loadDictionary();
}

navTranslate.addEventListener("click", openTranslatePage);
openDictionary.addEventListener("click", openDictionaryPage);



/* ============================================================
   API CALL → translate.js
============================================================ */
async function fetchWord(word) {
    try {
        const res = await fetch(`/api/translate.js?word=${encodeURIComponent(word)}`);
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
    senseLabels.innerHTML = "";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = `
        <div style="text-align:center; padding:20px; opacity:0.6;">
            ⏳ Veuillez patienter...
        </div>
    `;
}



/* ============================================================
   RESET RESULT
============================================================ */
function clearResult() {
    resultTitle.textContent = "";
    senseLabels.innerHTML = "";
    senseTabs.innerHTML = "";
    senseContent.innerHTML = "";
}



/* ============================================================
   RENDER — LABELS (noun / verb / adj…)
============================================================ */
function renderSenseLabels(entries) {
    senseLabels.innerHTML = "";

    entries.forEach((entry, index) => {
        const lbl = document.createElement("div");
        lbl.className = "sense-label-pill";
        if (index === 0) lbl.classList.add("active");

        lbl.textContent = entry.label;

        lbl.addEventListener("click", () => {
            document.querySelectorAll(".sense-label-pill")
                .forEach(p => p.classList.remove("active"));
            lbl.classList.add("active");

            renderSenseContent(entry);

            // haptique
            try { navigator.vibrate(10); } catch(e){}
        });

        senseLabels.appendChild(lbl);
    });
}



/* ============================================================
   RENDER — PILLS DES SENS
============================================================ */
function renderSenseTabs(entries) {
    senseTabs.innerHTML = "";

    entries.forEach((entry, index) => {
        const pill = document.createElement("div");
        pill.className = "sense-pill";
        if (index === 0) pill.classList.add("active");

        pill.textContent = entry.label;

        pill.addEventListener("click", () => {
            document.querySelectorAll(".sense-pill")
                .forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            renderSenseContent(entry);

            // haptique
            try { navigator.vibrate(10); } catch(e){}
        });

        senseTabs.appendChild(pill);
    });
}



/* ============================================================
   RENDER — CONTENU DU SENS
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
    tList.innerHTML = `<div class="sense-block-title">Translations (FR)</div>`;
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
    const sTitle = document.createElement("div");
    sTitle.className = "sense-block-title";
    sTitle.textContent = "Synonyms (EN)";
    senseContent.appendChild(sTitle);

    const sWrap = document.createElement("div");
    sWrap.className = "glass synonyms-wrapper";
    entry.synonyms.forEach(s => {
        const tag = document.createElement("div");
        tag.className = "synonym-tag";
        tag.textContent = s;
        sWrap.appendChild(tag);
    });
    senseContent.appendChild(sWrap);
}



/* ============================================================
   ACTION : TRADUIRE UN MOT
============================================================ */
async function translateWord() {
    const word = inputField.value.trim();
    if (!word) return;

    clearResult();
    showLoader();

    const data = await fetchWord(word);

    if (data.error) {
        resultTitle.textContent = "❌ Erreur";
        senseContent.innerHTML = `<div class="error">${data.error}</div>`;
        return;
    }

    resultTitle.textContent = word;

    renderSenseLabels(data.entries);
    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);

    addToHistory(word);
}

translateBtn.addEventListener("click", translateWord);
inputField.addEventListener("keypress", e => {
    if (e.key === "Enter") translateWord();
});



/* ============================================================
   HISTORIQUE localStorage
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
            openTranslatePage();
            translateWord();
        });

        historyList.appendChild(item);
    });
}

function addToHistory(word) {
    let hist = JSON.parse(localStorage.getItem("lexitrain_history") || "[]");
    hist = [word, ...hist.filter(w => w !== word)];
    hist = hist.slice(0, 10);
    localStorage.setItem("lexitrain_history", JSON.stringify(hist));
    loadHistory();
}

loadHistory();



/* ============================================================
   DICTIONNAIRE + ALPHABET iOS
============================================================ */
async function loadDictionary(search = "") {
    try {
        const res = await fetch(`/api/list-words.js?q=${search}`);
        const data = await res.json();

        dictionaryList.innerHTML = "";

        const words = data.words || [];

        // tri alphabétique
        words.sort((a, b) => a.localeCompare(b));

        // injection
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
   SCROLLER ALPHABETIQUE (A-Z)
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
        setTimeout(() => (letterPopup.style.display = "none"), 200);
    }, 600);

    try { navigator.vibrate(15); } catch(e){}
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
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
