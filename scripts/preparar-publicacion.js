// Prepara la carpeta publicar/ con solo lo que va a la web (sin scripts, PENDIENTES ni series en bruto).
// Uso: node scripts/preparar-publicacion.js   y después sube publicar/ a Cloudflare Pages.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const destino = path.join(raiz, "publicar");
const ficheros = [
  "index.html",
  "FUENTES.md",
  "datos/fichas.json",
  "datos/votaciones.json",
  "datos/iniciativas.json",
  "datos/bienestar.json",
  "datos/mayorias.json",
];

// Pestañas opcionales: se publican solo si existen (si no, la página las oculta).
for (const f of ["datos/bulos.json", "datos/programas.json"]) if (fs.existsSync(path.join(raiz, f))) ficheros.push(f);

fs.rmSync(destino, { recursive: true, force: true });
for (const f of ficheros) {
  const origen = path.join(raiz, f);
  if (!fs.existsSync(origen)) throw new Error("Falta " + f);
  fs.mkdirSync(path.dirname(path.join(destino, f)), { recursive: true });
  fs.copyFileSync(origen, path.join(destino, f));
}

// Cabeceras para Cloudflare Pages: los datos se revisan cada 5 minutos para que no se vea una versión vieja.
fs.writeFileSync(path.join(destino, "_headers"), [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "/datos/*",
  "  Cache-Control: public, max-age=300",
  "/FUENTES.md",
  "  Content-Type: text/plain; charset=utf-8",
  "",
].join("\n"));

console.log("publicar/ lista: " + ficheros.length + " ficheros y _headers");
