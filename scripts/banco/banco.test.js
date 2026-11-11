// Banco I-0: que mida siempre lo mismo y que detecte un cambio.
// (La medición completa y la comparación con la línea base se ejecutan con
// scripts/banco/banco.mjs; aquí solo se protege el instrumento.)
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { medirPerfil, diferencias, estado } from './banco.mjs';
import { PERFILES, SEMANAS_POR_DEFECTO } from './perfiles.mjs';
import { composicionSemana } from './metricas.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const lineaBase = JSON.parse(fs.readFileSync(path.join(AQUI, 'linea-base', 'linea-base.json'), 'utf8'));

describe('banco I-0', { timeout: 120000 }, () => {
  it('misma semilla, misma medición (dos pasadas completas de un perfil)', () => {
    const p = PERFILES.find((x) => x.id === 'omni-2174');
    const a = medirPerfil(p, 2);
    const b = medirPerfil(p, 2);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(estado.semillas).toBeGreaterThanOrEqual(4);
  });

  it('la línea base congelada cubre todos los perfiles y coincide con lo que hoy se mide', () => {
    expect(lineaBase.semanas).toBe(SEMANAS_POR_DEFECTO);
    expect(lineaBase.menus.map((m) => m.id)).toEqual(PERFILES.map((p) => p.id));
    // Dos perfiles (uno sin restricciones y uno restringido), para no alargar la suite.
    for (const id of ['omni-2174', 'celiaco-2400']) {
      const hoy = medirPerfil(PERFILES.find((x) => x.id === id), SEMANAS_POR_DEFECTO);
      expect(diferencias(lineaBase.menus.find((m) => m.id === id), hoy)).toEqual([]);
    }
  });

  it('diferencias() señala qué cambia entre dos mediciones', () => {
    const antes = { menus: [{ id: 'a', composicion: { pescado: 5 }, planes: [{ semana: 60, huella: 'x' }] }] };
    const despues = { menus: [{ id: 'a', composicion: { pescado: 4 }, planes: [{ semana: 60, huella: 'y' }] }] };
    expect(diferencias(antes, antes)).toEqual([]);
    expect(diferencias(antes, despues)).toEqual(['menus[a].composicion.pescado: 5 → 4', 'menus[a].planes[60].huella: "x" → "y"']);
  });

  it('composicionSemana cuenta familias, días seguidos y la sugerencia del sábado aparte', () => {
    const plato = (id, familia, especie) => [id, { id, _f: familia, _e: especie }];
    const porId = new Map([plato('a', 'pescado', 'merluza'), plato('b', 'pescado', 'salmon'), plato('c', 'ave', 'pollo')]);
    // Platos sintéticos: el resolvedor no los conoce → «sin_resolver». Se comprueba la mecánica del recuento.
    const dia = (name, comida, cena, libre) => ({ name, meals: [
      libre ? { time: 'Comida', title: 'Libre', sugerencia: { title: comida, _dishId: comida, _motor: 'engine2' } } : { time: 'Comida', title: comida, _dishId: comida, _motor: 'engine2' },
      { time: 'Cena', title: cena, _dishId: cena, _motor: 'engine2' },
    ] });
    const plan = { days: [dia('Lunes', 'a', 'c'), dia('Martes', 'b', 'c'), dia('Miércoles', 'a', 'b', true)] };
    const r = composicionSemana(plan, porId, ['c']);
    expect(r.servidos).toBe(5);
    expect(r.sugerenciaSabado).toBe('sin_resolver');
    expect(r.porFamilia).toEqual({ sin_resolver: 5 });
    expect(r.familiaDiasSeguidos).toBe(2);
    expect(r.familiaMismoDia).toBe(2);
    expect(r.platoRepetidoEnSemana).toBe(2);
    expect(r.platoDeSemanaAnterior).toBe(2);
  });
});
