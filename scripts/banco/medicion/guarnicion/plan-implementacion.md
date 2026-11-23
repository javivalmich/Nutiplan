# Plan de implementación: legumbre como guarnición (2026-11-23)

Diseño cerrado por Javi el 2026-11-23: la ronda final (`prototipo4.md`) con los topes de plato escalados (`prototipo6.md` y `prototipo7.md`). En omni-3714, 3,44 comidas cortas frente a 3,42 se acepta como ruido; en `main` eran 4,37.

Lo medido son las opciones de `variantesGuarnicion2.mjs`:

`--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --redD099 --hidratoSeguidos --racionGuarnicion3 --topeEscalado`

Este documento es solo el plan: no se implementa nada. Cada paso lleva:
- los archivos que toca;
- el test que se escribe antes, y que falla hasta que el paso está hecho;
- si cambia lo que ve el usuario;
- si regenera la línea base del banco (`scripts/banco/linea-base/linea-base.json`, vigilada por `banco.test.js`).

Las líneas citadas son las de HEAD `7a7f518`.

**Lo que no se toca:**
- el motor viejo (`src/engine/`, constitución 4 y 5);
- `scripts/fase7`;
- las vistas, el cuestionario y Supabase;
- `eval/`, que no se importa desde `engine2` (constitución 2).

## Resumen

| Paso | Qué | ¿Cambia lo que ve el usuario? | ¿Regenera la línea base? |
|---|---|---|---|
| 1 | Seguridad de las legumbres | Sí, pero solo a quien escribe esos sinónimos en sus alimentos eliminados | Previsiblemente no |
| 2 | Ingredientes nuevos y renombrar `alubias_cocidas` | No | No (se comprueba) |
| 3 | Lista de legumbres por plato en el catálogo | No | No |
| 4 | Hidrato en dos pasos, solo en omnívoras (con la exclusión de compuestos de la (b)) | **Sí** | **Sí** |
| 5 | Suelo, topes y preferencias de la semana | **Sí** | **Sí** |
| 6 | Raciones de la guarnición | **Sí** (gramos y pan) | Sí, si ya hay guarnición |
| 7 | Red de D-099.3 | **Sí** (solo semanas con infracción; sin-pescado-2000) | **Sí** |
| 8 | Apagar D-116 y D-117 con el interruptor | **Sí** (sin comida doble) | **Sí** |
| 9 | Texto, compra y receta | **Sí** | Sí, si ya hay guarnición |

## Orden recomendado (desacuerdo con el orden de la lista)

La lista numerada se respeta en el documento, pero **no recomiendo implementarla en ese orden**. Tres motivos:

1. **El paso 4, sin el 6 ni el 9, deja un plan incoherente.**
   - Sin el paso 9, el walk decidiría una guarnición y el plato seguiría diciendo «arroz».
   - Sin el paso 6, la legumbre se racionaría con el rango general (`garbanzos_cocidos: [120, 400, 10]`, `raciones.js:57`) en lugar del de la guarnición.
   - Por eso los pasos 6 y 9 deben estar en el código, aunque sin ninguna comida a la que aplicarse, antes de encender el 4.
2. **Todo lo medido se hizo con D-116 y D-117 apagadas.** El paso 8 debe ir antes del 4, o en el mismo cambio. Guarnición y comida doble a la vez no se ha medido nunca.
3. **La red del paso 7 es la que deja sin-pescado-2000 sin infracciones de D-099.3** cuando la (b) saca los compuestos de legumbre. Los pasos 4, 5 y 7 deben publicarse juntos, sin una versión del motor entre medias.

**Orden propuesto:**

| Bloque | Pasos | Efecto |
|---|---|---|
| A | 1, 2, 3 | Nada visible |
| B | 8 | Sin comida doble; nueva línea base |
| C | 6 y 9 | Inactivos: solo actúan sobre comidas con guarnición, y aún no hay ninguna |
| D | 4, 5 y 7, en un mismo PR | Línea base nueva y `VERSION_MOTOR` nueva (`engine2App.js:51`) |

Por la norma de una fase = una rama = un PR, serían 4 PR. Decidirlo es de Javi.

## Paso 1. Seguridad

**Qué:** cerrar los huecos de `seguridad-legumbres.md`.
- **Habitas:**
  - en la intolerancia a legumbres, en `alergenos.js:51`, que hoy tiene `habas?\b` y no cubre «habitas»;
  - en `TEXTO_INTOLERANCIA.legumbres`, en `engine2App.js:77`;
  - en SIBO, en `fodmap.js:186` (`RESTANTE`).
- **Sinónimos en los alimentos eliminados**, de la palabra que escribe el usuario a lo que se quita:
  - «frijoles» → alubias;
  - «soja» → edamame, y también tofu, tempeh y miso;
  - «habas» → habitas;
  - «judías» → alubias;
  - «alubias» → todas las alubias;
  - «legumbres» → todas las legumbres.
  - Hoy es una búsqueda literal del texto en el plato (`engine2App.js:144` y `165`).

**Archivos:**
- `src/engine2/nutrientes/alergenos.js`;
- `src/engine2/nutrientes/fodmap.js`;
- `src/plan/engine2App.js` (`TEXTO_INTOLERANCIA` y la comparación de `eliminados`, con una tabla de sinónimos nueva).

**Test previo:** `src/plan/tests/seguridadLegumbres.test.js`. Es `seguridadLegumbres.mjs` convertido en test:
- Para cada legumbre del inventario y su texto («Habitas (120 g)», «Alubias rojas cocidas (120 g)»…), cada filtro la quita: intolerancia a legumbres, soja para el edamame y SIBO.
- Para cada palabra de la tabla de sinónimos, el filtro de alimentos eliminados quita el plato.
- Hoy fallan las 3 filas de habitas y las 27 de sinónimos marcadas **no** en `seguridad-legumbres.md`.

**Lo que ve el usuario:** solo cambia para quien tenga esas palabras en sus alimentos eliminados: se le quitan más platos.

**Punto a decidir:** «judías» también es la palabra de las judías verdes. Hoy, quien escribe «judías» ya pierde los platos con judías verdes, porque la búsqueda es literal. Con el sinónimo pierde además las alubias. Es lo conservador («ante la duda, se quita», como en `alergenos.js`), pero es una elección.

**Línea base:** previsiblemente no cambia. Ningún perfil del banco tiene esas palabras (`perfiles.mjs`) y ningún plato de `src/` dice «habitas». Se comprueba con `banco.test.js`.

## Paso 2. Ingredientes nuevos

**Qué:**
- **Ingredientes nuevos**, con el nombre de compra del prototipo:
  - `alubias_blancas_cocidas`: BEDCA 898, alubia blanca en conserva;
  - `alubias_rojas_cocidas` y `alubias_pintas_cocidas`: BEDCA 900, alubia negra hervida. Es una aproximación decidida por Javi: BEDCA no tiene alubia roja, y la pinta solo en seco;
  - `lentejas_pardinas_cocidas` y `lentejas_beluga_cocidas`: la misma composición que `lentejas_cocidas`. BEDCA no las distingue;
  - `habitas`: BEDCA 2194, haba fresca.
- **Renombrar `alubias_cocidas` a `alubias_negras_cocidas`.** Su fuente ya es la alubia negra.

**Archivos:**
- `src/engine2/nutrientes/ingredientes.js`;
- `src/engine2/nutrientes/fuentesBedca.js` (la fuente y la nota de aproximación);
- `src/engine2/nutrientes/composicion.js`, regenerado con `scripts/medidor/composicion.mjs` y no a mano (D-100);
- `src/engine2/nutrientes/raciones.js` (`RANGO`, `raciones.js:57`);
- `src/plan/medidor/leerComida.js` (los patrones de texto a clave);
- `src/plan/textos/componer.js` (usa `alubias_cocidas`).
- Los 6 archivos de `src/` que nombran `alubias_cocidas` (grep) cambian con el renombre.

**Test previo:**
- Cada ingrediente nuevo existe en `INGREDIENTES`, tiene composición con su fuente y rango, y `leerComida` lee su texto de compra con su clave.
- Ninguna clave `alubias_cocidas` queda en `src/`.
- Un plan guardado con «Alubias negras cocidas» se sigue leyendo igual.

**Lo que ve el usuario:** nada. Nadie usa aún estos ingredientes, y el renombre no cambia ningún texto.

**Línea base:** no cambia. Se comprueba con `banco.test.js`.

## Paso 3. Lista de legumbres por plato en el catálogo

**Qué:**
- Los 61 platos de plantilla que admiten guarnición, cada uno con su `legumbres_validas`, del inventario (`scripts/banco/medicion/inventario/hidratos-legumbre.csv`).
- Se escribe como módulo JS (`src/engine2/dishes/guarnicionLegumbre.js`), sin `.json` en bruto. El `.csv` se queda en `scripts/` como fuente, con el script que genera el módulo.

**Archivos:**
- `src/engine2/dishes/guarnicionLegumbre.js` (nuevo);
- el generador en `scripts/`;
- `src/plan/catalogo.js`, si la lista se cuelga del plato en `catalogoApp()` (`catalogo.js:12`) en lugar de consultarse aparte.

**Test previo:**
- Cada id de la lista existe en el catálogo como plato de plantilla.
- Cada legumbre de la lista es un ingrediente del paso 2.
- Ningún plato de pescado lleva una legumbre que el inventario descartó.
- La lista coincide con el `.csv`.
- Los ids son tuplas en JSON: si cambia una plantilla, este test avisa.

**Lo que ve el usuario:** nada. **Línea base:** no cambia.

## Paso 4. Elección del hidrato en dos pasos, solo en dietas omnívoras

**Qué:**
- **La decisión.** En la comida, nunca en la cena, después de elegir el plato del hueco: si el plato tiene lista del paso 3 y al perfil le vale alguna legumbre de ella (con los filtros del paso 1), se decide con la semilla en dos pasos.
  - Primero «hidrato original» o «legumbre», uniforme entre las dos.
  - Si sale legumbre, cuál de las válidas, uniforme entre ellas.
  - Usa un RNG propio, `${seed}::guarnicion`, para no mover el resto del walk.
- **Cuenta como legumbre para D-024:** sube el contador semanal y marca el día de la veda, como `registerConsumption`.
- **Solo en dietas omnívoras.** No aplica a vegetariana ni a vegana, como `reglaLegumbreActiva` en `legumbre.js:20-22`.
- **Incluye la exclusión de la (b),** que no estaba en la lista de pasos pero es parte del diseño medido (`--compuestosSoloSinOtro --soloOmnivora`). En omnívoras, un compuesto de legumbre solo entra en el pool de un hueco si no queda otro candidato. Causas: `legumbre_compuesta_fuera_hay_otro` y `legumbre_compuesta_sin_otro_candidato`.
- **Dónde se guarda la decisión:**
  - en el `decisionLog` del walk (`guarnicion_legumbre_elegida` y `guarnicion_hidrato_original`, constitución 3);
  - y en la salida del walk, como lista `guarniciones` junto a `segundos`.
  - `materializePlan` la aplica al plato. El prototipo lo hacía después de `materializePlan`, en `engine2App.js`.

**Archivos:**
- `src/engine2/walk/runWalk.js`:
  - la decisión, después de `registerConsumption` (`runWalk.js:876`);
  - el filtro (b), junto a los filtros del pool (`runWalk.js:591`);
- `src/engine2/walk/` (un módulo nuevo para la guarnición, como `legumbre.js`);
- `src/engine2/materializePlan.js`;
- `src/plan/engine2App.js`: las legumbres válidas del perfil, y `platosSemana` con el nombre original, para que «plato repetido» y «semana anterior» de D-099.3 comparen el plato y no la guarnición.

**Test previo:**
- **Determinismo:** misma semilla, mismas guarniciones (constitución 6).
- **Nunca en la cena.** Nunca en vegetariana ni en vegana.
- **Nunca con una legumbre que el perfil no puede comer**, recorriendo los perfiles del paso 1.
- **Con la (b):** ningún compuesto de legumbre como plato único si había otro candidato.
- **Toda guarnición tiene causa** en el log.
- **Tripwires:** nada de `score` ni de ranking (constitución 1). El primer paso es un sorteo uniforme con la semilla entre dos opciones, no una puntuación. Hay que dejarlo dicho en el asiento de DECISIONS.

**Lo que ve el usuario:** sí. Unas 1,75 guarniciones por semana en los omnívoros, y menos compuestos de legumbre como plato.

**Línea base:** sí, y `VERSION_MOTOR` nueva. Va con los pasos 5 y 7.

## Paso 5. Reglas de la semana

**Qué**, cada regla con vuelta atrás y causa en el log:
- **Tope de 3 legumbres por semana**, contando guarniciones y platos de legumbre servidos. Con 3, ni guarnición ni platos de legumbre en el pool, salvo que no quede otro candidato. Causas: `legumbre_tope_semana`, `legumbre_tope_semana_sin_aplicar` y `guarnicion_legumbre_tope`.
- **Suelo de 2 por la guarnición.** Desde el jueves (índice 3), si la semana lleva menos de 2 legumbres, el siguiente hueco de comida que admite guarnición la lleva, sin el sorteo del primer paso. Nunca fuerza un plato de legumbre suelto. Causas: `guarnicion_suelo_semana` y `guarnicion_suelo_sin_legumbre_valida`.
- **Sin legumbre en la cena:** la guarnición solo va en la comida (D-099.3).
- **Sin guarnición en días seguidos**, aunque sea de otra legumbre. Con el suelo pendiente, espera a la comida siguiente, y solo cede si no queda ninguna comida servida en la semana. Causas: `guarnicion_dias_seguidos_evitada` y `guarnicion_dias_seguidos_sin_aplicar`.
- **Sin el mismo hidrato de plantilla en días seguidos.** Filtro del pool, después de los filtros de la semana y antes de las preferencias A y B (`runWalk.js:738`). La comida con guarnición cuenta como hidrato «legumbre». Causas: `hidrato_dias_seguidos_evitado` y `hidrato_dias_seguidos_sin_aplicar`.
  - En el prototipo se aplicaba a **todas** las dietas, no solo a las omnívoras. Si debe ser así, hay que decirlo en su asiento.
  - Solo mira el hidrato de la plantilla: las patatas de un redactado no cuentan.
- **No repetir legumbre en la semana:** preferencia con vuelta atrás. Causas: `guarnicion_legumbre_no_repetida` y `guarnicion_legumbre_no_repetida_sin_aplicar`.
- **Guisantes y habitas juntos, como mucho 1 vez por semana** (`guarnicion_guisantes_habitas`).

**Archivos:**
- `src/engine2/walk/runWalk.js`;
- el módulo de guarnición del paso 4.

**Test previo**, sobre semanas generadas en varios perfiles con semillas fijas:
- nunca más de 3 legumbres en una semana;
- nunca dos guarniciones en días seguidos;
- con un hueco válido desde el jueves, la semana llega a 2;
- el mismo hidrato de plantilla en días seguidos solo aparece con su causa `sin_aplicar`;
- cada regla que actúa deja su causa.

**Lo que ve el usuario:** sí.

**Línea base:** sí. Va con los pasos 4 y 7.

## Paso 6. Raciones de la guarnición

**Qué**, solo en las comidas con guarnición:
- **La legumbre** va de 100 a 220 g escurridos, con salida en 130 g. No crece con la amplitud del objetivo.
- **Topes de plato del proteico:**
  - ave y carne 200 g (pollo, pavo, ternera, cerdo, conejo);
  - pescado y marisco 220 g.
  - Por encima de 2200 kcal escalan con la amplitud del objetivo, igual que el hidrato y el aceite (`raciones.js:311`, hasta ×1,4, al paso del rango del proteico). Nunca pasan del máximo del rango del proteico, 300 g.
  - Huevo, jamón, tofu y el resto de proteicos no tienen tope de plato.
- **Orden de crecimiento:**
  - En el reparto de `ajustarComida` (`raciones.js:190-218`), la legumbre no pasa de su salida y el pan se queda en su mínimo.
  - El proteico se dimensiona por la proteína de la comida (`raciones.js:206`) hasta su tope, y no crece por kcal.
  - Con la proteína cubierta, o el proteico en su tope, si faltan kcal crece la legumbre hasta 220 g. Después, el pan hasta su máximo, si el plato sigue más de un 5 % por debajo (`raciones.js:366`).
- **Causa en el log de raciones:** `guarnicion_crece_por_energia`, con los gramos y si el proteico está en su tope.

**Archivos:**
- `src/engine2/nutrientes/raciones.js` (`ajustarComida` y `racionesDia`, donde está el log);
- `src/plan/racionesApp.js`: marca el ingrediente de la guarnición, en la lectura de la comida (`racionesApp.js:245`).

**Test previo:** tests unitarios de `ajustarComida` con una comida de guarnición sintética.
- Si la proteína pide menos del tope, el proteico queda justo.
- Si pide más, queda en el tope, con la causa.
- Si faltan kcal, la legumbre crece antes que el pan.
- Con 3714 kcal, los topes son 280 g y 300 g.
- Una comida sin guarnición queda igual que hoy.

**Lo que ve el usuario:** los gramos y el pan de las comidas con guarnición.

**Línea base:** no cambia si va antes del paso 4. Hecho después, sí.

## Paso 7. Red de D-099.3

**Qué:**
- Si la semana acaba con alguna infracción de D-099.3 (`infraccionesD099`, `legumbre.js:204`) y la (b) había sacado compuestos de legumbre del pool, se repite el walk entero con la misma semilla sin esa exclusión. Guarnición, suelo y topes siguen igual. Causa: `guarnicion_red_d099_sin_b`.
- Si sigue con infracción, se anota con causa propia (`infraccion_d099_guarnicion_red_sin_b`) y la semana se queda así.
- Si la (b) no había sacado nada, solo se anota (`infraccion_d099_guarnicion_sin_exclusion`).
- **Con D-116 apagada,** la red de D-116.5 (`runWalk.js:193-250`) no actúa. Esta va en su lugar, después de `walkConRedDeFamilia`. Como mucho son 4 walks por semana, como hoy.

**Archivos:** `src/engine2/walk/runWalk.js`.

**Test previo:**
- Una semana con un catálogo sintético corto, en la que la (b) obliga a una infracción: se repite y queda sin infracción, con la causa.
- Una en la que, aun repitiendo, sigue la infracción: se anota y no hay bucle.
- Misma semilla, mismo resultado.

**Lo que ve el usuario:** solo en las semanas que la red rehace. En lo medido, 11 de cada 200 en sin-pescado-2000 y ninguna en el resto.

**Línea base:** sí. Va con los pasos 4 y 5.

## Paso 8. Apagar D-116 y D-117 con el interruptor

**Qué:** lo que propone `estructura-comida-final/rama-sin-comida-doble.md`, sin borrar código.
- **El interruptor** es un parámetro con valor por defecto apagado: `input.reglaLegumbre` en `runWalk` y `materializePlan`, y `opts.reglaLegumbre` en `generarPlan` y `regenerarComida`. Lo lee `reglaLegumbreActiva` (`legumbre.js:20`).
- **Los tests de D-116 y D-117** lo encienden de forma explícita y siguen probando el código.
- **Las alternativas** leen el mismo interruptor (el veto de `engine2App.js:465`, que usa `reglaLegumbreActiva`).
- **Los planes guardados con comida doble** se siguen leyendo y racionando.

**Archivos:**
- `src/engine2/walk/legumbre.js`;
- `src/engine2/walk/runWalk.js`;
- `src/plan/engine2App.js`;
- `src/plan/generarPlan.js`;
- los 19 archivos de test que generan semanas con comida doble (57 tests, según `rama-sin-comida-doble.md`), para pasarles el interruptor encendido.

**Test previo:**
- Con el interruptor por defecto, ninguna semana tiene días de legumbre sorteados ni segundos.
- Con él encendido, los tests de D-116 y D-117 de hoy pasan sin cambios.
- Un plan guardado con comida doble se sigue racionando igual.

**Lo que ve el usuario:** sí. Desaparecen las comidas dobles nuevas.

**Línea base:** sí, y `VERSION_MOTOR` nueva. Antes de la guarnición daba 233 diferencias en `banco.test.js`.

## Paso 9. Texto, compra y receta de los platos con guarnición

**Qué:**
- **El hidrato de la guarnición** sale de una entrada nueva por legumbre en `HIDRATOS` (`compuestos.js:59`):
  - en caliente: compra, «escurre y enjuaga, caliéntalas 2-3 minutos en una sartén», y la versión de horno;
  - en frío, para ensaladas y platos en crudo: «escurre y enjuaga».
- **El plato se compone con su tupla, cambiando su C por esa legumbre** (`componer.js:17`, `tuplaDe`). Con eso salen la preparación, la compra y la receta.
- **El nombre del plato** cambia la palabra del hidrato por la legumbre: «… con alubias rojas» en lugar de «… y arroz blanco». Si no la encuentra, añade «con <legumbre>».
- **El nombre original** se guarda para D-099.3 (paso 4).

**Archivos:**
- `src/plan/textos/compuestos.js`;
- `src/plan/textos/componer.js`;
- el materializador del paso 4.

**Test previo:**
- Para cada plato de la lista del paso 3 y cada legumbre suya: el texto tiene la legumbre con gramos, la compra la nombra, la receta tiene su preparación, y `leerComida` lo vuelve a leer con la clave del paso 2.
- La comida se lee igual escrita que racionada, como `leerComidaDoble.test.js`.

**Lo que ve el usuario:** sí: el nombre, la preparación, la compra y la receta.

**Línea base:** no cambia si va antes del paso 4. Hecho después, sí.

## Puntos abiertos (no medidos)

- **Regenerar una comida y elegir una alternativa (D-101).** Hoy, la regeneración parcial puede ir por el motor viejo (D-099), que no conoce la guarnición. No está decidido qué pasa:
  - al regenerar una comida con guarnición: ¿la alternativa la conserva?;
  - con la cuenta de legumbres de la semana: ¿la alternativa de una comida con guarnición puede dejar la semana por debajo del suelo de 2?
- **Platos de huevo con guarnición.** El huevo no tiene tope de plato ni crece en el paso 6, y las comidas de huevo siguen siendo la mayor parte de las comidas cortas (1,51 por semana; ver `huevos-cortos.md`).
- **El pan** sigue en el 87 % de las comidas con guarnición.

## Asientos de DECISIONS.md que habría que escribir

Solo cuando Javi lo autorice, y en un commit aparte.

1. **D-119. Legumbre de bote como guarnición** (pasos 3, 4, 5 y 9):
   - el sorteo en dos pasos, solo en la comida y solo en omnívoras;
   - que cuenta para D-024;
   - las reglas de la semana del paso 5: tope de 3, suelo de 2 desde el jueves, sin días seguidos, no repetir, guisantes y habitas como mucho 1;
   - el inventario y la lista por plato;
   - por qué el primer paso es un sorteo con la semilla y no una puntuación (constitución 1).
2. **D-119 o asiento propio: compuestos de legumbre como plato único solo sin otro candidato,** en omnívoras (la (b)), con su red de D-099.3 (paso 7).
3. **Asiento propio: no repetir el mismo hidrato en días seguidos.** Es una regla del menú general, como las de D-099.3, y en el prototipo se aplica a todas las dietas.
4. **D-120. Raciones de la guarnición** (paso 6): el rango y la salida de la legumbre, los topes de plato y su escalado, y el orden de crecimiento. Se relaciona con D-116.6 (`crecerSiFalta`) y con D-100.
5. **Modificaciones de asientos existentes:**
   - **D-024:** la guarnición cuenta como consumo de legumbre, y la semana tiene tope de 3 y suelo de 2 por guarnición.
   - **D-103:** habitas y sinónimos de los alimentos eliminados (paso 1).
   - **D-104:** las habitas en SIBO.
   - **D-100:** ingredientes nuevos, el renombre y las aproximaciones de BEDCA (alubias rojas y pintas con la 900, beluga y pardina como lentejas cocidas, habitas con la 2194).
   - **D-116 y D-117:** apagadas por interruptor (paso 8), con la fecha, y el código y los tests conservados.
   - **D-099.3:** la red nueva del paso 7, que sustituye a la de D-116.5 mientras D-116 esté apagada.
6. **Pendientes que no entran aquí:**
   - **D-118:** el perfil sin carne ni ave sigue pendiente de la pregunta del cuestionario. Con la guarnición queda en 3,44 comidas cortas por semana, frente a 4,21 en HEAD.
   - Los puntos abiertos de arriba.
