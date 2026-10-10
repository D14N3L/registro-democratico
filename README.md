# Registro Democrático 2016–2026

Registro de hechos documentados sobre cómo nos ha ido en España entre 2016 y 2026. Recoge cómo han funcionado los contrapesos del Estado de derecho: comisiones de investigación vetadas, sentencias, incumplimientos de leyes, uso de los medios públicos y financiación de partidos. Recoge también qué votó cada partido en sanidad, educación, vivienda, luz y gas, dependencia, pensiones y Presupuestos, y en qué acabaron las iniciativas ciudadanas. Cada dato lleva su fuente. El registro no saca conclusiones: las saca quien lo lee.

**Web:** https://registro-democratico.pages.dev/

¿Has visto un error? [Abre una corrección](../../issues/new?template=correccion.md) con la fuente que lo demuestra y se revisa.

## Qué hay en la web

| Pestaña | Qué recoge | Datos |
|---|---|---|
| Registro | Hechos sobre el Estado de derecho y la gestión pública, en 7 categorías y con su nivel de prueba | `datos/fichas.json` |
| Qué votó cada partido | Votaciones del Congreso, contadas diputado a diputado con los datos abiertos del Congreso | `datos/votaciones.json` |
| Mayorías absolutas | Leyes, decretos-ley y otras actuaciones aprobadas en cámaras donde un solo partido tenía mayoría absoluta | `datos/mayorias.json` |
| Bulos | Bulos de cargos públicos y cuentas oficiales de partido, calificados de «falso» o «bulo» por un verificador | `datos/bulos.json` |
| Programas | Promesas electorales y si se cumplieron, con su fuente | `datos/programas.json` |
| Iniciativas ciudadanas | Iniciativas legislativas populares y consultas, y qué pasó con ellas | `datos/iniciativas.json` |
| Cómo nos ha ido | Series oficiales de sanidad, educación, dependencia, vivienda, pobreza y energía, impuestos y gasto, y pensiones, más la lista de huelgas y manifestaciones | `datos/bienestar.json`, `datos/huelgas.json` |

## Criterio

- **El mismo rasero para todos los partidos.** Cada tipo de caso se busca activamente en todos los parlamentos y gobiernos, de todos los colores. Que un partido tenga más entradas no es un juicio: puede haber gobernado más sitios o más años.
- **Solo hechos con fuente**, leída entera y no solo el titular. Lo que no se puede confirmar no entra.
- **Nivel de prueba.** Cada ficha dice de qué tipo es su prueba: sentencia firme, Tribunal Constitucional, organismo oficial, resolución judicial no firme, investigación judicial abierta o hecho documentado en medios.
- **Cada entrada lleva su matiz**: los argumentos de la parte señalada, los votos particulares, los recursos pendientes y lo que no está confirmado.
- **Los votos nunca se deducen de los escaños.** Si la fuente no desglosa el voto por grupos, se indica «sin desglosar».
- **Presunción de inocencia.** Lo que está en investigación judicial está sin juzgar, y así se dice.
- **Sin rankings, adjetivos ni conclusiones.** La página permite filtrar por partido, parlamento, categoría y nivel de prueba.
- **Fuentes.** Primero las oficiales (BOE, tribunales, parlamentos, ministerios, Tribunal de Cuentas), después las agencias (EFE, Europa Press) y medios de distintas líneas editoriales. Un medio queda **excluido** si tiene una condena firme por información falsa o dos o más resoluciones en contra de la Comisión de Arbitraje, Quejas y Deontología de la FAPE por veracidad en cinco años; hoy son OKDiario y El Debate. Los medios con un caso suelto se usan con cautela: si una entrada solo se apoya en uno de ellos, se busca otra fuente del mismo hecho. El criterio es el mismo para todas las líneas editoriales y está en `scripts/validar.js`.

## Estructura

| Fichero | Qué contiene |
|---|---|
| `index.html` | Toda la página: HTML, CSS y JS sin dependencias ni paso de compilación. Carga los JSON con `fetch`. |
| `datos/*.json` | Los datos de cada pestaña (ver la tabla de arriba). |
| `datos/bienestar/series/` | Series oficiales tal como se descargaron, con fuente, URL y fecha de consulta. No se editan a mano. |
| `datos/bienestar/indicadores.json` | Qué series se muestran, con qué nombre, qué miden y sus avisos. |
| `FUENTES.md` | Todas las entradas con sus fuentes. Se genera desde los JSON. |
| `scripts/validar.js` | Comprueba el esquema, las listas cerradas, las fechas y el criterio de fuentes. |
| `scripts/generar-fuentes.js` | Regenera `FUENTES.md`. |
| `scripts/generar-bienestar.js` | Regenera `datos/bienestar.json` desde las series. No calcula ni interpola: solo elige, renombra y ordena. |
| `scripts/preparar-publicacion.js` | Crea `publicar/` con lo que se sirve en la web. |
| `scripts/pdf_to_text.py` | Herramienta auxiliar para pasar a texto PDF oficiales (diarios de sesiones, sentencias) y poder buscar en ellos. |

El formato de cada fichero y cómo contribuir están en [CONTRIBUTING.md](CONTRIBUTING.md).

## Ver en local

La página carga los JSON con `fetch`, así que hay que servirla por HTTP:

```bash
python3 -m http.server 8000
```

Después abre http://localhost:8000.

## Licencia

- **Código** (`index.html` como programa y `scripts/`): [MIT](LICENSE).
- **Datos y textos** (`datos/`, `FUENTES.md` y los textos de la página): [CC BY 4.0](LICENSE-DATOS.md). Puedes reutilizarlos citando el registro.
- Las noticias y documentos enlazados son de sus autores. Los datos oficiales se rigen por sus propias condiciones de reutilización.
