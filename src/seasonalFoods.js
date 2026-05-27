// Seasonal vegetables for Spain, indexed by month (0 = January, 11 = December).
// Keys map to VEG entries defined in buildPlan:
//   brocoli, espinacas, calabacin, judias, pimientos, zanahoria,
//   coles, berenjena, tomate, lechuga, acelgas, pepino, calabaza,
//   puerro, champiñones, esparragos, alcachofa
//
// Used in smartPick as a soft scoring bonus (factor 18).
// Priority is LOWER than intolerances: intolerances hard-filter combos out of the pool;
// this only nudges the score of already-eligible combos.
//
// Seasons applied (Spain):
//   brocoli     oct–mar  · espinacas   sep–may  · calabacin  may–sep
//   judias      abr–sep  · pimientos   jun–oct  · zanahoria  oct–abr
//   coles       sep–mar  · berenjena   jun–oct  · tomate     may–oct
//   lechuga     mar–nov  · acelgas     sep–abr  · pepino     may–sep
//   calabaza    sep–ene  · puerro      oct–mar  · champiñones sep–mar
//   esparragos  mar–jun  · alcachofa   feb–may + oct–dic
export const SEASONAL_FOODS = {
  0:  ["brocoli", "espinacas", "coles", "zanahoria", "calabaza", "acelgas", "puerro", "champiñones"],                                     // Enero
  1:  ["brocoli", "espinacas", "coles", "zanahoria", "calabaza", "acelgas", "puerro", "champiñones", "alcachofa"],                        // Febrero
  2:  ["brocoli", "espinacas", "coles", "zanahoria", "acelgas",  "lechuga", "puerro", "champiñones", "esparragos", "alcachofa"],          // Marzo
  3:  ["espinacas", "zanahoria", "acelgas", "judias", "lechuga", "esparragos", "alcachofa"],                                              // Abril
  4:  ["espinacas", "judias", "pimientos", "calabacin", "tomate", "lechuga", "pepino", "esparragos", "alcachofa"],                        // Mayo
  5:  ["judias", "pimientos", "calabacin", "tomate", "lechuga", "pepino", "berenjena", "esparragos"],                                     // Junio
  6:  ["pimientos", "calabacin", "tomate", "lechuga", "pepino", "berenjena", "judias"],                                                   // Julio
  7:  ["pimientos", "calabacin", "tomate", "lechuga", "pepino", "berenjena", "judias"],                                                   // Agosto
  8:  ["pimientos", "tomate", "berenjena", "calabacin", "pepino", "judias", "lechuga", "espinacas", "acelgas", "coles", "calabaza", "champiñones"], // Septiembre
  9:  ["calabaza", "zanahoria", "espinacas", "acelgas", "brocoli", "coles", "pimientos", "berenjena", "lechuga", "puerro", "champiñones", "alcachofa"], // Octubre
  10: ["calabaza", "zanahoria", "espinacas", "acelgas", "brocoli", "coles", "lechuga", "puerro", "champiñones", "alcachofa"],             // Noviembre
  11: ["calabaza", "zanahoria", "espinacas", "acelgas", "brocoli", "coles", "puerro", "champiñones", "alcachofa"],                       // Diciembre
};
