const input = document.getElementById("wordInput");
const button = document.getElementById("translateButton");
const result = document.getElementById("resultBox");

// ---------------------------
// SWAP LANGUES
// ---------------------------
langSwap.addEventListener("click", () => {
  const fromText = fromLabel.textContent;
  fromLabel.textContent = toLabel.textContent;
  toLabel.textContent = fromText;

  const fromF = fromFlag.textContent;
  fromFlag.textContent = toFlag.textContent;
  toFlag.textContent = fromF;
});

// ---------------------------
// TRADUCTION
// ---------------------------
button.addEventListener("click", async () => {
  const word = input.value.trim();
  if (!word) return;

  const from = fromLabel.textContent === "Anglais" ? "en" : "fr";
  const to = toLabel.textContent === "Français" ? "fr" : "en";

  result.style.opacity = 1;
  result.innerHTML = `
    <div class="loading-title">${word}</div>
    <p class="loading">Traduction en cours…</p>
  `;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, fromLang: from, toLang: to })
    });

    const data = await res.json();

    if (!data.ok) throw new Error();

    result.innerHTML = `<h2 class="word-title">${word}</h2>`;

    data.senses.forEach(sense => {
      result.innerHTML += `
        <div class="sense-block">
          <div class="sense-label">${sense.label}</div>

          <div class="section">
            <div class="section-title">Traductions</div>
            ${sense.translations}
          </div>

          <div class="section">
            <div class="section-title">Synonymes</div>
            ${sense.synonyms}
          </div>

          <div class="section">
            <div class="section-title">Exemples</div>
            <div class="examples">${sense.examples}</div>
          </div>
        </div>
      `;
    });

  } catch (e) {
    result.innerHTML = `<p class="error">⚠️ Erreur serveur.</p>`;
  }
});
