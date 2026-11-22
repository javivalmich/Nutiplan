# Legumbre como guarnición: inventario y diseño (2026-11-22, pendiente de revisar por Javi)

Diseño, sin implementar: no cambia ninguna regla, no toca `src/` y no mide. El archivo de datos es `hidratos-legumbre.csv` (separado por `;`, UTF-8 con BOM para Excel). Lo genera un script en el directorio temporal de la sesión a partir de:
- `catalogoApp()`, con los nombres visibles de `aplicarNombresD105(aplicarAjustesD099(...))`;
- la vista de `resolveDishComposition`;
- el texto de `FREEFORM_POOL`.

## 1. Qué platos admiten legumbre

- **92 platos de plantilla con hueco de hidrato** (`tupla.C`): 35 de arroz, 23 de patata, 14 de pasta, 11 de boniato y 9 de quinoa.
- **48 platos redactados** que llevan algún hidrato en su receta. Todos van con «no»: su receta está cerrada y no tienen hueco que cambiar. Ningún plato de plantilla tiene el pan como hueco.
- **Platos de plantilla: 61 «sí» y 31 «no».**
  - No:
    - los 13 bowls, incluidos los asiáticos: la base de arroz o quinoa es lo que lo hace un bowl;
    - la pasta, 14;
    - la tortilla de patata, 1;
    - los revueltos de huevo, 2;
    - las lentejas con arroz, que ya son un plato de legumbre, 1.
  - Columna `pescado_a_revisar`: 24 platos de pescado o marisco con «sí».

## 2. Legumbres válidas por plato

Cada plato con «sí» lleva en `legumbres_validas` las legumbres que valen, sin orden de preferencia. `n_legumbres` dice cuántas son.

**Base por proteína (Javi):**

| Proteína | Legumbres |
|---|---|
| Pollo | alubias blancas, garbanzos, alubias negras, lentejas pardinas |
| Pavo | alubias blancas, lentejas pardinas, alubias rojas, garbanzos |
| Ternera | alubias rojas, alubias pintas, lentejas pardinas, alubias negras |
| Cerdo | alubias blancas, lentejas pardinas, alubias pintas, garbanzos |
| Conejo | alubias blancas, garbanzos, lentejas pardinas |
| Bacalao | garbanzos, alubias blancas, lentejas pardinas |
| Merluza | guisantes, alubias blancas, lentejas beluga |
| Dorada | lentejas beluga, guisantes, alubias blancas |
| Salmón | lentejas beluga, alubias blancas |
| Sardinas y atún | alubias blancas, garbanzos, lentejas beluga |
| Calamares y gambas | garbanzos, alubias blancas, habitas |

**Ajustes por plato, en este orden:**
1. Curry: garbanzos, lentejas pardinas y alubias rojas.
2. Fríos o crudos (y ensaladas): solo garbanzos, alubias blancas y lentejas beluga.
3. Con alcachofas: se añaden habitas.
4. Con judías verdes: fuera todas las alubias (la vaina ya es alubia).
5. Guisantes, solo en merluza y dorada.
6. Salmón con soja y jengibre (el que no es bowl): edamame y lentejas beluga.

**Garbanzos en como mucho la mitad de las listas: ajuste necesario.** Con las reglas tal cual, los garbanzos salían en 40 de las 61 listas (66 %).
- Ajuste: quito los garbanzos de las listas de 4 o más legumbres de pollo y de cerdo, 13 listas.
- Esas listas se quedan con 3: pollo con alubias blancas, alubias negras y lentejas pardinas; cerdo con alubias blancas, lentejas pardinas y alubias pintas (y las habitas, si lleva alcachofas).
- Las listas de pollo con judías verdes conservan los garbanzos: sin ellos quedarían con una sola legumbre.
- Resultado: garbanzos en 27 de 61 (44 %).

**Recuento final, sobre los 61 platos con «sí»:**

| Legumbre | Listas | % |
|---|---|---|
| Alubias blancas | 45 | 74 % |
| Lentejas pardinas | 39 | 64 % |
| Garbanzos | 27 | 44 % |
| Lentejas beluga | 19 | 31 % |
| Alubias negras | 14 | 23 % |
| Alubias pintas | 13 | 21 % |
| Alubias rojas | 11 | 18 % |
| Guisantes | 9 | 15 % |
| Habitas | 5 | 8 % |
| Edamame | 1 | 2 % |

- **Tamaño de las listas:** 37 con 3 legumbres, 12 con 4 y 12 con 2.
- **Las 12 de 2 salen de las propias reglas:**
  - los 4 salmones de la base (lentejas beluga y alubias blancas);
  - el salmón con soja y jengibre (edamame y lentejas beluga);
  - los 7 platos con judías verdes: merluza (2), dorada (1), pavo (3, uno de ellos con curry) y pollo (1).
- **Las alubias blancas quedan en el 74 % de las listas.** La regla de la mitad solo se pidió para los garbanzos.

## 3. Reglas del prototipo (sin implementar)

- **El hidrato original** del plato (arroz, patata, boniato, quinoa) siempre es una opción.
  - El motor elige con la semilla, sin pesos, entre el hidrato original y las legumbres de la lista que el usuario puede comer.
  - La legumbre nunca sustituye al hidrato de forma obligatoria.
- **Se quitan de la lista** las legumbres que el usuario tenga en `eliminatedFoods` o por intolerancia. Si no queda ninguna, el plato sale con su hidrato original.
- **Suelo de 2 legumbres por semana y tope de 3**, contando guarnición y platos de legumbre. Si va corta, se prefiere legumbre en el siguiente hueco que la admita, con vuelta atrás y causa en el log.
- **Sin ninguna legumbre posible** (todas eliminadas, intolerancia a legumbres o SIBO): el suelo no actúa, con causa en el log.
- **Guisantes:** como mucho 1 de las legumbres de la semana.
- **Cena:** como mucho 1 de las legumbres de la semana.
- **Preferencia por no repetir la misma legumbre** en la semana, con vuelta atrás y causa en el log.
- **D-116 y D-117 apagadas:** sin sorteo ni segundos, por el camino de la red. Todo lo demás de HEAD activo, incluido el tope de pescado de 3.
- **Espárragos:** siguen siendo verdura.
- **Pendiente de proponer con el prototipo:** el rango de ración de la guarnición de legumbre. Hoy el plato de legumbre cocida usa 120–400 g, de 10 en 10 (`raciones.js:57`).

## 4. Ingredientes (propuesta, sin implementar)

Valores de BEDCA por 100 g, de la descarga de Javi (`bedca.json`, la de `scripts/medidor/bajarBedca.mjs`). La energía de BEDCA viene en kJ; la paso a kcal dividiendo por 4,184.

| Legumbre | Ingrediente hoy | BEDCA | kcal | Proteína | Hidratos | Grasa | Fibra | Agua | Propuesta |
|---|---|---|---|---|---|---|---|---|---|
| Garbanzos de bote | `garbanzos_cocidos` | 2191, garbanzo en conserva | 133 | 7,2 | 14,1 | 2,9 | 4,1 | 71,7 | Existe |
| Lentejas pardina y beluga | `lentejas_cocidas` | 1126, lenteja en conserva | 74 | 6,3 | 11,4 | 0,2 | 5,1 | 79,4 | Las dos comparten esta nutrición (decisión de Javi) |
| Alubias negras | `alubias_cocidas` | 900, alubia negra, remojada y hervida | 92 | 8,4 | 13,7 | 0,2 | 8,7 | 68,9 | Renombrar (ver abajo) |
| Alubias blancas de bote | — | **898**, alubia blanca en conserva | 93 | 6,7 | 15,7 | 0,2 | 4,4 | 72,5 | Crear |
| Alubias rojas de bote | — | **No está en BEDCA** | | | | | | | Crear con otra fuente, o con la de la alubia negra (900) como aproximación; decide Javi |
| Alubias pintas de bote | — | Solo en seco: **2197**, judía pinta (246 kcal, 23,6 g de proteína, 11,8 % de agua) | | | | | | | Crear: no hay cocida ni en conserva. Hay que derivarla del seco o usar otra fuente; decide Javi |
| Habitas | — | **2194**, haba fresca | 57 | 4,6 | 8,6 | 0,4 | 4,2 | 82,2 | Crear con 2194 (haba tierna). La otra opción es 1128, haba seca remojada y hervida: 58 kcal y 5,8 g de proteína |
| Guisantes | `guisantes` | 1175, guisante congelado, crudo | 62 | 5,4 | 8,8 | 0,5 | 4,7 | 79,9 | Existe. BEDCA también tiene 2193, guisantes en conserva (67 kcal, 5,6 g) |
| Edamame | `edamame` | 1124, soja fresca | 158 | 13 | 11,1 | 6,8 | 4,2 | 64,9 | Existe |

**Lentejas cocidas, 74 kcal: es el valor de BEDCA, no un error de copia.**
- BEDCA 1126 da 308,33 kJ, que son 73,7 kcal.
- Cuadra con sus propios macros: 72,6 kcal contando la fibra como 0 y 82,8 kcal contando 2 kcal por gramo.
- Es baja porque la muestra tiene un 79,4 % de agua: la de garbanzos en conserva tiene 71,7 % y la de alubia blanca en conserva, 72,5 %.
- La otra entrada de BEDCA, «Lenteja, hervida» (2200), tiene valores de lenteja seca (9,3 % de agua) y no sirve. Ya está anotado en `fuentesBedca.js`.
- Si se quiere un valor más alto, tendría que venir de otra fuente distinta de BEDCA.

**Renombrar `alubias_cocidas` a `alubias_negras_cocidas` (nombre visible «Alubias negras cocidas»).** Cambian estas claves:
- `ingredientes.js:67`: la clave y el nombre visible.
- `composicion.js:556`: la clave, y la nota de la línea 8.
- `fuentesBedca.js:58`.
- `raciones.js:57`: la clave del rango de ración.
- `leerComida.js:72`: el lector ya convierte «alubias negras cocidas» en esta clave; solo cambia la clave de destino.
- `componer.js:32`: en `CLAVES_BASE.alubias` (gramos del ingrediente base del ancla), hoy entran `alubias_seco` y `alubias_cocidas`. Con el cambio, una alubia del ancla contaría la negra; habría que poner ahí la alubia blanca nueva.
- Platos: solo el redactado «Burrito de alubias negras, arroz y verduras», cuya compra dice «Alubias negras cocidas (120g)». Su texto no cambia; cambia la clave que lee el medidor.
- Ningún test usa `alubias_cocidas`. La línea base del banco puede cambiar si vuelca esa clave.

**Cómo filtra hoy `eliminatedFoods` las legumbres** (`engine2App.js:138-168`, `filtrarCatalogo`):
- **Por plato, no por ingrediente ni por familia.** Quita un plato si el texto que se le enseña al usuario contiene, en minúsculas, lo que el usuario escribió como subcadena, o si la clave de su proteína principal lo contiene. Ese texto es el nombre, `p1`, `p2`, la compra y la receta, ya compuesto.
- **Quitar «garbanzos» quita los garbanzos cocidos:** el texto de un plato con `garbanzos_cocidos` dice «Garbanzos cocidos (…)». Quitar «garbanzo» también, porque es subcadena de «garbanzos».
- **Quitar «alubias» quita todas las alubias** (blancas, negras, rojas y pintas). «Lentejas» quita las pardinas y las beluga.
- **Quitar «habas» no quitaría las «habitas»:** «habas» no es subcadena de «habitas».
- **Quitar «judías» no quita las alubias** (son otra palabra), y en cambio sí quitaría las judías verdes.
- **La intolerancia «legumbres» sí va por familia**, con dos filtros de texto:
  - el de ingredientes, `alergenos.js:51`: lenteja, garbanzo, alubia, judía blanca o pinta, frijol, fabes, `habas?\b`, guisante, soja, tofu, edamame, hummus, falafel, cocidos, azuki, altramuz, miso y tempeh;
  - el de `engine2App.js:77`, con una lista de proteínas.
- **Ninguno reconoce «habitas».** El `habas?\b` de `alergenos.js` exige que la palabra acabe en «haba» o «habas», y el de `engine2App.js` no tiene «haba». Habría que añadir «habita» antes de crear el ingrediente.
- **Para el prototipo:** la guarnición de legumbre no está en el texto del plato cuando se filtra el catálogo, porque el plato se compone con su hidrato original. Así que la lista de legumbres de cada plato tiene que filtrarse aparte, con la misma regla sobre el nombre visible de cada legumbre y con la de la intolerancia.

## 5. Perfiles de la medición posterior

- Los 12 del banco (`scripts/banco/perfiles.mjs`).
- `solo-pollo-2000` y `sin-carne-ave-2000` (`cortasProteina.mjs`).
- **Nuevo**, sin garbanzos ni guisantes: como sin-lactosa-2000 sin la lactosa, con `eliminatedFoods: ['garbanzos', 'guisantes']`.
- **Nuevo**, sin ninguna legumbre: igual, con `intolerances: ['legumbres']`. Requiere que los dos filtros de la intolerancia reconozcan «habitas», como se dice arriba.

En total, 16 perfiles, frente a `main` y HEAD.
