# Aceite de la comida doble y primeros repetidos

Salida de `resumenAceiteDoble.mjs` sobre `aceiteDoble.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`): «hoy» es `ba52d21` (antes de D-116 y D-117) y «ahora» es esta rama con la comida doble. El aceite se lee igual en los dos (lector de esta rama): ml de AOVE y de aceite de semillas de la compra; un aceite sin cantidad (desayunos) cuenta 10 ml. El día no incluye la comida libre del sábado.

## Aceite (ml)

| Perfil | Comida doble: media (máx.) | Comida de legumbre como plato único, hoy | Resto de comidas y cenas, hoy → ahora | Día, hoy → ahora | Día con comida doble | Día máx., hoy → ahora |
|---|---|---|---|---|---|---|
| omni-1434 | 18,1 (25,0) | 15,6 | 11,4 → 10,9 | 25,7 → 27,5 | 29,9 | 50,0 → 50,0 |
| omni-2174 | 33,0 (40,0) | 19,8 | 17,4 → 17,0 | 37,6 → 44,5 | 51,8 | 60,0 → 75,0 |
| omni-2600-3comidas | 37,2 (40,0) | 20,0 | 19,4 → 19,2 | 43,0 → 51,4 | 60,3 | 60,0 → 80,0 |
| omni-3714 | 39,3 (40,0) | 20,0 | 19,4 → 19,2 | 43,6 → 53,2 | 62,2 | 65,0 → 80,0 |
| celiaco-2400 | 36,9 (40,0) | 20,0 | 18,7 → 18,6 | 41,1 → 49,8 | 58,1 | 60,0 → 80,0 |
| sin-lactosa-2000 | 32,7 (35,0) | 16,3 | 17,3 → 16,9 | 36,5 → 43,7 | 50,6 | 60,0 → 75,0 |
| sin-pescado-2000 | 32,6 (35,0) | 16,3 | 16,8 → 16,4 | 36,1 → 41,1 | 50,5 | 60,0 → 75,0 |
| sibo-2000 | — | — | 16,8 → 16,8 | 37,2 → 37,2 | — | 60,0 → 60,0 |
| vegetariana-2000 | — | 16,9 | 11,7 → 11,7 | 28,5 → 28,5 | — | 60,0 → 60,0 |
| vegana-1400 | — | 15,0 | 5,9 → 5,9 | 19,3 → 19,3 | — | 35,0 → 35,0 |
| omni-2174-ancla | 32,6 (40,0) | 19,6 | 16,9 → 16,5 | 36,5 → 42,4 | 50,9 | 60,0 → 75,0 |
| omni-2000-sin-atun | 32,4 (35,0) | 16,4 | 17,0 → 16,4 | 36,3 → 43,4 | 50,3 | 60,0 → 75,0 |

## Los primeros de la semana: semanas en que repiten algo (comidas dobles servidas)

| Perfil | Semanas con 3 primeros | con 2 | Repiten legumbre | Repiten aliño | Repiten método | Repiten legumbre y aliño (mismo guiso, otra verdura) | Repiten verdura | 3 de la misma legumbre |
|---|---|---|---|---|---|---|---|---|
| omni-1434 | 197 | 3 | 174 | 138 | 198 | 61 | 29 | 0 |
| omni-2174 | 198 | 2 | 172 | 123 | 200 | 56 | 25 | 0 |
| omni-2600-3comidas | 193 | 7 | 179 | 123 | 198 | 60 | 28 | 0 |
| omni-3714 | 197 | 3 | 168 | 129 | 199 | 52 | 21 | 0 |
| celiaco-2400 | 196 | 4 | 171 | 131 | 197 | 54 | 27 | 0 |
| sin-lactosa-2000 | 196 | 4 | 167 | 123 | 200 | 45 | 24 | 0 |
| sin-pescado-2000 | 125 | 12 | 120 | 100 | 133 | 55 | 21 | 0 |
| omni-2174-ancla | 149 | 50 | 128 | 109 | 188 | 44 | 27 | 0 |
| omni-2000-sin-atun | 192 | 8 | 168 | 130 | 198 | 62 | 31 | 0 |
| **Total** | 1643 | 93 | 1447 | 1106 | 1711 | 489 | 233 | 0 |

Primeros por legumbre, aliño y método (comidas dobles, todas las semanas con 2 o más): lentejas pimenton_ajo guisado 1816 · garbanzos pimenton_ajo guisado 1008 · garbanzos limon_hierbas guisado 717 · alubias ajillo guisado 607 · garbanzos curry_ligero salteado 602 · garbanzos ajillo salteado 244 · lentejas ajillo guisado 219.

«Método» es el de la tupla: casi todos los primeros son guisados, así que repetirlo no dice nada. Los 14 primeros son 7 de garbanzos, 5 de lentejas y 2 de alubias.
