# Inventario del catálogo (script: scripts/banco/medicion/inventarioCatalogo.mjs)

Catálogo base: scripts/phaseB2/output/dishes.json vía catalogoApp() = 241 platos.
Por perfil: filtrarCatalogo(catalogoApp(), perfil, kcal, {}) + aplicarAjustesD099, como en materializePlan.

## 0. Tamaño del catálogo por perfil

| Perfil | Perfil del banco | Platos | Quitados por el filtro | con momento comida | con momento cena | redactados | compuestos |
|---|---|---|---|---|---|---|---|
| omnívoro | omni-2174 | 241 | 0 | 148 | 113 | 63 | 178 |
| vegetariano | vegetariana-2000 | 83 | 201 | 53 | 50 | 53 | 30 |
| vegano | vegana-1400 | 50 | 223 | 38 | 27 | 36 | 14 |
| celíaco | celiaco-2400 | 179 | 62 | 97 | 89 | 19 | 160 |
| SIBO | sibo-2000 | 200 | 41 | 116 | 102 | 42 | 158 |

Familia sin resolver (familiaDe → sin_familia / sin_resolver / desconocido), por perfil:
- omnívoro: 0
- vegetariano: 0
- vegano: 0
- celíaco: 0
- SIBO: 0

## 1. Platos por familia × momento × estructura (celdas con menos de 5 platos marcadas con *)

### omnívoro (omni-2174)

| Familia | comida · plato único | comida · con segundo | comida · redactado | cena · plato único | cena · con segundo | cena · redactado |
|---|---|---|---|---|---|---|
| ave | 16 | 9 | 13 | 4* | 21 | 12 |
| carne | 4* | 14 | 7 | 1* | 18 | 4* |
| cereal | 0* | 0* | 6 | 0* | 0* | 3* |
| huevo | 2* | 3* | 3* | 3* | 8 | 6 |
| legumbre | 14 | 0* | 7 | 0* | 0* | 0* |
| marisco | 7 | 3* | 2* | 2* | 3* | 2* |
| pescado | 14 | 14 | 10 | 2* | 21 | 2* |
| vegetal | 0* | 0* | 0* | 0* | 0* | 1* |
| **total** | 57 | 43 | 48 | 12 | 71 | 30 |

### vegetariano (vegetariana-2000)

| Familia | comida · plato único | comida · con segundo | comida · redactado | cena · plato único | cena · con segundo | cena · redactado |
|---|---|---|---|---|---|---|
| ave | 0* | 0* | 0* | 0* | 0* | 0* |
| carne | 0* | 0* | 0* | 0* | 0* | 0* |
| cereal | 0* | 0* | 6 | 0* | 0* | 1* |
| huevo | 2* | 3* | 3* | 3* | 8 | 4* |
| legumbre | 14 | 0* | 6 | 0* | 0* | 0* |
| marisco | 0* | 0* | 0* | 0* | 0* | 0* |
| pescado | 0* | 0* | 0* | 0* | 0* | 0* |
| vegetal | 0* | 0* | 19 | 0* | 0* | 34 |
| **total** | 16 | 3 | 34 | 3 | 8 | 39 |

### vegano (vegana-1400)

| Familia | comida · plato único | comida · con segundo | comida · redactado | cena · plato único | cena · con segundo | cena · redactado |
|---|---|---|---|---|---|---|
| ave | 0* | 0* | 0* | 0* | 0* | 0* |
| carne | 0* | 0* | 0* | 0* | 0* | 0* |
| cereal | 0* | 0* | 3* | 0* | 0* | 0* |
| huevo | 0* | 0* | 0* | 0* | 0* | 0* |
| legumbre | 14 | 0* | 4* | 0* | 0* | 0* |
| marisco | 0* | 0* | 0* | 0* | 0* | 0* |
| pescado | 0* | 0* | 0* | 0* | 0* | 0* |
| vegetal | 0* | 0* | 17 | 0* | 0* | 27 |
| **total** | 14 | 0 | 24 | 0 | 0 | 27 |

### celíaco (celiaco-2400)

| Familia | comida · plato único | comida · con segundo | comida · redactado | cena · plato único | cena · con segundo | cena · redactado |
|---|---|---|---|---|---|---|
| ave | 11 | 8 | 4* | 4* | 21 | 4* |
| carne | 1* | 14 | 1* | 1* | 18 | 0* |
| cereal | 0* | 0* | 1* | 0* | 0* | 0* |
| huevo | 1* | 3* | 0* | 3* | 8 | 1* |
| legumbre | 14 | 0* | 3* | 0* | 0* | 0* |
| marisco | 5 | 3* | 1* | 2* | 3* | 0* |
| pescado | 9 | 13 | 5 | 2* | 21 | 1* |
| vegetal | 0* | 0* | 0* | 0* | 0* | 0* |
| **total** | 41 | 41 | 15 | 12 | 71 | 6 |

### SIBO (sibo-2000)

| Familia | comida · plato único | comida · con segundo | comida · redactado | cena · plato único | cena · con segundo | cena · redactado |
|---|---|---|---|---|---|---|
| ave | 15 | 9 | 10 | 3* | 21 | 8 |
| carne | 4* | 12 | 5 | 1* | 17 | 2* |
| cereal | 0* | 0* | 5 | 0* | 0* | 3* |
| huevo | 2* | 3* | 3* | 3* | 8 | 5 |
| legumbre | 0* | 0* | 0* | 0* | 0* | 0* |
| marisco | 7 | 3* | 2* | 2* | 3* | 2* |
| pescado | 14 | 14 | 8 | 2* | 20 | 2* |
| vegetal | 0* | 0* | 0* | 0* | 0* | 0* |
| **total** | 42 | 41 | 33 | 11 | 69 | 22 |

Plantilla de los platos compuestos (para reagrupar «estructura» si se prefiere otra definición), omnívoro:
| Plantilla | Platos |
|---|---|
| caliente_clasico | 110 |
| pasta | 13 |
| legumbre | 14 |
| bowl | 13 |
| ensalada | 13 |
| sopa_crema | 15 |
| redactado | 63 |

## 5. Huecos: celdas familia × momento × estructura con menos de 5 platos, por perfil

| Perfil | Celdas | Con 0 platos | Con 1–4 | Celdas con 1–4 (familia/momento/estructura=n) |
|---|---|---|---|---|
| omnívoro | 48 | 13 | 17 | ave/cena/plato único=4; carne/comida/plato único=4; carne/cena/plato único=1; carne/cena/redactado=4; cereal/cena/redactado=3; huevo/comida/plato único=2; huevo/comida/con segundo=3; huevo/comida/redactado=3; huevo/cena/plato único=3; marisco/comida/con segundo=3; marisco/comida/redactado=2; marisco/cena/plato único=2; marisco/cena/con segundo=3; marisco/cena/redactado=2; pescado/cena/plato único=2; pescado/cena/redactado=2; vegetal/cena/redactado=1 |
| vegetariano | 48 | 36 | 6 | cereal/cena/redactado=1; huevo/comida/plato único=2; huevo/comida/con segundo=3; huevo/comida/redactado=3; huevo/cena/plato único=3; huevo/cena/redactado=4 |
| vegano | 48 | 43 | 2 | cereal/comida/redactado=3; legumbre/comida/redactado=4 |
| celíaco | 48 | 18 | 18 | ave/comida/redactado=4; ave/cena/plato único=4; ave/cena/redactado=4; carne/comida/plato único=1; carne/comida/redactado=1; carne/cena/plato único=1; cereal/comida/redactado=1; huevo/comida/plato único=1; huevo/comida/con segundo=3; huevo/cena/plato único=3; huevo/cena/redactado=1; legumbre/comida/redactado=3; marisco/comida/con segundo=3; marisco/comida/redactado=1; marisco/cena/plato único=2; marisco/cena/con segundo=3; pescado/cena/plato único=2; pescado/cena/redactado=1 |
| SIBO | 48 | 16 | 16 | ave/cena/plato único=3; carne/comida/plato único=4; carne/cena/plato único=1; carne/cena/redactado=2; cereal/cena/redactado=3; huevo/comida/plato único=2; huevo/comida/con segundo=3; huevo/comida/redactado=3; huevo/cena/plato único=3; marisco/comida/con segundo=3; marisco/comida/redactado=2; marisco/cena/plato único=2; marisco/cena/con segundo=3; marisco/cena/redactado=2; pescado/cena/plato único=2; pescado/cena/redactado=2 |

Las celdas con 0 platos se ven con `0*` en las tablas de la sección 1 (incluye combinaciones que no existen por diseño, p. ej. familias de carne en el perfil vegano).

## 2. Por plato: kcal de referencia, proteína por 100 kcal y densidad energética

Plato de partida (componerPlato a 2000 kcal, sin raciones; leerComida + medirComida). Universo: unión de los 5 catálogos = 284 platos únicos; medidos 284; errores al componer 0.
Platos con lectura incompleta (ingrediente sin cantidad, sin datos o sin reconocer; sus kcal están por debajo): 7.
Cortes de tercil (T1 ≤ c1 < T2 ≤ c2 < T3): proteína/100 kcal c1=6.41, c2=8.55 · kcal/g c1=0.96, c2=1.23.

| Familia | Platos | kcal ref. (mediana) | kcal ref. mín–máx | prot/100 kcal (mediana) | kcal/g (mediana) | prot/100 kcal T1·T2·T3 | kcal/g T1·T2·T3 |
|---|---|---|---|---|---|---|---|
| ave | 64 | 531 | 334–824 | 9.40 | 1.00 | 0·18·46 | 26·23·15 |
| carne | 45 | 577 | 340–787 | 7.67 | 1.09 | 9·24·12 | 8·21·16 |
| cereal | 15 | 657 | 321–796 | 5.82 | 1.24 | 10·2·3 | 3·4·8 |
| huevo | 22 | 476.5 | 386–692 | 5.47 | 1.05 | 19·3·0 | 7·12·3 |
| legumbre | 23 | 482 | 421–1129 | 4.98 | 1.39 | 21·2·0 | 1·7·15 |
| marisco | 19 | 416 | 300–772 | 8.33 | 1.11 | 3·7·9 | 9·4·6 |
| pescado | 60 | 530 | 267–1125 | 7.83 | 1.07 | 12·27·21 | 25·11·24 |
| vegetal | 36 | 546 | 378–861 | 6.34 | 1.00 | 21·12·3 | 16·13·7 |

Terciles por perfil (platos del catálogo de cada perfil que caen en cada tercil, con los cortes de arriba):

| Perfil | Platos medidos | prot/100 kcal T1·T2·T3 | kcal/g T1·T2·T3 |
|---|---|---|---|
| omnívoro | 241 | 68·82·91 | 80·77·84 |
| vegetariano | 83 | 65·15·3 | 23·33·27 |
| vegano | 50 | 38·9·3 | 12·16·22 |
| celíaco | 179 | 46·53·80 | 67·54·58 |
| SIBO | 200 | 45·71·84 | 70·69·61 |

Cruce tercil de proteína × tercil de densidad (platos):

| prot/100 kcal \ kcal/g | T1 (poco densos) | T2 | T3 (muy densos) |
|---|---|---|---|
| T1 | 15 | 31 | 49 |
| T2 | 18 | 39 | 38 |
| T3 | 62 | 25 | 7 |

## 3 y 4. Raciones con ajustarDia (src/plan/racionesApp.js)

Contexto fijo: miércoles de la semana 60 del perfil del banco (userId banco-<perfil>, motor engine2/engine2); se sustituye la comida o la cena por cada plato y se lee ese hueco. Objetivos del hueco leídos de meal.nutricion.objetivoKcal/objetivoProteina.

Platos × momento racionados: 321 (comida 174, cena 147). CSV por plato: scripts/banco/medicion/inventario/platos.csv

### 3. A 3714 kcal (omni-3714): proteína que topa y lo que se añade

Objetivo del hueco: comida 1393 kcal y 83 g de proteína; cena 1021 kcal y 61 g de proteína.
Definiciones: «topa» = algún ingrediente proteico queda en su máximo (límite que registra el log de raciones). «Proteína corta» = proteína final < 95 % del objetivo de proteína de esa comida (el 5 % es FALTA_PARA_ACOMPANAR del motor). «Extra» = acompañamiento añadido por el motor (pan, pan sin gluten, fruta, nuez); «ampliado» = el motor agranda un ingrediente que el plato ya tenía de esa familia en vez de añadir.

| Momento | Platos | Proteico en máximo | Proteína corta (<95 %) | Con extra añadido | Con ingrediente ampliado | g de extra (mediana) | g de extra mín–máx | kcal de extra (mediana) |
|---|---|---|---|---|---|---|---|---|
| comida | 174 | 130 | 74 | 111 | 9 | 300 | 100–440 | 350 |
| cena | 147 | 59 | 38 | 98 | 11 | 420 | 100–440 | 450 |

Por familia y momento (proteico en máximo / proteína corta / con extra · de total de platos):

| Familia | comida: topa · corta · extra / total | cena: topa · corta · extra / total | Pan o extra: g medianos (comida · cena) |
|---|---|---|---|
| ave | 16 · 0 · 26 / 38 | 0 · 0 · 28 / 37 | 300 · 440 |
| carne | 25 · 5 · 11 / 25 | 2 · 2 · 16 / 23 | 140 · 400 |
| cereal | 11 · 4 · 4 / 11 | 1 · 1 · 1 / 4 | 270 · 140 |
| huevo | 8 · 8 · 8 / 8 | 17 · 14 · 14 / 17 | 300 · 430 |
| legumbre | 3 · 21 · 16 / 23 | 0 · 0 · 0 / 0 | 440 · — |
| marisco | 11 · 7 · 9 / 12 | 4 · 1 · 7 / 7 | 140 · 440 |
| pescado | 37 · 16 · 27 / 38 | 5 · 0 · 18 / 25 | 140 · 440 |
| vegetal | 19 · 13 · 10 / 19 | 30 · 20 · 14 / 34 | 290 · 130 |

Por estructura y momento (mismas tres cifras):

| Estructura | comida: topa · corta · extra / total | cena: topa · corta · extra / total |
|---|---|---|
| plato único | 32 · 27 · 48 / 57 | 4 · 3 · 12 / 12 |
| con segundo | 40 · 17 · 28 / 43 | 14 · 8 · 58 / 71 |
| redactado | 58 · 30 · 35 / 74 | 41 · 27 · 28 / 64 |

| Momento | Proteína corta (total) | de ellos, con proteico en máximo («topa») | de ellos, sin ingrediente proteico en máximo |
|---|---|---|---|
| comida | 74 | 56 | 18 |
| cena | 38 | 37 | 1 |

Los «cortos sin topar» son platos cuya proteína no la da un ingrediente que el motor trate como proteico (p. ej. legumbre como plato único): no hay nada que ampliar en la proteína. Familias de esos platos: legumbre=18, carne=1.

Pan y fruta por separado (platos×momento a 3714 kcal; el motor los añade solo si el plato, con todo en su máximo, queda >5 % por debajo de su objetivo de kcal):

| Momento | Extra | Platos | g (mediana) | g mín–máx | kcal (mediana) |
|---|---|---|---|---|---|
| comida | pan_integral | 103 | 140 | 30–140 | 350 |
| comida | fruta | 64 | 300 | 150–300 | 150 |
| cena | pan_integral | 93 | 140 | 100–140 | 350 |
| cena | fruta | 67 | 300 | 150–300 | 150 |

Extras (pan + fruta) por plato×momento: total de platos con algún extra y kcal medianas del conjunto de extras:

| Momento | Con algún extra | kcal de extras (mediana) | kcal de extras mín–máx | % del objetivo de kcal de la comida (mediana) |
|---|---|---|---|---|
| comida | 111 | 350 | 150–500 | 25.1 |
| cena | 98 | 450 | 150–500 | 44.1 |

Platos donde la proteína topa Y queda corta (93); los 25 con más déficit, a 3714 kcal:

| Plato | Momento | Familia | Estructura | Obj. prot (g) | Prot final (g) | Déficit (g) | Proteico en máx. | Extra (g) | kcal extra | kcal final / obj. |
|---|---|---|---|---|---|---|---|---|---|---|
| Crema de espinacas con huevos encima | comida | huevo | plato único | 83 | 38 | 45 | huevo | pan_integral 140, fruta 300 | 500 | 916/1393 |
| Huevos en tortilla con pimentón ahumado y ajo con pimientos  | comida | huevo | con segundo | 83 | 43 | 40 | huevo | pan_integral 140, fruta 300 | 500 | 1248/1393 |
| Huevos revuelto con ajo, perejil y guindilla con champiñones | comida | huevo | con segundo | 83 | 44 | 39 | huevo | pan_integral 140, fruta 300 | 500 | 1232/1393 |
| Huevos revuelto con ajo, perejil y guindilla con espinacas y | comida | huevo | con segundo | 83 | 46 | 37 | huevo | pan_integral 140 | 350 | 1385/1393 |
| Shakshuka con pan integral | comida | huevo | redactado | 83 | 48 | 35 | huevo | fruta 300 | 150 | 1217/1393 |
| Curry suave de tofu con calabaza y arroz basmati | comida | vegetal | redactado | 83 | 49 | 34 | tofu | — | — | 1387/1393 |
| Arroz meloso de verduras con tofu | comida | cereal | redactado | 83 | 49 | 34 | tofu | — | — | 1384/1393 |
| Pisto manchego con huevo a la plancha | comida | huevo | redactado | 83 | 50 | 33 | huevo | fruta 300 | 150 | 1224/1393 |
| Tortilla de patatas completa con ensalada | comida | huevo | redactado | 83 | 50 | 33 | huevo | fruta 300 | 150 | 1402/1393 |
| Huevos en tortilla con pimentón ahumado y ajo con zanahoria | cena | huevo | con segundo | 61 | 30 | 31 | huevo | pan_integral 140, fruta 150 | 425 | 812/1021 |
| Huevos a la plancha con ajo, perejil y guindilla con tomate  | cena | huevo | con segundo | 61 | 31 | 30 | huevo | pan_integral 140, fruta 300 | 500 | 872/1021 |
| Tofu salteado con brócoli, sésamo y arroz | comida | vegetal | redactado | 83 | 53 | 30 | tofu | — | — | 1391/1393 |
| Huevo con tomate en crudo | cena | huevo | plato único | 61 | 32 | 29 | huevo | pan_integral 140, fruta 300 | 500 | 890/1021 |
| Huevos revuelto con pimentón ahumado y ajo con pimientos | cena | huevo | con segundo | 61 | 32 | 29 | huevo | pan_integral 140, fruta 150 | 425 | 828/1021 |
| Huevos revuelto con ajo, perejil y guindilla con champiñones | cena | huevo | con segundo | 61 | 33 | 28 | huevo | pan_integral 140, fruta 300 | 500 | 887/1021 |
| Pasta carbonara | comida | cereal | redactado | 83 | 55 | 28 | huevo | pan_integral 130, fruta 300 | 475 | 1390/1393 |
| Pasta integral al ajillo con huevos | comida | huevo | plato único | 83 | 56 | 27 | huevo | pan_integral 140 | 350 | 1394/1393 |
| Huevos revuelto con ajo, perejil y guindilla con espinacas | cena | huevo | con segundo | 61 | 35 | 26 | huevo | pan_integral 140, fruta 300 | 500 | 879/1021 |
| Huevos en tortilla con pimentón ahumado y ajo con calabacín | cena | huevo | con segundo | 61 | 35 | 26 | huevo | pan_integral 140, fruta 300 | 500 | 883/1021 |
| Huevos revuelto con limón, orégano y ajo con brócoli | cena | huevo | con segundo | 61 | 35 | 26 | huevo | pan_integral 140, fruta 300 | 500 | 885/1021 |
| Huevos a la plancha con ajo, perejil y guindilla con espárra | cena | huevo | con segundo | 61 | 35 | 26 | huevo | pan_integral 140, fruta 300 | 500 | 885/1021 |
| Fabada asturiana simplificada | comida | legumbre | redactado | 83 | 58 | 25 | chorizo+morcilla+panceta | pan_integral 30, fruta 150 | 150 | 1254/1393 |
| Wok de tempeh con verduras y fideos de arroz | comida | vegetal | redactado | 83 | 58 | 25 | tempeh | — | — | 1383/1393 |
| Crema de calabaza con huevos encima | cena | huevo | plato único | 61 | 37 | 24 | huevo | pan_integral 140, fruta 150 | 425 | 993/1021 |
| Tofu al horno con patatas y judías verdes | comida | vegetal | redactado | 83 | 59 | 24 | tofu | pan_integral 140, fruta 300 | 500 | 1362/1393 |

Extras añadidos a 3714 kcal (platos×momento): pan_integral=196, fruta=131.

### 4. A 1434 kcal (omni-1434): gramos totales por comida

Objetivo del hueco: comida 538 kcal y 39 g de proteína; cena 394 kcal y 29 g de proteína. Gramos = suma de los ingredientes releídos de la comida ya ajustada (leerComida).
«Pequeña» = gramos totales < 80 % de la media del mismo momento (umbral de este informe). «En mínimo» = algún ingrediente ajustable queda en su mínimo (no puede bajar más).

| Momento | Platos | Media g | Mediana g | Mín–máx g | Pequeños (<80 % de la media) | Con ingrediente en mínimo | Desvío medio kcal vs objetivo |
|---|---|---|---|---|---|---|---|
| comida | 174 | 481.1 | 461 | 217–1095 | 52 | 52 | 7.9 |
| cena | 147 | 423.4 | 395 | 153–861 | 49 | 65 | 24.3 |

Por familia: gramos medios (comida · cena) y nº de platos pequeños / total:

| Familia | g medios comida | g medios cena | Pequeños comida / total | Pequeños cena / total |
|---|---|---|---|---|
| ave | 471.4 | 405.2 | 12 / 38 | 15 / 37 |
| carne | 497 | 364.3 | 6 / 25 | 11 / 23 |
| cereal | 514.3 | 505.8 | 1 / 11 | 1 / 4 |
| huevo | 524.9 | 459.8 | 2 / 8 | 6 / 17 |
| legumbre | 386.8 | — | 15 / 23 | 0 / 0 |
| marisco | 431 | 368.6 | 3 / 12 | 1 / 7 |
| pescado | 494.1 | 362.8 | 12 / 38 | 13 / 25 |
| vegetal | 561.6 | 511 | 1 / 19 | 2 / 34 |

Por estructura:

| Estructura | g medios comida | g medios cena | Pequeños comida / total | Pequeños cena / total |
|---|---|---|---|---|
| plato único | 402.9 | 467.3 | 34 / 57 | 3 / 12 |
| con segundo | 455.7 | 347.1 | 12 / 43 | 39 / 71 |
| redactado | 556.1 | 499.8 | 6 / 74 | 7 / 64 |

Los 20 platos con menos gramos en comida a 1434 kcal (media del momento 481.1 g):

| Plato | Familia | Estructura | Gramos | % de la media | kcal final / obj. | Prot final / obj. | En mínimo | Extra |
|---|---|---|---|---|---|---|---|---|
| Pasta integral al ajillo con huevos | huevo | plato único | 217 | 45 % | 552/538 | 25/39 | pasta_integral_seco | — |
| Fabada asturiana simplificada | legumbre | redactado | 220 | 46 % | 541/538 | 32/39 | morcilla | — |
| Pasta carbonara | cereal | redactado | 244 | 51 % | 536/538 | 31/39 | — | — |
| Garbanzos con pimentón con zanahoria | legumbre | plato único | 274 | 57 % | 531/538 | 22/39 | — | — |
| Lentejas con pimentón con zanahoria | legumbre | plato único | 279 | 58 % | 520/538 | 29/39 | — | — |
| Lentejas con arroz y zanahoria guisado | legumbre | plato único | 279 | 58 % | 530/538 | 21/39 | — | — |
| Carpaccio de ternera con rúcula, parmesano y pan | carne | redactado | 289 | 60 % | 551/538 | 43/39 | — | — |
| Garbanzos al ajillo con tomate cherry | legumbre | plato único | 299 | 62 % | 522/538 | 22/39 | — | — |
| Garbanzos con pimentón con espinacas | legumbre | plato único | 309 | 64 % | 528/538 | 24/39 | — | — |
| Lentejas con pimentón con espinacas | legumbre | plato único | 314 | 65 % | 517/538 | 31/39 | — | — |
| Garbanzos con pimientos guisado | legumbre | plato único | 319 | 66 % | 524/538 | 22/39 | — | — |
| Pasta integral con proteína con salmón | pescado | plato único | 324 | 67 % | 534/538 | 35/39 | — | — |
| Garbanzos al curry con brócoli | legumbre | plato único | 329 | 68 % | 536/538 | 25/39 | — | — |
| Lentejas con pimentón con pimientos | legumbre | plato único | 329 | 68 % | 530/538 | 30/39 | — | — |
| Pechuga de pollo salteado con pimentón ahumado y ajo con tom | ave | con segundo | 334 | 69 % | 557/538 | 40/39 | — | — |
| Pasta integral al ajillo con pechuga de pollo | ave | plato único | 334 | 69 % | 552/538 | 40/39 | — | — |
| Pasta integral con proteína con pechuga de pollo | ave | plato único | 334 | 69 % | 546/538 | 39/39 | — | — |
| Bowl de curry de pechuga de pollo con quinoa | ave | plato único | 339 | 70 % | 525/538 | 41/39 | — | — |
| Atún en conserva en crudo con limón, orégano y ajo con tomat | pescado | con segundo | 339 | 70 % | 548/538 | 39/39 | — | — |
| Bowl mediterráneo de pechuga de pollo con quinoa | ave | plato único | 339 | 70 % | 529/538 | 41/39 | — | — |

Los 20 platos con menos gramos en cena a 1434 kcal (media del momento 423.4 g):

| Plato | Familia | Estructura | Gramos | % de la media | kcal final / obj. | Prot final / obj. | En mínimo | Extra |
|---|---|---|---|---|---|---|---|---|
| Sopa castellana con jamón serrano y huevo pochado | carne | redactado | 153 | 36 % | 402/394 | 28/29 | pan_blanco+aove | — |
| Salmón a la plancha con limón, orégano y ajo con espárragos | pescado | con segundo | 279 | 66 % | 409/394 | 29/29 | — | — |
| Lomo de cerdo al horno con mostaza y miel con col de brusela | carne | con segundo | 281 | 66 % | 398/394 | 29/29 | — | — |
| Pechuga de pollo a la plancha con ajo, perejil y guindilla c | ave | con segundo | 284 | 67 % | 394/394 | 29/29 | — | pan_integral |
| Pechuga de pollo al horno con romero, limón y ajo con col de | ave | con segundo | 284 | 67 % | 411/394 | 30/29 | pollo_pechuga | pan_integral |
| Salmón al horno con limón, orégano y ajo con espinacas | pescado | con segundo | 284 | 67 % | 415/394 | 29/29 | — | — |
| Atún en conserva en crudo con vinagre de Módena y mostaza co | pescado | con segundo | 284 | 67 % | 396/394 | 29/29 | — | pan_integral |
| Pechuga de pollo al horno con hierbas provenzales con puerro | ave | con segundo | 284 | 67 % | 407/394 | 29/29 | — | pan_integral |
| Huevos en tortilla con pimentón ahumado y ajo con zanahoria | huevo | con segundo | 289 | 68 % | 388/394 | 24/29 | pan_integral | pan_integral |
| Ternera magra a la plancha con ajo, perejil y guindilla con  | carne | con segundo | 289 | 68 % | 358/382 | 28/29 | — | pan_integral |
| Pechuga de pollo salteado con hierbas provenzales con champi | ave | con segundo | 289 | 68 % | 405/394 | 29/29 | — | pan_integral |
| Ternera magra a la plancha con ajo, perejil y guindilla con  | carne | con segundo | 289 | 68 % | 412/394 | 27/29 | — | — |
| Conejo al horno con ajo, perejil y guindilla con champiñones | carne | con segundo | 290 | 68 % | 383/394 | 29/29 | arroz_seco | — |
| Sardinas a la plancha con ajo, perejil y guindilla con tomat | pescado | con segundo | 293 | 69 % | 417/394 | 29/29 | — | — |
| Pechuga de pollo a la plancha con limón, orégano y ajo con b | ave | con segundo | 294 | 69 % | 407/394 | 28/29 | — | — |
| Pechuga de pollo a la plancha con pimentón ahumado y ajo con | ave | con segundo | 294 | 69 % | 407/394 | 28/29 | — | — |
| Salmón al horno con limón, orégano y ajo con espárragos y ar | pescado | con segundo | 295 | 70 % | 448/376 | 29/29 | arroz_seco+aove | — |
| Mejillones en salsa verde con pan de pueblo | marisco | redactado | 297 | 70 % | 420/394 | 29/29 | — | — |
| Ternera magra a la plancha con ajo, perejil y guindilla con  | carne | con segundo | 299 | 71 % | 417/394 | 29/29 | — | pan_integral |
| Huevos revuelto con ajo, perejil y guindilla con espinacas | huevo | con segundo | 303 | 72 % | 398/394 | 23/29 | — | — |

