// Paso 2 de la legumbre como guarnición: ingredientes nuevos y el renombre de
// alubias_cocidas a alubias_negras_cocidas (plan-implementacion.md, paso 2; D-100).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INGREDIENTES } from '../../../engine2/nutrientes/ingredientes.js';
import { FUENTES } from '../../../engine2/nutrientes/fuentesBedca.js';
import { COMPOSICION } from '../../../engine2/nutrientes/composicion.js';
import { rangoDe } from '../../../engine2/nutrientes/raciones.js';
import { reconocer, leerComida } from '../leerComida.js';

const ESTE = fileURLToPath(import.meta.url);

const NUEVAS = [
  // [clave, texto de compra, fuente BEDCA]
  ['alubias_blancas_cocidas', 'Alubias blancas cocidas', '898'],
  ['alubias_rojas_cocidas', 'Alubias rojas cocidas', '900'],
  ['alubias_pintas_cocidas', 'Alubias pintas cocidas', '900'],
  ['alubias_negras_cocidas', 'Alubias negras cocidas', '900'],
  ['lentejas_pardinas_cocidas', 'Lentejas pardinas cocidas', '1126'],
  ['lentejas_beluga_cocidas', 'Lentejas beluga cocidas', '1126'],
  ['habitas', 'Habitas', '2194'],
];

describe('ingredientes nuevos de legumbre', () => {
  for (const [clave, texto, bedca] of NUEVAS) {
    it(`${clave}: ingrediente de legumbre, con fuente BEDCA ${bedca}, composición y rango`, () => {
      expect(INGREDIENTES[clave]).toBeTruthy();
      expect(INGREDIENTES[clave].grupo).toBe('legumbre');
      expect(FUENTES[clave] && FUENTES[clave].bedca).toBe(bedca);
      expect(COMPOSICION[clave]).toBeTruthy();
      expect(COMPOSICION[clave].fuente.bedca).toBe(bedca);
      expect(rangoDe(clave)).toBeTruthy();
    });
    it(`${clave}: el lector lee «${texto}» con su clave`, () => {
      expect(reconocer(texto)).toBe(clave);
      const r = leerComida({ shopping: [`${texto} (150 g)`] });
      expect(r.items.map((i) => [i.clave, i.gramos])).toEqual([[clave, 150]]);
    });
  }

  it('las aproximaciones llevan nota: rojas y pintas con la alubia negra, pardina y beluga como lentejas cocidas', () => {
    for (const c of ['alubias_rojas_cocidas', 'alubias_pintas_cocidas', 'lentejas_pardinas_cocidas', 'lentejas_beluga_cocidas']) {
      expect(FUENTES[c].nota).toMatch(/aproximaci[oó]n/i);
    }
  });

  it('pardina y beluga tienen la misma composición que lentejas_cocidas', () => {
    const sinFuente = ({ fuente, ...v }) => v; // eslint-disable-line no-unused-vars
    for (const c of ['lentejas_pardinas_cocidas', 'lentejas_beluga_cocidas']) {
      expect(sinFuente(COMPOSICION[c])).toEqual(sinFuente(COMPOSICION.lentejas_cocidas));
    }
  });

  it('las cocidas tienen el mismo rango que las legumbres cocidas de hoy; las habitas, el de las legumbres frescas', () => {
    for (const c of ['alubias_blancas_cocidas', 'alubias_rojas_cocidas', 'alubias_pintas_cocidas', 'alubias_negras_cocidas', 'lentejas_pardinas_cocidas', 'lentejas_beluga_cocidas']) {
      expect(rangoDe(c)).toEqual(rangoDe('lentejas_cocidas'));
    }
    expect(rangoDe('habitas')).toEqual(rangoDe('guisantes'));
  });
});

describe('renombre de alubias_cocidas a alubias_negras_cocidas', () => {
  it('ninguna clave alubias_cocidas queda en src/ (salvo el motor viejo, que no la usa)', () => {
    const raiz = path.resolve(path.dirname(ESTE), '../../..');
    const con = [];
    const recorrer = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (p !== path.join(raiz, 'engine')) recorrer(p); continue; }
        if (!/\.(js|jsx|mjs)$/.test(e.name) || p === ESTE) continue;
        if (/\balubias_cocidas\b/.test(fs.readFileSync(p, 'utf8'))) con.push(path.relative(raiz, p));
      }
    };
    recorrer(raiz);
    expect(con).toEqual([]);
  });

  it('un plan guardado con «Alubias negras cocidas» se sigue leyendo igual: misma cantidad y misma composición', () => {
    const r = leerComida({ shopping: ['Alubias negras cocidas (250g)'] });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].gramos).toBe(250);
    expect(r.items[0].clave).toBe('alubias_negras_cocidas');
    // La misma alubia negra hervida de BEDCA que tenía alubias_cocidas.
    expect(COMPOSICION.alubias_negras_cocidas).toMatchObject({ kcal: 92, proteina: 8.4, hidratos: 13.7, grasa: 0.2, fibra: 8.7 });
    expect(COMPOSICION.alubias_negras_cocidas.fuente.bedca).toBe('900');
  });

  it('los textos que hoy se leen como otra clave se siguen leyendo igual', () => {
    expect(reconocer('Alubias blancas en remojo (60g secas)')).toBe('alubias_seco');
    expect(reconocer('Lentejas cocidas')).toBe('lentejas_cocidas');
    expect(reconocer('Garbanzos cocidos')).toBe('garbanzos_cocidos');
    expect(reconocer('Habas')).not.toBe('habitas');
  });
});
