# Comidas dobles fuera de ±5 % de las kcal de su comida

Salida de `fueraComidaDoble.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`), con el motor de hoy. Desviación = (kcal de la comida − objetivo de la comida) / objetivo. Los ingredientes en su mínimo o su máximo salen de la réplica de las raciones del banco (`metricas.mjs`, `racionesCalculadas`); «réplica igual» dice si da las mismas kcal que la app.

## Lectura (2026-11-17)

La desviación máxima es del 32,3 %, por encima del 10 %. Son dos casos distintos, y ninguno es un error de la comida doble en sí:

1. **Por encima (33, todas en omni-1434, casi todas en domingo).** En los 33 días el reparto del resto bajó el objetivo de la comida (de 538 a 394–496 kcal) porque otras comidas del día no bajaban de sus mínimos: el desayuno «Crepes de avena con queso fresco batido y fruta» (405 de 323 kcal, con la avena, el huevo, la leche y el skyr en su mínimo) y el tentempié (229 de 179). La comida doble ya estaba en su suelo: legumbre a 50 g en seco y los dos aceites a 5 ml en 28 de las 33. Frente a su objetivo antes del reparto (538 kcal), ninguna pasa del +2,8 % (553 kcal como mucho). El que se pasa es el día: de 1441 a 1635 kcal para 1434. Es el pendiente de la masa como unidad (las crepes), no de la comida doble.
2. **Por debajo (14, en 5 perfiles de 2000 a 2400 kcal).** Las 14 tienen la legumbre en su tope, los dos aceites en su máximo y el proteico del segundo en su **mínimo**. Ese proteico no crece porque `ajustarComida` (`raciones.js`, paso de D-116.6) solo hace crecer un proteico que no esté en ningún límite, y este está en el suyo de abajo. Es un fallo de la implementación del 2026-11-17 (estaba igual en la variante medida, `variantesComidaDoble.mjs`).

**Con el proteico creciendo también desde su mínimo** (`variantesComidaDoble.mjs --crecer=desdeMinimo`, en memoria), las 14 de por debajo desaparecen y, fuera de omni-1434, ninguna comida doble se aparta más de un 5 %:

| Perfil | Comidas dobles | Fuera de ±5 % | Por encima | Por debajo | Desviación media de las de fuera | Máxima | Desviación máxima de todas las comidas dobles |
|---|---|---|---|---|---|---|---|
| omni-1434 | 609 | 33 | 33 | 0 | 10,6 % | 32,3 % | 32,3 % |
| omni-2174 | 610 | 0 | 0 | 0 | — | — | 1,3 % |
| omni-2600-3comidas | 606 | 0 | 0 | 0 | — | — | 4,8 % |
| omni-3714 | 608 | 0 | 0 | 0 | — | — | 5,0 % |
| celiaco-2400 | 607 | 0 | 0 | 0 | — | — | 1,1 % |
| sin-lactosa-2000 | 603 | 0 | 0 | 0 | — | — | 1,5 % |
| sin-pescado-2000 | 425 | 0 | 0 | 0 | — | — | 1,5 % |
| omni-2174-ancla | 556 | 0 | 0 | 0 | — | — | 2,2 % |
| omni-2000-sin-atun | 616 | 0 | 0 | 0 | — | — | 1,5 % |

**Propuesta de límite para `racionesDoble.test.js`**, con el arreglo de arriba: (a) ninguna comida doble por debajo del 95 % de su objetivo; (b) ninguna por encima del 105 % de su objetivo, salvo en un día en que el reparto del resto le bajó el objetivo, y entonces nunca por encima del 105 % de su objetivo sin el reparto (538 kcal a 1434; el caso conocido llega a 553, +2,8 %). Sin el arreglo, la (a) no se cumple (hasta −11,7 %).

## Por perfil

| Perfil | Comidas dobles | Fuera de ±5 % | Por encima | Por debajo | Desviación media de las de fuera | Máxima | Desviación máxima de todas las comidas dobles |
|---|---|---|---|---|---|---|---|
| omni-1434 | 609 | 33 | 33 | 0 | 10,6 % | 32,3 % | 32,3 % |
| omni-2174 | 610 | 2 | 0 | 2 | 11,7 % | 11,7 % | 11,7 % |
| omni-2600-3comidas | 606 | 0 | 0 | 0 | — | — | 4,8 % |
| omni-3714 | 608 | 0 | 0 | 0 | — | — | 5,0 % |
| celiaco-2400 | 607 | 0 | 0 | 0 | — | — | 2,0 % |
| sin-lactosa-2000 | 603 | 7 | 0 | 7 | 7,8 % | 10,4 % | 10,4 % |
| sin-pescado-2000 | 425 | 2 | 0 | 2 | 7,6 % | 7,8 % | 7,8 % |
| omni-2174-ancla | 556 | 1 | 0 | 1 | 8,8 % | 8,8 % | 8,8 % |
| omni-2000-sin-atun | 616 | 2 | 0 | 2 | 7,1 % | 9,2 % | 9,2 % |

## Qué llevan

Primeros: Garbanzos estofados con alcachofas 10 · Garbanzos al curry con brócoli 9 · Garbanzos con pimentón con zanahoria 8 · Garbanzos con pimentón con espinacas 5 · Lentejas con pimentón con pimientos 4 · Lentejas al ajillo con calabacín 4 · Alubias blancas al ajillo con acelgas 3 · Lentejas con pimentón con espinacas 3 · Lentejas con pimentón con zanahoria 1.

Segundos: Lomo de cerdo al horno con mostaza y miel con col de bruselas 9 · Lomo de cerdo a la plancha con mostaza y miel con brócoli 8 · Pechuga de pavo al horno con tomate casero con berenjena 5 · Pechuga de pollo salteada con hierbas provenzales con champiñones 5 · Lomo de cerdo a la plancha con acelgas 4 · Ternera magra a la plancha con berenjena 4 · Ternera magra a la plancha con pimientos 4 · Lomo de cerdo al horno con pimientos 2 · Pechuga de pollo al horno con col de bruselas 2 · Conejo al ajillo con alcachofas 1 · Pechuga de pavo a la plancha con mostaza y miel con calabacín 1 · Pechuga de pavo a la plancha con brócoli 1 · Pechuga de pavo salteada con curry y cúrcuma con calabacín 1.

## Qué no deja ajustar

Ingredientes en su mínimo o su máximo (en cuántas de las 47): aove en su minimo 58 · aove en su maximo 36 · garbanzos_seco en su minimo 32 · lentejas_seco en su maximo 11 · pavo_pechuga en su minimo 8 · pollo_pechuga en su minimo 7 · alubias_seco en su maximo 3 · ternera_magra en su minimo 2 · lentejas_seco en su minimo 1.

Con pan o fruta añadidos: 0 de 47. Réplica igual que la app: 47 de 47.

Por encima de su objetivo: 33; de ellas, 33 en días en que el reparto del resto bajó el objetivo de la comida (otras comidas del día no bajaban de sus mínimos), y 28 con la legumbre y los dos aceites en su mínimo.

Por debajo de su objetivo: 14; de ellas, 14 con el proteico del segundo en su mínimo, que hoy no puede crecer (`ajustarComida` solo hace crecer un proteico que no esté en ningún límite).

## Todas

| Perfil | Semana | Día | Primero | Segundo | kcal / objetivo de la comida | Desviación | En su mínimo o máximo | Añadido | Reparto del resto del día (kcal) | Día: kcal / objetivo |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 60 | Domingo | Garbanzos estofados con alcachofas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 539 / 491 | 9,8 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -97 | 1463 / 1434 |
| omni-1434 | 79 | Domingo | Garbanzos al curry con brócoli | Lomo de cerdo a la plancha con acelgas | 521 / 491 | 6,1 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -96 | 1462 / 1434 |
| omni-1434 | 81 | Domingo | Garbanzos al curry con brócoli | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 509 / 476 | 6,9 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -127 | 1440 / 1434 |
| omni-1434 | 84 | Domingo | Garbanzos estofados con alcachofas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 508 / 433 | 17,3 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -140 | 1479 / 1434 |
| omni-1434 | 85 | Miércoles | Garbanzos con pimentón con zanahoria | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 538 / 507 | 6,1 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -71 | 1430 / 1434 |
| omni-1434 | 88 | Martes | Garbanzos con pimentón con espinacas | Conejo al ajillo con alcachofas | 466 / 406 | 14,8 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -176 | 1463 / 1434 |
| omni-1434 | 88 | Domingo | Garbanzos estofados con alcachofas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 501 / 458 | 9,4 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -139 | 1461 / 1434 |
| omni-1434 | 103 | Domingo | Garbanzos estofados con alcachofas | Ternera magra a la plancha con berenjena | 508 / 482 | 5,4 % | garbanzos_seco en su minimo, aove en su minimo, aove en su maximo | — | -116 | 1431 / 1434 |
| omni-1434 | 105 | Jueves | Garbanzos estofados con alcachofas | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 539 / 508 | 6,1 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -57 | 1466 / 1434 |
| omni-1434 | 106 | Domingo | Garbanzos con pimentón con espinacas | Pechuga de pavo al horno con tomate casero con berenjena | 505 / 473 | 6,8 % | garbanzos_seco en su minimo, aove en su minimo, pavo_pechuga en su minimo, aove en su maximo | — | -133 | 1498 / 1434 |
| omni-1434 | 111 | Domingo | Garbanzos al curry con brócoli | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 517 / 486 | 6,4 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -106 | 1423 / 1434 |
| omni-1434 | 112 | Domingo | Garbanzos con pimentón con espinacas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 535 / 490 | 9,2 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -99 | 1448 / 1434 |
| omni-1434 | 118 | Domingo | Garbanzos estofados con alcachofas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 524 / 396 | 32,3 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -245 | 1635 / 1434 |
| omni-1434 | 126 | Domingo | Garbanzos al curry con brócoli | Ternera magra a la plancha con pimientos | 515 / 490 | 5,1 % | garbanzos_seco en su minimo, aove en su minimo, aove en su maximo | — | -98 | 1432 / 1434 |
| omni-1434 | 128 | Domingo | Garbanzos estofados con alcachofas | Pechuga de pavo al horno con tomate casero con berenjena | 509 / 476 | 6,9 % | garbanzos_seco en su minimo, aove en su minimo, pavo_pechuga en su minimo, aove en su maximo | — | -127 | 1440 / 1434 |
| omni-1434 | 132 | Jueves | Garbanzos estofados con alcachofas | Lomo de cerdo al horno con pimientos | 544 / 479 | 13,6 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -113 | 1533 / 1434 |
| omni-1434 | 138 | Domingo | Garbanzos estofados con alcachofas | Ternera magra a la plancha con pimientos | 487 / 461 | 5,6 % | garbanzos_seco en su minimo, aove en su minimo, aove en su maximo | — | -102 | 1456 / 1434 |
| omni-1434 | 139 | Domingo | Garbanzos al curry con brócoli | Ternera magra a la plancha con berenjena | 509 / 481 | 5,8 % | garbanzos_seco en su minimo, aove en su minimo, aove en su maximo | — | -118 | 1479 / 1434 |
| omni-1434 | 141 | Martes | Lentejas con pimentón con pimientos | Lomo de cerdo a la plancha con acelgas | 466 / 429 | 8,6 % | lentejas_seco en su minimo, aove en su minimo, aove en su minimo | — | -189 | 1535 / 1434 |
| omni-1434 | 147 | Domingo | Garbanzos al curry con brócoli | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 509 / 442 | 15,2 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -166 | 1556 / 1434 |
| omni-1434 | 158 | Lunes | Garbanzos con pimentón con zanahoria | Lomo de cerdo al horno con pimientos | 543 / 496 | 9,5 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -98 | 1388 / 1434 |
| omni-1434 | 160 | Domingo | Garbanzos con pimentón con zanahoria | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 538 / 451 | 19,3 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -150 | 1504 / 1434 |
| omni-1434 | 161 | Domingo | Garbanzos con pimentón con espinacas | Ternera magra a la plancha con pimientos | 461 / 422 | 9,2 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -155 | 1495 / 1434 |
| omni-1434 | 197 | Domingo | Garbanzos con pimentón con espinacas | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 527 / 498 | 5,8 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -82 | 1441 / 1434 |
| omni-1434 | 201 | Domingo | Garbanzos al curry con brócoli | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 540 / 484 | 11,6 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -111 | 1492 / 1434 |
| omni-1434 | 212 | Domingo | Garbanzos con pimentón con zanahoria | Ternera magra a la plancha con pimientos | 524 / 495 | 5,9 % | garbanzos_seco en su minimo, aove en su minimo, aove en su maximo | — | -89 | 1494 / 1434 |
| omni-1434 | 218 | Domingo | Garbanzos estofados con alcachofas | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 539 / 496 | 8,7 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -87 | 1467 / 1434 |
| omni-1434 | 224 | Domingo | Garbanzos con pimentón con zanahoria | Lomo de cerdo a la plancha con acelgas | 519 / 394 | 31,7 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -144 | 1534 / 1434 |
| omni-1434 | 227 | Domingo | Garbanzos al curry con brócoli | Pechuga de pavo al horno con tomate casero con berenjena | 510 / 481 | 6,0 % | garbanzos_seco en su minimo, aove en su minimo, pavo_pechuga en su minimo, aove en su maximo | — | -76 | 1441 / 1434 |
| omni-1434 | 236 | Domingo | Garbanzos con pimentón con zanahoria | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 553 / 486 | 13,8 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -107 | 1475 / 1434 |
| omni-1434 | 243 | Domingo | Garbanzos con pimentón con zanahoria | Lomo de cerdo a la plancha con mostaza y miel con brócoli | 553 / 511 | 8,2 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -56 | 1466 / 1434 |
| omni-1434 | 244 | Jueves | Garbanzos al curry con brócoli | Lomo de cerdo al horno con mostaza y miel con col de bruselas | 540 / 476 | 13,4 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -165 | 1526 / 1434 |
| omni-1434 | 258 | Domingo | Garbanzos con pimentón con zanahoria | Lomo de cerdo a la plancha con acelgas | 534 / 490 | 9,0 % | garbanzos_seco en su minimo, aove en su minimo, aove en su minimo | — | -99 | 1504 / 1434 |
| omni-2174 | 159 | Viernes | Lentejas al ajillo con calabacín | Pechuga de pavo a la plancha con mostaza y miel con calabacín | 742 / 840 | -11,7 % | lentejas_seco en su maximo, aove en su maximo, pavo_pechuga en su minimo, aove en su maximo | — | 66 | 2057 / 2174 |
| omni-2174 | 192 | Viernes | Alubias blancas al ajillo con acelgas | Pechuga de pavo al horno con tomate casero con berenjena | 749 / 848 | -11,7 % | alubias_seco en su maximo, aove en su maximo, pavo_pechuga en su minimo, aove en su maximo | — | 86 | 2120 / 2174 |
| sin-lactosa-2000 | 79 | Jueves | Lentejas con pimentón con espinacas | Pechuga de pollo salteada con hierbas provenzales con champiñones | 720 / 776 | -7,2 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 70 | 1985 / 2000 |
| sin-lactosa-2000 | 97 | Martes | Alubias blancas al ajillo con acelgas | Ternera magra a la plancha con berenjena | 695 / 776 | -10,4 % | alubias_seco en su maximo, aove en su maximo, ternera_magra en su minimo, aove en su maximo | — | 69 | 1941 / 2000 |
| sin-lactosa-2000 | 99 | Lunes | Lentejas al ajillo con calabacín | Pechuga de pollo salteada con hierbas provenzales con champiñones | 720 / 773 | -6,9 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 61 | 2021 / 2000 |
| sin-lactosa-2000 | 156 | Jueves | Alubias blancas al ajillo con acelgas | Ternera magra a la plancha con berenjena | 695 / 774 | -10,2 % | alubias_seco en su maximo, aove en su maximo, ternera_magra en su minimo, aove en su maximo | — | 63 | 2048 / 2000 |
| sin-lactosa-2000 | 170 | Viernes | Lentejas con pimentón con espinacas | Pechuga de pavo a la plancha con brócoli | 723 / 776 | -6,8 % | lentejas_seco en su maximo, aove en su maximo, pavo_pechuga en su minimo, aove en su maximo | — | 69 | 1934 / 2000 |
| sin-lactosa-2000 | 171 | Lunes | Lentejas al ajillo con calabacín | Pechuga de pollo al horno con col de bruselas | 734 / 775 | -5,3 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 66 | 2039 / 2000 |
| sin-lactosa-2000 | 243 | Miércoles | Lentejas con pimentón con pimientos | Pechuga de pollo salteada con hierbas provenzales con champiñones | 711 / 773 | -8,0 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 62 | 1987 / 2000 |
| sin-pescado-2000 | 206 | Viernes | Lentejas con pimentón con espinacas | Pechuga de pavo salteada con curry y cúrcuma con calabacín | 718 / 779 | -7,8 % | lentejas_seco en su maximo, aove en su maximo, pavo_pechuga en su minimo, aove en su maximo | — | 78 | 2001 / 2000 |
| sin-pescado-2000 | 239 | Miércoles | Lentejas al ajillo con calabacín | Pechuga de pollo salteada con hierbas provenzales con champiñones | 720 / 777 | -7,3 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 73 | 1981 / 2000 |
| omni-2174-ancla | 219 | Jueves | Lentejas con pimentón con pimientos | Pechuga de pavo al horno con tomate casero con berenjena | 773 / 848 | -8,8 % | lentejas_seco en su maximo, aove en su maximo, pavo_pechuga en su minimo, aove en su maximo | — | 86 | 2181 / 2174 |
| omni-2000-sin-atun | 123 | Miércoles | Lentejas con pimentón con zanahoria | Pechuga de pollo al horno con col de bruselas | 737 / 776 | -5,0 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 70 | 2003 / 2000 |
| omni-2000-sin-atun | 160 | Viernes | Lentejas con pimentón con pimientos | Pechuga de pollo salteada con hierbas provenzales con champiñones | 711 / 783 | -9,2 % | lentejas_seco en su maximo, aove en su maximo, pollo_pechuga en su minimo, aove en su maximo | — | 88 | 1999 / 2000 |
