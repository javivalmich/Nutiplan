# Borrador de semillas (Fase 7)

- Escáner: scripts/fase7/escanearSemillas.mjs (versión 1)
- Fecha: 2026-10-06T10:51:58.533Z
- HEAD: 289d90d833bb4219707fbb3b18d31fdba0e4ebca
- Perímetro: commits de `git rev-list --all` (ramas locales, remotas, tags, stash)
- Primer commit: "primer commit" = el primero en el orden de `git rev-list --all --topo-order --reverse` cuyo árbol contiene el blob (no es la fecha)
- Commits: 418; blobs de texto: 615; binarios: 3; gitlinks: 0; mensajes: 418
- Exclusiones: reflog; objetos inalcanzables; contenido no versionado; blobs binarios (byte 0x00 en los primeros 8000 bytes): solo inventariados; entradas gitlink (submódulos): solo inventariadas
- Términos: seed, semilla, mulberry32(
- Clases admitidas: uso, mencion/designacion, falso_positivo, R4_sin_resolver
- Blobs con U+FFFD: e0711e98d37baa8f52c05861293c3dadce29c4f0 (scripts/fase7/escanearSemillas.mjs)
- Refs (83):
  - refs/heads/chore/cierre-f2-deudas-auditoria 6866a86574b482e5f7e1d72d3682b47bab3bb063
  - refs/heads/diag-martes-cena ba387eba13c0cbf19fb342a6ded6ce55cc74833b
  - refs/heads/docs/asientos-d030-d031 ea7e8cf1d8b9f7c59dc3147de9b53a8ee58c1501
  - refs/heads/docs/auditoria-registro 6a439271afca919ab741c3471cafc942cc99c45c
  - refs/heads/docs/d036-d038-wiring-fuenteEditorial b8a4170bd6beb1efa663256687a012d2f272bbd2
  - refs/heads/docs/r0-productores-corpus-cegado 0e4737f94240564e4c2f52cdd2b1dec634335800
  - refs/heads/editorial-s2-0-retirada-guard-alcance 61ebfc67469ae5d6b80fb72411c2b792a7ade764
  - refs/heads/export-anotacion-cocinero 2de42e7927bee9f73d3db0835ba17afc53edc1e9
  - refs/heads/f2-b2-curaduria fa7d68f8f050fc5f11b07b4ab41bb23d14a6e3ae
  - refs/heads/f2-paso0-fontaneria 9df9a1a45c944402aeb0c5568f77ba722b1c423d
  - refs/heads/fase-0-red-seguridad bcf8e3a8e248b319daade87d94186d162c04306b
  - refs/heads/fase-0.5-metricas-humanas c2b07f45419bb1519710ecc32844f934b28c2b0c
  - refs/heads/fase-1-bugs-motor-viejo 2dae595a785954dfe2fc89e0b4ddfb8efacf5894
  - refs/heads/fase-3-skeleton e2040c8b594210fcd5b53e79d6247f6e6549da30
  - refs/heads/fase-4-p2c-d2-medicion-comparativa 87252572c38d16861de717826a1bddd6d306710f
  - refs/heads/fase-7-escaner-semillas bfdb57417736ac5e7e406c51913f5ac2d41f261a
  - refs/heads/fase-7-ventana-2001 dad19cc6342f0835f0fae8e2b8ab3fe1bc3b78bd
  - refs/heads/fase-curaduria-platetype-enum d6bf786bf6fb1da72d514dec36106f52ad9c1724
  - refs/heads/fase-curaduria-platetype-enum-24 2de42e7927bee9f73d3db0835ba17afc53edc1e9
  - refs/heads/fase-editorial-d1-asiento-d028 46f264cfd773a89d6aa1a16b1511600265397553
  - refs/heads/fase-editorial-d2-generador-reproducible 451f6110ca4b1c3c855787155613e23a342ebfca
  - refs/heads/fase-editorial-d3-ingesta db7201fe9a0a0ffbd6d1602b62c55b988136798b
  - refs/heads/fase-editorial-d4-asiento-d029 7da3378aedb921c65a2b920cf80f0219bffc6d1a
  - refs/heads/fase-editorial-d6-ingesta-real 2c5d4bb5d25f99163bba3d7b39e9ddee92b7aa43
  - refs/heads/feat/weekly-veg-count cb747659080adc50820925e0d51df2e780b0d6d4
  - refs/heads/feature/f4-p0-infra 683f13842dc06270363b4aebc5b4cf70c66a25c1
  - refs/heads/feature/f4-p1a-expansion 3e6ef90ebf1a3bfa5d845e7864ef83ad7d61d107
  - refs/heads/feature/f4-p1b-seleccion d1fcd5094e18c3c57073079e0fbe06fde8ab7544
  - refs/heads/feature/f4-p2a-composicion 25729db9876de1bfaf00bbf4f3ff58d717074307
  - refs/heads/feature/f4-p2b-i-bis-veto-ancla acce14701a7fe6688198f4d6d4115e11df27f994
  - refs/heads/feature/f4-p2b-i-vetos-duros 48b0b81b39606ea0b89dd9f842a7b73fea204cb0
  - refs/heads/feature/f4-p2b-ii-frecuencias af8f316c17c2356f816f58990b5db30d40b73ae5
  - refs/heads/feature/f4-p2c-d1-adaptador-humanscore f7185c9c750f069fa01224fe34d1d945891f7131
  - refs/heads/feature/paso-c-promote-freeform ecab09163cdde2edc230e888fc33d7ed18bcc217
  - refs/heads/fix/guarda-id-slug-tooling 6e724e4471328bbe60cb361b88d55f7dc337a22a
  - refs/heads/fix/sync-gates-medicion 3a7849817c3d965fc3f1b9ca2d08aa04c900fdea
  - refs/heads/main 289d90d833bb4219707fbb3b18d31fdba0e4ebca
  - refs/heads/promote-anotacion-cocinero 57ee9153f969e750ad1bdd09f04fb8768ea1f413
  - refs/heads/resolver-reviewplatetype a32c8694ed565772f5d94fcaac868ba6b8031d8b
  - refs/heads/sdk-realtime 449242a54ad44edc4df713f5c945f52b88d3d629
  - refs/heads/test/f4-p2a-gluten-lactosa-cobertura f4ff4f11add9203fbc116762ebe1f2a8311d3dd1
  - refs/heads/util/hoja-anotacion 649ed348f98b476f169f021f38e93c84ddba75b0
  - refs/heads/verif/tripwires-reconciliacion 377402e55e7ea96fd08b2f67ec0caad85eb56b7a
  - refs/remotes/origin/HEAD 289d90d833bb4219707fbb3b18d31fdba0e4ebca
  - refs/remotes/origin/chore/cierre-f2-deudas-auditoria 6866a86574b482e5f7e1d72d3682b47bab3bb063
  - refs/remotes/origin/docs/decisions-d063-criterio-finalidad-p1 ad32a6ad808992ea277cac1def1274291578c98f
  - refs/remotes/origin/docs/decisions-d064-criterio-equivalencia-observables 0c874d1c1aaab07ba4a66cebc1f564425774d211
  - refs/remotes/origin/docs/enmienda-r1a-representatividad e53cca547d5b32c79f1311001cd7898d6c594b9d
  - refs/remotes/origin/docs/evidence-completitud-base-relacion-r1 deddc6e065144f339fc34433f243c501f66b4892
  - refs/remotes/origin/docs/evidence-r1a-corpus-hojas-a2 9a86b89309d22cdfead8b14691268fb39765148e
  - refs/remotes/origin/docs/evidence-relacion-artefactos-r1 55ba0404550ea4a421c8b499a4d686a1cfdb7879
  - refs/remotes/origin/editorial-s2-0-retirada-guard-alcance 61ebfc67469ae5d6b80fb72411c2b792a7ade764
  - refs/remotes/origin/editorial-s2-contrato-resolver 7ce154e9e6b67864dd02a48773c88fa0bbf6f65b
  - refs/remotes/origin/export-anotacion-cocinero 2de42e7927bee9f73d3db0835ba17afc53edc1e9
  - refs/remotes/origin/f2-paso0-fontaneria 9df9a1a45c944402aeb0c5568f77ba722b1c423d
  - refs/remotes/origin/fase-0-red-seguridad bcf8e3a8e248b319daade87d94186d162c04306b
  - refs/remotes/origin/fase-0.5-metricas-humanas c2b07f45419bb1519710ecc32844f934b28c2b0c
  - refs/remotes/origin/fase-1-bugs-motor-viejo 2dae595a785954dfe2fc89e0b4ddfb8efacf5894
  - refs/remotes/origin/fase-3-skeleton e2040c8b594210fcd5b53e79d6247f6e6549da30
  - refs/remotes/origin/fase-curaduria-platetype-enum d6bf786bf6fb1da72d514dec36106f52ad9c1724
  - refs/remotes/origin/fase-editorial-d1-asiento-d028 46f264cfd773a89d6aa1a16b1511600265397553
  - refs/remotes/origin/fase-editorial-d2-generador-reproducible 451f6110ca4b1c3c855787155613e23a342ebfca
  - refs/remotes/origin/fase-editorial-d3-ingesta db7201fe9a0a0ffbd6d1602b62c55b988136798b
  - refs/remotes/origin/fase-editorial-d4-asiento-d029 7da3378aedb921c65a2b920cf80f0219bffc6d1a
  - refs/remotes/origin/fase-editorial-d6-ingesta-real 2c5d4bb5d25f99163bba3d7b39e9ddee92b7aa43
  - refs/remotes/origin/feat/weekly-sauce-count b46f6a0b3ee0a1b63bdcec08d58032eda7c1f448
  - refs/remotes/origin/feature/f4-p0-infra 683f13842dc06270363b4aebc5b4cf70c66a25c1
  - refs/remotes/origin/feature/f4-p1a-expansion 3e6ef90ebf1a3bfa5d845e7864ef83ad7d61d107
  - refs/remotes/origin/feature/f4-p1b-seleccion d1fcd5094e18c3c57073079e0fbe06fde8ab7544
  - refs/remotes/origin/feature/f4-p2a-composicion 25729db9876de1bfaf00bbf4f3ff58d717074307
  - refs/remotes/origin/feature/f4-p2b-i-bis-veto-ancla acce14701a7fe6688198f4d6d4115e11df27f994
  - refs/remotes/origin/feature/f4-p2b-i-vetos-duros 48b0b81b39606ea0b89dd9f842a7b73fea204cb0
  - refs/remotes/origin/feature/f4-p2b-ii-frecuencias af8f316c17c2356f816f58990b5db30d40b73ae5
  - refs/remotes/origin/feature/paso-c-promote-freeform ecab09163cdde2edc230e888fc33d7ed18bcc217
  - refs/remotes/origin/fix/guarda-id-slug-tooling 6e724e4471328bbe60cb361b88d55f7dc337a22a
  - refs/remotes/origin/fix/sync-gates-medicion 3a7849817c3d965fc3f1b9ca2d08aa04c900fdea
  - refs/remotes/origin/main 289d90d833bb4219707fbb3b18d31fdba0e4ebca
  - refs/remotes/origin/promote-anotacion-cocinero 57ee9153f969e750ad1bdd09f04fb8768ea1f413
  - refs/remotes/origin/resolver-reviewplatetype a32c8694ed565772f5d94fcaac868ba6b8031d8b
  - refs/remotes/origin/sdk-realtime 449242a54ad44edc4df713f5c945f52b88d3d629
  - refs/remotes/origin/test/f4-p2a-gluten-lactosa-cobertura f4ff4f11add9203fbc116762ebe1f2a8311d3dd1
  - refs/remotes/origin/verif/tripwires-reconciliacion 377402e55e7ea96fd08b2f67ec0caad85eb56b7a
  - refs/stash 731988d06b982fb9f0c9bf71f844f406b43b4d59
- Consulta: 2001-2010

## Recuentos por regla

| regla | grupos | ocurrencias |
|---|---|---|
| R1 | 115 | 333 |
| R2 | 76 | 237 |
| R3 | 35 | 74 |
| R4 | 616 | 3107 |

## Grupos

| id | regla | ocurrencias | valores | texto |
|---|---|---|---|---|
| G0001 | R1 | 1 | 0 | `      "evidence": "seed=0 -> indice 1 de 6 anclas catalogadas en CP2 (sin filtros)",` |
| G0002 | R1 | 1 | 0 | `      "evidence": "seed=0 -> indice 2 de 3 plantillas (A/B/C, sin filtros)",` |
| G0003 | R1 | 2 | 5 | `      ...ocurrenciasDeTexto('seed: 5\\n', { ...base, blob: 'b2', indicePrimerCommit: 1 }),` |
| G0004 | R1 | 4 | 5 | `      ...ocurrenciasDeTexto('seed: 5\\nseed: 5\\nseed: 7\\nseed: base\\n', base),` |
| G0005 | R1 | 2 | 7 | `      ...ocurrenciasDeTexto('seed: 5\\nseed: 5\\nseed: 7\\nseed: base\\n', base),` |
| G0006 | R1 | 2 | 4 | `      ...ocurrenciasDeTexto('semilla 4', { origen: 'mensaje', blob: null, commit: 'c1', rutas: null, primerCommit: null, indicePrimerCommit: 0 }),` |
| G0007 | R1 | 2 | 5 | `      [2, [5], 'seed: 5'],` |
| G0008 | R1 | 2 | 5 | `      [3, [5], 'seed: 5 seed: 6'],` |
| G0009 | R1 | 2 | 6 | `      [3, [5], 'seed: 5 seed: 6'],` |
| G0010 | R1 | 2 | 5 | `      [3, [6], 'seed: 5 seed: 6'],` |
| G0011 | R1 | 2 | 6 | `      [3, [6], 'seed: 5 seed: 6'],` |
| G0012 | R1 | 8 | 0 | `      const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });` |
| G0013 | R1 | 4 | 3 | `      seed: 3,` |
| G0014 | R1 | 4 | 7 | `      seed: 7,` |
| G0015 | R1 | 1 | 0 | `    // real que observar. FIXTURE_INPUT (seed=0) no la produce para este` |
| G0016 | R1 | 1 | 1 | `    // seed=1 (mismo profile/strategy): buildWeekArc produce leftoverDays no` |
| G0017 | R1 | 2 | 5 | `    ['  --seed 5', 5],` |
| G0018 | R1 | 2 | 9 | `    ['const seed=9;', 9],` |
| G0019 | R1 | 2 | 5 | `    ['seed: 5', 5],` |
| G0020 | R1 | 2 | 5 | `    ['semilla 5', 5],` |
| G0021 | R1 | 2 | 8 | `    ['{ "seed": 8 }', 8],` |
| G0022 | R1 | 1 | 12345 | `    console.log('  seed=12345, profile mantenimiento_equilibrado, kcal=2000\\n');` |
| G0023 | R1 | 1 | 1 | `    const SEED = 1;` |
| G0024 | R1 | 2 | 4 | `    const g = agrupar(ocurrenciasDeTexto('seed 3-9 seed 4\\n', base));` |
| G0025 | R1 | 2 | 5 | `    const g5 = g.find((x) => x.clave.texto === 'seed: 5');` |
| G0026 | R1 | 4 | 5 | `    const o = ocurrenciasDeTexto('x\\r\\nseed: 5\\r\\nseed: 5 seed: 6\\n', base);` |
| G0027 | R1 | 2 | 6 | `    const o = ocurrenciasDeTexto('x\\r\\nseed: 5\\r\\nseed: 5 seed: 6\\n', base);` |
| G0028 | R1 | 1 | 1 | `    const planConRepeticion = materializePlan({ ...FIXTURE_INPUT, seed: 1, catalog });` |
| G0029 | R1 | 2 | 90 | `    const r = analizarLinea('for (let seed = 90; seed >= 1; seed--)');` |
| G0030 | R1 | 1 | 42 | `    const r1 = expandWeekArc({ weekArc, catalog, seed: 42 });` |
| G0031 | R1 | 4 | 42 | `    const r1 = runWalk({ weekArc, catalog, seed: 42 });` |
| G0032 | R1 | 4 | 99 | `    const r1 = runWalk({ weekArc, catalog: catalogBajo, seed: 99 });` |
| G0033 | R1 | 1 | 42 | `    const r2 = expandWeekArc({ weekArc, catalog, seed: 42 });` |
| G0034 | R1 | 4 | 42 | `    const r2 = runWalk({ weekArc, catalog, seed: 42 });` |
| G0035 | R1 | 4 | 99 | `    const r2 = runWalk({ weekArc, catalog: catalogAlto, seed: 99 });` |
| G0036 | R1 | 1 | 11 | `    const seed = 11;` |
| G0037 | R1 | 1 | 7 | `    const seed = 7;` |
| G0038 | R1 | 1 | 1 | `    const { decisionLog } = expandWeekArc({ weekArc, catalog, seed: 1 });` |
| G0039 | R1 | 8 | 0 | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 0 });` |
| G0040 | R1 | 4 | 3 | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 3 });` |
| G0041 | R1 | 4 | 3 | `    const { slots } = runWalk({ weekArc, catalog, seed: 3 });` |
| G0042 | R1 | 4 | 7 | `    const { slots } = runWalk({ weekArc, catalog, seed: 7 });` |
| G0043 | R1 | 4 | 0 | `    const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });` |
| G0044 | R1 | 4 | 42 | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Lunes'] }, seed: 42, strategy: 'volumen_limpio' });` |
| G0045 | R1 | 8 | 0 | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 0, strategy: 'x' });` |
| G0046 | R1 | 4 | 5 | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 5, strategy: 'x' });` |
| G0047 | R1 | 3 | 0 | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: [], intolerances: ['lactosa'] }, seed: 0, strategy: 'x' });` |
| G0048 | R1 | 5 | 0 | `    const { weekArc, decisionLog } = buildWeekArc({ profile: fixture.profile, seed: 0, strategy: fixture.expectedStrategy });` |
| G0049 | R1 | 1 | 0 | `    específicamente para §4.2.5, porque seed=0 no produce repetición de plato observable.` |
| G0050 | R1 | 2 | 0 | `    específicamente para §4.2.5. Causa: con seed=0, `buildWeekArc` no produce `leftoverDays`` |
| G0051 | R1 | 4 | 5 | `    expect(() => runWalk({ weekArc, catalog, seed: 5, memoryStore })).not.toThrow();` |
| G0052 | R1 | 2 | 7 | `    expect(R('mulberry32(7)')).toEqual(['R1', [7]]);` |
| G0053 | R1 | 2 | -4 | `    expect(R('seed: -4')).toEqual(['R1', [-4]]);` |
| G0054 | R1 | 2 | 5 | `    expect(R('semilla 5.')).toEqual(['R1', [5]]);` |
| G0055 | R1 | 2 | 5 | `    expect(parteI).not.toMatch(/seed: 5/);` |
| G0056 | R1 | 1 | 12345 | `    hdr('STAGE 1 — ESTRUCTURA DEL OUTPUT (seed 12345)');` |
| G0057 | R1 | 1 | 1 | `    hdr(`STAGE 2 — DISTRIBUCIÓN + ENTROPÍA \| N=${N} semanas \| seeds 1..${N}`);` |
| G0058 | R1 | 8 | 0 | `    seed: 0,` |
| G0059 | R1 | 1 | 42 | `    seed: 42,` |
| G0060 | R1 | 2 | 0 | `    seed=0 generó 0 ocurrencias de `dish.id` repetido en las 14 posiciones. seed=1, con el` |
| G0061 | R1 | 2 | 1 | `    seed=0 generó 0 ocurrencias de `dish.id` repetido en las 14 posiciones. seed=1, con el` |
| G0062 | R1 | 2 | 1 | `   (seed=1) para exhibir el fenómeno que la cláusula exige poder observar.` |
| G0063 | R1 | 2 | 0 | `  "evidence": "seed=0 -> indice 2 de 3 plantillas (A/B/C, sin filtros)",` |
| G0064 | R1 | 3 | 0 | `  - **seed=0** (la seed literal de `FIXTURE_INPUT`): generación primaria, usada para §4.1,` |
| G0065 | R1 | 3 | 1 | `  - **seed=1** (mismo profile/strategy, seed alternativa): generación adicional, usada` |
| G0066 | R1 | 1 | 0 | `  // seed=0 (mismo fixture que buildWeekArc.test.js): skeletonId="C",` |
| G0067 | R1 | 3 | 0 | `  // seed=0 verificado (CP3B): con este perfil resuelve skeletonId="C". El` |
| G0068 | R1 | 1 | 3 | `  // seed=3: dishB (ambos) resuelve su ancla a "comida" en Miercoles, y su` |
| G0069 | R1 | 1 | 0 | `  `profile.trainingDays = ['Lunes','Miercoles','Viernes']`, `seed: 0`,` |
| G0070 | R1 | 1 | 123456 | `  `src/engine/tests/buildPlan.snapshot.test.js:16-55` [V]: `SEED = 123456` (:16),` |
| G0071 | R1 | 4 | 0 | `  const p1a = expandWeekArc({ weekArc, catalog, seed: 0 });` |
| G0072 | R1 | 1 | 0 | `  const { slots } = expandWeekArc({ weekArc, catalog, seed: 0 });` |
| G0073 | R1 | 1 | 3 | `  const { slots, decisionLog } = expandWeekArc({ weekArc, catalog, seed: 3 });` |
| G0074 | R1 | 4 | 0 | `  const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 0 });` |
| G0075 | R1 | 2 | 5 | `  escribir('a.txt', 'seed: 5\\nhola\\n');` |
| G0076 | R1 | 2 | 6 | `  escribir('a.txt', 'seed: 6\\nhola\\n'); // blob modificado` |
| G0077 | R1 | 3 | 0 | `  it('DEFAULT_WEEKLY_TARGETS ratificado (D-024) se consume de verdad: sobre catalogo real (seed=0), al menos un hueco es intervenido por paso 4', () => {` |
| G0078 | R1 | 2 | 7 | `  it('el 32 de mulberry32 no es LIT; mulberry32(7) es R1', () => {` |
| G0079 | R1 | 3 | 0 | `  it('f12: ninguna entrada de relleno lleva una clausula "paso 4:" vacia o malformada (catalogo real, seed 0)', () => {` |
| G0080 | R1 | 2 | 1 | `  it('para este fixture, las semillas 1 y 2 producen salidas distintas', () => {` |
| G0081 | R1 | 2 | 123456 | `  it('produces stable result.days with seed 123456', () => {` |
| G0082 | R1 | 1 | 1 | `  it('seed=1: la frecuencia máxima de verdura primaria decrece y es <=2', () => {` |
| G0083 | R1 | 2 | 123 | `  it('sensitivity — seed 123 vs seed 456 produce different result.days', () => {` |
| G0084 | R1 | 2 | 456 | `  it('sensitivity — seed 123 vs seed 456 produce different result.days', () => {` |
| G0085 | R1 | 1 | 0 | `  it('sobre los 9 perfiles del baseline x A/B/C (seed=0): aparecen ancla, rotativo Y capricho', () => {` |
| G0086 | R1 | 2 | 123456 | `  it('stability — two runs with seed 123456 are byte-identical', () => {` |
| G0087 | R1 | 2 | 0 | `  seed: 0,` |
| G0088 | R1 | 3 | 0 | `  seed: 0, // o 1, ver arriba` |
| G0089 | R1 | 2 | 7 | `  sha.c1 = commit('inicial\\n\\nusa semilla 7 aqui');` |
| G0090 | R1 | 2 | 0 | `(D-047). Ejemplo, `days[0]` (seed=0):` |
| G0091 | R1 | 2 | 1 | `**Veredicto: conforme, verificado con seed=1 (ver §1 para la causa de la elección de seed).**` |
| G0092 | R1 | 2 | 0 | `- seed=0: `549b67f1af233b9a5e12401388091b474da8aa9d60f7457aa91635ccf225d1c0`` |
| G0093 | R1 | 2 | 1 | `- seed=1: `bf1aa25d561019ec83c44677f698868d129ff0e83e43958f75108721056a11c2`` |
| G0094 | R1 | 1 | 123456 | `//     (SEED=123456, PROFILE, TARGET_KCAL=2000, BASE_OPTS, funcion run()).` |
| G0095 | R1 | 1 | 0 | `1. La posible unificación futura del punto inicial del rango de semillas (0 vs. 1) queda registrada como candidata a revisión, hoy deliberadamente no normada (§5.5).` |
| G0096 | R1 | 2 | 0 | `1. §4.2.5 no queda verificada por la entrada primaria (seed=0); requirió una segunda generación` |
| G0097 | R1 | 33 | 0 | `2. §4.2.5 verificada bajo seed con repetición. La identidad entre dos ocurrencias del mismo plato se verificó por observación (igualdad de contenido, sin ejecutar motor), pero requirió `seed=1` porque la seed primaria del fixture (`seed=0`) no produce `leftoverDays` y por tanto no exhibe repetición  …[TRUNCADO]` |
| G0098 | R1 | 33 | 1 | `2. §4.2.5 verificada bajo seed con repetición. La identidad entre dos ocurrencias del mismo plato se verificó por observación (igualdad de contenido, sin ejecutar motor), pero requirió `seed=1` porque la seed primaria del fixture (`seed=0`) no produce `leftoverDays` y por tanto no exhibe repetición  …[TRUNCADO]` |
| G0099 | R1 | 1 | 123456 | `Adds a deterministic snapshot test for buildPlan using mulberry32(123456)` |
| G0100 | R1 | 2 | 0 | `Con seed=0, el objeto generado no contiene ninguna repetición de `dish.id` entre las 14` |
| G0101 | R1 | 2 | 1 | `Con seed=1 (mismo profile/strategy), el objeto generado sí contiene una recurrencia real:` |
| G0102 | R1 | 2 | 0 | `El objeto generado (seed=0) expone exactamente las claves del contrato, más `decisionLog`:` |
| G0103 | R1 | 2 | 0 | `Verificado sobre el objeto generado (seed=0), sin `QA_TRACE` activo en esta generación:` |
| G0104 | R1 | 1 | 0 | `const SEED = 0;` |
| G0105 | R1 | 3 | 123456 | `const SEED = 123456;` |
| G0106 | R1 | 2 | 0 | `disparada). Verificación sobre el objeto de seed=0:` |
| G0107 | R1 | 4 | 123456 | `exports[`buildPlan — golden snapshot (seeded) > produces stable result.days with seed 123456 1`] = `` |
| G0108 | R1 | 2 | 0 | `raíz del repositorio (HEAD `569fc1c`), con `seed: 0` y `seed: 1` respectivamente, y comparando` |
| G0109 | R1 | 2 | 1 | `raíz del repositorio (HEAD `569fc1c`), con `seed: 0` y `seed: 1` respectivamente, y comparando` |
| G0110 | R1 | 2 | 0 | `\| Corrida \| seed=0 \| seed=1 \|` |
| G0111 | R1 | 2 | 1 | `\| Corrida \| seed=0 \| seed=1 \|` |
| G0112 | R1 | 2 | 0 | `\| §4.2.5 \| Conforme (requirió seed=1; seed=0 no exhibe repetición) \|` |
| G0113 | R1 | 2 | 1 | `\| §4.2.5 \| Conforme (requirió seed=1; seed=0 no exhibe repetición) \|` |
| G0114 | R1 | 1 | 1 | `\| §6 ítem 3 (`:55`) \| Reproducible y auditable, sin relajar respecto a v1 \| `blind.test.js` (determinismo byte a byte, semillas 1 y 2, serialización LF sin BOM); §3 de este documento \|` |
| G0115 | R1 | 1 | 1 | `\| Ítem 3 (`:55`) \| Reproducible y auditable: misma entrada y semilla dan salida idéntica byte a byte; serialización fija (LF, sin BOM); semilla declarada en la clave; doble ejecución con aborto en el runner; código versionado con blob \| `blind.test.js` (determinismo, semillas 1 y 2 sobre el fixture, …[TRUNCADO]` |
| G0116 | R2 | 4 | 0, 499 | `        for (let seed = 0; seed < 500 && seedQueEligeEstaAncla === null; seed++) {` |
| G0117 | R2 | 9 | 0, 499 | `      for (let seed = 0; seed < 500 && !found; seed++) {` |
| G0118 | R2 | 28 | 1, 2 | `      recipe:["Vierte el muesli en un bol.","Añade el yogur.","Trocea la fruta y coloca encima.","Añade los frutos secos."+(noNuts?" Sustituye por semillas de lino":""),"Deja reposar 1-2 min para que el muesli se ablande ligeramente."],` |
| G0119 | R2 | 2 | 3, 9 | `    ['seed 3-9'],` |
| G0120 | R2 | 2 | 3, 9 | `    ['seed 3..9'],` |
| G0121 | R2 | 2 | 3, 9 | `    ['seed 3–9'],` |
| G0122 | R2 | 2 | 3, 9 | `    ['seeds 3–9.'],` |
| G0123 | R2 | 2 | 3, 9 | `    ['semilla 3 a 9'],` |
| G0124 | R2 | 2 | 1, 49 | `    const c = una('for (let seed = 1; seed < 50; seed++) {');` |
| G0125 | R2 | 2 | 2, 7 | `    const c = una('for (var seed = 2; seed <= 7; seed++)');` |
| G0126 | R2 | 2 | 9, 3 | `    const c = una('seed 9-3');` |
| G0127 | R2 | 2 | 3, 9 | `    const g = agrupar(ocurrenciasDeTexto('seed 3-9 seed 4\\n', base));` |
| G0128 | R2 | 2 | 1, 49 | `    expect(analizarLinea('for (let seed = 1; seed < 50; seed++)').coincidencias).toHaveLength(1);` |
| G0129 | R2 | 2 | 3, 9 | `    expect(analizarLinea('semilla 3 a 9').coincidencias).toHaveLength(1);` |
| G0130 | R2 | 3 | 0, 99 | `    for (let seed = 0; seed < 100; seed++) {` |
| G0131 | R2 | 3 | 0, 199 | `    for (let seed = 0; seed < 200 && !vetadoElegidoAlgunaVez; seed++) {` |
| G0132 | R2 | 3 | 0, 1999 | `    for (let seed = 0; seed < 2000 && !seedCrema; seed++) {` |
| G0133 | R2 | 3 | 0, 1999 | `    for (let seed = 0; seed < 2000 && (!seedCrema \|\| !seedGuiso); seed++) {` |
| G0134 | R2 | 9 | 0, 199 | `    for (let seed = 0; seed < 200; seed++) {` |
| G0135 | R2 | 5 | 0, 19 | `    for (let seed = 0; seed < 20; seed++) {` |
| G0136 | R2 | 1 | 0, 49 | `    for (let seed = 0; seed < 50 && seedA === null; seed++) {` |
| G0137 | R2 | 2 | 0, 499 | `    for (let seed = 0; seed < 500 && !seedCrema; seed++) {` |
| G0138 | R2 | 2 | 0, 499 | `    for (let seed = 0; seed < 500 && (!seedCrema \|\| !seedGuiso); seed++) {` |
| G0139 | R2 | 3 | 0, 49 | `    for (let seed = 0; seed < 50; seed++) {` |
| G0140 | R2 | 1 | 0, 4 | `    for (let seed = 0; seed < 5; seed++) {` |
| G0141 | R2 | 7 | 0, 7 | `    for (let seed = 0; seed < 8; seed++) {` |
| G0142 | R2 | 35 | 1, 500 | `    generalizó), §5.5 (semillas 1..500 con punto inicial explícito),` |
| G0143 | R2 | 2 | 32, 1 | `    throw new BlindError('seed: debe ser un entero en [0, 2^32 - 1]');` |
| G0144 | R2 | 1 | 36, 42 | `  `saveMealMemory: vi.fn()` (:36-42), invocacion `run(seed)` (:49-55) que pasa` |
| G0145 | R2 | 1 | 49, 55 | `  `saveMealMemory: vi.fn()` (:36-42), invocacion `run(seed)` (:49-55) que pasa` |
| G0146 | R2 | 1 | 16, 55 | `  `src/engine/tests/buildPlan.snapshot.test.js:16-55` [V]: `SEED = 123456` (:16),` |
| G0147 | R2 | 2 | 1, 49 | `  escribir('o.txt', 'for (let seed = 1; seed < 50; i++)\\nseed: base + i\\n');` |
| G0148 | R2 | 1 | 1001, 1010 | `  it('20 casos: 2 perfiles × semillas 1001–1010', () => {` |
| G0149 | R2 | 1 | 2001, 2010 | `  it('20 casos: 2 perfiles × semillas 2001–2010', () => {` |
| G0150 | R2 | 2 | 32, 1 | ` * @param {number} seed entero en [0, 2^32 - 1]` |
| G0151 | R2 | 1 | 0, 499 | `"Semillas \| 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`)" — baseline-variedad-verdura.md:24` |
| G0152 | R2 | 1 | 1, 500 | `"Semillas \| 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`)" — baseline-variedad-verdura.md:24` |
| G0153 | R2 | 1 | 2026, 10 | `## D-088 — [2026-10-06] Ventana de semillas de la primera Fase 7 (enmienda de D-087, punto 5)` |
| G0154 | R2 | 1 | 24, 33 | `**Nota de precisión sobre el alcance normativo de "auto":** el texto normativo de D-075 (`:3323`) nombra explícitamente, como contenido de ii-auto, únicamente el tamaño de muestra N: *"El tamaño de muestra N (§5.6 del protocolo) es el caso limpio: cuenta iteraciones semanales sin invocar la colecció …[TRUNCADO]` |
| G0155 | R2 | 1 | 37, 38 | `**Nota de precisión sobre el alcance normativo de "auto":** el texto normativo de D-075 (`:3323`) nombra explícitamente, como contenido de ii-auto, únicamente el tamaño de muestra N: *"El tamaño de muestra N (§5.6 del protocolo) es el caso limpio: cuenta iteraciones semanales sin invocar la colecció …[TRUNCADO]` |
| G0156 | R2 | 1 | 0, 999 | `- Muestreo: `for (let seed = 0; seed < 1000; seed++) {` (stage2a_n1000.mjs:39), `buildPlan(...)` una vez por iteración (stage2a_n1000.mjs:45-46).` |
| G0157 | R2 | 1 | 45, 46 | `- Muestreo: `for (let seed = 0; seed < 1000; seed++) {` (stage2a_n1000.mjs:39), `buildPlan(...)` una vez por iteración (stage2a_n1000.mjs:45-46).` |
| G0158 | R2 | 29 | 40, 49 | `- Reproducibilidad: determinismo, doble ancla, ancla a commit, cifras citables, semillas contiguas, N explícito, PRNG determinista idéntico entre objetos de una misma comparación, nivel de agregación declarado (`protocolo-evaluacion.md:40-49`, §5.1-§5.8).` |
| G0159 | R2 | 2 | 1, 500 | `- Semillas 1..500, en ese orden, una semana por semilla.` |
| G0160 | R2 | 1 | 0, 999 | `- Unidad de muestreo: bucle exterior `for (let seed = 0; seed < 1000; seed++) {` (baseline_n1000.mjs:35), una llamada a `buildPlan(...)` por iteración con `rng: mulberry32(seed)` nuevo (baseline_n1000.mjs:41-42) — cada iteración es una semana.` |
| G0161 | R2 | 1 | 41, 42 | `- Unidad de muestreo: bucle exterior `for (let seed = 0; seed < 1000; seed++) {` (baseline_n1000.mjs:35), una llamada a `buildPlan(...)` por iteración con `rng: mulberry32(seed)` nuevo (baseline_n1000.mjs:41-42) — cada iteración es una semana.` |
| G0162 | R2 | 1 | 2001, 2010 | `- `SEMILLAS_EVALUACION` pasa a 2001–2010. Se actualizan el título y la aserción del test de definición, la aserción que usa un miembro de la ventana y los comentarios que documentan la ventana. Los datos de prueba del validador que usan 1001 no se modifican.` |
| G0163 | R2 | 1 | 1001, 1010 | `// Tests de las reglas puras del escáner de semillas. Ningún fixture usa enteros 1001-1010.` |
| G0164 | R2 | 1 | 2001, 2010 | `// Tests de las reglas puras del escáner de semillas. Ningún fixture usa enteros 2001-2010.` |
| G0165 | R2 | 1 | 1, 500 | `// campaña ancha de D-042 (N=500, semillas 1..500), ahora con el mecanismo` |
| G0166 | R2 | 1 | 1001, 1010 | `3. Aplicada sobre U (consolidación reproducida por el titular; resultado sha256 `485ceda6…3ec9`), 1001–1010 interseca U y 2001–2010 no. Las semillas de evaluación pasan a ser 2001–2010: contiguas, con punto inicial declarado (protocolo §5.5).` |
| G0167 | R2 | 2 | 2001, 2010 | `3. Aplicada sobre U (consolidación reproducida por el titular; resultado sha256 `485ceda6…3ec9`), 1001–1010 interseca U y 2001–2010 no. Las semillas de evaluación pasan a ser 2001–2010: contiguas, con punto inicial declarado (protocolo §5.5).` |
| G0168 | R2 | 2 | 1001, 1010 | `5. Casos. 2 perfiles × 10 semillas, con la misma estrategia y el mismo caso para ambos motores. Semillas contiguas 1001–1010, con punto inicial declarado (protocolo §5.5), condicionadas a que se acredite que no se han usado antes; la acreditación se registra con el generador de casos. Los perfiles y …[TRUNCADO]` |
| G0169 | R2 | 2 | 0, 1999 | `D-087 (punto 5) condicionó las semillas 1001–1010 a acreditar que no se habían usado antes. La revisión del registro de semillas sobre el borrador del escáner en `2aa1157` (829 grupos; borrador sha256 `dd01bbee…8c9d`) encontró dos bucles de test con corte temprano en `src/engine2/skeleton/tests/buil …[TRUNCADO]` |
| G0170 | R2 | 2 | 1001, 1010 | `D-087 (punto 5) condicionó las semillas 1001–1010 a acreditar que no se habían usado antes. La revisión del registro de semillas sobre el borrador del escáner en `2aa1157` (829 grupos; borrador sha256 `dd01bbee…8c9d`) encontró dos bucles de test con corte temprano en `src/engine2/skeleton/tests/buil …[TRUNCADO]` |
| G0171 | R2 | 1 | 2001, 2010 | `D-088: ventana de semillas de Fase 7 pasa a 2001-2010 (enmienda de D-087)` |
| G0172 | R2 | 1 | 1, 500 | `Evidencia mayoritaria (seed = i + 1, rango 1..N): `analysis/gate2_measure.test.js:236-237`, `analysis/gate4_veg_baseline.test.js:97-98`, `analysis/gate4_closure.test.js:78-79`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:24` ("Semillas 1..500 ... seed = i + 1").` |
| G0173 | R2 | 1 | 236, 237 | `Evidencia mayoritaria (seed = i + 1, rango 1..N): `analysis/gate2_measure.test.js:236-237`, `analysis/gate4_veg_baseline.test.js:97-98`, `analysis/gate4_closure.test.js:78-79`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:24` ("Semillas 1..500 ... seed = i + 1").` |
| G0174 | R2 | 1 | 78, 79 | `Evidencia mayoritaria (seed = i + 1, rango 1..N): `analysis/gate2_measure.test.js:236-237`, `analysis/gate4_veg_baseline.test.js:97-98`, `analysis/gate4_closure.test.js:78-79`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:24` ("Semillas 1..500 ... seed = i + 1").` |
| G0175 | R2 | 1 | 97, 98 | `Evidencia mayoritaria (seed = i + 1, rango 1..N): `analysis/gate2_measure.test.js:236-237`, `analysis/gate4_veg_baseline.test.js:97-98`, `analysis/gate4_closure.test.js:78-79`, `docs/evidence/variedad-verdura/baseline-variedad-verdura.md:24` ("Semillas 1..500 ... seed = i + 1").` |
| G0176 | R2 | 1 | 10, 18 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0177 | R2 | 1 | 12, 20 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0178 | R2 | 1 | 13, 21 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0179 | R2 | 2 | 15, 23 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0180 | R2 | 3 | 3, 11 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0181 | R2 | 1 | 4, 12 | `Evidencia: `analysis/baseline_n1000.mjs:3-11`, `analysis/phase2_measure.mjs:3-11`, `analysis/gate2_measure.test.js:15-23`, `analysis/gate2b_measure.test.js:13-21`, `analysis/gate4_veg_baseline.test.js:10-18`, `analysis/gate4_closure.test.js:15-23`, `analysis/gate4_seed1_check.test.js:3-11`, `analysi …[TRUNCADO]` |
| G0182 | R2 | 2 | 1, 500 | `Idénticos a la campaña anclada (mismo PROFILE, N=500, semillas 1..500,` |
| G0183 | R2 | 2 | 1, 500 | `Idénticos a los runners anclados (mismo PROFILE, N=500, semillas 1..500,` |
| G0184 | R2 | 1 | 2001, 2010 | `Merge D-088: ventana de semillas 2001-2010` |
| G0185 | R2 | 2 | 0, 999 | `Variante divergente: `analysis/baseline_n1000.mjs:35` y `analysis/stage2a_n1000.mjs:39` usan `for (let seed = 0; seed < 1000; seed++)` — rango 0..999, sin el offset +1. La invariante real es "rango secuencial fijo, documentado" — el punto de partida (0 vs 1) no está unificado entre campañas.` |
| G0186 | R2 | 1 | 116, 118 | ``docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` — este artefacto no ejecuta una campaña multi-semilla: es la verificación estructural de un único objeto de plan (`weekNumber: 13`, 2026-07-18-legacy-conformidad-v1.0.md:21). La palabra "semana" no aparece en ningún punto de este  …[TRUNCADO]` |
| G0187 | R2 | 4 | 2026, 7 | ``docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` — este artefacto no ejecuta una campaña multi-semilla: es la verificación estructural de un único objeto de plan (`weekNumber: 13`, 2026-07-18-legacy-conformidad-v1.0.md:21). La palabra "semana" no aparece en ningún punto de este  …[TRUNCADO]` |
| G0188 | R2 | 1 | 1116, 1144 | `\| D-026 (`:1116-1144`) \| `:1134` \| "reproducibilidad por seed" — determinismo de artefactos de medición F4-P2c, anterior a la existencia de ii-auto. \|` |
| G0189 | R2 | 2 | 1, 500 | `\| Semillas \| 1..500 (`seed = i + 1`) \|` |
| G0190 | R2 | 2 | 0, 499 | `\| Semillas \| 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`) \|` |
| G0191 | R2 | 2 | 1, 500 | `\| Semillas \| 1..500 (una semana por semilla, `seed = i + 1` para `i` en `0..499`) \|` |
| G0192 | R3 | 4 | 0 | `          if (weekArc.anchors[0].anchorId === anchor.identityKey) seedQueEligeEstaAncla = seed;` |
| G0193 | R3 | 2 | 5 | `      [2, [5], 'seed: 5'],` |
| G0194 | R3 | 2 | 5 | `      [3, [5], 'seed: 5 seed: 6'],` |
| G0195 | R3 | 2 | 6 | `      [3, [6], 'seed: 5 seed: 6'],` |
| G0196 | R3 | 3 | 0 | `      expect(resultados[0].weekArc.skeletonId, `seed=${seed} deberia resolver a ${skeletonEsperado}`).toBe(skeletonEsperado);` |
| G0197 | R3 | 1 | 0, 1, 2, 7 | `      for (const seed of [0, 1, 2, 7]) { // seeds que cubren las 3 plantillas (ver CP3B)` |
| G0198 | R3 | 2 | 0 | `      if (weekArc.anchors[0].anchorId === crema.identityKey) seedCrema = seed;` |
| G0199 | R3 | 3 | 0 | `      if (weekArc.skeletonId === 'C' && weekArc.anchors[0].anchorId === crema.identityKey) seedCrema = seed;` |
| G0200 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], registroOk([{ desde: 1, hasta: 2 }]))).toThrow(/mal formado/);` |
| G0201 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], registroOk([{ desde: 5, hasta: 1, origen: 'x' }]))).toThrow(/mal formado/);` |
| G0202 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], undefined)).toThrow(/ausente/);` |
| G0203 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], { ...registroOk(), ancla: 'abc' })).toThrow(/ancla/);` |
| G0204 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], { ...registroOk(), completo: false })).toThrow(/completo/);` |
| G0205 | R3 | 2 | 1001 | `    expect(() => verificarSemillas([1001], { ...registroOk(), perimetro: ' ' })).toThrow(/perímetro/);` |
| G0206 | R3 | 2 | 7 | `    expect(R('mulberry32(7)')).toEqual(['R1', [7]]);` |
| G0207 | R3 | 2 | -4 | `    expect(R('seed: -4')).toEqual(['R1', [-4]]);` |
| G0208 | R3 | 4 | 2, 4, 6 | `    expect(R('seeds = [2, 4, 6]')).toEqual(['R3', [2, 4, 6]]);` |
| G0209 | R3 | 4 | 2, 4 | `    expect(R('seeds = [2, 4, ]')).toEqual(['R3', [2, 4]]);` |
| G0210 | R3 | 2 | 5 | `    expect(R('semilla 5.')).toEqual(['R1', [5]]);` |
| G0211 | R3 | 1 | 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010 | `    expect([...SEMILLAS_EVALUACION]).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);` |
| G0212 | R3 | 1 | 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 | `    expect([...SEMILLAS_EVALUACION]).toEqual([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010]);` |
| G0213 | R3 | 2 | 0 | `    expect(analizarLinea('mulberry32(x)').coincidencias[0].regla).toBe('R4');` |
| G0214 | R3 | 2 | 0 | `    expect(analizarLinea('seed5').coincidencias[0].regla).toBe('R4');` |
| G0215 | R3 | 2 | 3 | `    expect(analizarLinea('seed: base + 3').literalesNoConsumidos).toEqual([3]);` |
| G0216 | R3 | 3 | 0 | `    expect(resultados[0].weekArc.skeletonId).toBe('C'); // seed verificado` |
| G0217 | R3 | 1 | 0, 1, 2, 3, 4, 5 | `    for (const seed of [0, 1, 2, 3, 4, 5]) {` |
| G0218 | R3 | 4 | 1, 2, 3, 4, 5, 6, 7, 8 | `    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {` |
| G0219 | R3 | 1 | 1, 2, 3, 4, 5 | `    for (const seed of [1, 2, 3, 4, 5]) {` |
| G0220 | R3 | 2 | 2, 4, 6 | `  escribir('dup1.txt', 'const seeds = [2, 4, 6]\\n');` |
| G0221 | R3 | 2 | 2, 4, 6 | `  escribir('dup2.txt', 'const seeds = [2, 4, 6]\\n'); // mismo blob, otra ruta` |
| G0222 | R3 | 2 | 2, 4, 6 | `  it('seeds = [2, 4, 6]', () => {` |
| G0223 | R3 | 2 | 0 | `(D-047). Ejemplo, `days[0]` (seed=0):` |
| G0224 | R3 | 2 | 1, 2 | `const SEMILLAS_TEST = [1, 2];` |
| G0225 | R3 | 1 | 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010 | `export const SEMILLAS_EVALUACION = Object.freeze([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);` |
| G0226 | R3 | 1 | 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 | `export const SEMILLAS_EVALUACION = Object.freeze([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010]);` |
| G0227 | R4 | 6 | — | `          "Esparce las semillas por encima.",` |
| G0228 | R4 | 8 | — | `          "Mezcla el yogur con las semillas de chía.",` |
| G0229 | R4 | 6 | — | `          "Semillas de calabaza (10g)",` |
| G0230 | R4 | 8 | — | `          "Semillas de chía (20g)",` |
| G0231 | R4 | 6 | — | `          "Semillas de lino (10g)",` |
| G0232 | R4 | 4 | — | `          const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });` |
| G0233 | R4 | 1 | — | `          profile, seed, strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0234 | R4 | 1 | — | `          { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed),` |
| G0235 | R4 | 1 | — | `        "Aceite de girasol (10ml)", "Semillas de sésamo"` |
| G0236 | R4 | 1 | — | `        "Aceite de sésamo (10ml)", "Semillas de sésamo",` |
| G0237 | R4 | 1 | — | `        "Almendras crudas (10g)", "Nueces (5g)", "Semillas de chía o lino (5g)",` |
| G0238 | R4 | 1 | — | `        "Añade gochujang al gusto, aceite de sésamo y semillas. Mezcla todo antes de comer."` |
| G0239 | R4 | 1 | — | `        "Cebolleta (1)", "Semillas de sésamo tostado",` |
| G0240 | R4 | 1 | — | `        "Cebolleta (1)", "Semillas de sésamo",` |
| G0241 | R4 | 1 | — | `        "Espolvorear frutos secos picados y semillas.",` |
| G0242 | R4 | 1 | — | `        "Montar bowl: quinoa de base, sectores de pollo, garbanzos, verduras y espinacas. Aliñar con tahini y terminar con semillas."` |
| G0243 | R4 | 1 | — | `        "Pepino (1)", "Semillas de sésamo",` |
| G0244 | R4 | 1 | — | `        "Semillas de sésamo tostado",` |
| G0245 | R4 | 1 | — | `        "Semillas de sésamo y calabaza (10g)",` |
| G0246 | R4 | 1 | — | `        "Semillas de sésamo",` |
| G0247 | R4 | 1 | — | `        "Servir verduras crujientes con pollo encima, salsa y semillas de sésamo."` |
| G0248 | R4 | 1 | — | `        "Sirve con ensalada de pepino aliñada con aceite de sésamo y semillas."` |
| G0249 | R4 | 1 | — | `        "Sirve sobre el arroz con semillas de sésamo y cebolleta."` |
| G0250 | R4 | 1 | — | `        "Terminar con cebolleta, semillas de sésamo y aceite de sésamo."` |
| G0251 | R4 | 8 | — | `        "p1": "150g yogur griego 0% (125g) · 2 cdas semillas de chía · 100g frutas del bosque",` |
| G0252 | R4 | 1 | — | `        "p1": "200g bebida vegetal (180ml) · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0253 | R4 | 5 | — | `        "p1": "200g yogur griego 0% (125g) · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0254 | R4 | 6 | — | `        "title": "Yogur con semillas y fruta",` |
| G0255 | R4 | 2 | — | `        + 'ningun superviviente disponible para el sorteo por seed',` |
| G0256 | R4 | 2 | — | `        const c = generarCaso(perfil, semilla);` |
| G0257 | R4 | 1 | — | `        const seed = i + 1;` |
| G0258 | R4 | 5 | — | `        const { weekArc } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0259 | R4 | 2 | — | `        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });` |
| G0260 | R4 | 4 | — | `        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: seedQueEligeEstaAncla, strategy: fixture.expectedStrategy });` |
| G0261 | R4 | 8 | — | `        const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0262 | R4 | 4 | — | `        expect(seedQueEligeEstaAncla, `${fixture.name} nunca eligio ${anchor.identityKey} en 500 seeds`).not.toBeNull();` |
| G0263 | R4 | 4 | — | `        let seedQueEligeEstaAncla = null;` |
| G0264 | R4 | 5 | — | `        seed: fixture.userId,` |
| G0265 | R4 | 1 | — | `        throw new Error(`veg_variety_engine2_paso5: hueco colocado sin causa en decisionLog, ${slot.day}/${slot.momento} (seed=${seedIndex + 1})`);` |
| G0266 | R4 | 1 | — | `        throw new Error(`veg_variety_engine2_paso5: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (seed=${seedIndex + 1})`);` |
| G0267 | R4 | 1 | — | `        weekArc, catalog, seed, profile,` |
| G0268 | R4 | 1 | — | `      "cause": "eleccion_ancla_por_seed",` |
| G0269 | R4 | 1 | — | `      "cause": "eleccion_esqueleto_por_seed",` |
| G0270 | R4 | 1 | — | `      "seed": "baseline-defflexible12",` |
| G0271 | R4 | 1 | — | `      "seed": "baseline-defsaciante11",` |
| G0272 | R4 | 1 | — | `      "seed": "baseline-fatlossgeneral10",` |
| G0273 | R4 | 1 | — | `      "seed": "baseline-mant-intol16",` |
| G0274 | R4 | 1 | — | `      "seed": "baseline-mant-simple18",` |
| G0275 | R4 | 1 | — | `      "seed": "baseline-mant-training17",` |
| G0276 | R4 | 1 | — | `      "seed": "baseline-mantenimiento13",` |
| G0277 | R4 | 1 | — | `      "seed": "baseline-volumenagresivo15",` |
| G0278 | R4 | 1 | — | `      "seed": "baseline-volumenlimpio14",` |
| G0279 | R4 | 2 | — | `      : `seed=${JSON.stringify(seed)} -> indice ${index} de ${anchors.length} anclas catalogadas en CP2 (sin filtros)`,` |
| G0280 | R4 | 2 | — | `      ? `seed=${JSON.stringify(seed)} -> indice ${index} de ${supervivientes.length} anclas supervivientes del veto (de ${anchors.length} catalogadas)`` |
| G0281 | R4 | 38 | — | `      PDB.seedDemo();` |
| G0282 | R4 | 1 | — | `      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'capricho-fijo', strategy: 'x' })` |
| G0283 | R4 | 5 | — | `      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'seed-fija-42', strategy: 'volumen_limpio' })` |
| G0284 | R4 | 1 | — | `      console.error('seed:', seed, '\| day:', entry.day, '\| momento:', entry.momento);` |
| G0285 | R4 | 1 | — | `      console.log('\\n  No hay día wildcard en esta semana (depende del seed)');` |
| G0286 | R4 | 3 | — | `      const eleccion = decisionLog.find((d) => d.cause === 'eleccion_ancla_por_seed');` |
| G0287 | R4 | 3 | — | `      const elegido = chooseAnchor(anchorsSinteticos, seed, ['gluten'], decisionLog, getVistaSintetica);` |
| G0288 | R4 | 6 | — | `      const elegido = chooseAnchor(mezcla, seed, ['gluten'], [], getVistaSintetica);` |
| G0289 | R4 | 3 | — | `      const elegido = chooseAnchorSucio(anchorsSinteticos, seed);` |
| G0290 | R4 | 1 | — | `      const id = idPlan(g.perfilId, g.semilla, motor);` |
| G0291 | R4 | 1 | — | `      const idxEsperado = Math.floor(mulberry32(seedFromString(`${seed}::walk`))() * MOMENTOS.length);` |
| G0292 | R4 | 3 | — | `      const resultados = ESTRATEGIAS_REALES.map((strategy) => buildWeekArc({ profile: fixedProfile, seed, strategy }));` |
| G0293 | R4 | 3 | — | `      const rng = (() => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 \| s); t = (t + Math.imul(t ^ (t >>> 7), 61 \| t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` |
| G0294 | R4 | 3 | — | `      const rng = rngSucio(seedNum);` |
| G0295 | R4 | 4 | — | `      const { decisionLog } = runWalk({ weekArc, catalog, seed });` |
| G0296 | R4 | 3 | — | `      const { slots } = expandWeekArc({ weekArc, catalog, seed });` |
| G0297 | R4 | 4 | — | `      const { slots } = runWalk({ weekArc, catalog, seed });` |
| G0298 | R4 | 3 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v15-f3-${seed}` });` |
| G0299 | R4 | 1 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-${seed}` });` |
| G0300 | R4 | 1 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-control-${seed}` });` |
| G0301 | R4 | 1 | — | `      const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });` |
| G0302 | R4 | 4 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed, strategy: 'x' });` |
| G0303 | R4 | 2 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed, strategy: 'x' });` |
| G0304 | R4 | 5 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0305 | R4 | 3 | — | `      const { weekArc, decisionLog } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0306 | R4 | 1 | — | `      expect(found, `ancla #${targetIndex} nunca alcanzada en 500 seeds con fuente inyectada`).toBe(true);` |
| G0307 | R4 | 3 | — | `      expect(found, `ancla #${targetIndex} nunca alcanzada en 500 seeds sin veto`).toBe(true);` |
| G0308 | R4 | 5 | — | `      expect(found, `no se encontro seed que eligiera el ancla #${targetIndex} en 500 intentos`).not.toBeNull();` |
| G0309 | R4 | 1 | — | `      fail(`caso ${perfilId}-${semilla}: ${e instanceof CasoError ? e.message : e.stack}`);` |
| G0310 | R4 | 1 | — | `      generados.push(generarCaso(perfilId, semilla, catalog));` |
| G0311 | R4 | 5 | — | `      if (idx === ANCHORS.indexOf(crema) && !seedCrema) seedCrema = seed;` |
| G0312 | R4 | 5 | — | `      if (idx === ANCHORS.indexOf(guiso) && !seedGuiso) seedGuiso = seed;` |
| G0313 | R4 | 1 | — | `      if (weekArc.skeletonId === 'A') seedA = seed;` |
| G0314 | R4 | 2 | — | `      it(`${perfil}-${semilla}: pasa las cuatro verificaciones`, () => {` |
| G0315 | R4 | 3 | — | `      let s = seedNum >>> 0;` |
| G0316 | R4 | 1 | — | `      p1: "Yogur griego natural alto en proteína · fruta variada de temporada (fresa, plátano, kiwi, manzana) · frutos secos y semillas",` |
| G0317 | R4 | 28 | — | `      p1:"150g "+yogur+" · 2 cdas semillas de chía · 100g frutas del bosque",` |
| G0318 | R4 | 28 | — | `      p1:"200g "+yogur+" · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0319 | R4 | 1 | — | `      p2: "Salsa de soja · jengibre · ajo · aceite de sésamo · semillas de sésamo",` |
| G0320 | R4 | 1 | — | `      p2: "Salsa de tahini con limón · semillas de sésamo y de calabaza",` |
| G0321 | R4 | 1 | — | `      p2: "Salsa de yogur con curry suave · semillas de sésamo",` |
| G0322 | R4 | 1 | — | `      p2: "Semillas de sésamo · cilantro opcional · salsa sriracha",` |
| G0323 | R4 | 28 | — | `      p2:"1 cda semillas de calabaza · 1 cda coco rallado · Café o té",` |
| G0324 | R4 | 28 | — | `      p2:"1 cda semillas de calabaza · zumo de ½ limón · miel · Café",` |
| G0325 | R4 | 28 | — | `      p2:(noNuts?"15g semillas de girasol":"20g nueces o almendras")+" · Té o agua",` |
| G0326 | R4 | 28 | — | `      p2:(noNuts?"Semillas de lino (8g)":"15g almendras o nueces")+" · Café o té",` |
| G0327 | R4 | 73 | — | `      post-filtros) → v10 ROJO (`Miercoles` deja de ser consistente entre semillas: el candidato` |
| G0328 | R4 | 1 | — | `      profile, seed, strategy: 'x', fuenteEditorial,` |
| G0329 | R4 | 1 | — | `      profile, seed: 'D-038-gluten', strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0330 | R4 | 1 | — | `      profile, seed: 'D-038-lactosa', strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0331 | R4 | 28 | — | `      recipe:["Mezcla el yogur con las semillas de chía.","Deja reposar 5 minutos (o prepara la noche anterior).","Añade las frutas por encima.","Aliña con miel y canela al gusto."],` |
| G0332 | R4 | 28 | — | `      recipe:["Tritura las frutas congeladas con el yogur hasta textura espesa.","Vierte en un bol.","Decora con semillas y coco rallado.","Sirve inmediatamente — se derrite rápido."],` |
| G0333 | R4 | 28 | — | `      recipe:["Trocea las frutas en dados del mismo tamaño.","Aliña con zumo de limón y miel.","Sirve en bol con el yogur encima.","Esparce las semillas de calabaza.","Puede prepararse la noche anterior sin el yogur."],` |
| G0334 | R4 | 28 | — | `      recipe:["Vierte el yogur en un bol.","Esparce las semillas por encima.","Añade la fruta troceada.","Aliña con miel al gusto."],` |
| G0335 | R4 | 28 | — | `      return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood\|\|null, effectiveMood:dayMood, meals:_drMeals, shakeEnabled:!!_drSpec.shakeEnabledOverride};` |
| G0336 | R4 | 1 | — | `      seed,` |
| G0337 | R4 | 5 | — | `      seed: 'demo-cp3a',` |
| G0338 | R4 | 28 | — | `      shopping:["Fruta (1 ud)",(noNuts?"Semillas de girasol (15g)":"Nueces o almendras (20g)")].filter(Boolean),` |
| G0339 | R4 | 28 | — | `      shopping:["Frutas congeladas (150g)","Yogur griego 0% (100g)","Semillas de calabaza (10g)","Coco rallado (10g)"],` |
| G0340 | R4 | 28 | — | `      shopping:["Frutas frescas variadas (200g)","Yogur griego 0% (150g)","Semillas de calabaza (10g)","Limón (½ ud)","Miel (1 cda)"],` |
| G0341 | R4 | 28 | — | `      shopping:["Muesli sin azúcar ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta fresca (80g)",(noNuts?"Semillas de lino (8g)":"Almendras (15g)")].filter(Boolean),` |
| G0342 | R4 | 28 | — | `      shopping:["Yogur griego 0% (150g)","Semillas de chía (20g)","Frutas del bosque (100g)","Miel (1 cda)"],` |
| G0343 | R4 | 28 | — | `      shopping:["Yogur griego 0% (200g)","Semillas de lino (10g)","Semillas de calabaza (10g)","Fruta (1 ud)","Miel (1 cda)"],` |
| G0344 | R4 | 2 | — | `      throw new CasoError(`registro de semillas: usos[${k}] mal formado`);` |
| G0345 | R4 | 1 | — | `      weekArc, catalog: catalogReal, seed, profile, fuenteEditorial,` |
| G0346 | R4 | 1 | — | `      weekArc: weekArcBase, catalog: catalogReal, seed, profile,` |
| G0347 | R4 | 73 | — | `     (prohibido). Reutilizar literalmente `${seed}::walk` reiniciaría la secuencia desde el índice` |
| G0348 | R4 | 73 | — | `     `${seed}::walk::select` (mismo namespace lógico "walk", stream independiente), documentado en` |
| G0349 | R4 | 73 | — | `     `mulberry32(seedFromString(`${seed}::walk`))` para su propio desempate de momento del ancla;` |
| G0350 | R4 | 73 | — | `     ancla de P1a — no rompe el determinismo (la seed sigue fijando el resultado) pero es una` |
| G0351 | R4 | 1 | — | `    (buildWeekArc, runWalk, days NO estaban en la semilla; afloran por import literal a` |
| G0352 | R4 | 5 | — | `    // (sin filtros: solo necesitamos UNA seed que aterrice en cada indice).` |
| G0353 | R4 | 38 | — | `    // 4. seedDemo           — only when users array is empty (first ever load)` |
| G0354 | R4 | 1 | — | `    // Buscamos un seed real que resuelva a la plantilla A.` |
| G0355 | R4 | 1 | — | `    // Distintos mecanismos de seed deben producir secuencias _rnd distintas` |
| G0356 | R4 | 1 | — | `    // Dos weekArc identicos (mismo seed/profile/strategy) -> mismo consumo` |
| G0357 | R4 | 5 | — | `    // Fuerza cada ancla probando seeds hasta encontrar una que la elija` |
| G0358 | R4 | 3 | — | `    // Un seed por variante, verificado de antemano (no asumido). El punto` |
| G0359 | R4 | 3 | — | `    // Y de control: una semilla manual distinta (otro hash) NO coincide —` |
| G0360 | R4 | 1 | — | `    // ambos ids deben aparecer ganando en algunas de las seeds.` |
| G0361 | R4 | 1 | — | `    // coincidir con esta expectativa para practicamente cualquier seed.` |
| G0362 | R4 | 1 | — | `    // colapsa silenciosamente al mismo resultado que la seed por defecto).` |
| G0363 | R4 | 1 | — | `    // en algun seed -- confirma que la exclusion determinista del test` |
| G0364 | R4 | 3 | — | `    // estan calculados para batchDay=Miercoles) -- desde CP3B el seed` |
| G0365 | R4 | 1 | — | `    // mulberry32(seedFromString(`${seed}::walk`)) -- si expandWeekArc` |
| G0366 | R4 | 28 | — | `    ? function(){return {build:BF_SG.yogurSemillas, protein:"bf_yogur", plateType:"desayuno"};}` |
| G0367 | R4 | 68 | — | `    `(anchors, seed, intolerancias, decisionLog, getVista?)` — filtra ANTES del sorteo` |
| G0368 | R4 | 1 | — | `    b41e826:src/engine/buildPlan.js:45:  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));` |
| G0369 | R4 | 6 | — | `    cause: 'eleccion_ancla_por_seed',` |
| G0370 | R4 | 4 | — | `    cause: 'eleccion_esqueleto_por_seed',` |
| G0371 | R4 | 2 | — | `    clave: { version: BLIND_VERSION, seed, entradas },` |
| G0372 | R4 | 21 | — | `    console.info("[NutiPlan] Demo accounts seeded (nutri@demo.com / demo123)");` |
| G0373 | R4 | 2 | — | `    const a = JSON.stringify(serialiseDays(runSeeded('user-abc', 23).days));` |
| G0374 | R4 | 5 | — | `    const a = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-A', strategy: 'x' });` |
| G0375 | R4 | 2 | — | `    const a = serialiseDays(run(SEED).days);` |
| G0376 | R4 | 1 | — | `    const a = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0377 | R4 | 1 | — | `    const antes = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });` |
| G0378 | R4 | 1 | — | `    const b = JSON.stringify(serialiseDays(runSeeded('user-abc', 24).days));` |
| G0379 | R4 | 1 | — | `    const b = JSON.stringify(serialiseDays(runSeeded('user-xyz', 23).days));` |
| G0380 | R4 | 5 | — | `    const b = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-B', strategy: 'x' });` |
| G0381 | R4 | 2 | — | `    const b = serialiseDays(run(SEED).days);` |
| G0382 | R4 | 1 | — | `    const b = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0383 | R4 | 3 | — | `    const bySeed = Object.fromEntries(r1.weekArc.beats.map((b) => [b.day, b.fixedRole]));` |
| G0384 | R4 | 3 | — | `    const bySeedSucio = Object.fromEntries(weekArcSucio.beats.map((b) => [b.day, b.fixedRole]));` |
| G0385 | R4 | 1 | — | `    const contaminado = expandWeekArc({ weekArc, catalog, seed });` |
| G0386 | R4 | 1 | — | `    const despues = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });` |
| G0387 | R4 | 1 | — | `    const entradaCaso = { caso: `${g.perfilId}-${g.semilla}`, perfil: g.perfilId, semilla: g.semilla, planes: [] };` |
| G0388 | R4 | 2 | — | `    const f = g.find((x) => x.clave.texto.startsWith('for (let seed'));` |
| G0389 | R4 | 5 | — | `    const fixedInput = { profile: { trainingDays: ['Lunes', 'Viernes'] }, seed: 'desacople-fijo' };` |
| G0390 | R4 | 1 | — | `    const limpio = expandWeekArc({ weekArc, catalog, seed });` |
| G0391 | R4 | 3 | — | `    const manualRng = mulberry32(manualSeed);` |
| G0392 | R4 | 3 | — | `    const manualSeed = _hashStr(String(fixture.userId) + ':' + fixture.weekNumber);` |
| G0393 | R4 | 1 | — | `    const r = run(SEED);` |
| G0394 | R4 | 3 | — | `    const r1 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0395 | R4 | 1 | — | `    const r1 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });` |
| G0396 | R4 | 4 | — | `    const r1 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });` |
| G0397 | R4 | 3 | — | `    const r2 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0398 | R4 | 1 | — | `    const r2 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });` |
| G0399 | R4 | 4 | — | `    const r2 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });` |
| G0400 | R4 | 1 | — | `    const reportA = runWith(seedA);` |
| G0401 | R4 | 1 | — | `    const reportB = runWith(seedB);` |
| G0402 | R4 | 3 | — | `    const resAusente = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0403 | R4 | 11 | — | `    const resBase = buildWeekArc({ profile: base.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0404 | R4 | 5 | — | `    const resCrema = buildWeekArc({ profile: { trainingDays: [] }, seed: seedCrema, strategy: 'x' });` |
| G0405 | R4 | 5 | — | `    const resGuiso = buildWeekArc({ profile: { trainingDays: [] }, seed: seedGuiso, strategy: 'x' });` |
| G0406 | R4 | 5 | — | `    const resIntol = buildWeekArc({ profile: intolerancias.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0407 | R4 | 5 | — | `    const resSimple = buildWeekArc({ profile: isSimple.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0408 | R4 | 5 | — | `    const resTraining = buildWeekArc({ profile: conTraining.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0409 | R4 | 3 | — | `    const resVacio = buildWeekArc({ profile: { trainingDays: [], intolerances: [] }, seed, strategy: 'x' });` |
| G0410 | R4 | 2 | — | `    const result = run(SEED);` |
| G0411 | R4 | 1 | — | `    const seed = 'T-INV-seed';` |
| G0412 | R4 | 3 | — | `    const seed = 'f19-vacio-vs-ausente';` |
| G0413 | R4 | 3 | — | `    const seed = i + 1;` |
| G0414 | R4 | 1 | — | `    const seedA = deriveSeed(fixture);` |
| G0415 | R4 | 1 | — | `    const seedB = `${seedA}-mutada`;` |
| G0416 | R4 | 6 | — | `    const seedComun = 'fixture-comparativa';` |
| G0417 | R4 | 5 | — | `    const seedComun = 'fixture-training-vs-base';` |
| G0418 | R4 | 1 | — | `    const seeds = FIXTURES.map(deriveSeed);` |
| G0419 | R4 | 3 | — | `    const seedsPorVariante = { A: 7, B: 1, C: 0 };` |
| G0420 | R4 | 1 | — | `    const withRng = serialiseDays(run(SEED).days);` |
| G0421 | R4 | 1 | — | `    const withoutRng = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0422 | R4 | 3 | — | `    const wrongRng = mulberry32(manualSeed + 1);` |
| G0423 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v11-energia' });` |
| G0424 | R4 | 3 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v15-f12-interviene' });` |
| G0425 | R4 | 2 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v16-narracion' });` |
| G0426 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v5-capricho' });` |
| G0427 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-imposible' });` |
| G0428 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-imposible' });` |
| G0429 | R4 | 3 | — | `    const { decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-sin-veto' });` |
| G0430 | R4 | 2 | — | `    const { decisionLog: walkLog } = runWalk({ weekArc, catalog, seed: FIXTURE_INPUT.seed, profile: FIXTURE_INPUT.profile });` |
| G0431 | R4 | 1 | — | `    const { profile, seed, report } = buildEngine2Report(fixture, catalog);` |
| G0432 | R4 | 2 | — | `    const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });` |
| G0433 | R4 | 4 | — | `    const { slots } = runWalk({ weekArc, catalog, seed: 'v2-uno' });` |
| G0434 | R4 | 3 | — | `    const { slots } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-lactosa-no-toca-gluten', profile });` |
| G0435 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-unico' });` |
| G0436 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-vacio' });` |
| G0437 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v3-seed' });` |
| G0438 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-a' });` |
| G0439 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-b' });` |
| G0440 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v8-prioridad' });` |
| G0441 | R4 | 3 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-valor-y-desconocida', profile });` |
| G0442 | R4 | 1 | — | `    const { slots, decisionLog } = runWeek(seed, catalog);` |
| G0443 | R4 | 1 | — | `    const { weekArc } = buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });` |
| G0444 | R4 | 2 | — | `    const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });` |
| G0445 | R4 | 3 | — | `    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0446 | R4 | 3 | — | `    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });` |
| G0447 | R4 | 4 | — | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed: seedCrema, strategy: 'x' });` |
| G0448 | R4 | 1 | — | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed: seedCrema, strategy: 'x' });` |
| G0449 | R4 | 3 | — | `    const { weekArc, decisionLog } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });` |
| G0450 | R4 | 1 | — | `    const { weekArc, decisionLog } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed: seedA, strategy: 'x' });` |
| G0451 | R4 | 1 | — | `    const { weekArc: weekArcBase } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0452 | R4 | 1 | — | `    escaner: 'scripts/fase7/escanearSemillas.mjs',` |
| G0453 | R4 | 4 | — | `    evidence: `seed=${JSON.stringify(seed)} -> indice ${index} de ${ANCHORS.length} anclas catalogadas en CP2 (sin filtros)`,` |
| G0454 | R4 | 4 | — | `    evidence: `seed=${JSON.stringify(seed)} -> indice ${index} de ${TEMPLATES.length} plantillas (A/B/C, sin filtros)`,` |
| G0455 | R4 | 1 | — | `    expandWeekArc({ weekArc: antes.weekArc, catalog, seed }); // "existe el walk"` |
| G0456 | R4 | 2 | — | `    expect(() => blind(items(), -1)).toThrow(/seed/);` |
| G0457 | R4 | 2 | — | `    expect(() => blind(items(), 1.5)).toThrow(/seed/);` |
| G0458 | R4 | 2 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk())).not.toThrow();` |
| G0459 | R4 | 1 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk([{ desde: 1005, hasta: 1005, origen: 'prueba X' }]))).toThrow(/1005 ya usada: prueba X/);` |
| G0460 | R4 | 1 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk([{ desde: 2005, hasta: 2005, origen: 'prueba X' }]))).toThrow(/2005 ya usada: prueba X/);` |
| G0461 | R4 | 2 | — | `    expect(Object.keys(clave)).toEqual(['version', 'seed', 'entradas']);` |
| G0462 | R4 | 2 | — | `    expect(analizarLinea('mulberry32(x)').literalesNoConsumidos).toEqual([]);` |
| G0463 | R4 | 3 | — | `    expect(bySeed.Domingo).toBe('familiar');` |
| G0464 | R4 | 3 | — | `    expect(bySeed.Lunes).toBe('entreno');` |
| G0465 | R4 | 3 | — | `    expect(bySeed.Miercoles).toBe('entreno');` |
| G0466 | R4 | 3 | — | `    expect(bySeed.Sabado).toBe('libre');` |
| G0467 | R4 | 3 | — | `    expect(bySeed.Viernes).toBe('entreno');` |
| G0468 | R4 | 3 | — | `    expect(bySeedSucio.Sabado).not.toBe('libre'); // demuestra que la asercion de (b) SI habria fallado sobre esta variante rota` |
| G0469 | R4 | 2 | — | `    expect(e.semilla).toBe(S);` |
| G0470 | R4 | 2 | — | `    expect(entradaEngine2('P1', S)).toEqual({ profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] }, seed: S, strategy: ESTRATEGIA });` |
| G0471 | R4 | 1 | — | `    expect(new Set(seeds).size).toBe(9); // sin colisiones entre las 9 fixtures` |
| G0472 | R4 | 2 | — | `    expect(parteI).toMatch(/for \\(let seed/);` |
| G0473 | R4 | 2 | — | `    expect(path.basename(r.rutaJson)).toBe('borrador-semillas.json');` |
| G0474 | R4 | 2 | — | `    expect(path.basename(r.rutaMd)).toBe('borrador-semillas.md');` |
| G0475 | R4 | 1 | — | `    expect(resBase.weekArc.anchors).toHaveLength(1); // control: la base SI tiene ancla con esta seed` |
| G0476 | R4 | 1 | — | `    expect(seedA).not.toBeNull();` |
| G0477 | R4 | 10 | — | `    expect(seedCrema).not.toBeNull();` |
| G0478 | R4 | 5 | — | `    expect(seedGuiso).not.toBeNull();` |
| G0479 | R4 | 1 | — | `    expect(seeds).toEqual(FIXTURES.map((f) => `${f.userId}${f.weekNumber}`));` |
| G0480 | R4 | 3 | — | `    for (const [skeletonEsperado, seed] of Object.entries(seedsPorVariante)) {` |
| G0481 | R4 | 2 | — | `    for (const l of ['seed 1.5', 'seed v1.2.3', 'seed 0x10', 'seed 1_000']) {` |
| G0482 | R4 | 2 | — | `    for (const l of ['seed: base + i', 'function f(semilla) {']) {` |
| G0483 | R4 | 2 | — | `    for (const s of SEMILLAS_TEST) expect(SEMILLAS_EVALUACION).not.toContain(s);` |
| G0484 | R4 | 2 | — | `    for (const semilla of SEMILLAS_EVALUACION) casos.push({ perfilId, semilla });` |
| G0485 | R4 | 2 | — | `    for (const semilla of SEMILLAS_TEST) {` |
| G0486 | R4 | 1 | — | `    for (let i = 0; i < 5; i++) buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });` |
| G0487 | R4 | 3 | — | `    function chooseAnchorSucio(anchors, seed) {` |
| G0488 | R4 | 3 | — | `    function chooseAnchorSucioConDescarte(anchors, seedNum, vetadosIds) {` |
| G0489 | R4 | 3 | — | `    function rngSucio(seedNum) {` |
| G0490 | R4 | 1 | — | `    function runWith(seed) {` |
| G0491 | R4 | 2 | — | `    if (uso) throw new CasoError(`semilla ${s} ya usada: ${uso.origen} (${uso.desde}–${uso.hasta})`);` |
| G0492 | R4 | 1 | — | `    let s = seed;` |
| G0493 | R4 | 1 | — | `    let seedA = null;` |
| G0494 | R4 | 5 | — | `    let seedCrema = null, seedGuiso = null;` |
| G0495 | R4 | 5 | — | `    let seedCrema = null;` |
| G0496 | R4 | 1 | — | `    lines.push(`- seed: \\`${fixture.seed}\\``);` |
| G0497 | R4 | 28 | — | `    macedoniaProtSG:  function(){return {time:"Desayuno",emoji:"🌅",title:"Macedonia con yogur y semillas",` |
| G0498 | R4 | 1 | — | `    opcionesLegacy: { ...OPCIONES_LEGACY, saveMealMemory: 'función vacía', rng: 'mulberry32(semilla) de src/engine/rng.js' },` |
| G0499 | R4 | 68 | — | `    para alguna seed") deja de sostenerse bajo veto activo.` |
| G0500 | R4 | 1 | — | `    perfilId, semilla,` |
| G0501 | R4 | 1 | — | `    profile, seed, strategy, catalog, fuenteEditorial,` |
| G0502 | R4 | 1 | — | `    profile, seed, strategy, fuenteEditorial,` |
| G0503 | R4 | 1 | — | `    registroSemillas: { ruta: registroPath, sha256: sha256(registroTexto), ancla: registro.ancla, perimetro: registro.perimetro },` |
| G0504 | R4 | 28 | — | `    return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood\|\|null, effectiveMood:dayMood, meals:meals, shakeEnabled:!!profile.extras.proteinShake.enabled};` |
| G0505 | R4 | 2 | — | `    seed que lo sostiene.` |
| G0506 | R4 | 1 | — | `    seed,` |
| G0507 | R4 | 5 | — | `    seed: 'causa-completa',` |
| G0508 | R4 | 2 | — | `    seed: 'demo-cp3a',` |
| G0509 | R4 | 2 | — | `    seed: semilla,` |
| G0510 | R4 | 2 | — | `    semilla,` |
| G0511 | R4 | 1 | — | `    semillas: [...SEMILLAS_EVALUACION],` |
| G0512 | R4 | 2 | — | `    throw new CasoError('registro de semillas: ancla ausente o no es un sha completo');` |
| G0513 | R4 | 2 | — | `    throw new CasoError('registro de semillas: perímetro no declarado');` |
| G0514 | R4 | 2 | — | `    throw new CasoError('semillas: lista vacía o con valores no enteros');` |
| G0515 | R4 | 1 | — | `    verificarExhaustividadPaso5(decisionLog, seed);` |
| G0516 | R4 | 1 | — | `    verificarSemillas([...SEMILLAS_EVALUACION], registro);` |
| G0517 | R4 | 1 | — | `    weekArc, catalog, seed, profile,` |
| G0518 | R4 | 3 | — | `    weekArc, catalog, seed, profile, fuenteEditorial,` |
| G0519 | R4 | 1 | — | `    weekArc, catalog, seed, profile: PROFILE,` |
| G0520 | R4 | 28 | — | `    yogurSemillas: function(){return {time:"Desayuno",emoji:"🌅",title:"Yogur con semillas y fruta",` |
| G0521 | R4 | 3 | — | `    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) },` |
| G0522 | R4 | 1 | — | `    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed), ...extraOpts },` |
| G0523 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: () => {}, rng: mulberry32(seed) },` |
| G0524 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) });` |
| G0525 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) },` |
| G0526 | R4 | 1 | — | `    { ...JSON.parse(JSON.stringify(entrada.opts)), saveMealMemory: () => {}, rng: mulberry32(entrada.semilla) },` |
| G0527 | R4 | 28 | — | `    {key:"yogurSemillas",   fn:BF_SG.yogurSemillas,    containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},` |
| G0528 | R4 | 2 | — | `  "cause": "eleccion_esqueleto_por_seed",` |
| G0529 | R4 | 4 | — | `  // 0. Esqueleto (plantilla A/B/C) por seed, sin filtros.` |
| G0530 | R4 | 2 | — | `  // 2. Ancla por seed, filtrada por veto (D-023) antes del sorteo. Puede` |
| G0531 | R4 | 4 | — | `  // 2. Ancla por seed, sin filtros.` |
| G0532 | R4 | 9 | — | `  // NO-DETERMINISMO CONOCIDO (Fase 0, pendiente): planSeed solo alimenta day.id,` |
| G0533 | R4 | 21 | — | `  // SEED DEMO — sync, uses _createUserLocal to avoid async chain issues` |
| G0534 | R4 | 9 | — | `  // Sin opts.rng: seed determinista = hash(userId + weekNumber) — misma seed,` |
| G0535 | R4 | 21 | — | `  // Used by seedDemo and offline fallback only.` |
| G0536 | R4 | 9 | — | `  // mismo plan byte a byte (excluyendo day.id, ver planSeed = Date.now() mas abajo).` |
| G0537 | R4 | 9 | — | `  // no afecta el contenido del plan. Fuera de alcance de la seed determinista` |
| G0538 | R4 | 1 | — | `  // primero -- dishE NO admite "cena" -> se descarta. Seed encontrado por` |
| G0539 | R4 | 3 | — | `  // seed elige tambien entre A/B/C desde CP3B -- 'demo-cp3a' (el seed` |
| G0540 | R4 | 14 | — | `  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────` |
| G0541 | R4 | 1 | — | `  2. Ancla elegida UNICAMENTE por seed entre las 6 referencias de CP2` |
| G0542 | R4 | 1 | — | `  CONTEXTO: String.raw`seed\|semilla\|mulberry32\\(`,` |
| G0543 | R4 | 1 | — | `  GENERADOR_VERSION, ESTRATEGIA, SEMILLAS_EVALUACION, PERFILES, PERFIL_BASE_LEGACY,` |
| G0544 | R4 | 1 | — | `  L.push('# Borrador de semillas (Fase 7)', '');` |
| G0545 | R4 | 2 | — | `  SEMILLAS_EVALUACION, ESTRATEGIA, PERFILES, PERFIL_BASE_LEGACY, TRADUCCION_PERFIL_BASE, CasoError,` |
| G0546 | R4 | 1 | — | `  TOKEN: String.raw`[\\w$]*(?:seed\|semilla)[\\w$]*`,` |
| G0547 | R4 | 1 | — | `  `materializePlan({ profile, seed, strategy, catalog })`. Entrada verbatim de` |
| G0548 | R4 | 1 | — | `  `{ ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) }`. El `rng: mulberry32(seed)`` |
| G0549 | R4 | 1 | — | `  buildComparisonArtifact, SUBMETRICS, deriveSeed, TRANSLATION_TABLE,` |
| G0550 | R4 | 1 | — | `  buildPlan: executeProducer('buildPlan', () => runBuildPlan(SEED)),` |
| G0551 | R4 | 1 | — | `  byte a byte, mas un control negativo con una seed manual distinta.` |
| G0552 | R4 | 9 | — | `  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));` |
| G0553 | R4 | 1 | — | `  const anchor = chooseAnchor(ANCHORS, seed, intolerancias, decisionLog);` |
| G0554 | R4 | 4 | — | `  const anchor = chooseAnchor(seed, decisionLog);` |
| G0555 | R4 | 1 | — | `  const comboStats = new Map();    // "id1\|id2" -> { total, weeks: Set<seedIndex>, dishIds: Set<dishId> }` |
| G0556 | R4 | 1 | — | `  const dishStats = new Map();     // dishId -> { nombre, esV2, total, weeks: Set<seedIndex> }` |
| G0557 | R4 | 1 | — | `  const eE = entradaEngine2(perfilId, semilla);` |
| G0558 | R4 | 1 | — | `  const eL = entradaLegacy(perfilId, semilla);` |
| G0559 | R4 | 1 | — | `  const identityStats = new Map(); // identidad -> { total, weeks: Set<seedIndex> }` |
| G0560 | R4 | 28 | — | `  const planSeed = Date.now();` |
| G0561 | R4 | 4 | — | `  const rng = mulberry32(resolveSeed(`${seed}::skeleton`));` |
| G0562 | R4 | 6 | — | `  const rng = mulberry32(resolveSeed(seed));` |
| G0563 | R4 | 2 | — | `  const rng = mulberry32(seed);` |
| G0564 | R4 | 6 | — | `  const rng = selectRng(seed);` |
| G0565 | R4 | 1 | — | `  const rng = walkRng(seed);` |
| G0566 | R4 | 1 | — | `  const rutaJson = path.join(dir, 'borrador-semillas.json');` |
| G0567 | R4 | 1 | — | `  const rutaMd = path.join(dir, 'borrador-semillas.md');` |
| G0568 | R4 | 1 | — | `  const seed = deriveSeed(fixture);` |
| G0569 | R4 | 4 | — | `  const template = chooseSkeleton(seed, decisionLog);` |
| G0570 | R4 | 2 | — | `  const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });` |
| G0571 | R4 | 1 | — | `  const { slots, decisionLog } = expandWeekArc({ weekArc, catalog, seed: 'v2-seed' });` |
| G0572 | R4 | 6 | — | `  const { slots: p1aSlots, decisionLog: p1aRawLog } = expandWeekArc({ weekArc, catalog, seed });` |
| G0573 | R4 | 1 | — | `  const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });` |
| G0574 | R4 | 3 | — | `  const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });` |
| G0575 | R4 | 1 | — | `  const { weekArc, catalog, seed } = input;` |
| G0576 | R4 | 3 | — | `  const { weekArc, catalog, seed, profile } = input;` |
| G0577 | R4 | 45 | — | `  criterio: re-ejecuta la campaña anclada (mismas semillas, mismo` |
| G0578 | R4 | 70 | — | `  docstring literal "Ancla elegida ÚNICAMENTE por seed... Sin filtros de ningún tipo"; colocación en` |
| G0579 | R4 | 1 | — | `  en `opts` es la forma nativa del test, no una decision de este acto sobre donde entra la semilla.` |
| G0580 | R4 | 1 | — | `  equivalente no-simple bajo la misma seed.` |
| G0581 | R4 | 68 | — | `  fixtures/seeds concretas, nunca como aserción general del contrato). Javi ratifica cuatro asientos:` |
| G0582 | R4 | 62 | — | `  fixtures: la cobertura depende de la combinación seed × legibilidad del` |
| G0583 | R4 | 2 | — | `  for (const s of semillas) {` |
| G0584 | R4 | 1 | — | `  for (const { perfilId, semilla } of listaCasos()) {` |
| G0585 | R4 | 1 | — | `  function shuffle(array, seed) {` |
| G0586 | R4 | 2 | — | `  if (!Array.isArray(registro.usos)) throw new CasoError('registro de semillas: usos debe ser un array');` |
| G0587 | R4 | 2 | — | `  if (!Array.isArray(semillas) \|\| semillas.length === 0 \|\| !semillas.every(Number.isInteger)) {` |
| G0588 | R4 | 2 | — | `  if (!Number.isInteger(seed) \|\| seed < 0 \|\| seed > 0xFFFFFFFF) {` |
| G0589 | R4 | 2 | — | `  if (!registro \|\| typeof registro !== 'object') throw new CasoError('registro de semillas ausente');` |
| G0590 | R4 | 1 | — | `  if (!registroPath \|\| !salida) fail('uso: --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion');` |
| G0591 | R4 | 2 | — | `  if (registro.completo !== true) throw new CasoError('registro de semillas: no se declara completo');` |
| G0592 | R4 | 2 | — | `  if (registro.version !== 1) throw new CasoError('registro de semillas: versión no soportada');` |
| G0593 | R4 | 3 | — | `  it('(b) LO QUE SE CONSERVA: mismo seed -> mismo plan, capricho normal, fixedRoles intactos', () => {` |
| G0594 | R4 | 1 | — | `  it('(v)+(vii): identidad comprometida SOLO por el ancla (P1a) descarta al rotativo (P1b) que la repite -- determinista en 5 seeds, sin RNG (nivel=1)', () => {` |
| G0595 | R4 | 5 | — | `  it('10 llamadas con la misma seed producen exactamente el mismo JSON', () => {` |
| G0596 | R4 | 1 | — | `  it('10 llamadas con la misma seed producen exactamente el mismo dia de capricho', () => {` |
| G0597 | R4 | 3 | — | `  it('CP3B: el mismo desacople se sostiene con las TRES variantes presentes (seed elige A/B/C, no strategy)', () => {` |
| G0598 | R4 | 5 | — | `  it('VERDE: sobre 200 seeds reales (mezcla de perfiles con/sin entreno), el invariante nunca lanza', () => {` |
| G0599 | R4 | 1 | — | `  it('VERDE: sobre 200 seeds x perfiles reales, assertNoCaprichoCollision nunca lanza', () => {` |
| G0600 | R4 | 1 | — | `  it('barajar con una semilla DISTINTA tambien produce el mismo ranking (no es casualidad de una sola baraja)', () => {` |
| G0601 | R4 | 4 | — | `  it('caso construido: 1 hueco con desempate garantizado + 1 hueco determinado por reglas; dos seeds distintas solo difieren en el de desempate', () => {` |
| G0602 | R4 | 3 | — | `  it('con >=1 superviviente, el elegido es SIEMPRE superviviente (jamas el vetado), sobre 200 seeds', () => {` |
| G0603 | R4 | 2 | — | `  it('engine2 P1: entreno con nombres de engine2, misma semilla y estrategia', () => {` |
| G0604 | R4 | 3 | — | `  it('f3: invariante RNG forma fuerte -- sobre >=8 seeds, el neutro NUNCA gana; la variacion ocurre solo entre los 2 supervivientes del nivel', () => {` |
| G0605 | R4 | 2 | — | `  it('falla si alguna semilla está registrada como usada', () => {` |
| G0606 | R4 | 3 | — | `  it('fijados seed (verificado: resuelve a variante C), las 6 estrategias producen la MISMA estructura (beats, anchors, batchDay, decisionLog) -- solo difiere weekArc.strategy', () => {` |
| G0607 | R4 | 2 | — | `  it('fijados seed, variante C y batchDay (via profile/seed fijos), las 6 estrategias producen la MISMA estructura (beats, anchors, batchDay, decisionLog) -- solo difiere weekArc.strategy', () => {` |
| G0608 | R4 | 2 | — | `  it('ids duplicados, id vacío, lista vacía, semilla inválida', () => {` |
| G0609 | R4 | 3 | — | `  it('intolerances ausente: ancla SIEMPRE presente, sin entradas de log de veto/ausencia, evidencia identica al formato pre-D-023, sobre 50 seeds', () => {` |
| G0610 | R4 | 3 | — | `  it('intolerances=[] (presente pero vacio) es identico a intolerances ausente, misma seed', () => {` |
| G0611 | R4 | 4 | — | `  it('intolerancias e isSimple (que F3 no usa) NO cambian la estructura frente al perfil base, con la misma seed', () => {` |
| G0612 | R4 | 1 | — | `  it('isSimple (que F3 no usa) NO cambia la estructura frente al perfil base, con la misma seed', () => {` |
| G0613 | R4 | 1 | — | `  it('las 9 seeds derivadas son estables y coinciden con hash(userId+weekNumber)', () => {` |
| G0614 | R4 | 2 | — | `  it('las semillas de test no son de evaluación', () => {` |
| G0615 | R4 | 1 | — | `  it('las sobras quedan en el MISMO momento que el ancla, para varias semillas', () => {` |
| G0616 | R4 | 2 | — | `  it('misma entrada + misma semilla -> salida idéntica byte a byte', () => {` |
| G0617 | R4 | 1 | — | `  it('misma seed y entrada -> objeto byte-identico (JSON.stringify) en dos invocaciones', () => {` |
| G0618 | R4 | 1 | — | `  it('misma semilla -> expansion + colocacion + log byte-identicos', () => {` |
| G0619 | R4 | 1 | — | `  it('misma semilla -> misma colocacion en dos ejecuciones', () => {` |
| G0620 | R4 | 1 | — | `  it('mismo seed -> mismo weekArc antes y despues de que exista el walk (buildWeekArc no cambia)', () => {` |
| G0621 | R4 | 1 | — | `  it('opts.rng explícito sigue ganando sobre la seed por userId+weekNumber', () => {` |
| G0622 | R4 | 1 | — | `  it('reconstruir densidadDiaria de fat_loss_general con una seed distinta cambia el valor', async () => {` |
| G0623 | R4 | 2 | — | `  it('seed: base + i y function f(semilla) son R4 sin valores', () => {` |
| G0624 | R4 | 5 | — | `  it('seeds distintas pueden producir weekArc distinto (sanity: el seed si importa)', () => {` |
| G0625 | R4 | 1 | — | `  it('semillas distintas pueden resolver a momentos distintos (el desempate es real, no un no-op)', () => {` |
| G0626 | R4 | 4 | — | `  it('set ambiguo -> semillas distintas pueden resolver a momentos distintos (desempate real)', () => {` |
| G0627 | R4 | 2 | — | `  it('sin LIT pegado: seed5 no es R1', () => {` |
| G0628 | R4 | 3 | — | `  it('sobre 100 seeds: la variacion ocurre ENTRE supervivientes (no colapsa a uno solo, salvo por azar improbable)', () => {` |
| G0629 | R4 | 3 | — | `  it('sobre >=8 seeds: el vetado jamas aparece elegido', () => {` |
| G0630 | R4 | 10 | — | `  let s = seed >>> 0;` |
| G0631 | R4 | 62 | — | `  mediría varianza de seed, no el efecto del campo. Alcance: catálogo y` |
| G0632 | R4 | 1 | — | `  profile, seed, strategy, fuenteEditorial,` |
| G0633 | R4 | 63 | — | `  reproducibilidad por seed (misma seed → mismo artefacto; seed` |
| G0634 | R4 | 2 | — | `  return `${perfilId}-${semilla}-${motor}`;` |
| G0635 | R4 | 6 | — | `  return mulberry32(seedFromString(`${seed}::walk::select`));` |
| G0636 | R4 | 1 | — | `  return mulberry32(seedFromString(`${seed}::walk`));` |
| G0637 | R4 | 6 | — | `  return typeof seed === 'number' ? seed >>> 0 : seedFromString(String(seed));` |
| G0638 | R4 | 1 | — | `  return { profile, seed, report: adaptHumanScore({ slots, catalog }) };` |
| G0639 | R4 | 1 | — | `  return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:..., mood:..., effectiveMood:...,` |
| G0640 | R4 | 1 | — | `  seed: r1.clave.seed,` |
| G0641 | R4 | 21 | — | `  seedDemo: () => {` |
| G0642 | R4 | 2 | — | `  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escaner-semillas-'));` |
| G0643 | R4 | 2 | — | `  verificarDeterminismo, verificarSemillas, listaCasos,` |
| G0644 | R4 | 1 | — | `  verificarDiaLibreEngine2, verificarDeterminismo, verificarSemillas, idPlan, listaCasos,` |
| G0645 | R4 | 1 | — | `  weekArc, catalog, seed: SEED, profile: PROFILE,` |
| G0646 | R4 | 14 | — | `  {name:"Semillas de chía",         kcal100:486, defaultG:15},` |
| G0647 | R4 | 14 | — | `  {name:"Semillas de lino",         kcal100:534, defaultG:15},` |
| G0648 | R4 | 2 | — | ` *   clave: { version: number, seed: number, entradas: { etiqueta: string, id: string }[] }` |
| G0649 | R4 | 2 | — | ` * @param {(number\|string)} seed` |
| G0650 | R4 | 2 | — | ` * @param {number} seed entero (se normaliza a uint32)` |
| G0651 | R4 | 1 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string, catalog: ReadonlyArray<object>, fuenteEditorial?: object}} input` |
| G0652 | R4 | 1 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string, fuenteEditorial?: {version: number, confirmed: object}}} input` |
| G0653 | R4 | 5 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string}} input` |
| G0654 | R4 | 2 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object, profile?: {intolerances?: string[]}, fuenteEditorial?: {version: number, confirmed: object}}} input` |
| G0655 | R4 | 3 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object, profile?: {intolerances?: string[]}}} input` |
| G0656 | R4 | 1 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object}} input` |
| G0657 | R4 | 1 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string)}} input` |
| G0658 | R4 | 2 | — | ` * @returns {() => number} generador determinista: misma seed -> misma secuencia.` |
| G0659 | R4 | 4 | — | ` * Ancla elegida UNICAMENTE por seed entre las 6 referencias de CP2. Sin` |
| G0660 | R4 | 2 | — | ` * Ancla elegida UNICAMENTE por seed, entre las anclas SUPERVIVIENTES del` |
| G0661 | R4 | 4 | — | ` * Esqueleto (plantilla A/B/C) elegido UNICAMENTE por seed. Sin filtros de` |
| G0662 | R4 | 4 | — | ` * eleccion de ancla sean independientes entre si para la misma seed` |
| G0663 | R4 | 1 | — | ` * seeds de tipo string (p. ej. hash(userId+weekNumber) de F0) ademas de` |
| G0664 | R4 | 1 | — | `("${seed}::skeleton") independiente del de chooseAnchor -- cambiar el` |
| G0665 | R4 | 1 | — | `(+ resumen legible .md). Controles falsables: reproducibilidad por seed,` |
| G0666 | R4 | 2 | — | `(3 por seed, 2 seeds).` |
| G0667 | R4 | 1 | — | `**3.1 Control 1b (mutación de seed).** Verifica reproducibilidad del` |
| G0668 | R4 | 13 | — | `**Decisión 2 — Extensión normativa.** La extensión normativa de ii-auto se fija en §5.6 del protocolo de evaluación (tamaño de muestra N, «el caso limpio» que D-075 cita literal en `DECISIONS.md:3323`). El mapeo completo de las demás cláusulas de muestreo/reproducibilidad (§5.5 semillas, §5.8 agrega …[TRUNCADO]` |
| G0669 | R4 | 1 | — | `**I-2.** Semillas como rango secuencial documentado, nunca aleatorio ni ad-hoc — con una variante de convención no resuelta.` |
| G0670 | R4 | 1 | — | `**I-3.** Self-check de determinismo obligatorio y bloqueante antes de cualquier medición (mismo seed, dos ejecuciones, comparación por igualdad de string).` |
| G0671 | R4 | 1 | — | `- **Ruta de generación:** `buildPlan()` invocado vía `runBaseline(fixture)` (`src/engine/tests/baselineFixtures.js`), sin `opts.rng` — seed implícita `hash(userId + weekNumber)`.` |
| G0672 | R4 | 2 | — | `- **Seeds usadas — dos generaciones, con causa distinta cada una:**` |
| G0673 | R4 | 1 | — | `- **Seeds:**` |
| G0674 | R4 | 1 | — | `- **Unidad de muestreo**: la semana. Cada iteración del protocolo produce un plan semanal independiente a partir de una semilla propia.` |
| G0675 | R4 | 1 | — | `- **Unidad de muestreo:** la semana, con semilla propia por iteración (`protocolo-evaluacion.md:23`). Coincide con la estructura que C v1 formaliza (`DECISIONS.md:2261`) y no invoca el contrato de `days`.` |
| G0676 | R4 | 1 | — | `- **§5.5 (semillas)** y **§5.8 (nivel de agregación)** operan al nivel semana declarado en §2 (`:46`, `:49`, remitiendo a `:23`/`:25`); se satisfacen sin enrutar por el contrato del objeto. No requieren la relación C v1↔objeto.` |
| G0677 | R4 | 49 | — | `- Método: campaña doble apareada por semana/semilla — brazo control (V+V2)` |
| G0678 | R4 | 2 | — | `- Se construye el generador de casos (perfiles, traducción a entrada nativa, verificación de la premisa del punto 3, acreditación de semillas). No se ejecuta la evaluación.` |
| G0679 | R4 | 1 | — | `- la ruta sin opts.rng reproduce exactamente mulberry32(_hashStr(userId+':'+` |
| G0680 | R4 | 1 | — | `- seed: `baseline-defflexible12`` |
| G0681 | R4 | 1 | — | `- seed: `baseline-defsaciante11`` |
| G0682 | R4 | 1 | — | `- seed: `baseline-fatlossgeneral10`` |
| G0683 | R4 | 1 | — | `- seed: `baseline-mant-intol16`` |
| G0684 | R4 | 1 | — | `- seed: `baseline-mant-simple18`` |
| G0685 | R4 | 1 | — | `- seed: `baseline-mant-training17`` |
| G0686 | R4 | 1 | — | `- seed: `baseline-mantenimiento13`` |
| G0687 | R4 | 1 | — | `- seed: `baseline-volumenagresivo15`` |
| G0688 | R4 | 1 | — | `- seed: `baseline-volumenlimpio14`` |
| G0689 | R4 | 1 | — | `/** seed = hash(userId + weekNumber) (CLAUDE.md, regla de determinismo). */` |
| G0690 | R4 | 4 | — | `//      misma seed.` |
| G0691 | R4 | 4 | — | `//   0. Esqueleto (plantilla): elegido UNICAMENTE por seed entre A/B/C` |
| G0692 | R4 | 4 | — | `//   2. Ancla: eleccion UNICAMENTE por seed entre las 6 referencias de CP2.` |
| G0693 | R4 | 2 | — | `//   2. Ancla: eleccion UNICAMENTE por seed entre las referencias de CP2` |
| G0694 | R4 | 1 | — | `//   node scripts/fase7/escanearSemillas.mjs --salida <dir> [--consulta <desde>-<hasta>]` |
| G0695 | R4 | 1 | — | `//   node scripts/fase7/generarCasos.mjs --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion` |
| G0696 | R4 | 1 | — | `//   { "seed": <entero>, "planes": [ { "id": "...", "motor": "legacy"\|"engine2", "archivo": "ruta/plan.json" } ] }` |
| G0697 | R4 | 1 | — | `// Antes de ejecutar nada: semillas comprobadas contra el registro declarado y` |
| G0698 | R4 | 3 | — | `// D-022) + P2b-ii (frecuencias, D-024). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0699 | R4 | 1 | — | `// D-022). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0700 | R4 | 1 | — | `// D-044). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0701 | R4 | 1 | — | `// Ejecuta ambos motores para cada caso (perfil × semilla), verifica cada caso` |
| G0702 | R4 | 1 | — | `// Escáner de semillas (Fase 7): capa git, CLI y escritura del borrador.` |
| G0703 | R4 | 1 | — | `// Esto es una mejora determinista conocida para esta seed concreta —` |
| G0704 | R4 | 3 | — | `// Fase 0 — baseline de snapshots por la ruta REAL de seed de produccion` |
| G0705 | R4 | 1 | — | `// Genera UN plan de engine2 (buildWeekArc + runWalk, catalogo real, seed` |
| G0706 | R4 | 2 | — | `// Golden snapshot: seeded weekly plan generated by buildPlan.` |
| G0707 | R4 | 1 | — | `// Produce el BORRADOR del que, tras revisión manual, saldrá el registro de semillas.` |
| G0708 | R4 | 1 | — | `// Reglas puras del escáner de semillas (Fase 7). Sin I/O.` |
| G0709 | R4 | 1 | — | `// Seed S=1: en el código baseline (pre-GATE4), la verdura primaria` |
| G0710 | R4 | 2 | — | `// Semillas de test: nunca las de evaluación.` |
| G0711 | R4 | 2 | — | `// Tests del generador que ejecutan los motores. Usan semillas de test (1 y 2),` |
| G0712 | R4 | 2 | — | `// completo o alguna semilla cae en un uso registrado.` |
| G0713 | R4 | 6 | — | `// de ancla de expandWeekArc — no es un bug de determinismo (la seed sigue` |
| G0714 | R4 | 2 | — | `// de semillas contra un registro. La ejecución de los motores y la escritura` |
| G0715 | R4 | 1 | — | `// del encargo D2: reproducibilidad (seed gobierna el artefacto), honestidad` |
| G0716 | R4 | 1 | — | `// deriveTempFeelEngine2: R6 solo exige que la MISMA seed produzca el MISMO` |
| G0717 | R4 | 2 | — | `// entrada + misma semilla -> salida idéntica byte a byte.` |
| G0718 | R4 | 1 | — | `// la entrada problemática (semilla, día, momento, evidencia completa).` |
| G0719 | R4 | 1 | — | `// misma seed la frecuencia máxima de cualquier verdura primaria queda` |
| G0720 | R4 | 1 | — | `// mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS primitivas` |
| G0721 | R4 | 1 | — | `// mulberry32 — deterministic PRNG. seed → () => [0, 1)` |
| G0722 | R4 | 6 | — | `// mulberry32(seedFromString(`${seed}::walk`)) para su propio desempate de` |
| G0723 | R4 | 4 | — | `// ocurre ANTES del sorteo por seed, sobre un catalogo de 6 referencias sin` |
| G0724 | R4 | 2 | — | `// planSeed=Date.now(), buildPlan.js:2261).` |
| G0725 | R4 | 1 | — | `// runWalk, mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS` |
| G0726 | R4 | 1 | — | `// seed, memoryStore}. Salida: {slots, decisionLog}. Rellena los huecos que` |
| G0727 | R4 | 4 | — | `// seed, strategy}. Salida: {weekArc, decisionLog}. Stateless (R4): no` |
| G0728 | R4 | 1 | — | `// seed=i+1) que veg_variety_engine2.mjs @ 9b8d489 — ese fichero NO se` |
| G0729 | R4 | 1 | — | `// seed}. Salida: {slots, decisionLog}. Stateless, como buildWeekArc (R4):` |
| G0730 | R4 | 1 | — | `// semillas de evaluación requiere autorización expresa del titular.` |
| G0731 | R4 | 1 | — | `// sobre la MISMA campaña (mismas semillas, mismo perfil, N=500):` |
| G0732 | R4 | 2 | — | `// sustituye por una función vacía y rng por mulberry32(semilla) al ejecutar.` |
| G0733 | R4 | 2 | — | `// variante C). Entrada: {profile, seed, strategy}. Salida: {weekArc,` |
| G0734 | R4 | 1 | — | `// ─── Comparación apareada por semana/semilla ───────────────────────────` |
| G0735 | R4 | 2 | — | `// ─── Semillas: comprobación contra un registro declarado ─────────────────────` |
| G0736 | R4 | 1 | — | `1. **Self-check de determinismo bloqueante.** Antes de toda medición, el protocolo deberá ejecutar un self-check de determinismo: misma semilla, dos ejecuciones, comparación por igualdad. Si las dos ejecuciones difieren, la medición deberá abortarse.` |
| G0737 | R4 | 2 | — | `1. Forma. Comparación por pares. Cada par contiene dos planes del mismo caso (mismo perfil, estrategia y semilla), uno de cada motor, en orden A/B aleatorizado por el cegado.` |
| G0738 | R4 | 1 | — | `2 semillas distintas; control de discriminacion confirma que un` |
| G0739 | R4 | 37 | — | `2. **F-V2 — Doble ancla de hash.** Toda verificación de conformidad registra dos hashes SHA-256 del objeto de plan observado: (i) el del objeto completo, tal como lo emite el productor, aunque no resulte reproducible entre corridas — documentando en ese caso la causa observada de la no reproducibili …[TRUNCADO]` |
| G0740 | R4 | 1 | — | `3344\|**Decisión 2 — Extensión normativa.** La extensión normativa de ii-auto se fija en §5.6 del protocolo de evaluación (tamaño de muestra N, «el caso limpio» que D-075 cita literal en `DECISIONS.md:3323`). El mapeo completo de las demás cláusulas de muestreo/reproducibilidad (§5.5 semillas, §5.8 a …[TRUNCADO]` |
| G0741 | R4 | 36 | — | `4. **Semillas como propiedad, no como convención única.** §5 norma el rango de semillas como propiedad (secuencial, contiguo, de orden conocido, con punto inicial declarado) sin fijar una convención única de punto inicial, porque el reconocimiento demostró dos convenciones vivas (0 y 1 como origen)  …[TRUNCADO]` |
| G0742 | R4 | 1 | — | `4. El runner existe pero no se ha ejecutado. Pendientes: generador de casos, acreditación de semillas, asiento del criterio de superación y designación del evaluador.` |
| G0743 | R4 | 1 | — | `4. Fuera de esta instanciación y pendientes: semillas, perfiles, N, escala, forma de comparación y designación del evaluador externo.` |
| G0744 | R4 | 3 | — | `5 (mismo HEAD citado arriba, mismas semillas, mismo PROFILE, mismo` |
| G0745 | R4 | 1 | — | `5. **Semillas.** El rango de semillas deberá ser secuencial y contiguo, de orden conocido, con punto inicial declarado explícitamente en el artefacto o en el script. Este documento no prescribe una convención concreta de punto inicial.` |
| G0746 | R4 | 11 | — | `6. **Determinismo:** misma seed → mismo plan, byte a byte, en ambos motores. `seed = hash(userId + weekNumber)`.` |
| G0747 | R4 | 1 | — | `Ausencia de un elemento de la semilla = "no localizado", no sustitucion por equivalente.` |
| G0748 | R4 | 2 | — | `Byte-idéntico en las 3 corridas, para ambas seeds, sobre el **objeto completo sin proyección**.` |
| G0749 | R4 | 1 | — | `Clave, separada de la vista: `{ version, seed, entradas: [ { etiqueta, id } ] }`. El runner añade el motor a cada entrada y escribe vista y clave en archivos distintos.` |
| G0750 | R4 | 1 | — | `Codigo (semilla, NO afirmacion de completitud): buildPlan.js, materializePlan.js,` |
| G0751 | R4 | 1 | — | `Escaner de semillas Fase 7 (F-SE.1 a F-SE.9)` |
| G0752 | R4 | 1 | — | `Evidencia: `analysis/gate2_measure.test.js:222` (`const N = 500;`), `analysis/gate4_protein_guard.test.js:46` (`const N = 200;`), `analysis/baseline_n1000.mjs:35` (`seed < 1000`). El valor de N varía por campaña (200/500/1000); lo invariante es que siempre se declara explícitamente, nunca se omite.` |
| G0753 | R4 | 1 | — | `Expected changes due to intentional selection shift; stability/seed-sensitivity assertions re-run green.` |
| G0754 | R4 | 1 | — | `Fallos sin corrección: número de días distinto de 7, ausencia de comida o de cena, momento duplicado, plato vacío, momento no canónico, claves extra, ids duplicados o semilla inválida.` |
| G0755 | R4 | 1 | — | `Fase 7: generador de casos (perfiles, traduccion, verificaciones, registro de semillas)` |
| G0756 | R4 | 1 | — | `Filtra el catalogo de anclas por intolerancias ANTES del sorteo por seed` |
| G0757 | R4 | 1 | — | `Merge escaner de semillas Fase 7` |
| G0758 | R4 | 1 | — | `N=500, mismas semillas/perfil) con tres vistas complementarias que la baseline no` |
| G0759 | R4 | 1 | — | `Perimetro: los cinco ficheros .js de la semilla.` |
| G0760 | R4 | 3 | — | `Re-ejecución de la campaña anclada de D-042 (mismas semillas, mismo` |
| G0761 | R4 | 1 | — | `Se revisaron los encabezados de bucle exterior de todos los ficheros de `analysis/` (`grep` sobre `for (let seed\|for (let i`) y de los dos runners de `docs/evidence/variedad-verdura/`. En todos los casos localizados el bucle exterior asocia una iteración a una única llamada productora de plan (`buil …[TRUNCADO]` |
| G0762 | R4 | 1 | — | `\\`seed = i + 1\\`, RNG mulberry32 vía \\`buildWeekArc\\`/\\`runWalk\\`). Ver` |
| G0763 | R4 | 1 | — | `\\`seed = i + 1\\`, RNG mulberry32 vía \\`selectRng\\`/\\`buildWeekArc\\`). Ver` |
| G0764 | R4 | 1 | — | `\\`veg_variety_engine2_freq.md\\` (mismo commit, mismas semillas, mismo` |
| G0765 | R4 | 1 | — | ``seed = i + 1`, RNG mulberry32 vía `buildWeekArc`/`runWalk`). Ver` |
| G0766 | R4 | 1 | — | ``seed = i + 1`, RNG mulberry32 vía `selectRng`/`buildWeekArc`). Ver` |
| G0767 | R4 | 1 | — | ``veg_variety_engine2_freq.md` (mismo commit, mismas semillas, mismo` |
| G0768 | R4 | 1 | — | `a mulberry32(_hashStr(userId+weekNumber)): misma seed, mismo plan byte a` |
| G0769 | R4 | 1 | — | `byte (excluyendo day.id, que sigue dependiendo de planSeed=Date.now() —` |
| G0770 | R4 | 1 | — | `combinaciones reales de seed x perfil).` |
| G0771 | R4 | 2 | — | `commit, mismas semillas, mismo PROFILE, mismo catálogo). Reproducir con:` |
| G0772 | R4 | 1 | — | `console.log('\\n--- COMPARACIÓN (apareada por semana/semilla) ---');` |
| G0773 | R4 | 1 | — | `console.log(`=== Adaptador humanScore (D-025) -- seed=${SEED}, trainingDays=[${PROFILE.trainingDays.join(', ')}] ===\\n`);` |
| G0774 | R4 | 1 | — | `console.log(`blind-run: ${r1.evaluador.planes.length} planes cegados (seed ${manifest.seed}).`);` |
| G0775 | R4 | 1 | — | `const r1 = blind(items, manifest.seed);` |
| G0776 | R4 | 1 | — | `const r2 = blind(items, manifest.seed);` |
| G0777 | R4 | 1 | — | `const { weekArc } = buildWeekArc({ profile: PROFILE, seed: SEED, strategy: 'x' });` |
| G0778 | R4 | 1 | — | `control negativo: la densidad de engine2 es hoy realización de seed, no` |
| G0779 | R4 | 2 | — | `corridas de ambas seeds. A diferencia de legacy, el objeto de engine2 no tiene un campo `id`` |
| G0780 | R4 | 1 | — | `de seed × legibilidad. Adicionalmente, toda fixture cuyo único` |
| G0781 | R4 | 1 | — | `decision. Demostrado con un test de desacople que fija (seed, perfil) y` |
| G0782 | R4 | 3 | — | `describe('baseline — confirmación 3: la ruta sin opts.rng usa de verdad mulberry32(_hashStr(userId+weekNumber))', () => {` |
| G0783 | R4 | 2 | — | `describe('buildPlan — golden snapshot (seeded)', () => {` |
| G0784 | R4 | 1 | — | `describe('buildPlan — seed determinista por defecto (sin opts.rng)', () => {` |
| G0785 | R4 | 2 | — | `describe('casos — semillas contra registro', () => {` |
| G0786 | R4 | 1 | — | `describe('control 1 -- reproducibilidad: misma seed -> mismo artefacto', () => {` |
| G0787 | R4 | 1 | — | `describe('control 1b -- mutacion de seed produce artefacto distinto', () => {` |
| G0788 | R4 | 5 | — | `describe('determinismo: misma seed -> mismo weekArc byte a byte', () => {` |
| G0789 | R4 | 2 | — | `describe('generarCaso con motores reales (semillas de test)', () => {` |
| G0790 | R4 | 4 | — | `describe('runWalk - v9: determinismo pleno (misma seed -> plan y log byte-identicos)', () => {` |
| G0791 | R4 | 1 | — | `elige entre A/B/C UNICAMENTE por seed, sin filtros, con RNG namespaced` |
| G0792 | R4 | 1 | — | `espacio total; (c) assertNoCaprichoCollision verde sobre 200 seeds x 9` |
| G0793 | R4 | 1 | — | `export const TERMINOS = ['seed', 'semilla', 'mulberry32('];` |
| G0794 | R4 | 2 | — | `export function blind(items, seed) {` |
| G0795 | R4 | 5 | — | `export function buildWeekArc({ profile, seed, strategy }) {` |
| G0796 | R4 | 2 | — | `export function chooseAnchor(anchors, seed, intolerancias, decisionLog, getVista = anchorVista) {` |
| G0797 | R4 | 1 | — | `export function deriveSeed(fixture) {` |
| G0798 | R4 | 2 | — | `export function entradaEngine2(perfilId, semilla) {` |
| G0799 | R4 | 2 | — | `export function entradaLegacy(perfilId, semilla) {` |
| G0800 | R4 | 1 | — | `export function expandWeekArc({ weekArc, catalog, seed }) {` |
| G0801 | R4 | 1 | — | `export function generarCaso(perfilId, semilla, catalog = loadCatalog()) {` |
| G0802 | R4 | 2 | — | `export function idPlan(perfilId, semilla, motor) {` |
| G0803 | R4 | 4 | — | `export function mulberry32(seed) {` |
| G0804 | R4 | 1 | — | `export function seedFromString(str) {` |
| G0805 | R4 | 2 | — | `export function verificarSemillas(semillas, registro) {` |
| G0806 | R4 | 4 | — | `function chooseAnchor(seed, decisionLog) {` |
| G0807 | R4 | 4 | — | `function chooseSkeleton(seed, decisionLog) {` |
| G0808 | R4 | 1 | — | `function collectWeekData(slots, decisionLog, catalog, seedIndex) {` |
| G0809 | R4 | 6 | — | `function mulberry32(seed) {` |
| G0810 | R4 | 6 | — | `function resolveSeed(seed) {` |
| G0811 | R4 | 5 | — | `function run(seed) {` |
| G0812 | R4 | 1 | — | `function run(seed, extraOpts = {}) {` |
| G0813 | R4 | 1 | — | `function runBuildPlan(seed) {` |
| G0814 | R4 | 1 | — | `function runSeeded(userId, weekNumber) {` |
| G0815 | R4 | 3 | — | `function runWeek(seed, catalog) {` |
| G0816 | R4 | 6 | — | `function selectRng(seed) {` |
| G0817 | R4 | 1 | — | `function verificarExhaustividadPaso5(decisionLog, seed) {` |
| G0818 | R4 | 1 | — | `function walkRng(seed) {` |
| G0819 | R4 | 1 | — | `if (!Number.isInteger(manifest.seed)) fail('manifiesto.seed debe ser un entero declarado');` |
| G0820 | R4 | 2 | — | `import { SEMILLAS_EVALUACION, ESTRATEGIA } from './casos.js';` |
| G0821 | R4 | 2 | — | `import { escanear, escribirSalida } from './escanearSemillas.mjs';` |
| G0822 | R4 | 1 | — | `import { mulberry32, seedFromString } from '../../skeleton/rng.js';` |
| G0823 | R4 | 7 | — | `import { mulberry32, seedFromString } from '../skeleton/rng.js';` |
| G0824 | R4 | 6 | — | `import { mulberry32, seedFromString } from './rng.js';` |
| G0825 | R4 | 1 | — | `las 3 variantes (seeds verificados A=7/B=1/C=0); los tests especificos` |
| G0826 | R4 | 1 | — | `llamadas misma seed -> mismo JSON), sobras respetan su propio techo,` |
| G0827 | R4 | 1 | — | `misma seed. TEMPLATES exportado.` |
| G0828 | R4 | 1 | — | `necesitar seeds: batchDay no depende de la ancla): 83.3% de las 54` |
| G0829 | R4 | 1 | — | `por la ruta REAL de seed de produccion (hash(userId+weekNumber) via` |
| G0830 | R4 | 1 | — | `proceso (seed distinta → artefacto distinto), no autenticidad del` |
| G0831 | R4 | 1 | — | `rotativa, expandWeekArc no cambia, y las semillas son idénticas—, el` |
| G0832 | R4 | 1 | — | `rotativos), determinista en 5 seeds sin RNG, mas control sin memoria` |
| G0833 | R4 | 1 | — | `seedeado, sin ningún cambio sin atribuir a uno de los 6 bugs.` |
| G0834 | R4 | 1 | — | `sensitivity (different seeds → different plans), and that buildPlan runs` |
| G0835 | R4 | 1 | — | `skeletonId="C" en su busqueda de seed, ya que el seed elige tambien la` |
| G0836 | R4 | 1 | — | `test(engine): golden snapshot of seeded weekly plan` |
| G0837 | R4 | 1 | — | `varianza de seed, no efecto del campo. Alcance: catálogo y fixtures` |
| G0838 | R4 | 1 | — | `via opts.rng. Verifies stability (two seeded runs are byte-identical),` |
| G0839 | R4 | 2 | — | `\| RNG \| `mulberry32` (definido inline en cada runner; engine2 pasa el entero `seed` directamente a `buildWeekArc`/`runWalk`, legacy lo envuelve como `rng: mulberry32(seed)`) \|` |
| G0840 | R4 | 1 | — | `\| Semillas \| 1..${N} (\\`seed = i + 1\\`) \|` |
| G0841 | R4 | 1 | — | `\| §5.5 Semillas \| `:46` \| No — nivel semana (§2, `:23`) \| No \|` |
| G0842 | R4 | 3 | — | `} from './semillas.js';` |

## Consulta 2001-2010: grupos R1-R3 que intersectan

| id | regla | ocurrencias | valores | texto |
|---|---|---|---|---|
| G0149 | R2 | 1 | 2001, 2010 | `  it('20 casos: 2 perfiles × semillas 2001–2010', () => {` |
| G0153 | R2 | 1 | 2026, 10 | `## D-088 — [2026-10-06] Ventana de semillas de la primera Fase 7 (enmienda de D-087, punto 5)` |
| G0162 | R2 | 1 | 2001, 2010 | `- `SEMILLAS_EVALUACION` pasa a 2001–2010. Se actualizan el título y la aserción del test de definición, la aserción que usa un miembro de la ventana y los comentarios que documentan la ventana. Los datos de prueba del validador que usan 1001 no se modifican.` |
| G0164 | R2 | 1 | 2001, 2010 | `// Tests de las reglas puras del escáner de semillas. Ningún fixture usa enteros 2001-2010.` |
| G0167 | R2 | 2 | 2001, 2010 | `3. Aplicada sobre U (consolidación reproducida por el titular; resultado sha256 `485ceda6…3ec9`), 1001–1010 interseca U y 2001–2010 no. Las semillas de evaluación pasan a ser 2001–2010: contiguas, con punto inicial declarado (protocolo §5.5).` |
| G0171 | R2 | 1 | 2001, 2010 | `D-088: ventana de semillas de Fase 7 pasa a 2001-2010 (enmienda de D-087)` |
| G0184 | R2 | 1 | 2001, 2010 | `Merge D-088: ventana de semillas 2001-2010` |
| G0187 | R2 | 4 | 2026, 7 | ``docs/evidence/plan-observable/2026-07-18-legacy-conformidad-v1.0.md` — este artefacto no ejecuta una campaña multi-semilla: es la verificación estructural de un único objeto de plan (`weekNumber: 13`, 2026-07-18-legacy-conformidad-v1.0.md:21). La palabra "semana" no aparece en ningún punto de este  …[TRUNCADO]` |
| G0212 | R3 | 1 | 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 | `    expect([...SEMILLAS_EVALUACION]).toEqual([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010]);` |
| G0226 | R3 | 1 | 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010 | `export const SEMILLAS_EVALUACION = Object.freeze([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010]);` |

## Consulta: todos los grupos R4

| id | regla | ocurrencias | valores | texto |
|---|---|---|---|---|
| G0227 | R4 | 6 | — | `          "Esparce las semillas por encima.",` |
| G0228 | R4 | 8 | — | `          "Mezcla el yogur con las semillas de chía.",` |
| G0229 | R4 | 6 | — | `          "Semillas de calabaza (10g)",` |
| G0230 | R4 | 8 | — | `          "Semillas de chía (20g)",` |
| G0231 | R4 | 6 | — | `          "Semillas de lino (10g)",` |
| G0232 | R4 | 4 | — | `          const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });` |
| G0233 | R4 | 1 | — | `          profile, seed, strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0234 | R4 | 1 | — | `          { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed),` |
| G0235 | R4 | 1 | — | `        "Aceite de girasol (10ml)", "Semillas de sésamo"` |
| G0236 | R4 | 1 | — | `        "Aceite de sésamo (10ml)", "Semillas de sésamo",` |
| G0237 | R4 | 1 | — | `        "Almendras crudas (10g)", "Nueces (5g)", "Semillas de chía o lino (5g)",` |
| G0238 | R4 | 1 | — | `        "Añade gochujang al gusto, aceite de sésamo y semillas. Mezcla todo antes de comer."` |
| G0239 | R4 | 1 | — | `        "Cebolleta (1)", "Semillas de sésamo tostado",` |
| G0240 | R4 | 1 | — | `        "Cebolleta (1)", "Semillas de sésamo",` |
| G0241 | R4 | 1 | — | `        "Espolvorear frutos secos picados y semillas.",` |
| G0242 | R4 | 1 | — | `        "Montar bowl: quinoa de base, sectores de pollo, garbanzos, verduras y espinacas. Aliñar con tahini y terminar con semillas."` |
| G0243 | R4 | 1 | — | `        "Pepino (1)", "Semillas de sésamo",` |
| G0244 | R4 | 1 | — | `        "Semillas de sésamo tostado",` |
| G0245 | R4 | 1 | — | `        "Semillas de sésamo y calabaza (10g)",` |
| G0246 | R4 | 1 | — | `        "Semillas de sésamo",` |
| G0247 | R4 | 1 | — | `        "Servir verduras crujientes con pollo encima, salsa y semillas de sésamo."` |
| G0248 | R4 | 1 | — | `        "Sirve con ensalada de pepino aliñada con aceite de sésamo y semillas."` |
| G0249 | R4 | 1 | — | `        "Sirve sobre el arroz con semillas de sésamo y cebolleta."` |
| G0250 | R4 | 1 | — | `        "Terminar con cebolleta, semillas de sésamo y aceite de sésamo."` |
| G0251 | R4 | 8 | — | `        "p1": "150g yogur griego 0% (125g) · 2 cdas semillas de chía · 100g frutas del bosque",` |
| G0252 | R4 | 1 | — | `        "p1": "200g bebida vegetal (180ml) · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0253 | R4 | 5 | — | `        "p1": "200g yogur griego 0% (125g) · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0254 | R4 | 6 | — | `        "title": "Yogur con semillas y fruta",` |
| G0255 | R4 | 2 | — | `        + 'ningun superviviente disponible para el sorteo por seed',` |
| G0256 | R4 | 2 | — | `        const c = generarCaso(perfil, semilla);` |
| G0257 | R4 | 1 | — | `        const seed = i + 1;` |
| G0258 | R4 | 5 | — | `        const { weekArc } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0259 | R4 | 2 | — | `        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed, strategy: fixture.expectedStrategy });` |
| G0260 | R4 | 4 | — | `        const { weekArc } = buildWeekArc({ profile: fixture.profile, seed: seedQueEligeEstaAncla, strategy: fixture.expectedStrategy });` |
| G0261 | R4 | 8 | — | `        const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0262 | R4 | 4 | — | `        expect(seedQueEligeEstaAncla, `${fixture.name} nunca eligio ${anchor.identityKey} en 500 seeds`).not.toBeNull();` |
| G0263 | R4 | 4 | — | `        let seedQueEligeEstaAncla = null;` |
| G0264 | R4 | 5 | — | `        seed: fixture.userId,` |
| G0265 | R4 | 1 | — | `        throw new Error(`veg_variety_engine2_paso5: hueco colocado sin causa en decisionLog, ${slot.day}/${slot.momento} (seed=${seedIndex + 1})`);` |
| G0266 | R4 | 1 | — | `        throw new Error(`veg_variety_engine2_paso5: hueco sin dishId en ${day.day}/${slot ? slot.momento : '?'} (seed=${seedIndex + 1})`);` |
| G0267 | R4 | 1 | — | `        weekArc, catalog, seed, profile,` |
| G0268 | R4 | 1 | — | `      "cause": "eleccion_ancla_por_seed",` |
| G0269 | R4 | 1 | — | `      "cause": "eleccion_esqueleto_por_seed",` |
| G0270 | R4 | 1 | — | `      "seed": "baseline-defflexible12",` |
| G0271 | R4 | 1 | — | `      "seed": "baseline-defsaciante11",` |
| G0272 | R4 | 1 | — | `      "seed": "baseline-fatlossgeneral10",` |
| G0273 | R4 | 1 | — | `      "seed": "baseline-mant-intol16",` |
| G0274 | R4 | 1 | — | `      "seed": "baseline-mant-simple18",` |
| G0275 | R4 | 1 | — | `      "seed": "baseline-mant-training17",` |
| G0276 | R4 | 1 | — | `      "seed": "baseline-mantenimiento13",` |
| G0277 | R4 | 1 | — | `      "seed": "baseline-volumenagresivo15",` |
| G0278 | R4 | 1 | — | `      "seed": "baseline-volumenlimpio14",` |
| G0279 | R4 | 2 | — | `      : `seed=${JSON.stringify(seed)} -> indice ${index} de ${anchors.length} anclas catalogadas en CP2 (sin filtros)`,` |
| G0280 | R4 | 2 | — | `      ? `seed=${JSON.stringify(seed)} -> indice ${index} de ${supervivientes.length} anclas supervivientes del veto (de ${anchors.length} catalogadas)`` |
| G0281 | R4 | 38 | — | `      PDB.seedDemo();` |
| G0282 | R4 | 1 | — | `      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'capricho-fijo', strategy: 'x' })` |
| G0283 | R4 | 5 | — | `      buildWeekArc({ profile: { trainingDays: ['Martes'] }, seed: 'seed-fija-42', strategy: 'volumen_limpio' })` |
| G0284 | R4 | 1 | — | `      console.error('seed:', seed, '\| day:', entry.day, '\| momento:', entry.momento);` |
| G0285 | R4 | 1 | — | `      console.log('\\n  No hay día wildcard en esta semana (depende del seed)');` |
| G0286 | R4 | 3 | — | `      const eleccion = decisionLog.find((d) => d.cause === 'eleccion_ancla_por_seed');` |
| G0287 | R4 | 3 | — | `      const elegido = chooseAnchor(anchorsSinteticos, seed, ['gluten'], decisionLog, getVistaSintetica);` |
| G0288 | R4 | 6 | — | `      const elegido = chooseAnchor(mezcla, seed, ['gluten'], [], getVistaSintetica);` |
| G0289 | R4 | 3 | — | `      const elegido = chooseAnchorSucio(anchorsSinteticos, seed);` |
| G0290 | R4 | 1 | — | `      const id = idPlan(g.perfilId, g.semilla, motor);` |
| G0291 | R4 | 1 | — | `      const idxEsperado = Math.floor(mulberry32(seedFromString(`${seed}::walk`))() * MOMENTOS.length);` |
| G0292 | R4 | 3 | — | `      const resultados = ESTRATEGIAS_REALES.map((strategy) => buildWeekArc({ profile: fixedProfile, seed, strategy }));` |
| G0293 | R4 | 3 | — | `      const rng = (() => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 \| s); t = (t + Math.imul(t ^ (t >>> 7), 61 \| t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` |
| G0294 | R4 | 3 | — | `      const rng = rngSucio(seedNum);` |
| G0295 | R4 | 4 | — | `      const { decisionLog } = runWalk({ weekArc, catalog, seed });` |
| G0296 | R4 | 3 | — | `      const { slots } = expandWeekArc({ weekArc, catalog, seed });` |
| G0297 | R4 | 4 | — | `      const { slots } = runWalk({ weekArc, catalog, seed });` |
| G0298 | R4 | 3 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v15-f3-${seed}` });` |
| G0299 | R4 | 1 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-${seed}` });` |
| G0300 | R4 | 1 | — | `      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v17-control-${seed}` });` |
| G0301 | R4 | 1 | — | `      const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });` |
| G0302 | R4 | 4 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed, strategy: 'x' });` |
| G0303 | R4 | 2 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed, strategy: 'x' });` |
| G0304 | R4 | 5 | — | `      const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0305 | R4 | 3 | — | `      const { weekArc, decisionLog } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0306 | R4 | 1 | — | `      expect(found, `ancla #${targetIndex} nunca alcanzada en 500 seeds con fuente inyectada`).toBe(true);` |
| G0307 | R4 | 3 | — | `      expect(found, `ancla #${targetIndex} nunca alcanzada en 500 seeds sin veto`).toBe(true);` |
| G0308 | R4 | 5 | — | `      expect(found, `no se encontro seed que eligiera el ancla #${targetIndex} en 500 intentos`).not.toBeNull();` |
| G0309 | R4 | 1 | — | `      fail(`caso ${perfilId}-${semilla}: ${e instanceof CasoError ? e.message : e.stack}`);` |
| G0310 | R4 | 1 | — | `      generados.push(generarCaso(perfilId, semilla, catalog));` |
| G0311 | R4 | 5 | — | `      if (idx === ANCHORS.indexOf(crema) && !seedCrema) seedCrema = seed;` |
| G0312 | R4 | 5 | — | `      if (idx === ANCHORS.indexOf(guiso) && !seedGuiso) seedGuiso = seed;` |
| G0313 | R4 | 1 | — | `      if (weekArc.skeletonId === 'A') seedA = seed;` |
| G0314 | R4 | 2 | — | `      it(`${perfil}-${semilla}: pasa las cuatro verificaciones`, () => {` |
| G0315 | R4 | 3 | — | `      let s = seedNum >>> 0;` |
| G0316 | R4 | 1 | — | `      p1: "Yogur griego natural alto en proteína · fruta variada de temporada (fresa, plátano, kiwi, manzana) · frutos secos y semillas",` |
| G0317 | R4 | 28 | — | `      p1:"150g "+yogur+" · 2 cdas semillas de chía · 100g frutas del bosque",` |
| G0318 | R4 | 28 | — | `      p1:"200g "+yogur+" · 1 cda semillas de lino · 1 cda semillas de calabaza",` |
| G0319 | R4 | 1 | — | `      p2: "Salsa de soja · jengibre · ajo · aceite de sésamo · semillas de sésamo",` |
| G0320 | R4 | 1 | — | `      p2: "Salsa de tahini con limón · semillas de sésamo y de calabaza",` |
| G0321 | R4 | 1 | — | `      p2: "Salsa de yogur con curry suave · semillas de sésamo",` |
| G0322 | R4 | 1 | — | `      p2: "Semillas de sésamo · cilantro opcional · salsa sriracha",` |
| G0323 | R4 | 28 | — | `      p2:"1 cda semillas de calabaza · 1 cda coco rallado · Café o té",` |
| G0324 | R4 | 28 | — | `      p2:"1 cda semillas de calabaza · zumo de ½ limón · miel · Café",` |
| G0325 | R4 | 28 | — | `      p2:(noNuts?"15g semillas de girasol":"20g nueces o almendras")+" · Té o agua",` |
| G0326 | R4 | 28 | — | `      p2:(noNuts?"Semillas de lino (8g)":"15g almendras o nueces")+" · Café o té",` |
| G0327 | R4 | 73 | — | `      post-filtros) → v10 ROJO (`Miercoles` deja de ser consistente entre semillas: el candidato` |
| G0328 | R4 | 1 | — | `      profile, seed, strategy: 'x', fuenteEditorial,` |
| G0329 | R4 | 1 | — | `      profile, seed: 'D-038-gluten', strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0330 | R4 | 1 | — | `      profile, seed: 'D-038-lactosa', strategy: 'x', fuenteEditorial: fuenteEditorialAnclasLimpias,` |
| G0331 | R4 | 28 | — | `      recipe:["Mezcla el yogur con las semillas de chía.","Deja reposar 5 minutos (o prepara la noche anterior).","Añade las frutas por encima.","Aliña con miel y canela al gusto."],` |
| G0332 | R4 | 28 | — | `      recipe:["Tritura las frutas congeladas con el yogur hasta textura espesa.","Vierte en un bol.","Decora con semillas y coco rallado.","Sirve inmediatamente — se derrite rápido."],` |
| G0333 | R4 | 28 | — | `      recipe:["Trocea las frutas en dados del mismo tamaño.","Aliña con zumo de limón y miel.","Sirve en bol con el yogur encima.","Esparce las semillas de calabaza.","Puede prepararse la noche anterior sin el yogur."],` |
| G0334 | R4 | 28 | — | `      recipe:["Vierte el yogur en un bol.","Esparce las semillas por encima.","Añade la fruta troceada.","Aliña con miel al gusto."],` |
| G0335 | R4 | 28 | — | `      return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood\|\|null, effectiveMood:dayMood, meals:_drMeals, shakeEnabled:!!_drSpec.shakeEnabledOverride};` |
| G0336 | R4 | 1 | — | `      seed,` |
| G0337 | R4 | 5 | — | `      seed: 'demo-cp3a',` |
| G0338 | R4 | 28 | — | `      shopping:["Fruta (1 ud)",(noNuts?"Semillas de girasol (15g)":"Nueces o almendras (20g)")].filter(Boolean),` |
| G0339 | R4 | 28 | — | `      shopping:["Frutas congeladas (150g)","Yogur griego 0% (100g)","Semillas de calabaza (10g)","Coco rallado (10g)"],` |
| G0340 | R4 | 28 | — | `      shopping:["Frutas frescas variadas (200g)","Yogur griego 0% (150g)","Semillas de calabaza (10g)","Limón (½ ud)","Miel (1 cda)"],` |
| G0341 | R4 | 28 | — | `      shopping:["Muesli sin azúcar ("+bfP.avena+"g)","Yogur griego 0% (125g)","Fruta fresca (80g)",(noNuts?"Semillas de lino (8g)":"Almendras (15g)")].filter(Boolean),` |
| G0342 | R4 | 28 | — | `      shopping:["Yogur griego 0% (150g)","Semillas de chía (20g)","Frutas del bosque (100g)","Miel (1 cda)"],` |
| G0343 | R4 | 28 | — | `      shopping:["Yogur griego 0% (200g)","Semillas de lino (10g)","Semillas de calabaza (10g)","Fruta (1 ud)","Miel (1 cda)"],` |
| G0344 | R4 | 2 | — | `      throw new CasoError(`registro de semillas: usos[${k}] mal formado`);` |
| G0345 | R4 | 1 | — | `      weekArc, catalog: catalogReal, seed, profile, fuenteEditorial,` |
| G0346 | R4 | 1 | — | `      weekArc: weekArcBase, catalog: catalogReal, seed, profile,` |
| G0347 | R4 | 73 | — | `     (prohibido). Reutilizar literalmente `${seed}::walk` reiniciaría la secuencia desde el índice` |
| G0348 | R4 | 73 | — | `     `${seed}::walk::select` (mismo namespace lógico "walk", stream independiente), documentado en` |
| G0349 | R4 | 73 | — | `     `mulberry32(seedFromString(`${seed}::walk`))` para su propio desempate de momento del ancla;` |
| G0350 | R4 | 73 | — | `     ancla de P1a — no rompe el determinismo (la seed sigue fijando el resultado) pero es una` |
| G0351 | R4 | 1 | — | `    (buildWeekArc, runWalk, days NO estaban en la semilla; afloran por import literal a` |
| G0352 | R4 | 5 | — | `    // (sin filtros: solo necesitamos UNA seed que aterrice en cada indice).` |
| G0353 | R4 | 38 | — | `    // 4. seedDemo           — only when users array is empty (first ever load)` |
| G0354 | R4 | 1 | — | `    // Buscamos un seed real que resuelva a la plantilla A.` |
| G0355 | R4 | 1 | — | `    // Distintos mecanismos de seed deben producir secuencias _rnd distintas` |
| G0356 | R4 | 1 | — | `    // Dos weekArc identicos (mismo seed/profile/strategy) -> mismo consumo` |
| G0357 | R4 | 5 | — | `    // Fuerza cada ancla probando seeds hasta encontrar una que la elija` |
| G0358 | R4 | 3 | — | `    // Un seed por variante, verificado de antemano (no asumido). El punto` |
| G0359 | R4 | 3 | — | `    // Y de control: una semilla manual distinta (otro hash) NO coincide —` |
| G0360 | R4 | 1 | — | `    // ambos ids deben aparecer ganando en algunas de las seeds.` |
| G0361 | R4 | 1 | — | `    // coincidir con esta expectativa para practicamente cualquier seed.` |
| G0362 | R4 | 1 | — | `    // colapsa silenciosamente al mismo resultado que la seed por defecto).` |
| G0363 | R4 | 1 | — | `    // en algun seed -- confirma que la exclusion determinista del test` |
| G0364 | R4 | 3 | — | `    // estan calculados para batchDay=Miercoles) -- desde CP3B el seed` |
| G0365 | R4 | 1 | — | `    // mulberry32(seedFromString(`${seed}::walk`)) -- si expandWeekArc` |
| G0366 | R4 | 28 | — | `    ? function(){return {build:BF_SG.yogurSemillas, protein:"bf_yogur", plateType:"desayuno"};}` |
| G0367 | R4 | 68 | — | `    `(anchors, seed, intolerancias, decisionLog, getVista?)` — filtra ANTES del sorteo` |
| G0368 | R4 | 1 | — | `    b41e826:src/engine/buildPlan.js:45:  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));` |
| G0369 | R4 | 6 | — | `    cause: 'eleccion_ancla_por_seed',` |
| G0370 | R4 | 4 | — | `    cause: 'eleccion_esqueleto_por_seed',` |
| G0371 | R4 | 2 | — | `    clave: { version: BLIND_VERSION, seed, entradas },` |
| G0372 | R4 | 21 | — | `    console.info("[NutiPlan] Demo accounts seeded (nutri@demo.com / demo123)");` |
| G0373 | R4 | 2 | — | `    const a = JSON.stringify(serialiseDays(runSeeded('user-abc', 23).days));` |
| G0374 | R4 | 5 | — | `    const a = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-A', strategy: 'x' });` |
| G0375 | R4 | 2 | — | `    const a = serialiseDays(run(SEED).days);` |
| G0376 | R4 | 1 | — | `    const a = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0377 | R4 | 1 | — | `    const antes = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });` |
| G0378 | R4 | 1 | — | `    const b = JSON.stringify(serialiseDays(runSeeded('user-abc', 24).days));` |
| G0379 | R4 | 1 | — | `    const b = JSON.stringify(serialiseDays(runSeeded('user-xyz', 23).days));` |
| G0380 | R4 | 5 | — | `    const b = buildWeekArc({ profile: { trainingDays: [] }, seed: 'seed-B', strategy: 'x' });` |
| G0381 | R4 | 2 | — | `    const b = serialiseDays(run(SEED).days);` |
| G0382 | R4 | 1 | — | `    const b = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0383 | R4 | 3 | — | `    const bySeed = Object.fromEntries(r1.weekArc.beats.map((b) => [b.day, b.fixedRole]));` |
| G0384 | R4 | 3 | — | `    const bySeedSucio = Object.fromEntries(weekArcSucio.beats.map((b) => [b.day, b.fixedRole]));` |
| G0385 | R4 | 1 | — | `    const contaminado = expandWeekArc({ weekArc, catalog, seed });` |
| G0386 | R4 | 1 | — | `    const despues = buildWeekArc({ profile, seed, strategy: 'fat_loss_general' });` |
| G0387 | R4 | 1 | — | `    const entradaCaso = { caso: `${g.perfilId}-${g.semilla}`, perfil: g.perfilId, semilla: g.semilla, planes: [] };` |
| G0388 | R4 | 2 | — | `    const f = g.find((x) => x.clave.texto.startsWith('for (let seed'));` |
| G0389 | R4 | 5 | — | `    const fixedInput = { profile: { trainingDays: ['Lunes', 'Viernes'] }, seed: 'desacople-fijo' };` |
| G0390 | R4 | 1 | — | `    const limpio = expandWeekArc({ weekArc, catalog, seed });` |
| G0391 | R4 | 3 | — | `    const manualRng = mulberry32(manualSeed);` |
| G0392 | R4 | 3 | — | `    const manualSeed = _hashStr(String(fixture.userId) + ':' + fixture.weekNumber);` |
| G0393 | R4 | 1 | — | `    const r = run(SEED);` |
| G0394 | R4 | 3 | — | `    const r1 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0395 | R4 | 1 | — | `    const r1 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });` |
| G0396 | R4 | 4 | — | `    const r1 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });` |
| G0397 | R4 | 3 | — | `    const r2 = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0398 | R4 | 1 | — | `    const r2 = expandWeekArc({ weekArc, catalog, seed: 'v3-seed' });` |
| G0399 | R4 | 4 | — | `    const r2 = runWalk({ weekArc, catalog, seed: 'v2-ambiguo' });` |
| G0400 | R4 | 1 | — | `    const reportA = runWith(seedA);` |
| G0401 | R4 | 1 | — | `    const reportB = runWith(seedB);` |
| G0402 | R4 | 3 | — | `    const resAusente = buildWeekArc({ profile: { trainingDays: [] }, seed, strategy: 'x' });` |
| G0403 | R4 | 11 | — | `    const resBase = buildWeekArc({ profile: base.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0404 | R4 | 5 | — | `    const resCrema = buildWeekArc({ profile: { trainingDays: [] }, seed: seedCrema, strategy: 'x' });` |
| G0405 | R4 | 5 | — | `    const resGuiso = buildWeekArc({ profile: { trainingDays: [] }, seed: seedGuiso, strategy: 'x' });` |
| G0406 | R4 | 5 | — | `    const resIntol = buildWeekArc({ profile: intolerancias.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0407 | R4 | 5 | — | `    const resSimple = buildWeekArc({ profile: isSimple.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0408 | R4 | 5 | — | `    const resTraining = buildWeekArc({ profile: conTraining.profile, seed: seedComun, strategy: 'mantenimiento_equilibrado' });` |
| G0409 | R4 | 3 | — | `    const resVacio = buildWeekArc({ profile: { trainingDays: [], intolerances: [] }, seed, strategy: 'x' });` |
| G0410 | R4 | 2 | — | `    const result = run(SEED);` |
| G0411 | R4 | 1 | — | `    const seed = 'T-INV-seed';` |
| G0412 | R4 | 3 | — | `    const seed = 'f19-vacio-vs-ausente';` |
| G0413 | R4 | 3 | — | `    const seed = i + 1;` |
| G0414 | R4 | 1 | — | `    const seedA = deriveSeed(fixture);` |
| G0415 | R4 | 1 | — | `    const seedB = `${seedA}-mutada`;` |
| G0416 | R4 | 6 | — | `    const seedComun = 'fixture-comparativa';` |
| G0417 | R4 | 5 | — | `    const seedComun = 'fixture-training-vs-base';` |
| G0418 | R4 | 1 | — | `    const seeds = FIXTURES.map(deriveSeed);` |
| G0419 | R4 | 3 | — | `    const seedsPorVariante = { A: 7, B: 1, C: 0 };` |
| G0420 | R4 | 1 | — | `    const withRng = serialiseDays(run(SEED).days);` |
| G0421 | R4 | 1 | — | `    const withoutRng = serialiseDays(runSeeded('user-abc', 23).days);` |
| G0422 | R4 | 3 | — | `    const wrongRng = mulberry32(manualSeed + 1);` |
| G0423 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v11-energia' });` |
| G0424 | R4 | 3 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v15-f12-interviene' });` |
| G0425 | R4 | 2 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v16-narracion' });` |
| G0426 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v5-capricho' });` |
| G0427 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-imposible' });` |
| G0428 | R4 | 4 | — | `    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-imposible' });` |
| G0429 | R4 | 3 | — | `    const { decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-sin-veto' });` |
| G0430 | R4 | 2 | — | `    const { decisionLog: walkLog } = runWalk({ weekArc, catalog, seed: FIXTURE_INPUT.seed, profile: FIXTURE_INPUT.profile });` |
| G0431 | R4 | 1 | — | `    const { profile, seed, report } = buildEngine2Report(fixture, catalog);` |
| G0432 | R4 | 2 | — | `    const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });` |
| G0433 | R4 | 4 | — | `    const { slots } = runWalk({ weekArc, catalog, seed: 'v2-uno' });` |
| G0434 | R4 | 3 | — | `    const { slots } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-lactosa-no-toca-gluten', profile });` |
| G0435 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-unico' });` |
| G0436 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v2-vacio' });` |
| G0437 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v3-seed' });` |
| G0438 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v6-a' });` |
| G0439 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v7-b' });` |
| G0440 | R4 | 4 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: 'v8-prioridad' });` |
| G0441 | R4 | 3 | — | `    const { slots, decisionLog } = runWalk({ weekArc, catalog: catalogoAislado, seed: 'v14-valor-y-desconocida', profile });` |
| G0442 | R4 | 1 | — | `    const { slots, decisionLog } = runWeek(seed, catalog);` |
| G0443 | R4 | 1 | — | `    const { weekArc } = buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });` |
| G0444 | R4 | 2 | — | `    const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });` |
| G0445 | R4 | 3 | — | `    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-conserva', strategy: 'mantenimiento_equilibrado' });` |
| G0446 | R4 | 3 | — | `    const { weekArc } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });` |
| G0447 | R4 | 4 | — | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Jueves', 'Viernes'] }, seed: seedCrema, strategy: 'x' });` |
| G0448 | R4 | 1 | — | `    const { weekArc } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed: seedCrema, strategy: 'x' });` |
| G0449 | R4 | 3 | — | `    const { weekArc, decisionLog } = buildWeekArc({ profile: profileBase, seed: 'f18-perdida', strategy: 'mantenimiento_equilibrado' });` |
| G0450 | R4 | 1 | — | `    const { weekArc, decisionLog } = buildWeekArc({ profile: { trainingDays: ['Viernes'] }, seed: seedA, strategy: 'x' });` |
| G0451 | R4 | 1 | — | `    const { weekArc: weekArcBase } = buildWeekArc({ profile, seed, strategy: 'x' });` |
| G0452 | R4 | 1 | — | `    escaner: 'scripts/fase7/escanearSemillas.mjs',` |
| G0453 | R4 | 4 | — | `    evidence: `seed=${JSON.stringify(seed)} -> indice ${index} de ${ANCHORS.length} anclas catalogadas en CP2 (sin filtros)`,` |
| G0454 | R4 | 4 | — | `    evidence: `seed=${JSON.stringify(seed)} -> indice ${index} de ${TEMPLATES.length} plantillas (A/B/C, sin filtros)`,` |
| G0455 | R4 | 1 | — | `    expandWeekArc({ weekArc: antes.weekArc, catalog, seed }); // "existe el walk"` |
| G0456 | R4 | 2 | — | `    expect(() => blind(items(), -1)).toThrow(/seed/);` |
| G0457 | R4 | 2 | — | `    expect(() => blind(items(), 1.5)).toThrow(/seed/);` |
| G0458 | R4 | 2 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk())).not.toThrow();` |
| G0459 | R4 | 1 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk([{ desde: 1005, hasta: 1005, origen: 'prueba X' }]))).toThrow(/1005 ya usada: prueba X/);` |
| G0460 | R4 | 1 | — | `    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk([{ desde: 2005, hasta: 2005, origen: 'prueba X' }]))).toThrow(/2005 ya usada: prueba X/);` |
| G0461 | R4 | 2 | — | `    expect(Object.keys(clave)).toEqual(['version', 'seed', 'entradas']);` |
| G0462 | R4 | 2 | — | `    expect(analizarLinea('mulberry32(x)').literalesNoConsumidos).toEqual([]);` |
| G0463 | R4 | 3 | — | `    expect(bySeed.Domingo).toBe('familiar');` |
| G0464 | R4 | 3 | — | `    expect(bySeed.Lunes).toBe('entreno');` |
| G0465 | R4 | 3 | — | `    expect(bySeed.Miercoles).toBe('entreno');` |
| G0466 | R4 | 3 | — | `    expect(bySeed.Sabado).toBe('libre');` |
| G0467 | R4 | 3 | — | `    expect(bySeed.Viernes).toBe('entreno');` |
| G0468 | R4 | 3 | — | `    expect(bySeedSucio.Sabado).not.toBe('libre'); // demuestra que la asercion de (b) SI habria fallado sobre esta variante rota` |
| G0469 | R4 | 2 | — | `    expect(e.semilla).toBe(S);` |
| G0470 | R4 | 2 | — | `    expect(entradaEngine2('P1', S)).toEqual({ profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] }, seed: S, strategy: ESTRATEGIA });` |
| G0471 | R4 | 1 | — | `    expect(new Set(seeds).size).toBe(9); // sin colisiones entre las 9 fixtures` |
| G0472 | R4 | 2 | — | `    expect(parteI).toMatch(/for \\(let seed/);` |
| G0473 | R4 | 2 | — | `    expect(path.basename(r.rutaJson)).toBe('borrador-semillas.json');` |
| G0474 | R4 | 2 | — | `    expect(path.basename(r.rutaMd)).toBe('borrador-semillas.md');` |
| G0475 | R4 | 1 | — | `    expect(resBase.weekArc.anchors).toHaveLength(1); // control: la base SI tiene ancla con esta seed` |
| G0476 | R4 | 1 | — | `    expect(seedA).not.toBeNull();` |
| G0477 | R4 | 10 | — | `    expect(seedCrema).not.toBeNull();` |
| G0478 | R4 | 5 | — | `    expect(seedGuiso).not.toBeNull();` |
| G0479 | R4 | 1 | — | `    expect(seeds).toEqual(FIXTURES.map((f) => `${f.userId}${f.weekNumber}`));` |
| G0480 | R4 | 3 | — | `    for (const [skeletonEsperado, seed] of Object.entries(seedsPorVariante)) {` |
| G0481 | R4 | 2 | — | `    for (const l of ['seed 1.5', 'seed v1.2.3', 'seed 0x10', 'seed 1_000']) {` |
| G0482 | R4 | 2 | — | `    for (const l of ['seed: base + i', 'function f(semilla) {']) {` |
| G0483 | R4 | 2 | — | `    for (const s of SEMILLAS_TEST) expect(SEMILLAS_EVALUACION).not.toContain(s);` |
| G0484 | R4 | 2 | — | `    for (const semilla of SEMILLAS_EVALUACION) casos.push({ perfilId, semilla });` |
| G0485 | R4 | 2 | — | `    for (const semilla of SEMILLAS_TEST) {` |
| G0486 | R4 | 1 | — | `    for (let i = 0; i < 5; i++) buildWeekArc({ profile, seed, strategy: 'definicion_saciante' });` |
| G0487 | R4 | 3 | — | `    function chooseAnchorSucio(anchors, seed) {` |
| G0488 | R4 | 3 | — | `    function chooseAnchorSucioConDescarte(anchors, seedNum, vetadosIds) {` |
| G0489 | R4 | 3 | — | `    function rngSucio(seedNum) {` |
| G0490 | R4 | 1 | — | `    function runWith(seed) {` |
| G0491 | R4 | 2 | — | `    if (uso) throw new CasoError(`semilla ${s} ya usada: ${uso.origen} (${uso.desde}–${uso.hasta})`);` |
| G0492 | R4 | 1 | — | `    let s = seed;` |
| G0493 | R4 | 1 | — | `    let seedA = null;` |
| G0494 | R4 | 5 | — | `    let seedCrema = null, seedGuiso = null;` |
| G0495 | R4 | 5 | — | `    let seedCrema = null;` |
| G0496 | R4 | 1 | — | `    lines.push(`- seed: \\`${fixture.seed}\\``);` |
| G0497 | R4 | 28 | — | `    macedoniaProtSG:  function(){return {time:"Desayuno",emoji:"🌅",title:"Macedonia con yogur y semillas",` |
| G0498 | R4 | 1 | — | `    opcionesLegacy: { ...OPCIONES_LEGACY, saveMealMemory: 'función vacía', rng: 'mulberry32(semilla) de src/engine/rng.js' },` |
| G0499 | R4 | 68 | — | `    para alguna seed") deja de sostenerse bajo veto activo.` |
| G0500 | R4 | 1 | — | `    perfilId, semilla,` |
| G0501 | R4 | 1 | — | `    profile, seed, strategy, catalog, fuenteEditorial,` |
| G0502 | R4 | 1 | — | `    profile, seed, strategy, fuenteEditorial,` |
| G0503 | R4 | 1 | — | `    registroSemillas: { ruta: registroPath, sha256: sha256(registroTexto), ancla: registro.ancla, perimetro: registro.perimetro },` |
| G0504 | R4 | 28 | — | `    return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:isSat?"libre":isTrain(day)?"entrenamiento":null, mood:slot.mood\|\|null, effectiveMood:dayMood, meals:meals, shakeEnabled:!!profile.extras.proteinShake.enabled};` |
| G0505 | R4 | 2 | — | `    seed que lo sostiene.` |
| G0506 | R4 | 1 | — | `    seed,` |
| G0507 | R4 | 5 | — | `    seed: 'causa-completa',` |
| G0508 | R4 | 2 | — | `    seed: 'demo-cp3a',` |
| G0509 | R4 | 2 | — | `    seed: semilla,` |
| G0510 | R4 | 2 | — | `    semilla,` |
| G0511 | R4 | 1 | — | `    semillas: [...SEMILLAS_EVALUACION],` |
| G0512 | R4 | 2 | — | `    throw new CasoError('registro de semillas: ancla ausente o no es un sha completo');` |
| G0513 | R4 | 2 | — | `    throw new CasoError('registro de semillas: perímetro no declarado');` |
| G0514 | R4 | 2 | — | `    throw new CasoError('semillas: lista vacía o con valores no enteros');` |
| G0515 | R4 | 1 | — | `    verificarExhaustividadPaso5(decisionLog, seed);` |
| G0516 | R4 | 1 | — | `    verificarSemillas([...SEMILLAS_EVALUACION], registro);` |
| G0517 | R4 | 1 | — | `    weekArc, catalog, seed, profile,` |
| G0518 | R4 | 3 | — | `    weekArc, catalog, seed, profile, fuenteEditorial,` |
| G0519 | R4 | 1 | — | `    weekArc, catalog, seed, profile: PROFILE,` |
| G0520 | R4 | 28 | — | `    yogurSemillas: function(){return {time:"Desayuno",emoji:"🌅",title:"Yogur con semillas y fruta",` |
| G0521 | R4 | 3 | — | `    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) },` |
| G0522 | R4 | 1 | — | `    { ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed), ...extraOpts },` |
| G0523 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: () => {}, rng: mulberry32(seed) },` |
| G0524 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) });` |
| G0525 | R4 | 1 | — | `    { ...BASE_OPTS_NO_FF, saveMealMemory: vi.fn(), rng: mulberry32(seed) },` |
| G0526 | R4 | 1 | — | `    { ...JSON.parse(JSON.stringify(entrada.opts)), saveMealMemory: () => {}, rng: mulberry32(entrada.semilla) },` |
| G0527 | R4 | 28 | — | `    {key:"yogurSemillas",   fn:BF_SG.yogurSemillas,    containsGluten:false, needsEgg:false, needsFish:false, sauce:null,      cookM:null,       veggie:null,        protein:"bf_yogur"},` |
| G0528 | R4 | 2 | — | `  "cause": "eleccion_esqueleto_por_seed",` |
| G0529 | R4 | 4 | — | `  // 0. Esqueleto (plantilla A/B/C) por seed, sin filtros.` |
| G0530 | R4 | 2 | — | `  // 2. Ancla por seed, filtrada por veto (D-023) antes del sorteo. Puede` |
| G0531 | R4 | 4 | — | `  // 2. Ancla por seed, sin filtros.` |
| G0532 | R4 | 9 | — | `  // NO-DETERMINISMO CONOCIDO (Fase 0, pendiente): planSeed solo alimenta day.id,` |
| G0533 | R4 | 21 | — | `  // SEED DEMO — sync, uses _createUserLocal to avoid async chain issues` |
| G0534 | R4 | 9 | — | `  // Sin opts.rng: seed determinista = hash(userId + weekNumber) — misma seed,` |
| G0535 | R4 | 21 | — | `  // Used by seedDemo and offline fallback only.` |
| G0536 | R4 | 9 | — | `  // mismo plan byte a byte (excluyendo day.id, ver planSeed = Date.now() mas abajo).` |
| G0537 | R4 | 9 | — | `  // no afecta el contenido del plan. Fuera de alcance de la seed determinista` |
| G0538 | R4 | 1 | — | `  // primero -- dishE NO admite "cena" -> se descarta. Seed encontrado por` |
| G0539 | R4 | 3 | — | `  // seed elige tambien entre A/B/C desde CP3B -- 'demo-cp3a' (el seed` |
| G0540 | R4 | 14 | — | `  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────` |
| G0541 | R4 | 1 | — | `  2. Ancla elegida UNICAMENTE por seed entre las 6 referencias de CP2` |
| G0542 | R4 | 1 | — | `  CONTEXTO: String.raw`seed\|semilla\|mulberry32\\(`,` |
| G0543 | R4 | 1 | — | `  GENERADOR_VERSION, ESTRATEGIA, SEMILLAS_EVALUACION, PERFILES, PERFIL_BASE_LEGACY,` |
| G0544 | R4 | 1 | — | `  L.push('# Borrador de semillas (Fase 7)', '');` |
| G0545 | R4 | 2 | — | `  SEMILLAS_EVALUACION, ESTRATEGIA, PERFILES, PERFIL_BASE_LEGACY, TRADUCCION_PERFIL_BASE, CasoError,` |
| G0546 | R4 | 1 | — | `  TOKEN: String.raw`[\\w$]*(?:seed\|semilla)[\\w$]*`,` |
| G0547 | R4 | 1 | — | `  `materializePlan({ profile, seed, strategy, catalog })`. Entrada verbatim de` |
| G0548 | R4 | 1 | — | `  `{ ...BASE_OPTS, saveMealMemory: vi.fn(), rng: mulberry32(seed) }`. El `rng: mulberry32(seed)`` |
| G0549 | R4 | 1 | — | `  buildComparisonArtifact, SUBMETRICS, deriveSeed, TRANSLATION_TABLE,` |
| G0550 | R4 | 1 | — | `  buildPlan: executeProducer('buildPlan', () => runBuildPlan(SEED)),` |
| G0551 | R4 | 1 | — | `  byte a byte, mas un control negativo con una seed manual distinta.` |
| G0552 | R4 | 9 | — | `  const _rnd          = opts.rng          ?? mulberry32(_hashStr(String(opts.userId ?? 'anon') + ':' + (opts.weekNumber ?? 0)));` |
| G0553 | R4 | 1 | — | `  const anchor = chooseAnchor(ANCHORS, seed, intolerancias, decisionLog);` |
| G0554 | R4 | 4 | — | `  const anchor = chooseAnchor(seed, decisionLog);` |
| G0555 | R4 | 1 | — | `  const comboStats = new Map();    // "id1\|id2" -> { total, weeks: Set<seedIndex>, dishIds: Set<dishId> }` |
| G0556 | R4 | 1 | — | `  const dishStats = new Map();     // dishId -> { nombre, esV2, total, weeks: Set<seedIndex> }` |
| G0557 | R4 | 1 | — | `  const eE = entradaEngine2(perfilId, semilla);` |
| G0558 | R4 | 1 | — | `  const eL = entradaLegacy(perfilId, semilla);` |
| G0559 | R4 | 1 | — | `  const identityStats = new Map(); // identidad -> { total, weeks: Set<seedIndex> }` |
| G0560 | R4 | 28 | — | `  const planSeed = Date.now();` |
| G0561 | R4 | 4 | — | `  const rng = mulberry32(resolveSeed(`${seed}::skeleton`));` |
| G0562 | R4 | 6 | — | `  const rng = mulberry32(resolveSeed(seed));` |
| G0563 | R4 | 2 | — | `  const rng = mulberry32(seed);` |
| G0564 | R4 | 6 | — | `  const rng = selectRng(seed);` |
| G0565 | R4 | 1 | — | `  const rng = walkRng(seed);` |
| G0566 | R4 | 1 | — | `  const rutaJson = path.join(dir, 'borrador-semillas.json');` |
| G0567 | R4 | 1 | — | `  const rutaMd = path.join(dir, 'borrador-semillas.md');` |
| G0568 | R4 | 1 | — | `  const seed = deriveSeed(fixture);` |
| G0569 | R4 | 4 | — | `  const template = chooseSkeleton(seed, decisionLog);` |
| G0570 | R4 | 2 | — | `  const { slots } = runWalk({ weekArc, catalog, seed, profile: PROFILE });` |
| G0571 | R4 | 1 | — | `  const { slots, decisionLog } = expandWeekArc({ weekArc, catalog, seed: 'v2-seed' });` |
| G0572 | R4 | 6 | — | `  const { slots: p1aSlots, decisionLog: p1aRawLog } = expandWeekArc({ weekArc, catalog, seed });` |
| G0573 | R4 | 1 | — | `  const { weekArc } = buildWeekArc({ profile, seed, strategy: fixture.expectedStrategy });` |
| G0574 | R4 | 3 | — | `  const { weekArc } = buildWeekArc({ profile: PROFILE, seed, strategy: 'x' });` |
| G0575 | R4 | 1 | — | `  const { weekArc, catalog, seed } = input;` |
| G0576 | R4 | 3 | — | `  const { weekArc, catalog, seed, profile } = input;` |
| G0577 | R4 | 45 | — | `  criterio: re-ejecuta la campaña anclada (mismas semillas, mismo` |
| G0578 | R4 | 70 | — | `  docstring literal "Ancla elegida ÚNICAMENTE por seed... Sin filtros de ningún tipo"; colocación en` |
| G0579 | R4 | 1 | — | `  en `opts` es la forma nativa del test, no una decision de este acto sobre donde entra la semilla.` |
| G0580 | R4 | 1 | — | `  equivalente no-simple bajo la misma seed.` |
| G0581 | R4 | 68 | — | `  fixtures/seeds concretas, nunca como aserción general del contrato). Javi ratifica cuatro asientos:` |
| G0582 | R4 | 62 | — | `  fixtures: la cobertura depende de la combinación seed × legibilidad del` |
| G0583 | R4 | 2 | — | `  for (const s of semillas) {` |
| G0584 | R4 | 1 | — | `  for (const { perfilId, semilla } of listaCasos()) {` |
| G0585 | R4 | 1 | — | `  function shuffle(array, seed) {` |
| G0586 | R4 | 2 | — | `  if (!Array.isArray(registro.usos)) throw new CasoError('registro de semillas: usos debe ser un array');` |
| G0587 | R4 | 2 | — | `  if (!Array.isArray(semillas) \|\| semillas.length === 0 \|\| !semillas.every(Number.isInteger)) {` |
| G0588 | R4 | 2 | — | `  if (!Number.isInteger(seed) \|\| seed < 0 \|\| seed > 0xFFFFFFFF) {` |
| G0589 | R4 | 2 | — | `  if (!registro \|\| typeof registro !== 'object') throw new CasoError('registro de semillas ausente');` |
| G0590 | R4 | 1 | — | `  if (!registroPath \|\| !salida) fail('uso: --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion');` |
| G0591 | R4 | 2 | — | `  if (registro.completo !== true) throw new CasoError('registro de semillas: no se declara completo');` |
| G0592 | R4 | 2 | — | `  if (registro.version !== 1) throw new CasoError('registro de semillas: versión no soportada');` |
| G0593 | R4 | 3 | — | `  it('(b) LO QUE SE CONSERVA: mismo seed -> mismo plan, capricho normal, fixedRoles intactos', () => {` |
| G0594 | R4 | 1 | — | `  it('(v)+(vii): identidad comprometida SOLO por el ancla (P1a) descarta al rotativo (P1b) que la repite -- determinista en 5 seeds, sin RNG (nivel=1)', () => {` |
| G0595 | R4 | 5 | — | `  it('10 llamadas con la misma seed producen exactamente el mismo JSON', () => {` |
| G0596 | R4 | 1 | — | `  it('10 llamadas con la misma seed producen exactamente el mismo dia de capricho', () => {` |
| G0597 | R4 | 3 | — | `  it('CP3B: el mismo desacople se sostiene con las TRES variantes presentes (seed elige A/B/C, no strategy)', () => {` |
| G0598 | R4 | 5 | — | `  it('VERDE: sobre 200 seeds reales (mezcla de perfiles con/sin entreno), el invariante nunca lanza', () => {` |
| G0599 | R4 | 1 | — | `  it('VERDE: sobre 200 seeds x perfiles reales, assertNoCaprichoCollision nunca lanza', () => {` |
| G0600 | R4 | 1 | — | `  it('barajar con una semilla DISTINTA tambien produce el mismo ranking (no es casualidad de una sola baraja)', () => {` |
| G0601 | R4 | 4 | — | `  it('caso construido: 1 hueco con desempate garantizado + 1 hueco determinado por reglas; dos seeds distintas solo difieren en el de desempate', () => {` |
| G0602 | R4 | 3 | — | `  it('con >=1 superviviente, el elegido es SIEMPRE superviviente (jamas el vetado), sobre 200 seeds', () => {` |
| G0603 | R4 | 2 | — | `  it('engine2 P1: entreno con nombres de engine2, misma semilla y estrategia', () => {` |
| G0604 | R4 | 3 | — | `  it('f3: invariante RNG forma fuerte -- sobre >=8 seeds, el neutro NUNCA gana; la variacion ocurre solo entre los 2 supervivientes del nivel', () => {` |
| G0605 | R4 | 2 | — | `  it('falla si alguna semilla está registrada como usada', () => {` |
| G0606 | R4 | 3 | — | `  it('fijados seed (verificado: resuelve a variante C), las 6 estrategias producen la MISMA estructura (beats, anchors, batchDay, decisionLog) -- solo difiere weekArc.strategy', () => {` |
| G0607 | R4 | 2 | — | `  it('fijados seed, variante C y batchDay (via profile/seed fijos), las 6 estrategias producen la MISMA estructura (beats, anchors, batchDay, decisionLog) -- solo difiere weekArc.strategy', () => {` |
| G0608 | R4 | 2 | — | `  it('ids duplicados, id vacío, lista vacía, semilla inválida', () => {` |
| G0609 | R4 | 3 | — | `  it('intolerances ausente: ancla SIEMPRE presente, sin entradas de log de veto/ausencia, evidencia identica al formato pre-D-023, sobre 50 seeds', () => {` |
| G0610 | R4 | 3 | — | `  it('intolerances=[] (presente pero vacio) es identico a intolerances ausente, misma seed', () => {` |
| G0611 | R4 | 4 | — | `  it('intolerancias e isSimple (que F3 no usa) NO cambian la estructura frente al perfil base, con la misma seed', () => {` |
| G0612 | R4 | 1 | — | `  it('isSimple (que F3 no usa) NO cambia la estructura frente al perfil base, con la misma seed', () => {` |
| G0613 | R4 | 1 | — | `  it('las 9 seeds derivadas son estables y coinciden con hash(userId+weekNumber)', () => {` |
| G0614 | R4 | 2 | — | `  it('las semillas de test no son de evaluación', () => {` |
| G0615 | R4 | 1 | — | `  it('las sobras quedan en el MISMO momento que el ancla, para varias semillas', () => {` |
| G0616 | R4 | 2 | — | `  it('misma entrada + misma semilla -> salida idéntica byte a byte', () => {` |
| G0617 | R4 | 1 | — | `  it('misma seed y entrada -> objeto byte-identico (JSON.stringify) en dos invocaciones', () => {` |
| G0618 | R4 | 1 | — | `  it('misma semilla -> expansion + colocacion + log byte-identicos', () => {` |
| G0619 | R4 | 1 | — | `  it('misma semilla -> misma colocacion en dos ejecuciones', () => {` |
| G0620 | R4 | 1 | — | `  it('mismo seed -> mismo weekArc antes y despues de que exista el walk (buildWeekArc no cambia)', () => {` |
| G0621 | R4 | 1 | — | `  it('opts.rng explícito sigue ganando sobre la seed por userId+weekNumber', () => {` |
| G0622 | R4 | 1 | — | `  it('reconstruir densidadDiaria de fat_loss_general con una seed distinta cambia el valor', async () => {` |
| G0623 | R4 | 2 | — | `  it('seed: base + i y function f(semilla) son R4 sin valores', () => {` |
| G0624 | R4 | 5 | — | `  it('seeds distintas pueden producir weekArc distinto (sanity: el seed si importa)', () => {` |
| G0625 | R4 | 1 | — | `  it('semillas distintas pueden resolver a momentos distintos (el desempate es real, no un no-op)', () => {` |
| G0626 | R4 | 4 | — | `  it('set ambiguo -> semillas distintas pueden resolver a momentos distintos (desempate real)', () => {` |
| G0627 | R4 | 2 | — | `  it('sin LIT pegado: seed5 no es R1', () => {` |
| G0628 | R4 | 3 | — | `  it('sobre 100 seeds: la variacion ocurre ENTRE supervivientes (no colapsa a uno solo, salvo por azar improbable)', () => {` |
| G0629 | R4 | 3 | — | `  it('sobre >=8 seeds: el vetado jamas aparece elegido', () => {` |
| G0630 | R4 | 10 | — | `  let s = seed >>> 0;` |
| G0631 | R4 | 62 | — | `  mediría varianza de seed, no el efecto del campo. Alcance: catálogo y` |
| G0632 | R4 | 1 | — | `  profile, seed, strategy, fuenteEditorial,` |
| G0633 | R4 | 63 | — | `  reproducibilidad por seed (misma seed → mismo artefacto; seed` |
| G0634 | R4 | 2 | — | `  return `${perfilId}-${semilla}-${motor}`;` |
| G0635 | R4 | 6 | — | `  return mulberry32(seedFromString(`${seed}::walk::select`));` |
| G0636 | R4 | 1 | — | `  return mulberry32(seedFromString(`${seed}::walk`));` |
| G0637 | R4 | 6 | — | `  return typeof seed === 'number' ? seed >>> 0 : seedFromString(String(seed));` |
| G0638 | R4 | 1 | — | `  return { profile, seed, report: adaptHumanScore({ slots, catalog }) };` |
| G0639 | R4 | 1 | — | `  return {name:day, id:"day-"+_dayIdx+"-"+planSeed, special:..., mood:..., effectiveMood:...,` |
| G0640 | R4 | 1 | — | `  seed: r1.clave.seed,` |
| G0641 | R4 | 21 | — | `  seedDemo: () => {` |
| G0642 | R4 | 2 | — | `  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escaner-semillas-'));` |
| G0643 | R4 | 2 | — | `  verificarDeterminismo, verificarSemillas, listaCasos,` |
| G0644 | R4 | 1 | — | `  verificarDiaLibreEngine2, verificarDeterminismo, verificarSemillas, idPlan, listaCasos,` |
| G0645 | R4 | 1 | — | `  weekArc, catalog, seed: SEED, profile: PROFILE,` |
| G0646 | R4 | 14 | — | `  {name:"Semillas de chía",         kcal100:486, defaultG:15},` |
| G0647 | R4 | 14 | — | `  {name:"Semillas de lino",         kcal100:534, defaultG:15},` |
| G0648 | R4 | 2 | — | ` *   clave: { version: number, seed: number, entradas: { etiqueta: string, id: string }[] }` |
| G0649 | R4 | 2 | — | ` * @param {(number\|string)} seed` |
| G0650 | R4 | 2 | — | ` * @param {number} seed entero (se normaliza a uint32)` |
| G0651 | R4 | 1 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string, catalog: ReadonlyArray<object>, fuenteEditorial?: object}} input` |
| G0652 | R4 | 1 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string, fuenteEditorial?: {version: number, confirmed: object}}} input` |
| G0653 | R4 | 5 | — | ` * @param {{profile: object, seed: (number\|string), strategy: string}} input` |
| G0654 | R4 | 2 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object, profile?: {intolerances?: string[]}, fuenteEditorial?: {version: number, confirmed: object}}} input` |
| G0655 | R4 | 3 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object, profile?: {intolerances?: string[]}}} input` |
| G0656 | R4 | 1 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string), memoryStore?: object}} input` |
| G0657 | R4 | 1 | — | ` * @param {{weekArc: object, catalog: ReadonlyArray<object>, seed: (number\|string)}} input` |
| G0658 | R4 | 2 | — | ` * @returns {() => number} generador determinista: misma seed -> misma secuencia.` |
| G0659 | R4 | 4 | — | ` * Ancla elegida UNICAMENTE por seed entre las 6 referencias de CP2. Sin` |
| G0660 | R4 | 2 | — | ` * Ancla elegida UNICAMENTE por seed, entre las anclas SUPERVIVIENTES del` |
| G0661 | R4 | 4 | — | ` * Esqueleto (plantilla A/B/C) elegido UNICAMENTE por seed. Sin filtros de` |
| G0662 | R4 | 4 | — | ` * eleccion de ancla sean independientes entre si para la misma seed` |
| G0663 | R4 | 1 | — | ` * seeds de tipo string (p. ej. hash(userId+weekNumber) de F0) ademas de` |
| G0664 | R4 | 1 | — | `("${seed}::skeleton") independiente del de chooseAnchor -- cambiar el` |
| G0665 | R4 | 1 | — | `(+ resumen legible .md). Controles falsables: reproducibilidad por seed,` |
| G0666 | R4 | 2 | — | `(3 por seed, 2 seeds).` |
| G0667 | R4 | 1 | — | `**3.1 Control 1b (mutación de seed).** Verifica reproducibilidad del` |
| G0668 | R4 | 13 | — | `**Decisión 2 — Extensión normativa.** La extensión normativa de ii-auto se fija en §5.6 del protocolo de evaluación (tamaño de muestra N, «el caso limpio» que D-075 cita literal en `DECISIONS.md:3323`). El mapeo completo de las demás cláusulas de muestreo/reproducibilidad (§5.5 semillas, §5.8 agrega …[TRUNCADO]` |
| G0669 | R4 | 1 | — | `**I-2.** Semillas como rango secuencial documentado, nunca aleatorio ni ad-hoc — con una variante de convención no resuelta.` |
| G0670 | R4 | 1 | — | `**I-3.** Self-check de determinismo obligatorio y bloqueante antes de cualquier medición (mismo seed, dos ejecuciones, comparación por igualdad de string).` |
| G0671 | R4 | 1 | — | `- **Ruta de generación:** `buildPlan()` invocado vía `runBaseline(fixture)` (`src/engine/tests/baselineFixtures.js`), sin `opts.rng` — seed implícita `hash(userId + weekNumber)`.` |
| G0672 | R4 | 2 | — | `- **Seeds usadas — dos generaciones, con causa distinta cada una:**` |
| G0673 | R4 | 1 | — | `- **Seeds:**` |
| G0674 | R4 | 1 | — | `- **Unidad de muestreo**: la semana. Cada iteración del protocolo produce un plan semanal independiente a partir de una semilla propia.` |
| G0675 | R4 | 1 | — | `- **Unidad de muestreo:** la semana, con semilla propia por iteración (`protocolo-evaluacion.md:23`). Coincide con la estructura que C v1 formaliza (`DECISIONS.md:2261`) y no invoca el contrato de `days`.` |
| G0676 | R4 | 1 | — | `- **§5.5 (semillas)** y **§5.8 (nivel de agregación)** operan al nivel semana declarado en §2 (`:46`, `:49`, remitiendo a `:23`/`:25`); se satisfacen sin enrutar por el contrato del objeto. No requieren la relación C v1↔objeto.` |
| G0677 | R4 | 49 | — | `- Método: campaña doble apareada por semana/semilla — brazo control (V+V2)` |
| G0678 | R4 | 2 | — | `- Se construye el generador de casos (perfiles, traducción a entrada nativa, verificación de la premisa del punto 3, acreditación de semillas). No se ejecuta la evaluación.` |
| G0679 | R4 | 1 | — | `- la ruta sin opts.rng reproduce exactamente mulberry32(_hashStr(userId+':'+` |
| G0680 | R4 | 1 | — | `- seed: `baseline-defflexible12`` |
| G0681 | R4 | 1 | — | `- seed: `baseline-defsaciante11`` |
| G0682 | R4 | 1 | — | `- seed: `baseline-fatlossgeneral10`` |
| G0683 | R4 | 1 | — | `- seed: `baseline-mant-intol16`` |
| G0684 | R4 | 1 | — | `- seed: `baseline-mant-simple18`` |
| G0685 | R4 | 1 | — | `- seed: `baseline-mant-training17`` |
| G0686 | R4 | 1 | — | `- seed: `baseline-mantenimiento13`` |
| G0687 | R4 | 1 | — | `- seed: `baseline-volumenagresivo15`` |
| G0688 | R4 | 1 | — | `- seed: `baseline-volumenlimpio14`` |
| G0689 | R4 | 1 | — | `/** seed = hash(userId + weekNumber) (CLAUDE.md, regla de determinismo). */` |
| G0690 | R4 | 4 | — | `//      misma seed.` |
| G0691 | R4 | 4 | — | `//   0. Esqueleto (plantilla): elegido UNICAMENTE por seed entre A/B/C` |
| G0692 | R4 | 4 | — | `//   2. Ancla: eleccion UNICAMENTE por seed entre las 6 referencias de CP2.` |
| G0693 | R4 | 2 | — | `//   2. Ancla: eleccion UNICAMENTE por seed entre las referencias de CP2` |
| G0694 | R4 | 1 | — | `//   node scripts/fase7/escanearSemillas.mjs --salida <dir> [--consulta <desde>-<hasta>]` |
| G0695 | R4 | 1 | — | `//   node scripts/fase7/generarCasos.mjs --registro <registro-semillas.json> --salida <dir fuera del repo> --confirmo-generacion` |
| G0696 | R4 | 1 | — | `//   { "seed": <entero>, "planes": [ { "id": "...", "motor": "legacy"\|"engine2", "archivo": "ruta/plan.json" } ] }` |
| G0697 | R4 | 1 | — | `// Antes de ejecutar nada: semillas comprobadas contra el registro declarado y` |
| G0698 | R4 | 3 | — | `// D-022) + P2b-ii (frecuencias, D-024). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0699 | R4 | 1 | — | `// D-022). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0700 | R4 | 1 | — | `// D-044). Entrada: {weekArc, catalog, seed, memoryStore, profile}. Salida:` |
| G0701 | R4 | 1 | — | `// Ejecuta ambos motores para cada caso (perfil × semilla), verifica cada caso` |
| G0702 | R4 | 1 | — | `// Escáner de semillas (Fase 7): capa git, CLI y escritura del borrador.` |
| G0703 | R4 | 1 | — | `// Esto es una mejora determinista conocida para esta seed concreta —` |
| G0704 | R4 | 3 | — | `// Fase 0 — baseline de snapshots por la ruta REAL de seed de produccion` |
| G0705 | R4 | 1 | — | `// Genera UN plan de engine2 (buildWeekArc + runWalk, catalogo real, seed` |
| G0706 | R4 | 2 | — | `// Golden snapshot: seeded weekly plan generated by buildPlan.` |
| G0707 | R4 | 1 | — | `// Produce el BORRADOR del que, tras revisión manual, saldrá el registro de semillas.` |
| G0708 | R4 | 1 | — | `// Reglas puras del escáner de semillas (Fase 7). Sin I/O.` |
| G0709 | R4 | 1 | — | `// Seed S=1: en el código baseline (pre-GATE4), la verdura primaria` |
| G0710 | R4 | 2 | — | `// Semillas de test: nunca las de evaluación.` |
| G0711 | R4 | 2 | — | `// Tests del generador que ejecutan los motores. Usan semillas de test (1 y 2),` |
| G0712 | R4 | 2 | — | `// completo o alguna semilla cae en un uso registrado.` |
| G0713 | R4 | 6 | — | `// de ancla de expandWeekArc — no es un bug de determinismo (la seed sigue` |
| G0714 | R4 | 2 | — | `// de semillas contra un registro. La ejecución de los motores y la escritura` |
| G0715 | R4 | 1 | — | `// del encargo D2: reproducibilidad (seed gobierna el artefacto), honestidad` |
| G0716 | R4 | 1 | — | `// deriveTempFeelEngine2: R6 solo exige que la MISMA seed produzca el MISMO` |
| G0717 | R4 | 2 | — | `// entrada + misma semilla -> salida idéntica byte a byte.` |
| G0718 | R4 | 1 | — | `// la entrada problemática (semilla, día, momento, evidencia completa).` |
| G0719 | R4 | 1 | — | `// misma seed la frecuencia máxima de cualquier verdura primaria queda` |
| G0720 | R4 | 1 | — | `// mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS primitivas` |
| G0721 | R4 | 1 | — | `// mulberry32 — deterministic PRNG. seed → () => [0, 1)` |
| G0722 | R4 | 6 | — | `// mulberry32(seedFromString(`${seed}::walk`)) para su propio desempate de` |
| G0723 | R4 | 4 | — | `// ocurre ANTES del sorteo por seed, sobre un catalogo de 6 referencias sin` |
| G0724 | R4 | 2 | — | `// planSeed=Date.now(), buildPlan.js:2261).` |
| G0725 | R4 | 1 | — | `// runWalk, mismo PROFILE, N=500, seed=i+1) a partir de las MISMAS` |
| G0726 | R4 | 1 | — | `// seed, memoryStore}. Salida: {slots, decisionLog}. Rellena los huecos que` |
| G0727 | R4 | 4 | — | `// seed, strategy}. Salida: {weekArc, decisionLog}. Stateless (R4): no` |
| G0728 | R4 | 1 | — | `// seed=i+1) que veg_variety_engine2.mjs @ 9b8d489 — ese fichero NO se` |
| G0729 | R4 | 1 | — | `// seed}. Salida: {slots, decisionLog}. Stateless, como buildWeekArc (R4):` |
| G0730 | R4 | 1 | — | `// semillas de evaluación requiere autorización expresa del titular.` |
| G0731 | R4 | 1 | — | `// sobre la MISMA campaña (mismas semillas, mismo perfil, N=500):` |
| G0732 | R4 | 2 | — | `// sustituye por una función vacía y rng por mulberry32(semilla) al ejecutar.` |
| G0733 | R4 | 2 | — | `// variante C). Entrada: {profile, seed, strategy}. Salida: {weekArc,` |
| G0734 | R4 | 1 | — | `// ─── Comparación apareada por semana/semilla ───────────────────────────` |
| G0735 | R4 | 2 | — | `// ─── Semillas: comprobación contra un registro declarado ─────────────────────` |
| G0736 | R4 | 1 | — | `1. **Self-check de determinismo bloqueante.** Antes de toda medición, el protocolo deberá ejecutar un self-check de determinismo: misma semilla, dos ejecuciones, comparación por igualdad. Si las dos ejecuciones difieren, la medición deberá abortarse.` |
| G0737 | R4 | 2 | — | `1. Forma. Comparación por pares. Cada par contiene dos planes del mismo caso (mismo perfil, estrategia y semilla), uno de cada motor, en orden A/B aleatorizado por el cegado.` |
| G0738 | R4 | 1 | — | `2 semillas distintas; control de discriminacion confirma que un` |
| G0739 | R4 | 37 | — | `2. **F-V2 — Doble ancla de hash.** Toda verificación de conformidad registra dos hashes SHA-256 del objeto de plan observado: (i) el del objeto completo, tal como lo emite el productor, aunque no resulte reproducible entre corridas — documentando en ese caso la causa observada de la no reproducibili …[TRUNCADO]` |
| G0740 | R4 | 1 | — | `3344\|**Decisión 2 — Extensión normativa.** La extensión normativa de ii-auto se fija en §5.6 del protocolo de evaluación (tamaño de muestra N, «el caso limpio» que D-075 cita literal en `DECISIONS.md:3323`). El mapeo completo de las demás cláusulas de muestreo/reproducibilidad (§5.5 semillas, §5.8 a …[TRUNCADO]` |
| G0741 | R4 | 36 | — | `4. **Semillas como propiedad, no como convención única.** §5 norma el rango de semillas como propiedad (secuencial, contiguo, de orden conocido, con punto inicial declarado) sin fijar una convención única de punto inicial, porque el reconocimiento demostró dos convenciones vivas (0 y 1 como origen)  …[TRUNCADO]` |
| G0742 | R4 | 1 | — | `4. El runner existe pero no se ha ejecutado. Pendientes: generador de casos, acreditación de semillas, asiento del criterio de superación y designación del evaluador.` |
| G0743 | R4 | 1 | — | `4. Fuera de esta instanciación y pendientes: semillas, perfiles, N, escala, forma de comparación y designación del evaluador externo.` |
| G0744 | R4 | 3 | — | `5 (mismo HEAD citado arriba, mismas semillas, mismo PROFILE, mismo` |
| G0745 | R4 | 1 | — | `5. **Semillas.** El rango de semillas deberá ser secuencial y contiguo, de orden conocido, con punto inicial declarado explícitamente en el artefacto o en el script. Este documento no prescribe una convención concreta de punto inicial.` |
| G0746 | R4 | 11 | — | `6. **Determinismo:** misma seed → mismo plan, byte a byte, en ambos motores. `seed = hash(userId + weekNumber)`.` |
| G0747 | R4 | 1 | — | `Ausencia de un elemento de la semilla = "no localizado", no sustitucion por equivalente.` |
| G0748 | R4 | 2 | — | `Byte-idéntico en las 3 corridas, para ambas seeds, sobre el **objeto completo sin proyección**.` |
| G0749 | R4 | 1 | — | `Clave, separada de la vista: `{ version, seed, entradas: [ { etiqueta, id } ] }`. El runner añade el motor a cada entrada y escribe vista y clave en archivos distintos.` |
| G0750 | R4 | 1 | — | `Codigo (semilla, NO afirmacion de completitud): buildPlan.js, materializePlan.js,` |
| G0751 | R4 | 1 | — | `Escaner de semillas Fase 7 (F-SE.1 a F-SE.9)` |
| G0752 | R4 | 1 | — | `Evidencia: `analysis/gate2_measure.test.js:222` (`const N = 500;`), `analysis/gate4_protein_guard.test.js:46` (`const N = 200;`), `analysis/baseline_n1000.mjs:35` (`seed < 1000`). El valor de N varía por campaña (200/500/1000); lo invariante es que siempre se declara explícitamente, nunca se omite.` |
| G0753 | R4 | 1 | — | `Expected changes due to intentional selection shift; stability/seed-sensitivity assertions re-run green.` |
| G0754 | R4 | 1 | — | `Fallos sin corrección: número de días distinto de 7, ausencia de comida o de cena, momento duplicado, plato vacío, momento no canónico, claves extra, ids duplicados o semilla inválida.` |
| G0755 | R4 | 1 | — | `Fase 7: generador de casos (perfiles, traduccion, verificaciones, registro de semillas)` |
| G0756 | R4 | 1 | — | `Filtra el catalogo de anclas por intolerancias ANTES del sorteo por seed` |
| G0757 | R4 | 1 | — | `Merge escaner de semillas Fase 7` |
| G0758 | R4 | 1 | — | `N=500, mismas semillas/perfil) con tres vistas complementarias que la baseline no` |
| G0759 | R4 | 1 | — | `Perimetro: los cinco ficheros .js de la semilla.` |
| G0760 | R4 | 3 | — | `Re-ejecución de la campaña anclada de D-042 (mismas semillas, mismo` |
| G0761 | R4 | 1 | — | `Se revisaron los encabezados de bucle exterior de todos los ficheros de `analysis/` (`grep` sobre `for (let seed\|for (let i`) y de los dos runners de `docs/evidence/variedad-verdura/`. En todos los casos localizados el bucle exterior asocia una iteración a una única llamada productora de plan (`buil …[TRUNCADO]` |
| G0762 | R4 | 1 | — | `\\`seed = i + 1\\`, RNG mulberry32 vía \\`buildWeekArc\\`/\\`runWalk\\`). Ver` |
| G0763 | R4 | 1 | — | `\\`seed = i + 1\\`, RNG mulberry32 vía \\`selectRng\\`/\\`buildWeekArc\\`). Ver` |
| G0764 | R4 | 1 | — | `\\`veg_variety_engine2_freq.md\\` (mismo commit, mismas semillas, mismo` |
| G0765 | R4 | 1 | — | ``seed = i + 1`, RNG mulberry32 vía `buildWeekArc`/`runWalk`). Ver` |
| G0766 | R4 | 1 | — | ``seed = i + 1`, RNG mulberry32 vía `selectRng`/`buildWeekArc`). Ver` |
| G0767 | R4 | 1 | — | ``veg_variety_engine2_freq.md` (mismo commit, mismas semillas, mismo` |
| G0768 | R4 | 1 | — | `a mulberry32(_hashStr(userId+weekNumber)): misma seed, mismo plan byte a` |
| G0769 | R4 | 1 | — | `byte (excluyendo day.id, que sigue dependiendo de planSeed=Date.now() —` |
| G0770 | R4 | 1 | — | `combinaciones reales de seed x perfil).` |
| G0771 | R4 | 2 | — | `commit, mismas semillas, mismo PROFILE, mismo catálogo). Reproducir con:` |
| G0772 | R4 | 1 | — | `console.log('\\n--- COMPARACIÓN (apareada por semana/semilla) ---');` |
| G0773 | R4 | 1 | — | `console.log(`=== Adaptador humanScore (D-025) -- seed=${SEED}, trainingDays=[${PROFILE.trainingDays.join(', ')}] ===\\n`);` |
| G0774 | R4 | 1 | — | `console.log(`blind-run: ${r1.evaluador.planes.length} planes cegados (seed ${manifest.seed}).`);` |
| G0775 | R4 | 1 | — | `const r1 = blind(items, manifest.seed);` |
| G0776 | R4 | 1 | — | `const r2 = blind(items, manifest.seed);` |
| G0777 | R4 | 1 | — | `const { weekArc } = buildWeekArc({ profile: PROFILE, seed: SEED, strategy: 'x' });` |
| G0778 | R4 | 1 | — | `control negativo: la densidad de engine2 es hoy realización de seed, no` |
| G0779 | R4 | 2 | — | `corridas de ambas seeds. A diferencia de legacy, el objeto de engine2 no tiene un campo `id`` |
| G0780 | R4 | 1 | — | `de seed × legibilidad. Adicionalmente, toda fixture cuyo único` |
| G0781 | R4 | 1 | — | `decision. Demostrado con un test de desacople que fija (seed, perfil) y` |
| G0782 | R4 | 3 | — | `describe('baseline — confirmación 3: la ruta sin opts.rng usa de verdad mulberry32(_hashStr(userId+weekNumber))', () => {` |
| G0783 | R4 | 2 | — | `describe('buildPlan — golden snapshot (seeded)', () => {` |
| G0784 | R4 | 1 | — | `describe('buildPlan — seed determinista por defecto (sin opts.rng)', () => {` |
| G0785 | R4 | 2 | — | `describe('casos — semillas contra registro', () => {` |
| G0786 | R4 | 1 | — | `describe('control 1 -- reproducibilidad: misma seed -> mismo artefacto', () => {` |
| G0787 | R4 | 1 | — | `describe('control 1b -- mutacion de seed produce artefacto distinto', () => {` |
| G0788 | R4 | 5 | — | `describe('determinismo: misma seed -> mismo weekArc byte a byte', () => {` |
| G0789 | R4 | 2 | — | `describe('generarCaso con motores reales (semillas de test)', () => {` |
| G0790 | R4 | 4 | — | `describe('runWalk - v9: determinismo pleno (misma seed -> plan y log byte-identicos)', () => {` |
| G0791 | R4 | 1 | — | `elige entre A/B/C UNICAMENTE por seed, sin filtros, con RNG namespaced` |
| G0792 | R4 | 1 | — | `espacio total; (c) assertNoCaprichoCollision verde sobre 200 seeds x 9` |
| G0793 | R4 | 1 | — | `export const TERMINOS = ['seed', 'semilla', 'mulberry32('];` |
| G0794 | R4 | 2 | — | `export function blind(items, seed) {` |
| G0795 | R4 | 5 | — | `export function buildWeekArc({ profile, seed, strategy }) {` |
| G0796 | R4 | 2 | — | `export function chooseAnchor(anchors, seed, intolerancias, decisionLog, getVista = anchorVista) {` |
| G0797 | R4 | 1 | — | `export function deriveSeed(fixture) {` |
| G0798 | R4 | 2 | — | `export function entradaEngine2(perfilId, semilla) {` |
| G0799 | R4 | 2 | — | `export function entradaLegacy(perfilId, semilla) {` |
| G0800 | R4 | 1 | — | `export function expandWeekArc({ weekArc, catalog, seed }) {` |
| G0801 | R4 | 1 | — | `export function generarCaso(perfilId, semilla, catalog = loadCatalog()) {` |
| G0802 | R4 | 2 | — | `export function idPlan(perfilId, semilla, motor) {` |
| G0803 | R4 | 4 | — | `export function mulberry32(seed) {` |
| G0804 | R4 | 1 | — | `export function seedFromString(str) {` |
| G0805 | R4 | 2 | — | `export function verificarSemillas(semillas, registro) {` |
| G0806 | R4 | 4 | — | `function chooseAnchor(seed, decisionLog) {` |
| G0807 | R4 | 4 | — | `function chooseSkeleton(seed, decisionLog) {` |
| G0808 | R4 | 1 | — | `function collectWeekData(slots, decisionLog, catalog, seedIndex) {` |
| G0809 | R4 | 6 | — | `function mulberry32(seed) {` |
| G0810 | R4 | 6 | — | `function resolveSeed(seed) {` |
| G0811 | R4 | 5 | — | `function run(seed) {` |
| G0812 | R4 | 1 | — | `function run(seed, extraOpts = {}) {` |
| G0813 | R4 | 1 | — | `function runBuildPlan(seed) {` |
| G0814 | R4 | 1 | — | `function runSeeded(userId, weekNumber) {` |
| G0815 | R4 | 3 | — | `function runWeek(seed, catalog) {` |
| G0816 | R4 | 6 | — | `function selectRng(seed) {` |
| G0817 | R4 | 1 | — | `function verificarExhaustividadPaso5(decisionLog, seed) {` |
| G0818 | R4 | 1 | — | `function walkRng(seed) {` |
| G0819 | R4 | 1 | — | `if (!Number.isInteger(manifest.seed)) fail('manifiesto.seed debe ser un entero declarado');` |
| G0820 | R4 | 2 | — | `import { SEMILLAS_EVALUACION, ESTRATEGIA } from './casos.js';` |
| G0821 | R4 | 2 | — | `import { escanear, escribirSalida } from './escanearSemillas.mjs';` |
| G0822 | R4 | 1 | — | `import { mulberry32, seedFromString } from '../../skeleton/rng.js';` |
| G0823 | R4 | 7 | — | `import { mulberry32, seedFromString } from '../skeleton/rng.js';` |
| G0824 | R4 | 6 | — | `import { mulberry32, seedFromString } from './rng.js';` |
| G0825 | R4 | 1 | — | `las 3 variantes (seeds verificados A=7/B=1/C=0); los tests especificos` |
| G0826 | R4 | 1 | — | `llamadas misma seed -> mismo JSON), sobras respetan su propio techo,` |
| G0827 | R4 | 1 | — | `misma seed. TEMPLATES exportado.` |
| G0828 | R4 | 1 | — | `necesitar seeds: batchDay no depende de la ancla): 83.3% de las 54` |
| G0829 | R4 | 1 | — | `por la ruta REAL de seed de produccion (hash(userId+weekNumber) via` |
| G0830 | R4 | 1 | — | `proceso (seed distinta → artefacto distinto), no autenticidad del` |
| G0831 | R4 | 1 | — | `rotativa, expandWeekArc no cambia, y las semillas son idénticas—, el` |
| G0832 | R4 | 1 | — | `rotativos), determinista en 5 seeds sin RNG, mas control sin memoria` |
| G0833 | R4 | 1 | — | `seedeado, sin ningún cambio sin atribuir a uno de los 6 bugs.` |
| G0834 | R4 | 1 | — | `sensitivity (different seeds → different plans), and that buildPlan runs` |
| G0835 | R4 | 1 | — | `skeletonId="C" en su busqueda de seed, ya que el seed elige tambien la` |
| G0836 | R4 | 1 | — | `test(engine): golden snapshot of seeded weekly plan` |
| G0837 | R4 | 1 | — | `varianza de seed, no efecto del campo. Alcance: catálogo y fixtures` |
| G0838 | R4 | 1 | — | `via opts.rng. Verifies stability (two seeded runs are byte-identical),` |
| G0839 | R4 | 2 | — | `\| RNG \| `mulberry32` (definido inline en cada runner; engine2 pasa el entero `seed` directamente a `buildWeekArc`/`runWalk`, legacy lo envuelve como `rng: mulberry32(seed)`) \|` |
| G0840 | R4 | 1 | — | `\| Semillas \| 1..${N} (\\`seed = i + 1\\`) \|` |
| G0841 | R4 | 1 | — | `\| §5.5 Semillas \| `:46` \| No — nivel semana (§2, `:23`) \| No \|` |
| G0842 | R4 | 3 | — | `} from './semillas.js';` |
