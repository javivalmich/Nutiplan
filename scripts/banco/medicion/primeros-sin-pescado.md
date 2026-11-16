# Primeros sin legumbre ni aliño repetidos, en los perfiles sin pescado ni marisco

Salida de `resumenPrimerosSinPescado.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`), con el motor tras el aceite 10 + 10 (D-116.6) y la variante «legumbre no usada en la semana y aliño no usado por otro primero» aplicada en memoria (`variantesComidaDoble.mjs --primero=noUsadosPrimeros`). «gluten-sin-pescado-2000» y «lactosa-gluten-sin-pescado-2000» son sintéticos (`variantesRed.mjs`).

| Perfil | Variante | Infracciones de D-099.3 | Comidas y cenas cortas de proteína/sem | Comidas dobles cortas | Semanas con la red | Proteína del día | Comidas dobles/sem | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso | Día sorteado sin legumbre /100 sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sin-pescado-2000 | Motor | 2 | 3,14 | 0 | 63 | 104,4 % | 2,15 | 137 | 120 (88 %) | 100 (73 %) | 55 (40 %) | 5,5 |
| | Variante | 2 | 3,17 | 0 | 64 | 104,2 % | 2,13 | 136 | 103 (76 %) | 74 (54 %) | 43 (32 %) | 4,5 |
| gluten-sin-pescado-2000 | Motor | 25 | 3,92 | 0 | 192 | 95,7 % | 0,10 | 8 | 7 (88 %) | 3 (38 %) | 1 (13 %) | 2,5 |
| | Variante | 24 | 3,83 | 0 | 183 | 95,9 % | 0,24 | 17 | 15 (88 %) | 6 (35 %) | 3 (18 %) | 5,0 |
| lactosa-gluten-sin-pescado-2000 | Motor | 28 | 4,18 | 0 | 195 | 95,0 % | 0,07 | 5 | 3 (60 %) | 2 (40 %) | 2 (40 %) | 0,5 |
| | Variante | 27 | 4,17 | 0 | 197 | 94,9 % | 0,04 | 3 | 1 (33 %) | 1 (33 %) | 0 (0 %) | 0,0 |

Planes que no son de engine2: motor 0 · variante 0.

**La variante empeora:** sin-pescado-2000: cortas de proteína 3,14 → 3,17 por semana (comidas dobles 0 → 0); sin-pescado-2000: semanas con la red 63 → 64; lactosa-gluten-sin-pescado-2000: semanas con la red 195 → 197.

Decisión (regla de Javi del 2026-11-16: si empeora infracciones, cortas de proteína o semanas con la red en alguno de los tres perfiles, no se implementa): **no implementada**. Las diferencias son pequeñas (0,03 comidas cortas por semana; 1 y 2 semanas más con la red de 200) y en el mismo sentido que el ruido entre variantes de este tamaño, pero la regla es estricta. Las infracciones de D-099.3 no empeoran en ninguno (2 → 2, 25 → 24, 28 → 27).
