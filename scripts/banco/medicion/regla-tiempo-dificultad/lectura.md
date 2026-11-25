# Lectura de la medición (2026-11-25)

Medición, no producto: ningún archivo de `src/` cambia. Las cifras están en `informe.md` (generado por `resumenReglaTiempo.mjs`); esto es lo que leo en ellas.

## Cómo se reproduce

Datos de entrada: `vigente.csv`, las columnas Vigente de la hoja del PR #34 (commit `1d04de5`). Por cada perfil y combinación:

```
node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/reglaTiempoDificultad.mjs \
  scripts/banco/medicion/medirReglaTiempo.mjs <carpeta>/<perfil>__<tiempo>__<experiencia>.json <perfil> <tiempo> <experiencia> 200
node scripts/banco/medicion/resumenReglaTiempo.mjs <carpeta> scripts/banco/medicion/regla-tiempo-dificultad/informe.md
```

Perfiles: los 18 de la medición de la guarnición (12 del banco, `omni-2174-batido`, `omni-2174-volumen`, `sin-carne-ave-2000`, `solo-pollo-2000`, `sin-garbanzos-guisantes-2000` y `sin-legumbres-2000`). Combinaciones: poco+novato, poco+intermedio, normal+novato y normal+intermedio (control). Semanas 60 a 259, seguidas, como en producción. Los JSON de cada medición (unos 70) no se suben.

## Qué sale

1. **La red casi no actúa en omnívora ni en vegetariana, pero sí en vegana.**
   - Omnívora, poco+novato: 1,2 % de los huecos (0,12 por semana). Se concentra en la cena del viernes, cuando la semana ya ha gastado los candidatos.
   - `sin-carne-ave-2000` es la excepción omnívora: 12,5 % de los huecos, sobre todo en la comida del viernes y del jueves.
   - Vegetariana: 0 en las tres combinaciones.
   - Vegana (`vegana-1400`): 35 % de los huecos con poco+novato (3,5 por semana, todas las semanas), 27 % con normal+novato y 7 % con poco+intermedio. Va a rachas, por el «no repetir platos de la semana anterior»: una semana con casi todo filtrado gasta los pocos platos vegano + rápido + fácil, y la siguiente se queda sin ellos (en los ejemplos, la semana 61 tiene 7 huecos de red). Con el catálogo vegano de hoy, el filtro no se puede cumplir semana tras semana.
2. **Repetición.**
   - Platos distintos en 200 semanas, en omnívora: 176 en el control, 155 con poco+novato (−12 %). La parte de los 10 platos más frecuentes sube de 21,9 % a 23,6 %. Vegetariana: 74 → 63. Vegana: 47 → 44.
   - Aparecen algunas infracciones de especie en omnívora que el control no tiene: 2 de «mismo día» y 7 de «días seguidos» en 3200 semanas. El filtro cambia lo que se elige al principio de la semana, y alguna regla de separación se queda sin poder aplicarse más tarde.
   - En vegana, «especie más de 2 veces» ya es alta en el control (349) y sube con el filtro (409-435).
3. **Pescado y legumbre.**
   - El pescado por semana no cambia (3,36): lo fija el tope.
   - **El filtro de novato sí empuja hacia el pescado al horno:** 1,40 → 1,80 por semana (del 42 % al 54 % del pescado servido). La causa es que el pescado a la plancha es «media».
   - Legumbre: en omnívora no cambia (1,79). En vegetariana cae de 2,69 a 1,05-1,15 por semana con cualquier filtro, y en vegana de 3,25 a 2,1-2,5. Los platos de legumbre son de remojo o de más de 45 min (no «poco tiempo») y de sofrito (media); con la guarnición de bote no se compensa.
4. **Proteína corta y energía.**
   - Omnívora: prácticamente igual. Cortas: 2,32 → 2,38 por semana. Proteína del día: −0,4 puntos. Kcal del día: igual.
   - Vegetariana y vegana mejoran algo en proteína corta (−1 por semana). Vegana sigue mal en energía: el 60 % de sus comidas y cenas va fuera de ±5 % de kcal, frente al 51 % del control.

## Qué no cubre

- El ancla de «cocinar en cantidad» no se filtra: en `omni-2174-ancla`, 390 huecos de lunes a viernes (de 2000) los coloca el ancla sin filtro. Por eso solo el 91 % de lo servido entre semana cumple la condición.
- La guarnición de legumbre de bote (D-119) se decide después de elegir el plato y no se mira en el filtro (la legumbre de bote no alarga el plato).
- Las tortillas de plantilla cuentan como fáciles porque la hoja ya lleva la receta del PR #36 (tortilla francesa), que aún no está en `main`.
- Con «poco», la app ya da desayunos rápidos (`desayunosApp.js`): entra en la proteína y la energía del día de las combinaciones con «poco».
