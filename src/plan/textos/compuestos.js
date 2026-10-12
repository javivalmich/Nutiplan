// compuestos — textos propios de engine2 para los platos compuestos (D-108).
//
// Los 178 platos «compuestos» del catálogo son una tupla {plantilla, proteína,
// hidrato, verdura, verdura 2, aliño, método}. Hasta D-108 su texto lo
// escribía el motor viejo con plantillas («Patata (260g g)», «Ternera magra
// salteado», «Huevos en conserva encima»…) y la app reescribía después sus
// números. Aquí engine2 escribe el plato entero (título, preparación, compra
// y receta) a partir de la tupla y de los gramos que deciden las raciones,
// con concordancia de género y número, la verdura en medidas de casa y la
// receta del aprovechamiento (D-108).
//
// Función pura: no importa nada del motor viejo.

// ─── Concordancia ───────────────────────────────────────────────────────────

/** Participio o adjetivo en masculino singular, concordado: «asado» → «asadas». */
export function concuerda(palabra, genero, numero) {
  const raiz = palabra.replace(/o$/, '');
  return `${raiz}${genero === 'f' ? 'a' : 'o'}${numero === 'p' ? 's' : ''}`;
}
const lo = (g, n) => (g === 'f' ? (n === 'p' ? 'las' : 'la') : (n === 'p' ? 'los' : 'lo'));
const mayus = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ─── Proteínas ──────────────────────────────────────────────────────────────
// compra: cómo se compra (lo lee el medidor); el: con artículo; g/n: género y
// número; tipo: para tiempos de cocción; base: gramos de partida (las
// raciones los ajustan); clave: ingrediente del medidor.

export const PROTEINAS = Object.freeze({
  pollo: { compra: 'Pechuga de pollo', el: 'la pechuga de pollo', corto: 'el pollo', g: 'f', n: 's', tipo: 'ave', base: 175, clave: 'pollo_pechuga' },
  pavo: { compra: 'Pechuga de pavo', el: 'la pechuga de pavo', corto: 'el pavo', g: 'f', n: 's', tipo: 'ave', base: 175, clave: 'pavo_pechuga' },
  ternera: { compra: 'Ternera magra', el: 'la ternera', corto: 'la ternera', g: 'f', n: 's', tipo: 'ternera', base: 170, clave: 'ternera_magra' },
  cerdo: { compra: 'Lomo de cerdo', el: 'el lomo', corto: 'el lomo', g: 'm', n: 's', tipo: 'cerdo', base: 170, clave: 'cerdo_lomo' },
  conejo: { compra: 'Conejo troceado', el: 'el conejo', corto: 'el conejo', g: 'm', n: 's', tipo: 'conejo', base: 200, clave: 'conejo' },
  salmon: { compra: 'Salmón', el: 'el salmón', corto: 'el salmón', g: 'm', n: 's', tipo: 'salmon', base: 180, clave: 'salmon' },
  merluza: { compra: 'Merluza', el: 'la merluza', corto: 'la merluza', g: 'f', n: 's', tipo: 'pescado', base: 200, clave: 'merluza' },
  bacalao: { compra: 'Bacalao fresco', el: 'el bacalao', corto: 'el bacalao', g: 'm', n: 's', tipo: 'pescado', base: 200, clave: 'bacalao' },
  dorada: { compra: 'Dorada en filetes', el: 'la dorada', corto: 'la dorada', g: 'f', n: 's', tipo: 'pescado', base: 200, clave: 'dorada' },
  sardinas: { compra: 'Sardinas', el: 'las sardinas', corto: 'las sardinas', g: 'f', n: 'p', tipo: 'sardinas', base: 180, clave: 'sardina' },
  atun: { compra: 'Atún en conserva al natural', el: 'el atún', corto: 'el atún', g: 'm', n: 's', tipo: 'conserva', base: 120, clave: 'atun_conserva' },
  gambas: { compra: 'Gambas peladas', el: 'las gambas', corto: 'las gambas', g: 'f', n: 'p', tipo: 'gambas', base: 200, clave: 'gambas' },
  calamares: { compra: 'Calamares', el: 'los calamares', corto: 'los calamares', g: 'm', n: 'p', tipo: 'calamares', base: 200, clave: 'calamar' },
  huevo: { compra: 'Huevos', el: 'los huevos', corto: 'los huevos', g: 'm', n: 'p', tipo: 'huevo', base: 3, unidad: 'ud', gUd: 53, clave: 'huevo' },
  lentejas: { compra: 'Lentejas', el: 'las lentejas', corto: 'las lentejas', g: 'f', n: 'p', tipo: 'legumbre', base: 90, seco: true, clave: 'lentejas_seco' },
  garbanzos: { compra: 'Garbanzos', el: 'los garbanzos', corto: 'los garbanzos', g: 'm', n: 'p', tipo: 'legumbre', base: 90, seco: true, clave: 'garbanzos_seco' },
  alubias: { compra: 'Alubias blancas', el: 'las alubias', corto: 'las alubias', g: 'f', n: 'p', tipo: 'legumbre', base: 90, seco: true, clave: 'alubias_seco' },
});

// Tiempos por tipo de proteína y método.
const TIEMPO = {
  plancha: { ave: '4-5 min por lado', ternera: '2-3 min por lado', cerdo: '3-4 min por lado', salmon: '3-4 min por lado, empezando por la piel', pescado: '3 min por lado', sardinas: '2-3 min por lado', gambas: '1-2 min por lado', calamares: '2-3 min', conejo: '5 min por lado' },
  horno: { ave: '18-20 min', ternera: '15-20 min', cerdo: '20-25 min', conejo: '35-40 min', salmon: '12-15 min', pescado: '12-15 min', sardinas: '10-12 min', gambas: '6-8 min', calamares: '10-12 min' },
  guisado: { ave: '20-25 min', ternera: '40-45 min (15 min en olla exprés)', cerdo: '30 min', conejo: '35-40 min', salmon: '8-10 min', pescado: '8-10 min', sardinas: '8 min', gambas: '4-5 min', calamares: '25-30 min' },
  salteado: { ave: '5-6 min', ternera: '3-4 min', cerdo: '4-5 min', conejo: '8-10 min', salmon: '3-4 min', pescado: '3-4 min', sardinas: '3 min', gambas: '2-3 min', calamares: '3-4 min' },
};

// ─── Hidratos ───────────────────────────────────────────────────────────────

export const HIDRATOS = Object.freeze({
  arroz: { compra: 'Arroz', el: 'el arroz', g: 'm', base: 70, seco: true, clave: 'arroz_seco', receta: 'Cuece el arroz en agua con sal 15-18 min y escúrrelo.' },
  pasta: { compra: 'Pasta integral', el: 'la pasta', g: 'f', base: 80, seco: true, clave: 'pasta_integral_seco', receta: 'Cuece la pasta en agua con sal hasta que esté al dente (unos 10 min) y escúrrela.' },
  patata: { compra: 'Patata', el: 'la patata', g: 'f', base: 200, clave: 'patata', receta: 'Cuece la patata con piel en agua con sal 20-25 min (o 8 min tapada en el microondas) y córtala en rodajas.', recetaHorno: 'Corta la patata en gajos, alíñala con un poco del aceite y sal y ásala a 200 °C 30-35 min.' },
  boniato: { compra: 'Boniato', el: 'el boniato', g: 'm', base: 175, clave: 'boniato', receta: 'Corta el boniato en gajos y ásalo a 200 °C 30-35 min con un poco del aceite.' },
  quinoa: { compra: 'Quinoa', el: 'la quinoa', g: 'f', base: 70, seco: true, clave: 'quinoa_seco', receta: 'Lava la quinoa y cuécela en el doble de agua 15 min; déjala reposar tapada 5 min.' },
});

// ─── Verduras ───────────────────────────────────────────────────────────────
// rango [mín, máx] y media de una ración en crudo (D-108): menos margen para
// las que abultan (brócoli, judías, espinacas) que para las que son casi
// todo agua (calabacín, berenjena). medida: cómo se dice en casa.

// Cada medida devuelve la forma corta (para la compra: «Calabacín (1 mediano,
// 220 g)») y la larga (para la preparación: «1 calabacín mediano»).
const piezas = (ud, sing, plur, g) => (gramos) => {
  const r = gramos / ud;
  const tam = (m, f) => (g === 'f' ? f : m);
  if (r <= 0.6) return { corta: '½', larga: `½ ${sing}` };
  if (r < 0.85) return { corta: `1 ${tam('pequeño', 'pequeña')}`, larga: `1 ${sing} ${tam('pequeño', 'pequeña')}` };
  if (r <= 1.2) return { corta: `1 ${tam('mediano', 'mediana')}`, larga: `1 ${sing} ${tam('mediano', 'mediana')}` };
  if (r <= 1.45) return { corta: '1 grande', larga: `1 ${sing} grande` };
  const n = String(Math.round(r * 2) / 2).replace('.5', '½');
  return { corta: n, larga: `${n} ${plur}` };
};
const cuenta = (ud, sing, plur, de = '') => (gramos) => {
  const n = Math.max(1, Math.round(gramos / ud));
  const nombre = n === 1 ? sing : plur;
  return { corta: `${n} ${nombre}`, larga: `${n} ${nombre}${de ? ` de ${de}` : ''}` };
};
const fija = (corta, larga) => () => ({ corta, larga });

export const VERDURAS = Object.freeze({
  brocoli: { compra: 'Brócoli', el: 'el brócoli', g: 'm', n: 's', rango: [150, 200], media: 175, clave: 'brocoli', medida: (g) => (g <= 220 ? { corta: '½', larga: '½ brócoli' } : { corta: '¾', larga: '¾ de brócoli' }), p2: 'al vapor', receta: 'Cuece el brócoli en ramitos al vapor 6-8 min (o saltéalo 5 min).', crudo: null },
  espinacas: { compra: 'Espinacas frescas', el: 'las espinacas', g: 'f', n: 'p', rango: [120, 200], media: 160, clave: 'espinaca', medida: cuenta(40, 'puñado', 'puñados', 'espinacas'), p2: 'salteado', receta: 'Saltea las espinacas con un poco del aceite 2-3 min, hasta que bajen.', crudo: 'Lava las espinacas para comerlas en crudo.' },
  judias: { compra: 'Judías verdes', el: 'las judías verdes', g: 'f', n: 'p', rango: [150, 200], media: 175, clave: 'judia_verde', medida: cuenta(50, 'puñado', 'puñados', 'judías verdes'), p2: 'al vapor', receta: 'Cuece las judías verdes al vapor o en agua con sal 8-10 min.', crudo: null },
  calabacin: { compra: 'Calabacín', el: 'el calabacín', g: 'm', n: 's', rango: [150, 300], media: 220, clave: 'calabacin', medida: piezas(250, 'calabacín', 'calabacines', 'm'), p2: 'a la plancha', receta: 'Corta el calabacín en rodajas y hazlo a la plancha 3-4 min por lado (o al horno 20 min a 200 °C).', crudo: null },
  pimientos: { compra: 'Pimientos', el: 'los pimientos', g: 'm', n: 'p', rango: [120, 250], media: 180, clave: 'pimiento', medida: piezas(150, 'pimiento', 'pimientos', 'm'), p2: 'asado', receta: 'Corta los pimientos en tiras y ásalos al horno 25 min a 200 °C (o saltéalos 6-8 min).', crudo: null },
  zanahoria: { compra: 'Zanahorias', el: 'la zanahoria', g: 'f', n: 's', rango: [80, 160], media: 120, clave: 'zanahoria', medida: cuenta(70, 'zanahoria', 'zanahorias'), p2: 'al vapor', receta: 'Corta la zanahoria en bastones y cuécela al vapor 8-10 min.', crudo: 'Ralla la zanahoria.' },
  tomate: { compra: 'Tomates cherry', el: 'los tomates cherry', g: 'm', n: 'p', rango: [120, 200], media: 150, clave: 'tomate_cherry', medida: cuenta(15, 'tomate cherry', 'tomates cherry'), p2: 'en crudo', receta: 'Parte los tomates cherry por la mitad (crudos o 15 min al horno a 180 °C).', crudo: 'Parte los tomates cherry por la mitad.' },
  pepino: { compra: 'Pepino', el: 'el pepino', g: 'm', n: 's', rango: [120, 200], media: 150, clave: 'pepino', medida: (g) => (g <= 180 ? { corta: '½', larga: '½ pepino' } : { corta: '¾', larga: '¾ de pepino' }), p2: 'en rodajas', receta: 'Corta el pepino en rodajas.', crudo: 'Corta el pepino en rodajas.' },
  lechuga: { compra: 'Lechuga o mezclum', el: 'la lechuga', g: 'f', n: 's', rango: [60, 120], media: 90, clave: 'lechuga', medida: (g) => (g <= 90 ? { corta: '1 bol', larga: '1 bol de lechuga' } : { corta: '1 bol grande', larga: '1 bol grande de lechuga' }), p2: 'en ensalada', receta: 'Lava y corta la lechuga.', crudo: 'Lava y corta la lechuga.' },
  berenjena: { compra: 'Berenjena', el: 'la berenjena', g: 'f', n: 's', rango: [150, 300], media: 220, clave: 'berenjena', medida: piezas(300, 'berenjena', 'berenjenas', 'f'), p2: 'a la plancha', receta: 'Corta la berenjena en rodajas, sálala y hazla a la plancha 4 min por lado (o al horno 25 min a 200 °C).', crudo: null },
  acelgas: { compra: 'Acelgas', el: 'las acelgas', g: 'f', n: 'p', rango: [150, 250], media: 200, clave: 'acelga', medida: fija('½ manojo', '½ manojo de acelgas'), p2: 'salteado', receta: 'Trocea las acelgas y saltéalas con un poco del aceite y unas gotas de limón 5 min.', crudo: null },
  coles: { compra: 'Coles de Bruselas', el: 'las coles de Bruselas', g: 'f', n: 'p', rango: [120, 200], media: 160, clave: 'coles_bruselas', medida: (g) => { const m = cuenta(15, 'col', 'coles')(g); return { corta: m.corta, larga: `${m.larga} de Bruselas` }; }, p2: 'asado', receta: 'Parte las coles de Bruselas por la mitad y ásalas al horno 20-25 min a 200 °C con un poco del aceite.', crudo: null },
  calabaza: { compra: 'Calabaza', el: 'la calabaza', g: 'f', n: 's', rango: [150, 300], media: 220, clave: 'calabaza', medida: fija('1 trozo', '1 trozo de calabaza'), p2: 'asado', receta: 'Corta la calabaza en dados y ásala al horno 25-30 min a 200 °C.', crudo: null },
  puerro: { compra: 'Puerro', el: 'el puerro', g: 'm', n: 's', rango: [100, 200], media: 150, clave: 'cebolla', medida: piezas(150, 'puerro', 'puerros', 'm'), p2: 'pochado', receta: 'Corta el puerro en rodajas y póchalo a fuego suave 10 min con un poco del aceite.', crudo: null },
  'champiñones': { compra: 'Champiñones', el: 'los champiñones', g: 'm', n: 'p', rango: [120, 200], media: 160, clave: 'champinon', medida: cuenta(20, 'champiñón', 'champiñones'), p2: 'salteado', receta: 'Lamina los champiñones y saltéalos 5-6 min con un poco del aceite y perejil.', crudo: null },
  esparragos: { compra: 'Espárragos verdes', el: 'los espárragos', g: 'm', n: 'p', rango: [120, 200], media: 160, clave: 'esparrago', medida: cuenta(20, 'espárrago', 'espárragos'), p2: 'a la plancha', receta: 'Quita la parte dura de los espárragos y hazlos a la plancha 5 min.', crudo: null },
  alcachofa: { compra: 'Alcachofas', el: 'las alcachofas', g: 'f', n: 'p', rango: [150, 250], media: 200, clave: 'alcachofa', medida: cuenta(100, 'alcachofa', 'alcachofas'), p2: 'asado', receta: 'Limpia las alcachofas, pártelas por la mitad y ásalas al horno 30 min a 200 °C (o cuécelas 20 min con limón).', crudo: null },
});

const r5 = (x) => Math.round(x / 5) * 5;
const KCAL_REFERENCIA = 2200;

/**
 * Gramos de verdura de una ración (D-108): la media de esa verdura ajustada
 * a la persona (raíz de sus calorías frente a 2200: crece despacio, sin ir
 * siempre al tope) y dentro de su rango. En una crema la verdura es el plato
 * (×1,5); la segunda verdura de un plato, el 60 %.
 */
export function gramosVerdura(clave, targetKcal, { papel = 'principal' } = {}) {
  const v = VERDURAS[clave];
  if (!v) return 150;
  const f = Math.sqrt((Number(targetKcal) || KCAL_REFERENCIA) / KCAL_REFERENCIA);
  const mult = papel === 'crema' ? 1.5 : papel === 'segunda' ? 0.6 : 1;
  const [min, max] = v.rango.map((x) => x * (papel === 'crema' ? 1.5 : 1));
  const g = r5(v.media * f * mult);
  return papel === 'segunda' ? Math.max(60, Math.min(r5(max * 0.6), g)) : Math.min(max, Math.max(min, g));
}

// ─── Aliños ─────────────────────────────────────────────────────────────────

export const ALINOS = Object.freeze({
  limon_hierbas: { texto: 'limón, orégano y ajo', compra: ['Limón (½)', 'Orégano', 'Ajo (1 diente)'] },
  tomate_casero: { texto: 'salsa de tomate casera', compra: ['Tomate triturado (150 g)'], tomate: true },
  mostaza_miel: { texto: 'mostaza y miel', compra: ['Mostaza (1 cdita)', 'Miel (1 cdita)'] },
  soja_jengibre: { texto: 'salsa de soja baja en sal y jengibre', compra: ['Salsa de soja baja en sal (1 cda)', 'Jengibre fresco'] },
  provenzal: { texto: 'hierbas provenzales', compra: ['Hierbas provenzales'] },
  pimenton_ajo: { texto: 'pimentón ahumado y ajo', compra: ['Pimentón ahumado (1 cdita)', 'Ajo (1 diente)'] },
  curry_ligero: { texto: 'curry y cúrcuma', compra: ['Curry en polvo (1 cdita)', 'Cúrcuma'] },
  vinagreta: { texto: 'vinagreta de Módena y mostaza', el: 'la vinagreta de Módena y mostaza', compra: ['Vinagre de Módena', 'Mostaza (1 cdita)'] },
  ajillo: { texto: 'ajo, perejil y guindilla', compra: ['Ajo (2 dientes)', 'Perejil fresco', 'Guindilla (opcional)'] },
  romero_limon: { texto: 'romero, limón y ajo', compra: ['Romero', 'Limón (½)', 'Ajo (1 diente)'] },
});

// ─── Piezas de texto ────────────────────────────────────────────────────────

function metodoP1(P, cookM) {
  const c = (w) => concuerda(w, P.g, P.n);
  switch (cookM) {
    case 'horno': return 'al horno';
    case 'guisado': return c('guisado');
    case 'salteado': return c('salteado');
    case 'revuelto': return c('revuelto');
    case 'tortilla': return 'en tortilla';
    case 'vapor': return 'al vapor';
    case 'crudo': return P.tipo === 'conserva' ? c('escurrido') : P.tipo === 'huevo' ? c('cocido') : 'en crudo';
    default: return 'a la plancha';
  }
}

const cantidadP = (P, gramos) => (P.unidad === 'ud' ? `${gramos} ${gramos === 1 ? 'huevo' : 'huevos'}` : `${P.compra} (${gramos} g${P.seco ? ' en seco' : ''})`);
const compraP = (P, gramos, nota) => (P.unidad === 'ud' ? `${P.compra} (${gramos} ud${nota ? `, ${nota}` : ''})` : `${P.compra} (${gramos} g${P.seco ? ' en seco' : ''}${nota ? `, ${nota}` : ''})`);

/** Paso de receta de la proteína (sin la del aprovechamiento). */
function pasoProteina(P, cookM, A) {
  const conA = A ? `con ${A.texto}` : 'con sal y pimienta';
  const t = (m) => (TIEMPO[m] && TIEMPO[m][P.tipo]) || '';
  const L = lo(P.g, P.n);
  if (P.tipo === 'huevo') {
    if (cookM === 'revuelto') return `Bate los huevos con sal${A ? ` y ${A.texto}` : ''} y cuájalos en la sartén a fuego medio, removiendo, 2-3 min.`;
    if (cookM === 'tortilla') return `Bate los huevos con sal${A ? ` y ${A.texto}` : ''}, viértelos en la sartén caliente con unas gotas de aceite y cuaja la tortilla 2-3 min por cada lado.`;
    if (cookM === 'crudo') return 'Cuece los huevos 10 min en agua hirviendo, enfríalos en agua fría y pélalos.';
    return `Haz los huevos a la plancha con unas gotas de aceite 2-3 min, hasta que cuaje la clara${A ? `, y alíñalos con ${A.texto}` : ''}.`;
  }
  if (P.tipo === 'conserva') return `Escurre ${P.el}${A ? ` y alíñalo con ${A.texto}` : ''}.`;
  if (cookM === 'crudo') return `Usa ${P.corto} congelado al menos 5 días (o cómpralo ya congelado para comer en crudo, por el anisakis). Descongélalo en la nevera, córtalo en dados y alíñalo ${conA}.`;
  if (cookM === 'horno') return `Pon ${P.el} en una bandeja ${conA}, sal y un chorrito del aceite, y hornéa${L} a 200 °C ${t('horno')}.`;
  if (cookM === 'guisado') return `Trocea ${P.el} y dóra${L} en una cazuela con un poco del aceite. Añade ${A ? A.texto : 'sal y pimienta'}, media cebolla picada y un vaso de agua o caldo, y cuéce${L} a fuego suave ${t('guisado')}.`;
  if (cookM === 'salteado') return `Corta ${P.el} en tiras y saltéa${L} a fuego fuerte ${t('salteado')} ${conA}.`;
  return `Sazona ${P.el} ${conA} y haz${L} a la plancha a fuego fuerte ${t('plancha')}.`;
}

const PARTICIPIOS = new Set(['asado', 'salteado', 'pochado']);
/** Verdura en la preparación: «1 calabacín mediano a la plancha (220 g)», «1 pimiento asado (170 g)». */
function verduraTexto(V, g, hint) {
  const larga = V.medida(g).larga;
  let h = hint;
  if (h && PARTICIPIOS.has(h)) {
    // Concuerda con lo que se nombra: «4 puñados de espinacas salteadas», «1 pimiento asado», «8 champiñones salteados».
    const m = larga.match(/^(\d+|½|¾)\s/);
    const de = / de /.test(larga);
    const n = de || !m ? V.n : (m[1] === '½' || m[1] === '¾' || m[1] === '1' ? 's' : 'p');
    h = concuerda(h, V.g, n);
  }
  return `${larga}${h ? ` ${h}` : ''} (${g} g)`;
}

// ─── Aprovechamiento (D-108) ───────────────────────────────────────────────

const BASE_DE = Object.freeze({ pollo: 'P', pavo: 'P', ternera: 'P', cerdo: 'P', garbanzos: 'P', alubias: 'P', arroz: 'C', quinoa: 'C' });
const NOMBRE_BASE = Object.freeze({
  pollo: ['el pollo', 'cocinaste', 'lo'], pavo: ['el pavo', 'cocinaste', 'lo'], ternera: ['la ternera', 'cocinaste', 'la'],
  cerdo: ['el lomo', 'cocinaste', 'lo'], garbanzos: ['los garbanzos', 'cociste', 'los'], alubias: ['las alubias', 'cociste', 'las'],
  arroz: ['el arroz', 'cociste', 'lo'], quinoa: ['la quinoa', 'cociste', 'la'],
});

/** Cómo se nombra la base del ancla: «la quinoa», «que cociste», «la», «cuece». */
export function nombreDeBase(base) {
  const [el, verbo, lo] = NOMBRE_BASE[base] || [`el ${base}`, 'cocinaste', 'lo'];
  return { el, verbo, lo, cocinar: verbo === 'cociste' ? 'cuece' : 'cocina' };
}

/** ¿Qué hueco de la tupla es la base del ancla en este plato? ('P', 'C' o null) */
export function huecoDeBase(tupla, base) {
  const h = BASE_DE[base];
  if (h === 'P' && tupla.P === base) return 'P';
  if (h === 'C' && tupla.C === base) return 'C';
  return null;
}

/** Paso de la receta para usar lo que ya se cocinó. */
export function pasoAprovechar(base, cuando) {
  const [el, verbo, L] = NOMBRE_BASE[base] || ['la base', 'cocinaste', 'la'];
  const calentar = BASE_DE[base] === 'P' && !['garbanzos', 'alubias'].includes(base)
    ? `caliénta${L} 2-3 min en la sartén (o 1 min en el microondas)`
    : `caliénta${L} unos minutos o úsa${L} a temperatura ambiente`;
  return `Usa ${el} que ${verbo} ${cuando}: ${calentar}.`;
}

/** Paso de la receta del día de cocinar de más. */
export function pasoCocinarDeMas(base, hoy, guardar, unidad = 'g') {
  const [el, verbo] = NOMBRE_BASE[base] || ['la base', 'cocinaste'];
  const total = hoy + guardar.reduce((a, x) => a + x.gramos, 0);
  const para = guardar.map((x) => `${x.gramos} ${unidad} para el ${x.dia}`).join(' y ');
  const seco = BASE_DE[base] === 'C' || ['garbanzos', 'alubias'].includes(base) ? ' en seco' : '';
  const cocina = verbo === 'cociste' ? 'Cuece' : 'Cocina';
  return `${cocina} de una vez ${total} ${unidad} de ${el.replace(/^(el|la|los|las) /, '')}${seco}: ${hoy} ${unidad} para hoy y ${para}. Guarda lo que sobra en un táper en la nevera (aguanta 3 días).`;
}

// ─── Plato completo ────────────────────────────────────────────────────────

/**
 * Texto completo de un plato compuesto.
 * @param {object} entrada
 * @param {{tmpl:string,P:string,C:string|null,V:string|null,V2:string|null,S:string|null,cookM:string|null}} entrada.tupla
 * @param {string} entrada.nombre nombre visible del plato
 * @param {'comida'|'cena'} entrada.momento
 * @param {{P?:number,C?:number,V?:number,V2?:number,aove?:number}} entrada.gramos
 * @param {{base:string, rol:'cocinar'|'aprovechar', cuando?:string, guardar?:{dia:string,gramos:number}[]}} [entrada.ancla]
 * @returns {{title, p1, p2, shopping, recipe}}
 */
export function escribirCompuesto({ tupla, nombre, momento, gramos, ancla = null, batchable = false, shelfLifeDays = 0 }) {
  const { tmpl, cookM } = tupla;
  const P = PROTEINAS[tupla.P];
  const C = tupla.C ? HIDRATOS[tupla.C] : null;
  const V = tupla.V ? VERDURAS[tupla.V] : null;
  const V2 = tupla.V2 ? VERDURAS[tupla.V2] : null;
  const A = tupla.S ? ALINOS[tupla.S] : null;
  const gP = gramos.P;
  const gC = gramos.C;
  const gV = gramos.V;
  const gV2 = gramos.V2;
  const aove = gramos.aove || 15;

  const hueco = ancla ? huecoDeBase(tupla, ancla.base) : null;
  const aprovecha = !!(hueco && ancla.rol === 'aprovechar');
  const notaCompra = aprovecha && ancla.cuando ? `del ${ancla.cuando.replace(/^el /, '')}` : null;

  // ── Preparación (p1, p2) ──
  const metodo = aprovecha && hueco === 'P' ? `que ${NOMBRE_BASE[ancla.base][1]} ${ancla.cuando}` : metodoP1(P, cookM);
  const conA = A ? ` con ${A.texto}` : '';
  let p1;
  let p2;
  const carbTxt = C ? `${C.compra} (${gC} g${C.seco ? ' en seco' : ''})` : null;
  const aceite = `AOVE (${aove} ml)`;
  const verdurasCon = (hint) => [V && verduraTexto(V, gV, hint ? V.p2 : ''), V2 && verduraTexto(V2, gV2, hint ? V2.p2 : '')].filter(Boolean);

  if (tmpl === 'sopa_crema') {
    const crudo = cookM === 'crudo';
    p1 = `${crudo ? 'Crema fría' : 'Crema'} de ${V ? V.el.replace(/^(el|la|los|las) /, '') : 'verduras'}${V2 ? ` y ${V2.el.replace(/^(el|la|los|las) /, '')}` : ''} (${[gV && `${gV} g`, gV2 && `${gV2} g`].filter(Boolean).join(' + ')})`;
    p2 = [`${cantidadP(P, gP)} ${metodo} encima`, A ? `con ${A.texto}` : null, aceite].filter(Boolean).join(' · ');
  } else if (tmpl === 'ensalada') {
    p1 = `${cantidadP(P, gP)} ${metodo}`;
    p2 = [...verdurasCon(false), carbTxt, `${aceite} y ${A ? A.texto : 'vinagre'}`].filter(Boolean).join(' · ');
  } else if (tmpl === 'bowl') {
    p1 = [carbTxt && `Base de ${carbTxt.charAt(0).toLowerCase()}${carbTxt.slice(1)}`, `${cantidadP(P, gP)} ${metodo}${conA}`].filter(Boolean).join(' · ');
    p2 = [...verdurasCon(true), aceite].join(' · ');
  } else if (tmpl === 'pasta') {
    p1 = [carbTxt, `${cantidadP(P, gP)} ${metodo}`].filter(Boolean).join(' · ');
    p2 = [...verdurasCon(true), A ? (A.tomate ? A.texto : `con ${A.texto}`) : null, aceite, 'queso rallado al gusto'].filter(Boolean).join(' · ');
  } else if (tmpl === 'legumbre') {
    p1 = `${P.compra} (${gP} g en seco) ${concuerda('guisado', P.g, P.n)}${conA}`;
    p2 = [...verdurasCon(false), 'caldo de verduras', aceite].filter(Boolean).join(' · ');
  } else {
    p1 = `${cantidadP(P, gP)} ${metodo}${conA}`;
    p2 = [carbTxt, ...verdurasCon(true), aceite].filter(Boolean).join(' · ');
  }

  // ── Compra ──
  const shopping = [];
  shopping.push(compraP(P, gP, hueco === 'P' ? notaCompra : null));
  if (C) shopping.push(`${C.compra} (${gC} g${hueco === 'C' && notaCompra ? `, ${notaCompra}` : ''})`);
  if (V) shopping.push(`${V.compra} (${V.medida(gV).corta}, ${gV} g)`);
  if (V2) shopping.push(`${V2.compra} (${V2.medida(gV2).corta}, ${gV2} g)`);
  if (A) shopping.push(...A.compra);
  if (tmpl === 'sopa_crema' && cookM !== 'crudo') shopping.push('Cebolla (1/2)', 'Caldo de verduras (400 ml)');
  if (tmpl === 'legumbre') shopping.push('Cebolla (1/2)', 'Caldo de verduras (500 ml)', 'Laurel (1 hoja)');
  if (cookM === 'guisado' && tmpl !== 'legumbre') shopping.push('Cebolla (1/2)');
  shopping.push(aceite);

  // ── Receta ──
  const recipe = [];
  // Día de aprovechar: el paso de cocinar la base se cambia por usar lo
  // cocinado. Día de cocinar de más: detrás del paso de la base, cuánto
  // hacer y cuánto guardar.
  let trasBase = -1;
  const pasoBase = (h, normal) => {
    if (hueco !== h) return normal;
    if (ancla.rol === 'aprovechar') return pasoAprovechar(ancla.base, ancla.cuando);
    trasBase = recipe.length;
    return normal;
  };
  if (tmpl === 'legumbre') {
    const remojo = P.tipo === 'legumbre' && tupla.P !== 'lentejas' ? `Pon ${P.el} en remojo la noche anterior (o usa ${P.corto} cocidos de bote: unos ${Math.round(gP * 2.5 / 10) * 10} g escurridos, y acorta la cocción a 10 min). ` : '';
    recipe.push(pasoBase('P', `${remojo}`.trim() || `Lava ${P.el}.`));
    recipe.push(`Pocha media cebolla picada en una cazuela con el aceite 5 min${A && /ajo/.test(A.texto) ? ' y añade el ajo picado' : ''}.`);
    if (V) recipe.push(`Añade ${V.el}${V2 ? ` y ${V2.el}` : ''} en trozos y rehoga 3 min.`);
    const t = tupla.P === 'lentejas' ? '30-35 min' : tupla.P === 'garbanzos' ? '1 h 30 min (25 min en olla exprés)' : '1 h (15 min en olla exprés)';
    recipe.push(hueco === 'P' && ancla.rol === 'aprovechar'
      ? `Incorpora ${P.corto}, cubre con el caldo, añade el laurel${A ? `, ${A.texto}` : ''} y cuece 10 min a fuego suave.`
      : `Incorpora ${P.corto}, cubre con el caldo, añade el laurel${A ? `, ${A.texto}` : ''} y cuece a fuego suave ${t}, hasta que estén tiernos.`.replace('tiernos', P.g === 'f' ? 'tiernas' : 'tiernos'));
  } else if (tmpl === 'sopa_crema') {
    if (cookM === 'crudo') {
      recipe.push(`Tritura ${V ? V.el : 'la verdura'}${V2 ? ` con ${V2.el}` : ''} con el aceite, sal y un chorrito de agua fría hasta que quede fina; enfría en la nevera.`);
    } else {
      recipe.push('Pocha media cebolla picada con un poco del aceite 5 min.');
      recipe.push(`Añade ${V ? V.el : 'la verdura'}${V2 ? ` y ${V2.el}` : ''} en trozos, cubre con el caldo y cuece tapado a fuego suave 20 min.`);
      recipe.push('Tritura hasta que quede fina y ajusta de sal.');
    }
    recipe.push(pasoBase('P', pasoProteina(P, cookM, A)));
    recipe.push(`Sirve la crema con ${P.corto} encima.`);
  } else {
    if (C) recipe.push(pasoBase('C', C.recetaHorno && cookM === 'horno' ? C.recetaHorno : C.receta));
    if (tmpl === 'pasta' && A && A.tomate) {
      recipe.push(pasoBase('P', pasoProteina(P, cookM, null)));
      recipe.push('Añade el tomate triturado con una pizca de sal y orégano y deja 8-10 min a fuego suave.');
    } else {
      // En la ensalada el aliño es para el plato entero, no para cocinar la proteína.
      recipe.push(pasoBase('P', pasoProteina(P, cookM, tmpl === 'ensalada' ? null : A)));
    }
    const crudas = tmpl === 'ensalada';
    for (const v of [V, V2].filter(Boolean)) recipe.push(crudas && v.crudo ? v.crudo : v.receta);
    if (tmpl === 'ensalada') recipe.push(`Mezcla todo${C ? ` con ${C.el} ya templad${C.g === 'f' ? 'a' : 'o'}` : ''} y aliña con el aceite${A ? ` y ${A.el || A.texto}` : ', vinagre y sal'}.`);
    else if (tmpl === 'bowl') recipe.push(`Monta el bol: ${C ? `${C.el} de base, ` : ''}${P.corto} encima y la verdura al lado; un hilo del aceite por encima.`);
    else if (tmpl === 'pasta') recipe.push(`Mezcla la pasta con ${P.corto} y la verdura${A && !A.tomate ? ` y ${A.texto}` : ''}; termina con queso rallado al gusto.`);
    else recipe.push(`Sirve ${P.corto} con ${[V && V.el, V2 && V2.el, C && C.el].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' y $1')}${C || V ? '' : ''}.`);
  }
  if (trasBase >= 0 && ancla.guardar && ancla.guardar.length) {
    // Antes del paso de la base («Cocina de una vez 255 g…», y luego cómo); en
    // las legumbres la cocción es el último paso: va al final.
    const donde = tmpl === 'legumbre' ? recipe.length : trasBase;
    recipe.splice(donde, 0, pasoCocinarDeMas(ancla.base, hueco === 'P' ? gP : gC, ancla.guardar));
  }
  if (batchable && shelfLifeDays > 1 && !aprovecha) recipe.push(`Se conserva bien en la nevera hasta ${shelfLifeDays} días.`);

  return { title: nombre, emoji: momento === 'cena' ? '🌙' : '☀️', p1: mayus(p1), p2: mayus(p2), shopping, recipe: recipe.map(mayus) };
}

/**
 * Ingredientes de partida de un plato compuesto (para las raciones): clave
 * del medidor y gramos. La verdura ya va en su ración de engine2 (fija).
 */
export function gramosDePartida(tupla, targetKcal) {
  const P = PROTEINAS[tupla.P];
  const crema = tupla.tmpl === 'sopa_crema';
  return {
    P: P ? P.base : 0,
    C: tupla.C ? HIDRATOS[tupla.C].base : undefined,
    V: tupla.V ? gramosVerdura(tupla.V, targetKcal, { papel: crema ? 'crema' : 'principal' }) : undefined,
    V2: tupla.V2 ? gramosVerdura(tupla.V2, targetKcal, { papel: crema ? 'crema' : 'segunda' }) : undefined,
    aove: 15,
  };
}

/** Clave del medidor de cada hueco (para leer los gramos que deciden las raciones). */
export function clavesDe(tupla) {
  return {
    P: PROTEINAS[tupla.P] && PROTEINAS[tupla.P].clave,
    C: tupla.C ? HIDRATOS[tupla.C].clave : null,
    V: tupla.V ? VERDURAS[tupla.V] && VERDURAS[tupla.V].clave : null,
    V2: tupla.V2 ? VERDURAS[tupla.V2] && VERDURAS[tupla.V2].clave : null,
    aove: 'aove',
  };
}
