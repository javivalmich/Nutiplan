# Vista D — intensidad intra-semana (variedad de verdura, engine2)

## 1. Qué mide y por qué

Extiende `veg_variety_engine2_freq.md` con la dimensión que ese artefacto
no responde: no "en cuántas semanas aparece" una unidad (plato/combinación/
identidad), sino "cuántas veces aparece dentro de cada semana en la que
aparece". Una media de 2 apariciones/semana puede ser "siempre 2" o "mitad
1, mitad 3" -- el histograma de intensidad por semana afectada distingue
ambos casos. Esta vista NO interpreta el fenómeno ni propone mecanismo
alguno -- solo lo mide.

## 2. Metadatos de la campaña

Idénticos a los runners anclados (mismo PROFILE, N=500, semillas 1..500,
`seed = i + 1`, RNG mulberry32 vía `buildWeekArc`/`runWalk`). Ver
`baseline-variedad-verdura.md`, sección 2.

## 3. Universo y definiciones (idénticos al runner de frecuencia anclado)

- Unidad **plato** (`dishId`): universo completo de huecos no-libres, sin
  filtro de origen (`veg_variety_engine2_freq.mjs:181`).
- Unidades **combinación** e **identidad**: excluyen `vista.origen ===
  'freeform'` y `vista.verdura.origen === 'desconocida'`
  (`veg_variety_engine2_freq.mjs:196-197`). Combinación requiere >=2
  identidades en `valorEfectivo` (`veg_variety_engine2_freq.mjs:208`),
  clave = identidades ordenadas alfabéticamente unidas con `|`.
- Día `fixedRole === 'libre'` excluido para las tres unidades
  (`veg_variety_engine2_freq.mjs:172`).

## 4. Gate de validez — headline vs baseline anclada

| Métrica | Esperado | Observado | OK |
|---|---|---|---|
| % semanas maxVegDays>=3 | 98.6% | 98.6% | true |
| Histograma | {"1":0,"2":7,"3":208,"4":222,"5+":63} | {"1":0,"2":7,"3":208,"4":222,"5+":63} | true |
| Media identidades/semana | 6.47 | 6.47 | true |
| Vocabulario | 17 | 17 | true |

**Gate headline: OK**

## 5. Gate de validez — reconciliación con veg_variety_engine2_freq.md

Comparación exacta (entero de apariciones totales + string de % semanas)
contra el artefacto de frecuencia ya commiteado, para las tres unidades.

**Gate reconciliación: OK — 0 discrepancias**

## 6. Resultados — tabla resumen (todas las unidades)

### 6.1 Plato (`dishId`)

| plato | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
| `["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]` Garbanzos con pimientos guisado | 92 | 335 | 3.64 |
| `["legumbre","lentejas","arroz","zanahoria",null,"pimenton_ajo","guisado"]` Lentejas con arroz y zanahoria guisado | 83 | 307 | 3.70 |
| `["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]` Ternera con patata y zanahoria guisado | 80 | 293 | 3.66 |
| `["sopa_crema","huevo",null,"tomate",null,null,"crudo"]` Huevo con tomate en crudo | 84 | 252 | 3.00 |
| `curry_garbanzos` Curry de garbanzos con arroz basmati | 235 | 235 | 1.00 |
| `["legumbre","garbanzos",null,"berenjena",null,"curry_ligero","salteado"]` Garbanzos con berenjena salteado | 77 | 231 | 3.00 |
| `hummus_pita_pollo` Hummus con pita integral y pollo especiado | 205 | 205 | 1.00 |
| `ensalada_lentejas_feta` Ensalada tibia de lentejas con feta, tomate y hierbas | 175 | 175 | 1.00 |
| `["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]` Atún con tomate y pimientos en crudo [V2] | 84 | 168 | 2.00 |
| `["caliente_clasico","atun",null,"tomate",null,"vinagreta","crudo"]` Atún en conserva en crudo con vinagre de Módena y mostaza con tomate cherry | 105 | 105 | 1.00 |
| `["caliente_clasico","atun",null,"lechuga","pepino",null,"crudo"]` Atún en conserva en crudo con lechuga mixta y pepino [V2] | 93 | 93 | 1.00 |
| `["ensalada","atun",null,"lechuga","pepino","vinagreta","crudo"]` Atún en conserva en ensalada [V2] | 82 | 82 | 1.00 |
| `["caliente_clasico","bacalao","patata","pimientos",null,"ajillo","horno"]` Bacalao fresco al horno con ajo, perejil y guindilla con pimientos y patata | 50 | 50 | 1.00 |
| `sardinas_plancha_escalivada` Sardinas a la plancha con escalivada y pan tostado | 48 | 48 | 1.00 |
| `["caliente_clasico","bacalao","arroz","espinacas",null,"limon_hierbas","horno"]` Bacalao fresco al horno con limón, orégano y ajo con espinacas y arroz blanco | 47 | 47 | 1.00 |
| `["caliente_clasico","sardinas",null,"tomate",null,"ajillo","plancha"]` Sardinas a la plancha con ajo, perejil y guindilla con tomate cherry | 47 | 47 | 1.00 |
| `["caliente_clasico","bacalao",null,"pimientos",null,"ajillo","horno"]` Bacalao fresco al horno con ajo, perejil y guindilla con pimientos | 46 | 46 | 1.00 |
| `["caliente_clasico","dorada","arroz","judias",null,"ajillo","horno"]` Dorada al horno con ajo, perejil y guindilla con judías verdes y arroz blanco | 44 | 44 | 1.00 |
| `["caliente_clasico","bacalao",null,"espinacas",null,"ajillo","horno"]` Bacalao fresco al horno con ajo, perejil y guindilla con espinacas | 42 | 42 | 1.00 |
| `["caliente_clasico","dorada",null,"calabacin",null,"limon_hierbas","horno"]` Dorada al horno con limón, orégano y ajo con calabacín | 42 | 42 | 1.00 |
| `["caliente_clasico","merluza","patata","judias",null,"limon_hierbas","horno"]` Merluza al horno con limón, orégano y ajo con judías verdes y patata | 42 | 42 | 1.00 |
| `salmon_af_verduras` Salmón al airfryer con verduras asadas | 42 | 42 | 1.00 |
| `["caliente_clasico","dorada",null,"espinacas",null,"limon_hierbas","horno"]` Dorada al horno con limón, orégano y ajo con espinacas | 41 | 41 | 1.00 |
| `["caliente_clasico","merluza",null,"alcachofa",null,"limon_hierbas","horno"]` Merluza al horno con limón, orégano y ajo con alcachofas | 40 | 40 | 1.00 |
| `["caliente_clasico","dorada","patata","calabacin",null,"limon_hierbas","horno"]` Dorada al horno con limón, orégano y ajo con calabacín y patata | 39 | 39 | 1.00 |
| `["caliente_clasico","merluza",null,"calabacin",null,"limon_hierbas","horno"]` Merluza al horno con limón, orégano y ajo con calabacín | 39 | 39 | 1.00 |
| `["caliente_clasico","salmon","arroz","esparragos",null,"limon_hierbas","horno"]` Salmón al horno con limón, orégano y ajo con espárragos y arroz blanco | 39 | 39 | 1.00 |
| `["caliente_clasico","merluza",null,"judias",null,"ajillo","horno"]` Merluza al horno con ajo, perejil y guindilla con judías verdes | 38 | 38 | 1.00 |
| `["caliente_clasico","salmon",null,"esparragos",null,"limon_hierbas","plancha"]` Salmón a la plancha con limón, orégano y ajo con espárragos | 38 | 38 | 1.00 |
| `["caliente_clasico","salmon","patata","espinacas",null,"limon_hierbas","horno"]` Salmón al horno con limón, orégano y ajo con espinacas y patata | 35 | 35 | 1.00 |
| `pisto_manchego_huevo` Pisto manchego con huevo a la plancha | 33 | 33 | 1.00 |
| `["caliente_clasico","salmon",null,"espinacas",null,"limon_hierbas","horno"]` Salmón al horno con limón, orégano y ajo con espinacas | 32 | 32 | 1.00 |
| `shakshuka` Shakshuka con pan integral | 32 | 32 | 1.00 |
| `["caliente_clasico","merluza","arroz","calabacin",null,"ajillo","horno"]` Merluza al horno con ajo, perejil y guindilla con calabacín y arroz blanco | 31 | 31 | 1.00 |
| `sopa_castellana_jamon` Sopa castellana con jamón serrano y huevo pochado | 31 | 31 | 1.00 |
| `["caliente_clasico","cerdo","patata","coles",null,"mostaza_miel","horno"]` Lomo de cerdo al horno con mostaza y miel con col de bruselas y patata | 30 | 30 | 1.00 |
| `["ensalada","pollo",null,"lechuga","tomate","vinagreta","plancha"]` Pechuga de pollo en ensalada [V2] | 29 | 29 | 1.00 |
| `["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]` Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli y arroz blanco | 28 | 28 | 1.00 |
| `["sopa_crema","huevo",null,"calabaza","zanahoria",null,null]` Crema de calabaza con huevos encima [V2] | 26 | 26 | 1.00 |
| `["legumbre","garbanzos",null,"alcachofa",null,"limon_hierbas","guisado"]` Garbanzos estofadas con alcachofas | 25 | 25 | 1.00 |
| `["legumbre","lentejas",null,"calabacin",null,"ajillo","guisado"]` Lentejas al ajillo con calabacín | 25 | 25 | 1.00 |
| `["caliente_clasico","conejo","patata","pimientos",null,"ajillo","horno"]` Conejo al horno con ajo, perejil y guindilla con pimientos y patata | 24 | 24 | 1.00 |
| `["sopa_crema","pollo",null,"puerro","zanahoria",null,"guisado"]` Crema de puerro con pechuga de pollo encima [V2] | 24 | 24 | 1.00 |
| `["sopa_crema","pollo",null,"puerro",null,"provenzal","guisado"]` Crema de puerro con pechuga de pollo encima | 24 | 24 | 1.00 |
| `["sopa_crema","pollo",null,"zanahoria","calabacin",null,"guisado"]` Crema de zanahoria con pechuga de pollo encima [V2] | 24 | 24 | 1.00 |
| `["legumbre","garbanzos",null,"zanahoria",null,"pimenton_ajo","guisado"]` Garbanzos con pimentón con zanahoria | 24 | 24 | 1.00 |
| `["bowl","atun","arroz","pepino","tomate","vinagreta","crudo"]` Bowl proteico de atún en conserva con arroz blanco [V2] | 23 | 23 | 1.00 |
| `["sopa_crema","gambas",null,"calabacin",null,"ajillo","plancha"]` Crema de calabacín con gambas encima | 23 | 23 | 1.00 |
| `["sopa_crema","atun",null,"tomate","pepino",null,"crudo"]` Crema de tomate cherry con atún en conserva encima [V2] | 23 | 23 | 1.00 |
| `["legumbre","garbanzos",null,"tomate",null,"ajillo","salteado"]` Garbanzos al ajillo con tomate cherry | 23 | 23 | 1.00 |
| `["caliente_clasico","pollo","boniato","calabacin",null,"pimenton_ajo","horno"]` Pechuga de pollo al horno con pimentón ahumado y ajo con calabacín y boniato | 23 | 23 | 1.00 |
| `["legumbre","alubias",null,"acelgas",null,"ajillo","guisado"]` Alubias blancas al ajillo con acelgas | 22 | 22 | 1.00 |
| `["caliente_clasico","atun","arroz","tomate",null,"limon_hierbas","crudo"]` Atún en conserva en crudo con limón, orégano y ajo con tomate cherry y arroz blanco | 22 | 22 | 1.00 |
| `caldo_gallego_grelos_ligero` Caldo gallego de grelos (ligero) | 22 | 22 | 1.00 |
| `["sopa_crema","huevo",null,"calabacin","zanahoria",null,"plancha"]` Crema de calabacín con huevos encima [V2] | 22 | 22 | 1.00 |
| `["caliente_clasico","dorada",null,"judias",null,"ajillo","horno"]` Dorada al horno con ajo, perejil y guindilla con judías verdes | 22 | 22 | 1.00 |
| `huevos_rellenos` Huevos rellenos de atún con ensalada | 22 | 22 | 1.00 |
| `ramen_simplificado` Ramen simplificado con pollo y huevo | 22 | 22 | 1.00 |
| `["legumbre","lentejas",null,"zanahoria",null,"pimenton_ajo","guisado"]` Lentejas con pimentón con zanahoria | 21 | 21 | 1.00 |
| `["ensalada","pavo",null,"lechuga","tomate","vinagreta","plancha"]` Pechuga de pavo en ensalada [V2] | 21 | 21 | 1.00 |
| `["caliente_clasico","conejo","arroz","zanahoria",null,"ajillo","guisado"]` Conejo guisado con ajo, perejil y guindilla con zanahoria y arroz blanco | 20 | 20 | 1.00 |
| `["sopa_crema","gambas",null,"calabaza",null,"ajillo","plancha"]` Crema de calabaza con gambas encima | 20 | 20 | 1.00 |
| `["caliente_clasico","merluza","arroz","puerro",null,"limon_hierbas","horno"]` Merluza al horno con limón, orégano y ajo con puerro y arroz blanco | 20 | 20 | 1.00 |
| `["pasta","ternera","pasta","calabacin",null,"tomate_casero","salteado"]` Pasta integral al pomodoro con ternera magra | 20 | 20 | 1.00 |
| `["caliente_clasico","ternera","patata","espinacas",null,"romero_limon","plancha"]` Ternera magra a la plancha con romero, limón y ajo con espinacas y patata | 20 | 20 | 1.00 |
| `["ensalada","atun",null,"tomate","pepino","vinagreta","crudo"]` Atún en conserva en ensalada [V2] | 19 | 19 | 1.00 |
| `["bowl","salmon","quinoa","pepino",null,"soja_jengibre","crudo"]` Bowl asiático de salmón con quinoa | 19 | 19 | 1.00 |
| `["bowl","pollo","quinoa","espinacas",null,"curry_ligero","plancha"]` Bowl de curry de pechuga de pollo con quinoa | 19 | 19 | 1.00 |
| `["bowl","merluza","quinoa","espinacas",null,"limon_hierbas","horno"]` Bowl mediterráneo de merluza con quinoa | 19 | 19 | 1.00 |
| `["sopa_crema","bacalao",null,"zanahoria","calabaza","ajillo","guisado"]` Crema de zanahoria con bacalao fresco encima [V2] | 19 | 19 | 1.00 |
| `["ensalada","gambas",null,"esparragos","tomate","vinagreta","plancha"]` Gambas en ensalada [V2] | 19 | 19 | 1.00 |
| `["ensalada","pollo","quinoa","pepino","zanahoria","limon_hierbas","plancha"]` Pechuga de pollo en ensalada con quinoa [V2] | 19 | 19 | 1.00 |
| `["caliente_clasico","salmon","boniato","espinacas",null,"limon_hierbas","horno"]` Salmón al horno con limón, orégano y ajo con espinacas y boniato | 19 | 19 | 1.00 |
| `["caliente_clasico","salmon","quinoa","espinacas",null,"soja_jengibre","horno"]` Salmón al horno con soja baja en sal y jengibre con espinacas y quinoa | 19 | 19 | 1.00 |
| `["ensalada","ternera",null,"lechuga","tomate","vinagreta","plancha"]` Ternera magra en ensalada [V2] | 19 | 19 | 1.00 |
| `["bowl","pollo","arroz","brocoli",null,"soja_jengibre","salteado"]` Bowl asiático de pechuga de pollo con arroz blanco | 18 | 18 | 1.00 |
| `["bowl","pavo","quinoa","pimientos",null,"limon_hierbas","plancha"]` Bowl mediterráneo de pechuga de pavo con quinoa | 18 | 18 | 1.00 |
| `["sopa_crema","pollo",null,"calabaza",null,"provenzal","plancha"]` Crema de calabaza con pechuga de pollo encima | 18 | 18 | 1.00 |
| `["legumbre","lentejas",null,"espinacas",null,"pimenton_ajo","guisado"]` Lentejas con pimentón con espinacas | 18 | 18 | 1.00 |
| `["legumbre","lentejas",null,"pimientos",null,"pimenton_ajo","guisado"]` Lentejas con pimentón con pimientos | 18 | 18 | 1.00 |
| `mejillones_salsa_verde` Mejillones en salsa verde con pan de pueblo | 18 | 18 | 1.00 |
| `["pasta","gambas","pasta","tomate",null,"ajillo","salteado"]` Pasta integral al ajillo con gambas | 18 | 18 | 1.00 |
| `["caliente_clasico","pavo","patata","judias",null,"limon_hierbas","horno"]` Pechuga de pavo al horno con limón, orégano y ajo con judías verdes y patata | 18 | 18 | 1.00 |
| `["caliente_clasico","pollo","pasta","tomate",null,"pimenton_ajo","salteado"]` Pechuga de pollo salteado con pimentón ahumado y ajo con tomate cherry y pasta integral | 18 | 18 | 1.00 |
| `tom_kha_gai` Tom Kha Gai — sopa tailandesa de pollo y coco | 18 | 18 | 1.00 |
| `["bowl","salmon","arroz","espinacas",null,"soja_jengibre","horno"]` Bowl asiático de salmón con arroz blanco | 17 | 17 | 1.00 |
| `["sopa_crema","huevo",null,"espinacas",null,"limon_hierbas","plancha"]` Crema de espinacas con huevos encima | 17 | 17 | 1.00 |
| `["legumbre","garbanzos",null,"brocoli",null,"curry_ligero","salteado"]` Garbanzos al curry con brócoli | 17 | 17 | 1.00 |
| `["caliente_clasico","cerdo","patata","zanahoria",null,"mostaza_miel","plancha"]` Lomo de cerdo a la plancha con mostaza y miel con zanahoria y patata | 17 | 17 | 1.00 |
| `["pasta","merluza","pasta","calabacin",null,"ajillo","plancha"]` Pasta integral al ajillo con merluza | 17 | 17 | 1.00 |
| `["ensalada","pollo","quinoa","tomate","pepino","limon_hierbas","plancha"]` Pechuga de pollo en ensalada con quinoa [V2] | 17 | 17 | 1.00 |
| `pollo_teriyaki_arroz` Pollo teriyaki con arroz jazmín y verduras | 17 | 17 | 1.00 |
| `["caliente_clasico","ternera","arroz","champiñones",null,"ajillo","plancha"]` Ternera magra a la plancha con ajo, perejil y guindilla con champiñones y arroz blanco | 17 | 17 | 1.00 |
| `["bowl","atun","quinoa","pepino","tomate","vinagreta","crudo"]` Bowl proteico de atún en conserva con quinoa [V2] | 16 | 16 | 1.00 |
| `["bowl","pavo","boniato","calabacin",null,"pimenton_ajo","horno"]` Bowl proteico de pechuga de pavo con boniato | 16 | 16 | 1.00 |
| `["caliente_clasico","dorada","arroz","calabacin",null,"limon_hierbas","horno"]` Dorada al horno con limón, orégano y ajo con calabacín y arroz blanco | 16 | 16 | 1.00 |
| `["ensalada","gambas",null,"lechuga","tomate","limon_hierbas","plancha"]` Gambas en ensalada [V2] | 16 | 16 | 1.00 |
| `["caliente_clasico","gambas","arroz","calabacin",null,"ajillo","salteado"]` Gambas salteado con ajo, perejil y guindilla con calabacín y arroz blanco | 16 | 16 | 1.00 |
| `["caliente_clasico","huevo","arroz","espinacas",null,"ajillo","revuelto"]` Huevos revuelto con ajo, perejil y guindilla con espinacas y arroz blanco | 16 | 16 | 1.00 |
| `["caliente_clasico","cerdo","arroz","alcachofa",null,"ajillo","guisado"]` Lomo de cerdo guisado con ajo, perejil y guindilla con alcachofas y arroz blanco | 16 | 16 | 1.00 |
| `nuggets_caseros_pollo_af` Nuggets caseros de pollo al airfryer con patata gajo | 16 | 16 | 1.00 |
| `["caliente_clasico","pavo","arroz","berenjena",null,"tomate_casero","horno"]` Pechuga de pavo al horno con tomate casero con berenjena y arroz blanco | 16 | 16 | 1.00 |
| `["ensalada","salmon",null,"lechuga","pepino","limon_hierbas","plancha"]` Salmón en ensalada [V2] | 16 | 16 | 1.00 |
| `tortilla_patatas_completa` Tortilla de patatas completa con ensalada | 16 | 16 | 1.00 |
| `["legumbre","alubias",null,"pimientos",null,"ajillo","guisado"]` Alubias blancas al ajillo con pimientos | 15 | 15 | 1.00 |
| `["caliente_clasico","bacalao","arroz","espinacas",null,"ajillo","horno"]` Bacalao fresco al horno con ajo, perejil y guindilla con espinacas y arroz blanco | 15 | 15 | 1.00 |
| `["bowl","ternera","arroz","tomate",null,"vinagreta","plancha"]` Bowl proteico de ternera magra con arroz blanco | 15 | 15 | 1.00 |
| `["caliente_clasico","calamares","arroz","pimientos",null,"ajillo","plancha"]` Calamares a la plancha con ajo, perejil y guindilla con pimientos y arroz blanco | 15 | 15 | 1.00 |
| `["caliente_clasico","calamares","arroz","calabacin",null,"ajillo","salteado"]` Calamares salteado con ajo, perejil y guindilla con calabacín y arroz blanco | 15 | 15 | 1.00 |
| `["caliente_clasico","conejo","patata","alcachofa",null,"limon_hierbas","horno"]` Conejo al horno con limón, orégano y ajo con alcachofas y patata | 15 | 15 | 1.00 |
| `["caliente_clasico","conejo","arroz","berenjena",null,"pimenton_ajo","horno"]` Conejo al horno con pimentón ahumado y ajo con berenjena y arroz blanco | 15 | 15 | 1.00 |
| `["caliente_clasico","conejo","boniato","espinacas",null,"romero_limon","horno"]` Conejo al horno con romero, limón y ajo con espinacas y boniato | 15 | 15 | 1.00 |
| `["sopa_crema","merluza",null,"brocoli",null,"limon_hierbas","plancha"]` Crema de brócoli con merluza encima | 15 | 15 | 1.00 |
| `["caliente_clasico","dorada","patata","brocoli",null,"limon_hierbas","horno"]` Dorada al horno con limón, orégano y ajo con brócoli y patata | 15 | 15 | 1.00 |
| `ensalada_griega_pollo` Ensalada griega con pollo y feta | 15 | 15 | 1.00 |
| `["ensalada","gambas",null,"lechuga","pepino","vinagreta","plancha"]` Gambas en ensalada [V2] | 15 | 15 | 1.00 |
| `hamburguesa_ternera_completa` Hamburguesa de ternera con pan brioche y patatas gajo | 15 | 15 | 1.00 |
| `["caliente_clasico","huevo",null,"tomate",null,"ajillo","plancha"]` Huevos a la plancha con ajo, perejil y guindilla con tomate cherry | 15 | 15 | 1.00 |
| `["caliente_clasico","merluza","patata","judias",null,"ajillo","horno"]` Merluza al horno con ajo, perejil y guindilla con judías verdes y patata | 15 | 15 | 1.00 |
| `["pasta","gambas","pasta","calabacin",null,"ajillo","salteado"]` Pasta integral al ajillo con gambas | 15 | 15 | 1.00 |
| `["caliente_clasico","pavo","boniato","judias",null,"curry_ligero","plancha"]` Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato | 15 | 15 | 1.00 |
| `["caliente_clasico","pollo","arroz","espinacas",null,"pimenton_ajo","horno"]` Pechuga de pollo al horno con pimentón ahumado y ajo con espinacas y arroz blanco | 15 | 15 | 1.00 |
| `["caliente_clasico","bacalao","boniato","tomate",null,"pimenton_ajo","horno"]` Bacalao fresco al horno con pimentón ahumado y ajo con tomate cherry y boniato | 14 | 14 | 1.00 |
| `["bowl","pollo","quinoa","esparragos",null,"limon_hierbas","plancha"]` Bowl mediterráneo de pechuga de pollo con quinoa | 14 | 14 | 1.00 |
| `["caliente_clasico","cerdo",null,"acelgas",null,"ajillo","plancha"]` Lomo de cerdo a la plancha con ajo, perejil y guindilla con acelgas | 14 | 14 | 1.00 |
| `["caliente_clasico","pollo",null,"berenjena",null,"provenzal","horno"]` Pechuga de pollo al horno con hierbas provenzales con berenjena | 14 | 14 | 1.00 |
| `quesadilla_fitness` Quesadilla fitness de pollo y queso bajo en grasa | 14 | 14 | 1.00 |
| `["caliente_clasico","ternera","arroz","pimientos",null,"ajillo","guisado"]` Ternera magra guisado con ajo, perejil y guindilla con pimientos y arroz blanco | 14 | 14 | 1.00 |
| `["bowl","pollo","boniato","calabacin",null,"pimenton_ajo","horno"]` Bowl proteico de pechuga de pollo con boniato | 13 | 13 | 1.00 |
| `["sopa_crema","pollo",null,"brocoli",null,"limon_hierbas","plancha"]` Crema de brócoli con pechuga de pollo encima | 13 | 13 | 1.00 |
| `["legumbre","garbanzos",null,"espinacas",null,"pimenton_ajo","guisado"]` Garbanzos con pimentón con espinacas | 13 | 13 | 1.00 |
| `hamburguesa_pollo_completa` Hamburguesa de pollo con pan integral y patatas gajo | 13 | 13 | 1.00 |
| `["caliente_clasico","huevo",null,"calabacin",null,"pimenton_ajo","tortilla"]` Huevos en tortilla con pimentón ahumado y ajo con calabacín | 13 | 13 | 1.00 |
| `["caliente_clasico","huevo",null,"champiñones",null,"ajillo","revuelto"]` Huevos revuelto con ajo, perejil y guindilla con champiñones | 13 | 13 | 1.00 |
| `["pasta","ternera","pasta","berenjena",null,"tomate_casero","salteado"]` Pasta integral al pomodoro con ternera magra | 13 | 13 | 1.00 |
| `["caliente_clasico","pavo","patata","judias",null,"ajillo","horno"]` Pechuga de pavo al horno con ajo, perejil y guindilla con judías verdes y patata | 13 | 13 | 1.00 |
| `["caliente_clasico","pollo","patata","judias",null,"provenzal","horno"]` Pechuga de pollo al horno con hierbas provenzales con judías verdes y patata | 13 | 13 | 1.00 |
| `["caliente_clasico","pollo","patata","puerro",null,"provenzal","horno"]` Pechuga de pollo al horno con hierbas provenzales con puerro y patata | 13 | 13 | 1.00 |
| `["caliente_clasico","salmon","arroz","esparragos",null,"limon_hierbas","plancha"]` Salmón a la plancha con limón, orégano y ajo con espárragos y arroz blanco | 13 | 13 | 1.00 |
| `["caliente_clasico","ternera","patata","pimientos",null,"romero_limon","plancha"]` Ternera magra a la plancha con romero, limón y ajo con pimientos y patata | 13 | 13 | 1.00 |
| `wok_verduras_pollo` Wok de verduras con pollo y arroz | 13 | 13 | 1.00 |
| `wrap_mediterraneo` Wrap mediterráneo de pollo, hummus y verduras | 13 | 13 | 1.00 |
| `berberechos_vapor_pan` Berberechos al vapor con limón y pan tostado | 12 | 12 | 1.00 |
| `["bowl","gambas","arroz","pepino",null,"limon_hierbas","plancha"]` Bowl mediterráneo de gambas con arroz blanco | 12 | 12 | 1.00 |
| `["caliente_clasico","conejo",null,"espinacas",null,"ajillo","horno"]` Conejo al horno con ajo, perejil y guindilla con espinacas | 12 | 12 | 1.00 |
| `["ensalada","gambas",null,"lechuga","tomate","vinagreta","plancha"]` Gambas en ensalada [V2] | 12 | 12 | 1.00 |
| `["caliente_clasico","huevo",null,"esparragos",null,"ajillo","plancha"]` Huevos a la plancha con ajo, perejil y guindilla con espárragos | 12 | 12 | 1.00 |
| `["caliente_clasico","huevo",null,"pimientos",null,"pimenton_ajo","revuelto"]` Huevos revuelto con pimentón ahumado y ajo con pimientos | 12 | 12 | 1.00 |
| `["pasta","pavo","pasta","tomate",null,"tomate_casero","salteado"]` Pasta integral al pomodoro con pechuga de pavo | 12 | 12 | 1.00 |
| `["caliente_clasico","pollo",null,"coles",null,"romero_limon","horno"]` Pechuga de pollo al horno con romero, limón y ajo con col de bruselas | 12 | 12 | 1.00 |
| `["caliente_clasico","pollo",null,"champiñones",null,"provenzal","salteado"]` Pechuga de pollo salteado con hierbas provenzales con champiñones | 12 | 12 | 1.00 |
| `["caliente_clasico","sardinas","patata","pimientos",null,"vinagreta","plancha"]` Sardinas a la plancha con vinagre de Módena y mostaza con pimientos y patata | 12 | 12 | 1.00 |
| `["caliente_clasico","ternera","arroz","champiñones",null,"ajillo","salteado"]` Ternera magra salteado con ajo, perejil y guindilla con champiñones y arroz blanco | 12 | 12 | 1.00 |
| `["caliente_clasico","calamares",null,"calabacin",null,"ajillo","salteado"]` Calamares salteado con ajo, perejil y guindilla con calabacín | 11 | 11 | 1.00 |
| `croquetas_jamon_af` Croquetas caseras de jamón al airfryer con ensalada | 11 | 11 | 1.00 |
| `["caliente_clasico","huevo","patata","champiñones",null,"ajillo","revuelto"]` Huevos revuelto con ajo, perejil y guindilla con champiñones y patata | 11 | 11 | 1.00 |
| `["caliente_clasico","huevo",null,"espinacas",null,"ajillo","revuelto"]` Huevos revuelto con ajo, perejil y guindilla con espinacas | 11 | 11 | 1.00 |
| `["caliente_clasico","cerdo",null,"brocoli",null,"mostaza_miel","plancha"]` Lomo de cerdo a la plancha con mostaza y miel con brócoli | 11 | 11 | 1.00 |
| `["caliente_clasico","cerdo",null,"pimientos",null,"ajillo","horno"]` Lomo de cerdo al horno con ajo, perejil y guindilla con pimientos | 11 | 11 | 1.00 |
| `menestra_verduras_jamon` Menestra de verduras de temporada con jamón | 11 | 11 | 1.00 |
| `["pasta","pollo","pasta","champiñones",null,"provenzal","salteado"]` Pasta integral con proteína con pechuga de pollo | 11 | 11 | 1.00 |
| `["pasta","salmon","pasta","espinacas",null,"limon_hierbas","plancha"]` Pasta integral con proteína con salmón | 11 | 11 | 1.00 |
| `["caliente_clasico","pollo","patata","espinacas",null,"ajillo","horno"]` Pechuga de pollo al horno con ajo, perejil y guindilla con espinacas y patata | 11 | 11 | 1.00 |
| `["caliente_clasico","pollo",null,"puerro",null,"provenzal","horno"]` Pechuga de pollo al horno con hierbas provenzales con puerro | 11 | 11 | 1.00 |
| `["caliente_clasico","sardinas","arroz","tomate",null,"ajillo","plancha"]` Sardinas a la plancha con ajo, perejil y guindilla con tomate cherry y arroz blanco | 11 | 11 | 1.00 |
| `["caliente_clasico","ternera",null,"pimientos",null,"romero_limon","plancha"]` Ternera magra a la plancha con romero, limón y ajo con pimientos | 11 | 11 | 1.00 |
| `verduras_crujientes_af_proteina` Verduras crujientes al airfryer con pollo | 11 | 11 | 1.00 |
| `["caliente_clasico","conejo",null,"alcachofa",null,"ajillo","horno"]` Conejo al horno con ajo, perejil y guindilla con alcachofas | 10 | 10 | 1.00 |
| `esparragos_mayo_atun_huevo` Espárragos con mayonesa, atún y huevo duro | 10 | 10 | 1.00 |
| `["caliente_clasico","gambas",null,"calabacin",null,"ajillo","plancha"]` Gambas a la plancha con ajo, perejil y guindilla con calabacín | 10 | 10 | 1.00 |
| `gyozas_verduras` Gyozas de pollo y verduras con salsa ponzu | 10 | 10 | 1.00 |
| `["caliente_clasico","cerdo","arroz","pimientos",null,"ajillo","horno"]` Lomo de cerdo al horno con ajo, perejil y guindilla con pimientos y arroz blanco | 10 | 10 | 1.00 |
| `["caliente_clasico","cerdo","patata","berenjena",null,"pimenton_ajo","horno"]` Lomo de cerdo al horno con pimentón ahumado y ajo con berenjena y patata | 10 | 10 | 1.00 |
| `["caliente_clasico","cerdo","boniato","calabacin",null,"romero_limon","horno"]` Lomo de cerdo al horno con romero, limón y ajo con calabacín y boniato | 10 | 10 | 1.00 |
| `["caliente_clasico","merluza","arroz","espinacas",null,"ajillo","horno"]` Merluza al horno con ajo, perejil y guindilla con espinacas y arroz blanco | 10 | 10 | 1.00 |
| `["pasta","atun","pasta","calabacin",null,"ajillo","crudo"]` Pasta integral al ajillo con atún en conserva | 10 | 10 | 1.00 |
| `pizza_proteica_casera` Pizza proteica casera con pollo y mozzarella | 10 | 10 | 1.00 |
| `["caliente_clasico","ternera",null,"champiñones",null,"ajillo","plancha"]` Ternera magra a la plancha con ajo, perejil y guindilla con champiñones | 10 | 10 | 1.00 |
| `["caliente_clasico","ternera",null,"berenjena",null,"pimenton_ajo","plancha"]` Ternera magra a la plancha con pimentón ahumado y ajo con berenjena | 10 | 10 | 1.00 |
| `["ensalada","atun",null,"lechuga","tomate","vinagreta","crudo"]` Atún en conserva en ensalada [V2] | 9 | 9 | 1.00 |
| `["caliente_clasico","conejo","patata","espinacas",null,"romero_limon","horno"]` Conejo al horno con romero, limón y ajo con espinacas y patata | 9 | 9 | 1.00 |
| `crema_calabacin_queso_huevo` Crema de calabacín con queso fresco y huevo | 9 | 9 | 1.00 |
| `hamburguesa_pavo_completa` Hamburguesa de pavo con pan integral y patatas gajo | 9 | 9 | 1.00 |
| `["caliente_clasico","huevo","patata","pimientos",null,"pimenton_ajo","tortilla"]` Huevos en tortilla con pimentón ahumado y ajo con pimientos y patata | 9 | 9 | 1.00 |
| `["caliente_clasico","huevo",null,"zanahoria",null,"pimenton_ajo","tortilla"]` Huevos en tortilla con pimentón ahumado y ajo con zanahoria | 9 | 9 | 1.00 |
| `["pasta","cerdo","pasta","pimientos",null,"pimenton_ajo","salteado"]` Pasta integral con proteína con lomo de cerdo | 9 | 9 | 1.00 |
| `["caliente_clasico","pavo","arroz","pimientos",null,"pimenton_ajo","plancha"]` Pechuga de pavo a la plancha con pimentón ahumado y ajo con pimientos y arroz blanco | 9 | 9 | 1.00 |
| `["caliente_clasico","pavo","arroz","calabacin",null,"curry_ligero","salteado"]` Pechuga de pavo salteado con curry y cúrcuma con calabacín y arroz blanco | 9 | 9 | 1.00 |
| `["caliente_clasico","pollo",null,"calabacin",null,"provenzal","plancha"]` Pechuga de pollo a la plancha con hierbas provenzales con calabacín | 9 | 9 | 1.00 |
| `["caliente_clasico","pollo",null,"brocoli",null,"limon_hierbas","plancha"]` Pechuga de pollo a la plancha con limón, orégano y ajo con brócoli | 9 | 9 | 1.00 |
| `["caliente_clasico","pollo","arroz","brocoli",null,"pimenton_ajo","plancha"]` Pechuga de pollo a la plancha con pimentón ahumado y ajo con brócoli y arroz blanco | 9 | 9 | 1.00 |
| `["caliente_clasico","pollo","boniato","pimientos",null,"provenzal","horno"]` Pechuga de pollo al horno con hierbas provenzales con pimientos y boniato | 9 | 9 | 1.00 |
| `["caliente_clasico","pollo",null,"pimientos",null,"pimenton_ajo","horno"]` Pechuga de pollo al horno con pimentón ahumado y ajo con pimientos | 9 | 9 | 1.00 |
| `["caliente_clasico","ternera","boniato","brocoli",null,"pimenton_ajo","horno"]` Ternera magra al horno con pimentón ahumado y ajo con brócoli y boniato | 9 | 9 | 1.00 |
| `falafel_tabule_yogur` Falafel con tabulé de bulgur y yogur de menta | 8 | 8 | 1.00 |
| `["caliente_clasico","cerdo",null,"coles",null,"mostaza_miel","horno"]` Lomo de cerdo al horno con mostaza y miel con col de bruselas | 8 | 8 | 1.00 |
| `["pasta","pollo","pasta","espinacas",null,"ajillo","salteado"]` Pasta integral al ajillo con pechuga de pollo | 8 | 8 | 1.00 |
| `["caliente_clasico","pavo",null,"judias",null,"ajillo","plancha"]` Pechuga de pavo a la plancha con ajo, perejil y guindilla con judías verdes | 8 | 8 | 1.00 |
| `["caliente_clasico","pavo",null,"brocoli",null,"limon_hierbas","plancha"]` Pechuga de pavo a la plancha con limón, orégano y ajo con brócoli | 8 | 8 | 1.00 |
| `["caliente_clasico","pavo","boniato","espinacas",null,"mostaza_miel","horno"]` Pechuga de pavo al horno con mostaza y miel con espinacas y boniato | 8 | 8 | 1.00 |
| `pollo_crujiente_af_boniato` Pollo crujiente al airfryer con boniato asado | 8 | 8 | 1.00 |
| `["caliente_clasico","conejo","arroz","champiñones",null,"ajillo","horno"]` Conejo al horno con ajo, perejil y guindilla con champiñones y arroz blanco | 7 | 7 | 1.00 |
| `["caliente_clasico","huevo",null,"brocoli",null,"limon_hierbas","revuelto"]` Huevos revuelto con limón, orégano y ajo con brócoli | 7 | 7 | 1.00 |
| `["caliente_clasico","pavo",null,"calabacin",null,"mostaza_miel","plancha"]` Pechuga de pavo a la plancha con mostaza y miel con calabacín | 7 | 7 | 1.00 |
| `["caliente_clasico","pavo",null,"berenjena",null,"tomate_casero","horno"]` Pechuga de pavo al horno con tomate casero con berenjena | 7 | 7 | 1.00 |
| `["caliente_clasico","pavo",null,"calabacin",null,"curry_ligero","salteado"]` Pechuga de pavo salteado con curry y cúrcuma con calabacín | 7 | 7 | 1.00 |
| `["caliente_clasico","pollo",null,"espinacas",null,"ajillo","plancha"]` Pechuga de pollo a la plancha con ajo, perejil y guindilla con espinacas | 7 | 7 | 1.00 |
| `burrito_legumbres` Burrito de alubias negras, arroz y verduras | 6 | 6 | 1.00 |
| `["caliente_clasico","calamares",null,"pimientos",null,"ajillo","plancha"]` Calamares a la plancha con ajo, perejil y guindilla con pimientos | 6 | 6 | 1.00 |
| `["pasta","pollo","pasta","tomate",null,"tomate_casero","salteado"]` Pasta integral al pomodoro con pechuga de pollo | 6 | 6 | 1.00 |
| `["caliente_clasico","ternera",null,"espinacas",null,"ajillo","plancha"]` Ternera magra a la plancha con ajo, perejil y guindilla con espinacas | 6 | 6 | 1.00 |
| `sopa_miso_tofu` Sopa de miso con tofu firme, setas shiitake y alga wakame | 5 | 5 | 1.00 |
| `cocido_express` Cocido madrileño express | 4 | 4 | 1.00 |
| `fabada_simplificada` Fabada asturiana simplificada | 4 | 4 | 1.00 |
| `gazpacho_huevo_atun` Gazpacho con huevo duro, atún y pan | 3 | 3 | 1.00 |
| `gnocchi_sorrentina` Gnocchi alla sorrentina | 2 | 2 | 1.00 |
| `pollo_ajillo_patatas` Pollo al ajillo con patatas nuevas | 2 | 2 | 1.00 |
| `bibimbap_ternera_huevo` Bibimbap de ternera picada, huevo y verduras salteadas | 1 | 1 | 1.00 |
| `buddha_bowl_completo` Buddha bowl con quinoa, pollo, aguacate y verduras | 1 | 1 | 1.00 |
| `ceviche_pescado_blanco` Ceviche de pescado blanco con boniato y cancha | 1 | 1 | 1.00 |
| `empanada_gallega_atun` Empanada gallega de atún con ensalada | 1 | 1 | 1.00 |
| `ensaladilla_proteica` Ensaladilla proteica (atún, huevo y pollo) | 1 | 1 | 1.00 |
| `pasta_alla_norma` Pasta alla norma con atún | 1 | 1 | 1.00 |

### 6.2 Combinación

| combinación | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
| lechuga|pepino | 193 | 206 | 1.07 |
| pimientos|tomate | 84 | 168 | 2.00 |
| lechuga|tomate | 103 | 106 | 1.03 |
| pepino|tomate | 94 | 98 | 1.04 |
| calabacin|zanahoria | 46 | 46 | 1.00 |
| calabaza|zanahoria | 44 | 45 | 1.02 |
| puerro|zanahoria | 24 | 24 | 1.00 |
| esparragos|tomate | 19 | 19 | 1.00 |
| pepino|zanahoria | 19 | 19 | 1.00 |

### 6.3 Identidad individual

| identidad | semanas afectadas | apariciones totales | media/semana afectada |
|---|---|---|---|
| tomate | 398 | 949 | 2.38 |
| zanahoria | 292 | 825 | 2.83 |
| pimientos | 332 | 823 | 2.48 |
| espinacas | 334 | 512 | 1.53 |
| calabacin | 318 | 482 | 1.52 |
| pepino | 281 | 354 | 1.26 |
| berenjena | 141 | 316 | 2.24 |
| lechuga | 260 | 312 | 1.20 |
| judias | 188 | 228 | 1.21 |
| brocoli | 143 | 159 | 1.11 |
| esparragos | 117 | 135 | 1.15 |
| alcachofa | 100 | 106 | 1.06 |
| champiñones | 85 | 93 | 1.09 |
| puerro | 81 | 92 | 1.14 |
| calabaza | 80 | 83 | 1.04 |
| coles | 49 | 50 | 1.02 |
| acelgas | 35 | 36 | 1.03 |

## 7. Resultados — top-15 con histograma de intensidad

Histograma: número de semanas afectadas con exactamente 1/2/3 apariciones
de la unidad esa semana, y "4+" para 4 o más.

### 7.1 Plato (top-15)

| plato | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
| `["legumbre","garbanzos",null,"pimientos",null,"pimenton_ajo","guisado"]` Garbanzos con pimientos guisado | 92 | 335 | 3.64 | {1: 0, 2: 0, 3: 33, "4+": 59} |
| `["legumbre","lentejas","arroz","zanahoria",null,"pimenton_ajo","guisado"]` Lentejas con arroz y zanahoria guisado | 83 | 307 | 3.70 | {1: 0, 2: 0, 3: 25, "4+": 58} |
| `["caliente_clasico","ternera","patata","zanahoria",null,"ajillo","guisado"]` Ternera con patata y zanahoria guisado | 80 | 293 | 3.66 | {1: 0, 2: 0, 3: 27, "4+": 53} |
| `["sopa_crema","huevo",null,"tomate",null,null,"crudo"]` Huevo con tomate en crudo | 84 | 252 | 3.00 | {1: 0, 2: 0, 3: 84, "4+": 0} |
| `curry_garbanzos` Curry de garbanzos con arroz basmati | 235 | 235 | 1.00 | {1: 235, 2: 0, 3: 0, "4+": 0} |
| `["legumbre","garbanzos",null,"berenjena",null,"curry_ligero","salteado"]` Garbanzos con berenjena salteado | 77 | 231 | 3.00 | {1: 0, 2: 0, 3: 77, "4+": 0} |
| `hummus_pita_pollo` Hummus con pita integral y pollo especiado | 205 | 205 | 1.00 | {1: 205, 2: 0, 3: 0, "4+": 0} |
| `ensalada_lentejas_feta` Ensalada tibia de lentejas con feta, tomate y hierbas | 175 | 175 | 1.00 | {1: 175, 2: 0, 3: 0, "4+": 0} |
| `["sopa_crema","atun",null,"tomate","pimientos",null,"crudo"]` Atún con tomate y pimientos en crudo [V2] | 84 | 168 | 2.00 | {1: 0, 2: 84, 3: 0, "4+": 0} |
| `["caliente_clasico","atun",null,"tomate",null,"vinagreta","crudo"]` Atún en conserva en crudo con vinagre de Módena y mostaza con tomate cherry | 105 | 105 | 1.00 | {1: 105, 2: 0, 3: 0, "4+": 0} |
| `["caliente_clasico","atun",null,"lechuga","pepino",null,"crudo"]` Atún en conserva en crudo con lechuga mixta y pepino [V2] | 93 | 93 | 1.00 | {1: 93, 2: 0, 3: 0, "4+": 0} |
| `["ensalada","atun",null,"lechuga","pepino","vinagreta","crudo"]` Atún en conserva en ensalada [V2] | 82 | 82 | 1.00 | {1: 82, 2: 0, 3: 0, "4+": 0} |
| `["caliente_clasico","bacalao","patata","pimientos",null,"ajillo","horno"]` Bacalao fresco al horno con ajo, perejil y guindilla con pimientos y patata | 50 | 50 | 1.00 | {1: 50, 2: 0, 3: 0, "4+": 0} |
| `sardinas_plancha_escalivada` Sardinas a la plancha con escalivada y pan tostado | 48 | 48 | 1.00 | {1: 48, 2: 0, 3: 0, "4+": 0} |
| `["caliente_clasico","bacalao","arroz","espinacas",null,"limon_hierbas","horno"]` Bacalao fresco al horno con limón, orégano y ajo con espinacas y arroz blanco | 47 | 47 | 1.00 | {1: 47, 2: 0, 3: 0, "4+": 0} |

### 7.2 Combinación (top-15)

| combinación | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
| lechuga|pepino | 193 | 206 | 1.07 | {1: 181, 2: 11, 3: 1, "4+": 0} |
| pimientos|tomate | 84 | 168 | 2.00 | {1: 0, 2: 84, 3: 0, "4+": 0} |
| lechuga|tomate | 103 | 106 | 1.03 | {1: 100, 2: 3, 3: 0, "4+": 0} |
| pepino|tomate | 94 | 98 | 1.04 | {1: 90, 2: 4, 3: 0, "4+": 0} |
| calabacin|zanahoria | 46 | 46 | 1.00 | {1: 46, 2: 0, 3: 0, "4+": 0} |
| calabaza|zanahoria | 44 | 45 | 1.02 | {1: 43, 2: 1, 3: 0, "4+": 0} |
| puerro|zanahoria | 24 | 24 | 1.00 | {1: 24, 2: 0, 3: 0, "4+": 0} |
| esparragos|tomate | 19 | 19 | 1.00 | {1: 19, 2: 0, 3: 0, "4+": 0} |
| pepino|zanahoria | 19 | 19 | 1.00 | {1: 19, 2: 0, 3: 0, "4+": 0} |

### 7.3 Identidad individual (top-15)

| identidad | semanas afectadas | apariciones totales | media | histograma intensidad |
|---|---|---|---|---|
| tomate | 398 | 949 | 2.38 | {1: 134, 2: 85, 3: 100, "4+": 79} |
| zanahoria | 292 | 825 | 2.83 | {1: 102, 2: 24, 3: 35, "4+": 131} |
| pimientos | 332 | 823 | 2.48 | {1: 122, 2: 65, 3: 56, "4+": 89} |
| espinacas | 334 | 512 | 1.53 | {1: 197, 2: 102, 3: 29, "4+": 6} |
| calabacin | 318 | 482 | 1.52 | {1: 196, 2: 90, 3: 23, "4+": 9} |
| pepino | 281 | 354 | 1.26 | {1: 213, 2: 64, 3: 3, "4+": 1} |
| berenjena | 141 | 316 | 2.24 | {1: 56, 2: 7, 3: 67, "4+": 11} |
| lechuga | 260 | 312 | 1.20 | {1: 210, 2: 48, 3: 2, "4+": 0} |
| judias | 188 | 228 | 1.21 | {1: 150, 2: 36, 3: 2, "4+": 0} |
| brocoli | 143 | 159 | 1.11 | {1: 127, 2: 16, 3: 0, "4+": 0} |
| esparragos | 117 | 135 | 1.15 | {1: 101, 2: 14, 3: 2, "4+": 0} |
| alcachofa | 100 | 106 | 1.06 | {1: 94, 2: 6, 3: 0, "4+": 0} |
| champiñones | 85 | 93 | 1.09 | {1: 78, 2: 6, 3: 1, "4+": 0} |
| puerro | 81 | 92 | 1.14 | {1: 70, 2: 11, 3: 0, "4+": 0} |
| calabaza | 80 | 83 | 1.04 | {1: 77, 2: 3, 3: 0, "4+": 0} |

## 8. Contrato de reproducción

Mismo contrato que `baseline-variedad-verdura.md` y
`veg_variety_engine2_freq.md` (mismo commit, mismas semillas, mismo
PROFILE, mismo catálogo). Reproducir con:

```
node docs/evidence/variedad-verdura/veg_variety_engine2_intensity.mjs
```

El runner ejecuta la campaña completa dos veces y compara el contenido
íntegro de este artefacto; una reproducción válida debe imprimir
`determinismo: true` y no debe reescribir este archivo con contenido
distinto.
