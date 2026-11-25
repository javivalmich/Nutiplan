# Control del motor real frente al prototipo (pasos 4, 5 y 7; 2026-11-25)

Medición, no cambia reglas. 200 semanas (60 a 259) en los 18 perfiles del prototipo, con `controlGuarnicion.mjs` y `resumenControlGuarnicion.mjs`:

- **main:** `main` `9522e92`.
- **prototipo7:** `variantesGuarnicion2.mjs` sobre `7a7f518` con `--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099 --hidratoSeguidos --racionGuarnicion3 --topeEscalado`, tal como se midió.
- **prototipo7, RNG de engine2:** el mismo, con `rngDe` cambiado por `mulberry32(seedFromString(…))`, el RNG de engine2. Es el único cambio (una copia fuera del repo).
- **motor real:** HEAD `e80d3dd`.

## Lectura

- **Mismos menús.** El motor real y el prototipo con el RNG de engine2 dan el mismo menú (plato de la comida y la cena y legumbre de la guarnición) en las 3600 semanas.
- **Frente a prototipo7 tal cual, casi ningún menú coincide en los omnívoros.** El prototipo sembraba su RNG con otro hash (FNV-1a); el motor usa el de engine2, como el resto del walk. Las cifras de la semana quedan muy cerca (tabla).
- **Cifras de las comidas.** Con el mismo menú, solo cambian comidas con alubias blancas o habitas: `composicion.js` redondea sus kcal (93 y 57; el prototipo usaba 93,1 y 57,2; D-100.6). Casi siempre es 1 kcal.
  - En 6 comidas el redondeo cruza el 5 % que hace añadir pan (D-100.2). Ejemplo: omni-2174, semana 122, viernes, salmón con alubias blancas. En el prototipo la comida llega a 775 kcal, justo por encima de 774,25 (el 95 % de 815), y no lleva pan. Con 0,22 kcal menos queda por debajo: lleva 30 g de pan y el salmón baja de 195 a 175 g (813 kcal).
- **Red de D-099.3:** 7 veces en el motor real y 11 en prototipo7, todas en sin-pescado-2000. La diferencia es del RNG: son otros menús. En los dos casos las semanas quedan sin infracción.
- **D-099.3 en vegana-1400:** 420 en `main` y 508 en el prototipo y en el motor. Viene del tope de 3 legumbres, que se aplica a todas las dietas, como en el prototipo. Pendiente en D-119.

## Agregado

| Agregado | Medición | Cortas/sem | Proteína del día | Legumbres/sem (guarnición) | Pescado/sem | Fuera de ±5 % de kcal | D-099.3 | Red de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| 9 omnívoros del banco | main | 2,87 | 101,2 % | 1,16 (0,00) | 4,28 | 10,7 % | 6 | 0 |
| 9 omnívoros del banco | prototipo7 | 2,42 | 103,3 % | 2,00 (1,75) | 2,67 | 11,9 % | 0 | 11 |
| 9 omnívoros del banco | prototipo7, RNG de engine2 | 2,40 | 103,3 % | 2,02 (1,78) | 2,67 | 12,1 % | 0 | 7 |
| 9 omnívoros del banco | motor real | 2,40 | 103,3 % | 2,02 (1,78) | 2,67 | 12,1 % | 0 | 7 |
| 18 perfiles | main | 2,78 | 101,1 % | 1,20 (0,00) | 4,44 | 10,7 % | 426 | 0 |
| 18 perfiles | prototipo7 | 2,58 | 102,2 % | 1,89 (1,24) | 2,98 | 10,8 % | 508 | 11 |
| 18 perfiles | prototipo7, RNG de engine2 | 2,56 | 102,3 % | 1,89 (1,25) | 2,99 | 10,9 % | 508 | 7 |
| 18 perfiles | motor real | 2,56 | 102,3 % | 1,89 (1,25) | 2,99 | 10,9 % | 508 | 7 |

## Por perfil

| Perfil | Medición | Cortas/sem | Proteína del día | Legumbres/sem (guarnición) | Pescado/sem | Fuera de ±5 % de kcal | D-099.3 | Red de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| omni-1434 | main | 3,31 | 98,4 % | 1,04 (0,00) | 4,87 | 22,7 % | 0 | 0 |
| omni-1434 | prototipo7 | 2,85 | 99,7 % | 1,92 (1,86) | 3,00 | 18,9 % | 0 | 0 |
| omni-1434 | prototipo7, RNG de engine2 | 3,02 | 99,7 % | 1,93 (1,83) | 3,00 | 18,8 % | 0 | 0 |
| omni-1434 | motor real | 3,02 | 99,7 % | 1,93 (1,83) | 3,00 | 18,8 % | 0 | 0 |
| omni-2174 | main | 2,64 | 100,5 % | 1,06 (0,00) | 4,81 | 6,4 % | 0 | 0 |
| omni-2174 | prototipo7 | 2,12 | 103,0 % | 2,00 (1,92) | 3,00 | 4,7 % | 0 | 0 |
| omni-2174 | prototipo7, RNG de engine2 | 2,14 | 102,8 % | 1,95 (1,85) | 3,00 | 5,1 % | 0 | 0 |
| omni-2174 | motor real | 2,14 | 102,8 % | 1,95 (1,85) | 3,00 | 5,1 % | 0 | 0 |
| omni-2600-3comidas | main | 2,00 | 106,2 % | 1,01 (0,00) | 4,73 | 19,3 % | 0 | 0 |
| omni-2600-3comidas | prototipo7 | 1,66 | 108,5 % | 1,90 (1,83) | 3,00 | 26,3 % | 0 | 0 |
| omni-2600-3comidas | prototipo7, RNG de engine2 | 1,66 | 108,6 % | 1,88 (1,82) | 3,00 | 26,0 % | 0 | 0 |
| omni-2600-3comidas | motor real | 1,66 | 108,6 % | 1,88 (1,82) | 3,00 | 26,0 % | 0 | 0 |
| omni-3714 | main | 4,37 | 100,1 % | 1,05 (0,00) | 4,83 | 27,3 % | 0 | 0 |
| omni-3714 | prototipo7 | 3,44 | 102,5 % | 1,92 (1,83) | 3,00 | 36,3 % | 0 | 0 |
| omni-3714 | prototipo7, RNG de engine2 | 3,34 | 102,4 % | 1,93 (1,84) | 3,00 | 37,8 % | 0 | 0 |
| omni-3714 | motor real | 3,34 | 102,4 % | 1,93 (1,84) | 3,00 | 37,8 % | 0 | 0 |
| celiaco-2400 | main | 2,23 | 99,0 % | 1,15 (0,00) | 5,05 | 8,5 % | 0 | 0 |
| celiaco-2400 | prototipo7 | 1,92 | 101,1 % | 2,05 (1,91) | 3,04 | 10,1 % | 0 | 0 |
| celiaco-2400 | prototipo7, RNG de engine2 | 1,89 | 101,2 % | 2,10 (1,99) | 3,06 | 10,9 % | 0 | 0 |
| celiaco-2400 | motor real | 1,89 | 101,2 % | 2,10 (1,99) | 3,06 | 10,9 % | 0 | 0 |
| sin-lactosa-2000 | main | 2,19 | 102,9 % | 1,04 (0,00) | 5,01 | 2,5 % | 0 | 0 |
| sin-lactosa-2000 | prototipo7 | 1,79 | 105,5 % | 2,06 (1,95) | 3,00 | 2,7 % | 0 | 0 |
| sin-lactosa-2000 | prototipo7, RNG de engine2 | 1,83 | 105,5 % | 2,06 (1,98) | 3,00 | 2,7 % | 0 | 0 |
| sin-lactosa-2000 | motor real | 1,83 | 105,5 % | 2,06 (1,98) | 3,00 | 2,7 % | 0 | 0 |
| sin-pescado-2000 | main | 3,81 | 101,0 % | 1,66 (0,00) | 0,00 | 1,7 % | 6 | 0 |
| sin-pescado-2000 | prototipo7 | 3,17 | 102,6 % | 2,35 (1,39) | 0,00 | 1,7 % | 0 | 11 |
| sin-pescado-2000 | prototipo7, RNG de engine2 | 3,12 | 102,5 % | 2,33 (1,44) | 0,00 | 1,7 % | 0 | 7 |
| sin-pescado-2000 | motor real | 3,12 | 102,5 % | 2,33 (1,44) | 0,00 | 1,7 % | 0 | 7 |
| sibo-2000 | main | 2,15 | 98,4 % | 0,00 (0,00) | 5,66 | 15,0 % | 0 | 0 |
| sibo-2000 | prototipo7 | 2,31 | 98,2 % | 0,00 (0,00) | 3,07 | 4,9 % | 0 | 0 |
| sibo-2000 | prototipo7, RNG de engine2 | 2,31 | 98,2 % | 0,00 (0,00) | 3,07 | 4,9 % | 0 | 0 |
| sibo-2000 | motor real | 2,31 | 98,2 % | 0,00 (0,00) | 3,07 | 4,9 % | 0 | 0 |
| vegetariana-2000 | main | 4,33 | 98,4 % | 2,22 (0,00) | 0,00 | 7,9 % | 0 | 0 |
| vegetariana-2000 | prototipo7 | 4,42 | 98,3 % | 2,41 (0,00) | 0,00 | 7,5 % | 0 | 0 |
| vegetariana-2000 | prototipo7, RNG de engine2 | 4,42 | 98,3 % | 2,41 (0,00) | 0,00 | 7,5 % | 0 | 0 |
| vegetariana-2000 | motor real | 4,42 | 98,3 % | 2,41 (0,00) | 0,00 | 7,5 % | 0 | 0 |
| vegana-1400 | main | 4,87 | 90,5 % | 3,01 (0,00) | 0,00 | 50,0 % | 420 | 0 |
| vegana-1400 | prototipo7 | 4,54 | 91,6 % | 2,75 (0,00) | 0,00 | 51,3 % | 508 | 0 |
| vegana-1400 | prototipo7, RNG de engine2 | 4,54 | 91,6 % | 2,75 (0,00) | 0,00 | 51,3 % | 508 | 0 |
| vegana-1400 | motor real | 4,54 | 91,6 % | 2,75 (0,00) | 0,00 | 51,3 % | 508 | 0 |
| omni-2174-ancla | main | 2,65 | 100,4 % | 1,38 (0,00) | 4,54 | 5,1 % | 0 | 0 |
| omni-2174-ancla | prototipo7 | 2,58 | 101,5 % | 1,99 (1,27) | 3,00 | 3,8 % | 0 | 0 |
| omni-2174-ancla | prototipo7, RNG de engine2 | 2,37 | 102,0 % | 2,10 (1,41) | 3,00 | 3,9 % | 0 | 0 |
| omni-2174-ancla | motor real | 2,37 | 102,0 % | 2,10 (1,41) | 3,00 | 3,9 % | 0 | 0 |
| omni-2000-sin-atun | main | 2,62 | 102,8 % | 1,01 (0,00) | 4,64 | 2,5 % | 0 | 0 |
| omni-2000-sin-atun | prototipo7 | 2,26 | 104,9 % | 1,84 (1,78) | 3,00 | 2,3 % | 0 | 0 |
| omni-2000-sin-atun | prototipo7, RNG de engine2 | 2,23 | 105,1 % | 1,91 (1,84) | 3,00 | 2,0 % | 0 | 0 |
| omni-2000-sin-atun | motor real | 2,23 | 105,1 % | 1,91 (1,84) | 3,00 | 2,0 % | 0 | 0 |
| sin-carne-ave-2000 | main | 2,94 | 101,1 % | 1,78 (0,00) | 8,77 | 4,1 % | 0 | 0 |
| sin-carne-ave-2000 | prototipo7 | 3,44 | 98,7 % | 2,44 (0,31) | 8,01 | 1,8 % | 0 | 0 |
| sin-carne-ave-2000 | prototipo7, RNG de engine2 | 3,35 | 98,8 % | 2,41 (0,30) | 8,04 | 2,3 % | 0 | 0 |
| sin-carne-ave-2000 | motor real | 3,35 | 98,8 % | 2,41 (0,30) | 8,04 | 2,3 % | 0 | 0 |
| solo-pollo-2000 | main | 2,50 | 102,6 % | 1,43 (0,00) | 7,29 | 4,2 % | 0 | 0 |
| solo-pollo-2000 | prototipo7 | 2,78 | 101,2 % | 2,42 (0,58) | 6,54 | 2,9 % | 0 | 0 |
| solo-pollo-2000 | prototipo7, RNG de engine2 | 2,76 | 101,3 % | 2,44 (0,61) | 6,57 | 3,0 % | 0 | 0 |
| solo-pollo-2000 | motor real | 2,76 | 101,3 % | 2,44 (0,61) | 6,57 | 3,0 % | 0 | 0 |
| sin-garbanzos-guisantes-2000 | main | 1,80 | 104,1 % | 0,55 (0,00) | 5,04 | 2,3 % | 0 | 0 |
| sin-garbanzos-guisantes-2000 | prototipo7 | 2,11 | 105,3 % | 1,98 (1,88) | 3,00 | 2,1 % | 0 | 0 |
| sin-garbanzos-guisantes-2000 | prototipo7, RNG de engine2 | 2,06 | 105,4 % | 1,96 (1,85) | 3,00 | 1,9 % | 0 | 0 |
| sin-garbanzos-guisantes-2000 | motor real | 2,06 | 105,4 % | 1,96 (1,85) | 3,00 | 1,9 % | 0 | 0 |
| sin-legumbres-2000 | main | 1,66 | 104,6 % | 0,00 (0,00) | 5,32 | 2,9 % | 0 | 0 |
| sin-legumbres-2000 | prototipo7 | 2,16 | 103,3 % | 0,00 (0,00) | 3,02 | 2,5 % | 0 | 0 |
| sin-legumbres-2000 | prototipo7, RNG de engine2 | 2,16 | 103,3 % | 0,00 (0,00) | 3,02 | 2,5 % | 0 | 0 |
| sin-legumbres-2000 | motor real | 2,16 | 103,3 % | 0,00 (0,00) | 3,02 | 2,5 % | 0 | 0 |
| omni-2174-batido | main | 1,52 | 109,4 % | 1,15 (0,00) | 4,72 | 4,5 % | 0 | 0 |
| omni-2174-batido | prototipo7 | 0,89 | 112,1 % | 1,94 (1,88) | 3,00 | 7,4 % | 0 | 0 |
| omni-2174-batido | prototipo7, RNG de engine2 | 0,94 | 112,1 % | 1,94 (1,85) | 3,00 | 7,3 % | 0 | 0 |
| omni-2174-batido | motor real | 0,94 | 112,1 % | 1,94 (1,85) | 3,00 | 7,3 % | 0 | 0 |
| omni-2174-volumen | main | 2,42 | 100,2 % | 0,98 (0,00) | 4,71 | 5,6 % | 0 | 0 |
| omni-2174-volumen | prototipo7 | 2,01 | 101,8 % | 1,99 (1,89) | 3,00 | 6,7 % | 0 | 0 |
| omni-2174-volumen | prototipo7, RNG de engine2 | 1,97 | 102,0 % | 1,91 (1,81) | 3,00 | 7,3 % | 0 | 0 |
| omni-2174-volumen | motor real | 1,97 | 102,0 % | 1,91 (1,81) | 3,00 | 7,3 % | 0 | 0 |

## Semana a semana

| Perfil | Semanas con el mismo menú (real = proto RNG engine2) | Comidas con otras kcal o proteína | Máx. diferencia (kcal / g prot) | Semanas con el mismo menú (real = prototipo7) |
|---|---|---|---|---|
| omni-1434 | 200 de 200 | 21 | 1 / 0 | 1 de 200 |
| omni-2174 | 200 de 200 | 32 | 38 / 1 | 1 de 200 |
| omni-2600-3comidas | 200 de 200 | 14 | 1 / 0 | 2 de 200 |
| omni-3714 | 200 de 200 | 24 | 1 / 0 | 0 de 200 |
| celiaco-2400 | 200 de 200 | 22 | 1 / 0 | 0 de 200 |
| sin-lactosa-2000 | 200 de 200 | 26 | 1 / 0 | 4 de 200 |
| sin-pescado-2000 | 200 de 200 | 25 | 1 / 0 | 1 de 200 |
| sibo-2000 | 200 de 200 | 0 | 0 / 0 | 200 de 200 |
| vegetariana-2000 | 200 de 200 | 0 | 0 / 0 | 200 de 200 |
| vegana-1400 | 200 de 200 | 0 | 0 / 0 | 200 de 200 |
| omni-2174-ancla | 200 de 200 | 21 | 1 / 0 | 0 de 200 |
| omni-2000-sin-atun | 200 de 200 | 24 | 1 / 0 | 1 de 200 |
| sin-carne-ave-2000 | 200 de 200 | 2 | 1 / 0 | 3 de 200 |
| solo-pollo-2000 | 200 de 200 | 11 | 25 / 1 | 3 de 200 |
| sin-garbanzos-guisantes-2000 | 200 de 200 | 35 | 25 / 1 | 1 de 200 |
| sin-legumbres-2000 | 200 de 200 | 0 | 0 / 0 | 200 de 200 |
| omni-2174-batido | 200 de 200 | 29 | 9 / 1 | 0 de 200 |
| omni-2174-volumen | 200 de 200 | 29 | 1 / 0 | 4 de 200 |
