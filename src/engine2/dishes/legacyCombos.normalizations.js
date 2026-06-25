// Decision log de normalizaciones aplicadas en legacyCombos.data.js.
//
// legacyCombos.data.js es un SNAPSHOT NORMALIZADO del dataset legacy, no
// una copia inmutable byte a byte. La unica operacion de normalizacion
// permitida es colapsar una colision de comboIdentityKey cuyos miembros
// difieren en algun campo, eligiendo el valor coherente con el resto del
// dataset. Cada normalizacion se registra aqui con su causa, ademas del
// banner inline en legacyCombos.data.js.
//
// Prohibido bajo esta etiqueta: editar cualquier valor que NO este en
// colision de identidad, "mejorar" o reinterpretar un combo, o introducir
// campos nuevos (eso es anotacion editorial, otra capa, otro paso).

export const NORMALIZATIONS = Object.freeze([
  {
    id: 1,
    fecha: '2026-06-25',
    fase: 'Fase 2, Paso B.1 (correccion post-gate)',
    origen: 'DINNER_COMBOS_RAW',
    identityKey: '["caliente_clasico","cerdo",null,"brocoli",null,"mostaza_miel","plancha"]',
    fuenteOriginal: 'buildPlan.js:857 (density:"media") y buildPlan.js:877 (density:"baja") — 2 miembros, identicos en todo lo demas',
    campoDivergente: 'density',
    valorElegido: 'baja',
    valorDescartado: 'media',
    causa:
      'El plateType de ambos miembros es "plancha_verdura". Sobre el universo ' +
      'real de DINNER_COMBOS_RAW, ese plateType tiene density:"baja" en 25/28 ' +
      'entradas (89%); "media" es la minoria (3/28, incluyendo precisamente ' +
      'este combo y "cerdo+pimientos"). La otra entrada de cerdo en ' +
      'plancha_verdura sin colision (cerdo+acelgas) ya es "baja", lo que ' +
      'descarta una regla implicita de "cerdo siempre media" como ' +
      'justificacion del valor minoritario. Se colapsa a un unico registro ' +
      'con density:"baja", coherente con el resto del dataset para este ' +
      'plateType.',
    deteccion: 'scripts/phaseB1/collisionGate.js (Fase 2, Paso B.1, Parte 1)',
    entradasEliminadas: 1, // 2 miembros colapsados -> 1 registro: se elimina 1 entrada literal

    invarianteVerificado:
      'Tras esta normalizacion, los snapshots dorados post-Fase-1 siguen ' +
      'identicos byte a byte (hash SHA-256 verificado en ' +
      'legacyCombos.normalization.test.js) — legacyCombos.data.js no es ' +
      'importado por buildPlan.js ni por la suite que genera esos snapshots.',
  },
]);
