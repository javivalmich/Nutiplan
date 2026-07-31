# R-0 — Reconocimiento de la forma de cierre de (ii)

Instrumento: lectura directa del repo vivo, read-only, salida cruda.
HEAD de lectura: 2c3346f6e1e55d357ab30b650d6448794c3c4d9a
Fecha: 2026-07-31
Tipo de acto: reconocimiento (read-only, descriptivo). No normativo.
Corrección de artefacto: reemplaza un borrador previo (`docs/evidence/R-0-reconocimiento-cierre-ii.md`)
redactado sobre perímetro incompleto (saltaba D-076) y sin exhibir crudo. Ese borrador se elimina
en el mismo acto que produce este artefacto.

## §0 — Pregunta única

¿El corpus vivo en `2c3346f` dispone la forma de cierre de (ii) como conjunto, o solo dispone
ii-auto (D-077) e ii-med (D-080) por separado?

## §1 — Perímetro de lectura declarado

- `DECISIONS.md`: asientos D-075 a D-080 íntegros (`:3313` a `:3446`), más cabecera de cada uno
  para confirmar continuidad. Archivo completo: 3448 líneas (`Get-Content` `.Count` = 3448).
  D-080 es el último marcador de asiento; no hay asiento posterior en el archivo.
- `docs/spec/protocolo-evaluacion.md`: volcado íntegro (55 líneas leídas de §0 a §6), en
  particular §2 Definiciones (`:19-28`) y §0 Principio rector (`:11`).

Todo enunciado negativo de este documento se acota a este perímetro. «No dispuesto» significa
«el corpus, dentro de este perímetro, no lo fija», no «no existe en absoluto».

## §2 — Exhibits (evidencia literal, número de línea + contenido)

**Exhibit A — Perímetro de asientos, íntegro.**
`## D-075` (`:3313`), `## D-076` (`:3334`), `## D-077` (`:3348`), `## D-078` (`:3358`),
`## D-079` (`:3386`), `## D-080` (`:3406`). Archivo termina en `:3448`. D-080 es el asiento
más reciente sobre (ii); no hay asiento posterior que lo suceda.

**Exhibit B — D-076 es asiento de rama, no de agregación.**
D-076 (`:3334-3347`) constituye ii-auto: fija su pregunta propia (Decisión 1, `:3338-3342`)
y su extensión normativa mínima (Decisión 2, `:3344`). Su propio alcance lo declara
expresamente (`:3346`):

> "**Alcance.** Este asiento constituye la pregunta propia y fija la extensión mínima (§5.6).
> No resuelve el contenido sustantivo de evaluación de ii-auto (acto resolutivo, futuro) ni el
> estatus de ii-auto como frente operativo vs. sub-cuestión (acto de estatus, futuro)."

No hay en D-076 enunciado alguno sobre (ii) como conjunto: opera enteramente dentro de la
sub-cuestión ii-auto.

**Exhibit C — D-080 deja (ii) abierta y localiza el cierre pendiente en Fork B.**
Literal, `:3436`:

> "**Cierre de ii-med.** Con la Decisión 1 y la Decisión 2, ii-med queda resuelto en su plano
> estructural: el conjunto de campos del objeto §4 que exceden a C v1 queda dispuesto
> normativamente. (ii) NO queda cerrada: la disposición de (ii) post-D-077 (Fork B — si (ii)
> cierra sobre ii-med en solitario o exige disposición propia de la no-decidibilidad de ii-auto
> sellada en D-077) permanece en cola, aguas abajo de este asiento."

Literal, `:3444`:

> "**Estado.** ii-med: resuelto en el plano estructural. Conjunto de exceso dispuesto. Plano de
> cegado: fuera de alcance, acto propio pendiente. (ii): abierta, pendiente de Fork B."

**Exhibit D — `protocolo-evaluacion.md` no aporta cláusula de agregación de obligación compuesta.**
Hits de "agregaci" en el documento: `:25` y `:49`.

- `:25` — "**Nivel de agregación de la métrica**: el nivel de observación sobre el que opera una
  métrica (comida, día, semana u otro). Una métrica no tiene un nivel privilegiado; tiene un
  nivel declarado." — definición de granularidad de métrica, plano distinto al de cierre de
  una obligación compuesta como (ii).
- `:49` — "**Nivel de agregación.** Toda métrica deberá declarar explícitamente el nivel de
  agregación sobre el que opera, conforme a la definición de §2." — obligación de
  reproducibilidad (§5.8), mismo plano de granularidad que `:25`.
- `:11` — principio rector del documento (propiedades verificables del proceso de evaluación),
  genérico; no formula ni implica una regla de cierre para sub-cuestiones partidas.
- `:28` — "**Protocolo ciego**: el protocolo de evaluación que satisface las propiedades de §6."
  — definición de un término distinto ("protocolo ciego"), no de cierre de obligación compuesta.

Ninguno de los cuatro hits define cuándo cierra una obligación compuesta partida en
sub-cuestiones. Ausencia documentada dentro del perímetro leído, no inferida por extrapolación.

## §3 — Clasificación: Outcome B

**1. Lo dispuesto por el corpus.** D-080 deja (ii) abierta (`:3436`, `:3444`), identifica el
locus del cierre pendiente (Fork B, en cola) y formula la disyuntiva que ese cierre deberá
adjudicar: si (ii) cierra sobre ii-med en solitario, o si exige además una disposición propia
de la no-decidibilidad de ii-auto sellada en D-077. Este es un diferimiento positivo: no es
silencio, es una disyuntiva ya planteada en el corpus vigente.

**2. Lo no dispuesto por el corpus.** No existe, dentro del perímetro leído, adjudicación de
esa disyuntiva. Ningún asiento entre D-075 y D-080 la resuelve — ni hay asiento posterior
(Exhibit A: D-080 es el último). `protocolo-evaluacion.md` no aporta cláusula de agregación
aplicable al cierre de una obligación compuesta (Exhibit D).

**3. Lo que este reconocimiento no decide.** Si la adjudicación futura de Fork B será
constitutiva (crea el cierre de (ii)) o meramente declarativa de un cierre ya implícito en el
diferimiento de D-080. Esa cuestión queda fuera de alcance de este R-0.

## §4 — Cláusula de cierre

El R-0 demuestra; el asiento decide. Este reconocimiento constata el estado del corpus; no
abre Fork B ni presume su naturaleza.
