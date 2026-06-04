import {
  FREEFORM_COMBOS,
  loadFreeFormCombos
} from "./FREEFORM_COMBOS";
import {
  validateFreeFormPool,
} from "../engine/index.js";

var FREEFORM_POOL_RESULT = loadFreeFormCombos(
  FREEFORM_COMBOS,
  validateFreeFormPool,
  { strict: true, healthRatioMin: 0.8 }
);

export var FREEFORM_POOL = FREEFORM_POOL_RESULT.pool;
