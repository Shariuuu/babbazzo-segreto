document.addEventListener("DOMContentLoaded", () => {
  const selectEl = document.getElementById("choiceSelect");
  const inputEl = document.getElementById("textInput");
  const inputGroup = document.getElementById("textGroup");
  const inputNote = document.getElementById("inputNote");
  const formEl = document.getElementById("mainForm");
  const resultEl = document.getElementById("result");
  const submitBtn = document.getElementById("submitBtn");
  const secretDiv = document.getElementById("secretDiv");

  const notes = {
    andrea: "Perchè hai scelto me? Che cazzo vuoi? Scegli il tuo nome e levati dalle palle",
    dario: "A zi guarda che bello fare front end dio cane",
    stefano: "Avvocato speriamo che Lautaro si fa il crociato",
    bruno: "Ah, Bruno, il macinapepe degli dei. Leggende narrano che abbia sgrullato le palle anche a Crono, e per quello fu segregato nel Tartaro. Gasi.",
    mocu: "ou mocu",
    ciccio: "Francese del cazzo. Tra l'altro Francese e Francesco sono molto simili. Magari avere il culo sporco era il tuo destino?",
    ettore: "Il compare, grande sognatore di totalitarismi e pulizia etnica. Certo, poi quando segna Zambo Anguissa gode. La coerenza...",
    alessia: "Si, ti ho messa per ultima perchè le femmine stanno in fondo. Stacci."
  };

  // store users/passwords loaded from users.json
  let usersMap = {};
  let currentUser = "";

  async function loadUsersFile() {
    try {
      const res = await fetch("users.json", { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      usersMap = await res.json();
    } catch {
      usersMap = {};
      console.warn("err pass");
    }
  }

  // initial load
  loadUsersFile();

  // reset helper
  function hideInputGroup() {
    inputGroup.classList.add("hidden");
    inputEl.disabled = true;
    inputEl.value = "";
    submitBtn.disabled = true;
    inputNote.textContent = "";
    inputNote.setAttribute("aria-hidden", "true");
  }

  // picklist change
  selectEl.addEventListener("change", () => {
    const val = selectEl.value;
    currentUser = val;
    secretDiv.classList.add("hidden");
    secretDiv.setAttribute("aria-hidden", "true");
    resultEl.textContent = "";
    resultEl.classList.remove("result--error");

    if (!val) {
      hideInputGroup();
      return;
    }

    const hasPassword = Object.prototype.hasOwnProperty.call(usersMap, val);

    // restore custom note text from the notes map (if any) and show status
    // show custom note on its own line, status on the next line
    const noteText = notes[val] ? notes[val] : "";
    const statusText = hasPassword
      ? "Metti la password che t'ho dato. Tanto lo so che ora devi tornare su whatsapp perchè non te la ricordi, c'hai la memoria di un criceto dio"
      : "Nessuna password disponibile per questo utente (impossibile impostarne una qui).";
    if (noteText) {
      inputNote.innerHTML = `${noteText}<br><span class="note-status">${statusText}</span>`;
    } else {
      inputNote.textContent = statusText;
    }
    inputNote.setAttribute("aria-hidden", "false");

    // if there's a password defined in users.json allow the user to input it
    if (hasPassword) {
      inputGroup.classList.remove("hidden");
      inputEl.disabled = false;
      inputEl.value = "";
      inputEl.placeholder = "Ti sbrighi?";
      submitBtn.disabled = false;
      inputEl.focus();
    } else {
      // no password defined -> keep input visible but disabled (or hide entirely)
      // here we show the note but keep the input hidden/disabled
      hideInputGroup();
    }
  });

  // form submit -> verify only (no setting)
  formEl.addEventListener("submit", (ev) => {
    ev.preventDefault();
    resultEl.classList.remove("result--error");
    resultEl.textContent = "";

    const user = currentUser;
    const code = inputEl.value;

    if (!user) {
      resultEl.textContent = "Seleziona un utente.";
      resultEl.classList.add("result--error");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(usersMap, user)) {
      resultEl.textContent = "Questo utente non ha una password nel file users.json.";
      resultEl.classList.add("result--error");
      return;
    }

    if (!code) {
      resultEl.textContent = "Inserisci la password.";
      resultEl.classList.add("result--error");
      return;
    }

    // simple plaintext comparison against users.json entry
    const expected = String(usersMap[user]);
    if (code === expected) {
      resultEl.textContent = "Password corretta. Accesso consentito.";
      secretDiv.classList.remove("hidden");
      secretDiv.setAttribute("aria-hidden", "false");
    } else {
      resultEl.textContent = "Password errata.";
      resultEl.classList.add("result--error");
      secretDiv.classList.add("hidden");
      secretDiv.setAttribute("aria-hidden", "true");
    }

    inputEl.value = "";
    inputEl.focus();
  });
});