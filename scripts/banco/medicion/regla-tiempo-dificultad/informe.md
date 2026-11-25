# Prototipo: tiempo de cocina y experiencia en comidas y cenas entre semana (medición)

Generado por `scripts/banco/medicion/resumenReglaTiempo.mjs`. 18 perfiles × 200 semanas (60 a 259) × 4 combinaciones de tiempo de cocina y experiencia.

## Regla medida

- **Poco tiempo:** de lunes a viernes, en comida y cena, solo platos con `tramo_poco_tiempo = sí`. **Novato:** solo platos fáciles. Las dos a la vez: las dos condiciones.
- Fin de semana sin filtro. Las opciones normal, mucho, intermedio y avanzado, sin filtro. Sin pesos.
- El filtro va **después** de las demás reglas del hueco (no repetir plato, guarnición, cremas, tope de proteína y de pescado, separación por proteína y por familia, huevo, aliño) y **antes** de las preferencias A y B, las frecuencias y la identidad de verdura.
- **Red:** si el filtro deja el hueco sin candidatos, ese hueco se queda sin el filtro y se cuenta.
- Valores de cada plato: columnas «Vigente» de la hoja de tiempo y dificultad (PR #34, commit `1d04de5`), copiadas en `regla-tiempo-dificultad/vigente.csv`. 230 de 288 platos tienen `tramo_poco_tiempo = sí`; 185 son fáciles; 171 cumplen las dos cosas.
- Prototipo en memoria (`reglaTiempoDificultad.mjs`), sin tocar `src/`. El capricho entre semana se filtra igual. El ancla de «cocinar en cantidad» no se filtra (se cuenta aparte). La sugerencia de la comida libre no se filtra.
- Control: normal+intermedio (sin filtro). Con «poco», la app ya elige desayunos rápidos (`desayunosApp.js`): eso también entra en la proteína y la energía del día.

## 1. Cuántas veces actúa la red

Huecos filtrados = comidas y cenas de lunes a viernes por las que pasa el filtro (sin ancla ni sugerencia). «Cumplen» = platos servidos de lunes a viernes que cumplen la condición, contando los de la red y los del ancla.

| Dieta | Combinación | Huecos filtrados | Red (huecos) | Red por hueco | Red por semana | Semanas con red | Servidos L-V que cumplen |
|---|---|---|---|---|---|---|---|
| omnívora | poco+novato | 31610 | 391 | 1,2 % | 0,12 | 288 de 3200 | 98,2 % |
| omnívora | poco+intermedio | 31610 | 57 | 0,2 % | 0,02 | 57 de 3200 | 99,5 % |
| omnívora | normal+novato | 31606 | 342 | 1,1 % | 0,11 | 238 de 3200 | 98,4 % |
| vegetariana | poco+novato | 2000 | 0 | 0,0 % | 0,00 | 0 de 200 | 100,0 % |
| vegetariana | poco+intermedio | 2000 | 0 | 0,0 % | 0,00 | 0 de 200 | 100,0 % |
| vegetariana | normal+novato | 2000 | 0 | 0,0 % | 0,00 | 0 de 200 | 100,0 % |
| vegana | poco+novato | 2000 | 708 | 35,4 % | 3,54 | 200 de 200 | 64,6 % |
| vegana | poco+intermedio | 2000 | 144 | 7,2 % | 0,72 | 130 de 200 | 92,8 % |
| vegana | normal+novato | 2000 | 542 | 27,1 % | 2,71 | 200 de 200 | 72,9 % |

Por perfil (poco+novato):

| Perfil | Dieta | Red por hueco | Red por semana | Semanas con red | Servidos L-V que cumplen | Huecos L-V del ancla (sin filtro) | Dónde actúa la red (top 3) |
|---|---|---|---|---|---|---|---|
| celiaco-2400 | omnívora | 0,0 % | 0,00 | 0 | 100,0 % | 0 | — |
| omni-1434 | omnívora | 0,1 % | 0,01 | 2 | 99,9 % | 0 | Viernes/cena 2 |
| omni-2000-sin-atun | omnívora | 0,1 % | 0,01 | 1 | 100,0 % | 0 | Viernes/cena 1 |
| omni-2174 | omnívora | 0,1 % | 0,01 | 2 | 99,9 % | 0 | Viernes/cena 2 |
| omni-2174-ancla | omnívora | 0,2 % | 0,02 | 4 | 91,2 % | 390 | Viernes/cena 4 |
| omni-2174-batido | omnívora | 0,1 % | 0,01 | 2 | 99,9 % | 0 | Viernes/cena 2 |
| omni-2174-volumen | omnívora | 0,1 % | 0,01 | 2 | 99,9 % | 0 | Viernes/cena 2 |
| omni-2600-3comidas | omnívora | 0,3 % | 0,03 | 6 | 99,7 % | 0 | Viernes/cena 6 |
| omni-3714 | omnívora | 0,2 % | 0,02 | 4 | 99,8 % | 0 | Viernes/cena 4 |
| sibo-2000 | omnívora | 0,9 % | 0,09 | 18 | 99,1 % | 0 | Viernes/cena 14 · Viernes/comida 4 |
| sin-carne-ave-2000 | omnívora | 12,5 % | 1,25 | 164 | 87,5 % | 0 | Viernes/comida 164 · Jueves/comida 75 · Miercoles/comida 6 |
| sin-garbanzos-guisantes-2000 | omnívora | 0,4 % | 0,04 | 8 | 99,6 % | 0 | Viernes/cena 8 |
| sin-lactosa-2000 | omnívora | 0,1 % | 0,01 | 3 | 99,8 % | 0 | Viernes/cena 3 |
| sin-legumbres-2000 | omnívora | 0,3 % | 0,04 | 7 | 99,7 % | 0 | Viernes/cena 4 · Viernes/comida 3 |
| sin-pescado-2000 | omnívora | 3,9 % | 0,39 | 60 | 96,2 % | 0 | Viernes/cena 43 · Martes/cena 19 · Jueves/cena 15 |
| solo-pollo-2000 | omnívora | 0,3 % | 0,03 | 5 | 99,8 % | 0 | Viernes/comida 5 |
| vegana-1400 | vegana | 35,4 % | 3,54 | 200 | 64,6 % | 0 | Jueves/cena 182 · Viernes/comida 109 · Viernes/cena 107 |
| vegetariana-2000 | vegetariana | 0,0 % | 0,00 | 0 | 100,0 % | 0 | — |

## 2. Repetición de platos y especies frente al control

Platos distintos servidos en las 200 semanas de cada perfil (media por perfil), parte de los servidos que se llevan los 10 platos más frecuentes, infracciones de D-099.3 (suma) y especies por semana.

| Dieta | Combinación | Platos distintos/perfil | Top 10 platos | Repetido en la semana | De la semana anterior | Especie >2 veces | Especie mismo día | Especie días seguidos | Especies distintas/sem | Especie más repetida/sem |
|---|---|---|---|---|---|---|---|---|---|---|
| omnívora | poco+novato | 155,0 | 23,6 % | 0 | 0 | 0 | 2 | 7 | 8,98 | 2,00 |
| omnívora | poco+intermedio | 170,9 | 22,4 % | 0 | 0 | 0 | 1 | 6 | 8,98 | 2,00 |
| omnívora | normal+novato | 158,3 | 23,4 % | 0 | 0 | 0 | 0 | 0 | 9,04 | 2,00 |
| omnívora | normal+intermedio (control) | 175,8 | 21,9 % | 0 | 0 | 0 | 0 | 0 | 9,05 | 2,00 |
| vegetariana | poco+novato | 63,0 | 35,3 % | 0 | 0 | 0 | 0 | 0 | 8,49 | 2,00 |
| vegetariana | poco+intermedio | 72,0 | 33,2 % | 0 | 0 | 0 | 0 | 0 | 8,29 | 2,00 |
| vegetariana | normal+novato | 65,0 | 34,2 % | 0 | 0 | 0 | 0 | 0 | 8,41 | 2,00 |
| vegetariana | normal+intermedio (control) | 74,0 | 30,7 % | 0 | 0 | 0 | 0 | 0 | 8,63 | 2,00 |
| vegana | poco+novato | 44,0 | 38,3 % | 0 | 0 | 409 | 13 | 55 | 6,21 | 3,48 |
| vegana | poco+intermedio | 42,0 | 38,1 % | 0 | 0 | 435 | 1 | 23 | 5,64 | 3,71 |
| vegana | normal+novato | 41,0 | 38,4 % | 0 | 0 | 408 | 0 | 16 | 5,94 | 3,85 |
| vegana | normal+intermedio (control) | 47,0 | 34,2 % | 0 | 0 | 349 | 11 | 37 | 6,30 | 3,04 |

## 3. Pescado y legumbre por semana frente al control

«Al horno»: platos de pescado o marisco cuya cocción es horno (plantilla) o airfryer u horno (texto libre). Legumbre = platos de legumbre + guarniciones de legumbre.

| Dieta | Combinación | Pescado/sem | Δ control | De ellos al horno/sem | % al horno | Legumbre/sem | Δ control |
|---|---|---|---|---|---|---|---|
| omnívora | poco+novato | 3,36 | +0,01 | 1,80 | 53,5 % | 1,79 | −0,00 |
| omnívora | poco+intermedio | 3,36 | +0,01 | 1,48 | 43,9 % | 1,75 | −0,04 |
| omnívora | normal+novato | 3,36 | +0,00 | 1,79 | 53,2 % | 1,81 | +0,02 |
| omnívora | normal+intermedio | 3,36 | = | 1,40 | 41,8 % | 1,79 | = |
| vegetariana | poco+novato | 0,00 | = | 0,00 | — | 1,15 | −1,54 |
| vegetariana | poco+intermedio | 0,00 | = | 0,00 | — | 1,12 | −1,56 |
| vegetariana | normal+novato | 0,00 | = | 0,00 | — | 1,05 | −1,64 |
| vegetariana | normal+intermedio | 0,00 | = | 0,00 | — | 2,69 | = |
| vegana | poco+novato | 0,00 | = | 0,00 | — | 2,54 | −0,72 |
| vegana | poco+intermedio | 0,00 | = | 0,00 | — | 2,12 | −1,14 |
| vegana | normal+novato | 0,00 | = | 0,00 | — | 2,13 | −1,13 |
| vegana | normal+intermedio | 0,00 | = | 0,00 | — | 3,25 | = |

## 4. Proteína corta y energía frente al control

Cortas = comidas y cenas servidas por debajo del 95 % de su objetivo de proteína. Proteína y kcal del día, en % del objetivo (días sin sugerencia). Fuera de ±5 % = comidas y cenas con las kcal fuera de ±5 % de su objetivo.

| Dieta | Combinación | Cortas/sem | Δ control | Proteína del día | Δ control | Kcal del día | Δ control | Fuera de ±5 % kcal |
|---|---|---|---|---|---|---|---|---|
| omnívora | poco+novato | 2,38 | +0,06 | 102,8 % | −0,4 | 99,7 % | −0,0 | 8,7 % |
| omnívora | poco+intermedio | 2,37 | +0,05 | 102,7 % | −0,4 | 99,6 % | −0,0 | 8,7 % |
| omnívora | normal+novato | 2,37 | +0,04 | 103,0 % | −0,2 | 99,7 % | −0,0 | 8,8 % |
| omnívora | normal+intermedio | 2,32 | = | 103,1 % | = | 99,7 % | = | 8,5 % |
| vegetariana | poco+novato | 3,46 | −1,11 | 99,2 % | +1,0 | 100,0 % | +0,1 | 10,2 % |
| vegetariana | poco+intermedio | 3,52 | −1,05 | 99,5 % | +1,3 | 100,0 % | +0,1 | 10,4 % |
| vegetariana | normal+novato | 3,37 | −1,21 | 99,5 % | +1,3 | 100,1 % | +0,2 | 9,4 % |
| vegetariana | normal+intermedio | 4,57 | = | 98,2 % | = | 99,9 % | = | 7,7 % |
| vegana | poco+novato | 4,03 | −0,76 | 92,3 % | +1,4 | 105,9 % | +0,9 | 60,3 % |
| vegana | poco+intermedio | 3,92 | −0,87 | 91,9 % | +1,0 | 107,3 % | +2,3 | 63,8 % |
| vegana | normal+novato | 3,87 | −0,92 | 93,1 % | +2,2 | 105,7 % | +0,8 | 59,0 % |
| vegana | normal+intermedio | 4,79 | = | 90,9 % | = | 105,0 % | = | 50,9 % |

Por perfil, poco+novato frente al control:

| Perfil | Pescado/sem (control) | Al horno/sem (control) | Legumbre/sem (control) | Cortas/sem (control) | Proteína del día (control) | Platos distintos (control) |
|---|---|---|---|---|---|---|
| celiaco-2400 | 3,06 (3,06) | 1,67 (1,28) | 2,10 (2,12) | 2,02 (1,97) | 100,4 % (100,9 %) | 133 (150) |
| omni-1434 | 3,00 (3,00) | 1,68 (1,10) | 1,82 (1,90) | 2,87 (2,89) | 99,0 % (99,6 %) | 171 (195) |
| omni-2000-sin-atun | 3,00 (3,00) | 2,00 (1,47) | 1,93 (1,90) | 2,40 (2,15) | 104,5 % (105,1 %) | 163 (183) |
| omni-2174 | 3,00 (3,00) | 1,58 (1,15) | 1,99 (1,96) | 2,17 (2,16) | 102,6 % (102,9 %) | 168 (196) |
| omni-2174-ancla | 3,00 (3,00) | 1,71 (1,28) | 2,06 (2,10) | 2,53 (2,42) | 101,6 % (101,9 %) | 203 (214) |
| omni-2174-batido | 3,00 (3,00) | 1,51 (1,23) | 1,89 (1,89) | 1,02 (0,92) | 111,8 % (112,1 %) | 169 (195) |
| omni-2174-volumen | 3,00 (3,00) | 1,53 (1,16) | 1,83 (1,93) | 1,84 (1,98) | 101,8 % (102,0 %) | 173 (197) |
| omni-2600-3comidas | 3,00 (3,00) | 1,53 (1,19) | 1,93 (1,85) | 1,84 (1,64) | 108,1 % (108,5 %) | 169 (193) |
| omni-3714 | 3,00 (3,00) | 1,68 (1,21) | 1,95 (1,90) | 3,00 (3,35) | 102,0 % (102,3 %) | 169 (195) |
| sibo-2000 | 3,09 (3,06) | 1,63 (1,22) | 0,00 (0,00) | 2,42 (2,33) | 97,7 % (98,2 %) | 160 (179) |
| sin-carne-ave-2000 | 8,03 (8,04) | 4,01 (3,46) | 2,42 (2,42) | 3,42 (3,32) | 98,8 % (98,9 %) | 91 (97) |
| sin-garbanzos-guisantes-2000 | 3,00 (3,00) | 1,59 (1,28) | 1,94 (1,94) | 2,20 (2,06) | 105,0 % (105,4 %) | 169 (190) |
| sin-lactosa-2000 | 3,00 (3,00) | 1,65 (1,20) | 2,06 (2,06) | 1,83 (1,83) | 105,1 % (105,5 %) | 149 (171) |
| sin-legumbres-2000 | 3,02 (3,01) | 1,58 (1,20) | 0,00 (0,00) | 2,29 (2,17) | 102,8 % (103,2 %) | 159 (179) |
| sin-pescado-2000 | 0,00 (0,00) | 0,00 (0,00) | 2,23 (2,33) | 3,44 (3,12) | 101,6 % (102,5 %) | 115 (134) |
| solo-pollo-2000 | 6,62 (6,53) | 3,43 (3,02) | 2,52 (2,43) | 2,79 (2,88) | 101,5 % (101,2 %) | 119 (144) |
| vegana-1400 | 0,00 (0,00) | 0,00 (0,00) | 2,54 (3,25) | 4,03 (4,79) | 92,3 % (90,9 %) | 44 (47) |
| vegetariana-2000 | 0,00 (0,00) | 0,00 (0,00) | 1,15 (2,69) | 3,46 (4,57) | 99,2 % (98,2 %) | 63 (74) |

## 5. Tres semanas de ejemplo de poco+novato

Marca: filtro = el hueco pasó el filtro; red = el filtro lo dejaba sin candidatos y va sin él; fijo = lo colocó el ancla o el capricho; sin marca = fin de semana (sin filtro).

### Omnívora (omni-2174), semana 60

| Día | Comida | Cena |
|---|---|---|
| Lunes | Pasta integral al pomodoro con pechuga de pollo *(filtro)* | Merluza al horno con judías verdes y patata *(filtro)* |
| Martes | Crema de espinacas con huevos encima *(filtro)* | Lomo de cerdo a la plancha con mostaza y miel con brócoli *(filtro)* |
| Miércoles | Bacalao fresco al horno con pimientos y alubias blancas *(filtro)* | Tom Kha Gai — sopa tailandesa de pollo y coco *(filtro)* |
| Jueves | Ternera magra salteada con champiñones y arroz blanco *(filtro)* | Espárragos con mayonesa, atún y huevo duro *(filtro)* |
| Viernes | Bowl proteico de pechuga de pavo con boniato *(filtro)* | Salmón al airfryer con verduras asadas *(filtro)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Ternera magra en ensalada |
| Domingo | Pechuga de pavo al horno con tomate casero con berenjena y garbanzos | Sopa de miso con tofu firme, setas shiitake y alga wakame |

### Omnívora (omni-2174), semana 61

| Día | Comida | Cena |
|---|---|---|
| Lunes | Huevos revueltos con espinacas y arroz blanco *(filtro)* | Dorada al horno con calabacín y patata *(filtro)* |
| Martes | Pechuga de pollo salteada con tomate cherry y pasta integral *(filtro)* | Hamburguesa de ternera con pan brioche y patatas gajo *(filtro)* |
| Miércoles | Bowl mediterráneo de gambas con arroz blanco *(filtro)* | Atún en conserva en ensalada *(filtro)* |
| Jueves | Lomo de cerdo a la plancha con mostaza y miel con zanahoria y lentejas pardinas *(filtro)* | Ternera magra a la plancha con pimientos y patata *(filtro)* |
| Viernes | Pechuga de pollo a la plancha con brócoli y arroz blanco *(filtro)* | Pechuga de pavo al horno con tomate casero con berenjena *(filtro)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Sopa castellana con jamón serrano y huevo pochado |
| Domingo | Pechuga de pavo al horno con judías verdes y garbanzos | Conejo al ajillo con alcachofas |

### Omnívora (omni-2174), semana 62

| Día | Comida | Cena |
|---|---|---|
| Lunes | Bowl mediterráneo de pechuga de pavo con quinoa *(filtro)* | Bacalao fresco al horno con espinacas *(filtro)* |
| Martes | Pasta integral al pomodoro con ternera magra *(filtro)* | Sopa de miso con tofu firme, setas shiitake y alga wakame *(filtro)* |
| Miércoles | Crema de calabacín con gambas encima *(filtro)* | Atún en conserva en crudo con vinagre de Módena y mostaza con tomate cherry *(filtro)* |
| Jueves | Lomo de cerdo al horno con mostaza y miel con col de bruselas y alubias blancas *(filtro)* | Tom Kha Gai — sopa tailandesa de pollo y coco *(filtro)* |
| Viernes | Crema de espinacas con huevos encima *(filtro)* | Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato *(filtro)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Lomo de cerdo a la plancha con mostaza y miel con brócoli |
| Domingo | Huevos en tortilla con pimientos y patata | Ternera magra en ensalada |

### Vegana (vegana-1400), semana 60

| Día | Comida | Cena |
|---|---|---|
| Lunes | Ensalada de tofu, quinoa y aguacate con vinagreta de mostaza *(filtro)* | Fajitas de seitán con pimientos y guacamole *(filtro)* |
| Martes | Tempeh marinado con boniato asado y ensalada *(filtro)* | Tacos de soja texturizada con pico de gallo *(filtro)* |
| Miércoles | Tofu salteado con brócoli, sésamo y arroz *(filtro)* | Seitán salteado con brócoli y cacahuetes *(filtro)* |
| Jueves | Ensalada templada de quinoa con tempeh y verduras asadas *(filtro)* | Soja texturizada a la mexicana con arroz y pimientos *(red)* |
| Viernes | Burrito de alubias negras, arroz y verduras *(filtro)* | Tofu crujiente con salsa de cacahuete y verduras al vapor *(filtro)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Crema de calabaza y zanahoria con tempeh crujiente |
| Domingo | Lentejas con pimentón con espinacas | Curry suave de tofu con calabaza y arroz basmati |

### Vegana (vegana-1400), semana 61

| Día | Comida | Cena |
|---|---|---|
| Lunes | Wok de tempeh con verduras y fideos de arroz *(filtro)* | Ramen de miso con tofu y verduras *(filtro)* |
| Martes | Garbanzos con pimentón con espinacas *(red)* | Berenjenas rellenas de soja texturizada y tomate *(red)* |
| Miércoles | Poke de tofu marinado con arroz, edamame y verduras *(filtro)* | Tempeh teriyaki con arroz y judías verdes *(red)* |
| Jueves | Lentejas al ajillo con calabacín *(red)* | Seitán guisado con patatas y zanahoria *(red)* |
| Viernes | Lasaña de verduras y soja con bechamel vegetal *(red)* | Seitán a la plancha con pimientos asados y patata *(red)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Hamburguesa de tofu y avena con ensalada |
| Domingo | Alubias blancas al ajillo con acelgas | Tempeh en salsa de tomate con calabacín |

### Vegana (vegana-1400), semana 62

| Día | Comida | Cena |
|---|---|---|
| Lunes | Fajitas de seitán con pimientos y guacamole *(filtro)* | Tofu crujiente con salsa de cacahuete y verduras al vapor *(filtro)* |
| Martes | Tempeh marinado con boniato asado y ensalada *(filtro)* | Tacos de soja texturizada con pico de gallo *(filtro)* |
| Miércoles | Ensalada de tofu, quinoa y aguacate con vinagreta de mostaza *(filtro)* | Seitán salteado con brócoli y cacahuetes *(filtro)* |
| Jueves | Burrito de alubias negras, arroz y verduras *(filtro)* | Ensalada templada de quinoa con tempeh y verduras asadas *(filtro)* |
| Viernes | Garbanzos estofados con alcachofas *(red)* | Pimientos rellenos de soja texturizada y arroz *(red)* |
| Sábado | Comida libre 🎉 *(sugerencia)* | Curry suave de tofu con calabaza y arroz basmati |
| Domingo | Garbanzos con pimentón con zanahoria | Crema de calabaza y zanahoria con tempeh crujiente |

