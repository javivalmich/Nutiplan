// Textos propios de engine2 (D-108): platos compuestos escritos por engine2,
// verdura con rango propio y en medidas de casa, recetas del ancla, nombres
// concordados y arreglos de los desayunos del motor viejo.
import { describe, it, expect } from 'vitest';
import { generarPlan } from '../generarPlan.js';
import { componerPlato, tuplaDe } from '../textos/componer.js';
import { gramosVerdura, VERDURAS, concuerda } from '../textos/compuestos.js';
import { limpiarTexto } from '../textos/legacy.js';
import { leerComida, reconocer } from '../medidor/leerComida.js';
import { catalogoApp } from '../catalogo.js';
import { nombreVisible } from '../../engine2/dishes/alinosD105.js';
import { concordarNombre } from '../../engine2/dishes/concordanciaD108.js';
import { INGREDIENTES } from '../../engine2/nutrientes/ingredientes.js';
import { FREEFORM_POOL } from '../../data/freeformPool.js';

const P = { intolerances: [], eliminatedFoods: [], tiempoCocina: 'normal', experiencia: 'intermedio', simpleMode: false, hambre: 'media', kcalAdjust: 0, extras: {}, gender: 'female', age: 34, weight: 62, height: 165, activity: 'moderate', goal: 'maintain', mealsPerDay: 4, trainingDays: ['Martes'] };
const O = (w, u = 'textos') => ({ month: 9, pastProteins: {}, freeFormPool: FREEFORM_POOL, weekNumber: w, userId: u, saveMealMemory: () => {}, platosRecientes: [] });
const texto = (m) => [m.title, m.p1, m.p2, ...(m.shopping || []), ...((m.recipe || []).filter((x) => typeof x === 'string'))].join(' · ');
const DEFECTOS = /\d+\s*g g\b|(^|·)\s*·|\s{2,}|undefined|null|NaN|\bel (patata|quinoa|pasta)\b|(Ternera|Pechuga de (pollo|pavo)|Merluza|Dorada)( magra| fresco)? \(\d+ g\) (salteado|guisado|asado|revuelto)\b/;
const compuestos = catalogoApp().filter((d) => tuplaDe(d.id));

describe('platos compuestos escritos por engine2', () => {
  it('los 178 se escriben sin defectos, con su nombre visible y todo lo que se compra con cantidad se puede medir', () => {
    expect(compuestos.length).toBe(178);
    for (const d of compuestos) {
      for (const momento of d.momento) {
        const m = componerPlato({ ...d, nombre: nombreVisible(d.nombre) }, momento, 2000);
        expect(texto(m), d.id).not.toMatch(DEFECTOS);
        expect(m.title).toBe(nombreVisible(d.nombre));
        expect(m.recipe.length, d.id).toBeGreaterThanOrEqual(2);
        expect(leerComida(m).sinCantidad, d.id).toEqual([]);
        for (const s of m.shopping) {
          if (!/\d\s*(g|ml|ud)\b/.test(s)) continue;
          const clave = reconocer(s.replace(/\s*\(.*$/, ''));
          expect(clave === 'condimento' ? s : 'ok', d.id).toMatch(/^ok$|piment[oó]n|curry|mostaza|ajo|miel|soja/i);
        }
      }
    }
  });

  it('la verdura tiene su rango, se ajusta a la persona y se dice en medidas de casa', () => {
    for (const v of Object.keys(VERDURAS)) {
      const [min, max] = VERDURAS[v].rango;
      const poca = gramosVerdura(v, 1400);
      const mucha = gramosVerdura(v, 3700);
      expect(poca).toBeGreaterThanOrEqual(min);
      expect(mucha).toBeLessThanOrEqual(max);
      expect(poca).toBeLessThanOrEqual(mucha);
    }
    expect(gramosVerdura('calabacin', 2200)).toBeLessThan(VERDURAS.calabacin.rango[1]);
    const m = componerPlato(compuestos.find((d) => JSON.parse(d.id)[3] === 'calabacin'), 'comida', 2000);
    expect(m.shopping.join(' | ')).toMatch(/Calabacín \(1 (pequeño|mediano|grande)|½, \d+ g\)/);
  });

  it('concuerda la verdura con lo que se nombra', () => {
    expect(concuerda('asado', 'f', 'p')).toBe('asadas');
    const textos = compuestos.map((d) => texto(componerPlato(d, d.momento[0], 2000))).join(' ');
    expect(textos).not.toMatch(/1 pimiento (mediano |pequeño |grande )?asados|puñados de espinacas salteados|champiñones salteado\b/);
  });
});

describe('en el plan', { timeout: 300000 }, () => {
  it('las cantidades del texto son las de la compra y la semana sale igual con la misma semilla', () => {
    const a = generarPlan(P, 2000, O(42));
    const b = generarPlan(P, 2000, O(42));
    expect(JSON.stringify(a.days.map((d) => d.meals))).toBe(JSON.stringify(b.days.map((d) => d.meals)));
    let n = 0;
    for (const d of a.days) for (const m of d.meals) {
      if (!m || !m._componer) continue;
      for (const s of m.shopping.slice(0, 2)) {
        const g = (s.match(/^[^(]+\((\d+) (g|ud)[,)]/) || [])[1];
        if (!g) continue;
        n += 1;
        expect(`${m.p1} ${m.p2}`, m.title).toMatch(new RegExp(`\\b${g} (g|huevos?)`));
      }
    }
    expect(n).toBeGreaterThan(10);
  });

  it('cocinar de una vez y aprovechar: cuánto hacer y nada de cocinar en crudo lo ya cocinado', () => {
    for (const dia of ['Miercoles', 'Domingo']) {
      for (const w of [41, 42, 43]) {
        const plan = generarPlan({ ...P, cocinarEnCantidad: { activo: true, dia } }, 2000, O(w));
        const conAncla = plan.days.flatMap((d) => d.meals.filter((m) => m && m._ancla));
        expect(conAncla.length, `${dia} ${w}`).toBeGreaterThan(0);
        for (const m of conAncla) {
          const r = m.recipe.join(' / ');
          if (m._ancla.rol === 'aprovechar') {
            expect(r, m.title).toMatch(/Usa (el|la|los|las) .+ que (cocinaste|cociste) /);
            if (m._componer) expect(m.shopping.join(' | '), m.title).toMatch(/, del /);
          } else {
            const g = m._ancla.guardar || [];
            expect(g.length, m.title).toBeGreaterThan(0);
            const total = Number((r.match(/de una vez (\d+)/) || [])[1]);
            const hoy = Number((r.match(/: (\d+) (g|ud) para hoy/) || [])[1]);
            expect(total).toBe(hoy + g.reduce((a, x) => a + x.gramos, 0));
          }
        }
        if (dia === 'Domingo') expect(conAncla.every((m) => m._ancla.rol === 'aprovechar')).toBe(true);
      }
    }
  });

  it('desayunos y tentempiés sin cantidades dobles ni acompañamientos repetidos', () => {
    const familia = (c) => (c.startsWith('pan_') ? 'pan' : INGREDIENTES[c] ? INGREDIENTES[c].grupo : c);
    for (const w of [41, 42, 43, 44]) {
      const plan = generarPlan({ ...P, mealsPerDay: 5 }, 2000, O(w, 'desayunos'));
      for (const d of plan.days) for (const m of d.meals) {
        if (!m || m.time === 'Comida' || m.time === 'Cena') continue;
        for (const t of [m.p1, m.p2]) expect(t, m.title).not.toMatch(/\b\d+\s*(g|ml) [a-záéíóúñ][^·()]{1,40}? \(\d+\s*(g|ml)\)/i);
        if (m.acompanamientos && m._base) {
          const antes = new Set(leerComida(m._base).items.map((i) => familia(i.clave)));
          for (const a of m.acompanamientos) expect(antes.has(familia(a)), `${m.title}: ${a}`).toBe(false);
        }
      }
    }
    expect(limpiarTexto('200g yogur griego 0% (125g) · canela')).toBe('200 g yogur griego 0% · canela');
  });
});

describe('nombres', () => {
  it('el participio concierta con la proteína', () => {
    expect(concordarNombre('Ternera magra salteado con champiñones y arroz blanco')).toBe('Ternera magra salteada con champiñones y arroz blanco');
    expect(concordarNombre('Garbanzos estofadas con alcachofas')).toBe('Garbanzos estofados con alcachofas');
    expect(concordarNombre('Huevos revuelto con espinacas')).toBe('Huevos revueltos con espinacas');
    expect(concordarNombre('Garbanzos con pimientos guisado')).toBe('Garbanzos guisados con pimientos');
    expect(concordarNombre('Lomo de cerdo guisado con alcachofas')).toBe('Lomo de cerdo guisado con alcachofas');
    for (const d of catalogoApp()) expect(nombreVisible(nombreVisible(d.nombre))).toBe(nombreVisible(d.nombre));
  });
});
