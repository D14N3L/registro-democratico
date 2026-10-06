// Comprueba que los datos cumplen el esquema y el criterio editorial.
// Uso: node scripts/validar.js
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(raiz, "index.html"), "utf8");
const lista = (nombre) => JSON.parse(html.match(new RegExp(`const ${nombre}\\s*=\\s*(\\[[^\\]]*\\])`))[1]);
const claves = (nombre) => [...html.match(new RegExp(`const ${nombre}\\s*=\\s*\\{([^;]*)\\};`))[1].matchAll(/(\w+):\s*[\[{]/g)].map((m) => m[1]);

const PARTIDOS = lista("PARTIES");
const PARTIDOS_VOTO = lista("VPARTIES");
const NIVELES = claves("PROOF");
const RESULTADOS = claves("ILPRES");
const VOTOS = ["si", "no", "ab", "sd"];
const CATEGORIAS = [
  "Control parlamentario",
  "Independencia de instituciones",
  "Incumplimiento de leyes y sentencias",
  "Derechos fundamentales y control judicial",
  "Medios públicos y propaganda",
  "Financiación y corrupción",
  "Gestión pública y derechos",
];
const DOMINIOS_EXCLUIDOS = ["okdiario.com", "theobjective.com", "eldebate.com", "libertaddigital.com", "edatv.news", "esdiario.com"];
const NOTAS_AL_EDITOR = /(?<!\p{L})(preséntalo|compruébalo|úsalo como|no las cites|no lo cites|ojo:)/iu;

const errores = [];
const error = (f, i, e, msg) => errores.push(`${f}[${i}] ${e.t || e.m || e.id}: ${msg}`);

function comunes(f, i, e) {
  if (!Array.isArray(e.src) || !e.src.length) error(f, i, e, "sin fuentes");
  for (const [titulo, url] of e.src || []) {
    if (!titulo || !/^https?:\/\//.test(url || "")) error(f, i, e, `fuente mal formada: ${titulo} ${url}`);
    const dominio = DOMINIOS_EXCLUIDOS.find((d) => (url || "").includes(d));
    if (dominio) error(f, i, e, `fuente excluida: ${dominio}`);
  }
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === "string" && NOTAS_AL_EDITOR.test(v)) error(f, i, e, `nota al editor en "${k}": ${v.match(NOTAS_AL_EDITOR)[0]}`);
  }
}

const leer = (f) => JSON.parse(fs.readFileSync(path.join(raiz, "datos", f + ".json"), "utf8"));

leer("fichas").forEach((e, i) => {
  comunes("fichas", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d)) error("fichas", i, e, `fecha d inválida: ${e.d}`);
  for (const k of ["dl", "t", "s", "n"]) if (!e[k]) error("fichas", i, e, `falta ${k}`);
  for (const p of e.p || []) if (!PARTIDOS.includes(p)) error("fichas", i, e, `partido desconocido: ${p}`);
  if (!e.p || !e.p.length) error("fichas", i, e, "sin partidos");
  if (!CATEGORIAS.includes(e.c)) error("fichas", i, e, `categoría desconocida: ${e.c}`);
  if (!NIVELES.includes(e.pr)) error("fichas", i, e, `nivel de prueba desconocido: ${e.pr}`);
});

leer("votaciones").forEach((e, i) => {
  comunes("votaciones", i, e);
  for (const k of ["id", "m", "dl", "r", "s"]) if (!e[k]) error("votaciones", i, e, `falta ${k}`);
  for (const [p, v] of Object.entries(e.v || {})) {
    if (!PARTIDOS_VOTO.includes(p)) error("votaciones", i, e, `partido desconocido: ${p}`);
    if (!VOTOS.includes(v)) error("votaciones", i, e, `voto desconocido: ${p}=${v}`);
  }
});

leer("iniciativas").forEach((e, i) => {
  comunes("iniciativas", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d)) error("iniciativas", i, e, `fecha d inválida: ${e.d}`);
  for (const k of ["a", "m", "f", "v", "s"]) if (!e[k]) error("iniciativas", i, e, `falta ${k}`);
  if (!RESULTADOS.includes(e.res)) error("iniciativas", i, e, `resultado desconocido: ${e.res}`);
  for (const p of e.p || []) if (!PARTIDOS.includes(p)) error("iniciativas", i, e, `partido desconocido: ${p}`);
});

if (errores.length) {
  console.error(errores.join("\n"));
  console.error(`\n${errores.length} errores`);
  process.exit(1);
}
console.log("Datos válidos");
