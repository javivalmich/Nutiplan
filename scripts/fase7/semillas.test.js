// Tests de las reglas puras del escáner de semillas. Ningún fixture usa enteros 1001-1010.
import { describe, it, expect } from 'vitest';
import {
  analizarLinea, ocurrenciasDeTexto, agrupar, comprobarAgrupacion, intersecta, esBinario, dividirLineas,
} from './semillas.js';

const una = (linea) => {
  const { coincidencias } = analizarLinea(linea);
  expect(coincidencias).toHaveLength(1);
  return coincidencias[0];
};
const R = (linea) => {
  const c = una(linea);
  return [c.regla, c.valores];
};

describe('LIT', () => {
  it('el 32 de mulberry32 no es LIT; mulberry32(7) es R1', () => {
    expect(R('mulberry32(7)')).toEqual(['R1', [7]]);
    expect(analizarLinea('mulberry32(x)').coincidencias[0].regla).toBe('R4');
    expect(analizarLinea('mulberry32(x)').literalesNoConsumidos).toEqual([]);
  });
  it('decimales, hex y separadores no son LIT', () => {
    for (const l of ['seed 1.5', 'seed v1.2.3', 'seed 0x10', 'seed 1_000']) {
      const r = analizarLinea(l);
      expect(r.coincidencias.map((c) => c.regla)).toEqual(['R4']);
      expect(r.literalesNoConsumidos).toEqual([]);
    }
  });
  it('un punto final no impide LIT', () => {
    expect(R('semilla 5.')).toEqual(['R1', [5]]);
  });
  it('negativos', () => {
    expect(R('seed: -4')).toEqual(['R1', [-4]]);
  });
});

describe('R1', () => {
  it.each([
    ['seed: 5', 5],
    ['  --seed 5', 5],
    ['semilla 5', 5],
    ['{ "seed": 8 }', 8],
    ['const seed=9;', 9],
  ])('%s', (linea, v) => {
    expect(R(linea)).toEqual(['R1', [v]]);
  });
  it('sin LIT pegado: seed5 no es R1', () => {
    expect(analizarLinea('seed5').coincidencias[0].regla).toBe('R4');
  });
});

describe('R2', () => {
  it.each([
    ['seed 3-9'],
    ['seed 3–9'],
    ['seed 3..9'],
    ['semilla 3 a 9'],
    ['seeds 3–9.'],
  ])('%s → 3..9', (linea) => {
    expect(R(linea)).toEqual(['R2', [3, 9]]);
  });
  it('for con < convierte el límite y lo marca', () => {
    const c = una('for (let seed = 1; seed < 50; seed++) {');
    expect([c.regla, c.valores, c.banderas]).toEqual(['R2', [1, 49], { limiteExclusivoConvertido: true }]);
  });
  it('for con <= no convierte', () => {
    const c = una('for (var seed = 2; seed <= 7; seed++)');
    expect([c.valores, c.banderas]).toEqual([[2, 7], {}]);
  });
  it('precedencia: el for no genera además R1', () => {
    expect(analizarLinea('for (let seed = 1; seed < 50; seed++)').coincidencias).toHaveLength(1);
  });
  it('rangoInvertido se reporta tal cual', () => {
    const c = una('seed 9-3');
    expect([c.valores, c.banderas]).toEqual([[9, 3], { rangoInvertido: true }]);
  });
  it('R2 consume sus LIT: no hay R1 además', () => {
    expect(analizarLinea('semilla 3 a 9').coincidencias).toHaveLength(1);
  });
});

describe('R3', () => {
  it('seeds = [2, 4, 6]', () => {
    expect(R('seeds = [2, 4, 6]')).toEqual(['R3', [2, 4, 6]]);
  });
  it('coma final admitida', () => {
    expect(R('seeds = [2, 4, ]')).toEqual(['R3', [2, 4]]);
  });
});

describe('R4 y anotación', () => {
  it('seed: base + i y function f(semilla) son R4 sin valores', () => {
    for (const l of ['seed: base + i', 'function f(semilla) {']) {
      const c = una(l);
      expect([c.regla, c.valores]).toEqual(['R4', null]);
    }
  });
  it('línea sin CONTEXTO no produce nada', () => {
    expect(analizarLinea('const x = 5; // 3-9')).toEqual({ coincidencias: [], literalesNoConsumidos: [] });
  });
  it('literalesNoConsumidos: for descendente', () => {
    const r = analizarLinea('for (let seed = 90; seed >= 1; seed--)');
    expect(r.coincidencias.map((c) => [c.regla, c.valores])).toEqual([['R1', [90]]]);
    expect(r.literalesNoConsumidos).toEqual([1]);
  });
  it('R4 conserva todos sus LIT como no consumidos', () => {
    expect(analizarLinea('seed: base + 3').literalesNoConsumidos).toEqual([3]);
  });
});

describe('ocurrencias y agrupación', () => {
  const base = { origen: 'blob', blob: 'b1', commit: null, rutas: ['x'], primerCommit: 'c1', indicePrimerCommit: 0 };

  it('numera desde 1, quita \\r final y repite ocurrencias por línea', () => {
    expect(dividirLineas('a\r\nb\n')).toEqual(['a', 'b', '']);
    const o = ocurrenciasDeTexto('x\r\nseed: 5\r\nseed: 5 seed: 6\n', base);
    expect(o.map((x) => [x.linea, x.valores, x.texto])).toEqual([
      [2, [5], 'seed: 5'],
      [3, [5], 'seed: 5 seed: 6'],
      [3, [6], 'seed: 5 seed: 6'],
    ]);
  });

  it('agrupación sin pérdida de ocurrencias', () => {
    const o = [
      ...ocurrenciasDeTexto('seed: 5\nseed: 5\nseed: 7\nseed: base\n', base),
      ...ocurrenciasDeTexto('seed: 5\n', { ...base, blob: 'b2', indicePrimerCommit: 1 }),
      ...ocurrenciasDeTexto('semilla 4', { origen: 'mensaje', blob: null, commit: 'c1', rutas: null, primerCommit: null, indicePrimerCommit: 0 }),
    ];
    const g = agrupar(o);
    expect(g.reduce((n, x) => n + x.ocurrencias.length, 0)).toBe(o.length);
    expect(g.map((x) => x.id)).toEqual(['G0001', 'G0002', 'G0003', 'G0004']);
    const g5 = g.find((x) => x.clave.texto === 'seed: 5');
    expect(g5.ocurrencias).toHaveLength(3);
    expect(g5.clasificacion).toBeNull();
    expect(g5.nota).toBeNull();
    // ocurrencias ordenadas por (origen, índice, blob, línea)
    expect(g5.ocurrencias.map((x) => [x.blob, x.linea])).toEqual([['b1', 1], ['b1', 2], ['b2', 1]]);
    // grupos ordenados por regla, texto y valores
    expect(g.map((x) => x.clave.regla)).toEqual(['R1', 'R1', 'R1', 'R4']);
  });

  it('el mismo texto con distinta regla/valores forma grupos distintos', () => {
    const g = agrupar(ocurrenciasDeTexto('seed 3-9 seed 4\n', base));
    expect(g).toHaveLength(2);
  });

  it('comprobarAgrupacion aborta si no cuadra', () => {
    expect(() => comprobarAgrupacion([{ ocurrencias: [1, 2] }], 3)).toThrow(/inconsistente/);
    expect(() => comprobarAgrupacion([{ ocurrencias: [1, 2] }], 2)).not.toThrow();
  });
});

describe('consulta y binarios', () => {
  const g = (regla, valores) => ({ clave: { regla, valores } });
  it('intersecta', () => {
    expect(intersecta(g('R1', [5]), 4, 6)).toBe(true);
    expect(intersecta(g('R1', [7]), 4, 6)).toBe(false);
    expect(intersecta(g('R3', [1, 50]), 4, 6)).toBe(false);
    expect(intersecta(g('R3', [1, 5]), 4, 6)).toBe(true);
    expect(intersecta(g('R2', [1, 49]), 40, 60)).toBe(true);
    expect(intersecta(g('R2', [1, 3]), 4, 6)).toBe(false);
    expect(intersecta(g('R2', [9, 3]), 4, 6)).toBe(true);
    expect(intersecta(g('R4', null), 0, 99)).toBe(false);
  });
  it('esBinario mira solo los primeros 8000 bytes', () => {
    expect(esBinario(new Uint8Array([65, 0, 66]))).toBe(true);
    const b = new Uint8Array(8001);
    b[8000] = 0;
    b.fill(65, 0, 8000);
    expect(esBinario(b)).toBe(false);
    b[7999] = 0;
    expect(esBinario(b)).toBe(true);
  });
});
