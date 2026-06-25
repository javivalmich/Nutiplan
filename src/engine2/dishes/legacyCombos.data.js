// ============================================================================
// SNAPSHOT NORMALIZADO DEL DATASET LEGACY.
// Paritario salvo colapso documentado de colisiones de identidad.
// Cada normalizacion lleva causa (ver banner de la normalizacion abajo y
// legacyCombos.normalizations.js, el decision log).
// Solo sincronizar si buildPlan.js cambia (re-extraer y re-evaluar colisiones).
// Regla 5 (CLAUDE.md): copia verificada, no modificacion del motor vivo
// (buildPlan.js NUNCA se edita desde aqui).
// ============================================================================
//
// Propiedad que debe preservarse: COMPORTAMIENTO OBSERVABLE identico al
// motor vivo (buildPlan.js) — NO igualdad literal byte a byte de sus
// arrays. La unica operacion de normalizacion permitida es: colapsar una
// colision de comboIdentityKey cuyos miembros difieren en algun campo,
// eligiendo el valor coherente con el resto del dataset. Prohibido bajo
// esta etiqueta: editar cualquier valor que NO este en colision de
// identidad, "mejorar" o reinterpretar un combo, o introducir campos
// nuevos (eso es anotacion editorial, otra capa, otro paso).
//
// Invariante de paridad real (src/engine2/dishes/tests/
// legacyCombos.normalization.test.js): re-extrae el literal VIVO de
// buildPlan.js (mismos marcadores de texto que el Control 2 de paridad),
// le aplica programaticamente las normalizaciones declaradas en
// legacyCombos.normalizations.js, y exige igualdad ESTRUCTURAL EXACTA con
// los exports de este archivo. Cualquier diferencia no cubierta por una
// normalizacion documentada hace fallar el test (entrada de mas o de
// menos, campo no documentado, valor distinto al declarado). Un hash
// SHA-256 de buildPlan.js o de los snapshots dorados NO sirve como
// invariante aqui: ese archivo no importa esta copia, asi que esos hashes
// son inmunes a cualquier cambio que se haga en ella — un guardian que
// nunca puede fallar no discrimina nada.
//
// Fase 2, Paso 0, Commit 2. Copia LITERAL de los arrays LUNCH_COMBOS,
// DINNER_COMBOS y TRAINING_DINNERS de src/engine/buildPlan.js, tomada
// ANTES de:
//   - .filter(...)            (vetos de dieta: noFish, noPork, noEgg, etc.)
//   - .map(...)                (Object.assign({slot}, m))
//   - cualquier transformacion posterior
//
// Fuente verificada linea a linea (ver informe Fase 2 / Paso 0):
//   LUNCH_COMBOS_RAW     <- buildPlan.js:705-827  (101 entradas, dentro de
//                           const LUNCH_COMBOS = [ ... ].filter(...).map(...))
//   DINNER_COMBOS_RAW    <- buildPlan.js:845-952  (81 entradas en el
//                           original; 80 aqui tras 1 normalizacion — ver
//                           NORMALIZACION #1 abajo)
//   TRAINING_DINNERS_RAW <- buildPlan.js:1150-1158 (3 entradas; el original
//                           NO tiene filter/map posterior, se usa el array
//                           directo via modulo de indice)
//
// NO incluye FREEFORM_COMBOS: ese pool ya vive en su propio modulo de datos
// (src/data/FREEFORM_COMBOS.js) y no se duplica aqui — referenciarlo desde
// alli si se necesita.
//
// Congelados con Object.freeze (proteccion de mutacion accidental a nivel
// de array; las entradas individuales son objetos literales nuevos, no
// referencias al array vivo de buildPlan.js).
//
// ── NORMALIZACION #1 (Fase 2, Paso B.1, correccion) ─────────────────────
// Colision de identidad detectada por el gate de colision (scripts/
// phaseB1/collisionGate.js): identityKey
//   ["caliente_clasico","cerdo",null,"brocoli",null,"mostaza_miel","plancha"]
// tenia 2 miembros literales en buildPlan.js:845-952 (lineas fuente 857 y
// 877), identicos en toda clave salvo density: "media" (linea 857) vs
// "baja" (linea 877).
// Causa de la eleccion ("baja"): el plateType de ambos es
// "plancha_verdura". Sobre el universo real de DINNER_COMBOS_RAW, ese
// plateType tiene density="baja" en 25/28 entradas (89%); "media" es la
// minoria (3/28, incluyendo precisamente este combo y "cerdo+pimientos").
// La otra entrada de cerdo en plancha_verdura sin colision (cerdo+acelgas,
// linea 908) ya es "baja", lo que descarta una regla implicita de
// "cerdo siempre media" como justificacion del valor minoritario. Se
// colapsa a un unico registro con density:"baja", coherente con el resto
// del dataset para este plateType. Ver decision log completo:
// legacyCombos.normalizations.js.

export const LUNCH_COMBOS_RAW = Object.freeze([
    // ── Clásicos familiares ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"brocoli",  S:"limon_hierbas",  cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"espinacas",S:"pimenton_ajo",   cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata",  V:"judias",   S:"provenzal",      cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:"boniato", V:"calabacin",S:"pimenton_ajo",   cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"patata",  V:"judias",   S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"arroz",   V:"pimientos",S:"pimenton_ajo",   cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"patata",  V:"espinacas",S:"romero_limon",   cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",   V:"pimientos",S:"ajillo",         cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"patata",  V:"zanahoria",S:"mostaza_miel",   cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"boniato", V:"calabacin",S:"romero_limon",   cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata",  V:"pimientos",S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    // ── Pescado ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",  C:"boniato", V:"espinacas",S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"salmon",  C:"quinoa",  V:"espinacas",S:"soja_jengibre",  cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"merluza", C:"patata",  V:"judias",   S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"bacalao", C:"patata",  V:"pimientos",S:"ajillo",         cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:"patata",  V:"brocoli",  S:"limon_hierbas",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"sardinas",C:"arroz",   V:"tomate",   S:"ajillo",         cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    // ── Pasta ────────────────────────────────────────────────────────────
    {tmpl:"pasta",             P:"pollo",  C:"pasta",   V:"tomate",   S:"tomate_casero",  cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta",             P:"atun",   C:"pasta",   V:"calabacin",S:"ajillo",         cookM:"crudo",    plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta",             P:"huevo",  C:"pasta",   V:null,       S:"ajillo",         cookM:"revuelto", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    // ── Legumbre ─────────────────────────────────────────────────────────
    {tmpl:"legumbre",          P:"lentejas",C:null,     V:"zanahoria",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"garbanzos",C:null,    V:"espinacas",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"alubias", C:null,     V:"pimientos",S:"ajillo",         cookM:"guisado",  plateType:"legumbre",          density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",          P:"garbanzos",C:null,    V:"brocoli",  S:"curry_ligero",   cookM:"salteado", plateType:"legumbre",          density:"baja",  familiar:false, facil:true},
    // ── Bowl / ensalada ─────────────────────────────────────────────────
    {tmpl:"bowl",              P:"pollo",  C:"quinoa",  V:"espinacas",S:"curry_ligero",   cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"bowl",              P:"pavo",   C:"quinoa",  V:"pimientos",S:"limon_hierbas",  cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"bowl",              P:"pollo",  C:"arroz",   V:"brocoli",  S:"soja_jengibre",  cookM:"salteado", plateType:"bowl",              density:"alta",  familiar:false, facil:false},
    {tmpl:"bowl",              P:"salmon", C:"quinoa",  V:"pepino",   S:"soja_jengibre",  cookM:"crudo",    plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"ensalada",          P:"pollo",  C:null,      V:"lechuga",  V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"atun",   C:null,      V:"lechuga",  V2:"tomate",S:"vinagreta",cookM:"crudo",  plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"gambas", C:null,      V:"lechuga",  V2:"pepino",S:"vinagreta",cookM:"plancha",plateType:"ensalada",  density:"baja",  familiar:true,  facil:true},
    // ── Marisco ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico",  P:"gambas", C:"arroz",   V:"calabacin",S:"ajillo",         cookM:"salteado", plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"calamares",C:"arroz", V:"pimientos",S:"ajillo",         cookM:"plancha",  plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:false},
    // ── Vida real: platos que no aparecen en apps fitness pero sí en cocinas ──
    {tmpl:"caliente_clasico",  P:"huevo",  C:"arroz",   V:"espinacas",S:"ajillo",         cookM:"revuelto", plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"huevo",  C:"patata",  V:"pimientos",S:"pimenton_ajo",   cookM:"tortilla", plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"ternera",C:"patata",  V:"zanahoria",S:"ajillo",         cookM:"guisado",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico",  P:"pollo",  C:"pasta",   V:"tomate",   S:"pimenton_ajo",   cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico",  P:"atun",   C:"arroz",   V:"tomate",   S:"limon_hierbas",  cookM:"crudo",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"ensalada",          P:"pollo",  C:"quinoa",  V:"tomate",   V2:"pepino",S:"limon_hierbas",cookM:"plancha",plateType:"ensalada", density:"media", familiar:false, facil:true},
    {tmpl:"caliente_clasico",  P:"merluza",C:"arroz",   V:"espinacas",S:"ajillo",         cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"pasta",             P:"ternera",C:"pasta",   V:"calabacin",S:"tomate_casero",  cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:false},
    {tmpl:"pasta",             P:"pollo",  C:"pasta",   V:"espinacas",S:"ajillo",         cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"legumbre",          P:"lentejas",C:"arroz",  V:"zanahoria",S:"pimenton_ajo",   cookM:"guisado",  plateType:"legumbre",          density:"alta",  familiar:true,  facil:false},
    {tmpl:"bowl",              P:"atun",   C:"arroz",   V:"pepino",   V2:"tomate",S:"vinagreta",cookM:"crudo",   plateType:"bowl",          density:"media", familiar:true,  facil:true},
    {tmpl:"bowl",              P:"pollo",  C:"boniato", V:"calabacin",S:"pimenton_ajo",   cookM:"horno",    plateType:"bowl",              density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico",  P:"sardinas",C:"patata", V:"pimientos",S:"vinagreta",      cookM:"plancha",  plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    // ── Sopa / crema ─────────────────────────────────────────────────────
    {tmpl:"sopa_crema", P:"pollo",   C:null, V:"brocoli",   S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"merluza", C:null, V:"brocoli",   S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"gambas",  C:null, V:"calabacin", S:"ajillo",        cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:false, facil:false},
    {tmpl:"sopa_crema", P:"huevo",   C:null, V:"espinacas", S:"limon_hierbas", cookM:"plancha",  plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    {tmpl:"sopa_crema", P:"atun",    C:null, V:"tomate",    V2:"pepino",       cookM:"crudo",    plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    {tmpl:"sopa_crema", P:"bacalao", C:null, V:"zanahoria", V2:"calabaza",     S:"ajillo",       cookM:"guisado",        plateType:"sopa_crema", density:"baja",  familiar:true,  facil:false},
    {tmpl:"sopa_crema", P:"huevo",   C:null, V:"tomate",    cookM:"crudo",     plateType:"sopa_crema", density:"baja",  familiar:true,  facil:true},
    // ── Pasta (ampliación) ────────────────────────────────────────────────
    {tmpl:"pasta", P:"gambas",  C:"pasta", V:"tomate",    S:"ajillo",        cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"gambas",  C:"pasta", V:"calabacin", S:"ajillo",        cookM:"salteado", plateType:"pasta", density:"alta",  familiar:false, facil:true},
    {tmpl:"pasta", P:"salmon",  C:"pasta", V:"espinacas", S:"limon_hierbas", cookM:"plancha",  plateType:"pasta", density:"alta",  familiar:false, facil:false},
    {tmpl:"pasta", P:"merluza", C:"pasta", V:"calabacin", S:"ajillo",        cookM:"plancha",  plateType:"pasta", density:"alta",  familiar:true,  facil:false},
    {tmpl:"pasta", P:"pavo",    C:"pasta", V:"tomate",    S:"tomate_casero", cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"cerdo",   C:"pasta", V:"pimientos", S:"pimenton_ajo",  cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:true},
    {tmpl:"pasta", P:"ternera", C:"pasta", V:"berenjena", S:"tomate_casero", cookM:"salteado", plateType:"pasta", density:"alta",  familiar:true,  facil:false},
    // ── Legumbre (ampliación) ─────────────────────────────────────────────
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"espinacas", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"pimientos", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"lentejas",  C:null, V:"calabacin", S:"ajillo",       cookM:"guisado",  plateType:"legumbre", density:"media", familiar:false, facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"zanahoria", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"tomate",    S:"ajillo",       cookM:"salteado", plateType:"legumbre", density:"media", familiar:true,  facil:true},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"pimientos", S:"pimenton_ajo", cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"alubias",   C:null, V:"acelgas",   S:"ajillo",       cookM:"guisado",  plateType:"legumbre", density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre", P:"garbanzos", C:null, V:"berenjena", S:"curry_ligero", cookM:"salteado", plateType:"legumbre", density:"baja",  familiar:false, facil:true},
    // ── Bowl (ampliación) ─────────────────────────────────────────────────
    {tmpl:"bowl", P:"salmon",  C:"arroz",  V:"espinacas", S:"soja_jengibre", cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    {tmpl:"bowl", P:"atun",    C:"quinoa", V:"pepino",    V2:"tomate",       S:"vinagreta",   cookM:"crudo",   plateType:"bowl", density:"media", familiar:true,  facil:true},
    {tmpl:"bowl", P:"gambas",  C:"arroz",  V:"pepino",    S:"limon_hierbas", cookM:"plancha", plateType:"bowl", density:"media", familiar:false, facil:true},
    {tmpl:"bowl", P:"ternera", C:"arroz",  V:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"bowl", density:"media", familiar:false, facil:true},
    {tmpl:"bowl", P:"merluza", C:"quinoa", V:"espinacas", S:"limon_hierbas", cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    {tmpl:"bowl", P:"pavo",    C:"boniato",V:"calabacin", S:"pimenton_ajo",  cookM:"horno",   plateType:"bowl", density:"media", familiar:false, facil:false},
    // ── Ensalada (ampliación) ─────────────────────────────────────────────
    {tmpl:"ensalada", P:"salmon",  C:null,    V:"lechuga",  V2:"pepino",    S:"limon_hierbas", cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"pavo",    C:null,    V:"lechuga",  V2:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"gambas",  C:null,    V:"lechuga",  V2:"tomate",    S:"vinagreta",     cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"atun",    C:null,    V:"tomate",   V2:"pepino",    S:"vinagreta",     cookM:"crudo",   plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    {tmpl:"ensalada", P:"pollo",   C:"quinoa",V:"pepino",   V2:"zanahoria", S:"limon_hierbas", cookM:"plancha", plateType:"ensalada", density:"media", familiar:false, facil:true},
    // ── Conejo (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:"arroz",  V:"zanahoria", S:"ajillo",        cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"conejo",   C:"boniato",V:"espinacas", S:"romero_limon",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    {tmpl:"caliente_clasico", P:"conejo",   C:"arroz",  V:"berenjena", S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Dorada (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"dorada",   C:"arroz",  V:"calabacin", S:"limon_hierbas", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Bacalao (ampliación) ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"bacalao",  C:"arroz",  V:"espinacas", S:"ajillo",        cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"bacalao",  C:"boniato",V:"tomate",    S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_boniato", density:"media", familiar:false, facil:false},
    // ── Berenjena integrada en caliente ───────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:"patata", V:"berenjena", S:"pimenton_ajo",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"pavo",     C:"arroz",  V:"berenjena", S:"tomate_casero", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    // ── Calamares (ampliación) ────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"calamares",C:"arroz",  V:"calabacin", S:"ajillo",        cookM:"salteado", plateType:"caliente_arroz",   density:"alta",  familiar:true,  facil:true},
    // ── Cerdo con verduras de invierno ────────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:"patata", V:"coles",     S:"mostaza_miel",  cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:false, facil:false},
    // ── Puerro ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata",  V:"puerro",     S:"provenzal",     cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"merluza", C:"arroz",   V:"puerro",     S:"limon_hierbas", cookM:"horno",    plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"sopa_crema",       P:"pollo",   C:null,      V:"puerro",     S:"provenzal",     cookM:"guisado",  plateType:"sopa_crema",       density:"baja",  familiar:true,  facil:false},
    // ── Champiñones ──────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",   V:"champiñones",S:"ajillo",        cookM:"salteado", plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"pasta",            P:"pollo",   C:"pasta",   V:"champiñones",S:"provenzal",     cookM:"salteado", plateType:"pasta",             density:"alta",  familiar:true,  facil:true},
    {tmpl:"caliente_clasico", P:"huevo",   C:"patata",  V:"champiñones",S:"ajillo",        cookM:"revuelto", plateType:"caliente_patata",  density:"media", familiar:true,  facil:true},
    // ── Espárragos ───────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",  C:"arroz",   V:"esparragos", S:"limon_hierbas", cookM:"plancha",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:true},
    {tmpl:"bowl",             P:"pollo",   C:"quinoa",  V:"esparragos", S:"limon_hierbas", cookM:"plancha",  plateType:"bowl",              density:"media", familiar:false, facil:true},
    {tmpl:"ensalada",         P:"gambas",  C:null,      V:"esparragos", V2:"tomate",       S:"vinagreta",    cookM:"plancha", plateType:"ensalada", density:"baja",  familiar:true,  facil:true},
    // ── Alcachofa ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata",  V:"alcachofa",  S:"limon_hierbas", cookM:"horno",    plateType:"caliente_patata",  density:"media", familiar:true,  facil:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"arroz",   V:"alcachofa",  S:"ajillo",        cookM:"guisado",  plateType:"caliente_arroz",   density:"media", familiar:true,  facil:false},
    {tmpl:"legumbre",         P:"garbanzos",C:null,     V:"alcachofa",  S:"limon_hierbas", cookM:"guisado",  plateType:"legumbre",         density:"media", familiar:false, facil:false},
]);

export const DINNER_COMBOS_RAW = Object.freeze([
    // ── Plancha + verdura (classic) ──────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"calabacin",  S:"provenzal",     cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"coles",      S:"romero_limon",  cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"pimientos",  S:"pimenton_ajo",  cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",   C:null,  V:"berenjena",  S:"provenzal",     cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"judias",     S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"calabacin",  S:"curry_ligero",  cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"pimientos",  S:"romero_limon",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"brocoli",    S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"baja", saciante:false}, // NORMALIZACION #1: era "media" en buildPlan.js:857, colapsada con el duplicado de buildPlan.js:877 (density:"baja") — ver banner arriba y legacyCombos.normalizations.js
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"media", saciante:false},
    // ── Pescado ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"merluza", C:null,  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:null,  V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"bacalao", C:null,  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"salmon",  C:null,  V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"sardinas",C:null,  V:"tomate",     S:"ajillo",        cookM:"plancha", plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Huevo ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"espinacas",  S:"ajillo",        cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"calabacin",  S:"pimenton_ajo",  cookM:"tortilla",plateType:"huevo_plancha",  density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"pimientos",  S:"pimenton_ajo",  cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"tomate",     S:"ajillo",        cookM:"plancha", plateType:"huevo_plancha",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"zanahoria",  S:"pimenton_ajo",  cookM:"tortilla",plateType:"huevo_plancha",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"huevo",   C:null,  V:"brocoli",    S:"limon_hierbas", cookM:"revuelto",plateType:"huevo_plancha",  density:"baja",  saciante:false},
    // ── Vida real: platos rápidos y familiares que faltan ─────────────────
    {tmpl:"caliente_clasico", P:"atun",    C:null,  V:"tomate",     S:"vinagreta",     cookM:"crudo",   plateType:"ensalada",       density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"atun",    C:null,  V:"lechuga",    V2:"pepino",       cookM:"crudo",   plateType:"ensalada",       density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:null,  V:"calabacin",  S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:null,  V:"espinacas",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    // NORMALIZACION #1: duplicado de cerdo+brocoli+mostaza_miel+plancha (buildPlan.js:877) eliminado — colapsado en la entrada de arriba (linea 213 original), ver banner.
    {tmpl:"caliente_clasico", P:"merluza", C:null,  V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"dorada",  C:null,  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    {tmpl:"ensalada",         P:"gambas",  C:null,  V:"lechuga",    V2:"tomate",S:"limon_hierbas",cookM:"plancha",plateType:"ensalada",density:"baja",saciante:true},
    // ── Sopa / crema (saciante) ─────────────────────────────────────────
    {tmpl:"sopa_crema",       P:"pollo",   C:null,  V:"calabaza",   S:"provenzal",     cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"huevo",   C:null,  V:"calabaza",   V2:"zanahoria",    cookM:null,      plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"huevo",   C:null,  V:"calabacin",  V2:"zanahoria",    cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"gambas",  C:null,  V:"calabaza",   S:"ajillo",        cookM:"plancha", plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"atun",    C:null,  V:"tomate",     V2:"pimientos",    cookM:"crudo",   plateType:"sopa_crema",     density:"baja",  saciante:true},
    {tmpl:"sopa_crema",       P:"pollo",   C:null,  V:"zanahoria",  V2:"calabacin",    cookM:"guisado", plateType:"sopa_crema",     density:"baja",  saciante:true},
    // ── Ensalada ─────────────────────────────────────────────────────────
    {tmpl:"ensalada",         P:"pollo",   C:null,  V:"lechuga",    V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",density:"baja",  saciante:true},
    {tmpl:"ensalada",         P:"atun",    C:null,  V:"lechuga",    V2:"pepino",S:"vinagreta",cookM:"crudo",  plateType:"ensalada",density:"baja",  saciante:true},
    {tmpl:"ensalada",         P:"ternera", C:null,  V:"lechuga",    V2:"tomate",S:"vinagreta",cookM:"plancha",plateType:"ensalada",density:"baja",  saciante:true},
    // ── Marisco ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"gambas",  C:null,  V:"calabacin",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja", saciante:false},
    {tmpl:"caliente_clasico", P:"calamares",C:null, V:"pimientos",  S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja", saciante:false},
    // ── Conejo en cena ────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:null, V:"espinacas", S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Dorada (ampliación) ───────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"dorada",   C:null, V:"espinacas", S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Bacalao (ampliación) ──────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"bacalao",  C:null, V:"espinacas", S:"ajillo",        cookM:"horno",   plateType:"pescado_horno",  density:"baja",  saciante:false},
    // ── Berenjena en cena ─────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera",  C:null, V:"berenjena", S:"pimenton_ajo",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",     C:null, V:"berenjena", S:"tomate_casero", cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Calamares (ampliación) ────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"calamares",C:null, V:"calabacin", S:"ajillo",        cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Cerdo con verduras de invierno ────────────────────────────────────
    {tmpl:"caliente_clasico", P:"cerdo",    C:null, V:"coles",     S:"mostaza_miel",  cookM:"horno",   plateType:"plancha_verdura", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"cerdo",    C:null, V:"acelgas",   S:"ajillo",        cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    // ── Puerro ────────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"pollo",    C:null, V:"puerro",    S:"provenzal",     cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"sopa_crema",       P:"pollo",    C:null, V:"puerro",    V2:"zanahoria",    cookM:"guisado", plateType:"sopa_crema",      density:"baja",  saciante:true},
    // ── Champiñones ──────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"ternera",  C:null, V:"champiñones",S:"ajillo",       cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"pollo",    C:null, V:"champiñones",S:"provenzal",    cookM:"salteado",plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",    C:null, V:"champiñones",S:"ajillo",       cookM:"revuelto",plateType:"huevo_plancha",   density:"baja",  saciante:false},
    // ── Espárragos ───────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"salmon",   C:null, V:"esparragos",S:"limon_hierbas", cookM:"plancha", plateType:"pescado_horno",   density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"huevo",    C:null, V:"esparragos",S:"ajillo",        cookM:"plancha", plateType:"huevo_plancha",   density:"baja",  saciante:false},
    // ── Alcachofa ─────────────────────────────────────────────────────────
    {tmpl:"caliente_clasico", P:"conejo",   C:null, V:"alcachofa", S:"ajillo",        cookM:"horno",   plateType:"plancha_verdura", density:"baja",  saciante:false},
    {tmpl:"caliente_clasico", P:"merluza",  C:null, V:"alcachofa", S:"limon_hierbas", cookM:"horno",   plateType:"pescado_horno",   density:"baja",  saciante:false},
    // ── Cenas caliente con carbohidrato — densidad media, ≥2 carbs por proteína ──
    // Pollo
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",  V:"brocoli",    S:"limon_hierbas", cookM:"plancha", plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"patata", V:"espinacas",  S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pollo",   C:"boniato",V:"pimientos",  S:"provenzal",     cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Pavo
    {tmpl:"caliente_clasico", P:"pavo",    C:"arroz",  V:"calabacin",  S:"curry_ligero",  cookM:"salteado",plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pavo",    C:"patata", V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"pavo",    C:"boniato",V:"espinacas",  S:"mostaza_miel",  cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Ternera
    {tmpl:"caliente_clasico", P:"ternera", C:"patata", V:"pimientos",  S:"romero_limon",  cookM:"plancha", plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"arroz",  V:"champiñones",S:"ajillo",        cookM:"plancha", plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"ternera", C:"boniato",V:"brocoli",    S:"pimenton_ajo",  cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Cerdo
    {tmpl:"caliente_clasico", P:"cerdo",   C:"patata", V:"coles",      S:"mostaza_miel",  cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"cerdo",   C:"arroz",  V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Merluza
    {tmpl:"caliente_clasico", P:"merluza", C:"patata", V:"judias",     S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"merluza", C:"arroz",  V:"calabacin",  S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Bacalao
    {tmpl:"caliente_clasico", P:"bacalao", C:"patata", V:"pimientos",  S:"ajillo",        cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"bacalao", C:"arroz",  V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Salmón
    {tmpl:"caliente_clasico", P:"salmon",  C:"arroz",  V:"esparragos", S:"limon_hierbas", cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"salmon",  C:"patata", V:"espinacas",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    // Dorada
    {tmpl:"caliente_clasico", P:"dorada",  C:"patata", V:"calabacin",  S:"limon_hierbas", cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"dorada",  C:"arroz",  V:"judias",     S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
    // Conejo
    {tmpl:"caliente_clasico", P:"conejo",  C:"patata", V:"espinacas",  S:"romero_limon",  cookM:"horno",   plateType:"caliente_patata", density:"media", saciante:true},
    {tmpl:"caliente_clasico", P:"conejo",  C:"arroz",  V:"champiñones",S:"ajillo",        cookM:"horno",   plateType:"caliente_arroz",  density:"media", saciante:true},
]);

export const TRAINING_DINNERS_RAW = Object.freeze([
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"brocoli",  S:"pimenton_ajo",  cookM:"plancha", slot:"Cena",
     emoji:"🏋️", title:"Post-entreno: Pollo con arroz y brócoli",
     plateType:"caliente_arroz", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:"patata",  V:"espinacas",S:"romero_limon",  cookM:"plancha", slot:"Cena",
     emoji:"🏋️", title:"Post-entreno: Ternera con patata",
     plateType:"caliente_patata", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"boniato", V:"judias",   S:"curry_ligero",  cookM:"plancha", slot:"Cena",
     emoji:"🏋️", title:"Post-entreno: Pavo con boniato",
     plateType:"caliente_boniato", density:"media", saciante:false},
]);
