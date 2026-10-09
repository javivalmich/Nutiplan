import fs from 'node:fs';
const O = 'C:/Users/javiv/fase7-materiales/generacion-2001-2010/planes/';
const R = 'C:/Users/javiv/fase7-materiales/regeneracion-765b90a/planes/';
const corto = (v) => { const s = JSON.stringify(v); return s === undefined ? '(ausente)' : s.length > 80 ? s.slice(0, 80) + '…' : s; };
function diff(a, b, ruta, out) {
  if (a === b) return;
  const oa = a && typeof a === 'object', ob = b && typeof b === 'object';
  if (oa && ob && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
      diff(a[k], b[k], ruta + (Array.isArray(a) ? `[${k}]` : `.${k}`), out);
    return;
  }
  out.push([ruta, a, b]);
}
const patrones = new Map(); let ejemplo = null;
for (const f of fs.readdirSync(O).filter((f) => f.endsWith('-legacy.json')).sort()) {
  const ta = fs.readFileSync(O + f, 'utf8'), tb = fs.readFileSync(R + f, 'utf8');
  const out = []; diff(JSON.parse(ta), JSON.parse(tb), '$', out);
  if (!out.length) console.log('SIN DIFERENCIA ESTRUCTURAL (solo bytes):', f, ta.length, tb.length);
  for (const [r] of out) { const p = r.replace(/\[\d+\]/g, '[*]'); patrones.set(p, (patrones.get(p) || 0) + 1); }
  if (!ejemplo) ejemplo = [f, out];
}
console.log('Patrones de ruta que difieren (20 legacy), con nº de ocurrencias:');
for (const [p, n] of [...patrones].sort()) console.log(' ', n, p);
console.log('Ejemplo', ejemplo[0], '- primeras 15 diferencias:');
for (const [r, a, b] of ejemplo[1].slice(0, 15)) console.log(' ', r, '\n    orig: ', corto(a), '\n    regen:', corto(b));