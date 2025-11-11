document.addEventListener("DOMContentLoaded", () => {
  const selectEl = document.getElementById("choiceSelect");
  const inputEl = document.getElementById("textInput");
  const formEl = document.getElementById("mainForm");
  const resultEl = document.getElementById("result");
  const submitBtn = document.getElementById("submitBtn");

  // Enable text input when a picklist value is chosen
  selectEl.addEventListener("change", () => {
    if (selectEl.value) {
      inputEl.disabled = false;
      inputEl.placeholder = `Type something for "${selectEl.options[selectEl.selectedIndex].text}"...`;
      submitBtn.disabled = false;
      inputEl.focus();
    } else {
      inputEl.disabled = true;
      inputEl.value = "";
      inputEl.placeholder = "Select an option first...";
      submitBtn.disabled = true;
    }
    resultEl.textContent = "";
  });

  // Handle form submission
  formEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedOptionText =
      selectEl.options[selectEl.selectedIndex]?.text || "";
    const userText = inputEl.value.trim();

    if (!selectedOptionText || !userText) {
      resultEl.textContent = "Please select an option and enter some text.";
      resultEl.classList.add("result--error");
      return;
    }

    resultEl.classList.remove("result--error");
    resultEl.textContent = `You selected "${selectedOptionText}" and typed: "${userText}".`;

    // Optional: clear the text input but keep the selection
    inputEl.value = "";
    inputEl.focus();
  });
});