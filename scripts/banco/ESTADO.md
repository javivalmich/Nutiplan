# Estado de la rama `motor/i0-banco-cantidades` (traspaso, 2026-11-17, tarde)

Worktree `C:\Users\javiv\app-comida-motor`, rama `motor/i0-banco-cantidades`, creada desde `main`
`19a300c`. Sin merge a `main`. La sesión de auditoría de seguridad trabaja aparte, en
`C:\Users\javiv\app-comida` (rama `fix/autorizacion-rpc`): no se toca.

## Commits (de más antiguo a más nuevo)

| Commit | Qué hace |
|---|---|
| `c2622e1`, `f6806da` | I-0: banco reproducible (`scripts/banco/`), línea base congelada y tolerancia de 5 g declarada |
| `666d4c1` | El lector entiende «½» y «N½» en cantidades por piezas |
| `1130e4d`, `aeb1639` | La patata por piezas se escribe solo en gramos («Patata (350 g)») |
| `eb3f91b` | El pan del gazpacho suma lo decidido entre sus dos partes |
| `42f6851`, `9ae4a5e` | SIBO: test y corrección de la pasta sin gluten (se escribe con los gramos decididos) |
| `cafc506`, `3238e0c`, `3948650`, `8e9f293` | README del banco: pendientes, notas de medición, test intermitente y deuda del lector compartido |
| `08c05f3` | Scripts de medición versionados en `medicion/` (variantes de mínimos, diagnóstico SIBO) |
| `33abeae`, `1ca217c`, `5c2e1a9` | SIBO: el aceite aromatizado con ajo sustituye al aceite de cocinar; el texto nombra el mismo aceite; pad thai |
| `4a0f8db` | Variante B: lo que la ficha pide por debajo del mínimo queda fijo en la ficha, salvo las masas |
| `dd0c6d4` | Auditoría B: scripts de medición del pescado (sin cambiar reglas) |
| `2bc9c61` | `DECISIONS.md`: D-112 (mínimos de la ficha) y D-113 (SIBO, aceite aromatizado) |
| `8af6b7d` | `ESTADO.md` al día y scripts del diseño medido de pescado y legumbres |
| `47705c1` | S: la sugerencia de la comida libre no es consumo (`runWalk.js`, test `runWalk.sugerencia.test.js`, línea base regenerada) |
| `fe1367e` | Ñoquis con espinacas y requesón: el texto nombra cada ingrediente con su cantidad (test `noquisTexto.test.js`) |
| `2b40664` | `DECISIONS.md`: D-114 (la sugerencia de la comida libre no es consumo) |
| `e2eaf89` | Bm: no repetir familia proteica en días seguidos (`runWalk.js`, `bases.js`, test `runWalk.familia.test.js`, línea base regenerada) |
| `c22367a` | Bm, red de seguridad: el walk se repite sin el filtro de familia antes de fallar |
| `12c3aff` | Bm en las alternativas (`alternativa.js`) |
| el siguiente a `12c3aff` | `DECISIONS.md`: D-115; barrido de fichas con una cifra para dos ingredientes |
| `db9a2fd`, `ed19d4f` | Medición de la comida con primero y segundo: datos, scripts e informe (`medicion/estructura-comida.md`), sin cambiar reglas |
| `b5a5723` | La preferencia B no mira la sugerencia de la comida libre (test `runWalk.preferenciaB.test.js`, línea base regenerada) |
| el siguiente a `b5a5723` | `DECISIONS.md`: ampliación de D-114; `medicion/compararPreferenciaB.mjs` |
| `873f227` | Medición: opciones (a), (b) y (c) del hook de primero y segundo |
| el siguiente a `873f227` | Medición con la red de seguridad; `DECISIONS.md`: D-116 y D-117 (sin implementar) |
| `4378c3a` | Etapa 1 de D-117: sorteo de los 3 días de legumbre con la semilla (`walk/legumbre.js`); SIBO no sortea (`dias_legumbre_sin_sorteo`) |
| `f10f600` | D-117: en la comida de un día sorteado, el nivel de legumbre va antes que A, B y la verdura; fuera de esos días no hay suelo de legumbre; el día de al lado no lleva legumbre |
| `db4ded5` | D-116: segundo plato de ave o carne tras un primero de legumbre, con (b); `runWalk` devuelve `segundos` y `materializePlan` pone `segundo` en la comida |
| `006f3a0` | D-116.5: red de seguridad, la semana se repite sin segundos (`segundos_retirados_d099`) |
| `de0041a` | D-116.5: una infracción de D-099.3 sin segundos que retirar tiene causa propia (`infraccion_d099_sin_segundos`) |
| `d6b44de` | Orden de las dos redes (familia y D-099) visible en el log; como mucho 4 walks por semana |
| `a7d81ef` | Test: perfil con 1 o 2 compuestos de legumbre (3 días sorteados, sin suelo de D-024) |
| `3a819ba` | Comparación motor real frente al prototipo (`medicion/compararMotorHook.mjs`); el hook lee el walk de `ba52d21` |
| `8d6807d` | `DECISIONS.md`: líneas de implementación en D-116.5, D-117.2 y D-117.7 |
| `2b49d3e` | D-116.5: si con los segundos el walk se queda sin platos, se repite sin segundos (`segundos_retirados_pool_vacio`) |
| `a79249f` | `DECISIONS.md`: la red del pool vacío en D-116.5 |
| `9141bab` | Plan de la etapa 2 (`src/plan`) en la sección 12 de `medicion/estructura-comida.md`; `repeticionSegundos.mjs` y `perfilesSinteticosApp.mjs` |
| `09bf751` | Medición de dos variantes de la red de D-116.5 (`variantesRed.mjs`, `resumenVariantesRed.mjs`), sin cambiar la red |
| `11b3de4` | Etapa 2, paso 1: el segundo entra en `platosSemana` (`src/plan/engine2App.js`); línea base regenerada |
| `3622d54` | Etapa 2, paso 2: las métricas del banco cuentan los segundos en familias, especies y D-099.3; línea base regenerada |
| `aac7851` | `ESTADO.md`: pasos 1 y 2 de la etapa 2 y variantes de la red |
| `ff2fa23` | D-116.5 (decisión de Javi): la red repite con la regla de legumbre apagada (`regla_legumbre_retirada_d099`, `regla_legumbre_retirada_pool_vacio`, `infraccion_d099_regla_retirada`); línea base regenerada |
| `ea39547` | `variantes-red.md` medido con el motor real: 600 de 600 semanas iguales a la variante en memoria |
| `f4002a7` | `DECISIONS.md`: D-116.5 con la red nueva, sus cifras y el pendiente de los perfiles con gluten |
| `3191a32` | Etapa 2, paso 3: la comida doble como función pura (`src/plan/textos/comidaDoble.js`) |
| `46319c9` | Etapa 2, paso 4: el lector lee cada aceite de la comida doble en su plato (`leerComida.js`) |
| `c729407` | Etapa 2, paso 5: raciones de la comida doble, con el tope de la legumbre (`racionesApp.js`) |
| `f84a70d` | Control de `src/plan` frente al prototipo (`controlComidaDoble.mjs`, `control-src-plan.md`) |
| `c94c1f4` | Etapa 2, paso 6: la app monta la comida doble (`engine2App.js`); línea base regenerada |
| `bf7cde7` | Etapa 2, paso 7: alternativas de una comida doble (`regenerarComidaEngine2`) |
| `aaba881` | `ESTADO.md`: etapa 2, pasos 3 a 7 |
| `6b07fb9` | Alternativas: una comida doble no se cambia por un compuesto de legumbre (decisión de Javi del 2026-11-16) |
| `fe7bed9` | Auditoría de los caminos que leen o cambian una comida doble (`auditoriaComidaDoble.test.js`) |
| `cc453c5` | Mediciones del aceite, de los primeros repetidos y de la comida doble en día de ancla; `ESTADO.md` |
| `c5b1b4c` | Medición de variantes del aceite y de la elección del primero (`variantesComidaDoble.mjs`, `variantes-comida-doble.md`), sin cambiar reglas |
| `b9f4de9` | Comida doble: aceite 10 + 10 y el segundo crece antes que el pan (`racionesApp.js`, `raciones.js`); línea base regenerada |
| `54afa6e` | `DECISIONS.md`: D-116.6 modificado (aceite 10 + 10) |
| `cc35352` | Medición: primeros sin legumbre ni aliño repetidos en los perfiles sin pescado; no se implementa |
| `85854cc` | Alternativas: una comida doble sin alternativa de engine2 se queda como está, con aviso |
| `2fb2af1` | Textos: el arroz de «Lentejas guisadas con arroz y zanahoria» |
| `cb753a4` | `ESTADO.md` |
| `3f3eba2` | El primero prefiere legumbre no usada en la semana y aliño no usado por otro primero (`runWalk.js`); línea base regenerada |
| `3d6ba6e` | `DECISIONS.md`: D-117.2 modificado (orden dentro del nivel de legumbre) |
| `9c443d8` | «En seco» en la compra del hidrato en todas las plantillas; línea base regenerada |
| el siguiente a `9c443d8` | Paso 8: documentación de la etapa 2 (`medicion/estructura-comida.md`, secciones 9 y 12) y `ESTADO.md` |

## Decisiones de Javi (2026-11-12 y 2026-11-13)

- **Patata:** solo en gramos, sin piezas ni «aprox.» (las piezas quedan desfasadas en el plan compartido).
- **Queso en lonchas:** el cambio de escritura se descartó. Con la variante B queda en «1 loncha».
- **Aceite:** se decide en gramos y se escribe en ml redondeados a 5; es un redondeo dentro de tolerancia.
- **SIBO:**
  - El aceite aromatizado con ajo sustituye al aceite de cocinar: el AOVE o, si no hay, el girasol, incluido «Aceite de sésamo o girasol».
  - Nunca sustituye al aceite de sésamo solo.
  - El texto del plato nombra el mismo aceite que la compra.
- **Mínimos:** variante B (lo que la ficha pide por debajo del mínimo queda fijo en la ficha). Las masas marcadas en la ficha (`masa: true`: crepes de avena y batido de soja) conservan el comportamiento anterior.
  - Consecuencia aceptada: los ingredientes fijados por la ficha, incluidos los que dan nombre al plato, no crecen con el objetivo.
- **D-112 y D-113:** escritas en `DECISIONS.md` (`2bc9c61`). En D-112, la variante con las masas incluidas cambia 139 comidas (el borrador decía 142).
- **Pescado y legumbres (2026-11-13):**
  - **S, aprobada e implementada:** la sugerencia de la comida libre del sábado no sube los contadores de los suelos ni marca la verdura del día. Sigue contando para no repetir plato.
    - Además, el paso 4 no la dirige (así se midió); sigue contando para el tope y la separación por especie.
    - El motor con S da los mismos menús que la variante medida en memoria (2400 semanas idénticas). `--cf=sinS` reproduce la línea anterior.
    - Asiento: D-114.
  - **Bm, aprobada e implementada:** una familia proteica que sale el día anterior o el siguiente no se repite; pescado y marisco son una sola familia. Solo omnívoros. Si dejaría el hueco sin candidatos no se aplica, y queda en la evidencia del hueco.
    - No mira la comida y la cena del mismo día. La sugerencia del sábado ni se filtra ni cuenta como vecina. El ancla no pasa por el filtro (la coloca `expandWeekArc.js` antes del walk).
    - El motor con Bm da los mismos menús que la variante medida en memoria (2400 semanas idénticas). `--cf=sinBm` la deshace.
    - Red de seguridad (`c22367a`): si el walk se queda sin platos en un hueco posterior, se repite entero sin el filtro y lo dice en el log (`familia_dias_seguidos_retirada`). No se activa en las 2400 semanas del banco.
    - También en las alternativas (`12c3aff`), salvo cuando el plato que se quita era del ancla.
    - Asiento: D-115 (extiende D-099.3.e).
    - Ampliarla al mismo día está medido y sin implementar (pescado 3,87 por semana, el 82 % de las semanas en 4).
  - **A** (en la comida, los suelos antes que la verdura): sin implementar.

## Pendientes y de qué dependen

- **Masa como unidad:** depende de una decisión de Javi. Diseño propuesto: un solo factor para toda la masa, en pasos del ingrediente más grueso (medio factor en las crepes, que llevan 2 huevos; uno entero en el batido, por su plátano). Grupo proteico si lleva algo proteico, y sin mínimos sueltos por ingrediente. Hay que medirlo antes de implementarlo.
- **Huevo de las crepes:** su proporción ya se desvía hoy (huevo/avena 1,77 frente a 2,65 de la ficha). Va ligado a la masa como unidad.
- **Batido:** en el banco solo sale a 1400 kcal (perfil vegano); el caso de 3714 kcal no se ha visto en un plan real.
- **Comprobación independiente del lector:** propuesta, sin implementar (README, «Límites del instrumento»). Necesita la aprobación de Javi.
  - Deuda: el medidor no se ejecuta en la app; el ±5 % solo está garantizado en tests.
- **Auditoría B (pescado):** informe completo en [`medicion/auditoria-pescado.md`](medicion/auditoria-pescado.md). Javi no ha decidido nada todavía. No proponer techos semanales.
  - Con el suelo, la verdura y la legumbre desactivados salen 4,40 por semana: es el peso del catálogo.
  - El 3,54 aparece cuando, sin la verdura, el suelo de legumbre ocupa comidas.
  - Las reglas juntas añaden unos 0,45 sobre la base del catálogo.
  - El suelo de pescado solo actúa en la cena.
  - La regla de verdura diaria enriquece de pescado la comida y bloquea el suelo de legumbre (la legumbre se queda en 0,8 por semana).
  - La sugerencia del sábado cuenta para el suelo sin servirse.
  - Muchos platos de ave tienen la verdura como «desconocida».
  - Las alternativas «ligero» devuelven pescado el 54 % de las veces.
- **Diseño medido de pescado y legumbres** (200 semanas por perfil, en memoria; scripts `contrafactualesDiseno.mjs`, `medirDiseno.mjs`, `resumenDiseno.mjs`, `analisisDiseno.mjs` y `verduraDesconocida.mjs`). Cifras de los 9 perfiles con pescado:
  - Línea actual: 4,91 pescados y 0,97 legumbres por semana. En bloques de 72 semanas va de 4,74 a 5,13: con ese tamaño, menos de 0,3 de diferencia es ruido.
  - Azar puro sobre el catálogo: 4,11. Con el tope y la separación por especie, 4,84: el ave baja de 3,82 a 2,75 platos por semana.
  - El 4,40 de la auditoría se reproduce (4,41), pero no es el peso del catálogo.
  - A: legumbre 2,72, pescado 4,33, ningún día sin verdura fuera del sábado. Con el suelo de legumbre en 2: legumbre 2,02 y pescado 4,70 (A+S).
  - B con la definición del README deja rachas (pescado y marisco se alternan). Con Bm la racha máxima es de 2 días y el pescado baja a 4,42.
  - S: los días sin verdura (0,64 por semana, todos sábados) pasan a 0.
  - Verdura «desconocida»: 63 de 235 platos (16 de ave, los 9 de cereal).
  - Pendiente de decidir: A y el suelo de legumbre (A, sin implementar por decisión de Javi). No proponer techos semanales.
- **Estructura de la comida y legumbre (D-116 y D-117):** etapa 1 implementada en el MOTOR (`src/engine2`, commits `4378c3a` a `ff2fa23`), sin la opción (c). Plan de la etapa 2 (`src/plan`), por pasos y con su test previo, en la sección 12 del informe. Informe y scripts en [`medicion/estructura-comida.md`](medicion/estructura-comida.md).
  - **La app ya enseña el segundo** (etapa 2, pasos 3 a 7, hechos el 2026-11-16). La comida de legumbre con segundo es una sola comida: el primero en `p1`, el segundo en `p2`, la compra y la receta seguidas, y las raciones de la comida entera. Detalle más abajo, en «Etapa 2, pasos 3 a 7 hechos».
  - Comparación (`medicion/compararMotorHook.mjs`, 200 semanas por perfil, 10 perfiles): el motor da los mismos menús que el prototipo de medición en las 2000 semanas. El prototipo se validó antes contra el hook de `ba52d21` (2000 semanas idénticas). Infracciones de D-099.3: 0. Red de seguridad: 71 de 2000 semanas, todas del perfil sin pescado ni marisco. Legumbre 3,02 y pescado 3,90 por semana (8 perfiles).
  - Diferencias con el hook, aprobadas por Javi: la red solo se repite si había segundos, y una infracción sin segundos tiene causa propia; la repetición vuelve a empezar con el filtro de familia (máximo 4 walks); un perfil sin compuestos de legumbre (SIBO) no sortea días ni apaga el suelo de D-024 (sus 200 semanas, idénticas a `ba52d21`); causa nueva `dias_legumbre_sin_sorteo`. Desde `ff2fa23` la repetición va con la regla apagada, no solo sin segundos.
  - El banco (`metricas.mjs`) cuenta los segundos en familias, especies y D-099.3 desde `3622d54` (del decision log, mientras la app no los escriba en la comida).
  - Pendiente: el domingo como día de legumbre y la legumbre a 4 (AESAN).
  - Pool vacío por el segundo (el riesgo que también tenía el hook): cubierto en `2b49d3e`. Como la red de D-099, desde `ff2fa23` repite con la regla apagada; como mucho 4 walks por semana. No sale en el banco.
  - **Etapa 2, pasos 1 y 2 hechos** (`11b3de4`, `3622d54`). El segundo entra en `platosSemana`: `repeticionSegundos.mjs` da 0 de 2210 segundos repetidos de la semana anterior (antes, 435 de 2216). El banco cuenta los segundos en familias, especies y D-099.3, y da 0 infracciones en los perfiles omnívoros.
  - **Etapa 2 hecha, pasos 1 a 8** (el 8, documentación, en `medicion/estructura-comida.md`, secciones 9 y 12). Pasos 3 a 7 (`3191a32` a `bf7cde7`), cada uno con su test previo:
    - Paso 3, `textos/comidaDoble.js`: `componerComidaDoble`, `recomponerDoble`, `combinarDoble` y `compraPorPlato`. Los datos de cada plato van en `_doble` (`primero`, `segundo` y `corte`, que dice cuántas líneas de la compra son del primero). Mismo texto que `construirPS` en 5796 combinaciones.
    - Paso 4, `leerComida.js`: en la comida doble, un aceite sin cantidad se busca en el texto de su plato, y cada ingrediente dice de qué plato es (`plato`).
    - Paso 5, `racionesApp.js`: `topeLegumbre` y `extraDoble`. El tope se calcula con el plato solo en la comida de un día de 2174 kcal de cuatro comidas; da los mismos 14 valores que el prototipo, sin plan de referencia. La comida doble no pasa por `reescribirComida`.
    - Paso 6, `engine2App.js`: monta la comida doble. La comida doble no lleva `_spec`. `adaptar.js` no la adapta entera: cada plato se adapta por separado.
    - Paso 7, `regenerarComidaEngine2`: cambiar una comida doble la deja en plato único y quita el segundo de `platosSemana` (causa `alternativa_retira_segundo`); al cambiar otra comida, el segundo cuenta como un plato más de la semana.
    - Control (`medicion/estructura-comida-final/control-src-plan.md`, 200 semanas por perfil, 10 perfiles): la app escribe el mismo texto que el prototipo en 2000 de 2000 semanas. Comidas dobles fuera de ±5 % de kcal: 134 de 5214 (127 de 4783 en los 8 omnívoros); cortas de proteína: 13; lectura junta distinta de plato a plato: 0. Sin pescado ni marisco: 3,15 comidas y cenas cortas por semana y 102,3 % de la proteína del día, como en `variantes-red.md`.
    - Línea base del banco regenerada en `c94c1f4`: 528 diferencias, 70 semanas con el texto cambiado; ningún menú ni restricción cambia.
    - Tres semanas en texto: `medicion/estructura-comida-final/semanas-app.md`.
    - Medición: `medirEstructura.mjs --ec=off` mide lo que escribe la app; `--ec=motor` sigue siendo el prototipo (aplica sus raciones sobre `racionesApp.js` de `96a2143`).
  - **Decisiones de Javi (2026-11-16):**
    - La alternativa de una comida doble no puede ser un compuesto de legumbre (implementado en `6b07fb9`: `elegirAlternativa` con `sinLegumbreCompuesta`, causa `alternativa_sin_legumbre_compuesta`; es un veto, no se relaja). En las mismas 169 comidas dobles (20 semanas de 3 perfiles), compuestos de legumbre por deseo antes/después: reconfortante 43/0, ligero 0/0, rápido 1/0, sorpréndeme 21/0. Platos únicos cortos de proteína: 77/45, 32/32, 45/43, 50/31. Siguen saliendo platos redactados de legumbre (D-116.8): 77, 52, 38 y 20 de 169 (fabada, cocido, curry, hummus, falafel, ensalada de lentejas, burrito).
    - Se acepta el redondeo de los dos aceites de la comida doble: cada aceite se escribe en ml redondeados a 5, así que las kcal declaradas se apartaban de las releídas más de 15 kcal (o un 3 %) en 6 a 17 comidas por perfil en 8 semanas, con un máximo de 25 kcal. Con el aceite 10 + 10 (`b9f4de9`) esas comidas pasan a 0: 10 g se escriben como 10 ml justos.
  - **Decisiones de Javi (2026-11-17), implementadas:**
    - **Aceite 10 + 10** (`b9f4de9`, D-116.6 modificado en `54afa6e`): la comida doble lleva como mucho 10 g de aceite en cada plato (20 g entre los dos, el máximo de un plato único). Lo que falta de kcal lo cubre la legumbre hasta su tope, después el segundo dentro de su rango (`ajustarComida`: el proteico marcado con `crecerSiFalta` crece si no queda ningún energético libre; causa `proteico_crece_por_energia`) y después el pan o la fruta. Control de 200 semanas por perfil (`medicion/estructura-comida-final/control-aceite-10-10.md`): mismo texto que la variante medida en 2000 de 2000 semanas; comidas dobles fuera de ±5 % de kcal 134 → 32, cortas de proteína 13 → 0, lectura junta distinta de plato a plato 0 de 5214. Aceite de la comida doble 32,7 → 19,7 ml; aceite del día 43,4 → 37,8 ml (máximo 80 → 60). Línea base regenerada: 266 diferencias, solo cantidades y nutrición.
    - **Primeros sin legumbre ni aliño repetidos:** medida el 2026-11-17 (`cc35352`, `medicion/primeros-sin-pescado.md`); con la regla de la tarea no se implementó, porque empeoraba por poco las comidas cortas de proteína en sin-pescado-2000 (3,14 → 3,17 por semana) y las semanas con la red (63 → 64 y 195 → 197). Después Javi la aprobó, aceptando esas diferencias como ruido: implementada en `3f3eba2` (`runWalk.js`, dentro del nivel de legumbre y antes de A y B; causas `primero_legumbre_no_usada`, `primero_alino_no_usado` y sus `_sin_aplicar`), D-117.2 modificado en `3d6ba6e`. El motor da los mismos menús que la variante medida en 2000 de 2000 semanas, y el mismo texto en las 600 de los tres perfiles sin pescado. Consecuencia que no salía en la medición del primero: las comidas dobles fuera de ±5 % de kcal pasan de 32 a 47 de 5240 (33 a 1434 kcal, antes 25); las cortas de proteína siguen en 0. Línea base regenerada (62 semanas con el menú o el texto cambiado).
    - **«En seco» en la compra del hidrato** (`9c443d8`): en bowl, pasta, plato clásico y ensalada la compra del arroz, la pasta y la quinoa dice «en seco», como el texto (con el ancla, «70 g en seco, del domingo»; con SIBO, «Pasta sin gluten (80 g en seco)»). La patata y el boniato no cambian. Línea base regenerada: 78 semanas con el texto cambiado, ninguna métrica.
    - **Comida doble sin alternativa** (`85854cc`): si engine2 no encuentra alternativa, `regenerarComida` la deja como está, con `alternativaSinCambio`, un aviso propio (`alternativaAviso`, que la vista enseña) y la causa `alternativa_sin_candidato_comida_doble`; no va al motor viejo. Un plato único sin alternativa sigue como antes.
    - **Arroz de «Lentejas guisadas con arroz y zanahoria»** (`2fb2af1`): el texto lo nombra con «en seco», la compra pone «en seco» y la receta lo cuece (el día de aprovechar dice cómo usar el ya cocido; el de cocinar de más, cuánto cocer y guardar). Solo en la plantilla de legumbre: en las demás plantillas la compra del hidrato sigue sin «en seco».
  - **Abierto tras la etapa 2:**
    - Al cambiar una comida que NO es doble, la alternativa todavía puede ser un compuesto de legumbre como plato único (la decisión de Javi es solo para la comida doble). No se ha medido cuántas veces.
    - Aceite (`medicion/estructura-comida-final/aceite-primeros.md`, 200 semanas por perfil frente a `ba52d21`): la comida doble lleva 33 ml de media a 2174 kcal (19,8 la legumbre como plato único hoy), y el día con comida doble 51,8 ml. El día medio sube de 37,6 a 44,5 ml a 2174 kcal y de 25,7 a 27,5 a 1434; el día con más aceite pasa de 60 a 75 u 80 ml en los perfiles de 2000 kcal o más. Cada plato lleva su aceite; el primero a la mitad, con un mínimo de 5 ml.
    - Los primeros de la semana se parecen: en 1447 de 1736 semanas con 2 o más primeros se repite la legumbre, en 1106 el aliño y en 489 la legumbre y el aliño (el mismo guiso con otra verdura). Nunca 3 de la misma legumbre. El más frecuente, lentejas con pimentón y ajo (1816 de 5214).
    - El arroz de «Lentejas guisadas con arroz y zanahoria» ya se nombra y se cocina (`2fb2af1`). El ejemplo de `medicion/estructura-comida-final/ancla-doble.md` es anterior al arreglo.
    - En el perfil del banco con ancla (cocina el domingo anterior) solo hay comidas dobles de aprovechar (55 en 200 semanas); el día de cocinar de más se ha visto con el mismo perfil cocinando el miércoles (`anclaDoble.mjs`).
    - A mano, sin hacer: el título largo y las dos partes en `p1` y `p2` en la pantalla del móvil; el panel del nutricionista con una comida doble.
  - **Variantes medidas (2026-11-16; las dos implementadas el 2026-11-17).** Tablas, diagnóstico y recomendaciones en `medicion/variantes-comida-doble.md` (200 semanas por perfil, en memoria con `variantesComidaDoble.mjs` sobre `medirEstructura.mjs --ec=off`).
    - Aceite. Variante pedida: la comida doble lleva como mucho el aceite máximo de un plato único (20 g); lo que falta lo cubre la legumbre hasta su tope, luego el segundo dentro de su rango y luego el pan o la fruta. En los 9 perfiles con comida doble: aceite de la comida doble 32,7 → 19,7 ml; aceite del día 43,4 → 37,8 ml (máximo 80 → 60); fuera de ±5 % de kcal 134 → 22 (32 con el aceite 10 y 10); cortas de proteína 13 → 0; proteína del día 103,8 → 105,9 %; legumbre 80 → 105 g; con pan o fruta 20 → 32 %. Sin crecer el segundo, 138 de 608 fuera a 3714 kcal. Recomendación: la pedida, con 10 y 10. Implementarla toca `racionesApp.js` (`extraDoble`) y `raciones.js` (`ajustarComida`: el segundo crece si no queda energético libre), y cambia D-116.6.
    - Primeros. Lentejas con pimentón es el 35 % por composición (3 de los 11 primeros rotativos, más uno del ancla), por el tope de 2 ajillos por semana (quita los 4 primeros al ajillo 6773 veces en 4648 comidas de día sorteado) y por el paso 5, que quita los de espinacas en el 37 al 38 % de las comidas (la causa de esto último es una hipótesis). Variante recomendada: dentro del nivel de legumbre, legumbre no usada en la semana y aliño no usado por otro primero, con vuelta atrás y causa en el log. Repite legumbre 83 → 63 %, aliño 63 → 52 %, guiso 27 → 16 %, días sorteados sin legumbre 2,7 → 0,9 por cada 100 semanas, D-099.3 y la red igual. No cambia el reparto de los 14. Implementarla toca `runWalk.js` (línea 648) y cambia D-117.2.
  - **Auditoría de los caminos que leen o cambian una comida doble** (`src/plan/tests/auditoriaComidaDoble.test.js`, `fe7bed9`). Ningún arreglo claro en `src/plan`: lo que falla está en la vista o en el motor viejo.
    - Plan compartido (canjear un código, `cloneAndScalePlan` en `OriginalPlanApp.jsx`): la comida doble se clona bien (mismo título, misma partición de la compra) y escala los gramos de los dos platos, no los ml del aceite. Como en un plato único, no mira rangos ni topes (50 g de legumbre a 2174 kcal pasan a 41 g a 1800) y la nutrición mostrada es la del dueño. Si el amigo activa el batido, el día se vuelve a racionar desde la comida de partida, a sus calorías.
    - Cambio de calorías o de perfil (check-in, editar el perfil y generar, nueva semana): el plan se genera entero; mismos menús y la comida doble racionada a las calorías nuevas.
    - Recalcular el día (batido): en planes de engine2 se vuelve a racionar y ON y OFF la dejan igual. En el recálculo del motor viejo (`dayPortionsRegen`), una comida sin `_spec` se conserva intacta.
    - Lista de la compra (pestaña de la comida; no hay lista semanal): los dos platos seguidos, con líneas repetidas (ajo, cebolla) y dos de aceite.
    - Panel del nutricionista: el resumen del paciente pinta solo `p1`, así que de la comida doble solo se ve el primero. Si el nutricionista edita la compra de una comida doble, `_doble.corte` deja de cuadrar (la lectura plato a plato se desplaza); volver a racionar parte de `_base` y descarta la edición, igual que en un plato único.
    - Plan guardado (la base de datos solo guarda los días): la comida doble llega entera; `platosRecientesPara`, recalcular el día y las alternativas funcionan igual.
    - Regeneración parcial del motor viejo (cuando engine2 no encuentra alternativa y la vista llama a `buildPlan` con `_regenContext`): con una comida doble ya no se llega (`85854cc`); el test documenta lo que haría el motor viejo si se llegara.
  - **Propuestas (sin implementar, decide Javi):**
    - Vista: en el resumen del nutricionista, el título de la comida en lugar de `p1` (o `p1` y `p2`).
    - Vista: al editar en el panel del nutricionista una comida doble, quitarle `_doble`, `_dishId2` y `_base` (pasa a ser texto libre), o no dejar editar la compra.
    - Vista: en la receta, las líneas «De primero, …:» y «De segundo, …:» como encabezados, no como pasos numerados.
    - Motor viejo (congelado, no se toca): el `platosSemana` de la semana no se actualiza cuando el motor viejo cambia un plato de engine2. Ya pasaba con los platos únicos.
  - **Red de D-116.5 con la regla apagada** (decisión de Javi, implementada en `ff2fa23`): si con los segundos la semana incumple D-099.3 o se queda sin platos, se repite sin días sorteados, sin segundos y con D-024 como antes. El motivo es que la regla no deje la proteína peor que hoy. Cifras en `medicion/estructura-comida-final/variantes-red.md` (200 semanas por perfil; el motor real coincide con la variante medida en memoria en 600 de 600 semanas):
    - Comidas y cenas cortas de proteína por semana, hoy / red anterior / red nueva: sin pescado ni marisco 4,29 / 3,64 / 3,15; gluten y sin pescado 4,03 / 4,71 / 3,92; lactosa, gluten y sin pescado 4,22 / 5,01 / 4,18.
    - Infracciones de D-099.3: 0 / 0 / 2 en el perfil del banco (conejo en las cenas de sábado y domingo en 2 semanas, porque el tope de 2 ya agotó las demás especies); en los dos sintéticos con gluten ya hay 28 hoy y la red nueva deja 25 y 28. Quedan anotadas con `infraccion_d099_regla_retirada`.
    - Pendiente: el banco no tiene ningún perfil con gluten y sin pescado ni marisco.
  - Por la entrada de la app, ningún perfil sintético con lactosa y gluten (con o sin pescado, con huevo) cae al motor viejo en 200 semanas. Con gluten y sin pescado ni marisco, la red de D-099 actuaba en 186 a 194 de 200 semanas (con la red nueva, 192 a 195, y la regla se apaga esas semanas) (`medicion/perfilesSinteticosApp.mjs`).
- **Fichas con una cifra para dos ingredientes** (`medicion/barridoCifraCompartida.mjs`, 183 fichas, solo `p1` y `p2`): queda 1 como los ñoquis, sin corregir: «Crema de calabacín y espinacas con quinoa y semillas» («espinacas y patata (100g)»). Otros 34 tramos nombran dos ingredientes pero la cifra es de uno solo y se reescribe bien.
- **Perfiles de 2600 y 3714 kcal:** quedan un 2,4 % por debajo de su objetivo de media, con las raciones en el techo. De ahí salen casi todas las semanas fuera de ±5 % (12 de 1800 con Bm). Es anterior a S y a Bm.
- **Test intermitente** `scripts/fase7/entrega.test.js:639` (tiempo límite de 5 s): ya fallaba en `main` y no se toca.
- **Suite que no carga en este worktree:** `src/data/__tests__/pdb.characterization.test.js` falla con «supabaseUrl is required» porque aquí no hay `.env.local`. No depende de esta rama.
- **Lint:** 154 problemas que ya estaban en `main`. Ninguno en los archivos tocados por esta rama.

## Prohibiciones

- No tocar Supabase, producción, funciones SQL o RPC, RLS, permisos ni el flujo de plan compartido. No desplegar.
- No editar `DECISIONS.md` sin autorización. No hacer merge a `main`.
- Push solo a esta rama; nunca a `main` ni a otras ramas.
- No modificar el worktree de la auditoría de seguridad ni sus documentos. No tocar `scripts/fase7`.
- No usar datos personales ni planes de producción. El banco funciona sin red, sin Supabase y sin variables de entorno (no hay `.env.local` en este worktree).
- No introducir cambios gastronómicos arbitrarios ni relajar restricciones nutricionales para ganar variedad.
- No cambiar objetivos energéticos ni reglas generales de raciones para resolver un problema de presentación.
- Si una corrección requiere una decisión funcional abierta, no implementarla: dejar la propuesta documentada.

## Forma de trabajo

- **Paradas:** se para donde Javi dice («PARA tras el punto N») y se informa. Medir o verificar no autoriza a implementar.
- **Commits:** un commit por cambio. Si es una corrección, primero el test de reproducción, que debe fallar antes del cambio.
- **Línea base:** si un cambio altera los menús, se regenera en el mismo commit (`--guardar`).
  - Medir: `node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs`
  - Guardar: añadir `--guardar` al mismo comando.
- **Mediciones:** antes y después en el banco, con los scripts de `scripts/banco/medicion/`. Las variantes y los contrafactuales se aplican en memoria, sin tocar `src/`.
- **Respuestas:** a cada propuesta de Javi se responde por separado, con los desacuerdos explícitos. Las cifras salen de lo medido, no de lo inferido.
- **Idioma:** español.
