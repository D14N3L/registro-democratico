// Genera FUENTES.md a partir de los datos en datos/*.json.
// Uso: node scripts/generar-fuentes.js
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const leer = (f) => JSON.parse(fs.readFileSync(path.join(raiz, "datos", f), "utf8"));
const fichas = leer("fichas.json");
const votaciones = leer("votaciones.json");
const iniciativas = leer("iniciativas.json");

const NIVEL = {
  firme: "Sentencia firme",
  tc: "Tribunal Constitucional",
  org: "Organismo oficial",
  jud: "Resolución judicial no firme",
  inv: "Investigación judicial",
  med: "Documentado en medios",
};
const VOTO = { si: "Sí", no: "No", ab: "Abst.", sd: "s/d" };
const PARTIDOS_VOTO = ["PSOE", "UP / Sumar", "PP", "Vox", "Cs", "ERC", "Junts", "Bildu", "PNV"];
const RESULTADO = { rech: "Rechazada", bloq: "Bloqueada", apro: "Aprobada", tram: "En trámite", deneg: "Consulta denegada", otro: "Otros" };
const fuentes = (src) => src.map(([t, u]) => `  - [${t}](${u})`).join("\n");

let o = `# Registro Democrático 2016–2026: fichas y fuentes

Documento generado automáticamente desde \`datos/\`. No lo edites a mano: cambia los JSON y ejecuta \`node scripts/generar-fuentes.js\`.

## Fichas del registro (${fichas.length})

`;
for (const e of [...fichas].sort((a, b) => a.d.localeCompare(b.d))) {
  o += `### ${e.t}
- Fecha: ${e.dl}
- Partidos: ${e.p.join(", ")}
- Categoría: ${e.c}${e.a ? `\n- Parlamento o territorio: ${e.a}` : ""}
- Nivel de prueba: ${NIVEL[e.pr]}
- Resumen: ${e.s}
- Matiz: ${e.n}
- Fuentes:
${fuentes(e.src)}

`;
}

o += `## Qué votó cada partido (${votaciones.length})

"Sí" = a favor de que la medida saliera adelante. s/d = sin dato verificado.

`;
for (const m of votaciones) {
  o += `### ${m.m}
- Fecha: ${m.dl}
- Resultado: ${m.r}
- Votos: ${PARTIDOS_VOTO.map((p) => `${p} ${VOTO[m.v[p] || "sd"]}`).join(" · ")}
- Qué decía: ${m.s}
- Contexto: ${m.n}
- Fuentes:
${fuentes(m.src)}

`;
}

o += `## Iniciativas ciudadanas (${iniciativas.length})

`;
for (const i of [...iniciativas].sort((a, b) => b.d.localeCompare(a.d))) {
  o += `### ${i.m}
- Parlamento: ${i.a}
- Resultado: ${RESULTADO[i.res]}
- Firmas: ${i.f}
- Promotores: ${i.pr}
- Votación: ${i.v}
- Partidos que la frenaron o votaron en contra: ${i.p.join(", ") || "—"}
- Qué pasó: ${i.s}${i.n ? `\n- Matiz: ${i.n}` : ""}
- Fuentes:
${fuentes(i.src)}

`;
}

const mayorias = leer("mayorias.json");
const APOYO = { unan: "Sin votos en contra", pacto: "Con el principal partido de la oposición", socio: "Con otros grupos", solo: "Solo el partido con mayoría", sd: "Voto sin desglosar" };
o += `## Mayorías absolutas (${mayorias.length})

`;
for (const m of [...mayorias].sort((a, b) => b.d.localeCompare(a.d))) {
  o += `### ${m.ley}
- Fecha: ${m.d}
- Cámara: ${m.a} · Mayoría absoluta: ${m.g}
- Tema: ${m.tema}
- Tramitación: ${(m.tram || []).join(", ") || "ordinaria o sin dato"}
- Apoyos: ${APOYO[m.ap]}
- Votación: ${m.voto}
- Qué cambia: ${m.s}${m.rec ? `\n- Tribunales y recursos: ${m.rec}` : ""}
- Matiz: ${m.n}
- Fuentes:
${fuentes(m.src)}

`;
}

// Secciones opcionales: solo si existe el fichero, igual que las pestañas de la web.
const opcional = (f) => (fs.existsSync(path.join(raiz, "datos", f)) ? leer(f) : []);
const bulos = opcional("bulos.json");
if (bulos.length) {
  o += `## Bulos (${bulos.length})

`;
  for (const b of [...bulos].sort((a, c) => c.d.localeCompare(a.d))) {
    o += `### ${b.quien} (${b.cargo}): ${b.dicho}
- Fecha: ${b.dl || b.d}
- Partido: ${b.p.join(", ")}
- Canal: ${b.canal} · Tema: ${b.tema}
- Qué dicen los datos: ${b.datos}
- ${b.verif}: ${b.calif}${b.rect ? `\n- Matiz: ${b.rect}` : ""}
- Fuentes:
${fuentes(b.src)}

`;
  }
}

const huelgas = opcional("huelgas.json");
if (huelgas.length) {
  o += `## Huelgas y movilizaciones (${huelgas.length})

`;
  for (const h of [...huelgas].sort((a, c) => c.d.localeCompare(a.d))) {
    o += `### ${h.t} (${h.ambito})
- Fecha: ${h.dl} · Sector: ${h.sector}
- Convocan: ${h.convoca}
- Qué pedían: ${h.piden}
- Cifra oficial: ${h.oficial}
- Según quien convoca: ${h.segconv}
- Quién gobernaba: ${h.gobierno}
- En qué acabó: ${h.final}
- Fuentes:
${fuentes(h.src)}

`;
  }
}

const programas = opcional("programas.json");
const VEREDICTO = { cumplida: "Cumplida", medias: "A medias", no: "No cumplida", tramite: "En trámite", curso: "En curso", sin: "Sin promesa" };
if (programas.length) {
  o += `## Programas (${programas.length} promesas)

`;
  for (const e of programas) {
    o += `### ${e.p} · ${e.ambito} · ${e.area}: ${e.programa}
- Promesa: ${e.promesa}${e.cita ? `\n- Cita: «${e.cita}»` : ""}
- Quién gobernaba: ${e.gobierno}
- Qué se hizo: ${e.hecho}
- Veredicto: ${VEREDICTO[e.veredicto]}. ${e.explicacion}
- Fuentes:
${fuentes(e.src)}

`;
  }
}

fs.writeFileSync(path.join(raiz, "FUENTES.md"), o);
console.log(`FUENTES.md: ${fichas.length} fichas, ${votaciones.length} votaciones, ${iniciativas.length} iniciativas, ${mayorias.length} normas de mayorías absolutas, ${bulos.length} bulos, ${huelgas.length} huelgas, ${programas.length} promesas`);
