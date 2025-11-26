import { getDictionaryWords } from "../api/dictionary.js"; // à adapter à ta structure

let words = [];
let currentQuestion = 0;
let score = 0;

async function initChatQuiz() {
  const allWords = await getDictionaryWords();
  // Prend 5 mots aléatoires
  words = allWords.sort(() => 0.5 - Math.random()).slice(0, 5);
  currentQuestion = 0;
  score = 0;
  showNextQuestion();
}

function showNextQuestion() {
  if (currentQuestion >= words.length) return showResult();

  const word = words[currentQuestion];
  const askEnglish = Math.random() > 0.5;

  const question = askEnglish
    ? `Comment dit-on « ${word.en} » en français ?`
    : `Comment dit-on « ${word.fr} » en anglais ?`;

  addMessage("prof", question);
}

function checkAnswer(userAnswer) {
  const word = words[currentQuestion];
  const correct = [word.fr.toLowerCase(), word.en.toLowerCase()];
  const askEnglish = /français/.test(
    document.querySelector(".chat-message:last-child").textContent
  );

  const isCorrect = askEnglish
    ? userAnswer.toLowerCase() === word.fr.toLowerCase()
    : userAnswer.toLowerCase() === word.en.toLowerCase();

  if (isCorrect) {
    score++;
    addMessage("prof", `✅ Exact ! Bravo 👏`);
  } else {
    addMessage("prof", `❌ Presque ! La bonne réponse était « ${askEnglish ? word.fr : word.en} ».`);
  }

  currentQuestion++;
  setTimeout(showNextQuestion, 1500);
}

function showResult() {
  addMessage("prof", `✨ C'est fini ! Tu as ${score}/5 🌈`);
}

function addMessage(author, text) {
  const chat = document.querySelector("#chat");
  const div = document.createElement("div");
  div.className = `chat-message ${author}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Initialisation du chat
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("chatSend");
  const input = document.getElementById("chatAnswer");
  const chat = document.getElementById("chatMessages");

  sendBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) return;
    addMessage("user", val);
    handleChatMessage(val);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  addMessage("prof", "👋 Salut ! Je suis ton prof de vocabulaire. Je vais te poser 5 questions sur les mots que tu as déjà traduits. Prêt(e) ? Écris 'OK' pour commencer.");
});

let step = 0;
let score = 0;
let quizWords = [];
let currentWord = null;

async function handleChatMessage(message) {
  if (step === 0 && message.toLowerCase() === "ok") {
    quizWords = await fetch("/api/words").then(r => r.json());
    quizWords = quizWords.words.sort(() => 0.5 - Math.random()).slice(0, 5);
    step = 1;
    askNextQuestion();
    return;
  }

  if (step > 0 && step <= 5) {
    checkAnswer(message);
  }
}

function askNextQuestion() {
  if (step > 5) return endQuiz();

  currentWord = quizWords[step - 1];
  const askFr = Math.random() > 0.5;
  currentWord.askFr = askFr;

  const q = askFr
    ? `Comment dit-on « ${currentWord.en} » en français ?`
    : `Traduis en anglais le mot « ${currentWord.fr} »`;

  addMessage("prof", q);
}

function checkAnswer(answer) {
  const correct = currentWord.askFr ? currentWord.fr : currentWord.en;
  const ok = answer.trim().toLowerCase() === correct.toLowerCase();

  if (ok) {
    score++;
    addMessage("prof", "✅ Exact ! Super travail !");
  } else {
    addMessage("prof", `❌ Pas tout à fait. La bonne réponse était « ${correct} ».`);
  }

  step++;
  if (step <= 5) {
    setTimeout(askNextQuestion, 1200);
  } else {
    setTimeout(endQuiz, 1500);
  }
}

function endQuiz() {
  addMessage("prof", `🎯 C'est fini ! Tu as obtenu ${score}/5 🌟`);
}

function addMessage(author, text) {
  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-message ${author}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
