// Ajustes de catalogo decididos por Javi (D-099, 2026-10-10).
//
// scripts/phaseB2/output/dishes.json NO se modifica: su sha256 esta
// ratificado en D-028 y del depende el circuito del cuaderno del cocinero
// (exportCuadernoV5 / importCuadernoV5). Estos ajustes se aplican sobre el
// catalogo cargado, al materializar el plan (materializePlan.js), sin mutarlo.
//
//   - Legumbres nunca a la cena: los tres platos de legumbre que admitian cena
//     pasan a ser solo de comida.
//   - «Huevo con tomate en crudo» deja de ser ancla y pasa a plato normal,
//     solo de cena.

export const AJUSTES_D099 = Object.freeze({
  hummus_pita_pollo: Object.freeze({ momento: Object.freeze(['comida']) }),
  curry_garbanzos: Object.freeze({ momento: Object.freeze(['comida']) }),
  ensalada_lentejas_feta: Object.freeze({ momento: Object.freeze(['comida']) }),
  '["sopa_crema","huevo",null,"tomate",null,null,"crudo"]': Object.freeze({
    rol: 'rotativo',
    momento: Object.freeze(['cena']),
  }),
});

/**
 * Devuelve el catalogo con los ajustes de D-099 aplicados (copias congeladas
 * solo de los platos ajustados; el resto, los mismos objetos).
 * @param {ReadonlyArray<object>} catalog
 * @returns {ReadonlyArray<object>}
 */
export function aplicarAjustesD099(catalog) {
  return catalog.map((d) => (AJUSTES_D099[d.id] ? Object.freeze({ ...d, ...AJUSTES_D099[d.id] }) : d));
}
