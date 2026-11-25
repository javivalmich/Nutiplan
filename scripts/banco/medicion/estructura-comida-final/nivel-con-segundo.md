# Nivel de legumbre solo con segundo posible (2026-11-22)

Solo medición: no cambia ninguna regla. La variante se aplica en memoria con `variantesNivelSegundo.mjs`, sobre HEAD `b91e6f1` (en `src/` igual que `8c8d9b1`).

**Variante.** En la comida de un día sorteado, el nivel de legumbre solo se fija si ese día hay al menos un segundo posible: un plato que vale de segundo, sin usar en la semana ni en la anterior y sin vetar, que cumpla a la vez, con los platos ya puestos, el tope por especie, la separación por especie y la familia en días seguidos. El tope de pescado no hace falta, porque un segundo nunca es pescado (D-116.2). Si no hay ninguno, el día sigue la cascada de los días no sorteados, con la causa `dia_legumbre_sin_segundo_posible`.

**Medición.** 200 semanas por perfil desde la 60, por la entrada de la app, con `cortasProteina.mjs`. `main` es `19a300c`. «Semanas con la red» son las semanas repetidas con la regla de legumbre apagada (D-116.5).

**Criterio de Javi para implementar:**
- solo-pollo-2000 y un-segundo-2000 a 0,3 comidas cortas por semana de `main`, o menos;
- los 8 omnívoros y sin-pescado-2000 sin empeorar más de 0,05 frente a HEAD.

## solo-pollo-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,50 | 102,6 % | 1,43 | 1,43 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 3,46 | 102,2 % | 3,25 | 2,08 | 1,17 | 7 de 453 | 0 | 0 | 49 |
| variante | 3,46 | 102,2 % | 3,19 | 2,03 | 1,17 | 24 de 501 | 281 | 0 | 33 |

## un-segundo-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 3,00 | 100,8 % | 1,40 | 1,40 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 4,36 | 99,0 % | 3,15 | 2,69 | 0,46 | 8 de 564 | 0 | 0 | 12 |
| variante | 4,08 | 99,1 % | 2,56 | 2,10 | 0,46 | 162 de 585 | 499 | 0 | 5 |

## sin-pescado-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 3,81 | 101,0 % | 1,66 | 1,66 | 0,00 | 0 de 0 | 0 | 6 | 0 |
| HEAD | 3,17 | 104,7 % | 2,77 | 0,65 | 2,13 | 6 de 408 | 0 | 2 | 64 |
| variante | 3,17 | 104,5 % | 2,78 | 0,69 | 2,10 | 11 de 414 | 112 | 2 | 62 |

## omni-1434

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 3,31 | 98,4 % | 1,04 | 1,04 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 2,62 | 100,1 % | 3,06 | 0,00 | 3,06 | 3 de 600 | 0 | 0 | 0 |
| variante | 2,56 | 100,2 % | 3,00 | 0,00 | 3,00 | 18 de 600 | 39 | 0 | 0 |

## omni-2174

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,64 | 100,5 % | 1,06 | 1,06 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 1,85 | 106,7 % | 3,06 | 0,00 | 3,06 | 6 de 600 | 0 | 0 | 0 |
| variante | 1,85 | 106,4 % | 3,00 | 0,00 | 3,00 | 15 de 600 | 35 | 0 | 0 |

## omni-2600-3comidas

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,00 | 106,2 % | 1,01 | 1,01 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 1,42 | 116,1 % | 3,04 | 0,00 | 3,04 | 3 de 600 | 0 | 0 | 0 |
| variante | 1,43 | 115,7 % | 3,00 | 0,00 | 3,00 | 9 de 600 | 34 | 0 | 0 |

## omni-3714

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 4,37 | 100,1 % | 1,05 | 1,05 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 3,02 | 107,8 % | 3,04 | 0,00 | 3,04 | 2 de 600 | 0 | 0 | 0 |
| variante | 3,00 | 107,7 % | 3,00 | 0,00 | 3,00 | 15 de 600 | 24 | 0 | 0 |

## celiaco-2400

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,23 | 99,0 % | 1,15 | 1,15 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 1,64 | 110,8 % | 3,04 | 0,00 | 3,04 | 4 de 600 | 0 | 0 | 0 |
| variante | 1,59 | 110,7 % | 2,96 | 0,00 | 2,96 | 21 de 600 | 36 | 0 | 0 |

## sin-lactosa-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,19 | 102,9 % | 1,04 | 1,04 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 1,58 | 108,7 % | 3,04 | 0,00 | 3,04 | 7 de 600 | 0 | 0 | 0 |
| variante | 1,71 | 108,8 % | 3,00 | 0,00 | 3,00 | 11 de 600 | 33 | 0 | 0 |

## omni-2174-ancla

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,65 | 100,4 % | 1,38 | 1,38 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 1,98 | 105,8 % | 3,00 | 0,26 | 2,75 | 4 de 493 | 0 | 0 | 0 |
| variante | 2,08 | 105,1 % | 2,74 | 0,28 | 2,46 | 59 de 491 | 92 | 0 | 0 |

## omni-2000-sin-atun

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Legumbre como plato único/sem | Comidas dobles/sem | Días sorteados sin legumbre | Días sin segundo posible | Infracciones de D-099.3 | Semanas con la red |
|---|---|---|---|---|---|---|---|---|---|
| main | 2,62 | 102,8 % | 1,01 | 1,01 | 0,00 | 0 de 0 | 0 | 0 | 0 |
| HEAD | 2,10 | 108,0 % | 3,06 | 0,01 | 3,06 | 4 de 600 | 0 | 0 | 0 |
| variante | 2,13 | 108,0 % | 3,04 | 0,00 | 3,04 | 14 de 600 | 22 | 0 | 0 |

## Resultado: no se cumple el criterio

| Perfil | Comidas cortas/sem, `main` → HEAD → variante | Variante frente a | ¿Cumple? |
|---|---|---|---|
| solo-pollo-2000 | 2,50 → 3,46 → 3,46 | `main`: +0,96 | No |
| un-segundo-2000 | 3,00 → 4,36 → 4,08 | `main`: +1,08 | No |
| sin-lactosa-2000 | 1,58 → 1,71 (HEAD → variante) | HEAD: +0,13 | No |
| omni-2174-ancla | 1,98 → 2,08 (HEAD → variante) | HEAD: +0,10 | No |
| sin-pescado-2000 y los otros 6 omnívoros | entre −0,06 y +0,03 frente a HEAD | HEAD | Sí |

Infracciones de D-099.3: las mismas que en HEAD en todos los perfiles (0, y 2 en sin-pescado-2000). Semanas con la red: bajan (solo-pollo-2000 49 → 33, un-segundo-2000 12 → 5, sin-pescado-2000 64 → 62).

## Por qué no ayuda a los perfiles con un solo segundo

- **La comprobación actúa a menudo:** 281 días sin segundo posible en solo-pollo-2000 y 499 en un-segundo-2000.
- **Pero esos días casi siempre siguen llevando legumbre.** Los días sorteados sin legumbre son 7 → 24 de unos 500 en solo-pollo-2000, y 8 → 162 de unos 580 en un-segundo-2000.
  - En la cascada de los días no sorteados, la legumbre sigue en el pool, y en estos perfiles (sin la mayoría de las carnes) es buena parte de la comida.
  - Cuando sale un compuesto de legumbre, el walk le busca segundo (D-116), y como no lo hay, va como plato único.
  - Por eso la legumbre como plato único baja poco: 2,08 → 2,03 y 2,69 → 2,10 por semana.
- **En los omnívoros**, la comprobación corta entre 22 y 92 días en 200 semanas.
  - Esos días la legumbre sale menos: hasta −0,26 por semana en omni-2174-ancla, donde las comidas dobles bajan de 2,75 a 2,46.
  - En sin-lactosa-2000 y omni-2174-ancla las comidas cortas suben más de 0,05.
