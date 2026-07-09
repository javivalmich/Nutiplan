// Tests del resolver de composicion — Fase 4, Componente P2a
// (infraestructura composicional). Falsables v1-v6/r1-r5 segun el
// prompt de sesion 2026-07-03/04 (ver DECISIONS.md, D-021).
//
// r1-r5 usan fixtures PUROS (tuplas/combos construidos a mano) contra
// las funciones exportadas resolveScaffoldComposition/
// resolveFreeformComposition — nunca mutan dishes.json, FREEFORM_COMBOS.js
// ni legacyCombos.data.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { loadCatalog } from '../loadCatalog.js';
import { FREEFORM_COMBOS } from '../../../data/FREEFORM_COMBOS.js';
import {
  PROTEIN_TYPES,
  P_TO_PROTEINTYPE,
  resolveDishComposition,
  resolveCatalogComposition,
  resolveScaffoldComposition,
  resolveFreeformComposition,
  ejesVerdura,
} from '../compositionResolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = loadCatalog();
const vistas = resolveCatalogComposition(catalog);
const porOrigen = (origen) => vistas.filter((v) => v.origen === origen);

// Helpers compartidos S2 (D-028 §2): identidad de origen SIN pasar por el
// resolver (para no acoplar los tests del contrato nuevo a la forma de
// salida vieja que estan verificando que cambia).
function isScaffoldId(id) {
  try {
    const parsed = JSON.parse(id);
    return Array.isArray(parsed) && parsed.length === 7;
  } catch {
    return false;
  }
}
function scaffoldVerduraEjes(id) {
  const [, , , V, V2] = JSON.parse(id);
  return [V, V2].filter((v) => v !== null);
}
const freeformById = new Map(FREEFORM_COMBOS.map((c) => [c.identity.id, c]));

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

describe('v5 — verdura distinguible estructuralmente por origen (migrado a D-028 §2: estado/ejes -> origen/valorEfectivo)', () => {
  it('scaffold: verdura.origen="derivada" y trae valorEfectivo (array)', () => {
    for (const v of porOrigen('scaffold')) {
      expect(v.verdura.origen).toBe('derivada');
      expect(Array.isArray(v.verdura.valorEfectivo)).toBe(true);
    }
  });

  it('freeform: verdura.origen="desconocida" y NO trae campo valorEfectivo', () => {
    for (const v of porOrigen('freeform')) {
      expect(v.verdura.origen).toBe('desconocida');
      expect(Object.prototype.hasOwnProperty.call(v.verdura, 'valorEfectivo')).toBe(false);
    }
  });

  it('ejesVerdura(vista) devuelve el array para scaffold', () => {
    const vista = porOrigen('scaffold')[0];
    expect(ejesVerdura(vista)).toBe(vista.verdura.valorEfectivo);
  });

  it('ejesVerdura(vista) LANZA para freeform (desconocida != sin verdura)', () => {
    const vista = porOrigen('freeform')[0];
    expect(() => ejesVerdura(vista)).toThrow(/desconocida/);
  });
});

describe('r4 — CONTROL NEGATIVO: el patron ingenuo de consumidor lanza, nunca devuelve [] ni 0 (migrado: .ejes -> .valorEfectivo)', () => {
  it('pedir .valorEfectivo directamente sobre una vista desconocida es undefined, no []', () => {
    const vista = porOrigen('freeform')[0];
    expect(vista.verdura.valorEfectivo).toBeUndefined();
  });

  it('contar longitud (.valorEfectivo.length) sobre una vista desconocida LANZA, nunca da 0', () => {
    const vista = porOrigen('freeform')[0];
    expect(() => vista.verdura.valorEfectivo.length).toThrow(TypeError);
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
    expect(() => { vista.verdura.origen = 'mutado'; }).toThrow(TypeError);
  });

  it('mutar el array anidado de valorEfectivo lanza', () => {
    const vista = porOrigen('scaffold').find((v) => v.verdura.valorEfectivo.length > 0);
    expect(vista).toBeDefined();
    expect(() => { vista.verdura.valorEfectivo.push('intruso'); }).toThrow(TypeError);
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
describe('g1 — scaffold (178): containsGluten/containsLactosa origen "desconocida" explicito, sin clave "valorEfectivo" (migrado a D-028 §2)', () => {
  it('los 178 scaffold resuelven origen="desconocida" en ambos campos', () => {
    const scaffold = porOrigen('scaffold');
    expect(scaffold).toHaveLength(178);
    for (const v of scaffold) {
      expect(v.containsGluten.origen).toBe('desconocida');
      expect(v.containsLactosa.origen).toBe('desconocida');
    }
  });

  it('ninguno de los 178 tiene la clave "valorEfectivo" en containsGluten/containsLactosa', () => {
    for (const v of porOrigen('scaffold')) {
      expect('valorEfectivo' in v.containsGluten).toBe(false);
      expect('valorEfectivo' in v.containsLactosa).toBe(false);
    }
  });
});

describe('g2 — freeform (63): containsGluten/containsLactosa declarado, valorEfectivo boolean (migrado a D-028 §2)', () => {
  it('los 63 freeform resuelven origen="derivada" y valorEfectivo boolean en ambos campos', () => {
    const freeform = porOrigen('freeform');
    expect(freeform).toHaveLength(63);
    for (const v of freeform) {
      expect(v.containsGluten.origen).toBe('derivada');
      expect(typeof v.containsGluten.valorEfectivo).toBe('boolean');
      expect(v.containsLactosa.origen).toBe('derivada');
      expect(typeof v.containsLactosa.valorEfectivo).toBe('boolean');
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
describe('g3 — no-uniformidad: containsGluten/containsLactosa no son un default disfrazado (migrado: .valor -> .valorEfectivo)', () => {
  it('entre los 63 freeform hay al menos un true y un false en containsGluten', () => {
    const valores = porOrigen('freeform').map((v) => v.containsGluten.valorEfectivo);
    expect(valores).toContain(true);
    expect(valores).toContain(false);
  });

  it('entre los 63 freeform hay al menos un true y un false en containsLactosa', () => {
    const valores = porOrigen('freeform').map((v) => v.containsLactosa.valorEfectivo);
    expect(valores).toContain(true);
    expect(valores).toContain(false);
  });
});

// g4 RETIRADO en S2 Fase 3: su sucesor directo ya existe mas abajo, T3 [I1]
// (declarado como tal desde Fase 2: "sucesor directo de g4"). g4 migrado
// seria una duplicacion literal de T3 (misma igualdad booleana 'valorEfectivo'
// in campo === origen !== 'desconocida', sobre las mismas 241 vistas). No es
// una expectativa ajustada para pasar: es la sucesion ya prevista, ejecutada.

// ═══════════════════════════════════════════════════════════════════════
// EDITORIAL-S2 (D-028 §2, DECISIONS.md:1185-1186) — migracion del contrato
// del resolver. Estos controles se escriben ANTES de tocar produccion
// (Fase 2, rojo demostrado) contra el shape NUEVO uniforme:
//   { origen: 'confirmada'|'derivada'|'desconocida', valorEfectivo?, valorDerivado? }
// Todos deben fallar sobre HEAD (shape viejo {estado,valor|ejes}) y pasar
// tras la migracion de Fase 3.
// ═══════════════════════════════════════════════════════════════════════

describe('S2 — T1 [C2] identidad sin fuente: mismo contenido semantico que HEAD, shape nuevo', () => {
  it('sin fuente inyectada, gluten/lactosa/verdura de las 241 vistas reproducen el contenido de HEAD bajo {origen, valorEfectivo}', () => {
    for (const dish of catalog) {
      const vista = resolveDishComposition(dish);
      if (isScaffoldId(dish.id)) {
        expect(vista.containsGluten).toEqual({ origen: 'desconocida' });
        expect(vista.containsLactosa).toEqual({ origen: 'desconocida' });
        expect(vista.verdura).toEqual({ origen: 'derivada', valorEfectivo: scaffoldVerduraEjes(dish.id) });
      } else {
        const combo = freeformById.get(dish.id);
        expect(vista.containsGluten).toEqual({ origen: 'derivada', valorEfectivo: combo.identity.containsGluten });
        expect(vista.containsLactosa).toEqual({ origen: 'derivada', valorEfectivo: combo.identity.containsLactosa });
        expect(vista.verdura).toEqual({ origen: 'desconocida' });
      }
    }
  });

  it('discriminabilidad: una entrada en una fuente inyectada SI cambia la salida frente al mismo dish sin fuente', () => {
    const dish = catalog.find((d) => isScaffoldId(d.id));
    const sinFuente = resolveDishComposition(dish);
    const fuenteEditorial = {
      version: 1,
      confirmed: { [dish.id]: { gluten: { valor: true, por: 'test-T1', fecha: '2026-01-01' } } },
    };
    const conFuente = resolveDishComposition(dish, { fuenteEditorial });
    expect(conFuente.containsGluten).not.toEqual(sinFuente.containsGluten);
    expect(conFuente.containsGluten).toEqual({ origen: 'confirmada', valorEfectivo: true });
  });
});

describe('S2 — T2 [C8] el resolver no hace I/O propio', () => {
  it('compositionResolver.js no importa node:fs ni node:path (inspeccion estatica del modulo fuente)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../compositionResolver.js'), 'utf8');
    expect(src).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(src).not.toMatch(/from\s+['"]node:path['"]/);
    expect(src).not.toMatch(/require\(\s*['"]fs['"]\s*\)/);
    expect(src).not.toMatch(/require\(\s*['"]path['"]\s*\)/);
  });
});

describe('S2 — T3 [I1] presencia de valorEfectivo — sucesor directo de g4', () => {
  it('valorEfectivo presente SOLO cuando origen !== "desconocida", para las 241 vistas (gluten/lactosa/verdura)', () => {
    for (const v of vistas) {
      expect('valorEfectivo' in v.containsGluten).toBe(v.containsGluten.origen !== 'desconocida');
      expect('valorEfectivo' in v.containsLactosa).toBe(v.containsLactosa.origen !== 'desconocida');
      expect('valorEfectivo' in v.verdura).toBe(v.verdura.origen !== 'desconocida');
    }
  });
  // NOTA: no se añade un segundo "it" negativo separado -- la igualdad
  // booleana de arriba ('valorEfectivo' in campo) === (origen !== 'desconocida')
  // YA cubre la direccion negativa (cuando origen="desconocida", el lado
  // derecho es false, así que exige 'valorEfectivo' ausente). Una version
  // anterior de este control tenía un segundo "it" que filtraba por
  // `v.containsGluten.origen === 'desconocida'` -- sobre HEAD (shape viejo,
  // sin campo "origen") ese filtro nunca es cierto, así que el "it" pasaba
  // en verde SIN ejecutar ninguna aserción real (control que no discrimina,
  // detectado y retirado antes de STOP #2).
});

describe('S2 — T4 [confirmacion + precedencia + fuera de ambito, UN SOLO FIXTURE sintetico]', () => {
  // Fase 0-bis establecio como PROPIEDAD (no coincidencia del catalogo real)
  // que ambito y derivabilidad son complementarios (compositionResolver.js
  // no ramifica sobre el dato, solo sobre el origen) -- por eso "confirmacion
  // fuera de ambito" y "confirmacion que sobreescribe una derivacion" son la
  // MISMA situacion estructural, cubierta por un unico fixture con dos
  // platos reales (uno scaffold, uno freeform).
  const SCAFFOLD_ID = '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]';
  const FREEFORM_ID = 'gazpacho_huevo_atun';

  const fuenteEditorial = {
    version: 1,
    confirmed: {
      [SCAFFOLD_ID]: { gluten: { valor: true, por: 'test-T4', fecha: '2026-01-01' } },
      [FREEFORM_ID]: { gluten: { valor: false, por: 'test-T4', fecha: '2026-01-01' } },
    },
  };

  it('(a) confirmacion sobre eje DESCONOCIDO (scaffold+gluten): origen=confirmada, valorEfectivo, SIN valorDerivado', () => {
    const dish = catalog.find((d) => d.id === SCAFFOLD_ID);
    expect(dish).toBeDefined();
    const vista = resolveDishComposition(dish, { fuenteEditorial });
    expect(vista.containsGluten).toEqual({ origen: 'confirmada', valorEfectivo: true });
    expect('valorDerivado' in vista.containsGluten).toBe(false);
  });

  it('(b) confirmacion sobre eje DERIVADO y CONTRADICTORIA (freeform+gluten): origen=confirmada, valorEfectivo=confirmado, valorDerivado=el valor sobreescrito [I2]', () => {
    const dish = catalog.find((d) => d.id === FREEFORM_ID);
    expect(dish).toBeDefined();
    const combo = freeformById.get(FREEFORM_ID);
    // control: la derivacion cruda de este plato es "true" -- asi la
    // confirmacion sintetica (false) es efectivamente contradictoria.
    expect(combo.identity.containsGluten).toBe(true);

    const vista = resolveDishComposition(dish, { fuenteEditorial });
    expect(vista.containsGluten).toEqual({ origen: 'confirmada', valorEfectivo: false, valorDerivado: true });
  });
});

describe('S2 — T5(F.2) ejesVerdura es ACCESSOR: no lanza sobre confirmada, devuelve valorEfectivo', () => {
  // Doctrina Fork F.2 (ratificada): un accessor del dato (valorEfectivo) no
  // inspecciona el metadato (origen) para decidir si devuelve el dato --
  // solo lanza cuando NO HAY dato que devolver (origen="desconocida").
  it('DEVUELVE valorEfectivo cuando origen="confirmada" (no lanza)', () => {
    const dish = catalog.find((d) => d.id === 'gazpacho_huevo_atun');
    const fuenteEditorial = {
      version: 1,
      confirmed: { [dish.id]: { verdura: { valor: ['tomate'], por: 'test-F2', fecha: '2026-01-01' } } },
    };
    const vista = resolveDishComposition(dish, { fuenteEditorial });
    expect(() => ejesVerdura(vista)).not.toThrow();
    expect(ejesVerdura(vista)).toEqual(['tomate']);
  });

  it('sigue lanzando sobre origen="desconocida" (sin fuente, freeform: verdura no declarada)', () => {
    const dish = catalog.find((d) => d.id === 'gazpacho_huevo_atun');
    const vista = resolveDishComposition(dish);
    expect(() => ejesVerdura(vista)).toThrow(/desconocida/);
  });
});

describe('S2 — 3 [verdura bajo confirmada, NO extrapolado de gluten] valorEfectivo/valorDerivado son ARRAY, no booleano', () => {
  // verdura es el UNICO eje confirmable en freeform, y su payload es un
  // array -- exactamente la rama que C.1 unifico con gluten/lactosa
  // (booleanos). Se prueban ambas subcasos de T4 pero para verdura
  // especificamente, no se asume que el array se comporta igual que el
  // booleano.
  const FREEFORM_ID = 'gazpacho_huevo_atun'; // freeform: verdura SIEMPRE desconocida sin confirmar (subcaso a)
  const SCAFFOLD_ID = '["caliente_clasico","pollo","arroz","brocoli",null,"limon_hierbas","plancha"]'; // scaffold: verdura SIEMPRE derivada (subcaso b)

  it('(a) freeform, verdura desconocida -> confirmada: origen="confirmada", valorEfectivo=array confirmado, SIN valorDerivado', () => {
    const dish = catalog.find((d) => d.id === FREEFORM_ID);
    expect(dish).toBeDefined();
    const fuenteEditorial = {
      version: 1,
      confirmed: { [FREEFORM_ID]: { verdura: { valor: ['tomate', 'zanahoria'], por: 'test-3-verdura', fecha: '2026-01-01' } } },
    };
    const vista = resolveDishComposition(dish, { fuenteEditorial });
    expect(vista.verdura).toEqual({ origen: 'confirmada', valorEfectivo: ['tomate', 'zanahoria'] });
    expect('valorDerivado' in vista.verdura).toBe(false);
  });

  it('(b) scaffold, verdura derivada -> confirmada CONTRADICTORIA: origen="confirmada", valorEfectivo=array confirmado, valorDerivado=array sobreescrito [I2]', () => {
    const dish = catalog.find((d) => d.id === SCAFFOLD_ID);
    expect(dish).toBeDefined();
    const derivadoOriginal = resolveDishComposition(dish).verdura.valorEfectivo;
    expect(derivadoOriginal).toEqual(['brocoli']); // control: la derivacion real de este plato, para que la confirmacion sea efectivamente contradictoria

    const fuenteEditorial = {
      version: 1,
      confirmed: { [SCAFFOLD_ID]: { verdura: { valor: ['zanahoria'], por: 'test-3-verdura', fecha: '2026-01-01' } } },
    };
    const vista = resolveDishComposition(dish, { fuenteEditorial });
    expect(vista.verdura).toEqual({ origen: 'confirmada', valorEfectivo: ['zanahoria'], valorDerivado: ['brocoli'] });
  });
});

describe('S2 — 3.2 [biyeccion de claves] fuenteEditorial.confirmed indexa por dish.id — cero huerfanos sobre el catalogo real', () => {
  // La clave de ESCRITURA (importCuadernoV5.js:288,297: `dishId: dish.id`,
  // `confirmed[entry.dishId] = ...`) y la clave de LECTURA del resolver
  // (`fuenteEditorial?.confirmed?.[dishId]`, ver resolveScaffoldComposition/
  // resolveFreeformComposition mas arriba en este modulo) son la MISMA
  // identidad: dish.id, sourced en ambos lados desde loadCatalog(). Nunca
  // reimplementada: dish.id nace en assemble.js:22 via comboIdentityKey()
  // (identity.js:32, importada en assemble.js:11 -- identity.js declara en
  // su banner ser "la unica implementacion de identidad de combo del
  // repo") para los 178 scaffold, y en freeformPromote.js:128 via
  // `combo.identity.id` para los 63 freeform. Este test confirma la
  // biyeccion sobre las 241 entradas reales, en ambas direcciones.
  const fuenteEditorialCompleta = {
    version: 1,
    confirmed: Object.fromEntries(catalog.map((dish) => [
      dish.id,
      isScaffoldId(dish.id)
        ? {
          gluten: { valor: true, por: 'test-biyeccion', fecha: '2026-01-01' },
          lactosa: { valor: true, por: 'test-biyeccion', fecha: '2026-01-01' },
        }
        : { verdura: { valor: ['tomate'], por: 'test-biyeccion', fecha: '2026-01-01' } },
    ])),
  };

  it('toda entrada del lateral encuentra su plato (ninguna clave huerfana, direccion lateral -> catalogo)', () => {
    const idsDelCatalogo = new Set(catalog.map((d) => d.id));
    const huerfanos = Object.keys(fuenteEditorialCompleta.confirmed).filter((id) => !idsDelCatalogo.has(id));
    expect(huerfanos).toEqual([]);
  });

  it('todo scaffold (178) encuentra su entrada de gluten y de lactosa: resuelve origen="confirmada" (direccion catalogo -> lateral)', () => {
    const scaffoldDishes = catalog.filter((d) => isScaffoldId(d.id));
    expect(scaffoldDishes).toHaveLength(178);
    const huerfanos = [];
    for (const dish of scaffoldDishes) {
      const vista = resolveDishComposition(dish, { fuenteEditorial: fuenteEditorialCompleta });
      if (vista.containsGluten.origen !== 'confirmada' || vista.containsLactosa.origen !== 'confirmada') {
        huerfanos.push(dish.id);
      }
    }
    expect(huerfanos).toEqual([]);
  });

  it('todo freeform (63) encuentra su entrada de verdura: resuelve origen="confirmada" (direccion catalogo -> lateral)', () => {
    const freeformDishes = catalog.filter((d) => !isScaffoldId(d.id));
    expect(freeformDishes).toHaveLength(63);
    const huerfanos = [];
    for (const dish of freeformDishes) {
      const vista = resolveDishComposition(dish, { fuenteEditorial: fuenteEditorialCompleta });
      if (vista.verdura.origen !== 'confirmada') huerfanos.push(dish.id);
    }
    expect(huerfanos).toEqual([]);
  });

  it('dirty: una clave del lateral desalineada (typo en un id) NO confirma el plato real -- el control SI discrimina', () => {
    const dish = catalog.find((d) => isScaffoldId(d.id));
    const fuenteConClaveRota = {
      version: 1,
      confirmed: { [`${dish.id}-typo`]: { gluten: { valor: true, por: 'x', fecha: '2026-01-01' } } },
    };
    const vista = resolveDishComposition(dish, { fuenteEditorial: fuenteConClaveRota });
    expect(vista.containsGluten.origen).toBe('desconocida'); // fallo SILENCIOSO si no se detecta -- exactamente el riesgo nombrado en 3.2
  });
});
