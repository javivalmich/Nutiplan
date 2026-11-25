# Prototipo 2: tope de plato escalado con las kcal (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `878d1e7`. Son los topes de plato de `prototipo6.md` más `--topeEscalado`:

`--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099 --hidratoSeguidos --racionGuarnicion3 --topeEscalado`

## Cambio

Por encima de 2200 kcal, el tope de plato del proteico en las comidas con guarnición escala igual que el hidrato y el aceite: por la amplitud del objetivo (`raciones.js:311`), hasta ×1,4, redondeado al paso del rango del proteico (5 g). Sigue sin pasar del máximo del rango del proteico (300 g).

| Perfil | Amplitud | Tope de ave y carne | Tope de pescado y marisco |
|---|---|---|---|
| omni-3714 | 1,4 (tope) | 280 g | 300 g (el máximo de su rango; 220 × 1,4 = 308) |
| omni-2600-3comidas | 1,18 | 235 g | 255 g por la cuenta; el máximo medido es 260 g, y no he investigado de dónde salen esos 5 g |
| omni-2174-volumen (2424 kcal) | 1,10 | 220 g | 240 g |

## Resultados: 200 semanas

| Perfil | Medición | Cortas/sem | Fuera de ±5 % de kcal (por encima / por debajo) | Proteico en las comidas con guarnición, g: mediana (máximo) | Legumbre, g: mediana (máximo) |
|---|---|---|---|---|---|
| omni-3714 | Ronda final | 3,42 | 34,2 % (0 / 888) | 280 (300) | 330 (330) |
| omni-3714 | Topes de plato | 4,50 | 41,7 % (0 / 1083) | 200 (220) | 220 (220) |
| omni-3714 | Tope escalado | 3,44 | 36,3 % (0 / 944) | 280 (300) | 220 (220) |
| omni-2600-3comidas | Ronda final | 1,67 | 29,8 % (32 / 744) | 110 (245) | 280 (280) |
| omni-2600-3comidas | Topes de plato | 1,67 | 26,2 % (32 / 648) | 195 (220) | 220 (220) |
| omni-2600-3comidas | Tope escalado | 1,66 | 26,3 % (31 / 654) | 195 (260) | 220 (220) |
| omni-2174-volumen | Ronda final | 2,01 | 7,1 % (2 / 182) | 185 (300) | 250 (260) |
| omni-2174-volumen | Topes de plato | 2,02 | 6,7 % (2 / 171) | 200 (220) | 220 (220) |
| omni-2174-volumen | Tope escalado | 2,01 | 6,7 % (2 / 173) | 220 (240) | 220 (220) |

En los tres perfiles: legumbres por semana y D-099.3 iguales a la ronda final (los platos son los mismos). El pan sale en todas las comidas con guarnición de omni-3714 y omni-2600-3comidas, y en el 99,5 % de las de omni-2174-volumen.

**Lectura:**
- **omni-3714 baja de 4,50 a 3,44 comidas cortas**, pero no llega a las 3,42 de la ronda final.
  - Su proteico vuelve a lo de la ronda final: mediana 280 g y máximo 300 g.
  - Lo que le falta es, probablemente, la proteína de la legumbre: el tope de 220 g no escala, y en la ronda final llegaba a 330 g. No lo he separado.
  - En kcal sigue peor que la ronda final: 36,3 % fuera, frente a 34,2 %.
- **omni-2600-3comidas** queda prácticamente como con los topes sin escalar: 1,66 comidas cortas y 26,3 % fuera, frente a 1,67 y 26,2 %. Son 6 comidas más por debajo en 200 semanas.
- **omni-2174-volumen** queda igual en comidas cortas y fuera de kcal: 2,01 y 6,7 %, con 2 comidas más por debajo. Su proteico sube a una mediana de 220 g.

## Criterio de cierre

Javi lo fijó así: «si omni-3714 queda en 3,42 cortas o menos y el resto no empeora, el diseño queda cerrado».

**No se cumple:**
- omni-3714 queda en 3,44, por encima de 3,42.
- omni-2600-3comidas y omni-2174-volumen empeoran muy poco frente a los topes sin escalar: 6 y 2 comidas más por debajo de ±5 % en 200 semanas.

Por eso no se ha escrito `plan-implementacion.md`. La diferencia de omni-3714 es pequeña: 0,02 comidas por semana, unas 4 comidas en 200 semanas. Decidir si basta es de Javi.
