// Recuento de los platos de legumbre del catálogo por perfil: rol (rotativo o ancla), especie y si
// llevan cereal o un ingrediente proteico. MEDICIÓN, no cambia reglas.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/legumbreCatalogo.mjs
const R = new URL('../../../', import.meta.url).href;
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { filtrarCatalogo } = await import(R + 'src/plan/engine2App.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const { resolveDishComposition } = await import(R + 'src/engine2/dishes/compositionResolver.js');
const { componerPlato } = await import(R + 'src/plan/textos/componer.js');
const { leerComida } = await import(R + 'src/plan/medidor/leerComida.js');
const { INGREDIENTES } = await import(R + 'src/engine2/nutrientes/ingredientes.js');
const { COMPOSICION } = await import(R + 'src/engine2/nutrientes/composicion.js');
const { papelDe } = await import(R + 'src/engine2/nutrientes/raciones.js');
const { llevaBase, proteinaPrincipal, BASES } = await import(R + 'src/engine2/dishes/bases.js');
const { satisfaceVerdura } = await import(R + 'src/engine2/walk/frequencies.js');
const { PERFILES, clonar } = await import(R + 'scripts/banco/perfiles.mjs');

const callado = (f) => { const l = console.log, e = console.error, w = console.warn; console.log = console.error = console.warn = () => {}; try { return f(); } finally { console.log = l; console.error = e; console.warn = w; } };
const PERF = { 'omnívoro': 'omni-2174', vegetariano: 'vegetariana-2000', vegano: 'vegana-1400', 'celíaco': 'celiaco-2400', SIBO: 'sibo-2000' };
const fam = (d) => { try { return resolveDishComposition(d).proteinType; } catch { return null; } };
const out = {};
for (const [n, id] of Object.entries(PERF)) {
  const p = PERFILES.find((x) => x.id === id);
  const cat = aplicarAjustesD099(callado(() => filtrarCatalogo(catalogoApp(), clonar(p.perfil), p.kcal, {}).catalogo));
  const leg = cat.filter((d) => fam(d) === 'legumbre');
  out[n] = leg;
  console.log(`\n== ${n}: ${cat.length} platos; legumbre ${leg.length}; por rol: ${JSON.stringify(leg.reduce((o, d) => { o[d.rol] = (o[d.rol] || 0) + 1; return o; }, {}))}; roles catálogo ${JSON.stringify(cat.reduce((o, d) => { o[d.rol] = (o[d.rol] || 0) + 1; return o; }, {}))}`);
  if (n === 'omnívoro') {
    console.log('rol ancla tras D-099:');
    for (const d of cat.filter((x) => x.rol === 'ancla')) console.log('  ', d.nombre, '| fam', fam(d), '| momento', d.momento.join('+'), '| bases que lo llevan:', BASES.filter((b) => llevaBase(d, b.base)).map((b) => b.base).join(',') || '—');
  }
}
// Detalle (unión)
const vistos = new Map();
for (const [n, leg] of Object.entries(out)) for (const d of leg) { if (!vistos.has(d.id)) vistos.set(d.id, { d, perfiles: [] }); vistos.get(d.id).perfiles.push(n); }
console.log('\nDETALLE (unión de catálogos):');
const filas = [];
for (const { d, perfiles } of vistos.values()) {
  const m = callado(() => componerPlato(d, 'comida', 2000));
  const items = leerComida(m).items;
  const cls = items.map((i) => ({ clave: i.clave, g: Math.round(i.gramos), grupo: (INGREDIENTES[i.clave] || {}).grupo, papel: COMPOSICION[i.clave] ? papelDe(i.clave, COMPOSICION[i.clave]) : 'fijo' }));
  const cereal = cls.filter((c) => c.grupo === 'hidrato');
  const prot = cls.filter((c) => c.papel === 'proteico');
  let verdura = null; try { verdura = satisfaceVerdura(resolveDishComposition(d)); } catch { verdura = null; }
  const f = { nombre: d.nombre, rol: d.rol, especie: proteinaPrincipal(d), perfiles: perfiles.join('+'), redactado: !d.id.startsWith('['), cereal: cereal.map((c) => `${c.clave} ${c.g}`).join(', '), prot: prot.map((c) => `${c.clave} ${c.g}`).join(', '), verdura, plateType: d.plateType, tempFeel: d.tempFeel };
  filas.push(f);
  console.log(`${f.rol.padEnd(8)} | ${String(f.especie).padEnd(14)} | ${f.nombre.slice(0, 52).padEnd(52)} | cereal: ${f.cereal || '—'} | proteico: ${f.prot || '—'} | verdura ${f.verdura} | ${f.plateType}/${f.tempFeel} | ${f.perfiles}`);
}
console.log('\nRESUMEN por especie (unión; rotativo = lo que ve el walk genérico):');
const esp = [...new Set(filas.map((f) => f.especie))];
for (const e of esp) {
  const xs = filas.filter((f) => f.especie === e);
  const rot = xs.filter((f) => f.rol === 'rotativo');
  console.log(`${e}: total ${xs.length} (ancla ${xs.length - rot.length}) | rotativos ${rot.length}: con cereal ${rot.filter((f) => f.cereal).length}, con proteico ${rot.filter((f) => f.prot).length}, con cereal o proteico ${rot.filter((f) => f.cereal || f.prot).length}, cubre verdura ${rot.filter((f) => f.verdura).length}`);
}
for (const n of Object.keys(out)) {
  const ids = new Set(out[n].map((d) => d.nombre));
  const xs = filas.filter((f) => ids.has(f.nombre) && f.rol === 'rotativo');
  const por = {};
  for (const f of xs) { por[f.especie] = por[f.especie] || { n: 0, cereal: 0, prot: 0, alguno: 0, verd: 0 }; por[f.especie].n++; if (f.cereal) por[f.especie].cereal++; if (f.prot) por[f.especie].prot++; if (f.cereal || f.prot) por[f.especie].alguno++; if (f.verdura) por[f.especie].verd++; }
  console.log(n, 'rotativos legumbre', xs.length, JSON.stringify(por));
}
