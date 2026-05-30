// ─── FREEFORM VALIDATION ────────────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

// ────────────────────────────────────────────────────────────────
// validateFreeFormCombo
// ────────────────────────────────────────────────────────────────
//
// Valida la estructura de un combo freeForm.
// Devuelve { valid, errors[], warnings[] }
//
// NO lanza excepciones.
// NO muta input.
//
export function validateFreeFormCombo(combo, opts) {
  opts = opts || {};
  var strict = opts.strict === true;

  var errors = [];
  var warnings = [];

  function block(code, msg) { errors.push({ code: code, msg: msg }); }
  function warn(code, msg)  { warnings.push({ code: code, msg: msg }); }

  // ── ROOT ───────────────────────────────────────────────
  if (!combo || typeof combo !== "object") {
    block("E_ROOT_NOT_OBJECT", "combo no es objeto válido");
  }
  else if (combo.freeForm !== true) {
    block("E_NOT_FREEFORM", "combo.freeForm debe ser true");
  }
  else {

    // ── IDENTITY ─────────────────────────────────────────
    var id = combo.identity;

    if (!id || typeof id !== "object") {
      block("E_IDENTITY_MISSING", "identity ausente o inválido");
    } else {
      if (!id.id || typeof id.id !== "string") {
        block("E_IDENTITY_ID", "identity.id inválido");
      }
      if (!id.title || typeof id.title !== "string") {
        block("E_IDENTITY_TITLE", "identity.title inválido");
      }
      if (!id.protein || typeof id.protein !== "string") {
        block("E_IDENTITY_PROTEIN", "identity.protein inválido");
      }
      if (!id.proteinType || typeof id.proteinType !== "string") {
        warn("W_IDENTITY_PROTEINTYPE", "proteinType recomendado");
      }
      if (!id.plateType || typeof id.plateType !== "string") {
        warn("W_IDENTITY_PLATETYPE", "plateType recomendado");
      }
      if (!Array.isArray(id.tags)) {
        warn("W_IDENTITY_TAGS", "tags debería ser array");
      }
    }

    // ── NUTRITION ────────────────────────────────────────
    var n = combo.nutrition;

    if (!n || typeof n !== "object") {
      block("E_NUTRITION_MISSING", "nutrition ausente");
    } else {
      var keys = ["baseKcal","baseP","baseF","baseC"];

      for (var ni = 0; ni < keys.length; ni++) {
        var k = keys[ni];
        if (typeof n[k] !== "number" || n[k] < 0 || !isFinite(n[k])) {
          block("E_NUTRITION_" + k.toUpperCase(), k + " inválido");
        }
      }

      if (n.energyDensity &&
          ["low","medium","high"].indexOf(n.energyDensity) < 0) {
        block("E_NUTRITION_ENERGYDENSITY", "energyDensity inválida");
      }
    }

    // ── SCALING ──────────────────────────────────────────
    var s = combo.scaling;

    if (!s || typeof s !== "object") {
      block("E_SCALING_MISSING", "scaling ausente");
    } else {
      if (!s.primario || typeof s.primario !== "string") {
        block("E_SCALING_PRIMARIO", "primario requerido");
      }

      if (s.secundario && typeof s.secundario !== "string") {
        block("E_SCALING_SECUNDARIO", "secundario inválido");
      }

      if (s.noEscalar && !Array.isArray(s.noEscalar)) {
        block("E_SCALING_NOESCALAR", "noEscalar debe ser array");
      }

      if (typeof s.minScaleFactor === "number" &&
          typeof s.maxScaleFactor === "number" &&
          s.minScaleFactor >= s.maxScaleFactor) {
        block("E_SCALING_FACTORS", "minScaleFactor < maxScaleFactor requerido");
      }
    }

    // ── BEHAVIOR ─────────────────────────────────────────
    var b = combo.behavior;

    if (!b || typeof b !== "object") {
      block("E_BEHAVIOR_MISSING", "behavior ausente");
    } else {

      if (!Array.isArray(b.slot) || b.slot.length === 0) {
        block("E_BEHAVIOR_SLOT", "slot debe ser array no vacío");
      } else {
        var validSlots = ["C","Ce","Al"];

        for (var si = 0; si < b.slot.length; si++) {
          if (validSlots.indexOf(b.slot[si]) < 0) {
            block("E_BEHAVIOR_SLOT_VAL",
              "slot inválido: " + b.slot[si]);
          }
        }
      }

      if (["diario","semanal","ocasional"]
          .indexOf(b.frecuencia) < 0) {
        block("E_BEHAVIOR_FREC", "frecuencia inválida");
      }

      if (typeof b.satietyScore !== "number" ||
          b.satietyScore < 1 || b.satietyScore > 5) {
        block("E_BEHAVIOR_SATIETY", "satietyScore 1-5 requerido");
      }

      if (["low","medium","high"]
          .indexOf(b.digestiveLoad) < 0) {
        block("E_BEHAVIOR_DIGEST", "digestiveLoad inválido");
      }

      if (b.trainingProfile &&
          typeof b.trainingProfile !== "object") {
        block("E_BEHAVIOR_TRAINING", "trainingProfile inválido");
      }

      if (typeof b.lightMealCompatible !== "undefined" &&
          typeof b.lightMealCompatible !== "boolean") {
        warn("W_BEHAVIOR_LIGHT", "lightMealCompatible debería ser boolean");
      }

      if (typeof b.avoidInAggressiveCut !== "undefined" &&
          typeof b.avoidInAggressiveCut !== "boolean") {
        warn("W_BEHAVIOR_AVOID", "avoidInAggressiveCut debería ser boolean");
      }
    }

    // ── CONTENT ──────────────────────────────────────────
    var c = combo.content;

    if (!c || typeof c !== "object") {
      block("E_CONTENT_MISSING", "content ausente");
    } else {
      if (!c.p1 || typeof c.p1 !== "string") {
        block("E_CONTENT_P1", "p1 requerido");
      }

      if (!Array.isArray(c.shopping) || c.shopping.length === 0) {
        block("E_CONTENT_SHOPPING", "shopping inválido");
      }

      if (!Array.isArray(c.recipe) || c.recipe.length === 0) {
        block("E_CONTENT_RECIPE", "recipe inválido");
      }
    }
  }

  // ── RESULTADO FINAL ───────────────────────────────────
  var valid = errors.length === 0;

  if (strict) {
    var label = (combo && combo.identity && combo.identity.id) || "<no-id>";
    if (errors.length) console.warn("[validateFreeFormCombo] BLOCK", label, errors);
    if (warnings.length) console.warn("[validateFreeFormCombo] WARN", label, warnings);
  }

  return {
    valid: valid,
    errors: errors,
    warnings: warnings
  };
}


// ────────────────────────────────────────────────────────────────
// validateFreeFormPool
// ────────────────────────────────────────────────────────────────
export function validateFreeFormPool(combos, opts) {
  opts = opts || {};

  var validCombos = [];
  var invalidCombos = [];

  var totalErrors = 0;
  var totalWarnings = 0;

  if (!Array.isArray(combos)) {
    return {
      validCombos: [],
      invalidCombos: [],
      summary: { total: 0, valid: 0, invalid: 0 }
    };
  }

  for (var i = 0; i < combos.length; i++) {
    var res = validateFreeFormCombo(combos[i], opts);

    totalErrors += res.errors.length;
    totalWarnings += res.warnings.length;

    if (res.valid) {
      validCombos.push(combos[i]);
    } else {
      invalidCombos.push({
        combo: combos[i],
        errors: res.errors,
        warnings: res.warnings
      });
    }
  }

  var summary = {
    total: combos.length,
    valid: validCombos.length,
    invalid: invalidCombos.length,
    totalErrors: totalErrors,
    totalWarnings: totalWarnings
  };

  if (opts.strict) {
    console.warn("[validateFreeFormPool] summary", summary);
  }

  return {
    validCombos: validCombos,
    invalidCombos: invalidCombos,
    summary: summary
  };
}
