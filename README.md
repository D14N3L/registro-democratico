# Registro Democrático 2016–2026

Registro de hechos documentados sobre cómo nos ha ido en España entre 2016 y 2026: cómo funcionan los contrapesos del Estado de derecho (comisiones de investigación vetadas, sentencias, incumplimientos de leyes, uso de los medios públicos, financiación de partidos), qué votó cada partido en sanidad, educación, vivienda, luz y gas, dependencia, pensiones y Presupuestos, e iniciativas ciudadanas.

## Criterio

- **Mismo rasero para todos los partidos.** Se busca activamente en todos los parlamentos y gobiernos, de todos los colores.
- **Solo hechos con fuente.** Cada ficha indica su nivel de prueba: sentencia firme, Tribunal Constitucional, organismo oficial, resolución judicial no firme, investigación judicial o documentado en medios.
- **Cada ficha incluye el matiz**: los argumentos de quien es señalado, votos particulares, recursos pendientes o lo que no está confirmado.
- **Sin rankings ni conclusiones.** La página permite filtrar por partido, parlamento, categoría y nivel de prueba para que cada lector saque las suyas.
- **Fuentes.** Se priorizan fuentes oficiales (BOE, tribunales, parlamentos, ministerios), agencias (EFE, Europa Press) y medios de distintas líneas editoriales. No se usan OKDiario ni The Objective como fuente.
- Lo marcado como investigación judicial está sin juzgar y rige la presunción de inocencia.

## Estructura

| Fichero | Qué contiene |
|---|---|
| `index.html` | La página. No tiene dependencias ni paso de compilación. |
| `datos/fichas.json` | Fichas del registro. |
| `datos/votaciones.json` | Votaciones del Congreso por partido. |
| `datos/iniciativas.json` | Iniciativas Legislativas Populares y consultas. |
| `FUENTES.md` | Todas las fichas con sus fuentes, generado desde los JSON. |
| `PENDIENTES.md` | Casos descartados o sin confirmar y lo que falta por revisar. |
| `scripts/generar-fuentes.js` | Regenera `FUENTES.md`. |

### Formato de una ficha (`datos/fichas.json`)

```jsonc
{
  "d": "2025-11-13",            // fecha para ordenar (AAAA-MM-DD)
  "dl": "nov 2025 – sep 2026",  // fecha tal como se muestra
  "t": "Título de la ficha",
  "p": ["PP", "Vox"],           // partidos implicados
  "c": "Control parlamentario", // categoría
  "a": "Andalucía",             // parlamento o territorio (opcional)
  "pr": "med",                  // nivel de prueba: firme, tc, org, jud, inv, med
  "s": "Qué pasó, con datos.",
  "n": "Matiz: argumentos de la otra parte, lo no confirmado.",
  "src": [["Medio: titular", "https://..."]]
}
```

## Cómo proponer cambios

1. Abre un *issue* o un *pull request* modificando el JSON correspondiente.
2. Incluye al menos una fuente fiable que se pueda leer.
3. Si corriges una ficha existente, explica qué cambia y por qué.
4. Ejecuta `node scripts/generar-fuentes.js` para actualizar `FUENTES.md`.

## Ver en local

La página carga los JSON con `fetch`, así que necesita servirse por HTTP:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```
