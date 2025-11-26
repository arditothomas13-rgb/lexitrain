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
