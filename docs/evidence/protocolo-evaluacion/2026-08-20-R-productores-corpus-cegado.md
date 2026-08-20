# R-0 — Reconocimiento tecnico: productores y corpus del cegado

Naturaleza: reconocimiento tecnico read-only, descriptivo y falsable.
No disena, no clasifica, no evalua conformidad. Exhibe estado real.
Procedencia: hechos exhibidos por canal Code; sellados [V] contra terminal por Javi
en el acto de creacion de este artefacto.

## Ancla
Ref declarada: b41e826 (cotejada en terminal).
SHA completo: b41e8264eed16ef8e4d9cf91b38e1f8820da2529
Merge: 81c3f31 ad25fae — "Merge branch docs/asiento-d083-frontera-cegado"

## Perimetro declarado ex ante (set de localizacion congelado)
Corpus: protocolo-evaluacion.md §6 y §6.1-§6.3; D-083; plan-observable.md §4.
Codigo (semilla, NO afirmacion de completitud): buildPlan.js, materializePlan.js,
  contract.js, schema.js, planReader.js.
Regla de expansion: solo referencias literales de import/export a un salto.
Ausencia de un elemento de la semilla = "no localizado", no sustitucion por equivalente.

## Resolucion de rutas por manifiesto
Las specs no estan en raiz; viven bajo docs/spec/:
  docs/spec/protocolo-evaluacion.md
  docs/spec/plan-observable.md

## Hallazgos

### H1 — Existencia de productores
  src/engine/buildPlan.js                     presente
  src/engine2/materializePlan.js              presente
  src/engine2/tests/materializePlan.test.js   presente

### H2 — Existencial negativo escopado
Term-set congelado: cegado, ciego, cegar, blind, neutraliz, strip, redact, mask, anon,
  sanitiz, occlud, oculta.
Perimetro: los cinco ficheros .js de la semilla.
Comando: git grep -ni -E "<term-set>" b41e826 -- src/engine/buildPlan.js
  src/engine2/materializePlan.js src/engine2/memory/contract.js
  src/engine2/dishes/schema.js src/eval/planReader.js
Resultado: exactamente DOS coincidencias en codigo, ambas en src/engine/buildPlan.js.
  Se conservan verbatim:
    b41e826:src/engine/buildPlan.js:45:  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));
    b41e826:src/engine/buildPlan.js:332:  // Render a P1_TEMPLATES entry: substitute {P}/{S}, strip sauce clause when no sauce
  Cero coincidencias en: materializePlan.js, contract.js, schema.js, planReader.js.
Alcance: "no localizado dentro del perimetro declarado, bajo el term-set congelado,
  @ b41e826." NO es una ausencia global. Corrobora —sin elevar— la declaracion
  repo-wide de D-058 (DECISIONS.md:2609).
Nota: coincidencias del term-set existen fuera de este perimetro (en DECISIONS.md y
  docs/spec/*.md); se registran unicamente como resultado de localizacion, sin
  incorporar su contenido a este hallazgo.

### H3 — Corpus (citado por rango; no duplicado, para evitar deriva)
  D-083 verbatim:         DECISIONS.md:3553-3589
  plan-observable.md §4:  docs/spec/plan-observable.md:42-68
    Claves §4.1: days, strategy, weekWarnings, weekProblems, weekScore,
    decisionLog (opcional). §4.7 deja fuera del contrato campos instrumentales/depuracion.

### H4 — Topologia import/export a un salto (aristas literales; cuerpos NO leidos)
Lectura de aristas (solo lo que la salida anterior exhibe literalmente):
  materializePlan.js importa literalmente: ./skeleton/buildWeekArc.js, ./walk/runWalk.js,
    ./skeleton/days.js, ./dishes/schema.js
    (buildWeekArc, runWalk, days NO estaban en la semilla; afloran por import literal a
     un salto; no perseguidos mas alla del salto)
  buildPlan.js importa ./nutrition.js, ./hash.js, ./rng.js, ../seasonalFoods.js;
    exporta WEEKLY_CAP, deriveTempFeel, buildPlan.
  contract.js exporta getWeek, saveWeek, getRepertoire, recordFeedback.
  schema.js exporta MOMENTOS, TEMP_FEELS, ENERGIA_COCINA_NIVELES, LEFTOVER_QUALITIES,
    ROLES, PLATE_TYPES, REQUIRED_FIELDS, DishSchemaError, validateDish.
  planReader.js exporta isLegibleMeal, getMainMeals, collectLegibleMainMeals.

## Limites del reconocimiento (perimetro declarado NO entregado)
protocolo-evaluacion.md §6 item 1 (:53) — dentro del perimetro corpus, NO exhibido
verbatim por este canal. El grep lexico surfacea :51 (encabezado §6), :54 (item 2),
:55 (item 3), :57 (Nota); NO surfacea :52, :53, :56. La clausula de no-inferencia del
productor carece de marcador del term-set. Cierre asignado al acto A.

## Registros (datos, no derivaciones)
- El localizador lexico es insuficiente para §6.1 :53: la sustancia de la clausula de
  no-inferencia no contiene vocabulario del term-set (demostrado por H2 + Limites).
- Nomenclatura: "C-alfa" no figura en el verbatim sellado de D-083; no es cita de corpus.

## Prohibicion observada
Este R-0 exhibe y enumera. No clasifica rasgos como contenido/ajeno ni conforme/no
conforme, no extrae los campos emitidos por los productores, no propone arquitectura de
cegado, no recomienda, no evalua §6.1-§6.3. Aplicar la frontera de D-083 a casos
concretos es acto posterior y separado.
