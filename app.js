// --------------------------------------
// LexiTrain — Version Premium Apple
// --------------------------------------

const inputField = document.getElementById("input");
const translateBtn = document.getElementById("translateBtn");
const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");

const senseTabs = document.getElementById("senseTabs");
const senseContent = document.getElementById("senseContent");

// Fetch endpoint
async function fetchWord(word) {
    const response = await fetch(`/api/translate.js?word=${encodeURIComponent(word)}`);
    return await response.json();
}

// Render tabs
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

// Render content for each sense
function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    // Definition (EN)
    if (entry.definition) {
        const defSection = document.createElement("div");
        defSection.className = "definition-section glass";
        defSection.innerHTML = `
            <div class="sense-block-title">Definition</div>
            <div class="definition-text">${entry.definition}</div>
        `;
        senseContent.appendChild(defSection);
    }

    // Translations (FR)
    const tBlock = document.createElement("div");
    tBlock.className = "translation-list glass";
    tBlock.innerHTML = `<div class="sense-block-title">Translations (FR)</div>`;
    entry.translations.forEach(t => {
        const item = document.createElement("div");
        item.className = "translation-item";
        item.textContent = t;
        tBlock.appendChild(item);
    });
    senseContent.appendChild(tBlock);

    // Examples
    const eBlock = document.createElement("div");
    eBlock.className = "examples-list glass";
    eBlock.innerHTML = `<div class="sense-block-title">Examples</div>`;
    entry.examples.forEach(ex => {
        const exampleDiv = document.createElement("div");
        exampleDiv.className = "example-block";

        exampleDiv.innerHTML = `
            <div class="example-text">• ${ex.src}</div>
            <div class="example-translation">→ ${ex.dest}</div>
        `;

        eBlock.appendChild(exampleDiv);
    });
    senseContent.appendChild(eBlock);

    // Synonyms (EN)
    const sBlock = document.createElement("div");
    sBlock.className = "synonyms-wrapper glass";

    const synTitle = document.createElement("div");
    synTitle.className = "sense-block-title";
    synTitle.textContent = "Synonyms (EN)";
    senseContent.appendChild(synTitle);

    entry.synonyms.forEach(syn => {
        const tag = document.createElement("div");
        tag.className = "synonym-tag";
        tag.textContent = syn;
        sBlock.appendChild(tag);
    });

    senseContent.appendChild(sBlock);
}

// Main
async function translateWord() {
    const word = inputField.value.trim();
    if (!word) return;

    resultTitle.textContent = word;
    resultCard.style.display = "block";

    const data = await fetchWord(word);

    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);
}

// Listeners
translateBtn.addEventListener("click", translateWord);
inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") translateWord();
});
