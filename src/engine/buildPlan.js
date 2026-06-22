// ─── PLAN BUILDER ──────────────────────────────────────────────────────────
// Extraido de App.jsx — Fase 3: firma final (profile, targetKcal, opts={})
// Impurezas controladas:
//   opts.month        -> new Date().getMonth() para SEASONAL_FOODS
//   opts.pastProteins -> {}  para cross-week protein frequency
// Dependencias App.jsx inyectadas via opts (no-op defaults para tests):
//   opts.freeFormPool   -> FREEFORM_POOL
//   opts.perf           -> __PERF
//   opts.saveMealMemory -> saveMealMemory
//   opts.weekNumber     -> getWeekNumber()

import { computeStrategy, getMealRules, calcMacros } from './nutrition.js';
import { _hashStr } from './hash.js';
import { mulberry32 } from './rng.js';
import { SEASONAL_FOODS } from '../seasonalFoods.js';

export function buildPlan(profile, targetKcal, opts = {}) {
  // -- Injectable dependencies -- local vars shadow any outer scope -----------
  const FREEFORM_POOL  = opts.freeFormPool   ?? [];
  const __PERF         = opts.perf           ?? { mark: () => 0, measure: () => {} };
  const saveMealMemory = opts.saveMealMemory  ?? (() => {});
  const getWeekNumber  = () => (opts.weekNumber ?? 0);

  // -- Controlled impurity points ---------------------------------------------
  const _month        = opts.month        ?? new Date().getMonth();
  const _pastProteins = opts.pastProteins ?? {};
  // Sin opts.rng: seed determinista = hash(userId + weekNumber) — misma seed,
  // mismo plan byte a byte (excluyendo day.id, ver planSeed = Date.now() mas abajo).
  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));
  const WEEKLY_SAUCE_PEN_STEP = opts.weeklySaucePenStep ?? 5;
  // ---------------------------------------------------------------------------

  // Ensure extras.proteinShake exists — safe for old profiles without it.
  profile.extras = profile.extras || {};
  profile.extras.proteinShake = profile.extras.proteinShake || {
    enabled:false, scoops:1, kcalPerScoop:120, proteinPerScoop:24, timing:"post_entreno"
  };
  // FASE 1 — baseScale encodes user structural size only; independent of shake.
  const strategy  =computeStrategy(profile);
  const rules     =getMealRules(strategy);
  const baseScale =Math.min(Math.max(targetKcal/1600,0.88),1.58);

  // FASE 2 — shakeFactor: proportional calibration layer, separate from baseScale.
  const _shk          = profile.extras.proteinShake;
  const shakeEnabled  = !!_shk.enabled;
  const shakeProtein  = shakeEnabled ? _shk.scoops * _shk.proteinPerScoop : 0;
  const shakeKcal     = shakeEnabled ? _shk.scoops * _shk.kcalPerScoop    : 0;
  const targetProtein = calcMacros(targetKcal,profile.weight,profile.goal,profile.activity,strategy).protein;
  const proteinCoverage = shakeEnabled ? shakeProtein / Math.max(targetProtein,80) : 0;
  const energyCoverage  = shakeEnabled ? shakeKcal    / targetKcal                 : 0;
  const shakeFactor     = 1-(proteinCoverage*0.75+energyCoverage*0.25);

  // FASE 3 — per-category calibration ratios.
  // Protein reduced most; carbs lightly; fat minimally; veggies untouched.
  const categoryFactor=(type)=>{
    switch(type){
      case "p": return shakeFactor;
      case "c": return 1-((1-shakeFactor)*0.45);
      case "f": return 1-((1-shakeFactor)*0.20);
      case "v": return 1.0;
      default:  return 1.0;
    }
  };

  // FASE 4 — r() applies baseScale + strategy mult + shake calibration per category.
  // type: "p"=protein, "c"=carb, "f"=fat, "v"=veggie, default=neutral
  const r=(base,step=5,type)=>{
    var mult=1;
    if(type==="p") mult=rules.proteinMult;
    else if(type==="c") mult=rules.carbMult;
    else if(type==="f") mult=rules.fatMult;
    else if(type==="v") mult=rules.veggieMult;
    return Math.round(base*baseScale*mult*categoryFactor(type)/step)*step;
  };
  const {intolerances:intol,trainingDays}=profile;
  const noFish    =intol.includes("pescado");
  const noPork    =intol.includes("cerdo");
  const noEgg     =intol.includes("huevo");
  const noNuts    =intol.includes("frutos_secos");
  const noLegumes =intol.includes("legumbres");
  const noGluten  =intol.includes("gluten");
  const noMariscos=intol.includes("mariscos");
  const noLactosa =intol.includes("lactosa");
  const isTrain   =(d)=>trainingDays.includes(d);
  // Soft preference: prefer seasonal vegetables for the current month (Spain).
  // Applied in smartPick as a scoring bonus — lower priority than intolerances,
  // which hard-filter combos out of the pool before scoring begins.
  const currentSeasonalVegs = SEASONAL_FOODS[_month] || [];
  // Typed portion helpers — strategy multipliers applied here
  const rp=(b,s=5)=>r(b,s,"p");  // protein grams
  const _rc=(b,s=5)=>r(b,s,"c");  // carb grams (rice, pasta, potato, bread)
  // Vegetable portions: capped per-ingredient via maxPortion. Legacy numeric calls (AOVE amounts)
  // are handled by the typeof guard and still cap at 250g.
  const rv=(vegKeyOrBase,base,step=5)=>{
    if(typeof vegKeyOrBase==="number") return Math.min(250,r(vegKeyOrBase,typeof base==="number"?base:5,"v"));
    const _vs=VEG[vegKeyOrBase];
    const _cap=_vs!=null&&_vs.maxPortion!=null?_vs.maxPortion:250;
    return Math.min(_cap,r(base!=null?base:(_vs!=null?_vs.base:0),step,"v"));
  };
  // Protein portion with per-ingredient hard cap, scaled smoothly by target kcal.
  const effectiveCap=(baseCap,tKcal)=>{
    const raw=1+((tKcal-2000)/2000)*0.40;
    const factor=Math.min(Math.max(raw,0.85),1.20);
    return Math.round(baseCap*factor/5)*5;
  };
  const rpFor=(protKey,tKcal)=>{
    const _ps=PROT[protKey];
    if(!_ps) return 0;
    const _step=_ps.unit==="ud"?1:5;
    const _raw=r(_ps.base,_step,"p");           // includes shakeFactor via categoryFactor
    // Cap uses meals-kcal target (tKcal minus shake) so it also reflects the shake
    // contribution — guarantees visible portion differences at high kcal where
    // baseScale is clamped and shakeFactor alone wouldn't move the result.
    const _mealsTKcal=tKcal-shakeKcal;
    const _cap=_ps.unit==="ud"
      ?(_ps.maxPortionByPlan?.[strategy]??_ps.maxPortion??_raw)
      :effectiveCap(_ps.maxPortionByPlan?.[strategy]??_ps.maxPortion??_raw,_mealsTKcal);
    return Math.min(_cap,_raw);
  };
  const rcFor=(carbKey,tKcal)=>{
    const _cs=CARB[carbKey];
    if(!_cs) return 0;
    const _raw=r(_cs.base,5,"c");
    const _mealsTKcal=tKcal-shakeKcal;
    const _declaredCap=
      _cs.maxPortionByPlan?.[strategy]
      ??_cs.maxPortion
      ??_raw;
    return Math.min(effectiveCap(_declaredCap,_mealsTKcal),_raw);
  };
  const milk      =noLactosa?"200ml bebida vegetal":"180ml leche semidesnatada";
  const yogur     =noLactosa?"bebida vegetal (180ml)":"yogur griego 0% (125g)";

  // ══════════════════════════════════════════════════════════════════════════
  // COMPOSITIONAL MEAL ENGINE — replaces hardcoded B.*/L.*/D.* objects
  // Meals are built from ingredient databases + templates, not hand-written.
  // ══════════════════════════════════════════════════════════════════════════

  // ── INGREDIENT DATABASES ─────────────────────────────────────────────────

  const PROT = {
    pollo:     {label:"Pechuga de pollo", base:175, maxPortion:220, maxPortionByPlan:{fat_loss_general:200,definicion_saciante:170,definicion_flexible:180,mantenimiento_equilibrado:220,volumen_limpio:250,volumen_agresivo:280}, protDensity:31, cook:["plancha","horno","guisado","salteado"], familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:false},
    pavo:      {label:"Pechuga de pavo",  base:175, maxPortion:220, maxPortionByPlan:{fat_loss_general:200,definicion_saciante:170,definicion_flexible:180,mantenimiento_equilibrado:220,volumen_limpio:250,volumen_agresivo:280}, protDensity:29, cook:["plancha","horno","salteado"],            familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:false},
    ternera:   {label:"Ternera magra",    base:170, maxPortion:200, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:200,volumen_limpio:220,volumen_agresivo:250}, protDensity:26, cook:["plancha","guisado","horno"],              familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false},
    cerdo:     {label:"Lomo de cerdo",    base:170, maxPortion:200, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:200,volumen_limpio:220,volumen_agresivo:250}, protDensity:22, cook:["plancha","horno"],                        familiar:true,  facil:true,  isPork:true,  isFish:false, isEgg:false, isSeafood:false},
    conejo:    {label:"Conejo",           base:200, maxPortion:220, protDensity:21, cook:["horno","guisado"],                        familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false},
    salmon:    {label:"Salmón",           base:180, maxPortion:220, maxPortionByPlan:{fat_loss_general:180,definicion_saciante:150,definicion_flexible:160,mantenimiento_equilibrado:220,volumen_limpio:240,volumen_agresivo:260}, protDensity:20, cook:["horno","plancha"],                        familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    merluza:   {label:"Merluza",          base:200, maxPortion:240, protDensity:19, cook:["horno","vapor","plancha"],                familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    bacalao:   {label:"Bacalao fresco",   base:200, maxPortion:240, protDensity:20, cook:["horno","plancha"],                        familiar:true,  facil:false, isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    dorada:    {label:"Dorada",           base:200, maxPortion:240, protDensity:19, cook:["horno","plancha"],                        familiar:true,  facil:false, isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    sardinas:  {label:"Sardinas",         base:180, maxPortion:200, protDensity:21, cook:["plancha","horno"],                        familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    atun:      {label:"Atún en conserva", base:120, maxPortion:150, maxPortionByPlan:{fat_loss_general:120,definicion_saciante:100,definicion_flexible:110,mantenimiento_equilibrado:150,volumen_limpio:160,volumen_agresivo:180}, protDensity:27, cook:["crudo"],                                  familiar:true,  facil:true,  isPork:false, isFish:true,  isEgg:false, isSeafood:false},
    gambas:    {label:"Gambas",           base:200, maxPortion:220, protDensity:18, cook:["plancha","salteado"],                     familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:true},
    calamares: {label:"Calamares",        base:200, maxPortion:220, protDensity:15, cook:["plancha","salteado"],                     familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:false, isSeafood:true},
    huevo:     {label:"Huevos",           base:3,   maxPortion:3,   maxPortionByPlan:{fat_loss_general:3,definicion_saciante:2,definicion_flexible:2,mantenimiento_equilibrado:3,volumen_limpio:4,volumen_agresivo:5}, protDensity:6,  cook:["plancha","revuelto","tortilla"],          familiar:true,  facil:true,  isPork:false, isFish:false, isEgg:true,  isSeafood:false, unit:"ud"},
    lentejas:  {label:"Lentejas",         base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:24, cook:["guisado"],                                familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
    garbanzos: {label:"Garbanzos",        base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:19, cook:["guisado","salteado"],                     familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
    alubias:   {label:"Alubias blancas",  base:90,  maxPortion:120, maxPortionByPlan:{fat_loss_general:90,definicion_saciante:80,definicion_flexible:80,mantenimiento_equilibrado:120,volumen_limpio:130,volumen_agresivo:150}, protDensity:22, cook:["guisado"],                                familiar:true,  facil:false, isPork:false, isFish:false, isEgg:false, isSeafood:false, isLegume:true, unit:"g seco"},
  };

  // ── CULINARY FAMILY MAP ───────────────────────────────────────────────────
  // Humans perceive similarity by family, not by exact protein name.
  // "pollo al horno" + "pavo a la plancha" = misma experiencia.
  const CULINARY_FAMILY = {
    pollo:"ave",    pavo:"ave",    conejo:"ave",
    salmon:"pescado",  merluza:"pescado", bacalao:"pescado",
    dorada:"pescado",  sardinas:"pescado", atun:"pescado",
    gambas:"marisco",  calamares:"marisco",
    lentejas:"legumbre", garbanzos:"legumbre", alubias:"legumbre",
    ternera:"vacuno",  cerdo:"cerdo",
    huevo:"huevo",
  };
  function protFamily(key){ return CULINARY_FAMILY[key] || key; }

  // ── EXPERIENCIA CULINARIA ─────────────────────────────────────────────────
  // Los usuarios NO perciben categorías nutricionales — perciben experiencias:
  // "hoy comí algo caliente y reconfortante" / "otro bowl fresco más"
  // Esta función asigna a cada combo la experiencia culinaria que generará.
  // Es el dato que validateWeek() usa para detectar monotonía de verdad.
  function deriveCuisineExperience(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    var sauce = combo.S     || "";
    var _prot  = combo.P     || "";

    if(tmpl==="sopa_crema")                                         return "comfort_caliente";
    if(tmpl==="legumbre")                                           return "comfort_caliente";
    if(cookM==="guisado")                                           return "comfort_caliente";
    if(tmpl==="bowl" && (sauce==="soja_jengibre"||cookM==="salteado")) return "wok_asiatico";
    if(tmpl==="bowl")                                               return "bowl_fresco";
    if(tmpl==="ensalada")                                           return "bowl_fresco";
    if(tmpl==="pasta")                                              return "pasta_italiana";
    if(cookM==="horno" && (sauce==="limon_hierbas"||sauce==="provenzal"||sauce==="romero_limon"||sauce==="ajillo")) return "horno_mediterraneo";
    if(cookM==="horno")                                             return "horno_mediterraneo";
    if(sauce==="soja_jengibre"||sauce==="curry_ligero")             return "wok_asiatico";
    if(cookM==="plancha" && (sauce==="limon_hierbas"||sauce==="vinagreta"||!sauce)) return "plancha_ligera";
    if(cookM==="plancha")                                           return "plancha_ligera";
    return "casero_clasico";
  }

  // Temperature feel — para el check de "todos los días lo mismo frío/caliente"
  function deriveTempFeel(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    if(tmpl==="ensalada"||tmpl==="bowl"||(cookM==="crudo")) return "frio";
    if(tmpl==="sopa_crema"||cookM==="guisado")              return "muy_caliente";
    return "caliente";
  }

  // ── ELIMINATED FOODS — HARD RULE ─────────────────────────────────────────
  // Normalise the user's free-text exclusion list so it can be matched against
  // PROT keys and PROT labels. Never serve an eliminated ingredient, no matter what.
  var _eliminated = (profile.eliminatedFoods || []).map(function(f){ return f.toLowerCase().trim(); });
  function isEliminated(ingredientKey) {
    if(!ingredientKey || !_eliminated.length) return false;
    var keyLow   = ingredientKey.toLowerCase();
    var labelLow = PROT[ingredientKey] ? PROT[ingredientKey].label.toLowerCase() : "";
    return _eliminated.some(function(e){
      return e === keyLow
          || keyLow.indexOf(e)   > -1
          || e.indexOf(keyLow)   > -1
          || (labelLow && labelLow.indexOf(e) > -1)
          || (labelLow && e.indexOf(labelLow.split(" ")[0]) > -1);
    });
  }

  const CARB = {
    arroz:   {label:"Arroz blanco",   base:70,  maxPortion:80,  maxPortionByPlan:{fat_loss_general:70,definicion_saciante:50,definicion_flexible:60,mantenimiento_equilibrado:80,volumen_limpio:100,volumen_agresivo:130}, unit:"g seco",    density:"alta",  time:18, familiar:true,  cook:"cocer en agua con sal"},
    pasta:   {label:"Pasta integral", base:80,  maxPortion:85,  maxPortionByPlan:{fat_loss_general:75,definicion_saciante:55,definicion_flexible:65,mantenimiento_equilibrado:85,volumen_limpio:110,volumen_agresivo:140}, unit:"g seco",    density:"alta",  time:10, familiar:true,  cook:"cocer al dente"},
    patata:  {label:"Patata",         base:200, maxPortion:200, maxPortionByPlan:{fat_loss_general:170,definicion_saciante:130,definicion_flexible:150,mantenimiento_equilibrado:200,volumen_limpio:250,volumen_agresivo:300}, unit:"g",         density:"media", time:25, familiar:true,  cook:"cocer con piel 25 min en agua con sal"},
    boniato: {label:"Boniato",        base:175, unit:"g",         density:"media", time:35, familiar:false, cook:"hornear a 200°C"},
    quinoa:  {label:"Quinoa",         base:70,  unit:"g seco",    density:"media", time:15, familiar:false, cook:"cocer 2:1 agua"},
    pan:     {label:"Pan integral",   base:60,  unit:"g",         density:"alta",  time:2,  familiar:true,  cook:"tostar"},
  };

  const VEG = {
    brocoli:   {label:"Brócoli",           base:200, maxPortion:250, saciante:true,  familiar:true,  cookHint:"al vapor 8 min o salteado"},
    espinacas: {label:"Espinacas",         base:150, maxPortion:200, saciante:true,  familiar:true,  cookHint:"salteadas con ajo 3 min"},
    calabacin: {label:"Calabacín",         base:200, maxPortion:300, saciante:true,  familiar:true,  cookHint:"a la plancha 4 min por lado, o al horno 20 min a 200°C"},
    judias:    {label:"Judías verdes",      base:200, maxPortion:250, saciante:true,  familiar:true,  cookHint:"al vapor 10 min"},
    pimientos: {label:"Pimientos",         base:150, maxPortion:250, saciante:false, familiar:true,  cookHint:"asados al horno 25 min a 200°C, o salteados al wok 6 min"},
    zanahoria: {label:"Zanahoria",         base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"rallada cruda, o al vapor 10 min"},
    coles:     {label:"Col de Bruselas",   base:180, maxPortion:250, saciante:true,  familiar:false, cookHint:"al horno 25 min a 200°C con AOVE y sal"},
    berenjena: {label:"Berenjena",         base:200, maxPortion:300, saciante:false, familiar:true,  cookHint:"a la plancha 4 min por lado, o al horno 25 min a 200°C"},
    tomate:    {label:"Tomate cherry",     base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"crudo, o confitado al horno 30 min a 160°C"},
    lechuga:   {label:"Lechuga mixta",     base:100, maxPortion:150, saciante:false, familiar:true,  cookHint:"cruda con vinagreta"},
    acelgas:   {label:"Acelgas",           base:200, maxPortion:200, saciante:true,  familiar:true,  cookHint:"salteadas con ajo y limón 5 min"},
    pepino:    {label:"Pepino",            base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"crudo en rodajas"},
    calabaza:  {label:"Calabaza",          base:300, maxPortion:350, saciante:true,  familiar:true,  cookHint:"asada al horno 30 min a 200°C, o en crema 20 min cocida"},
    puerro:    {label:"Puerro",            base:150, maxPortion:200, saciante:true,  familiar:true,  cookHint:"pochado 10 min a fuego suave, o al horno 25 min a 200°C con AOVE"},
    champiñones:{label:"Champiñones",      base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"salteados con ajo y perejil 6 min"},
    esparragos: {label:"Espárragos",       base:150, maxPortion:200, saciante:false, familiar:true,  cookHint:"a la plancha o al vapor 5 min"},
    alcachofa:  {label:"Alcachofas",       base:150, maxPortion:250, saciante:true,  familiar:false, cookHint:"al horno 30 min a 200°C, o cocidas 25 min con limón"},
  };

  const SAUCE = {
    limon_hierbas:  {label:"limón, orégano y ajo",       fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    tomate_casero:  {label:"tomate casero",               fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    mostaza_miel:   {label:"mostaza y miel",              fat:"½ cda AOVE", familiar:true,  style:"europeo"},
    soja_jengibre:  {label:"soja baja en sal y jengibre", fat:"½ cda AOVE", familiar:false, style:"asiatico"},
    provenzal:      {label:"hierbas provenzales",         fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    pimenton_ajo:   {label:"pimentón ahumado y ajo",      fat:"½ cda AOVE", familiar:true,  style:"casero"},
    curry_ligero:   {label:"curry y cúrcuma",             fat:"½ cda AOVE", familiar:false, style:"asiatico"},
    vinagreta:      {label:"vinagre de Módena y mostaza", fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
    ajillo:         {label:"ajo, perejil y guindilla",    fat:"½ cda AOVE", familiar:true,  style:"casero"},
    romero_limon:   {label:"romero, limón y ajo",         fat:"½ cda AOVE", familiar:true,  style:"mediterraneo"},
  };

  const sauceFamily = {
    mostaza_miel: 'mostaza',
    vinagreta: 'mostaza'
  };
  const famOf = (s) => sauceFamily[s] ?? s;

  // Cook method descriptions in Spanish
  const COOK_LABEL = {
    plancha:"a la plancha", horno:"al horno", guisado:"guisado", salteado:"salteado",
    vapor:"al vapor", crudo:"en conserva", revuelto:"revuelto", tortilla:"en tortilla",
    "al dente":"al dente",
  };

  // ── P1 TEMPLATE ENGINE ────────────────────────────────────────────────────
  // Method-aware wording for p1 — eliminates the blanket "marinado con" pattern.
  // Each template embeds the cooking method so cookDesc is not appended separately.
  // Selection is deterministic: _hashStr(comboKey) picks the same variant every time.
  const P1_TEMPLATES = {
    plancha: [
      "{P} a la plancha con {S}",
      "{P} marcado a la plancha, {S}",
      "{P} a la plancha aliñado con {S}",
    ],
    horno: [
      "{P} al horno con {S}",
      "{P} asado al horno, {S}",
      "{P} horneado con {S}",
    ],
    salteado: [
      "{P} salteado con {S}",
      "{P} al wok con {S}",
      "{P} salteado, terminado con {S}",
    ],
    guisado: [
      "{P} guisado con {S}",
      "{P} estofado con {S}",
      "{P} cocinado a fuego lento con {S}",
    ],
    crudo: [
      "{P} en crudo, aliñado con {S}",
      "{P} tipo tartar con {S}",
      "{P} servido crudo con {S}",
    ],
    revuelto: [
      "{P} revueltos con {S}",
      "{P} en revuelto con {S}",
    ],
    tortilla: [
      "{P} en tortilla con {S}",
    ],
  };
  // Pick template by deterministic hash — same combo always gets same wording
  const pickP1Template = (cm, comboKey) => {
    const arr = P1_TEMPLATES[cm] || P1_TEMPLATES["plancha"];
    return arr[_hashStr(comboKey || cm) % arr.length];
  };
  // Render a P1_TEMPLATES entry: substitute {P}/{S}, strip sauce clause when no sauce
  const renderP1Tmpl = (tmpl, pLbl, sLbl) => {
    if (sLbl) return tmpl.replace("{P}", pLbl).replace("{S}", sLbl);
    // No sauce: drop " con {S}", ", {S}", " aliñado con {S}", etc.
    return tmpl
      .replace(/[\s,]*(?:marinado |aliñado |terminado )?con\s+\{S\}/g, "")
      .replace(/[\s,]+\{S\}/g, "")
      .replace("{P}", pLbl)
      .replace(/[,\s]+$/, "");
  };
  // AOVE suffix variants — deterministic by comboKey
  const _AOVE_SUFFIXES = (ml) => [
    ml + "ml AOVE",
    "un chorrito de AOVE (" + ml + "ml)",
    "aliñado con " + ml + "ml de AOVE",
    ml + "ml de aceite de oliva virgen extra",
  ];
  const pickAoveSuffix = (ml, comboKey) =>
    _AOVE_SUFFIXES(ml)[_hashStr(comboKey + "_aove") % 4];

  // ── MEAL TEMPLATE COMPOSER ────────────────────────────────────────────────
  // Returns a full meal object {time, emoji, title, p1, p2, shopping, recipe, metadata}
  // from a combination spec. All gram values use rp/rc/rv for strategy scaling.

  function composeMeal(spec) {
    const __t0 = __PERF.mark();  // PERF — composeMeal es llamado ~35 veces por plan

    if (spec && spec.freeForm === true) {

      var __ff_id        = spec.identity || {};
      var __ff_nutrition = spec.nutrition || {};
      var __ff_scaling   = spec.scaling || {};
      var __ff_behavior  = spec.behavior || {};
      var __ff_content   = spec.content || {};

      // ─────────────────────────────────────────────
      // SLOT RESOLUTION (determinista)
      // ─────────────────────────────────────────────
      // Prioridad:
      // 1) spec.slot
      // 2) behavior.slot
      // 3) fallback "Comida"
      var __slotArr = Array.isArray(__ff_behavior.slot)
        ? __ff_behavior.slot
        : (__ff_behavior.slot ? [__ff_behavior.slot] : []);

      var __ff_time = spec.slot
        || (__slotArr.indexOf("Ce") >= 0 ? "Cena"
          : __slotArr.indexOf("C")  >= 0 ? "Comida"
          : "Desayuno");

      var __ff_emoji =
        __ff_id.emoji ||
        (__ff_time === "Cena" ? "🌙"
          : __ff_time === "Desayuno" ? "🍎"
          : "☀️");

      // ─────────────────────────────────────────────
      // LEGACY METADATA COMPATIBILITY LAYER
      // ─────────────────────────────────────────────
      // IMPORTANTE: solo compatibilidad, NO fuente de verdad
      var __ff_metadata = {
        saciedad:
          (__ff_behavior.satietyScore >= 4) ? "alta"
          : (__ff_behavior.satietyScore >= 3) ? "media"
          : "baja",

        facilidad: "media",

        // conservación de señal real (no colapsada)
        tiempo: __ff_behavior.tiempo || 0,

        familiar: __ff_behavior.familiar !== false,

        comfort: __ff_behavior.digestiveLoad === "high" ? true : false,

        // plateType para validateWeek (estimación kcal diaria)
        plateType: __ff_id.plateType || null
      };

      // ── glutenFree adaptation flag (Fase 3) ──────────────────────
      if (noGluten && __ff_id.glutenFreeAdaptable === true) {
        __ff_metadata.glutenFreeAdapted = true;
        __ff_metadata.glutenFreeNote    = "Usa versión sin gluten";
      }
      // ── fin glutenFree adaptation ─────────────────────────────────

      var __ff_result = {
        time: __ff_time,
        emoji: __ff_emoji,
        title: __ff_id.title || "Plato",

        p1: __ff_content.p1 || "",
        p2: __ff_content.p2 || "",

        shopping: Array.isArray(__ff_content.shopping)
          ? __ff_content.shopping.slice()
          : [],

        recipe: Array.isArray(__ff_content.recipe)
          ? __ff_content.recipe.slice()
          : [],

        metadata: __ff_metadata,

        _spec: spec
      };

      __PERF.measure("composeMeal", __t0);

      return __ff_result;
    }

    var P   = spec.P   ? PROT[spec.P]   : null;
    var C   = spec.C   ? CARB[spec.C]   : null;
    var V   = spec.V   ? VEG[spec.V]    : null;
    var V2  = spec.V2  ? VEG[spec.V2]   : null;
    var S   = spec.S   ? SAUCE[spec.S]  : null;
    var tmpl= spec.tmpl || "caliente_clasico";
    var slot= spec.slot || "Comida";
    var emoji=spec.emoji || (slot==="Comida"?"☀️":"🌙");
    var time = slot==="Comida"?"Comida":slot==="Cena"?"Cena":"Desayuno";

    var pLabel = P?(P.unit==="ud"?(rpFor(spec.P,targetKcal)+" "+P.unit+" "+P.label):P.label+" ("+rpFor(spec.P,targetKcal)+"g)"):"";
    var cLabel = C?(C.label+" ("+rcFor(spec.C,targetKcal)+"g "+C.unit+")"):"";;
    var vLabel = V?(V.label+" ("+rv(spec.V,V.base)+"g)"):"";
    var v2Label= V2?(V2.label+" ("+rv(spec.V2,V2.base)+"g)"):"";
    var sLabel = S?S.label:"";
    var cookM  = spec.cookM || (P&&P.cook[0]) || "plancha";
    var cookDesc=COOK_LABEL[cookM]||cookM;

    // ── Build title — sauce/method-first, not protein-carb-veg structure ──
    var title;
    var pName  = P ? P.label.toLowerCase() : "";
    var vName  = V ? V.label.toLowerCase() : "";
    var v2Name = V2? V2.label.toLowerCase(): "";
    var cName  = C ? C.label.toLowerCase() : "";
    var _sName  = S ? S.label : "";

    if(tmpl==="sopa_crema") {
      // Lead with the vegetable — that's what makes a cream soup
      var creamVeg = V ? V.label : (V2 ? V2.label : "verduras");
      title = "Crema de "+creamVeg.toLowerCase()
              + (V2&&V?" y "+v2Name:"")
              + (P?" · "+pName+" encima":"");
    } else if(tmpl==="ensalada") {
      // Lead with the protein and the dressing feeling
      var _ensC = C ? " con "+cName : "";
      title = pName ? (pName.charAt(0).toUpperCase()+pName.slice(1))+" en ensalada"+_ensC
                    : "Ensalada variada"+_ensC;
    } else if(tmpl==="bowl") {
      // Bowl: sauce defines character
      var bowlChar = spec.S==="soja_jengibre"   ? "asiático"
                   : spec.S==="curry_ligero"    ? "de curry"
                   : spec.S==="limon_hierbas"   ? "mediterráneo"
                   : spec.S==="tomate_casero"   ? "con tomate"
                   : "proteico";
      title = "Bowl "+bowlChar+" de "+pName+(C?" con "+cName:"");
    } else if(tmpl==="pasta") {
      // Pasta: sauce or companion defines name
      var sauceName = spec.S==="tomate_casero"  ? "al pomodoro"
                    : spec.S==="ajillo"          ? "al ajillo"
                    : spec.S==="curry_ligero"    ? "al curry"
                    : "con proteína";
      title = (C?C.label:"Pasta")+" "+sauceName+(P?" con "+pName:"");
    } else if(tmpl==="legumbre") {
      // Legume: cooking method and veg define character
      var legName = P ? P.label : "Legumbres";
      var legChar = spec.S==="curry_ligero"  ? " al curry"
                  : spec.S==="pimenton_ajo"  ? " con pimentón"
                  : spec.S==="ajillo"        ? " al ajillo"
                  : " estofadas";
      title = legName+legChar+(V?" con "+vName:"");
    } else {
      // caliente_clasico — lead with cook method + sauce character, not just protein name
      var methodChar = cookM==="horno"    ? "al horno"
                     : cookM==="guisado"  ? "guisado"
                     : cookM==="salteado" ? "salteado"
                     : cookM==="vapor"    ? "al vapor"
                     : cookM==="revuelto" ? "revuelto"
                     : cookM==="tortilla" ? "en tortilla"
                     : "a la plancha";
      var sauceChar  = spec.S==="limon_hierbas" ? " con limón y hierbas"
                     : spec.S==="mostaza_miel"  ? " con mostaza y miel"
                     : spec.S==="soja_jengibre" ? " con soja y jengibre"
                     : spec.S==="ajillo"        ? " al ajillo"
                     : spec.S==="provenzal"     ? " provenzal"
                     : spec.S==="curry_ligero"  ? " al curry"
                     : spec.S==="pimenton_ajo"  ? " con pimentón"
                     : spec.S==="romero_limon"  ? " con romero y limón"
                     : spec.S==="vinagreta"     ? " en vinagreta"
                     : "";
      // Special overrides for known classic dishes — platos con identidad fuerte
      // Cuando el usuario ve el nombre, lo recuerda. No "pavo a la plancha", sino algo real.
      var classicTitle = null;
      // Ave
      if(spec.P==="pollo"&&spec.C==="arroz"&&cookM==="plancha") classicTitle="Pollo a la plancha con arroz";
      if(spec.P==="pollo"&&spec.C==="arroz"&&cookM==="horno")   classicTitle="Pollo al horno con arroz y pimientos";
      if(spec.P==="pollo"&&spec.C==="patata"&&cookM==="horno")  classicTitle="Pollo asado al romero con patatas";
      if(spec.P==="pollo"&&spec.S==="mostaza_miel")             classicTitle="Pollo con salsa de mostaza y miel";
      if(spec.P==="pollo"&&spec.S==="soja_jengibre")            classicTitle="Pollo teriyaki con verduras";
      if(spec.P==="pollo"&&spec.S==="curry_ligero")             classicTitle="Pollo al curry con arroz";
      if(spec.P==="pollo"&&spec.V==="pimientos"&&cookM==="horno") classicTitle="Pollo al horno con pimientos y cebolla";
      if(spec.P==="pollo"&&spec.V==="berenjena"&&cookM==="horno") classicTitle="Pollo provenzal con berenjena al horno";
      if(spec.P==="pavo"&&spec.S==="curry_ligero")              classicTitle="Pavo al curry con calabacín";
      if(spec.P==="pavo"&&spec.S==="mostaza_miel")              classicTitle="Filete de pavo con mostaza y miel";
      if(spec.P==="pavo"&&cookM==="plancha"&&spec.V==="judias") classicTitle="Pavo a la plancha con judías verdes";
      if(spec.P==="conejo"&&cookM==="horno")                    classicTitle="Conejo al horno con patatas y ajo";
      if(spec.P==="conejo"&&spec.S==="ajillo")                  classicTitle="Conejo al ajillo";
      // Vacuno
      if(spec.P==="ternera"&&spec.C==="patata"&&cookM==="plancha") classicTitle="Ternera a la plancha con patatas";
      if(spec.P==="ternera"&&cookM==="guisado")                 classicTitle="Estofado de ternera con verduras";
      if(spec.P==="ternera"&&spec.S==="romero_limon")           classicTitle="Solomillo de ternera al romero con limón";
      if(spec.P==="ternera"&&spec.S==="soja_jengibre")          classicTitle="Ternera salteada al wok con soja";
      // Cerdo
      if(spec.P==="cerdo"&&spec.S==="mostaza_miel")             classicTitle="Solomillo de cerdo con mostaza y miel";
      if(spec.P==="cerdo"&&spec.S==="romero_limon")             classicTitle="Lomo de cerdo al romero con boniato";
      if(spec.P==="cerdo"&&cookM==="plancha"&&spec.C==="patata")classicTitle="Lomo de cerdo a la plancha con patatas";
      if(spec.P==="cerdo"&&spec.V==="pimientos"&&cookM==="horno") classicTitle="Cerdo al horno con pimientos asados";
      // Pescado
      if(spec.P==="salmon"&&spec.C==="boniato")                 classicTitle="Salmón al horno con boniato asado";
      if(spec.P==="salmon"&&spec.S==="soja_jengibre")           classicTitle="Salmón teriyaki con quinoa y espinacas";
      if(spec.P==="salmon"&&spec.S==="limon_hierbas")           classicTitle="Salmón al horno con limón y eneldo";
      if(spec.P==="salmon"&&spec.S==="mostaza_miel")            classicTitle="Salmón lacado con mostaza y miel";
      if(spec.P==="merluza"&&spec.C==="patata"&&spec.S==="ajillo") classicTitle="Merluza al ajillo con patatas";
      if(spec.P==="merluza"&&spec.S==="limon_hierbas")          classicTitle="Merluza al horno con limón y hierbas";
      if(spec.P==="merluza"&&spec.V==="judias")                 classicTitle="Merluza al horno con judías verdes";
      if(spec.P==="bacalao"&&spec.C==="patata"&&spec.S==="ajillo") classicTitle="Bacalao al ajillo con patatas";
      if(spec.P==="bacalao"&&spec.V==="pimientos")              classicTitle="Bacalao con pimientos asados";
      if(spec.P==="dorada"&&cookM==="horno")                    classicTitle="Dorada al horno con patatas y limón";
      if(spec.P==="sardinas"&&spec.S==="ajillo")                classicTitle="Sardinas a la plancha con tomate";
      if(spec.P==="atun"&&spec.C==="arroz")                     classicTitle="Arroz con atún y verduras";
      // Marisco
      if(spec.P==="gambas"&&spec.C==="arroz")                   classicTitle="Arroz con gambas al ajillo";
      if(spec.P==="gambas"&&cookM==="plancha")                  classicTitle="Gambas a la plancha con ajo y limón";
      if(spec.P==="calamares"&&spec.C==="arroz")                classicTitle="Calamares encebollados con arroz";
      if(spec.P==="calamares"&&cookM==="plancha")               classicTitle="Calamares a la plancha con alioli";
      // Legumbres — los más memorables
      if(spec.P==="lentejas")   classicTitle="Lentejas estofadas"+(spec.S==="pimenton_ajo"?" con pimentón ahumado":"");
      if(spec.P==="garbanzos"&&spec.V==="espinacas") classicTitle="Garbanzos con espinacas al pimentón";
      if(spec.P==="garbanzos"&&spec.S==="curry_ligero") classicTitle="Garbanzos al curry con brocoli";
      if(spec.P==="alubias")    classicTitle="Alubias estofadas con verduras";
      // Huevo
      if(spec.P==="huevo"&&cookM==="tortilla") classicTitle="Tortilla de "+(V?vName:"verduras");
      if(spec.P==="huevo"&&cookM==="revuelto") classicTitle="Revuelto de "+(V?vName:"verduras");
      if(spec.P==="huevo"&&cookM==="plancha")  classicTitle="Huevos a la plancha con "+(V?vName:"verduras");
      // Vida real — nuevos títulos
      if(spec.P==="huevo"&&spec.C==="arroz"&&cookM==="revuelto") classicTitle="Arroz con huevo revuelto y "+( V?vName:"verduras");
      if(spec.P==="huevo"&&spec.C==="patata"&&cookM==="tortilla") classicTitle="Tortilla con patata y "+(V?vName:"verduras");
      if(spec.P==="atun"&&spec.C==="arroz"&&cookM==="crudo") classicTitle="Arroz con atún, tomate y limón";
      if(spec.P==="sardinas"&&spec.C==="patata") classicTitle="Sardinas a la plancha con patatas y pimientos";
      if(spec.P==="ternera"&&spec.C==="pasta"&&cookM==="salteado") classicTitle="Pasta con ternera y salsa de tomate";
      if(spec.P==="pollo"&&spec.C==="pasta"&&spec.S==="pimenton_ajo") classicTitle="Pasta con pollo al pimentón";
      if(spec.P==="pollo"&&spec.C==="pasta"&&spec.S==="ajillo") classicTitle="Pasta con pollo al ajillo y espinacas";
      if(spec.P==="lentejas"&&spec.C==="arroz") classicTitle="Lentejas con arroz al pimentón";
      if(spec.P==="merluza"&&spec.C==="arroz"&&spec.S==="ajillo") classicTitle="Arroz con merluza al ajillo";
      // Cenas especiales
      if(spec.P==="salmon"&&!spec.C&&spec.V==="espinacas") classicTitle="Salmón a la plancha con espinacas salteadas";
      if(spec.P==="merluza"&&!spec.C&&spec.V==="judias")   classicTitle="Merluza al horno con judías y limón";
      if(spec.P==="bacalao"&&!spec.C)                       classicTitle="Bacalao a la plancha con verduras";
      if(spec.P==="pollo"&&!spec.C&&spec.V==="coles")      classicTitle="Pollo al horno con coles de Bruselas";
      if(spec.P==="ternera"&&!spec.C&&spec.S==="ajillo")   classicTitle="Ternera al ajillo con pimientos";

      title = classicTitle ||
              (P?(P.label.charAt(0).toUpperCase()+P.label.slice(1).toLowerCase()):"")+
              " "+methodChar+sauceChar+
              (V?" con "+vName:"")+
              (C?" y "+cName:"");
    }
    title = title.trim().replace(/\s+/g," ");
    if(spec.title) title = spec.title; // training dinners override

    // ── Build p1, p2 ──
    var p1, p2;
    // Stable key for deterministic template selection — same combo → same wording always
    var _comboKey = (spec.P||"")+(spec.C||"")+(spec.V||"")+(spec.S||"")+(spec.cookM||"");
    if(tmpl==="sopa_crema") {
      p1 = (V?rv(spec.V,V.base)+"g de "+V.label.toLowerCase():"")+(V2?" y "+rv(spec.V2,V2.base)+"g "+V2.label.toLowerCase():"")+", caldo y cebolla · "+rp(10)+"ml AOVE";
      p2 = (P?"+ "+pLabel+" "+cookDesc+" encima":"")+(S?" · aliñada con "+sLabel:"")+" · sal y pimienta";
    } else if(tmpl==="ensalada") {
      p1 = pLabel+(cookM!=="crudo"?" "+cookDesc:"")+" · "+(V?vLabel:"")+( V2?" + "+v2Label:"")+(S?" · "+sLabel:"");
      p2 = (C?cLabel+" de base":"")+(!C&&V2?v2Label:"")+" · "+rv(15)+"ml AOVE + vinagre de Módena · sal";
    } else if(tmpl==="bowl") {
      // Template already embeds the cooking method — no cookDesc suffix needed
      p1 = renderP1Tmpl(pickP1Template(cookM, _comboKey), pLabel, S ? sLabel : "");
      p2 = cLabel+" de base · "+(V?vLabel+" "+V.cookHint:"verduras de temporada")+(V2?" + "+v2Label:"")+" · "+rv(10)+"ml AOVE";
    } else if(tmpl==="pasta") {
      p1 = cLabel+" cocida al dente · "+pLabel+(S?" · salsa de "+sLabel:"");
      p2 = (V?vLabel+" incorporada":"")+(!V?V2?v2Label:"":"")+(V&&V2?" + "+v2Label:"")+" · "+rv(10)+"ml AOVE · queso rallado al gusto";
    } else if(tmpl==="legumbre") {
      p1 = pLabel+(S?" con "+sLabel:" guisadas con laurel y pimentón")+" · caldo de verduras";
      p2 = (V?vLabel+" añadida":"")+(V2?" + "+v2Label:"")+" · sal, comino · "+rv(10)+"ml AOVE";
    } else {
      // caliente_clasico / plancha_verdura / pescado_horno / huevo_plancha
      // Template already embeds the cooking method — append only AOVE suffix
      var _dBase = renderP1Tmpl(pickP1Template(cookM, _comboKey), pLabel, S ? sLabel : "");
      p1 = _dBase + " · " + pickAoveSuffix(rv(10), _comboKey);
      p2 = (C?cLabel+(C.cook?" — "+C.cook:"")+"":" ")+(V?" · "+vLabel+" "+V.cookHint:"")+(V2?" + "+v2Label:"")||"Verdura de temporada";
    }

    // ── Build shopping list ──
    var shopping = [];
    if(P) shopping.push(P.unit==="ud"?P.label+" ("+rpFor(spec.P,targetKcal)+" ud)":P.label+" ("+rpFor(spec.P,targetKcal)+"g)");
    if(C) shopping.push(C.label+" ("+rcFor(spec.C,targetKcal)+"g)");
    if(V) shopping.push(V.label+" ("+rv(spec.V,V.base)+"g)");
    if(V2)shopping.push(V2.label+" ("+rv(spec.V2,V2.base)+"g)");
    if(S) shopping.push(S.label.split(" y ")[0]+" (condimento)");
    shopping.push("AOVE");
    shopping.push("Sal y especias básicas");

    // ── Build recipe steps ──
    var steps = [];
    if(C && C.time > 0) {
      // C step applies to all templates — for ensalada note to cool before adding
      var _cNote = tmpl==="ensalada" ? " Enfriar antes de añadir a la ensalada." : "";
      steps.push(C.label+": "+C.cook+" — "+C.time+" min"+_cNote+".");
    }
    if(P && tmpl!=="legumbre") {
      if(S) steps.push(
        cookM==="horno"    ? "Sazona "+P.label.toLowerCase()+" con "+sLabel+" y deja reposar 5 min." :
        cookM==="salteado" ? "Mezcla "+P.label.toLowerCase()+" con "+sLabel+" justo antes de saltear." :
        cookM==="guisado"  ? "Incorpora "+sLabel+" al guiso de "+P.label.toLowerCase()+"." :
        cookM==="crudo"    ? "Aliña "+P.label.toLowerCase()+" con "+sLabel+" y deja macerar 10 min." :
        cookM==="revuelto" ? "Bate "+P.label.toLowerCase()+" con "+sLabel+"." :
        cookM==="tortilla" ? "Mezcla "+P.label.toLowerCase()+" con "+sLabel+" antes de cuajar." :
        "Aliña "+P.label.toLowerCase()+" con "+sLabel+" antes de cocinar."
      );
      var cookInstr = cookM==="horno" ? "Hornea a 200°C unos 20-25 min" :
                      cookM==="guisado" ? "Cuece a fuego suave 25-30 min con caldo" :
                      cookM==="vapor" ? "Cuece al vapor 12-15 min" :
                      cookM==="revuelto" ? "Saltea a fuego medio 3-4 min removiendo" :
                      cookM==="tortilla" ? "Cuaja a fuego medio 3-4 min por lado" :
                      cookM==="crudo" ? "Escurre y reserva" :
                      "Cocina a fuego vivo 3-4 min por lado";
      steps.push(P.label+": "+cookInstr+".");
    }
    if(P && tmpl==="legumbre") {
      // Legumbre: P is the legume itself — needs its own cooking step
      steps.push((P.label)+": cocer a fuego suave 30-35 min con caldo, laurel y sal. Incorporar sofrito de ajo"+(S?", "+sLabel:"")+" y AOVE al final.");
    }
    if(V && tmpl!=="sopa_crema") steps.push(V.label+": "+V.cookHint+".");
    if(V2 && tmpl!=="sopa_crema") steps.push(V2.label+": "+V2.cookHint+".");
    if(tmpl==="sopa_crema") {
      steps.push("Sofríe cebolla picada con AOVE a fuego medio 5 min.");
      steps.push("Añade "+(V?V.label.toLowerCase()+" troceado":"la verdura")+(V2?" y "+V2.label.toLowerCase():"")+" y cubre con caldo.");
      steps.push("Cuece tapado a fuego suave 20 min.");
      steps.push("Tritura con batidora hasta textura suave. Ajusta de sal.");
      steps.push(P?"Sirve la crema y coloca "+P.label.toLowerCase()+" "+cookDesc+" encima.":"Sirve y añade un chorrito de AOVE.");
    }
    if(steps.length < 2) steps.push("Emplata combinando todos los ingredientes. Ajusta de sal y pimienta.");
    steps.push("Sirve inmediatamente. Puedes preparar "+(C&&C.time>15?"el "+C.label.toLowerCase()+" con antelación":"los ingredientes")+" la noche anterior.");

    // ── Metadata for smartPick ──
    var _portionForProteinG = P ? rpFor(spec.P,targetKcal) : 0;
    var _proteinG = P
      ? (P.unit==="ud"
        ? Math.round(_portionForProteinG * (P.protDensity||6))
        : Math.round(_portionForProteinG * (P.protDensity||25) / 100))
      : 0;
    var metadata = {
      saciedad: (V && V.saciante) || tmpl==="sopa_crema" ? "alta" : tmpl==="ensalada" ? "media" : "media",
      facilidad: (P && P.facil && (!C || C.time <= 20)) ? "alta" : "media",
      tiempo: Math.max(C?C.time:0, P&&P.cook[0]==="horno"?25:10),
      familiar: (P&&P.familiar) && (V?V.familiar:true),
      comfort: tmpl==="legumbre"||tmpl==="sopa_crema",
      plateType: spec.plateType || null,
      proteinG: _proteinG,
    };

    const __result = {time:time, emoji:emoji, title:title, p1:p1, p2:p2, shopping:shopping, recipe:steps, metadata:metadata,
            _spec:spec};
    __PERF.measure("composeMeal", __t0);  // PERF
    return __result;
  }

  // ── COMBO LIBRARIES ───────────────────────────────────────────────────────
  // Each entry is a lightweight spec — composeMeal() builds the full meal.
  // Columns: tmpl, P(rotein), C(arb), V(eggie), V2, S(auce), cookM, plateType, density, familiar, facil, saciante

  const LUNCH_COMBOS = [
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
  ].filter(function(m){
    if(noFish    && (PROT[m.P]&&PROT[m.P].isFish))     return false;
    if(noFish    && (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noMariscos&& (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noPork    && (PROT[m.P]&&PROT[m.P].isPork))     return false;
    if(noEgg     && (PROT[m.P]&&PROT[m.P].isEgg))      return false;
    if(noLegumes && (PROT[m.P]&&PROT[m.P].isLegume))   return false;
    if(noGluten  && m.tmpl==="pasta")                   return false;
    // HARD RULE: eliminatedFoods — never serve, no exceptions
    if(isEliminated(m.P)) return false;
    if(isEliminated(m.C)) return false;
    return true;
  }).map(function(m){return Object.assign({slot:"Comida"}, m);});

  // ── DINNER COMBOS ─────────────────────────────────────────────────────────
  // Dinners: lower density, veg-forward, no dense carbs unless training day
  const DINNER_COMBOS = [
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
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"brocoli",    S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"media", saciante:false},
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
    {tmpl:"caliente_clasico", P:"cerdo",   C:null,  V:"brocoli",    S:"mostaza_miel",  cookM:"plancha", plateType:"plancha_verdura", density:"baja",  saciante:false},
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
  ].filter(function(m){
    if(!m.P) return true;
    if(noFish    && (PROT[m.P]&&(PROT[m.P].isFish||PROT[m.P].isSeafood))) return false;
    if(noMariscos&& (PROT[m.P]&&PROT[m.P].isSeafood))  return false;
    if(noPork    && (PROT[m.P]&&PROT[m.P].isPork))     return false;
    if(noEgg     && (PROT[m.P]&&PROT[m.P].isEgg))      return false;
    // HARD RULE: eliminatedFoods — no exceptions
    if(isEliminated(m.P)) return false;
    return true;
  }).map(function(m){return Object.assign({slot:"Cena"}, m);});

  // ── BREAKFAST COMBOS ──────────────────────────────────────────────────────
  const BF_PORTIONS = {
    fat_loss_general:          {avena:50, pan:50, huevos:2, claras:4},
    definicion_saciante:       {avena:50, pan:50, huevos:2, claras:3},
    definicion_flexible:       {avena:45, pan:45, huevos:2, claras:4},
    mantenimiento_equilibrado: {avena:55, pan:60, huevos:3, claras:4},
    volumen_limpio:            {avena:65, pan:70, huevos:4, claras:5},
    volumen_agresivo:          {avena:75, pan:80, huevos:4, claras:6},
  };

  const bfP =
    BF_PORTIONS[strategy] ||
    BF_PORTIONS.mantenimiento_equilibrado;

  const BF = {
    avenaFresas:    function(){return {time:"Desayuno",emoji:"🌅",title:"Avena caliente con fresas"+(noNuts?"":" y nueces"),
      p1:"Avena ("+bfP.avena+"g) cocida con "+milk+" · 100g fresas"+(noNuts?"":" · 20g nueces"),
      p2:yogur+" · canela · Café o té",
      shopping:["Avena ("+bfP.avena+"g)","Leche o bebida vegetal (200ml)","Fresas (100g)",(noNuts?"":"Nueces (20g)"),"Yogur griego 0% (125g)","Canela"].filter(Boolean),
      recipe:["Calienta la leche a fuego medio.","Añade la avena y remueve 5 min.","Trocea las fresas, añádelas encima.",(noNuts?"":"Añade las nueces."),"Sirve con el yogur aparte y canela."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:8,familiar:true}};},
    avenaFrio:      function(){return {time:"Desayuno",emoji:"🌅",title:"Avena overnight con fruta"+(noNuts?"":" y pistachos"),
      p1:"Avena ("+bfP.avena+"g) + "+yogur+" + 100g fruta de temporada"+(noNuts?"":" + 20g pistachos")+" · preparar noche anterior",
      p2:"Canela · Café o té",
      shopping:["Avena ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta de temporada (100g)",(noNuts?"":"Pistachos (20g)"),"Canela"].filter(Boolean),
      recipe:["Noche anterior: mezcla avena y yogur en bote.","Trocea la fruta y añade encima.","Tapa y refrigera 8h mínimo.","Por la mañana añade pistachos y canela.",(noNuts?"":"Consume frío.")].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:2,familiar:true}};},
    tostadas:       function(){return {time:"Desayuno",emoji:"🌅",title:"Tostadas con tomate y jamón",
      p1:"2 rebanadas pan de centeno ("+bfP.pan+"g) · tomate rallado (70g) · AOVE",
      p2:"2 lonchas jamón serrano (40g) · "+yogur,
      shopping:["Pan de centeno ("+bfP.pan+"g)","Tomate maduro (1 ud)","Jamón serrano (40g)","Yogur griego 0% (125g)","AOVE"],
      recipe:["Tuesta el pan.","Ralla el tomate maduro encima.","Añade AOVE y sal.","Coloca el jamón.","Sirve el yogur aparte."],
      metadata:{facilidad:"alta",tiempo:5,familiar:true}};},
    huevosTostada:  function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos revueltos con tostada y fruta",
      p1:bfP.huevos+" huevos revueltos con pizca de sal y pimienta · ½ cda AOVE",
      p2:"1 tostada pan integral ("+bfP.pan+"g) · "+yogur+" · 1 pieza fruta de temporada",
      shopping:["Huevos ("+bfP.huevos+" ud)","Pan integral ("+bfP.pan+"g)","Yogur griego 0% (125g)","AOVE","Fruta de temporada (1 ud)"],
      recipe:["Bate los huevos con sal y pimienta.","Calienta la sartén con AOVE a fuego medio.","Añade los huevos y remueve despacio 2-3 min.","Tuesta el pan.","Sirve los huevos encima o al lado, con la fruta troceada."],
      metadata:{facilidad:"alta",tiempo:6,familiar:true}};},
    huevoAguacate:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tostada con aguacate y huevo poché",
      p1:"1 rebanada pan integral ("+bfP.pan+"g) tostada · ½ aguacate maduro chafado",
      p2:"1 huevo poché · sal, pimienta y limón · Café",
      shopping:["Pan integral ("+bfP.pan+"g)","Aguacate (1 ud)","Huevos (1 ud)","Limón (½)","Sal y pimienta"],
      recipe:["Tuesta el pan.","Chafa el aguacate con limón y sal.","Para el huevo poché: hierve agua con un chorrito de vinagre, crea un remolino y cuece el huevo 3 min.","Extiende el aguacate sobre la tostada.","Coloca el huevo encima."],
      metadata:{facilidad:"media",tiempo:10,familiar:true}};},
    tostadaSalmon:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tostada con salmón ahumado y queso",
      p1:"2 tostadas pan de centeno ("+bfP.pan+"g) · 60g salmón ahumado",
      p2:"30g queso crema light · alcaparras · eneldo · Café o té",
      shopping:["Pan de centeno ("+bfP.pan+"g)","Salmón ahumado (60g)","Queso crema light (30g)","Alcaparras","Eneldo"],
      recipe:["Tuesta el pan ligeramente.","Extiende el queso crema.","Coloca el salmón encima.","Añade alcaparras y eneldo.","Sirve inmediatamente."],
      metadata:{facilidad:"alta",tiempo:4,familiar:true}};},
    revueltoVerduras:function(){return {time:"Desayuno",emoji:"🌅",title:"Revuelto de espinacas y tomate",
      p1:bfP.huevos+" huevos revueltos · 60g espinacas frescas salteadas · 60g tomate cherry",
      p2:"1 tostada pan integral ("+bfP.pan+"g) · "+yogur+" · sal, pimienta, orégano",
      shopping:["Huevos ("+bfP.huevos+" ud)","Espinacas frescas (60g)","Tomate cherry (60g)","Pan integral ("+bfP.pan+"g)","Yogur griego 0% (125g)","AOVE"],
      recipe:["Saltea las espinacas con AOVE y ajo 2 min.","Añade el tomate cherry cortado.","Bate los huevos, añade al wok.","Remueve a fuego medio hasta cuajar suave.","Sirve sobre la tostada con el yogur aparte."],
      metadata:{facilidad:"media",tiempo:8,familiar:true}};},
    yogurGranola:   function(){return {time:"Desayuno",emoji:"🌅",title:"Bol de yogur con granola y fruta",
      p1:"200g "+yogur+" · "+bfP.avena+"g granola sin azúcar añadido · 100g fruta de temporada",
      p2:"1 cda miel · Café o té",
      shopping:["Yogur griego 0% (200g)","Granola ("+bfP.avena+"g) — comprueba que sea sin gluten si lo necesitas","Fruta de temporada (100g)","Miel (1 cda)"],
      recipe:["Vierte el yogur en un bol.","Trocea la fruta y colócala encima.","Añade la granola.","Rocía con miel.","Consume inmediatamente para que la granola cruja."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},
    tortitasAvena:  function(){return {time:"Desayuno",emoji:"🌅",title:"Tortitas de avena y plátano",
      p1:"Avena (60g) + 1 plátano + 2 huevos · triturado y cocinado",
      p2:yogur+" · 1 cda miel · Café",
      shopping:["Avena (60g)","Plátano (1 ud)","Huevos (2 ud)","Yogur griego 0% (125g)","Miel (1 cda)"],
      recipe:["Tritura avena, plátano y huevos hasta masa homogénea.","Calienta sartén antiadherente a fuego medio con unas gotas AOVE.","Vierte círculos de masa y cocina 2 min por lado.","Sirve con yogur y miel.","Puedes preparar la masa la noche anterior."],
      metadata:{facilidad:"media",tiempo:12,familiar:true}};},
    muesliYogur:    function(){return {time:"Desayuno",emoji:"🌅",title:"Muesli con yogur y frutos secos",
      p1:bfP.avena+"g muesli sin azúcar añadido · "+yogur+" · 80g fruta fresca",
      p2:(noNuts?"Semillas de lino (8g)":"15g almendras o nueces")+" · Café o té",
      shopping:["Muesli sin azúcar ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta fresca (80g)",(noNuts?"Semillas de lino (8g)":"Almendras (15g)")].filter(Boolean),
      recipe:["Vierte el muesli en un bol.","Añade el yogur.","Trocea la fruta y coloca encima.","Añade los frutos secos."+(noNuts?" Sustituye por semillas de lino":""),"Deja reposar 1-2 min para que el muesli se ablande ligeramente."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},
  };

  // ── DESAYUNOS SIN GLUTEN — alternativas cuando noGluten=true ─────────────
  const BF_SG = {
    claras_tortillaSG:function(){return {time:"Desayuno",emoji:"🌅",title:"Claras a la plancha con espinacas, tomate y fruta",
      p1:bfP.claras+" claras de huevo · 60g espinacas · 1 tomate en rodajas",
      p2:yogur+" · 1 pieza fruta de temporada · AOVE, ajo en polvo · Café o té",
      shopping:["Claras de huevo ("+bfP.claras+" ud o brik)","Espinacas frescas (60g)","Tomate (1 ud)","Yogur griego 0% (125g)","Fruta de temporada (1 ud)","AOVE","Ajo en polvo"],
      recipe:["Saltea las espinacas en sartén con AOVE y ajo en polvo 2 min.","Retira y reserva.","Bate las claras con sal y pimienta.","Cuaja las claras a fuego medio removiendo suave.","Sirve con las espinacas, el tomate crudo en rodajas, el yogur y la fruta."],
      metadata:{facilidad:"alta",tiempo:7,familiar:false}};},

    macedoniaProtSG:  function(){return {time:"Desayuno",emoji:"🌅",title:"Macedonia con yogur y semillas",
      p1:"200g mezcla de frutas frescas · 150g "+yogur,
      p2:"1 cda semillas de calabaza · zumo de ½ limón · miel · Café",
      shopping:["Frutas frescas variadas (200g)","Yogur griego 0% (150g)","Semillas de calabaza (10g)","Limón (½ ud)","Miel (1 cda)"],
      recipe:["Trocea las frutas en dados del mismo tamaño.","Aliña con zumo de limón y miel.","Sirve en bol con el yogur encima.","Esparce las semillas de calabaza.","Puede prepararse la noche anterior sin el yogur."],
      metadata:{facilidad:"alta",tiempo:5,familiar:true}};},

    bolChia: function(){return {time:"Desayuno",emoji:"🌅",title:"Bol de chía con frutas del bosque",
      p1:"150g "+yogur+" · 2 cdas semillas de chía · 100g frutas del bosque",
      p2:"1 cda miel · canela al gusto · Café o té",
      shopping:["Yogur griego 0% (150g)","Semillas de chía (20g)","Frutas del bosque (100g)","Miel (1 cda)"],
      recipe:["Mezcla el yogur con las semillas de chía.","Deja reposar 5 minutos (o prepara la noche anterior).","Añade las frutas por encima.","Aliña con miel y canela al gusto."],
      metadata:{facilidad:"alta",tiempo:5,familiar:false}};},

    yogurSemillas: function(){return {time:"Desayuno",emoji:"🌅",title:"Yogur con semillas y fruta",
      p1:"200g "+yogur+" · 1 cda semillas de lino · 1 cda semillas de calabaza",
      p2:"1 pieza fruta troceada · miel · Café o té",
      shopping:["Yogur griego 0% (200g)","Semillas de lino (10g)","Semillas de calabaza (10g)","Fruta (1 ud)","Miel (1 cda)"],
      recipe:["Vierte el yogur en un bol.","Esparce las semillas por encima.","Añade la fruta troceada.","Aliña con miel al gusto."],
      metadata:{facilidad:"alta",tiempo:3,familiar:true}};},

    batiProteicoSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Batido proteico con plátano",
      p1:"250ml leche o bebida vegetal · 1 plátano maduro · 150g "+yogur,
      p2:"1 cda mantequilla de cacahuete · canela · Café o té",
      shopping:["Leche o bebida vegetal (250ml)","Plátano (1 ud)","Yogur griego 0% (150g)","Mantequilla de cacahuete (15g)"],
      recipe:["Pon todos los ingredientes en el vaso de la batidora.","Tritura hasta obtener una mezcla homogénea.","Sirve frío inmediatamente.","Puedes añadir hielo si lo prefieres más fresco."],
      metadata:{facilidad:"alta",tiempo:3,familiar:false}};},

    huevosAguacateSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos revueltos con aguacate",
      p1:bfP.huevos+" huevos · ½ aguacate maduro",
      p2:"AOVE, sal y pimienta · Café o té",
      shopping:["Huevos ("+bfP.huevos+" ud)","Aguacate (1 ud)","AOVE"],
      recipe:["Bate los huevos con sal y pimienta.","Cuaja a fuego lento removiendo constantemente.","Corta el aguacate en láminas.","Sirve los huevos con el aguacate al lado."],
      metadata:{facilidad:"alta",tiempo:7,familiar:true}};},

    tortillaDulce: function(){return {time:"Desayuno",emoji:"🌅",title:"Tortilla de claras con plátano",
      p1:"4 claras de huevo · 1 plátano pequeño",
      p2:"canela · 1 cda miel · Café o té",
      shopping:["Claras de huevo (4 ud o brik)","Plátano (1 ud)","Canela","Miel (1 cda)"],
      recipe:["Bate las claras con canela.","Cuaja en sartén antiadherente a fuego medio.","Dobla la tortilla.","Sirve con el plátano en rodajas y miel por encima."],
      metadata:{facilidad:"alta",tiempo:7,familiar:false}};},

    huevosJamonSG: function(){return {time:"Desayuno",emoji:"🌅",title:"Huevos a la plancha con jamón y fruta",
      p1:bfP.huevos+" huevos · 40g jamón serrano o pavo",
      p2:"1 pieza fruta de temporada · AOVE, sal y pimienta · Café o té",
      shopping:["Huevos ("+bfP.huevos+" ud)","Jamón serrano o pavo (40g)","Fruta de temporada (1 ud)","AOVE"],
      recipe:["Calienta la sartén con unas gotas de AOVE.","Cocina los huevos al gusto (plancha o revuelto).","Calienta el jamón brevemente en la sartén.","Sirve juntos con sal y pimienta y la fruta al lado."],
      metadata:{facilidad:"alta",tiempo:6,familiar:true}};},

    smoothieBol: function(){return {time:"Desayuno",emoji:"🌅",title:"Smoothie bol de frutas",
      p1:"150g frutas congeladas (mango, plátano o frutos rojos) · 100g "+yogur,
      p2:"1 cda semillas de calabaza · 1 cda coco rallado · Café o té",
      shopping:["Frutas congeladas (150g)","Yogur griego 0% (100g)","Semillas de calabaza (10g)","Coco rallado (10g)"],
      recipe:["Tritura las frutas congeladas con el yogur hasta textura espesa.","Vierte en un bol.","Decora con semillas y coco rallado.","Sirve inmediatamente — se derrite rápido."],
      metadata:{facilidad:"alta",tiempo:5,familiar:false}};},

    quesoCottonFruta: function(){return {time:"Desayuno",emoji:"🌅",title:"Queso fresco con fruta y miel",
      p1:"200g queso fresco batido (tipo Skyr o Quark) · 150g fruta de temporada",
      p2:"1 cda miel · canela · Café o té",
      shopping:["Queso fresco batido tipo Skyr (200g)","Fruta de temporada (150g)","Miel (1 cda)","Canela"],
      recipe:["Vierte el queso en un bol.","Trocea la fruta y colócala encima.","Aliña con miel y canela.","Listo en 2 minutos — ideal para días con prisa."],
      metadata:{facilidad:"alta",tiempo:2,familiar:true}};},
  };

  // ── SNACKS ────────────────────────────────────────────────────────────────
  const SNACKS_AM = [
    {time:"Almuerzo",emoji:"🍎",title:"Fruta con frutos secos",
      p1:"1 pieza fruta de temporada (manzana, pera, naranja o kiwi)",
      p2:(noNuts?"15g semillas de girasol":"20g nueces o almendras")+" · Té o agua",
      shopping:["Fruta (1 ud)",(noNuts?"Semillas de girasol (15g)":"Nueces o almendras (20g)")].filter(Boolean),
      recipe:["Lava y trocea la fruta.","Sirve con los frutos secos aparte.","Ideal para llevar en un táper."],
      metadata:{facilidad:"alta",tiempo:1,familiar:true},
      _spec:{recomposable:false}},
    {time:"Almuerzo",emoji:"🥛",title:"Yogur con fruta",
      p1:yogur+" · 80g fruta de temporada",
      p2:"1 cda miel · canela opcional",
      shopping:["Yogur griego 0% (125g)","Fruta (80g)","Miel (1 cda)"],
      recipe:["Vierte el yogur.","Trocea la fruta encima.","Añade miel y canela."],
      metadata:{facilidad:"alta",tiempo:2,familiar:true},
      _spec:{recomposable:false}},
  ];
  const SNACKS_PM = [
    {time:"Merienda",emoji:"🥛",title:"Merienda proteica",
      p1:""+yogur+" · 1 puñado frutos rojos (80g)"+(noNuts?"":" · 15g almendras"),
      p2:"Té o infusión",
      shopping:["Yogur griego 0% (125g)","Frutos rojos (80g)",(noNuts?"":"Almendras (15g)")].filter(Boolean),
      recipe:["Mezcla el yogur con los frutos rojos.",(noNuts?"":"Añade las almendras por encima."),"Sirve frío."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:2,familiar:true},
      _spec:{recomposable:false}},
    {time:"Merienda",emoji:"🍌",title:"Fruta con proteína",
      p1:"1 pieza fruta (plátano, kiwi o naranja)",
      p2:(noNuts?"":"20g cacahuetes naturales · ")+"Té o agua",
      shopping:["Fruta (1 ud)",(noNuts?"":"Cacahuetes naturales (20g)")].filter(Boolean),
      recipe:["Pela la fruta.","Sirve con los cacahuetes aparte.","Comer despacio para maximizar saciedad."].filter(Boolean),
      metadata:{facilidad:"alta",tiempo:1,familiar:true},
      _spec:{recomposable:false}},
  ];

  // ── TRAINING DINNERS (post-workout recovery) ──────────────────────────────
  const TRAINING_DINNERS = [
    {tmpl:"caliente_clasico", P:"pollo",   C:"arroz",   V:"brocoli",  S:"pimenton_ajo",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Pollo con arroz y brócoli",
     plateType:"caliente_arroz", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"ternera", C:"patata",  V:"espinacas",S:"romero_limon",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Ternera con patata",
     plateType:"caliente_patata", density:"media", saciante:false},
    {tmpl:"caliente_clasico", P:"pavo",    C:"boniato", V:"judias",   S:"curry_ligero",  cookM:"plancha", slot:"Cena 🏋️",
     emoji:"🏋️", title:"Post-entreno: Pavo con boniato",
     plateType:"caliente_boniato", density:"media", saciante:false},
  ];

  // ── POOL DERIVATION FROM COMBOS ───────────────────────────────────────────
  // Pools wrap combos with protein/plateType keys for smartPick scoring.
  // Each entry: {protein, plateType, density, saciante, familiar, facil, build()}

  // ── SISTEMA DE APETENCIA ──────────────────────────────────────────────────
  // Cada plato tiene tres puntuaciones latentes que describen su "feel":
  //   comfortScore  (0–3): calidez emocional — el guiso de la abuela, la sopa, el horno
  //   freshnessScore(0–3): ligereza — ensaladas, bowl, crudo, pescado, limón
  //   cravingScore  (0–3): memorabilidad — "¿me apetece esto?" — salsas potentes, platos icónicos
  // Se derivan automáticamente de las propiedades del combo.
  function computeApetencia(combo) {
    var tmpl  = combo.tmpl  || "";
    var cookM = combo.cookM || "";
    var sauce = combo.S     || "";
    var prot  = combo.P     || "";

    // comfortScore: calor emocional, cocina lenta, familiar
    var comfort = 0;
    if(tmpl==="sopa_crema")                                     comfort += 3;
    if(tmpl==="legumbre")                                       comfort += 2;
    if(cookM==="guisado")                                       comfort += 2;
    if(cookM==="horno" && combo.familiar)                       comfort += 1;
    if(sauce==="tomate_casero" || sauce==="pimenton_ajo")       comfort += 1;
    if(combo.familiar)                                          comfort += 1;
    comfort = Math.min(3, Math.round(comfort));

    // freshnessScore: ligereza, frescura, energía limpia
    var freshness = 0;
    if(tmpl==="ensalada")                                       freshness += 3;
    if(tmpl==="bowl")                                           freshness += 2;
    if(cookM==="crudo")                                         freshness += 2;
    if(cookM==="plancha" && !combo.familiar)                    freshness += 1;
    if(sauce==="limon_hierbas" || sauce==="vinagreta")          freshness += 1;
    if(prot && PROT[prot] && (PROT[prot].isFish||PROT[prot].isSeafood)) freshness += 1;
    freshness = Math.min(3, Math.round(freshness));

    // cravingScore: memorabilidad — "¿me apetece esto de verdad?"
    var craving = 0;
    if(sauce==="mostaza_miel" || sauce==="soja_jengibre")       craving += 2;
    if(sauce==="curry_ligero" || sauce==="ajillo")              craving += 1;
    if(tmpl==="pasta")                                          craving += 2;
    if(prot==="salmon"||prot==="gambas"||prot==="calamares")    craving += 1;
    if(prot==="conejo"||prot==="sardinas"||prot==="bacalao")    craving += 1;
    if(cookM==="guisado" && tmpl!=="legumbre")                  craving += 1;
    if(sauce==="romero_limon" && cookM==="horno")               craving += 1;
    craving = Math.min(3, Math.round(craving));

    return {comfort:comfort, freshness:freshness, craving:craving};
  }

  function comboToPoolEntry(combo) {
    var protKey = combo.P ? combo.P : (combo.tmpl==="legumbre"?"legumbre":"verdura");
    // Map protein families so weekly caps and same-day checks work by family
    if(PROT[combo.P] && PROT[combo.P].isLegume)   protKey = "legumbre";
    if(PROT[combo.P] && PROT[combo.P].isSeafood)  protKey = "marisco";
    if(PROT[combo.P] && PROT[combo.P].isFish)     protKey = "pescado"; // FIX: fish cap was never triggered
    // Derive culinary style from sauce, or from template type
    var sauceStyle = combo.S && SAUCE[combo.S] ? SAUCE[combo.S].style : null;
    var tmplStyle  = combo.tmpl==="bowl"    ? (combo.S==="soja_jengibre"||combo.S==="curry_ligero" ? "asiatico" : "moderno")
                   : combo.tmpl==="pasta"   ? "italiano"
                   : combo.tmpl==="legumbre"? "casero"
                   : combo.tmpl==="ensalada"? "mediterraneo"
                   : combo.tmpl==="sopa_crema" ? "casero"
                   : null;
    var ap  = computeApetencia(combo);
    var cxp = deriveCuisineExperience(combo);
    var tmp = deriveTempFeel(combo);
    return {
      protein:          protKey,
      plateType:        combo.plateType || "caliente_arroz",
      density:          combo.density   || "media",
      saciante:         combo.saciante  || false,
      familiar:         combo.familiar  || false,
      facil:            combo.facil     || false,
      sauce:            combo.S         || null,
      cookM:            combo.cookM     || null,
      veggie:           combo.V         || null,
      culinaryStyle:    sauceStyle || tmplStyle || "casero",
      cuisineExperience:cxp,
      tempFeel:         tmp,
      apetencia:        ap,
      build:            function(){ return composeMeal(combo); },
    };
  }

  // ── INFLATE FREEFORM v3.1 → POOL ENTRY ─────────────────────────────
  //
  // Adapta un combo freeForm al formato esperado por smartPick.
  //
  // Este patch NO añade scoring nuevo.
  // Solo crea compatibilidad estructural.
  //
  // La fuente de verdad completa viaja en _spec para futuros prompts
  // (Prompt 2B leerá behavior.satietyScore, digestiveLoad,
  // trainingProfile, etc).
  //
  // Los campos legacy sin equivalente directo se dejan en null.
  // Su comportamiento dependerá de las reglas existentes de smartPick.
  //
  // NO introducir inferencias nuevas aquí.
  //
  function inflateFreeFormForPool(combo) {
    // ── Filtro intolerancias freeForm (v3.2) ─────────────────────
    // noGluten y noLactosa vienen del closure de buildPlan,
    // igual que en el sistema legacy.
    // El campo puede ser undefined en combos v3.1 (sin auditar):
    // la comparación === true es deliberada para no excluir
    // combos que no declaran el campo.
    if (noGluten  && combo.identity.containsGluten  === true
        && combo.identity.glutenFreeAdaptable !== true) return null;
    if (noLactosa && combo.identity.containsLactosa === true) return null;
    // ── fin filtro intolerancias ──────────────────────────────────
    var id  = combo.identity  || {};
    var nut = combo.nutrition || {};
    var beh = combo.behavior  || {};

    return {
      // Campos usados por smartPick
      protein:           id.protein || null,
      type:              id.proteinType || null,
      plateType:         id.plateType || null,
      density:           nut.energyDensity || null,
      familiar:          (typeof beh.familiar !== "undefined")
                            ? beh.familiar
                            : null,

      // NO inferir scoring nuevo en este prompt
      facil:             null,
      saciante:          null,

      // Campos legacy sin equivalente estructural
      sauce:             null,
      cookM:             null,
      veggie:            null,
      culinaryStyle:     null,
      cuisineExperience: null,
      tempFeel:          null,
      apetencia:         null,

      // Build
      build: function() {
        return composeMeal(combo);
      },

      // Fuente de verdad v3.1
      _spec: Object.assign({}, combo, {
        freeForm: true
      })
    };
  }

  let lunchPool  = LUNCH_COMBOS.map(comboToPoolEntry);
  let dinnerPool = DINNER_COMBOS.map(comboToPoolEntry);

  // ── INJECT FREEFORM v3.1 INTO POOLS ───────────────────────────────
  //
  // Los combos freeForm conviven con los legacy.
  // smartPick sigue usando scoring legacy para todos.
  //
  // Distribución:
  //
  //   ["C"]        → lunchPool
  //   ["Ce"]       → dinnerPool
  //   ["C","Ce"]   → ambos
  //   ["Al"]       → NO inyectado todavía
  //
  // IMPORTANTE:
  // NO reutilizar la misma referencia de entry entre pools.
  // Cada pool recibe su propia entry independiente.
  //
  (function injectFreeFormIntoPools() {

    if (
      typeof FREEFORM_POOL === "undefined" ||
      !Array.isArray(FREEFORM_POOL)
    ) {
      return;
    }

    for (var i = 0; i < FREEFORM_POOL.length; i++) {

      var combo = FREEFORM_POOL[i];

      if (
        !combo ||
        !combo.behavior ||
        !Array.isArray(combo.behavior.slot)
      ) {
        continue;
      }

      var slots = combo.behavior.slot;

      if (slots.indexOf("C") >= 0) {
        var _lff = inflateFreeFormForPool(combo);
        if (_lff !== null) lunchPool.push(_lff);
      }

      if (slots.indexOf("Ce") >= 0) {
        var _dff = inflateFreeFormForPool(combo);
        if (_dff !== null) dinnerPool.push(_dff);
      }

      // slot "Al" NO se integra todavía
    }

  })();

  // ── SATURDAY FREE MEAL ────────────────────────────────────────────────────
  function libreComida(){
    return {time:"Comida",emoji:"🎉",title:"Comida libre 🎉",
      p1:"Hoy comes lo que más te apetezca — es parte del plan, no una trampa.",
      p2:"Intenta terminar cuando estés satisfecho, no lleno.",
      shopping:["Lo que tú elijas hoy"],
      recipe:["Disfruta sin culpa.","La flexibilidad integrada mejora la adherencia a largo plazo.","Vuelves al plan mañana sin dramas."],
      metadata:{facilidad:"alta",tiempo:0,familiar:true},
      _spec:{recomposable:false,isFree:true}};
  }

  // ── BREAKFAST POOL (anti-repetition + gluten/egg/fish aware) ────────────
  // Cada entrada: {key, fn, containsGluten, needsEgg, needsFish, sauce, cookM, veggie, protein}
  // REGLA: containsGluten=true → excluido si noGluten. Sin excepciones.
  var ALL_BF_ENTRIES = [
    // CON GLUTEN — solo aparecen si !noGluten
    {key:"avenaFresas",     fn:BF.avenaFresas,        containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_avena"},
    {key:"avenaFrio",       fn:BF.avenaFrio,           containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_avena"},
    {key:"tostadas",        fn:BF.tostadas,            containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"bf_jamon"},
    {key:"huevosTostada",   fn:BF.huevosTostada,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"revuelto", veggie:null,        protein:"huevo"},
    {key:"huevoAguacate",   fn:BF.huevoAguacate,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"tostadaSalmon",   fn:BF.tostadaSalmon,       containsGluten:true,  needsEgg:false, needsFish:true,  sauce:null,      cookM:null,       veggie:null,        protein:"salmon"},
    {key:"revueltoVerduras",fn:BF.revueltoVerduras,    containsGluten:true,  needsEgg:true,  needsFish:false, sauce:"ajillo",  cookM:"revuelto", veggie:"espinacas", protein:"huevo"},
    {key:"yogurGranola",    fn:BF.yogurGranola,        containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"tortitasAvena",   fn:BF.tortitasAvena,       containsGluten:true,  needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"muesliYogur",     fn:BF.muesliYogur,         containsGluten:true,  needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    // SIN GLUTEN — siempre disponibles (o cuando noGluten)
    {key:"bolChia",         fn:BF_SG.bolChia,          containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"yogurSemillas",   fn:BF_SG.yogurSemillas,    containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"batiProteicoSG",  fn:BF_SG.batiProteicoSG,  containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"huevosAguacateSG",fn:BF_SG.huevosAguacateSG,containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"revuelto", veggie:null,        protein:"huevo"},
    {key:"tortillaDulce",   fn:BF_SG.tortillaDulce,   containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"huevo"},
    {key:"huevosJamonSG",   fn:BF_SG.huevosJamonSG,  containsGluten:false, needsEgg:true,  needsFish:false, sauce:null,      cookM:"plancha",  veggie:null,        protein:"bf_jamon"},
    {key:"smoothieBol",     fn:BF_SG.smoothieBol,     containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"quesoCottonFruta",fn:BF_SG.quesoCottonFruta,containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
    {key:"claras_tortillaSG",fn:BF_SG.claras_tortillaSG,containsGluten:false,needsEgg:true, needsFish:false, sauce:"ajillo",  cookM:"plancha",  veggie:"espinacas", protein:"huevo"},
    {key:"macedoniaProtSG", fn:BF_SG.macedoniaProtSG, containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},
  ];

  const breakfastPool = ALL_BF_ENTRIES.filter(function(e){
    if(e.containsGluten && noGluten) return false;  // HARD RULE: nunca gluten si noGluten
    if(e.needsEgg       && noEgg)   return false;
    if(e.needsFish      && noFish)  return false;
    if(typeof e.fn !== "function")  return false;   // guard: entrada sin builder definido
    return true;
  }).map(function(e){
    return {
      type:      "bf_"+e.key,
      // FASE 0: breakfasts are hardcoded, not driven by r()/rp() — mark non-recomposable
      build:     function(){ return Object.assign({},e.fn(),{_spec:{recomposable:false}}); },
      protein:   e.protein,
      plateType: "desayuno",
      sauce:     e.sauce,
      cookM:     e.cookM,
      veggie:    e.veggie,
    };
  });

  // Fallback de desayuno — garantizado libre de gluten si noGluten
  var bfFallback = noGluten
    ? function(){return {build:BF_SG.yogurSemillas, protein:"bf_yogur", plateType:"desayuno"};}
    : function(){return {build:BF.avenaFresas,       protein:"bf_avena", plateType:"desayuno"};};


    // ── DENSITY + PLATE TYPE PREFERENCES PER STRATEGY ───────────────────────
  var STRAT_PREF = {
    fat_loss_general:         {prefer:["media"],        avoid:[],        plateBonus:{caliente_arroz:1,caliente_patata:1,legumbre:1,pasta:0,sopa_crema:1,bowl:1,ensalada:0}},
    definicion_saciante:      {prefer:["baja"],        avoid:["alta"],  plateBonus:{sopa_crema:3,ensalada:2,plancha_verdura:1,bowl:-1,pasta:-2,caliente_arroz:-1}},
    definicion_flexible:      {prefer:["baja","media"],avoid:[],        plateBonus:{sopa_crema:1,ensalada:1}},
    mantenimiento_equilibrado:{prefer:["media"],        avoid:[],        plateBonus:{}},
    volumen_limpio:           {prefer:["media","alta"], avoid:["baja"],  plateBonus:{caliente_arroz:2,bowl:2,pasta:2,caliente_boniato:1,sopa_crema:-2,ensalada:-1}},
    volumen_agresivo:         {prefer:["alta"],         avoid:["baja"],  plateBonus:{pasta:3,caliente_arroz:3,bowl:3,caliente_boniato:2,sopa_crema:-3,ensalada:-2}},
  };

  // ── WEEKLY SLOT PLAN ─────────────────────────────────────────────────────
  // Each day gets a curated slot with intended protein category and plate type.
  // This is what makes the week feel "designed by a human", not random.
  // slotProtein: preferred protein category for lunch
  // slotDinner:  preferred plate type for dinner
  // slotNote:    visible label shown in the meal card explaining the day's logic
  // ── WEEKLY NARRATIVE SLOTS ────────────────────────────────────────────────
  // Each day has: slotProtein/slotDinner (for smartPick hint),
  // slotNote (visible to user), mood (internal rhythm label),
  // and a brief human "why" that makes the week feel designed, not random.
  var WEEK_SLOTS = {
    fat_loss_general: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"reset",
       slotNote:"🔄 Lunes de reset — pollo con arroz, sencillo y completo. Sin complicaciones."},
      {day:"Martes",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"comfort",
       slotNote:"🍝 Martes de pasta — hidratos de verdad, cena rápida. Sin culpa."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"caliente_patata", mood:"clásico",
       slotNote:"🥩 Miércoles de siempre — ternera con patata, lo que hace tu madre."},
      {day:"Jueves",   slotProtein:"legumbre", slotDinner:"plancha_verdura", mood:"fibra",
       slotNote:"🫘 Jueves de legumbre — fibra, saciedad larga, lo más barato del plan."},
      {day:"Viernes",  slotProtein:"pescado",  slotDinner:"pescado_horno",   mood:"ligero",
       slotNote:"🐟 Viernes de pescado — más ligero para llegar bien al fin de semana."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — esto es parte del plan. Disfruta, que mañana seguimos."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"reconfortante",
       slotNote:"🍲 Domingo tranquilo — pollo con arroz para cerrar la semana con energía."},
    ],
    definicion_saciante: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"sopa_crema",      mood:"reset",
       slotNote:"🥦 Lunes de limpieza — empezamos ligero. La sopa de cena te sacia sin pasarte."},
      {day:"Martes",   slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"fuerza",
       slotNote:"💪 Martes de proteína densa — ternera para estar lleno y con energía."},
      {day:"Miércoles",slotProtein:"legumbre", slotDinner:"sopa_crema",      mood:"fibra",
       slotNote:"🫘 Miércoles de fibra — la legumbre de mediodía aguanta hasta la cena."},
      {day:"Jueves",   slotProtein:"pescado",  slotDinner:"plancha_verdura", mood:"omega",
       slotNote:"🐟 Jueves de pescado — omega-3, proteína limpia, verdura de volumen."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"ensalada",        mood:"ligero",
       slotNote:"🥗 Viernes muy ligero — llegamos al fin de semana sin sensación de pesadez."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — uno a la semana, sin remordimientos, es parte de la estrategia."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"sopa_crema",      mood:"reconfortante",
       slotNote:"🍲 Domingo de sofá — algo caliente y reconfortante para descansar bien."},
    ],
    definicion_flexible: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"reset",
       slotNote:"📋 Lunes limpio — plancha clásica, nada que pensar."},
      {day:"Martes",   slotProtein:"pescado",  slotDinner:"caliente_arroz",  mood:"ligero",
       slotNote:"🐟 Martes de pescado — proteína con arroz, fácil y completo."},
      {day:"Miércoles",slotProtein:"legumbre", slotDinner:"huevo_plancha",   mood:"clásico",
       slotNote:"🫘 Miércoles de legumbre — cenas huevo, que es rápido y perfecto."},
      {day:"Jueves",   slotProtein:"ternera",  slotDinner:"caliente_patata", mood:"fuerza",
       slotNote:"🥩 Jueves de ternera — cierre fuerte de semana laboral con patata."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"sopa_crema",      mood:"suave",
       slotNote:"🍵 Viernes suave — sopa reconfortante para entrar bien en el fin de semana."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — lo que más te apetezca."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"caliente_arroz",  mood:"familiar",
       slotNote:"🍗 Domingo de pollo con arroz — lo de siempre, que nunca falla."},
    ],
    mantenimiento_equilibrado: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"rutina",
       slotNote:"⚖️ Lunes de rutina — empieza la semana ordenado."},
      {day:"Martes",   slotProtein:"pescado",  slotDinner:"pescado_horno",   mood:"ligero",
       slotNote:"🐟 Martes de pescado — dos veces a la semana, como siempre."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"fuerza",
       slotNote:"🥩 Miércoles de ternera — mitad de semana con hierro."},
      {day:"Jueves",   slotProtein:"legumbre", slotDinner:"huevo_plancha",   mood:"fibra",
       slotNote:"🫘 Jueves de legumbre — fibra y proteína vegetal."},
      {day:"Viernes",  slotProtein:"pavo",     slotDinner:"sopa_crema",      mood:"suave",
       slotNote:"🍵 Viernes de sopa — terminas la semana sin sensación de pesadez."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"libre",
       slotNote:"🎉 Sábado libre — en mantenimiento te lo puedes permitir sin problema."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"familiar",
       slotNote:"🍗 Domingo familiar — el pollo de domingo nunca caduca."},
    ],
    volumen_limpio: [
      {day:"Lunes",    slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"carga",
       slotNote:"💪 Lunes de carga — pollo y arroz. Empieza la semana con glucógeno."},
      {day:"Martes",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"hidratos",
       slotNote:"🍝 Martes de pasta — hidratos densos para rendir. La cena con huevo es perfecta."},
      {day:"Miércoles",slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"aminoácidos",
       slotNote:"🥩 Miércoles de ternera — aminoácidos para recuperación muscular."},
      {day:"Jueves",   slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"carga",
       slotNote:"🍗 Jueves de carga — repetimos pollo. En volumen, la constancia manda."},
      {day:"Viernes",  slotProtein:"pescado",  slotDinner:"huevo_plancha",   mood:"omega",
       slotNote:"🐟 Viernes de pescado azul — omega-3 para reducir inflamación muscular."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"recarga",
       slotNote:"🎉 Sábado de recarga — come con cabeza pero sin obsesión. Eres parte del plan."},
      {day:"Domingo",  slotProtein:"legumbre", slotDinner:"plancha_verdura", mood:"descanso",
       slotNote:"🫘 Domingo de legumbre — proteína vegetal y descanso digestivo."},
    ],
    volumen_agresivo: [
      {day:"Lunes",    slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"carga_maxima",
       slotNote:"🔥 Lunes de máxima carga — pasta para llenar el glucógeno desde el primer día."},
      {day:"Martes",   slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"aminoácidos",
       slotNote:"🥩 Martes de ternera — proteína completa, recuperación rápida."},
      {day:"Miércoles",slotProtein:"pollo",    slotDinner:"plancha_verdura", mood:"constancia",
       slotNote:"💪 Miércoles de pollo — mitad de semana, consistencia antes que creatividad."},
      {day:"Jueves",   slotProtein:"pasta",    slotDinner:"huevo_plancha",   mood:"segunda_carga",
       slotNote:"🍝 Segunda carga de pasta — si no llegas a calorías, añade aceite o queso."},
      {day:"Viernes",  slotProtein:"ternera",  slotDinner:"plancha_verdura", mood:"cierre_fuerte",
       slotNote:"🥩 Viernes de cierre fuerte — ternera para terminar la semana con proteína densa."},
      {day:"Sábado",   slotProtein:"libre",    slotDinner:"libre",           mood:"recarga_total",
       slotNote:"🎉 Sábado de recarga total — come lo que quieras. En volumen agresivo, esto es necesario."},
      {day:"Domingo",  slotProtein:"pollo",    slotDinner:"huevo_plancha",   mood:"descanso",
       slotNote:"🍗 Domingo ligero — huevo en cena para dar descanso al sistema digestivo."},
    ],
  };

  // ── WEEKLY COHERENCE LIMITS ───────────────────────────────────────────────
  // Hard limits enforced across the whole week (tracked per-week, not per-day)
  var weeklyProteinCount = {}; // protein → count
  var weeklyPlateCount   = {}; // plateType → count
  var weeklyCulinaryStyle= {}; // culinaryStyle → count
  var weeklyCuisineExp   = {}; // cuisineExperience → count ("comfort_caliente", "bowl_fresco" …)
  var weeklyTempFeel     = {}; // "caliente" / "frio" / "muy_caliente" → count
  var weeklySauceCount   = {}; // sauce family → count
  // Hard caps: fish max 2/week across all fish species, ave (pollo+pavo+conejo) max 4/week total, etc.
  var WEEKLY_CAP = {pescado:2, marisco:1, legumbre:2, pasta:2, ternera:2, cerdo:2, ave:4};

  // ── FREEFORM FREQUENCY TRACKING ────────────────────────────────────────────
  // Tracks usage of freeForm combos within the current ISO week.
  // Structure: weeklyFreeFormIds[id] = { count: number, weekKey: string }
  // Resets automatically when the ISO week changes — no manual reset needed.
  var weeklyFreeFormIds = {};

  function getISOWeekKey(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
  }

  var CURRENT_WEEK = getISOWeekKey(new Date());

  function exceedsWeeklyCap(protKey, ptKey) {
    var protCount = weeklyProteinCount[protKey] || 0;
    var ptCount   = weeklyPlateCount[ptKey]     || 0;
    // Also check family cap (e.g. all fish species share the "pescado" cap)
    var fam = protFamily(protKey);
    var famCount  = (fam !== protKey) ? (weeklyProteinCount[fam] || 0) : 0;
    var cap = WEEKLY_CAP[protKey] || WEEKLY_CAP[fam];
    if(cap && (protCount >= cap || famCount >= cap)) return true;
    // Plate type cap: max 3 of any plate type per week
    if(ptCount >= 3) return true;
    return false;
  }

  function recordMeal(protKey, ptKey, styleKey, cxp, tmp, sauce) {
    weeklyProteinCount[protKey] = (weeklyProteinCount[protKey]||0) + 1;
    var fam = protFamily(protKey);
    if(fam !== protKey) {
      weeklyProteinCount[fam] = (weeklyProteinCount[fam]||0) + 1;
    }
    weeklyPlateCount[ptKey]     = (weeklyPlateCount[ptKey]||0)     + 1;
    if(styleKey) weeklyCulinaryStyle[styleKey] = (weeklyCulinaryStyle[styleKey]||0) + 1;
    if(cxp)      weeklyCuisineExp[cxp]         = (weeklyCuisineExp[cxp]||0)         + 1;
    if(tmp)      weeklyTempFeel[tmp]            = (weeklyTempFeel[tmp]||0)            + 1;
    if(typeof sauce === 'string' && sauce.length > 0) {
      const f = famOf(sauce);
      weeklySauceCount[f] = (weeklySauceCount[f] || 0) + 1;
    }
  }

  // ── SMART PICKER (15-factor scoring) ─────────────────────────────────────
  var pastFreq = _pastProteins; // cross-week memory

  // Observability toggle — set to true from the browser console to enable structured traces.
  // Has zero runtime cost when false.
  var SMARTPICK_TRACE = opts.trace === true;

  function smartPick(pool, usedProteins, usedPlateTypes, usedCookMethods, fallbackBuild, slotHint, dayCtx, mood) {
    // dayCtx = {sauces:[], cookMethods:[], veggies:[], proteins:[]} — used meals in this calendar day
    if(!pool.length) {
      if(SMARTPICK_TRACE) {
        console.log("[smartPick TRACE]", {
          slotHint: slotHint || null,
          mood: mood || null,
          candidateIds: [],
          hardFilteredOutIds: [],
          scored: [],
          winnerId: "<fallback>",
          winnerScore: null,
          reasonWinner: "poolEmpty_fallbackBuild"
        });
      }
      return fallbackBuild();
    }
    var pref = STRAT_PREF[strategy] || STRAT_PREF.mantenimiento_equilibrado;
    var dc = dayCtx || {sauces:[], cookMethods:[], veggies:[], proteins:[]};

    if(SMARTPICK_TRACE) {
      var __trace = {
        slotHint: slotHint || null,
        mood: mood || null,
        candidateIds: pool.map(function(m) {
          return (m && (m.id || m.protein)) || "<no-id>";
        }),
        hardFilteredOutIds: [],
        scored: [],
        winnerId: null,
        winnerScore: null,
        reasonWinner: null
      };
    }

    var eligible = pool.filter(function(m) {
      var passes = !exceedsWeeklyCap(m.protein || m.type, m.plateType || "");
      if(SMARTPICK_TRACE && !passes) {
        __trace.hardFilteredOutIds.push({
          id: (m && (m.id || m.protein)) || "<no-id>",
          reason: "exceedsWeeklyCap",
          protein: m.protein || m.type || null,
          plateType: m.plateType || null
        });
      }
      return passes;
    });
    if(!eligible.length) {
      eligible = pool;
      if(SMARTPICK_TRACE) {
        __trace.hardFilteredOutIds.push({
          id: "<fallback>",
          reason: "weeklyCapFallback_poolEmpty",
          protein: null,
          plateType: null
        });
      }
    }

    // ── FREEFORM FREQUENCY FILTER ───────────────────────────────────────────
    // Soft-blocks combos that have reached their weekly frecuencia limit.
    // Legacy combos are never touched (early return true).
    // Fallback: if the filter would reduce eligible below min(3, pool),
    // relax the semanal limit to avoid empty pools.
    (function() {

      function getUsage(id) {
        var entry = weeklyFreeFormIds[id];
        if (!entry) return 0;
        // reset automático si cambia la semana
        if (entry.weekKey !== CURRENT_WEEK) return 0;
        return entry.count || 0;
      }

      function isAllowed(m) {
        if (!m._spec || m._spec.freeForm !== true) return true;
        var id = m._spec.identity && m._spec.identity.id;
        if (!id) return true;
        var frec = (m._spec.behavior || {}).frecuencia;
        var used = getUsage(id);
        if (frec === "ocasional") return used < 1;
        if (frec === "semanal")   return used < 2;
        return true; // diario o undefined
      }

      var filtered = eligible.filter(isAllowed);

      // fallback NO destructivo:
      // si el filtro elimina demasiado, se relaja parcialmente (no se apaga)
      if (filtered.length < Math.min(3, eligible.length)) {
        filtered = eligible.map(function(m) {
          if (!m._spec || m._spec.freeForm !== true) return m;
          var frec = (m._spec.behavior || {}).frecuencia;
          if (frec === "ocasional") return m; // mantener hard limit
          return m; // relajar semanal si es necesario
        });
      }

      eligible = filtered;

    })();
    // ── fin FREEFORM FREQUENCY FILTER ──────────────────────────────────────

    var scored = eligible.map(function(m) {
      var protKey = m.protein || m.type;
      var ptKey   = m.plateType || "";

      // 1. Protein recency (within week) — PROGRESSIVE
      // Cuanto más reciente fue el uso, mayor la penalización.
      // Esto es clave cuando el pool es pequeño (e.g. sin gluten):
      // el sistema debe distribuir incluso con pocas opciones.
      var pLast   = usedProteins.lastIndexOf(protKey);
      var pRec    = pLast === -1 ? 0 : Math.max(0, usedProteins.length - pLast);
      var protPen = pRec === 0 ? 0
                  : pRec === 1 ? 18   // usado ayer — muy alta penalización
                  : pRec === 2 ? 10   // hace 2 días — moderada
                  : pRec >= 3  ?  4   // hace 3+ días — baja
                  : 0;

      // 1b. CookMethod recency — less aggressive than protein (7 methods vs 17 proteins)
      var cmKey  = m.cookM || "";
      var cmLast = usedCookMethods ? usedCookMethods.lastIndexOf(cmKey) : -1;
      var cmRec  = cmLast === -1 ? 0 : Math.max(0, usedCookMethods.length - cmLast);
      var cookMethodRecencyPen = cmRec === 0 ? 0
                               : cmRec === 1 ? 12  // ayer — alta
                               : cmRec === 2 ?  6  // hace 2 días — moderada
                               : cmRec >= 3  ?  2  // hace 3+ días — baja
                               : 0;

      // 2. Plate type recency
      var ptLast  = usedPlateTypes ? usedPlateTypes.lastIndexOf(ptKey) : -1;
      var ptRec   = ptLast === -1 ? 0 : Math.max(0, usedPlateTypes.length - ptLast);
      var platePen= ptRec >= 2 ? 7 : ptRec * 2.5;

      // 3. Weekly plate type count
      var ptCount  = weeklyPlateCount[ptKey] || 0;
      var countPen = ptCount >= 2 ? 5 : ptCount * 1.5;

      // 4. Strategy density fit
      var denBonus= 0;
      if(m.density && pref.prefer.indexOf(m.density) > -1) denBonus -= 2.5;
      if(m.density && pref.avoid.indexOf(m.density)  > -1) denBonus += 3.5;

      // 5. Strategy plate type preference
      var ptBonus = 0;
      if(ptKey && pref.plateBonus && pref.plateBonus[ptKey] !== undefined) {
        ptBonus -= pref.plateBonus[ptKey];
      }

      // 6. Saciante flag
      var sacBonus = (strategy === "definicion_saciante" && m.saciante) ? -2.5 : 0;

      // 7. Slot hint
      var slotBonus = 0;
      if(slotHint) {
        if(slotHint.protein && (m.protein||m.type) === slotHint.protein) slotBonus -= 4;
        if(slotHint.plateType && ptKey === slotHint.plateType) slotBonus -= 3;
      }

      // 8. Familiarity bonus for fat_loss_general
      var familiarBonus = 0;
      if(strategy === "fat_loss_general") {
        if(m.familiar) familiarBonus -= 2.5;
        if(m.facil)    familiarBonus -= 1.5;
      }

      // 9. Cross-week memory: penalise proteins seen frequently in past weeks
      var memPenalty = 0;
      var pastCount = pastFreq[protKey] || 0;
      if(pastCount >= 4) memPenalty = 3.5;
      else if(pastCount >= 2) memPenalty = 1.5;

      // 10. Same-day protein repetition — STRONG penalty (family-aware)
      // Penalises pollo+pavo (both "ave") as strongly as pollo+pollo.
      var dayProtPen = 0;
      var thisFamily = protFamily(protKey);
      if(dc.proteins && dc.proteins.some(function(p){
        return p === protKey || protFamily(p) === thisFamily;
      })) {
        dayProtPen = 15; // very strong — never repeat same protein family same day
      }

      // 11. Same-day sauce repetition — STRONG penalty
      // e.g. ajillo for lunch and dinner on the same day
      var daySaucePen = 0;
      if(m.sauce && dc.sauces && dc.sauces.indexOf(m.sauce) > -1) {
        daySaucePen = 14; // avoids "al ajillo" twice in same day
      }

      const _sFam = typeof m.sauce === 'string' ? famOf(m.sauce) : null;
      const _wsc  = _sFam ? (weeklySauceCount[_sFam] || 0) : 0;
      const weeklySaucePen =
        (!_sFam || _wsc <= 1) ? 0 :
        _wsc === 2 ? WEEKLY_SAUCE_PEN_STEP :
        _wsc === 3 ? 3 * WEEKLY_SAUCE_PEN_STEP :
        6 * WEEKLY_SAUCE_PEN_STEP;

      // 12. Same-day cooking method repetition — MODERATE penalty
      // e.g. two consecutive plancha meals on same day
      var dayCookPen = 0;
      if(m.cookM && dc.cookMethods && dc.cookMethods.indexOf(m.cookM) > -1) {
        dayCookPen = 6;
      }

      // 13. Same-day main veggie repetition — MODERATE penalty
      // e.g. espinacas in breakfast scramble AND dinner
      var dayVeggiePen = 0;
      if(m.veggie && dc.veggies && dc.veggies.indexOf(m.veggie) > -1) {
        dayVeggiePen = 8;
      }

      // 14. Culinary style over-representation this week
      // Prevents the week from being all "casero" or all "mediterraneo"
      // Cap: max 3 meals per style per week — soft penalty beyond 2
      var stylePen = 0;
      var styleKey = m.culinaryStyle || null;
      if(styleKey) {
        var styleCount = weeklyCulinaryStyle[styleKey] || 0;
        if(styleCount >= 3) stylePen = 8;
        else if(styleCount >= 2) stylePen = 3;
      }

      // Determine if this protein type is "fish" — penalise fish-heavy days
      var isFish = m.protein && (PROT[m.protein]&&(PROT[m.protein].isFish||PROT[m.protein].isSeafood));
      var fishDayPen = 0;
      if(isFish) {
        var fishCountToday = (dc.proteins||[]).filter(function(p){
          return PROT[p] && (PROT[p].isFish || PROT[p].isSeafood);
        }).length;
        if(fishCountToday >= 1) fishDayPen = 12; // max 1 fish meal per day
      }

      // 15. Daily mood bonus — promotes meals that fit the day's emotional context
      // e.g. "comfort" day favours sopa_crema and legumbre
      // e.g. "rapido" day penalises anything not marked facil
      var moodPen = mood ? moodBonus(m, mood) : 0;

      // 16. Apetencia — fit emocional por mood del día
      // comfortScore se activa en días reconfortantes/reset
      // freshnessScore en días ligeros/fresco/omega
      // cravingScore  en días libres/recarga — queremos el plato más apetecible
      var apetenciaPen = 0;
      var ap = m.apetencia || {comfort:0, freshness:0, craving:0};
      if(mood==="reset"||mood==="rutina")                  apetenciaPen -= ap.freshness * 0.6;
      if(mood==="comfort"||mood==="reconfortante"||mood==="suave") apetenciaPen -= ap.comfort * 1.2;
      if(mood==="ligero"||mood==="omega"||mood==="descanso")       apetenciaPen -= ap.freshness * 1.2;
      if(mood==="libre"||mood==="recarga"||mood==="recarga_total") apetenciaPen -= ap.craving * 1.5;
      if(mood==="familiar"||mood==="clásico")              apetenciaPen -= ap.comfort * 0.8;
      if(mood==="carga"||mood==="carga_maxima"||mood==="aminoácidos") apetenciaPen -= ap.craving * 0.5;

      // 17. Experiencia culinaria percibida — evita que la semana se sienta
      // como "siete días de plancha" o "todo comfort_caliente".
      // El usuario no lo analiza pero lo NOTA: monotonía de experiencia.
      var cxpPen = 0;
      var cxp = m.cuisineExperience || null;
      if(cxp) {
        var cxpCount = weeklyCuisineExp[cxp] || 0;
        if(cxpCount >= 5) cxpPen = 10;       // experiencia dominante — fuerte
        else if(cxpCount >= 3) cxpPen = 4;   // ya vista varias veces — moderada
        else if(cxpCount >= 2) cxpPen = 1;   // vista — pequeño empuje a variar
      }
      // Temperatura: penaliza si casi toda la semana es del mismo feel térmico
      var tmpPen = 0;
      var tmp = m.tempFeel || null;
      if(tmp) {
        var tmpCount = weeklyTempFeel[tmp] || 0;
        if(tmpCount >= 6) tmpPen = 6;         // e.g. 6 platos calientes — pide algo fresco
        else if(tmpCount >= 4) tmpPen = 2;
      }

      // 18. Seasonal veggie bonus — prefer in-season vegetables (Spain, current month).
      // Soft preference: when the combo's main vegetable is in season, nudge its score down
      // (i.e. favour it). Intolerances remain strictly higher priority because they
      // hard-filter combos out of the pool before this scoring step ever runs.
      var seasonalBonus = (m.veggie && currentSeasonalVegs.indexOf(m.veggie) > -1) ? -1.5 : 0;

      // 19. Sopa_crema same-veggie weekly penalty — avoids "crema de X" twice in the same week
      var sopaCremaPen = (m.plateType==="sopa_crema" && m.veggie && usedProteins.indexOf("sopa:"+m.veggie) > -1) ? 8 : 0;

      var score = protPen + platePen + countPen + denBonus + ptBonus + sacBonus + slotBonus +
                  familiarBonus + memPenalty + dayProtPen + daySaucePen + weeklySaucePen + dayCookPen +
                  dayVeggiePen + fishDayPen + stylePen + moodPen + apetenciaPen + cxpPen + tmpPen +
                  seasonalBonus + sopaCremaPen + cookMethodRecencyPen;

      // ── freeForm v3.1 additive penalties (Prompt 2B) ───────────────
      //
      // SOLO afecta a combos freeForm.
      // El scoring legacy sigue intacto.
      //
      // Las penalizaciones son ADITIVAS.
      // NO reemplazan penalties existentes.
      //
      // Fuente de verdad:
      //   m._spec.behavior
      //
      if (m._spec && m._spec.freeForm === true) {

        var _beh = m._spec.behavior || {};

        // ───────────────────────────────────────────────────────────
        // P1 — lightMealCompatible × moods ligeros
        //
        // Platos marcados como no compatibles con comidas ligeras
        // se penalizan en moods de descarga/suavidad.
        //
        var _lightMoods = [
          "ligero",
          "omega",
          "descanso",
          "suave"
        ];

        if (
          _beh.lightMealCompatible === false &&
          _lightMoods.indexOf(mood) >= 0
        ) {
          score += 8;
        }

        // ───────────────────────────────────────────────────────────
        // P2 — digestiveLoad high × contexto cena
        //
        // Penaliza platos digestivamente pesados durante cenas.
        //
        // IMPORTANTE:
        // La detección depende del CONTEXTO ACTUAL de smartPick,
        // no del slot exclusivo declarado por el combo.
        //
        var _dinnerPT = [
          "plancha_verdura",
          "sopa_crema",
          "huevo_plancha",
          "pescado_horno",
          "ensalada"
        ];

        var _isDinnerCtx =
          slotHint &&
          slotHint.plateType &&
          _dinnerPT.indexOf(slotHint.plateType) >= 0;

        if (
          _beh.digestiveLoad === "high" &&
          _isDinnerCtx
        ) {
          score += 10;
        }

        // ───────────────────────────────────────────────────────────
        // P3 — avoidInAggressiveCut × estrategias de definición
        //
        var _cutStrategies = [
          "definicion_saciante",
          "fat_loss_general",
          "definicion_flexible"
        ];

        var _isCutCtx =
          _cutStrategies.indexOf(strategy) >= 0;

        if (
          _beh.avoidInAggressiveCut === true &&
          _isCutCtx
        ) {
          score += 12;
        }

        // ───────────────────────────────────────────────────────────
        // P4 — satietyScore bajo × definición
        //
        // En contextos de déficit se priorizan platos más saciantes.
        //
        if (
          typeof _beh.satietyScore === "number" &&
          _beh.satietyScore < 4 &&
          _isCutCtx
        ) {
          score += 5;
        }

        // ───────────────────────────────────────────────────────────
        // P5 — trainingProfile.rest × moods de carga
        //
        // Platos marcados como orientados a descanso se penalizan
        // en días de carga/fuerza.
        //
        var _tp = _beh.trainingProfile || {};

        var _trainingMoods = [
          "fuerza",
          "carga",
          "carga_maxima",
          "hidratos",
          "segunda_carga"
        ];

        if (
          _tp.rest === true &&
          _trainingMoods.indexOf(mood) >= 0
        ) {
          score += 6;
        }

      }
      // ── fin freeForm v3.1 additive penalties ──────────────────────

      if(SMARTPICK_TRACE) {
        __trace.scored.push({
          id: (m && (m.id || m.protein)) || "<no-id>",
          score: typeof score !== "undefined" ? score : null,
          protein: m.protein || m.type || null,
          plateType: m.plateType || null,
          breakdown: {
            protPen: typeof protPen !== "undefined" ? protPen : null,
            ptPen: typeof platePen !== "undefined" ? platePen : null
          }
        });
      }
      return {m:m, score:score};
    });
    scored.sort(function(a,b){return a.score - b.score;});

    // ── SELECCIÓN ESTOCÁSTICA PONDERADA ─────────────────────────────────────
    // En lugar de siempre coger scored[0], elegimos entre los N mejores
    // con probabilidad inversamente proporcional al score.
    // Esto produce variedad humana real: misma calidad, distinta elección.
    //
    // Tamaño del grupo top-N: se adapta al pool disponible.
    //   pool grande  → top 5  (máxima variedad)
    //   pool pequeño → top 3  (e.g. restricción sin gluten)
    //   pool = 1-2   → top 1  (no hay elección posible)
    var topN = scored.length >= 6 ? 5
             : scored.length >= 4 ? 3
             : scored.length >= 3 ? 2
             : 1;
    var candidates = scored.slice(0, topN);

    // ── Stage 2a: controlled lunch-hint injection ───────────────────────────
    // If the lunch slotHint protein survived the weekly CAP but was pruned out
    // of the top-N, push it into candidates so it can still be picked.
    var injectedHint = false;
    var hintIdx = -1;
    if (slotHint && slotHint.protein) {
      for (var k = 0; k < scored.length; k++) {
        if ((scored[k].m.protein || scored[k].m.type) === slotHint.protein) { hintIdx = k; break; }
      }
      if (hintIdx >= topN) {
        candidates.push(scored[hintIdx]);
        injectedHint = true;
      }
    }

    // Pesos: w = 1 / (score - min_score + 1)^1.4
    // El exponente 1.4 mantiene la calidad (el peor no tiene igual prob que el mejor)
    // pero da opciones reales al 2º, 3º y 4º candidato.
    var minScore = candidates[0].score;
    var weights  = candidates.map(function(c){
      return 1 / Math.pow(Math.max(0, c.score - minScore) + 1, 1.4);
    });
    var totalW = weights.reduce(function(s,w){ return s+w; }, 0);
    var rand   = _rnd() * totalW;
    var chosen = candidates[0].m;
    var cumul  = 0;
    for(var i=0; i<candidates.length; i++){
      cumul += weights[i];
      if(rand <= cumul){ chosen = candidates[i].m; break; }
    }
    if(SMARTPICK_TRACE) {
      __trace.winnerId = (chosen && (chosen.id || chosen.protein)) || "<no-id>";
      var __winnerEntry = __trace.scored.find(function(s) {
        return s.id === __trace.winnerId;
      });
      __trace.winnerScore = __winnerEntry ? __winnerEntry.score : null;
      if(typeof candidates !== "undefined" && candidates.length > 0) {
        var top = candidates[0];
        __trace.reasonWinner =
          (__winnerEntry && top && __winnerEntry.score === top.score)
            ? "maxScore"
            : "weightedRandomTieBreak";
      } else {
        __trace.reasonWinner = "unknown";
      }
      console.log("[smartPick TRACE]", __trace);
    }
    if(SMARTPICK_TRACE && slotHint && slotHint.protein) {
      var hintCapBlocked = hintIdx === -1;
      var hintPruned = hintIdx >= topN;
      var hintInCandidates = (hintIdx >= 0 && hintIdx < topN) || injectedHint;
      console.log("[smartPick HINT TRACE]", {
        slotHintProtein: slotHint.protein,
        chosen: (chosen && (chosen.protein || chosen.type)) || null,
        hintIdx: hintIdx,
        topN: topN,
        injectedHint: injectedHint,
        hintInCandidates: hintInCandidates,
        hintCapBlocked: hintCapBlocked,
        hintPruned: hintPruned
      });
    }
    return chosen;
  }

  // ── SIMPLIFY MODE ────────────────────────────────────────────────────────
  // Activated via check-in when adherence is very low, OR automatically when
  // the user selected "novato" cooking preference (quick meals, low effort).
  var isSimple = (profile.simpleMode === true) || (profile.experiencia === "novato");
  var SIMPLE_LUNCHES  = ["polloArroz","pavoPatata","terneraPatata","salmon","lentejas","pastaCarbonara","polloProvenzal"];
  var SIMPLE_DINNERS  = ["pavoBrocoli","polloEspinacas","merluza","tortilla","cremaCalabaza","sopaPolloCasera","revueltoEsparragos"];

  // ── DAILY MOOD & TIME-AWARE FILTERING ─────────────────────────────────────
  // Each day of the week has a human mood that influences meal selection.
  // tiempoCocina ("poco"/"normal"/"mucho") adds an extra layer:
  //   poco   → weekdays are "rapido" regardless of slot mood
  //   mucho  → weekends unlock "elaborado" moods (more complex recipes)
  var tiempoCocina = profile.tiempoCocina || "normal";

  // Mood → pool filter + scoring hint
  // comfort:   legumbre, sopa_crema, guisado preferred
  // rapido:    only facil=true, plancha/revuelto/crudo preferred
  // fresco:    ensalada, bowl, pescado preferred
  // libre:     no filter (Saturday)
  // elaborado: all pool available, complexity welcome
  var MOOD_CONFIG = {
    reset:         {facil: false, plateBonus: {plancha_verdura:2, caliente_arroz:1}},
    comfort:       {facil: false, plateBonus: {sopa_crema:3, legumbre:3, caliente_patata:1}},
    rapido:        {facil: true,  plateBonus: {plancha_verdura:3, huevo_plancha:2, ensalada:1}},
    fresco:        {facil: false, plateBonus: {ensalada:3, bowl:2, pescado_horno:2}},
    fibra:         {facil: false, plateBonus: {legumbre:4, sopa_crema:1}},
    fuerza:        {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:2, caliente_boniato:1}},
    ligero:        {facil: false, plateBonus: {ensalada:2, pescado_horno:2, plancha_verdura:1}},
    reconfortante: {facil: false, plateBonus: {sopa_crema:4, legumbre:2, caliente_patata:1}},
    familiar:      {facil: true,  plateBonus: {caliente_arroz:2, caliente_patata:2, legumbre:1}},
    rutina:        {facil: false, plateBonus: {}},
    omega:         {facil: false, plateBonus: {pescado_horno:3, caliente_arroz:1}},
    hidratos:      {facil: false, plateBonus: {pasta:3, caliente_arroz:2, caliente_boniato:2}},
    aminoacidos:   {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:1}},
    carga:         {facil: false, plateBonus: {caliente_arroz:3, caliente_boniato:2, pasta:1}},
    carga_maxima:  {facil: false, plateBonus: {pasta:4, caliente_arroz:3}},
    segunda_carga: {facil: false, plateBonus: {pasta:4, caliente_boniato:2}},
    cierre_fuerte: {facil: false, plateBonus: {caliente_arroz:2, caliente_patata:2}},
    recarga:       {facil: false, plateBonus: {}},
    recarga_total: {facil: false, plateBonus: {}},
    descanso:      {facil: true,  plateBonus: {huevo_plancha:3, sopa_crema:2, ensalada:1}},
    clásico:       {facil: true,  plateBonus: {caliente_patata:2, caliente_arroz:2, legumbre:1}},
    suave:         {facil: false, plateBonus: {sopa_crema:3, pescado_horno:1, plancha_verdura:1}},
    libre:         {facil: false, plateBonus: {}},
  };

  // Days that feel "laboral" (workdays) — tiempoCocina:"poco" makes these rapido
  var WORKDAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  // Returns effective mood for a day, adjusted by tiempoCocina
  function effectiveMood(slotMood, dayName) {
    if(slotMood === "libre") return "libre";
    var isWorkday = WORKDAYS.indexOf(dayName) > -1;
    if(tiempoCocina === "poco" && isWorkday) return "rapido";
    return slotMood || "rutina";
  }

  // Apply mood bonus to a pool entry's score (returns penalty/bonus number)
  function moodBonus(m, mood) {
    var cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.rutina;
    var ptKey = m.plateType || "";
    var bonus = 0;
    // Plate type bonus from mood
    if(cfg.plateBonus && cfg.plateBonus[ptKey] !== undefined) {
      bonus -= cfg.plateBonus[ptKey] * 1.5; // negative = preferred
    }
    // Facil filter: if mood requires facil and meal is not facil, penalise
    if(cfg.facil && !m.facil) bonus += 8;
    return bonus;
  }

  // Track protein, plate-type and cookMethod usage per meal slot + weekly totals
  const usedL=[], usedD=[], usedB=[];
  const usedLPlate=[], usedDPlate=[];
  const usedLCook=[], usedDCook=[]; // cookMethod recency — parallel to usedL/usedD
  const dayNames=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const n=profile.mealsPerDay||3;

  let snackAmIdx=0, snackPmIdx=0;

  // ── ESPONTANEIDAD ─────────────────────────────────────────────────────────
  // Un día por semana el sistema "se sale del guión" deliberadamente:
  // ignora el slotHint y elige por cravingScore máximo.
  // Esto evita que el usuario detecte el patrón y hace la semana más humana.
  // El día wildcard se elige al azar entre Martes y Jueves (días "planos").
  var WILDCARD_DAYS = ["Martes","Miércoles","Jueves"];
  var wildcardDay = WILDCARD_DAYS[Math.floor(_rnd() * WILDCARD_DAYS.length)];
  // Con tiempoCocina:"poco", el wildcard no es en día laboral intenso (L/V)
  // Solo 1 wildcard por semana — desactivable si simpleMode activo
  var useWildcard = !isSimple;

  // ── CAOS CONTROLADO — simulación de comportamiento humano ────────────────
  // Los humanos no comen perfectamente optimizados. Tienen rutinas, cansancio,
  // antojo y confort emocional. Este sistema los simula deliberadamente.
  //
  // Patrón 1 — RUTINA DEL MARTES: el desayuno del martes puede coincidir con el
  // de la semana anterior (la gente tiene desayunos fijos entre semana). No es
  // un bug — es comportamiento real. Se activa con 30% de probabilidad.
  //
  // Patrón 2 — FATIGA DEL VIERNES: el viernes, la comida tiende a ser la más
  // sencilla de la semana. Se fuerza facil=true y se reduce la penalización
  // de platos repetidos. Solo si tiempoCocina !== "mucho".
  //
  // Patrón 3 — COMFORT DEL DOMINGO: el domingo se activa mood "familiar" con
  // extra bonus de cravingScore. No hay wildcard ese día.
  //
  // Patrón 4 — REPETICIÓN QUERIDA: si un plato tiene cravingScore alto y ya
  // apareció esta semana, tiene un 20% de probabilidad de volver a aparecer
  // (en vez de ser penalizado). Simula "me apetece de nuevo esto".

  var HUMAN_PATTERNS = {
    tuesdayRoutine:  !isSimple && _rnd() < 0.30,  // 30% chance
    fridayFatigue:   tiempoCocina !== "mucho",            // siempre si no es chef
    sundayComfort:   true,                                // siempre
    belovedRepeat:   !isSimple && _rnd() < 0.20,  // 20% chance
  };

  var weekSlots = WEEK_SLOTS[strategy] || WEEK_SLOTS.mantenimiento_equilibrado;

  // Heurística de kcal por plateType para pre-ajuste de proteína
  var _PRE_KCAL = {
    plancha_verdura: 320, sopa_crema: 280, huevo_plancha: 350,
    caliente_arroz: 520,  caliente_patata: 490, ensalada: 380,
    bowl: 450, pasta: 560, legumbre: 480, libre: 600,
    pescado_horno: 390,   desayuno: 350,
  };
  // Proteína base estimada por comida con proteinMult=1 (74kg, 3 comidas)
  var _PRE_PROT_BASE = 100; // g/día a mult 1.0

  // NO-DETERMINISMO CONOCIDO (Fase 0, pendiente): planSeed solo alimenta day.id,
  // no afecta el contenido del plan. Fuera de alcance de la seed determinista
  // de _rnd — ver buildPlan.js:26. Tests excluyen day.id del snapshot por esto.
  const planSeed = Date.now();
  const days=dayNames.map(function(day, _dayIdx){
    var isSat=day==="Sábado";
    var slot  = weekSlots.find(function(s){return s.day===day;}) || {};

    // Compute the effective mood for this day — adjusted by tiempoCocina
    var dayMood = effectiveMood(slot.mood || "rutina", day);

    // ── Pre-ajuste de proteinMult: si el día va a quedar corto en kcal o proteína,
    // incrementar rules.proteinMult ANTES de llamar a composeMeal().
    // Se restaura después de generar los meals del día.
    var _savedProteinMult = rules.proteinMult;
    (function() {
      if(isSat) return; // día libre — no ajustar
      var lunchPt  = slot.slotProtein === "pasta" ? "pasta"
                   : slot.slotProtein === "legumbre" ? "legumbre"
                   : "caliente_arroz";
      var dinnerPt = slot.slotDinner || "plancha_verdura";
      var _dayRegen  = profile._regenContext&&profile._regenContext.dayPortionsRegen&&profile._regenContext.dayPortionsRegen.dayIdx===dayNames.indexOf(day)?profile._regenContext.dayPortionsRegen:null;
      var _shake    = profile.extras&&profile.extras.proteinShake;
      // Shake calibration is now applied via shakeFactor inside r(), not by adjusting baseScale.
      // For the pre-boost estimate, don't add shake kcal: r() already produces calibrated portions.
      var _shakeOn  = _dayRegen!=null?!!_dayRegen.shakeEnabledOverride:false;
      var _shakeKcal= _shakeOn?((_shake&&_shake.scoops||1)*(_shake&&_shake.kcalPerScoop||120)):0;
      var _shakeProt= _shakeOn?((_shake&&_shake.scoops||1)*(_shake&&_shake.proteinPerScoop||24)):0;
      var estKcal  = (_PRE_KCAL.desayuno||350)
                   + (_PRE_KCAL[lunchPt]||400)
                   + (_PRE_KCAL[dinnerPt]||350)
                   + _shakeKcal;
      var estProt  = Math.round(_PRE_PROT_BASE * rules.proteinMult)
                   + _shakeProt;
      var needBoost = estKcal < 1500 || estProt < 130;
      if(needBoost) {
        // +0.10 si solo uno de los dos falla, +0.15 si ambos
        var boost = (estKcal < 1500 && estProt < 130) ? 0.15 : 0.10;
        rules.proteinMult = Math.min(rules.proteinMult + boost, 1.40);
      }
    })();

    // ── dayPortionsRegen: reuse same specs, only recalculate portions ─────────
    // Active when regenerateDayPortions() is called with a shakeEnabledOverride.
    // Pre-boost already ran with the correct override above.
    var _drSpec = profile._regenContext&&profile._regenContext.dayPortionsRegen&&profile._regenContext.dayPortionsRegen.dayIdx===dayNames.indexOf(day)?profile._regenContext.dayPortionsRegen:null;
    if(_drSpec&&_drSpec.meals) {
      var _drMeals = _drSpec.meals.map(function(om){
        if(!om) return null;
        // FASE 4 safe-guards: sin _spec o no recomponible → preservar intacta
        if(!om._spec) return om;
        if(om._spec.recomposable === false) return om;
        return composeMeal(om._spec);
      });
      rules.proteinMult = _savedProteinMult;
      return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood||null, effectiveMood:dayMood, meals:_drMeals, shakeEnabled:!!_drSpec.shakeEnabledOverride};
    }

    // ── Semantic override from regenerateMeal() ───────────────────────────
    // When the user asks to regenerate a specific plato with a semantic hint
    // (e.g. "algo más comfort"), override dayMood for that day only.
    var regenCtx = profile._regenContext || null;
    var isRegenDay = regenCtx && dayNames.indexOf(day) === regenCtx.dayIdx;
    if(isRegenDay && regenCtx.semanticHint) {
      var hintMoodMap = {
        comfort:   "reconfortante",
        ligero:    "ligero",
        rapido:    "rapido",
        diferente: "libre",
      };
      dayMood = hintMoodMap[regenCtx.semanticHint] || dayMood;
    }

    // ── Regen exclusion filter: avoid repeating same protein+template ────────
    var _regenExclP = isRegenDay && regenCtx && regenCtx.excludeSpec
      ? regenCtx.excludeSpec.P
      : null;

    // _regenExclTmpl ya no se usa: la exclusión se simplifica a proteína/tipo base
    var _filterRegen = function(pool) {
      if(!_regenExclP) return pool;

      var f = pool.filter(function(m){
        // Excluir tanto proteínas como tipos equivalentes (ej: legumbre)
        return m.protein !== _regenExclP && m.type !== _regenExclP;
      });

      return f.length > 0 ? f : pool; // fallback seguro
    };

    // ── Caos controlado: aplicar patrones de comportamiento humano ───────────
    // Patrón FATIGA DEL VIERNES — el viernes la comida es la más sencilla
    if(day==="Viernes" && HUMAN_PATTERNS.fridayFatigue && dayMood!=="libre") {
      dayMood = "rapido";
    }
    // Patrón COMFORT DEL DOMINGO — el domingo activa experiencia reconfortante
    if(day==="Domingo" && HUMAN_PATTERNS.sundayComfort && dayMood!=="libre") {
      dayMood = "reconfortante";
    }
    // chosen for THIS day to prevent repetition within the same calendar day.
    var dayCtx = {sauces:[], cookMethods:[], veggies:[], proteins:[]};
    function recordDayCtx(picked) {
      if(picked.sauce)   dayCtx.sauces.push(picked.sauce);
      if(picked.cookM)   dayCtx.cookMethods.push(picked.cookM);
      if(picked.veggie)  dayCtx.veggies.push(picked.veggie);
      if(picked.protein) dayCtx.proteins.push(picked.protein);
    }

    // Breakfast: rotate anti-repetition via breakfastPool
    // Patrón RUTINA DEL MARTES: el martes puede repetir el desayuno favorito
    // (el que tuvo menor penalización la semana pasada). Simula hábito real.
    var bfPoolForDay = breakfastPool;
    if(day==="Martes" && HUMAN_PATTERNS.tuesdayRoutine && usedB.length > 0) {
      // Busca el desayuno más familiar de los disponibles y lo pone primero
      var famFirst = breakfastPool.slice().sort(function(a,b){
        return (b.familiar?1:0)-(a.familiar?1:0);
      });
      bfPoolForDay = famFirst;
    }
    var bPicked=smartPick(bfPoolForDay, usedB, null, null, bfFallback, null, dayCtx, dayMood);
    var breakfast=bPicked.build();
    usedB.push(bPicked.protein||"bf_0");
    recordDayCtx(bPicked);

    // Lunch: slot hint + simple mode filter + weekly cap + wildcard
    var lunch;
    if(isSat){
      lunch=libreComida();
      usedLPlate.push("libre");
      usedL.push("libre");
    } else {
      var lPool = isSimple
        ? lunchPool.filter(function(m){return m.familiar&&m.facil;})
        : lunchPool;
      if(!lPool.length) lPool = lunchPool;
      if(isRegenDay) lPool = _filterRegen(lPool);

      // WILDCARD: este día ignora el slotHint y elige el plato con mayor cravingScore
      // para inyectar espontaneidad y romper la previsibilidad del sistema.
      var isWildcard = useWildcard && !isSat && day === wildcardDay;
      var lSlotHint  = isWildcard ? null : {protein: slot.slotProtein};

      var lPicked=smartPick(lPool, usedL, usedLPlate, usedLCook,
        function(){return {build:function(){return composeMeal(LUNCH_COMBOS[0]);},protein:"pollo",plateType:"caliente_arroz"};},
        lSlotHint, dayCtx, isWildcard ? "libre" : dayMood);
      lunch=lPicked.build();
      // En días wildcard: añadir nota discreta en el título para que el usuario "lo sienta"
      if(isWildcard && lunch) lunch = Object.assign({}, lunch, {wildcard:true});
      usedL.push(lPicked.protein||"pollo");
      usedLCook.push(lPicked.cookM||"");
      if(lPicked.plateType==="sopa_crema" && lPicked.veggie) usedL.push("sopa:"+lPicked.veggie);
      usedLPlate.push(lPicked.plateType||"caliente_arroz");
      recordMeal(lPicked.protein||"pollo", lPicked.plateType||"caliente_arroz", lPicked.culinaryStyle||null, lPicked.cuisineExperience||null, lPicked.tempFeel||null, lPicked.sauce);
      recordDayCtx(lPicked);
      // ── freeForm frequency tracking (lunch) ──────────────────────
      if (lPicked._spec && lPicked._spec.freeForm === true) {
        var lffId = lPicked._spec.identity && lPicked._spec.identity.id;
        if (lffId) {
          var lffEntry = weeklyFreeFormIds[lffId];
          if (!lffEntry || lffEntry.weekKey !== CURRENT_WEEK) {
            weeklyFreeFormIds[lffId] = { count: 1, weekKey: CURRENT_WEEK };
          } else {
            lffEntry.count += 1;
          }
        }
      }
      // ── fin freeForm frequency tracking (lunch) ──────────────────
    }

    // Dinner: slot hint + training override + weekly cap + family-aware
    var dinner;
    if(n===2){
      dinner=null;
    } else if(isTrain(day)){
      var td = TRAINING_DINNERS[usedD.length % TRAINING_DINNERS.length];
      dinner = composeMeal(td);
      usedD.push("pollo");
      usedDPlate.push("caliente_arroz");
      recordMeal("pollo","caliente_arroz","casero",null,null,null);
      // training dinners don't add to dayCtx — they're overrides
    } else {
      var dPool = isSimple
        ? dinnerPool.filter(function(m){return m.plateType==="plancha_verdura"||m.plateType==="sopa_crema"||m.plateType==="huevo_plancha";})
        : dinnerPool;
      if(!dPool.length) dPool = dinnerPool;
      if(isRegenDay) dPool = _filterRegen(dPool);
      var dSlotHint = {plateType: slot.slotDinner};
      var dPicked=smartPick(dPool, usedD, usedDPlate, usedDCook,
        function(){return {build:function(){return composeMeal(DINNER_COMBOS[0]);},protein:"pavo",plateType:"plancha_verdura"};},
        dSlotHint, dayCtx, dayMood);
      dinner=dPicked.build();
      usedD.push(dPicked.protein||"pavo");
      usedDCook.push(dPicked.cookM||"");
      if(dPicked.plateType==="sopa_crema" && dPicked.veggie) usedD.push("sopa:"+dPicked.veggie);
      usedDPlate.push(dPicked.plateType||"plancha_verdura");
      recordMeal(dPicked.protein||"pavo", dPicked.plateType||"plancha_verdura", dPicked.culinaryStyle||null, dPicked.cuisineExperience||null, dPicked.tempFeel||null, dPicked.sauce);
      recordDayCtx(dPicked);
      // ── freeForm frequency tracking (dinner) ─────────────────────
      if (dPicked._spec && dPicked._spec.freeForm === true) {
        var dffId = dPicked._spec.identity && dPicked._spec.identity.id;
        if (dffId) {
          var dffEntry = weeklyFreeFormIds[dffId];
          if (!dffEntry || dffEntry.weekKey !== CURRENT_WEEK) {
            weeklyFreeFormIds[dffId] = { count: 1, weekKey: CURRENT_WEEK };
          } else {
            dffEntry.count += 1;
          }
        }
      }
      // ── fin freeForm frequency tracking (dinner) ─────────────────
    }

    // Attach slot note to lunch so the UI can display it
    // If tiempoCocina:"poco" overrode the mood to "rapido", show a contextual note
    var effectiveNote = slot.slotNote;
    if(!isSat && tiempoCocina === "poco" && slot.mood !== "libre" && slot.mood !== "rapido") {
      effectiveNote = "⚡ Día rápido — recetas de menos de 15 min para que no te compliques.";
    }
    if(lunch && lunch.wildcard) {
      effectiveNote = "✨ Día sorpresa — el plan se ha salido un poco del guión. Así la semana no se vuelve predecible.";
    }
    if(lunch && effectiveNote && !isSat) {
      lunch = Object.assign({}, lunch, {slotNote: effectiveNote});
    }

    var almuerzo=(n>=4)?SNACKS_AM[snackAmIdx++%SNACKS_AM.length]:null;
    var merienda=(n>=5)?SNACKS_PM[snackPmIdx++%SNACKS_PM.length]:null;

    var meals=[];
    if(n===2){
      var bigLunch=isSat?libreComida():Object.assign({},lunch,{title:lunch.title+" (comida principal)",
        p1:lunch.p1.replace(/\((\d+)g\)/g,function(full,g){return "("+Math.round(parseInt(g)*1.25)+"g)";})});
      meals=[breakfast,bigLunch];
    } else if(n===3){
      meals=[breakfast,lunch,dinner];
    } else if(n===4){
      meals=[breakfast,almuerzo,lunch,dinner];
    } else {
      meals=[breakfast,almuerzo,lunch,merienda,dinner];
    }

    // Restaurar proteinMult tras generar todos los meals del día
    rules.proteinMult = _savedProteinMult;

    return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood||null, effectiveMood:dayMood, meals:meals, shakeEnabled:!!profile.extras.proteinShake.enabled};
  });

  // Persist this week's protein sequence for cross-week memory
  saveMealMemory(getWeekNumber(), usedL, usedD);

  // ── VALIDATE WEEK — pasada de integridad post-generación ─────────────────
  // Detecta problemas que el scorer local no puede ver (solo ve día a día).
  // Devuelve {warnings:[], score:0-100, problems:[]} para la UI.
  // score: 100 = semana perfectamente variada / 0 = monotonía total.
  function validateWeek(days) {
    var warnings = [];
    var problems = [];
    var deductions = 0;

    // 1. Exclusiones HARD — rastreo de ingredientes eliminados en texto
    if(_eliminated.length > 0) {
      days.forEach(function(day) {
        (day.meals||[]).forEach(function(meal) {
          if(!meal) return;
          var text = ((meal.title||"")+" "+(meal.p1||"")+" "+(meal.p2||"")).toLowerCase();
          _eliminated.forEach(function(ef) {
            if(text.indexOf(ef) > -1) {
              problems.push("❌ "+day.name+": posible rastro de '"+ef+"' — revisa '"+meal.title+"'");
              deductions += 20;
            }
          });
        });
      });
    }

    // 2. Familia proteica — demasiadas aves / pescado / etc.
    var famCount = {};
    Object.keys(weeklyCuisineExp).forEach(function(k){ famCount[k] = weeklyCuisineExp[k]; });
    var aveTotal = (weeklyProteinCount["ave"]||0);
    var pescTotal= (weeklyProteinCount["pescado"]||0);
    if(aveTotal > 4) {
      warnings.push("🍗 Demasiada ave esta semana ("+aveTotal+" veces) — considera sustituir un día.");
      deductions += 8;
    }
    if(pescTotal > 2) {
      warnings.push("🐟 Pescado "+pescTotal+" veces — lo recomendable es máximo 2/semana.");
      deductions += 10;
    }

    // 3. Experiencia culinaria percibida — monotonía de sensación
    var cxpThreshold = {
      comfort_caliente: {max:4, label:"platos de cocina de cuchara o comfort"},
      plancha_ligera:   {max:5, label:"platos a la plancha"},
      bowl_fresco:      {max:4, label:"bowls o ensaladas"},
      horno_mediterraneo:{max:5,label:"platos al horno"},
      wok_asiatico:     {max:3, label:"platos asiáticos o wok"},
      pasta_italiana:   {max:2, label:"platos de pasta"},
    };
    Object.keys(weeklyCuisineExp).forEach(function(cxp) {
      var count = weeklyCuisineExp[cxp]||0;
      var th = cxpThreshold[cxp];
      if(th && count > th.max) {
        warnings.push("🔄 "+count+" "+th.label+" esta semana — la semana se puede sentir repetitiva.");
        deductions += 6;
      }
    });

    // 4. Técnica de cocina — demasiada plancha
    var _planchaCount = Object.keys(weeklyProteinCount).reduce(function(acc) {
      return acc; // planchaCount se mide por weeklyCuisineExp
    }, 0);
    var _planchaReal = (weeklyCuisineExp["plancha_ligera"]||0) + (weeklyCuisineExp["horno_mediterraneo"]||0);
    // ya cubierto arriba

    // 5. Temperatura percibida — todo caliente o todo frío
    var calCount  = (weeklyTempFeel["caliente"]||0) + (weeklyTempFeel["muy_caliente"]||0);
    var frioCount = weeklyTempFeel["frio"]||0;
    var totalMeals= calCount + frioCount;
    if(totalMeals > 0) {
      if(frioCount === 0 && totalMeals >= 8) {
        warnings.push("🌡️ La semana tiene todos los platos calientes — añade algún bowl o ensalada.");
        deductions += 5;
      }
      if(calCount === 0 && totalMeals >= 8) {
        warnings.push("🥗 La semana tiene todo frío — en días de invierno puede notarse poco reconfortante.");
        deductions += 5;
      }
    }

    // 6. Ritmo semanal — ¿hay equilibrio ligero/denso?
    var lightDays = 0; var heavyDays = 0;
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var densities = meals.map(function(m){ return (m.metadata&&m.metadata.saciedad)||"media"; });
      var bajaCount = densities.filter(function(d){ return d==="baja"; }).length;
      var altaCount = densities.filter(function(d){ return d==="alta"; }).length;
      if(bajaCount >= 2) lightDays++;
      if(altaCount >= 2) heavyDays++;
    });
    if(lightDays >= 5) {
      warnings.push("🌿 5+ días muy ligeros seguidos — el usuario puede sentir poca energía.");
      deductions += 4;
    }
    if(heavyDays >= 4) {
      warnings.push("💪 4+ días muy densos seguidos — puede ser difícil de mantener.");
      deductions += 4;
    }

    // 7. Sauce diversity — ¿demasiada salsa ajillo / plancha seca?
    Object.keys(weeklyCulinaryStyle).forEach(function(style) {
      if((weeklyCulinaryStyle[style]||0) >= 5) {
        warnings.push("🧄 Estilo '"+style+"' domina la semana — busca más variedad de sabores.");
        deductions += 3;
      }
    });

    // 8. Calorías diarias — heurística por tipo de plato
    var PLATE_KCAL = {
      // ── Legacy plateTypes ─────────────────────────────────────
      plancha_verdura:    320,
      sopa_crema:         280,
      huevo_plancha:      350,
      caliente_arroz:     520,
      caliente_patata:    490,
      ensalada:           380,
      bowl:               450,
      pasta:              560,
      legumbre:           480,
      libre:              600,
      pescado_horno:      390,
      desayuno:           350,

      // ── freeForm plateTypes (tanda 4.1–4.6) ──────────────────
      // Españoles
      sopa_fria:          360,
      guiso_verduras:     480,
      cocido_legumbre:    635,
      guiso_legumbre:     525,
      fideua:             580,
      patatas_canarias:   560,
      caldo_grelos:       565,
      caldo_repollo:      565,
      caldo_ligero:       350,
      paella:             605,
      tortilla:           570,
      ensaladilla:        630,
      ensalada_pasta:     635,
      empanada:           580,
      sopa_castellana:    380,
      pollo_ajillo:       560,
      menestra:           320,
      marmitako:          540,
      marisco_vapor:      310,

      // Mediterráneos / internacionales
      crema_verduras:     450,
      moussaka:           560,
      shakshuka:          540,
      hummus_bowl:        610,
      falafel_bowl:       595,
      sardinas_plancha:   420,
      mejillones_salsa:   340,
      pita_rellena:       570,
      ensalada_legumbre:  440,

      // Italianos
      pasta_carbonara:    760,
      pasta_norma:        620,
      risotto:            615,
      pizza:              625,
      gnocchi:            595,

      // Asiáticos
      curry:              555,
      pad_thai:           660,
      ramen:              555,
      wok:                650,
      gyozas:             410,
      sopa_coco:          420,
      bowl_salmon:        620,
      bibimbap:           680,
      bao:                490,
      sopa_miso:          280,
      teriyaki:           650,

      // Mexicanos / burgers
      tacos:              520,
      quesadilla:         650,
      burrito:            565,
      hamburguesa:        710,

      // Airfryer
      airfryer_pollo:     550,
      airfryer_pescado:   520,
      airfryer_verduras:  525,
      croquetas_af:       515,
      nuggets_af:         535,

      // Otros
      ceviche:            410,
      carpaccio:          440,
      huevos_rellenos:    400,
      esparragos_plato:   410,
      wrap:               625,
      bol_fruta:          470,
    };
    var dayKcalList = [];
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var dayKcal = 0;
      meals.forEach(function(meal) {
        if(meal.time === "Desayuno" || meal.time === "Almuerzo" || meal.time === "Merienda") {
          dayKcal += PLATE_KCAL.desayuno;
        } else {
          var pt = meal.metadata && meal.metadata.plateType ? meal.metadata.plateType : null;
          // Derivar plateType desde título si no está en metadata
          if(!pt) {
            var t = (meal.title||"").toLowerCase();
            if(t.indexOf("arroz")>-1)         pt = "caliente_arroz";
            else if(t.indexOf("patata")>-1)    pt = "caliente_patata";
            else if(t.indexOf("crema")>-1||t.indexOf("sopa")>-1) pt = "sopa_crema";
            else if(t.indexOf("ensalada")>-1)  pt = "ensalada";
            else if(t.indexOf("pasta")>-1)     pt = "pasta";
            else if(t.indexOf("legumbre")>-1||t.indexOf("lentejas")>-1||t.indexOf("garbanzos")>-1) pt = "legumbre";
            else if(t.indexOf("horno")>-1)     pt = "pescado_horno";
            else if(t.indexOf("huevo")>-1||t.indexOf("tortilla")>-1||t.indexOf("clara")>-1) pt = "huevo_plancha";
            else                               pt = "plancha_verdura";
          }
          dayKcal += (PLATE_KCAL[pt] || 350);
        }
      });
      dayKcalList.push({name: day.name, kcal: dayKcal});
      if(dayKcal < 1500) {
        warnings.push("[AJUSTE] "+day.name+": día bajo en energía (~"+Math.round(dayKcal)+" kcal) — déficit excesivo");
        // diagnóstico nutricional — no afecta scoring
      }
    });

    // 8b. Patrón: 2 días consecutivos < 1600 kcal
    for(var ci = 0; ci < dayKcalList.length - 1; ci++) {
      if(dayKcalList[ci].kcal < 1600 && dayKcalList[ci+1].kcal < 1600) {
        warnings.push("[AJUSTE] "+dayKcalList[ci].name+"–"+dayKcalList[ci+1].name+": 2 días consecutivos bajos en energía (<1600 kcal)");
      }
    }

    // 9. Proteína diaria estimada — heurística: base ~25g desayuno + ~40g comida + ~35g cena × proteinMult
    var estProteinBase = 100; // baseline at proteinMult 1.0 con 3 comidas
    var effProteinMult = rules ? (rules.proteinMult || 1.0) : 1.0;
    var estProtein = Math.round(estProteinBase * effProteinMult);
    if(estProtein < 130) {
      warnings.push("[AJUSTE] Proteína estimada insuficiente (~"+estProtein+"g) — objetivo mínimo 130g/día");
    }

    // 10. Patrón: 3 cenas consecutivas < 400 kcal
    var dinnerKcalList = [];
    days.forEach(function(day) {
      var meals = (day.meals||[]).filter(Boolean);
      var dinner = meals.find(function(m){ return m.time === "Cena"; });
      if(dinner) {
        var pt = dinner.metadata && dinner.metadata.plateType ? dinner.metadata.plateType : null;
        if(!pt) {
          var t = (dinner.title||"").toLowerCase();
          if(t.indexOf("arroz")>-1)         pt = "caliente_arroz";
          else if(t.indexOf("patata")>-1)    pt = "caliente_patata";
          else if(t.indexOf("crema")>-1||t.indexOf("sopa")>-1) pt = "sopa_crema";
          else if(t.indexOf("ensalada")>-1)  pt = "ensalada";
          else if(t.indexOf("huevo")>-1||t.indexOf("tortilla")>-1||t.indexOf("clara")>-1) pt = "huevo_plancha";
          else                               pt = "plancha_verdura";
        }
        dinnerKcalList.push(PLATE_KCAL[pt] || 320);
      } else {
        dinnerKcalList.push(null);
      }
    });
    for(var di = 0; di < dinnerKcalList.length - 2; di++) {
      var d0 = dinnerKcalList[di], d1 = dinnerKcalList[di+1], d2 = dinnerKcalList[di+2];
      if(d0 !== null && d1 !== null && d2 !== null && d0 < 400 && d1 < 400 && d2 < 400) {
        warnings.push("[AJUSTE] "+days[di].name+"–"+days[di+2].name+": 3 cenas consecutivas de baja densidad (<400 kcal)");
      }
    }

    var rawScore = 100 - deductions;

    console.log("WEEK VALIDATION DEBUG", {
      deductions,
      rawScore,
      weeklyCuisineExp,
      weeklyProteinCount,
      weeklyTempFeel
    });

    var score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, rawScore))
      : 0;
    return { warnings: warnings, problems: problems, score: score };
  }

  // ── CALL validateWeek and return ─────────────────────────────────────────
  var validation = validateWeek(days);
  return {
    days:         days,
    strategy:     strategy,
    weekWarnings: validation.warnings,
    weekProblems: validation.problems,
    weekScore:    validation.score,
  };
}
