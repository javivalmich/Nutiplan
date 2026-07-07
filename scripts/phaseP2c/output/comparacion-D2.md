# Comparacion engine2 vs baseline legacy (F4-P2c-D2)

> estado clasifica OBSERVABILIDAD en engine2, no resultado de ejecucion: no_observable/needs_history/needs_engine2 nunca es error (D-025). Asimetria estructural de denominadores: legacy usa 2-5 meals/dia segun mealsPerDay del profile, engine2 usa 14 huecos fijos (7 dias x comida/cena) -- las coberturas de ambos lados NO son conmensurables entre si.

## Tabla de traduccion (profile legacy -> engine2)

| campo | analogo engine2 | motivo |
|---|---|---|
| trainingDays | fixedRole "entreno" via profile.trainingDays | Traduccion directa. Se despojan tildes (p.ej. "Miércoles" -> "Miercoles") porque DAYS_ORDER es ASCII por diseno (R7) y validateProfile compara contra ese vocabulario exacto -- no aplica la tolerancia a tildes de isSameDay. Es normalizacion de formato, no un cambio de concepto. |
| intolerances | profile.intolerances (veto de ancla y de rotativo/capricho) | Traduccion directa, sin normalizacion: el vocabulario legacy (["lactosa","gluten"]) coincide exactamente con INTOLERANCE_VALUES. |
| goal | SIN_TRADUCCION | engine2 no lee profile.goal en ningun archivo; confirmado por el test de control negativo de buildWeekArc.test.js que verifica que leer profile.goal romperia el desacoplo documentado (strategy es metadato pasivo). |
| weight | SIN_TRADUCCION | Sin referencia alguna a profile.weight en src/engine2/. |
| activity | SIN_TRADUCCION | Sin referencia alguna a profile.activity en src/engine2/. |
| hambre | SIN_TRADUCCION | engine2 no modela apetito/saciedad; no hay campo ni concepto analogo en el walk ni en el esqueleto. |
| experiencia | SIN_TRADUCCION | engine2 no modela nivel de experiencia ni "modo simple" (simpleMode del motor viejo); sin campo ni concepto analogo. |

## fat_loss_general

- seed: `baseline-fatlossgeneral10`
- engine2Profile: `{"trainingDays":[],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 11/14 | computed | no |
| repeticionTecnica | parcial | 11/14 | computed | no |
| platoCuchara | parcial | 11/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 0/0 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## definicion_saciante

- seed: `baseline-defsaciante11`
- engine2Profile: `{"trainingDays":["Lunes","Miercoles","Viernes"],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 11/14 | computed | no |
| repeticionTecnica | parcial | 11/14 | computed | no |
| platoCuchara | parcial | 11/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 1/3 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## definicion_flexible

- seed: `baseline-defflexible12`
- engine2Profile: `{"trainingDays":[],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 10/14 | computed | no |
| repeticionTecnica | parcial | 10/14 | computed | no |
| platoCuchara | parcial | 10/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 0/0 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## mantenimiento_equilibrado (base)

- seed: `baseline-mantenimiento13`
- engine2Profile: `{"trainingDays":[],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 9/14 | computed | no |
| repeticionTecnica | parcial | 9/14 | computed | no |
| platoCuchara | parcial | 9/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 0/0 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## volumen_limpio

- seed: `baseline-volumenlimpio14`
- engine2Profile: `{"trainingDays":["Lunes","Jueves"],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 12/14 | computed | no |
| repeticionTecnica | parcial | 12/14 | computed | no |
| platoCuchara | parcial | 12/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 2/2 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## volumen_agresivo

- seed: `baseline-volumenagresivo15`
- engine2Profile: `{"trainingDays":["Lunes","Martes","Jueves","Viernes"],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 9/14 | computed | no |
| repeticionTecnica | parcial | 9/14 | computed | no |
| platoCuchara | parcial | 9/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 1/4 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## mantenimiento_equilibrado + intolerancias (lactosa+gluten)

- seed: `baseline-mant-intol16`
- engine2Profile: `{"trainingDays":[],"intolerances":["lactosa","gluten"]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 0/14 | computed | no |
| repeticionTecnica | parcial | 0/14 | computed | no |
| platoCuchara | parcial | 0/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 0/0 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## mantenimiento_equilibrado + trainingDays

- seed: `baseline-mant-training17`
- engine2Profile: `{"trainingDays":["Lunes","Miercoles","Viernes"],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 11/14 | computed | no |
| repeticionTecnica | parcial | 11/14 | computed | no |
| platoCuchara | parcial | 11/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 3/3 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |

## mantenimiento_equilibrado + isSimple (experiencia novato)

- seed: `baseline-mant-simple18`
- engine2Profile: `{"trainingDays":[],"intolerances":[]}`

| submetrica | estado engine2 | cobertura engine2 | status legacy | comparable directo |
|---|---|---|---|---|
| densidadDiaria | completa | 14/14 | computed | si |
| repeticionSalsa | parcial | 12/14 | computed | no |
| repeticionTecnica | parcial | 12/14 | computed | no |
| platoCuchara | parcial | 12/14 | computed | no |
| continuidadEntrenoHidrato | parcial | 0/0 | computed | no |
| domingoReconfortante | no_observable | 0/0 | computed | no |
| diaFacilTrasElaborado | no_observable | 0/0 | computed | no |
| repeticionProteinaMismoDia | needs_history | 0/0 | needs_history | no |
| sorpresaEditorial | needs_history | 0/0 | needs_history | no |
| usoSobrasVidaUtil | needs_engine2 | 0/0 | needs_engine2 | no |
| alternanciaBatch | needs_engine2 | 0/0 | needs_engine2 | no |
| coherenciaCompraPerecederos | needs_engine2 | 0/0 | needs_engine2 | no |
