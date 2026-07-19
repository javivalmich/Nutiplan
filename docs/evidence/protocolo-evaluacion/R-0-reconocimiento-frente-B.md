# R-0 — Reconocimiento fundacional del Frente B

**HEAD de reconocimiento:** `c41558e`
**Instrumento:** lectura estática estricta sobre documentos versionados, sin ejecución de motores
**Fecha:** 2026-07-19

Re-derivación desde fuentes primarias versionadas del repositorio. Responde: ¿por qué el
Frente B empezó donde empezó? Corpus: raíces `DECISIONS.md` D-047, D-048 y
`docs/spec/protocolo-evaluacion.md` §6/§6.1, alcanzable solo por referencia normativa
explícita desde esas raíces. No cita R-A9 ni D-058.

---

## Cuerpo fundacional

### (a) Diseño experimental abierto

**Enunciado.** El diseño experimental del Frente B queda abierto en el momento fundacional:
las dos lecturas de D-045 ("distinción deliberada de legacy" / "repetición más realista del
mismo fenómeno") se reclasifican como familias de diseño experimental — no como tesis
alternativas — y su elección, junto con la forma del experimento (comparación A/B, evaluación
ciega tipo Turing, ranking, preferencia u otras), queda pendiente de una decisión posterior
sobre el diseño del protocolo.

**Cita.** `DECISIONS.md:2336` (D-048, punto 4): *"Diseño experimental: abierto. Las dos
lecturas de D-045 (...) se reclasifican: no son tesis alternativas, sino familias de diseño
experimental para contrastar la tesis del punto 1. Su elección pertenece al diseño del
protocolo, posterior a esta entrada, junto con la forma del experimento (comparación A/B,
evaluación ciega tipo Turing, ranking, preferencia u otras)."*

**Consecuencia sobre la instanciación del cegado.** El diseño experimental permanece abierto;
por tanto, desde las fuentes primarias no puede determinarse todavía si la instanciación del
cegado dependerá de esa elección.

### (b) Vehículo de observación inexistente / trabajo previsible del frente

**Enunciado.** En el momento fundacional no existía ningún artefacto observable por un juez
humano que representara un plan de engine2. La construcción de ese vehículo de observación es,
en consecuencia, trabajo previsible del Frente B, subordinado a lo que R-1 estableciera sobre
el objeto de evaluación.

**Cita.** `DECISIONS.md:2346` (D-048, "Consecuencias provisionales para el trabajo del Frente
B"): *"El reconocimiento previo (R-0 del Frente B) constató que no existe hoy ningún artefacto
observable por un juez humano que represente un plan de engine2; la construcción de un
vehículo de observación es, en consecuencia, trabajo previsible del frente, subordinado a lo
que R-1 establezca sobre el objeto."*

**Consecuencia sobre la instanciación del cegado.** Sí: sin vehículo de observación no existe
superficie sobre la que aplicar cegado. La construcción del vehículo es antecedente necesario
de cualquier instanciación del cegado.

### Suficiencia de C v1 y su proyección heredada al Frente B; F1/F2/F3 como candidatas a versiones futuras de C

**Enunciado.** C v1 —el contrato mínimo de hechos demostrados compartidos entre legacy y
engine2— quedó congelado con el único alcance que el reconocimiento pudo demostrar: la unidad
temporal de la semana (14 posiciones). La suficiencia de C v1 para soportar el protocolo de
evaluación no se decidió en ese frente previo y queda heredada explícitamente al Frente B. F1
(verdura), F2 (proteína) y F3 (hidrato) conservan su identidad contractual como candidatas a
versiones futuras de C, si un reconocimiento posterior demuestra que el terreno común se ha
ampliado.

**Citas.**
- `DECISIONS.md:2270-2271` (D-047, "Consecuencia (gobernanza)"): *"C v1 queda congelada con
  ese alcance. La suficiencia de C v1 para soportar el protocolo de evaluación NO forma parte
  de este frente y queda heredada explícitamente al Frente B."*
- `DECISIONS.md:2296-2297` (D-047, "Identidades preservadas (principio 8)"): *"F1, F2 y F3
  conservan su identidad contractual como candidatas a versiones futuras de C, si un
  reconocimiento posterior demuestra que el terreno común se ha ampliado (...)"*
- `DECISIONS.md:2319-2320` (D-047, "Herencia a Frente B"): *"Dado que el único hecho
  compartido es el andamiaje temporal, el Frente B hereda la pregunta: ¿sobre qué evalúa el
  juez la tesis de humanización? B no puede "añadir F1"; solo puede "construir un terreno
  común nuevo que justifique F1"."*

**Consecuencia sobre la instanciación del cegado.** El texto fuente no vincula esta herencia
con la instanciación del cegado; no se afirma consecuencia sobre ese punto.

### (d) Frontera contenido/origen sin trazar

**Enunciado.** Existe un principio normativo —no una clasificación concreta— de que hay una
frontera entre contenido y origen: el protocolo no debe introducir información ajena al
contenido evaluado que permita inferir el productor de un plan, y la representación proyectada
no debe permitir inferir el motor de origen por rasgos ajenos al contenido (formato, orden de
claves, convenciones de nombrado u otros artefactos de serialización) — con la salvedad
explícita de que los rasgos del propio contenido no son materia de esa obligación. Qué rasgos
concretos caen a cada lado de esa frontera queda sin trazar por ninguna de las dos normas
citadas.

**Citas.**
- `docs/spec/protocolo-evaluacion.md:53` (§6, punto 1, dentro de "Propiedades del cegado"):
  *"El protocolo no deberá introducir información ajena al contenido evaluado que permita
  inferir el productor de un plan."*
- `docs/spec/plan-observable.md:82` (§5.5, "Neutralidad de origen"): *"La representación
  proyectada no deberá permitir inferir el motor de origen por rasgos ajenos al contenido del
  plan (formato, orden de claves, convenciones de nombrado u otros artefactos de
  serialización). Los rasgos del propio contenido no son materia de esta obligación."*

**Consecuencia sobre la instanciación del cegado.** Sí, directa: §6 del protocolo de
evaluación se titula "Propiedades del cegado" y su punto 1 (línea 53) es la norma que rige
directamente esa instanciación. La clasificación operativa de qué rasgos cuentan como
"contenido" frente a "origen" queda, no obstante, pendiente en ambas fuentes.

---

## Alcance del reconocimiento (perímetro negativo)

- **Fuera de alcance del fundamento:** la relación entre C v1 y su proyección hacia el Frente
  B como comparación retrospectiva. Motivo: requiere lectura comparada posterior entre
  documentos ratificados en fechas distintas; no es re-derivable como dependencia primaria.
- **Fuera de alcance del fundamento:** la enumeración concreta de posibles fugas de origen
  (`decisionLog`, `weekScore`, `weekWarnings`, etc.). Motivo: el principio normativo está en
  las fuentes citadas en (d); la enumeración concreta procede de síntesis posterior, ajena al
  corpus primario.
- **Antecedente histórico:** D-048 (`DECISIONS.md:2346`) referencia un "R-0 del Frente B" sin
  artefacto versionado propio. Este reconocimiento no lo reconstruye ni deriva afirmaciones de
  él; lo cita únicamente como fuente primaria de la afirmación (b).

Criterio de inclusión: este reconocimiento contiene únicamente afirmaciones que pueden volver
a derivarse mediante lectura directa de fuentes primarias versionadas del repositorio. Las
síntesis, comparaciones retrospectivas y reconocimientos históricos no versionados se
identifican expresamente como antecedentes o quedan fuera del fundamento.
