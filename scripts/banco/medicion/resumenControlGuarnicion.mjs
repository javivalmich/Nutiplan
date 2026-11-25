// MEDICIÓN. Resumen de controlGuarnicion.mjs (pasos 4, 5 y 7 de la guarnición): tabla por perfil (main, prototipo7, prototipo con el RNG de engine2, motor real) y comparación
// semana a semana del motor real frente al prototipo con el RNG de engine2 (menú y cifras de cada comida).
import fs from 'node:fs';

// Uso: node scripts/banco/medicion/resumenControlGuarnicion.mjs <dir>  (en <dir>: <perfil>-<main|p7|rng|head>.json)
const D = `${process.argv[2].replace(/\/?$/, '/')}`;
const P = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'sibo-2000', 'vegetariana-2000', 'vegana-1400', 'omni-2174-ancla', 'omni-2000-sin-atun', 'sin-carne-ave-2000', 'solo-pollo-2000', 'sin-garbanzos-guisantes-2000', 'sin-legumbres-2000', 'omni-2174-batido', 'omni-2174-volumen'];
const V = [['main', 'main'], ['p7', 'prototipo7'], ['rng', 'prototipo7, RNG de engine2'], ['head', 'motor real']];
const leer = (p, v) => JSON.parse(fs.readFileSync(`${D}${p}-${v}.json`, 'utf8')).semanas;
const n2 = (x) => x.toFixed(2).replace('.', ',');
const n1 = (x) => x.toFixed(1).replace('.', ',');
const fila = (ss) => {
  const m = (f) => ss.reduce((a, s) => a + f(s), 0) / ss.length;
  const t = (f) => ss.reduce((a, s) => a + f(s), 0);
  const fuera = t((s) => s.fuera); const princ = t((s) => s.principales);
  return [n2(m((s) => s.cortas)), `${n1(m((s) => s.protDia))} %`, `${n2(m((s) => s.leg))} (${n2(m((s) => s.guarn))})`, n2(m((s) => s.pescado)), `${n1((100 * fuera) / princ)} %`, t((s) => s.d099), `${t((s) => s.red)}${t((s) => s.redSigue) ? ` (${t((s) => s.redSigue)} siguen)` : ''}`];
};
const L = ['| Perfil | Medición | Cortas/sem | Proteína del día | Legumbres/sem (guarnición) | Pescado/sem | Fuera de ±5 % de kcal | D-099.3 | Red de D-099.3 |', '|---|---|---|---|---|---|---|---|---|'];
const todos = Object.fromEntries(V.map(([v]) => [v, []]));
const OMNI = ['omni-1434', 'omni-2174', 'omni-2600-3comidas', 'omni-3714', 'celiaco-2400', 'sin-lactosa-2000', 'sin-pescado-2000', 'omni-2174-ancla', 'omni-2000-sin-atun'];
const omni = Object.fromEntries(V.map(([v]) => [v, []]));
for (const p of P) {
  for (const [v, et] of V) {
    const ss = leer(p, v);
    todos[v].push(...ss);
    if (OMNI.includes(p)) omni[v].push(...ss);
    L.push(`| ${p} | ${et} | ${fila(ss).join(' | ')} |`);
  }
}
const A = ['| Agregado | Medición | Cortas/sem | Proteína del día | Legumbres/sem (guarnición) | Pescado/sem | Fuera de ±5 % de kcal | D-099.3 | Red de D-099.3 |', '|---|---|---|---|---|---|---|---|---|'];
for (const [v, et] of V) A.push(`| 9 omnívoros del banco | ${et} | ${fila(omni[v]).join(' | ')} |`);
for (const [v, et] of V) A.push(`| 18 perfiles | ${et} | ${fila(todos[v]).join(' | ')} |`);

// Semana a semana: motor real frente al prototipo con el RNG de engine2, y frente a prototipo7.
const C = ['| Perfil | Semanas con el mismo menú (real = proto RNG engine2) | Comidas con otras kcal o proteína | Máx. diferencia (kcal / g prot) | Semanas con el mismo menú (real = prototipo7) |', '|---|---|---|---|---|'];
const difs = [];
for (const p of P) {
  const a = leer(p, 'head'); const b = leer(p, 'rng'); const c = leer(p, 'p7');
  const clave = (m) => m.slice(0, 4).join('|');
  let iguales = 0; let igualesP7 = 0; let otrasCifras = 0; let maxK = 0; let maxP = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i].menu.map(clave); const y = b[i].menu.map(clave); const z = c[i].menu.map(clave);
    if (x.join() === y.join()) iguales++; else difs.push({ p, s: a[i].s, real: a[i].menu.filter((m, k) => clave(m) !== y[k]).map(clave), proto: b[i].menu.filter((m, k) => clave(m) !== x[k]).map(clave) });
    if (x.join() === z.join()) igualesP7++;
    if (x.join() === y.join()) {
      for (let k = 0; k < a[i].menu.length; k++) {
        const dk = Math.abs((a[i].menu[k][4] || 0) - (b[i].menu[k][4] || 0)); const dp = Math.abs((a[i].menu[k][5] || 0) - (b[i].menu[k][5] || 0));
        if (dk || dp) { otrasCifras++; maxK = Math.max(maxK, dk); maxP = Math.max(maxP, dp); }
      }
    }
  }
  C.push(`| ${p} | ${iguales} de ${a.length} | ${otrasCifras} | ${maxK} / ${maxP} | ${igualesP7} de ${a.length} |`);
}
fs.writeFileSync(`${D}resumen.md`, ['## Agregado', '', ...A, '', '## Por perfil', '', ...L, '', '## Semana a semana', '', ...C, ''].join('\n'));
fs.writeFileSync(`${D}difs.json`, JSON.stringify(difs, null, 1));
console.log(['## Agregado', ...A, '', ...C].join('\n'));
console.log(`semanas con menú distinto: ${difs.length}`);
