# Lectura de la medición (2026-11-25)

Medición, no producto: ningún archivo de `src/` cambia. Las cifras están en `informe.md` (generado por `resumenReglaTiempo.mjs`) y el detalle de las infracciones de la primera medición en `infracciones-especie.md`; esto es lo que leo en ellas.

## Cómo se reproduce

Datos de entrada: `vigente.csv`, con las columnas Vigente de la hoja del PR #34 (commit `1d04de5`) y las columnas `bote_*` de la variante. Por cada perfil y combinación (con `--bote` para la variante):

```
node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/reglaTiempoDificultad.mjs \
  scripts/banco/medicion/medirReglaTiempo.mjs <carpeta>/<perfil>__<tiempo>__<experiencia>.json <perfil> <tiempo> <experiencia> 200 [--bote]
node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/resumenReglaTiempo.mjs <carpeta> scripts/banco/medicion/regla-tiempo-dificultad/informe.md \
  --bote <carpeta con --bote> --anterior <carpeta de la medición de 4182b9d>
```

Perfiles: los 18 de la medición de la guarnición (12 del banco, `omni-2174-batido`, `omni-2174-volumen`, `sin-carne-ave-2000`, `solo-pollo-2000`, `sin-garbanzos-guisantes-2000` y `sin-legumbres-2000`). Combinaciones: poco+novato, poco+intermedio, normal+novato y normal+intermedio (control). Semanas 60 a 259, seguidas, como en producción. Los JSON de cada medición no se suben.

## Cambios del hook frente a `4182b9d`

1. **Red de la semana.** Las 16 infracciones de especie de los perfiles no veganos (9 con poco+novato y 7 con poco+intermedio, todas de `sin-pescado-2000`) no eran un error del hook. Caían en el fin de semana, que no se filtra: entre semana el filtro gastaba las especies rápidas hasta su tope de 2, y al fin de semana solo le quedaba el conejo, sin poder separarlo (`infracciones-especie.md`). Ahora, si la semana filtrada incumple D-099.3, se repite entera sin el filtro, con la misma semilla, y se queda la repetición solo si incumple menos, como en la red de D-099.3 de la guarnición. **Resultado: 0 infracciones de especie en omnívora y vegetariana.** Para ello la red rehace 7 + 8 semanas de 3200 (solo de `sin-pescado-2000`).
2. **Capricho.** No cae nunca entre semana. El esqueleto lo retira (`src/engine2/skeleton/buildWeekArc.js:412`, `caprichoDay = undefined`, «el capricho de la semana es la comida libre del sabado») y el sábado es siempre el día libre (`buildWeekArc.js:84`, `fixedRoles.Sabado = 'libre'`). He quitado esa excepción del hook.
3. **Variante «legumbre de bote»** (`--bote`, solo con tiempoCocina = poco). Afecta a los 15 platos de legumbre que no son de poco tiempo solo por el remojo o la cocción larga. Cuentan con su tiempo con legumbre de bote: 9 con la estimación del motivo del cocinero («de bote: activo igual, total ~25»: alubias y garbanzos) y 6 estimados y marcados en `bote_fuente` (las 5 lentejas y la fabada). La dificultad no cambia: todos son de dificultad media.
   - **Fuera de la variante:** los caldos gallegos completos y el cocido, porque también cuecen carnes 25-40 min aunque la legumbre sea de bote, y el falafel, que necesita garbanzo remojado en crudo.

## Qué sale

1. **La red casi no actúa en omnívora ni en vegetariana; en vegana sí.**
   - Omnívora, poco+novato: 1,2 % de los huecos y 7 semanas rehechas sin filtro. Vegetariana: 0.
   - Vegana, poco+novato: 30 % de los huecos y 41 semanas de 200 rehechas sin filtro. Con el catálogo vegano de hoy, el filtro no se puede cumplir semana tras semana.
2. **Repetición.**
   - Omnívora: 176 platos distintos en 200 semanas en el control, 155 con poco+novato y 171 con poco+intermedio.
   - Infracciones de especie: 0 en todas las combinaciones no veganas.
   - En vegana bajan frente al control (11 / 37 de mismo día / días seguidos en el control; 2 / 2 con poco+novato). «Especie más de 2 veces» sigue por encima: 407 frente a 349.
3. **Legumbre de bote.** Solo cambia poco+intermedio, porque las legumbres son «media» y no entran con «novato».
   - Vegetariana, poco+intermedio: la legumbre pasa de 1,12 a 2,81 por semana (control 2,69), y la proteína corta vuelve a la del control (4,53 frente a 4,57).
   - Vegana, poco+intermedio: legumbre de 2,23 a 3,39 por semana (control 3,25); red de 7,3 % a 4,5 %; comidas fuera de ±5 % kcal de 62,9 % a 52,1 % (control 50,9 %).
   - Omnívora: casi igual (la red pasa de 0,2 % a 0,0 %).
   - **«Poco tiempo + fácil» del catálogo no cambia con el bote** (todas estas legumbres son «media»). Sí cambia «poco tiempo» con cualquier dificultad, en comidas: omnívora 111 → 126, vegetariana 33 → 47, vegana 19 → 33. Las cenas no cambian (estos platos son de comida).
4. **Pescado, proteína y energía:** igual que en la medición anterior. El pescado por semana no cambia (lo fija el tope). Con «novato» sube el pescado al horno, del 42 % al 54 %. La proteína y la energía en omnívora, casi igual al control.

## Variante «legumbre de bote, fácil» (sección 7 del informe)

Los 15 platos de la variante bote pasan además a fáciles (columna `bote_dificultad` de `vigente.csv`; mismo criterio que las cremas: un sofrito sin punto que fallar). Solo se ha medido con poco+novato y normal+novato (`--boteFacil`), y la variante se aplica siempre que el filtro mira el plato: el tramo de bote con «poco» y la dificultad de bote con «novato» (también con normal+novato, aunque el tiempo sea normal).

- **Red.** En omnívora baja poco: de 1,2 % a 0,9 % de los huecos con poco+novato, y las 7 semanas rehechas pasan a 0. En vegana baja a la mitad: de 30 % a 15 % con poco+novato y de 27 % a 12 % con normal+novato. Las semanas rehechas en vegana pasan de 41 a 22 con poco+novato, pero suben de 18 a 51 con normal+novato. Vegetariana sigue en 0.
- **Legumbre.** Vuelve al nivel del control o por encima. Vegetariana: de 1,15 a 2,87 por semana (control 2,69). Vegana: de 2,58 a 3,90 (control 3,25). Omnívora, igual (1,79).
- **Proteína corta.** Sube con la legumbre, porque los platos de legumbre tienen menos proteína. Vegetariana: de 3,46 a 4,63 comidas cortas por semana (control 4,57). Vegana: de 4,09 a 5,15 (control 4,79). La proteína del día de vegana baja de 92,1 % a 89,3 % (control 90,9 %).
- **Energía.** Mejora: las comidas fuera de ±5 % de kcal bajan en vegana de 58,5 % a 53,0 % (control 50,9 %) y en vegetariana de 10,2 % a 7,5 %.
- **Platos distintos.** Casi igual: omnívora 155, vegetariana 63 → 66, vegana 47 → 45.
- **«Poco tiempo + fácil» del catálogo, en comidas** (las cenas no cambian, porque estos platos son de comida): omnívora 80 → 95, vegetariana 19 → 33 y vegana 10 → 24.

## Qué no cubre

- El ancla de «cocinar en cantidad» no se filtra: en `omni-2174-ancla`, 390 huecos de lunes a viernes (de 2000) los coloca el ancla sin filtro.
- La variante bote solo cambia el tiempo con el que el filtro mira cada plato. La receta que se sirve sigue pidiendo legumbre seca y remojo: para producto, la receta tendría que decir «de bote» cuando el perfil es de poco tiempo.
- La guarnición de legumbre de bote (D-119) se decide después de elegir el plato y no se mira en el filtro.
- Las tortillas de plantilla cuentan como fáciles porque la hoja ya lleva la receta del PR #36 (tortilla francesa), que aún no está en `main`.
- Con «poco», la app ya da desayunos rápidos (`desayunosApp.js`): eso entra en la proteína y la energía del día de las combinaciones con «poco».
