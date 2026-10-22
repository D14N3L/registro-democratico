# Cómo contribuir

Gracias por querer mejorar el registro. Lo que más vale es una **corrección con fuente**: si algo está mal, se arregla.

## Antes de nada: el criterio

Toda contribución sigue las mismas reglas, sea del partido que sea:

1. **El mismo rasero para todos.** Si propones un tipo de caso (por ejemplo, comisiones de investigación vetadas), lo ideal es buscarlo también en parlamentos gobernados por otros partidos.
2. **Solo hechos con fuente**, y la fuente leída entera, no solo el titular. Nada de cifras, fechas ni votos redondeados o de memoria.
3. **Fuentes por orden de preferencia**: oficiales (BOE, tribunales, parlamentos, ministerios, Tribunal de Cuentas), después agencias (EFE, Europa Press) y después medios de distintas líneas editoriales.
   - **Excluidos como fuente**: OKDiario y El Debate. El motivo es objetivo: una condena firme por información falsa, o dos o más resoluciones en contra de la FAPE por veracidad en cinco años. Pueden ser objeto de una entrada, pero no su fuente.
   - **Con cautela**: los medios de la lista `DOMINIOS_CAUTELA` de `scripts/validar.js`. Si una entrada solo se apoya en uno de ellos, añade otra fuente del mismo hecho.
4. **El periodo es 2016–2026.** Entra lo que pasó en esos años, o una resolución de esos años sobre hechos anteriores.
5. **El matiz es obligatorio**: argumentos de la parte señalada, votos particulares, recursos pendientes y lo que no está confirmado.
6. **Los votos no se deducen.** Si la fuente no dice cómo votó cada grupo, se pone «sin desglosar» (`sd`).
7. **Presunción de inocencia.** Lo que está en investigación se marca como tal. No se atribuye a una persona lo que se condenó a otra o a una empresa.
8. **Sin adjetivos ni conclusiones.** Ni «escándalo», ni «mafia», ni «miente». Se cuenta qué pasó, con fecha y cifra; el lector juzga.
9. **Bulos**: solo entran declaraciones de cargos públicos o cuentas oficiales de partido que un verificador de la red europea EFCSN (Maldita.es, Newtral, EFE Verifica, Verificat) califica literalmente de «falso» o «bulo». «Engañoso» o «verdad a medias» no bastan. Otros verificadores que no son de la EFCSN, como VerificaRTVE, se pueden añadir como fuente adicional, pero no sustituyen a uno de los cuatro.
10. **Con palabras propias**: no se copian párrafos de las noticias.
11. **No es lo mismo un hecho antidemocrático que una mala gestión.** Las decisiones de política pública van en «Gestión pública y derechos», y se dice que son decisiones políticas.

## Cómo proponer algo

- **Corregir un error**: abre un *issue* con la plantilla «Corregir un error». Indica qué entrada, qué está mal y la fuente que lo demuestra.
- **Proponer un caso nuevo**: abre un *issue* con la plantilla «Proponer un caso», con el hecho, la fecha y las fuentes.
- **Pull request**: si ya sabes qué cambiar, edita el JSON correspondiente y después:

```bash
node scripts/validar.js
node scripts/generar-fuentes.js
```

`validar.js` tiene que terminar con «Datos válidos». Los avisos de «solo una fuente con cautela» piden una segunda fuente. Explica en el *pull request* qué cambias y por qué.

Las propuestas que no se pueden confirmar no se descartan: se quedan pendientes hasta que haya fuente.

## Formato de los datos

### `datos/fichas.json`

```jsonc
{
  "d": "2025-11-13",             // fecha ISO para ordenar
  "dl": "nov 2025 – sep 2026",   // fecha tal como se muestra
  "t": "Título descriptivo; si es de un parlamento, delante: «Parlamento de Galicia: …»",
  "p": ["PP", "Vox"],            // partidos implicados
  "c": "Control parlamentario",  // categoría
  "a": "Andalucía",              // parlamento o territorio; "" si no aplica
  "pr": "med",                   // nivel de prueba
  "s": "Qué pasó, con cifras y fechas.",
  "n": "Matiz.",
  "src": [["Medio: descripción", "https://…"]]
}
```

- **Partidos** (`p`): `PSOE`, `PP`, `Vox`, `Podemos/UP`, `Sumar`, `Cs`, `ERC`, `Junts`, `Bildu`, `PNV`, `CC`, `Otros`. Las federaciones van con su partido (PSC → PSOE). Los partidos regionales o pequeños van en `Otros`.
- **Categorías** (`c`): `Control parlamentario`, `Independencia de instituciones`, `Incumplimiento de leyes y sentencias`, `Derechos fundamentales y control judicial`, `Medios públicos y propaganda`, `Financiación y corrupción`, `Gestión pública y derechos`.
- **Nivel de prueba** (`pr`): `firme` (sentencia firme), `tc` (Tribunal Constitucional), `org` (organismo oficial), `jud` (resolución judicial no firme), `inv` (investigación judicial abierta), `med` (documentado en medios, incluidas votaciones parlamentarias). Ante la duda, el más bajo.
- **Ámbito** (`a`): `Congreso`, `Senado` o el nombre de la comunidad autónoma.

### `datos/votaciones.json`

```jsonc
{ "id": "vivienda", "m": "Ley de vivienda", "dl": "27 abr 2023", "r": "Aprobada 176 a 167",
  "v": { "PSOE": "si", "PP": "no" },   // si, no, ab (abstención), sd (sin dato o sin escaño)
  "s": "Qué decía la medida.", "n": "Contexto y argumentos.", "src": [["…", "…"]] }
```

«Sí» significa a favor de que la medida saliera adelante: quien vota un veto o una enmienda a la totalidad cuenta como «no». Los votos se cuentan con los datos abiertos del Congreso y tienen que cuadrar con el total. El fichero va en orden cronológico ascendente.

### `datos/iniciativas.json`

```jsonc
{ "d": "2024-04-09", "a": "Congreso", "m": "Nombre de la iniciativa",
  "res": "bloq",        // rech, bloq, apro, tram, deneg, otro
  "f": "Firmas", "pr": "Promotores", "v": "Votación por partidos",
  "p": ["…"],           // quienes la frenaron o votaron en contra
  "s": "Qué pasó.", "n": "Matiz.", "src": [["…", "…"]] }
```

### `datos/mayorias.json`

```jsonc
{ "d": "2023-12-22", "a": "Madrid", "g": "PP",   // fecha, cámara, partido con mayoría absoluta
  "ley": "Ley 16/2023, de …", "tema": "Instituciones y control",
  "tram": ["lectura única"],   // solo si la fuente lo justifica
  "ap": "solo",                // unan, pacto, socio, solo, sd
  "voto": "Cómo votó cada grupo, con la fuente", "s": "Qué cambia",
  "rec": "Recursos y sentencias, o ''", "n": "Matiz", "src": [["…", "…"]] }
```

### Series de «Cómo nos ha ido»

Las series de `datos/bienestar/series/` se guardan tal como las publica el organismo, con su URL y la fecha de consulta. No se editan a mano: si un dato cambia, se vuelve a descargar. Después se ejecuta `node scripts/generar-bienestar.js`.

## Licencia de las contribuciones

Al contribuir aceptas que tu aportación se publique con las mismas licencias del proyecto: MIT para el código y CC BY 4.0 para los datos y textos (ver `LICENSE` y `LICENSE-DATOS.md`).
