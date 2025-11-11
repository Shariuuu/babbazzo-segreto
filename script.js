document.addEventListener("DOMContentLoaded", () => {
  const selectEl = document.getElementById("choiceSelect");
  const inputEl = document.getElementById("textInput");
  const inputGroup = document.getElementById("textGroup");
  const inputNote = document.getElementById("inputNote");
  const formEl = document.getElementById("mainForm");
  const resultEl = document.getElementById("result");
  const submitBtn = document.getElementById("submitBtn");
  const secretDiv = document.getElementById("secretDiv");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");

    const notes = {
    andrea: "Perchè hai scelto Andrea? Che cazzo vuoi? Scegli il tuo nome, levati dalle palle",
    dario: "A zi guarda che bello fare front end dio cane",
    stefano: "Avvocato speriamo che Lautaro si fa il crociato",
    bruno: "Ah, Bruno, il macinapepe degli dei. Leggende narrano che abbia sgrullato le palle anche a Crono, e per quello fu segregato nel Tartaro. Gasi.",
    mocu: "ou mocu",
    ciccio: "Francese del cazzo. Tra l'altro Francese e Francesco solo molto simili. Magari avere il culo sporco era il tuo destino?",
    ettore: "Il compare, grande sognatore di totalitarismi e pulizia etnica. Certo, poi quando segna Zambo Anguissa gode. La coerenza...",
    alessia: "Si, ti ho messa per ultima perchè le femmine stanno in fondo. Stacci."
  };

  // client-side storage key (GitHub Pages -> no server write)
  const STORAGE_KEY = "userCodes";

  // helpers
  const hex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const randomHex = (len) => {
    const b = new Uint8Array(len / 2);
    crypto.getRandomValues(b);
    return hex(b);
  };

  async function hashPassword(password, saltHex) {
    const enc = new TextEncoder();
    const passKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16))
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      passKey,
      256
    );
    return hex(derived);
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function writeStore(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  let currentUser = "";
  let userHasCode = false;

  // picklist change
  selectEl.addEventListener("change", () => {
    const val = selectEl.value;
    currentUser = val;
    secretDiv.classList.add("hidden");
    secretDiv.setAttribute("aria-hidden", "true");
    resultEl.textContent = "";

    if (!val) {
      inputGroup.classList.add("hidden");
      inputEl.disabled = true;
      inputEl.value = "";
      submitBtn.disabled = true;
      inputNote.textContent = "";
      inputNote.setAttribute("aria-hidden", "true");
      return;
    }

    const store = readStore();
    userHasCode = !!store[val];

    // restore custom note text from the notes map, keep the password-status message
    const notePrefix = notes[val] ? notes[val] + " " : "";
    inputNote.textContent = notePrefix + (userHasCode
      ? "Password già impostata — inserisci la password per vedere il contenuto."
      : "Nessuna password impostata — inserisci una nuova password per impostarla.");
    inputNote.setAttribute("aria-hidden", "false");

    inputGroup.classList.remove("hidden");
    inputEl.disabled = false;
    inputEl.value = "";
    inputEl.placeholder = userHasCode
      ? "Inserisci password..."
      : "Imposta una nuova password...";
    submitBtn.disabled = false;
    inputEl.focus();
  });

  // form submit -> set or verify
  formEl.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    resultEl.classList.remove("result--error");
    resultEl.textContent = "";

    const user = currentUser;
    const code = inputEl.value.trim();
    if (!user || !code) {
      resultEl.textContent = "Seleziona un utente e inserisci una password.";
      resultEl.classList.add("result--error");
      return;
    }

    const store = readStore();

    try {
      if (!userHasCode) {
        // set new password (store salt + hash)
        const salt = randomHex(32); // 16 bytes
        const hashed = await hashPassword(code, salt);
        store[user] = { salt, hash: hashed, createdAt: Date.now() };
        writeStore(store);
        userHasCode = true;
        resultEl.textContent = "Password impostata. Accesso consentito.";
        secretDiv.classList.remove("hidden");
        secretDiv.setAttribute("aria-hidden", "false");
      } else {
        // verify
        const entry = store[user];
        if (!entry) throw new Error("entry missing");
        const hashed = await hashPassword(code, entry.salt);
        if (hashed === entry.hash) {
          resultEl.textContent = "Password corretta. Accesso consentito.";
          secretDiv.classList.remove("hidden");
          secretDiv.setAttribute("aria-hidden", "false");
        } else {
          resultEl.textContent = "Password errata.";
          resultEl.classList.add("result--error");
        }
      }
    } catch (err) {
      resultEl.textContent = "Errore interno.";
      resultEl.classList.add("result--error");
    }

    inputEl.value = "";
    inputEl.focus();
  });

  // Export / Import (client-side file)
  exportBtn.addEventListener("click", () => {
    const data = localStorage.getItem(STORAGE_KEY) || "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "userCodes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error("Invalid format");
        writeStore(parsed);
        resultEl.textContent = "Importazione completata.";
        // if current user now has code, update UI
        const store = readStore();
        userHasCode = !!store[currentUser];
      } catch {
        resultEl.textContent = "File non valido.";
        resultEl.classList.add("result--error");
      } finally {
        importInput.value = "";
      }
    };
    reader.readAsText(f);
  });
});