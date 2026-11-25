// Platos de huevo cortos de proteína: MEDICIÓN, no cambia reglas (Javi, 2026-11-23, «solo informar»). Genera N semanas
// seguidas por la entrada de la app (generarPlan) del árbol <raíz> y, para cada comida o cena servida cuyo plato es de
// familia huevo, mira si queda por debajo del 95 % de su objetivo de proteína y por qué:
//   - tope: los huevos están en el tope de D-111 de ese día (3 por comida y 4 por día, repartidos entre las comidas del
//     día que llevan huevo, desayuno incluido);
//   - energía: por debajo del tope, pero la comida ya está en su objetivo de kcal o por encima (subir huevos la pasaría);
//   - otro: ninguna de las dos.
// También dice cuánto aporta el resto del plato (otros proteicos) y la proteína media frente al objetivo, por plato.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/medicion/huevosCortos.mjs <raíz> <salida.md> [semanas] <perfil> …
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const [raizArg, salida, ...resto] = process.argv.slice(2);
const SEM = /^\d+$/.test(resto[0]) ? Number(resto.shift()) : 200;
const perfiles = resto;
const raiz = pathToFileURL(raizArg.replace(/\/?$/, '/')).href;
const { generarPlan, platosRecientesPara } = await import(raiz + 'src/plan/generarPlan.js');
const { FREEFORM_POOL } = await import(raiz + 'src/data/freeformPool.js');
const { PERFILES } = await import(raiz + 'scripts/banco/perfiles.mjs');
const { catalogoApp } = await import(raiz + 'src/plan/catalogo.js');
const { aplicarAjustesD099 } = await import(raiz + 'src/engine2/dishes/ajustesD099.js');
const { aplicarNombresD105 } = await import(raiz + 'src/engine2/dishes/alinosD105.js');
const { familiaProteica } = await import(raiz + 'src/engine2/dishes/bases.js');
const { leerComida } = await import(raiz + 'src/plan/medidor/leerComida.js');
const { COMPOSICION } = await import(raiz + 'src/engine2/nutrientes/composicion.js');
const { papelDe, TOPE_HUEVOS_COMIDA, TOPE_HUEVOS_DIA } = await import(raiz + 'src/engine2/nutrientes/raciones.js');
const { INGREDIENTES } = await import(raiz + 'src/engine2/nutrientes/ingredientes.js');

const l = console.log; console.log = console.warn = console.error = () => {};
const porId = new Map(aplicarNombresD105(aplicarAjustesD099(catalogoApp())).map((d) => [d.id, d]));
const gUd = INGREDIENTES.huevo.gUd;
const n1 = (x) => x.toFixed(1).replace('.', ',');
const porPlato = new Map();
const totales = { servidos: 0, cortos: 0, tope: 0, topeRepartido: 0, energia: 0, otro: 0 };
for (const id of perfiles) {
  const p = PERFILES.find((x) => x.id === id);
  let ant = null;
  for (let s = 60; s < 60 + SEM; s++) {
    const plan = generarPlan(JSON.parse(JSON.stringify(p.perfil)), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: s, userId: `banco-${id}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, s - 1, s) });
    ant = plan;
    for (const d of plan.days) {
      const meals = d.meals.filter((m) => m && !m.sugerencia);
      const conHuevo = meals.filter((m) => leerComida(m).items.some((it) => it.clave === 'huevo')).length;
      const topeDia = conHuevo <= 1 ? TOPE_HUEVOS_COMIDA : Math.max(1, Math.floor(TOPE_HUEVOS_DIA / conHuevo));
      for (const m of meals) {
        if ((m.time !== 'Comida' && m.time !== 'Cena') || !m.nutricion || !porId.has(m._dishId)) continue;
        const dish = porId.get(m._dishId);
        if (familiaProteica(dish) !== 'huevo') continue;
        const items = leerComida(m).items;
        const huevos = Math.round(items.filter((it) => it.clave === 'huevo').reduce((a, it) => a + it.gramos, 0) / gUd);
        const otros = items.filter((it) => it.clave !== 'huevo' && COMPOSICION[it.clave] && papelDe(it.clave, COMPOSICION[it.clave]) === 'proteico');
        const protOtros = otros.reduce((a, it) => a + (COMPOSICION[it.clave].proteina * it.gramos) / 100, 0);
        const n = m.nutricion;
        const corto = n.proteina < 0.95 * n.objetivoProteina;
        let motivo = null;
        if (corto) motivo = huevos >= topeDia ? (topeDia < TOPE_HUEVOS_COMIDA ? 'topeRepartido' : 'tope') : (n.kcal >= n.objetivoKcal ? 'energia' : 'otro');
        const k = `${dish.nombre}|${m.time}`;
        if (!porPlato.has(k)) porPlato.set(k, { nombre: dish.nombre, time: m.time, servidos: 0, cortos: 0, motivos: {}, ratio: 0, huevos: 0, protOtros: 0, perfiles: new Set() });
        const r = porPlato.get(k);
        r.servidos += 1; r.ratio += n.proteina / n.objetivoProteina; r.huevos += huevos; r.protOtros += protOtros; r.perfiles.add(id);
        totales.servidos += 1;
        if (corto) { r.cortos += 1; r.motivos[motivo] = (r.motivos[motivo] || 0) + 1; totales.cortos += 1; totales[motivo] += 1; }
      }
    }
  }
}
console.log = l;
const filas = [...porPlato.values()].sort((a, b) => b.cortos - a.cortos);
const L = ['# Platos de huevo cortos de proteína (2026-11-23)', '',
  `Salida de \`huevosCortos.mjs\`: ${SEM} semanas por perfil desde la 60, perfiles ${perfiles.join(', ')}. Comidas y cenas servidas cuyo plato es de familia huevo; «corto» es por debajo del 95 % de su objetivo de proteína.`, '',
  `**Total:** ${totales.servidos} servidas, ${totales.cortos} cortas (${n1((100 * totales.cortos) / totales.servidos)} %).`, '',
  '| Motivo | Cortas | % de las cortas |', '|---|---|---|',
  ...[['tope', 'Huevos en el tope de D-111 (3 en la comida)'], ['topeRepartido', 'Huevos en el tope repartido (otra comida del día también lleva huevo)'], ['energia', 'Por debajo del tope, con la comida ya en su objetivo de kcal o por encima'], ['otro', 'Otro']]
    .map(([k, t]) => `| ${t} | ${totales[k]} | ${n1((100 * totales[k]) / Math.max(1, totales.cortos))} % |`),
  '', '| Plato | Momento | Servidas | Cortas | Motivo (tope / tope repartido / energía / otro) | Proteína media frente al objetivo | Huevos de media | Proteína de otros proteicos (g, media) |', '|---|---|---|---|---|---|---|---|',
  ...filas.map((r) => `| ${r.nombre} | ${r.time} | ${r.servidos} | ${r.cortos} | ${['tope', 'topeRepartido', 'energia', 'otro'].map((k) => r.motivos[k] || 0).join(' / ')} | ${n1((100 * r.ratio) / r.servidos)} % | ${n1(r.huevos / r.servidos)} | ${n1(r.protOtros / r.servidos)} |`),
  ''];
fs.writeFileSync(salida, L.join('\n'));
l(L.slice(0, 14).join('\n'));
