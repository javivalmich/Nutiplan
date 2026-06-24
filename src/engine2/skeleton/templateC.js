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
// batchDayPreference: SEMANTICA -- Miercoles es la FIRMA DE IDENTIDAD de
// la variante C (el dia que la define narrativamente), no el resultado
// de un ranking de rendimiento. El resto de la lista es UNICAMENTE el
// fallback para cuando Miercoles cae en un dia fijo bloqueante -- nunca
// se usa si Miercoles esta disponible, aunque otro dia "rinda mas" en el
// censo (ver el caso volumen_limpio en el PR: Miercoles disponible pero
// flojo para una ancla concreta NO dispara el fallback; eso es un limite
// aceptado, no algo que esta lista resuelva).
//
// Orden del FALLBACK (solo importa cuando Miercoles esta bloqueado),
// fijado con el censo 2 delante (perfil sin entreno, dias no-fijos en la
// ventana por shelfLife 2/3/4):
//   Martes: 1,2,3 (escala con el shelfLife) -- y a 1 solo dia de
//     Miercoles, preserva mejor el espiritu "cocinar a media semana".
//   Lunes:  1,2,3 (empata en conteo con Martes) -- pero a 2 dias de
//     Miercoles. Desempate por PROXIMIDAD al primario, no por dia mas
//     temprano: Martes antes que Lunes.
//   Jueves: 1,1,1 (tope fijo, no escala -- su ventana choca con el
//     finde a partir de shelfLife=3).
//   Viernes: 0,0,0 (el peor posible, ventana siempre dentro del finde).
//   Domingo: red de seguridad final (fixedRole="familiar" NUNCA bloquea
//     batchDay, asi que el desplazamiento siempre termina).
export const TEMPLATE_C = Object.freeze({
  skeletonId: 'C',
  batchDay: 'Miercoles',
  batchDayPreference: Object.freeze(['Miercoles', 'Martes', 'Lunes', 'Jueves', 'Viernes', 'Domingo']),
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
