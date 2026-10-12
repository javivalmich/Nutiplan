/* ────────────────────────────────────────────────────────────────
 * DESAYUNOS.js — desayunos y tentempiés de engine2 (D-110)
 * ────────────────────────────────────────────────────────────────
 * DATA ONLY. Los desayunos que antes ponía el motor viejo (buildPlan.js,
 * BF y BF_SG), escritos aquí con texto fijo, más desayunos y tentempiés
 * nuevos redactados por Claude el 2026-10-12 a petición de Javi (pendientes
 * de su revisión en el visor). Los veganos propios de D-107 siguen en
 * PLATOS_DIETA.js y aquí solo se les pone ficha.
 *
 * Las cantidades son de una persona de unas 2000 kcal; las ajustan las
 * raciones de engine2 (D-100). La adaptación a la dieta, a SIBO y a la
 * intolerancia a la lactosa la hace la app antes de elegir.
 *
 * Ficha (lo que mira engine2 para elegir, sin puntuar):
 *   - rapido: se hace en 10 minutos o menos (o se deja hecho la noche antes).
 *   - finde: desayuno más elaborado, para el fin de semana.
 *   - llevar: tentempié que se puede llevar fuera de casa (media mañana).
 *   - base: lo que es el desayuno o tentempié, para no repetir lo mismo el
 *     mismo día (yogur en el desayuno y yogur a media mañana).
 *   - proteina: de dónde sale la proteína principal.
 *   - soloDieta: solo para perfiles vegetarianos o veganos (D-107).
 * ──────────────────────────────────────────────────────────────── */

import { DESAYUNOS_DIETA, TENTEMPIES_DIETA } from './PLATOS_DIETA.js';

function des(p) {
  return Object.freeze({
    id: p.id, tipo: 'desayuno', time: 'Desayuno', emoji: p.emoji || '🌅', title: p.titulo,
    p1: p.p1, p2: p.p2, shopping: p.compra, recipe: p.receta, metadata: { tiempo: p.tiempo },
    ficha: Object.freeze({ rapido: p.tiempo <= 10, finde: !!p.finde, llevar: false, base: p.base, proteina: p.proteina, soloDieta: !!p.soloDieta }),
  });
}

function tent(p) {
  return Object.freeze({
    id: p.id, tipo: 'tentempie', time: 'Almuerzo', emoji: p.emoji || '🍎', title: p.titulo,
    p1: p.p1, p2: p.p2 || '', shopping: p.compra, recipe: p.receta, metadata: { tiempo: p.tiempo || 2 },
    ficha: Object.freeze({ rapido: true, finde: false, llevar: !!p.llevar, base: p.base, proteina: p.proteina, soloDieta: !!p.soloDieta }),
  });
}

// Los veganos de D-107, con su ficha.
const FICHA_DIETA = Object.freeze({
  des_revuelto_tofu: { tiempo: 6, base: 'tofu', proteina: 'tofu' },
  des_batido_tofu_sedoso: { tiempo: 3, base: 'batido', proteina: 'tofu' },
  des_tostada_tofu_aguacate: { tiempo: 8, base: 'tostada', proteina: 'tofu' },
  des_avena_soja_platano: { tiempo: 6, base: 'avena', proteina: 'soja' },
  des_yogur_soja_avena: { tiempo: 3, base: 'yogur', proteina: 'soja' },
  des_tostadas_aguacate: { tiempo: 5, base: 'tostada', proteina: 'vegetal' },
  des_pudin_chia: { tiempo: 3, base: 'chia', proteina: 'soja' },
  des_tostada_cacahuete: { tiempo: 3, base: 'tostada', proteina: 'vegetal' },
  tent_yogur_soja_fruta: { llevar: true, base: 'yogur', proteina: 'soja' },
  tent_hummus_crudites: { llevar: true, base: 'hummus', proteina: 'legumbre' },
  tent_tostada_cacahuete: { llevar: true, base: 'tostada', proteina: 'vegetal' },
  tent_edamame: { llevar: true, base: 'edamame', proteina: 'soja' },
});

function deDieta(m, tipo) {
  const f = FICHA_DIETA[m._dietaId];
  if (!f) throw new Error(`DESAYUNOS: sin ficha para ${m._dietaId}`);
  const comun = { id: m._dietaId, titulo: m.title, emoji: m.emoji, p1: m.p1, p2: m.p2, compra: m.shopping, receta: m.recipe, soloDieta: true, ...f };
  return tipo === 'desayuno' ? des(comun) : tent(comun);
}

export const DESAYUNOS = Object.freeze([
  // ═══ Los del motor viejo, con gluten ════════════════════════════════════
  des({
    id: 'des_avena_fresas_nueces', titulo: 'Avena caliente con fresas y nueces', tiempo: 8, base: 'avena', proteina: 'lacteo',
    p1: 'Copos de avena (55g) cocidos en leche semidesnatada (200ml) · fresas (100g) · nueces (20g)',
    p2: 'Yogur griego 0% (125g) · canela · café o té',
    compra: ['Copos de avena (55g)', 'Leche semidesnatada (200ml)', 'Fresas (100g)', 'Nueces (20g)', 'Yogur griego 0% (1 ud / 125g)', 'Canela'],
    receta: ['Calienta la leche a fuego medio, añade la avena y remueve 5 min.', 'Pon por encima las fresas troceadas y las nueces.', 'Sirve con el yogur aparte y canela.'],
  }),
  des({
    id: 'des_avena_overnight', titulo: 'Avena de la noche anterior con fruta y pistachos', tiempo: 3, base: 'avena', proteina: 'lacteo',
    p1: 'Copos de avena (50g) · yogur griego 0% (250g) · fruta de temporada (1 ud) · pistachos (15g)',
    p2: 'Con canela · café o té',
    compra: ['Copos de avena (50g)', 'Yogur griego 0% (2 ud / 250g)', 'Fruta de temporada (1 ud)', 'Pistachos (15g)', 'Canela'],
    receta: ['La noche antes, mezcla la avena con el yogur en un bote, tápalo y déjalo en la nevera.', 'Por la mañana, pon la fruta troceada, los pistachos y la canela.'],
  }),
  des({
    id: 'des_tostadas_tomate_jamon', titulo: 'Tostadas con tomate y jamón', tiempo: 5, base: 'tostada', proteina: 'embutido',
    p1: 'Pan de centeno (60g) tostado · tomate rallado (70g) · AOVE (5ml) · jamón serrano (40g)',
    p2: 'Yogur griego 0% (125g) · café o té',
    compra: ['Pan de centeno (60g)', 'Tomate (1 / 150g)', 'AOVE (5ml)', 'Jamón serrano (40g)', 'Yogur griego 0% (1 ud / 125g)'],
    receta: ['Tuesta el pan.', 'Ralla el tomate por encima, añade el aceite y una pizca de sal.', 'Pon el jamón y sirve el yogur aparte.'],
  }),
  des({
    id: 'des_huevos_revueltos_tostada', titulo: 'Huevos revueltos con tostada y fruta', tiempo: 6, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) revueltos · pan integral (60g) tostado · AOVE (5ml)',
    p2: 'Fruta de temporada (1 ud) · café o té',
    compra: ['Huevos (2 ud)', 'Pan integral (60g)', 'AOVE (5ml)', 'Fruta de temporada (1 ud)'],
    receta: ['Bate los huevos con sal y pimienta.', 'Cuájalos en la sartén con el aceite a fuego medio, removiendo despacio 2-3 min.', 'Sirve con el pan tostado y la fruta.'],
  }),
  des({
    id: 'des_tostada_aguacate_huevo', titulo: 'Tostada con aguacate y huevo poché', tiempo: 12, finde: true, base: 'huevo', proteina: 'huevo',
    p1: 'Pan integral (60g) tostado · aguacate (1/2) chafado con limón · huevos (2 ud) poché',
    p2: 'Con sal y pimienta · café o té',
    compra: ['Pan integral (60g)', 'Aguacate (1/2)', 'Huevos (2 ud)', 'Limón (1/2)'],
    receta: ['Tuesta el pan y unta el aguacate chafado con limón y sal.', 'Hierve agua con un chorrito de vinagre, haz un remolino y cuece cada huevo 3 min.', 'Pon los huevos sobre la tostada.'],
  }),
  des({
    id: 'des_tostada_salmon_queso', titulo: 'Tostada con salmón ahumado y queso crema', tiempo: 4, base: 'tostada', proteina: 'pescado',
    p1: 'Pan de centeno (60g) tostado · queso crema light (30g) · salmón ahumado (60g)',
    p2: 'Alcaparras y eneldo · café o té',
    compra: ['Pan de centeno (60g)', 'Queso crema light (30g)', 'Salmón ahumado (60g)', 'Alcaparras', 'Eneldo'],
    receta: ['Tuesta el pan y unta el queso crema.', 'Pon encima el salmón, las alcaparras y el eneldo.'],
  }),
  des({
    id: 'des_revuelto_espinacas', titulo: 'Revuelto de espinacas y tomate con tostada', tiempo: 8, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) · espinacas frescas (60g) · tomate cherry (60g) · pan integral (50g) tostado',
    p2: 'Con orégano · café o té',
    compra: ['Huevos (2 ud)', 'Espinacas frescas (60g)', 'Tomate cherry (60g)', 'Pan integral (50g)', 'AOVE (5ml)', 'Orégano'],
    receta: ['Saltea las espinacas con el aceite 2 min y añade los tomates partidos.', 'Echa los huevos batidos y remueve a fuego medio hasta que cuajen.', 'Sirve con el pan tostado.'],
  }),
  des({
    id: 'des_yogur_granola', titulo: 'Bol de yogur con granola y fruta', tiempo: 3, base: 'yogur', proteina: 'lacteo',
    p1: 'Yogur griego 0% (250g) · granola sin azúcar añadido (40g) · fruta de temporada (1 ud)',
    p2: 'Con canela · café o té',
    compra: ['Yogur griego 0% (2 ud / 250g)', 'Granola sin azúcar añadido (40g)', 'Fruta de temporada (1 ud)', 'Canela'],
    receta: ['Pon el yogur en un bol.', 'Añade la fruta troceada y la granola justo antes de comer, para que cruja.'],
  }),
  des({
    id: 'des_tortitas_avena_platano', titulo: 'Tortitas de avena y plátano', tiempo: 15, finde: true, base: 'tortitas', proteina: 'huevo',
    p1: 'Copos de avena (50g) · plátano (1) · huevos (2 ud), en tortitas',
    p2: 'Con yogur griego 0% (125g) y canela · café',
    compra: ['Copos de avena (50g)', 'Plátano (1)', 'Huevos (2 ud)', 'Yogur griego 0% (1 ud / 125g)', 'Canela'],
    receta: ['Tritura la avena, el plátano y los huevos hasta tener una masa.', 'En una sartén antiadherente con unas gotas de aceite, haz tortitas de 2 min por lado.', 'Sirve con el yogur y canela.'],
  }),
  des({
    id: 'des_muesli_yogur', titulo: 'Muesli con yogur y almendras', tiempo: 3, base: 'yogur', proteina: 'lacteo',
    p1: 'Muesli sin azúcar (45g) · yogur griego 0% (250g) · fruta de temporada (1 ud)',
    p2: 'Almendras (15g) · café o té',
    compra: ['Muesli sin azúcar (45g)', 'Yogur griego 0% (2 ud / 250g)', 'Fruta de temporada (1 ud)', 'Almendras (15g)'],
    receta: ['Mezcla el muesli con el yogur y deja 1-2 min que se ablande.', 'Pon encima la fruta troceada y las almendras.'],
  }),

  // ═══ Los del motor viejo, sin gluten ════════════════════════════════════
  des({
    id: 'des_claras_espinacas', titulo: 'Claras a la plancha con espinacas, tomate y fruta', tiempo: 7, base: 'huevo', proteina: 'huevo',
    p1: 'Claras de huevo (4 ud) · espinacas frescas (60g) · tomate (1 / 150g) en rodajas',
    p2: 'Fruta de temporada (1 ud) · café o té',
    compra: ['Claras de huevo (4 ud)', 'Espinacas frescas (60g)', 'Tomate (1 / 150g)', 'Fruta de temporada (1 ud)', 'AOVE (5ml)'],
    receta: ['Saltea las espinacas con el aceite 2 min y reserva.', 'Cuaja las claras batidas con sal y pimienta a fuego medio.', 'Sirve con las espinacas, el tomate y la fruta.'],
  }),
  des({
    id: 'des_macedonia_yogur', titulo: 'Macedonia con yogur y semillas', tiempo: 5, base: 'yogur', proteina: 'lacteo',
    p1: 'Fruta de temporada (2 ud) en dados · yogur griego 0% (250g) · semillas de calabaza (10g)',
    p2: 'Con zumo de limón · café o té',
    compra: ['Fruta de temporada (2 ud)', 'Yogur griego 0% (2 ud / 250g)', 'Semillas de calabaza (10g)', 'Limón (1/2)'],
    receta: ['Trocea la fruta y alíñala con el zumo de limón.', 'Sirve con el yogur por encima y las semillas.'],
  }),
  des({
    id: 'des_bol_chia_yogur', titulo: 'Bol de yogur con chía y frutos rojos', tiempo: 5, base: 'yogur', proteina: 'lacteo',
    p1: 'Yogur griego 0% (250g) · semillas de chía (15g) · frutos rojos (100g)',
    p2: 'Con canela · café o té',
    compra: ['Yogur griego 0% (2 ud / 250g)', 'Semillas de chía (15g)', 'Frutos rojos (100g)', 'Canela'],
    receta: ['Mezcla el yogur con la chía y deja reposar 5 min (o prepáralo la noche antes).', 'Pon los frutos rojos por encima.'],
  }),
  des({
    id: 'des_batido_proteico_platano', titulo: 'Batido con leche, yogur, plátano y cacahuete', tiempo: 3, base: 'batido', proteina: 'lacteo',
    p1: 'Leche semidesnatada (250ml) · yogur griego 0% (125g) · plátano (1) · crema de cacahuete (15g)',
    p2: 'Con canela · café o té',
    compra: ['Leche semidesnatada (250ml)', 'Yogur griego 0% (1 ud / 125g)', 'Plátano (1)', 'Crema de cacahuete (15g)', 'Canela'],
    receta: ['Tritura todo en la batidora hasta que quede fino.', 'Sírvelo frío.'],
  }),
  des({
    id: 'des_huevos_aguacate', titulo: 'Huevos revueltos con aguacate y tomate', tiempo: 7, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) revueltos · aguacate (1/2) en láminas · tomate (1 / 150g)',
    p2: 'Con sal y pimienta · café o té',
    compra: ['Huevos (2 ud)', 'Aguacate (1/2)', 'Tomate (1 / 150g)', 'AOVE (5ml)'],
    receta: ['Bate los huevos con sal y cuájalos a fuego lento removiendo.', 'Sirve con el aguacate en láminas y el tomate en rodajas.'],
  }),
  des({
    id: 'des_tortilla_claras_platano', titulo: 'Tortilla de claras con plátano y canela', tiempo: 7, base: 'huevo', proteina: 'huevo',
    p1: 'Claras de huevo (4 ud) en tortilla · plátano (1) en rodajas',
    p2: 'Con canela · café o té',
    compra: ['Claras de huevo (4 ud)', 'Plátano (1)', 'Canela'],
    receta: ['Bate las claras con canela y cuájalas en una sartén antiadherente a fuego medio.', 'Dobla la tortilla y sírvela con el plátano por encima.'],
  }),
  des({
    id: 'des_huevos_jamon_fruta', titulo: 'Huevos a la plancha con jamón y fruta', tiempo: 6, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) a la plancha · jamón serrano (30g)',
    p2: 'Fruta de temporada (1 ud) · café o té',
    compra: ['Huevos (2 ud)', 'Jamón serrano (30g)', 'Fruta de temporada (1 ud)', 'AOVE (5ml)'],
    receta: ['Haz los huevos a la plancha con unas gotas de aceite.', 'Pasa el jamón un momento por la sartén.', 'Sirve con la fruta al lado.'],
  }),
  des({
    id: 'des_smoothie_bol', titulo: 'Bol de frutas batidas con yogur y semillas', tiempo: 5, base: 'yogur', proteina: 'lacteo',
    p1: 'Frutos rojos congelados (150g) triturados con yogur griego 0% (250g) · semillas de calabaza (10g)',
    p2: 'Con coco rallado (5g) · café o té',
    compra: ['Frutas congeladas (150g)', 'Yogur griego 0% (2 ud / 250g)', 'Semillas de calabaza (10g)', 'Coco rallado (5g)'],
    receta: ['Tritura la fruta congelada con el yogur hasta que quede espeso.', 'Sirve en un bol con las semillas y el coco por encima.'],
  }),
  des({
    id: 'des_queso_batido_fruta', titulo: 'Queso fresco batido con fruta y canela', tiempo: 2, base: 'queso', proteina: 'lacteo',
    p1: 'Queso fresco batido 0% (250g) · fruta de temporada (1 ud) troceada',
    p2: 'Con canela · café o té',
    compra: ['Queso fresco batido 0% (250g)', 'Fruta de temporada (1 ud)', 'Canela'],
    receta: ['Pon el queso batido en un bol con la fruta troceada y la canela.'],
  }),

  // ═══ Nuevos (D-110) ═════════════════════════════════════════════════════
  des({
    id: 'des_pan_tomate_cafe_leche', titulo: 'Pan con tomate y aceite y café con leche', tiempo: 5, base: 'tostada', proteina: 'lacteo',
    p1: 'Pan integral (70g) tostado · tomate rallado (70g) · AOVE (5ml)',
    p2: 'Café con leche semidesnatada (250ml)',
    compra: ['Pan integral (70g)', 'Tomate (1 / 150g)', 'AOVE (5ml)', 'Leche semidesnatada (250ml)'],
    receta: ['Tuesta el pan, ralla el tomate por encima y añade el aceite y una pizca de sal.', 'Acompaña con el café con leche.'],
  }),
  des({
    id: 'des_tostada_queso_fresco_tomate', titulo: 'Tostada con queso fresco y tomate', tiempo: 4, base: 'tostada', proteina: 'lacteo',
    p1: 'Pan integral (60g) tostado · queso fresco tipo Burgos 0 % (100g) · tomate (1 / 150g) en rodajas',
    p2: 'Con orégano y un hilo de AOVE · café o té',
    compra: ['Pan integral (60g)', 'Queso fresco tipo Burgos 0 % (100g)', 'Tomate (1 / 150g)', 'AOVE (5ml)', 'Orégano'],
    receta: ['Tuesta el pan.', 'Pon encima el tomate en rodajas y el queso en lonchas, con orégano y el aceite.'],
  }),
  des({
    id: 'des_tostada_pavo_queso', titulo: 'Tostada con pavo, queso fresco y tomate', tiempo: 4, base: 'tostada', proteina: 'embutido',
    p1: 'Pan integral (60g) tostado · pavo en lonchas (50g) · queso fresco tipo Burgos 0 % (60g) · tomate',
    p2: 'Café con leche semidesnatada (200ml)',
    compra: ['Pan integral (60g)', 'Pavo en lonchas (50g)', 'Queso fresco tipo Burgos 0 % (60g)', 'Tomate (1 / 150g)', 'Leche semidesnatada (200ml)'],
    receta: ['Tuesta el pan.', 'Monta el tomate en rodajas, el queso y el pavo encima.', 'Acompaña con el café con leche.'],
  }),
  des({
    id: 'des_kefir_avena_frutos_rojos', titulo: 'Kéfir con avena y frutos rojos', tiempo: 3, base: 'yogur', proteina: 'lacteo',
    p1: 'Kéfir natural (250ml) · copos de avena (40g) · frutos rojos (100g)',
    p2: 'Con canela · café o té',
    compra: ['Kéfir natural (250ml)', 'Copos de avena (40g)', 'Frutos rojos (100g)', 'Canela'],
    receta: ['Mezcla el kéfir con la avena y deja 5 min (o desde la noche antes).', 'Pon los frutos rojos por encima.'],
  }),
  des({
    id: 'des_requeson_miel_nueces', titulo: 'Requesón con miel, nueces y tostada', tiempo: 4, base: 'queso', proteina: 'lacteo',
    p1: 'Requesón (150g) · miel (1 cdita) · nueces (15g) · pan integral (40g) tostado',
    p2: 'Café o té',
    compra: ['Requesón (150g)', 'Miel (1 cdita)', 'Nueces (15g)', 'Pan integral (40g)'],
    receta: ['Pon el requesón en un plato con la miel y las nueces troceadas.', 'Acompaña con el pan tostado.'],
  }),
  des({
    id: 'des_tortitas_arroz_cacahuete_yogur', titulo: 'Tortitas de arroz con crema de cacahuete, plátano y yogur', tiempo: 3, base: 'yogur', proteina: 'lacteo',
    p1: 'Tortitas de arroz (3 ud) · crema de cacahuete (15g) · plátano (1)',
    p2: 'Yogur griego 0% (250g) · café o té',
    compra: ['Tortitas de arroz (3 ud)', 'Crema de cacahuete (15g)', 'Plátano (1)', 'Yogur griego 0% (2 ud / 250g)'],
    receta: ['Unta las tortitas con la crema de cacahuete y pon el plátano en rodajas.', 'Acompaña con el yogur.'],
  }),
  des({
    id: 'des_tostada_tortilla_francesa', titulo: 'Tostada con tortilla francesa y tomate', tiempo: 7, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) en tortilla francesa · pan integral (60g) tostado · tomate rallado',
    p2: 'Café con leche semidesnatada (150ml)',
    compra: ['Huevos (2 ud)', 'Pan integral (60g)', 'Tomate (1 / 150g)', 'AOVE (5ml)', 'Leche semidesnatada (150ml)'],
    receta: ['Tuesta el pan y ralla el tomate por encima.', 'Bate los huevos con sal y cuájalos en la sartén con el aceite, doblando la tortilla.', 'Pon la tortilla sobre el pan.'],
  }),
  des({
    id: 'des_huevos_al_plato', titulo: 'Huevos al plato con tomate y pan', tiempo: 18, finde: true, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (2 ud) cuajados sobre tomate triturado (150g) con pimiento · pan integral (50g)',
    p2: 'Con pimentón dulce · café o té',
    compra: ['Huevos (2 ud)', 'Tomate triturado (150g)', 'Pimiento rojo (60g)', 'Pan integral (50g)', 'AOVE (5ml)', 'Pimentón dulce (1 cdita)'],
    receta: ['Sofríe el pimiento picado con el aceite 5 min y añade el tomate y el pimentón; cocina 5 min.', 'Haz dos huecos, casca los huevos y tapa hasta que cuaje la clara, 5-6 min.', 'Sirve con el pan para mojar.'],
  }),
  des({
    id: 'des_crepes_avena_queso', titulo: 'Crepes de avena con queso fresco batido y fruta', tiempo: 15, finde: true, base: 'tortitas', proteina: 'huevo',
    p1: 'Crepes de copos de avena (40g), huevos (2 ud) y leche semidesnatada (100ml) · queso fresco batido 0% (150g) · fruta',
    p2: 'Con canela · café o té',
    compra: ['Copos de avena (40g)', 'Huevos (2 ud)', 'Leche semidesnatada (100ml)', 'Queso fresco batido 0% (150g)', 'Fruta de temporada (1 ud)', 'Canela'],
    receta: ['Tritura la avena con los huevos y la leche hasta tener una masa fina.', 'Haz crepes finos en una sartén antiadherente, 1 min por lado.', 'Rellénalos con el queso batido y la fruta troceada, con canela.'],
  }),
  des({
    id: 'des_gachas_quinoa_manzana', titulo: 'Gachas de quinoa con bebida de arroz, fruta y semillas', tiempo: 8, base: 'avena', proteina: 'vegetal', soloDieta: true,
    p1: 'Copos de quinoa (50g) cocidos en bebida de arroz (250ml) · fruta de temporada (1 ud) · semillas de calabaza (20g)',
    p2: 'Con canela · café o té',
    compra: ['Copos de quinoa (50g)', 'Bebida de arroz (250ml)', 'Fruta de temporada (1 ud)', 'Semillas de calabaza (20g)', 'Canela'],
    receta: ['Cuece los copos de quinoa en la bebida de arroz 5 min removiendo.', 'Sirve con la fruta troceada, las semillas y canela.'],
  }),
  des({
    id: 'des_pudin_chia_arroz', titulo: 'Pudin de chía con bebida de arroz, fruta y semillas', tiempo: 3, base: 'chia', proteina: 'vegetal', soloDieta: true,
    p1: 'Semillas de chía (25g) en bebida de arroz (250ml) · fruta de temporada (1 ud) · semillas de calabaza (15g)',
    p2: 'Se deja preparado la noche anterior',
    compra: ['Semillas de chía (25g)', 'Bebida de arroz (250ml)', 'Fruta de temporada (1 ud)', 'Semillas de calabaza (15g)'],
    receta: ['Mezcla la chía con la bebida de arroz y deja en la nevera toda la noche.', 'Por la mañana remueve y pon la fruta troceada y las semillas.'],
  }),
  des({
    id: 'des_tostadas_sin_gluten_aguacate', titulo: 'Tostadas de pan sin gluten con aguacate, tomate y semillas', tiempo: 5, base: 'tostada', proteina: 'vegetal', soloDieta: true,
    p1: 'Pan sin gluten (70g) tostado · aguacate (1/2) · tomate (1 / 150g) · semillas de calabaza (15g)',
    p2: 'Café o té con bebida de arroz (200ml)',
    compra: ['Pan sin gluten (70g)', 'Aguacate (1/2)', 'Tomate (1 / 150g)', 'Semillas de calabaza (15g)', 'Bebida de arroz (200ml)'],
    receta: ['Tuesta el pan.', 'Machaca el aguacate con sal, úntalo y pon el tomate en rodajas y las semillas por encima.'],
  }),

  des({
    id: 'des_tostada_tofu_ahumado', titulo: 'Tostada con tomate y tofu ahumado', tiempo: 4, base: 'tostada', proteina: 'tofu', soloDieta: true,
    p1: 'Pan integral (60g) tostado · tomate rallado · tofu ahumado (120g) en lonchas finas',
    p2: 'Con un hilo de AOVE · café con bebida de soja (200ml)',
    compra: ['Pan integral (60g)', 'Tomate (1 / 150g)', 'Tofu ahumado (120g)', 'AOVE (5ml)', 'Bebida de soja (200ml)'],
    receta: ['Tuesta el pan, ralla el tomate por encima y añade el aceite y sal.', 'Pon el tofu en lonchas finas encima.'],
  }),
  des({
    id: 'des_batido_tofu_frutos_rojos', titulo: 'Batido de tofu sedoso, frutos rojos y avena', tiempo: 3, base: 'batido', proteina: 'tofu', soloDieta: true,
    p1: 'Tofu sedoso (150g) · bebida de soja (200ml) · frutos rojos (100g) · copos de avena (30g)',
    p2: 'Con canela',
    compra: ['Tofu sedoso (150g)', 'Bebida de soja (200ml)', 'Frutos rojos (100g)', 'Copos de avena (30g)', 'Canela'],
    receta: ['Tritura todo en la batidora hasta que quede fino.', 'Sírvelo frío.'],
  }),
  des({
    id: 'des_revuelto_tofu_champinones', titulo: 'Revuelto de tofu con espinacas, champiñones y pan', tiempo: 12, finde: true, base: 'tofu', proteina: 'tofu', soloDieta: true,
    p1: 'Tofu firme (180g) desmenuzado con cúrcuma · espinacas frescas (60g) · champiñones (100g) · pan integral (50g)',
    p2: 'Con pimienta negra · café o té',
    compra: ['Tofu firme (180g)', 'Espinacas frescas (60g)', 'Champiñones (100g)', 'Pan integral (50g)', 'Cúrcuma (1 cdita)', 'AOVE (10ml)'],
    receta: ['Saltea los champiñones laminados con el aceite 4 min.', 'Añade el tofu desmenuzado con la cúrcuma, sal y pimienta y saltea 3 min.', 'Echa las espinacas y deja 1 min más.', 'Sirve con el pan tostado.'],
  }),

  // ═══ Veganos de D-107 ═══════════════════════════════════════════════════
  ...DESAYUNOS_DIETA.map((m) => deDieta(m, 'desayuno')),
]);

export const TENTEMPIES = Object.freeze([
  // ═══ Los del motor viejo ════════════════════════════════════════════════
  tent({
    id: 'tent_fruta_frutos_secos', titulo: 'Fruta con frutos secos', llevar: true, base: 'fruta', proteina: 'frutos_secos',
    p1: 'Fruta de temporada (1 ud) · nueces o almendras (20g)', p2: 'Té o agua',
    compra: ['Fruta de temporada (1 ud)', 'Nueces o almendras (20g)'],
    receta: ['Lava la fruta y llévala con los frutos secos en un táper.'],
  }),
  tent({
    id: 'tent_yogur_fruta', titulo: 'Yogur con fruta', llevar: true, base: 'yogur', proteina: 'lacteo',
    p1: 'Yogur griego 0% (125g) · fruta de temporada (1 ud) troceada', p2: 'Con canela',
    compra: ['Yogur griego 0% (1 ud / 125g)', 'Fruta de temporada (1 ud)', 'Canela'],
    receta: ['Trocea la fruta encima del yogur.'],
  }),
  tent({
    id: 'tent_yogur_frutos_rojos_almendras', titulo: 'Yogur con frutos rojos y almendras', base: 'yogur', proteina: 'lacteo',
    p1: 'Yogur griego 0% (125g) · frutos rojos (80g) · almendras (15g)', p2: 'Té o infusión',
    compra: ['Yogur griego 0% (1 ud / 125g)', 'Frutos rojos (80g)', 'Almendras (15g)'],
    receta: ['Mezcla el yogur con los frutos rojos y pon las almendras por encima.'],
  }),
  tent({
    id: 'tent_fruta_cacahuetes', titulo: 'Plátano con cacahuetes', llevar: true, base: 'fruta', proteina: 'frutos_secos',
    p1: 'Plátano (1) · cacahuetes naturales (20g)', p2: 'Té o agua',
    compra: ['Plátano (1)', 'Cacahuetes naturales (20g)'],
    receta: ['Lleva el plátano y los cacahuetes en un táper.'],
  }),

  // ═══ Nuevos (D-110) ═════════════════════════════════════════════════════
  tent({
    id: 'tent_bocadillito_pavo', titulo: 'Bocadillo pequeño de pavo y tomate', llevar: true, base: 'bocadillo', proteina: 'embutido',
    p1: 'Pan integral (40g) · pavo en lonchas (40g) · tomate en rodajas', p2: '',
    compra: ['Pan integral (40g)', 'Pavo en lonchas (40g)', 'Tomate (1/2 / 75g)'],
    receta: ['Abre el pan, pon el tomate en rodajas y el pavo, y envuélvelo para llevar.'],
  }),
  tent({
    id: 'tent_bocadillito_queso', titulo: 'Bocadillo pequeño de queso fresco y tomate', llevar: true, base: 'bocadillo', proteina: 'lacteo',
    p1: 'Pan integral (40g) · queso fresco tipo Burgos 0 % (60g) · tomate en rodajas', p2: 'Con orégano',
    compra: ['Pan integral (40g)', 'Queso fresco tipo Burgos 0 % (60g)', 'Tomate (1/2 / 75g)', 'Orégano'],
    receta: ['Abre el pan, pon el tomate, el queso en lonchas y el orégano, y envuélvelo para llevar.'],
  }),
  tent({
    id: 'tent_huevo_cocido_fruta', titulo: 'Huevo cocido y una pieza de fruta', llevar: true, base: 'huevo', proteina: 'huevo',
    p1: 'Huevos (1 ud) cocido · fruta de temporada (1 ud)', p2: 'Con una pizca de sal',
    compra: ['Huevos (1 ud)', 'Fruta de temporada (1 ud)'],
    receta: ['Cuece el huevo 10 min (puedes dejar varios hechos para la semana) y enfríalo en agua.', 'Llévalo pelado con la fruta.'],
  }),
  tent({
    id: 'tent_kefir_fruta', titulo: 'Kéfir y una pieza de fruta', llevar: true, base: 'yogur', proteina: 'lacteo',
    p1: 'Kéfir natural (200ml) · fruta de temporada (1 ud)', p2: '',
    compra: ['Kéfir natural (200ml)', 'Fruta de temporada (1 ud)'],
    receta: ['Lleva el kéfir en su botella y la fruta.'],
  }),
  tent({
    id: 'tent_tortitas_arroz_atun', titulo: 'Tortitas de arroz con atún y tomate', llevar: true, base: 'tortitas_arroz', proteina: 'pescado',
    p1: 'Tortitas de arroz (2 ud) · atún al natural (1 lata / 55g) · tomate en rodajas', p2: '',
    compra: ['Tortitas de arroz (2 ud)', 'Atún al natural (55g)', 'Tomate (1/2 / 75g)'],
    receta: ['Escurre el atún y ponlo sobre las tortitas con el tomate en rodajas.'],
  }),
  tent({
    id: 'tent_queso_batido_canela_nueces', titulo: 'Queso fresco batido con canela y nueces', base: 'queso', proteina: 'lacteo',
    p1: 'Queso fresco batido 0% (150g) · nueces (15g)', p2: 'Con canela',
    compra: ['Queso fresco batido 0% (150g)', 'Nueces (15g)', 'Canela'],
    receta: ['Pon el queso batido en un bol con la canela y las nueces troceadas.'],
  }),
  tent({
    id: 'tent_leche_platano', titulo: 'Leche batida con plátano', base: 'batido', proteina: 'lacteo',
    p1: 'Leche semidesnatada (250ml) · plátano (1)', p2: 'Con canela',
    compra: ['Leche semidesnatada (250ml)', 'Plátano (1)', 'Canela'],
    receta: ['Tritura la leche con el plátano y la canela.'],
  }),
  tent({
    id: 'tent_tostada_tomate_jamon', titulo: 'Tostada con tomate y jamón', base: 'tostada', proteina: 'embutido',
    p1: 'Pan integral (40g) tostado · tomate rallado · jamón serrano (25g)', p2: '',
    compra: ['Pan integral (40g)', 'Tomate (1/2 / 75g)', 'Jamón serrano (25g)'],
    receta: ['Tuesta el pan, ralla el tomate por encima y pon el jamón.'],
  }),
  tent({
    id: 'tent_fruta_semillas', titulo: 'Fruta con semillas de calabaza', llevar: true, base: 'fruta', proteina: 'vegetal', soloDieta: true,
    p1: 'Fruta de temporada (1 ud) · semillas de calabaza (20g)', p2: '',
    compra: ['Fruta de temporada (1 ud)', 'Semillas de calabaza (20g)'],
    receta: ['Lleva la fruta y las semillas en un táper.'],
  }),
  tent({
    id: 'tent_tortitas_arroz_aguacate', titulo: 'Tortitas de arroz con aguacate y tomate', llevar: true, base: 'tortitas_arroz', proteina: 'vegetal', soloDieta: true,
    p1: 'Tortitas de arroz (2 ud) · aguacate (35g) · tomate en rodajas', p2: 'Con semillas de calabaza (10g)',
    compra: ['Tortitas de arroz (2 ud)', 'Aguacate (35g)', 'Tomate (1/2 / 75g)', 'Semillas de calabaza (10g)'],
    receta: ['Unta el aguacate chafado con sal en las tortitas y pon el tomate y las semillas.'],
  }),

  // ═══ Veganos de D-107 ═══════════════════════════════════════════════════
  ...TENTEMPIES_DIETA.map((m) => deDieta(m, 'tentempie')),
]);
