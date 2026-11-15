// Compara el MOTOR REAL (D-116 y D-117 implementadas en src/engine2) con el prototipo de medición (el hook
// estructuraComida.mjs sobre el walk anterior a la implementación). MEDICIÓN, no cambia reglas.
//
// Las dos mediciones salen de medirEstructura.mjs, con las mismas semillas del banco:
//
//   1) El prototipo, con la variante decidida por Javi (lee runWalk.js y materializePlan.js de git, ba52d21):
//      node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/estructuraComida.mjs \
//        scripts/banco/medicion/medirEstructura.mjs <dir>/hook.json --ec=suelo3,sinPescado,todas,antesAB,topePlatoUnico,red --semanas 200
//   2) El motor real (el hook solo aplica las raciones de la comida doble, que src/plan aún no hace):
//      node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/estructuraComida.mjs \
//        scripts/banco/medicion/medirEstructura.mjs <dir>/motor.json --ec=motor --semanas 200 --topes <dir>/hook.json
//   3) node scripts/banco/medicion/compararMotorHook.mjs <dir>/hook.json <dir>/motor.json [salida.md]
//
// Compara semana a semana (misma semana = mismos platos en los mismos huecos, segundos incluidos) y da las
// cifras de D-116 y D-117 de cada lado. Código de salida: 0 si las cifras esperadas se cumplen en el motor.
import fs from 'node:fs';

const [fHook, fMotor, salida] = process.argv.slice(2);
if (!fHook || !fMotor) throw new Error('Uso: compararMotorHook.mjs <hook.json> <motor.json> [salida.md]');
const H = JSON.parse(fs.readFileSync(fHook, 'utf8'));
const M = JSON.parse(fs.readFileSync(fMotor, 'utf8'));
if (H.semanas !== M.semanas || H.filas.length !== M.filas.length) throw new Error('Las dos mediciones no tienen las mismas semanas');

const n2 = (x) => x.toFixed(2).replace('.', ',');
const suma = (xs, f) => xs.reduce((a, x) => a + (f(x) || 0), 0);
const d099 = (r) => Object.values(r.d099).reduce((a, b) => a + b, 0);
const red = (r) => (r.causas.segundos_retirados_d099 || 0);
const perfiles = [...new Set(H.filas.map((r) => r.perfil))];
// Los 8 perfiles omnívoros sin SIBO, como en D-116 y D-117.
const OMNI8 = perfiles.filter((p) => p !== 'sibo-2000' && p !== 'sin-pescado-2000');
const clave = (r) => `${r.perfil}|${r.s}`;
const porClaveM = new Map(M.filas.map((r) => [clave(r), r]));

const L = [];
L.push('# Motor real frente al prototipo de medición (D-116 y D-117)', '');
L.push(`Salida de \`compararMotorHook.mjs\`. ${H.semanas} semanas seguidas por perfil, ${perfiles.length} perfiles (${H.filas.length} semanas), las semillas del banco desde la semana ${H.semanaInicial}.`);
L.push('«Prototipo» es el hook `estructuraComida.mjs` con `suelo3,sinPescado,todas,antesAB,topePlatoUnico,red` sobre el walk anterior a la implementación; «motor» es `src/engine2` tal cual (`--ec=motor`).', '');

// 1) Semana a semana.
const difs = [];
let iguales = 0; let igualesTexto = 0;
for (const h of H.filas) {
  const m = porClaveM.get(clave(h));
  if (h.huella === m.huella) iguales += 1; else difs.push([h, m]);
  if (h.huellaTexto === m.huellaTexto) igualesTexto += 1;
}
L.push('## Semana a semana', '');
L.push(`- Semanas con los mismos platos en los mismos huecos (comida, segundo, cena y sugerencia): **${iguales} de ${H.filas.length}**.`);
L.push(`- Semanas con el mismo texto y las mismas cantidades en comidas y cenas: ${igualesTexto} de ${H.filas.length}.`);
if (difs.length) {
  L.push('', `Semanas distintas: ${difs.length}. Las primeras:`, '');
  for (const [h, m] of difs.slice(0, 10)) {
    const dm = m.menu.filter((x, k) => x !== h.menu[k]);
    const dh = h.menu.filter((x, k) => x !== m.menu[k]);
    L.push(`- ${h.perfil}, semana ${h.s}: prototipo «${dh.slice(0, 3).join(' · ')}»; motor «${dm.slice(0, 3).join(' · ')}»`);
  }
}
L.push('');

// 2) Cifras de cada lado.
const cifras = (filas) => {
  const o8 = filas.filter((r) => OMNI8.includes(r.perfil));
  return {
    d099: suma(filas, d099),
    red: suma(filas, red),
    redPerfiles: [...new Set(filas.filter((r) => red(r)).map((r) => r.perfil))],
    legumbre: suma(o8, (r) => r.legumbre) / o8.length,
    pescado: suma(o8, (r) => r.pescado) / o8.length,
    segundos: suma(o8, (r) => r.segundos) / o8.length,
    d115: suma(o8, (r) => r.d115.familiaDiasSeguidosSinAncla),
    sinTope: suma(filas, (r) => r.causas.segundo_sin_tope_plato_unico),
    sinCandidato: suma(filas, (r) => r.causas.segundo_sin_candidato),
    diaSin: suma(o8, (r) => r.causas.dia_legumbre_sin_candidato),
    diaSinSibo: suma(filas.filter((r) => r.perfil === 'sibo-2000'), (r) => r.causas.dia_legumbre_sin_candidato),
    sorteosSibo: filas.filter((r) => r.perfil === 'sibo-2000' && r.diasSorteados).length,
    noEngine2: filas.filter((r) => r.motor !== 'engine2').length,
    fuera5: o8.filter((r) => !r.dentro).length,
    cortas: suma(o8, (r) => r.cortas) / o8.length,
    vetados: suma(filas, (r) => r.vetados + r.eliminados),
    d114: suma(filas, (r) => r.d114.sugerenciaConSegundo),
    // Semanas con infracción de D-099.3 y sin segundos que retirar (D-116.5, causa propia del motor).
    sinArreglo: filas.filter((r) => r.causas.infraccion_d099_sin_segundos).length,
    sinArregloD099: filas.filter((r) => !r.segundos && d099(r) > 0).length,
    sinSorteo: filas.filter((r) => r.causas.dias_legumbre_sin_sorteo).length,
    n8: o8.length,
  };
};
const ch = cifras(H.filas); const cm = cifras(M.filas);
const fila = (nombre, f, esperado = '') => L.push(`| ${nombre} | ${f(ch)} | ${f(cm)} | ${esperado} |`);
L.push('## Cifras', '');
L.push(`«8 perfiles» son los omnívoros sin SIBO y con pescado (${ch.n8} semanas), como en D-116 y D-117.`, '');
L.push('| Medida | Prototipo | Motor | Esperado |', '|---|---|---|---|');
fila('Infracciones de D-099.3 (10 perfiles, total de casos)', (c) => c.d099, '0');
fila(`Red de seguridad: semanas rehechas sin segundos (de ${H.filas.length})`, (c) => `${c.red} (${c.redPerfiles.join(', ') || '—'})`, 'unas 71, todas de sin-pescado-2000');
fila('Legumbre por semana (8 perfiles)', (c) => n2(c.legumbre), '≈ 3,02');
fila('Pescado por semana (8 perfiles)', (c) => n2(c.pescado), '≈ 3,90');
fila('Comidas con segundo por semana (8 perfiles)', (c) => n2(c.segundos), '2,99');
fila('Familia en días seguidos sin ancla, D-115 (8 perfiles, casos)', (c) => c.d115, '238');
fila('Segundo sin tope, plato único (10 perfiles)', (c) => c.sinTope, '3');
fila('Segundo sin candidato (10 perfiles)', (c) => c.sinCandidato, '0');
fila('Día sorteado sin legumbre (8 perfiles, casos)', (c) => c.diaSin, '2,7 por 100 semanas');
fila('SIBO: semanas con días sorteados', (c) => c.sorteosSibo, '0 en el motor');
fila('SIBO: días sorteados sin candidato', (c) => c.diaSinSibo, '0 en el motor (600 en el prototipo)');
fila('D-114: sugerencias con segundo', (c) => c.d114, '0');
fila('Semanas con infracción de D-099.3 y sin segundos (contadas por medirEstructura)', (c) => c.sinArregloD099, '0');
fila('Semanas con la causa infraccion_d099_sin_segundos (solo el motor la anota)', (c) => c.sinArreglo, '0');
fila('Semanas con dias_legumbre_sin_sorteo (solo el motor la anota; SIBO)', (c) => c.sinSorteo, '200 en el motor');
fila('Comidas con un alimento vetado o eliminado', (c) => c.vetados, '0');
fila('Semanas fuera de ±5 % de calorías (8 perfiles)', (c) => c.fuera5);
fila('Comidas y cenas cortas de proteína por semana (8 perfiles)', (c) => n2(c.cortas), '1,85');
fila('Planes que no son de engine2', (c) => c.noEngine2, '0');
L.push('');

// 3) Por perfil.
L.push('## Por perfil', '', '| Perfil | Semanas iguales | Red (prototipo / motor) | Legumbre/sem | Pescado/sem | D-099.3 |', '|---|---|---|---|---|---|');
for (const p of perfiles) {
  const h = H.filas.filter((r) => r.perfil === p); const m = M.filas.filter((r) => r.perfil === p);
  const ig = h.filter((r) => r.huella === porClaveM.get(clave(r)).huella).length;
  L.push(`| ${p} | ${ig} de ${h.length} | ${suma(h, red)} / ${suma(m, red)} | ${n2(suma(h, (r) => r.legumbre) / h.length)} / ${n2(suma(m, (r) => r.legumbre) / m.length)} | ${n2(suma(h, (r) => r.pescado) / h.length)} / ${n2(suma(m, (r) => r.pescado) / m.length)} | ${suma(h, d099)} / ${suma(m, d099)} |`);
}
L.push('');

const texto = L.join('\n');
console.log(texto);
if (salida) fs.writeFileSync(salida, `${texto}\n`);
const ok = cm.d099 === 0 && cm.noEngine2 === 0 && cm.redPerfiles.every((p) => p === 'sin-pescado-2000') && cm.sorteosSibo === 0;
process.exit(ok ? 0 : 1);
