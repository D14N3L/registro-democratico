// Genera datos/bienestar.json a partir de las series oficiales de datos/bienestar/series
// y de la lista de indicadores de datos/bienestar/indicadores.json (escrita a mano).
// Uso: node scripts/generar-bienestar.js
// No calcula ni interpola nada: solo elige series, renombra ámbitos y ordena.
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "datos");
const indicadores = JSON.parse(fs.readFileSync(path.join(dir, "bienestar", "indicadores.json"), "utf8"));
const DESDE = 2016;

const NOMBRES = {
  "Total España": "España", "Total SNS": "España", ES: "España",
  EU27_2020: "UE-27",
  "Total sector Comunidades Autónomas": "Media de las comunidades",
  "Ceuta (INGESA)": "Ceuta", "Melilla (INGESA)": "Melilla",
  "Andalucía (2016-2017, cómputo anterior)": "Andalucía (hasta 2017)",
  "Andalucía (2018-, cómputo nuevo)": "Andalucía (desde 2018)",
};
const PRIMERO = ["España", "UE-27", "Media de las comunidades"];

// Primera URL que aparezca: la página índice si la hay; si no, el fichero descargado.
function primera(x) {
  if (typeof x === "string") return x;
  if (x && typeof x === "object") for (const v of Object.values(x)) { const u = primera(v); if (u) return u; }
  return "";
}
function urlDe(s) {
  return primera(s.url_pagina_indice) || primera(s.url_web) || primera(s.url_pagina) || primera(s.url) || primera(s.urls);
}
function fuenteDe(s) {
  if (typeof s.fuente === "string") return s.fuente;
  if (s.fuente && typeof s.fuente === "object") return [s.fuente.organismo, s.fuente.tabla].filter(Boolean).join(". ");
  return "";
}

const salida = indicadores.map((ind) => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, "bienestar", "series", ind.serie), "utf8"));
  let datos = s.valores;
  for (const k of ind.ruta || []) datos = datos[k];
  if (ind.claves) datos = Object.fromEntries(Object.entries(ind.claves).map(([amb, clave]) => [amb, s.valores[clave]]));
  if (ind.ue) datos = { ...datos, "UE-27": s[ind.ue] };
  const re = ind.periodos ? new RegExp(ind.periodos) : null;
  const filas = {};
  for (const [ambito, serie] of Object.entries(datos)) {
    if (!serie || typeof serie !== "object") continue;
    const nombre = NOMBRES[ambito] || ambito;
    const v = {};
    for (const [p, x] of Object.entries(serie)) {
      if (re && !re.test(p)) continue;
      const anio = parseInt(p, 10);
      if (!(anio >= DESDE) || x === null || x === "" || typeof x !== "number") continue;
      v[re ? p.replace(re, "") : p] = x;
    }
    if (Object.keys(v).length) filas[nombre] = v;
  }
  const periodos = [...new Set(Object.values(filas).flatMap((v) => Object.keys(v)))].sort();
  const orden = Object.keys(filas).sort((a, b) => {
    const ia = PRIMERO.indexOf(a), ib = PRIMERO.indexOf(b);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return a.localeCompare(b, "es");
  });
  const fuente = fuenteDe(s);
  return {
    id: ind.id, pilar: ind.pilar, nombre: ind.nombre, unidad: ind.unidad, mide: ind.mide, aviso: ind.aviso,
    fuente, url: urlDe(s), consulta: s.fecha_consulta || "",
    periodos, filas: orden.map((a) => ({ ambito: a, valores: periodos.map((p) => (p in filas[a] ? filas[a][p] : null)) })),
  };
});

// Quién gobernaba cada comunidad a 31 de diciembre de cada año (o hoy, en el año en curso).
const gob = JSON.parse(fs.readFileSync(path.join(dir, "bienestar", "gobiernos.json"), "utf8"));
const corto = (x) => x.replace("Podemos/UP", "Podemos").replace(/^Otros \(exdiputad[oa]s? de (\w+)\)$/, "ex-$1")
  .replace(/^Otros \(no adscrito, expulsado de (\w+)\)$/, "ex-$1").replace(/^Otros \((.*)\)$/, "$1");
function etiqueta(p) {
  if (/155/.test(p.presidente)) return "155 (Gobierno de Rajoy)";
  return [p.partido_presidente, ...(p.socios_gobierno || [])].map(corto).join("+") + (p.en_funciones ? " (en funciones)" : "");
}
const hoy = new Date().toISOString().slice(0, 10);
const gobiernos = {};
for (const [ccaa, periodos] of Object.entries(gob)) {
  gobiernos[ccaa] = {};
  for (let a = DESDE; a <= Number(hoy.slice(0, 4)); a++) {
    const fecha = `${a}-12-31` < hoy ? `${a}-12-31` : hoy;
    const p = periodos.find((x) => x.desde <= fecha && (!x.hasta || x.hasta > fecha));
    if (p) gobiernos[ccaa][a] = etiqueta(p);
  }
}

fs.writeFileSync(path.join(dir, "bienestar.json"), JSON.stringify({ indicadores: salida, gobiernos }, null, 1) + "\n");
console.log(`bienestar.json: ${salida.length} indicadores, gobiernos de ${Object.keys(gobiernos).length} territorios`);
for (const i of salida) if (!i.filas.length || !i.url) console.log(`  revisar ${i.id}: ${i.filas.length} filas, url «${i.url}»`);
