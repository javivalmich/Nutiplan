# R-0 — Reconocimiento del perímetro factual de ii-med

Instrumento: lectura directa del repo vivo (cmd `findstr`, read-only), salida cruda.
HEAD de lectura: 61b8e3c1c0e538ca5c91c1fde1666ab5a7b493e6
Fecha: 2026-07-30
Tipo de acto: reconocimiento (read-only, descriptivo). No normativo.
Origen normativo del objeto: ii-med (D-075 `DECISIONS.md:3325`), desbloqueado por D-079 `DECISIONS.md:3396`.

## §0 — Objeto

Demostrar el perímetro factual sobre el que ii-med decidirá, exhibiendo el
contrato del objeto, la definición efectiva de C v1 y el literal vigente del
requisito de cegado, sin pronunciarse todavía sobre si C v1 satisface dicho
requisito. La calificación de la diferencia observable como (in)suficiente para
el cegado es acto normativo de ii-med, ajeno a este reconocimiento.

## §1 — Perímetro de lectura declarado

- `docs/spec/plan-observable.md`: volcado íntegro, 120 líneas / 13.335 bytes.
- `docs/spec/protocolo-evaluacion.md`: volcado íntegro, 72 líneas / 10.272 bytes.
- `DECISIONS.md`: únicamente las líneas devueltas por los patrones `C v1`,
  `14 posiciones`, `posiciones`, `representaci`. No se leyó el archivo completo.

Todo enunciado negativo de este documento se acota a este perímetro. «No
localizado» significa «el corpus no lo identifica dentro de [este perímetro]»,
no «no existe».

## §2 — Exhibits

**Exhibit A — Definición efectiva de C v1.**
C v1 = «la semana como 14 posiciones (7 días × {comida, cena})»
(`DECISIONS.md:2261`). Congelada con ese alcance y solo ese: la suficiencia de
C v1 para soportar el protocolo se hereda explícitamente a Frente B y no forma
parte del frente que la congela (`DECISIONS.md:2271`). El alcance excluye
composición y toda candidata que introdujera interpretación (`:2279`, `:2284`,
`:2289`, `:2294`).

**Exhibit B — Contrato del objeto (claves obligatorias).**
`days`, `strategy`, `weekWarnings`, `weekProblems`, `weekScore`, y opcional
`decisionLog` (`plan-observable.md:46`, §4.1). Desarrollo estructural en
§4.2–§4.6 (`:48-66`).

**Exhibit C — Solape C v1 ↔ contrato.**
Coinciden únicamente en el andamiaje temporal: colección de unidades temporales
en orden estable y ranuras de comida por unidad (`plan-observable.md:49-52`,
§4.2.1–§4.2.4). Es exactamente lo que C v1 fija (Exhibit A).

**Exhibit D — Campos del contrato que exceden C v1.**
El contrato exige, y C v1 no acarrea:
- composición / identidad de plato (`plan-observable.md:53`, §4.2.5) — excluida
  de C v1 por D-047 (`DECISIONS.md:2294`);
- `strategy` (`:55`, §4.3);
- `weekWarnings` / `weekProblems` (`:57-59`, §4.4);
- `weekScore` (`:61`, §4.5);
- `decisionLog`, opcional (`:63-66`, §4.6).

**Exhibit E — Requisito de cegado (contenido).**
Localizado en `protocolo-evaluacion.md` §6 «Propiedades del cegado»
(cabecera `:51`). Obligación operativa: el protocolo «no deberá introducir
información ajena al contenido evaluado que permita inferir el productor de un
plan» (`:53`). Complementos: transformación común a todos los motores (`:54`),
reproducible y auditable (`:55`); nota normativa sobre instanciación como
evidencia versionada antes de Fase 7 (`:57`).

**Exhibit F — Fantasma de etiqueta «§6.1 del protocolo».**
La etiqueta «§6.1» NO se identifica como literal en `protocolo-evaluacion.md`
dentro del perímetro leído (volcado íntegro, 72 líneas). El documento estructura
sus secciones como `## §N — Título` con ítems numerados; el cegado es §6, ítem 1
(`:53`), no «§6.1». La única «§6.1» literal en los dos specs está en
`plan-observable.md:88` y designa «No adición» (fidelidad de proyección) —otro
requisito, otro documento, significado distinto—. Se preserva la distinción:
contenido del requisito de cegado, identificado (`protocolo-evaluacion.md:53`);
etiqueta «§6.1 del protocolo», no identificada en el protocolo; homónimo «§6.1»,
identificado en `plan-observable.md:88` con significado distinto.

## §3 — Diferencia observable (descriptiva, sin veredicto)

Conjunto acarreado por C v1 (Exhibit A) ∩ contrato del objeto (Exhibit B) =
andamiaje temporal (Exhibit C).
Contrato del objeto ∖ C v1 = {composición/identidad de plato, `strategy`,
`weekWarnings`, `weekProblems`, `weekScore`, `decisionLog`} (Exhibit D).

Este documento exhibe la diferencia de conjuntos. No la califica.

## §4 — Resultado terminal

El reconocimiento demuestra que C v1 coincide con el contrato del objeto
únicamente en el andamiaje temporal y que el contrato exige campos adicionales
no presentes en C v1; asimismo, demuestra que el requisito de cegado está
localizado en `protocolo-evaluacion.md:53` y que la etiqueta «§6.1 del
protocolo» no aparece literalmente en ese documento.

## §5 — Lo que este reconocimiento NO hace

- No decide si la ausencia en C v1 de los campos adicionales satisface la
  obligación de no inferencia del productor (`protocolo-evaluacion.md:53`). Esa
  es la pregunta normativa de ii-med.
- No retira la etiqueta fantasma «§6.1 del protocolo». La regla de citación
  («citar `protocolo-evaluacion.md:53` o “§6, ítem 1”, no “§6.1 del protocolo”»)
  pertenece al asiento de ii-med, primer acto que cita el cegado de forma
  normativa.
- No adjudica en qué lado de la distinción objeto/proyección cae C v1 (residual
  dispuesto negativamente por D-079 `DECISIONS.md:3394`, no reabierto aquí).
