import { describe, it, expect } from 'vitest';
import { generarPlanEngine2 } from '../engine2App.js';
import { generarPlan, platosRecientesPara, motorPara } from '../generarPlan.js';
import { catalogoApp } from '../catalogo.js';
import { buildPlan } from '../../engine/buildPlan.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const PERFIL = {
  weight: 74, goal: 'maintain', activity: 'moderate', intolerances: [], eliminatedFoods: [],
  trainingDays: ['Lunes', 'Miércoles', 'Viernes'], extras: {}, mealsPerDay: 3, tiempoCocina: 'normal',
  experiencia: 'intermedio', simpleMode: false, dob: '1990-01-01', gender: 'male', height: 178,
};
const OPTS = { month: 5, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: 41, userId: 'u-test' };
const perfil = (extra = {}) => ({ ...JSON.parse(JSON.stringify(PERFIL)), ...extra });
const plan = (extra = {}, opts = {}) => generarPlanEngine2(perfil(extra), 2000, { ...OPTS, catalogo: catalogoApp(), ...opts });
const comidasYCenas = (p) => p.days.flatMap((d) => d.meals.filter((m) => m && (m.time === 'Comida' || m.time === 'Cena')));
const sinIds = (p) => JSON.stringify(p.days.map((d) => ({ ...d, id: undefined })));

describe('generarPlanEngine2 — plan completo para la app', () => {
  it('7 días con desayuno, comida y cena completos (cantidades, receta, compra)', () => {
    const p = plan();
    expect(p.motor).toBe('engine2');
    expect(p.days).toHaveLength(7);
    for (const d of p.days) {
      expect(d.meals.map((m) => m.time)).toEqual(['Desayuno', 'Comida', 'Cena']);
      for (const m of d.meals) {
        expect(typeof m.title).toBe('string');
        expect(typeof m.p1).toBe('string');
        expect(Array.isArray(m.shopping)).toBe(true);
        expect(Array.isArray(m.recipe)).toBe(true);
      }
    }
  });

  it('la comida y la cena llevan el nombre que eligió engine2 y su ficha para recomponer', () => {
    const p = plan();
    for (const m of comidasYCenas(p)) {
      if (m._spec && m._spec.isFree) continue;
      expect(m._motor).toBe('engine2');
      expect(m._dishId).toBeTruthy();
      expect(m._spec).toBeTruthy();
    }
  });

  it('el sábado a mediodía es comida libre con una sugerencia por si se quiere cocinar', () => {
    const sab = plan().days[5];
    const comida = sab.meals.find((m) => m.time === 'Comida');
    expect(comida._spec.isFree).toBe(true);
    expect(comida.p2).toMatch(/^Si prefieres cocinar: /);
    expect(comida.sugerencia.title).toBeTruthy();
  });

  it('determinista: misma entrada, mismo plan (salvo day.id)', () => {
    expect(sinIds(plan())).toBe(sinIds(plan()));
  });

  it('ningún plato se repite en la semana ni respecto de la semana anterior', () => {
    const s1 = plan();
    expect(new Set(s1.platosSemana).size).toBe(s1.platosSemana.length);
    const s2 = plan({}, { weekNumber: 42, platosRecientes: s1.platosSemana });
    expect(s2.platosSemana.filter((n) => s1.platosSemana.includes(n))).toEqual([]);
  });

  it('con 2 comidas al día no hay cena y la comida es la principal', () => {
    const p = plan({ mealsPerDay: 2 });
    for (const d of p.days) expect(d.meals.some((m) => m && m.time === 'Cena')).toBe(false);
    expect(p.days[0].meals.find((m) => m.time === 'Comida').title).toMatch(/\(comida principal\)$/);
  });

  it('con 4 y 5 comidas al día mantiene almuerzo y merienda del motor viejo', () => {
    expect(plan({ mealsPerDay: 4 }).days[0].meals).toHaveLength(4);
    expect(plan({ mealsPerDay: 5 }).days[0].meals).toHaveLength(5);
  });

  it('cocinar en cantidad: el día de cocinar y el de aprovechar llevan nota', () => {
    const p = plan({ cocinarEnCantidad: { activo: true, dia: 'Martes' } });
    const notas = comidasYCenas(p).map((m) => m.slotNote).filter(Boolean);
    expect(notas.some((n) => n.startsWith('🥘'))).toBe(true);
    expect(notas.some((n) => n.startsWith('♻️'))).toBe(true);
  });

  it('sin respuesta a cocinar en cantidad no hay ancla', () => {
    expect(comidasYCenas(plan()).some((m) => m.slotNote && /^(🥘|♻️)/.test(m.slotNote))).toBe(false);
  });
});

describe('generarPlanEngine2 — intolerancias y alimentos eliminados', () => {
  const PROHIBIDO = {
    pescado: /salm[oó]n|merluza|bacalao|dorada|sardina|at[uú]n|bonito|pescado|corvina/i,
    mariscos: /gamba|calamar|marisco|mejill[oó]n|berberecho/i,
    cerdo: /cerdo|lomo|jam[oó]n|bacon|chorizo/i,
    huevo: /huevo|tortilla|revuelto/i,
    legumbres: /lenteja|garbanzo|alubia|hummus|falafel/i,
    frutos_secos: /nuez|nueces|almendra|pistacho|cacahuete|anacardo|avellana/i,
  };
  for (const [intol, re] of Object.entries(PROHIBIDO)) {
    it(`${intol}: ninguna comida ni cena lo lleva (5 semanas)`, () => {
      for (let w = 40; w < 45; w++) {
        const p = plan({ intolerances: [intol] }, { weekNumber: w });
        expect(p.motor).toBe('engine2');
        for (const m of comidasYCenas(p)) {
          if (m._spec && m._spec.isFree) continue;
          const texto = [m.title, m.p1, m.p2, ...(m.shopping || [])].join(' ');
          expect(texto, `${intol} en «${m.title}»`).not.toMatch(re);
        }
      }
    });
  }

  it('gluten y lactosa los veta engine2 sin fallar', () => {
    for (const intol of ['gluten', 'lactosa']) {
      const p = generarPlan(perfil({ intolerances: [intol] }), 2000, OPTS);
      expect(p.days).toHaveLength(7);
    }
  });

  it('alimento eliminado («pollo»): ninguna comida ni cena lo lleva', () => {
    const p = plan({ eliminatedFoods: ['pollo'] });
    for (const m of comidasYCenas(p)) {
      if (m._spec && m._spec.isFree) continue;
      expect([m.title, m.p1, ...(m.shopping || [])].join(' ')).not.toMatch(/pollo/i);
    }
  });
});

describe('generarPlan — selector de motor y red de seguridad', () => {
  it('por defecto usa engine2', () => {
    expect(motorPara(perfil())).toBe('engine2');
    expect(generarPlan(perfil(), 2000, OPTS).motor).toBe('engine2');
  });

  it('profile.motorPlan = "legacy" usa el motor viejo', () => {
    expect(generarPlan(perfil({ motorPlan: 'legacy' }), 2000, OPTS).motor).toBe('legacy');
  });

  it('si engine2 falla, devuelve el plan del motor viejo y lo dice', () => {
    const p = generarPlan(perfil(), 2000, { ...OPTS, catalogo: [] });
    expect(p.motor).toBe('legacy');
    expect(p.motorFallo).toBeTruthy();
    expect(p.days).toHaveLength(7);
  });

  it('las regeneraciones parciales van al motor viejo y respetan los platos de engine2', () => {
    const p = generarPlan(perfil(), 2000, OPTS);
    const dia = p.days[1];
    const prof = perfil({ _regenContext: { dayPortionsRegen: { dayIdx: 1, meals: dia.meals, shakeEnabledOverride: false } } });
    const rehecho = generarPlan(prof, 2000, OPTS).days[1];
    const titulos = (d) => d.meals.map((m) => m.title);
    expect(titulos(rehecho)).toEqual(titulos(dia));
  });

  it('platosRecientesPara: otra semana → sus platos; misma semana → la anterior que ya usó', () => {
    const p = generarPlan(perfil(), 2000, { ...OPTS, platosRecientes: ['X'] });
    // D-110: también los desayunos y tentempiés de la semana, para que cambien.
    expect(platosRecientesPara(p, 41, 42)).toEqual([...p.platosSemana, ...p.desayunosSemana]);
    expect(p.desayunosSemana.length).toBeGreaterThanOrEqual(2);
    expect(platosRecientesPara(p, 42, 42)).toEqual(['X']);
    const viejo = buildPlan(perfil(), 2000, OPTS);
    expect(platosRecientesPara(viejo, 40, 41).length).toBeGreaterThan(10);
    expect(platosRecientesPara(null, 1, 2)).toEqual([]);
  });
});
