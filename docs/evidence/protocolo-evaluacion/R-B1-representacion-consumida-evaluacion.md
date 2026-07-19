# R-B1 — Reconocimiento (solo lectura): representación consumida durante la evaluación

- **Estado del repo en el que se ejecutó:** `main @ 65e9483`
- **Fecha de ejecución:** 2026-07-19
- **Nota terminológica:** la expresión "juez de Fase 7" usada en la pregunta de la R es un alias conversacional, no un término del corpus; el inventario de términos literales está en la sección (c) del reporte.

---

## R-B1 — Reconocimiento (solo lectura)

**Precondición.** `git log -1` → `main @ 65e9483`. Cumplida.

**Paso 0 — cita del corpus.** `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md:8-10`: *"Corpus: raíces `DECISIONS.md` D-047, D-048 y `docs/spec/protocolo-evaluacion.md` §6/§6.1, alcanzable solo por referencia normativa explícita desde esas raíces. No cita R-A9 ni D-058."*

---

### Mapa

| Hallazgo | Evidencia (archivo:línea) | Estado observado |
|---|---|---|
| Definición explícita del objeto consumido por el juez | — | ausente. Ningún documento del corpus formula el enunciado "el juez de Fase 7 consume X". |
| Objeto de evaluación fijado (distinto de lo anterior) | `DECISIONS.md:2335` (D-048, punto 3): *"Objeto de evaluación. El plan generado por el motor. (...) Toda representación que se construya para hacer el plan observable por un juez humano es un vehículo de observación, no el objeto evaluado; deberá ser proyección fiel del plan (...)"* | presente, pero niega expresamente que lo observable por el juez sea el objeto evaluado |
| Forma observable del objeto | `DECISIONS.md:2335` (D-048, punto 3): *"La definición formal de ese objeto en cada motor no forma parte de esta decisión y queda encomendada al reconocimiento R-1 del Frente B."* | remitida fuera del corpus (a R-1, no citado por D-047/D-048/§6) |
| Vehículo de observación (lo que efectivamente vería un juez) | `DECISIONS.md:2346` (D-048, "Consecuencias provisionales"): *"no existe hoy ningún artefacto observable por un juez humano que represente un plan de engine2; la construcción de un vehículo de observación es, en consecuencia, trabajo previsible del frente"* | ausente en el momento fundacional; declarado trabajo pendiente |
| §6/§6.1 como fuente del objeto o del referente "juez" | `docs/spec/protocolo-evaluacion.md:51-58` (§6 completo) | §6 no usa el término "juez" ni nombra objeto alguno. Regula solo propiedades del procedimiento de cegado (puntos 1-3) y remite su instanciación concreta a fuera de alcance normativo (línea 57, con cruce interno a §1.2) |
| Vínculo textual entre "juez" y "Fase 7" | — | ausente. Ningún documento del corpus une ambos términos en el mismo enunciado. "Juez" aparece solo en D-047/D-048; "Fase 7" aparece solo en §6 (nota normativa, línea 57), en un enunciado sobre plazos de instanciación del cegado, no sobre objeto consumido |
| Dependencias declaradas | `DECISIONS.md:2346`; `docs/spec/protocolo-evaluacion.md:57`: *"Su primera instanciación deberá registrarse como evidencia versionada antes de que se realice ninguna evaluación de la Fase 7."* | la instanciación del cegado (que afectaría a lo que el juez vería) es procedimental abierta, condicionada a evidencia futura, sin fecha ni artefacto presente en el corpus |
| Ambigüedades abiertas | `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md:9` cita "§6/§6.1"; `docs/spec/protocolo-evaluacion.md:51-58` | no existe una sección rotulada "§6.1" en el documento — solo "§6" con puntos internos 1-3 sin numeración jerárquica propia. La cita del corpus a "§6.1" no resuelve a un encabezado identificable |

---

**(a) Cita que fija el corpus:** `docs/evidence/protocolo-evaluacion/R-0-reconocimiento-frente-B.md:8-10`.

**(b) Cadenas de expansión seguidas:**
- Origen: `DECISIONS.md:2330` (D-048, Contexto) → cita: *"CLAUDE.md:6 describe el proceso del motor y el mecanismo de migración ('evaluación ciega') sin definir qué se mide"* → destino abierto: `CLAUDE.md:6`. Verificado: `CLAUDE.md:6` describe proceso del motor y migración por patrón estrangulador; no define qué se mide ni menciona "juez" ni objeto consumido.
- Cruce interno (no expansión a otro documento): `docs/spec/protocolo-evaluacion.md:57` remite a `§1.2` del mismo documento (`docs/spec/protocolo-evaluacion.md:16`, punto 2b: *"implementación concreta de ningún instrumento de medición o evaluador"* — fuera del alcance normativo del documento).

**(c) Inventario de términos para el referente:**
- "el juez": `DECISIONS.md:2320` (D-047, herencia); `DECISIONS.md:2330` (D-048, Contexto, cita a 2320).
- "juez humano": `DECISIONS.md:2335` (D-048, punto 3); `DECISIONS.md:2344` (D-048, consecuencias); `DECISIONS.md:2346` (D-048, consecuencias).
- "evaluador": `docs/spec/protocolo-evaluacion.md:16` (§1, punto 2b) — dentro de "instrumento de medición o evaluador", explícitamente fuera del alcance normativo del documento.
- "Fase 7": `docs/spec/protocolo-evaluacion.md:57` (§6, nota normativa) — único uso en el corpus.

Ningún documento del corpus unifica estos referentes.

---

**Cierre.** La pregunta única admite respuesta: no existe, en el corpus citado, una definición del objeto que consume "el juez de Fase 7". El corpus afirma un objeto de evaluación ("el plan generado por el motor", D-048 punto 3), niega explícitamente que ese objeto sea lo que el juez observa directamente, y remite tanto la forma de lo observable como la instanciación del cegado a trabajo fuera de este corpus.
