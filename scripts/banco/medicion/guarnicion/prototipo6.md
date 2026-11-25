# Prototipo 2: topes de plato en las comidas con guarnición (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `105cad5`. Parte de la ronda final (`prototipo4.md`) y añade `--racionGuarnicion3`:

`--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099 --hidratoSeguidos --racionGuarnicion3`

Las cifras de cada perfil están en `prototipo6-resumen.md`.

## Cómo se fija hoy el objetivo de cada comida (sin cambios)

**1. El día: kcal y proteína.**
- **Kcal.** En la app son `calcTarget(calcTDEE(…), goal, kcalAdjust)` (`src/ui/views/OriginalPlanApp.jsx:243`):
  - `calcTDEE` es Mifflin-St Jeor por el multiplicador de actividad (`src/engine/nutrition.js:6-11`);
  - `calcTarget` le suma `GOAL_ADJ[goal]` más el ajuste del usuario, con un mínimo de 1200 (`src/engine/nutrition.js:13-16`).
  - En el banco las kcal van fijadas a mano (`scripts/banco/perfiles.mjs:1-3`).
- **Proteína.** Es `objetivoDe` (`src/plan/racionesApp.js:24-28`): peso × `PROTEIN_FACTOR[actividad][goal]`, de `calcMacros` (`src/engine/nutrition.js:18-22`; tabla en `src/engine/constants.js:8-14`).
- `objetivoDe` solo toma la proteína de `calcMacros`. La grasa y los hidratos que calcula no los usa engine2.

**2. Cómo influye el objetivo del perfil.** Cambia dos números del día, y nada más:
- **Las kcal**, a través de `GOAL_ADJ` (`src/engine/constants.js:5`): adelgazar −500, −350 o −250; mantener 0; volumen +250 (`mildGain`) o +400 (`muscleGain`).
- **Los g/kg de proteína**, a través de `PROTEIN_FACTOR`. Con actividad moderada: adelgazar 2,0, 1,8 o 1,7; mantener 1,8; volumen 2,1 o 2,2.
- **La estrategia** (`computeStrategy`, `src/engine/nutrition.js:32-42`) solo entra en la grasa de `calcMacros`, que engine2 no usa. En engine2 no cambia el reparto entre comidas ni los rangos de ración.

**3. Cada comida.** Lo decide `racionesDia` (`src/engine2/nutrientes/raciones.js:291`):
- **Kcal de la comida:** kcal del día × su parte, `REPARTO` (`raciones.js:35`). Desayuno 0,225, comida 0,375, cena 0,275 y tentempiés 0,125, divididos entre los que haya (`raciones.js:302-303`, `metaDe` en `raciones.js:333-340`).
- **Proteína de la comida:**
  - Primero se racionan los tentempiés, sin objetivo de proteína (`raciones.js:346-350`).
  - La proteína que queda se reparte entre desayuno, comida y cena según su parte (`raciones.js:351-352` y `338`). La comida se lleva 0,375 / 0,875 = 42,9 %.
  - Nunca baja de 0,3 g por kg de peso (`PROTEINA_MIN_POR_KG`, `raciones.js:34` y `309`).
- **Dentro del plato** (`ajustarComida`): los proteicos se dimensionan para llegar a la proteína de la comida (`raciones.js:206`), y los energéticos completan las kcal (`raciones.js:209`).
- **El objetivo de kcal también cambia los rangos:** por encima de 2200 kcal, el máximo de los energéticos crece hasta ×1,4 (`raciones.js:311`, `AMPLITUD_MAX`). La proteína no.
- **Lo que no entra** por los límites de una comida se reparte después entre las que aún tienen margen (`raciones.js:384-402`).
- **Ejemplo, omni-2174** (2174 kcal, 74 kg, mantener): 133 g de proteína al día. La comida tiene 815 kcal y 53 g, que es (133 − 8 g del tentempié) × 0,429.

**4. El batido de proteína** (`batidoDelDia`, `src/plan/racionesApp.js:36-44`; se pasa como `aparte` en `racionesApp.js:248-249`):
- **Baja las kcal y la proteína, pero solo de la comida a la que acompaña.** Se descuenta entero de ella (`raciones.js:318-329`, aplicado en `metaDe`, `raciones.js:337-339`). Las demás comidas no cambian.
- **A qué comida acompaña** depende de `timing` (`MOMENTO_BATIDO`, `racionesApp.js:33`):
  - por la mañana, al desayuno;
  - después de entrenar o por la noche, a la cena;
  - si no lo dice, a la cena.
- Solo si esa comida no existe o es libre, se reparte entre las principales.
- **Ninguna opción lo descuenta de la comida.** El objetivo de la comida con guarnición es igual con y sin batido. Se ve en el día de abajo: 815 kcal y 53 g en los dos.
- **La proteína del día no baja tanto como el batido:**
  - La cena pierde las 120 kcal, pero su proteína no puede bajar de 22 g (0,3 × 74). En el ejemplo, la cena pasa de 39 g a 22 g, no a 15 g.
  - El objetivo de proteína del día no cambia: 133 g.
  - El día con batido da 153 g, porque son 24 g del batido sobre unas comidas que no bajan lo mismo. Por eso omni-2174-batido mide un 109-112 % de proteína en las tres mediciones, también en `main`.
  - Por eso también tiene tan pocas comidas cortas (0,89 por semana): la cena se compara con un objetivo ya rebajado.

## Cambios sobre la ronda final

1. **Topes de plato en las comidas con guarnición:** ave y carne 200 g (pollo, pavo, ternera, cerdo, conejo); pescado y marisco 220 g. La legumbre de guarnición va de 100 a 220 g escurridos, con salida en 130 g, y no crece con la amplitud del objetivo.
2. **Orden:**
   - El proteico se dimensiona por la proteína de la comida, como siempre, pero hasta su tope. Si llega al tope y la proteína pedía más, se queda ahí.
   - Con la proteína cubierta (o el proteico en su tope), si faltan kcal, crece la legumbre desde 130 g hasta 220 g. Solo después entra el pan, si el plato sigue más de un 5 % por debajo.
   - El proteico no crece por kcal.
   - Causa en el log de raciones: `guarnicion_crece_por_energia`. Dice cuánto proteico pide la proteína, si está en su tope y qué crece por kcal.

Los platos no cambian, porque el walk es el mismo. Las legumbres por semana y D-099.3 son las de la ronda final.

**Perfiles nuevos** (`perfilesExtra.mjs`; no están en el banco, para no cambiar sus cifras ni sus tests):
- **omni-2174-batido:** omni-2174 con batido (1 cacito, 120 kcal y 24 g, después de entrenar: va con la cena). Son los valores por defecto de `batidoDelDia`.
- **omni-2174-volumen:** omni-2174 con objetivo `mildGain`. 2424 kcal (2174 + 250 de `GOAL_ADJ`) y 2,1 g/kg de proteína (155 g al día, frente a 133).

## Resultados: 200 semanas, 18 perfiles

Agregado de los 9 omnívoros de siempre, 1800 semanas por medición:

| Métrica | main | Ronda final | Topes de plato |
|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,43 | 2,54 |
| Proteína del día | 101,2 % | 102,2 % | 103,0 % |
| Fuera de ±5 % de kcal (por encima / por debajo) | 10,7 % (708 / 1787) | 12,1 % (585 / 2254) | 12,4 % (570 / 2340) |
| Comidas con guarnición | — | 3149 | 3149 |
| Proteico en ellas, g: mediana (máximo) | — | 120 (300) | 165 (220) |
| Legumbre en ellas, g: mediana (máximo) | — | 240 (330) | 220 (220) |
| De ellas, con pan | — | 90,2 % | 86,8 % |
| Legumbres/sem (guarnición + plato) | 1,16 | 2,00 | 2,00 |
| Infracciones de D-099.3 | 6 | 0 | 0 |

Por perfil: comidas cortas/sem · fuera de ±5 % de kcal (por encima / por debajo).

| Perfil | main | Ronda final | Topes de plato |
|---|---|---|---|
| omni-1434 | 3,31 · 22,7 % (496 / 95) | 2,95 · 19,5 % (393 / 115) | 2,85 · 18,9 % (381 / 110) |
| omni-2174 | 2,64 · 6,4 % (48 / 119) | 2,11 · 4,9 % (28 / 100) | 2,12 · 4,7 % (28 / 95) |
| omni-2174-batido | 1,52 · 4,5 % (74 / 42) | 0,89 · 7,6 % (107 / 91) | 0,89 · 7,4 % (105 / 88) |
| omni-2174-volumen | 2,42 · 5,6 % (2 / 144) | 2,01 · 7,1 % (2 / 182) | 2,02 · 6,7 % (2 / 171) |
| omni-2600-3comidas | 2,00 · 19,3 % (18 / 484) | 1,67 · 29,8 % (32 / 744) | 1,67 · 26,2 % (32 / 648) |
| omni-3714 | 4,37 · 27,3 % (0 / 709) | 3,42 · 34,2 % (0 / 888) | 4,50 · 41,7 % (0 / 1083) |
| celiaco-2400 | 2,23 · 8,5 % (5 / 217) | 1,91 · 10,1 % (6 / 257) | 1,92 · 10,1 % (5 / 258) |
| sin-lactosa-2000 | 2,19 · 2,5 % (43 / 21) | 1,79 · 2,8 % (42 / 32) | 1,79 · 2,7 % (41 / 28) |
| sin-pescado-2000 | 3,81 · 1,7 % (27 / 17) | 3,17 · 1,5 % (26 / 13) | 3,17 · 1,7 % (27 / 16) |
| omni-2174-ancla | 2,65 · 5,1 % (34 / 98) | 2,58 · 4,0 % (18 / 85) | 2,58 · 3,8 % (17 / 82) |
| omni-2000-sin-atun | 2,62 · 2,5 % (37 / 27) | 2,25 · 2,3 % (40 / 20) | 2,26 · 2,3 % (39 / 20) |
| solo-pollo-2000 | 2,50 · 4,2 % (84 / 25) | 2,78 · 3,4 % (48 / 40) | 2,78 · 2,9 % (47 / 29) |
| sin-carne-ave-2000 | 2,94 · 4,1 % (71 / 35) | 3,44 · 1,8 % (28 / 19) | 3,44 · 1,8 % (27 / 19) |
| sin-garbanzos-guisantes-2000 | 1,80 · 2,3 % (44 / 17) | 2,10 · 2,0 % (30 / 23) | 2,11 · 2,1 % (31 / 23) |
| vegetariana-2000 | 4,33 · 7,9 % (173 / 33) | 4,42 · 7,5 % (166 / 30) | 4,42 · 7,5 % (166 / 30) |
| vegana-1400 | 4,87 · 50,0 % (1223 / 78) | 4,54 · 51,3 % (1274 / 59) | 4,54 · 51,3 % (1274 / 59) |
| sibo-2000 | 2,15 · 15,0 % (296 / 94) | 2,31 · 4,9 % (61 / 66) | 2,31 · 4,9 % (61 / 66) |
| sin-legumbres-2000 | 1,66 · 2,9 % (40 / 35) | 2,16 · 2,5 % (40 / 25) | 2,16 · 2,5 % (40 / 25) |

Los dos perfiles nuevos, en detalle:

| Perfil | Medición | Proteína del día | Proteico en las comidas con guarnición: mediana (máximo) | Legumbre: mediana (máximo) | Con pan |
|---|---|---|---|---|---|
| omni-2174 | Ronda final | 101,7 % | 135 (255) | 230 (240) | 97,9 % |
| omni-2174 | Topes de plato | 103,0 % | 175 (220) | 220 (220) | 96,1 % |
| omni-2174-batido | Ronda final | 110,8 % | 135 (250) | 230 (240) | 99,2 % |
| omni-2174-batido | Topes de plato | 112,1 % | 175 (220) | 220 (220) | 95,5 % |
| omni-2174-volumen | Ronda final | 100,9 % | 185 (300) | 250 (260) | 97,6 % |
| omni-2174-volumen | Topes de plato | 101,4 % | 200 (220) | 220 (220) | 99,5 % |

**Lectura:**
- **Los topes evitan los platos de 300 g de la ración anterior** (`prototipo5.md`). Aun así, el proteico sube frente a la ronda final: mediana de 120 a 165 g. Ahora la legumbre empieza en 130 g en lugar de 180, y aporta menos proteína al principio, así que el proteico tiene que poner más.
- **La legumbre acaba casi siempre en su tope** de 220 g, y el pan sigue en el 87 % de las comidas con guarnición. Con la proteína cubierta, la legumbre sola no llega a las kcal de la comida, igual que antes.
- **El agregado empeora un poco frente a la ronda final:** 2,54 comidas cortas por semana frente a 2,43, y un 12,4 % fuera de kcal frente a 12,1 %. Es casi todo omni-3714:
  - Sus comidas cortas pasan de 3,42 a 4,50, y su fuera de kcal de 34,2 % a 41,7 %.
  - Su comida pide más proteína de la que caben en 200 o 220 g de proteico. Antes llegaba con 280 g de proteico y 330 g de legumbre.
  - Con los topes, la proteína se queda corta y las kcal también, porque la legumbre y el pan tampoco llegan.
- **omni-2600-3comidas mejora** frente a la ronda final (fuera de kcal de 29,8 % a 26,2 %), pero sigue por encima de `main` (19,3 %).
- **El resto de perfiles quedan casi igual** que en la ronda final.
- **Con batido,** las comidas con guarnición son iguales que sin batido: mismo objetivo y mismos gramos. El batido solo cambia la cena.
- **Con volumen,** el proteico va casi siempre a su tope (mediana 200 g), porque la proteína de la comida sube de 53 a 62 g. La legumbre también va a su tope, y el pan sale en el 99,5 % de las comidas con guarnición.

## El mismo día en tres versiones

Semana 63, jueves. Topes de plato. Los tres perfiles se generan con la semilla de omni-2174 (`mismoDia.mjs`), así que los platos son los mismos y solo cambian las raciones.

### omni-2174: 2174 kcal y 133 g de proteína al día (maintain)

**Desayuno: Tostada con pavo, queso fresco y tomate** — objetivo 489 kcal y 32 g de proteína; da 488 kcal y 38 g

- Pan integral (90g) tostado · pavo en lonchas (50g) · queso fresco tipo Burgos 0 % (60g) · tomate
- Café con leche semidesnatada (300ml)

**Almuerzo: Kéfir y una pieza de fruta** — objetivo 272 kcal y 0 g de proteína; da 266 kcal y 8 g

- Kéfir natural (155ml) · fruta de temporada (1 ud)
- Nueces (15 g)

**Comida: Conejo al horno con espinacas y garbanzos** — objetivo 815 kcal y 53 g de proteína; da 809 kcal y 60 g

- Conejo troceado (175 g) al horno con romero, limón y ajo
- Garbanzos cocidos (220 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (20 ml) · Pan integral (30 g) para acompañar

**Cena: Huevos revueltos con champiñones** — objetivo 598 kcal y 39 g de proteína; da 586 kcal y 30 g

- 3 huevos revueltos con ajo, perejil y guindilla
- 8 champiñones salteados (160 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

Día: 2149 kcal y 136 g de proteína.

- `guarnicion_crece_por_energia` — comida con guarnición: conejo 175 g por la proteína de la comida (tope 200 g); con la proteína cubierta, faltaban kcal: crece la legumbre (garbanzos_cocidos 130 → 220 g); después el pan (pan_integral 30 → 33 g)

### omni-2174-batido: 2174 kcal y 133 g de proteína al día (maintain; batido 120 kcal y 24 g, con la cena)

**Desayuno: Tostada con pavo, queso fresco y tomate** — objetivo 489 kcal y 32 g de proteína; da 488 kcal y 38 g

- Pan integral (90g) tostado · pavo en lonchas (50g) · queso fresco tipo Burgos 0 % (60g) · tomate
- Café con leche semidesnatada (300ml)

**Almuerzo: Kéfir y una pieza de fruta** — objetivo 272 kcal y 0 g de proteína; da 266 kcal y 8 g

- Kéfir natural (155ml) · fruta de temporada (1 ud)
- Nueces (15 g)

**Comida: Conejo al horno con espinacas y garbanzos** — objetivo 815 kcal y 53 g de proteína; da 809 kcal y 60 g

- Conejo troceado (175 g) al horno con romero, limón y ajo
- Garbanzos cocidos (220 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (20 ml) · Pan integral (30 g) para acompañar

**Cena: Huevos revueltos con champiñones** — objetivo 478 kcal y 22 g de proteína; da 455 kcal y 23 g

- 3 huevos revueltos con ajo, perejil y guindilla
- 8 champiñones salteados (160 g) · AOVE (20 ml)

Día: 2138 kcal y 153 g de proteína (con el batido).

- `guarnicion_crece_por_energia` — comida con guarnición: conejo 175 g por la proteína de la comida (tope 200 g); con la proteína cubierta, faltaban kcal: crece la legumbre (garbanzos_cocidos 130 → 220 g); después el pan (pan_integral 30 → 33 g)

### omni-2174-volumen: 2424 kcal y 155 g de proteína al día (mildGain)

**Desayuno: Tostada con pavo, queso fresco y tomate** — objetivo 545 kcal y 37 g de proteína; da 556 kcal y 46 g

- Pan integral (100g) tostado · pavo en lonchas (70g) · queso fresco tipo Burgos 0 % (80g) · tomate
- Café con leche semidesnatada (320ml)

**Almuerzo: Kéfir y una pieza de fruta** — objetivo 303 kcal y 0 g de proteína; da 315 kcal y 10 g

- Kéfir natural (185ml) · fruta de temporada (1 ud)
- Nueces (20 g)

**Comida: Conejo al horno con espinacas y garbanzos** — objetivo 909 kcal y 62 g de proteína; da 919 kcal y 68 g

- Conejo troceado (200 g) al horno con romero, limón y ajo
- Garbanzos cocidos (220 g) · 4 puñados de espinacas salteadas (170 g) · AOVE (20 ml) · Pan integral (60 g) para acompañar

**Cena: Huevos revueltos con champiñones** — objetivo 667 kcal y 46 g de proteína; da 683 kcal y 33 g

- 3 huevos revueltos con ajo, perejil y guindilla
- 9 champiñones salteados (170 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

Día: 2473 kcal y 157 g de proteína.

- `guarnicion_crece_por_energia` — comida con guarnición: conejo 200 g por la proteína de la comida (en su tope de plato, 200 g: la proteína pedía más); con la proteína hasta el tope, faltaban kcal: crece la legumbre (garbanzos_cocidos 130 → 220 g); después el pan (pan_integral 30 → 56 g)
