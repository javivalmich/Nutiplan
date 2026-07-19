# R-B2-0 — Versionado: decidibilidad de la superficie pública de producción de engine2

- **Estado del repo en el que se ejecutó la lectura:** `main @ af52914`
- **Fecha de ejecución:** 2026-07-19
- **Objeto examinado:** `docs/evidence/protocolo-evaluacion/R-1-objeto-producido-por-motor.md`, tal como quedó fijado en `af52914`.

---

## Pregunta

¿El R-1 versionado contiene criterios suficientes para decidir cuál es la superficie pública de producción de engine2, o únicamente describe las superficies candidatas?

## Conclusión

R-1 agota su mandato en la descripción de las tres superficies candidatas y no establece una regla de resolución entre ellas.

## Evidencia de agotamiento

La descripción de la última superficie (`materializePlan()`) termina en `R-1-objeto-producido-por-motor.md:59`. La cola del documento, líneas [60,69], contiene exactamente dos secciones, ninguna prescriptiva:

- `Ambigüedades abiertas` [60,64] — declarativa: registra hechos de construcción sin calificarlos ni resolverlos.
- `Cierre` [68] — autodeclara la no resolución: *"se describen las tres sin resolver cuál constituye 'el' objeto producido por el motor."*

El único candidato a criterio embebido en el texto —la coincidencia de `materializePlan()` con el contrato de shape (`R-1-objeto-producido-por-motor.md:62`)— está expresamente desactivado como criterio por el propio documento: *"hecho de nombres, sin valorar equivalencia semántica."*

## Descarte de precondición externa

`DECISIONS.md:2335` (D-048, punto 3) encomendó la definición formal del objeto a este mismo R-1 — mandato delegado aquí, no remitido a otro sitio. `docs/evidence/protocolo-evaluacion/R-B1-representacion-consumida-evaluacion.md` es el disparador que motivó este reconocimiento, no una fuente de regla de decisión. Por lo anterior, el vacío encontrado no es un criterio pendiente de leer en otro documento, sino un mandato de definición no ejecutado dentro del propio R-1.

## Sellado

Las tres descripciones de superficie en R-1 son declarativas; solo `materializePlan()` coincide con el contrato de shape, y esa coincidencia queda expresamente desactivada como criterio en `R-1-objeto-producido-por-motor.md:62`.

---

**Alcance de este artefacto.** Registra el hallazgo de la lectura de decidibilidad ya realizada sobre R-1. No propone criterios, no elige ni compara superficies, no recomienda un siguiente paso.
