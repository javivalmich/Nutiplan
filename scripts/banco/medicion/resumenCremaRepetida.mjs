// Cremas repetidas en la semana: MEDICIÓN, no cambia reglas (Javi, 2026-11-25). Lee los volcados de
// controlGuarnicion.mjs (9 omnívoros del banco) y da, por medición: cremas por semana, semanas con dos cremas del mismo
// vegetal, distancia en días entre las dos, y comidas cortas, legumbres, pescado e infracciones de D-099.3.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/resumenCremaRepetida.mjs <etiqueta>=<dir>:<sufijo> […]
//   (en <dir>: <perfil>-<sufijo>.json)
const R = new URL('../../../', import.meta.url).href;
const fs = await import('node:fs');
const { catalogoApp } = await import(R + 'src/plan/catalogo.js');
const { aplicarNombresD105 } = await import(R + 'src/engine2/dishes/alinosD105.js');
const { aplicarAjustesD099 } = await import(R + 'src/engine2/dishes/ajustesD099.js');
const nombre = new Map(aplicarNombresD105(aplicarAjustesD099(catalogoApp())).map((d) => [d.id, d.nombre]));
const OMNI = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const vegetal = (n) => ((String(n || '').match(/^crema (?:fría )?de ([a-záéíóúñ]+)/i) || [])[1] || '').toLowerCase() || null;
const n2 = (x) => x.toFixed(2).replace('.', ',');
const L = ['| Medición | Cremas/sem | Semanas con la crema del mismo vegetal dos veces | Distancia en días (0 / 1 / 2 / 3 / 4 / 5 / 6) | De ellas, con una ficha libre | Cortas/sem | Legumbres/sem | Pescado/sem | D-099.3 |', '|---|---|---|---|---|---|---|---|---|'];
for (const arg of process.argv.slice(2)) {
  const [etiqueta, resto] = arg.split('=');
  const [dir, suf] = resto.split(':').length > 2 ? [resto.slice(0, resto.lastIndexOf(':')), resto.slice(resto.lastIndexOf(':') + 1)] : resto.split(':');
  let sem = 0; let cremas = 0; let conRep = 0; let libre = 0; let cortas = 0; let leg = 0; let pescado = 0; let d099 = 0;
  const dist = [0, 0, 0, 0, 0, 0, 0];
  for (const p of OMNI) {
    for (const s of JSON.parse(fs.readFileSync(`${dir.replace(/\/?$/, '/')}${p}-${suf}.json`, 'utf8')).semanas) {
      sem++; cortas += s.cortas; leg += s.leg; pescado += s.pescado; d099 += s.d099;
      const cr = s.menu.filter((m) => vegetal(nombre.get(m[2]))).map((m) => ({ dia: DIAS.indexOf(m[0]), id: m[2], v: vegetal(nombre.get(m[2])) }));
      cremas += cr.length;
      let rep = false;
      for (let a = 0; a < cr.length; a++) for (let b = a + 1; b < cr.length; b++) {
        if (cr[a].v !== cr[b].v) continue;
        rep = true; dist[Math.abs(cr[b].dia - cr[a].dia)] += 1;
        if (!cr[a].id.startsWith('[') || !cr[b].id.startsWith('[')) libre += 1;
      }
      if (rep) conRep++;
    }
  }
  L.push(`| ${etiqueta} | ${n2(cremas / sem)} | ${conRep} de ${sem} | ${dist.join(' / ')} | ${libre} | ${n2(cortas / sem)} | ${n2(leg / sem)} | ${n2(pescado / sem)} | ${d099} |`);
}
console.log(L.join('\n'));
