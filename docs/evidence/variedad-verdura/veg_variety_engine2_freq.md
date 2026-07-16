# Vistas de frecuencia adicionales sobre variedad de verdura (engine2)

## 1. Qué mide y por qué

Extensión de la campaña anclada en `baseline-variedad-verdura.md`. Esa
campaña mide variedad a nivel de identidad agregada (histograma de
`maxVegDays`, tamaño de vocabulario) pero no permite responder "¿con qué
frecuencia se selecciona CADA plato?" ni "¿con qué frecuencia aparece CADA
combinación de identidades en un mismo plato?". Este runner añade tres
vistas complementarias sobre la MISMA secuencia de planes generados,
sin modificar el motor ni la métrica original.

## 2. Metadatos de la campaña

Idénticos a la campaña anclada (mismo PROFILE, N=500, semillas 1..500,
`seed = i + 1`, RNG mulberry32 vía `selectRng`/`buildWeekArc`). Ver
`baseline-variedad-verdura.md`, sección 2.

## 3. Definición de las vistas

- **Universo Vista A/C**: idéntico al de la baseline anclada — excluye
  huecos con `vista.origen === 'freeform'` y huecos con
  `vista.verdura.origen === 'desconocida'`, y excluye días
  `fixedRole === 'libre'`.
- **Universo Vista B**: TODOS los huecos no-libres, sin el filtro de
  origen anterior — ver banner del runner para la justificación.
- **Vista A** (combinación de identidades): para cada plato seleccionado
  con >=2 identidades en `valorEfectivo`, clave = identidades ordenadas
  alfabéticamente y unidas con `|` (fusión V/V2 confirmada simétrica
  aguas abajo — ver informe de Fase 1 de esta sesión; ninguna posición
  se trata de forma distinta en ningún consumidor real).
- **Vista B** (por plato): `dishId` → nombre → apariciones totales → %
  semanas con >=1 aparición. Marca `esV2` = true si `vista.tupla.V2 !==
  null` (solo aplica a origen scaffold).
- **Vista C** (por identidad individual): misma regla de identidad que la
  baseline anclada (eje-agnóstica, D-042/D-043).

## 4. Gate de validez frente a la baseline anclada

| Métrica | Esperado | Observado | OK |
|---|---|---|---|
| % semanas maxVegDays>=3 | 98.6% | 98.6% | true |
| Histograma | {"1":0,"2":7,"3":208,"4":222,"5+":63} | {"1":0,"2":7,"3":208,"4":222,"5+":63} | true |
| Media identidades/semana | 6.47 | 6.47 | true |
| Vocabulario | 17 | 17 | true |

**Gate global: OK**

## 5. Resultados — Vista A (combinaciones de identidades, >=2 ejes)

| combinación | apariciones totales | % semanas >=1 | nº dishId distintos |
|---|---|---|---|
| lechuga|pepino | 206 | 38.6% | 4 |
| pimientos|tomate | 168 | 16.8% | 1 |
| lechuga|tomate | 106 | 20.6% | 6 |
| pepino|tomate | 98 | 18.8% | 5 |
| calabacin|zanahoria | 46 | 9.2% | 2 |
| calabaza|zanahoria | 45 | 8.8% | 2 |
| puerro|zanahoria | 24 | 4.8% | 1 |
| esparragos|tomate | 19 | 3.8% | 1 |
| pepino|zanahoria | 19 | 3.8% | 1 |

## 6. Resultados — Vista B (por plato, universo completo)

| dishId | nombre | eje V2 | apariciones totales | % semanas >=1 |
|---|---|---|---|---|
| `["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]` | Garbanzos con pimientos guisado | no | 335 | 18.4% |
| `["legumbre","lentejas","arroz","zanahoria",null,"pimenton_ajo","guisado"]` | Lentejas con arroz y zanahoria guisado | no | 307 | 16.6% |
| `["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]` | Ternera con patata y zanahoria guisado | no | 293 | 16.0% |
| `["sopa_crema","huevo",null,"tomate",null,null,"crudo"]` | Huevo con tomate en crudo | no | 252 | 16.8% |
| `curry_garbanzos` | Curry de garbanzos con arroz basmati | no | 235 | 47.0% |
| `["legumbre","garbanzos",null,"berenjena",null,"curry_ligero","salteado"]` | Garbanzos con berenjena salteado | no | 231 | 15.4% |
| `hummus_pita_pollo` | Hummus con pita integral y pollo especiado | no | 205 | 41.0% |
| `ensalada_lentejas_feta` | Ensalada tibia de lentejas con feta, tomate y hierbas | no | 175 | 35.0% |
| `["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]` | Atún con tomate y pimientos en crudo | sí | 168 | 16.8% |
| `["caliente_clasico","atun",null,"tomate",null,"vinagreta","crudo"]` | Atún en conserva en crudo con vinagre de Módena y mostaza con tomate cherry | no | 105 | 21.0% |
| `["caliente_clasico","atun",null,"lechuga","pepino",null,"crudo"]` | Atún en conserva en crudo con lechuga mixta y pepino | sí | 93 | 18.6% |
| `["ensalada","atun",null,"lechuga","pepino","vinagreta","crudo"]` | Atún en conserva en ensalada | sí | 82 | 16.4% |
| `["caliente_clasico","bacalao","patata","pimientos",null,"ajillo","horno"]` | Bacalao fresco al horno con ajo, perejil y guindilla con pimientos y patata | no | 50 | 10.0% |
| `sardinas_plancha_escalivada` | Sardinas a la plancha con escalivada y pan tostado | no | 48 | 9.6% |
| `["caliente_clasico","bacalao","arroz","espinacas",null,"limon_hierbas","horno"]` | Bacalao fresco al horno con limón, orégano y ajo con espinacas y arroz blanco | no | 47 | 9.4% |
| `["caliente_clasico","sardinas",null,"tomate",null,"ajillo","plancha"]` | Sardinas a la plancha con ajo, perejil y guindilla con tomate cherry | no | 47 | 9.4% |
| `["caliente_clasico","bacalao",null,"pimientos",null,"ajillo","horno"]` | Bacalao fresco al horno con ajo, perejil y guindilla con pimientos | no | 46 | 9.2% |
| `["caliente_clasico","dorada","arroz","judias",null,"ajillo","horno"]` | Dorada al horno con ajo, perejil y guindilla con judías verdes y arroz blanco | no | 44 | 8.8% |
| `["caliente_clasico","bacalao",null,"espinacas",null,"ajillo","horno"]` | Bacalao fresco al horno con ajo, perejil y guindilla con espinacas | no | 42 | 8.4% |
| `["caliente_clasico","dorada",null,"calabacin",null,"limon_hierbas","horno"]` | Dorada al horno con limón, orégano y ajo con calabacín | no | 42 | 8.4% |
| `["caliente_clasico","merluza","patata","judias",null,"limon_hierbas","horno"]` | Merluza al horno con limón, orégano y ajo con judías verdes y patata | no | 42 | 8.4% |
| `salmon_af_verduras` | Salmón al airfryer con verduras asadas | no | 42 | 8.4% |
| `["caliente_clasico","dorada",null,"espinacas",null,"limon_hierbas","horno"]` | Dorada al horno con limón, orégano y ajo con espinacas | no | 41 | 8.2% |
| `["caliente_clasico","merluza",null,"alcachofa",null,"limon_hierbas","horno"]` | Merluza al horno con limón, orégano y ajo con alcachofas | no | 40 | 8.0% |
| `["caliente_clasico","dorada","patata","calabacin",null,"limon_hierbas","horno"]` | Dorada al horno con limón, orégano y ajo con calabacín y patata | no | 39 | 7.8% |
| `["caliente_clasico","merluza",null,"calabacin",null,"limon_hierbas","horno"]` | Merluza al horno con limón, orégano y ajo con calabacín | no | 39 | 7.8% |
| `["caliente_clasico","salmon","arroz","esparragos",null,"limon_hierbas","horno"]` | Salmón al horno con limón, orégano y ajo con espárragos y arroz blanco | no | 39 | 7.8% |
| `["caliente_clasico","merluza",null,"judias",null,"ajillo","horno"]` | Merluza al horno con ajo, perejil y guindilla con judías verdes | no | 38 | 7.6% |
| `["caliente_clasico","salmon",null,"esparragos",null,"limon_hierbas","plancha"]` | Salmón a la plancha con limón, orégano y ajo con espárragos | no | 38 | 7.6% |
| `["caliente_clasico","salmon","patata","espinacas",null,"limon_hierbas","horno"]` | Salmón al horno con limón, orégano y ajo con espinacas y patata | no | 35 | 7.0% |
| `pisto_manchego_huevo` | Pisto manchego con huevo a la plancha | no | 33 | 6.6% |
| `["caliente_clasico","salmon",null,"espinacas",null,"limon_hierbas","horno"]` | Salmón al horno con limón, orégano y ajo con espinacas | no | 32 | 6.4% |
| `shakshuka` | Shakshuka con pan integral | no | 32 | 6.4% |
| `["caliente_clasico","merluza","arroz","calabacin",null,"ajillo","horno"]` | Merluza al horno con ajo, perejil y guindilla con calabacín y arroz blanco | no | 31 | 6.2% |
| `sopa_castellana_jamon` | Sopa castellana con jamón serrano y huevo pochado | no | 31 | 6.2% |
| `["caliente_clasico","cerdo","patata","coles",null,"mostaza_miel","horno"]` | Lomo de cerdo al horno con mostaza y miel con col de bruselas y patata | no | 30 | 6.0% |
| `["ensalada","pollo",null,"lechuga","tomate","vinagreta","plancha"]` | Pechuga de pollo en ensalada | sí | 29 | 5.8% |
| `["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]` | Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli y arroz blanco | no | 28 | 5.6% |
| `["sopa_crema","huevo",null,"calabaza","zanahoria",null,null]` | Crema de calabaza con huevos encima | sí | 26 | 5.2% |
| `["legumbre","garbanzos",null,"alcachofa",null,"limon_hierbas","guisado"]` | Garbanzos estofadas con alcachofas | no | 25 | 5.0% |
| `["legumbre","lentejas",null,"calabacin",null,"ajillo","guisado"]` | Lentejas al ajillo con calabacín | no | 25 | 5.0% |
| `["caliente_clasico","conejo","patata","pimientos",null,"ajillo","horno"]` | Conejo al horno con ajo, perejil y guindilla con pimientos y patata | no | 24 | 4.8% |
| `["sopa_crema","pollo",null,"puerro","zanahoria",null,"guisado"]` | Crema de puerro con pechuga de pollo encima | sí | 24 | 4.8% |
| `["sopa_crema","pollo",null,"puerro",null,"provenzal","guisado"]` | Crema de puerro con pechuga de pollo encima | no | 24 | 4.8% |
| `["sopa_crema","pollo",null,"zanahoria","calabacin",null,"guisado"]` | Crema de zanahoria con pechuga de pollo encima | sí | 24 | 4.8% |
| `["legumbre","garbanzos",null,"zanahoria",null,"pimenton_ajo","guisado"]` | Garbanzos con pimentón con zanahoria | no | 24 | 4.8% |
| `["bowl","atun","arroz","pepino","tomate","vinagreta","crudo"]` | Bowl proteico de atún en conserva con arroz blanco | sí | 23 | 4.6% |
| `["sopa_crema","gambas",null,"calabacin",null,"ajillo","plancha"]` | Crema de calabacín con gambas encima | no | 23 | 4.6% |
| `["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]` | Crema de tomate cherry con atún en conserva encima | sí | 23 | 4.6% |
| `["legumbre","garbanzos",null,"tomate",null,"ajillo","salteado"]` | Garbanzos al ajillo con tomate cherry | no | 23 | 4.6% |
| `["caliente_clasico","pollo","boniato","calabacin",null,"pimenton_ajo","horno"]` | Pechuga de pollo al horno con pimentón ahumado y ajo con calabacín y boniato | no | 23 | 4.6% |
| `["legumbre","alubias",null,"acelgas",null,"ajillo","guisado"]` | Alubias blancas al ajillo con acelgas | no | 22 | 4.4% |
| `["caliente_clasico","atun","arroz","tomate",null,"limon_hierbas","crudo"]` | Atún en conserva en crudo con limón, orégano y ajo con tomate cherry y arroz blanco | no | 22 | 4.4% |
| `caldo_gallego_grelos_ligero` | Caldo gallego de grelos (ligero) | no | 22 | 4.4% |
| `["sopa_crema","huevo",null,"calabacin","zanahoria",null,"plancha"]` | Crema de calabacín con huevos encima | sí | 22 | 4.4% |
| `["caliente_clasico","dorada",null,"judias",null,"ajillo","horno"]` | Dorada al horno con ajo, perejil y guindilla con judías verdes | no | 22 | 4.4% |
| `huevos_rellenos` | Huevos rellenos de atún con ensalada | no | 22 | 4.4% |
| `ramen_simplificado` | Ramen simplificado con pollo y huevo | no | 22 | 4.4% |
| `["legumbre","lentejas",null,"zanahoria",null,"pimenton_ajo","guisado"]` | Lentejas con pimentón con zanahoria | no | 21 | 4.2% |
| `["ensalada","pavo",null,"lechuga","tomate","vinagreta","plancha"]` | Pechuga de pavo en ensalada | sí | 21 | 4.2% |
| `["caliente_clasico","conejo","arroz","zanahoria",null,"ajillo","guisado"]` | Conejo guisado con ajo, perejil y guindilla con zanahoria y arroz blanco | no | 20 | 4.0% |
| `["sopa_crema","gambas",null,"calabaza",null,"ajillo","plancha"]` | Crema de calabaza con gambas encima | no | 20 | 4.0% |
| `["caliente_clasico","merluza","arroz","puerro",null,"limon_hierbas","horno"]` | Merluza al horno con limón, orégano y ajo con puerro y arroz blanco | no | 20 | 4.0% |
| `["pasta","ternera","pasta","calabacin",null,"tomate_casero","salteado"]` | Pasta integral al pomodoro con ternera magra | no | 20 | 4.0% |
| `["caliente_clasico","ternera","patata","espinacas",null,"romero_limon","plancha"]` | Ternera magra a la plancha con romero, limón y ajo con espinacas y patata | no | 20 | 4.0% |
| `["ensalada","atun",null,"tomate","pepino","vinagreta","crudo"]` | Atún en conserva en ensalada | sí | 19 | 3.8% |
| `["bowl","salmon","quinoa","pepino",null,"soja_jengibre","crudo"]` | Bowl asiático de salmón con quinoa | no | 19 | 3.8% |
| `["bowl","pollo","quinoa","espinacas",null,"curry_ligero","plancha"]` | Bowl de curry de pechuga de pollo con quinoa | no | 19 | 3.8% |
| `["bowl","merluza","quinoa","espinacas",null,"limon_hierbas","horno"]` | Bowl mediterráneo de merluza con quinoa | no | 19 | 3.8% |
| `["sopa_crema","bacalao",null,"zanahoria","calabaza","ajillo","guisado"]` | Crema de zanahoria con bacalao fresco encima | sí | 19 | 3.8% |
| `["ensalada","gambas",null,"esparragos","tomate","vinagreta","plancha"]` | Gambas en ensalada | sí | 19 | 3.8% |
| `["ensalada","pollo","quinoa","pepino","zanahoria","limon_hierbas","plancha"]` | Pechuga de pollo en ensalada con quinoa | sí | 19 | 3.8% |
| `["caliente_clasico","salmon","boniato","espinacas",null,"limon_hierbas","horno"]` | Salmón al horno con limón, orégano y ajo con espinacas y boniato | no | 19 | 3.8% |
| `["caliente_clasico","salmon","quinoa","espinacas",null,"soja_jengibre","horno"]` | Salmón al horno con soja baja en sal y jengibre con espinacas y quinoa | no | 19 | 3.8% |
| `["ensalada","ternera",null,"lechuga","tomate","vinagreta","plancha"]` | Ternera magra en ensalada | sí | 19 | 3.8% |
| `["bowl","pollo","arroz","brocoli",null,"soja_jengibre","salteado"]` | Bowl asiático de pechuga de pollo con arroz blanco | no | 18 | 3.6% |
| `["bowl","pavo","quinoa","pimientos",null,"limon_hierbas","plancha"]` | Bowl mediterráneo de pechuga de pavo con quinoa | no | 18 | 3.6% |
| `["sopa_crema","pollo",null,"calabaza",null,"provenzal","plancha"]` | Crema de calabaza con pechuga de pollo encima | no | 18 | 3.6% |
| `["legumbre","lentejas",null,"espinacas",null,"pimenton_ajo","guisado"]` | Lentejas con pimentón con espinacas | no | 18 | 3.6% |
| `["legumbre","lentejas",null,"pimientos",null,"pimenton_ajo","guisado"]` | Lentejas con pimentón con pimientos | no | 18 | 3.6% |
| `mejillones_salsa_verde` | Mejillones en salsa verde con pan de pueblo | no | 18 | 3.6% |
| `["pasta","gambas","pasta","tomate",null,"ajillo","salteado"]` | Pasta integral al ajillo con gambas | no | 18 | 3.6% |
| `["caliente_clasico","pavo","patata","judias",null,"limon_hierbas","horno"]` | Pechuga de pavo al horno con limón, orégano y ajo con judías verdes y patata | no | 18 | 3.6% |
| `["caliente_clasico","pollo","pasta","tomate",null,"pimenton_ajo","salteado"]` | Pechuga de pollo salteado con pimentón ahumado y ajo con tomate cherry y pasta integral | no | 18 | 3.6% |
| `tom_kha_gai` | Tom Kha Gai — sopa tailandesa de pollo y coco | no | 18 | 3.6% |
| `["bowl","salmon","arroz","espinacas",null,"soja_jengibre","horno"]` | Bowl asiático de salmón con arroz blanco | no | 17 | 3.4% |
| `["sopa_crema","huevo",null,"espinacas",null,"limon_hierbas","plancha"]` | Crema de espinacas con huevos encima | no | 17 | 3.4% |
| `["legumbre","garbanzos",null,"brocoli",null,"curry_ligero","salteado"]` | Garbanzos al curry con brócoli | no | 17 | 3.4% |
| `["caliente_clasico","cerdo","patata","zanahoria",null,"mostaza_miel","plancha"]` | Lomo de cerdo a la plancha con mostaza y miel con zanahoria y patata | no | 17 | 3.4% |
| `["pasta","merluza","pasta","calabacin",null,"ajillo","plancha"]` | Pasta integral al ajillo con merluza | no | 17 | 3.4% |
| `["ensalada","pollo","quinoa","tomate","pepino","limon_hierbas","plancha"]` | Pechuga de pollo en ensalada con quinoa | sí | 17 | 3.4% |
| `pollo_teriyaki_arroz` | Pollo teriyaki con arroz jazmín y verduras | no | 17 | 3.4% |
| `["caliente_clasico","ternera","arroz","champiñones",null,"ajillo","plancha"]` | Ternera magra a la plancha con ajo, perejil y guindilla con champiñones y arroz blanco | no | 17 | 3.4% |
| `["bowl","atun","quinoa","pepino","tomate","vinagreta","crudo"]` | Bowl proteico de atún en conserva con quinoa | sí | 16 | 3.2% |
| `["bowl","pavo","boniato","calabacin",null,"pimenton_ajo","horno"]` | Bowl proteico de pechuga de pavo con boniato | no | 16 | 3.2% |
| `["caliente_clasico","dorada","arroz","calabacin",null,"limon_hierbas","horno"]` | Dorada al horno con limón, orégano y ajo con calabacín y arroz blanco | no | 16 | 3.2% |
| `["ensalada","gambas",null,"lechuga","tomate","limon_hierbas","plancha"]` | Gambas en ensalada | sí | 16 | 3.2% |
| `["caliente_clasico","gambas","arroz","calabacin",null,"ajillo","salteado"]` | Gambas salteado con ajo, perejil y guindilla con calabacín y arroz blanco | no | 16 | 3.2% |
| `["caliente_clasico","huevo","arroz","espinacas",null,"ajillo","revuelto"]` | Huevos revuelto con ajo, perejil y guindilla con espinacas y arroz blanco | no | 16 | 3.2% |
| `["caliente_clasico","cerdo","arroz","alcachofa",null,"ajillo","guisado"]` | Lomo de cerdo guisado con ajo, perejil y guindilla con alcachofas y arroz blanco | no | 16 | 3.2% |
| `nuggets_caseros_pollo_af` | Nuggets caseros de pollo al airfryer con patata gajo | no | 16 | 3.2% |
| `["caliente_clasico","pavo","arroz","berenjena",null,"tomate_casero","horno"]` | Pechuga de pavo al horno con tomate casero con berenjena y arroz blanco | no | 16 | 3.2% |
| `["ensalada","salmon",null,"lechuga","pepino","limon_hierbas","plancha"]` | Salmón en ensalada | sí | 16 | 3.2% |
| `tortilla_patatas_completa` | Tortilla de patatas completa con ensalada | no | 16 | 3.2% |
| `["legumbre","alubias",null,"pimientos",null,"ajillo","guisado"]` | Alubias blancas al ajillo con pimientos | no | 15 | 3.0% |
| `["caliente_clasico","bacalao","arroz","espinacas",null,"ajillo","horno"]` | Bacalao fresco al horno con ajo, perejil y guindilla con espinacas y arroz blanco | no | 15 | 3.0% |
| `["bowl","ternera","arroz","tomate",null,"vinagreta","plancha"]` | Bowl proteico de ternera magra con arroz blanco | no | 15 | 3.0% |
| `["caliente_clasico","calamares","arroz","pimientos",null,"ajillo","plancha"]` | Calamares a la plancha con ajo, perejil y guindilla con pimientos y arroz blanco | no | 15 | 3.0% |
| `["caliente_clasico","calamares","arroz","calabacin",null,"ajillo","salteado"]` | Calamares salteado con ajo, perejil y guindilla con calabacín y arroz blanco | no | 15 | 3.0% |
| `["caliente_clasico","conejo","patata","alcachofa",null,"limon_hierbas","horno"]` | Conejo al horno con limón, orégano y ajo con alcachofas y patata | no | 15 | 3.0% |
| `["caliente_clasico","conejo","arroz","berenjena",null,"pimenton_ajo","horno"]` | Conejo al horno con pimentón ahumado y ajo con berenjena y arroz blanco | no | 15 | 3.0% |
| `["caliente_clasico","conejo","boniato","espinacas",null,"romero_limon","horno"]` | Conejo al horno con romero, limón y ajo con espinacas y boniato | no | 15 | 3.0% |
| `["sopa_crema","merluza",null,"brocoli",null,"limon_hierbas","plancha"]` | Crema de brócoli con merluza encima | no | 15 | 3.0% |
| `["caliente_clasico","dorada","patata","brocoli",null,"limon_hierbas","horno"]` | Dorada al horno con limón, orégano y ajo con brócoli y patata | no | 15 | 3.0% |
| `ensalada_griega_pollo` | Ensalada griega con pollo y feta | no | 15 | 3.0% |
| `["ensalada","gambas",null,"lechuga","pepino","vinagreta","plancha"]` | Gambas en ensalada | sí | 15 | 3.0% |
| `hamburguesa_ternera_completa` | Hamburguesa de ternera con pan brioche y patatas gajo | no | 15 | 3.0% |
| `["caliente_clasico","huevo",null,"tomate",null,"ajillo","plancha"]` | Huevos a la plancha con ajo, perejil y guindilla con tomate cherry | no | 15 | 3.0% |
| `["caliente_clasico","merluza","patata","judias",null,"ajillo","horno"]` | Merluza al horno con ajo, perejil y guindilla con judías verdes y patata | no | 15 | 3.0% |
| `["pasta","gambas","pasta","calabacin",null,"ajillo","salteado"]` | Pasta integral al ajillo con gambas | no | 15 | 3.0% |
| `["caliente_clasico","pavo","boniato","judias",null,"curry_ligero","plancha"]` | Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato | no | 15 | 3.0% |
| `["caliente_clasico","pollo","arroz","espinacas",null,"pimenton_ajo","horno"]` | Pechuga de pollo al horno con pimentón ahumado y ajo con espinacas y arroz blanco | no | 15 | 3.0% |
| `["caliente_clasico","bacalao","boniato","tomate",null,"pimenton_ajo","horno"]` | Bacalao fresco al horno con pimentón ahumado y ajo con tomate cherry y boniato | no | 14 | 2.8% |
| `["bowl","pollo","quinoa","esparragos",null,"limon_hierbas","plancha"]` | Bowl mediterráneo de pechuga de pollo con quinoa | no | 14 | 2.8% |
| `["caliente_clasico","cerdo",null,"acelgas",null,"ajillo","plancha"]` | Lomo de cerdo a la plancha con ajo, perejil y guindilla con acelgas | no | 14 | 2.8% |
| `["caliente_clasico","pollo",null,"berenjena",null,"provenzal","horno"]` | Pechuga de pollo al horno con hierbas provenzales con berenjena | no | 14 | 2.8% |
| `quesadilla_fitness` | Quesadilla fitness de pollo y queso bajo en grasa | no | 14 | 2.8% |
| `["caliente_clasico","ternera","arroz","pimientos",null,"ajillo","guisado"]` | Ternera magra guisado con ajo, perejil y guindilla con pimientos y arroz blanco | no | 14 | 2.8% |
| `["bowl","pollo","boniato","calabacin",null,"pimenton_ajo","horno"]` | Bowl proteico de pechuga de pollo con boniato | no | 13 | 2.6% |
| `["sopa_crema","pollo",null,"brocoli",null,"limon_hierbas","plancha"]` | Crema de brócoli con pechuga de pollo encima | no | 13 | 2.6% |
| `["legumbre","garbanzos",null,"espinacas",null,"pimenton_ajo","guisado"]` | Garbanzos con pimentón con espinacas | no | 13 | 2.6% |
| `hamburguesa_pollo_completa` | Hamburguesa de pollo con pan integral y patatas gajo | no | 13 | 2.6% |
| `["caliente_clasico","huevo",null,"calabacin",null,"pimenton_ajo","tortilla"]` | Huevos en tortilla con pimentón ahumado y ajo con calabacín | no | 13 | 2.6% |
| `["caliente_clasico","huevo",null,"champiñones",null,"ajillo","revuelto"]` | Huevos revuelto con ajo, perejil y guindilla con champiñones | no | 13 | 2.6% |
| `["pasta","ternera","pasta","berenjena",null,"tomate_casero","salteado"]` | Pasta integral al pomodoro con ternera magra | no | 13 | 2.6% |
| `["caliente_clasico","pavo","patata","judias",null,"ajillo","horno"]` | Pechuga de pavo al horno con ajo, perejil y guindilla con judías verdes y patata | no | 13 | 2.6% |
| `["caliente_clasico","pollo","patata","judias",null,"provenzal","horno"]` | Pechuga de pollo al horno con hierbas provenzales con judías verdes y patata | no | 13 | 2.6% |
| `["caliente_clasico","pollo","patata","puerro",null,"provenzal","horno"]` | Pechuga de pollo al horno con hierbas provenzales con puerro y patata | no | 13 | 2.6% |
| `["caliente_clasico","salmon","arroz","esparragos",null,"limon_hierbas","plancha"]` | Salmón a la plancha con limón, orégano y ajo con espárragos y arroz blanco | no | 13 | 2.6% |
| `["caliente_clasico","ternera","patata","pimientos",null,"romero_limon","plancha"]` | Ternera magra a la plancha con romero, limón y ajo con pimientos y patata | no | 13 | 2.6% |
| `wok_verduras_pollo` | Wok de verduras con pollo y arroz | no | 13 | 2.6% |
| `wrap_mediterraneo` | Wrap mediterráneo de pollo, hummus y verduras | no | 13 | 2.6% |
| `berberechos_vapor_pan` | Berberechos al vapor con limón y pan tostado | no | 12 | 2.4% |
| `["bowl","gambas","arroz","pepino",null,"limon_hierbas","plancha"]` | Bowl mediterráneo de gambas con arroz blanco | no | 12 | 2.4% |
| `["caliente_clasico","conejo",null,"espinacas",null,"ajillo","horno"]` | Conejo al horno con ajo, perejil y guindilla con espinacas | no | 12 | 2.4% |
| `["ensalada","gambas",null,"lechuga","tomate","vinagreta","plancha"]` | Gambas en ensalada | sí | 12 | 2.4% |
| `["caliente_clasico","huevo",null,"esparragos",null,"ajillo","plancha"]` | Huevos a la plancha con ajo, perejil y guindilla con espárragos | no | 12 | 2.4% |
| `["caliente_clasico","huevo",null,"pimientos",null,"pimenton_ajo","revuelto"]` | Huevos revuelto con pimentón ahumado y ajo con pimientos | no | 12 | 2.4% |
| `["pasta","pavo","pasta","tomate",null,"tomate_casero","salteado"]` | Pasta integral al pomodoro con pechuga de pavo | no | 12 | 2.4% |
| `["caliente_clasico","pollo",null,"coles",null,"romero_limon","horno"]` | Pechuga de pollo al horno con romero, limón y ajo con col de bruselas | no | 12 | 2.4% |
| `["caliente_clasico","pollo",null,"champiñones",null,"provenzal","salteado"]` | Pechuga de pollo salteado con hierbas provenzales con champiñones | no | 12 | 2.4% |
| `["caliente_clasico","sardinas","patata","pimientos",null,"vinagreta","plancha"]` | Sardinas a la plancha con vinagre de Módena y mostaza con pimientos y patata | no | 12 | 2.4% |
| `["caliente_clasico","ternera","arroz","champiñones",null,"ajillo","salteado"]` | Ternera magra salteado con ajo, perejil y guindilla con champiñones y arroz blanco | no | 12 | 2.4% |
| `["caliente_clasico","calamares",null,"calabacin",null,"ajillo","salteado"]` | Calamares salteado con ajo, perejil y guindilla con calabacín | no | 11 | 2.2% |
| `croquetas_jamon_af` | Croquetas caseras de jamón al airfryer con ensalada | no | 11 | 2.2% |
| `["caliente_clasico","huevo","patata","champiñones",null,"ajillo","revuelto"]` | Huevos revuelto con ajo, perejil y guindilla con champiñones y patata | no | 11 | 2.2% |
| `["caliente_clasico","huevo",null,"espinacas",null,"ajillo","revuelto"]` | Huevos revuelto con ajo, perejil y guindilla con espinacas | no | 11 | 2.2% |
| `["caliente_clasico","cerdo",null,"brocoli",null,"mostaza_miel","plancha"]` | Lomo de cerdo a la plancha con mostaza y miel con brócoli | no | 11 | 2.2% |
| `["caliente_clasico","cerdo",null,"pimientos",null,"ajillo","horno"]` | Lomo de cerdo al horno con ajo, perejil y guindilla con pimientos | no | 11 | 2.2% |
| `menestra_verduras_jamon` | Menestra de verduras de temporada con jamón | no | 11 | 2.2% |
| `["pasta","pollo","pasta","champiñones",null,"provenzal","salteado"]` | Pasta integral con proteína con pechuga de pollo | no | 11 | 2.2% |
| `["pasta","salmon","pasta","espinacas",null,"limon_hierbas","plancha"]` | Pasta integral con proteína con salmón | no | 11 | 2.2% |
| `["caliente_clasico","pollo","patata","espinacas",null,"ajillo","horno"]` | Pechuga de pollo al horno con ajo, perejil y guindilla con espinacas y patata | no | 11 | 2.2% |
| `["caliente_clasico","pollo",null,"puerro",null,"provenzal","horno"]` | Pechuga de pollo al horno con hierbas provenzales con puerro | no | 11 | 2.2% |
| `["caliente_clasico","sardinas","arroz","tomate",null,"ajillo","plancha"]` | Sardinas a la plancha con ajo, perejil y guindilla con tomate cherry y arroz blanco | no | 11 | 2.2% |
| `["caliente_clasico","ternera",null,"pimientos",null,"romero_limon","plancha"]` | Ternera magra a la plancha con romero, limón y ajo con pimientos | no | 11 | 2.2% |
| `verduras_crujientes_af_proteina` | Verduras crujientes al airfryer con pollo | no | 11 | 2.2% |
| `["caliente_clasico","conejo",null,"alcachofa",null,"ajillo","horno"]` | Conejo al horno con ajo, perejil y guindilla con alcachofas | no | 10 | 2.0% |
| `esparragos_mayo_atun_huevo` | Espárragos con mayonesa, atún y huevo duro | no | 10 | 2.0% |
| `["caliente_clasico","gambas",null,"calabacin",null,"ajillo","plancha"]` | Gambas a la plancha con ajo, perejil y guindilla con calabacín | no | 10 | 2.0% |
| `gyozas_verduras` | Gyozas de pollo y verduras con salsa ponzu | no | 10 | 2.0% |
| `["caliente_clasico","cerdo","arroz","pimientos",null,"ajillo","horno"]` | Lomo de cerdo al horno con ajo, perejil y guindilla con pimientos y arroz blanco | no | 10 | 2.0% |
| `["caliente_clasico","cerdo","patata","berenjena",null,"pimenton_ajo","horno"]` | Lomo de cerdo al horno con pimentón ahumado y ajo con berenjena y patata | no | 10 | 2.0% |
| `["caliente_clasico","cerdo","boniato","calabacin",null,"romero_limon","horno"]` | Lomo de cerdo al horno con romero, limón y ajo con calabacín y boniato | no | 10 | 2.0% |
| `["caliente_clasico","merluza","arroz","espinacas",null,"ajillo","horno"]` | Merluza al horno con ajo, perejil y guindilla con espinacas y arroz blanco | no | 10 | 2.0% |
| `["pasta","atun","pasta","calabacin",null,"ajillo","crudo"]` | Pasta integral al ajillo con atún en conserva | no | 10 | 2.0% |
| `pizza_proteica_casera` | Pizza proteica casera con pollo y mozzarella | no | 10 | 2.0% |
| `["caliente_clasico","ternera",null,"champiñones",null,"ajillo","plancha"]` | Ternera magra a la plancha con ajo, perejil y guindilla con champiñones | no | 10 | 2.0% |
| `["caliente_clasico","ternera",null,"berenjena",null,"pimenton_ajo","plancha"]` | Ternera magra a la plancha con pimentón ahumado y ajo con berenjena | no | 10 | 2.0% |
| `["ensalada","atun",null,"lechuga","tomate","vinagreta","crudo"]` | Atún en conserva en ensalada | sí | 9 | 1.8% |
| `["caliente_clasico","conejo","patata","espinacas",null,"romero_limon","horno"]` | Conejo al horno con romero, limón y ajo con espinacas y patata | no | 9 | 1.8% |
| `crema_calabacin_queso_huevo` | Crema de calabacín con queso fresco y huevo | no | 9 | 1.8% |
| `hamburguesa_pavo_completa` | Hamburguesa de pavo con pan integral y patatas gajo | no | 9 | 1.8% |
| `["caliente_clasico","huevo","patata","pimientos",null,"pimenton_ajo","tortilla"]` | Huevos en tortilla con pimentón ahumado y ajo con pimientos y patata | no | 9 | 1.8% |
| `["caliente_clasico","huevo",null,"zanahoria",null,"pimenton_ajo","tortilla"]` | Huevos en tortilla con pimentón ahumado y ajo con zanahoria | no | 9 | 1.8% |
| `["pasta","cerdo","pasta","pimientos",null,"pimenton_ajo","salteado"]` | Pasta integral con proteína con lomo de cerdo | no | 9 | 1.8% |
| `["caliente_clasico","pavo","arroz","pimientos",null,"pimenton_ajo","plancha"]` | Pechuga de pavo a la plancha con pimentón ahumado y ajo con pimientos y arroz blanco | no | 9 | 1.8% |
| `["caliente_clasico","pavo","arroz","calabacin",null,"curry_ligero","salteado"]` | Pechuga de pavo salteado con curry y cúrcuma con calabacín y arroz blanco | no | 9 | 1.8% |
| `["caliente_clasico","pollo",null,"calabacin",null,"provenzal","plancha"]` | Pechuga de pollo a la plancha con hierbas provenzales con calabacín | no | 9 | 1.8% |
| `["caliente_clasico","pollo",null,"brocoli",null,"limon_hierbas","plancha"]` | Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli | no | 9 | 1.8% |
| `["caliente_clasico","pollo","arroz","brocoli",null,"pimenton_ajo","plancha"]` | Pechuga de pollo a la plancha con pimentón ahumado y ajo con brócoli y arroz blanco | no | 9 | 1.8% |
| `["caliente_clasico","pollo","boniato","pimientos",null,"provenzal","horno"]` | Pechuga de pollo al horno con hierbas provenzales con pimientos y boniato | no | 9 | 1.8% |
| `["caliente_clasico","pollo",null,"pimientos",null,"pimenton_ajo","horno"]` | Pechuga de pollo al horno con pimentón ahumado y ajo con pimientos | no | 9 | 1.8% |
| `["caliente_clasico","ternera","boniato","brocoli",null,"pimenton_ajo","horno"]` | Ternera magra al horno con pimentón ahumado y ajo con brócoli y boniato | no | 9 | 1.8% |
| `falafel_tabule_yogur` | Falafel con tabulé de bulgur y yogur de menta | no | 8 | 1.6% |
| `["caliente_clasico","cerdo",null,"coles",null,"mostaza_miel","horno"]` | Lomo de cerdo al horno con mostaza y miel con col de bruselas | no | 8 | 1.6% |
| `["pasta","pollo","pasta","espinacas",null,"ajillo","salteado"]` | Pasta integral al ajillo con pechuga de pollo | no | 8 | 1.6% |
| `["caliente_clasico","pavo",null,"judias",null,"ajillo","plancha"]` | Pechuga de pavo a la plancha con ajo, perejil y guindilla con judías verdes | no | 8 | 1.6% |
| `["caliente_clasico","pavo",null,"brocoli",null,"limon_hierbas","plancha"]` | Pechuga de pavo a la plancha con limón, orégano y ajo con brócoli | no | 8 | 1.6% |
| `["caliente_clasico","pavo","boniato","espinacas",null,"mostaza_miel","horno"]` | Pechuga de pavo al horno con mostaza y miel con espinacas y boniato | no | 8 | 1.6% |
| `pollo_crujiente_af_boniato` | Pollo crujiente al airfryer con boniato asado | no | 8 | 1.6% |
| `["caliente_clasico","conejo","arroz","champiñones",null,"ajillo","horno"]` | Conejo al horno con ajo, perejil y guindilla con champiñones y arroz blanco | no | 7 | 1.4% |
| `["caliente_clasico","huevo",null,"brocoli",null,"limon_hierbas","revuelto"]` | Huevos revuelto con limón, orégano y ajo con brócoli | no | 7 | 1.4% |
| `["caliente_clasico","pavo",null,"calabacin",null,"mostaza_miel","plancha"]` | Pechuga de pavo a la plancha con mostaza y miel con calabacín | no | 7 | 1.4% |
| `["caliente_clasico","pavo",null,"berenjena",null,"tomate_casero","horno"]` | Pechuga de pavo al horno con tomate casero con berenjena | no | 7 | 1.4% |
| `["caliente_clasico","pavo",null,"calabacin",null,"curry_ligero","salteado"]` | Pechuga de pavo salteado con curry y cúrcuma con calabacín | no | 7 | 1.4% |
| `["caliente_clasico","pollo",null,"espinacas",null,"ajillo","plancha"]` | Pechuga de pollo a la plancha con ajo, perejil y guindilla con espinacas | no | 7 | 1.4% |
| `burrito_legumbres` | Burrito de alubias negras, arroz y verduras | no | 6 | 1.2% |
| `["caliente_clasico","calamares",null,"pimientos",null,"ajillo","plancha"]` | Calamares a la plancha con ajo, perejil y guindilla con pimientos | no | 6 | 1.2% |
| `["pasta","pollo","pasta","tomate",null,"tomate_casero","salteado"]` | Pasta integral al pomodoro con pechuga de pollo | no | 6 | 1.2% |
| `["caliente_clasico","ternera",null,"espinacas",null,"ajillo","plancha"]` | Ternera magra a la plancha con ajo, perejil y guindilla con espinacas | no | 6 | 1.2% |
| `sopa_miso_tofu` | Sopa de miso con tofu firme, setas shiitake y alga wakame | no | 5 | 1.0% |
| `cocido_express` | Cocido madrileño express | no | 4 | 0.8% |
| `fabada_simplificada` | Fabada asturiana simplificada | no | 4 | 0.8% |
| `gazpacho_huevo_atun` | Gazpacho con huevo duro, atún y pan | no | 3 | 0.6% |
| `gnocchi_sorrentina` | Gnocchi alla sorrentina | no | 2 | 0.4% |
| `pollo_ajillo_patatas` | Pollo al ajillo con patatas nuevas | no | 2 | 0.4% |
| `bibimbap_ternera_huevo` | Bibimbap de ternera picada, huevo y verduras salteadas | no | 1 | 0.2% |
| `buddha_bowl_completo` | Buddha bowl con quinoa, pollo, aguacate y verduras | no | 1 | 0.2% |
| `ceviche_pescado_blanco` | Ceviche de pescado blanco con boniato y cancha | no | 1 | 0.2% |
| `empanada_gallega_atun` | Empanada gallega de atún con ensalada | no | 1 | 0.2% |
| `ensaladilla_proteica` | Ensaladilla proteica (atún, huevo y pollo) | no | 1 | 0.2% |
| `pasta_alla_norma` | Pasta alla norma con atún | no | 1 | 0.2% |

## 7. Resultados — Vista C (por identidad individual)

| identidad | apariciones totales | % semanas >=1 |
|---|---|---|
| tomate | 949 | 79.6% |
| zanahoria | 825 | 58.4% |
| pimientos | 823 | 66.4% |
| espinacas | 512 | 66.8% |
| calabacin | 482 | 63.6% |
| pepino | 354 | 56.2% |
| berenjena | 316 | 28.2% |
| lechuga | 312 | 52.0% |
| judias | 228 | 37.6% |
| brocoli | 159 | 28.6% |
| esparragos | 135 | 23.4% |
| alcachofa | 106 | 20.0% |
| champiñones | 93 | 17.0% |
| puerro | 92 | 16.2% |
| calabaza | 83 | 16.0% |
| coles | 50 | 9.8% |
| acelgas | 36 | 7.0% |

## 8. Reconciliación (Vista C derivable de Vista A + Vista B)

Relación exacta: cada aparición de un plato en el universo A/C contribuye
tantas identidades a la suma de Vista C como elementos tenga su
`valorEfectivo` (0 para freeform/"desconocida" — no entran en A/C; 1 para
un plato con solo V; 2 para un plato con V+V2, que es exactamente lo que
cuenta Vista A). Por tanto:

`suma(Vista C) = 2 x suma(Vista A) + suma(apariciones de platos del
universo A/C con exactamente 1 identidad)`

- Suma de apariciones, Vista C: **5555**
- 2 x suma de apariciones, Vista A: **1462**
- Apariciones de platos con exactamente 1 identidad (universo A/C): **4093**
- Reconstrucción: 2 x 731 + 4093 = **5555**
- Coincide con suma de Vista C: **true**

## 9. Contrato de reproducción

Mismo contrato que `baseline-variedad-verdura.md`, sección 5 (mismo
commit, mismas semillas, mismo PROFILE, mismo catálogo). Reproducir con:

```
node docs/evidence/variedad-verdura/veg_variety_engine2_freq.mjs
```

El runner ejecuta la campaña completa dos veces y compara el contenido
íntegro de este artefacto; una reproducción válida debe imprimir
`determinismo: true` y no debe reescribir este archivo con contenido
distinto.
