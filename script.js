document.addEventListener("DOMContentLoaded", () => {
  const selectEl = document.getElementById("name");
  const inputEl = document.getElementById("password");
  const inputGroup = document.getElementById("textGroup");
  const inputNote = document.getElementById("inputNote");
  const formEl = document.getElementById("mainForm");
  const resultEl = document.getElementById("result");
  const resultPasswordEl = document.getElementById("resultPassword");
  const resultTextEl = document.getElementById("resultText");
  const submitBtn = document.getElementById("submitBtn");
  const secretDiv = document.getElementById("secretDiv");

  const notes = {
    andrea: "Perchè hai scelto me? Che cazzo vuoi? Scegli il tuo nome e levati dalle palle",
    dario: "A zi guarda che bello fare front end dio cane",
    stefano: "Avvocato speriamo che Lautaro si fa il crociato",
    bruno: "Ah, Bruno, il macinapepe degli dei. Leggende narrano che abbia sgrullato le palle anche a Crono, e per quello fu segregato nel Tartaro. Gasi.",
    mocu: "ou mocu, t'appost? Ti ho visto al telegiornale, freschissimo",
    ciccio: "Francese del cazzo. Tra l'altro Francese e Francesco sono molto simili. Magari avere il culo sporco era il tuo destino?",
    ettore: "Il compare, grande sognatore di totalitarismi e pulizia etnica. Certo, poi quando segna Zambo Anguissa gode. La coerenza...",
    alessia: "Si, ti ho messa per ultima perchè le femmine stanno in fondo. Stacci."
  };

  const encryptedAssignments = {
  "andrea": "PlE28l83p8qIg6DlzxVqvA9mPuG/wrgGrphVA/uIB+HnL5s27x2ES7PhfLlkhPp9NN0ZW3/ha/h76zvoqeS3x0IjOpb7DLhQ",
  "dario": "vn2uyeXC53eOFMMUJN9gcyGr/XrBOyuNSYP/dCtFVZFX//93yyBqzoK5RKziyvCguURTX645Iwo9v2ZqFWQUY5p962q5EKtkyA==",
  "stefano": "teu5fhzXU/N7ip9Tm0AzE+Je1t1EsTWM7dqjULai7Z7a0P1bHts2GBTNpj3v3WMAZO94ysyFRYuSG2LHb9SIvDvn/4nUd/fs",
  "bruno": "Ok7Amrr6dvuoClZoSfMnZSAQPOzwk+i2WndHKecBDZWGLvDAXolguxVurtxrZyNVQrkFJ2WHucPZUi0lnmoTEMoNYkr9b7B9DA==",
  "mocu": "36sZCio0TQhOe3vvl/zXKjEcnVXo8kRvbJB78HwlZ+qpRxJGmjtGHvN8YPJEvlBl//CY13teqnFDvScVqKO9pXwu6LT4HpmASw==",
  "ciccio": "sb/HNUmpJScwS7Uv66+3yLJPmWO1JYeHKj599Iah8jnSNtoANvY63nGPA6iIC/n0FXxR2PjD1l1cl6L4s1fTCx9Q/NrOBlXTzBw=",
  "ettore": "11nXZP6ltZZOdwO01MERsRA44YsFyBrqIGEVtMMUzUOU7u4YoeRR9FbD6kmIxqDvufWHQUazPmdupuob7HGRtmYc/d4t+qdDhY4=",
  "alessia": "N75slmPX8W7KC4b0R8BmFCimvrismN+0flo7yXnsd0vAzW4X43nZp7/vPMT2d/jJZdU9b9eDlhsy+ek2RZjzVQ7rxWOidzQ="
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64ToBytes(b64) {
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

async function deriveKeyFromPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 200000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  return key;
}

async function decryptAssignment(base64Data, password) {
  const data = base64ToBytes(base64Data);
  const salt = data.slice(0, 16);
  const iv   = data.slice(16, 28);
  const ct   = data.slice(28);

  const key = await deriveKeyFromPassword(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return textDecoder.decode(plainBuffer);
}

document.getElementById("goBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const pwd  = document.getElementById("password").value;
  const resultEl = document.getElementById("result");
  resultEl.textContent = "";
  resultEl.className = "";

  if (!name || !pwd) {
    resultEl.textContent = "Metti la password. Si, la devi rimettere, non rompere i coglioni";
    resultEl.className = "error";
    return;
  }

  const enc = encryptedAssignments[name];
  if (!enc) {
    resultEl.textContent = "Nome non valido.";
    resultEl.className = "error";
    return;
  }

  try {
    const msg = await decryptAssignment(enc, pwd);
    resultEl.textContent = msg;
    resultEl.classList.add("resultNameClass")
    resultTextEl.classList.remove("hidden");
    resultTextEl.setAttribute("aria-hidden", "false");
    resultPasswordEl.classList.add("hidden");
  } catch (e) {
    console.error(e);
    resultPasswordEl.textContent = "Password errata. Ma sai scrivere? La prima volta giusta e ora no?";
    resultPasswordEl.className = "error";
  }
});

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


  loadUsersFile();

  function hideInputGroup() {
    inputGroup.classList.add("hidden");
    inputEl.disabled = true;
    inputEl.value = "";
    submitBtn.disabled = true;
    inputNote.textContent = "";
    inputNote.setAttribute("aria-hidden", "true");
  }

  function setResult(message = "", isError = false) {
    resultEl.textContent = message;
    if (message) {
    } else {
      resultTextEl.classList.add("hidden");
      resultTextEl.setAttribute("aria-hidden", "true");
    }

    if (isError) {
      resultEl.classList.add("result--error");
    } else {
      resultEl.classList.remove("result--error");
    }
  }

  selectEl.addEventListener("change", () => {
    const val = selectEl.value;
    currentUser = val;
    secretDiv.classList.add("hidden");
    secretDiv.setAttribute("aria-hidden", "true");
    setResult("");
    resultEl.classList.remove("result--error");

    submitBtn.classList.remove("hidden");
    submitBtn.style.display = "";

    if (!val) {
      hideInputGroup();
      return;
    }

    const hasPassword = Object.prototype.hasOwnProperty.call(usersMap, val);

    const noteText = notes[val] ? notes[val] : "";
    const statusText = hasPassword
      ? "Metti la password che t'ho dato. Tanto lo so che ora devi tornare su whatsapp perchè non te la ricordi, c'hai la memoria di un criceto dio"
      : "Nessuna password ";
    if (noteText) {
      inputNote.innerHTML = `${noteText}<br/><br/><br/><span class="note-status">${statusText}</span>`;
    } else {
      inputNote.textContent = statusText;
    }
    inputNote.setAttribute("aria-hidden", "false");

    if (hasPassword) {
      inputGroup.classList.remove("hidden");
      inputEl.disabled = false;
      inputEl.value = "";
      inputEl.placeholder = "Ti sbrighi?";
      submitBtn.disabled = false;
      inputEl.focus();
    } else {

      hideInputGroup();
    }
  });

  formEl.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const user = currentUser;
    const code = inputEl.value;

    if (!user) {
      setResult("Seleziona un utente.", true);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(usersMap, user)) {
      setResult("Questo utente non ha una password nel file users.json.", true);
      return;
    }

    if (!code) {
      setResult("Inserisci la password.", true);
      return;
    }


    const expected = String(usersMap[user]);
    if (code === expected) {
      setResult("Password corretta. Bravo scupino. Ora premi il bottone.", false);
      secretDiv.classList.remove("hidden");
      secretDiv.setAttribute("aria-hidden", "false");
      resultPasswordEl.classList.add("hidden");

      submitBtn.classList.add("hidden");
      submitBtn.style.display = "none";
    } else {
      resultPasswordEl.textContent = "Password errata. Sei serio?";
      resultPasswordEl.classList.add("error");
      secretDiv.classList.add("hidden");
      secretDiv.setAttribute("aria-hidden", "true");

      submitBtn.classList.remove("hidden");
      submitBtn.style.display = "";
    }

    inputEl.value = "";
    inputEl.focus();
  });
});