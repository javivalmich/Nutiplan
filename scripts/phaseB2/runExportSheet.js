// Runner CLI de exportSheet.js. Ejecutar con:
//   node scripts/phaseB2/runExportSheet.js
// Lee scripts/phaseB2/output/dishes.scaffold.json (READ-ONLY, no lo
// modifica) y escribe scripts/phaseB2/output/dishes.anotacion.xlsx.
//
// Texto de leyenda pegado integro por Javi (Fase 2, utilidad: hoja de
// anotacion para colaborador externo).

import { exportSheet } from './exportSheet.js';

const LEYENDA_TEXTO = `Cómo anotar cada campo

rol — "rotativo" para casi todo (plato de diario). "capricho" solo para el
gusto que uno se da, no óptimo. "ancla" ya está puesto donde toca; no lo cambies.

batchable — ¿cocinarías una olla/bandeja grande para varios días? Guiso,
legumbre, arroz al horno → sí. Plancha rápida, ensalada, pescado → normalmente no.

leftoverQuality — recalentado al día siguiente: "alta" = mejora o aguanta
perfecto (guisos, legumbres, cremas); "media" = comestible pero pierde algo
(carne/ave a la plancha, arroces); "baja" = da pena (fritos, crujientes,
pescado blanco, ensaladas).

shelfLifeDays — días en nevera: pescado/marisco 1; ave/carne a la plancha 2;
cerdo/ternera guisada 3; legumbre/guiso 3–4; crema fría 2–3.

energiaCocina — esfuerzo de cocinarlo: "bajo" = plancha/salteado rápido;
"medio" = horno con su tiempo o varios elementos; "alto" = guiso largo o
elaboración.

Nombre sugerido — ya viene propuesto; corrígelo si no te gusta, déjalo si sí.`;

exportSheet({ leyendaTexto: LEYENDA_TEXTO }).then(({ outputPath, nFilas, nPreAnotados }) => {
  console.log(`Escrito: ${outputPath}`);
  console.log(`Filas: ${nFilas}`);
  console.log(`Pre-anotados (anclas): ${nPreAnotados}`);
});
