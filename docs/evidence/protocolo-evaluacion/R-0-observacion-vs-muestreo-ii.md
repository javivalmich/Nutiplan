# R-0 — Observación vs. muestreo: alcance autónomo de la suficiencia de C v1 (ii)

**Ancla:** `e810531`
**Naturaleza:** Reconocimiento. Demuestra estructura documental; no decide, no resuelve, no ordena.
**Alcance:** `docs/spec/protocolo-evaluacion.md` §2/§4/§5/§6; `docs/spec/plan-observable.md` §2/§4/§5/§6; y las líneas de `DECISIONS.md` que caracterizan la relación C v1↔objeto.

## 1. Objeto de partida

"C v1" designa un único objeto congelado: la unidad base temporal — la semana como 14 posiciones (7 días × {comida, cena}) (`DECISIONS.md:2261`). Quedaron explícitamente fuera de v1 los factores de composición F1/F2/F3 y la identidad de plato (`DECISIONS.md:2276-2294`, síntesis en `:2268`). Con ese alcance, C v1 quedó congelada y su suficiencia para soportar el protocolo de evaluación heredada como cuestión pendiente (`DECISIONS.md:2271`).

## 2. Dos unidades distintas en el protocolo

`docs/spec/protocolo-evaluacion.md` §2 fija dos unidades que no coinciden:

- **Unidad de observación:** el día, definido como cada elemento de la colección `days`, con delegación explícita al contrato del objeto en `docs/spec/plan-observable.md` §4.2.1 (`protocolo-evaluacion.md:24` → `plan-observable.md:49`). Esta unidad enruta por el objeto.
- **Unidad de muestreo:** la semana, con semilla propia por iteración (`protocolo-evaluacion.md:23`). Coincide con la estructura que C v1 formaliza (`DECISIONS.md:2261`) y no invoca el contrato de `days`.

El protocolo *observa* sobre el objeto pero *muestrea* sobre la semana. Esa separación es el eje de lo que sigue.

## 3. Mapeo de cláusulas operativas

Clasificación de cada cláusula operativa del protocolo según si su satisfacción enruta por el contrato del objeto (`plan-observable.md` §4.2) o se resuelve al nivel de la semana:

| Cláusula | Cita | ¿Enruta por el objeto? | Requiere C v1↔objeto |
|---|---|---|---|
| §4 Admisibilidad | `protocolo-evaluacion.md:38` | No — registro de conformidad del motor | No |
| §5.1–§5.4 (determinismo, doble ancla, commit, cifras) | `:42`–`:45` | No — forma evidencial | No |
| §5.5 Semillas | `:46` | No — nivel semana (§2, `:23`) | No |
| §5.6 Tamaño de muestra (N) | `:47` | No — cuenta iteraciones semanales | No |
| §5.7 PRNG | `:48` | No — mecanismo neutro | No |
| §5.8 Nivel de agregación | `:49` | No — nivel semana (§2, `:25`) | No |
| §6.1 No-filtración del productor | `:53` | Sí — contenido evaluado = objeto | Sí |
| §6.2–§6.3 (transformación común, auditable) | `:54`–`:55` | No — procedimiento de cegado | No |

Las cláusulas de muestreo se enuncian en forma negativa deliberada: se afirma que **no enrutan por el contrato del objeto**, no que engranen la descomposición interna de C v1.

- **§5.6 (tamaño de muestra N)** es el caso limpio: N cuenta iteraciones semanales (`:47`, ligado a `:23`), sin invocar `days`. No requiere la relación C v1↔objeto.
- **§5.5 (semillas)** y **§5.8 (nivel de agregación)** operan al nivel semana declarado en §2 (`:46`, `:49`, remitiendo a `:23`/`:25`); se satisfacen sin enrutar por el contrato del objeto. No requieren la relación C v1↔objeto.
- **§6.1 (no-filtración del productor)** opera sobre el contenido evaluado, que el corpus resuelve como el objeto (`DECISIONS.md:3279`). Juzgar si C v1 basta para blindar la identidad del productor exige saber qué campos del objeto exceden a C v1; eso remite a la relación C v1↔objeto. Mediada por esa relación.

## 4. Consecuencia descriptiva

La suficiencia de C v1 para el protocolo (ii) no es homogénea:

- Un **eje de muestreo/reproducibilidad** cuya evaluación no enruta por el contrato del objeto y, por tanto, no requiere la relación C v1↔objeto. Al menos §5.6 lo sostiene de forma limpia.
- Un **eje de cegado** (§6.1) cuya evaluación sí remite al contrato del objeto y, por tanto, a la relación C v1↔objeto.

Este artefacto establece esa partición del terreno. No decide si (ii) debe escindirse formalmente en dos sub-cuestiones ni en qué orden trabajarlas: eso es un acto normativo posterior. (ii) y su relación con la definición contractual del objeto permanecen abiertas conforme a `DECISIONS.md:3283`.

## 5. Discrepancia registrada (deuda de desambiguación viva)

La relación entre C v1 y el objeto recibe dos caracterizaciones no coincidentes en el corpus:

- `DECISIONS.md:2610` (D-058) la fija como relación entre C v1 y la **proyección** (`plan-observable.md` §2, `:31`) — entidad definida como la transformación del plan observable a la representación que consume la evaluación; computada desde el objeto en §5.1 (`plan-observable.md:74`) pero distinta de él.
- `DECISIONS.md:2685` (D-061) y `DECISIONS.md:3263` (D-072) la fijan como relación entre C v1 y la **definición contractual del objeto** (`plan-observable.md` §2/§4).

Proyección y objeto son entidades distintas en `plan-observable.md`. Este artefacto registra la divergencia como deuda de desambiguación pendiente; no la resuelve ni determina cuál caracterización es canónica. La divergencia no afecta al eje de muestreo del §4 (que no invoca ninguna de las dos), pero sí a la caracterización precisa del eje mediado del §6.1.

## Cierre

Este reconocimiento establece que el protocolo separa unidad de observación (el objeto) de unidad de muestreo (la semana); que la suficiencia de C v1 tiene un eje autónomo respecto de la relación C v1↔objeto, sostenido por las cláusulas de muestreo/reproducibilidad; y que su eje de cegado queda mediado por esa relación. Registra además una divergencia no resuelta en la caracterización de dicha relación. Agota su mandato en esa descripción: no decide la partición de (ii), no resuelve la relación C v1↔objeto, no fija orden alguno.
