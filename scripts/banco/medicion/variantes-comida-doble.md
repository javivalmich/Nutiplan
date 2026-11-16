# Variantes de la comida doble: aceite y elección del primero

Salida de `resumenVariantesComidaDoble.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`), con las variantes aplicadas en memoria por `variantesComidaDoble.mjs` (sin tocar `src/`). «Motor actual» es esta rama tal cual. Planes que no son de engine2: actual 0 · tope 0 · topeSegundo 0 · topeSegundo10 0 · noUsados 0 · noUsadosPrimeros 0.

## Lectura y recomendaciones

### 1. Aceite

- **Lo pedido funciona** (aceite con tope; lo que falta, primero legumbre hasta su tope, luego el segundo dentro de su rango y luego pan o fruta). En los 9 perfiles con comida doble, frente al motor actual:
  - aceite de la comida doble, 32,7 → 19,7 ml de media (máximo 40 → 20);
  - aceite del día, 43,4 → 37,8 ml (máximo 80 → 60, el de `ba52d21`);
  - comidas dobles fuera de ±5 % de kcal, 134 → 22; cortas de proteína, 13 → 0;
  - proteína del día, 103,8 → 105,9 %; legumbre en seco, 80 → 105 g (mediana); segundo, 145 → 140 g;
  - con pan o fruta, 20 → 32 %.
- **Sin crecer el segundo no vale:** a 3714 kcal deja 138 de 608 comidas dobles fuera de ±5 % (23 %), y el pan o la fruta salen en el 41 % de todas.
- **Coste a 3714 kcal:** el segundo llega a su máximo (300 g, mediana), la legumbre a 120 g en seco y lleva pan en el 100 % de los casos; la proteína de esa comida queda en el 135 % de su objetivo.
- **Reparto del aceite:** con 5 ml en el primero y 15 en el segundo, 22 fuera de ±5 %; con 10 y 10, 32. La diferencia está solo a 1434 kcal (15 frente a 25 de 605); el resto de cifras son iguales.

**Recomendación:** la variante pedida, con el aceite repartido 10 y 10. Es un criterio de cocina, no de cifras: el primero es un guiso que pocha la cebolla en el aceite, y 5 ml se quedan cortos; el segundo es una plancha o un horno. Si prefieres la cifra, 5 y 15 deja 10 comidas menos fuera de ±5 % a 1434 kcal.

**Qué habría que tocar:**
- `src/plan/racionesApp.js` (`extraDoble`): cada aceite de la comida doble con su máximo (10 g cada uno; los dos juntos, el máximo de un plato único).
- `src/engine2/nutrientes/raciones.js` (`ajustarComida`): un paso nuevo, después del reparto y antes de las medidas de casa. Si no queda ningún energético libre y faltan kcal, crece el proteico que quien llama marque (el del segundo) hasta su máximo, con su causa en el log de las raciones. Cambia lo que D-116.6 dejó escrito («los proteicos se dimensionan con la legumbre a su cantidad de partida»): necesita tu asiento.
- Tests: `racionesDoble.test.js` (aceite como mucho 20 ml, legumbre como mucho su tope, segundo dentro de su rango, comidas fuera de ±5 %).
- Línea base del banco regenerada, y `control-src-plan.md` y `aceite-primeros.md` medidos de nuevo.

### 2. Primeros

**Por qué «lentejas con pimentón» es el 35 %.** No es un filtro que pierda a los demás, son tres cosas juntas (evidencia en 2.1, 4648 comidas de día sorteado):

1. **Composición.** De los 14 primeros, 3 son del ancla y nunca están en el pool del walk (línea 498, `d.rol === 'rotativo'`). De los 11 rotativos, 3 son lentejas con pimentón y ajo: el 27 % de partida. La cifra del 35 % (1816 de 5214) agrupaba los 4 platos con esa legumbre y ese aliño, incluido el del ancla.
2. **El tope del ajillo.** Los 4 rotativos al ajillo los quita el filtro de aliño (líneas 615 a 625) 6773 veces, siempre por el tope de 2 ajillos por semana (`TOPE_AJILLO_SEMANA`, `alinosD105.js:42`). En 2519 de las 4648 comidas el ajillo ya había salido 2 veces esa semana. Lo gastan, a partes casi iguales, comidas de plato único, primeros, segundos (8 de los 23 son al ajillo) y cenas: 0,5 a 0,6 por semana cada uno. Por eso cada plato al ajillo sale en el 3 al 7 % de las comidas, frente al 10 al 14 % de los demás.
3. **El paso 5 (identidad de verdura, línea 746).** Quita los dos primeros con espinacas en el 38 y el 37 % de las comidas en que estaban en el pool (1175 de 3109 y 1080 de 2906), frente al 1 al 30 % de los demás. *Hipótesis, sin medir:* la espinaca ya sale mucho en la semana (3 segundos y varias cenas la llevan) y su coste de repetición es mayor. El registro no guarda ese coste.

Tope, separación, familia y preferencias A y B quitan poco: menos de un 8 % cada uno. Entre los que llegan al desempate (3,8 candidatos de media), el RNG reparte de forma pareja.

**Variante (legumbre y aliño no usados).** La versión «aliño no usado por otro primero» es la que funciona. En los 8 perfiles omnívoros:
- repiten legumbre, 83 → 63 % de las semanas; aliño, 63 → 52 %; el mismo guiso, 27 → 16 %;
- días sorteados sin legumbre, 2,7 → 0,9 por cada 100 semanas;
- infracciones de D-099.3, 0; semanas con la red, igual; proteína y comidas cortas, igual.
- Sin pescado ni marisco: repite guiso 40 → 32 %, 2 infracciones (como hoy) y la red en 64 semanas (63 hoy).

La versión «aliño no usado en la semana» casi no cambia el aliño (63 → 62 %), porque el pimentón y el ajillo ya salen en otros platos (se relaja 2252 veces). En el perfil sin pescado empeora: 4 infracciones, la red en 69 semanas y 3,37 comidas cortas por semana frente a 3,15.

Ninguna de las dos cambia el reparto de los 14 primeros: lentejas con pimentón sigue en el 35 %. Eso depende del catálogo y del tope del ajillo, no de la elección.

**Recomendación:** la variante con la legumbre no usada en la semana y el aliño no usado por otro primero. Si además quieres repartir mejor los 14, la palanca es el catálogo (más primeros sin ajillo y con otras legumbres) o que los segundos no gasten el tope del ajillo. Eso lo decides tú; no lo he medido.

**Qué habría que tocar:**
- `src/engine2/walk/runWalk.js`, en la rama del nivel de legumbre (línea 648, después de `candidatesA = nivel;`): dos filtros con vuelta atrás. Primero la legumbre (con `proteinaCache`) que no salga en los platos ya servidos de la semana; después el aliño (con `alinoDe`) que no lleve ningún otro primero ya colocado. Cada uno con su causa en el log (`primero_legumbre_no_usada`, `primero_alino_no_usado` y sus `_sin_aplicar`). Sin pesos.
- Tests en `src/engine2/walk/tests`: el primero no repite legumbre ni aliño cuando hay otro candidato, se relaja cuando no lo hay y deja su causa, y misma semilla da el mismo plan.
- Línea base regenerada. Es un cambio en D-117.2 (el orden dentro del nivel): necesita tu asiento.

## 1. Aceite de la comida doble

Aceite en ml (AOVE y aceite de semillas de la compra; sin cantidad, 10 ml); el día no incluye la comida libre del sábado. «Fuera de ±5 %» y «cortas» son comidas dobles frente al objetivo de su comida (kcal) y al 95 % de su objetivo de proteína. Legumbre en seco y segundo (el proteico del segundo plato), en gramos, medianas.

### omni-1434

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 18,1 (25,0) | 27,5 (50,0) | 605 | 86 (14 %) | 13 | 2,37 | 100,3 % | 100 % | 50,0 | 95,0 | 6 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 17,4 (20,0) | 27,2 (45,0) | 605 | 17 (3 %) | 0 | 2,31 | 100,6 % | 100 % | 50,0 | 100,0 | 0 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 17,3 (20,0) | 27,1 (45,0) | 605 | 15 (2 %) | 0 | 2,30 | 100,9 % | 103 % | 50,0 | 100,0 | 0 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 17,5 (20,0) | 27,2 (45,0) | 605 | 25 (4 %) | 0 | 2,30 | 100,9 % | 103 % | 50,0 | 100,0 | 0 % | 0 |

### omni-2174

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 33,0 (40,0) | 44,5 (75,0) | 608 | 0 (0 %) | 0 | 1,61 | 103,7 % | 110 % | 75,0 | 160,0 | 0 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 38,0 (60,0) | 608 | 0 (0 %) | 0 | 1,61 | 105,5 % | 120 % | 95,0 | 160,0 | 29 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 38,0 (60,0) | 608 | 0 (0 %) | 0 | 1,61 | 105,7 % | 120 % | 100,0 | 160,0 | 24 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 38,0 (60,0) | 608 | 0 (0 %) | 0 | 1,61 | 105,7 % | 120 % | 100,0 | 160,0 | 24 % | 0 |

### omni-2600-3comidas

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 37,2 (40,0) | 51,4 (80,0) | 597 | 3 (1 %) | 0 | 1,32 | 110,3 % | 123 % | 90,0 | 150,0 | 74 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 42,9 (60,0) | 597 | 4 (1 %) | 0 | 1,33 | 110,6 % | 123 % | 90,0 | 140,0 | 100 % | 1 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 42,9 (60,0) | 597 | 0 (0 %) | 0 | 1,32 | 112,3 % | 125 % | 105,0 | 150,0 | 74 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 42,9 (60,0) | 597 | 0 (0 %) | 0 | 1,32 | 112,3 % | 125 % | 105,0 | 150,0 | 74 % | 0 |

### omni-3714

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 39,3 (40,0) | 53,2 (80,0) | 608 | 20 (3 %) | 0 | 2,72 | 105,5 % | 122 % | 105,0 | 260,0 | 90 % | 1 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 43,4 (60,0) | 608 | 138 (23 %) | 0 | 2,72 | 105,3 % | 123 % | 110,0 | 255,0 | 100 % | 1 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 43,5 (60,0) | 608 | 1 (0 %) | 0 | 2,72 | 108,5 % | 135 % | 120,0 | 300,0 | 100 % | 1 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 43,5 (60,0) | 608 | 1 (0 %) | 0 | 2,72 | 108,5 % | 135 % | 120,0 | 300,0 | 100 % | 1 |

### celiaco-2400

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 36,9 (40,0) | 49,8 (80,0) | 602 | 0 (0 %) | 0 | 1,52 | 103,7 % | 117 % | 95,0 | 160,0 | 0 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 41,3 (60,0) | 602 | 0 (0 %) | 0 | 1,52 | 103,3 % | 114 % | 80,0 | 150,0 | 79 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 41,3 (60,0) | 602 | 0 (0 %) | 0 | 1,52 | 107,0 % | 128 % | 110,0 | 190,0 | 33 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 41,3 (60,0) | 602 | 0 (0 %) | 0 | 1,52 | 107,0 % | 128 % | 110,0 | 190,0 | 33 % | 0 |

### sin-lactosa-2000

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 32,7 (35,0) | 43,7 (75,0) | 604 | 7 (1 %) | 0 | 1,53 | 105,2 % | 111 % | 70,0 | 120,0 | 2 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 37,3 (60,0) | 604 | 2 (0 %) | 0 | 1,53 | 108,3 % | 126 % | 105,0 | 120,0 | 6 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 37,3 (60,0) | 604 | 2 (0 %) | 0 | 1,53 | 108,3 % | 126 % | 105,0 | 120,0 | 6 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 37,3 (60,0) | 604 | 2 (0 %) | 0 | 1,53 | 108,3 % | 126 % | 105,0 | 120,0 | 6 % | 0 |

### sin-pescado-2000

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 32,6 (35,0) | 41,1 (75,0) | 431 | 7 (2 %) | 0 | 3,15 | 102,3 % | 111 % | 70,0 | 125,0 | 1 % | 1 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 36,6 (60,0) | 431 | 1 (0 %) | 0 | 3,14 | 104,4 % | 124 % | 105,0 | 125,0 | 8 % | 1 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 36,6 (60,0) | 431 | 1 (0 %) | 0 | 3,14 | 104,4 % | 124 % | 105,0 | 125,0 | 8 % | 1 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 36,6 (60,0) | 431 | 1 (0 %) | 0 | 3,14 | 104,4 % | 124 % | 105,0 | 125,0 | 8 % | 1 |

### omni-2174-ancla

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 32,6 (40,0) | 42,4 (75,0) | 548 | 1 (0 %) | 0 | 1,80 | 103,0 % | 110 % | 75,0 | 165,0 | 0 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 36,7 (60,0) | 548 | 1 (0 %) | 0 | 1,80 | 104,6 % | 118 % | 90,0 | 160,0 | 30 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 36,7 (60,0) | 548 | 0 (0 %) | 0 | 1,80 | 105,0 % | 120 % | 100,0 | 165,0 | 21 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 36,7 (60,0) | 548 | 0 (0 %) | 0 | 1,80 | 105,0 % | 120 % | 100,0 | 165,0 | 21 % | 0 |

### omni-2000-sin-atun

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 32,4 (35,0) | 43,4 (75,0) | 611 | 10 (2 %) | 0 | 1,93 | 104,6 % | 111 % | 70,0 | 120,0 | 1 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 20,0 (20,0) | 37,1 (60,0) | 611 | 3 (0 %) | 0 | 1,94 | 107,5 % | 124 % | 105,0 | 120,0 | 10 % | 0 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 20,0 (20,0) | 37,1 (60,0) | 611 | 3 (0 %) | 0 | 1,94 | 107,5 % | 124 % | 105,0 | 120,0 | 10 % | 0 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 20,0 (20,0) | 37,1 (60,0) | 611 | 3 (0 %) | 0 | 1,94 | 107,5 % | 124 % | 105,0 | 120,0 | 10 % | 0 |

### Todos los perfiles con comida doble

| Variante | Doble: ml media (máx.) | Día: ml media (máx.) | Dobles | Fuera de ±5 % de kcal | Cortas de proteína | Comidas y cenas cortas/sem | Proteína del día | Doble: proteína / objetivo (mediana) | Legumbre (g) | Segundo (g) | Con pan o fruta | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 32,7 (40,0) | 43,4 (80,0) | 5214 | 134 (3 %) | 13 | 1,98 | 103,8 % | 112 % | 80,0 | 145,0 | 20 % | 2 |
| Aceite con tope (5 + 15); falta: legumbre y pan o fruta | 19,7 (20,0) | 37,8 (60,0) | 5214 | 166 (3 %) | 0 | 1,98 | 104,9 % | 120 % | 95,0 | 135,0 | 41 % | 3 |
| Aceite con tope (5 + 15); falta: legumbre, segundo y pan o fruta (pedida) | 19,7 (20,0) | 37,8 (60,0) | 5214 | 22 (0 %) | 0 | 1,97 | 105,9 % | 124 % | 105,0 | 140,0 | 32 % | 2 |
| Aceite con tope (10 + 10); falta: legumbre, segundo y pan o fruta | 19,7 (20,0) | 37,8 (60,0) | 5214 | 32 (1 %) | 0 | 1,97 | 105,9 % | 124 % | 105,0 | 140,0 | 32 % | 2 |

## 2. Los primeros de la semana

### 2.1 Diagnóstico: dónde se pierden los primeros

Registro de `runWalk.js` (motor actual, sin cambios), en cada comida de un día sorteado que llegó al nivel de legumbre (línea 645, `candidatesA.filter(esCompuestoLegumbre)`): qué compuestos de legumbre quedan tras cada filtro. Las líneas son las de `src/engine2/walk/runWalk.js`: pool 498, tope 534, separación 553, familia 582, aliño 622 y 636, nivel 645 y preferencia A 657, preferencia B 680, paso 5 746 (`chooseIdentityLevel`) y desempate con RNG 759. Si un walk se repite (red de familia), cuenta el último.

**20 semanas de ejemplo (omni-2174, semanas 60 a 79): 60 comidas de día sorteado.** Media de compuestos de legumbre que quedan tras cada filtro, y en cuántas comidas queda cada primero:

| Primero | Pool (rotativo, sin usar, no vetado, no de la semana anterior) | Tope de proteína (2 por especie) | Proteína separada (mismo día o al lado) | Familia en días seguidos | Aliño (mismo día; ajillo 2 por semana) | Nivel de legumbre y preferencia A | Preferencia B | Paso 5 (identidad de verdura) | Elegido |
|---|---|---|---|---|---|---|---|---|---|
| **Media de candidatos** | 7,2 | 6,9 | 6,9 | 6,9 | 5,3 | 5,3 | 5,2 | 4,0 | — |
| Lentejas con pimentón con zanahoria | 37 | 37 | 37 | 37 | 37 | 37 | 36 | 30 | 7 |
| Garbanzos con pimentón con espinacas | 54 | 50 | 50 | 50 | 50 | 50 | 49 | 26 | 2 |
| Alubias blancas al ajillo con pimientos | 45 | 45 | 45 | 45 | 20 | 20 | 19 | 17 | 3 |
| Garbanzos al curry con brócoli | 37 | 36 | 36 | 36 | 36 | 36 | 35 | 28 | 6 |
| Lentejas guisadas con arroz y zanahoria (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lentejas con pimentón con espinacas | 30 | 27 | 27 | 27 | 27 | 27 | 27 | 16 | 8 |
| Lentejas con pimentón con pimientos | 31 | 30 | 30 | 30 | 30 | 30 | 29 | 21 | 8 |
| Lentejas al ajillo con calabacín | 55 | 53 | 53 | 53 | 26 | 26 | 25 | 14 | 1 |
| Garbanzos con pimentón con zanahoria | 29 | 26 | 26 | 26 | 26 | 26 | 25 | 24 | 8 |
| Garbanzos al ajillo con tomate cherry | 43 | 40 | 40 | 40 | 22 | 22 | 22 | 18 | 4 |
| Garbanzos guisados con pimientos (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Alubias blancas al ajillo con acelgas | 46 | 46 | 46 | 46 | 22 | 22 | 22 | 22 | 3 |
| Garbanzos salteados con berenjena (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Garbanzos estofados con alcachofas | 22 | 22 | 22 | 22 | 22 | 22 | 22 | 21 | 10 |

**Los 8 perfiles omnívoros sin SIBO, 200 semanas: 4648 comidas de día sorteado.**

| Primero | Pool (rotativo, sin usar, no vetado, no de la semana anterior) | Tope de proteína (2 por especie) | Proteína separada (mismo día o al lado) | Familia en días seguidos | Aliño (mismo día; ajillo 2 por semana) | Nivel de legumbre y preferencia A | Preferencia B | Paso 5 (identidad de verdura) | Elegido |
|---|---|---|---|---|---|---|---|---|---|
| **Media de candidatos** | 7,0 | 6,8 | 6,7 | 6,7 | 5,3 | 5,3 | 5,1 | 3,8 | — |
| Lentejas con pimentón con zanahoria | 2363 | 2340 | 2337 | 2337 | 2337 | 2337 | 2292 | 1864 | 603 |
| Garbanzos con pimentón con espinacas | 3109 | 2912 | 2893 | 2893 | 2893 | 2893 | 2831 | 1656 | 399 |
| Alubias blancas al ajillo con pimientos | 3635 | 3618 | 3574 | 3574 | 1770 | 1770 | 1732 | 1286 | 204 |
| Garbanzos al curry con brócoli | 2529 | 2406 | 2393 | 2393 | 2393 | 2393 | 2238 | 1778 | 539 |
| Lentejas guisadas con arroz y zanahoria (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lentejas con pimentón con espinacas | 2906 | 2851 | 2846 | 2846 | 2846 | 2846 | 2790 | 1710 | 480 |
| Lentejas con pimentón con pimientos | 2631 | 2587 | 2583 | 2583 | 2583 | 2583 | 2536 | 1738 | 547 |
| Lentejas al ajillo con calabacín | 3718 | 3633 | 3627 | 3627 | 1822 | 1822 | 1786 | 1242 | 198 |
| Garbanzos con pimentón con zanahoria | 2646 | 2516 | 2505 | 2505 | 2505 | 2505 | 2456 | 1960 | 508 |
| Garbanzos al ajillo con tomate cherry | 3680 | 3430 | 3410 | 3410 | 1758 | 1758 | 1650 | 1260 | 211 |
| Garbanzos guisados con pimientos (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Alubias blancas al ajillo con acelgas | 3191 | 3179 | 3146 | 3146 | 1634 | 1634 | 1605 | 1583 | 313 |
| Garbanzos salteados con berenjena (ancla) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Garbanzos estofados con alcachofas | 2166 | 2064 | 2058 | 2058 | 2058 | 2058 | 2015 | 1800 | 646 |

Dónde se pierde cada primero (de las comidas en que estaba en el pool, en cuántas lo quita cada filtro), 8 perfiles omnívoros:

| Primero | En el pool | Lo quita: Tope de proteína (2 por especie) | Lo quita: Proteína separada (mismo día o al lado) | Lo quita: Familia en días seguidos | Lo quita: Aliño (mismo día; ajillo 2 por semana) | Lo quita: Nivel de legumbre y preferencia A | Lo quita: Preferencia B | Lo quita: Paso 5 (identidad de verdura) | Llega al RNG | Elegido | Elegido cuando llega al RNG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lentejas con pimentón con zanahoria | 2363 | 23 | 3 | 0 | 0 | 0 | 45 | 428 | 1864 | 603 | 32 % |
| Garbanzos con pimentón con espinacas | 3109 | 197 | 19 | 0 | 0 | 0 | 62 | 1175 | 1656 | 399 | 24 % |
| Alubias blancas al ajillo con pimientos | 3635 | 17 | 44 | 0 | 1804 | 0 | 38 | 446 | 1286 | 204 | 16 % |
| Garbanzos al curry con brócoli | 2529 | 123 | 13 | 0 | 0 | 0 | 155 | 460 | 1778 | 539 | 30 % |
| Lentejas con pimentón con espinacas | 2906 | 55 | 5 | 0 | 0 | 0 | 56 | 1080 | 1710 | 480 | 28 % |
| Lentejas con pimentón con pimientos | 2631 | 44 | 4 | 0 | 0 | 0 | 47 | 798 | 1738 | 547 | 31 % |
| Lentejas al ajillo con calabacín | 3718 | 85 | 6 | 0 | 1805 | 0 | 36 | 544 | 1242 | 198 | 16 % |
| Garbanzos con pimentón con zanahoria | 2646 | 130 | 11 | 0 | 0 | 0 | 49 | 496 | 1960 | 508 | 26 % |
| Garbanzos al ajillo con tomate cherry | 3680 | 250 | 20 | 0 | 1652 | 0 | 108 | 390 | 1260 | 211 | 17 % |
| Alubias blancas al ajillo con acelgas | 3191 | 12 | 33 | 0 | 1512 | 0 | 29 | 22 | 1583 | 313 | 20 % |
| Garbanzos estofados con alcachofas | 2166 | 102 | 6 | 0 | 0 | 0 | 43 | 215 | 1800 | 646 | 36 % |

Los 4 primeros al ajillo los quita el filtro de aliño (líneas 615 a 625) 6773 veces: 6773 por el tope de 2 ajillos por semana (`TOPE_AJILLO_SEMANA`, `alinosD105.js:42`), 0 porque ese día ya sale un ajillo y 0 por las dos cosas. En las comidas de día sorteado, el ajillo ya había salido 2 veces en la semana en 2519 de 4648.
Quién gasta los ajillos (platos al ajillo servidos por semana, motor actual, 8 perfiles omnívoros): comida de plato único 0,51, primero 0,61, segundo 0,47, cena 0,59. De los 23 segundos posibles, 8 son al ajillo.

En el pool, cada primero rotativo está entre 2166 y 3718 de 4648 comidas. Los 3 primeros del ancla (rol «ancla») nunca están en el pool del walk: solo los coloca el ancla.

### 2.2 Variante: legumbre y aliño no usados al elegir el primero

En la comida de un día sorteado, dentro del nivel de legumbre y antes de las preferencias A y B, se prefiere un primero cuya legumbre no salga ya en la semana (en ningún plato servido) y, después, uno cuyo aliño no salga ya: en la variante «no usados en la semana», en ningún plato servido (segundos incluidos); en la otra, en ningún otro primero. Cada preferencia se relaja si dejaría el hueco sin candidatos y lo dice en el log (`primero_legumbre_no_usada`, `primero_alino_no_usado` y sus `_sin_aplicar`). Sin pesos.

**Los 8 perfiles omnívoros sin SIBO**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 1599 | 1327 (83 %) | 1006 (63 %) | 434 (27 %) | 2,99 | 3,02 | 2,7 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,85 | 104,5 % | 0,15 |
| Legumbre y aliño no usados en la semana | 1598 | 1100 (69 %) | 995 (62 %) | 353 (22 %) | 3,00 | 3,03 | 1,9 | 0 | 0 / 0 | 1750 / 1095 | 1317 / 2252 | 1,88 | 104,5 % | 0,14 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 1598 | 1005 (63 %) | 838 (52 %) | 250 (16 %) | 3,01 | 3,04 | 0,9 | 0 | 0 / 0 | 1792 / 1010 | 1272 / 882 | 1,85 | 104,6 % | 0,13 |

**omni-1434**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 174 (87 %) | 138 (69 %) | 61 (31 %) | 3,02 | 3,02 | 1,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 2,37 | 100,3 % | 0,13 |
| Legumbre y aliño no usados en la semana | 200 | 141 (71 %) | 123 (62 %) | 37 (19 %) | 3,04 | 3,04 | 1,0 | 0 | 0 / 0 | 230 / 139 | 154 / 286 | 2,40 | 100,3 % | 0,07 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 133 (67 %) | 106 (53 %) | 34 (17 %) | 3,04 | 3,04 | 2,0 | 0 | 0 / 0 | 229 / 133 | 165 / 114 | 2,46 | 100,4 % | 0,11 |

**omni-2174**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 172 (86 %) | 123 (62 %) | 56 (28 %) | 3,04 | 3,04 | 1,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,61 | 103,7 % | 0,13 |
| Legumbre y aliño no usados en la semana | 200 | 147 (74 %) | 129 (65 %) | 50 (25 %) | 3,04 | 3,04 | 3,0 | 0 | 0 / 0 | 220 / 147 | 157 / 279 | 1,74 | 103,4 % | 0,15 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 127 (64 %) | 100 (50 %) | 31 (16 %) | 3,05 | 3,05 | 0,5 | 0 | 0 / 0 | 237 / 130 | 166 / 109 | 1,60 | 103,6 % | 0,14 |

**omni-2600-3comidas**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 179 (90 %) | 123 (62 %) | 60 (30 %) | 2,98 | 2,98 | 3,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,32 | 110,3 % | 0,12 |
| Legumbre y aliño no usados en la semana | 200 | 138 (69 %) | 125 (63 %) | 44 (22 %) | 3,02 | 3,02 | 1,0 | 0 | 0 / 0 | 225 / 135 | 175 / 272 | 1,30 | 110,2 % | 0,10 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 129 (65 %) | 105 (53 %) | 35 (18 %) | 3,03 | 3,03 | 0,5 | 0 | 0 / 0 | 230 / 131 | 165 / 112 | 1,38 | 110,2 % | 0,09 |

**omni-3714**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 168 (84 %) | 129 (65 %) | 52 (26 %) | 3,04 | 3,04 | 1,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 2,72 | 105,5 % | 0,13 |
| Legumbre y aliño no usados en la semana | 200 | 142 (71 %) | 134 (67 %) | 44 (22 %) | 3,02 | 3,02 | 2,0 | 0 | 0 / 0 | 234 / 140 | 170 / 277 | 2,83 | 105,2 % | 0,11 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 131 (66 %) | 101 (51 %) | 26 (13 %) | 3,04 | 3,04 | 0,0 | 0 | 0 / 0 | 232 / 130 | 170 / 103 | 2,65 | 105,6 % | 0,10 |

**celiaco-2400**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 171 (86 %) | 131 (66 %) | 54 (27 %) | 3,01 | 3,01 | 3,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,52 | 103,7 % | 0,20 |
| Legumbre y aliño no usados en la semana | 200 | 147 (74 %) | 138 (69 %) | 56 (28 %) | 3,03 | 3,03 | 1,5 | 0 | 0 / 0 | 214 / 148 | 162 / 297 | 1,49 | 103,6 % | 0,14 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 134 (67 %) | 117 (59 %) | 37 (19 %) | 3,04 | 3,04 | 1,5 | 0 | 0 / 0 | 225 / 136 | 153 / 125 | 1,47 | 103,7 % | 0,13 |

**sin-lactosa-2000**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 167 (84 %) | 123 (62 %) | 45 (23 %) | 3,02 | 3,02 | 2,0 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,53 | 105,2 % | 0,09 |
| Legumbre y aliño no usados en la semana | 200 | 137 (69 %) | 127 (64 %) | 47 (24 %) | 3,00 | 3,00 | 5,0 | 0 | 0 / 0 | 213 / 134 | 160 / 280 | 1,48 | 105,4 % | 0,12 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 130 (65 %) | 111 (56 %) | 29 (15 %) | 3,02 | 3,02 | 0,5 | 0 | 0 / 0 | 225 / 131 | 145 / 115 | 1,50 | 105,3 % | 0,08 |

**sin-pescado-2000**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 137 | 120 (88 %) | 100 (73 %) | 55 (40 %) | 2,15 | 2,83 | 5,5 | 2 | 63 / 0 | 0 / 0 | 0 / 0 | 3,15 | 102,3 % | 1,92 |
| Legumbre y aliño no usados en la semana | 131 | 100 (76 %) | 89 (68 %) | 46 (35 %) | 2,02 | 2,81 | 6,0 | 4 | 69 / 0 | 137 / 97 | 94 / 181 | 3,37 | 101,8 % | 2,12 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 136 | 103 (76 %) | 74 (54 %) | 43 (32 %) | 2,13 | 2,77 | 4,5 | 2 | 64 / 0 | 141 / 97 | 112 / 74 | 3,18 | 102,2 % | 2,10 |

**omni-2174-ancla**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 199 | 128 (64 %) | 109 (55 %) | 44 (22 %) | 2,74 | 3,01 | 3,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,80 | 103,0 % | 0,30 |
| Legumbre y aliño no usados en la semana | 198 | 109 (55 %) | 97 (49 %) | 26 (13 %) | 2,75 | 3,02 | 1,0 | 0 | 0 / 0 | 186 / 111 | 181 / 277 | 1,87 | 102,9 % | 0,33 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 198 | 94 (47 %) | 88 (44 %) | 27 (14 %) | 2,78 | 3,04 | 0,5 | 0 | 0 / 0 | 188 / 94 | 128 / 90 | 1,77 | 103,2 % | 0,35 |

**omni-2000-sin-atun**

| Variante | Semanas con 2 o más primeros | Repiten legumbre | Repiten aliño | Repiten guiso (legumbre y aliño) | Comidas dobles/sem | Legumbre/sem | Día sorteado sin legumbre /100 sem | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Legumbre no usada: aplicada / sin aplicar | Aliño no usado: aplicada / sin aplicar | Comidas y cenas cortas/sem | Proteína del día | Familia en días seguidos/sem |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual | 200 | 168 (84 %) | 130 (65 %) | 62 (31 %) | 3,06 | 3,06 | 4,5 | 0 | 0 / 0 | 0 / 0 | 0 / 0 | 1,93 | 104,6 % | 0,10 |
| Legumbre y aliño no usados en la semana | 200 | 139 (70 %) | 122 (61 %) | 49 (25 %) | 3,06 | 3,06 | 1,0 | 0 | 0 / 0 | 228 / 141 | 158 / 284 | 1,93 | 104,8 % | 0,09 |
| Legumbre no usada en la semana y aliño no usado por otro primero | 200 | 127 (64 %) | 110 (55 %) | 31 (16 %) | 3,08 | 3,08 | 2,0 | 0 | 0 / 0 | 226 / 125 | 180 / 114 | 1,99 | 104,6 % | 0,06 |

**Reparto de los 14 primeros** (comidas dobles servidas, 8 perfiles omnívoros, 200 semanas):

| Primero | Legumbre | Aliño | Rol | Motor actual | Legumbre y aliño no usados en la semana | Legumbre no usada en la semana y aliño no usado por otro primero |
|---|---|---|---|---|---|---|
| Lentejas con pimentón con zanahoria | lentejas | pimenton_ajo | rotativo | 608 (13 %) | 646 (13 %) | 604 (13 %) |
| Garbanzos con pimentón con espinacas | garbanzos | pimenton_ajo | rotativo | 406 (8 %) | 392 (8 %) | 371 (8 %) |
| Alubias blancas al ajillo con pimientos | alubias | ajillo | rotativo | 222 (5 %) | 214 (4 %) | 257 (5 %) |
| Garbanzos al curry con brócoli | garbanzos | curry_ligero | rotativo | 549 (11 %) | 719 (15 %) | 659 (14 %) |
| Lentejas guisadas con arroz y zanahoria | lentejas | pimenton_ajo | ancla | 3 (0 %) | 2 (0 %) | 5 (0 %) |
| Lentejas con pimentón con espinacas | lentejas | pimenton_ajo | rotativo | 488 (10 %) | 531 (11 %) | 520 (11 %) |
| Lentejas con pimentón con pimientos | lentejas | pimenton_ajo | rotativo | 558 (12 %) | 594 (12 %) | 541 (11 %) |
| Lentejas al ajillo con calabacín | lentejas | ajillo | rotativo | 201 (4 %) | 166 (3 %) | 195 (4 %) |
| Garbanzos con pimentón con zanahoria | garbanzos | pimenton_ajo | rotativo | 522 (11 %) | 477 (10 %) | 432 (9 %) |
| Garbanzos al ajillo con tomate cherry | garbanzos | ajillo | rotativo | 220 (5 %) | 160 (3 %) | 161 (3 %) |
| Garbanzos guisados con pimientos | garbanzos | pimenton_ajo | ancla | 4 (0 %) | 6 (0 %) | 5 (0 %) |
| Alubias blancas al ajillo con acelgas | alubias | ajillo | rotativo | 336 (7 %) | 299 (6 %) | 365 (8 %) |
| Garbanzos salteados con berenjena | garbanzos | curry_ligero | ancla | 3 (0 %) | 4 (0 %) | 4 (0 %) |
| Garbanzos estofados con alcachofas | garbanzos | limon_hierbas | rotativo | 663 (14 %) | 585 (12 %) | 696 (14 %) |
| **Total** |  |  |  | 4783 | 4795 | 4815 |

Por legumbre: Motor actual: garbanzos 49 %, lentejas 39 %, alubias 12 % · Legumbre y aliño no usados en la semana: garbanzos 49 %, lentejas 40 %, alubias 11 % · Legumbre no usada en la semana y aliño no usado por otro primero: garbanzos 48 %, lentejas 39 %, alubias 13 %.

