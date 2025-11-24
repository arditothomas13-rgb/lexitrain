// --------------------------------------------------
// VARIABLES
// --------------------------------------------------
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");   // FIX ICI
const resultBox = document.getElementById("resultBox");

// Langues
const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel   = document.getElementById("toLabel");
const fromFlag  = document.getElementById("fromFlag");
const toFlag    = document.getElementById("toFlag");

// --------------------------------------------------
// SWAP LANGUES
// --------------------------------------------------
langSwap.addEventListener("click", () => {
    const tmpLabel = fromLabel.textContent;
    const tmpFlag  = fromFlag.textContent;

    fromLabel.textContent = toLabel.textContent;
    fromFlag.textContent  = toFlag.textContent;

    toLabel.textContent = tmpLabel;
    toFlag.textContent  = tmpFlag;
});

// --------------------------------------------------
// CLICK TRADUIRE
// --------------------------------------------------
translateBtn.addEventListener("click", async () => {   // FIX ICI
    const word = input.value.trim();
    if (!word) return;

    // Loading visible
    resultBox.style.opacity = 1;
    resultBox.innerHTML = `
        <h2>${word}</h2>
        <p>⏳ Traduction en cours...</p>
    `;

    const from = (fromLabel.textContent === "Anglais") ? "en" : "fr";
    const to   = (toLabel.textContent === "Français") ? "fr" : "en";

    try {
        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                word,
                fromLang: from,   // IMPORTANT : NOM FIXÉ pour backend
                toLang: to
            })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) throw new Error("Erreur API");

        resultBox.innerHTML = `
            <h2>${word}</h2>

            <div class="tabs">
                <button class="active" data-tab="tab-traduction">Traduction</button>
                <button data-tab="tab-definition">Définition</button>
                <button data-tab="tab-synonymes">Synonymes</button>
                <button data-tab="tab-exemples">Exemples</button>
            </div>

            <div id="tab-traduction" class="tab-content active">
                ${data.translations}
            </div>

            <div id="tab-definition" class="tab-content">
                ${data.definitions || "Aucune définition disponible."}
            </div>

            <div id="tab-synonymes" class="tab-content">
                ${data.synonyms || "Aucun synonyme disponible."}
            </div>

            <div id="tab-exemples" class="tab-content">
                ${data.examples || "Aucun exemple disponible."}
            </div>
        `;

        // Onglets
        document.querySelectorAll(".tabs button").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                btn.classList.add("active");
                document.getElementById(btn.dataset.tab).classList.add("active");
            });
        });

    } catch (err) {
        resultBox.innerHTML = `
            <h2>${word}</h2>
            <p style="color:#c00;">⚠️ Erreur serveur.</p>
        `;
    }
});
