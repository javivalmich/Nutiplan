# Crema repetida en la semana y su ventana de conservación (2026-11-25)

Medición y propuesta: no cambia `src/`. Pregunta de Javi: en un plan del Preview, la crema de calabacín sale el lunes y el sábado; repetir está bien, pero no respeta la ventana de conservación.

## Por qué se repite

- **No es un ancla ni un plato batchable con ventana.** Son dos platos distintos del catálogo que llevan la misma crema, y coinciden por azar. Por ejemplo:
  - «Crema de calabacín con gambas encima» (`["sopa_crema","gambas",null,"calabacin",…]`);
  - «Crema de calabacín con huevos encima» (`["sopa_crema","huevo",null,"calabacin","zanahoria",…]`);
  - «Crema de calabacín con queso fresco y huevo» (`crema_calabacin_queso_huevo`), una ficha libre.
- **D-099.3.d no lo ve.** Compara por el nombre que ve el usuario («ningún plato sale dos veces en la misma semana»), y son nombres distintos. Ninguna regla mira qué crema lleva cada plato.

## Dónde está la regla de la ventana y por qué no actúa

- **Dónde:** la única ventana de conservación del motor es la de las sobras del ancla.
  - `computeLeftoverDays`, en `src/engine2/skeleton/buildWeekArc.js:250`: días 1 a `shelfLifeDays − 1` después del día de cocinar, con como mucho `maxServicios` platos.
  - Con `shelfLifeDays: 3` y `maxServicios: 2`, fijados en `src/engine2/dishes/bases.js:31`.
- **Asientos:**
  - D-099.3.b y c: el ancla es un ingrediente que se cocina un día y se aprovecha otro, y la elige el usuario con «cocinar en cantidad».
  - D-018 (P1 del walk): las sobras del ancla.
  - D-044, punto 9: la repetición que producen las anclas (`shelfLifeDays`, CP2b) es aprovechamiento de sobras, no un defecto.
- **Por qué no se aplicó:** las bases de ancla son garbanzos, alubias, pollo, pavo, ternera, cerdo, arroz y quinoa. Ninguna verdura ni crema es base, y la ventana solo existe si el usuario cocina en cantidad esa semana. Las dos cremas las eligió por separado la ruta rotativa del walk, que no conoce ninguna ventana.

## Medición: 200 semanas de los 9 omnívoros del banco

`scripts/banco/medicion/resumenCremaRepetida.mjs`, sobre volcados de `controlGuarnicion.mjs` (semanas 60 a 259).
- Crema: un plato cuyo nombre empieza por «Crema de» o «Crema fría de».
- «La misma crema»: las dos llevan el mismo vegetal, el primero del nombre.

| Medición | Cremas/sem | Semanas con la crema del mismo vegetal dos veces | Distancia en días (0 / 1 / 2 / 3 / 4 / 5 / 6) | De ellas, con una ficha libre | Cortas/sem | Legumbres/sem | Pescado/sem | D-099.3 |
|---|---|---|---|---|---|---|---|---|
| `main` (`9522e92`) | 0,95 | 21 de 1800 | 2 / 4 / 2 / 8 / 1 / 3 / 1 | 14 | 2,87 | 1,16 | 4,28 | 6 |
| HEAD (`8aa4843`) | 1,17 | 17 de 1800 | 1 / 2 / 6 / 5 / 2 / 1 / 0 | 13 | 2,40 | 2,02 | 2,67 | 0 |
| Propuesta: ventana | 1,16 | 17 de 1800 | 0 / 0 / 11 / 6 / 0 / 0 / 0 | 12 | 2,40 | 2,03 | 2,67 | 0 |
| Propuesta: ventana, solo plantillas | 1,15 | 3 de 1800 | 0 / 0 / 0 / 3 / 0 / 0 / 0 | 0 | 2,39 | 2,01 | 2,67 | 0 |

- **Es poco frecuente:** alrededor del 1 % de las semanas, casi siempre calabacín (14 de 17 en HEAD).
  - En HEAD, 10 de las 17 repeticiones caen fuera de 2 o 3 días; una, el mismo día (comida y cena).
  - En `main` pasaba lo mismo (21 semanas).
  - HEAD tiene más cremas por semana (1,17 frente a 0,95), porque la (b) saca los compuestos de legumbre y entran otros platos.
- **«Ventana»**, en el hook `scripts/banco/medicion/variantesCremaRepetida.mjs`: una crema cuyo vegetal ya está en la semana solo entra en el pool 2 o 3 días después de la primera, y una sola vez. Es un filtro con vuelta atrás; si dejaría el hueco sin candidatos, no se aplica.
  - Todas las repeticiones quedan dentro de la ventana.
  - Comidas cortas, legumbres, pescado y D-099.3 no cambian.
  - El menú cambia en 767 de 1800 semanas. El filtro saca del pool, también, cremas que el azar no habría elegido; con un pool distinto, el desempate cae en otro plato. Las cifras de la semana se quedan igual.
- **«Solo plantillas»** (`--soloPlantilla`): además, no se repite si una de las dos es la ficha libre, cuyo texto está cerrado. Quedan 3 repeticiones en 1800 semanas, todas a 3 días, y el menú cambia en 854.

## Propuesta de arreglo

1. **Regla del menú, en el walk:** el filtro del hook. Recomiendo la variante «solo plantillas», por el texto del punto 3.
   - Causas en el log: `crema_repetida_fuera_de_ventana` y `crema_repetida_sin_aplicar`.
   - Como mucho una repetición por vegetal, y siempre 2 o 3 días después: la crema aguanta 3 días en la nevera, como las bases del ancla.
2. **Texto, en `escribirCompuesto` (plantilla `sopa_crema`):** el walk anota las dos comidas («crema de calabacín: cocinar» y «aprovechar»), como `anclaDelHueco` con el ancla.
   - **El primer día**, la compra lleva el doble de verdura, cebolla y caldo. La receta lleva el paso: «Haz el doble de crema (X g de calabacín) y guarda la mitad en un táper en la nevera para el jueves (aguanta 3 días)».
   - **El segundo**, la compra no lleva la verdura ni el caldo de la crema. Los pasos de pochar, cocer y triturar se cambian por «Calienta la crema de calabacín que hiciste el lunes 3-4 min en un cazo (o 2 min en el microondas)». La proteína de encima se cocina como siempre.
   - Los gramos de la crema los fija `gramosVerdura` según las kcal del perfil y su papel («crema»), igual los dos días. Por eso «el doble» es exacto, y las raciones no tocan la verdura (está fija).
3. **Ficha libre (`crema_calabacin_queso_huevo`):** su compra y su receta están cerradas, sin la crema separada. Hay dos opciones:
   - (a) no repetirla, que es la variante «solo plantillas» y la que recomiendo;
   - (b) partir la ficha en «crema» y «encima», con el mismo texto de cocinar y aprovechar.
4. **Asiento:** propio, por ejemplo D-122, o una ampliación de D-099.3 junto a la regla d.

Decide Javi. No está implementado.
