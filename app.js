
document.getElementById("addBtn").addEventListener("click", () => {
  const word = document.getElementById("wordInput").value.trim();
  if (!word) return alert("Entre un mot !");
  alert("Fonction à venir : ajouter '" + word + "' au lexique !");
});
