# Especificación normativa del protocolo de evaluación

Versión: 1.0 — ratificada por D-054
Estado: vigente.
Trazabilidad: toda versión de este documento se relacionará con el asiento de DECISIONS.md que la ratifique (§8), conforme al mecanismo heredado de `docs/spec/plan-observable.md` §8.3 (`docs/spec/plan-observable.md:118`).

## §0 — Género y principios del documento

Este documento pertenece al género de **especificación normativa** (`docs/spec/`), inaugurado por `docs/spec/plan-observable.md` (D-050, D-052). Es la segunda especificación de ese género y hereda su registro: establece obligaciones, no describe estados; todo enunciado normativo se formula en modo obligación ("deberá", "no deberá"); ningún enunciado se formula como descripción de comportamiento existente.

Principio rector: este documento especifica **propiedades verificables del proceso de evaluación comparativa de motores**. No especifica recetas de implementación, ni reconstruye prácticas de medición que no existan todavía en el repositorio. Una obligación de este documento es una propiedad que un protocolo de evaluación deberá satisfacer, no un procedimiento paso a paso de cómo satisfacerla.

## §1 — Alcance

1. Este documento deberá regular: (a) la admisibilidad de planes a evaluación comparativa; (b) la reproducibilidad del proceso de medición; (c) las propiedades del cegado; (d) la separación entre medición y decisión.
2. No deberá regular: (a) el proceso interno de generación de planes por ningún motor; (b) la implementación concreta de ningún instrumento de medición o evaluador; (c) el contrato del objeto de plan observable, materia exclusiva de `docs/spec/plan-observable.md`.
3. Este documento es "el protocolo de evaluación" cuya existencia anuncia `docs/spec/plan-observable.md`: *"El protocolo de evaluación que operará sobre este objeto será materia de norma propia"* (`docs/spec/plan-observable.md:13`); y *"el diseño del protocolo ciego de evaluación, que será objeto de norma propia"* (`docs/spec/plan-observable.md:21`, §1.2.b). Es también el "protocolo de evaluación vigente" al que `docs/spec/plan-observable.md` §4.2.1 delega la definición de las unidades temporales de `days`: *"`days` deberá ser una colección enumerable cuyos elementos representen, en orden estable, las unidades temporales definidas por el protocolo de evaluación vigente"* (`docs/spec/plan-observable.md:49`). §2 de este documento asume esa delegación.

## §2 — Definiciones

A efectos de este documento:

- **Unidad de muestreo**: la semana. Cada iteración del protocolo produce un plan semanal independiente a partir de una semilla propia.
- **Unidad de observación**: el día. Cada elemento de la colección `days` del plan observable (`docs/spec/plan-observable.md` §4.2, `docs/spec/plan-observable.md:49`). Esta definición completa, para efectos de este protocolo, la delegación que `docs/spec/plan-observable.md:49` (§4.2.1) hace al "protocolo de evaluación vigente".
- **Nivel de agregación de la métrica**: el nivel de observación sobre el que opera una métrica (comida, día, semana u otro). Una métrica no tiene un nivel privilegiado; tiene un nivel declarado.
- **Cifra citable**: resultado que cuenta con script versionado, artefacto declarativo y commit ancla.
- **Cifra fantasma**: resultado al que le falta alguno de los tres elementos anteriores.
- **Protocolo ciego**: el protocolo de evaluación que satisface las propiedades de §6.

## §3 — Relación con normas existentes

1. Este documento se apoya en `docs/spec/plan-observable.md` v1.0: dicha especificación norma el objeto evaluado — el plan observable (§4, `docs/spec/plan-observable.md:42-68`; §5, `docs/spec/plan-observable.md:70-82`; §6, `docs/spec/plan-observable.md:84-94`) —; este documento norma el proceso que evalúa ese objeto. No repite ni reinterpreta las obligaciones de esas secciones.
2. Este documento se apoya en el contrato mínimo de `CLAUDE.md:17-28` (Contrato de shape entre motores), en los mismos términos de prevalencia que establece `docs/spec/plan-observable.md` §3.2 (`docs/spec/plan-observable.md:37`): en caso de conflicto, prevalece `CLAUDE.md`.
3. Este documento hereda como precedente, sin reemplazarlo, el procedimiento de D-053 (`DECISIONS.md:2448-2457`): ubicación y forma de artefactos de verificación de conformidad en `docs/evidence/<nombre-spec>/` (F-V1), y doble ancla de hash (F-V2). D-053 rige la forma de los artefactos de verificación de conformidad exigidos por `docs/spec/plan-observable.md` §7.3 (`docs/spec/plan-observable.md:106`); este documento no modifica esa forma ni la extiende a los artefactos de medición propios de la evaluación comparativa: dichos artefactos quedan fuera del alcance de D-053; su forma no queda regulada por este documento (§1.2.b), sin perjuicio de las obligaciones de reproducibilidad que §5 les impone.

## §4 — Admisibilidad

Ningún plan podrá entrar en evaluación comparativa si su motor no se encuentra en posición verificable con verificación de conformidad registrada (`docs/spec/plan-observable.md` §7.5: *"Ningún plan podrá entrar en evaluación comparativa si su motor no se encuentra en posición verificable con verificación de conformidad registrada. La evaluación de planes no conformes queda fuera de protocolo."*, `docs/spec/plan-observable.md:110`). Esta obligación no introduce ninguna condición adicional a la ya establecida por §7.5 de la especificación madre; la transcribe desde el lado consumidor: este protocolo, como consumidor del plan observable, deberá verificar la posición de conformidad de un motor antes de admitir sus planes a evaluación.

## §5 — Obligaciones de reproducibilidad

1. **Self-check de determinismo bloqueante.** Antes de toda medición, el protocolo deberá ejecutar un self-check de determinismo: misma semilla, dos ejecuciones, comparación por igualdad. Si las dos ejecuciones difieren, la medición deberá abortarse.
2. **Doble ancla.** Toda cifra citable deberá contar con script versionado ejecutable por un tercero y con artefacto que declare el resultado exacto esperado.
3. **Ancla a commit.** Todo artefacto de evidencia deberá declarar el HEAD del repositorio sobre el que se realizó la medición.
4. **Admisibilidad de cifras.** Solo las cifras citables (§2) podrán entrar al protocolo de evaluación. Las cifras fantasma (§2) se retiran sin disputa.
5. **Semillas.** El rango de semillas deberá ser secuencial y contiguo, de orden conocido, con punto inicial declarado explícitamente en el artefacto o en el script. Este documento no prescribe una convención concreta de punto inicial.
6. **Tamaño de muestra.** El tamaño de muestra N deberá declararse explícitamente en el artefacto o en el script. N no deberá quedar implícito ni derivarse de otro valor.
7. **PRNG.** El generador de números pseudoaleatorios deberá ser determinista, con implementación identificada de forma inequívoca, e idéntica entre todos los objetos sometidos a una misma comparación. Este documento no prescribe una implementación concreta de PRNG.
8. **Nivel de agregación.** Toda métrica deberá declarar explícitamente el nivel de agregación sobre el que opera, conforme a la definición de §2.

## §6 — Propiedades del cegado

1. El protocolo no deberá introducir información ajena al contenido evaluado que permita inferir el productor de un plan.
2. Toda transformación destinada al cegado deberá ser común a todos los motores comparados.
3. El procedimiento de cegado deberá ser reproducible y auditable.

**Nota normativa.** La implementación concreta del cegado es materia procedimental abierta, fuera del alcance normativo de esta sección (§1.2). Su primera instanciación deberá registrarse como evidencia versionada antes de que se realice ninguna evaluación de la Fase 7.

## §7 — Separación medición/decisión

El instrumento de medición mide y registra veredictos; no compara motores ni prescribe acción. Los artefactos de medición deberán separar las no-conformidades u observaciones registradas de las candidatas a revisión de norma. La interpretación de una medición y la decisión que de ella se derive son actos posteriores y separados del acto de medir; este documento no regula esos actos posteriores.

## §8 — Estado y versionado

**§8.1 — Identidad y versión.** Este documento tiene identidad estable (`docs/spec/protocolo-evaluacion.md`) y versión explícita, heredando el mecanismo de `docs/spec/plan-observable.md` §8 (`docs/spec/plan-observable.md:112-120`). Estado: v1.0 — ratificada por D-054. Toda versión futura de este documento carecerá de fuerza normativa hasta su ratificación por asiento de DECISIONS.md, en los mismos términos que `docs/spec/plan-observable.md` §8.4 (`docs/spec/plan-observable.md:120`).

**§8.2 — Ciclo de modificación.** Toda modificación deberá ratificarse mediante asiento en DECISIONS.md que registre su causa, e incrementar la versión, conforme al mecanismo de `docs/spec/plan-observable.md` §8.2 (`docs/spec/plan-observable.md:116`).

**§8.3 — Candidatas a revisión registradas desde el nacimiento.**
1. La posible unificación futura del punto inicial del rango de semillas (0 vs. 1) queda registrada como candidata a revisión, hoy deliberadamente no normada (§5.5).

**Convenciones vigentes no exigidas por esta norma.** Las siguientes prácticas son convención de facto observable en el repositorio actual, no obligación de esta especificación: la forma concreta del artefacto de evidencia (encabezado HEAD/instrumento/fecha, secciones numeradas, tabla de veredictos — convención heredada por D-053/F-V1); la fecha en formato ISO; `mulberry32` como implementación concreta de PRNG; N como entero redondo; la nomenclatura de archivos con fecha en el nombre. Si esta especificación las menciona, es únicamente para señalar la práctica vigente, no para exigirla — el mismo precedente que fija la nota sobre la forma del documento en `docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` para la convención heredada de R-1.
