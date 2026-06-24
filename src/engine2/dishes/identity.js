// Identidad de combo/plato — Fase 3, Checkpoint 2a. Identificadores ASCII.
//
// La identidad de una receta es tmpl+P+C+V+V2+S+cookM: los campos que
// describen QUE se cocina y COMO. familiar/facil/saciante/density son
// flags editoriales de scoring del motor viejo (presentacion, no
// identidad) — voltear cualquiera de ellos no debe cambiar la clave.
//
// Campos ausentes se normalizan explicitamente: undefined Y "" colapsan
// al mismo valor (null), para que un combo sin V2 (ausente del literal,
// o escrito como string vacio) no se trate como una receta distinta de
// otro combo con V2 null.
//
// Serializa como JSON.stringify de una TUPLA ORDENADA (array), no como
// concatenacion de strings con separador: no hay separador textual que
// pueda colisionar con un valor de campo — cada elemento queda delimitado
// por la propia sintaxis de JSON, no por un caracter elegido a mano.
//
// Unica implementacion de identidad de combo en el repo. Cualquier
// consumidor (tests de duales, catalogo de anclas en CP2b, script de
// frecuencia) importa esta funcion — nadie la reimplementa.

function normalizeIdentityField(value) {
  if (value === undefined || value === '') return null;
  return value;
}

/**
 * Clave de identidad de una receta: tmpl+P+C+V+V2+S+cookM.
 * @param {{tmpl?: string, P?: string, C?: string|null, V?: string, V2?: string, S?: string, cookM?: string}} combo
 * @returns {string}
 */
export function comboIdentityKey(combo) {
  return JSON.stringify([
    normalizeIdentityField(combo.tmpl),
    normalizeIdentityField(combo.P),
    normalizeIdentityField(combo.C),
    normalizeIdentityField(combo.V),
    normalizeIdentityField(combo.V2),
    normalizeIdentityField(combo.S),
    normalizeIdentityField(combo.cookM),
  ]);
}
