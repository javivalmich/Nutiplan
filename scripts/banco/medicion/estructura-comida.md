# Estructura de la comida y legumbre: primero y segundo (medición, 2026-11-14)

Rama `motor/i0-banco-cantidades`. Medido sobre `134fd22`; datos y scripts en `db9a2fd`. **Nada de esto está implementado**: todo se aplica en memoria sobre el código de `src/`, que no se ha tocado. `DECISIONS.md` tampoco: los asientos del final son borradores.

Cada cifra lleva su fuente: el script que la produce y, cuando hace falta, el archivo de datos. Las citas `archivo:línea` de `src/` son lectura de código, sin medir.

## 1. Resumen

Javi dijo en octubre que las lentejas pueden ir de primero con un segundo de proteína, pero no como plato único. No está en `DECISIONS.md` ni en el código. Hoy la legumbre sale 1,30 veces por semana, siempre como plato único, y se queda en el 77 % de la proteína de su comida.

Se ha medido el walk completo con la comida de legumbre en dos platos, 200 semanas por perfil, en 8 variantes. Cifras de los 8 perfiles omnívoros sin SIBO (fuente: `resumenEstructura.mjs` sobre los `.json` de `estructura-comida/`, que genera `medirEstructura.mjs`):

| Variante (suelo · segundo · alcance) | Legumbre/sem | Pescado/sem | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Semanas fuera de ±5 % kcal |
|---|---|---|---|---|---|
| Hoy | 1,30 | 4,30 | 3,08 | 100,7 % | 12 de 1600 |
| 2 · con pescado · todas | 2,26 | 4,60 | 1,91 | 104,0 % | 1 |
| 2 · sin pescado · todas | 2,27 | 4,18 | 1,90 | 104,0 % | 5 |
| 3 · con pescado · todas | 2,95 | 4,53 | 1,85 | 104,4 % | 4 |
| 3 · sin pescado · todas | 2,95 | 3,96 | 1,82 | 104,5 % | 3 |
| 2 · con pescado · lentejas | 2,37 | 3,97 | 3,26 | 100,3 % | 3 |
| 2 · sin pescado · lentejas | 2,38 | 3,92 | 3,26 | 100,2 % | 3 |
| 3 · con pescado · lentejas | 3,09 | 3,72 | 3,60 | 99,6 % | 2 |
| 3 · sin pescado · lentejas | 3,09 | 3,60 | 3,61 | 99,6 % | 1 |

Lo que sale de la medición:

- **La regla para todas las legumbres funciona.** La comida con segundo llega a la proteína casi siempre (quedan cortas entre 3 y 14 de las 3500–4700 medidas en cada variante) y las comidas y cenas cortas de la semana bajan de 3,08 a 1,85.
- **La regla solo para lentejas no arregla nada.** Añade legumbre, pero 4 de cada 5 comidas de legumbre siguen como plato único (garbanzos, alubias y los platos redactados) con el 78 % de su proteína. Las comidas cortas suben de 3,08 a 3,26 con suelo 2 y a 3,61 con suelo 3.
- **Pescado.** Con el segundo de pescado permitido sube de 4,30 a 4,53–4,60 por semana. Sin él baja a 3,96–4,18, pero el filtro de familias (D-115) no se puede aplicar al segundo 14–15 veces por cada 100 semanas.
- **Suelo 2 o 3.** Con 3, el domingo lleva legumbre 0,78 veces por semana: el sábado no cuenta y 6 de los 7 conjuntos de 3 días no seguidos incluyen el domingo.
- **Días sorteados sin legumbre.** Con suelo 3, 10,3 por cada 100 semanas, casi todos en domingo. La causa es que la preferencia B (no tres comidas seguidas con la misma sensación térmica) se aplica antes que el día de legumbre, y 9 de los 11 primeros son «muy caliente». Tiene arreglo en el diseño (sección 5.2).
- **Calorías.** Las semanas fuera de ±5 % bajan de 12 a entre 1 y 5.
- **Reglas.** En los 8 perfiles omnívoros no hay ninguna infracción de D-099.3 ni de D-114. En el perfil sin pescado ni marisco, que tiene pocas especies, sí (sección 5.5).

**Recomendación:** regla para todas las legumbres compuestas, suelo 3 y segundo sin pescado, con el día de legumbre evaluado antes que las preferencias A y B. El pescado de segundo es la decisión más discutible y es de Javi: sin él el pescado baja a 3,96 sin poner ningún techo, a cambio de que el segundo repita familia con el día de al lado unas 0,16 veces por semana. Si esa cifra pesa más que el pescado, la alternativa es «3 · con pescado · todas».

Se puede implementar una primera etapa sin cambiar la forma del plan: los dos platos escritos en `p1` y `p2` de una sola comida. Es justo lo que hace el prototipo de esta medición, y el plan compartido sigue funcionando sin tocarlo (sección 9).

## 2. Punto de partida (informe del 2026-11-13)

### 2.1 El plan no admite hoy dos platos en una comida

- **Motor:** un `dishId` por hueco (`src/engine2/walk/runWalk.js`); `materializePlan.js:63` emite `{ momento, dish }`.
- **Plato compuesto:** una tupla de 7 con un solo hueco de proteína (`src/plan/textos/componer.js:22`). Legumbre más proteína animal no cabe en una tupla.
- **Comida de la app:** `{ time, title, p1, p2, shopping, recipe, _dishId, _componer, nutricion }`. `p1` y `p2` no son primero y segundo: son la línea principal y la secundaria (aliño, pan, postre).
- **Raciones:** un objetivo por comida (37,5 % del día). La legumbre es «energética», no «proteica» (`src/engine2/nutrientes/raciones.js:115`): el plato único de legumbre no tiene nada que subir para llegar a la proteína.
- **UI:** `OriginalPlanApp.jsx:1508-1511` pinta título, `p1` y `p2`; `NutritionistDashboard.jsx:465-492` los muestra y los edita.

### 2.2 Platos de rol ancla

Tras D-099 quedan 5 platos de rol ancla, 3 de legumbre: lentejas con arroz y zanahoria, garbanzos con pimientos y garbanzos con berenjena (fuente: `legumbreCatalogo.mjs`). El walk genérico no los sirve nunca (su pool es `rol === 'rotativo'`, `runWalk.js:362`). Solo los coloca el ancla (`expandWeekArc.js:171`) si llevan el ingrediente base. En 200 semanas por perfil salen 0 veces en 11 perfiles y 13 veces en `omni-2174-ancla`, todas en lunes o martes (fuente: `repartoLegumbre.mjs` sobre la salida de `medirDiseno.mjs` con las reglas actuales). El botón de alternativas sí puede devolverlos (`alternativa.js:77`).

Platos de legumbre que ve el walk genérico (`legumbreCatalogo.mjs`):

| Perfil | Inventario | Rotativos |
|---|---|---|
| Omnívoro | 21 | 18 |
| Vegetariano | 20 | 17 |
| Vegano | 18 | 15 |
| Celíaco | 17 | 14 |
| SIBO | 0 | 0 |

De los 18 del omnívoro, 11 son compuestos de legumbre con verdura (lentejas 4, garbanzos 5, alubias 2) y 7 son redactados (cocido, fabada, hummus con pollo, curry con arroz, burrito, falafel y ensalada de lentejas con feta). El único compuesto de legumbre con cereal (lentejas con arroz) es de rol ancla.

### 2.3 Plato único completo (alternativa descartada)

Fuente: `legumbreCatalogo.mjs` para la composición y `simularPrimeroSegundo.mjs` (líneas «U») para la proteína.

Solo 5 de los 18 llevan un ingrediente proteico y 5 llevan cereal. El cereal no arregla la proteína: a 1434 kcal el curry con arroz da 18 g de 39 y el burrito 21, frente a 26 de la legumbre con verdura. Llegan al 95 % de la proteína 1 de 18 platos a 1434 kcal (el cocido, con 658 kcal de 538), 4 a 2174 y 2 a 3714. Con «no repetir plato en dos semanas» harían falta 6 platos distintos para un suelo de 3. Además el plato cuenta como «legumbre» y el pollo o el cerdo de dentro no los ven ni la regla de familias ni el tope por especie.

### 2.4 Simulación plato a plato (`simularPrimeroSegundo.mjs`)

13 primeros por 39 segundos sin huevo, comida del miércoles de la semana 60. Medianas de kcal y proteína frente al objetivo de la comida. La columna «Plato único» sale de las líneas «U legumbre+verdura» y las otras dos de las líneas «PSb/PSc sin segundos de huevo» del script:

| Nivel (objetivo) | Plato único | Media ración fija | Media ración de partida, ajustable |
|---|---|---|---|
| 1434 (538 kcal, 39 g) | 530 kcal, 26 g | 537 kcal, 39 g | 538 kcal, 40 g |
| 2174 (815 kcal, 49 g) | 822 kcal, 38 g | 815 kcal, 52 g; pan en 491 de 507 | 816 kcal, 59 g |
| 3714 (1393 kcal, 83 g) | 1331 kcal, 59 g | 1226 kcal, 83 g; 414 de 507 fuera de ±5 % | 1392 kcal, 103 g |

El huevo de segundo se queda corto a los tres niveles por el tope de 3 huevos. La media ración fija no escala a 3714 kcal.

### 2.5 El contrafactual A y sus días (`repartoLegumbre.mjs`)

Fuente: `medirDiseno.mjs` con `contrafactualesDiseno.mjs`, 200 semanas, sin contrafactual y con `--cf=A`, leído con `repartoLegumbre.mjs`. Esas dos salidas no se han guardado; el comando las reproduce.

Con A (en la comida, los suelos antes que la verdura) la legumbre sube de 1,15 a 2,74 por semana en los 9 perfiles con pescado, y cae en lunes, miércoles y viernes en 1281 de 1600 semanas: el walk va de lunes a domingo, atiende el suelo en el primer hueco donde puede y la veda de un día hace el resto. No interviene el azar. Fabada y cocido pasan de 1,8 a 44,7 por 100 semanas porque hoy la verdura va primero y sus fichas la tienen como «desconocida»; con A salen como cualquier otro plato de legumbre.

## 3. Qué se ha medido

Scripts, en `scripts/banco/medicion/`:

| Script | Qué hace |
|---|---|
| `estructuraComida.mjs` | Hook de carga: transforma en memoria `runWalk.js` y `racionesApp.js` |
| `estructuraComidaLogica.mjs` | Las reglas medidas: sorteo de días, nivel del día de legumbre, elección del segundo, montaje y raciones de la comida doble |
| `medirEstructura.mjs` | Genera las semanas, monta las comidas y vuelca una fila por semana; con `--texto` escribe semanas legibles |
| `resumenEstructura.mjs` | Tablas de la sección 4 |
| `legumbreCatalogo.mjs`, `simularPrimeroSegundo.mjs`, `repartoLegumbre.mjs` | Los del informe del 2026-11-13 (sección 2) |
| `catalogoSegundosSopa.mjs` | Segundos y sopas o cremas por perfil (secciones 3.2, 6 y 8) |
| `diagDiaSinLegumbre.mjs` | Evidencia del hueco en algunos días sorteados sin legumbre (sección 5.2; solo ejemplos) |

Datos en bruto, en `scripts/banco/medicion/estructura-comida/`:

- Un `.json` por medición (`off` y las 8 variantes), con una fila por semana y perfil.
- Un `.md` con las semanas en texto de cada medición.
- `resumen.md`, que es la salida de `resumenEstructura.mjs` y es lo que copia la sección 4.

Para repetirlo (una variante; `off` mide las reglas actuales con las mismas métricas):

```bash
node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/estructuraComida.mjs scripts/banco/medicion/medirEstructura.mjs salida/s3-sinPescado-todas.json --ec=suelo3,sinPescado,todas --semanas 200 --texto salida/s3-sinPescado-todas.md
```

```bash
node scripts/banco/medicion/resumenEstructura.mjs salida
```

Los archivos de salida deben llamarse `off.json` y `s<2|3>-<pescado|sinPescado>-<todas|lentejas>.json`.

Comprobación del instrumento: la variante `off` reproduce la línea actual medida con `medirDiseno.mjs` (legumbre 1,30 y pescado 4,30 en los 8 perfiles; 12 semanas fuera de ±5 %). Ningún plan de las 18 000 semanas cayó al motor viejo.

### 3.1 Supuestos fijados por Javi

- El segundo cuenta para la regla de familias (D-115), para el tope y la separación por especie y para el suelo de pescado, porque se come.
- Sin huevo de segundo.
- El primero parte de media ración y es ajustable, con tope en la ración del plato único a 2174 kcal.
- Los días de legumbre se sortean con la semilla: ni sábado, ni días seguidos, ni el día del ancla.

### 3.2 Supuestos que hubo que cerrar para medir

Cada uno es una decisión abierta. Si alguno no es lo que Javi quiere, las cifras cambian.

1. **Qué es un primero.** Un plato compuesto de la plantilla «legumbre» (legumbre con verdura). Los 7 platos redactados de legumbre no cambian: siguen como plato único y ya no los busca el día de legumbre cuando el alcance es «todas».
2. **Qué es un segundo.** Un compuesto de «proteína con verdura» sin cereal (plantilla `caliente_clasico` sin hidrato), de ave o carne, y de pescado o marisco si se permite. Hay 39 sin huevo: 13 de ave, 10 de carne, 13 de pescado y 3 de marisco. **En el catálogo los 39 son platos de cena**: aquí se admiten en la comida. El segundo sale del mismo fondo que las cenas.
3. **Filtros del segundo.** Los mismos que cualquier hueco y en el mismo orden: no repetir plato en la semana ni de la anterior, tope por especie, separación por especie, familia en días seguidos, aliño; después el paso 5 (variedad de verdura) y el azar sembrado. El paso 4 no lo dirige: el segundo cuenta para el suelo de pescado, pero no se elige pescado para cumplirlo.
4. **El sorteo.** Se sortea, con un RNG propio de la semilla, un conjunto entre todos los conjuntos válidos de N días. Las legumbres que ya coloca el ancla cuentan para los N.
5. **Fuera de los días sorteados.** El suelo semanal de legumbre deja de actuar. El día anterior y el siguiente a uno sorteado no llevan legumbre a la comida si quedan otros candidatos. En los demás días la legumbre puede salir por azar, como hoy, y si es un compuesto de legumbre lleva también segundo.
6. **Alcance «lentejas».** El día de legumbre busca cualquier plato de legumbre; solo llevan segundo los compuestos de lentejas.
7. **Media ración.** Legumbre a 50 g en seco, que es el mínimo de su rango (la mitad de 90 son 45 y D-112 la dejaría fija); verdura y aceite del primero a la mitad. La cebolla y el caldo del guiso no cambian en el texto.
8. **Tope de la legumbre.** Lo que recibe cada plato como plato único a 2174 kcal: entre 115 y 130 g en seco según el plato (100 en lentejas con arroz).
9. **Perfiles.** No se miden el vegetariano ni el vegano (sección 6). El perfil SIBO se mide, pero no tiene platos de legumbre: no le cambia nada.
10. **Reglas contadas con el segundo dentro.** Las reglas de D-099.3 y D-115 se cuentan con las tres apariciones del día (primero, segundo y cena).

## 4. Resultados

Fuente de toda la sección: `resumenEstructura.mjs` sobre `estructura-comida/*.json` (copia de `estructura-comida/resumen.md`, con decimales con coma). «Variante» es suelo · segundo con o sin pescado · alcance.

Semanas por perfil: 200. Perfiles medidos: omni-1434, omni-2174, omni-2600-3comidas, omni-3714, celiaco-2400, sin-lactosa-2000, sin-pescado-2000, sibo-2000, omni-2174-ancla, omni-2000-sin-atun.
Planes que no son de engine2 (fallo y motor viejo): Hoy: 0 · 2 · con pescado · todas: 0 · 2 · sin pescado · todas: 0 · 2 · con pescado · lentejas: 0 · 2 · sin pescado · lentejas: 0 · 3 · con pescado · todas: 0 · 3 · sin pescado · todas: 0 · 3 · con pescado · lentejas: 0 · 3 · sin pescado · lentejas: 0.

### Pescado (8 perfiles omnívoros sin SIBO)

| Variante (suelo · segundo · alcance) | Pescado/sem | en comida | de segundo | en cena | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 o más | Racha máx. (media) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hoy | 4,30 | 1,72 | 0,00 | 2,59 | 0 % | 0 % | 0 % | 17 % | 45 % | 29 % | 8 % | 1 % | 1,00 |
| 2 · con pescado · todas | 4,60 | 1,34 | 0,81 | 2,46 | 0 % | 0 % | 0 % | 11 % | 37 % | 37 % | 13 % | 2 % | 1,01 |
| 2 · sin pescado · todas | 4,18 | 1,30 | 0,00 | 2,88 | 0 % | 0 % | 0 % | 21 % | 47 % | 26 % | 5 % | 0 % | 1,00 |
| 2 · con pescado · lentejas | 3,97 | 1,20 | 0,15 | 2,62 | 0 % | 0 % | 1 % | 30 % | 46 % | 20 % | 4 % | 0 % | 1,00 |
| 2 · sin pescado · lentejas | 3,92 | 1,20 | 0,00 | 2,72 | 0 % | 0 % | 1 % | 32 % | 45 % | 19 % | 3 % | 0 % | 1,00 |
| 3 · con pescado · todas | 4,53 | 0,90 | 1,16 | 2,48 | 0 % | 0 % | 0 % | 11 % | 41 % | 35 % | 13 % | 1 % | 1,01 |
| 3 · sin pescado · todas | 3,96 | 0,91 | 0,00 | 3,05 | 0 % | 0 % | 0 % | 27 % | 52 % | 19 % | 2 % | 0 % | 1,00 |
| 3 · con pescado · lentejas | 3,72 | 0,84 | 0,22 | 2,66 | 0 % | 0 % | 3 % | 39 % | 41 % | 15 % | 1 % | 0 % | 1,00 |
| 3 · sin pescado · lentejas | 3,60 | 0,83 | 0,00 | 2,77 | 0 % | 0 % | 4 % | 44 % | 43 % | 9 % | 1 % | 0 % | 1,00 |

Las columnas 0–7 son el porcentaje de semanas con ese número de platos de pescado o marisco servidos (comida, segundo y cena).

### Legumbre (8 perfiles omnívoros sin SIBO)

| Variante (suelo · segundo · alcance) | Legumbre/sem | 0 | 1 | 2 | 3 | 4 o más | Con segundo/sem | Plato único/sem | de ellos redactados | Fuera de día sorteado/sem | Día sorteado sin legumbre /100 sem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hoy | 1,30 | 16 % | 45 % | 32 % | 6 % | 0 % | 0,00 | 1,30 | 0,04 | 1,30 | 0,0 |
| 2 · con pescado · todas | 2,26 | 0 % | 2 % | 71 % | 27 % | 1 % | 2,23 | 0,03 | 0,03 | 0,37 | 4,2 |
| 2 · sin pescado · todas | 2,27 | 0 % | 2 % | 70 % | 27 % | 1 % | 2,24 | 0,03 | 0,03 | 0,38 | 4,1 |
| 2 · con pescado · lentejas | 2,37 | 0 % | 0 % | 65 % | 34 % | 2 % | 0,44 | 1,93 | 1,07 | 0,44 | 0,3 |
| 2 · sin pescado · lentejas | 2,38 | 0 % | 0 % | 64 % | 34 % | 2 % | 0,45 | 1,93 | 1,07 | 0,45 | 0,4 |
| 3 · con pescado · todas | 2,95 | 0 % | 0 % | 9 % | 87 % | 4 % | 2,92 | 0,04 | 0,04 | 0,12 | 10,3 |
| 3 · sin pescado · todas | 2,95 | 0 % | 0 % | 9 % | 88 % | 4 % | 2,92 | 0,03 | 0,03 | 0,12 | 10,5 |
| 3 · con pescado · lentejas | 3,09 | 0 % | 0 % | 1 % | 90 % | 10 % | 0,54 | 2,55 | 1,55 | 0,16 | 0,9 |
| 3 · sin pescado · lentejas | 3,09 | 0 % | 0 % | 1 % | 89 % | 10 % | 0,53 | 2,56 | 1,57 | 0,16 | 1,1 |

Días de legumbre (comidas de legumbre por semana en cada día):

| Variante (suelo · segundo · alcance) | L | M | X | J | V | S | D | Patrones más frecuentes |
|---|---|---|---|---|---|---|---|---|
| Hoy | 0,14 | 0,30 | 0,16 | 0,26 | 0,20 | 0,00 | 0,23 | — 16 %, M 11 %, J 11 %, X 8 %, V 6 % |
| 2 · con pescado · todas | 0,39 | 0,30 | 0,31 | 0,32 | 0,42 | 0,00 | 0,51 | XV 9 %, LJ 8 %, MJ 7 %, XD 7 %, JD 7 % |
| 2 · sin pescado · todas | 0,38 | 0,31 | 0,32 | 0,31 | 0,43 | 0,00 | 0,51 | XV 10 %, MJ 7 %, XD 7 %, LJ 7 %, JD 7 % |
| 2 · con pescado · lentejas | 0,39 | 0,31 | 0,32 | 0,32 | 0,46 | 0,00 | 0,57 | XV 8 %, JD 7 %, LJ 7 %, MJ 7 %, MJD 6 % |
| 2 · sin pescado · lentejas | 0,39 | 0,32 | 0,34 | 0,32 | 0,45 | 0,00 | 0,56 | XV 8 %, LJ 7 %, MJ 7 %, JD 7 %, MJD 6 % |
| 3 · con pescado · todas | 0,54 | 0,29 | 0,46 | 0,28 | 0,60 | 0,00 | 0,78 | XVD 17 %, LJD 13 %, MJD 12 %, LXV 12 %, MVD 12 % |
| 3 · sin pescado · todas | 0,54 | 0,29 | 0,46 | 0,28 | 0,59 | 0,00 | 0,79 | XVD 17 %, LJD 13 %, MJD 12 %, MVD 12 %, LXV 12 % |
| 3 · con pescado · lentejas | 0,54 | 0,29 | 0,48 | 0,28 | 0,62 | 0,00 | 0,87 | XVD 19 %, MVD 14 %, LJD 14 %, MJD 13 %, LXV 11 % |
| 3 · sin pescado · lentejas | 0,54 | 0,29 | 0,48 | 0,28 | 0,62 | 0,00 | 0,87 | XVD 19 %, LJD 14 %, MVD 13 %, MJD 13 %, LXV 11 % |

Segundos por familia (por semana) y platos de legumbre como plato único más frecuentes:

| Variante (suelo · segundo · alcance) | ave | carne | pescado | marisco | Plato único: los 4 que más salen (por 100 semanas) |
|---|---|---|---|---|---|
| Hoy | 0,00 | 0,00 | 0,00 | 0,00 | Garbanzos estofados con alca 23,7; Lentejas con pimentón con za 15,3; Garbanzos con pimentón con z 14,6; Garbanzos al curry con bróco 14,5 |
| 2 · con pescado · todas | 0,76 | 0,66 | 0,76 | 0,05 | Fabada asturiana simplificad 1,4; Curry de garbanzos con arroz 0,9; Hummus con pita integral y p 0,7; Cocido madrileño express 0,4 |
| 2 · sin pescado · todas | 1,18 | 1,05 | 0,00 | 0,00 | Fabada asturiana simplificad 1,4; Curry de garbanzos con arroz 0,9; Hummus con pita integral y p 0,6; Cocido madrileño express 0,4 |
| 2 · con pescado · lentejas | 0,15 | 0,14 | 0,14 | 0,01 | Fabada asturiana simplificad 20,9; Garbanzos estofados con alca 19,9; Curry de garbanzos con arroz 18,1; Ensalada tibia de lentejas c 16,4 |
| 2 · sin pescado · lentejas | 0,23 | 0,22 | 0,00 | 0,00 | Garbanzos estofados con alca 20,9; Fabada asturiana simplificad 20,2; Curry de garbanzos con arroz 17,6; Ensalada tibia de lentejas c 15,6 |
| 3 · con pescado · todas | 1,02 | 0,74 | 1,10 | 0,06 | Fabada asturiana simplificad 1,4; Curry de garbanzos con arroz 0,9; Hummus con pita integral y p 0,8; Cocido madrileño express 0,4 |
| 3 · sin pescado · todas | 1,65 | 1,27 | 0,00 | 0,00 | Fabada asturiana simplificad 1,4; Curry de garbanzos con arroz 0,8; Hummus con pita integral y p 0,5; Cocido madrileño express 0,4 |
| 3 · con pescado · lentejas | 0,16 | 0,16 | 0,20 | 0,02 | Fabada asturiana simplificad 31,1; Curry de garbanzos con arroz 24,5; Burrito de alubias negras, a 23,4; Ensalada tibia de lentejas c 23,4 |
| 3 · sin pescado · lentejas | 0,26 | 0,27 | 0,00 | 0,00 | Fabada asturiana simplificad 32,2; Curry de garbanzos con arroz 24,0; Ensalada tibia de lentejas c 23,2; Garbanzos estofados con alca 23,1 |

### Proteína y calorías (8 perfiles omnívoros sin SIBO)

| Variante (suelo · segundo · alcance) | Con segundo: proteína / objetivo (mediana) | cortas (<95 %) | Plato único de legumbre: proteína / objetivo | cortas | Comidas: proteína / objetivo (media) | Comidas y cenas cortas /sem | Bajo 0,3 g/kg /sem | Proteína/día (g) | % del objetivo |
|---|---|---|---|---|---|---|---|---|---|
| Hoy | — | — | 77 % | 1945 de 2077 | 97,4 % | 3,08 | 0,09 | 134,4 | 100,7 % |
| 2 · con pescado · todas | 112 % | 3 de 3564 | 90 % | 34 de 54 | 106,5 % | 1,91 | 0,09 | 138,9 | 104,0 % |
| 2 · sin pescado · todas | 112 % | 5 de 3577 | 90 % | 35 de 53 | 106,6 % | 1,90 | 0,10 | 139,0 | 104,0 % |
| 2 · con pescado · lentejas | 116 % | 0 de 697 | 78 % | 2434 de 3092 | 96,4 % | 3,26 | 0,07 | 133,8 | 100,3 % |
| 2 · sin pescado · lentejas | 115 % | 0 de 720 | 78 % | 2431 de 3089 | 96,4 % | 3,26 | 0,08 | 133,8 | 100,2 % |
| 3 · con pescado · todas | 112 % | 5 de 4668 | 90 % | 34 de 56 | 107,7 % | 1,85 | 0,10 | 139,5 | 104,4 % |
| 3 · sin pescado · todas | 112 % | 14 de 4669 | 90 % | 32 de 50 | 107,8 % | 1,82 | 0,09 | 139,7 | 104,5 % |
| 3 · con pescado · lentejas | 115 % | 0 de 860 | 78 % | 3137 de 4079 | 94,5 % | 3,60 | 0,06 | 132,9 | 99,6 % |
| 3 · sin pescado · lentejas | 115 % | 0 de 846 | 78 % | 3120 de 4091 | 94,7 % | 3,61 | 0,07 | 133,0 | 99,6 % |

| Variante (suelo · segundo · alcance) | Desvío medio de kcal | Semanas fuera de ±5 % | Días fuera/sem | Con segundo: kcal fuera de ±5 % del objetivo de la comida | Días sin verdura/sem |
|---|---|---|---|---|---|
| Hoy | -1,53 % | 12 de 1600 | 0,06 | — | 0,03 |
| 2 · con pescado · todas | -1,55 % | 1 de 1600 | 0,04 | 107 de 3564 | 0,04 |
| 2 · sin pescado · todas | -1,59 % | 5 de 1600 | 0,04 | 99 de 3577 | 0,03 |
| 2 · con pescado · lentejas | -1,45 % | 3 de 1600 | 0,05 | 8 de 697 | 0,02 |
| 2 · sin pescado · lentejas | -1,45 % | 3 de 1600 | 0,04 | 17 de 720 | 0,02 |
| 3 · con pescado · todas | -1,58 % | 4 de 1600 | 0,04 | 112 de 4668 | 0,03 |
| 3 · sin pescado · todas | -1,63 % | 3 de 1600 | 0,04 | 149 de 4669 | 0,03 |
| 3 · con pescado · lentejas | -1,42 % | 2 de 1600 | 0,04 | 16 de 860 | 0,02 |
| 3 · sin pescado · lentejas | -1,40 % | 1 de 1600 | 0,05 | 19 de 846 | 0,02 |

### Gramos de la comida de legumbre a 1434 y 3714 kcal (medianas)

**omni-1434**

| Variante (suelo · segundo · alcance) | Con segundo: g totales | mín–máx | legumbre seca (g) | proteico (g) | con pan o fruta | kcal / objetivo | proteína / objetivo | Plato único: g totales | proteína / objetivo  |
|---|---|---|---|---|---|---|---|---|---|
| Hoy | — | — | — | — | — | — | — | 329,0 | 26 / 36 |
| 2 · con pescado · todas | 453,0 | 389–639 | 50,0 | 105,0 | 5 % | 531 / 538 | 37 / 36 | — | — |
| 2 · sin pescado · todas | 448,0 | 388–639 | 50,0 | 95,0 | 6 % | 534 / 538 | 37 / 36 | — | — |
| 2 · con pescado · lentejas | 438,0 | 388–634 | 50,0 | 95,0 | 1 % | 533 / 538 | 38 / 36 | 358,0 | 27 / 36 |
| 2 · sin pescado · lentejas | 443,0 | 398–634 | 50,0 | 90,0 | 2 % | 531 / 538 | 37 / 36 | 353,0 | 27 / 36 |
| 3 · con pescado · todas | 449,0 | 393–639 | 50,0 | 100,0 | 4 % | 531 / 538 | 38 / 36 | — | — |
| 3 · sin pescado · todas | 453,0 | 393–639 | 50,0 | 95,0 | 6 % | 531 / 538 | 38 / 36 | — | — |
| 3 · con pescado · lentejas | 443,0 | 398–613 | 50,0 | 100,0 | 1 % | 531 / 538 | 38 / 36 | 445,0 | 28 / 36 |
| 3 · sin pescado · lentejas | 439,0 | 398–634 | 50,0 | 90,0 | 6 % | 531 / 538 | 38 / 36 | 445,0 | 28 / 36 |

**omni-2174**

| Variante (suelo · segundo · alcance) | Con segundo: g totales | mín–máx | legumbre seca (g) | proteico (g) | con pan o fruta | kcal / objetivo | proteína / objetivo | Plato único: g totales | proteína / objetivo  |
|---|---|---|---|---|---|---|---|---|---|
| Hoy | — | — | — | — | — | — | — | 453,0 | 38 / 51 |
| 2 · con pescado · todas | 602,0 | 532–792 | 75,0 | 175,0 | 0 % | 813 / 815 | 57 / 51 | — | — |
| 2 · sin pescado · todas | 595,0 | 532–792 | 75,0 | 165,0 | 0 % | 815 / 815 | 57 / 51 | — | — |
| 2 · con pescado · lentejas | 590,0 | 532–772 | 80,0 | 170,0 | 0 % | 809 / 815 | 59 / 51 | 498,0 | 40 / 51 |
| 2 · sin pescado · lentejas | 590,0 | 540–777 | 75,0 | 160,0 | 0 % | 809 / 815 | 58 / 51 | 498,0 | 40 / 51 |
| 3 · con pescado · todas | 602,0 | 528–787 | 80,0 | 170,0 | 0 % | 813 / 815 | 58 / 51 | — | — |
| 3 · sin pescado · todas | 600,0 | 527–792 | 80,0 | 160,0 | 0 % | 815 / 815 | 57 / 51 | — | — |
| 3 · con pescado · lentejas | 587,0 | 537–772 | 80,0 | 170,0 | 0 % | 809 / 815 | 59 / 51 | 520,0 | 40 / 51 |
| 3 · sin pescado · lentejas | 582,0 | 527–772 | 80,0 | 155,0 | 0 % | 810 / 815 | 58 / 51 | 520,0 | 40 / 51 |

**omni-3714**

| Variante (suelo · segundo · alcance) | Con segundo: g totales | mín–máx | legumbre seca (g) | proteico (g) | con pan o fruta | kcal / objetivo | proteína / objetivo | Plato único: g totales | proteína / objetivo  |
|---|---|---|---|---|---|---|---|---|---|
| Hoy | — | — | — | — | — | — | — | 898,0 | 59 / 83 |
| 2 · con pescado · todas | 909,0 | 762–1272 | 110,0 | 300,0 | 81 % | 1392 / 1393 | 98 / 83 | — | — |
| 2 · sin pescado · todas | 927,0 | 777–1302 | 105,0 | 270,0 | 89 % | 1396 / 1393 | 99 / 83 | — | — |
| 2 · con pescado · lentejas | 917,0 | 777–1122 | 110,0 | 290,0 | 86 % | 1389 / 1393 | 101 / 83 | 898,0 | 59 / 83 |
| 2 · sin pescado · lentejas | 907,0 | 762–1182 | 110,0 | 260,0 | 93 % | 1395 / 1393 | 102 / 83 | 898,0 | 59 / 83 |
| 3 · con pescado · todas | 927,0 | 777–1272 | 110,0 | 295,0 | 81 % | 1393 / 1393 | 97 / 83 | — | — |
| 3 · sin pescado · todas | 927,0 | 767–1302 | 105,0 | 255,0 | 91 % | 1398 / 1393 | 100 / 83 | — | — |
| 3 · con pescado · lentejas | 907,0 | 762–1142 | 110,0 | 300,0 | 82 % | 1393 / 1393 | 101 / 83 | 898,0 | 59 / 83 |
| 3 · sin pescado · lentejas | 904,0 | 757–1217 | 105,0 | 265,0 | 90 % | 1397 / 1393 | 102 / 83 | 898,0 | 60 / 83 |

### Huecos sin candidato y filtros que no se pudieron aplicar (8 perfiles, por 100 semanas)

| Variante (suelo · segundo · alcance) | Segundo sin candidato | Día de legumbre sin candidato | Suelo corto sin candidato (paso 4) | Walk repetido sin familia | Huecos: tope sin aplicar | separación | familia | aliño | Segundos: tope | separación  | familia  | aliño  |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hoy | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,1 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 |
| 2 · con pescado · todas | 0,0 | 4,2 | 0,0 | 0,0 | 0,0 | 0,0 | 0,6 | 0,3 | 0,0 | 0,0 | 0,0 | 1,4 |
| 2 · sin pescado · todas | 0,0 | 4,1 | 0,0 | 0,0 | 0,0 | 0,0 | 0,2 | 0,6 | 0,0 | 0,0 | 14,1 | 4,7 |
| 2 · con pescado · lentejas | 0,0 | 0,3 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 |
| 2 · sin pescado · lentejas | 0,0 | 0,4 | 0,0 | 0,0 | 0,0 | 0,0 | 0,1 | 0,1 | 0,0 | 0,0 | 4,3 | 0,1 |
| 3 · con pescado · todas | 0,0 | 10,3 | 0,0 | 0,0 | 0,0 | 0,0 | 0,5 | 0,5 | 0,0 | 0,0 | 0,0 | 1,4 |
| 3 · sin pescado · todas | 0,0 | 10,5 | 0,0 | 0,0 | 0,0 | 0,0 | 0,1 | 0,6 | 0,0 | 0,1 | 15,5 | 11,1 |
| 3 · con pescado · lentejas | 0,0 | 0,9 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 |
| 3 · sin pescado · lentejas | 0,0 | 1,1 | 0,0 | 0,0 | 0,0 | 0,0 | 0,1 | 0,1 | 0,0 | 0,0 | 6,2 | 0,3 |

### Reglas de D-099.3, D-114 y D-115 y restricciones (los 10 perfiles medidos, total de casos)

| Variante (suelo · segundo · alcance) | Plato repetido en la semana | Plato de la semana anterior | Especie más de 2 veces | Especie dos veces el mismo día | Especie en días seguidos (sin ancla) | Legumbre en cena | D-114: sugerencia con segundo | D-115: familia en días seguidos (sin ancla) | de ellas, legumbre | Comidas con vetado | con eliminado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hoy | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 251 | 0 | 0 | 0 |
| 2 · con pescado · todas | 0 | 0 | 18 | 10 | 36 | 0 | 0 | 487 | 0 | 0 | 0 |
| 2 · sin pescado · todas | 0 | 0 | 18 | 10 | 36 | 0 | 0 | 706 | 0 | 0 | 0 |
| 2 · con pescado · lentejas | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 264 | 0 | 0 | 0 |
| 2 · sin pescado · lentejas | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 333 | 0 | 0 | 0 |
| 3 · con pescado · todas | 0 | 0 | 21 | 15 | 37 | 0 | 0 | 487 | 0 | 0 | 0 |
| 3 · sin pescado · todas | 0 | 0 | 21 | 15 | 38 | 0 | 0 | 729 | 0 | 0 | 0 |
| 3 · con pescado · lentejas | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 209 | 0 | 0 | 0 |
| 3 · sin pescado · lentejas | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 309 | 0 | 0 | 0 |

### Por perfil: pescado, legumbre, calorías y proteína

**Hoy**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,31 | 1,27 | 0,00 | -1,15 % | 0 | 97,6 % | 3,94 | 0 | 0 | 0 |
| omni-2174 | 4,33 | 1,26 | 0,00 | -1,08 % | 0 | 99,9 % | 2,87 | 0 | 0 | 0 |
| omni-2600-3comidas | 4,35 | 1,27 | 0,00 | -2,31 % | 7 | 105,6 % | 2,36 | 0 | 0 | 0 |
| omni-3714 | 4,32 | 1,24 | 0,00 | -2,56 % | 4 | 99,8 % | 4,36 | 0 | 0 | 0 |
| celiaco-2400 | 4,41 | 1,41 | 0,00 | -1,35 % | 0 | 98,3 % | 2,79 | 0 | 0 | 0 |
| sin-lactosa-2000 | 4,47 | 1,29 | 0,00 | -1,37 % | 0 | 102,3 % | 2,52 | 1 | 0 | 0 |
| sin-pescado-2000 | 0,00 | 2,15 | 0,00 | -1,33 % | 0 | 99,7 % | 4,33 | 248 | 0 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 0 | 0 |
| omni-2174-ancla | 4,15 | 1,48 | 0,00 | -0,98 % | 1 | 99,8 % | 2,95 | 0 | 0 | 0 |
| omni-2000-sin-atun | 4,09 | 1,17 | 0,00 | -1,44 % | 0 | 102,3 % | 2,84 | 0 | 0 | 0 |

**2 · con pescado · todas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,63 | 2,27 | 2,27 | -1,09 % | 0 | 100,4 % | 2,47 | 0 | 8 | 0 |
| omni-2174 | 4,66 | 2,29 | 2,29 | -1,24 % | 0 | 103,0 % | 1,68 | 1 | 10 | 0 |
| omni-2600-3comidas | 4,64 | 2,24 | 2,24 | -2,28 % | 1 | 110,0 % | 1,26 | 3 | 9 | 0 |
| omni-3714 | 4,63 | 2,27 | 2,27 | -2,19 % | 0 | 103,7 % | 3,14 | 1 | 11 | 0 |
| celiaco-2400 | 4,74 | 2,28 | 2,28 | -1,51 % | 0 | 102,9 % | 1,50 | 4 | 10 | 0 |
| sin-lactosa-2000 | 4,75 | 2,25 | 2,25 | -1,45 % | 0 | 104,8 % | 1,58 | 0 | 10 | 0 |
| sin-pescado-2000 | 0,00 | 2,79 | 2,73 | -1,55 % | 0 | 103,0 % | 2,72 | 476 | 20 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 400 | 0 |
| omni-2174-ancla | 4,38 | 2,23 | 1,96 | -1,14 % | 0 | 102,6 % | 1,79 | 0 | 4 | 0 |
| omni-2000-sin-atun | 4,41 | 2,26 | 2,26 | -1,53 % | 0 | 104,5 % | 1,84 | 0 | 5 | 0 |

**2 · sin pescado · todas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,18 | 2,24 | 2,24 | -1,24 % | 0 | 100,2 % | 2,44 | 30 | 8 | 0 |
| omni-2174 | 4,24 | 2,25 | 2,25 | -1,25 % | 2 | 103,1 % | 1,69 | 28 | 10 | 0 |
| omni-2600-3comidas | 4,22 | 2,25 | 2,25 | -2,34 % | 1 | 109,9 % | 1,24 | 22 | 8 | 0 |
| omni-3714 | 4,24 | 2,24 | 2,24 | -2,25 % | 0 | 104,1 % | 3,02 | 27 | 9 | 0 |
| celiaco-2400 | 4,36 | 2,29 | 2,29 | -1,49 % | 0 | 103,1 % | 1,51 | 28 | 10 | 0 |
| sin-lactosa-2000 | 4,24 | 2,27 | 2,27 | -1,44 % | 1 | 104,9 % | 1,50 | 23 | 8 | 0 |
| sin-pescado-2000 | 0,00 | 2,79 | 2,73 | -1,55 % | 0 | 103,0 % | 2,72 | 476 | 20 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 400 | 0 |
| omni-2174-ancla | 4,09 | 2,27 | 2,00 | -1,14 % | 1 | 102,7 % | 1,77 | 50 | 4 | 0 |
| omni-2000-sin-atun | 3,85 | 2,33 | 2,33 | -1,56 % | 0 | 104,3 % | 2,02 | 20 | 8 | 0 |

**2 · con pescado · lentejas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,04 | 2,40 | 0,46 | -0,89 % | 0 | 97,2 % | 4,16 | 0 | 0 | 0 |
| omni-2174 | 4,08 | 2,35 | 0,44 | -1,13 % | 1 | 99,5 % | 3,06 | 0 | 0 | 0 |
| omni-2600-3comidas | 3,91 | 2,36 | 0,40 | -2,20 % | 2 | 105,3 % | 2,65 | 0 | 0 | 0 |
| omni-3714 | 3,96 | 2,37 | 0,46 | -2,33 % | 0 | 99,6 % | 4,30 | 0 | 0 | 0 |
| celiaco-2400 | 4,08 | 2,42 | 0,53 | -1,24 % | 0 | 97,8 % | 3,15 | 0 | 3 | 0 |
| sin-lactosa-2000 | 4,07 | 2,33 | 0,42 | -1,39 % | 0 | 101,8 % | 2,60 | 0 | 2 | 0 |
| sin-pescado-2000 | 0,00 | 2,78 | 0,63 | -1,41 % | 0 | 100,1 % | 3,98 | 262 | 0 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 400 | 0 |
| omni-2174-ancla | 3,94 | 2,30 | 0,36 | -1,09 % | 0 | 99,5 % | 3,02 | 0 | 0 | 0 |
| omni-2000-sin-atun | 3,69 | 2,42 | 0,42 | -1,32 % | 0 | 101,5 % | 3,15 | 0 | 0 | 0 |

**2 · sin pescado · lentejas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 3,94 | 2,38 | 0,46 | -0,97 % | 0 | 96,8 % | 4,29 | 11 | 0 | 0 |
| omni-2174 | 3,91 | 2,40 | 0,48 | -1,14 % | 0 | 99,4 % | 3,04 | 9 | 0 | 0 |
| omni-2600-3comidas | 3,92 | 2,38 | 0,45 | -2,12 % | 2 | 105,8 % | 2,44 | 5 | 1 | 0 |
| omni-3714 | 3,96 | 2,42 | 0,44 | -2,30 % | 1 | 99,5 % | 4,30 | 9 | 2 | 0 |
| celiaco-2400 | 4,09 | 2,41 | 0,51 | -1,34 % | 0 | 97,6 % | 3,16 | 8 | 3 | 0 |
| sin-lactosa-2000 | 3,98 | 2,38 | 0,48 | -1,39 % | 0 | 101,8 % | 2,65 | 9 | 0 | 0 |
| sin-pescado-2000 | 0,00 | 2,78 | 0,63 | -1,41 % | 0 | 100,1 % | 3,98 | 262 | 0 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 400 | 0 |
| omni-2174-ancla | 3,86 | 2,29 | 0,32 | -0,99 % | 0 | 99,4 % | 3,04 | 17 | 0 | 0 |
| omni-2000-sin-atun | 3,67 | 2,38 | 0,47 | -1,33 % | 0 | 101,6 % | 3,13 | 1 | 0 | 0 |

**3 · con pescado · todas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,59 | 2,92 | 2,92 | -1,19 % | 0 | 100,4 % | 2,29 | 0 | 23 | 0 |
| omni-2174 | 4,59 | 2,95 | 2,95 | -1,29 % | 1 | 103,5 % | 1,63 | 1 | 24 | 0 |
| omni-2600-3comidas | 4,54 | 2,98 | 2,98 | -2,21 % | 0 | 110,5 % | 1,33 | 1 | 14 | 0 |
| omni-3714 | 4,59 | 2,98 | 2,98 | -2,11 % | 0 | 104,4 % | 2,90 | 0 | 19 | 0 |
| celiaco-2400 | 4,64 | 2,94 | 2,94 | -1,51 % | 0 | 103,6 % | 1,46 | 4 | 22 | 0 |
| sin-lactosa-2000 | 4,71 | 2,95 | 2,95 | -1,58 % | 1 | 105,1 % | 1,43 | 2 | 17 | 0 |
| sin-pescado-2000 | 0,00 | 3,11 | 3,02 | -1,60 % | 0 | 102,9 % | 2,78 | 477 | 33 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 600 | 0 |
| omni-2174-ancla | 4,38 | 2,93 | 2,65 | -1,20 % | 1 | 103,0 % | 1,84 | 0 | 22 | 0 |
| omni-2000-sin-atun | 4,21 | 2,97 | 2,97 | -1,53 % | 1 | 104,5 % | 1,97 | 0 | 23 | 0 |

**3 · sin pescado · todas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,05 | 2,94 | 2,94 | -1,28 % | 0 | 100,4 % | 2,21 | 25 | 22 | 0 |
| omni-2174 | 3,98 | 2,98 | 2,98 | -1,34 % | 1 | 103,5 % | 1,60 | 26 | 18 | 0 |
| omni-2600-3comidas | 4,00 | 2,94 | 2,94 | -2,38 % | 0 | 110,3 % | 1,25 | 24 | 20 | 0 |
| omni-3714 | 3,98 | 2,94 | 2,94 | -2,11 % | 2 | 105,1 % | 2,83 | 28 | 19 | 0 |
| celiaco-2400 | 4,18 | 2,94 | 2,94 | -1,51 % | 0 | 103,7 % | 1,48 | 31 | 22 | 0 |
| sin-lactosa-2000 | 4,13 | 2,94 | 2,94 | -1,61 % | 0 | 105,2 % | 1,48 | 23 | 23 | 0 |
| sin-pescado-2000 | 0,00 | 3,11 | 3,02 | -1,60 % | 0 | 102,9 % | 2,78 | 477 | 33 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 600 | 0 |
| omni-2174-ancla | 3,67 | 2,94 | 2,69 | -1,19 % | 0 | 103,2 % | 1,73 | 74 | 21 | 0 |
| omni-2000-sin-atun | 3,68 | 2,96 | 2,96 | -1,63 % | 0 | 104,6 % | 1,96 | 19 | 23 | 0 |

**3 · con pescado · lentejas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 3,76 | 3,13 | 0,52 | -0,71 % | 0 | 96,3 % | 4,50 | 0 | 1 | 0 |
| omni-2174 | 3,73 | 3,11 | 0,55 | -1,15 % | 0 | 98,2 % | 3,59 | 0 | 0 | 0 |
| omni-2600-3comidas | 3,71 | 3,08 | 0,51 | -2,08 % | 2 | 105,1 % | 2,85 | 0 | 0 | 0 |
| omni-3714 | 3,77 | 3,08 | 0,49 | -2,32 % | 0 | 99,0 % | 4,39 | 0 | 1 | 0 |
| celiaco-2400 | 3,87 | 3,07 | 0,66 | -1,26 % | 0 | 97,0 % | 3,52 | 0 | 5 | 0 |
| sin-lactosa-2000 | 3,81 | 3,06 | 0,62 | -1,37 % | 0 | 101,2 % | 2,91 | 0 | 5 | 0 |
| sin-pescado-2000 | 0,00 | 3,16 | 0,54 | -1,40 % | 0 | 99,8 % | 4,03 | 207 | 3 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 600 | 0 |
| omni-2174-ancla | 3,69 | 3,04 | 0,46 | -1,08 % | 0 | 98,6 % | 3,46 | 0 | 1 | 0 |
| omni-2000-sin-atun | 3,44 | 3,12 | 0,50 | -1,35 % | 0 | 101,0 % | 3,56 | 0 | 2 | 0 |

**3 · sin pescado · lentejas**

| Perfil | Pescado/sem | Legumbre/sem | Con segundo/sem | Desvío kcal | Fuera de ±5 % | Proteína/día (% obj.) | Cortas/sem | D-115 sin ancla | Día sorteado sin legumbre | Segundo sin candidato |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 3,72 | 3,06 | 0,45 | -0,64 % | 1 | 96,4 % | 4,50 | 8 | 3 | 0 |
| omni-2174 | 3,65 | 3,11 | 0,51 | -1,17 % | 0 | 98,2 % | 3,56 | 9 | 1 | 0 |
| omni-2600-3comidas | 3,62 | 3,09 | 0,57 | -2,11 % | 0 | 105,2 % | 2,85 | 12 | 1 | 0 |
| omni-3714 | 3,65 | 3,10 | 0,51 | -2,24 % | 0 | 99,2 % | 4,30 | 5 | 0 | 0 |
| celiaco-2400 | 3,77 | 3,07 | 0,68 | -1,30 % | 0 | 96,8 % | 3,62 | 19 | 7 | 0 |
| sin-lactosa-2000 | 3,65 | 3,08 | 0,60 | -1,38 % | 0 | 101,3 % | 3,08 | 12 | 4 | 0 |
| sin-pescado-2000 | 0,00 | 3,16 | 0,54 | -1,40 % | 0 | 99,8 % | 4,03 | 207 | 3 | 0 |
| sibo-2000 | 5,03 | 0,00 | 0,00 | -1,12 % | 0 | 99,4 % | 1,91 | 2 | 600 | 0 |
| omni-2174-ancla | 3,46 | 3,05 | 0,45 | -1,07 % | 0 | 98,7 % | 3,56 | 23 | 0 | 0 |
| omni-2000-sin-atun | 3,29 | 3,12 | 0,47 | -1,28 % | 0 | 101,0 % | 3,38 | 12 | 2 | 0 |

## 5. Lectura

Salvo que se diga otra cosa, las cifras de esta sección salen de las tablas de la sección 4.

### 5.1 Variantes

- **Suelo.** Con 2 salen 2,26 legumbres por semana y con 3 salen 2,95. Las de más sobre el suelo son las que salen por azar fuera de los días sorteados (0,37 y 0,12 por semana).
- **Pescado de segundo.** Permitido, 0,81–1,16 segundos por semana son de pescado y el total sube a 4,53–4,60; el 13 % de las semanas tiene 6. Sin él, el total baja a 3,96–4,18 y ninguna semana baja de 3. En todas las variantes el pescado de la comida baja (de 1,72 a 0,90 con suelo 3) porque la legumbre ocupa comidas, y el de la cena sube.
- **Alcance.** Con «lentejas» solo 0,44–0,54 comidas por semana llevan segundo. El resto de la legumbre (1,93–2,56 por semana) va como plato único, y más de la mitad son platos redactados: fabada, curry con arroz, burrito y ensalada de lentejas pasan de casi nada a 16–32 por 100 semanas cada uno.

### 5.2 Días sorteados que se quedan sin legumbre

**Cuántos.** Con «3 · con pescado · todas», 164 días sorteados sin legumbre en 1600 semanas (10,3 por cada 100 semanas), en 163 semanas distintas. Con «3 · sin pescado · todas», 168; con «2 · con pescado · todas», 67; con «3 · con pescado · lentejas», 15. Por día, en la primera: domingo 127, viernes 18, miércoles 15, jueves 4, **lunes y martes 0**. (Fuente: `resumenEstructura.mjs` para el total; el reparto por día y lo que sigue, leídos de los `.json` de `estructura-comida/` cruzando `diasSorteados` con `legumbres`, sin medir nada nuevo.)

**Causa: la preferencia B se aplica antes que el nivel del día de legumbre.**

1. El prototipo pone el nivel del día de legumbre en el sitio del paso 4: el hook sustituye la llamada a `chooseFrequencyLevel` de `src/engine2/walk/runWalk.js:540` (`estructuraComida.mjs:43`). Esa llamada recibe `candidatesB`, lo que queda después de todos los filtros del hueco y de las preferencias A y B.
2. La preferencia B (`runWalk.js:512-526`) mira las dos comidas anteriores de la semana (`getDishAt`, `runWalk.js:282-286`). Si tienen la misma sensación térmica (`:515`), quita los candidatos con esa sensación (`:519-522`), salvo que no quede ninguno.
3. De los 11 primeros rotativos, 9 son «muy caliente» (todos los guisos). Solo 2 son «caliente»: garbanzos al curry con brócoli y garbanzos al ajillo con tomate cherry (`dishes.json`, campo `tempFeel`).
4. Cuando B quita «muy caliente», solo pueden llegar esos 2 platos de garbanzos. Antes de B ya han pasado por no repetir plato en la semana ni de la anterior (`runWalk.js:362`), el tope de 2 por especie (`:396`), la separación por especie (`:415`) y el tope de 2 ajillos por semana (`:484`, `TOPE_AJILLO_SEMANA` en `alinosD105.js:42`). Si ninguno sobrevive, el nivel del día queda vacío. `estructuraComidaLogica.mjs:135-139` lo anota como `dia_legumbre_sin_candidato`, y el hueco sigue con el paso 4 de siempre.

**Lo que lo confirma en los datos guardados:**

- **Nunca en lunes ni en martes.** B necesita dos comidas anteriores dentro de la semana (`anteayer` solo existe si `i > 1`, `runWalk.js:512`).
- **Dos días antes suele haber otra legumbre.** En 125 de los 164 casos el día sorteado de dos días antes tuvo legumbre, y en 121 de ellas era un guiso «muy caliente». Eso da la primera de las dos comidas que B mira. La de la víspera nunca es de legumbre (el día de al lado de uno sorteado no la lleva).
- **El domingo concentra los casos.** 6 de los 7 conjuntos válidos de 3 días lo incluyen, y 3 de esos 6 incluyen también el viernes. Además, la comida que B mira la víspera del domingo es la sugerencia del sábado: está colocada en su hueco (`pushFill`, `runWalk.js:253`), así que `getDishAt` la devuelve aunque no se sirva.
- **Con alcance «lentejas» casi no pasa (15).** Ahí el día de legumbre admite también los redactados, y 4 de ellos no son «muy caliente»: burrito, falafel, hummus con pollo y ensalada de lentejas.

**Lo que no está medido.** Los datos guardados no tienen la sensación térmica de la víspera ni qué filtro quitó el último plato de garbanzos. Para cerrar el reparto entre B sola y B con el tope, la separación o el aliño, y para confirmar el papel de la sugerencia del sábado, hay que medir de nuevo guardando la evidencia del hueco en cada caso. No lo he hecho. `diagDiaSinLegumbre.mjs` imprime esa evidencia en unos pocos casos: en los 6 que leí sale «preferencia B aplicada: descarta tempFeel="muy_caliente"». Ese script no monta la comida doble, así que desde la segunda semana sus menús no son los medidos: vale como ejemplo, no como recuento.

**Para la implementación:** evaluar el día de legumbre antes de las preferencias A y B, o no aplicarlas en ese hueco. No se ha medido con ese orden.

### 5.3 El domingo

El sábado no puede ser día de legumbre y viernes y domingo no son seguidos. De los 7 conjuntos válidos de 3 días, 6 incluyen el domingo. Con suelo 3 el domingo lleva legumbre 0,78 veces por semana, frente a 0,28–0,29 el martes y el jueves. Con suelo 2 son 0,51 frente a 0,30. Si no se quiere, hay dos salidas sin pesos: tratar viernes y domingo como seguidos, o sacar el domingo del sorteo. No se han medido.

### 5.4 Proteína y tamaño

- La comida con segundo queda en el 112 % de su objetivo de proteína de mediana. A 3714 kcal son 97–100 g frente a 83: el motor dimensiona la proteína contando la legumbre a su cantidad de partida, y luego la legumbre crece.
- A 1434 kcal la comida pesa unos 450 g (329 hoy), con 50 g de legumbre en seco y unos 100 g de carne o pescado.
- A 3714 kcal pesa unos 920 g (898 hoy), con 105–110 g de legumbre y 255–300 g de proteína, y lleva pan en el 81–91 % de los casos.
- El tope de la legumbre funciona: con segundo, la legumbre no pasa de 130 g en seco en ninguna comida de las variantes «todas» (máximo leído de los `.json`), frente a 180 como plato único a 3714 kcal.

### 5.5 Reglas y restricciones

- **8 perfiles omnívoros:** ninguna infracción de D-099.3 (plato repetido, semana anterior, tope por especie, mismo día, días seguidos, legumbre en cena) ni de D-114 (la sugerencia del sábado nunca lleva segundo).
- **D-115 en esos 8 perfiles:** con pescado de segundo, unas 10 repeticiones de familia en días seguidos en 1600 semanas. Sin pescado, entre 228 y 250: el segundo solo puede ser ave o carne y a veces las dos familias ya salen el día de al lado. El filtro no se puede aplicar al segundo 14,1 y 15,5 veces por cada 100 semanas. (Son el total de los 10 perfiles menos los del perfil sin pescado ni marisco y el SIBO, de la tabla por perfil.)
- **SIBO:** el sorteo de días se hace aunque no tenga platos de legumbre, y cada día sorteado se anota sin candidato (400 y 600 en 200 semanas). No cambia sus menús. Una implementación no debería sortear días para un perfil sin platos de legumbre.
- **Perfil sin pescado ni marisco:** con la regla para todas, en 200 semanas hay 21 semanas con una especie más de 2 veces, 15 especies repetidas el mismo día y 37 en días seguidos (hoy, 0). Tiene pocas especies y el segundo añade tres apariciones de proteína a la semana. Las repeticiones de familia pasan de 248 a 477.
- **Restricciones:** ninguna comida con un alimento vetado o eliminado, en ninguna variante.
- **Segundo sin candidato:** nunca.
- **Días sin verdura:** igual que hoy (0,03 por semana).

### 5.6 Perfil con ancla

Las legumbres del ancla cuentan para el suelo y, si son compuestos de legumbre, llevan segundo. Cuando el segundo plato del ancla es un redactado (fabada, curry con arroz) se queda como plato único. Las cantidades que la receta manda guardar el día de cocinar no se han recalculado con la media ración.

## 6. Vegetariano y vegano

La regla no se les aplica y no se han medido. Fuente: `catalogoSegundosSopa.mjs` para los segundos; las legumbres por semana, de `repartoLegumbre.mjs` con las reglas actuales.

- **Segundos disponibles:** el vegetariano tiene 8 platos de «proteína con verdura» sin cereal y los 8 son de huevo, que está excluido. El vegano no tiene ninguno.
- **No la necesitan para el suelo:** hoy salen 2,62 legumbres por semana en vegetariana y 3,25 en vegana.
- **Su problema es otro:** la legumbre es su proteína. Un segundo tendría que ser de tofu, tempeh o seitán, y esos platos son redactados con su propio hidrato, no «proteína con verdura». Haría falta catálogo nuevo y una decisión aparte.

## 7. Semanas en texto

Variante «3 · sin pescado · todas». Fuente: `medirEstructura.mjs --texto` (copia de `estructura-comida/s3-sinPescado-todas.md`; las otras variantes tienen su `.md` al lado). Las cantidades son las que salen de las raciones del motor.

### omni-1434, semana 60 (1434 kcal)

Días de legumbre sorteados: Martes, Jueves, Domingo.

| Día | Comida | Cena |
|---|---|---|
| Lunes | Sardinas a la plancha con tomate cherry y arroz blanco | Pechuga de pavo al horno con mostaza y miel con espinacas y boniato |
| Martes | Garbanzos al curry con brócoli; de segundo, conejo al ajillo con alcachofas | Huevos revueltos con pimientos |
| Miércoles | Bowl asiático de salmón con quinoa | Crema de puerro con pechuga de pollo encima |
| Jueves | Garbanzos con pimentón con zanahoria; de segundo, lomo de cerdo al horno con mostaza y miel con col de bruselas | Tortilla de patatas completa con ensalada |
| Viernes | Bowl proteico de pechuga de pavo con boniato | Salmón a la plancha con espárragos |
| Sábado | Libre (sugerencia: Tacos de pescado blanco con ensalada de col) | Ternera magra en ensalada |
| Domingo | Lentejas con pimentón con pimientos; de segundo, pechuga de pollo al horno con hierbas provenzales con berenjena | Sardinas a la plancha con escalivada y pan tostado |

**Martes, comida** (482 de 512 kcal; 35 de 35 g de proteína)

- De primero: Garbanzos (50 g en seco) guisados con curry y cúrcuma · ½ brócoli (75 g) · caldo de verduras · AOVE (5 ml)
- De segundo: Conejo troceado (85 g) al horno con ajo, perejil y guindilla · 2 alcachofas asadas (160 g) · AOVE (10 ml)
- Compra: Garbanzos (50 g en seco) · Brócoli (½, 75 g) · Curry en polvo (1 cdita) · Cúrcuma · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (5 ml) · Conejo troceado (85 g) · Alcachofas (2 alcachofas, 160 g) · Ajo (2 dientes) · Perejil fresco · Guindilla (opcional) · AOVE (10 ml)

**Jueves, comida** (515 de 494 kcal; 35 de 35 g de proteína)

- De primero: Garbanzos (50 g en seco) guisados con pimentón ahumado y ajo · 1 zanahoria (50 g) · caldo de verduras · AOVE (5 ml)
- De segundo: Lomo de cerdo (105 g) al horno con mostaza y miel · 9 coles de Bruselas asadas (130 g) · AOVE (5 ml)
- Compra: Garbanzos (50 g en seco) · Zanahorias (1 zanahoria, 50 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (5 ml) · Lomo de cerdo (105 g) · Coles de Bruselas (9 coles, 130 g) · Mostaza (1 cdita) · Miel (1 cdita) · AOVE (5 ml)

**Domingo, comida** (470 de 487 kcal; 40 de 39 g de proteína)

- De primero: Lentejas (50 g en seco) guisadas con pimentón ahumado y ajo · ½ pimiento (75 g) · caldo de verduras · AOVE (5 ml)
- De segundo: Pechuga de pollo (105 g) al horno con hierbas provenzales · ½ berenjena a la plancha (180 g) · AOVE (10 ml)
- Compra: Lentejas (50 g en seco) · Pimientos (½, 75 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (5 ml) · Pechuga de pollo (105 g) · Berenjena (½, 180 g) · Hierbas provenzales · AOVE (10 ml)

### omni-2174, semana 60 (2174 kcal)

Días de legumbre sorteados: Martes, Jueves, Domingo.

| Día | Comida | Cena |
|---|---|---|
| Lunes | Pasta integral al ajillo con atún en conserva | Pisto manchego con huevo a la plancha |
| Martes | Lentejas con pimentón con pimientos; de segundo, pechuga de pollo al horno con hierbas provenzales con berenjena | Lomo de cerdo a la plancha con mostaza y miel con brócoli |
| Miércoles | Bowl asiático de salmón con quinoa | Huevos rellenos de atún con ensalada |
| Jueves | Garbanzos estofados con alcachofas; de segundo, pechuga de pavo a la plancha con judías verdes | Menestra de verduras de temporada con jamón |
| Viernes | Merluza al horno con puerro y arroz blanco | Sopa de miso con tofu firme, setas shiitake y alga wakame |
| Sábado | Libre (sugerencia: Caldo gallego de repollo (completo)) | Crema de calabaza con pechuga de pollo encima |
| Domingo | Lentejas con pimentón con espinacas; de segundo, lomo de cerdo al horno con mostaza y miel con col de bruselas | Sopa castellana con jamón serrano y huevo pochado |

**Martes, comida** (814 de 815 kcal; 61 de 54 g de proteína)

- De primero: Lentejas (80 g en seco) guisadas con pimentón ahumado y ajo · ½ pimiento (90 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pollo (165 g) al horno con hierbas provenzales · 1 berenjena pequeña a la plancha (220 g) · AOVE (20 ml)
- Compra: Lentejas (80 g en seco) · Pimientos (½, 90 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pollo (165 g) · Berenjena (1 pequeña, 220 g) · Hierbas provenzales · AOVE (20 ml)

**Jueves, comida** (825 de 815 kcal; 59 de 54 g de proteína)

- De primero: Garbanzos (80 g en seco) guisados con limón, orégano y ajo · 1 alcachofa (100 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pavo (150 g) a la plancha con ajo, perejil y guindilla · 4 puñados de judías verdes al vapor (175 g) · AOVE (20 ml)
- Compra: Garbanzos (80 g en seco) · Alcachofas (1 alcachofa, 100 g) · Limón (½) · Orégano · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pavo (150 g) · Judías verdes (4 puñados, 175 g) · Ajo (2 dientes) · Perejil fresco · Guindilla (opcional) · AOVE (20 ml)

**Domingo, comida** (805 de 815 kcal; 52 de 49 g de proteína)

- De primero: Lentejas (65 g en seco) guisadas con pimentón ahumado y ajo · 2 puñados de espinacas (80 g) · caldo de verduras · AOVE (10 ml)
- De segundo: Lomo de cerdo (150 g) al horno con mostaza y miel · 11 coles de Bruselas asadas (160 g) · AOVE (20 ml)
- Compra: Lentejas (65 g en seco) · Espinacas frescas (2 puñados, 80 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (10 ml) · Lomo de cerdo (150 g) · Coles de Bruselas (11 coles, 160 g) · Mostaza (1 cdita) · Miel (1 cdita) · AOVE (20 ml)

### omni-2174, semana 61 (2174 kcal)

Días de legumbre sorteados: Lunes, Miercoles, Viernes.

| Día | Comida | Cena |
|---|---|---|
| Lunes | Alubias blancas al ajillo con pimientos; de segundo, pechuga de pollo salteada con hierbas provenzales con champiñones | Salmón al airfryer con verduras asadas |
| Martes | Huevos revueltos con espinacas y arroz blanco | Ternera magra al horno con brócoli y boniato |
| Miércoles | Garbanzos con pimentón con zanahoria; de segundo, pechuga de pollo al horno con hierbas provenzales con puerro | Atún en conserva en ensalada |
| Jueves | Pasta integral al pomodoro con ternera magra | Crema de calabacín con queso fresco y huevo |
| Viernes | Lentejas con pimentón con zanahoria; de segundo, pechuga de pavo al horno con tomate casero con berenjena | Salmón a la plancha con espárragos |
| Sábado | Libre (sugerencia: Lomo de cerdo al horno con mostaza y miel con col de bruselas y patata) | Conejo al horno con espinacas y patata |
| Domingo | Pasta integral al pomodoro con pechuga de pavo | Atún en conserva en crudo con lechuga mixta y pepino |

**Lunes, comida** (793 de 815 kcal; 59 de 51 g de proteína)

- De primero: Alubias blancas (90 g en seco) guisadas con ajo, perejil y guindilla · ½ pimiento (90 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pollo (150 g) salteada con hierbas provenzales · 8 champiñones salteados (160 g) · AOVE (20 ml)
- Compra: Alubias blancas (90 g en seco) · Pimientos (½, 90 g) · Ajo (2 dientes) · Perejil fresco · Guindilla (opcional) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pollo (150 g) · Champiñones (8 champiñones, 160 g) · Hierbas provenzales · AOVE (20 ml)

**Miércoles, comida** (823 de 815 kcal; 56 de 51 g de proteína)

- De primero: Garbanzos (80 g en seco) guisados con pimentón ahumado y ajo · 1 zanahoria (60 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pollo (165 g) al horno con hierbas provenzales · 1 puerro mediano pochado (150 g) · AOVE (20 ml)
- Compra: Garbanzos (80 g en seco) · Zanahorias (1 zanahoria, 60 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pollo (165 g) · Puerro (1 mediano, 150 g) · Hierbas provenzales · AOVE (20 ml)

**Viernes, comida** (820 de 815 kcal; 57 de 51 g de proteína)

- De primero: Lentejas (75 g en seco) guisadas con pimentón ahumado y ajo · 1 zanahoria (60 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pavo (135 g) al horno con salsa de tomate casera · 1 berenjena pequeña a la plancha (220 g) · AOVE (20 ml)
- Compra: Lentejas (75 g en seco) · Zanahorias (1 zanahoria, 60 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pavo (135 g) · Berenjena (1 pequeña, 220 g) · Tomate triturado (150 g) · AOVE (20 ml)

### omni-2174, semana 62 (2174 kcal)

Días de legumbre sorteados: Lunes, Jueves, Domingo.

| Día | Comida | Cena |
|---|---|---|
| Lunes | Lentejas con pimentón con espinacas; de segundo, ternera magra a la plancha con pimientos | Merluza al horno con alcachofas |
| Martes | Pechuga de pollo en ensalada | Espárragos con mayonesa, atún y huevo duro |
| Miércoles | Pasta integral al ajillo con merluza | Sopa castellana con jamón serrano y huevo pochado |
| Jueves | Garbanzos al curry con brócoli; de segundo, pechuga de pollo al horno con col de bruselas | Shakshuka con pan integral |
| Viernes | Conejo al ajillo con zanahoria y arroz blanco | Salmón al horno con espárragos y arroz blanco |
| Sábado | Libre (sugerencia: Empanada gallega de atún con ensalada) | Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato |
| Domingo | Lentejas con pimentón con pimientos; de segundo, lomo de cerdo a la plancha con mostaza y miel con brócoli | Ternera magra en ensalada |

**Lunes, comida** (832 de 815 kcal; 61 de 54 g de proteína)

- De primero: Lentejas (75 g en seco) guisadas con pimentón ahumado y ajo · 2 puñados de espinacas (80 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Ternera magra (185 g) a la plancha con romero, limón y ajo · 1 pimiento mediano asado (180 g) · AOVE (20 ml)
- Compra: Lentejas (75 g en seco) · Espinacas frescas (2 puñados, 80 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Ternera magra (185 g) · Pimientos (1 mediano, 180 g) · Romero · Limón (½) · Ajo (1 diente) · AOVE (20 ml)

**Jueves, comida** (817 de 815 kcal; 55 de 49 g de proteína)

- De primero: Garbanzos (85 g en seco) guisados con curry y cúrcuma · ½ brócoli (90 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Pechuga de pollo (125 g) al horno con romero, limón y ajo · 11 coles de Bruselas asadas (160 g) · AOVE (20 ml)
- Compra: Garbanzos (85 g en seco) · Brócoli (½, 90 g) · Curry en polvo (1 cdita) · Cúrcuma · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Pechuga de pollo (125 g) · Coles de Bruselas (11 coles, 160 g) · Romero · Limón (½) · Ajo (1 diente) · AOVE (20 ml)

**Domingo, comida** (810 de 815 kcal; 57 de 54 g de proteína)

- De primero: Lentejas (60 g en seco) guisadas con pimentón ahumado y ajo · ½ pimiento (90 g) · caldo de verduras · AOVE (10 ml)
- De segundo: Lomo de cerdo (195 g) a la plancha con mostaza y miel · ½ brócoli al vapor (175 g) · AOVE (15 ml)
- Compra: Lentejas (60 g en seco) · Pimientos (½, 90 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (10 ml) · Lomo de cerdo (195 g) · Brócoli (½, 175 g) · Mostaza (1 cdita) · Miel (1 cdita) · AOVE (15 ml)

### omni-3714, semana 60 (3714 kcal)

Días de legumbre sorteados: Martes, Jueves, Domingo.

| Día | Comida | Cena |
|---|---|---|
| Lunes | Salmón en ensalada | Ternera magra a la plancha con champiñones y arroz blanco |
| Martes | Lentejas al ajillo con calabacín; de segundo, pechuga de pollo al horno con hierbas provenzales con berenjena | Huevo con tomate en crudo |
| Miércoles | Salmón al horno con espinacas y boniato | Sopa de miso con tofu firme, setas shiitake y alga wakame |
| Jueves | Garbanzos al curry con brócoli; de segundo, ternera magra a la plancha con pimientos | Pizza proteica casera con pollo y mozzarella |
| Viernes | Bowl mediterráneo de gambas con arroz blanco | Atún en conserva en crudo con vinagre de Módena y mostaza con tomate cherry |
| Sábado | Libre (sugerencia: Pechuga de pavo al horno con judías verdes y patata) | Lomo de cerdo al horno con mostaza y miel con col de bruselas y patata |
| Domingo | Garbanzos con pimentón con zanahoria; de segundo, conejo al ajillo con alcachofas | Mejillones en salsa verde con pan de pueblo |

**Martes, comida** (1406 de 1393 kcal; 104 de 79 g de proteína)

- De primero: Lentejas (115 g en seco) guisadas con ajo, perejil y guindilla · ½ calabacín (145 g) · caldo de verduras · AOVE (20 ml)
- De segundo: Pechuga de pollo (240 g) al horno con hierbas provenzales · 1 berenjena mediana a la plancha (285 g) · AOVE (20 ml) · Pan integral (140 g) para acompañar
- Compra: Lentejas (115 g en seco) · Calabacín (½, 145 g) · Ajo (2 dientes) · Perejil fresco · Guindilla (opcional) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (20 ml) · Pechuga de pollo (240 g) · Berenjena (1 mediana, 285 g) · Hierbas provenzales · AOVE (20 ml) · Pan integral (140 g)

**Jueves, comida** (1407 de 1393 kcal; 96 de 79 g de proteína)

- De primero: Garbanzos (100 g en seco) guisados con curry y cúrcuma · ½ brócoli (100 g) · caldo de verduras · AOVE (20 ml)
- De segundo: Ternera magra (280 g) a la plancha con romero, limón y ajo · 1½ pimientos asados (235 g) · AOVE (20 ml) · Pan integral (120 g) para acompañar
- Compra: Garbanzos (100 g en seco) · Brócoli (½, 100 g) · Curry en polvo (1 cdita) · Cúrcuma · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (20 ml) · Ternera magra (280 g) · Pimientos (1½, 235 g) · Romero · Limón (½) · Ajo (1 diente) · AOVE (20 ml) · Pan integral (120 g)

**Domingo, comida** (1369 de 1393 kcal; 97 de 83 g de proteína)

- De primero: Garbanzos (95 g en seco) guisados con pimentón ahumado y ajo · 1 zanahoria (80 g) · caldo de verduras · AOVE (15 ml)
- De segundo: Conejo troceado (280 g) al horno con ajo, perejil y guindilla · 3 alcachofas asadas (250 g) · AOVE (20 ml) · Pan integral (110 g) para acompañar
- Compra: Garbanzos (95 g en seco) · Zanahorias (1 zanahoria, 80 g) · Pimentón ahumado (1 cdita) · Ajo (1 diente) · Cebolla (1/2) · Caldo de verduras (500 ml) · Laurel (1 hoja) · AOVE (15 ml) · Conejo troceado (280 g) · Alcachofas (3 alcachofas, 250 g) · Ajo (2 dientes) · Perejil fresco · Guindilla (opcional) · AOVE (20 ml) · Pan integral (110 g)

## 8. Sopa de primero

Sin medir a fondo. En el catálogo del omnívoro hay 23 platos de sopa o crema, 10 de comida (fuente: `catalogoSegundosSopa.mjs`):

- **14 compuestos** de la plantilla «sopa o crema» (6 de comida, 8 de cena). Todos llevan su proteína encima (crema de brócoli con pollo, de calabacín con gambas, de espinacas con huevos): la tupla exige proteína.
- **9 redactados** (gazpacho con huevo y atún, tres caldos gallegos, crema de calabacín con queso y huevo, ramen, sopa castellana, tom kha gai, sopa de miso). Todos son platos completos.

No hay ninguna sopa o crema sin proteína que pueda hacer de primero. El mecanismo cabe: un primero y un segundo en la misma comida, con las raciones de los dos juntas. Pero pide dos cosas que la legumbre no pedía:

1. **Catálogo:** cremas y sopas sin proteína. En las tuplas no caben hoy (la proteína es obligatoria); tendrían que ser fichas nuevas o un cambio de plantilla.
2. **Una razón para elegirla:** la legumbre tiene suelo semanal y por eso tiene día. La sopa no tiene suelo. Habría que decidir cuándo sale un primero de sopa.

En las raciones sería más sencilla que la legumbre: la verdura es fija y casi no aporta calorías, así que el segundo se ajustaría casi como un plato único.

## 9. Plan de implementación por etapas

Ninguna etapa toca el flujo de plan compartido, Supabase ni `scripts/fase7`. Sección de lectura de código, sin medir.

### Etapa 0. Decisiones

Los dos asientos de la sección 10 y las decisiones abiertas de la sección 11.

### Etapa 1. Dos platos en una comida, sin cambiar la forma del plan

Existe, y es lo que hace el prototipo: una sola comida con `time: 'Comida'`, el primero en `p1`, el segundo en `p2`, la compra y la receta de los dos seguidas. La forma visible (`time`, `title`, `p1`, `p2`, `shopping`, `recipe`) no cambia. Los datos internos van en campos con guion bajo, como ya hacen `_componer` y `_base`.

Qué entra:

- **`src/engine2/walk/runWalk.js`:** sorteo de los días de legumbre, nivel del día antes de las preferencias A y B, elección del segundo con sus filtros y causas en el log. Devuelve los segundos además de los huecos.
- **`src/engine2/materializePlan.js`:** la comida lleva un `segundo` opcional. Las claves del contrato entre motores no cambian.
- **`src/engine2/contracts/weeklyTargets.js` y `frequencies.js`:** el suelo de legumbre pasa a ser el número de días sorteados.
- **`src/plan/engine2App.js`:** monta la comida doble; el nombre del segundo entra en `platosSemana` para no repetirlo la semana siguiente.
- **`src/plan/racionesApp.js`:** raciona los dos platos como una comida, con el tope de la legumbre, y vuelve a escribir cada plato con su texto.
- **`src/engine2/walk/alternativa.js` y `regenerarComidaEngine2`:** la semana que reciben debe incluir el segundo, para que el tope y la familia lo vean. En esta etapa, pedir una alternativa de esa comida la cambia por un plato único.
- **Tests** de cada regla, primero el de reproducción, y línea base del banco regenerada. `scripts/banco/metricas.mjs` tiene que contar el segundo.

Qué no hace falta tocar: las dos vistas de la UI, la lista de la compra y el plan compartido.

Qué pasa con el plan compartido si no se toca: sigue funcionando. `cloneAndScalePlan` (`OriginalPlanApp.jsx:1961`) copia el plan y multiplica los gramos del texto de `p1`, `p2`, compra y receta por la proporción de calorías. Con la comida doble hace lo mismo que con cualquier otro plato. Lo que no hace, ni hoy ni entonces, es volver a calcular raciones: el amigo recibe la legumbre escalada en proporción, sin el tope ni la media ración. No he mirado el lado del servidor (está vedado); el plan se guarda como los días en JSON y los campos nuevos van dentro de la comida.

Riesgos de la etapa 1:

- El título de la comida es largo («Lentejas con pimentón con zanahoria; de segundo, pechuga de pavo a la plancha con brócoli») y `p1` lleva dos líneas en una. Hay que verlo en el móvil.
- La receta junta los pasos de dos platos con un rótulo de texto; la UI no sabe que son dos.
- Los planes ya guardados no cambian hasta la semana siguiente.
- Las regeneraciones parciales que siguen en el motor viejo (cambiar una comida por la vía antigua) no conocen el segundo y lo perderían.

### Etapa 2. Alternativas y edición

- Alternativa solo del segundo, o de los dos platos.
- El panel del nutricionista edita `p1` y `p2` como texto libre: habría que decidir si puede tocar una comida doble.
- Sugerencia del sábado: hoy no lleva segundo aunque sea de legumbre.

### Etapa 3. Forma nueva (dos platos como datos)

Una comida con una lista de platos, cada uno con su título, su texto, su compra y su receta, y la UI con dos bloques. Es la única etapa que cambia la forma del plan.

Qué queda roto si no se toca el plan compartido: `cloneAndScalePlan` solo escala `p1`, `p2`, `shopping` y `recipe` de la comida. Lo que vaya en una lista nueva de platos llegaría al amigo sin escalar, o no se pintaría si su versión de la app no la conoce. Esta etapa no se puede hacer con el plan compartido vedado.

No es necesaria para que la regla funcione.

## 10. Borradores de asientos

No están en `DECISIONS.md`. Los valores entre corchetes son los de la recomendación y dependen de lo que decida Javi.

### D-116 (borrador) — La legumbre no va como plato único: primero y segundo

Decide: Javi. Sin implementar.

Contexto
Javi lo dijo en octubre y no quedó escrito: las lentejas pueden ir de primero con pollo de segundo, pero no como plato único. Medido en 200 semanas por perfil (8 perfiles omnívoros sin SIBO): la legumbre sale 1,30 veces por semana, siempre como plato único, con el 77 % de la proteína de su comida de mediana; 1945 de 2077 comidas de legumbre quedan por debajo del 95 %. La legumbre es un ingrediente «energético» en las raciones y el plato no tiene nada que subir. El plato único completo (legumbre con cereal o con proteína dentro) se descarta: el cereal baja la proteína y solo 5 de 18 platos llevan proteína.

Decisión
1. Un plato compuesto de legumbre (legumbre con verdura) no se sirve solo: va de primero, con un segundo de proteína con verdura en la misma comida. [Todas las legumbres compuestas, no solo las lentejas.]
2. El segundo es un plato compuesto de proteína con verdura, sin cereal, de ave o carne [sin pescado ni marisco]; nunca de huevo. Sale de los platos que el catálogo marca como de cena.
3. El segundo se come: cuenta para no repetir plato (D-099.3.d), para el tope y la separación por especie (D-099.3.e), para la familia en días seguidos (D-115) y para el suelo de pescado y la verdura del día (D-024). Pasa por esos filtros con la misma vuelta atrás. El paso 4 no lo dirige.
4. Raciones: los dos platos son una sola comida, con el objetivo de siempre. El primero parte de media ración (legumbre 50 g en seco, verdura y aceite a la mitad) y la legumbre se ajusta con tope en lo que el plato recibe como plato único a 2174 kcal.
5. Texto: una sola comida, con el primero en `p1` y el segundo en `p2`. La forma del plan no cambia.
6. Los platos redactados de legumbre (cocido, fabada, hummus con pollo, curry con arroz, burrito, falafel, ensalada de lentejas) no cambian. [Pendiente: decidir si los que no llevan proteína siguen saliendo.]
7. Solo dietas omnívoras. En vegetariana y vegana no hay segundos y la regla no se aplica. La sugerencia de la comida libre no lleva segundo (D-114).
8. Toda elección deja su causa en el decision log (`segundo_de_legumbre`, `segundo_sin_candidato`).

Medido (variante «3 · sin pescado · todas», en memoria)
- Comida con segundo: 112 % de su proteína de mediana; 14 de 4669 por debajo del 95 %.
- Comidas y cenas cortas de proteína: 3,08 → 1,82 por semana. Proteína del día: 100,7 % → 104,5 % del objetivo.
- Semanas fuera de ±5 % de calorías: 12 → 3 de 1600.
- Pescado: 4,30 → 3,96 por semana (4,53 si el segundo puede ser de pescado).
- D-099.3 y D-114: 0 infracciones en los 8 perfiles. D-115: el filtro no se puede aplicar al segundo 15,5 veces por cada 100 semanas (0 si puede ser de pescado).
- Perfil sin pescado ni marisco: 21 semanas de 200 con una especie más de 2 veces.

Pendiente
- Alternativas de una comida con dos platos.
- La forma del plan con dos platos como datos, que exige tocar el plan compartido.

### D-117 (borrador) — Días de legumbre sorteados con la semilla (modifica D-024)

Decide: Javi. Sin implementar.

Contexto
D-024 atiende los suelos semanales en el primer hueco donde se puede, después de la verdura del día (asiento 3), con una veda de un día (asiento 4). En la comida la verdura gana siempre, y el suelo de legumbre casi no actúa: 0,01 veces por semana. Poner los suelos antes que la verdura en la comida (contrafactual A) sube la legumbre a 2,74 por semana, pero la fija en lunes, miércoles y viernes en 1281 de 1600 semanas, porque el walk recorre la semana en orden.

Decisión
1. Antes del walk se sortean con la semilla [3] días de legumbre, con un RNG propio. El sorteo es entre los conjuntos válidos: sin el día de la comida libre, sin dos días seguidos y sin los días donde el ancla ya colocó un plato. Las legumbres del ancla cuentan para los [3].
2. En la comida de un día sorteado, el nivel de legumbre va antes que la verdura del día y antes que las preferencias A y B. Esto invierte el asiento 3 de D-024 en esos huecos. Si no hay candidato, el hueco sigue como siempre y el log lo dice.
3. Fuera de los días sorteados el suelo semanal de legumbre no actúa. La precedencia «legumbre antes que pescado» del asiento 2 de D-024 deja de tener objeto; el suelo de pescado sigue igual.
4. El día anterior y el siguiente a uno sorteado no llevan legumbre a la comida, si quedan otros candidatos. Sustituye, para la legumbre, a la veda del asiento 4 de D-024.
5. El suelo de legumbre de `weeklyTargets.js` es el número de días sorteados.
6. Sin pesos: filtros, un orden de prioridades y azar sembrado. Causas en el log: `dias_legumbre_sorteados`, `dia_legumbre_sorteado`, `dia_legumbre_sin_candidato`, `vecino_de_dia_legumbre`.
7. Solo dietas omnívoras con platos de legumbre. En vegetariana y vegana D-024 sigue como está.

Medido (en memoria, con el nivel del día después de las preferencias A y B)
- Legumbre: 1,30 → 2,95 por semana con 3 días; 2,26 con 2.
- Reparto con 3 días: L 0,54 · M 0,29 · X 0,46 · J 0,28 · V 0,60 · D 0,78. El patrón más frecuente (X, V, D) sale el 17 % de las semanas.
- Día sorteado sin legumbre: 10,3 por cada 100 semanas con 3 días, casi todos en domingo. La causa es que la preferencia B se aplica antes (sección 5.2 del informe); el punto 2 lo evita y no se ha medido con ese orden.
- Días sin verdura: 0,03 por semana, igual que hoy.

Pendiente
- El domingo lleva legumbre el 78 % de las semanas con 3 días. Decidir si se deja.
- El recordatorio de D-024 sobre subir la legumbre a 4 (AESAN) sigue abierto.

## 11. Decisiones abiertas y límites de la medición

Decisiones de Javi:

1. Suelo 2 o 3.
2. Segundo con pescado o sin él.
3. Qué pasa con los 7 platos redactados de legumbre, sobre todo los que no llevan proteína (curry con arroz, burrito).
4. Si los platos de cena pueden servirse de segundo en la comida.
5. El domingo como día de legumbre.
6. Si la legumbre puede salir por azar fuera de los días sorteados.

Límites:

- El orden «día de legumbre antes que A y B» no se ha medido.
- Los textos de la comida doble salen del prototipo; no se han revisado como textos de producto.
- No se ha medido el botón de alternativas ni las regeneraciones parciales.
- En el perfil con ancla no se ha recalculado lo que la receta manda guardar.
- Vegetariano y vegano no se han medido.
- Cada variante es una sola pasada de 200 semanas por perfil. Con 1600 semanas, diferencias de menos de 0,1 platos por semana son ruido.
