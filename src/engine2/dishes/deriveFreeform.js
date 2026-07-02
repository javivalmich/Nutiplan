// Derivaciones especificas para freeform — Fase 2, Paso C (integracion
// estructural de FREEFORM_COMBOS, diferida desde D-007). Sibling de
// derive.js (derivaciones del scaffold legacy): mismo contrato de salida,
// estructuras de entrada distintas. NO modifica derive.js — deriveTempFeelEngine2
// y deriveMomento siguen intactas para el scaffold. Ver CLAUDE.md, Decision F.
//
// engine2 NUNCA importa src/engine/buildPlan.js (regla de aislamiento).

import { MOMENTOS } from './schema.js';

/**
 * Momento del dia derivado de behavior.slot del combo freeform ({"C"} ->
 * comida, {"Ce"} -> cena). NO existe equivalente a "Al" (almuerzo/merienda)
 * en el vocabulario legacy de momento: un slot "Al" no tiene mapeo y hace
 * lanzar esta funcion — es responsabilidad del promotor excluir esos
 * combos ANTES de llamarla (ver Decision A: bol_fruta_yogur).
 * @param {Array<'C'|'Ce'>} slot behavior.slot del combo freeform
 * @returns {Array<'comida'|'cena'>} subconjunto no vacio, orden canonico (MOMENTOS)
 */
export function deriveMomentoFreeform(slot) {
  if (!Array.isArray(slot) || slot.length === 0) {
    throw new Error(`deriveMomentoFreeform: slot invalido o vacio: ${JSON.stringify(slot)}`);
  }
  const SLOT_TO_MOMENTO = { C: 'comida', Ce: 'cena' };
  const momentoSet = new Set();
  for (const s of slot) {
    const m = SLOT_TO_MOMENTO[s];
    if (!m) {
      throw new Error(
        `deriveMomentoFreeform: slot "${s}" sin equivalente en el vocabulario legacy de momento ` +
        '(solo "C"/"Ce" admitidos; "Al" no tiene mapeo — el combo debia excluirse antes de llegar aqui).'
      );
    }
    momentoSet.add(m);
  }
  return MOMENTOS.filter((m) => momentoSet.has(m));
}

// F.1 — derivacion determinista por plateType FINAL (tras remapeos D-011).
// Vocabulario cerrado: cualquier plateType fuera de esta tabla Y fuera de
// OVERRIDE_REQUIRED_PLATE_TYPES lanza (sin valor por defecto).
const GENERAL_TEMPFEEL_RULES = Object.freeze({
  crudo: 'frio',
  ensalada: 'frio',
  guiso: 'muy_caliente',
  legumbre: 'muy_caliente',
  airfryer: 'caliente',
  arroz_plato: 'caliente',
  bocado_mano: 'caliente',
  en_salsa: 'caliente',
  gratinado: 'caliente',
  masa: 'caliente',
  pasta: 'caliente',
  caliente_patata: 'caliente',
  pescado_plancha: 'caliente',
  plancha_verdura: 'caliente',
  salteado_wok: 'caliente',
});

// F.2 — estas categorias NUNCA usan la derivacion general: su tempFeel sale
// EXCLUSIVAMENTE de FREEFORM_TEMPFEEL_OVERRIDES. Sin entrada -> LANZA.
const OVERRIDE_REQUIRED_PLATE_TYPES = Object.freeze(new Set(['sopa_crema', 'bowl', 'tortilla']));

// ANEXO — overrides ratificados por Javi (sesion 2026-07-02), por
// identity.id. 18 entradas: 9 sopa_crema + 5 bowl + 3 tortilla (las 17
// categoricamente obligatorias de F.2) + 1 excepcion F.3
// (ensalada_lentejas_feta, plateType "ensalada" — la derivacion general
// daria "frio", incorrecto para una ensalada TIBIA).
//
// bibimbap_ternera_huevo: ausente en la ratificacion original de sesion
// (el ANEXO se construyo sobre el plateType LIBRE del xlsx, "bibimbap";
// F.2 exige aplicar el override sobre el plateType FINAL post-remapeo
// D-011, "bowl"). Gap detectado por el tripwire de este mismo checkpoint
// (falla si una categoria obligatoria no tiene entrada) y corregido por
// Javi tras el aviso — ver DECISIONS.md D-010.
export const FREEFORM_TEMPFEEL_OVERRIDES = Object.freeze({
  gazpacho_huevo_atun: { tempFeel: 'frio', pendienteCocinero: false },
  caldo_gallego_grelos_completo: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  caldo_gallego_grelos_ligero: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  caldo_gallego_repollo_completo: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  ramen_simplificado: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  sopa_castellana_jamon: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  tom_kha_gai: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  crema_calabacin_queso_huevo: { tempFeel: 'caliente', pendienteCocinero: true },
  sopa_miso_tofu: { tempFeel: 'caliente', pendienteCocinero: true },
  bowl_salmon_teriyaki: { tempFeel: 'caliente', pendienteCocinero: false },
  falafel_tabule_yogur: { tempFeel: 'frio', pendienteCocinero: false },
  hummus_pita_pollo: { tempFeel: 'caliente', pendienteCocinero: true },
  buddha_bowl_completo: { tempFeel: 'frio', pendienteCocinero: true },
  shakshuka: { tempFeel: 'muy_caliente', pendienteCocinero: false },
  tortilla_patatas_completa: { tempFeel: 'caliente', pendienteCocinero: true },
  huevos_rellenos: { tempFeel: 'frio', pendienteCocinero: false },
  ensalada_lentejas_feta: { tempFeel: 'caliente', pendienteCocinero: true },
  bibimbap_ternera_huevo: { tempFeel: 'caliente', pendienteCocinero: false },
});

/**
 * tempFeel para un plato freeform. F.3: consulta PRIMERO
 * FREEFORM_TEMPFEEL_OVERRIDES (por identity.id), para CUALQUIER plateType
 * (no solo los tres de F.2) — solo si no hay entrada aplica la derivacion
 * determinista (F.1). Si el plateType pertenece a OVERRIDE_REQUIRED_PLATE_TYPES
 * y no hay override, o si no hay regla F.1 ni override: LANZA (sin default).
 * @param {string} plateType plateType FINAL (post-remapeos D-011)
 * @param {string} identityId identity.id del combo freeform
 * @returns {'frio'|'caliente'|'muy_caliente'}
 */
export function deriveTempFeelFreeform(plateType, identityId) {
  const override = FREEFORM_TEMPFEEL_OVERRIDES[identityId];
  if (override) return override.tempFeel;

  if (OVERRIDE_REQUIRED_PLATE_TYPES.has(plateType)) {
    throw new Error(
      `deriveTempFeelFreeform: plateType "${plateType}" (id=${identityId}) exige entrada en ` +
      'FREEFORM_TEMPFEEL_OVERRIDES (F.2) y no la tiene. No existe valor por defecto.'
    );
  }

  const general = GENERAL_TEMPFEEL_RULES[plateType];
  if (!general) {
    throw new Error(
      `deriveTempFeelFreeform: plateType "${plateType}" (id=${identityId}) no tiene regla F.1 ` +
      'ni entrada en FREEFORM_TEMPFEEL_OVERRIDES.'
    );
  }
  return general;
}
