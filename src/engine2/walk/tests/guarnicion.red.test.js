// Paso 7 de la legumbre como guarnición: la red de D-099.3 de la (b). Si la semana incumple D-099.3 y la (b) había
// sacado compuestos de legumbre del pool, se repite el walk con la misma semilla sin la (b); si sigue, causa propia.
import { describe, it, expect } from 'vitest';
import { redD099Guarnicion, crearGuarnicion, filtrarPoolGuarnicion } from '../guarnicion.js';

const semana = (causas = []) => ({ slots: [], segundos: [], decisionLog: causas.map((causa) => ({ causa })) });
const anotarInfraccion = (r, inf, causa, detalle) => { r.decisionLog.push({ causa, infracciones: inf, evidencia: detalle }); return r; };

describe('red de D-099.3 de la (b) (paso 7)', () => {
  it('sin infracciones no repite nada', () => {
    let repetidas = 0;
    const r = semana(['legumbre_compuesta_fuera_hay_otro']);
    expect(redD099Guarnicion({}, r, { repetir: () => { repetidas++; return semana(); }, infraccionesD099: () => [], anotarInfraccion })).toBe(r);
    expect(repetidas).toBe(0);
  });

  it('con infracción y la (b) actuando, repite una vez sin la (b) y lo dice el log', () => {
    let repetidas = 0;
    const otra = semana();
    const r = redD099Guarnicion({}, semana(['legumbre_compuesta_fuera_hay_otro']), {
      repetir: () => { repetidas++; return otra; },
      infraccionesD099: (_, x) => (x === otra ? [] : ['pollo en Lunes y Martes']),
      anotarInfraccion,
    });
    expect(repetidas).toBe(1);
    expect(r).toBe(otra);
    const e = r.decisionLog.find((x) => x.causa === 'guarnicion_red_d099_sin_b');
    expect(e.infracciones).toEqual(['pollo en Lunes y Martes']);
  });

  it('si sigue la infracción sin la (b), causa propia y no repite más', () => {
    let repetidas = 0;
    const r = redD099Guarnicion({}, semana(['legumbre_compuesta_fuera_hay_otro']), {
      repetir: () => { repetidas++; return semana(); }, infraccionesD099: () => ['pollo en Lunes y Martes'], anotarInfraccion,
    });
    expect(repetidas).toBe(1);
    expect(r.decisionLog.map((x) => x.causa)).toEqual(['guarnicion_red_d099_sin_b', 'infraccion_d099_guarnicion_red_sin_b']);
  });

  it('si la (b) no había sacado nada, no repite: la infracción queda con su causa', () => {
    let repetidas = 0;
    const r = redD099Guarnicion({}, semana(), { repetir: () => { repetidas++; return semana(); }, infraccionesD099: () => ['x'], anotarInfraccion });
    expect(repetidas).toBe(0);
    expect(r.decisionLog.map((x) => x.causa)).toEqual(['infraccion_d099_guarnicion_sin_exclusion']);
  });

  it('en la repetición la (b) no actúa; la vegetariana nunca la tiene', () => {
    const compuesto = { id: 'c', tmpl: 'legumbre' };
    const otro = { id: 'o' };
    const args = (decisionLog) => ({ pool: [compuesto, otro], day: 'Lunes', momento: 'comida', decisionLog, esCompuestoLegumbre: (d) => d === compuesto, slots: new Map(), familiaCache: () => null });
    const log1 = [];
    expect(filtrarPoolGuarnicion(crearGuarnicion({ seed: 's' }), args(log1))).toEqual([otro]);
    expect(log1.map((e) => e.causa)).toEqual(['legumbre_compuesta_fuera_hay_otro']);
    expect(filtrarPoolGuarnicion(crearGuarnicion({ seed: 's', sinExclusionB: true }), args([]))).toEqual([compuesto, otro]);
    expect(filtrarPoolGuarnicion(crearGuarnicion({ seed: 's', profile: { dieta: 'vegetariana' } }), args([]))).toEqual([compuesto, otro]);
  });
});
