# Prototipo 2, última ronda: cifras (2026-11-23)

Generado con `resumenGuarnicion2.mjs` (`--var=main:main,head:HEAD,b180:(b) nueva 180 g,fin:ronda final`) y `resumenFueraKcal.mjs`. Lectura en `prototipo4.md`.

## Agregado de los 9 omnívoros (1800 semanas por medición)

| Métrica | main | HEAD | (b) nueva 180 g | ronda final |
|---|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,15 | 2,38 | 2,43 |
| … de legumbre suelta | 1,08 | 0,08 | 0,14 | 0,16 |
| … de huevo | 1,05 | 1,37 | 1,51 | 1,52 |
| … otras | 0,74 | 0,70 | 0,73 | 0,75 |
| Proteína del día | 101,2 % | 107,6 % | 102,2 % | 102,2 % |
| Legumbres/sem (guarnición + plato) | 1,16 (0,00 + 1,16) | 3,01 (0,00 + 3,01) | 2,14 (1,93 + 0,21) | 2,00 (1,75 + 0,25) |
| Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | 413 / 809 / 466 / 106 / 6 | 1 / 17 / 59 / 1601 / 122 | 25 / 252 / 971 / 552 / 0 | 34 / 311 / 1073 / 382 / 0 |
| Semanas con una legumbre repetida | 285 | 1208 | 108 | 134 |
| Pescado/sem | 4,28 | 2,68 | 2,67 | 2,67 |
| Arroz / patata / boniato / quinoa / pasta / legumbre, por semana | 1,89 / 1,69 / 0,56 / 0,49 / 0,47 / 0,00 | 1,20 / 1,46 / 0,50 / 0,27 / 0,31 / 0,00 | 1,24 / 1,27 / 0,62 / 0,49 / 0,54 / 1,93 | 1,22 / 1,22 / 0,65 / 0,49 / 0,57 / 1,75 |
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 773 | 39 |
| Pares de días seguidos con el mismo hidrato/sem, por hidrato (arroz / patata / boniato / quinoa / pasta / legumbre) | 0,27 / 0,12 / 0,03 / 0,02 / 0,00 / 0,00 | 0,12 / 0,12 / 0,02 / 0,01 / 0,00 / 0,00 | 0,15 / 0,10 / 0,02 / 0,01 / 0,00 / 0,26 | 0,01 / 0,00 / 0,00 / 0,01 / 0,00 / 0,00 |
| Semanas con legumbre (guarnición o plato) en días seguidos | 48 | 42 | 515 | 86 |
| Semanas con guarnición de legumbre en días seguidos | 0 | 0 | 448 | 0 |
| Días con algún hidrato de plantilla, por semana | 4,43 | 3,35 | 5,33 | 5,20 |
| Comidas y cenas fuera de ±5 % de kcal | 10,7 % | 8,5 % | 12,5 % | 12,1 % |
| Aceite por día (ml) | 37,3 | 37,8 | 37,1 | 37,2 |
| Comidas con guarnición que llevan pan | — | — | 3156 de 3466 (91,1 %), 91 g de media | 2839 de 3149 (90,2 %), 91 g de media |
| Infracciones de D-099.3 | 6 | 2 | 10 | 0 |

## Veces que actúa cada regla (16 perfiles, 3200 semanas por variante)

| Regla | (b) nueva 180 g | ronda final |
|---|---|---|
| Tope de 3: guarnición no puesta | 181 | 50 |
| Tope de 3: platos de legumbre fuera del pool | 905 | 516 |
| Suelo de 2 por la guarnición (pone legumbre) | 2138 | 2115 |
| Suelo de 2: ninguna legumbre válida en el hueco | 0 | 0 |
| Compuestos de legumbre fuera del pool (b) | 15758 | 16086 |
| Compuestos de legumbre admitidos por falta de otro candidato (b) | 0 | 0 |
| Guisantes y habitas, como mucho 1 | 13 | 19 |
| No repetir legumbre: aplicada | 1250 | 1049 |
| No repetir legumbre: sin aplicar | 9 | 9 |
| Red de D-099.3: repite la semana sin la exclusión de la (b) | 0 | 11 |
| Red de D-099.3: la semana sigue con infracción | 0 | 0 |
| Infracción sin exclusión de la (b) que retirar | 0 | 200 |
| Hidrato en días seguidos: evitado | 0 | 12717 |
| Hidrato en días seguidos: sin aplicar | 0 | 12 |
| Guarnición en días seguidos: evitada | 0 | 739 |
| Guarnición en días seguidos: sin aplicar (suelo sin otra comida) | 0 | 0 |

## Por perfil

| Perfil | Medición | Cortas/sem (legumbre suelta + huevo + otras) | Proteína del día | Legumbres/sem (guarnición + plato) | Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | Comidas con guarnición que llevan pan | Pan medio en ellas (g) |
|---|---|---|---|---|---|---|---|
| omni-1434 | main | 3,31 (1,04 + 0,72 + 1,54) | 98,4 % | 1,04 (0,00 + 1,04) | 59 / 84 / 46 / 11 / 0 | — | — |
| omni-1434 | HEAD | 2,62 (0,00 + 1,11 + 1,50) | 100,1 % | 3,06 (0,00 + 3,06) | 0 / 0 / 2 / 184 / 14 | — | — |
| omni-1434 | (b) nueva 180 g | 3,06 (0,06 + 1,27 + 1,73) | 99,4 % | 1,96 (1,88 + 0,07) | 5 / 42 / 110 / 43 / 0 | 87 de 376 (23,1 %) | 59 |
| omni-1434 | ronda final | 2,95 (0,04 + 1,25 + 1,66) | 99,5 % | 1,92 (1,86 + 0,06) | 3 / 38 / 132 / 27 / 0 | 78 de 372 (21,0 %) | 58 |
| omni-2174 | main | 2,64 (1,06 + 1,05 + 0,52) | 100,5 % | 1,06 (0,00 + 1,06) | 54 / 85 / 55 / 6 / 0 | — | — |
| omni-2174 | HEAD | 1,85 (0,00 + 1,35 + 0,50) | 106,7 % | 3,06 (0,00 + 3,06) | 0 / 0 / 4 / 180 / 16 | — | — |
| omni-2174 | (b) nueva 180 g | 2,13 (0,04 + 1,53 + 0,56) | 101,4 % | 2,10 (2,02 + 0,07) | 3 / 28 / 115 / 54 / 0 | 400 de 405 (98,8 %) | 81 |
| omni-2174 | ronda final | 2,11 (0,05 + 1,57 + 0,49) | 101,7 % | 2,00 (1,92 + 0,08) | 3 / 28 / 136 / 33 / 0 | 375 de 383 (97,9 %) | 80 |
| omni-2600-3comidas | main | 2,00 (0,92 + 0,93 + 0,15) | 106,2 % | 1,01 (0,00 + 1,01) | 53 / 98 / 43 / 6 / 0 | — | — |
| omni-2600-3comidas | HEAD | 1,42 (0,00 + 1,20 + 0,22) | 116,1 % | 3,04 (0,00 + 3,04) | 0 / 0 / 3 / 185 / 12 | — | — |
| omni-2600-3comidas | (b) nueva 180 g | 1,58 (0,02 + 1,34 + 0,22) | 105,9 % | 2,06 (2,02 + 0,04) | 2 / 30 / 121 / 47 / 0 | 404 de 404 (100,0 %) | 106 |
| omni-2600-3comidas | ronda final | 1,67 (0,03 + 1,41 + 0,23) | 106,0 % | 1,90 (1,83 + 0,07) | 4 / 51 / 106 / 39 / 0 | 367 de 367 (100,0 %) | 105 |
| omni-3714 | main | 4,37 (1,05 + 1,07 + 2,24) | 100,1 % | 1,05 (0,00 + 1,05) | 50 / 95 / 49 / 6 / 0 | — | — |
| omni-3714 | HEAD | 3,02 (0,00 + 1,39 + 1,63) | 107,8 % | 3,04 (0,00 + 3,04) | 0 / 0 / 2 / 188 / 10 | — | — |
| omni-3714 | (b) nueva 180 g | 3,36 (0,04 + 1,57 + 1,75) | 101,9 % | 2,08 (2,02 + 0,07) | 4 / 31 / 109 / 56 / 0 | 404 de 404 (100,0 %) | 134 |
| omni-3714 | ronda final | 3,42 (0,06 + 1,53 + 1,82) | 102,1 % | 1,92 (1,83 + 0,09) | 6 / 35 / 128 / 31 / 0 | 367 de 367 (100,0 %) | 134 |
| celiaco-2400 | main | 2,23 (1,15 + 1,08 + 0,00) | 99,0 % | 1,15 (0,00 + 1,15) | 37 / 106 / 48 / 9 / 0 | — | — |
| celiaco-2400 | HEAD | 1,64 (0,00 + 1,64 + 0,00) | 110,8 % | 3,04 (0,00 + 3,04) | 0 / 0 / 2 / 187 / 11 | — | — |
| celiaco-2400 | (b) nueva 180 g | 1,86 (0,10 + 1,76 + 0,00) | 100,5 % | 2,23 (2,12 + 0,11) | 2 / 22 / 105 / 71 / 0 | 423 de 423 (100,0 %) | 83 |
| celiaco-2400 | ronda final | 1,91 (0,13 + 1,78 + 0,00) | 100,3 % | 2,05 (1,91 + 0,14) | 4 / 23 / 132 / 41 / 0 | 381 de 381 (100,0 %) | 84 |
| sin-lactosa-2000 | main | 2,19 (0,93 + 0,98 + 0,28) | 102,9 % | 1,04 (0,00 + 1,04) | 57 / 88 / 44 / 11 / 0 | — | — |
| sin-lactosa-2000 | HEAD | 1,58 (0,00 + 1,27 + 0,31) | 108,7 % | 3,04 (0,00 + 3,04) | 0 / 0 / 4 / 184 / 12 | — | — |
| sin-lactosa-2000 | (b) nueva 180 g | 1,77 (0,02 + 1,44 + 0,31) | 104,2 % | 2,22 (2,13 + 0,09) | 2 / 19 / 112 / 67 / 0 | 423 de 427 (99,1 %) | 82 |
| sin-lactosa-2000 | ronda final | 1,79 (0,05 + 1,41 + 0,34) | 104,1 % | 2,06 (1,95 + 0,12) | 1 / 26 / 133 / 40 / 0 | 385 de 389 (99,0 %) | 81 |
| sin-pescado-2000 | main | 3,81 (1,44 + 1,42 + 0,95) | 101,0 % | 1,66 (0,00 + 1,66) | 13 / 79 / 74 / 32 / 2 | — | — |
| sin-pescado-2000 | HEAD | 3,17 (0,53 + 1,59 + 1,05) | 104,7 % | 2,77 (0,00 + 2,77) | 1 / 17 / 37 / 117 / 28 | — | — |
| sin-pescado-2000 | (b) nueva 180 g | 3,06 (0,36 + 1,67 + 1,02) | 101,6 % | 2,44 (1,73 + 0,72) | 0 / 17 / 77 / 106 / 0 | 345 de 345 (100,0 %) | 81 |
| sin-pescado-2000 | ronda final | 3,17 (0,49 + 1,68 + 1,00) | 101,6 % | 2,35 (1,39 + 0,95) | 2 / 19 / 87 / 92 / 0 | 278 de 278 (100,0 %) | 82 |
| sibo-2000 | main | 2,15 (0,00 + 1,35 + 0,79) | 98,4 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sibo-2000 | HEAD | 2,29 (0,00 + 1,60 + 0,69) | 98,1 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sibo-2000 | (b) nueva 180 g | 2,29 (0,00 + 1,60 + 0,69) | 98,1 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sibo-2000 | ronda final | 2,31 (0,00 + 1,58 + 0,73) | 98,2 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| vegetariana-2000 | main | 4,33 (1,89 + 1,46 + 0,97) | 98,4 % | 2,22 (0,00 + 2,22) | 1 / 34 / 93 / 64 / 8 | — | — |
| vegetariana-2000 | HEAD | 4,50 (2,07 + 1,46 + 0,98) | 98,4 % | 2,42 (0,00 + 2,42) | 0 / 13 / 96 / 86 / 5 | — | — |
| vegetariana-2000 | (b) nueva 180 g | 4,42 (2,05 + 1,48 + 0,89) | 98,3 % | 2,41 (0,00 + 2,41) | 0 / 7 / 104 / 89 / 0 | — | — |
| vegetariana-2000 | ronda final | 4,42 (2,05 + 1,48 + 0,89) | 98,3 % | 2,41 (0,00 + 2,41) | 0 / 7 / 104 / 89 / 0 | — | — |
| vegana-1400 | main | 4,87 (3,01 + 0,00 + 1,85) | 90,5 % | 3,01 (0,00 + 3,01) | 0 / 0 / 34 / 130 / 36 | — | — |
| vegana-1400 | HEAD | 4,79 (3,04 + 0,00 + 1,75) | 90,9 % | 3,04 (0,00 + 3,04) | 0 / 2 / 28 / 131 / 39 | — | — |
| vegana-1400 | (b) nueva 180 g | 4,54 (2,75 + 0,00 + 1,79) | 91,6 % | 2,75 (0,00 + 2,75) | 0 / 2 / 46 / 152 / 0 | — | — |
| vegana-1400 | ronda final | 4,54 (2,75 + 0,00 + 1,79) | 91,6 % | 2,75 (0,00 + 2,75) | 0 / 2 / 46 / 152 / 0 | — | — |
| omni-2174-ancla | main | 2,65 (1,25 + 1,01 + 0,40) | 100,4 % | 1,38 (0,00 + 1,38) | 41 / 69 / 67 / 19 / 4 | — | — |
| omni-2174-ancla | HEAD | 1,98 (0,15 + 1,39 + 0,43) | 105,8 % | 3,00 (0,00 + 3,00) | 0 / 0 / 3 / 193 / 4 | — | — |
| omni-2174-ancla | (b) nueva 180 g | 2,48 (0,56 + 1,54 + 0,39) | 100,5 % | 2,08 (1,38 + 0,70) | 3 / 35 / 105 / 57 / 0 | 271 de 276 (98,2 %) | 81 |
| omni-2174-ancla | ronda final | 2,58 (0,55 + 1,54 + 0,49) | 100,5 % | 1,99 (1,27 + 0,71) | 5 / 37 / 113 / 45 / 0 | 255 de 255 (100,0 %) | 81 |
| omni-2000-sin-atun | main | 2,62 (0,92 + 1,14 + 0,56) | 102,8 % | 1,01 (0,00 + 1,01) | 49 / 105 / 40 / 6 / 0 | — | — |
| omni-2000-sin-atun | HEAD | 2,10 (0,00 + 1,43 + 0,67) | 108,0 % | 3,06 (0,00 + 3,06) | 0 / 0 / 2 / 183 / 15 | — | — |
| omni-2000-sin-atun | (b) nueva 180 g | 2,09 (0,01 + 1,48 + 0,60) | 103,9 % | 2,08 (2,03 + 0,04) | 4 / 28 / 117 / 51 / 0 | 399 de 406 (98,3 %) | 80 |
| omni-2000-sin-atun | ronda final | 2,25 (0,03 + 1,50 + 0,72) | 103,6 % | 1,84 (1,78 + 0,06) | 6 / 54 / 106 / 34 / 0 | 353 de 357 (98,9 %) | 80 |
| solo-pollo-2000 | main | 2,50 (1,21 + 1,24 + 0,06) | 102,6 % | 1,43 (0,00 + 1,43) | 30 / 78 / 70 / 21 / 1 | — | — |
| solo-pollo-2000 | HEAD | 3,46 (1,68 + 1,68 + 0,10) | 102,2 % | 3,25 (0,00 + 3,25) | 0 / 0 / 16 / 119 / 65 | — | — |
| solo-pollo-2000 | (b) nueva 180 g | 2,85 (1,09 + 1,63 + 0,13) | 100,5 % | 2,46 (0,64 + 1,82) | 0 / 4 / 100 / 96 / 0 | 123 de 127 (96,9 %) | 85 |
| solo-pollo-2000 | ronda final | 2,78 (1,05 + 1,65 + 0,09) | 100,6 % | 2,42 (0,58 + 1,84) | 0 / 7 / 101 / 92 / 0 | 115 de 116 (99,1 %) | 87 |
| sin-carne-ave-2000 | main | 2,94 (1,56 + 1,33 + 0,04) | 101,1 % | 1,78 (0,00 + 1,78) | 12 / 63 / 83 / 40 / 2 | — | — |
| sin-carne-ave-2000 | HEAD | 4,21 (2,67 + 1,49 + 0,06) | 98,2 % | 3,35 (0,00 + 3,35) | 0 / 0 / 6 / 119 / 75 | — | — |
| sin-carne-ave-2000 | (b) nueva 180 g | 3,31 (1,40 + 1,81 + 0,10) | 98,6 % | 2,44 (0,35 + 2,08) | 0 / 7 / 99 / 94 / 0 | 68 de 71 (95,8 %) | 81 |
| sin-carne-ave-2000 | ronda final | 3,44 (1,50 + 1,83 + 0,12) | 98,4 % | 2,44 (0,31 + 2,13) | 0 / 12 / 88 / 100 / 0 | 60 de 62 (96,8 %) | 80 |
| sin-garbanzos-guisantes-2000 | main | 1,80 (0,34 + 0,98 + 0,48) | 104,1 % | 0,55 (0,00 + 0,55) | 106 / 78 / 16 / 0 / 0 | — | — |
| sin-garbanzos-guisantes-2000 | HEAD | 1,94 (0,02 + 1,27 + 0,65) | 108,2 % | 2,30 (0,00 + 2,30) | 0 / 20 / 100 / 80 / 0 | — | — |
| sin-garbanzos-guisantes-2000 | (b) nueva 180 g | 2,07 (0,06 + 1,32 + 0,69) | 103,8 % | 2,21 (2,10 + 0,10) | 2 / 24 / 105 / 69 / 0 | 418 de 421 (99,3 %) | 86 |
| sin-garbanzos-guisantes-2000 | ronda final | 2,10 (0,04 + 1,39 + 0,67) | 103,8 % | 1,98 (1,88 + 0,10) | 6 / 41 / 104 / 49 / 0 | 373 de 375 (99,5 %) | 85 |
| sin-legumbres-2000 | main | 1,66 (0,00 + 1,10 + 0,56) | 104,6 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sin-legumbres-2000 | HEAD | 2,17 (0,00 + 1,30 + 0,88) | 103,1 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sin-legumbres-2000 | (b) nueva 180 g | 2,17 (0,00 + 1,30 + 0,88) | 103,1 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |
| sin-legumbres-2000 | ronda final | 2,16 (0,00 + 1,30 + 0,86) | 103,3 % | 0,00 (0,00 + 0,00) | 200 / 0 / 0 / 0 / 0 | — | — |

# Comidas y cenas fuera de ±5 % de kcal

### Total (9 omnívoros, 200 semanas)

| Medición | Comidas y cenas | Fuera | Por encima | Por debajo |
|---|---|---|---|---|
| main | 23400 | 2495 (10,7 %) | 708 | 1787 |
| HEAD | 23400 | 1988 (8,5 %) | 558 | 1430 |
| ronda final | 23400 | 2839 (12,1 %) | 585 | 2254 |

### Por categoría

| Categoría | Medición | Comidas | Fuera | Por encima (desv. media) | Por debajo (desv. media) | Plantillas por debajo (las 3 primeras) |
|---|---|---|---|---|---|---|
| Cena · plantilla · con pan | main | 5169 | 969 (18,7 %) | 85 (+6,4 %) | 884 (-9,4 %) | caliente_clasico 684, ensalada 157, sopa_crema 43 |
| Cena · plantilla · con pan | HEAD | 5454 | 1074 (19,7 %) | 114 (+6,9 %) | 960 (-9,5 %) | caliente_clasico 643, ensalada 222, sopa_crema 95 |
| Cena · plantilla · con pan | ronda final | 5870 | 1028 (17,5 %) | 127 (+7,3 %) | 901 (-9,9 %) | caliente_clasico 634, ensalada 192, sopa_crema 75 |
| Cena · plantilla · sin pan | main | 1975 | 99 (5,0 %) | 71 (+11,0 %) | 28 (-7,3 %) | caliente_clasico 27, sopa_crema 1 |
| Cena · plantilla · sin pan | HEAD | 2189 | 97 (4,4 %) | 68 (+10,1 %) | 29 (-6,9 %) | caliente_clasico 27, sopa_crema 2 |
| Cena · plantilla · sin pan | ronda final | 2234 | 115 (5,1 %) | 56 (+9,4 %) | 59 (-7,8 %) | caliente_clasico 54, sopa_crema 5 |
| Cena · redactado · con pan | main | 3645 | 465 (12,8 %) | 363 (+15,8 %) | 102 (-7,2 %) | redactado 102 |
| Cena · redactado · con pan | HEAD | 2912 | 246 (8,4 %) | 216 (+14,8 %) | 30 (-8,3 %) | redactado 30 |
| Cena · redactado · con pan | ronda final | 2708 | 290 (10,7 %) | 210 (+15,7 %) | 80 (-8,4 %) | redactado 80 |
| Cena · redactado · sin pan | main | 1811 | 140 (7,7 %) | 117 (+22,8 %) | 23 (-7,4 %) | redactado 23 |
| Cena · redactado · sin pan | HEAD | 2045 | 109 (5,3 %) | 90 (+16,7 %) | 19 (-7,7 %) | redactado 19 |
| Cena · redactado · sin pan | ronda final | 1788 | 121 (6,8 %) | 99 (+16,2 %) | 22 (-8,5 %) | redactado 22 |
| Comida · comida doble · con pan | HEAD | 1057 | 1 (0,1 %) | 0 | 1 (-5,5 %) | legumbre 1 |
| Comida · comida doble · sin pan | HEAD | 4187 | 41 (1,0 %) | 41 (+9,1 %) | 0 | — |
| Comida · plantilla con guarnición · con pan | ronda final | 2839 | 435 (15,3 %) | 8 (+6,6 %) | 427 (-13,8 %) | caliente_clasico 412, ensalada 15 |
| Comida · plantilla con guarnición · sin pan | ronda final | 310 | 8 (2,6 %) | 1 (+5,3 %) | 7 (-6,1 %) | caliente_clasico 7 |
| Comida · plantilla · con pan | main | 5318 | 750 (14,1 %) | 52 (+5,5 %) | 698 (-16,0 %) | sopa_crema 294, ensalada 218, legumbre 106 |
| Comida · plantilla · con pan | HEAD | 2322 | 395 (17,0 %) | 25 (+5,4 %) | 370 (-17,4 %) | sopa_crema 175, ensalada 138, caliente_clasico 52 |
| Comida · plantilla · con pan | ronda final | 3477 | 781 (22,5 %) | 72 (+5,5 %) | 709 (-18,5 %) | sopa_crema 397, ensalada 244, caliente_clasico 56 |
| Comida · plantilla · sin pan | main | 5375 | 72 (1,3 %) | 20 (+11,9 %) | 52 (-7,7 %) | caliente_clasico 34, bowl 11, pasta 6 |
| Comida · plantilla · sin pan | HEAD | 3111 | 25 (0,8 %) | 4 (+6,3 %) | 21 (-8,5 %) | caliente_clasico 16, bowl 4, pasta 1 |
| Comida · plantilla · sin pan | ronda final | 3739 | 55 (1,5 %) | 6 (+5,6 %) | 49 (-8,9 %) | caliente_clasico 24, bowl 19, pasta 6 |
| Comida · redactado · con pan | main | 30 | 0 (0,0 %) | 0 | 0 | — |
| Comida · redactado · con pan | HEAD | 37 | 0 (0,0 %) | 0 | 0 | — |
| Comida · redactado · con pan | ronda final | 107 | 1 (0,9 %) | 1 (+46,7 %) | 0 | — |
| Comida · redactado · sin pan | main | 77 | 0 (0,0 %) | 0 | 0 | — |
| Comida · redactado · sin pan | HEAD | 86 | 0 (0,0 %) | 0 | 0 | — |
| Comida · redactado · sin pan | ronda final | 328 | 5 (1,5 %) | 5 (+21,5 %) | 0 | — |

### Por perfil (% fuera; por encima / por debajo)

| Perfil | kcal | main | HEAD | ronda final |
|---|---|---|---|---|
| omni-1434 | 1434 | 22,7 % (496 / 95) | 19,0 % (418 / 77) | 19,5 % (393 / 115) |
| omni-2174 | 2174 | 6,4 % (48 / 119) | 4,5 % (20 / 98) | 4,9 % (28 / 100) |
| omni-2600-3comidas | 2600 | 19,3 % (18 / 484) | 16,3 % (23 / 401) | 29,8 % (32 / 744) |
| omni-3714 | 3714 | 27,3 % (0 / 709) | 22,2 % (0 / 577) | 34,2 % (0 / 888) |
| celiaco-2400 | 2400 | 8,5 % (5 / 217) | 6,5 % (0 / 168) | 10,1 % (6 / 257) |
| sin-lactosa-2000 | 2000 | 2,5 % (43 / 21) | 1,0 % (19 / 6) | 2,8 % (42 / 32) |
| sin-pescado-2000 | 2000 | 1,7 % (27 / 17) | 1,3 % (25 / 9) | 1,5 % (26 / 13) |
| omni-2174-ancla | 2174 | 5,1 % (34 / 98) | 4,1 % (24 / 82) | 4,0 % (18 / 85) |
| omni-2000-sin-atun | 2000 | 2,5 % (37 / 27) | 1,6 % (29 / 12) | 2,3 % (40 / 20) |
