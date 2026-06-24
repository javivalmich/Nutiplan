// Plantilla de esqueleto C (doble pico) - Fase 3, Checkpoint 3A.
//
// Secuencia de densidad ESCRITA A MANO, valida por construccion. NO se
// calcula en runtime, NO se optimiza ni se elige "la mejor" version --
// las secuencias validas se declaran, no se generan.
//
// Doble pico: denso en Lunes y en Jueves (separados por un valle), en vez
// de una unica progresion monotona. El patron de densidad es independiente
// de batchDay -- son dos decisiones distintas (paso 4 vs paso 1/3 del
// mecanismo de construccion).
//
// Sabado (libre) y Domingo (familiar) llevan su densidad ya escrita aqui
// ("ligero" y "medio" respectivamente) precisamente para que aplicar las
// citas fijas no rompa el zigzag: la plantilla ya sabe que esos dos dias
// son especiales y no les puso un pico.
//
// batchDay = Miercoles (CORREGIDO; era Jueves). El censo de ventanas de
// sobras (ver PR) demostro que Jueves es el segundo peor batchDay posible:
// su ventana {Vie,Sab,Dom} choca con el finde fijo y trunca a 1 dia de
// sobra como techo absoluto, sea cual sea el shelfLife del ancla.
// Miercoles {Jue,Vie,Sab} deja hasta 2 dias no-fijos reales (Jue,Vie) para
// anclas de shelfLife>=4, y al menos 1 (Jue) para shelfLife=3. Viernes y
// Jueves quedan descartados como PRIMARIO de batchDay para CUALQUIER
// variante (A/B/C): su ventana siempre choca con el finde.
//
// batchDayPreference: orden de DESPLAZAMIENTO declarado a mano cuando el
// primario (Miercoles) cae en un dia fijo bloqueante. NO es una busqueda
// del mejor dia en runtime -- es una lista escrita, igual de espiritu que
// el zigzag de densidad (se declara, no se optimiza). Orden fijado con el
// censo 2 delante (perfil sin entreno, dias no-fijos en la ventana por
// shelfLife 2/3/4): Lunes y Martes empatan como mejor alternativa (1,2,3
// dias segun shelfLife); desempate por dia mas temprano (Lunes antes que
// Martes). Jueves siempre da como mucho 1. Viernes siempre da 0 -- el
// peor posible, va el ultimo antes del seguro universal. Domingo cierra
// la lista como red de seguridad (fixedRole="familiar" NUNCA bloquea
// batchDay, asi que el desplazamiento siempre termina).
export const TEMPLATE_C = Object.freeze({
  skeletonId: 'C',
  batchDay: 'Miercoles',
  batchDayPreference: Object.freeze(['Miercoles', 'Lunes', 'Martes', 'Jueves', 'Viernes', 'Domingo']),
  density: Object.freeze({
    Lunes: 'denso',
    Martes: 'ligero',
    Miercoles: 'medio',
    Jueves: 'denso',
    Viernes: 'ligero',
    Sabado: 'ligero',
    Domingo: 'medio',
  }),
});
