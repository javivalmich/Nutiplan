/**
 * PDB PUBLIC CONTRACT — CHARACTERIZATION TESTS
 *
 * Estas pruebas caracterizan el comportamiento observable ACTUAL de los
 * contratos públicos de PDB y de la función pura _sbToLocalPlan.
 * No son especificaciones normativas — documentan lo que el código hace.
 * Si un comportamiento parece extraño, el test lo refleja igualmente.
 *
 * ENTORNO: node (vite.config.js:8 — environment: 'node')
 *   • localStorage: mock in-memory local a este archivo
 *   • BroadcastChannel: nativo en Node ≥ 15.4; v24 en uso — no requiere stub
 *   • window: undefined en Node; db.js/runtime.js lo detectan con guards
 *   • SyncEngine.init(): retorna inmediatamente (guard window===undefined)
 *   • SDB._token: null — _drain() no procesa la cola (guard !SDB._token)
 *
 * INVARIANTE: ningún archivo de producción fue modificado para estos tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PDB, saveData } from '../db.js';
import { _sbToLocalPlan } from '../sdb.js';

// ── Mock local de localStorage ────────────────────────────────────────────────
// Asignado a globalThis para que el identificador desnudo `localStorage` en
// db.js resuelva al mock durante la ejecución de los tests.
// Se renueva en cada test para garantizar aislamiento total.
function makeMockLocalStorage() {
  const store = new Map();
  return {
    getItem(k)  { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear()     { store.clear(); },
    // helper de test: lista las claves actuales del store
    keys()      { return [...store.keys()]; },
  };
}

let _ls;
beforeEach(() => {
  _ls = makeMockLocalStorage();
  globalThis.localStorage = _ls;
});
afterEach(() => {
  // Borrar completamente la propiedad para que el siguiente beforeEach
  // empiece desde un estado limpio (ReferenceError capturado por try/catch).
  delete globalThis.localStorage;
});

// ── UIDs y datos de referencia ────────────────────────────────────────────────
const UID = 'test-uid-001';
const PROFILE = {
  gender: 'male', age: 30, weight: 75, height: 178,
  activity: 'moderate', goal: 'maintain',
  intolerances: [], eliminatedFoods: [], trainingDays: [],
};
const PLAN_BASE = {
  created_by: 'system', strategy: 'mantenimiento_equilibrado',
  calories: 2000, days: [], weekNum: 1, extras: {},
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. getClientProfile
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDB.getClientProfile', () => {
  it('devuelve null cuando la clave pf_profile_<cid> está ausente', () => {
    expect(PDB.getClientProfile(UID)).toBeNull();
  });

  it('devuelve el perfil guardado por saveData con los campos originales', () => {
    // saveData escribe bajo "pf_profile_<uid>" — la misma clave que lee getClientProfile
    saveData(UID, PROFILE, null, 1, {});
    const result = PDB.getClientProfile(UID);
    expect(result).not.toBeNull();
    expect(result.gender).toBe('male');
    expect(result.weight).toBe(75);
    expect(result.goal).toBe('maintain');
    expect(result.intolerances).toEqual([]);
  });

  it('CARACTERIZACIÓN: saveData añade updatedAt (timestamp) al objeto guardado', () => {
    // saveData hace {...profile, updatedAt:Date.now()} — el campo aparece en la lectura
    saveData(UID, PROFILE, null, 1, {});
    const result = PDB.getClientProfile(UID);
    expect(typeof result.updatedAt).toBe('number');
    expect(result.updatedAt).toBeGreaterThan(0);
  });

  it('UID distintos no interfieren entre sí', () => {
    saveData('uid-a', { ...PROFILE, weight: 60 }, null, 1, {});
    saveData('uid-b', { ...PROFILE, weight: 90 }, null, 1, {});
    expect(PDB.getClientProfile('uid-a').weight).toBe(60);
    expect(PDB.getClientProfile('uid-b').weight).toBe(90);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. getInvitations — sin datos
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDB.getInvitations — sin datos en storage', () => {
  it('CARACTERIZACIÓN: devuelve [] (no null) cuando la clave pf_invitations está ausente', () => {
    // _g devuelve null; el || [] de getInvitations lo convierte en array vacío
    const result = PDB.getInvitations();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. saveInvitations + getInvitations — round-trip
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDB.saveInvitations / PDB.getInvitations', () => {
  const INV_A = {
    token: 'ABC123', ownerUid: UID, planId: 'plan-x',
    usedBy: null, usedAt: null, expiresAt: Date.now() + 86400000, createdAt: Date.now(),
  };

  it('round-trip básico: lo guardado se recupera', () => {
    PDB.saveInvitations([INV_A]);
    const result = PDB.getInvitations();
    expect(result).toHaveLength(1);
    expect(result[0].token).toBe('ABC123');
    expect(result[0].ownerUid).toBe(UID);
    expect(result[0].planId).toBe('plan-x');
    expect(result[0].usedBy).toBeNull();
  });

  it('round-trip con array vacío: [] se recupera como []', () => {
    PDB.saveInvitations([]);
    expect(PDB.getInvitations()).toEqual([]);
  });

  it('segunda escritura sobrescribe la primera (no acumula)', () => {
    PDB.saveInvitations([{ token: 'FIRST1' }]);
    PDB.saveInvitations([{ token: 'SECND2' }, { token: 'THIRD3' }]);
    const result = PDB.getInvitations();
    expect(result).toHaveLength(2);
    expect(result[0].token).toBe('SECND2');
    expect(result[1].token).toBe('THIRD3');
  });

  it('múltiples invitaciones preservan el orden de inserción', () => {
    const tokens = ['AAA111', 'BBB222', 'CCC333'];
    PDB.saveInvitations(tokens.map(t => ({ token: t })));
    const result = PDB.getInvitations();
    expect(result.map(i => i.token)).toEqual(tokens);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. getPlans + getActivePlan
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDB.getPlans / PDB.getActivePlan', () => {
  it('getPlans devuelve [] cuando no hay planes para el uid', () => {
    expect(PDB.getPlans(UID)).toEqual([]);
  });

  it('getActivePlan devuelve null cuando no hay planes para el uid', () => {
    expect(PDB.getActivePlan(UID)).toBeNull();
  });

  it('addPlan → getPlans devuelve el plan con is_active:true', () => {
    const added = PDB.addPlan(UID, PLAN_BASE);
    const plans = PDB.getPlans(UID);
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe(added.id);
    expect(plans[0].is_active).toBe(true);
  });

  it('addPlan → getActivePlan devuelve el plan activo', () => {
    const added = PDB.addPlan(UID, PLAN_BASE);
    const active = PDB.getActivePlan(UID);
    expect(active).not.toBeNull();
    expect(active.id).toBe(added.id);
    expect(active.is_active).toBe(true);
  });

  it('CARACTERIZACIÓN: addPlan desactiva planes anteriores (is_active:false)', () => {
    const first = PDB.addPlan(UID, { ...PLAN_BASE, strategy: 'primero' });
    const second = PDB.addPlan(UID, { ...PLAN_BASE, strategy: 'segundo' });
    const plans = PDB.getPlans(UID);
    expect(plans).toHaveLength(2);
    const firstStored = plans.find(p => p.id === first.id);
    const secondStored = plans.find(p => p.id === second.id);
    expect(firstStored.is_active).toBe(false);
    expect(secondStored.is_active).toBe(true);
    expect(PDB.getActivePlan(UID).id).toBe(second.id);
  });

  it('UIDs distintos tienen planes separados', () => {
    PDB.addPlan('uid-x', PLAN_BASE);
    expect(PDB.getPlans('uid-y')).toEqual([]);
    expect(PDB.getActivePlan('uid-y')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. clearPlans
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDB.clearPlans', () => {
  it('clearPlans → getPlans devuelve []', () => {
    PDB.addPlan(UID, PLAN_BASE);
    expect(PDB.getPlans(UID)).toHaveLength(1);
    PDB.clearPlans(UID);
    expect(PDB.getPlans(UID)).toEqual([]);
  });

  it('clearPlans → getActivePlan devuelve null', () => {
    PDB.addPlan(UID, PLAN_BASE);
    expect(PDB.getActivePlan(UID)).not.toBeNull();
    PDB.clearPlans(UID);
    expect(PDB.getActivePlan(UID)).toBeNull();
  });

  it('clearPlans sobre uid sin planes no lanza error', () => {
    expect(() => PDB.clearPlans('uid-sin-planes')).not.toThrow();
  });

  it('clearPlans sobre uid sin planes deja getPlans devolviendo []', () => {
    PDB.clearPlans('uid-sin-planes');
    expect(PDB.getPlans('uid-sin-planes')).toEqual([]);
  });

  it('clearPlans no afecta planes de otro uid', () => {
    PDB.addPlan('uid-a', PLAN_BASE);
    PDB.addPlan('uid-b', PLAN_BASE);
    PDB.clearPlans('uid-a');
    expect(PDB.getActivePlan('uid-a')).toBeNull();
    expect(PDB.getActivePlan('uid-b')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. dato corrupto en localStorage
// ═══════════════════════════════════════════════════════════════════════════════
describe('comportamiento ante dato corrupto en localStorage', () => {
  it('getInvitations devuelve [] con JSON inválido', () => {
    _ls.setItem('pf_invitations', '{invalid json[[');
    // CARACTERIZACIÓN: _g atrapa SyntaxError, devuelve null → || [] → []
    const result = PDB.getInvitations();
    expect(result).toEqual([]);
  });

  it('CARACTERIZACIÓN: la clave corrupta es eliminada del storage', () => {
    _ls.setItem('pf_invitations', '{invalid json[[');
    PDB.getInvitations(); // dispara _g → cuarentena
    expect(_ls.getItem('pf_invitations')).toBeNull();
  });

  it('CARACTERIZACIÓN: _g crea una clave de cuarentena con el contenido original', () => {
    const corruptValue = '{invalid json[[';
    _ls.setItem('pf_invitations', corruptValue);
    PDB.getInvitations(); // dispara _g → cuarentena
    const quarantineKeys = _ls.keys().filter(k => k.startsWith('pf_invitations_corrupt_'));
    expect(quarantineKeys).toHaveLength(1);
    expect(_ls.getItem(quarantineKeys[0])).toBe(corruptValue);
  });

  it('getClientProfile devuelve null con JSON corrupto', () => {
    _ls.setItem('pf_profile_' + UID, 'not-json-at-all');
    expect(PDB.getClientProfile(UID)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. _sbToLocalPlan — función pura de sdb.js
//
// Puertas de alcance verificadas:
//   • Exportada: YES (export function _sbToLocalPlan)
//   • Pura: YES — sin efectos secundarios
//   • Sin red: YES — no llama a fetch/_rest
//   • Sin inicialización externa: YES
// ═══════════════════════════════════════════════════════════════════════════════
describe('_sbToLocalPlan', () => {
  const BASE_ROW = {
    id:              'plan-sb-001',
    uid:             'user-sb-001',
    is_active:       true,
    created_by:      'nutritionist',
    nutritionist_id: 'nutri-001',
    strategy:        'definicion_flexible',
    calories:        2200,
    profile_data:    { gender: 'female', age: 28 },
    days:            [{ slot: 'desayuno', name: 'Avena con fruta' }],
    week_num:        22,
    extras:          { foo: 'bar' },
    week_warnings:   ['Pocas verduras'],
    week_score:      85,
    created_at:      1700000000000,
    updated_at:      1700000001000,
  };

  it('mapea id, uid, is_active, created_by, nutritionist_id', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.id).toBe('plan-sb-001');
    expect(r.uid).toBe('user-sb-001');
    expect(r.is_active).toBe(true);
    expect(r.created_by).toBe('nutritionist');
    expect(r.nutritionist_id).toBe('nutri-001');
  });

  it('mapea strategy, calories, week_warnings, week_score', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.strategy).toBe('definicion_flexible');
    expect(r.calories).toBe(2200);
    expect(r.weekWarnings).toEqual(['Pocas verduras']);
    expect(r.weekScore).toBe(85);
  });

  it('profile_data → profile (renombrado); campo profile_data ausente del resultado', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.profile).toEqual({ gender: 'female', age: 28 });
    expect(r).not.toHaveProperty('profile_data');
  });

  it('week_num → weekNum (renombrado)', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.weekNum).toBe(22);
    expect(r).not.toHaveProperty('week_num');
  });

  it('created_at numérico permanece numérico sin conversión', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.created_at).toBe(1700000000000);
  });

  it('updated_at numérico permanece numérico sin conversión', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.updated_at).toBe(1700000001000);
  });

  it('created_at string ISO se convierte a milisegundos (número)', () => {
    const iso = '2023-11-14T22:13:20.000Z';
    const row = { ...BASE_ROW, created_at: iso, updated_at: iso };
    const r = _sbToLocalPlan(row);
    expect(typeof r.created_at).toBe('number');
    expect(r.created_at).toBe(new Date(iso).getTime());
  });

  it('CARACTERIZACIÓN: days ausente (undefined) → []', () => {
    const row = { ...BASE_ROW, days: undefined };
    const r = _sbToLocalPlan(row);
    // days || [] — undefined es falsy → []
    expect(r.days).toEqual([]);
  });

  it('CARACTERIZACIÓN: extras ausente (undefined) → {}', () => {
    const row = { ...BASE_ROW, extras: undefined };
    const r = _sbToLocalPlan(row);
    // extras || {} — undefined es falsy → {}
    expect(r.extras).toEqual({});
  });

  it('CARACTERIZACIÓN: week_score null → null (null coalescing preserva null)', () => {
    const row = { ...BASE_ROW, week_score: null };
    const r = _sbToLocalPlan(row);
    // week_score ?? null — null coalescing: null no es sustituido
    expect(r.weekScore).toBeNull();
  });

  it('CARACTERIZACIÓN: week_score 0 → 0 (null coalescing preserva 0)', () => {
    const row = { ...BASE_ROW, week_score: 0 };
    const r = _sbToLocalPlan(row);
    // week_score ?? null — 0 no es null/undefined, se preserva
    expect(r.weekScore).toBe(0);
  });

  it('CARACTERIZACIÓN: week_score undefined → null', () => {
    const row = { ...BASE_ROW, week_score: undefined };
    const r = _sbToLocalPlan(row);
    // undefined ?? null → null
    expect(r.weekScore).toBeNull();
  });

  it('days preserva los elementos del array original', () => {
    const r = _sbToLocalPlan(BASE_ROW);
    expect(r.days).toHaveLength(1);
    expect(r.days[0].slot).toBe('desayuno');
    expect(r.days[0].name).toBe('Avena con fruta');
  });
});
