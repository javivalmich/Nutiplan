// Propuestas para los platos de plantilla (su id es la tupla
// [plantilla, proteína, hidrato, verdura, verdura2, salsa, cocción]).
// Salen de los componentes de la receta de src/plan/textos/compuestos.js.
//
// Minutos activos = preparación de cada componente (cortar, sazonar, picar)
//   + el rato de fogón atendido más largo
//   + la mitad de los demás ratos atendidos (van en paralelo)
//   + 2 de servir.
// Hervir, horno y cocción tapada no suman. Las cifras son estimaciones mías.

// [preparación, fogón atendido] de la proteína según la cocción.
const PLANCHA = {
  pollo: [2, 10], pavo: [2, 10], ternera: [2, 6], cerdo: [2, 8], salmon: [2, 8], merluza: [2, 6],
  gambas: [3, 4], calamares: [5, 5], sardinas: [5, 6], huevo: [1, 3], bacalao: [2, 8], dorada: [2, 8],
  conejo: [3, 15], atun: [2, 5],
};
const NOMBRE_PROT = { salmon: 'salmón', huevo: 'huevo', atun: 'atún', cerdo: 'lomo', pollo: 'pollo' };
const NOMBRE_VERD = {
  brocoli: 'brócoli', calabacin: 'calabacín', champiñones: 'champiñones', esparragos: 'espárragos',
  judias: 'judías', coles: 'coles de Bruselas', tomate: 'tomate', pimientos: 'pimientos',
};
// [preparación, fogón atendido] de la verdura como guarnición.
const VERDURA = {
  espinacas: [1, 3], calabacin: [3, 7], pimientos: [4, 0], judias: [5, 0], brocoli: [4, 0],
  champiñones: [4, 6], esparragos: [3, 5], berenjena: [4, 8], coles: [5, 0], alcachofa: [10, 0],
  puerro: [4, 4], zanahoria: [4, 0], acelgas: [5, 5], tomate: [2, 0], lechuga: [4, 0], pepino: [2, 0],
  calabaza: [6, 0],
};
const DELICADO = new Set(['merluza', 'dorada', 'bacalao', 'salmon', 'sardinas', 'calamares', 'conejo']);

const nombreP = (p) => NOMBRE_PROT[p] || p;
const nombreV = (v) => NOMBRE_VERD[v] || v;

function proteina(P, cookM) {
  if (cookM === 'horno') return [3, 0];
  if (cookM === 'salteado') return [4, P === 'gambas' ? 3 : 6];
  if (cookM === 'guisado') return [5, P === 'conejo' ? 10 : 8];
  if (cookM === 'crudo') return P === 'salmon' ? [8, 0] : [2, 0];
  if (cookM === 'revuelto') return [2, 3];
  if (cookM === 'tortilla') return [2, 6];
  if (cookM === 'plancha' || cookM == null) { if (PLANCHA[P]) return PLANCHA[P]; }
  throw new Error(`propuestasPlantilla: sin tiempos para ${P}/${cookM}`);
}

const verdura = (V) => {
  if (!VERDURA[V]) throw new Error(`propuestasPlantilla: sin tiempos para la verdura ${V}`);
  return VERDURA[V];
};

export const tramoDe = (min) => (min <= 15 ? 1 : min <= 30 ? 2 : min <= 45 ? 3 : 4);

/** @returns {{tipo:string, minutos:number, tramo:number, dificultad:'F'|'M'|'E', motivo:string, esperaLarga:boolean}} */
export function proponerPlantilla({ tmpl, P, C, V, V2, cookM }, receta) {
  const tipo = cookM || 'plancha';
  const comp = [];
  let motivo;
  let dif = 'F';
  const texto = receta.join(' ');
  if (tmpl === 'legumbre') {
    // Picar cebolla y ajo, trocear la verdura y rehogar; luego cuece sola.
    comp.push([6, 8]);
    if (V2) comp.push([3, 0]);
    const larga = P !== 'lentejas';
    if (larga) dif = 'M';
    motivo = larga ? 'Sofrito y cocción larga sola; remojo la víspera (o bote, 10 min)' : 'Sofrito y las lentejas cuecen solas 30-35 min';
  } else if (tmpl === 'sopa_crema') {
    comp.push([cookM === 'crudo' ? 7 : 10, 0]);
    if (V2) comp.push([2, 0]);
    comp.push(cookM === 'horno' ? [3, 0] : proteina(P, cookM));
    if (cookM !== 'crudo') dif = P === 'huevo' ? 'F' : 'M';
    motivo = cookM === 'crudo' ? `Triturar en frío y poner ${nombreP(P)} encima` : `Crema (pochar, cocer, triturar) y ${nombreP(P)} aparte`;
  } else {
    comp.push(proteina(P, cookM));
    if (C === 'arroz' || C === 'pasta' || C === 'quinoa') comp.push([2, 0]);
    if (C === 'patata') comp.push([4, 0]);
    if (C === 'boniato') comp.push([4, 0]);
    // En ensalada y crudo la verdura solo se lava y corta.
    for (const v of [V, V2]) if (v) comp.push(tmpl === 'ensalada' ? [verdura(v)[0] > 4 ? 4 : verdura(v)[0], 0] : verdura(v));
    if (/tomate triturado/.test(texto)) comp.push([1, 2]);

    const dosFuegos = tmpl !== 'ensalada' && ['plancha', 'salteado', 'revuelto', 'tortilla'].includes(tipo)
      && [V, V2].some((v) => v && VERDURA[v][1] >= 5);
    if (tipo === 'guisado' || tipo === 'tortilla' || dosFuegos) dif = 'M';
    if (tipo === 'plancha' && DELICADO.has(P)) dif = 'M';
    if (tipo === 'crudo' && P === 'salmon') dif = 'M';
    if ([V, V2].includes('alcachofa')) dif = 'M';

    const que = {
      horno: `${nombreP(P)} al horno (solo)`, plancha: `${nombreP(P)} a la plancha`, salteado: `${nombreP(P)} salteado`,
      guisado: `Dorar y guisar ${nombreP(P)}`, crudo: P === 'salmon' ? 'Cortar salmón para crudo (anisakis)' : `${nombreP(P)} sin cocinar`,
      revuelto: 'Revuelto', tortilla: 'Tortilla (hay que darle la vuelta)',
    }[tipo];
    const lados = [V, V2].filter(Boolean).map(nombreV);
    if (C) lados.push(C);
    motivo = `${que[0].toUpperCase()}${que.slice(1)} + ${lados.join(' y ')}`;
    if (tmpl === 'ensalada') motivo = `${que[0].toUpperCase()}${que.slice(1)}; ensalada de cortar y aliñar`;
    if (dosFuegos) motivo += '; dos fuegos a la vez';
    if ([V, V2].includes('alcachofa')) motivo += '; limpiar alcachofas';
  }
  const prep = comp.reduce((a, c) => a + c[0], 0);
  const fuegos = comp.map((c) => c[1]).sort((a, b) => b - a);
  const minutos = Math.round(prep + (fuegos[0] || 0) + fuegos.slice(1).reduce((a, b) => a + b, 0) / 2 + 2);
  // Más de 30 min sin vigilar: legumbre cocida desde seco, horno o guiso de más de 30 min.
  const esperaLarga = tmpl === 'legumbre' || /3[05]-[34]\d min|40-45 min/.test(texto);
  return { tipo, minutos, tramo: tramoDe(minutos), dificultad: dif, motivo, esperaLarga };
}
