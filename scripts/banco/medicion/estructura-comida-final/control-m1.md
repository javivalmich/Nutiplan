# Control de M1: la legumbre crece antes que el segundo

Salida de `resumenControlM1.mjs`: la app antes de M1 (`1c23a97`) → con M1 (`9f708e5`), `medirEstructura.mjs --ec=off`, 200 semanas por perfil desde la 60. Solo comidas dobles, salvo las tres últimas columnas (todas las comidas y cenas de la semana).

| Perfil | Comidas dobles | < 95 % kcal | > 105 % kcal | Cortas de proteína (dobles) | Con pan o fruta | Legumbre seca, mediana (g) | Segundo, mediana (g) | Aceite comida doble (ml) | Comidas y cenas cortas/sem | Proteína del día | Aceite del día (ml, máx.) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 612 → 612 | 0 → 0 | 41 → 41 | 0 → 0 | 0 → 0 | 50 → 50 | 100 → 95 | 17,8 → 17,8 | 2,6 → 2,6 | 100,5 → 100,3 % | 27,1 (45) → 27,1 (45) |
| omni-2174 | 612 → 612 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 115 → 115 | 170 → 170 | 20,0 → 20,0 | 1,9 → 1,9 | 106,8 → 106,8 % | 37,7 (60) → 37,7 (60) |
| omni-2600-3comidas | 609 → 609 | 0 → 0 | 0 → 0 | 0 → 0 | 449 → 449 | 120 → 120 | 180 → 180 | 20,0 → 20,0 | 1,4 → 1,4 | 116,0 → 116,1 % | 42,8 (60) → 42,8 (60) |
| omni-3714 | 608 → 608 | 1 → 1 | 0 → 0 | 0 → 0 | 608 → 608 | 120 → 120 | 300 → 300 | 20,0 → 20,0 | 3,0 → 3,0 | 107,9 → 107,9 % | 42,8 (60) → 42,8 (60) |
| celiaco-2400 | 609 → 609 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 120 → 120 | 225 → 225 | 20,0 → 20,0 | 1,6 → 1,6 | 110,8 → 110,8 % | 41,5 (60) → 41,5 (60) |
| sin-lactosa-2000 | 608 → 608 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 110 → 110 | 125 → 125 | 20,0 → 20,0 | 1,6 → 1,6 | 108,8 → 108,8 % | 37,0 (60) → 37,0 (60) |
| sin-pescado-2000 | 425 → 425 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 105 → 105 | 125 → 125 | 20,0 → 20,0 | 3,2 → 3,2 | 104,7 → 104,7 % | 36,9 (60) → 36,9 (60) |
| sibo-2000 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | NaN → NaN | NaN → NaN | — → — | 2,3 → 2,3 | 98,1 → 98,1 % | 36,5 (60) → 36,5 (60) |
| omni-2174-ancla | 549 → 549 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 115 → 115 | 170 → 170 | 20,0 → 20,0 | 2,0 → 2,0 | 105,9 → 105,9 % | 37,0 (60) → 37,0 (60) |
| omni-2000-sin-atun | 612 → 612 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 110 → 110 | 125 → 125 | 20,0 → 20,0 | 2,1 → 2,1 | 108,0 → 108,0 % | 37,1 (60) → 37,1 (60) |
| **Total** | 5244 → 5244 | 1 → 1 | 41 → 41 | 0 → 0 | 1057 → 1057 | 115 → 115 | 155 → 155 | 19,7 → 19,7 | 2,2 → 2,2 | 106,7 → 106,7 % | 37,6 (60) → 37,6 (60) |

Lectura junta distinta de plato a plato: 0 → 0. Planes que no son de engine2: 0 → 0.

Comidas dobles por encima del 105 % con M1:

- omni-1434, semana 63, día 4: 553 de 519 kcal (+6,6 %), legumbre 50 g, segundo 135 g
- omni-1434, semana 64, día 6: 515 de 490 kcal (+5,1 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 72, día 6: 517 de 489 kcal (+5,7 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 73, día 6: 545 de 514 kcal (+6,0 %), legumbre 50 g, segundo 125 g
- omni-1434, semana 75, día 6: 522 de 473 kcal (+10,4 %), legumbre 50 g, segundo 115 g
- omni-1434, semana 85, día 6: 506 de 407 kcal (+24,3 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 92, día 6: 553 de 493 kcal (+12,2 %), legumbre 50 g, segundo 135 g
- omni-1434, semana 101, día 6: 505 de 480 kcal (+5,2 %), legumbre 50 g, segundo 80 g
- omni-1434, semana 103, día 6: 507 de 481 kcal (+5,4 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 107, día 6: 524 de 447 kcal (+17,2 %), legumbre 50 g, segundo 115 g
- omni-1434, semana 109, día 6: 487 de 429 kcal (+13,5 %), legumbre 50 g, segundo 100 g
- omni-1434, semana 112, día 6: 515 de 401 kcal (+28,4 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 118, día 6: 520 de 449 kcal (+15,8 %), legumbre 50 g, segundo 115 g
- omni-1434, semana 121, día 4: 565 de 538 kcal (+5,0 %), legumbre 50 g, segundo 130 g
- omni-1434, semana 130, día 6: 553 de 481 kcal (+15,0 %), legumbre 50 g, segundo 130 g
- omni-1434, semana 141, día 1: 504 de 432 kcal (+16,7 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 147, día 6: 509 de 441 kcal (+15,4 %), legumbre 50 g, segundo 100 g
- omni-1434, semana 153, día 6: 517 de 489 kcal (+5,7 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 156, día 6: 509 de 476 kcal (+6,9 %), legumbre 50 g, segundo 105 g
- omni-1434, semana 158, día 0: 543 de 496 kcal (+9,5 %), legumbre 50 g, segundo 140 g
- omni-1434, semana 158, día 6: 503 de 475 kcal (+5,9 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 161, día 6: 500 de 475 kcal (+5,3 %), legumbre 50 g, segundo 80 g
- omni-1434, semana 166, día 6: 518 de 489 kcal (+5,9 %), legumbre 50 g, segundo 115 g
- omni-1434, semana 168, día 6: 539 de 500 kcal (+7,8 %), legumbre 50 g, segundo 120 g
- omni-1434, semana 170, día 2: 517 de 485 kcal (+6,6 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 173, día 2: 517 de 480 kcal (+7,7 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 178, día 4: 513 de 486 kcal (+5,6 %), legumbre 50 g, segundo 85 g
- omni-1434, semana 182, día 3: 520 de 495 kcal (+5,1 %), legumbre 50 g, segundo 90 g
- omni-1434, semana 187, día 0: 554 de 521 kcal (+6,3 %), legumbre 50 g, segundo 105 g
- omni-1434, semana 196, día 6: 539 de 456 kcal (+18,2 %), legumbre 50 g, segundo 125 g
- omni-1434, semana 198, día 0: 553 de 518 kcal (+6,8 %), legumbre 50 g, segundo 135 g
- omni-1434, semana 198, día 6: 565 de 538 kcal (+5,0 %), legumbre 50 g, segundo 130 g
- omni-1434, semana 200, día 4: 545 de 516 kcal (+5,6 %), legumbre 50 g, segundo 125 g
- omni-1434, semana 218, día 6: 508 de 482 kcal (+5,4 %), legumbre 50 g, segundo 105 g
- omni-1434, semana 223, día 2: 565 de 538 kcal (+5,0 %), legumbre 50 g, segundo 130 g
- omni-1434, semana 223, día 4: 553 de 518 kcal (+6,8 %), legumbre 50 g, segundo 135 g
- omni-1434, semana 224, día 6: 503 de 445 kcal (+13,0 %), legumbre 50 g, segundo 105 g
- omni-1434, semana 225, día 6: 537 de 511 kcal (+5,1 %), legumbre 50 g, segundo 95 g
- omni-1434, semana 238, día 0: 567 de 538 kcal (+5,4 %), legumbre 50 g, segundo 110 g
- omni-1434, semana 253, día 6: 509 de 476 kcal (+6,9 %), legumbre 50 g, segundo 100 g
- omni-1434, semana 258, día 6: 508 de 481 kcal (+5,6 %), legumbre 50 g, segundo 105 g
