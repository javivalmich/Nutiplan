# Prototipo 2, última ronda: red de D-099.3 y sin hidrato ni guarnición en días seguidos (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `a22edee`, con las opciones de la (b) nueva de 180 g (`--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --baseGuarnicion=180`) y dos nuevas: `--redD099 --hidratoSeguidos`.

Archivos de esta carpeta:
- `prototipo4-resumen.md`: todas las cifras, también por perfil, y las tablas de las comidas fuera de ±5 % de kcal.
- Lo anterior: `prototipo3.md`.

## Cambios sobre la (b) nueva de 180 g

1. **Red de D-099.3.**
   - Si la semana acaba con alguna infracción de D-099.3 (la comprobación del walk, `infraccionesD099`) y la (b) había sacado algún compuesto de legumbre del pool, se repite el walk entero con la misma semilla sin esa exclusión. Guarnición, suelo y topes siguen igual. Causa: `guarnicion_red_d099_sin_b`.
   - Si la semana repetida sigue con infracción, se anota con causa propia y se queda así: `infraccion_d099_guarnicion_red_sin_b`.
   - Si la (b) no había sacado nada (vegetariana, vegana), no hay nada que retirar: se anota `infraccion_d099_guarnicion_sin_exclusion` y no se repite.
2. **Preferencias de días seguidos**, con vuelta atrás y causa en el log.
   - **El mismo hidrato en días seguidos.** En cada hueco, comida o cena, fuera los candidatos cuyo hidrato de plantilla ya sale el día anterior o el siguiente (si ya está decidido). La comida con guarnición cuenta como hidrato «legumbre», como en el medidor. Va después de los filtros de la semana y antes de las preferencias A y B. Si dejaría el hueco sin candidatos, no se aplica. Causas: `hidrato_dias_seguidos_evitado` y `hidrato_dias_seguidos_sin_aplicar`.
   - **Guarnición de legumbre en días seguidos**, aunque sea de otra legumbre. Si el día de al lado ya la lleva, se queda el hidrato original (`guarnicion_dias_seguidos_evitada`).
   - **La vuelta atrás con el suelo de 2:** si el suelo pide legumbre en un día pegado a otra guarnición, el suelo espera a la comida siguiente. Solo cede si no queda ninguna comida servida más en la semana (`guarnicion_dias_seguidos_sin_aplicar`). En las 3200 semanas no ha cedido nunca.

**Límite:** el hidrato que mira la preferencia es el de la plantilla (la C de su tupla), igual que el medidor. Las patatas de un redactado (hamburguesa con patatas gajo, por ejemplo) no cuentan. Se ve en la semana de sin-pescado-2000, más abajo: la hamburguesa con patatas gajo del lunes y la tortilla con patata del martes.

## Resultados: 200 semanas, 16 perfiles

Agregado de los 9 omnívoros, 1800 semanas por medición:

| Métrica | main | HEAD | (b) nueva 180 g | Ronda final |
|---|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,15 | 2,38 | 2,43 |
| … de legumbre suelta | 1,08 | 0,08 | 0,14 | 0,16 |
| … de huevo | 1,05 | 1,37 | 1,51 | 1,52 |
| … otras | 0,74 | 0,70 | 0,73 | 0,75 |
| Proteína del día | 101,2 % | 107,6 % | 102,2 % | 102,2 % |
| Legumbres/sem (guarnición + plato) | 1,16 (0 + 1,16) | 3,01 (0 + 3,01) | 2,14 (1,93 + 0,21) | 2,00 (1,75 + 0,25) |
| Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | 413 / 809 / 466 / 106 / 6 | 1 / 17 / 59 / 1601 / 122 | 25 / 252 / 971 / 552 / 0 | 34 / 311 / 1073 / 382 / 0 |
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 773 | 39 |
| Semanas con legumbre (guarnición o plato) en días seguidos | 48 | 42 | 515 | 86 |
| Semanas con guarnición de legumbre en días seguidos | 0 | 0 | 448 | 0 |
| Comidas con guarnición que llevan pan | — | — | 91,1 % (91 g) | 90,2 % (91 g) |
| Comidas y cenas fuera de ±5 % de kcal | 10,7 % | 8,5 % | 12,5 % | 12,1 % |
| Infracciones de D-099.3 | 6 | 2 | 10 | 0 |
| Pescado/sem | 4,28 | 2,68 | 2,67 | 2,67 |

Veces que actúa cada regla nueva (16 perfiles, 3200 semanas):

| Regla | Veces |
|---|---|
| Red de D-099.3: repite la semana sin la exclusión de la (b) | 11 (todas en sin-pescado-2000) |
| Red de D-099.3: la semana repetida sigue con infracción | 0 |
| Infracción sin exclusión de la (b) que retirar | 200 (las 200 semanas de vegana-1400) |
| Hidrato en días seguidos: evitado / sin aplicar | 12 717 / 12 |
| Guarnición en días seguidos: evitada / sin aplicar | 739 / 0 |

**Lectura:**
- **La red deja sin-pescado-2000 sin infracciones de D-099.3** (de 10 a 0).
  - Actúa en 11 de sus 200 semanas, y en ninguna la semana repetida sigue con infracción.
  - Esas 11 semanas vuelven a tener compuestos de legumbre como plato.
  - En el perfil entero, con la ronda final (red y preferencias juntas), las legumbres por semana bajan de 2,44 a 2,35 y las comidas cortas suben de 3,06 a 3,17, lo mismo que en HEAD. No he separado cuánto es de la red.
- **vegana-1400** tiene infracciones de D-099.3 todas las semanas, como en HEAD (catálogo corto, D-107). La (b) no se le aplica, así que la red no tiene nada que retirar y solo lo anota.
- **El hidrato repetido en días seguidos casi desaparece:** de 773 semanas a 39.
  - 33 de esas 39 son de omni-2174-ancla, el perfil con platos anclados; no he comprobado una por una que vengan del ancla.
  - Ninguna semana tiene ya dos guarniciones de legumbre en días seguidos.
- **Quedan 86 semanas con legumbre en días seguidos** (99 pares de días).
  - Son pares de plato de legumbre y guarnición, o de dos platos. Esta preferencia no los mira: solo mira guarnición con guarnición, como se pidió.
  - 60 de los 99 pares son de omni-2174-ancla, que ya tenía 42 en HEAD, y 25 de sin-pescado-2000.
- **El coste es algo de legumbre.**
  - La preferencia quita 739 guarniciones. El suelo espera a la comida siguiente, pero a veces la semana se acaba.
  - Legumbres por semana: de 2,14 a 2,00.
  - Semanas por debajo de 2: de 277 a 345.
  - Semanas con una legumbre repetida: de 108 a 134.
  - Las comidas cortas suben un poco: 2,38 → 2,43.
- **Otros perfiles** (ronda final, comidas cortas por semana):
  - solo-pollo-2000: 2,78 (HEAD 3,46);
  - sin-carne-ave-2000: 3,44 (HEAD 4,21);
  - sin-garbanzos-guisantes-2000: 2,10, con 1,98 legumbres por semana (2,21 en la (b) nueva);
  - vegetariana, vegana, sin-legumbres y sibo: como en la (b) nueva.

## Comidas fuera de ±5 % de kcal

9 omnívoros, 200 semanas. Tablas completas en `prototipo4-resumen.md` (`fueraKcal.mjs` y `resumenFueraKcal.mjs`). Una comida está «con pan» si las raciones le han añadido pan para acompañar.

| | main | HEAD | Ronda final |
|---|---|---|---|
| Fuera de ±5 % | 2495 de 23 400 (10,7 %) | 1988 (8,5 %) | 2839 (12,1 %) |
| … por encima | 708 | 558 | 585 |
| … por debajo | 1787 | 1430 | 2254 |

**Casi todo lo que sube frente a `main` es por debajo** (+467 por debajo y −123 por encima). Sale de tres sitios:

1. **La guarnición de legumbre (+435).**
   - Con pan: 427 de 2839 comidas quedan por debajo (15,3 %), con una desviación media de −13,8 %. Casi todas son caliente clásico.
   - Sin pan: solo 8 de 310 quedan fuera.
   - En `main`, esos huecos eran comidas de plantilla con arroz o patata y sin pan, que casi nunca salen fuera (1,3 %).
   - Es lo de `prototipo3.md`: 240 g de legumbre tienen menos energía que el arroz o la patata a los que sustituyen. El pan se añade porque el plato se queda corto, pero tiene tope de 100 g (`raciones.js:60`), y a veces ni con él llega.
2. **Las comidas de plantilla con pan caen más a menudo:** 14,1 % en `main` y 22,5 % ahora, casi siempre por debajo (−18,5 % de media).
   - Son sobre todo cremas con proteína encima y ensaladas.
   - Frente a HEAD, ocupan parte de los huecos de la comida doble, que casi nunca salía fuera (42 de 5244, 0,8 %).
   - El número de comidas por debajo en esta categoría es casi el mismo que en `main` (698 frente a 709). Pero hay menos comidas de plantilla con pan (5318 frente a 3477), porque parte de ellas son ahora guarnición.
3. **Por perfil, todo se concentra en los de muchas kcal:**
   - omni-2600-3comidas: 19,3 % en `main` y 29,8 % ahora;
   - omni-3714: 27,3 % y 34,2 %;
   - celiaco-2400: 8,5 % y 10,1 %.
   - En los de 2000-2174 kcal la cifra es parecida a `main` o más baja (omni-2174: 6,4 % y 4,9 %).

**Por encima, menos que en `main`.** Son sobre todo cenas redactadas, con cantidades fijas: +16 % de media, como en `main`. También omni-1434, al que los mínimos de ración ya le pasan de su objetivo. Hay menos que en `main` porque hay menos cenas redactadas (5456 en `main`, 4496 ahora).

**En resumen:** lo que sube viene de la guarnición. El pan no lo causa: es el remedio de las raciones, y no le alcanza. La otra parte viene de que, sin la comida doble, sus huecos los ocupan cremas y ensaladas, que se quedan cortas en los perfiles de muchas kcal. Para corregirlo habría que dejar más legumbre o parte del hidrato junto a la guarnición en esos perfiles. No está medido.

## Tres semanas tal como las vería el usuario

Ronda final. Comida y cena de los 7 días, con su preparación y cantidades, y debajo las causas del log de la guarnición, del hidrato y de la red. Semanas 63 y 66 de omni-2174 y semana 142 de sin-pescado-2000, en la que actúa la red.

### omni-2174, semana 63 (2174 kcal)

#### Lunes

**Comida: Crema de brócoli con pechuga de pollo encima**

- Crema de brócoli (260 g)
- Pechuga de pollo (130 g) a la plancha encima · con limón, orégano y ajo · AOVE (20 ml) · Pan integral (100 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Sardinas a la plancha con escalivada y pan tostado**

- Sardinas frescas a la plancha con sal y limón · escalivada de pimiento y berenjena · pan tostado
- AOVE virgen extra · ajo · perejil · vinagre de Jerez

#### Martes

**Comida: Pasta integral al pomodoro con ternera magra**

- Pasta integral (105 g en seco) · Ternera magra (175 g) salteada
- 1 calabacín mediano a la plancha (220 g) · salsa de tomate casera · AOVE (20 ml) · queso rallado al gusto

**Cena: Huevos revueltos con pimientos**

- 3 huevos revueltos con pimentón ahumado y ajo
- 1 pimiento mediano asado (180 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

#### Miércoles

**Comida: Pechuga de pavo en ensalada**

- Pechuga de pavo (155 g) a la plancha
- 1 bol de lechuga (90 g) · 6 tomates cherry (90 g) · AOVE (20 ml) y vinagreta de Módena y mostaza · Pan integral (100 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Atún en conserva en crudo con lechuga mixta y pepino**

- Atún en conserva al natural (120 g) escurrido
- 1 bol de lechuga en ensalada (90 g) · ½ pepino en rodajas (90 g) · AOVE (20 ml) · Pan integral (80 g) para acompañar · De postre: 1 pieza de fruta de temporada

#### Jueves

**Comida: Conejo al horno con espinacas y garbanzos** — guarnición de garbanzos en lugar de boniato

- Conejo troceado (140 g) al horno con romero, limón y ajo
- Garbanzos cocidos (210 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

**Cena: Huevos revueltos con champiñones**

- 3 huevos revueltos con ajo, perejil y guindilla
- 8 champiñones salteados (160 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

#### Viernes

**Comida: Pechuga de pollo al horno con hierbas provenzales con judías verdes y patata**

- Pechuga de pollo (155 g) al horno con hierbas provenzales
- Patata (290 g) · 4 puñados de judías verdes al vapor (175 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

**Cena: Merluza al horno con alcachofas**

- Merluza (120 g) al horno con limón, orégano y ajo
- 2 alcachofas asadas (200 g) · AOVE (20 ml) · Pan integral (100 g) para acompañar

#### Sábado

**Comida (comida libre; sugerencia): Caldo gallego de repollo (completo)**

- Caldo gallego con repollo · patata · alubias blancas · lacón · chorizo gallego
- Unto · cebolla · sal · pan de pueblo para mojar

**Cena: Ternera magra en ensalada**

- Ternera magra (150 g) a la plancha
- 1 bol de lechuga (90 g) · 6 tomates cherry (90 g) · AOVE (20 ml) y vinagreta de Módena y mostaza · Pan integral (90 g) para acompañar

#### Domingo

**Comida: Pechuga de pavo al horno con tomate casero con berenjena y alubias rojas** — guarnición de alubias rojas en lugar de arroz

- Pechuga de pavo (80 g) al horno con salsa de tomate casera
- Alubias rojas cocidas (240 g) · 1 berenjena pequeña a la plancha (220 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

**Cena: Lomo de cerdo al horno con mostaza y miel con col de bruselas**

- Lomo de cerdo (135 g) al horno con mostaza y miel
- 11 coles de Bruselas asadas (160 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

Causas de la guarnición, del hidrato y de la red en el log:

- Miercoles, comida: `hidrato_dias_seguidos_evitado` — Miercoles/comida: fuera 8 candidatos con pasta, el hidrato del día de al lado; quedan 84
- Jueves, comida: `guarnicion_suelo_semana` — Jueves: la semana va corta (0 de 2 legumbres desde el jueves): este hueco lleva legumbre de guarnición sin el paso de la mitad
- Jueves, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 1 de 3 (alubias blancas, garbanzos, lentejas pardinas); cuenta para el suelo de legumbre de D-024
- Viernes, comida: `guarnicion_dias_seguidos_evitada` — Viernes: el Jueves ya lleva guarnición de legumbre (garbanzos): se queda el hidrato original; el suelo espera a otra comida (quedan 1)
- Sabado, comida: `hidrato_dias_seguidos_evitado` — Sabado/comida: fuera 6 candidatos con patata, el hidrato del día de al lado; quedan 28
- Sabado, cena: `hidrato_dias_seguidos_evitado` — Sabado/cena: fuera 3 candidatos con patata, el hidrato del día de al lado; quedan 17
- Domingo, comida: `guarnicion_suelo_semana` — Domingo: la semana va corta (1 de 2 legumbres desde el jueves): este hueco lleva legumbre de guarnición sin el paso de la mitad
- Domingo, comida: `guarnicion_legumbre_no_repetida` — fuera garbanzos: ya salen esta semana
- Domingo, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 2 de 3 (alubias blancas, lentejas pardinas, alubias rojas); cuenta para el suelo de legumbre de D-024

### omni-2174, semana 66 (2174 kcal)

#### Lunes

**Comida: Bacalao fresco al horno con espinacas y garbanzos** — guarnición de garbanzos en lugar de arroz

- Bacalao fresco (165 g) al horno con ajo, perejil y guindilla
- Garbanzos cocidos (230 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (15 ml) · Pan integral (80 g) para acompañar

**Cena: Pechuga de pollo al horno con hierbas provenzales con berenjena**

- Pechuga de pollo (135 g) al horno con hierbas provenzales
- 1 berenjena pequeña a la plancha (220 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

#### Martes

**Comida: Lomo de cerdo al horno con mostaza y miel con col de bruselas y patata**

- Lomo de cerdo (210 g) al horno con mostaza y miel
- Patata (290 g) · 11 coles de Bruselas asadas (160 g) · AOVE (20 ml)

**Cena: Ternera magra en ensalada**

- Ternera magra (135 g) a la plancha
- 1 bol de lechuga (90 g) · 6 tomates cherry (90 g) · AOVE (20 ml) y vinagreta de Módena y mostaza · Pan integral (90 g) para acompañar

#### Miércoles

**Comida: Crema de puerro con pechuga de pollo encima**

- Crema de puerro (225 g)
- Pechuga de pollo (185 g) guisada encima · con hierbas provenzales · AOVE (20 ml) · Pan integral (90 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Merluza al horno con alcachofas**

- Merluza (160 g) al horno con limón, orégano y ajo
- 2 alcachofas asadas (200 g) · AOVE (20 ml) · Pan integral (100 g) para acompañar

#### Jueves

**Comida: Ternera magra salteada con champiñones y alubias rojas** — guarnición de alubias rojas en lugar de arroz

- Ternera magra (80 g) salteada con ajo, perejil y guindilla
- Alubias rojas cocidas (240 g) · 8 champiñones salteados (160 g) · AOVE (20 ml) · Pan integral (100 g) para acompañar

**Cena: Huevos en tortilla con zanahoria**

- 3 huevos en tortilla con pimentón ahumado y ajo
- 2 zanahorias al vapor (120 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

#### Viernes

**Comida: Pechuga de pavo al horno con judías verdes y patata**

- Pechuga de pavo (160 g) al horno con limón, orégano y ajo
- Patata (290 g) · 4 puñados de judías verdes al vapor (175 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

**Cena: Atún en conserva en crudo con lechuga mixta y pepino**

- Atún en conserva al natural (115 g) escurrido
- 1 bol de lechuga en ensalada (90 g) · ½ pepino en rodajas (90 g) · AOVE (20 ml) · Pan integral (100 g) para acompañar

#### Sábado

**Comida (comida libre; sugerencia): Caldo gallego de grelos (completo)**

- Caldo gallego con grelos · patata · alubias blancas · lacón · chorizo gallego
- Unto (grasa de cerdo curada) · cebolla · sal · pan de pueblo para mojar

**Cena: Huevos revueltos con brócoli**

- 2 huevos revueltos con limón, orégano y ajo
- ½ brócoli al vapor (175 g) · AOVE (20 ml) · Pan integral (90 g) para acompañar

#### Domingo

**Comida: Bowl mediterráneo de pechuga de pavo con quinoa**

- Base de quinoa (130 g en seco) · Pechuga de pavo (170 g) a la plancha con limón, orégano y ajo
- 1 pimiento mediano asado (180 g) · AOVE (20 ml)

**Cena: Sopa castellana con jamón serrano y huevo pochado**

- Caldo de ajo y pimentón con pan tostado deshecho · jamón serrano en tiras · huevo pochado
- Pimentón dulce y ahumado · AOVE · ajo · perejil

Causas de la guarnición, del hidrato y de la red en el log:

- Lunes, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 0 de 3 (garbanzos, alubias blancas, lentejas pardinas); cuenta para el suelo de legumbre de D-024
- Martes, comida: `guarnicion_dias_seguidos_evitada` — Martes: el Lunes ya lleva guarnición de legumbre (garbanzos): se queda el hidrato original
- Miercoles, comida: `hidrato_dias_seguidos_evitado` — Miercoles/comida: fuera 7 candidatos con patata, el hidrato del día de al lado; quedan 93
- Miercoles, cena: `hidrato_dias_seguidos_evitado` — Miercoles/cena: fuera 4 candidatos con patata, el hidrato del día de al lado; quedan 49
- Jueves, comida: `guarnicion_suelo_semana` — Jueves: la semana va corta (1 de 2 legumbres desde el jueves): este hueco lleva legumbre de guarnición sin el paso de la mitad
- Jueves, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 0 de 4 (alubias rojas, alubias pintas, lentejas pardinas, alubias negras); cuenta para el suelo de legumbre de D-024
- Viernes, comida: `guarnicion_dias_seguidos_evitada` — Viernes: el Jueves ya lleva guarnición de legumbre (alubias rojas): se queda el hidrato original
- Sabado, comida: `hidrato_dias_seguidos_evitado` — Sabado/comida: fuera 4 candidatos con patata, el hidrato del día de al lado; quedan 16
- Sabado, cena: `hidrato_dias_seguidos_evitado` — Sabado/cena: fuera 1 candidatos con patata, el hidrato del día de al lado; quedan 15

### sin-pescado-2000, semana 142 (2000 kcal)

#### Lunes

**Comida: Pechuga de pavo al horno con tomate casero con berenjena y alubias rojas** — guarnición de alubias rojas en lugar de arroz

- Pechuga de pavo (80 g) al horno con salsa de tomate casera
- Alubias rojas cocidas (240 g) · 1 berenjena pequeña a la plancha (210 g) · AOVE (20 ml) · Pan integral (80 g) para acompañar

**Cena: Hamburguesa de pollo con pan integral y patatas gajo**

- Hamburguesa de pollo picado (80g) en pan integral · lechuga · tomate · cebolla · pepinillos
- Patatas gajo al airfryer · salsa de yogur con limón y ajo

#### Martes

**Comida: Huevos en tortilla con pimientos y patata**

- 3 huevos en tortilla con pimentón ahumado y ajo
- Patata (350 g) · 1 pimiento mediano asado (170 g) · AOVE (20 ml)

**Cena: Conejo al ajillo con espinacas**

- Conejo troceado (110 g) al horno con ajo, perejil y guindilla
- 4 puñados de espinacas salteadas (155 g) · AOVE (20 ml) · Pan integral (80 g) para acompañar

#### Miércoles

**Comida: Crema de puerro con pechuga de pollo encima**

- Crema de puerro (215 g)
- Pechuga de pollo (130 g) guisada encima · con hierbas provenzales · AOVE (20 ml) · Pan integral (90 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato**

- Pechuga de pavo (100 g) a la plancha con curry y cúrcuma
- Boniato (230 g) · 3 puñados de judías verdes al vapor (165 g) · AOVE (20 ml)

#### Jueves

**Comida: Lentejas con pimentón con zanahoria**

- Lentejas (115 g en seco) guisadas con pimentón ahumado y ajo
- 2 zanahorias (115 g) · caldo de verduras · AOVE (15 ml) · Pan integral (80 g) para acompañar

**Cena: Huevo con tomate en crudo**

- Crema fría de tomates cherry (215 g)
- 3 huevos cocidos encima · AOVE (15 ml) · Pan integral (60 g) para acompañar

#### Viernes

**Comida: Ternera magra salteada con champiñones y arroz blanco**

- Ternera magra (165 g) salteada con ajo, perejil y guindilla
- Arroz (95 g en seco) · 8 champiñones salteados (155 g) · AOVE (20 ml)

**Cena: Lomo de cerdo al horno con mostaza y miel con col de bruselas**

- Lomo de cerdo (95 g) al horno con mostaza y miel
- 10 coles de Bruselas asadas (155 g) · AOVE (15 ml) · Pan integral (70 g) para acompañar

#### Sábado

**Comida (comida libre; sugerencia): Conejo al horno con alcachofas y patata**

- Conejo troceado (200 g) al horno con limón, orégano y ajo
- Patata (200 g) · 2 alcachofas asadas (190 g) · AOVE (15 ml)

**Cena: Croquetas caseras de jamón al airfryer con ensalada**

- 6-8 croquetas caseras de jamón al airfryer (sin freír) · ensalada verde con tomate
- Aliño con vinagre de Jerez y AOVE

#### Domingo

**Comida: Garbanzos al curry con brócoli**

- Garbanzos (110 g en seco) guisados con curry y cúrcuma
- ½ brócoli (165 g) · caldo de verduras · AOVE (15 ml) · Pan integral (70 g) para acompañar

**Cena: Hamburguesa de ternera con pan brioche y patatas gajo**

- Hamburguesa de ternera (80g) en pan brioche · lechuga · tomate · cebolla · pepinillos · queso light
- Patatas gajo al airfryer · salsa burger casera (mostaza + yogur + ketchup)

Causas de la guarnición, del hidrato y de la red en el log:

- Lunes, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 2 de 4 (alubias blancas, lentejas pardinas, alubias rojas, garbanzos); cuenta para el suelo de legumbre de D-024
- Miercoles, comida: `hidrato_dias_seguidos_evitado` — Miercoles/comida: fuera 3 candidatos con patata, el hidrato del día de al lado; quedan 51
- Miercoles, cena: `hidrato_dias_seguidos_evitado` — Miercoles/cena: fuera 1 candidatos con patata, el hidrato del día de al lado; quedan 7
- Jueves, comida: `hidrato_dias_seguidos_evitado` — Jueves/comida: fuera 2 candidatos con boniato, el hidrato del día de al lado; quedan 44
- Viernes, comida: `guarnicion_hidrato_original` — RNG «::guarnicion» -> «hidrato original» (de: hidrato original, legumbre)
- Sabado, comida: `hidrato_dias_seguidos_evitado` — Sabado/comida: fuera 1 candidatos con arroz, el hidrato del día de al lado; quedan 18
- `guarnicion_red_d099_sin_b` — con la (b) la semana incumplía D-099.3 (conejo en Sabado y Domingo); se repite el walk entero con la misma semilla sin sacar los compuestos de legumbre del pool (guarnición, suelo y topes siguen)
