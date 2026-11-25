# Prototipo: legumbre de bote como guarnición (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. El prototipo se aplica en memoria con `variantesGuarnicion.mjs` sobre HEAD `03278db`. Diseño en `inventario/hidratos-legumbre.md`, con las decisiones de Javi del 2026-11-23:
- alubias rojas y pintas con la nutrición de la alubia negra hervida (BEDCA 900), marcadas como aproximación;
- guisantes y habitas, juntos, como mucho 1 de las legumbres de la semana;
- habitas con BEDCA 2194 (haba fresca).

Archivos de esta carpeta:
- `seguridad-legumbres.md`: qué filtros quitan cada legumbre hoy (`seguridadLegumbres.mjs`).
- `resumen.md`: una fila por perfil (`resumenGuarnicion.mjs`).
- `detalle-perfiles.md`: todas las métricas de los 16 perfiles (`cortasProteina.mjs --resumen`).
- `ejemplos-semanas.md`: dos semanas tal como las vería el usuario (`ejemplosGuarnicion.mjs`).

## 1. Seguridad (`seguridad-legumbres.md`)

He pasado el texto que escribiría el prototipo («Alubias rojas cocidas (120 g)»…) por los filtros que la app aplica hoy a un plato.

**Huecos que afectan a una alergia o intolerancia:**
- **Habitas: no las quita ningún filtro.** Ni la intolerancia a legumbres (el `habas?\b` de `alergenos.js` no reconoce «habitas», y `engine2App.js:77` no tiene «haba») ni SIBO (`fodmapRestante`). Una persona con intolerancia a legumbres o con SIBO las recibiría.
- **Edamame:** la intolerancia a la soja sí lo quita (`alergenos.js` tiene «edamame»).

**Huecos de `eliminatedFoods`** (es texto libre, y se busca como subcadena literal):
- «legumbres» no quita ninguna legumbre.
- «soja» y «habas de soja» no quitan el edamame.
- «judías» y «judías blancas» no quitan las alubias blancas; tampoco «judías rojas», «judías pintas» ni «judías negras» las de su color.
- «frijoles», «frijoles rojos» y «frijoles negros» no quitan las alubias de su color.
- «habas» y «haba» no quitan las habitas.
- Estos huecos ya existen hoy para cualquier plato del catálogo, no solo para la guarnición.

**Cómo los cierra el prototipo (en el hook, no en `src/`).** La lista de cada plato se filtra por perfil antes de elegir:
- intolerancia a legumbres o SIBO: ninguna legumbre;
- intolerancia a la soja: sin edamame;
- `alergenosDeTexto` del texto de cada legumbre contra todas las intolerancias del perfil;
- alimentos eliminados, por sinónimos además de la palabra exacta:
  - «legumbre» quita todas;
  - alubia, judía, frijol y fabe quitan todas las alubias;
  - haba y habita, las habitas;
  - lenteja, las dos lentejas;
  - guisante, arveja y chícharo, los guisantes;
  - soja y edamame, el edamame.

**Criterio conservador:** escribir «judías verdes» también quita las alubias (contiene «judía»). Es preferible quitar de más que servir algo que no se puede comer.

**Comprobado en la medición:**
- sin-legumbres-2000 (intolerancia a legumbres) y sibo-2000: 0 legumbres en 400 semanas.
- sin-garbanzos-guisantes-2000: ni garbanzos ni guisantes en 400 semanas.
- En las 6400 semanas de las dos variantes, guisantes y habitas nunca pasan de 1 por semana, y ninguna semana con guarnición pasa de 3 legumbres.

## 2. Ración de la guarnición: 80 a 240 g escurridos, de 10 en 10

- **Máximo, 240 g:** es lo que da escurrido un bote estándar de 400 g, el formato habitual en el supermercado. Una guarnición no debería pedir más de un bote.
- **Mínimo, 80 g:** por debajo, la legumbre deja de ser guarnición y queda de adorno.
- **De partida, 150 g:** comparable en energía a la patata (200 g, 144 kcal) y al boniato (175 g, 177 kcal) de hoy.
  - Las legumbres dan menos energía que el arroz o la quinoa de partida (70 g en seco: 270 y 214 kcal). A 150 g: garbanzos 200 kcal, alubias 138–140, lentejas 111, guisantes 93, habitas 86, edamame 237.
  - Lo que falta lo cubren las raciones: suben la legumbre dentro de su rango y, después, el pan o la fruta, como con cualquier energético.
- **Proteína:** a 150 g, entre 6,9 g (habitas) y 19,5 g (edamame); garbanzos, alubias y lentejas, de 9,4 a 12,6 g.
- **Amplitud de las raciones:** por encima de 2200 kcal, el máximo se multiplica por su factor, hasta 1,4. A 3714 kcal la guarnición puede llegar a unos 335 g.
- **En el prototipo:** el rango se aplica solo a la legumbre de la guarnición (`rangoPropio`). La de un plato de legumbre sigue en 120–400 g.

## 3. Medición: 200 semanas, 16 perfiles

**Perfiles:**
- los 12 del banco;
- `solo-pollo-2000` y `sin-carne-ave-2000`;
- dos nuevos: `sin-garbanzos-guisantes-2000` (`eliminatedFoods: ['garbanzos', 'guisantes']`) y `sin-legumbres-2000` (intolerancia a legumbres).

**Variantes medidas:**
- `main` (`19a300c`);
- HEAD;
- el prototipo con suelo de 2;
- el prototipo sin suelo (solo el tope de 3 y las demás reglas; `--sinSuelo`).

### Comidas y cenas cortas de proteína por semana (proteína del día)

| Perfil | main | HEAD | Con suelo | Sin suelo | Sin suelo − con suelo |
|---|---|---|---|---|---|
| omni-1434 | 3,31 (98,4 %) | 2,62 (100,1 %) | 3,97 (97,6 %) | 3,98 (97,6 %) | +0,01 |
| omni-2174 | 2,64 (100,5 %) | 1,85 (106,7 %) | 3,25 (99,8 %) | 3,25 (99,8 %) | 0,00 |
| omni-2600-3comidas | 2,00 (106,2 %) | 1,42 (116,1 %) | 2,51 (105,6 %) | 2,51 (105,6 %) | 0,00 |
| omni-3714 | 4,37 (100,1 %) | 3,02 (107,8 %) | 4,22 (100,4 %) | 4,22 (100,3 %) | 0,00 |
| celiaco-2400 | 2,23 (99,0 %) | 1,64 (110,8 %) | 3,13 (97,8 %) | 3,13 (97,8 %) | 0,00 |
| sin-lactosa-2000 | 2,19 (102,9 %) | 1,58 (108,7 %) | 2,83 (102,8 %) | 2,83 (102,8 %) | 0,00 |
| sin-pescado-2000 | 3,81 (101,0 %) | 3,17 (104,7 %) | 4,29 (100,2 %) | 4,29 (100,2 %) | 0,00 |
| sibo-2000 | 2,15 (98,4 %) | 2,29 (98,1 %) | 2,29 (98,1 %) | 2,29 (98,1 %) | 0,00 |
| vegetariana-2000 | 4,33 (98,4 %) | 4,50 (98,4 %) | 4,50 (98,4 %) | 4,50 (98,4 %) | 0,00 |
| vegana-1400 | 4,87 (90,5 %) | 4,79 (90,9 %) | 4,79 (90,9 %) | 4,79 (90,9 %) | 0,00 |
| omni-2174-ancla | 2,65 (100,4 %) | 1,98 (105,8 %) | 3,37 (99,5 %) | 3,37 (99,4 %) | 0,00 |
| omni-2000-sin-atun | 2,62 (102,8 %) | 2,10 (108,0 %) | 3,21 (102,4 %) | 3,21 (102,4 %) | 0,00 |
| solo-pollo-2000 | 2,50 (102,6 %) | 3,46 (102,2 %) | 3,58 (100,4 %) | 3,58 (100,4 %) | 0,00 |
| sin-carne-ave-2000 | 2,94 (101,1 %) | 4,21 (98,2 %) | 4,21 (98,2 %) | 4,21 (98,2 %) | 0,00 |
| sin-garbanzos-guisantes-2000 | 1,80 (104,1 %) | 1,94 (108,2 %) | 2,46 (103,8 %) | 2,46 (103,7 %) | 0,00 |
| sin-legumbres-2000 | 1,66 (104,6 %) | 2,17 (103,1 %) | 2,17 (103,1 %) | 2,17 (103,1 %) | 0,00 |

**En los 9 perfiles omnívoros** (los 8 con pescado y sin-pescado-2000, 1800 semanas):

| | main | HEAD | Sin comida doble, sin guarnición | Con suelo | Sin suelo |
|---|---|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,15 | 3,47 | 3,42 | 3,42 |
| Proteína del día | 101,2 % | 107,6 % | 100,1 % | 100,7 % | 100,7 % |

- La columna «sin comida doble, sin guarnición» es la medición de `../estructura-comida-final/rama-sin-comida-doble.md`.
- **El prototipo queda peor que `main` y que HEAD en comidas cortas,** en todos los perfiles omnívoros salvo omni-3714, donde mejora a `main` (4,22 frente a 4,37).
- **La guarnición casi no mejora** lo que se pierde al apagar la comida doble: 3,47 → 3,42 en esos 9 perfiles. Solo omni-1434 (4,13 → 3,97) y omni-3714 (4,47 → 4,22) bajan algo.
- **Por qué** (por familia del plato, `detalle-perfiles.md`; omni-2174 con suelo):
  - la guarnición va en platos de ave, carne o pescado, que ya casi nunca quedaban cortos: 0,04, 0,25 y 0,03 por semana;
  - las comidas cortas son los platos de legumbre como plato único (1,43 por semana, cortos todos) y los de huevo (1,36 de 1,80);
  - esos platos de legumbre los sigue poniendo el walk, por el suelo de legumbre de D-024 (3), que vuelve a actuar al apagar D-117.

  Para que la guarnición ayude a la proteína, tendría que sustituir esos platos de legumbre como plato único, no sumarse a ellos. No está medido.

### Variante sin suelo

- **Comidas cortas:** iguales que con suelo en todos los perfiles; la diferencia es de 0,00, y +0,01 en omni-1434.
- **El suelo casi no actúa:** 53 veces en las 3200 semanas con suelo, porque el walk ya pone platos de legumbre y la elección con la semilla añade la guarnición.
- **Legumbres por semana** (guarnición + plato) y distribución en la variante sin suelo:

| Perfil | Con suelo | Sin suelo | Sin suelo: semanas con 0 / 1 / 2 / 3 / más de 3 |
|---|---|---|---|
| omni-1434 | 1,33 + 1,48 | 1,31 + 1,48 | 0 / 3 / 35 / 162 / 0 |
| omni-2174 | 1,37 + 1,43 | 1,34 + 1,43 | 0 / 5 / 35 / 160 / 0 |
| omni-2600-3comidas | 1,48 + 1,32 | 1,44 + 1,32 | 2 / 6 / 30 / 162 / 0 |
| omni-3714 | 1,38 + 1,45 | 1,34 + 1,45 | 0 / 7 / 28 / 165 / 0 |
| celiaco-2400 | 1,45 + 1,50 | 1,45 + 1,50 | 0 / 1 / 10 / 189 / 0 |
| sin-lactosa-2000 | 1,39 + 1,48 | 1,36 + 1,48 | 0 / 5 / 24 / 170 / 1 |
| sin-pescado-2000 | 0,81 + 2,16 | 0,81 + 2,16 | 0 / 0 / 11 / 185 / 4 |
| sibo-2000 | 0 + 0 | 0 + 0 | 200 / 0 / 0 / 0 / 0 |
| vegetariana-2000 | 0 + 2,42 | 0 + 2,42 | 0 / 13 / 96 / 86 / 5 |
| vegana-1400 | 0 + 3,04 | 0 + 3,04 | 0 / 2 / 28 / 131 / 39 |
| omni-2174-ancla | 1,08 + 1,61 | 1,04 + 1,61 | 0 / 10 / 53 / 134 / 3 |
| omni-2000-sin-atun | 1,41 + 1,37 | 1,36 + 1,37 | 1 / 7 / 36 / 156 / 0 |
| solo-pollo-2000 | 0,29 + 2,65 | 0,29 + 2,65 | 0 / 0 / 14 / 185 / 1 |
| sin-carne-ave-2000 | 0,03 + 3,35 | 0,03 + 3,35 | 0 / 0 / 0 / 125 / 75 |
| sin-garbanzos-guisantes-2000 | 1,65 + 1,01 | 1,61 + 1,01 | 0 / 8 / 58 / 134 / 0 |
| sin-legumbres-2000 | 0 + 0 | 0 + 0 | 200 / 0 / 0 / 0 / 0 |

- **Semanas con menos de 2 legumbres sin el suelo:** entre 0 y 10 de 200 en los perfiles omnívoros. Las dos de omni-2600-3comidas y la de omni-2000-sin-atun se quedan sin ninguna.
- **«Más de 3»** son semanas en las que el walk ya pone 4 o más platos de legumbre: la guarnición no pasa nunca del tope.
- **sin-carne-ave-2000 casi no recibe guarnición:** sus platos de legumbre ya llegan al tope.

### Resto de métricas: 9 omnívoros, 1800 semanas

| | main | HEAD | Con suelo | Sin suelo |
|---|---|---|---|---|
| Legumbres/sem (guarnición + plato) | 1,16 | 3,01 | 2,83 (1,30 + 1,53) | 2,81 (1,27 + 1,53) |
| Pescado/sem | 4,28 | 2,68 | 2,67 | 2,67 |
| Semanas con una legumbre repetida | 285 | 1208 | 492 | 492 |
| Arroz / patata / boniato / quinoa / pasta / legumbre (guarnición), por semana | 1,89 / 1,69 / 0,56 / 0,49 / 0,47 / 0 | 1,20 / 1,46 / 0,50 / 0,27 / 0,31 / 0 | 1,10 / 1,21 / 0,51 / 0,39 / 0,45 / 1,30 | 1,11 / 1,22 / 0,51 / 0,39 / 0,45 / 1,27 |
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 516 | 517 |
| Pares de días seguidos con el mismo hidrato/sem | 0,44 | 0,27 | 0,33 | 0,33 |
| Comidas y cenas fuera de ±5 % de kcal | 10,7 % | 8,5 % | 10,8 % | 10,8 % |
| Aceite por día (ml) | 37,3 | 37,8 | 37,3 | 37,3 |
| Infracciones de D-099.3 | 6 | 2 | 0 | 0 |

- «Legumbre» cuenta la guarnición y los platos de familia legumbre.
- La pasta, que nunca admite legumbre, sube respecto a HEAD porque D-116 está apagada (el walk vuelve a elegir platos de pasta como antes).
- El reparto por legumbre de cada perfil está en `detalle-perfiles.md`. En omni-2174 con suelo, por semana:
  - garbanzos 0,93, lentejas pardinas 0,72 y alubias blancas 0,58;
  - guisantes 0,12, lentejas beluga 0,12, alubias pintas 0,11, alubias rojas 0,10, alubias negras 0,08, habitas 0,04 y edamame 0,01.

### Veces que actúa cada regla (16 perfiles, 3200 semanas por variante)

| Regla | Con suelo | Sin suelo |
|---|---|---|
| Suelo de 2 (pone una legumbre) | 53 | — |
| Semanas que no llegan a 2 aunque actúe el suelo (sin huecos que la admitan) | 12 | — |
| Suelo que no actúa: el perfil no puede comer ninguna legumbre (sibo-2000 y sin-legumbres-2000) | 400 semanas | — |
| Tope de 3 (deja el hidrato original) | 3688 | 3688 |
| Límite de 1 en la cena | 80 | 80 |
| Guisantes y habitas, como mucho 1 | 16 | 16 |
| No repetir legumbre: aplicada / sin aplicar | 2826 / 143 | 2798 / 143 |

- **El tope de 3 es lo que más actúa.** La elección con la semilla es uniforme entre el hidrato original y las 2 a 4 legumbres de la lista, así que en la mayoría de los huecos sale legumbre. La semana llega pronto al tope y las guarniciones se concentran en los primeros días.
- **D-099.3 y la cena:** D-099.3 prohíbe la legumbre en la cena. Aquí la guarnición puede ir en 1 cena por semana, como pide la regla del prototipo, y el contador del banco no lo ve: mira la familia del plato, y una cena de merluza con guisantes sigue siendo de pescado. Hay que decidir cómo encaja con D-099.3.

## 4. Ejemplos (`ejemplos-semanas.md`)

Semanas 64 y 66 de omni-2174 con suelo:
- **Semana 64:** dos guarniciones (alubias blancas el miércoles y garbanzos el domingo). La comida libre del sábado sugiere un curry de garbanzos, que no cuenta (no se sirve).
- **Semana 66:** dos guarniciones (guisantes el lunes y alubias rojas en la cena del martes) y un plato de legumbre (alubias blancas al ajillo, el martes). El lunes, la preferencia por no repetir ya quita las alubias blancas de la lista, porque el plato de alubias del martes cuenta desde el principio de la semana.

Lo que se ve en el texto:
- **Título y compra:** el título cambia el hidrato por la legumbre («Lomo de cerdo a la plancha con mostaza y miel con zanahoria y alubias blancas»). La compra dice «Alubias blancas cocidas (180 g)», y la receta, «Escurre y enjuaga las alubias blancas de bote…».
- **Pan:** en los cuatro platos con guarnición las raciones añaden pan integral (70–80 g), porque la legumbre da menos energía que el arroz o la patata que sustituye. No lo he medido en toda la serie.
- **Gramos:** en las cuatro guarniciones, la legumbre va entre 170 y 200 g, por debajo del máximo de 240.
- **Proteína del plato:** a veces baja, porque la legumbre ya aporta proteína. Por ejemplo, «Ternera magra (80 g) al horno… con alubias rojas (170 g)», en la cena del martes de la semana 66.

## 5. Límites del prototipo

- **El orden de elección:** la guarnición se elige después del walk, hueco a hueco y en el orden de la semana. Por eso las guarniciones se concentran en los primeros días y el tope corta las del final.
- **Los huecos que no se tocan:** los del ancla (cocinar de más y aprovechar) y la sugerencia de la comida libre.
- **«No repetir»:** un plato de lentejas del walk cuenta como pardina y beluga; uno de alubias, como alubias blancas.
- **La legumbre no cuenta como especie** para D-099.3 ni para el tope por especie: unas lentejas de guarnición el mismo día que un plato de lentejas no cuentan como especie repetida.
- **Platos de la semana:** se guarda el nombre original del plato, para que la semana siguiente no repita el mismo plato con otra guarnición. El contador «plato de la semana anterior» del banco compara títulos, así que puede no ver esa repetición.
- **Concordancia en ensaladas:** en las ensaladas, el texto dice «ya templado» con una legumbre en plural.
