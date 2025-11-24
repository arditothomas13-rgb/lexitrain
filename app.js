// Add word
document.getElementById("addButton").addEventListener("click", () => {
    const word = document.getElementById("wordInput").value.trim();

    if (!word) {
        alert("Entre un mot avant d'ajouter !");
        return;
    }

    console.log("Mot ajouté :", word);

    document.getElementById("wordInput").value = "";
});


// Language switcher
const btnFrom = document.getElementById("langFrom");
const btnTo = document.getElementById("langTo");

btnFrom.addEventListener("click", () => {
    btnFrom.classList.add("active");
    btnTo.classList.remove("active");
});

btnTo.addEventListener("click", () => {
    btnTo.classList.add("active");
    btnFrom.classList.remove("active");
});
