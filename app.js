document.getElementById("addBtn").addEventListener("click", () => {
  const word = document.getElementById("wordInput").value.trim();

  if (word === "") {
    alert("Entre un mot à traduire 🙏");
    return;
  }

  alert("Mot ajouté : " + word);
  document.getElementById("wordInput").value = "";
});
