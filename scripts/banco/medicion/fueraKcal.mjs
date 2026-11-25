// Comidas y cenas fuera de ±5 % de kcal, por tipo de plato: MEDICIÓN, no cambia reglas (Javi, 2026-11-23).
// Para cada comida y cena servida (sin la sugerencia de la comida libre): momento, tipo de plato (comida doble,
// plantilla con guarnición de legumbre, plantilla, redactado), si lleva pan, y desviación de kcal frente a su objetivo.
// Escribe un .json con los recuentos por perfil y por categoría (fuera, por encima, por debajo, desviación media).
// Uso: node --import ./scripts/banco/resolver.mjs [--import <hook>] scripts/banco/medicion/fueraKcal.mjs \
//        <raíz> <salida.json> <semanas> <perfil> [<perfil> …] [--opciones del hook]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [raizArg, salida, semArg, ...resto] = process.argv.slice(2);
const perfiles = resto.filter((a) => !a.startsWith('--'));
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const ACT = new URL('../../../', import.meta.url).href; // perfiles y lector, del árbol actual (como cortasProteina.mjs)
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES } = await import(ACT + 'scripts/banco/perfiles.mjs');
const { leerComida } = await import(ACT + 'src/plan/medidor/leerComida.js');
const tupla = (id) => { try { const t = JSON.parse(id); return Array.isArray(t) ? t : null; } catch { return null; } };
const l = console.log; console.log = console.warn = console.error = () => {};
const out = {};
for (const perfilId of perfiles) {
  const p = PERFILES.find((x) => x.id === perfilId);
  if (!p) throw new Error(`fueraKcal: perfil desconocido ${perfilId}`);
  const cat = {};
  let ant = null;
  for (let s = 60; s < 60 + Number(semArg); s++) {
    const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${perfilId}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    ant = plan;
    for (const d of plan.days) {
      for (const m of d.meals.filter((x) => x && (x.time === 'Comida' || x.time === 'Cena') && !x.sugerencia)) {
        if (!m.nutricion || !m.nutricion.objetivoKcal) continue;
        let pan = 0;
        try { pan = leerComida(m).items.filter((it) => String(it.clave).startsWith('pan')).reduce((a, it) => a + it.gramos, 0); } catch { pan = 0; }
        const t = tupla(m._dishId);
        const tipo = m._dishId2 ? 'comida doble' : m._guarnicion ? 'plantilla con guarnición' : t ? 'plantilla' : 'redactado';
        const clave = `${m.time} · ${tipo} · ${pan > 0 ? 'con pan' : 'sin pan'}`;
        const desv = (m.nutricion.kcal - m.nutricion.objetivoKcal) / m.nutricion.objetivoKcal;
        const c = (cat[clave] ||= { total: 0, encima: 0, debajo: 0, desvEncima: 0, desvDebajo: 0, tmplDebajo: {}, tmplEncima: {} });
        c.total += 1;
        const tm = t ? t[0] : 'redactado';
        if (desv > 0.05) { c.encima += 1; c.desvEncima += desv; c.tmplEncima[tm] = (c.tmplEncima[tm] || 0) + 1; }
        if (desv < -0.05) { c.debajo += 1; c.desvDebajo += desv; c.tmplDebajo[tm] = (c.tmplDebajo[tm] || 0) + 1; }
      }
    }
  }
  out[perfilId] = { kcal: p.kcal, cat };
}
console.log = l;
fs.writeFileSync(salida, JSON.stringify(out));
l(`${perfiles.length} perfiles → ${salida}`);
