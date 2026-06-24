// Plantilla de esqueleto A (pico unico) - Fase 3, Checkpoint 3B.
//
// Secuencia de densidad ESCRITA A MANO, valida por construccion. NO se
// calcula en runtime, NO se optimiza ni se elige "la mejor" version --
// las secuencias validas se declaran, no se generan.
//
// Pico unico: un solo dia "denso" en toda la semana (Miercoles), en vez
// del doble pico de C. El patron de densidad es independiente de
// batchDay -- son dos decisiones distintas (paso 4 vs paso 1/3 del
// mecanismo de construccion), igual que en C.
//
// Sabado (libre) y Domingo (familiar) llevan su densidad ya escrita aqui
// ("ligero" y "medio" respectivamente) para que aplicar las citas fijas
// no rompa el zigzag.
//
// batchDayPreference -- SEMANTICA igual que C: Lunes es la FIRMA DE
// IDENTIDAD de la variante A (el dia que la define narrativamente), no
// el resultado de un ranking de rendimiento. El resto de la lista es
// UNICAMENTE el fallback para cuando Lunes cae en un dia fijo
// bloqueante.
//
// Orden del FALLBACK, fijado con el censo 2 delante (perfil sin entreno,
// dias no-fijos en la ventana por shelfLife 2/3/4):
//   Martes:    1,2,3 (el mejor disponible, sin empate con nadie aqui)
//   Miercoles: 1,2,2 (tope en shelfLife=4 por chocar con el finde)
//   Jueves:    1,1,1 (tope fijo, no escala)
//   Viernes:   0,0,0 (el peor posible)
//   Domingo:   red de seguridad final (fixedRole="familiar" nunca
//     bloquea batchDay, asi que el desplazamiento siempre termina)
// Sin empates en esta lista -- a diferencia de C (Lunes/Martes empataban
// y se desempataba por proximidad), aqui el orden por rendimiento ya es
// total, no hace falta desempate.
export const TEMPLATE_A = Object.freeze({
  skeletonId: 'A',
  batchDay: 'Lunes',
  batchDayPreference: Object.freeze(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Domingo']),
  density: Object.freeze({
    Lunes: 'medio',
    Martes: 'ligero',
    Miercoles: 'denso',
    Jueves: 'ligero',
    Viernes: 'medio',
    Sabado: 'ligero',
    Domingo: 'medio',
  }),
});
