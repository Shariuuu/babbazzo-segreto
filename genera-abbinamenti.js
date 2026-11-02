// Genera gli abbinamenti del Babbo Natale segreto rispettando le esclusioni,
// li cifra con la password di ciascuno e (con --scrivi) aggiorna script.js.
//
// Uso:
//   node genera-abbinamenti.js            -> controlla soltanto (non mostra chi ha chi)
//   node genera-abbinamenti.js --scrivi   -> estrae, cifra e sovrascrive encryptedAssignments in script.js
//
// Non stampa MAI gli abbinamenti in chiaro.

const fs = require("fs");
const path = require("path");
const { webcrypto } = require("crypto");
const subtle = webcrypto.subtle;

const DIR = __dirname;
const users = JSON.parse(fs.readFileSync(path.join(DIR, "users.json"), "utf8"));
const people = Object.keys(users);

// CHI -> a chi NON deve fare il regalo
const esclusioni = {
  alessia: ["ciccio", "ettore", "mocu"],
  mocu:    ["alessia", "ettore"],
  andrea:  ["ettore", "dario"],
  dario:   ["stefano", "andrea"], // "Avvocato" = Stefano
  ettore:  ["bruno", "alessia", "stefano"],
  stefano: ["andrea", "bruno"],
  bruno:   ["mocu", "ciccio"],
  ciccio:  ["dario", "alessia"],
};

for (const [chi, lista] of Object.entries(esclusioni)) {
  for (const n of [chi, ...lista]) {
    if (!people.includes(n)) throw new Error(`Nome sconosciuto nelle esclusioni: ${n}`);
  }
}

const vietato = (da, a) => da === a || (esclusioni[da] || []).includes(a);

// Tutti gli abbinamenti validi (8 persone: 8! = 40320 permutazioni, si fa in un attimo)
function tuttiValidi() {
  const out = [];
  const usati = new Set();
  const cur = {};
  (function rec(i) {
    if (i === people.length) { out.push({ ...cur }); return; }
    const da = people[i];
    for (const a of people) {
      if (usati.has(a) || vietato(da, a)) continue;
      usati.add(a); cur[da] = a;
      rec(i + 1);
      usati.delete(a); delete cur[da];
    }
  })(0);
  return out;
}

function toB64(buf) { return Buffer.from(buf).toString("base64"); }

async function deriveKey(password, salt, usage) {
  const km = await subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, [usage]
  );
}

async function encrypt(text, password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, "encrypt");
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text)));
  const out = new Uint8Array(16 + 12 + ct.length);
  out.set(salt, 0); out.set(iv, 16); out.set(ct, 28);
  return toB64(out);
}

async function decrypt(b64, password) {
  const d = Buffer.from(b64, "base64");
  const key = await deriveKey(password, d.subarray(0, 16), "decrypt");
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: d.subarray(16, 28) }, key, d.subarray(28));
  return new TextDecoder().decode(pt);
}

const scriptPath = path.join(DIR, "script.js");
const BLOCK_RE = /const encryptedAssignments = \{[\s\S]*?\};/;

// Controlla se l'estrazione attuale rispetta le esclusioni (senza dire chi ha chi)
async function controllaAttuale() {
  const src = fs.readFileSync(scriptPath, "utf8");
  const m = src.match(BLOCK_RE);
  if (!m) { console.log("Blocco encryptedAssignments non trovato in script.js"); return; }
  const enc = eval("(" + m[0].replace(/^const encryptedAssignments = /, "").replace(/;$/, "") + ")");
  let violazioni = 0, illeggibili = 0;
  for (const da of people) {
    try {
      const testo = (await decrypt(enc[da], users[da])).toLowerCase();
      const a = people.find((p) => testo.includes(p));
      if (!a) illeggibili++;
      else if (vietato(da, a)) violazioni++;
    } catch { illeggibili++; }
  }
  console.log(`Estrazione attuale: ${violazioni} abbinamenti violano le esclusioni` +
    (illeggibili ? `, ${illeggibili} non verificabili` : ""));
}

(async () => {
  const validi = tuttiValidi();
  console.log(`Abbinamenti validi possibili: ${validi.length}`);
  if (validi.length === 0) { console.log("Impossibile: le esclusioni sono troppo restrittive."); process.exit(1); }

  await controllaAttuale();

  if (!process.argv.includes("--scrivi")) {
    console.log("Nessuna modifica. Usa --scrivi per estrarre e aggiornare script.js.");
    return;
  }

  const idx = webcrypto.getRandomValues(new Uint32Array(1))[0] % validi.length;
  const scelta = validi[idx];

  const righe = [];
  for (const da of people) {
    righe.push(`  "${da}": "${await encrypt(scelta[da], users[da])}"`);
  }
  const blocco = `const encryptedAssignments = {\n${righe.join(",\n")}\n};`;

  const src = fs.readFileSync(scriptPath, "utf8");
  fs.writeFileSync(scriptPath + ".bak", src);
  fs.writeFileSync(scriptPath, src.replace(BLOCK_RE, blocco));
  console.log("script.js aggiornato (backup in script.js.bak). Nessun abbinamento mostrato.");
  await controllaAttuale();
})();
