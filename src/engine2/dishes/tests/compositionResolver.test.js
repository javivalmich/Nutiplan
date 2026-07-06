// Tests del resolver de composicion — Fase 4, Componente P2a
// (infraestructura composicional). Falsables v1-v6/r1-r5 segun el
// prompt de sesion 2026-07-03/04 (ver DECISIONS.md, D-021).
//
// r1-r5 usan fixtures PUROS (tuplas/combos construidos a mano) contra
// las funciones exportadas resolveScaffoldComposition/
// resolveFreeformComposition — nunca mutan dishes.json, FREEFORM_COMBOS.js
// ni legacyCombos.data.js.

import { describe, it, expect } from 'vitest';
import { loadCatalog } from '../loadCatalog.js';
import {
  PROTEIN_TYPES,
  P_TO_PROTEINTYPE,
  resolveDishComposition,
  resolveCatalogComposition,
  resolveScaffoldComposition,
  resolveFreeformComposition,
  ejesVerdura,
} from '../compositionResolver.js';

const catalog = loadCatalog();
const vistas = resolveCatalogComposition(catalog);
const porOrigen = (origen) => vistas.filter((v) => v.origen === origen);

describe('v1 — los 241 resuelven; shape identico por contrato para ambos origenes', () => {
  it('resuelve exactamente 241 vistas sin lanzar', () => {
    expect(vistas).toHaveLength(241);
  });

  it('178 scaffold + 63 freeform', () => {
    expect(porOrigen('scaffold')).toHaveLength(178);
    expect(porOrigen('freeform')).toHaveLength(63);
  });

  it('todas las vistas comparten el mismo conjunto base de claves', () => {
    const BASE_KEYS = ['origen', 'claveP', 'proteinType', 'containsGluten', 'containsLactosa', 'density', 'verdura'];
    for (const v of vistas) {
      for (const key of BASE_KEYS) expect(v).toHaveProperty(key);
    }
  });

  it('solo scaffold trae "tupla"; freeform no la trae', () => {
    for (const v of porOrigen('scaffold')) {
      expect(v.tupla).toBeDefined();
      expect(Object.keys(v.tupla).sort()).toEqual(['C', 'P', 'S', 'V', 'V2', 'cookM', 'tmpl'].sort());
    }
    for (const v of porOrigen('freeform')) {
      expect(Object.prototype.hasOwnProperty.call(v, 'tupla')).toBe(false);
    }
  });
});

describe('v2 — tupla integra en los 178; spot-checks contra platos conocidos', () => {
  it('primer plato del catalogo (pollo/arroz/brocoli/limon_hierbas/plancha)', () => {
    const dish = catalog[0];
    const vista = resolveDishComposition(dish);
    expect(vista.tupla).toEqual({
      tmpl: 'caliente_clasico', P: 'pollo', C: 'arroz', V: 'brocoli', V2: null, S: 'limon_hierbas', cookM: 'plancha',
    });
  });

  it('un plato de legumbre (C null en la tupla) conserva C=null, no lo pierde ni lo convierte en string', () => {
    const dish = catalog.find((d) => {
      try { return JSON.parse(d.id)[0] === 'legumbre'; } catch { return false; }
    });
    expect(dish).toBeDefined();
    const vista = resolveDishComposition(dish);
    expect(vista.tupla.tmpl).toBe('legumbre');
    expect(vista.tupla.C).toBeNull();
  });

  it('un plato de ensalada con V2 real conserva V y V2 distintos', () => {
    const dish = catalog.find((d) => {
      try { const t = JSON.parse(d.id); return t[0] === 'ensalada' && t[4] !== null; } catch { return false; }
    });
    expect(dish).toBeDefined();
    const vista = resolveDishComposition(dish);
    expect(vista.tupla.V).not.toBeNull();
    expect(vista.tupla.V2).not.toBeNull();
    expect(vista.tupla.V).not.toBe(vista.tupla.V2);
  });
});

describe('v3 — proteinType para los 241 dentro del vocabulario cerrado', () => {
  it('todas las vistas tienen proteinType dentro de PROTEIN_TYPES (8 valores)', () => {
    expect(PROTEIN_TYPES).toHaveLength(8);
    for (const v of vistas) expect(PROTEIN_TYPES).toContain(v.proteinType);
  });

  it('aborta si el proteinType resuelto cae fuera del vocabulario (fixture freeform)', () => {
    const comboEnvenenado = {
      identity: { protein: 'x', proteinType: 'no_existe', containsGluten: false, containsLactosa: false },
      nutrition: { energyDensity: 'low' },
    };
    expect(() => resolveFreeformComposition(comboEnvenenado, 'fixture_v3')).toThrow(/vocabulario cerrado/);
  });
});

describe('r2 — clave P ausente de P_TO_PROTEINTYPE aborta nombrando la clave', () => {
  it('P_TO_PROTEINTYPE no tiene entrada para una clave inventada (control de fixture)', () => {
    expect(P_TO_PROTEINTYPE['clave_inventada_no_existe']).toBeUndefined();
  });

  it('resolveScaffoldComposition lanza nombrando la clave P ausente', () => {
    const tuplaEnvenenada = { tmpl: 'x', P: 'clave_inventada_no_existe', C: null, V: null, V2: null, S: 'x', cookM: 'x' };
    expect(() => resolveScaffoldComposition(tuplaEnvenenada, 'fixture_r2')).toThrow(/clave_inventada_no_existe/);
  });
});

describe('r3 — energyDensity fuera del mapeo lexico aborta', () => {
  it('resolveFreeformComposition lanza si nutrition.energyDensity no es low/medium/high', () => {
    const comboEnvenenado = {
      identity: { protein: 'x', proteinType: 'ave', containsGluten: false, containsLactosa: false },
      nutrition: { energyDensity: 'extreme' },
    };
    expect(() => resolveFreeformComposition(comboEnvenenado, 'fixture_r3')).toThrow(/mapeo lexico/);
  });
});

describe('v4 — density en baja/media/alta para los 241', () => {
  it('toda vista resuelve density a uno de los 3 valores', () => {
    for (const v of vistas) expect(['baja', 'media', 'alta']).toContain(v.density);
  });
});

describe('v5 — verdura distinguible estructuralmente por origen', () => {
  it('scaffold: verdura.estado="conocida" y trae ejes (array)', () => {
    for (const v of porOrigen('scaffold')) {
      expect(v.verdura.estado).toBe('conocida');
      expect(Array.isArray(v.verdura.ejes)).toBe(true);
    }
  });

  it('freeform: verdura.estado="desconocida" y NO trae campo ejes', () => {
    for (const v of porOrigen('freeform')) {
      expect(v.verdura.estado).toBe('desconocida');
      expect(Object.prototype.hasOwnProperty.call(v.verdura, 'ejes')).toBe(false);
    }
  });

  it('ejesVerdura(vista) devuelve el array para scaffold', () => {
    const vista = porOrigen('scaffold')[0];
    expect(ejesVerdura(vista)).toBe(vista.verdura.ejes);
  });

  it('ejesVerdura(vista) LANZA para freeform (desconocida != sin verdura)', () => {
    const vista = porOrigen('freeform')[0];
    expect(() => ejesVerdura(vista)).toThrow(/desconocida/);
  });
});

describe('r4 — CONTROL NEGATIVO: el patron ingenuo de consumidor lanza, nunca devuelve [] ni 0', () => {
  it('pedir .ejes directamente sobre una vista desconocida es undefined, no []', () => {
    const vista = porOrigen('freeform')[0];
    expect(vista.verdura.ejes).toBeUndefined();
  });

  it('contar longitud (.ejes.length) sobre una vista desconocida LANZA, nunca da 0', () => {
    const vista = porOrigen('freeform')[0];
    expect(() => vista.verdura.ejes.length).toThrow(TypeError);
  });
});

describe('v6 — pureza: dos resoluciones son iguales, orden estable', () => {
  it('resolver el mismo catalogo dos veces da vistas equivalentes', () => {
    const otraVez = resolveCatalogComposition(catalog);
    expect(otraVez).toEqual(vistas);
  });

  it('el orden de las vistas corresponde al orden de entrada', () => {
    const otraVez = resolveCatalogComposition(catalog);
    for (let i = 0; i < catalog.length; i++) {
      const esperado = resolveDishComposition(catalog[i]);
      expect(otraVez[i]).toEqual(esperado);
    }
  });
});

describe('r5 — la vista va congelada en profundidad', () => {
  it('mutar un campo plano lanza', () => {
    const vista = vistas[0];
    expect(() => { vista.origen = 'mutado'; }).toThrow(TypeError);
  });

  it('mutar un campo anidado (verdura) lanza', () => {
    const vista = porOrigen('scaffold')[0];
    expect(() => { vista.verdura.estado = 'mutado'; }).toThrow(TypeError);
  });

  it('mutar el array anidado de ejes lanza', () => {
    const vista = porOrigen('scaffold').find((v) => v.verdura.ejes.length > 0);
    expect(vista).toBeDefined();
    expect(() => { vista.verdura.ejes.push('intruso'); }).toThrow(TypeError);
  });

  it('mutar la tupla anidada lanza', () => {
    const vista = porOrigen('scaffold')[0];
    expect(() => { vista.tupla.P = 'mutado'; }).toThrow(TypeError);
  });
});

describe('r1 — freeform sin entrada en FREEFORM_COMBOS aborta identificando el id', () => {
  it('resolveDishComposition lanza nombrando el id cuando no hay tupla ni entrada freeform', () => {
    expect(() => resolveDishComposition({ id: 'id_inventado_sin_mapeo_alguno' }))
      .toThrow(/id_inventado_sin_mapeo_alguno/);
  });
});

// Cobertura de containsGluten/containsLactosa (gap detectado en verificacion
// read-only 2026-07-06 sobre main e3a1b0b: compositionResolver.test.js:37
// solo hacia toHaveProperty, sin examinar estado/valor). Sin cambios de
// produccion — el comportamiento ya era correcto, esto solo lo fija.
describe('g1 — scaffold (178): containsGluten/containsLactosa desconocido explicito, sin clave "valor"', () => {
  it('los 178 scaffold resuelven estado="desconocida" en ambos campos', () => {
    const scaffold = porOrigen('scaffold');
    expect(scaffold).toHaveLength(178);
    for (const v of scaffold) {
      expect(v.containsGluten.estado).toBe('desconocida');
      expect(v.containsLactosa.estado).toBe('desconocida');
    }
  });

  it('ninguno de los 178 tiene la clave "valor" en containsGluten/containsLactosa', () => {
    for (const v of porOrigen('scaffold')) {
      expect('valor' in v.containsGluten).toBe(false);
      expect('valor' in v.containsLactosa).toBe(false);
    }
  });
});

describe('g2 — freeform (63): containsGluten/containsLactosa declarado, valor boolean', () => {
  it('los 63 freeform resuelven estado="conocida" y valor boolean en ambos campos', () => {
    const freeform = porOrigen('freeform');
    expect(freeform).toHaveLength(63);
    for (const v of freeform) {
      expect(v.containsGluten.estado).toBe('conocida');
      expect(typeof v.containsGluten.valor).toBe('boolean');
      expect(v.containsLactosa.estado).toBe('conocida');
      expect(typeof v.containsLactosa.valor).toBe('boolean');
    }
  });
});

// g3: no-uniformidad, no snapshot duro. Fijar los conteos exactos (39/24,
// 20/43) haria que el test dependiera de CUANTOS combos de cada tipo hay
// en FREEFORM_COMBOS.js hoy -- anadir/editar un combo real (cambio de
// datos legitimo, no un bug) romperia un test que no esta protegiendo
// nada. La invariante real que importa es la no-uniformidad: si un
// default disfrazado colapsara todo a un unico valor, esto lo detecta
// igual que un snapshot, sin acoplarse al conteo actual.
describe('g3 — no-uniformidad: containsGluten/containsLactosa no son un default disfrazado', () => {
  it('entre los 63 freeform hay al menos un true y un false en containsGluten', () => {
    const valores = porOrigen('freeform').map((v) => v.containsGluten.valor);
    expect(valores).toContain(true);
    expect(valores).toContain(false);
  });

  it('entre los 63 freeform hay al menos un true y un false en containsLactosa', () => {
    const valores = porOrigen('freeform').map((v) => v.containsLactosa.valor);
    expect(valores).toContain(true);
    expect(valores).toContain(false);
  });
});

describe('g4 — distinguibilidad estructural (analogo a v5 de verdura): "valor" in campo distingue los estados', () => {
  it('"valor" in campo es verdadero SOLO cuando estado="conocida", para las 241 vistas', () => {
    for (const v of vistas) {
      expect('valor' in v.containsGluten).toBe(v.containsGluten.estado === 'conocida');
      expect('valor' in v.containsLactosa).toBe(v.containsLactosa.estado === 'conocida');
    }
  });

  it('ninguna vista desconocida resuelve valor=false (desconocida no es false)', () => {
    for (const v of vistas) {
      if (v.containsGluten.estado === 'desconocida') expect(v.containsGluten.valor).toBeUndefined();
      if (v.containsLactosa.estado === 'desconocida') expect(v.containsLactosa.valor).toBeUndefined();
    }
  });
});
