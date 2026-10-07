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
// Criterio de medios (decisión editorial, 6-10-2026), igual para todas las líneas:
// excluido = condena firme por información falsa, o 2 o más resoluciones de la FAPE en contra por veracidad en 5 años.
// con cautela = un caso suelto verificado (condena, rectificación judicial o resolución de la FAPE en contra).
//   Si una entrada solo se apoya en uno de estos medios, se busca otra fuente del mismo hecho.
const DOMINIOS_EXCLUIDOS = ["okdiario.com", "eldebate.com"];
const DOMINIOS_CAUTELA = [
  "libertaddigital.com", "edatv.news", "esdiario.com", "elpais.com", "elmundo.es", "abc.es", "elconfidencial.com",
  "eldiario.es", "publico.es", "europapress.es", "rtve.es", "canalsur.es", "elespanol.com",
];
// Periodo del registro (decisión editorial, 6-10-2026): los diez años 2016-2026.
const INICIO_PERIODO = "2016-01-01";
const NOTAS_AL_EDITOR = /(?<!\p{L})(preséntalo|compruébalo|úsalo|no las cites|no lo cites|ojo:|revísalo|verifícalo)/iu;

const errores = [];
const avisos = [];
const error = (f, i, e, msg) => errores.push(`${f}[${i}] ${e.t || e.m || e.id}: ${msg}`);
const dominio = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

function comunes(f, i, e) {
  if (!Array.isArray(e.src) || !e.src.length) error(f, i, e, "sin fuentes");
  for (const [titulo, url] of e.src || []) {
    if (!titulo || !/^https?:\/\//.test(url || "")) error(f, i, e, `fuente mal formada: ${titulo} ${url}`);
    const dominio = DOMINIOS_EXCLUIDOS.find((d) => (url || "").includes(d));
    if (dominio) error(f, i, e, `fuente excluida: ${dominio}`);
  }
  const medios = [...new Set((e.src || []).map(([, url]) => dominio(url)))];
  if (medios.length === 1 && DOMINIOS_CAUTELA.some((d) => medios[0] === d || medios[0].endsWith("." + d)))
    avisos.push(`${f}[${i}] ${e.t || e.m || e.id}: solo una fuente con cautela (${medios[0]})`);
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === "string" && NOTAS_AL_EDITOR.test(v)) error(f, i, e, `nota al editor en "${k}": ${v.match(NOTAS_AL_EDITOR)[0]}`);
  }
}

const leer = (f) => JSON.parse(fs.readFileSync(path.join(raiz, "datos", f + ".json"), "utf8"));

leer("fichas").forEach((e, i) => {
  comunes("fichas", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d)) error("fichas", i, e, `fecha d inválida: ${e.d}`);
  else if (e.d < INICIO_PERIODO) error("fichas", i, e, `fecha anterior al periodo: ${e.d}`);
  for (const k of ["dl", "t", "s", "n"]) if (!e[k]) error("fichas", i, e, `falta ${k}`);
  for (const p of e.p || []) if (!PARTIDOS.includes(p)) error("fichas", i, e, `partido desconocido: ${p}`);
  if (!e.p || !e.p.length) error("fichas", i, e, "sin partidos");
  if (!CATEGORIAS.includes(e.c)) error("fichas", i, e, `categoría desconocida: ${e.c}`);
  if (!NIVELES.includes(e.pr)) error("fichas", i, e, `nivel de prueba desconocido: ${e.pr}`);
});

leer("votaciones").forEach((e, i) => {
  comunes("votaciones", i, e);
  for (const k of ["id", "tema", "m", "dl", "r", "s"]) if (!e[k]) error("votaciones", i, e, `falta ${k}`);
  for (const [p, v] of Object.entries(e.v || {})) {
    if (!PARTIDOS_VOTO.includes(p)) error("votaciones", i, e, `partido desconocido: ${p}`);
    if (!VOTOS.includes(v)) error("votaciones", i, e, `voto desconocido: ${p}=${v}`);
  }
});

leer("iniciativas").forEach((e, i) => {
  comunes("iniciativas", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d)) error("iniciativas", i, e, `fecha d inválida: ${e.d}`);
  else if (e.d < INICIO_PERIODO) error("iniciativas", i, e, `fecha anterior al periodo: ${e.d}`);
  for (const k of ["a", "m", "f", "v", "s"]) if (!e[k]) error("iniciativas", i, e, `falta ${k}`);
  if (!RESULTADOS.includes(e.res)) error("iniciativas", i, e, `resultado desconocido: ${e.res}`);
  for (const p of e.p || []) if (!PARTIDOS.includes(p)) error("iniciativas", i, e, `partido desconocido: ${p}`);
});

const APOYOS = [...html.match(/const MAYAP\s*=\s*\{([^}]*)\}/)[1].matchAll(/(\w+):"/g)].map((m) => m[1]);
const TRAMITES = ["lectura única", "urgencia", "ómnibus", "decreto-ley", "proposición del grupo del Gobierno",
  "enmienda de última hora", "sin informes preceptivos", "reforma del reglamento", "veto"];
leer("mayorias").forEach((e, i) => {
  e.t = e.ley;
  comunes("mayorias", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d)) error("mayorias", i, e, `fecha d inválida: ${e.d}`);
  else if (e.d < INICIO_PERIODO) error("mayorias", i, e, `fecha anterior al periodo: ${e.d}`);
  for (const k of ["a", "g", "ley", "tema", "voto", "s", "n"]) if (!e[k]) error("mayorias", i, e, `falta ${k}`);
  if (!PARTIDOS.includes(e.g)) error("mayorias", i, e, `partido desconocido: ${e.g}`);
  if (!APOYOS.includes(e.ap)) error("mayorias", i, e, `apoyo desconocido: ${e.ap}`);
  for (const t of e.tram || []) if (!TRAMITES.includes(t)) error("mayorias", i, e, `tramitación desconocida: ${t}`);
});

// Pestañas opcionales: solo se validan si el fichero existe.
const existe = (f) => fs.existsSync(path.join(raiz, "datos", f + ".json"));
const VERIFICADORES = ["Maldita.es", "Newtral", "EFE Verifica", "Verificat"];
if (existe("bulos")) leer("bulos").forEach((e, i) => {
  e.t = e.dicho;
  comunes("bulos", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d) || e.d < INICIO_PERIODO) error("bulos", i, e, `fecha inválida o anterior al periodo: ${e.d}`);
  for (const k of ["quien", "cargo", "canal", "tema", "dicho", "datos", "verif", "calif"]) if (!e[k]) error("bulos", i, e, `falta ${k}`);
  for (const p of e.p || []) if (!PARTIDOS.includes(p)) error("bulos", i, e, `partido desconocido: ${p}`);
  if (!VERIFICADORES.includes(e.verif)) error("bulos", i, e, `verificador fuera de la EFCSN: ${e.verif}`);
  if (!(e.src || []).some(([, u]) => /maldita\.es|newtral\.es|verifica\.efe\.com|verificat\.cat/.test(u))) error("bulos", i, e, "falta el enlace al verificador");
});
const VEREDICTOS = ["cumplida", "medias", "no", "tramite", "curso", "sin"];
if (existe("programas")) leer("programas").forEach((e, i) => {
  e.t = e.promesa;
  comunes("programas", i, e);
  for (const k of ["p", "ambito", "programa", "gobierno", "promesa", "hecho", "explicacion"]) if (!e[k]) error("programas", i, e, `falta ${k}`);
  if (!PARTIDOS.includes(e.p)) error("programas", i, e, `partido desconocido: ${e.p}`);
  if (!VEREDICTOS.includes(e.veredicto)) error("programas", i, e, `veredicto desconocido: ${e.veredicto}`);
});

const SECTORES = ["General", "Sanidad", "Educación", "Vivienda", "Pensiones"];
if (existe("huelgas")) leer("huelgas").forEach((e, i) => {
  comunes("huelgas", i, e);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d) || e.d < INICIO_PERIODO) error("huelgas", i, e, `fecha inválida o anterior al periodo: ${e.d}`);
  for (const k of ["dl", "sector", "ambito", "t", "convoca", "piden", "oficial", "segconv", "gobierno", "final"]) if (!e[k]) error("huelgas", i, e, `falta ${k}`);
  if (!SECTORES.includes(e.sector)) error("huelgas", i, e, `sector desconocido: ${e.sector}`);
});

if (avisos.length) console.warn(avisos.join("\n") + `\n${avisos.length} avisos: buscar otra fuente del mismo hecho\n`);
if (errores.length) {
  console.error(errores.join("\n"));
  console.error(`\n${errores.length} errores`);
  process.exit(1);
}
console.log("Datos válidos");
