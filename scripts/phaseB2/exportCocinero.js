// Fase 2, Paso B.2 — exportador del xlsx unico de anotacion para el cocinero.
// Vive en scripts/ (fuera de engine2/ y engine/): lee dishes.scaffold.json
// (178, legacy) + freeform.editorial.json (64, freeform) y produce un solo
// libro con dos pestanas (Platos, Leyenda). Solo lectura de datos +
// generacion de xlsx -- no toca el motor, no se importa desde engine2/.
//
// "Nombre sugerido" se deriva de la tupla (tmpl,P,C,V,V2,S,cookM) con un
// generador propio de esta herramienta (NO importa buildPlan.js: motor
// viejo congelado, y aunque importar desde scripts/ es constitucionalmente
// licito, una copia local evita cualquier acoplamiento accidental). Usa los
// mismos diccionarios de labels (P/C/V/S) que el motor viejo, copiados aqui
// como datos est ticos -- ver PROT/CARB/VEG/SAUCE/COOK_LABEL abajo.

import ExcelJS from 'exceljs';
import { pathToFileURL } from 'node:url';
import dishesScaffoldRaw from './output/dishes.scaffold.json' with { type: 'json' };
import freeformEditorialRaw from './output/freeform.editorial.json' with { type: 'json' };

// ── Diccionarios de labels (copia estatica desde src/engine/buildPlan.js,
//    PROT/CARB/VEG/SAUCE, lineas 150-267) — solo "label", nada mas. ──────────
const PROT = {
  pollo: 'Pechuga de pollo', pavo: 'Pechuga de pavo', ternera: 'Ternera magra',
  cerdo: 'Lomo de cerdo', conejo: 'Conejo', salmon: 'Salmón', merluza: 'Merluza',
  bacalao: 'Bacalao fresco', dorada: 'Dorada', sardinas: 'Sardinas',
  atun: 'Atún en conserva', gambas: 'Gambas', calamares: 'Calamares',
  huevo: 'Huevos', lentejas: 'Lentejas', garbanzos: 'Garbanzos', alubias: 'Alubias blancas',
};
const CARB = {
  arroz: 'Arroz blanco', pasta: 'Pasta integral', patata: 'Patata',
  boniato: 'Boniato', quinoa: 'Quinoa', pan: 'Pan integral',
};
const VEG = {
  brocoli: 'Brócoli', espinacas: 'Espinacas', calabacin: 'Calabacín',
  judias: 'Judías verdes', pimientos: 'Pimientos', zanahoria: 'Zanahoria',
  coles: 'Col de Bruselas', berenjena: 'Berenjena', tomate: 'Tomate cherry',
  lechuga: 'Lechuga mixta', acelgas: 'Acelgas', pepino: 'Pepino',
  calabaza: 'Calabaza', puerro: 'Puerro', champiñones: 'Champiñones',
  esparragos: 'Espárragos', alcachofa: 'Alcachofas',
};
const SAUCE = {
  limon_hierbas: 'limón, orégano y ajo', tomate_casero: 'tomate casero',
  mostaza_miel: 'mostaza y miel', soja_jengibre: 'soja baja en sal y jengibre',
  provenzal: 'hierbas provenzales', pimenton_ajo: 'pimentón ahumado y ajo',
  curry_ligero: 'curry y cúrcuma', vinagreta: 'vinagre de Módena y mostaza',
  ajillo: 'ajo, perejil y guindilla', romero_limon: 'romero, limón y ajo',
};
const COOK_LABEL = {
  plancha: 'a la plancha', horno: 'al horno', guisado: 'guisado',
  salteado: 'salteado', vapor: 'al vapor', crudo: 'en conserva',
  revuelto: 'revuelto', tortilla: 'en tortilla',
};

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Categoria de proteina (mismo vocabulario que usa freeform.editorial.json:
// ave/pescado/marisco/legumbre/huevo/carne) para que ambas fuentes sean
// consistentes en la columna proteinType del xlsx.
const PROTEIN_FAMILY = {
  pollo: 'ave', pavo: 'ave', conejo: 'ave',
  salmon: 'pescado', merluza: 'pescado', bacalao: 'pescado',
  dorada: 'pescado', sardinas: 'pescado', atun: 'pescado',
  gambas: 'marisco', calamares: 'marisco',
  lentejas: 'legumbre', garbanzos: 'legumbre', alubias: 'legumbre',
  ternera: 'carne', cerdo: 'carne',
  huevo: 'huevo',
};

/**
 * Genera un nombre sugerido legible a partir de la tupla de identidad de un
 * combo legacy. Generador propio y deliberadamente simple (sin las ~50
 * excepciones "classicTitle" del motor viejo): el cocinero corrige el
 * nombre si no le convence (ver columna "rol" de la leyenda).
 * @param {[string,string,string|null,string|null,string|null,string|null,string|null]} tuple
 * @returns {string}
 */
export function suggestNameFromTuple([tmpl, P, C, V, V2, S, cookM]) {
  const pLabel = P ? PROT[P] : null;
  const cLabel = C ? CARB[C] : null;
  const vLabel = V ? VEG[V] : null;
  const v2Label = V2 ? VEG[V2] : null;
  const sLabel = S ? SAUCE[S] : null;
  const cookDesc = cookM ? COOK_LABEL[cookM] : null;
  const vegPart = [vLabel, v2Label].filter(Boolean).join(' y ');

  if (tmpl === 'sopa_crema') {
    const creamVeg = vLabel || v2Label || 'verduras';
    return `Crema de ${creamVeg.toLowerCase()}` + (pLabel ? ` con ${pLabel.toLowerCase()} encima` : '');
  }
  if (tmpl === 'ensalada') {
    const base = pLabel ? `${pLabel} en ensalada` : 'Ensalada variada';
    return base + (cLabel ? ` con ${cLabel.toLowerCase()}` : '');
  }
  if (tmpl === 'bowl') {
    const char = S === 'soja_jengibre' ? 'asiático'
      : S === 'curry_ligero' ? 'de curry'
      : S === 'limon_hierbas' ? 'mediterráneo'
      : S === 'tomate_casero' ? 'con tomate'
      : 'proteico';
    return `Bowl ${char} de ${(pLabel || 'proteína').toLowerCase()}` + (cLabel ? ` con ${cLabel.toLowerCase()}` : '');
  }
  if (tmpl === 'pasta') {
    const sauceName = S === 'tomate_casero' ? 'al pomodoro'
      : S === 'ajillo' ? 'al ajillo'
      : S === 'curry_ligero' ? 'al curry'
      : 'con proteína';
    return `${cLabel || 'Pasta'} ${sauceName}` + (pLabel ? ` con ${pLabel.toLowerCase()}` : '');
  }
  if (tmpl === 'legumbre') {
    const legName = pLabel || 'Legumbres';
    const legChar = S === 'curry_ligero' ? ' al curry'
      : S === 'pimenton_ajo' ? ' con pimentón'
      : S === 'ajillo' ? ' al ajillo'
      : ' estofadas';
    return legName + legChar + (vegPart ? ` con ${vegPart.toLowerCase()}` : '');
  }
  // caliente_clasico
  const methodChar = cookM === 'horno' ? 'al horno'
    : cookM === 'guisado' ? 'guisado'
    : cookM === 'salteado' ? 'salteado'
    : cookM === 'vapor' ? 'al vapor'
    : cookM === 'revuelto' ? 'revuelto'
    : cookM === 'tortilla' ? 'en tortilla'
    : 'a la plancha';
  const sauceChar = sLabel ? ` con ${sLabel}` : '';
  const base = pLabel ? cap(pLabel.toLowerCase()) : 'Plato';
  let out = `${base} ${methodChar}${sauceChar}`;
  if (vegPart) out += ` con ${vegPart.toLowerCase()}`;
  if (cLabel) out += `${vegPart ? ' y' : ' con'} ${cLabel.toLowerCase()}`;
  return out.trim().replace(/\s+/g, ' ');
}

// ── Reglas de prerrelleno de alergenos (propuesta, no verdad firme) ────────
const GLUTEN_KEYWORDS = [
  'pasta', 'pizza', 'empanada', 'empanadilla', 'masa', 'pan', 'bocadillo',
  'bao', 'pita', 'wrap', 'rebozado', 'croqueta', 'nugget', 'cuscús', 'cuscus',
  'fideuá', 'fideua', 'ramen', 'noodles', 'gnocchi', 'canelones', 'lasaña',
  'lasagna', 'bechamel', 'teriyaki', 'soja', 'wok',
];
const LACTOSA_KEYWORDS = [
  'queso', 'nata', 'bechamel', 'crema', 'gratinado', 'risotto', 'mantequilla',
  'leche', 'yogur', 'canelones', 'lasaña', 'lasagna', 'croqueta',
];

function matchesAny(haystack, keywords) {
  const h = haystack.toLowerCase();
  return keywords.some((kw) => h.includes(kw));
}

function proposeGluten(nombre, plateType) {
  return matchesAny(`${nombre} ${plateType}`, GLUTEN_KEYWORDS) ? 'sí' : 'no';
}
function proposeLactosa(nombre, plateType) {
  return matchesAny(`${nombre} ${plateType}`, LACTOSA_KEYWORDS) ? 'sí' : 'no';
}

// ── TAREA 2: fusion de las 6 anotaciones previas de Javi ────────────────────
// Match por TUPLA de identidad, no por el nombre generado por
// suggestNameFromTuple(): el generador de esta herramienta es nuevo y no
// reproduce exactamente la redaccion que Javi uso al anotar a mano (p.ej.
// las dos de "en crudo" tienen tmpl="sopa_crema" como artefacto de datos,
// no porque sean cremas). Las tuplas se verificaron unicas en el scaffold
// (1 match cada una) antes de fijarlas aqui.
const PREVIOUS_ANNOTATIONS = [
  {
    nombre: 'Garbanzos con berenjena salteado',
    tuple: ['legumbre', 'garbanzos', null, 'berenjena', null, 'curry_ligero', 'salteado'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'media', shelfLifeDays: 3, energiaCocina: 'bajo',
  },
  {
    nombre: 'Huevo con tomate en crudo',
    tuple: ['sopa_crema', 'huevo', null, 'tomate', null, null, 'crudo'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'alta', shelfLifeDays: 3, energiaCocina: 'bajo',
  },
  {
    nombre: 'Atún con tomate y pimientos en crudo',
    tuple: ['sopa_crema', 'atun', null, 'tomate', 'pimientos', null, 'crudo'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'media', shelfLifeDays: 2, energiaCocina: 'bajo',
  },
  {
    nombre: 'Garbanzos con pimientos guisado',
    tuple: ['legumbre', 'garbanzos', null, 'pimientos', null, 'pimenton_ajo', 'guisado'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'alta', shelfLifeDays: 4, energiaCocina: 'medio',
  },
  {
    nombre: 'Lentejas con arroz y zanahoria guisado',
    tuple: ['legumbre', 'lentejas', 'arroz', 'zanahoria', null, 'pimenton_ajo', 'guisado'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'alta', shelfLifeDays: 4, energiaCocina: 'medio',
  },
  {
    nombre: 'Ternera con patata y zanahoria guisado',
    tuple: ['caliente_clasico', 'ternera', 'patata', 'zanahoria', null, 'ajillo', 'guisado'],
    rol: 'ancla', batchable: 'sí', leftoverQuality: 'alta', shelfLifeDays: 4, energiaCocina: 'alto',
  },
];

function findPreviousAnnotation(idJson) {
  return PREVIOUS_ANNOTATIONS.find((p) => JSON.stringify(p.tuple) === idJson);
}

/**
 * Regenera el "Nombre sugerido" de un dish del scaffold con la MISMA logica
 * que buildPlatosRows(): ancla previa si hay match por tupla, si no
 * suggestNameFromTuple(). Exportada para que importAnotacion.js (Paso B.2)
 * la reutilice como tripwire de coherencia, sin duplicar esta logica.
 * @param {{id: string}} dish
 * @returns {string}
 */
export function regenerateNombreSugerido(dish) {
  const tuple = JSON.parse(dish.id);
  const prev = findPreviousAnnotation(dish.id);
  return prev ? prev.nombre : suggestNameFromTuple(tuple);
}

function buildPlatosRows() {
  const dishesScaffold = Object.values(dishesScaffoldRaw);
  const freeformEditorial = Object.values(freeformEditorialRaw);
  const matchedPrevious = new Set();
  const unmatchedReport = [];
  const rows = [];
  let n = 0;

  for (const d of dishesScaffold) {
    n++;
    const tuple = JSON.parse(d.id);
    const prev = findPreviousAnnotation(d.id);
    if (prev) matchedPrevious.add(prev.nombre);
    const nombreSugerido = prev ? prev.nombre : suggestNameFromTuple(tuple);

    rows.push({
      n,
      nombre: nombreSugerido,
      momento: Array.isArray(d.momento) ? d.momento.join(', ') : d.momento,
      plateType: d.plateType,
      rol: prev ? prev.rol : 'rotativo',
      proteinType: tuple[1] ? (PROTEIN_FAMILY[tuple[1]] || tuple[1]) : '',
      containsGluten: proposeGluten(nombreSugerido, d.plateType),
      containsLactosa: proposeLactosa(nombreSugerido, d.plateType),
      glutenFreeAdaptable: '',
      batchable: prev ? prev.batchable : '',
      leftoverQuality: prev ? prev.leftoverQuality : '',
      shelfLifeDays: prev ? prev.shelfLifeDays : '',
      congelable: '',
      energiaCocina: prev ? prev.energiaCocina : '',
      yaAnotado: prev ? 'sí' : 'no',
      revisarTipo: d.reviewPlateType
        ? (d.plateTypeLibre || `${d.plateType} (asignado, sin plateTypeLibre — combo: ${PROTEIN_FAMILY[tuple[1]] || tuple[1]}/${tuple[6] || 'sin metodo'})`)
        : '',
      fuente: 'scaffold',
    });
  }

  for (const f of freeformEditorial) {
    n++;
    rows.push({
      n,
      nombre: f.nombre,
      momento: '',
      plateType: f.plateType,
      rol: f.rol === 'TODO' ? 'rotativo' : f.rol,
      proteinType: f.proteinType ?? '',
      containsGluten: typeof f.containsGluten === 'boolean' ? (f.containsGluten ? 'sí' : 'no') : proposeGluten(f.nombre, f.plateType),
      containsLactosa: typeof f.containsLactosa === 'boolean' ? (f.containsLactosa ? 'sí' : 'no') : proposeLactosa(f.nombre, f.plateType),
      glutenFreeAdaptable: '',
      batchable: f.batchable === 'TODO' ? '' : f.batchable,
      leftoverQuality: f.leftoverQuality === 'TODO' ? '' : f.leftoverQuality,
      shelfLifeDays: f.shelfLifeDays === 'TODO' ? '' : f.shelfLifeDays,
      congelable: f.congelable === 'TODO' ? '' : f.congelable,
      energiaCocina: '',
      yaAnotado: 'no',
      revisarTipo: f.reviewPlateType ? (f.plateTypeLibre || '(sin origen visible)') : '',
      fuente: 'freeform',
    });
  }

  for (const p of PREVIOUS_ANNOTATIONS) {
    if (!matchedPrevious.has(p.nombre)) unmatchedReport.push(p.nombre);
  }

  return { rows, unmatchedReport, totalScaffold: dishesScaffold.length, totalFreeform: freeformEditorial.length };
}

const LEYENDA_TEXT = `CÓMO ANOTAR — tu trabajo son estas columnas:

• batchable — ¿harías una olla/bandeja grande para varios días? Guisos, legumbres, arroz al horno, cremas → sí. Plancha rápida, ensalada, pescado del día → no.

• leftoverQuality — recalentado mañana: alta = mejora/aguanta (guisos, legumbres, cremas); media = se come pero pierde algo (plancha, arroces); baja = da pena (fritos, crujientes, pescado blanco, ensalada).

• shelfLifeDays — días en nevera: pescado 1; ave/carne plancha 2; cerdo/ternera guisada 3; legumbre/guiso 3–4; crema 2–3.

• congelable — ¿aguanta congelado? sí (guisos, legumbres, cremas, salsas, caldos); no (ensaladas, fritos, arroz/pasta ya salseada, patata en guiso, mayonesa, huevo); pre-cocinado (se congela crudo/a medio y se termina: hamburguesas, croquetas/empanadillas sin freír). OJO: batchable ≠ congelable (la ensaladilla es batchable pero NO congelable).

• energiaCocina — esfuerzo: bajo (plancha/salteado <15 min); medio (horno con su tiempo o varios elementos); alto (guiso largo, asado, elaboración).

• containsGluten / containsLactosa — VIENEN CON UNA PROPUESTA automática. Confírmala o corrígela, sobre todo si tu receta lleva harina o leche escondida (sofrito con harina, caldo, salsa de soja, un toque de nata, bechamel). Un alérgeno mal puesto es peligroso: revísalos. Quedan confirmados cuando marcas "ya anotado=sí".

• glutenFreeAdaptable — ¿se puede hacer sin gluten fácil y queda igual? sí/no. (Vacía: rellénala tú.)

• revisar tipo — donde lo veas, dinos la categoría de esta lista: caliente_arroz, caliente_patata, caliente_boniato, plancha_verdura, pescado_plancha, pescado_horno, en_salsa, asado, legumbre, guiso, sopa_crema, arroz_plato, pasta, masa, gratinado, relleno, huevo_plancha, tortilla, ensalada, bowl, salteado_wok, bocado_mano, airfryer, crudo.

• rol — ya viene puesto; rotativo = diario, capricho = gusto, ancla = no tocar. Nombre sugerido — corrígelo si no te gusta.

NO toques las columnas ya rellenas salvo error claro. No anotes "ya anotado=sí" hasta tener la fila entera (incluidos alérgenos). Puedes ir por tandas: marca "ya anotado=sí" en lo que termines.

EJEMPLOS RESUELTOS:
Garbanzos con berenjena salteado | legumbre | batch sí | leftover media | 3 días | energia bajo
Huevo con tomate en crudo | crudo | sí | alta | 3 | bajo
Garbanzos con pimientos guisado | legumbre | sí | alta | 4 | medio
Ternera con patata y zanahoria guisado | caliente_patata | sí | alta | 4 | alto`;

async function main() {
  const { rows, unmatchedReport, totalScaffold, totalFreeform } = buildPlatosRows();

  const wb = new ExcelJS.Workbook();
  const wsPlatos = wb.addWorksheet('Platos');
  wsPlatos.columns = [
    { header: 'Nº', key: 'n', width: 6 },
    { header: 'Nombre sugerido', key: 'nombre', width: 42 },
    { header: 'momento', key: 'momento', width: 14 },
    { header: 'plateType', key: 'plateType', width: 16 },
    { header: 'rol', key: 'rol', width: 10 },
    { header: 'proteinType', key: 'proteinType', width: 12 },
    { header: 'containsGluten', key: 'containsGluten', width: 14 },
    { header: 'containsLactosa', key: 'containsLactosa', width: 15 },
    { header: 'glutenFreeAdaptable', key: 'glutenFreeAdaptable', width: 18 },
    { header: 'batchable', key: 'batchable', width: 10 },
    { header: 'leftoverQuality', key: 'leftoverQuality', width: 15 },
    { header: 'shelfLifeDays', key: 'shelfLifeDays', width: 13 },
    { header: 'congelable', key: 'congelable', width: 13 },
    { header: 'energiaCocina', key: 'energiaCocina', width: 13 },
    { header: 'ya anotado', key: 'yaAnotado', width: 11 },
    { header: 'revisar tipo', key: 'revisarTipo', width: 20 },
    { header: 'fuente', key: 'fuente', width: 10 },
  ];
  wsPlatos.getRow(1).font = { bold: true };
  for (const r of rows) wsPlatos.addRow(r);
  wsPlatos.views = [{ state: 'frozen', ySplit: 1 }];

  const wsLeyenda = wb.addWorksheet('Leyenda');
  wsLeyenda.getColumn(1).width = 110;
  LEYENDA_TEXT.split('\n').forEach((line) => {
    const row = wsLeyenda.addRow([line]);
    row.getCell(1).alignment = { wrapText: true };
  });

  const outPath = new URL('./output/Anotacion_cocinero_242.xlsx', import.meta.url);
  await wb.xlsx.writeFile(outPath);

  // ── Validaciones ──
  const total = rows.length;
  const matched6 = PREVIOUS_ANNOTATIONS.length - unmatchedReport.length;
  const reviewRows = rows.filter((r) => r.revisarTipo);
  const dist = {};
  for (const r of rows) dist[r.plateType] = (dist[r.plateType] || 0) + 1;

  console.log(`Total filas: ${total} (scaffold=${totalScaffold} + freeform=${totalFreeform})`);
  console.log(`Fusionados (6 esperados): ${matched6}/6`);
  if (unmatchedReport.length) console.log('  NO matcheados:', unmatchedReport);
  console.log(`Filas con revisar tipo: ${reviewRows.length}`);
  for (const r of reviewRows) console.log(`  - #${r.n} [${r.fuente}] ${r.nombre} -> revisarTipo="${r.revisarTipo}"`);
  console.log('Distribución plateType (242):');
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
  console.log(`Archivo escrito en: ${outPath.pathname.replace(/^\//, '')}`);
}

// Solo ejecuta al correr este archivo directamente (node exportCocinero.js),
// no al importarlo (importAnotacion.js reutiliza suggestNameFromTuple /
// regenerateNombreSugerido sin querer regenerar el xlsx como efecto lateral).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
