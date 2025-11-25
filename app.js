// --------------------------------------
// LexiTrain — Version Multi-Sens Apple
// --------------------------------------

const inputField = document.getElementById("input");
const translateBtn = document.getElementById("translateBtn");
const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("result-title");

const senseTabs = document.getElementById("senseTabs");
const senseContent = document.getElementById("senseContent");


// --------------------------------------
// FETCH API (multi-sens)
// --------------------------------------
async function fetchWord(word) {
    const response = await fetch(`/api/translate.js?word=${encodeURIComponent(word)}`);
    const data = await response.json();
    return data;
}


// --------------------------------------
// Rendu des pills des sens
// --------------------------------------
function renderSenseTabs(entries) {
    senseTabs.innerHTML = "";

    entries.forEach((entry, index) => {
        const pill = document.createElement("div");
        pill.className = "sense-pill";
        if (index === 0) pill.classList.add("active");

        pill.textContent = `${entry.label}`;

        pill.addEventListener("click", () => {
            document.querySelectorAll(".sense-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            renderSenseContent(entry);
        });

        senseTabs.appendChild(pill);
    });
}


// --------------------------------------
// Rendu du contenu d’un sens
// --------------------------------------
function renderSenseContent(entry) {
    senseContent.innerHTML = "";

    // ------- Bloc Traductions -------
    if (entry.translations?.length) {
        const tBlock = document.createElement("div");
        tBlock.className = "translation-list";

        const title = document.createElement("div");
        title.className = "sense-block-title";
        title.textContent = "Traductions";
        tBlock.appendChild(title);

        entry.translations.forEach((t) => {
            const item = document.createElement("div");
            item.className = "translation-item";
            item.textContent = t;
            tBlock.appendChild(item);
        });

        senseContent.appendChild(tBlock);
    }

    // ------- Bloc Exemples -------
    if (entry.examples?.length) {
        const eBlock = document.createElement("div");
        eBlock.className = "examples-list";

        const title = document.createElement("div");
        title.className = "sense-block-title";
        title.textContent = "Exemples";
        eBlock.appendChild(title);

        entry.examples.forEach((ex) => {
            const exampleDiv = document.createElement("div");
            exampleDiv.className = "example-block";

            const srcText = document.createElement("div");
            srcText.className = "example-text";
            srcText.textContent = `• ${ex.src}`;

            const transText = document.createElement("div");
            transText.className = "example-translation";
            transText.textContent = `→ ${ex.dest}`;

            exampleDiv.appendChild(srcText);
            exampleDiv.appendChild(transText);

            eBlock.appendChild(exampleDiv);
        });

        senseContent.appendChild(eBlock);
    }

    // ------- Bloc Synonymes -------
    if (entry.synonyms?.length) {
        const sBlock = document.createElement("div");
        sBlock.className = "synonyms-wrapper";

        const title = document.createElement("div");
        title.className = "sense-block-title";
        title.style.marginBottom = "10px";
        title.textContent = "Synonymes";
        senseContent.appendChild(title);

        entry.synonyms.forEach((syn) => {
            const tag = document.createElement("div");
            tag.className = "synonym-tag";
            tag.textContent = syn;
            sBlock.appendChild(tag);
        });

        senseContent.appendChild(sBlock);
    }
}


// --------------------------------------
// Fonction principale
// --------------------------------------
async function translateWord() {
    const word = inputField.value.trim();
    if (!word) return;

    resultTitle.textContent = word;
    resultCard.style.display = "block";

    const data = await fetchWord(word);

    if (!data || !data.entries || !data.entries.length) {
        senseTabs.innerHTML = "";
        senseContent.innerHTML = "<p>Aucun résultat trouvé.</p>";
        return;
    }

    renderSenseTabs(data.entries);
    renderSenseContent(data.entries[0]);
}


// --------------------------------------
// Listeners
// --------------------------------------
translateBtn.addEventListener("click", translateWord);

inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") translateWord();
});
