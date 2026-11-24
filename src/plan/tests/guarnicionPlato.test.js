// Pasos 6 y 9 de la legumbre como guarnición (D-120): raciones, texto, compra,
// receta y alternativas de un plato con guarnición. Ningún plan lleva aún
// guarnición (es el paso 4): aquí se fuerza en platos reales del catálogo.
import { describe, it, expect } from 'vitest';
import { conGuarnicion, nombreConGuarnicion } from '../textos/guarnicion.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { LEGUMBRES_GUARNICION } from '../textos/compuestos.js';
import { leerComida } from '../medidor/leerComida.js';
import { ajustarDia } from '../racionesApp.js';
import { generarPlan, regenerarComida, AVISO_GUARNICION_SIN_ALTERNATIVA } from '../generarPlan.js';
import { metaEngine2 } from '../engine2App.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { GUARNICION_LEGUMBRE } from '../../engine2/dishes/guarnicionLegumbre.js';
import {
  ajustarComida, racionesDia, rangoDe, RANGO_GUARNICION, SALIDA_GUARNICION, TOPE_PLATO_CARNE, TOPE_PLATO_PESCADO, topePlato,
} from '../../engine2/nutrientes/raciones.js';
import { COMPOSICION } from '../../engine2/nutrientes/composicion.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const plato = (fn) => CATALOGO.find((d) => { const t = tuplaDe(d.id); return t && fn(t); });
const CONEJO = plato((t) => t.P === 'conejo' && t.C === 'patata' && t.V === 'espinacas' && t.cookM === 'horno');
const POLLO_PLANCHA = plato((t) => t.P === 'pollo' && t.C === 'arroz' && t.V === 'brocoli' && t.cookM === 'plancha' && t.S === 'limon_hierbas');
const ATUN_CRUDO = plato((t) => t.P === 'atun' && t.C === 'arroz' && t.cookM === 'crudo');
const BOWL = plato((t) => t.tmpl === 'bowl');
const H74 = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'male', age: 36, weight: 74, height: 178, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Lunes'] };
const clonar = (x) => JSON.parse(JSON.stringify(x));
const opts = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60, userId: 'guarnicion-forzada', saveMealMemory: () => {}, platosRecientes: [] };

/** La comida como la monta la app (engine2App.js) con el plato que se le pasa. */
const comidaCon = (dish, time = 'Comida', kcal = 2174) => ({ ...componerPlato(dish, time === 'Cena' ? 'cena' : 'comida', kcal), time, title: dish.nombre, _motor: 'engine2', _dishId: dish.id });

describe('paso 9: el plato con guarnición', () => {
  it('los platos de prueba existen y admiten guarnición', () => {
    for (const d of [CONEJO, POLLO_PLANCHA, ATUN_CRUDO]) expect(GUARNICION_LEGUMBRE[d.id], d && d.nombre).toBeTruthy();
    expect(CONEJO.nombre).toBe('Conejo al horno con espinacas y patata');
  });

  it('el nombre lleva la legumbre donde decía el hidrato', () => {
    expect(nombreConGuarnicion('Conejo al horno con espinacas y patata', 'patata', 'garbanzos')).toBe('Conejo al horno con espinacas y garbanzos');
    expect(nombreConGuarnicion('Salmón al horno con espinacas y boniato', 'boniato', 'lentejas beluga')).toBe('Salmón al horno con espinacas y lentejas beluga');
    expect(nombreConGuarnicion('Pollo con brócoli y arroz blanco', 'arroz', 'alubias blancas')).toBe('Pollo con brócoli y alubias blancas');
    expect(nombreConGuarnicion('Pollo con brócoli', 'arroz', 'garbanzos')).toBe('Pollo con brócoli con garbanzos');
  });

  it('solo una legumbre de la lista del plato; el id no cambia y la marca dice qué cambió', () => {
    expect(() => conGuarnicion(CONEJO, 'edamame')).toThrow(/no es una legumbre de guarnición/);
    expect(() => conGuarnicion(BOWL, 'garbanzos_cocidos')).toThrow(/no es una legumbre de guarnición/);
    const d = conGuarnicion(CONEJO, 'garbanzos_cocidos');
    expect(d.id).toBe(CONEJO.id);
    expect(d.nombre).toBe('Conejo al horno con espinacas y garbanzos');
    expect(d._guarnicion).toEqual({ clave: 'garbanzos_cocidos', legumbre: 'garbanzos', hidratoOriginal: 'patata', nombreOriginal: CONEJO.nombre });
  });

  it('al horno: la compra con la legumbre de bote escurrida, sin patata, y la receta con el paso de asarla', () => {
    const m = comidaCon(conGuarnicion(CONEJO, 'garbanzos_cocidos'));
    expect(m.title).toBe('Conejo al horno con espinacas y garbanzos');
    expect(m.shopping).toContain('Garbanzos cocidos de bote (130 g escurridos)');
    expect(m.shopping.some((s) => /patata/i.test(s))).toBe(false);
    expect(m.p2).toMatch(/Garbanzos cocidos de bote \(130 g escurridos\)/);
    expect(m.recipe).toContain('Escurre y enjuaga los garbanzos de bote, sécalos, alíñalos con un poco del aceite y sal y ásalos en la misma bandeja los últimos 15 min.');
    expect(m.recipe.join(' ')).not.toMatch(/patata/i);
    expect(m._guarnicion.clave).toBe('garbanzos_cocidos');
  });

  it('a la plancha: la receta calienta o saltea la legumbre en la sartén', () => {
    const m = comidaCon(conGuarnicion(POLLO_PLANCHA, 'alubias_blancas_cocidas'));
    expect(m.title).not.toMatch(/arroz/i);
    expect(m.shopping).toContain('Alubias blancas cocidas de bote (130 g escurridos)');
    expect(m.recipe).toContain('Escurre y enjuaga las alubias blancas de bote; caliéntalas 2-3 min en una sartén con un poco del aceite y sal.');
  });

  it('en crudo: la legumbre fría, solo escurrida', () => {
    const m = comidaCon(conGuarnicion(ATUN_CRUDO, 'lentejas_beluga_cocidas'));
    expect(m.recipe).toContain('Escurre y enjuaga las lentejas beluga de bote.');
    expect(m.recipe.join(' ')).not.toMatch(/templad|caliénta|ása/);
  });

  it('los 61 platos con cada una de sus legumbres se escriben y el medidor lee la legumbre con su clave', () => {
    let n = 0;
    for (const [id, lista] of Object.entries(GUARNICION_LEGUMBRE)) {
      const dish = CATALOGO.find((d) => d.id === id);
      for (const clave of lista) {
        const m = comidaCon(conGuarnicion(dish, clave));
        const leido = leerComida(m).items;
        expect(leido.filter((i) => i.clave === clave).map((i) => i.gramos), `${id} ${clave}`).toEqual([130]);
        expect(m.title, id).toContain(LEGUMBRES_GUARNICION[clave].nombre);
        n++;
      }
    }
    expect(n).toBe(Object.values(GUARNICION_LEGUMBRE).reduce((a, l) => a + l.length, 0));
  });
});

describe('paso 6: raciones de la comida con guarnición', () => {
  const items = (conMarca, extra = []) => [
    { clave: 'conejo', gramos: 200, unidad: 'g' },
    { clave: 'garbanzos_cocidos', gramos: 130, unidad: 'g', ...(conMarca ? { guarnicionLeg: true } : {}) },
    { clave: 'espinacas', gramos: 150, unidad: 'g', fijo: true },
    { clave: 'aove', gramos: 13.8, unidad: 'g' },
    ...extra,
  ];
  const leg = (r) => r.items.find((i) => i.clave === 'garbanzos_cocidos');
  const prot = (r) => r.items.find((i) => i.clave === 'conejo');
  const pan = (r) => r.items.find((i) => i.clave === 'pan_integral');

  it('topes de plato: 200 g de ave o carne y 220 g de pescado o marisco', () => {
    expect(TOPE_PLATO_CARNE).toBe(200);
    expect(TOPE_PLATO_PESCADO).toBe(220);
    expect(topePlato('conejo')).toBe(200);
    expect(topePlato('pollo_pechuga')).toBe(200);
    expect(topePlato('merluza')).toBe(220);
    expect(topePlato('gambas')).toBe(220);
    expect(topePlato('huevo')).toBe(null);
    expect(RANGO_GUARNICION).toEqual([100, 220, 10]);
    expect(SALIDA_GUARNICION).toBe(130);
  });

  it('con mucha proteína que cubrir, el proteico se queda en su tope de plato; sin guarnición, no hay tope', () => {
    const meta = { kcal: 900, proteina: 80, proteinaMin: 22 };
    const con = ajustarComida(items(true), meta, COMPOSICION, 1);
    const sin = ajustarComida(items(false), meta, COMPOSICION, 1);
    expect(prot(con).gramos).toBe(200);
    expect(prot(con).limitado).toBe('maximo');
    expect(prot(sin).gramos).toBeGreaterThan(200);
  });

  it('por encima de 2200 kcal el tope de plato escala con la amplitud, en pasos del rango del proteico', () => {
    const paso = rangoDe('conejo')[2];
    const r = ajustarComida(items(true), { kcal: 1400, proteina: 90, proteinaMin: 22 }, COMPOSICION, 1.4);
    expect(prot(r).gramos).toBe(Math.floor((200 * 1.4) / paso) * paso);
  });

  it('la legumbre va de 100 a 220 g y no crece con la amplitud; sin marca, el rango de siempre', () => {
    const poco = ajustarComida(items(true), { kcal: 350, proteina: 30, proteinaMin: 22 }, COMPOSICION, 1);
    expect(leg(poco).gramos).toBe(100);
    const mucho = ajustarComida(items(true), { kcal: 2000, proteina: 30, proteinaMin: 22 }, COMPOSICION, 1.4);
    expect(leg(mucho).gramos).toBe(220);
    const sinMarca = ajustarComida(items(false), { kcal: 2000, proteina: 30, proteinaMin: 22 }, COMPOSICION, 1.4);
    expect(leg(sinMarca).gramos).toBeGreaterThan(220);
  });

  it('si faltan kcal: después de la proteína crece la legumbre hasta 220 g y solo después el pan', () => {
    const conPan = items(true, [{ clave: 'pan_integral', gramos: 60, unidad: 'g' }]);
    const minPan = rangoDe('pan_integral')[0];
    // Faltan pocas kcal: la legumbre pasa de su salida de 130 g, el pan se queda en su mínimo.
    const algo = ajustarComida(conPan, { kcal: 650, proteina: 40, proteinaMin: 22 }, COMPOSICION, 1);
    expect(leg(algo).gramos).toBeGreaterThan(SALIDA_GUARNICION);
    expect(leg(algo).gramos).toBeLessThan(220);
    expect(pan(algo).gramos).toBe(minPan);
    expect(algo.crecidoGuarnicion.map((x) => x.papel)).toEqual(['proteina', 'legumbre']);
    // Faltan muchas: la legumbre llega a 220 g y crece el pan.
    const mucho = ajustarComida(conPan, { kcal: 1100, proteina: 40, proteinaMin: 22 }, COMPOSICION, 1);
    expect(leg(mucho).gramos).toBe(220);
    expect(pan(mucho).gramos).toBeGreaterThan(minPan);
    expect(mucho.crecidoGuarnicion.map((x) => x.papel)).toEqual(['proteina', 'legumbre', 'pan']);
  });

  it('el día deja la causa guarnicion_crece_por_energia en el log', () => {
    const r = racionesDia({
      comidas: [{ id: 'c', momento: 'comida', items: items(true) }],
      objetivo: { kcal: 2174, proteina: 120, pesoKg: 74 },
      composicion: COMPOSICION,
    });
    const e = r.log.find((x) => x.causa === 'guarnicion_crece_por_energia');
    expect(e).toBeTruthy();
    expect(e.detalle).toMatch(/^comida con guarnición: conejo \d+ g por la proteína de la comida/);
  });

  it('en la app: la comida forzada se raciona con la marca y se vuelve a escribir con los gramos nuevos', () => {
    const m = comidaCon(conGuarnicion(CONEJO, 'garbanzos_cocidos'));
    const day = { name: 'Lunes', meals: [m] };
    const { day: d, log } = ajustarDia(day, H74, 2174);
    const comida = d.meals[0];
    const g = leerComida(comida).items.find((i) => i.clave === 'garbanzos_cocidos').gramos;
    expect(g).toBeGreaterThanOrEqual(100);
    expect(g).toBeLessThanOrEqual(220);
    expect(comida.shopping).toContain(`Garbanzos cocidos de bote (${g} g escurridos)`);
    expect(leerComida(comida).items.find((i) => i.clave === 'conejo').gramos).toBeLessThanOrEqual(200);
    expect(comida._guarnicion.clave).toBe('garbanzos_cocidos');
    expect(log.some((e) => e.causa === 'guarnicion_crece_por_energia')).toBe(true);
  });
});

describe('paso 9: cambiar una comida con guarnición', { timeout: 120000 }, () => {
  const plan = generarPlan(clonar(H74), 2174, opts);
  const i = plan.days.findIndex((d) => d.meals.some((m) => m && m.time === 'Comida' && m._dishId && !m.libre && !m.sugerencia));
  // La comida de ese día, forzada a llevar guarnición, con su nombre original en platosSemana (como hará el paso 4).
  const forzado = clonar(plan);
  const k = forzado.days[i].meals.findIndex((m) => m && m.time === 'Comida');
  forzado.days[i].meals[k] = comidaCon(conGuarnicion(CONEJO, 'garbanzos_cocidos'));
  const meta = metaEngine2(forzado);
  const semana = (meta.platosSemana || []).filter((n) => n !== CONEJO.nombre).concat(CONEJO.nombre);
  forzado.days[0]._engine2 = { ...forzado.days[0]._engine2, platosSemana: semana };
  forzado.platosSemana = semana;

  it('sin alternativa de engine2, nunca va al motor viejo: se queda como está, con aviso y causa', () => {
    const soloSemana = new Set(forzado.days.flatMap((d) => d.meals.filter(Boolean).map((m) => m._dishId)).filter(Boolean));
    const n = regenerarComida(clonar(forzado), i, 'Comida', 'ligero', clonar(H74), 2174, { ...opts, catalogo: catalogoApp().filter((d) => soloSemana.has(d.id)) });
    expect(n).not.toBeNull();
    expect(n.alternativaSinCambio).toBe(true);
    expect(n.alternativaAviso).toBe(AVISO_GUARNICION_SIN_ALTERNATIVA);
    expect(n.days).toEqual(forzado.days);
    expect(n.decisionLog.at(-1).causa).toBe('alternativa_sin_candidato_guarnicion');
  });

  it('con alternativa, el plato nuevo ocupa el sitio del plato sin la guarnición en platosSemana', () => {
    const n = regenerarComida(clonar(forzado), i, 'Comida', 'diferente', clonar(H74), 2174, opts);
    const nueva = n.days[i].meals.find((m) => m.time === 'Comida');
    expect(nueva._dishId).not.toBe(CONEJO.id);
    expect(nueva._guarnicion).toBeUndefined();
    expect(n.platosSemana).not.toContain(CONEJO.nombre);
    expect(n.platosSemana).toContain(CATALOGO.find((d) => d.id === nueva._dishId).nombre);
  });
});
