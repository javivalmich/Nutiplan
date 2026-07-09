// runWalk - Fase 4, Componente P2b-ii (paso 4 del walk: frecuencias,
// D-024). Falsables f3 (invariante RNG, forma fuerte, integracion
// completa) y f12 (log narrable) contra el walk real. f1/f2/f4/f6/f7/f8/f9
// (mecanismo puro) viven en frequencies.test.js -- este archivo cubre lo
// que solo el walk completo puede probar: RNG real restringido al nivel
// ganador, y la forma del decisionLog end-to-end.

import { describe, it, expect } from 'vitest';
import { runWalk } from '../runWalk.js';
import { buildWeekArc } from '../../skeleton/buildWeekArc.js';
import { loadCatalog } from '../../dishes/loadCatalog.js';
import { resolveDishComposition } from '../../dishes/compositionResolver.js';
import { DAYS_ORDER } from '../../skeleton/days.js';
import { MOMENTOS } from '../../dishes/schema.js';

const DIAS = DAYS_ORDER;

function beat(day, overrides = {}) {
  return { day, density: 'medio', slotRole: 'rotativo', ...overrides };
}
function beats7(overridesByDay = {}) {
  return DIAS.map((day) => beat(day, overridesByDay[day] || {}));
}

/** Mismo helper que runWalk.test.js (aislamiento de pool via ancla sintetica en todo excepto los huecos indicados). */
function anchorEverythingExcept(openSlots) {
  const openSet = new Set(openSlots.map(({ day, momento }) => `${day}::${momento}`));
  const anchors = [];
  const dishes = [];
  let n = 0;
  for (const day of DIAS) {
    for (const momento of MOMENTOS) {
      const key = `${day}::${momento}`;
      if (openSet.has(key)) continue;
      const id = `anchorFill${n++}`;
      anchors.push({ anchorId: id, cookDay: day, leftoverDays: [] });
      dishes.push({
        id, rol: 'ancla', momento: [momento], plateType: `ancla_${day}_${momento}`, tempFeel: 'neutro', energiaCocina: 'medio',
      });
    }
  }
  return { anchors, dishes };
}

const catalogReal = loadCatalog();
const legumbresComida = catalogReal.filter((d) => d.rol === 'rotativo' && d.momento.includes('comida') && resolveDishComposition(d).proteinType === 'legumbre');
const legumbre1 = legumbresComida[0];
const legumbre2 = legumbresComida[1];
const neutroSinVerdura = catalogReal.find((d) => d.id === '["pasta","huevo","pasta",null,null,"ajillo","revuelto"]');

describe('runWalk - v15: frecuencias (P2b-ii, paso 4 del walk, D-024)', () => {
  it('fixtures reales localizadas: 2 legumbre (comida) + 1 neutro sin verdura (comida)', () => {
    expect(legumbre1).toBeDefined();
    expect(legumbre2).toBeDefined();
    expect(legumbre1.id).not.toBe(legumbre2.id);
    expect(neutroSinVerdura).toBeDefined();
    expect(resolveDishComposition(neutroSinVerdura).verdura.valorEfectivo).toEqual([]);
  });

  it('f3: invariante RNG forma fuerte -- sobre >=8 seeds, el neutro NUNCA gana; la variacion ocurre solo entre los 2 supervivientes del nivel', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Martes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, legumbre1, legumbre2, neutroSinVerdura];

    const ganadores = new Set();
    for (let seed = 0; seed < 8; seed++) {
      const { slots, decisionLog } = runWalk({ weekArc, catalog, seed: `v15-f3-${seed}` });
      const martes = slots.find((s) => s.day === 'Martes' && s.momento === 'comida');
      expect(martes.dishId).not.toBe(neutroSinVerdura.id); // el neutro (sin verdura, sin target) jamas gana: paso 4 lo excluye del nivel
      ganadores.add(martes.dishId);

      const entry = decisionLog.find((d) => d.day === 'Martes' && d.momento === 'comida');
      // El nivel ganador narrado por paso 4 excluye explicitamente al neutro (descartado a nivel inferior).
      expect(entry.evidencia).toContain('paso 4:');
      expect(entry.evidencia).toContain(neutroSinVerdura.id);
    }
    expect([...ganadores].sort()).toEqual([legumbre1.id, legumbre2.id].sort()); // ambos supervivientes aparecen, nadie mas
  });

  it('f12: log narrable -- la entrada de un hueco intervenido por paso 4 cita target/contador/nivel/descartados', () => {
    const { anchors, dishes } = anchorEverythingExcept([{ day: 'Martes', momento: 'comida' }]);
    const weekArc = { beats: beats7(), anchors };
    const catalog = [...dishes, legumbre1, legumbre2, neutroSinVerdura];
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v15-f12-interviene' });
    const entry = decisionLog.find((d) => d.day === 'Martes' && d.momento === 'comida');
    expect(entry.evidencia).toContain('paso 4:');
    expect(entry.evidencia).toMatch(/nivel preferente/);
    expect(entry.evidencia).toMatch(/descartados a nivel inferior/);
  });

  it('f12: ninguna entrada de relleno lleva una clausula "paso 4:" vacia o malformada (catalogo real, seed 0)', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 0, strategy: 'x' });
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 0 });
    const rellenos = decisionLog.filter((d) => !d.evento);
    for (const r of rellenos) {
      // Toda entrada de relleno tiene una evidencia bien formada: o no
      // menciona "paso 4:" (silencio, sin intervencion -- ver
      // frequencies.test.js describe "sin intervencion (f12...)") o la
      // menciona con el contenido narrable completo -- nunca una mencion
      // vacia o a medias.
      if (r.evidencia.includes('paso 4:')) {
        expect(r.evidencia).toMatch(/nivel preferente|frecuencia\(s\) corta\(s\) sin candidato/);
      }
    }
    expect(rellenos).toHaveLength(14); // sin regresion del conteo (D-018/D-019): paso 4 se pliega en la MISMA entrada
  });

  it('DEFAULT_WEEKLY_TARGETS ratificado (D-024) se consume de verdad: sobre catalogo real (seed=0), al menos un hueco es intervenido por paso 4', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 0, strategy: 'x' });
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 0 });
    const intervenido = decisionLog.some((d) => !d.evento && d.evidencia.includes('paso 4:'));
    expect(intervenido).toBe(true);
  });
});

describe('runWalk - v16: narracion de neutralizacion (D-024 addendum) -- ids irresolubles del paso 4, una entrada por walk', () => {
  it('catalogo 100% sintetico (v6-style, ids no resolubles) -> UNA entrada "paso4_ids_irresolubles", conteo + ids, evento (no cuenta como relleno)', () => {
    const catalog = [
      { id: 'anclaX', rol: 'ancla', momento: ['comida'], energiaCocina: 'medio' },
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `rotSintetico${i}`, rol: 'rotativo', momento: ['comida', 'cena'], tempFeel: 'caliente', plateType: `tipo${i % 5}`, energiaCocina: 'medio',
      })),
    ];
    const weekArc = {
      beats: DAYS_ORDER.map((day) => ({ day, density: 'medio', slotRole: day === 'Lunes' ? 'ancla' : 'rotativo' })),
      anchors: [{ anchorId: 'anclaX', cookDay: 'Lunes', leftoverDays: [] }],
    };
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 'v16-narracion' });

    const entradas = decisionLog.filter((d) => d.causa === 'paso4_ids_irresolubles');
    expect(entradas).toHaveLength(1); // UNA por walk, no por hueco
    expect(entradas[0].evento).toBe(true); // no es un relleno
    expect(entradas[0].evidencia).toMatch(/^\d+ id\(s\)/); // conteo
    expect(entradas[0].evidencia).toContain('anclaX'); // el ancla sintetica tambien es irresoluble y se cuenta
    expect(entradas[0].evidencia).toContain('rotSintetico0'); // al menos un rotativo sintetico citado por id

    // Confirma que NINGUN test preexistente se ve afectado: la nueva
    // entrada es evento:true (fuera de "rellenos"), y no colisiona con
    // ningun causa/day/momento usado por aserciones .find() existentes
    // (causa distinta de todas las conocidas: veto_universo_reducido,
    // capricho_degradado_a_rotativo, colision_sin_hueco, seleccion_*).
    const rellenos = decisionLog.filter((d) => !d.evento);
    expect(rellenos).toHaveLength(14);
  });

  it('catalogo real (sin ids sinteticos) -> CERO entradas "paso4_ids_irresolubles"', () => {
    const catalog = loadCatalog();
    const { weekArc } = buildWeekArc({ profile: { trainingDays: [] }, seed: 0, strategy: 'x' });
    const { decisionLog } = runWalk({ weekArc, catalog, seed: 0 });
    expect(decisionLog.filter((d) => d.causa === 'paso4_ids_irresolubles')).toHaveLength(0);
  });
});
