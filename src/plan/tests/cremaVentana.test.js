// D-122: una crema de plantilla cuyo vegetal ya salió en la semana solo entra 2 o 3 días después, y una vez; con la
// ficha libre de crema no se repite. La pareja se escribe como «haz el doble y guarda la mitad» / «la crema guardada».
import { describe, it, expect } from 'vitest';
import { filtrarCremas, parejasDeCrema, vegetalDeCrema } from '../../engine2/walk/cremas.js';
import { generarPlan, platosRecientesPara, regenerarComida } from '../generarPlan.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { leerComida } from '../medidor/leerComida.js';
import { ajustarDia } from '../racionesApp.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { DAYS_ORDER } from '../../engine2/skeleton/days.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
import { PERFILES } from '../../../scripts/banco/perfiles.mjs';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const porId = new Map(CATALOGO.map((d) => [d.id, d]));
const plato = (nombre) => CATALOGO.find((d) => d.nombre === nombre);
const GAMBAS = plato('Crema de calabacín con gambas encima');
const HUEVOS = plato('Crema de calabacín con huevos encima');
const LIBRE = plato('Crema de calabacín con queso fresco y huevo');
const POLLO = CATALOGO.find((d) => d.id.startsWith('["caliente_clasico","pollo"'));
const clonar = (x) => JSON.parse(JSON.stringify(x));

const slotsCon = (puestos) => new Map(DAYS_ORDER.flatMap((day) => ['comida', 'cena'].map((momento) => {
  const p = puestos.find((x) => x.day === day && x.momento === momento);
  return [`${day}::${momento}`, { day, momento, abierto: !p, dishId: p ? p.id : null }];
})));
const nombrePorId = new Map(CATALOGO.map((d) => [d.id, d.nombre]));
const filtrar = (pool, day, momento, puestos) => {
  const decisionLog = [];
  return { pool: filtrarCremas({ pool, day, momento, slots: slotsCon(puestos), nombrePorId, decisionLog }), log: decisionLog };
};

describe('D-122: la regla de la ventana en el walk', () => {
  it('los platos de prueba existen', () => {
    for (const d of [GAMBAS, HUEVOS, LIBRE, POLLO]) expect(d).toBeTruthy();
    expect(vegetalDeCrema(GAMBAS.nombre)).toBe('calabacín');
    expect(vegetalDeCrema(LIBRE.nombre)).toBe('calabacín');
    expect(vegetalDeCrema(POLLO.nombre)).toBe(null);
  });

  it('una crema de plantilla con el mismo vegetal solo entra 2 o 3 días después', () => {
    const lunes = [{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }];
    for (const [day, entra] of [['Lunes', false], ['Martes', false], ['Miercoles', true], ['Jueves', true], ['Viernes', false], ['Domingo', false]]) {
      const { pool, log } = filtrar([HUEVOS, POLLO], day, 'cena', lunes);
      expect(pool.includes(HUEVOS), day).toBe(entra);
      expect(pool.includes(POLLO)).toBe(true);
      if (!entra) expect(log.map((e) => e.causa)).toEqual(['crema_repetida_fuera_de_ventana']);
    }
  });

  it('una sola vez: con dos cremas del mismo vegetal en la semana, la tercera no entra', () => {
    const { pool } = filtrar([GAMBAS, POLLO], 'Jueves', 'comida', [{ day: 'Lunes', momento: 'cena', id: HUEVOS.id }, { day: 'Miercoles', momento: 'cena', id: plato('Crema de calabacín con huevos encima').id }]);
    expect(pool).toEqual([POLLO]);
  });

  it('con la ficha libre no se repite, ni dentro de la ventana', () => {
    expect(filtrar([LIBRE, POLLO], 'Miercoles', 'cena', [{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }]).pool).toEqual([POLLO]);
    expect(filtrar([GAMBAS, POLLO], 'Jueves', 'comida', [{ day: 'Lunes', momento: 'cena', id: LIBRE.id }]).pool).toEqual([POLLO]);
  });

  it('si dejaría el hueco sin candidatos, no se aplica y lo dice el log', () => {
    const { pool, log } = filtrar([HUEVOS], 'Martes', 'cena', [{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }]);
    expect(pool).toEqual([HUEVOS]);
    expect(log.map((e) => e.causa)).toEqual(['crema_repetida_sin_aplicar']);
  });

  it('la pareja: la primera se cocina el doble, la segunda es la crema guardada (solo dentro de la ventana y entre plantillas)', () => {
    const slots = (puestos) => [...slotsCon(puestos).values()];
    expect(parejasDeCrema(slots([{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }, { day: 'Jueves', momento: 'cena', id: HUEVOS.id }]), nombrePorId))
      .toEqual([{ vegetal: 'calabacín', cocinar: { day: 'Lunes', momento: 'comida', dishId: GAMBAS.id }, aprovechar: { day: 'Jueves', momento: 'cena', dishId: HUEVOS.id } }]);
    expect(parejasDeCrema(slots([{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }, { day: 'Sabado', momento: 'cena', id: HUEVOS.id }]), nombrePorId)).toEqual([]);
    expect(parejasDeCrema(slots([{ day: 'Lunes', momento: 'comida', id: GAMBAS.id }, { day: 'Miercoles', momento: 'cena', id: LIBRE.id }]), nombrePorId)).toEqual([]);
  });
});

describe('D-122: el texto de los dos días y el medidor', () => {
  const kcal = 2174;
  const normal = componerPlato(GAMBAS, 'comida', kcal);
  const cocinar = componerPlato(GAMBAS, 'comida', kcal, { crema: { rol: 'cocinar', dia: 'jueves' } });
  const aprovechar = componerPlato(HUEVOS, 'cena', kcal, { crema: { rol: 'aprovechar', dia: 'lunes', tupla: tuplaDe(GAMBAS.id) } });
  const gCalabacin = (m) => leerComida(m).items.filter((i) => i.clave === 'calabacin').reduce((a, i) => a + i.gramos, 0);

  it('primer día: la compra con el doble de verdura y caldo, y el paso de guardar la mitad', () => {
    const g = gCalabacin(normal);
    expect(cocinar.shopping.find((s) => /^Calabacín/.test(s))).toMatch(new RegExp(`${2 * g} g, la mitad para el jueves\\)$`));
    expect(cocinar.shopping).toContain('Caldo de verduras (800 ml, la mitad para el jueves)');
    expect(cocinar.recipe).toContain('Haz el doble de crema y guarda la mitad en un táper para el jueves.');
  });

  it('segundo día: sin la crema en la compra, y «Calienta la crema de calabacín que hiciste el lunes»', () => {
    expect(aprovechar.shopping.some((s) => /calabac|zanahoria|caldo|cebolla/i.test(s))).toBe(false);
    expect(aprovechar.recipe).toContain('Calienta la crema de calabacín que hiciste el lunes.');
    expect(aprovechar.recipe.join(' ')).not.toMatch(/Pocha|Tritura|cuece tapado/);
    // La crema es la del lunes (solo calabacín), aunque la ficha de este plato lleve también zanahoria.
    expect(aprovechar.p1).toMatch(/^Crema de calabacín \(\d+ g\)/);
  });

  it('el medidor lee las dos compras: el primer día, la mitad que se come; el segundo, la crema guardada', () => {
    const g = gCalabacin(normal);
    expect(gCalabacin(cocinar)).toBe(g);
    expect(gCalabacin(aprovechar)).toBe(g);
    expect(leerComida(aprovechar).items.some((i) => i.clave === 'zanahoria')).toBe(false);
  });

  it('las raciones vuelven a escribir los dos días con el mismo texto de la pareja', () => {
    const comida = { ...cocinar, time: 'Comida', title: GAMBAS.nombre, _motor: 'engine2', _dishId: GAMBAS.id };
    const cena = { ...aprovechar, time: 'Cena', title: HUEVOS.nombre, _motor: 'engine2', _dishId: HUEVOS.id };
    const H74 = PERFILES.find((x) => x.id === 'omni-2174').perfil;
    const [a] = ajustarDia({ name: 'Lunes', meals: [comida] }, H74, kcal).day.meals;
    const [b] = ajustarDia({ name: 'Jueves', meals: [cena] }, H74, kcal).day.meals;
    expect(a.recipe).toContain('Haz el doble de crema y guarda la mitad en un táper para el jueves.');
    expect(a.shopping.find((s) => /^Calabacín/.test(s))).toMatch(new RegExp(`${2 * gCalabacin(a)} g, la mitad para el jueves\\)$`));
    expect(b.recipe).toContain('Calienta la crema de calabacín que hiciste el lunes.');
    expect(gCalabacin(b)).toBe(gCalabacin(a));
  });
});

describe('D-122: en semanas reales', { timeout: 300000 }, () => {
  const semanas = [];
  for (const id of ['omni-1434', 'omni-2174', 'celiaco-2400']) {
    const p = PERFILES.find((x) => x.id === id);
    let ant = null;
    for (let w = 60; w < 100; w++) {
      const plan = generarPlan(clonar(p.perfil), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-${id}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
      semanas.push({ id, w, p, plan });
      ant = plan;
    }
  }
  const cremas = (plan) => plan.days.flatMap((d, i) => d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena') && !m.sugerencia && m._dishId && vegetalDeCrema((porId.get(m._dishId) || {}).nombre)).map((m) => ({ i, m, v: vegetalDeCrema(porId.get(m._dishId).nombre) })));

  it('dos cremas del mismo vegetal solo a 2 o 3 días, entre plantillas, y escritas como pareja', () => {
    let parejas = 0;
    for (const { plan } of semanas) {
      const cs = cremas(plan);
      for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) {
        if (cs[a].v !== cs[b].v) continue;
        if ((plan.decisionLog || []).some((e) => e.causa === 'crema_repetida_sin_aplicar')) continue;
        parejas++;
        expect([2, 3]).toContain(cs[b].i - cs[a].i);
        expect(cs[a].m._dishId.startsWith('[') && cs[b].m._dishId.startsWith('[')).toBe(true);
        expect(cs[a].m.recipe.some((x) => /^Haz el doble de crema y guarda la mitad en un táper para el /.test(x))).toBe(true);
        expect(cs[b].m.recipe.some((x) => /^Calienta la crema de .* que hiciste el /.test(x))).toBe(true);
      }
    }
    expect(parejas).toBeGreaterThan(0);
  });

  it('cambiar una comida de la pareja deja la otra como una crema normal', () => {
    const caso = semanas.find(({ plan }) => plan.days.some((d) => d.meals.some((m) => m && m._crema)));
    expect(caso).toBeTruthy();
    const { plan, p, w, id } = caso;
    const i = plan.days.findIndex((d) => d.meals.some((m) => m && m._crema && m._crema.rol === 'cocinar'));
    const m = plan.days[i].meals.find((x) => x && x._crema && x._crema.rol === 'cocinar');
    const n = regenerarComida(clonar(plan), i, m.time, 'diferente', clonar(p.perfil), p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-${id}`, saveMealMemory: () => {} });
    const resto = n.days.flatMap((d) => d.meals.filter(Boolean));
    expect(resto.some((x) => x._crema)).toBe(false);
    expect(resto.some((x) => (x.recipe || []).some((r) => /que hiciste el /.test(r)))).toBe(false);
  });
});
