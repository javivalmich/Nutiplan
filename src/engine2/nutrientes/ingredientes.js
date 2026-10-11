// Ingredientes — vocabulario canónico de lo que lleva un plato, para medir y,
// más adelante, calcular raciones con números reales.
//
// Cada ingrediente tiene:
//   - nombre: cómo se compra o se nombra.
//   - grupo: proteina | hidrato | verdura | fruta | lacteo | grasa | legumbre |
//            frutoSeco | salsa | condimento | otro.
//   - estado: en qué estado están los gramos que se escriben en el plan
//            (crudo, seco, cocido, conserva, listo). La composición se toma
//            de BEDCA para ese mismo estado.
//   - gUd: gramos de parte comestible de una unidad («1 huevo», «1 aguacate»).
//   - gCda / gCdita: gramos de una cucharada / cucharadita.
//   - gMl: gramos por ml (aceites, leche, caldos).
//   - despreciable: aporte nulo a efectos del medidor (sal, especias, hierbas).
//
// Los pesos por unidad y por cucharada son medias de cocina doméstica
// (ESTIMACIÓN, sin fuente oficial; revisables). La composición nutricional no
// está aquí: vive en composicion.json, generada desde BEDCA.

const I = (nombre, grupo, extra = {}) => Object.freeze({ nombre, grupo, estado: 'crudo', ...extra });

export const INGREDIENTES = Object.freeze({
  // ── Proteínas animales ───────────────────────────────────────────────────
  pollo_pechuga: I('Pechuga de pollo', 'proteina'),
  pollo_muslo: I('Pollo (muslo y contramuslo)', 'proteina'),
  pollo_picado: I('Pollo picado', 'proteina'),
  pollo_cocido: I('Pechuga de pollo cocida', 'proteina', { estado: 'cocido' }),
  pavo_pechuga: I('Pechuga de pavo', 'proteina'),
  pavo_picado: I('Pavo picado', 'proteina'),
  ternera_magra: I('Ternera magra', 'proteina'),
  ternera_picada: I('Ternera picada magra', 'proteina'),
  cerdo_lomo: I('Lomo de cerdo', 'proteina'),
  conejo: I('Conejo', 'proteina'),
  jamon_serrano: I('Jamón serrano', 'proteina', { estado: 'listo', gLoncha: 15 }),
  jamon_cocido: I('Jamón cocido / pechuga de pavo en lonchas', 'proteina', { estado: 'listo', gLoncha: 15 }),
  lacon: I('Lacón', 'proteina', { estado: 'cocido' }),
  chorizo: I('Chorizo', 'proteina', { estado: 'listo' }),
  morcilla: I('Morcilla', 'proteina', { estado: 'listo' }),
  panceta: I('Panceta', 'proteina'),
  huevo: I('Huevo', 'proteina', { gUd: 53 }),
  clara: I('Clara de huevo', 'proteina', { gUd: 33 }),
  salmon: I('Salmón', 'proteina'),
  salmon_ahumado: I('Salmón ahumado', 'proteina', { estado: 'listo' }),
  merluza: I('Merluza / pescado blanco', 'proteina'),
  bacalao: I('Bacalao fresco', 'proteina'),
  dorada: I('Dorada', 'proteina'),
  corvina: I('Corvina / lubina', 'proteina'),
  sardina: I('Sardinas', 'proteina'),
  bonito: I('Bonito / atún fresco', 'proteina'),
  atun_conserva: I('Atún en conserva al natural', 'proteina', { estado: 'conserva' }),
  gambas: I('Gambas', 'proteina'),
  calamar: I('Calamares', 'proteina'),
  mejillon: I('Mejillones', 'proteina', { gUd: 7 }),
  berberecho: I('Berberechos', 'proteina'),
  tofu: I('Tofu firme', 'proteina'),

  // ── Legumbres ────────────────────────────────────────────────────────────
  lentejas_seco: I('Lentejas', 'legumbre', { estado: 'seco' }),
  lentejas_cocidas: I('Lentejas cocidas', 'legumbre', { estado: 'cocido' }),
  garbanzos_seco: I('Garbanzos', 'legumbre', { estado: 'seco' }),
  garbanzos_cocidos: I('Garbanzos cocidos', 'legumbre', { estado: 'cocido' }),
  alubias_seco: I('Alubias', 'legumbre', { estado: 'seco' }),
  alubias_cocidas: I('Alubias cocidas', 'legumbre', { estado: 'cocido' }),
  edamame: I('Edamame', 'legumbre'),
  guisantes: I('Guisantes', 'legumbre'),
  hummus: I('Hummus', 'legumbre', { estado: 'listo', gCda: 15 }),

  // ── Hidratos ─────────────────────────────────────────────────────────────
  arroz_seco: I('Arroz', 'hidrato', { estado: 'seco' }),
  arroz_integral_cocido: I('Arroz integral cocido', 'hidrato', { estado: 'cocido' }),
  pasta_seco: I('Pasta', 'hidrato', { estado: 'seco' }),
  pasta_integral_seco: I('Pasta integral', 'hidrato', { estado: 'seco' }),
  fideos_arroz_seco: I('Fideos de arroz', 'hidrato', { estado: 'seco' }),
  gnocchi: I('Gnocchi de patata', 'hidrato', { estado: 'listo' }),
  quinoa_seco: I('Quinoa', 'hidrato', { estado: 'seco' }),
  patata: I('Patata', 'hidrato', { gUd: 200 }),
  boniato: I('Boniato', 'hidrato', { gUd: 250 }),
  pan_blanco: I('Pan de pueblo / barra', 'hidrato', { estado: 'listo' }),
  pan_integral: I('Pan integral', 'hidrato', { estado: 'listo' }),
  pan_centeno: I('Pan de centeno', 'hidrato', { estado: 'listo' }),
  pan_rallado: I('Pan rallado', 'hidrato', { estado: 'listo', gCda: 8 }),
  tortilla_trigo: I('Tortilla de trigo / pita', 'hidrato', { estado: 'listo', gUd: 60 }),
  tortilla_maiz: I('Tortilla de maíz', 'hidrato', { estado: 'listo', gUd: 30 }),
  avena: I('Copos de avena', 'hidrato', { estado: 'seco' }),
  muesli: I('Muesli / granola', 'hidrato', { estado: 'seco' }),
  harina: I('Harina de trigo', 'hidrato', { estado: 'seco', gCda: 10, gCdita: 3 }),
  masa_empanada: I('Masa de empanada / hojaldre', 'hidrato', { estado: 'listo' }),
  maiz: I('Maíz dulce', 'hidrato', { estado: 'conserva' }),
  croquetas: I('Croquetas de jamón', 'otro', { estado: 'listo', gUd: 22 }),

  // ── Verduras y hortalizas ────────────────────────────────────────────────
  acelga: I('Acelgas', 'verdura'),
  alcachofa: I('Alcachofa', 'verdura', { gUd: 40 }),
  berenjena: I('Berenjena', 'verdura', { gUd: 250 }),
  brocoli: I('Brócoli', 'verdura'),
  calabacin: I('Calabacín', 'verdura', { gUd: 250 }),
  calabaza: I('Calabaza', 'verdura'),
  cebolla: I('Cebolla', 'verdura', { gUd: 120 }),
  champinon: I('Champiñones / setas', 'verdura'),
  coliflor: I('Coliflor', 'verdura'),
  col: I('Col / repollo / col china / pak choi', 'verdura', { gUd: 200 }),
  coles_bruselas: I('Coles de Bruselas', 'verdura'),
  esparrago: I('Espárragos', 'verdura', { gUd: 20 }),
  espinaca: I('Espinacas', 'verdura'),
  grelos: I('Grelos', 'verdura'),
  judia_verde: I('Judías verdes', 'verdura'),
  lechuga: I('Lechuga / mezclum / rúcula', 'verdura', { gHoja: 10 }),
  pepino: I('Pepino', 'verdura', { gUd: 250 }),
  pimiento: I('Pimiento', 'verdura', { gUd: 150 }),
  puerro: I('Puerro', 'verdura', { gUd: 100 }),
  tomate: I('Tomate', 'verdura', { gUd: 120 }),
  tomate_cherry: I('Tomate cherry', 'verdura', { gUd: 12 }),
  tomate_triturado: I('Tomate triturado / frito', 'verdura', { estado: 'conserva', gCda: 15 }),
  zanahoria: I('Zanahoria', 'verdura', { gUd: 70 }),
  brotes_soja: I('Brotes de soja', 'verdura'),
  algas: I('Algas', 'verdura', { estado: 'seco', gUd: 3 }),
  aceituna: I('Aceitunas', 'grasa', { estado: 'conserva', gUd: 4 }),
  pepinillo: I('Pepinillos', 'verdura', { estado: 'conserva', gUd: 15 }),

  // ── Frutas ───────────────────────────────────────────────────────────────
  fruta: I('Fruta de temporada', 'fruta', { gUd: 150 }),
  platano: I('Plátano', 'fruta', { gUd: 120 }),
  frutos_rojos: I('Fresas / frutos rojos', 'fruta'),
  pina: I('Piña', 'fruta'),
  limon: I('Limón / lima (zumo)', 'condimento', { despreciable: true }),
  aguacate: I('Aguacate', 'grasa', { gUd: 140 }),
  coco_rallado: I('Coco rallado', 'grasa', { estado: 'seco', gCda: 5 }),

  // ── Lácteos ──────────────────────────────────────────────────────────────
  leche_semi: I('Leche semidesnatada', 'lacteo', { estado: 'listo', gMl: 1.03 }),
  leche_desnatada: I('Leche desnatada', 'lacteo', { estado: 'listo', gMl: 1.03 }),
  bebida_vegetal: I('Bebida vegetal', 'lacteo', { estado: 'listo', gMl: 1.02 }),
  leche_coco: I('Leche de coco light', 'grasa', { estado: 'listo', gMl: 1.0 }),
  yogur_griego_0: I('Yogur griego 0 %', 'lacteo', { estado: 'listo', gUd: 125 }),
  yogur_natural: I('Yogur natural', 'lacteo', { estado: 'listo', gUd: 125 }),
  skyr: I('Queso fresco batido / skyr', 'lacteo', { estado: 'listo' }),
  queso_fresco: I('Queso fresco / queso light', 'lacteo', { estado: 'listo', gLoncha: 20 }),
  queso_crema: I('Queso crema light', 'lacteo', { estado: 'listo', gCda: 15 }),
  mozzarella: I('Mozzarella', 'lacteo', { estado: 'listo' }),
  feta: I('Queso feta', 'lacteo', { estado: 'listo' }),
  queso_curado: I('Parmesano / queso rallado', 'lacteo', { estado: 'listo', gCda: 6 }),
  mantequilla: I('Mantequilla', 'grasa', { estado: 'listo', gCda: 12 }),

  // ── Grasas, frutos secos y semillas ──────────────────────────────────────
  aove: I('Aceite de oliva virgen extra', 'grasa', { estado: 'listo', gMl: 0.92, gCda: 12, gCdita: 4 }),
  aceite_semillas: I('Aceite de girasol / sésamo', 'grasa', { estado: 'listo', gMl: 0.92, gCda: 12, gCdita: 4 }),
  almendra: I('Almendras', 'frutoSeco', { estado: 'listo' }),
  nuez: I('Nueces', 'frutoSeco', { estado: 'listo' }),
  pistacho: I('Pistachos', 'frutoSeco', { estado: 'listo' }),
  cacahuete: I('Cacahuetes', 'frutoSeco', { estado: 'listo' }),
  crema_cacahuete: I('Crema de cacahuete', 'frutoSeco', { estado: 'listo', gCda: 16 }),
  semillas: I('Semillas (chía, lino, sésamo, calabaza)', 'frutoSeco', { estado: 'listo', gCda: 10, gCdita: 4 }),
  tahini: I('Tahini', 'frutoSeco', { estado: 'listo', gCda: 15 }),

  // ── Salsas y endulzantes con aporte ─────────────────────────────────────
  mayonesa_ligera: I('Mayonesa ligera', 'salsa', { estado: 'listo', gCda: 15 }),
  alioli: I('Alioli', 'salsa', { estado: 'listo', gCda: 15 }),
  miel: I('Miel / azúcar', 'salsa', { estado: 'listo', gCda: 20, gCdita: 7 }),
  salsa_soja: I('Salsa de soja', 'salsa', { estado: 'listo', gMl: 1.1, gCda: 16, gCdita: 6 }),
  miso: I('Pasta de miso', 'salsa', { estado: 'listo', gCda: 15 }),
  ketchup: I('Ketchup', 'salsa', { estado: 'listo', gCda: 15 }),
  caldo: I('Caldo / fumet', 'condimento', { estado: 'listo', gMl: 1.0, despreciable: true }),
  vino: I('Vino blanco (para cocinar)', 'condimento', { estado: 'listo', gMl: 1.0, despreciable: true }),

  // ── Sin aporte relevante ─────────────────────────────────────────────────
  condimento: I('Sal, especias, hierbas, ajo, vinagre, mostaza…', 'condimento', { despreciable: true }),
});

export const CLAVES_INGREDIENTES = Object.freeze(Object.keys(INGREDIENTES));
