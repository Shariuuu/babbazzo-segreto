document.addEventListener("DOMContentLoaded", () => {
  const selectEl = document.getElementById("choiceSelect");
  const inputSection = document.getElementById("inputSection");
  const inputEl = document.getElementById("textInput");
  const formEl = document.getElementById("mainForm");
  const resultEl = document.getElementById("result");

  // Mostra input e bottone solo dopo la selezione
  selectEl.addEventListener("change", () => {
    if (selectEl.value) {
      inputSection.classList.remove("hidden");
      inputEl.focus();
    } else {
      inputSection.classList.add("hidden");
      inputEl.value = "";
    }
    resultEl.textContent = "";
  });

  // Gestione invio form
  formEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedOptionText =
      selectEl.options[selectEl.selectedIndex]?.text || "";
    const userText = inputEl.value.trim();

    if (!selectedOptionText || !userText) {
      resultEl.textContent = "Seleziona un'opzione e inserisci del testo.";
      resultEl.classList.add("result--error");
      return;
    }

    resultEl.classList.remove("result--error");
    resultEl.textContent = `Hai selezionato "${selectedOptionText}" e scritto: "${userText}".`;

    inputEl.value = "";
    inputEl.focus();
  });
});
