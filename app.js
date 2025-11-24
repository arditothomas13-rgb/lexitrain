/* -------------------------------
   VARIABLES D’ÉTAT
-------------------------------- */
let fromLang = "en";
let toLang = "fr";

/* -------------------------------
   ÉLÉMENTS DU DOM
-------------------------------- */
const input = document.getElementById("wordInput");
const translateBtn = document.getElementById("translateButton");
const resultBox = document.getElementById("resultBox");
const langSwap = document.getElementById("langSwap");
const fromLabel = document.getElementById("fromLabel");
const toLabel = document.getElementById("toLabel");
const fromFlag = document.getElementById("fromFlag");
const toFlag = document.getElementById("toFlag");

/* -------------------------------
   TRADUCTION (API Libre)
-------------------------------- */
async function translate(text) {
  try {
    const res = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + `&langpair=${fromLang}|${toLang}`);
    const data = await res.json();

    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return "Traduction non disponible";
  } catch (e) {
    return "Erreur de traduction";
  }
}

/* -------------------------------
   ACTION : CLIQUE SUR “TRADUIRE”
-------------------------------- */
translateBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  resultBox.innerHTML = "⏳ Analyse...";
  resultBox.style.opacity = 1;

  const translated = await translate(text);

  resultBox.innerHTML = `
    <strong>${text}</strong><br>
    <span style="opacity:.8">${translated}</span>
  `;
});

/* -------------------------------
   SWAP DES LANGUES
-------------------------------- */
langSwap.addEventListener("click", () => {
  
  // inversion valeurs techniques
  [fromLang, toLang] = [toLang, fromLang];

  // inversion labels visibles
  const tempText = fromLabel.textContent;
  fromLabel.textContent = toLabel.textContent;
  toLabel.textContent = tempText;

  // inversion drapeaux
  const tempFlag = fromFlag.textContent;
  fromFlag.textContent = toFlag.textContent;
  toFlag.textContent = tempFlag;

  // petite animation
  langSwap.classList.add("swap-anim");
  setTimeout(() => langSwap.classList.remove("swap-anim"), 300);
});
