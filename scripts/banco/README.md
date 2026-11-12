# Banco I-0 — medición reproducible del motor de menús

Mide lo que el motor genera de verdad, con perfiles sintéticos y semillas fijas, para poder
comparar antes y después de cada cambio. Mide, no decide: nada de `src/` importa este directorio.

No usa red, Supabase, variables de entorno ni datos de producción. No escribe fuera de
`scripts/banco/linea-base/` (y solo con `--guardar`).

**No es una medición de `docs/spec/protocolo-evaluacion.md`.** Es un instrumento de desarrollo
para comparar el motor consigo mismo antes y después de un cambio. No compara motores, no entra
en ninguna evaluación comparativa y sus cifras no son «cifras citables» del protocolo (§2, §5.4).
Toma de §5 la forma, no el régimen: self-check de determinismo (§5.1), script y artefacto
versionados (§5.2), semillas contiguas con inicio declarado (§5.5), N declarado (§5.6) y nivel
de agregación declarado por métrica (§5.8). El commit de la medición consta al final de este
archivo, no dentro del artefacto (§5.3 no se cumple en su literalidad).

## Uso

```bash
node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs
```

Mide y compara con la línea base. Código de salida: `0` sin diferencias, `1` con diferencias
(las lista), `2` si una semilla no es reproducible.

| Opción | Efecto |
|---|---|
| `--guardar` | Congela la medición como línea base (solo con todos los perfiles y 8 semanas) |
| `--salida <archivo>` | Escribe la medición en otro archivo, para comparar dos ramas |
| `--perfil <id>` | Solo ese perfil (repetible) |
| `--semanas <n>` | Semanas por perfil; con un valor distinto de 8 no se compara |

`npm test` incluye `banco.test.js`: misma semilla, misma medición; y dos perfiles de la línea
base coinciden con lo que se mide hoy. Un cambio del motor que altere esos menús hace fallar ese
test hasta que se regenere la línea base **en el mismo commit que el cambio**, con el antes y el
después a la vista en el diff de `linea-base.json`.

## Entradas

- **Perfiles** (`perfiles.mjs`): 12 sintéticos con las calorías fijadas a mano. Cuatro sin
  restricciones (1434, 2174, 2600 con 3 comidas, 3714 kcal), celíaco, sin lactosa, sin pescado
  ni marisco, SIBO, vegetariana, vegana, uno con «cocinar en cantidad» y uno con un alimento
  eliminado.
- **Semillas**: la de la app, `userId:weekNumber`, con `userId = banco-<perfil>` y semanas 60 a
  67 seguidas; cada semana recibe los platos de la anterior (`platosRecientesPara`), como en
  producción. 96 semillas. No coinciden con las del visor (90001–90010) ni con las de Fase 7.
- **Punto de entrada**: `generarPlan` (`src/plan/generarPlan.js`), el mismo que usa la app.
  Sin `fuenteEditorial`, igual que la app hoy.

## Reproducibilidad

Cada semilla se genera dos veces y se compara el plan entero (también `decisionLog`). Única
exclusión: `day.id`, que el motor viejo forma con `Date.now()` y declara fuera de su
determinismo (`src/engine/buildPlan.js:44` y `:2267`). El banco informa de en cuántas semillas
es la única diferencia (hoy, en las 96). Cualquier otra diferencia detiene el banco.
Exclusión aceptada por Javi el 2026-11-12.

**¿Pertenece `day.id` al plan observable?** `docs/spec/plan-observable.md` no nombra `day.id`.
Lo que la norma exige de un día es que sea identificable **por su posición** en `days`
(§4.2.2, `plan-observable.md:50`), no por un identificador adjunto; y §4.0 (`:44`) no impone
metadatos cuya necesidad para la evaluación no esté establecida. `day.id` es, por tanto, un
campo que el objeto lleva pero sobre el que el contrato de §4 no pone ninguna obligación. La
norma tampoco lo excluye: no es un campo de depuración de §4.7. Antecedentes:

- La verificación de conformidad de legacy lo dejó como pregunta abierta para una revisión de
  la norma, no como no conformidad, y ancló su proyección reproducible «sin day.id»
  (`docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md:52-57` y `:161-168`).
- D-090 admitió como excepción las diferencias en `$.days[*].id` y dejó `day.id` «fuera de la
  vista común» (`DECISIONS.md:3722` y `:3730`).

El banco aplica la misma exclusión. Si §4.2 debe pronunciarse sobre identificadores sigue
abierto y no se decide aquí.

## Qué mide

Dos familias de medidas, que no se mezclan (`catalogo` y `menus` en el JSON).

**Catálogo (sin generar planes)**

- `filtradoPorPerfil`: platos disponibles por familia proteica y momento tras `filtrarCatalogo`.
- `idaYVuelta`: para cada plato e ingrediente ajustable, se decide cada cantidad de su rango, se
  escribe como lo hace la app (`recomponer` / `reescribirComida`) y se relee. Cuenta dónde lo
  releído no es lo decidido (más de 1 g) o no se puede leer.

**Menús generados (por perfil)**

- `composicion`: platos por familia (`proteinType` del resolvedor) y por especie, en comida y en
  cena; pescado y legumbre por semana (media y máximo); racha de días con pescado; pares de días
  seguidos con la misma familia o especie (con y sin el ancla); misma familia en comida y cena;
  redactados; sugerencia del sábado aparte; y las reglas de D-099.3 contadas (plato repetido en
  la semana o de la anterior, especie más de dos veces, legumbre en la cena).
- `cantidades`: gramos decididos por `racionesDia` frente a los que se releen de la compra, con
  tolerancia declarada (ver Definiciones); kcal declaradas frente a releídas; cantidad del texto frente a la de la compra; ingredientes en
  el techo de su rango; máximos de arroz, pasta, patata, legumbre y pan; pan y fruta añadidos;
  huevos por comida y por día.
- `restricciones`: comidas con algo vetado por el perfil (`intoleranciasDe`) o con un alimento
  eliminado.
- `nutricion`: desvío semanal de kcal, días fuera de ±10 %, comidas principales cortas de proteína.
- `planes`: por semana, huella del texto visible y lista de platos, para ver qué menú cambia.

## Definiciones

**Par de días seguidos con la misma familia** (`familiaDiasSeguidos`). Nivel de agregación: la
semana; se suma sobre las 8 semanas del perfil.

- *Qué compara:* los platos servidos de un día (su comida y su cena) con los del día siguiente,
  en cualquier combinación: comida–comida, comida–cena, cena–comida y cena–cena. Si alguna
  familia aparece en los dos días, ese par de días cuenta **una vez por familia compartida**
  (como mucho 2 por par de días), no una vez por combinación.
- *Qué no cuenta:* la sugerencia de la comida libre del sábado (no es un plato servido); los
  desayunos y tentempiés; la misma familia en la comida y la cena de un mismo día, que va aparte
  en `familiaMismoDia`.
- *No cruza semanas:* 6 pares por semana, de lunes–martes a sábado–domingo. El domingo de una
  semana no se compara con el lunes de la siguiente. Máximo teórico: 12 por semana.
- *Qué familias usa:* el `proteinType` del resolvedor de engine2, vocabulario cerrado de 8
  valores (`src/engine2/dishes/compositionResolver.js:65-67`): pescado, marisco, legumbre, ave,
  carne, huevo, cereal y vegetal. «Carne» agrupa ternera, cerdo y conejo; pescado y marisco son
  familias distintas.
- *En vegetariana y vegana:* las mismas 8, sin taxonomía propia. Tofu, tempeh, seitán y soja
  texturizada caen todos en «vegetal», y también los platos de queso (feta, mozzarella, requesón,
  queso de Burgos). Por eso casi todos sus pares son «vegetal» (36 de 36 en vegetariana, 48 de
  49 en vegana): la cifra dice que hay proteína vegetal casi a diario, **no** que se repita el
  mismo alimento. Para esos perfiles la medida informativa es `especieDiasSeguidos`. Con este
  vocabulario, una regla de «no repetir familia en días seguidos» no es aplicable a esos
  perfiles tal como está.
- `familiaDiasSeguidosSinAncla` descuenta los pares en que los dos platos son los del ancla
  (cocinar y aprovechar), que D-099.3.e permite expresamente.

**Decidido ≠ compra, con tolerancia declarada** (`TOLERANCIA_G = 5` en `metricas.mjs`). Nivel de
agregación: el ingrediente de una comida. Se comparan los gramos que decide `racionesDia` con
los que se releen de la línea de la compra ya escrita (`leerComida`), sumando por ingrediente.

| Resultado | Condición | Lectura |
|---|---|---|
| `decididoIgualQueCompra` | diferencia ≤ 0,05 g | Coinciden |
| `dentroDeTolerancia` | menos de 5 g | Redondeo de escritura (gramos ↔ ml, sobre todo aceite y leche). Se cuenta y se desglosa en `dentroPorClave`, pero no es un descuadre |
| `fueraDeTolerancia` | 5 g o más | Descuadre: lo que se muestra no es lo que se calculó. Desglose en `fueraPorClave`, con ejemplos |
| `calculadoAusenteEnCompra` | el ingrediente no se puede releer | La compra no lo lleva con una cantidad legible |

La ida y vuelta de catálogo usa los mismos umbrales (`dentroPorClaveYForma`,
`fueraPorClaveYForma`, `ilegiblesPorClaveYForma`). La tolerancia es en gramos absolutos, no en
porcentaje: 4 g de aceite son unas 36 kcal y cuentan como «dentro»; conviene mirar
`dentroPorClave` antes de darlos por despreciables.

## Límites del instrumento

- Los gramos decididos no se guardan en el plan: `racionesCalculadas` repite la entrada de
  `ajustarDia` y se valida contra `meal.nutricion.kcal` (`replicaDistinta` debe ser 0).
- «Texto frente a compra» es una heurística sobre el texto libre: «distinta» puede incluir
  frases que nombran dos ingredientes. `textoSinCantidad` son ingredientes cuyo texto no da cifra.
- La familia de un plato es la de su proteína principal: un plato de carne con huevo cuenta
  como carne.
- 8 semanas por perfil: sirve para comparar antes y después, no para estimar frecuencias raras.

## Línea base

`linea-base/linea-base.json` (versión 2 del banco: añade la tolerancia de 5 g). El motor medido
es el de `main` `19a300c`; ningún commit de esta rama anterior a I-4 lo modifica.
sha256 (con saltos LF) `00ec172d8e74ef4707bdd834f06d82aeaa8b8fb2a44fcdafed958f707691e1d1`.

Preexistente y ya registrado: `vegana-1400` queda fuera de ±5 % en 3 de 8 semanas (+3,4 a
+6,5 %; eran 2 de 8 antes de arreglar el lector, ver «Notas de medición»). Consta en `DECISIONS.md:4499` (tabla de D-110, fila «Vegana 1400 kcal», +1,4…+8,2 %),
`:4508` (pendientes de D-110: «la semana sale hasta un 8 % por encima») y `:4530` (D-111:
«salvo la vegana de 1400 kcal, que ya estaba en +8,2 %»).

## Notas de medición

- **El medidor relee texto.** `medirPlan` (`src/plan/medidor/medir.js`), que es con lo que se
  comprueba el ±5 % semanal, lee la lista de la compra ya escrita de cada comida con
  `leerComida`; no parte de los gramos que decidieron las raciones. Mide lo que el usuario ve,
  y por eso cualquier fallo de lectura o de escritura cambia la cifra. El medidor no se ejecuta
  en la app: solo lo importan tests y scripts. En la app, `leerComida` lo usan `ajustarDia`
  (lee la ficha de partida), `gramosDeBase` (cantidades del ancla) y `desayunosApp.js`.
- **Las cifras históricas con medias piezas estaban infravaloradas.** Hasta el commit `666d4c1`
  el lector leía «1½» como 1 y no leía «½» sin palabra detrás. Toda medición anterior (D-100,
  D-110, D-111, los informes de auditoría y la primera línea base de este banco) contaba de
  menos esas comidas: «Aguacate (1½)» como 140 g en vez de 210 y «Aguacate (½)» o «Patata (½)»
  como 0 g. El menú no cambió; cambió lo que se medía. Efecto en este banco: `vegana-1400` pasa
  de 2 a 3 semanas de 8 fuera de ±5 % (la semana 61, de +3,9 % a +5,1 %), y el desvío mínimo
  de `omni-2600-3comidas` de −4,9 % a −4,6 % y el de `vegetariana-2000` de −3,2 % a −2,4 %.
  Barrido de comprobación: 13 879 fichas (catálogo, platos de dieta y desayunos, a cuatro
  objetivos de kcal y seis perfiles, con y sin adaptar) se leen igual con el lector anterior y
  con el actual; la entrada de `ajustarDia` no cambia.
- **Fallo intermitente de `scripts/fase7/entrega.test.js`.** En la suite completa fallan a veces
  uno o dos tests del bloque «CLI: rechazos por sha256» («aborta sin escribir si el sha256 de la
  vista no coincide», `:625`; «no admite la clave como argumento ni la ejecución sin
  confirmación», `:639`), con este mensaje: `Error: Test timed out in 5000ms.` Son tests que
  lanzan un proceso de Node y tienen el tiempo límite por defecto. Aislado, el archivo pasa (36
  de 36, tres veces seguidas). No importa nada de `src/plan`.
  **El banco no es la causa** (comprobado el 2026-11-12, en `aeb1639`, alternando ejecuciones
  completas): con `banco.test.js`, fallos en 3 de 5; sin él (`--exclude
  scripts/banco/banco.test.js`), en 5 de 5 (una de las cinco se repitió porque coincidió con
  una edición del árbol de trabajo). En todas las tandas el mensaje es el mismo
  (`Test timed out in 5000ms`, 13 veces), en los tests de `:625`, `:639` y el de «aborta sin
  escribir si el sha256 del manifiesto no es MANIFIESTO_SHA256», y dos veces también en
  `scripts/fase7/escanearSemillas.test.js` («es determinista salvo la fecha»). Las ejecuciones
  con fallos son las más lentas (49 a 58 s frente a 40 s): apunta a carga de la máquina y al
  límite de 5 s de esos tests, que lanzan procesos. Por eso el banco sigue en la suite por
  defecto. `scripts/fase7` no se ha tocado.

## Mediciones versionadas (`medicion/`)

Scripts de diagnóstico que respaldan las cifras de este README y del borrador D-112. Igual que
el banco: sin red, sin Supabase, sin variables de entorno, sin datos reales; solo escriben el
archivo de salida que se les pasa. No forman parte de `npm test`. Las variantes **no modifican
`src/`**: `variantesMinimos.mjs` transforma `raciones.js` en memoria al cargarlo.

| Script | Mide |
|---|---|
| `fichasBajoMinimo.mjs` | Ingredientes que alguna ficha pide por debajo del mínimo de su rango |
| `volcarItems.mjs <salida.json>` | Cada comida del banco con sus gramos releídos por ingrediente |
| `compararItems.mjs <base.json> <otro.json>` | Comidas que cambian, adónde va la energía, ±5 % y proteína por perfil |
| `ladoAlto.mjs` | Máximo a 3714 kcal de cada ingrediente bajo el mínimo |
| `proporcionMasas.mjs` | Proporción de los ingredientes de masa (crepes, batido, hamburguesa de tofu, pizza) |
| `diagSibo.mjs [perfil]` | Comidas con kcal declaradas ≠ releídas y líneas de aceite aromatizado |
| `variantesMinimos.mjs` | Hook: `--variante=B` (por defecto), `A`, `B-escala`, `B-fija` |

Reproducir la cifra de la variante B (142 de 2688 comidas):

```bash
node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/volcarItems.mjs base.json
node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/variantesMinimos.mjs scripts/banco/medicion/volcarItems.mjs b.json --variante=B
node scripts/banco/medicion/compararItems.mjs base.json b.json
```

## Pendientes anotados (sin tocar)

Hallados al medir; ninguno se ha corregido ni decidido aquí.

- **Aceite (fuera de I-4, decisión de Javi del 2026-11-12).** Se decide en gramos (pasos de 5 g)
  y se escribe en ml redondeados a 5: 20 g → «20 ml» = 18,4 g. Queda documentado como redondeo
  **dentro de tolerancia** (hasta 1,6 g por comida); es casi todo lo que cuenta
  `dentroDeTolerancia`, junto con la leche y las bebidas vegetales.
- **Raciones (apartado D): cantidades en pasos de 10 g poco naturales.** La patata, el pan, la
  fruta, el queso y los lácteos se deciden en pasos de 10 g (`RANGO` en
  `src/engine2/nutrientes/raciones.js`), y de ahí salen cifras como «Patata (260 g)». I-4 solo
  hace que se muestre lo decidido; no cambia qué se decide.
- **Referencia en piezas de la patata: pendiente del rediseño del escalado del plan
  compartido.** Los cuatro platos que la ficha escribe por piezas (cocido madrileño express y
  los tres caldos gallegos) se muestran solo en gramos, «Patata (350 g)», sin piezas ni
  «aprox.» (decisión de Javi del 2026-11-12). Motivo: `cloneAndScalePlan`
  (`src/ui/views/OriginalPlanApp.jsx`) escala los gramos del texto y no las piezas, y una
  orientación «aprox. 2 grandes» quedaba desfasada en los planes clonados (231 g «aprox. 2
  grandes»). Recuperar la referencia en piezas exige antes rediseñar ese escalado.
- **Queso en lonchas (hamburguesa de ternera): sin corregir.** Se deciden 30 g y la compra dice
  «2 loncha» (40 g). El cambio de escritura se descartó (decisión de Javi del 2026-11-12): son
  las 10 pruebas que quedan fuera de tolerancia en la ida y vuelta de catálogo. Depende del
  punto siguiente.
- **Raciones (D): mínimos por encima de la ficha. Propuesta medida, sin implementar.** El mínimo
  del rango (`RANGO`, `RANGO_UD`, `RANGO_GRUPO` en `raciones.js`) se aplica aunque la ficha pida
  menos: `ajustarComida` fija en el mínimo todo lo que queda por debajo y el redondeo final
  vuelve a recortar a `[mín, máx]`. 12 ingredientes, más los dos aceites, piden menos que su
  mínimo en 21 fichas (sin contar las que solo lo hacen con el aceite, cuyo «por debajo» es la
  conversión de 5 ml a 4,6 g; `medicion/fichasBajoMinimo.mjs`). Corrige la cifra anterior de
  este README, «14 ingredientes de 31 platos», que contaba los aceites como si no lo fueran.
  Los más visibles: yogur como salsa de las hamburguesas (20–40 g → 125 g), yogur
  griego (60–80 g → 125 g), leche de las crepes (100 → 145 ml), aguacate (¼ o ⅓ → ½), clara
  (1 → 2), queso en lonchas (20 → 30 g), garbanzos cocidos del buddha bowl (60 → 120 g).
  Variantes medidas (`medicion/variantesMinimos.mjs`, sin tocar el aceite):
  - **A** «el mínimo pasa a ser lo que pide la ficha»: cambian 128 de 2688 comidas, pero a
    3714 kcal el yogur de salsa llega a 420 g (`medicion/ladoAlto.mjs`). Descartada.
  - **B** «lo que la ficha pide por debajo del mínimo queda fijo en la ficha» (elegida por Javi
    el 2026-11-12, pendiente de la comprobación de masas): cambian 142 de 2688; ningún perfil
    sale de ±5 % que no lo estuviera (vegana-1400 baja de 3 a 2 semanas fuera); la proteína
    media del día cambia como mucho 0,6 g; principales cortas de proteína, sin cambios.
  Pendiente de decisión (borrador D-112, sin escribir en `DECISIONS.md`).
- **Pasta sin gluten con SIBO: corregido en `9ae4a5e`.** Test en `src/plan/tests/siboPasta.test.js`.
- **SIBO: kcal declaradas distintas de las releídas (23 comidas en 8 semanas), sin investigar.**
  Tras la corrección de la pasta queda ese recuento en `sibo-2000` (en los demás perfiles, 0 a
  3). Puede ser otra adaptación que cambia el texto después de calcular; no comprobado.
- **Mejillones por unidades** (fideuá de marisco): se escriben medias unidades («15½ unidades»).
  Dentro de tolerancia (1,5 g como mucho).
