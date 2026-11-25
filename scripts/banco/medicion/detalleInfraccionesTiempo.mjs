// MEDICIÓN. Detalle de las infracciones de especie (mismo día y días seguidos, D-099.3) de una medición de
// medirReglaTiempo.mjs: perfil, semana, días, platos y cómo se colocó cada hueco (filtro, red, fijo, fin de semana).
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/detalleInfraccionesTiempo.mjs <carpeta> <salida.md>
import fs from 'node:fs';
import path from 'node:path';

const [carpeta, salida] = process.argv.slice(2);
const { catalogoApp } = await import('../../../src/plan/catalogo.js');
const { conPlatosDieta } = await import('../../../src/plan/platosDieta.js');
const { proteinaPrincipal } = await import('../../../src/engine2/dishes/bases.js');
const porId = new Map(['omnivora', 'vegetariana', 'vegana'].flatMap((dieta) => conPlatosDieta(catalogoApp(), { dieta }, { reserva: true })).map((d) => [d.id, d]));
const especie = (id) => (porId.has(id) ? proteinaPrincipal(porId.get(id)) : null);
const NOMBRE_DIA = { Miercoles: 'Miércoles', Sabado: 'Sábado' };
const L = ['| Perfil | Combinación | Semana | Infracción | Especie | Huecos (cómo se colocaron) |', '|---|---|---|---|---|---|'];
let total = 0;
for (const f of fs.readdirSync(carpeta).filter((x) => x.endsWith('.json') && x.includes('__')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8'));
  if (j.dieta === 'vegana' || j.tiempoCocina + j.experiencia === 'normalintermedio') continue;
  for (const s of j.semanas) {
    if (!s.d099.mismoDia && !s.d099.seguidos) continue;
    const huecos = s.menu.flatMap((d, k) => ['comida', 'cena'].map((m) => d[m] && !/sugerencia/.test(d[m].como)
      ? { k, dia: d.dia, m, ...d[m], esp: especie(d[m].ids[0]) } : null)).filter(Boolean);
    const desc = (h) => `${NOMBRE_DIA[h.dia] || h.dia} ${h.m}: ${h.titulo} *(${h.como || (h.k >= 5 ? 'fin de semana, sin filtro' : '—')})*`;
    for (let k = 0; k < 7; k++) {
      const hoy = huecos.filter((h) => h.k === k);
      for (const e of new Set(hoy.map((h) => h.esp).filter(Boolean))) {
        const mismos = hoy.filter((h) => h.esp === e);
        if (mismos.length > 1) { total++; L.push(`| ${j.perfil} | ${j.tiempoCocina}+${j.experiencia} | ${s.s} | mismo día | ${e} | ${mismos.map(desc).join('<br>')} |`); }
        const manana = huecos.filter((h) => h.k === k + 1 && h.esp === e);
        if (manana.length && !/ancla|sobra/.test(mismos.concat(manana).map((h) => h.como).join(' '))) {
          total++; L.push(`| ${j.perfil} | ${j.tiempoCocina}+${j.experiencia} | ${s.s} | días seguidos | ${e} | ${mismos.concat(manana).map(desc).join('<br>')} |`);
        }
      }
    }
  }
}
fs.writeFileSync(salida, `${L.join('\n')}\n`);
console.log(`${total} infracciones → ${salida}`);
