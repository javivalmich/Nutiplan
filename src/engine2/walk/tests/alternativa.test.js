import { describe, it, expect } from 'vitest';
import { elegirAlternativa, DESEOS } from '../alternativa.js';
import { materializePlan } from '../../materializePlan.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { aplicarAjustesD099 } from '../../dishes/ajustesD099.js';
import { proteinaPrincipal, TOPE_PROTEINA_SEMANA, llevaBase } from '../../dishes/bases.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../skeleton/days.js';

const catalog = aplicarAjustesD099(loadCatalog());
const porId = new Map(catalog.map((d) => [d.id, d]));
const semanaDe = (plan) => plan.days.flatMap((d) => d.meals.filter((m) => !m.libre).map((m) => ({ day: d.day, momento: m.momento, dishId: m.dish.id })));
const plan = (seed, extra = {}) => materializePlan({ profile: { trainingDays: [] }, seed, strategy: 'mantenimiento_equilibrado', catalog: loadCatalog(), ...extra });
const esLegumbre = (d) => { try { const v = resolveDishComposition(d); return ['lentejas', 'garbanzos', 'alubias', 'alubias_negras'].includes((v.tupla && v.tupla.P) || v.claveP); } catch { return false; } };
const casos = [];
for (let s = 0; s < 12; s++) for (const [day, momento] of [['Martes', 'cena'], ['Jueves', 'comida']]) casos.push({ seed: 81000 + s, day, momento });

describe('elegirAlternativa — reglas del menú', () => {
  it('nunca repite un plato de la semana ni el que se quita, y respeta el momento', () => {
    for (const { seed, day, momento } of casos) {
      const semana = semanaDe(plan(seed));
      const actualId = semana.find((s) => s.day === day && s.momento === momento).dishId;
      for (const deseo of Object.keys(DESEOS)) {
        const { dish } = elegirAlternativa({ catalog, semana, day, momento, actualId, deseo, seed });
        const nombres = semana.map((s) => porId.get(s.dishId).nombre);
        expect(nombres).not.toContain(dish.nombre);
        expect(dish.momento).toContain(momento);
      }
    }
  });

  it('nada de legumbres a la cena', () => {
    for (const { seed } of casos) {
      const semana = semanaDe(plan(seed));
      const actualId = semana.find((s) => s.day === 'Martes' && s.momento === 'cena').dishId;
      for (const deseo of Object.keys(DESEOS)) expect(esLegumbre(elegirAlternativa({ catalog, semana, day: 'Martes', momento: 'cena', actualId, deseo, seed }).dish)).toBe(false);
    }
  });

  it('no repite los platos de la semana anterior', () => {
    const anterior = semanaDe(plan(1)).map((s) => s.dishId);
    const semana = semanaDe(plan(2, { platosRecientes: anterior }));
    const actualId = semana.find((s) => s.day === 'Jueves' && s.momento === 'comida').dishId;
    const nombresAnt = new Set(anterior.map((id) => porId.get(id).nombre));
    for (const deseo of Object.keys(DESEOS)) expect(nombresAnt.has(elegirAlternativa({ catalog, semana, day: 'Jueves', momento: 'comida', actualId, deseo, platosRecientes: anterior, seed: 2 }).dish.nombre)).toBe(false);
  });

  it('respeta el tope de proteína y la separación de días cuando hay candidatos', () => {
    for (const { seed, day, momento } of casos) {
      const semana = semanaDe(plan(seed));
      const actualId = semana.find((s) => s.day === day && s.momento === momento).dishId;
      const { dish, decisionLog } = elegirAlternativa({ catalog, semana, day, momento, actualId, seed });
      const otros = semana.filter((s) => !(s.day === day && s.momento === momento));
      const p = proteinaPrincipal(dish);
      if (!decisionLog.some((e) => e.causa === 'alternativa_tope_proteina_sin_aplicar')) {
        expect(otros.filter((s) => proteinaPrincipal(porId.get(s.dishId)) === p).length).toBeLessThan(TOPE_PROTEINA_SEMANA);
      }
      if (!decisionLog.some((e) => e.causa === 'alternativa_proteina_separada_sin_aplicar') && p) {
        const i = DAYS_ORDER.indexOf(day);
        expect(otros.some((s) => Math.abs(DAYS_ORDER.indexOf(s.day) - i) <= 1 && proteinaPrincipal(porId.get(s.dishId)) === p)).toBe(false);
      }
    }
  });

  it('veta lo que el perfil no puede comer (gluten)', () => {
    const semana = semanaDe(plan(5));
    const actualId = semana.find((s) => s.day === 'Jueves' && s.momento === 'comida').dishId;
    const { decisionLog } = elegirAlternativa({ catalog, semana, day: 'Jueves', momento: 'comida', actualId, intolerancias: ['gluten'], seed: 5 });
    expect(decisionLog[0].evidencia).toMatch(/vetados/);
  });
});

describe('elegirAlternativa — el deseo del usuario', () => {
  it('cumple el deseo o dice por qué lo relaja', () => {
    for (const { seed, day, momento } of casos) {
      const semana = semanaDe(plan(seed));
      const actual = porId.get(semana.find((s) => s.day === day && s.momento === momento).dishId);
      for (const [deseo, regla] of Object.entries(DESEOS)) {
        const { dish, decisionLog } = elegirAlternativa({ catalog, semana, day, momento, actualId: actual.id, deseo, seed });
        if (!decisionLog.some((e) => e.causa === 'alternativa_deseo_relajado')) expect(regla.cumple(dish, actual)).toBe(true);
      }
    }
  });

  it('si el plato era del ancla, se prefiere otro que lleve el mismo ingrediente', () => {
    const p = plan(81003, { cocinarEnCantidad: { activo: true, dia: 'Domingo' } });
    const anclaLog = p.decisionLog.find((e) => e.cause === 'eleccion_ancla_por_seed');
    const base = anclaLog.consequence.replace('ancla elegida: base:', '');
    const entrada = p.decisionLog.find((e) => e.causa === 'ancla_base_aprovechado');
    const semana = semanaDe(p);
    const actualId = semana.find((s) => s.day === entrada.day && s.momento === entrada.momento).dishId;
    const { dish, decisionLog } = elegirAlternativa({ catalog, semana, day: entrada.day, momento: entrada.momento, actualId, anclaBase: base, seed: 1 });
    if (decisionLog.some((e) => e.causa === 'alternativa_mantiene_ancla')) expect(llevaBase(dish, base)).toBe(true);
    else expect(decisionLog.some((e) => e.causa === 'alternativa_rompe_ancla')).toBe(true);
  });

  it('la alternativa no es el mismo plato con otra guarnición', () => {
    for (const { seed, day, momento } of casos) {
      const semana = semanaDe(plan(seed));
      const actual = porId.get(semana.find((s) => s.day === day && s.momento === momento).dishId);
      for (const deseo of Object.keys(DESEOS)) {
        const { dish, decisionLog } = elegirAlternativa({ catalog, semana, day, momento, actualId: actual.id, deseo, seed });
        const mismo = proteinaPrincipal(dish) === proteinaPrincipal(actual) && dish.plateType === actual.plateType;
        if (mismo) expect(decisionLog.some((e) => e.causa === 'alternativa_distinta')).toBe(false);
      }
    }
  });

  it('es determinista y cada paso deja causa', () => {
    const semana = semanaDe(plan(9));
    const actualId = semana.find((s) => s.day === 'Martes' && s.momento === 'cena').dishId;
    const a = elegirAlternativa({ catalog, semana, day: 'Martes', momento: 'cena', actualId, deseo: 'ligero', seed: 9 });
    const b = elegirAlternativa({ catalog, semana, day: 'Martes', momento: 'cena', actualId, deseo: 'ligero', seed: 9 });
    expect(b.dish.id).toBe(a.dish.id);
    expect(a.decisionLog.every((e) => e.causa && e.evidencia)).toBe(true);
  });
});
