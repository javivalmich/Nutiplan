# Prototipo 2: ajuste de la ración de guarnición (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `b92773f`. Parte de la ronda final (`prototipo4.md`) y añade `--racionGuarnicion2`:

`--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099 --hidratoSeguidos --racionGuarnicion2`

Las cifras de cada perfil están en `prototipo5-resumen.md` (`resumenRacionGuarnicion.mjs`).

## Cambios sobre la ronda final

1. **Rango de la legumbre de guarnición: 100–160 g escurridos, con salida en 130 g.** El máximo no crece con la amplitud del objetivo. Antes era 80–240 g con salida en 180 g, y la amplitud lo subía hasta 330 g en omni-3714.
2. **Orden de crecimiento en las comidas con guarnición**, como `crecerSiFalta` en la comida doble:
   - En el reparto de `ajustarComida`, la legumbre no pasa de su salida (130 g) y el pan se queda en su mínimo.
   - Si después faltan kcal, crece primero el proteico del plato, hasta el máximo de su rango; después la legumbre, hasta 160 g; y por último el pan, hasta su máximo.
   - Los proteicos que van en unidades (el huevo, con su tope de D-111) no crecen en este paso.
   - El pan solo entra, como siempre, si el plato sigue más de un 5 % por debajo (`raciones.js:358`).
   - Causa en el log de raciones: `guarnicion_crece_por_energia`, con lo que crece, por orden.

Los platos no cambian, porque el walk es el mismo. Las legumbres por semana y las infracciones de D-099.3 son las de la ronda final.

## Resultados: 200 semanas, 16 perfiles

Agregado de los 9 omnívoros, 1800 semanas por medición:

| Métrica | main | Ronda final | Ración nueva |
|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,43 | 2,43 |
| Proteína del día | 101,2 % | 102,2 % | 106,8 % |
| Fuera de ±5 % de kcal (por encima / por debajo) | 10,7 % (708 / 1787) | 12,1 % (585 / 2254) | 11,3 % (569 / 2086) |
| Comidas con guarnición | — | 3149 | 3149 |
| Proteico en ellas, g: mediana (mínimo) | — | 120 (70) | 300 (80) |
| Legumbre en ellas, g: mediana (mínimo) | — | 240 (130) | 160 (100) |
| De ellas, con pan | — | 90,2 % | 57,5 % |
| Legumbres/sem (guarnición + plato) | 1,16 | 2,00 | 2,00 |
| Infracciones de D-099.3 | 6 | 0 | 0 |

Fuera de ±5 % de kcal por perfil: % (por encima / por debajo).

| Perfil | main | Ronda final | Ración nueva |
|---|---|---|---|
| omni-1434 | 22,7 % (496 / 95) | 19,5 % (393 / 115) | 18,8 % (380 / 110) |
| omni-2174 | 6,4 % (48 / 119) | 4,9 % (28 / 100) | 4,6 % (28 / 92) |
| omni-2600-3comidas | 19,3 % (18 / 484) | 29,8 % (32 / 744) | 21,8 % (31 / 536) |
| omni-3714 | 27,3 % (0 / 709) | 34,2 % (0 / 888) | 36,8 % (0 / 958) |
| celiaco-2400 | 8,5 % (5 / 217) | 10,1 % (6 / 257) | 9,8 % (6 / 250) |
| sin-lactosa-2000 | 2,5 % (43 / 21) | 2,8 % (42 / 32) | 2,6 % (41 / 26) |
| sin-pescado-2000 | 1,7 % (27 / 17) | 1,5 % (26 / 13) | 1,5 % (26 / 12) |
| omni-2174-ancla | 5,1 % (34 / 98) | 4,0 % (18 / 85) | 3,8 % (17 / 82) |
| omni-2000-sin-atun | 2,5 % (37 / 27) | 2,3 % (40 / 20) | 2,3 % (40 / 20) |
| solo-pollo-2000 | 4,2 % (84 / 25) | 3,4 % (48 / 40) | 3,0 % (47 / 30) |
| sin-carne-ave-2000 | 4,1 % (71 / 35) | 1,8 % (28 / 19) | 1,7 % (27 / 18) |
| sin-garbanzos-guisantes-2000 | 2,3 % (44 / 17) | 2,0 % (30 / 23) | 2,0 % (30 / 21) |
| vegetariana-2000 | 7,9 % (173 / 33) | 7,5 % (166 / 30) | 7,5 % (166 / 30) |
| vegana-1400 | 50,0 % (1223 / 78) | 51,3 % (1274 / 59) | 51,3 % (1274 / 59) |
| sibo-2000 | 15,0 % (296 / 94) | 4,9 % (61 / 66) | 4,9 % (61 / 66) |
| sin-legumbres-2000 | 2,9 % (40 / 35) | 2,5 % (40 / 25) | 2,5 % (40 / 25) |

**Lectura:**
- **Las kcal se cubren casi siempre con más proteico.**
  - La mediana del proteico en las comidas con guarnición pasa de 120 g a 300 g, el máximo de su rango (`RANGO_GRUPO.proteina`, 80–300 g).
  - En omni-2174, las comidas con guarnición llevan 300 g de conejo, pavo, bacalao o ternera. Sus otras comidas llevan entre 130 y 185 g.
  - Es el orden pedido. Pero 300 g de carne o pescado en un plato es más de lo que serviría un nutricionista. El máximo de 300 g es el del grupo, pensado para perfiles de muchas kcal, no para este uso.
- **Proteína del día:** sube de 102,2 % a 106,8 %. En sin-lactosa-2000 llega a 111,4 % y en omni-2600-3comidas a 112,4 %. Las comidas cortas no cambian (2,43), porque las comidas con guarnición no eran las cortas.
- **Pan:** está en el 57,5 % de las comidas con guarnición, frente al 90,2 % de antes.
  - En sin-lactosa, sin-pescado, omni-2000-sin-atun y sin-garbanzos-guisantes, entre el 31 % y el 41 %.
  - En sin-carne-ave, el 58 %; en omni-2174, el 60 %; en solo-pollo, el 79 %; en celiaco-2400, el 93 %.
  - En omni-1434, ninguna.
  - En omni-2600-3comidas y omni-3714, sigue en todas.
- **Fuera de ±5 % de kcal:** baja de 12,1 % a 11,3 %, pero sigue por encima de `main` (10,7 %).
  - Mejora sobre todo omni-2600-3comidas: de 29,8 % a 21,8 %.
  - Empeora omni-3714: de 34,2 % a 36,8 %. Su legumbre bajaba antes hasta 330 g por la amplitud y ahora no pasa de 160 g. Su proteico ya iba casi en el máximo (mediana 280 g), así que solo queda el pan, con tope de 140 g.
  - El resto de perfiles quedan casi igual.
- **Lo que no cambia:** legumbres por semana (2,00), D-099.3 (0) y todo lo del walk, porque los platos son los mismos.
- **Vegetariana, vegana, SIBO y sin legumbres** son iguales a la ronda final: no tienen guarnición.

## Tres semanas tal como las vería el usuario

Ración nueva. Comida y cena de los 7 días, con su preparación y cantidades. Debajo de cada semana, las causas del log de la guarnición y de la ración.

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

- Conejo troceado (300 g) al horno con romero, limón y ajo
- Garbanzos cocidos (160 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (20 ml)

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

- Pechuga de pavo (300 g) al horno con salsa de tomate casera
- Alubias rojas cocidas (160 g) · 1 berenjena pequeña a la plancha (220 g) · AOVE (20 ml) · Pan integral (30 g) para acompañar

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
- Jueves, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece el proteico (conejo 191 → 300 g); después la legumbre (garbanzos_cocidos 130 → 158 g), por este orden y dentro de su rango
- Domingo, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece el proteico (pavo_pechuga 130 → 300 g); después la legumbre (alubias_rojas_cocidas 130 → 157 g), por este orden y dentro de su rango

### omni-2174, semana 66 (2174 kcal)

#### Lunes

**Comida: Bacalao fresco al horno con espinacas y garbanzos** — guarnición de garbanzos en lugar de arroz

- Bacalao fresco (300 g) al horno con ajo, perejil y guindilla
- Garbanzos cocidos (160 g) · 4 puñados de espinacas salteadas (160 g) · AOVE (20 ml) · Pan integral (60 g) para acompañar

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

- Ternera magra (300 g) salteada con ajo, perejil y guindilla
- Alubias rojas cocidas (160 g) · 8 champiñones salteados (160 g) · AOVE (20 ml) · Pan integral (50 g) para acompañar

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
- Lunes, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece el proteico (bacalao 201 → 300 g); después la legumbre (garbanzos_cocidos 130 → 160 g); después el pan (pan_integral 30 → 57 g), por este orden y dentro de su rango
- Jueves, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece el proteico (ternera_magra 157 → 300 g); después la legumbre (alubias_rojas_cocidas 130 → 160 g); después el pan (pan_integral 30 → 47 g), por este orden y dentro de su rango

### omni-3714, semana 66 (3714 kcal)

#### Lunes

**Comida: Conejo al horno con espinacas y alubias blancas** — guarnición de alubias blancas en lugar de boniato

- Conejo troceado (300 g) al horno con romero, limón y ajo
- Alubias blancas cocidas (160 g) · 5 puñados de espinacas salteadas (200 g) · AOVE (20 ml) · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Merluza al horno con judías verdes y patata**

- Merluza (275 g) al horno con limón, orégano y ajo
- Patata (410 g) · 4 puñados de judías verdes al vapor (200 g) · AOVE (20 ml) · Pan integral (120 g) para acompañar

#### Martes

**Comida: Bowl asiático de pechuga de pollo con arroz blanco**

- Base de arroz (220 g en seco) · Pechuga de pollo (300 g) salteada con salsa de soja baja en sal y jengibre
- ½ brócoli al vapor (200 g) · AOVE (20 ml)

**Cena: Sopa de miso con tofu firme, setas shiitake y alga wakame**

- Caldo dashi · miso blanco disuelto · tofu firme en dados · setas shiitake · alga wakame · cebolleta
- Acompañar con arroz blanco (50g seco) si se quiere versión más saciante (+180kcal) · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

#### Miércoles

**Comida: Bacalao fresco al horno con pimientos y garbanzos** — guarnición de garbanzos en lugar de patata

- Bacalao fresco (300 g) al horno con ajo, perejil y guindilla
- Garbanzos cocidos (160 g) · 1½ pimientos asados (235 g) · AOVE (20 ml) · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Huevo con tomate en crudo**

- Crema fría de tomates cherry (290 g)
- 2 huevos cocidos encima · AOVE (20 ml) · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

#### Jueves

**Comida: Crema de puerro con pechuga de pollo encima**

- Crema de puerro (290 g)
- Pechuga de pollo (300 g) guisada encima · con hierbas provenzales · AOVE (20 ml) · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Lomo de cerdo a la plancha con acelgas**

- Lomo de cerdo (270 g) a la plancha con ajo, perejil y guindilla
- ½ manojo de acelgas salteadas (250 g) · AOVE (20 ml) · Pan integral (130 g) para acompañar · De postre: 2 piezas de fruta de temporada

#### Viernes

**Comida: Gambas en ensalada**

- Gambas peladas (300 g) a la plancha
- 1 bol grande de lechuga (115 g) · ½ pepino (115 g) · AOVE (20 ml) y vinagreta de Módena y mostaza · Pan integral (140 g) para acompañar · De postre: 2 piezas de fruta de temporada

**Cena: Crema de calabacín con huevos encima**

- Crema de calabacín y zanahoria (430 g + 235 g)
- 2 huevos a la plancha encima · AOVE (20 ml) · Pan integral (140 g) para acompañar · De postre: 1 pieza de fruta de temporada

#### Sábado

**Comida (comida libre; sugerencia): Falafel con tabulé de bulgur y yogur de menta**

- Falafel casero de garbanzos al horno · tabulé de bulgur con perejil, menta y tomate · yogur griego de menta
- Pita integral para acompañar · limón · AOVE

**Cena: Lomo de cerdo al horno con mostaza y miel con col de bruselas**

- Lomo de cerdo (255 g) al horno con mostaza y miel
- 13 coles de Bruselas asadas (200 g) · AOVE (20 ml) · Pan integral (100 g) para acompañar · De postre: 2 piezas de fruta de temporada

#### Domingo

**Comida: Pechuga de pavo al horno con tomate casero con berenjena y arroz blanco**

- Pechuga de pavo (300 g) al horno con salsa de tomate casera
- Arroz (205 g en seco) · 1 berenjena mediana a la plancha (285 g) · AOVE (20 ml)

**Cena: Croquetas caseras de jamón al airfryer con ensalada**

- 6-8 croquetas caseras de jamón al airfryer (sin freír) · ensalada verde con tomate
- Aliño con vinagre de Jerez y AOVE · Pan integral (110 g) para acompañar

Causas de la guarnición, del hidrato y de la red en el log:

- Lunes, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 0 de 3 (alubias blancas, garbanzos, lentejas pardinas); cuenta para el suelo de legumbre de D-024
- Martes, comida: `hidrato_dias_seguidos_evitado` — Martes/comida: fuera 4 candidatos con legumbre, patata, el hidrato del día de al lado; quedan 52
- Martes, cena: `hidrato_dias_seguidos_evitado` — Martes/cena: fuera 1 candidatos con legumbre, patata, el hidrato del día de al lado; quedan 25
- Miercoles, comida: `hidrato_dias_seguidos_evitado` — Miercoles/comida: fuera 20 candidatos con arroz, el hidrato del día de al lado; quedan 66
- Miercoles, comida: `guarnicion_legumbre_no_repetida` — fuera alubias blancas: ya salen esta semana
- Miercoles, comida: `guarnicion_legumbre_elegida` — RNG «::guarnicion» -> «legumbre»; después índice 0 de 2 (garbanzos, lentejas pardinas); cuenta para el suelo de legumbre de D-024
- Domingo, comida: `guarnicion_hidrato_original` — RNG «::guarnicion» -> «hidrato original» (de: hidrato original, legumbre)
- Lunes, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece la legumbre (alubias_blancas_cocidas 130 → 160 g); después el pan (pan_integral 30 → 140 g), por este orden y dentro de su rango
- Miércoles, comida: `guarnicion_crece_por_energia` — faltaban kcal en la comida con guarnición: crece la legumbre (garbanzos_cocidos 130 → 160 g); después el pan (pan_integral 30 → 140 g), por este orden y dentro de su rango
