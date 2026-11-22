# Rama sin comida doble (2026-11-22)

Solo medición: no cambia ninguna regla ni toca `src/`. 200 semanas por perfil desde la 60, por la entrada de la app (`generarPlan`), con `cortasProteina.mjs`.

- `main` es `19a300c` (exportado con `git archive`).
- HEAD es `62dae22`.
- **«Sin comida doble»** es HEAD con la regla de D-116 y D-117 apagada siempre (`variantesSinComidaDoble.mjs`, en memoria). El walk arranca por el mismo camino que la repetición de la red de D-116.5: `walkConRedDeFamilia(input, { sinRegla: true })`, sin sorteo, sin segundos y con el paso 4 de D-024 como antes. Todo lo demás de la rama sigue activo: tope de pescado de 3, D-115 con su red, raciones, SIBO y textos.

**Columnas:**
- Cortas: comidas y cenas servidas por debajo del 95 % de su objetivo de proteína.
- Legumbre: platos de familia legumbre en comidas y cenas.
- Pescado, carne roja (ternera), cerdo (cerdo, jamón, lacón, guanciale), ave (pollo, pavo) y huevo: platos servidos por especie de su proteína principal, segundos incluidos, por semana.
- Fuera de ±5 %: comidas y cenas cuyas kcal se apartan más de un 5 % de su objetivo.
- Aceite: AOVE y aceite de semillas de la compra, media por día (sin el día de la comida libre) y máximo.
- D-099.3: infracciones sobre lo servido (`composicionSemana` del banco).

## omni-1434

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 3,31 | 98,4 % | 1,04 | 4,87 | 0,85 | 1,36 | 2,76 | 1,52 | 591 de 2600 (22,7 %) | 25,2 (45) | 0 |
| HEAD | 2,62 | 100,1 % | 3,06 | 3,00 | 1,39 | 2,15 | 3,62 | 1,84 | 495 de 2600 (19,0 %) | 27,1 (45) | 0 |
| sin comida doble | 4,13 | 97,0 % | 1,48 | 3,00 | 1,05 | 1,61 | 3,04 | 1,84 | 459 de 2600 (17,7 %) | 25,6 (45) | 0 |

## omni-2174

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,64 | 100,5 % | 1,06 | 4,81 | 0,86 | 1,41 | 2,73 | 1,50 | 167 de 2600 (6,4 %) | 37,4 (60) | 0 |
| HEAD | 1,85 | 106,7 % | 3,06 | 3,00 | 1,36 | 2,21 | 3,62 | 1,85 | 118 de 2600 (4,5 %) | 37,7 (60) | 0 |
| sin comida doble | 3,27 | 99,2 % | 1,43 | 3,00 | 0,96 | 1,74 | 3,12 | 1,80 | 123 de 2600 (4,7 %) | 37,6 (60) | 0 |

## omni-2600-3comidas

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,00 | 106,2 % | 1,01 | 4,73 | 0,79 | 1,48 | 2,87 | 1,52 | 502 de 2600 (19,3 %) | 42,7 (60) | 0 |
| HEAD | 1,42 | 116,1 % | 3,04 | 3,00 | 1,35 | 2,19 | 3,61 | 1,83 | 424 de 2600 (16,3 %) | 42,8 (60) | 0 |
| sin comida doble | 2,51 | 105,3 % | 1,32 | 3,00 | 1,09 | 1,64 | 3,25 | 1,81 | 471 de 2600 (18,1 %) | 42,8 (60) | 0 |

## omni-3714

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 4,37 | 100,1 % | 1,05 | 4,83 | 0,68 | 1,50 | 2,79 | 1,53 | 709 de 2600 (27,3 %) | 43,5 (60) | 0 |
| HEAD | 3,02 | 107,8 % | 3,04 | 3,00 | 1,36 | 2,27 | 3,63 | 1,80 | 577 de 2600 (22,2 %) | 42,8 (60) | 0 |
| sin comida doble | 4,47 | 99,5 % | 1,45 | 3,00 | 1,04 | 1,62 | 3,17 | 1,77 | 794 de 2600 (30,5 %) | 43,0 (60) | 0 |

## celiaco-2400

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,23 | 99,0 % | 1,15 | 5,05 | 0,82 | 1,07 | 3,00 | 1,36 | 222 de 2600 (8,5 %) | 40,9 (60) | 0 |
| HEAD | 1,64 | 110,8 % | 3,04 | 3,10 | 1,57 | 1,66 | 3,73 | 1,92 | 168 de 2600 (6,5 %) | 41,5 (60) | 0 |
| sin comida doble | 3,13 | 97,3 % | 1,50 | 3,01 | 1,29 | 1,32 | 3,20 | 1,91 | 205 de 2600 (7,9 %) | 41,3 (60) | 0 |

## sin-lactosa-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,19 | 102,9 % | 1,04 | 5,01 | 0,58 | 1,38 | 2,73 | 1,56 | 64 de 2600 (2,5 %) | 36,7 (60) | 0 |
| HEAD | 1,58 | 108,7 % | 3,04 | 3,00 | 1,29 | 2,19 | 3,63 | 1,82 | 25 de 2600 (1,0 %) | 37,0 (60) | 0 |
| sin comida doble | 2,83 | 102,0 % | 1,48 | 3,00 | 0,94 | 1,60 | 3,17 | 1,82 | 47 de 2600 (1,8 %) | 35,9 (60) | 0 |

## sin-pescado-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 3,81 | 101,0 % | 1,66 | 0,00 | 1,67 | 2,83 | 3,73 | 1,96 | 44 de 2600 (1,7 %) | 36,3 (60) | 6 |
| HEAD | 3,17 | 104,7 % | 2,77 | 0,00 | 1,81 | 3,22 | 3,96 | 1,97 | 34 de 2600 (1,3 %) | 36,9 (60) | 2 |
| sin comida doble | 4,29 | 99,6 % | 2,16 | 0,00 | 1,53 | 2,61 | 3,82 | 1,98 | 47 de 2600 (1,8 %) | 36,1 (60) | 0 |

## omni-2174-ancla

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,65 | 100,4 % | 1,38 | 4,54 | 0,86 | 1,35 | 2,90 | 1,44 | 132 de 2600 (5,1 %) | 36,3 (60) | 0 |
| HEAD | 1,98 | 105,8 % | 3,00 | 3,00 | 1,33 | 2,21 | 3,60 | 1,78 | 106 de 2600 (4,1 %) | 37,0 (60) | 0 |
| sin comida doble | 3,38 | 99,0 % | 1,61 | 3,00 | 0,99 | 1,72 | 3,08 | 1,78 | 115 de 2600 (4,4 %) | 36,3 (60) | 0 |

## omni-2000-sin-atun

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,62 | 102,8 % | 1,01 | 4,64 | 0,88 | 1,53 | 2,83 | 1,50 | 64 de 2600 (2,5 %) | 36,3 (60) | 0 |
| HEAD | 2,10 | 108,0 % | 3,06 | 3,00 | 1,41 | 2,23 | 3,70 | 1,80 | 41 de 2600 (1,6 %) | 37,1 (60) | 0 |
| sin comida doble | 3,21 | 101,6 % | 1,37 | 3,00 | 1,14 | 1,65 | 3,13 | 1,83 | 45 de 2600 (1,7 %) | 36,1 (60) | 0 |

## solo-pollo-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,50 | 102,6 % | 1,43 | 7,29 | 0,00 | 0,00 | 1,95 | 1,95 | 109 de 2600 (4,2 %) | 36,6 (60) | 0 |
| HEAD | 3,46 | 102,2 % | 3,25 | 6,22 | 0,00 | 0,00 | 2,00 | 2,00 | 78 de 2600 (3,0 %) | 37,2 (60) | 0 |
| sin comida doble | 3,59 | 100,3 % | 2,65 | 5,81 | 0,00 | 0,00 | 2,00 | 2,00 | 101 de 2600 (3,9 %) | 36,2 (60) | 0 |

## sibo-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,15 | 98,4 % | 0,00 | 5,66 | 0,91 | 1,25 | 2,96 | 1,76 | 390 de 2600 (15,0 %) | 50,4 (90) | 0 |
| HEAD | 2,29 | 98,1 % | 0,00 | 3,05 | 1,42 | 1,99 | 3,62 | 1,89 | 156 de 2600 (6,0 %) | 36,5 (60) | 0 |
| sin comida doble | 2,29 | 98,1 % | 0,00 | 3,05 | 1,42 | 1,99 | 3,62 | 1,89 | 156 de 2600 (6,0 %) | 36,5 (60) | 0 |

## vegetariana-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 4,33 | 98,4 % | 2,22 | 0,00 | 0,00 | 0,00 | 0,00 | 1,99 | 206 de 2600 (7,9 %) | 28,0 (60) | 0 |
| HEAD | 4,50 | 98,4 % | 2,42 | 0,00 | 0,00 | 0,00 | 0,00 | 2,00 | 214 de 2600 (8,2 %) | 28,5 (60) | 0 |
| sin comida doble | 4,50 | 98,4 % | 2,42 | 0,00 | 0,00 | 0,00 | 0,00 | 2,00 | 214 de 2600 (8,2 %) | 28,5 (60) | 0 |

## vegana-1400

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 4,87 | 90,5 % | 3,01 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1301 de 2600 (50,0 %) | 18,9 (35) | 420 |
| HEAD | 4,79 | 90,9 % | 3,04 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1324 de 2600 (50,9 %) | 19,3 (35) | 397 |
| sin comida doble | 4,79 | 90,9 % | 3,04 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 1324 de 2600 (50,9 %) | 19,3 (35) | 397 |

## sin-carne-ave-2000

| Medición | Cortas/sem | Proteína del día | Legumbre/sem | Pescado/sem | Carne roja/sem | Cerdo/sem | Ave/sem | Huevo/sem | Comidas y cenas fuera de ±5 % kcal | Aceite por día, ml (máx.) | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| main | 2,94 | 101,1 % | 1,78 | 8,77 | 0,00 | 0,00 | 0,00 | 1,99 | 106 de 2600 (4,1 %) | 36,6 (60) | 0 |
| HEAD | 4,21 | 98,2 % | 3,35 | 6,74 | 0,00 | 0,00 | 0,00 | 2,00 | 61 de 2600 (2,3 %) | 35,1 (60) | 0 |
| sin comida doble | 4,21 | 98,2 % | 3,35 | 6,74 | 0,00 | 0,00 | 0,00 | 2,00 | 61 de 2600 (2,3 %) | 35,1 (60) | 0 |

## Lectura

- **Sin comida doble, la rama queda peor que `main`** en comidas cortas en los 9 perfiles omnívoros con pescado o sin él:
  - omni-2174: 2,64 en `main`, 1,85 en HEAD y 3,27 sin comida doble; proteína del día 100,5 %, 106,7 % y 99,2 %.
  - En los 9 perfiles, sin comida doble queda entre +0,10 (omni-3714) y +0,90 (celiaco-2400) cortas por semana por encima de `main`.
  - Frente a HEAD, entre +1,09 y +1,51.
  - La causa es la de los perfiles con un solo segundo: el tope de pescado y D-115 quitan pescado (4,5 a 5,1 por semana en `main` en los 8 omnívoros, 3,0 aquí). Lo sustituyen cerdo, ave, carne roja, huevo y legumbre como plato único (1,3 a 1,6 por semana, frente a 1,0 a 1,4 en `main`), que es la comida que más se queda corta.
- **La comida doble es lo que compensa** al resto de la rama en esos perfiles: HEAD queda por debajo de `main` en todos ellos.
- **sibo-2000, vegetariana-2000, vegana-1400 y sin-carne-ave-2000** dan lo mismo con la regla apagada que en HEAD: a ninguno se le aplica (SIBO no tiene compuestos de legumbre; vegetariana y vegana, D-116.9; sin carne ni ave, D-117.7).
- **solo-pollo-2000:** 2,50 en `main`, 3,46 en HEAD y 3,59 sin comida doble.
- **Comidas fuera de ±5 % de kcal:** sin comida doble, entre HEAD y `main` en 6 de esos 9 perfiles. omni-1434 queda por debajo de los dos (17,7 %, frente a 19,0 % y 22,7 %); sin-pescado-2000, algo por encima de `main` (1,8 % frente a 1,7 %); omni-3714, por encima de los dos (30,5 %, frente a 22,2 % en HEAD y 27,3 % en `main`).
- **Aceite por día:** sin comida doble, la media baja como mucho 1,5 ml frente a HEAD (omni-1434, 27,1 → 25,6 ml). Los máximos son los de HEAD.
- **Infracciones de D-099.3:** 0 sin comida doble en todos los perfiles, salvo vegana-1400 (397, como en HEAD; 420 en `main`). sin-pescado-2000: 6 en `main`, 2 en HEAD y 0 sin comida doble.

## Interruptor de la regla, sin borrar código

Hoy la regla se enciende en un único sitio, `reglaLegumbreActiva(profile)` (`src/engine2/walk/legumbre.js:20`, «solo dietas omnívoras»). Lo usan dos sitios:
- el walk (`runWalk.js:367`: sin ella, no hay sorteo, ni segundos, ni red, y D-024 sigue como antes, exactamente el camino medido aquí);
- las alternativas de la app (`engine2App.js:465`: el veto a un compuesto de legumbre como plato único en perfiles con sorteo).

**Qué haría falta:**
1. Un interruptor que `reglaLegumbreActiva` lea antes de mirar la dieta. Dos formas:
   - **Constante** (`REGLA_LEGUMBRE = false` en `legumbre.js` o en `contracts/`). Es lo más simple, pero los tests de la regla no podrían encenderla.
   - **Parámetro con valor por defecto** (`input.reglaLegumbre` en `runWalk`/`materializePlan` y `opts.reglaLegumbre` en `generarPlan`/`regenerarComida`, por defecto apagado). Los tests de D-116 y D-117 la encienden de forma explícita y siguen probando el código. Es lo que recomiendo.
2. Causa en el log al empezar el walk, por la constitución (regla 3): por ejemplo `regla_legumbre_desactivada`, con de dónde sale el valor.
3. Que las alternativas lean el mismo interruptor. Con la regla apagada no hay comidas dobles nuevas, pero el veto de `engine2App.js:465` seguiría prohibiendo la legumbre como plato único si no lo mira.
4. Los planes guardados con comidas dobles siguen leyéndose y racionándose: `racionesApp.js`, `comidaDoble.js` y el lector no dependen del interruptor. Sus alternativas siguen saliendo como plato único.
5. Subir `VERSION_MOTOR` (cambia lo que lleva el plan) y regenerar la línea base del banco: con la regla apagada, `banco.test.js` da 233 diferencias.
6. Si se quiere un solo valor para todo el motor, documentarlo como decisión (D-116 y D-117 quedan «implementados, desactivados»).

**Qué tests quedarían sin sentido.** Lo he comprobado pasando la batería de `src/engine2`, `src/plan` y `scripts/banco` en una copia de HEAD con `reglaLegumbreActiva` devolviendo `false` (fuera del repo, sin tocar `src/`): fallan 57 tests en 19 archivos.

- **Tests del walk y de la app que generan semanas y esperan sorteo o segundos** (54 tests en 16 archivos):

  | Archivo | Tests que fallan |
  |---|---|
  | `runWalk.segundo.test.js` | 8 |
  | `runWalk.nivelLegumbre.test.js` | 8 |
  | `racionesDoble.test.js` | 7 |
  | `runWalk.redSegundos.test.js` | 7 |
  | `engine2AppDoble.test.js` | 5 |
  | `runWalk.diasLegumbre.test.js` | 5 |
  | `regenerarComidaDoble.test.js` | 4 |
  | `regenerarComidaDobleSinAlternativa.test.js` | 2 |
  | `runWalk.primeros.test.js` | 2 |
  | `alternativaSinLegumbreSola.test.js`, `auditoriaComidaDoble.test.js`, `comidaDobleIncompleta.test.js`, `legumbre.momentos.test.js`, `platosSemanaSegundo.test.js`, `regenerarComidaDobleIncompleta.test.js`, `runWalk.redPoolSinSegundos.test.js`, `sinSegundoPosible.test.js` | 1 cada uno |

  Con un parámetro, seguirían teniendo sentido si encienden la regla. Con una constante apagada, quedarían sin sentido: habría que saltarlos o borrarlos.
- **`banco.test.js`:** cae porque la línea base cambia. Se regenera; no pierde sentido.
- **`s2-fuenteEditorial-callsites.test.js`** (3): cae solo en la copia, porque no es un repositorio git (`git ls-files`); no tiene que ver con la regla.
- **Tests de funciones puras de la comida doble que no generan semanas** (siguen pasando, pero prueban código que en producción no correría): `comidaDoble.test.js`, `leerComidaDoble.test.js`, `racionesCrecer.test.js`, `legumbre.sorteoParcial.test.js` y `lentejasConArroz.test.js`.
- **Tests que comprueban que la regla no se aplica** (vegetariana, vegana, SIBO, sin segundo posible): siguen pasando, pero dejarían de distinguir nada.
