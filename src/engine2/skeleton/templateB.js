// Plantilla de esqueleto B (pico unico) - Fase 3, Checkpoint 3B.
//
// Secuencia de densidad ESCRITA A MANO, valida por construccion. NO se
// calcula en runtime, NO se optimiza ni se elige "la mejor" version --
// las secuencias validas se declaran, no se generan.
//
// Pico unico: un solo dia "denso" en toda la semana (Viernes), distinto
// de A (Miercoles) y de C (Lunes+Jueves, doble pico). El patron de
// densidad es independiente de batchDay -- son dos decisiones distintas
// (paso 4 vs paso 1/3 del mecanismo de construccion), igual que en A/C.
//
// Sabado (libre) y Domingo (familiar) llevan su densidad ya escrita aqui
// ("ligero" y "medio" respectivamente) para que aplicar las citas fijas
// no rompa el zigzag.
//
// batchDayPreference -- SEMANTICA igual que A/C: Martes es la FIRMA DE
// IDENTIDAD de la variante B (el dia que la define narrativamente), no
// el resultado de un ranking de rendimiento. El resto de la lista es
// UNICAMENTE el fallback para cuando Martes cae en un dia fijo
// bloqueante.
//
// Orden del FALLBACK, fijado con el censo 2 delante (perfil sin entreno,
// dias no-fijos en la ventana por shelfLife 2/3/4):
//   Lunes:     1,2,3 (el mejor disponible, sin empate con nadie aqui --
//     Martes ya es el primario, no compite en el fallback)
//   Miercoles: 1,2,2 (tope en shelfLife=4 por chocar con el finde)
//   Jueves:    1,1,1 (tope fijo, no escala)
//   Viernes:   0,0,0 (el peor posible)
//   Domingo:   red de seguridad final (fixedRole="familiar" nunca
//     bloquea batchDay, asi que el desplazamiento siempre termina)
// Sin empates en esta lista -- el orden por rendimiento ya es total.
//
// caprichoPreference -- SEMANTICA (Checkpoint 3C): mismo patron que
// batchDayPreference, sin censo de rendimiento (cualquier dia disponible
// sirve igual para un capricho de un solo dia), pero su fixedRole
// intransitable es el MISMO que el de las sobras (CUALQUIER fixedRole
// bloquea, incluido "familiar" -- a diferencia de batchDay). Sabado Y
// Domingo se omiten (ambos siempre bloqueados para capricho, ninguno
// sirve de red de seguridad): si los 5 dias de diario estan ocupados,
// trunca a cero.
//
// Primario = Jueves -- distinto del batchDay de B (Martes), para que
// ancla y capricho no compitan por el mismo dia primario. Fallback por
// proximidad a Jueves: Miercoles(1) y Viernes(1) empatan, desempate por
// dia mas temprano (Miercoles antes que Viernes); luego Martes(2); luego
// Lunes(3).
export const TEMPLATE_B = Object.freeze({
  skeletonId: 'B',
  batchDay: 'Martes',
  batchDayPreference: Object.freeze(['Martes', 'Lunes', 'Miercoles', 'Jueves', 'Viernes', 'Domingo']),
  caprichoDay: 'Jueves',
  caprichoPreference: Object.freeze(['Jueves', 'Miercoles', 'Viernes', 'Martes', 'Lunes']),
  density: Object.freeze({
    Lunes: 'ligero',
    Martes: 'medio',
    Miercoles: 'ligero',
    Jueves: 'medio',
    Viernes: 'denso',
    Sabado: 'ligero',
    Domingo: 'medio',
  }),
});
