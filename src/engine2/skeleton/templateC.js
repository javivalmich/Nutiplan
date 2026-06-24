// Plantilla de esqueleto C (doble pico) - Fase 3, Checkpoint 3A.
//
// Secuencia de densidad ESCRITA A MANO, valida por construccion. NO se
// calcula en runtime, NO se optimiza ni se elige "la mejor" version --
// las secuencias validas se declaran, no se generan.
//
// Doble pico: denso en Lunes y en Jueves (separados por un valle), en vez
// de una unica progresion monotona. batchDay = Jueves coincide con el
// segundo pico a proposito: el dia de cocinar en cantidad es tambien el
// dia "denso" de la semana.
//
// Sabado (libre) y Domingo (familiar) llevan su densidad ya escrita aqui
// ("ligero" y "medio" respectivamente) precisamente para que aplicar las
// citas fijas no rompa el zigzag: la plantilla ya sabe que esos dos dias
// son especiales y no les puso un pico.
export const TEMPLATE_C = Object.freeze({
  skeletonId: 'C',
  batchDay: 'Jueves',
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
