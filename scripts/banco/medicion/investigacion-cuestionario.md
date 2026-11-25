# Investigación: cuestionario → motor, esfuerzo de cocina, «Regenerar» y la pregunta del pescado (2026-11-25)

Solo lectura sobre `main` `d261df2`. Nada de `src/` cambia. Certeza: **[código]** = visto en código (archivo:línea), **[git]** = visto en git o `DECISIONS.md`, **[no verificado]**.

## 0. Los 9 `.json` de `db9a2fd`

**Sí: solo datos sintéticos del banco.**
- Cada archivo tiene `ec`, `semanas` (200), `semanaInicial` (60), `topes` y `filas` (2000 filas). **[git]**
- Las 2000 filas son de 10 perfiles con nombre de banco: `omni-1434`, `omni-2174`, `omni-2600-3comidas`, `omni-3714`, `celiaco-2400`, `sin-lactosa-2000`, `sin-pescado-2000`, `sibo-2000`, `omni-2174-ancla` y `omni-2000-sin-atun`. Están definidos en `scripts/banco/perfiles.mjs:21-32`. El userId es `banco-${id}` (`perfiles.mjs:5-6`). **[git] [código]**
- Las claves de cada fila son métricas: `perfil`, `s`, `motor`, `pescado`, `legumbre`, `kcalDia`, `protDia`, `causas`, `vetados`, `eliminados`, etc. Ninguna es un email, un nombre o un uuid. **[git]**
- Búsqueda en los 9 archivos: emails, JWT (`eyJ…`), `sk-…`, `supabase`, `service_role`, `apikey`, `password`, uuid. **0 coincidencias.** **[git]**
- `medirEstructura.mjs` importa solo `src/plan` y `src/data/freeformPool.js`. No usa ningún cliente de Supabase ni `.env`. **[código]**

## 1. Cuestionario → Supabase → motores

### Dónde se guarda el perfil
- **localStorage**: el perfil entero va en `SK(uid)` y en `pf_profile_<uid>` (`src/data/db.js:312-315`). **[código]**
- **Supabase `user_data.data.profile`**: el perfil entero, como blob (`db.js:320`, `sdb.js:364`). **[código]**
- **Supabase `preferences.data`**: solo una lista cerrada de campos (`sdb.js:396-417`): `gender`, `age`, `weight`, `height`, `activity`, `goal`, `kcalAdjust`, `intolerances`, `dieta`, `eliminatedFoods` y `trainingDays`. **No guarda** `mealsPerDay`, `extras` (batido), `hambre`, `experiencia`, `tiempoCocina` ni `date_of_birth`. **[código]**
- **Supabase `plans.profile_data`**: una copia del perfil con cada plan (`sdb.js:745`). **[código]**
- `docs/schema.sql:105-120` describe `preferences` con columnas sueltas, sin la columna `data` que usa el código: el archivo está desfasado. **El esquema real no lo he consultado.** **[no verificado]**
- Al iniciar sesión, `pullFromCloud` escribe lo de `preferences` en `pf_profile_` (`db.js:233-236`). La pantalla, en cambio, lee el perfil de `SK(uid)` (`OriginalPlanApp.jsx:186`). En un dispositivo nuevo no he comprobado qué perfil se ve. **[no verificado]**

### Cómo llega el perfil a cada motor
- `generarPlanEngine2` llama primero al **motor viejo con el perfil entero**: `buildPlan(clonar(profile), …)` (`src/plan/engine2App.js:252`). De él usa el esqueleto de los días (huecos y nombres) y la `strategy`. **[código]**
- Comida y cena se sustituyen por las de engine2 (`engine2App.js:368-372`). Desayunos y tentempiés también (`ponerDesayunos`, `engine2App.js:381`). El resto pasa por `limpiarComidaLegacy`. **[código]**
- **El walk de engine2 recibe solo** `trainingDays`, `dieta`, `pescadoMaxSemana` y un `intolerances` vacío, porque el catálogo ya llega filtrado (`engine2App.js:257-274`). Recibe también `strategy`, `cocinarEnCantidad` y las legumbres de guarnición. **[código]**
- En engine2, `strategy` es «metadato pasivo»: no decide nada (`src/engine2/skeleton/buildWeekArc.js:34`, `:468`). **[código]**
- Las raciones de engine2 usan las kcal objetivo, la proteína y el peso (`src/plan/racionesApp.js:24-27`). Con el batido, también `extras.proteinShake` (`racionesApp.js:36-45`). **[código]**

### Tabla

| Paso | Campo | Opciones | Supabase | Motor viejo | engine2: qué cambia en el menú |
|---|---|---|---|---|---|
| 0 Datos básicos (`OriginalPlanApp.jsx:943-967`) | `gender`, `date_of_birth`→`age`, `weight`, `height` | Mujer/Hombre; fecha; 40–180 kg; 140–220 cm | `preferences` (salvo `date_of_birth`), `user_data` | kcal | **Cantidades**: kcal (`calcTDEE`/`calcTarget`, `OriginalPlanApp.jsx:244`); el peso cuenta en la proteína (`racionesApp.js:26-27`). Los platos no cambian. **[código]** |
| 1 Actividad (`:1074-1083`, `ui/constants.js:174-180`) | `activity` | sedentary, light, moderate, active, veryActive | `preferences`, `user_data` | kcal y proteína | **Cantidades**: el factor de actividad (kcal) y `PROTEIN_FACTOR[activity][goal]` (`engine/nutrition.js:18-21`). Los platos no cambian. **[código]** |
| 2 Objetivo (`:1085-1094`, `constants.js:181-188`) | `goal` | fatLossGeneral, fatLoss, mildFatLoss, maintain, mildGain, muscleGain | `preferences`, `user_data` | kcal, proteína, `strategy` y multiplicadores de ración (`nutrition.js:31-43`, `getMealRules`) | **Cantidades**: kcal (`GOAL_ADJ`) y proteína. La `strategy` que sale del objetivo es pasiva en engine2. **Los platos no cambian.** **[código]** |
| 3 Comidas (`:1131-1142`) | `mealsPerDay` | 2, 3, 4, 5 | **solo `user_data`** (no está en `preferences`) | número de huecos del día | **Estructura**: los huecos vienen del motor viejo. Con 2 comidas no hay cena (`engine2App.js:355-366`), y hay desayuno/tentempiés según los huecos. **[código]** Detalle: con 2 comidas, la cena de engine2 entra igual en `platosSemana` (`engine2App.js:351`, antes del `if` de `:355`) y la semana siguiente la evita aunque no se sirviera. **[código]** El efecto en los menús no está medido. **[no verificado]** |
| 3 Suplementación (`:1143-1185`) | `extras.proteinShake` (`enabled`, `scoops` 1/2, `timing` manana/post_entreno/noche) | | **solo `user_data`** | sí | **Cantidades**: se descuenta de la comida a la que acompaña (`racionesApp.js:31-45`). **[código]** |
| 4 Perfil: hambre (`:1190`, `:1197`) | `hambre` | baja, media, alta | **solo `user_data`** | `strategy`: con fatLoss/mildFatLoss y hambre alta, `definicion_saciante` (`nutrition.js:35-38`) | **Ninguno.** La `strategy` es pasiva. `calcMacros` solo la usa para la grasa (`nutrition.js:22`), y `objetivoDe` no lee la grasa. **Se pregunta y no influye en engine2.** **[código]** |
| 4 Perfil: «¿Cuánto te gusta cocinar?» (`:1191`, `:1197`) | `experiencia` | novato «Rápido y sin complicaciones», intermedio, avanzado «Disfruto cocinando» | **solo `user_data`** | `novato` → modo simple, con listas cortas de comidas y cenas (`buildPlan.js:2143-2145`). No he encontrado ningún otro uso de `avanzado`. **[código]** | **Ninguno.** engine2 no lo lee: `grep` en `src/engine2` y `src/plan` da 0. **Se pregunta y no influye en engine2.** **[código]** |
| 4 Perfil: «Tiempo disponible entre semana» (`:1192`, `:1197`) | `tiempoCocina` | poco, normal, mucho | **solo `user_data`** | `poco` → días laborables «rápido» y nota «⚡ Día rápido» (`buildPlan.js:2152`, `:2193`, `:2477-2481`); `mucho` → sin `fridayFatigue` (`:2248`). El «elaborado» de fin de semana que anuncia el comentario `:2149-2151` no lo he encontrado en código. **[no verificado]** | **Solo desayunos**: con `poco`, desayunos rápidos (`src/plan/desayunosApp.js:74`, escalones de `engine2/desayunos/elegirDesayunos.js:82-104`). **Comidas y cenas: ninguno.** La nota «⚡ Día rápido» del motor viejo va en su comida, que se sustituye: no llega. **[código]** |
| 5 Restricciones: dieta (`:1219-1224`) | `dieta` | omnivora, vegetariana, vegana | `preferences`, `user_data` | no la conoce: en la reserva se pasa como intolerancias (`generarPlan.js:76-86`) | **Platos**: catálogo propio y vetos (`engine2App.js:170-176`, `adaptar.js:16-22`, `dietas.js`). **[código]** |
| 5 Intolerancias (`:1226-1232`, `constants.js:189-201`) | `intolerances` | lactosa, gluten, huevo, frutos_secos, mariscos, pescado, soja, cerdo, legumbres, picante, sibo | `preferences`, `user_data` | sí | **Platos**: filtro del catálogo (`engine2App.js:169-200`), adaptación SIBO (`adaptar.js:23`), legumbres de guarnición (`engine2App.js:135-137`) y desayunos (`desayunosApp.js:25-54`). **[código]** |
| 5 Alimentos a eliminar (`:1233-1240`) | `eliminatedFoods` | texto libre | `preferences`, `user_data` | sí (solo su proteína y su hidrato, D-103.8) | **Platos**: filtro por texto e ingrediente (`engine2App.js:175`, `:193-195`), guarnición y desayunos. **[código] [git]** |
| (no está en el cuestionario) | `trainingDays` | — | `preferences` (siempre `[]`) | sí | engine2 pone `fixedRole="entreno"` en la cena (`buildWeekArc.js:100-113`, `walk/expandWeekArc.js:75`). **Pero ninguna pantalla lo rellena**: `toggleTrain` está definido (`OriginalPlanApp.jsx:253`) y no se usa, y `DEFAULT_PROFILE` lo pone a `[]` (`:63`). **Llega, pero no cambia nada.** **[código]** |
| (no está en el cuestionario) | `cocinarEnCantidad` | `{activo, dia}` | — | — | El walk lo lee (`buildWeekArc.js:347-356`) y `engine2App.js:268` lo pasa. **Ninguna pantalla lo rellena** (`grep` en `src/ui` y `src/App.jsx`: 0). Solo lo usa el banco (`omni-2174-ancla`, `perfiles.mjs:31`). **[código]** |
| Check-in (`OriginalPlanApp.jsx:401-415`) | `kcalAdjust`, `strategyOverride`, `simpleMode` | según `computeCheckinAdjustment` | `kcalAdjust` en `preferences`; los otros dos, solo en `user_data` | los tres | `kcalAdjust` → **cantidades**. `strategyOverride` → pasiva. `simpleMode` → solo el motor viejo. **[código]** |
| (no está en el cuestionario) | `pescadoMaxSemana` | 2–4 | — | — | Tope de pescado (D-118). Ver el punto 4. **[código] [git]** |

### Se preguntan pero no influyen en engine2
- `hambre`.
- `experiencia`.
- `tiempoCocina`, salvo en los desayunos.

`goal` y `activity` solo cambian las cantidades, nunca los platos.

### Llegan al motor viejo y no a engine2
`experiencia` (modo simple), `hambre` (vía `strategy`), `tiempoCocina` (en comidas y cenas), `simpleMode` y `strategyOverride` del check-in, y la `strategy` con sus multiplicadores (`getMealRules`). **[código]**

Importa para regenerar: hoy, cuando engine2 no tiene alternativa, la regeneración parcial cae al motor viejo (`generarPlan.js:41`; `regenerarComida` devuelve `null` en `generarPlan.js:147` y `:172`). Esa comida sí lleva el sesgo del modo simple y del día rápido. Todo el resto de la semana, no. **[código]**

## 2. Gusto por cocinar y tiempo disponible: qué hay en el catálogo

- **Ficha del plato** (`scripts/phaseB2/output/dishes.json`, 241 platos): `id`, `nombre`, `rol`, `batchable`, `leftoverQuality`, `shelfLifeDays`, `energiaCocina`, `momento`, `tempFeel` y `plateType`. **No hay minutos, dificultad ni número de pasos.** **[código]**
- **`energiaCocina`** (bajo/medio/alto):
  - Es una anotación editorial del cocinero, del xlsx (D-009 y la ingesta, `DECISIONS.md:152`, `:534`). **[git]**
  - Hoy no decide nada en el walk (D-018.6 y D-019; `walk/runWalk.js:95-98`). **[código] [git]**
  - Solo la usa el deseo «Algo más rápido» de las alternativas (`walk/alternativa.js:52`; `DECISIONS.md:4308`). **[código] [git]**

| energiaCocina | Platos | Solo comida | Solo cena | Comida o cena |
|---|---|---|---|---|
| bajo | 115 | 56 | 43 | 16 |
| medio | 121 | 67 | 49 | 5 |
| alto | 5 | 3 | 0 | 2 |

- Por técnica (último elemento del id; 178 platos con id de tupla):
  - plancha: 50 bajo y 4 medio;
  - horno: 56 medio y 4 bajo;
  - guisado: 18 medio y 1 alto;
  - salteado: 14 medio y 7 bajo;
  - crudo, revuelto y tortilla: casi todos bajo;
  - los 63 platos promovidos de freeform no tienen técnica en el id.

  **[código]**
- **Pasos de la receta compuesta** (`componerPlato` a 2000 kcal; script `medicion/pasosReceta.mjs`):

  | energiaCocina | 1–3 pasos | 4–5 | 6–7 |
  |---|---|---|---|
  | bajo | 30 | 63 | 22 |
  | medio | 19 | 79 | 23 |
  | alto | 0 | 5 | 0 |

  El número de pasos apenas separa los niveles: no sirve como señal de esfuerzo. **[código]**
- Platos de dieta (`src/data/PLATOS_DIETA.js`, 47): `energia` bajo 18, medio 22 y alto 7. Pasa a `energiaCocina` en `:69`. **[código]**
- Desayunos (`src/data/DESAYUNOS.js`): tienen `tiempo` en minutos y `ficha.rapido`. Es el único sitio con minutos. **[código]**
- **Sin dato**: hay 5 platos de nivel alto en total. «Disfruto cocinando» no tiene casi nada que elegir; «no me gusta» sí, con 115 de nivel bajo.

### Propuesta (sin implementar, sin pesos)
Como `soloRapidos` de los desayunos: un **escalón de preferencia con vuelta atrás** en la cascada del walk, con una causa en el log. Si el escalón deja el hueco sin candidatos, no se aplica. El RNG solo desempata entre los que quedan.

1. **`tiempoCocina = poco`**:
   - En las comidas y cenas de lunes a viernes, preferencia «`energiaCocina` bajo». Iría después de los vetos, los topes y la no repetición (D-099.3) y antes de A/B y del RNG.
   - Los anclas de cocinar en cantidad quedan fuera: ya resuelven el poco tiempo por otro lado.
   - Causas: `tiempo_poco_prefiere_bajo` / `tiempo_poco_sin_aplicar`.
2. **`experiencia = novato`** («no me gusta cocinar»): la misma preferencia, todos los días menos el sábado libre. Si coincide con `tiempoCocina = poco`, se aplica una sola vez.
3. **`experiencia = avanzado` o `tiempoCocina = mucho`**:
   - No basta con preferir `alto`: son 5 platos y acabarían repitiéndose.
   - Alternativa sin pesos: en el fin de semana, como mucho un hueco con preferencia «`medio` o `alto`».
   - O no hacer nada y decir en la pantalla que el menú no cambia.
4. **`intermedio` / `normal`**: sin escalón (como hoy).

Riesgos que habría que medir en el banco antes de decidir nada:
- La interacción con la verdura diaria y el suelo de pescado. Por técnica, el nivel bajo es sobre todo plancha y el medio horno y guisado, así que el pescado a la plancha ganaría peso.
- La guarnición de legumbre.
- D-121 (el mismo hidrato en días seguidos).
- Las comidas cortas de proteína.

Si se implementa, hace falta una decisión en `DECISIONS.md`. Pasar `experiencia` y `tiempoCocina` al perfil reducido de engine2 (`engine2App.js:258-263`) es una línea.

## 3. Botón «Regenerar plan»

### Qué pasó **[git]**
- Se quitó en `677dd7f` (2026-10-12), por D-102 (`DECISIONS.md:4317-4331`).
- Qué hacía (`git show 677dd7f`): `handleRegenerate` llamaba a `generarPlan(profile, targetKcal, …)` con la misma semana. Después guardaba el plan, ponía `extras` a `{}` y volvía al día 0. Un plan del nutricionista no se podía regenerar (alerta).
- Por qué se quitó (D-102):
  - (a) Con la misma semana, la semilla es la misma (CLAUDE.md, regla 6): el menú salía siempre igual y el botón «parecía no hacer nada».
  - (b) Los datos de engine2 fuera de los días se perdían al recargar. Esto se arregló guardándolos en `days[0]._engine2`.
- Desde entonces, las comidas se cambian una a una («🔄 Alternativas»). El plan se rehace al cambiar el perfil, en el check-in (`OriginalPlanApp.jsx:401-415`) y al empezar semana (`:195-203`). **[código]**

### Qué costaría volver a ponerlo (estimación, no verificada)
**A. Semana entera, otro menú.** Recomendado si se recupera.
- Para que salga otro menú sin tocar la regla 6: misma semilla, entrada distinta. A `platosRecientes` se le pasan los platos de la semana anterior más los de la actual (`meta.platosSemana`). Determinista: la misma semilla y el mismo plan actual dan el mismo plan nuevo. Una segunda pulsación evitaría también los del primer regenerado solo si se acumulan; hay que decidirlo.
- Sin motor viejo:
  - Hoy `generarPlan` cae a `buildPlan` si engine2 falla (`generarPlan.js:71-72`).
  - Para el botón haría falta una opción (por ejemplo `sinReserva`) que devuelva el plan actual con un aviso en vez del motor viejo.
  - Con dieta vegetariana o vegana, la cadena de reintentos (`generarPlan.js:51-69`) vacía `platosRecientes`, y puede salir el mismo menú: habría que avisar de que no hay más platos.
- La compra:
  - La app no tiene lista semanal agregada ni nada marcado como comprado: cada comida trae su lista (`OriginalPlanApp.jsx:1528`). **[código]**
  - Regenerar reescribe todas las listas. No hay nada que reconciliar en el código, pero el usuario pierde lo que ya compró: es una decisión de producto.
- Los platos ya comidos:
  - La app no guarda qué comidas se han comido. **[código]** (no hay ningún estado de «comido» en `OriginalPlanApp.jsx`).
  - Lo único por día son los «Extras del día» (`extras`), que el antiguo `handleRegenerate` borraba.
- Esfuerzo: medio día o un día, con los tests. El handler son unas 15 líneas en la vista; la opción `sinReserva` y la unión de `platosRecientes` van en `src/plan`. **[no verificado]**

**B. Solo los días que quedan.**
- engine2 no tiene ninguna entrada para «días fijos». En `src/engine2/walk` y en `materializePlan.js` no he encontrado nada. **[código]**
- Haría falta que el walk recibiera los huecos ya servidos y los contara en:
  - D-099.3 (la especie del día de al lado);
  - el tope de pescado y el tope por especie;
  - la familia del día anterior (D-115);
  - los días de legumbre (D-117, aunque está apagada);
  - el ancla y sus sobras (D-108);
  - la pareja de crema (D-122);
  - la guarnición y D-121.
- Es un cambio del motor con decisión propia: 3–5 días con medición. **[no verificado]**
- «Ya comidos» se deduciría de la fecha: días anteriores a hoy.

**Tests mínimos (A):**
1. El plan regenerado es distinto del actual con la misma semilla, y determinista: dos llamadas dan el mismo plan, byte a byte.
2. Nunca sale `motor: 'legacy'` ni pasa por `_regenContext`. Si engine2 falla, el plan no cambia y hay aviso.
3. Respeta intolerancias, dieta, alimentos eliminados y `pescadoMaxSemana`.
4. `days[0]._engine2.platosSemanaAnterior` sigue siendo la semana anterior de verdad, no la regenerada, para que la semana siguiente no se contamine.
5. Un plan del nutricionista no se regenera.
6. Vegana, SIBO y sin pescado: aviso si no hay platos distintos.

Para B, además: los días pasados quedan idénticos byte a byte, y las reglas de la frontera (ayer frente a hoy) se cumplen.

## 4. Pregunta del pescado

### Lo que ya hay **[código] [git]**
- El motor acepta `pescadoMaxSemana` entero de 2 a 4. Si falta, vale 3. Un valor fuera de rango lanza error, y la app cae al motor viejo (`src/engine2/contracts/profile.js:75-93`; D-118.1).
- `engine2App.js:43` lo pasa al motor solo si el perfil lo trae (`:262` en la generación y `:515` en las alternativas). Ese paso a engine2App **ya está hecho**.
- D-118, en sus pendientes, lo deja para el cuestionario. Sobre el perfil sin carne ni ave dice: «Se resolverá con la pregunta del cuestionario» (`DECISIONS.md`, D-118, «Pendiente»).

### Qué haría falta
1. **Pantalla:** el paso 4 «Perfil» (`OriginalPlanApp.jsx:1189-1214`) o el 5 «Restricciones», con 4 botones: 2, 3, 4 y «Tú decides».
   - Ocultarla si no hay pescado posible: dieta vegetariana o vegana, o `intolerances` con `pescado` y `mariscos`.
   - Añadirla al «Resumen final» (`:1243`).
2. **«Tú decides» = 3:** recomiendo **no guardar el campo**, para que el perfil no traiga `pescadoMaxSemana`. Así sigue el valor por defecto del motor (3) y, si el defecto cambia, el usuario lo hereda. La otra opción es guardar 3. **Decide Javi.**
3. **Sugerencia para quien no come carne ni ave:**
   - No hay un campo «sin carne»: solo `eliminatedFoods`, texto libre (el perfil del banco elimina pollo, pavo, ternera, cerdo, conejo, jamón, lacón y guanciale; `medicion/cortasProteina.mjs:97`), o `intolerances: ['cerdo']`.
   - La detección tendría que reutilizar el filtro de `engine2App.js:175` y `:193-195`: por ejemplo, que no quede ningún plato de ave o carne en el catálogo filtrado. Hay que decidirla.
   - **«Sin límite» no existe en el contrato** (2–4). Ofrecerlo exige cambiar D-118.1 y `contracts/profile.js`. Medido: sin tope, 4,17 comidas cortas por semana; con 4 y sin D-115, 3,96; con 3, 4,21 (D-118). **Sugerir 4 cabe en el contrato actual.**
4. **Supabase:**
   - `user_data.data.profile` y `plans.profile_data` lo guardan solos: guardan el perfil entero.
   - Para `preferences` hay que añadir `pescadoMaxSemana` a la lista de `upsertPreferences` (`sdb.js:403-415`). Si no, se pierde cuando el perfil se recupera de `preferences` (`db.js:233-236`).
   - **Migración SQL:** no hace falta si `preferences.data` es `jsonb`, como usa el código. `docs/schema.sql` no tiene esa columna: confirmar el esquema real antes. **[no verificado]**
5. **Validación en la vista:** ofrecer solo 2, 3 o 4 (enteros), para no disparar el `ProfileValidationError` y la caída al motor viejo.
6. **Motor viejo:** no lo conoce. Las comidas regeneradas por el motor viejo (cuando engine2 no tiene alternativa) no respetan el tope. Hoy ya pasa igual con el valor por defecto. **[código]**
7. **Tests:**
   - Con 2, 3 y 4, `tope_pescado_semana_fijado` lleva ese tope. Sin el campo, 3.
   - `upsertPreferences` envía el campo.
   - Ida y vuelta guardar → recargar.
   - El valor guardado llega a las alternativas.
   - Con dieta vegetariana o vegana la pregunta no aparece y el campo no se envía.

   El banco no cambia: ningún perfil del banco lo trae.
- Esfuerzo: unas horas, más la decisión sobre «sin límite» y la detección de «sin carne ni ave». **[no verificado]**
