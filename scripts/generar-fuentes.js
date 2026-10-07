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

fs.writeFileSync(path.join(raiz, "FUENTES.md"), o);
console.log(`FUENTES.md: ${fichas.length} fichas, ${votaciones.length} votaciones, ${iniciativas.length} iniciativas, ${mayorias.length} normas de mayorías absolutas`);
