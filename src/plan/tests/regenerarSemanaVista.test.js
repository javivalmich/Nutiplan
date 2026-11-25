// «Regenerar plan» en la vista (D-123): conserva los «Extras del día»; si engine2 falla, no guarda nada.
// handleRegenerate vive en la vista (OriginalPlanApp.jsx) y no se exporta: se lee su código tal cual, como
// cloneAndScalePlan en auditoriaComidaDoble.test.js, y se ejecuta con sus dependencias simuladas.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';

function handleRegenerateDeLaVista(deps) {
  const fuente = fs.readFileSync(new URL('../../ui/views/OriginalPlanApp.jsx', import.meta.url), 'utf8');
  const inicio = fuente.indexOf('const handleRegenerate=()=>{');
  const fin = fuente.indexOf('\n  };\n', inicio);
  expect(inicio).toBeGreaterThan(0);
  expect(fin).toBeGreaterThan(inicio);
  const nombres = Object.keys(deps);
  return new Function(...nombres, `${fuente.slice(inicio, fin)}\n  };\nreturn handleRegenerate;`)(...nombres.map((n) => deps[n]));
}

function escenario({ ok = true, confirma = true, nutri = false } = {}) {
  const extras = { 0: [{ nombre: 'Manzana', kcal: 80 }], 3: [{ nombre: 'Café con leche', kcal: 60 }] };
  const planActual = { days: [{ name: 'Lunes', meals: [] }] };
  const planNuevo = { days: [{ name: 'Lunes', meals: [{ time: 'Comida', title: 'Otro plato' }] }] };
  const deps = {
    isNutriPlan: nutri,
    setNavOpen: vi.fn(),
    window: { confirm: vi.fn(() => confirma) },
    weekNum: 61,
    __PERF: { time: (_n, f) => f() },
    regenerarSemana: vi.fn(() => (ok ? { ok: true, plan: planNuevo } : { ok: false, plan: planActual, aviso: 'aviso' })),
    plan: planActual,
    profile: { goal: 'maintain' },
    targetKcal: 2200,
    getPastProteinFrequency: () => ({}),
    loadMealMemory: () => ({}),
    currentUser: { id: 'u' },
    FREEFORM_POOL: [],
    saveMealMemory: () => {},
    alert: vi.fn(),
    setPlan: vi.fn(),
    setActiveDay: vi.fn(),
    setActiveTab: vi.fn(),
    saveData: vi.fn(),
    setExtras: vi.fn(),
    saveToPDB: vi.fn(),
    extras,
  };
  return { deps, extras, planNuevo, run: handleRegenerateDeLaVista(deps) };
}

describe('«Regenerar plan» en la vista', () => {
  it('conserva los «Extras del día»: los guarda con el plan nuevo y no los vacía', () => {
    const { deps, extras, planNuevo, run } = escenario();
    run();
    expect(deps.setPlan).toHaveBeenCalledWith(planNuevo);
    expect(deps.saveData).toHaveBeenCalledWith('u', deps.profile, planNuevo, 61, extras);
    expect(deps.saveToPDB).toHaveBeenCalledWith(deps.profile, planNuevo, 61, extras, 'system');
    expect(deps.setExtras).not.toHaveBeenCalled();
  });

  it('si engine2 falla: aviso, y no se guarda ni se cambia nada', () => {
    const { deps, run } = escenario({ ok: false });
    run();
    expect(deps.alert).toHaveBeenCalledWith('aviso');
    for (const f of ['setPlan', 'saveData', 'saveToPDB', 'setExtras']) expect(deps[f], f).not.toHaveBeenCalled();
  });

  it('sin confirmar, o en un plan del nutricionista, no regenera', () => {
    for (const opts of [{ confirma: false }, { nutri: true }]) {
      const { deps, run } = escenario(opts);
      run();
      expect(deps.regenerarSemana).not.toHaveBeenCalled();
      expect(deps.saveData).not.toHaveBeenCalled();
    }
  });
});
