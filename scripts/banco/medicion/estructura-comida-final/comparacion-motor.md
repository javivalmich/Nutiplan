# Motor real frente al prototipo de medición (D-116 y D-117)

Salida de `compararMotorHook.mjs`. 200 semanas seguidas por perfil, 10 perfiles (2000 semanas), las semillas del banco desde la semana 60.
«Prototipo» es el hook `estructuraComida.mjs` con `suelo3,sinPescado,todas,antesAB,topePlatoUnico,red` sobre el walk anterior a la implementación; «motor» es `src/engine2` tal cual (`--ec=motor`).

## Semana a semana

- Semanas con los mismos platos en los mismos huecos (comida, segundo, cena y sugerencia): **2000 de 2000**.
- Semanas con el mismo texto y las mismas cantidades en comidas y cenas: 2000 de 2000.

## Cifras

«8 perfiles» son los omnívoros sin SIBO y con pescado (1600 semanas), como en D-116 y D-117.

| Medida | Prototipo | Motor | Esperado |
|---|---|---|---|
| Infracciones de D-099.3 (10 perfiles, total de casos) | 0 | 0 | 0 |
| Red de seguridad: semanas rehechas sin segundos (de 2000) | 71 (sin-pescado-2000) | 71 (sin-pescado-2000) | unas 71, todas de sin-pescado-2000 |
| Legumbre por semana (8 perfiles) | 3,02 | 3,02 | ≈ 3,02 |
| Pescado por semana (8 perfiles) | 3,90 | 3,90 | ≈ 3,90 |
| Comidas con segundo por semana (8 perfiles) | 2,99 | 2,99 | 2,99 |
| Familia en días seguidos sin ancla, D-115 (8 perfiles, casos) | 238 | 238 | 238 |
| Segundo sin tope, plato único (10 perfiles) | 3 | 3 | 3 |
| Segundo sin candidato (10 perfiles) | 0 | 0 | 0 |
| Día sorteado sin legumbre (8 perfiles, casos) | 43 | 43 | 2,7 por 100 semanas |
| SIBO: semanas con días sorteados | 200 | 0 | 0 en el motor |
| SIBO: días sorteados sin candidato | 600 | 0 | 0 en el motor (600 en el prototipo) |
| D-114: sugerencias con segundo | 0 | 0 | 0 |
| Semanas con infracción de D-099.3 y sin segundos (contadas por medirEstructura) | 0 | 0 | 0 |
| Semanas con la causa infraccion_d099_sin_segundos (solo el motor la anota) | 0 | 0 | 0 |
| Semanas con dias_legumbre_sin_sorteo (solo el motor la anota; SIBO) | 0 | 200 | 200 en el motor |
| Comidas con un alimento vetado o eliminado | 0 | 0 | 0 |
| Semanas fuera de ±5 % de calorías (8 perfiles) | 1 | 1 |  |
| Comidas y cenas cortas de proteína por semana (8 perfiles) | 1,85 | 1,85 | 1,85 |
| Planes que no son de engine2 | 0 | 0 | 0 |

## Por perfil

| Perfil | Semanas iguales | Red (prototipo / motor) | Legumbre/sem | Pescado/sem | D-099.3 |
|---|---|---|---|---|---|
| omni-1434 | 200 de 200 | 0 / 0 | 3,02 / 3,02 | 4,00 / 4,00 | 0 / 0 |
| omni-2174 | 200 de 200 | 0 / 0 | 3,04 / 3,04 | 3,88 / 3,88 | 0 / 0 |
| omni-2600-3comidas | 200 de 200 | 0 / 0 | 2,98 / 2,98 | 3,92 / 3,92 | 0 / 0 |
| omni-3714 | 200 de 200 | 0 / 0 | 3,04 / 3,04 | 3,92 / 3,92 | 0 / 0 |
| celiaco-2400 | 200 de 200 | 0 / 0 | 3,01 / 3,01 | 4,10 / 4,10 | 0 / 0 |
| sin-lactosa-2000 | 200 de 200 | 0 / 0 | 3,02 / 3,02 | 4,03 / 4,03 | 0 / 0 |
| sin-pescado-2000 | 200 de 200 | 71 / 71 | 3,15 / 3,15 | 0,00 / 0,00 | 0 / 0 |
| sibo-2000 | 200 de 200 | 0 / 0 | 0,00 / 0,00 | 5,03 / 5,03 | 0 / 0 |
| omni-2174-ancla | 200 de 200 | 0 / 0 | 3,01 / 3,01 | 3,72 / 3,72 | 0 / 0 |
| omni-2000-sin-atun | 200 de 200 | 0 / 0 | 3,06 / 3,06 | 3,67 / 3,67 | 0 / 0 |

