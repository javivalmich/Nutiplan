// Pasos 4, 5 y 7 de la legumbre como guarnición (D-119, D-024, D-099.3 y el hidrato en días seguidos): las reglas de
// la semana, una por test, sobre semanas reales de la app.
import { describe, it, expect } from 'vitest';
import { generarPlan, platosRecientesPara, regenerarComida, AVISO_GUARNICION_SIN_ALTERNATIVA } from '../generarPlan.js';
import { legumbresGuarnicionDelPerfil, metaEngine2 } from '../engine2App.js';
import { tuplaDe } from '../textos/componer.js';
import { leerComida } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';
import { aplicarAjustesD099 } from '../../engine2/dishes/ajustesD099.js';
import { aplicarNombresD105 } from '../../engine2/dishes/alinosD105.js';
import { familiaProteica, esCompuestoLegumbre, proteinaPrincipal } from '../../engine2/dishes/bases.js';
import { legumbresGuarnicion } from '../../engine2/dishes/guarnicionLegumbre.js';
import { DAYS_ORDER } from '../../engine2/skeleton/days.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';
import { PERFILES } from '../../../scripts/banco/perfiles.mjs';

const CATALOGO = aplicarNombresD105(aplicarAjustesD099(catalogoApp()));
const porId = new Map(CATALOGO.map((d) => [d.id, d]));
const clonar = (x) => JSON.parse(JSON.stringify(x));
const perfil = (id) => PERFILES.find((x) => x.id === id);

function semanas(id, n, cambio = {}) {
  const p = perfil(id);
  const out = [];
  let ant = null;
  for (let w = 60; w < 60 + n; w++) {
    const plan = generarPlan({ ...clonar(p.perfil), ...cambio }, p.kcal, { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: `banco-${id}`, saveMealMemory: () => {}, platosRecientes: platosRecientesPara(ant, w - 1, w) });
    out.push(plan);
    ant = plan;
  }
  return out;
}
const causas = (plan) => (plan.decisionLog || []).map((e) => e.causa);
const tiene = (plan, c) => causas(plan).includes(c);
const comidaDe = (d) => d.meals.find((m) => m && m.time === 'Comida' && !m.sugerencia);
const cenaDe = (d) => d.meals.find((m) => m && m.time === 'Cena');
const servidas = (d) => [comidaDe(d), cenaDe(d)].filter((m) => m && m._dishId);
const guarniciones = (plan) => plan.days.map((d, i) => ({ i, m: comidaDe(d) })).filter((x) => x.m && x.m._guarnicion);
const esPlatoLegumbre = (m) => porId.has(m._dishId) && familiaProteica(porId.get(m._dishId)) === 'legumbre';
const legumbresSemana = (plan) => guarniciones(plan).length + plan.days.flatMap(servidas).filter(esPlatoLegumbre).length;
const hidratoDe = (m) => (m._guarnicion ? 'legumbre' : (tuplaDe(m._dishId) || {}).C || null);

const OMNI = semanas('omni-2174', 16);
const SIN_PESCADO = semanas('sin-pescado-2000', 12);
const VEGETARIANA = semanas('vegetariana-2000', 8);
// SIBO: sin ninguna legumbre de guarnición posible, pero con platos de plantilla con hidrato.
const SIBO = semanas('sibo-2000', 8);
const TODAS = [...OMNI, ...SIN_PESCADO];

describe('paso 4: hidrato o legumbre, en dos pasos', { timeout: 300000 }, () => {
  it('hay comidas con guarnición y comidas que se quedan con el hidrato original, cada una con su causa', () => {
    expect(OMNI.reduce((a, p) => a + guarniciones(p).length, 0)).toBeGreaterThan(10);
    expect(OMNI.some((p) => tiene(p, 'guarnicion_hidrato_original'))).toBe(true);
    for (const p of OMNI) expect(guarniciones(p).length).toBe(causas(p).filter((c) => c === 'guarnicion_legumbre_elegida').length);
  });

  it('el primer paso y el segundo son desempates con la semilla, y lo dice la evidencia', () => {
    const e = OMNI.flatMap((p) => p.decisionLog).find((x) => x.causa === 'guarnicion_legumbre_elegida');
    expect(e.evidencia).toMatch(/RNG «::guarnicion» -> «legumbre»; después índice \d+ de \d+ .*desempate/);
    const h = OMNI.flatMap((p) => p.decisionLog).find((x) => x.causa === 'guarnicion_hidrato_original');
    expect(h.evidencia).toMatch(/desempate entre dos opciones igual de válidas/);
  });

  it('la legumbre es de la lista del plato y el plato es de plantilla con hueco de hidrato', () => {
    for (const p of TODAS) {
      for (const { m } of guarniciones(p)) {
        expect(legumbresGuarnicion(m._dishId), m._dishId).toContain(m._guarnicion.clave);
        expect(m.title).toContain(m._guarnicion.legumbre);
        expect(leerComida(m).items.some((it) => it.clave === m._guarnicion.clave)).toBe(true);
      }
    }
  });

  it('misma semilla, mismo plan', () => {
    const [a] = semanas('omni-2174', 1);
    const sinId = (p) => JSON.stringify(p.days.map(({ id, ...d }) => d)); // eslint-disable-line no-unused-vars
    expect(sinId(a)).toBe(sinId(OMNI[0]));
  });

  it('la lista se filtra por intolerancias y alimentos eliminados (los del paso 1)', () => {
    const todas = legumbresGuarnicionDelPerfil({}).validas;
    expect(todas).toHaveLength(10);
    expect(legumbresGuarnicionDelPerfil({ intolerances: ['legumbres'] }).validas).toEqual([]);
    expect(legumbresGuarnicionDelPerfil({ intolerances: ['sibo'] }).validas).toEqual([]);
    expect(legumbresGuarnicionDelPerfil({ intolerances: ['soja'] }).validas).not.toContain('edamame');
    const frijoles = legumbresGuarnicionDelPerfil({ eliminatedFoods: ['frijoles'] }).validas;
    expect(frijoles.some((c) => c.startsWith('alubias_'))).toBe(false);
    expect(frijoles).toContain('garbanzos_cocidos');
    expect(legumbresGuarnicionDelPerfil({ eliminatedFoods: ['habas'] }).validas).not.toContain('habitas');
    const sinGarbanzos = semanas('omni-2174', 6, { eliminatedFoods: ['garbanzos'] });
    expect(sinGarbanzos.flatMap(guarniciones).some(({ m }) => m._guarnicion.clave === 'garbanzos_cocidos')).toBe(false);
  });

  it('solo en dietas omnívoras: la vegetariana no lleva guarnición ni la (b)', () => {
    for (const p of VEGETARIANA) {
      expect(guarniciones(p)).toEqual([]);
      expect(tiene(p, 'legumbre_compuesta_fuera_hay_otro')).toBe(false);
    }
  });

  it('(b) en omnívoras: un compuesto de legumbre solo es plato si el hueco no tenía otro candidato', () => {
    let vistos = 0;
    for (const p of TODAS) {
      const compuestos = p.days.flatMap(servidas).filter((m) => porId.has(m._dishId) && esCompuestoLegumbre(porId.get(m._dishId)));
      vistos += causas(p).filter((c) => c === 'legumbre_compuesta_fuera_hay_otro').length;
      if (compuestos.length) expect(tiene(p, 'legumbre_compuesta_sin_otro_candidato') || tiene(p, 'guarnicion_red_d099_sin_b')).toBe(true);
    }
    expect(vistos).toBeGreaterThan(0);
  });
});

describe('paso 5: reglas de la semana', { timeout: 300000 }, () => {
  it('suelo de 2 por la guarnición, solo desde el jueves, y la comida lleva legumbre sin el primer paso', () => {
    let vistos = 0;
    for (const p of TODAS) {
      for (const e of p.decisionLog.filter((x) => x.causa === 'guarnicion_suelo_semana')) {
        vistos++;
        const i = DAYS_ORDER.indexOf(e.day);
        expect(i).toBeGreaterThanOrEqual(3);
        const sigue = p.decisionLog.find((x) => x.day === e.day && x.plato === e.plato && ['guarnicion_legumbre_elegida', 'guarnicion_suelo_sin_legumbre_valida'].includes(x.causa));
        expect(sigue, e.day).toBeTruthy();
      }
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it('tope de 3 legumbres por semana, guarniciones y platos de legumbre juntos', () => {
    for (const p of TODAS) if (!tiene(p, 'legumbre_tope_semana_sin_aplicar')) expect(legumbresSemana(p)).toBeLessThanOrEqual(3);
  });

  it('guisantes y habitas, juntos, como mucho 1 vez por semana', () => {
    for (const p of TODAS) expect(guarniciones(p).filter(({ m }) => ['guisantes', 'habitas'].includes(m._guarnicion.clave)).length).toBeLessThanOrEqual(1);
  });

  it('sin legumbre de guarnición en la cena, y la causa lo dice', () => {
    for (const p of TODAS) for (const d of p.days) expect(cenaDe(d) && cenaDe(d)._guarnicion).toBeFalsy();
    expect(TODAS.some((p) => tiene(p, 'guarnicion_legumbre_cena'))).toBe(true);
  });

  it('sin guarnición en días seguidos (salvo el suelo sin otra comida, con su causa)', () => {
    for (const p of TODAS) {
      const dias = guarniciones(p).map((x) => x.i);
      const seguidos = dias.filter((i, k) => k > 0 && i - dias[k - 1] === 1).length;
      if (!tiene(p, 'guarnicion_dias_seguidos_sin_aplicar')) expect(seguidos).toBe(0);
    }
    expect(TODAS.some((p) => tiene(p, 'guarnicion_dias_seguidos_evitada'))).toBe(true);
  });

  it('sin el mismo hidrato en días seguidos, en todos los perfiles, con guarnición o sin ella (salvo con su causa)', () => {
    // La vegetariana no tiene platos de plantilla con hueco de hidrato: la regla no tiene nada que mirar.
    for (const p of [...TODAS, ...VEGETARIANA, ...SIBO]) {
      for (let i = 0; i + 1 < p.days.length; i++) {
        const hoy = new Set(servidas(p.days[i]).map(hidratoDe).filter(Boolean));
        const comun = servidas(p.days[i + 1]).map(hidratoDe).filter((h) => h && hoy.has(h));
        if (comun.length) {
          const sinAplicar = p.decisionLog.some((e) => e.causa === 'hidrato_dias_seguidos_sin_aplicar' && [DAYS_ORDER[i], DAYS_ORDER[i + 1]].includes(e.day));
          expect(sinAplicar, `${DAYS_ORDER[i]}: ${comun}`).toBe(true);
        }
      }
    }
    expect(SIBO.every((p) => guarniciones(p).length === 0)).toBe(true);
    expect(SIBO.some((p) => tiene(p, 'hidrato_dias_seguidos_evitado'))).toBe(true);
  });

  it('no repetir legumbre en la semana (ni la de un plato de legumbre), salvo con su causa', () => {
    const LEG_ESPECIE = { garbanzos: ['garbanzos_cocidos'], lentejas: ['lentejas_pardinas_cocidas', 'lentejas_beluga_cocidas'], alubias: ['alubias_blancas_cocidas'], alubias_negras: ['alubias_negras_cocidas'] };
    for (const p of TODAS) {
      if (tiene(p, 'guarnicion_legumbre_no_repetida_sin_aplicar')) continue;
      const g = guarniciones(p).map(({ m }) => m._guarnicion.clave);
      expect(new Set(g).size).toBe(g.length);
      const deplatos = p.days.flatMap(servidas).filter(esPlatoLegumbre).flatMap((m) => LEG_ESPECIE[proteinaPrincipal(porId.get(m._dishId))] || []);
      // Una legumbre servida de plato antes de la guarnición no se repite de guarnición.
      for (const { i, m } of guarniciones(p)) {
        const antes = p.days.slice(0, i).flatMap(servidas).filter(esPlatoLegumbre).flatMap((x) => LEG_ESPECIE[proteinaPrincipal(porId.get(x._dishId))] || []);
        expect(antes).not.toContain(m._guarnicion.clave);
      }
      void deplatos;
    }
  });

  it('la guarnición cuenta como legumbre para D-024: la semana con guarnición no pide además un plato de legumbre', () => {
    const conGuarnicion = OMNI.filter((p) => guarniciones(p).length >= 2);
    expect(conGuarnicion.length).toBeGreaterThan(0);
    for (const p of conGuarnicion) expect(p.days.flatMap(servidas).filter(esPlatoLegumbre).length).toBeLessThanOrEqual(1);
  });
});

describe('platos de la semana y alternativas de una comida con guarnición', { timeout: 300000 }, () => {
  it('platosSemana guarda el plato sin la guarnición (D-099.3 compara el plato)', () => {
    for (const p of OMNI) {
      for (const { m } of guarniciones(p)) {
        expect(metaEngine2(p).platosSemana).toContain(m._guarnicion.nombreOriginal);
        expect(metaEngine2(p).platosSemana).not.toContain(m.title);
      }
    }
  });

  it('cambiar una comida con guarnición nunca va al motor viejo', () => {
    const plan = OMNI.find((p) => guarniciones(p).length);
    const [{ i, m }] = guarniciones(plan);
    const deLaSemana = new Set(plan.days.flatMap((d) => d.meals.filter(Boolean).map((x) => x._dishId)).filter(Boolean));
    const p = perfil('omni-2174');
    const opts = { month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 60 + OMNI.indexOf(plan), userId: 'banco-omni-2174', saveMealMemory: () => {} };
    const sin = regenerarComida(clonar(plan), i, 'Comida', 'ligero', clonar(p.perfil), p.kcal, { ...opts, catalogo: catalogoApp().filter((d) => deLaSemana.has(d.id)) });
    expect(sin.alternativaSinCambio).toBe(true);
    expect(sin.alternativaAviso).toBe(AVISO_GUARNICION_SIN_ALTERNATIVA);
    const con = regenerarComida(clonar(plan), i, 'Comida', 'diferente', clonar(p.perfil), p.kcal, opts);
    expect(con.days[i].meals.find((x) => x.time === 'Comida')._dishId).not.toBe(m._dishId);
    expect(con.platosSemana).not.toContain(m._guarnicion.nombreOriginal);
  });
});
