/* ────────────────────────────────────────────────────────────────
 * FREEFORM_COMBOS.js — Dataset v3.2
 * ────────────────────────────────────────────────────────────────
 * v3.2 — Tanda 4.6: +15 platos (españoles, mediterráneos, asiáticos)
 *         Total: 64 combos. Nuevos campos en identity:
 *           containsGluten:  boolean
 *           containsLactosa: boolean
 *         (Pendiente auditar los 49 combos v3.1 en tanda posterior)
 * ────────────────────────────────────────────────────────────────
 *
 * Combos declarativos freeForm (NO generados por motor P+C+V+S).
 * Cada entrada es un objeto completo con bloques semánticos.
 *
 * Este archivo es DATA ONLY.
 * No contiene lógica de negocio del sistema principal.
 *
 * ────────────────────────────────────────────────────────────────
 * SCHEMA CANÓNICO v3.1 (OBLIGATORIO)
 * ────────────────────────────────────────────────────────────────
 *
 * {
 *   freeForm: true,
 *
 *   identity: {
 *     id: "snake_case_unique_id",
 *     title: "Nombre visible",
 *     emoji: "🥘",
 *     protein: "pollo|salmon|gambas|lentejas|...",
 *     // identity.protein representa el eje semántico principal
 *     // del plato (exclusión/regeneración), NO necesariamente
 *     // la proteína nutricional dominante.
 *     proteinType: "ave|pescado|marisco|legumbre|carne|huevo|vegetal|cereal",
 *     // proteinType representa el ancla culinaria estructural
 *     // primaria del plato (identidad culinaria),
 *     // NO la proteína dominante por gramos.
 *     //
 *     // VOCABULARIO CERRADO:
 *     //   ave | pescado | marisco | legumbre | carne | huevo | vegetal | cereal
 *     //
 *     // "cereal" se usa cuando masa/pasta/fideo/arroz define
 *     // la identidad del plato (gnocchi, gyozas, risotto, pad thai,
 *     // ramen, pizza, carbonara, alla norma, sorrentina).
 *     // NO usar "cereal" cuando el cereal es vehículo (hamburguesa,
 *     // burrito, tostada).
 *
 * ──── REGLA CANÓNICA multi_fuente (v1.2) ────
 *
 * Tag "multi_fuente" se aplica SOLO si existen ≥2 ingredientes
 * proteicos OBLIGATORIOS en la forma canónica del plato Y con
 * roles culinarios DISTINTOS entre sí.
 *
 * Roles culinarios (vocabulario cerrado):
 *   base | matriz | relleno | topping | emulsion | fundente | sazonador
 *
 * Cuando un combo lleva tag "multi_fuente", debe declarar en
 * identity.multi_fuente_roles[] los dos roles distintos que lo
 * justifican. Ejemplo:
 *   identity: {
 *     ...
 *     tags: [..., "multi_fuente"],
 *     multi_fuente_roles: ["matriz", "topping"]
 *   }
 *
 * NO se aplica multi_fuente cuando los ingredientes proteicos
 * obligatorios cumplen el MISMO rol (ej: dos toppings, dos bases).
 *     plateType: "paella|burger|wok|ensalada|sopa|...",
 *     tags: []
 *   },
 *
 *   nutrition: {
 *     baseKcal: number,
 *     baseP: number,
 *     baseF: number,
 *     baseC: number,
 *     energyDensity: "low|medium|high"
 *     // energyDensity representa densidad energética relativa
 *     // (kcal por volumen/saciedad), NO kcal absolutas.
 *   },
 *
 *   scaling: {
 *     primario: "string",
 *     secundario: null,
 *     noEscalar: [],
 *     minScaleFactor: 0.6,
 *     maxScaleFactor: 1.5
 *   },
 *
 *   behavior: {
 *     slot: ["C|Ce|Al"],
 *     frecuencia: "diario|semanal|ocasional",
 *     satietyScore: 1-5,
 *     digestiveLoad: "low|medium|high",
 *     trainingProfile: {},
 *     lightMealCompatible: false,
 *     avoidInAggressiveCut: false,
 *     tiempo: number,
 *     familiar: boolean
 *   },
 *
 *   content: {
 *     p1: string,
 *     p2: string,
 *     shopping: [],
 *     recipe: []
 *   }
 * }
 *
 * NOTA:
 * recipe es reference-only (no se reescala en v3.1)
 * ────────────────────────────────────────────────────────────────
 */

/* ────────────────────────────────────────────────────────────────
 * TANDA 4.1 — Platos Españoles Canónicos (9 combos)
 * ────────────────────────────────────────────────────────────────
 *
 * DISTRIBUCIÓN ESPERADA (BALANCE INTERNO DE LA TANDA)
 *   total:         9
 *   slot:          { C: 8, Ce: 2, Al: 0 }
 *   digestiveLoad: { low: 2, medium: 4, high: 3 }
 *   satietyScore:  { 3: 1, 4: 6, 5: 2 }
 *   frecuencia:    { diario: 0, semanal: 8, ocasional: 1 }
 *
 * NOTA plateType:
 *   caldo_gallego_grelos_completo  → plateType: "caldo_grelos"
 *   caldo_gallego_repollo_completo → plateType: "caldo_repollo"
 *   Diferenciados intencionalmente para evitar colisión
 *   en checkDuplicates() (mismo protein:"lacon").
 * ────────────────────────────────────────────────────────────────
 */

export const FREEFORM_COMBOS = [

  // ────────────────────────────────────────────────────────
  // #1 — Gazpacho con huevo duro, atún y pan
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "gazpacho_huevo_atun",
      title: "Gazpacho con huevo duro, atún y pan",
      emoji: "🍅",
      protein: "atun",
      proteinType: "pescado",
      plateType: "sopa_fria",
      tags: ["spanish", "andaluz", "frio", "verano_friendly", "pan"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 360, baseP: 20, baseF: 18, baseC: 30,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "AOVE",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: true
    },
    content: {
      p1: "Gazpacho andaluz frío · 1 huevo duro picado · atún en conserva al natural · pan tostado",
      p2: "AOVE virgen extra · vinagre de Jerez · pimiento rojo · pepino · ajo",
      shopping: [
        "Tomate maduro (500g)",
        "Pepino (1/2)", "Pimiento rojo (1/2)", "Ajo (1 diente)",
        "Pan duro (40g) + 30g para tostar",
        "Huevo (1)", "Atún al natural (60g)",
        "AOVE (15ml)", "Vinagre de Jerez", "Sal"
      ],
      recipe: [
        "Tritura tomate, pepino, pimiento, ajo, pan remojado, AOVE, vinagre y sal hasta crema fina.",
        "Cuela si quieres textura más sedosa. Enfría 2 h.",
        "Hierve el huevo 10 min, pélalo y pícalo.",
        "Sirve el gazpacho con huevo y atún encima, pan tostado a un lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #2 — Pisto manchego con huevo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pisto_manchego_huevo",
      title: "Pisto manchego con huevo a la plancha",
      emoji: "🍳",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "guiso_verduras",
      tags: ["spanish", "manchego", "verduras", "huevo"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 480, baseP: 22, baseF: 30, baseC: 35,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pan",
      secundario: "AOVE",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: false, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Pisto de calabacín, pimiento rojo, verde y cebolla con tomate triturado · 2 huevos a la plancha encima",
      p2: "Pan integral para acompañar · AOVE · ajo · sal",
      shopping: [
        "Calabacín (1)", "Pimiento rojo (1/2)", "Pimiento verde (1/2)",
        "Cebolla (1)", "Tomate triturado (200g)", "Ajo (2 dientes)",
        "Huevos (2)", "Pan integral (60g)",
        "AOVE (15ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Pica todo en dados pequeños.",
        "Pocha cebolla y ajo en AOVE 5 min. Añade pimientos 5 min más.",
        "Incorpora calabacín y tomate. Cocina 15 min a fuego medio.",
        "Aparte, haz los huevos a la plancha.",
        "Sirve el pisto con los huevos encima y pan tostado al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #3 — Cocido express
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "cocido_express",
      title: "Cocido madrileño express",
      emoji: "🥘",
      protein: "garbanzos",
      proteinType: "legumbre",
      plateType: "cocido_legumbre",
      tags: ["spanish", "madrid", "tradicional", "winter_friendly", "legumbre"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 635, baseP: 42, baseF: 22, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "garbanzos",
      secundario: "patata",
      noEscalar: ["chorizo", "lacon"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "ocasional",
      satietyScore: 5,
      digestiveLoad: "high",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 90,
      familiar: true
    },
    content: {
      p1: "Garbanzos cocidos · pechuga de pollo · lacón · chorizo dulce · zanahoria · patata",
      p2: "Caldo del cocido con fideos finos (sopa) · repollo cocido aparte",
      shopping: [
        "Garbanzos en remojo (120g secos)",
        "Pollo (100g)", "Lacón (60g)", "Chorizo dulce (40g)",
        "Zanahoria (1)", "Patata (1)", "Repollo (1/4)",
        "Fideos finos (30g)",
        "Hueso de jamón (1 trozo)", "Sal", "AOVE (10ml)"
      ],
      recipe: [
        "En olla rápida: garbanzos remojados, pollo, lacón, chorizo, hueso, agua, sal.",
        "Cuece 25 min en presión.",
        "Aparte hierve la patata, zanahoria y repollo 15 min.",
        "Cuela el caldo, hierve 5 min con los fideos para la sopa.",
        "Sirve en tres vuelcos: sopa, garbanzos+verduras, carnes."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #4 — Fabada simplificada
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "fabada_simplificada",
      title: "Fabada asturiana simplificada",
      emoji: "🫘",
      protein: "alubias",
      proteinType: "legumbre",
      plateType: "guiso_legumbre",
      tags: ["spanish", "asturiana", "tradicional", "legumbre", "winter_friendly"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 525, baseP: 34, baseF: 30, baseC: 28,
      energyDensity: "high"
    },
    scaling: {
      primario: "fabes",
      secundario: null,
      noEscalar: ["chorizo", "morcilla", "panceta"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "high",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 60,
      familiar: true
    },
    content: {
      p1: "Fabes asturianas · chorizo asturiano · morcilla asturiana · panceta · azafrán",
      p2: "Pimentón dulce · cebolla · ajo · laurel · sal",
      shopping: [
        "Fabes asturianas en remojo (100g secas)",
        "Chorizo asturiano (50g)", "Morcilla asturiana (40g)", "Panceta curada (40g)",
        "Cebolla (1/2)", "Ajo (2 dientes)",
        "Azafrán (1 pizca)", "Pimentón dulce", "Laurel (1 hoja)", "Sal"
      ],
      recipe: [
        "Pon fabes remojadas en olla con compango, cebolla y laurel.",
        "Cubre con agua fría, lleva a ebullición y espuma.",
        "Cocina a fuego muy bajo 1 h asustando con agua fría 2-3 veces.",
        "Añade azafrán y pimentón en los últimos 15 min.",
        "Reposa 10 min antes de servir."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #5 — Fideuá de marisco
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "fideua_marisco",
      title: "Fideuá de marisco",
      emoji: "🍝",
      protein: "gambas",
      proteinType: "marisco",
      plateType: "fideua",
      tags: ["spanish", "mediterranean", "marisco", "pasta"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 580, baseP: 42, baseF: 18, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "fideos",
      secundario: "AOVE",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Fideos finos tostados · gambas peladas · calamares en aros · mejillones",
      p2: "Fumet de pescado · ajo · tomate rallado · pimentón · AOVE · alioli para acompañar",
      shopping: [
        "Fideos finos (90g)",
        "Gambas peladas (100g)", "Calamares (80g)", "Mejillones (8 unidades)",
        "Tomate rallado (100g)", "Ajo (2 dientes)",
        "Fumet de pescado (400ml)", "Pimentón dulce",
        "AOVE (15ml)", "Sal", "Alioli (1 cda)"
      ],
      recipe: [
        "Tuesta los fideos en seco en la paella hasta dorar. Reserva.",
        "Sofríe ajo, añade tomate y pimentón.",
        "Incorpora fideos y fumet hirviendo (2x volumen).",
        "Cocina 5 min, añade calamares y mejillones.",
        "A los 3 min añade gambas. Termina 2 min más.",
        "Reposa 3 min. Sirve con alioli."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #6 — Papas arrugadas con mojo y pollo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "papas_mojo_pollo",
      title: "Papas arrugadas con mojo rojo y pollo a la plancha",
      emoji: "🥔",
      protein: "pollo",
      proteinType: "ave",
      plateType: "patatas_canarias",
      tags: ["spanish", "canaria", "patata", "pollo"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 560, baseP: 43, baseF: 13, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patatas",
      secundario: "pollo",
      noEscalar: ["mojo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: true
    },
    content: {
      p1: "Papas canarias arrugadas con sal gorda · pechuga de pollo a la plancha",
      p2: "Mojo rojo casero (pimiento, ajo, comino, vinagre, AOVE) · ensalada verde de acompañamiento",
      shopping: [
        "Patatas pequeñas (300g)", "Sal gorda (40g)",
        "Pechuga de pollo (160g)",
        "Pimiento rojo seco (1)", "Ajo (3 dientes)", "Comino", "Pimentón dulce",
        "Vinagre de vino (1 cda)", "AOVE (15ml)",
        "Mezclum (50g)", "Sal", "Pimienta"
      ],
      recipe: [
        "Cuece las patatas enteras en agua con mucha sal hasta tiernas (20 min). Escurre y deja secar al fuego sin agua hasta que arruguen.",
        "Tritura pimiento hidratado, ajo, comino, pimentón, vinagre y AOVE para el mojo.",
        "Haz el pollo a la plancha 4 min por lado.",
        "Sirve patatas, pollo y mojo aparte. Ensalada al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #7 — Caldo gallego de grelos (completo)
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "caldo_gallego_grelos_completo",
      title: "Caldo gallego de grelos (completo)",
      emoji: "🍲",
      protein: "lacon",
      proteinType: "carne",
      plateType: "caldo_grelos",
      tags: ["spanish", "gallego", "tradicional", "winter_friendly", "legumbre"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 565, baseP: 41, baseF: 18, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "alubias",
      noEscalar: ["chorizo", "lacon", "unto"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "high",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 75,
      familiar: true
    },
    content: {
      p1: "Caldo gallego con grelos · patata · alubias blancas · lacón · chorizo gallego",
      p2: "Unto (grasa de cerdo curada) · cebolla · sal · pan de pueblo para mojar",
      shopping: [
        "Grelos frescos (200g)", "Patata (1 grande)", "Alubias blancas en remojo (60g secas)",
        "Lacón (80g)", "Chorizo gallego (40g)", "Unto (10g)",
        "Cebolla (1)", "Sal", "Pan de pueblo (40g)"
      ],
      recipe: [
        "Pon alubias remojadas, lacón, chorizo, unto y cebolla en olla con 1,5 L de agua.",
        "Cuece 40 min a fuego suave.",
        "Añade patata pelada en trozos y los grelos limpios.",
        "Cuece 25 min más. Rectifica sal.",
        "Sirve caliente con pan de pueblo al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #8 — Caldo gallego de grelos (ligero, cena)
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "caldo_gallego_grelos_ligero",
      title: "Caldo gallego de grelos (ligero)",
      emoji: "🥬",
      protein: "pollo",
      proteinType: "ave",
      plateType: "caldo_ligero",
      tags: ["spanish", "gallego", "ligero", "digestivo", "cena_ligera"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 350, baseP: 35, baseF: 7, baseC: 38,
      energyDensity: "low"
    },
    scaling: {
      primario: "patata",
      secundario: null,
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: true },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: true
    },
    content: {
      p1: "Caldo gallego ligero con grelos · patata · pollo desmenuzado · sin chorizo ni unto",
      p2: "Cebolla pochada · ajo · sal · AOVE al servir",
      shopping: [
        "Grelos frescos (200g)", "Patata (1 grande)",
        "Pechuga de pollo (120g)",
        "Cebolla (1/2)", "Ajo (1 diente)",
        "AOVE (5ml)", "Sal"
      ],
      recipe: [
        "Hierve la pechuga de pollo en 1 L de agua con cebolla y ajo 20 min. Retira y desmenuza.",
        "En el caldo añade patata pelada en trozos y grelos limpios.",
        "Cuece 20 min hasta que la patata esté tierna.",
        "Devuelve el pollo desmenuzado al caldo. Rectifica sal.",
        "Sirve con un hilo de AOVE crudo al final."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #9 — Caldo gallego de repollo (completo)
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "caldo_gallego_repollo_completo",
      title: "Caldo gallego de repollo (completo)",
      emoji: "🍲",
      protein: "lacon",
      proteinType: "carne",
      plateType: "caldo_repollo",
      tags: ["spanish", "gallego", "tradicional", "winter_friendly", "legumbre", "repollo"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 565, baseP: 41, baseF: 18, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "alubias",
      noEscalar: ["chorizo", "lacon", "unto"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "high",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 75,
      familiar: true
    },
    content: {
      p1: "Caldo gallego con repollo · patata · alubias blancas · lacón · chorizo gallego",
      p2: "Unto · cebolla · sal · pan de pueblo para mojar",
      shopping: [
        "Repollo (200g)", "Patata (1 grande)", "Alubias blancas en remojo (60g secas)",
        "Lacón (80g)", "Chorizo gallego (40g)", "Unto (10g)",
        "Cebolla (1)", "Sal", "Pan de pueblo (40g)"
      ],
      recipe: [
        "Pon alubias remojadas, lacón, chorizo, unto y cebolla en olla con 1,5 L de agua.",
        "Cuece 40 min a fuego suave.",
        "Añade patata pelada en trozos y el repollo cortado en juliana.",
        "Cuece 25 min más. Rectifica sal.",
        "Sirve caliente con pan de pueblo al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #10 — Paella de gambas y verduras
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "paella_gambas_verduras",
      title: "Paella de gambas y verduras",
      emoji: "🥘",
      protein: "gambas",
      proteinType: "marisco",
      plateType: "paella",
      tags: ["spanish", "valenciana", "arroz", "marisco", "weekend", "highCarb"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 605, baseP: 32, baseF: 15, baseC: 75,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "AOVE",
      noEscalar: ["azafran"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 40,
      familiar: true
    },
    content: {
      p1: "Arroz bomba con caldo de pescado · gambas peladas · pimiento rojo · azafrán",
      p2: "Tomate rallado · ajo · guisantes · 15ml AOVE",
      shopping: [
        "Arroz bomba (90g)", "Gambas peladas (120g)",
        "Pimiento rojo (1/2)", "Tomate rallado (80g)", "Ajo (2 dientes)",
        "Guisantes (40g)",
        "Caldo de pescado (350ml)", "Azafrán (1 pizca)",
        "AOVE (15ml)", "Sal"
      ],
      recipe: [
        "Sofríe ajo y pimiento en AOVE 5 min.",
        "Añade tomate rallado y azafrán. Cocina 3 min.",
        "Incorpora arroz, remueve 1 min, añade caldo caliente (2x volumen).",
        "Cuece 18 min sin remover. Añade gambas y guisantes en los últimos 4 min.",
        "Reposa 5 min tapado antes de servir."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #11 — Tortilla de patatas completa
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "tortilla_patatas_completa",
      title: "Tortilla de patatas completa con ensalada",
      emoji: "🥚",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "tortilla",
      tags: ["spanish", "tradicional", "huevo", "patata", "familiar"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 570, baseP: 26, baseF: 30, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "pan",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "ocasional",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: false, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Tortilla española de patatas y cebolla con 3 huevos · ensalada de tomate y cebolla dulce",
      p2: "Pan integral para acompañar · AOVE virgen extra · sal",
      shopping: [
        "Patatas (200g)", "Cebolla (1/2)",
        "Huevos (3)",
        "Tomate (1)", "Cebolla dulce (1/4)",
        "Pan integral (40g)",
        "AOVE (20ml)", "Sal"
      ],
      recipe: [
        "Pela patatas en rodajas finas y cebolla en juliana.",
        "Confita en AOVE a fuego bajo 20 min hasta tiernas.",
        "Escurre y mezcla con huevos batidos y sal.",
        "Cuaja en sartén 4 min por lado.",
        "Sirve con ensalada de tomate, cebolla y AOVE."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #12 — Ensaladilla proteica
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ensaladilla_proteica",
      title: "Ensaladilla proteica (atún, huevo y pollo)",
      emoji: "🥗",
      protein: "atun",
      proteinType: "pescado",
      plateType: "ensaladilla",
      tags: ["spanish", "tradicional", "frio", "verano_friendly"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 630, baseP: 40, baseF: 26, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "atun",
      noEscalar: ["mayonesa", "huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: false, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Patata cocida en dados · atún en conserva · 2 huevos duros · pollo desmenuzado",
      p2: "Mayonesa ligera · guisantes · zanahoria · aceitunas verdes · pimiento del piquillo",
      shopping: [
        "Patata (200g)", "Zanahoria (1)", "Guisantes (50g)",
        "Atún en conserva al natural (80g)",
        "Huevos (2)", "Pechuga de pollo cocida (80g)",
        "Mayonesa ligera (40g)",
        "Aceitunas verdes (10 unidades)", "Pimiento del piquillo (1)",
        "Sal", "Pimienta"
      ],
      recipe: [
        "Cuece patata, zanahoria y guisantes hasta tiernos. Enfría y corta en dados.",
        "Hierve los huevos 10 min, pélalos y pícalos.",
        "Desmenuza el pollo cocido frío.",
        "Mezcla todo en bol con mayonesa, atún escurrido, aceitunas y piquillo en tiras.",
        "Refrigera 1 h antes de servir."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #13 — Ensalada de pasta
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ensalada_pasta",
      title: "Ensalada de pasta con atún, huevo y tomate",
      emoji: "🍝",
      protein: "atun",
      proteinType: "pescado",
      plateType: "ensalada_pasta",
      tags: ["mediterranean", "frio", "pasta", "verano_friendly"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 635, baseP: 40, baseF: 18, baseC: 70,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pasta",
      secundario: "AOVE",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Pasta corta integral · atún en conserva · 2 huevos duros · tomate cherry",
      p2: "Aceitunas negras · maíz · pepino · cebolla morada · AOVE y vinagre",
      shopping: [
        "Pasta corta integral (90g)",
        "Atún al natural (80g)", "Huevos (2)",
        "Tomate cherry (10)", "Pepino (1/2)", "Cebolla morada (1/4)",
        "Aceitunas negras (10)", "Maíz (40g)",
        "AOVE (15ml)", "Vinagre", "Orégano", "Sal"
      ],
      recipe: [
        "Cuece la pasta al dente. Enfría con agua fría y escurre.",
        "Hierve los huevos 10 min, pélalos y córtalos en cuartos.",
        "Mezcla pasta con tomate, pepino, cebolla, aceitunas y maíz.",
        "Añade atún escurrido y huevo. Aliña con AOVE, vinagre, orégano y sal.",
        "Refrigera 30 min antes de servir."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #14 — Empanada gallega de atún
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "empanada_gallega_atun",
      title: "Empanada gallega de atún con ensalada",
      emoji: "🥟",
      protein: "atun",
      proteinType: "pescado",
      plateType: "empanada",
      tags: ["spanish", "gallego", "horno", "masa"],
      containsGluten: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 580, baseP: 32, baseF: 22, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "masa",
      secundario: "atun",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 60,
      familiar: true
    },
    content: {
      p1: "Empanada gallega de atún con sofrito de pimiento y cebolla · ensalada verde",
      p2: "Masa de empanada · tomate frito · huevo duro en relleno · pimentón dulce",
      shopping: [
        "Masa para empanada (160g)",
        "Atún en conserva al natural (120g)",
        "Cebolla (1)", "Pimiento rojo (1/2)", "Pimiento verde (1/2)",
        "Tomate frito casero (80g)", "Huevo duro (1)",
        "Pimentón dulce", "Mezclum (50g)",
        "AOVE (10ml)", "Sal", "1 huevo batido (pintar)"
      ],
      recipe: [
        "Sofríe cebolla y pimientos en AOVE 10 min hasta blandos.",
        "Añade tomate frito, pimentón y atún escurrido. Cocina 3 min. Enfría.",
        "Estira la masa, rellena, cubre con huevo duro picado y tapa con otra capa.",
        "Sella bordes, pinta con huevo batido.",
        "Hornea 30 min a 190°C.",
        "Sirve con ensalada verde aliñada al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #15 — Crema de calabacín con queso fresco y huevo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "crema_calabacin_queso_huevo",
      title: "Crema de calabacín con queso fresco y huevo",
      emoji: "🥒",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "crema_verduras",
      tags: ["mediterranean", "cena_ligera", "verduras", "digestivo", "multi_fuente"],
      containsGluten: false,
      containsLactosa: true,
      multi_fuente_roles: ["matriz", "topping"]
    },
    nutrition: {
      baseKcal: 450, baseP: 40, baseF: 18, baseC: 30,
      energyDensity: "low"
    },
    scaling: {
      primario: "patata",
      secundario: "queso_fresco",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Crema de calabacín con patata y caldo de pollo · 2 huevos duros encima · queso fresco batido",
      p2: "Sofrito de cebolla y ajo · AOVE al acabado · pimienta blanca",
      shopping: [
        "Calabacín (350g)", "Patata (100g)", "Cebolla (60g)", "Ajo (1 diente)",
        "Caldo de pollo (300ml)",
        "Huevos (2)", "Queso fresco batido (150g)",
        "AOVE (10ml)", "Sal", "Pimienta blanca"
      ],
      recipe: [
        "Pocha cebolla y ajo en AOVE 5 min.",
        "Añade calabacín y patata en trozos. Sofríe 3 min.",
        "Cubre con caldo de pollo y cuece 18 min hasta que la patata esté tierna.",
        "Tritura hasta crema fina.",
        "Hierve los huevos 10 min, pélalos y córtalos.",
        "Sirve la crema, coloca el queso fresco batido y los huevos encima."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #16 — Moussaka ligera
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "moussaka_ligera",
      title: "Moussaka ligera con berenjena y bechamel reducida",
      emoji: "🍆",
      protein: "ternera",
      proteinType: "carne",
      plateType: "moussaka",
      tags: ["mediterranean", "griego", "horno", "berenjena", "multi_fuente"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true,
      multi_fuente_roles: ["relleno", "matriz"]
    },
    nutrition: {
      baseKcal: 560, baseP: 42, baseF: 22, baseC: 35,
      energyDensity: "medium"
    },
    scaling: {
      primario: "berenjena",
      secundario: "ternera",
      noEscalar: ["queso", "bechamel"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 75,
      familiar: false
    },
    content: {
      p1: "Capas de berenjena asada · ternera picada con tomate · bechamel ligera con queso gratinado",
      p2: "Cebolla · ajo · canela · orégano · nuez moscada",
      shopping: [
        "Berenjena (2 medianas)", "Ternera picada magra (150g)",
        "Tomate triturado (150g)", "Cebolla (1)", "Ajo (2 dientes)",
        "Leche desnatada (200ml)", "Harina (15g)", "Queso rallado (30g)",
        "Canela", "Orégano", "Nuez moscada",
        "AOVE (10ml)", "Sal"
      ],
      recipe: [
        "Corta berenjena en rodajas, sala 20 min y enjuaga. Asa al horno 15 min.",
        "Sofríe cebolla y ajo, añade ternera picada y dora. Incorpora tomate, canela y orégano. Cocina 15 min.",
        "Prepara bechamel ligera con leche, harina y nuez moscada.",
        "Monta capas: berenjena, carne, berenjena, bechamel y queso encima.",
        "Hornea 25 min a 190°C hasta gratinar."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #17 — Ensalada griega con pollo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ensalada_griega_pollo",
      title: "Ensalada griega con pollo y feta",
      emoji: "🥗",
      protein: "pollo",
      proteinType: "ave",
      plateType: "ensalada",
      tags: ["mediterranean", "griego", "feta", "frio"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 610, baseP: 50, baseF: 28, baseC: 18,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pollo",
      secundario: "feta",
      noEscalar: ["feta", "aceitunas"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 5,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Pechuga de pollo a la plancha en tiras · feta · tomate · pepino · cebolla morada",
      p2: "Aceitunas Kalamata · orégano · AOVE virgen extra · zumo de limón",
      shopping: [
        "Pechuga de pollo (180g)",
        "Queso feta (80g)",
        "Tomate (2)", "Pepino (1)", "Cebolla morada (1/2)",
        "Aceitunas Kalamata (15)", "Orégano",
        "AOVE (15ml)", "Limón (1/2)", "Sal", "Pimienta"
      ],
      recipe: [
        "Salpimenta el pollo y haz a la plancha 4 min por lado. Corta en tiras.",
        "Corta tomate en gajos, pepino en medias lunas y cebolla en juliana.",
        "Mezcla en bol con aceitunas.",
        "Desmenuza el feta encima.",
        "Coloca el pollo, aliña con AOVE, limón, orégano y sal."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #18 — Shakshuka
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "shakshuka",
      title: "Shakshuka con pan integral",
      emoji: "🍳",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "shakshuka",
      tags: ["mediterranean", "oriente_medio", "huevo", "tomate"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 540, baseP: 28, baseF: 20, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pan",
      secundario: "AOVE",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Salsa de tomate especiada con pimiento y cebolla · 3 huevos escalfados en la salsa",
      p2: "Comino · pimentón ahumado · ajo · perejil fresco · pan integral para mojar",
      shopping: [
        "Tomate triturado (300g)", "Pimiento rojo (1)", "Cebolla (1)", "Ajo (2 dientes)",
        "Huevos (3)",
        "Pan integral (60g)",
        "Comino", "Pimentón ahumado", "Perejil fresco",
        "AOVE (15ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Sofríe cebolla, ajo y pimiento en AOVE 8 min.",
        "Añade tomate triturado, comino y pimentón. Cocina 12 min.",
        "Haz huecos en la salsa y casca los huevos dentro.",
        "Tapa y cocina 6 min hasta que las claras cuajen y las yemas queden líquidas.",
        "Termina con perejil picado. Sirve con pan integral tostado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #19 — Hummus con pita y pollo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "hummus_pita_pollo",
      title: "Hummus con pita integral y pollo especiado",
      emoji: "🫓",
      protein: "garbanzos",
      proteinType: "legumbre",
      plateType: "hummus_bowl",
      tags: ["mediterranean", "oriente_medio", "pita", "garbanzo", "multi_fuente"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false,
      multi_fuente_roles: ["base", "topping"]
    },
    nutrition: {
      baseKcal: 610, baseP: 44, baseF: 20, baseC: 55,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pita",
      secundario: "hummus",
      noEscalar: ["tahini"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Hummus casero con tahini y limón · pollo en tiras especiado con ras el hanout · pita integral tostada",
      p2: "Tomate cherry · pepino · perejil · cebolla morada · AOVE al servir",
      shopping: [
        "Garbanzos cocidos (180g)", "Tahini (15g)", "Limón (1/2)", "Ajo (1 diente)",
        "Pechuga de pollo (140g)", "Ras el hanout",
        "Pita integral (1 grande / 80g)",
        "Tomate cherry (8)", "Pepino (1/2)", "Cebolla morada (1/4)", "Perejil",
        "AOVE (15ml)", "Sal", "Comino"
      ],
      recipe: [
        "Tritura garbanzos con tahini, limón, ajo, comino y un chorro de AOVE hasta crema fina.",
        "Marca el pollo con ras el hanout y sal, hazlo a la plancha 4 min por lado. Corta en tiras.",
        "Tuesta la pita en plancha o tostadora.",
        "Sirve el hummus en plato, coloca el pollo encima, decora con verduras frescas y perejil.",
        "Acompaña con la pita tostada cortada en triángulos."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #20 — Pasta carbonara
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pasta_carbonara",
      title: "Pasta carbonara",
      emoji: "🍝",
      protein: "guanciale",
      proteinType: "cereal",
      plateType: "pasta_carbonara",
      tags: ["italian", "pasta", "huevo", "queso", "multi_fuente", "highDensity"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true,
      multi_fuente_roles: ["emulsion", "matriz"]
    },
    nutrition: {
      baseKcal: 760, baseP: 42, baseF: 38, baseC: 65,
      energyDensity: "high"
    },
    scaling: {
      primario: "pasta",
      secundario: null,
      noEscalar: ["guanciale", "queso", "huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Pasta larga al dente · guanciale crujiente · salsa de huevo y pecorino · pimienta negra",
      p2: "Sin nata. Solo huevo, queso, guanciale y agua de cocción",
      shopping: [
        "Pasta tipo spaghetti o rigatoni (100g)",
        "Guanciale (60g) o panceta curada",
        "Huevos (2 yemas + 1 entero)",
        "Pecorino romano (40g)",
        "Pimienta negra recién molida", "Sal"
      ],
      recipe: [
        "Cuece la pasta en agua con sal hasta al dente. Reserva 100ml del agua.",
        "Saltea el guanciale en sartén sin aceite hasta crujiente. Apaga el fuego.",
        "Bate las yemas + huevo entero con el pecorino rallado y pimienta.",
        "Mezcla la pasta caliente escurrida con el guanciale (sin fuego).",
        "Incorpora la crema de huevo y queso, removiendo enérgicamente con un poco del agua reservada hasta cremoso.",
        "Sirve inmediatamente con más pecorino y pimienta."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #21 — Pasta alla norma
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pasta_alla_norma",
      title: "Pasta alla norma con atún",
      emoji: "🍆",
      protein: "atun",
      proteinType: "cereal",
      plateType: "pasta_norma",
      tags: ["italian", "siciliana", "pasta", "berenjena"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 620, baseP: 30, baseF: 22, baseC: 80,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pasta",
      secundario: "AOVE",
      noEscalar: ["ricotta"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: false
    },
    content: {
      p1: "Pasta corta con salsa de tomate · berenjena frita en dados · atún en conserva · ricotta salata rallada",
      p2: "Albahaca fresca · ajo · AOVE",
      shopping: [
        "Pasta corta tipo rigatoni (100g)",
        "Berenjena (1 mediana)",
        "Atún en conserva al natural (80g)",
        "Tomate triturado (200g)",
        "Ricotta salata (20g)",
        "Ajo (2 dientes)", "Albahaca fresca",
        "AOVE (15ml)", "Sal"
      ],
      recipe: [
        "Corta la berenjena en dados, sala y deja sudar 15 min. Sécala bien.",
        "Fríe la berenjena en AOVE hasta dorada. Reserva sobre papel.",
        "Sofríe ajo, añade tomate y cocina 12 min. Añade albahaca.",
        "Cuece la pasta al dente.",
        "Mezcla pasta con salsa, incorpora berenjena y atún escurrido.",
        "Sirve con ricotta salata rallada por encima."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #22 — Risotto de setas con pollo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "risotto_setas_pollo",
      title: "Risotto de setas con pollo",
      emoji: "🍚",
      protein: "pollo",
      proteinType: "cereal",
      plateType: "risotto",
      tags: ["italian", "arroz", "setas"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 615, baseP: 30, baseF: 25, baseC: 70,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "pollo",
      noEscalar: ["parmesano", "mantequilla"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: false
    },
    content: {
      p1: "Arroz carnaroli o arborio cremoso · setas variadas salteadas · pechuga de pollo en dados",
      p2: "Caldo de pollo · cebolla · parmesano · mantequilla al final · vino blanco",
      shopping: [
        "Arroz arborio o carnaroli (90g)",
        "Setas variadas (150g)",
        "Pechuga de pollo (130g)",
        "Cebolla (1/2)", "Ajo (1 diente)",
        "Caldo de pollo (500ml)", "Vino blanco (50ml)",
        "Parmesano (25g)", "Mantequilla (10g)",
        "AOVE (10ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Saltea setas en AOVE hasta doradas. Reserva.",
        "Dora el pollo en dados. Reserva.",
        "Pocha cebolla y ajo. Añade arroz y tuesta 1 min.",
        "Vierte vino y deja evaporar. Añade caldo caliente cazo a cazo, removiendo, 16-18 min.",
        "A mitad de cocción incorpora setas y pollo.",
        "Termina con mantequilla y parmesano fuera del fuego (mantecato). Reposa 2 min."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #23 — Pizza proteica casera
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pizza_proteica_casera",
      title: "Pizza proteica casera con pollo y mozzarella",
      emoji: "🍕",
      protein: "pollo",
      proteinType: "cereal",
      plateType: "pizza",
      tags: ["italian", "horno", "mozzarella", "pollo", "multi_fuente"],
      containsGluten: true,
      containsLactosa: true,
      multi_fuente_roles: ["fundente", "topping"]
    },
    nutrition: {
      baseKcal: 625, baseP: 56, baseF: 22, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "masa",
      secundario: "pollo",
      noEscalar: ["mozzarella"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 40,
      familiar: true
    },
    content: {
      p1: "Base proteica casera (harina + clara de huevo o yogur griego) · salsa de tomate · mozzarella · pechuga de pollo a la plancha",
      p2: "Orégano · albahaca · ajo · AOVE",
      shopping: [
        "Harina integral (80g)", "Yogur griego natural (60g)",
        "Levadura química (1 cdita)", "Sal",
        "Salsa de tomate triturado (60g)",
        "Mozzarella light (80g)",
        "Pechuga de pollo (130g)",
        "Orégano", "Albahaca fresca", "AOVE (5ml)"
      ],
      recipe: [
        "Mezcla harina, yogur, levadura y sal hasta masa homogénea. Estira fina.",
        "Cocina la base 6 min en horno a 220°C sobre papel.",
        "Saltea el pollo en tiras a la plancha con AOVE.",
        "Saca la base, extiende tomate, mozzarella en trozos y pollo encima.",
        "Hornea 8 min más a 220°C hasta gratinar.",
        "Termina con orégano y albahaca fresca."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #24 — Gnocchi alla sorrentina
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "gnocchi_sorrentina",
      title: "Gnocchi alla sorrentina",
      emoji: "🥔",
      protein: "mozzarella",
      proteinType: "cereal",
      plateType: "gnocchi",
      tags: ["italian", "napolitana", "horno", "tomate", "mozzarella"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 595, baseP: 28, baseF: 20, baseC: 75,
      energyDensity: "medium"
    },
    scaling: {
      primario: "gnocchi",
      secundario: null,
      noEscalar: ["mozzarella"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: false
    },
    content: {
      p1: "Gnocchi de patata gratinados al horno · salsa de tomate napolitana · mozzarella fundida · albahaca",
      p2: "Ajo · AOVE · parmesano rallado · sal",
      shopping: [
        "Gnocchi de patata (200g)",
        "Tomate triturado (250g)", "Ajo (2 dientes)",
        "Mozzarella fresca (100g)",
        "Parmesano (20g)", "Albahaca fresca",
        "AOVE (10ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Sofríe ajo en AOVE, añade tomate y albahaca, cocina 15 min hasta espesar.",
        "Hierve los gnocchi en agua con sal hasta que floten (2-3 min). Escurre.",
        "Mezcla gnocchi con la salsa en una fuente apta para horno.",
        "Cubre con mozzarella troceada y parmesano.",
        "Hornea 12 min a 200°C hasta gratinar.",
        "Termina con albahaca fresca."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #25 — Curry de garbanzos
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "curry_garbanzos",
      title: "Curry de garbanzos con arroz basmati",
      emoji: "🍛",
      protein: "garbanzos",
      proteinType: "legumbre",
      plateType: "curry",
      tags: ["asian", "india", "vegetariano", "garbanzo", "arroz", "highCarb"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 555, baseP: 30, baseF: 13, baseC: 75,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "garbanzos",
      noEscalar: ["coco"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: false
    },
    content: {
      p1: "Garbanzos en salsa de tomate y leche de coco con especias indias · arroz basmati",
      p2: "Cúrcuma · garam masala · jengibre · ajo · cilantro fresco",
      shopping: [
        "Garbanzos cocidos (200g)",
        "Arroz basmati (80g seco)",
        "Tomate triturado (150g)", "Leche de coco light (100ml)",
        "Cebolla (1)", "Ajo (2 dientes)", "Jengibre fresco (1 trozo)",
        "Cúrcuma", "Garam masala", "Comino", "Cilantro fresco",
        "AOVE (10ml)", "Sal"
      ],
      recipe: [
        "Pocha cebolla, ajo y jengibre rallado en AOVE 5 min.",
        "Añade especias y tuesta 1 min.",
        "Incorpora tomate y cocina 8 min.",
        "Añade garbanzos y leche de coco. Cocina 15 min a fuego bajo.",
        "Mientras, cuece el arroz basmati.",
        "Sirve el curry sobre el arroz con cilantro fresco."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #26 — Pad thai con gambas
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pad_thai_gambas",
      title: "Pad thai con gambas",
      emoji: "🍤",
      protein: "gambas",
      proteinType: "cereal",
      plateType: "pad_thai",
      tags: ["asian", "thai", "noodles", "marisco", "highCarb"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 660, baseP: 35, baseF: 24, baseC: 75,
      energyDensity: "medium"
    },
    scaling: {
      primario: "fideos",
      secundario: "gambas",
      noEscalar: ["cacahuete"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Fideos de arroz salteados al wok · gambas · huevo · brotes de soja · cacahuete picado",
      p2: "Salsa de tamarindo · salsa de pescado · lima · cilantro · cebolleta",
      shopping: [
        "Fideos de arroz (90g secos)",
        "Gambas peladas (120g)",
        "Huevo (1)",
        "Brotes de soja (60g)", "Cebolleta (2)", "Ajo (2 dientes)",
        "Cacahuetes tostados sin sal (15g)",
        "Salsa de pescado (15ml)", "Salsa de tamarindo (15ml)",
        "Azúcar moreno (1 cdita)", "Lima (1/2)", "Cilantro",
        "Aceite de sésamo o girasol (10ml)"
      ],
      recipe: [
        "Hidrata los fideos en agua caliente 8 min. Escurre.",
        "Mezcla salsa de pescado, tamarindo, azúcar y lima en un bol.",
        "Saltea ajo y gambas en wok 2 min. Reserva.",
        "Cuaja el huevo en el wok removiendo.",
        "Añade fideos, salsa, gambas y brotes de soja. Saltea 3 min.",
        "Termina con cacahuete picado, cebolleta y cilantro."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #27 — Ramen simplificado
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ramen_simplificado",
      title: "Ramen simplificado con pollo y huevo",
      emoji: "🍜",
      protein: "pollo",
      proteinType: "cereal",
      plateType: "ramen",
      tags: ["asian", "japones", "noodles", "sopa"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 555, baseP: 38, baseF: 13, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "fideos",
      secundario: "pollo",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Caldo de pollo umami · fideos ramen · pechuga de pollo en tiras · huevo poché · pak choi",
      p2: "Miso · salsa de soja · jengibre · cebolleta · alga nori · aceite de sésamo",
      shopping: [
        "Fideos ramen (60g secos)",
        "Pechuga de pollo (130g)",
        "Huevo (1)",
        "Caldo de pollo (500ml)",
        "Pak choi (1 unidad)", "Cebolleta (2)",
        "Miso blanco (1 cdita)", "Salsa de soja (10ml)",
        "Jengibre fresco", "Alga nori (1 lámina)",
        "Aceite de sésamo (5ml)"
      ],
      recipe: [
        "Marca la pechuga de pollo en la sartén y corta en tiras.",
        "Hierve el caldo con jengibre y miso disuelto. Añade salsa de soja.",
        "Hierve el huevo 6 min para poché blandito. Pélalo.",
        "Cuece los fideos según paquete.",
        "Saltea pak choi 2 min.",
        "Monta el bol: fideos, caldo caliente, pollo, huevo cortado, pak choi, cebolleta, nori y unas gotas de sésamo."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #28 — Wok de verduras con pollo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "wok_verduras_pollo",
      title: "Wok de verduras con pollo y arroz",
      emoji: "🥢",
      protein: "pollo",
      proteinType: "ave",
      plateType: "wok",
      tags: ["asian", "wok", "verduras", "arroz"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 650, baseP: 42, baseF: 16, baseC: 65,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "pollo",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Pollo en tiras salteado al wok · pimientos · brócoli · zanahoria · cebolleta · arroz jazmín",
      p2: "Salsa de soja · jengibre · ajo · aceite de sésamo · semillas de sésamo",
      shopping: [
        "Pechuga de pollo (150g)",
        "Arroz jazmín o basmati (80g seco)",
        "Pimiento rojo (1/2)", "Pimiento verde (1/2)",
        "Brócoli (100g)", "Zanahoria (1)", "Cebolleta (2)",
        "Ajo (2 dientes)", "Jengibre fresco",
        "Salsa de soja (15ml)", "Aceite de sésamo (5ml)",
        "Aceite de girasol (10ml)", "Semillas de sésamo"
      ],
      recipe: [
        "Cuece el arroz jazmín en paralelo.",
        "Corta verduras en juliana y pollo en tiras finas.",
        "Calienta wok con aceite a fuego fuerte. Saltea pollo 3 min y retira.",
        "Saltea ajo y jengibre 30 seg. Añade verduras y saltea 4 min a fuego fuerte.",
        "Devuelve el pollo. Añade salsa de soja y aceite de sésamo.",
        "Sirve sobre el arroz con semillas de sésamo y cebolleta."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #29 — Gyozas con verduras
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "gyozas_verduras",
      title: "Gyozas de pollo y verduras con salsa ponzu",
      emoji: "🥟",
      protein: "pollo",
      proteinType: "cereal",
      plateType: "gyozas",
      tags: ["asian", "japones", "dumplings", "vapor"],
      containsGluten: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 410, baseP: 20, baseF: 14, baseC: 45,
      energyDensity: "medium"
    },
    scaling: {
      primario: "gyozas",
      secundario: null,
      noEscalar: ["salsa"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Gyozas rellenas de pollo picado, col y cebolleta · ensalada de pepino al sésamo",
      p2: "Salsa ponzu (soja + lima + mirin) · jengibre · ajo",
      shopping: [
        "Obleas de gyoza (10 unidades / 100g)",
        "Pollo picado (100g)",
        "Col china (60g)", "Cebolleta (2)",
        "Ajo (1 diente)", "Jengibre fresco",
        "Pepino (1)", "Semillas de sésamo",
        "Salsa de soja (15ml)", "Lima (1/2)", "Mirin o vinagre (5ml)",
        "Aceite de sésamo (5ml)", "Aceite de girasol (5ml)"
      ],
      recipe: [
        "Mezcla pollo picado con col rallada, cebolleta, ajo y jengibre.",
        "Rellena las obleas, ciérralas con los pliegues típicos.",
        "Marca las gyozas en sartén con aceite hasta dorar la base.",
        "Añade 50ml de agua, tapa y cocina al vapor 5 min hasta que se evapore.",
        "Prepara la salsa ponzu mezclando soja, lima y mirin.",
        "Sirve con ensalada de pepino aliñada con aceite de sésamo y semillas."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #30 — Tacos de pescado
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "tacos_pescado",
      title: "Tacos de pescado blanco con ensalada de col",
      emoji: "🌮",
      protein: "merluza",
      proteinType: "pescado",
      plateType: "tacos",
      tags: ["mexican", "callejero", "pescado", "tortilla_maiz"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 495, baseP: 38, baseF: 15, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "tortillas",
      secundario: "pescado",
      noEscalar: ["lima", "cilantro"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Tortillas de maíz · pescado blanco a la plancha en tiras · ensalada de col morada · lima",
      p2: "Cilantro fresco · cebolla morada · salsa de yogur picante · aguacate opcional",
      shopping: [
        "Tortillas de maíz (4 unidades / 100g)",
        "Merluza o pescado blanco (180g)",
        "Col morada (100g)", "Cebolla morada (1/4)",
        "Cilantro fresco", "Lima (1)",
        "Yogur natural (40g)", "Chile o tabasco",
        "AOVE (10ml)", "Sal", "Pimienta", "Comino"
      ],
      recipe: [
        "Marinar el pescado con lima, comino, sal y pimienta 10 min.",
        "Hacer el pescado a la plancha 3 min por lado. Desmenuzar.",
        "Mezclar yogur con un poco de lima, sal y chile para la salsa.",
        "Cortar col en juliana fina y aliñar con limón, sal y AOVE.",
        "Calentar las tortillas en plancha 30 seg por lado.",
        "Montar: tortilla, pescado, ensalada de col, salsa, cilantro y cebolla morada."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #31 — Tacos de carne
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "tacos_carne",
      title: "Tacos de ternera al pastor con piña y cebolla",
      emoji: "🌮",
      protein: "ternera",
      proteinType: "carne",
      plateType: "tacos",
      tags: ["mexican", "callejero", "carne", "tortilla_maiz"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 550, baseP: 38, baseF: 19, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "tortillas",
      secundario: "ternera",
      noEscalar: ["pina"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: false
    },
    content: {
      p1: "Tortillas de maíz · ternera en tiras al estilo pastor · piña asada · cebolla morada",
      p2: "Cilantro fresco · salsa verde · lima",
      shopping: [
        "Tortillas de maíz (4 unidades / 100g)",
        "Ternera tiras (160g)",
        "Piña fresca (80g)", "Cebolla morada (1/2)",
        "Cilantro fresco", "Lima (1)",
        "Salsa verde mexicana (30g)",
        "Achiote o pimentón ahumado", "Comino", "Orégano",
        "AOVE (10ml)", "Sal"
      ],
      recipe: [
        "Marinar la ternera con achiote/pimentón, comino, orégano y ajo 15 min.",
        "Saltear la ternera en sartén caliente 4 min hasta dorar.",
        "Asar la piña en dados en la misma sartén 2 min.",
        "Calentar tortillas en plancha 30 seg por lado.",
        "Montar: tortilla, ternera, piña, cebolla, cilantro, salsa verde y lima."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #32 — Quesadilla fitness
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "quesadilla_fitness",
      title: "Quesadilla fitness de pollo y queso bajo en grasa",
      emoji: "🫓",
      protein: "pollo",
      proteinType: "ave",
      plateType: "quesadilla",
      tags: ["mexican", "tortilla_integral", "pollo", "queso", "multi_fuente"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true,
      multi_fuente_roles: ["fundente", "relleno"]
    },
    nutrition: {
      baseKcal: 650, baseP: 60, baseF: 24, baseC: 45,
      energyDensity: "medium"
    },
    scaling: {
      primario: "tortilla",
      secundario: "pollo",
      noEscalar: ["queso"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Tortilla integral grande · queso bajo en grasa fundido · pollo a la plancha en tiras · pimiento salteado",
      p2: "Cebolla pochada · guacamole ligero · cilantro · salsa picante opcional",
      shopping: [
        "Tortilla integral grande (1 / 80g)",
        "Pollo (180g)",
        "Queso bajo en grasa (80g)",
        "Pimiento rojo (1/2)", "Cebolla (1/4)",
        "Aguacate (1/2)", "Lima (1/2)",
        "Cilantro", "AOVE (10ml)", "Sal", "Pimienta", "Comino"
      ],
      recipe: [
        "Saltear pollo en tiras con pimiento y cebolla 6 min con AOVE y comino.",
        "Calentar tortilla 30 seg en sartén.",
        "Cubrir mitad de la tortilla con queso, pollo salteado y un poco más de queso.",
        "Cerrar la tortilla y tostar 2 min por cada lado hasta que el queso funda.",
        "Aplastar aguacate con lima, sal y cilantro para guacamole rápido.",
        "Cortar la quesadilla en cuartos y servir con guacamole."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #33 — Burrito de legumbres
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "burrito_legumbres",
      title: "Burrito de alubias negras, arroz y verduras",
      emoji: "🌯",
      protein: "alubias_negras",
      proteinType: "legumbre",
      plateType: "burrito",
      tags: ["mexican", "tex_mex", "vegetariano", "highCarb", "tortilla_integral"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 565, baseP: 22, baseF: 12, baseC: 80,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "alubias",
      noEscalar: ["aguacate"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Tortilla integral grande rellena de alubias negras especiadas, arroz integral, maíz, pimiento y aguacate",
      p2: "Salsa de tomate suave · cilantro · lima · cebolla pochada",
      shopping: [
        "Tortilla integral grande (1 / 80g)",
        "Alubias negras cocidas (120g)",
        "Arroz integral cocido (100g)",
        "Pimiento rojo (1/2)", "Cebolla (1/2)",
        "Maíz (40g)", "Aguacate (1/2)",
        "Tomate triturado (40g)", "Cilantro fresco", "Lima (1/2)",
        "Comino", "Pimentón ahumado", "AOVE (10ml)", "Sal"
      ],
      recipe: [
        "Pochar cebolla y pimiento en AOVE 6 min.",
        "Añadir alubias, tomate, comino y pimentón. Cocinar 5 min.",
        "Calentar tortilla 30 seg en plancha.",
        "Aplastar el aguacate con lima y sal.",
        "Rellenar tortilla con arroz, alubias, maíz, aguacate y cilantro.",
        "Enrollar bien apretado y servir cortado en mitad."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #34 — Hamburguesa de ternera completa
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "hamburguesa_ternera_completa",
      title: "Hamburguesa de ternera con pan brioche y patatas gajo",
      emoji: "🍔",
      protein: "ternera",
      proteinType: "carne",
      plateType: "hamburguesa",
      tags: ["american", "carne", "pan", "highDensity"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 770, baseP: 52, baseF: 24, baseC: 70,
      energyDensity: "high"
    },
    scaling: {
      primario: "pan",
      secundario: "patatas",
      noEscalar: ["salsa", "queso"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.3
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Hamburguesa de ternera (180g) en pan brioche · lechuga · tomate · cebolla · pepinillos · queso light",
      p2: "Patatas gajo al airfryer · salsa burger casera (mostaza + yogur + ketchup)",
      shopping: [
        "Carne picada de ternera magra (180g)",
        "Pan brioche para burger (1 unidad / 70g)",
        "Lechuga (3 hojas)", "Tomate (1)", "Cebolla (1/4)", "Pepinillos (2)",
        "Queso light en lonchas (1 loncha)",
        "Patatas (200g)",
        "Mostaza", "Yogur natural (20g)", "Ketchup (10g)",
        "AOVE (10ml)", "Sal", "Pimienta", "Pimentón"
      ],
      recipe: [
        "Cortar patatas en gajos, condimentar con AOVE, sal y pimentón. Airfryer 200°C 18 min.",
        "Formar hamburguesa con la carne, sal y pimienta. Marcar a fuego fuerte 3 min por lado.",
        "Tostar el pan brioche 1 min por la parte cortada.",
        "Mezclar mostaza, yogur y ketchup para la salsa.",
        "Montar: pan, salsa, lechuga, tomate, hamburguesa, queso, cebolla, pepinillos, pan superior."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #35 — Hamburguesa de pavo completa
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "hamburguesa_pavo_completa",
      title: "Hamburguesa de pavo con pan integral y patatas gajo",
      emoji: "🍔",
      protein: "pavo",
      proteinType: "ave",
      plateType: "hamburguesa",
      tags: ["american", "ave", "pan", "magro"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 645, baseP: 47, baseF: 16, baseC: 65,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pan",
      secundario: "patatas",
      noEscalar: ["salsa"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Hamburguesa de pavo picado (180g) en pan integral · lechuga · tomate · cebolla · pepinillos",
      p2: "Patatas gajo al airfryer · salsa de yogur con mostaza y eneldo",
      shopping: [
        "Pavo picado (180g)",
        "Pan integral para burger (1 unidad / 70g)",
        "Lechuga (3 hojas)", "Tomate (1)", "Cebolla (1/4)", "Pepinillos (2)",
        "Patatas (200g)",
        "Yogur natural (30g)", "Mostaza", "Eneldo",
        "AOVE (10ml)", "Sal", "Pimienta", "Ajo en polvo"
      ],
      recipe: [
        "Cortar patatas en gajos, condimentar con AOVE, sal y pimentón. Airfryer 200°C 18 min.",
        "Mezclar pavo con sal, pimienta, ajo en polvo. Formar hamburguesa.",
        "Marcar 4 min por lado en sartén con poco AOVE.",
        "Tostar el pan integral 1 min.",
        "Mezclar yogur, mostaza y eneldo para la salsa.",
        "Montar: pan, salsa, lechuga, tomate, hamburguesa, cebolla, pepinillos, pan superior."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #36 — Hamburguesa de pollo completa
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "hamburguesa_pollo_completa",
      title: "Hamburguesa de pollo con pan integral y patatas gajo",
      emoji: "🍔",
      protein: "pollo",
      proteinType: "ave",
      plateType: "hamburguesa",
      tags: ["american", "ave", "pan", "magro"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 670, baseP: 47, baseF: 18, baseC: 65,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pan",
      secundario: "patatas",
      noEscalar: ["salsa"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Hamburguesa de pollo picado (180g) en pan integral · lechuga · tomate · cebolla · pepinillos",
      p2: "Patatas gajo al airfryer · salsa de yogur con limón y ajo",
      shopping: [
        "Pollo picado (180g)",
        "Pan integral para burger (1 unidad / 70g)",
        "Lechuga (3 hojas)", "Tomate (1)", "Cebolla (1/4)", "Pepinillos (2)",
        "Patatas (200g)",
        "Yogur natural (30g)", "Limón (1/2)", "Ajo (1 diente)",
        "AOVE (10ml)", "Sal", "Pimienta", "Hierbas provenzales"
      ],
      recipe: [
        "Cortar patatas en gajos, condimentar con AOVE, sal y pimentón. Airfryer 200°C 18 min.",
        "Mezclar pollo con sal, pimienta y hierbas provenzales. Formar hamburguesa.",
        "Marcar 4 min por lado en sartén con poco AOVE.",
        "Tostar el pan integral 1 min.",
        "Mezclar yogur, ajo machacado y limón para la salsa.",
        "Montar: pan, salsa, lechuga, tomate, hamburguesa, cebolla, pepinillos, pan superior."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #37 — Ceviche de pescado blanco (estilo peruano clásico)
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ceviche_pescado_blanco",
      title: "Ceviche de pescado blanco con boniato y cancha",
      emoji: "🐟",
      protein: "corvina",
      proteinType: "pescado",
      plateType: "ceviche",
      tags: ["peruano", "crudo", "marino", "frio", "ligero"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 410, baseP: 32, baseF: 11, baseC: 35,
      energyDensity: "low"
    },
    scaling: {
      primario: "boniato",
      secundario: "pescado",
      noEscalar: ["cancha"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: false
    },
    content: {
      p1: "Pescado blanco en dados marinado en leche de tigre · boniato cocido · cancha tostada",
      p2: "Cebolla morada · ají amarillo · cilantro · lima · jengibre fresco",
      shopping: [
        "Corvina o lubina (180g, muy fresca o ultracongelada)",
        "Boniato (150g)",
        "Cancha o maíz tostado (20g)",
        "Cebolla morada (1/2)",
        "Lima (3-4)", "Ají amarillo o chile suave (1)",
        "Jengibre fresco (1 trozo)", "Cilantro fresco",
        "Sal", "Pimienta", "AOVE (5ml)"
      ],
      recipe: [
        "Cocer el boniato pelado en agua con sal 25 min hasta tierno. Enfriar y cortar en rodajas.",
        "Cortar el pescado en dados de 1,5 cm.",
        "Preparar leche de tigre: triturar jugo de lima, ají, jengibre, cilantro, sal y un poco de pescado.",
        "Mezclar el pescado con cebolla morada en juliana y la leche de tigre. Marinar 5-8 min en frío.",
        "Servir en plato hondo con el pescado y su jugo, boniato al lado y cancha por encima.",
        "Terminar con cilantro fresco picado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #38 — Carpaccio de ternera con rúcula
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "carpaccio_ternera",
      title: "Carpaccio de ternera con rúcula, parmesano y pan",
      emoji: "🥩",
      protein: "ternera",
      proteinType: "carne",
      plateType: "carpaccio",
      tags: ["italian", "crudo", "frio", "ligero"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 440, baseP: 32, baseF: 18, baseC: 22,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "ternera",
      noEscalar: ["parmesano"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: false
    },
    content: {
      p1: "Láminas finas de ternera cruda · rúcula fresca · lascas de parmesano · pan integral tostado",
      p2: "AOVE virgen extra · zumo de limón · pimienta negra · sal en escamas",
      shopping: [
        "Solomillo de ternera (140g, ultracongelado previamente para seguridad)",
        "Rúcula fresca (50g)",
        "Parmesano en lascas (25g)",
        "Pan integral (50g)",
        "Limón (1/2)", "AOVE virgen extra (10ml)",
        "Sal en escamas", "Pimienta negra"
      ],
      recipe: [
        "Congelar el solomillo previamente al menos 5 días a -20°C por seguridad alimentaria.",
        "Cortar el solomillo en láminas muy finas con cuchillo afilado (semicongelado facilita).",
        "Distribuir las láminas en plato frío sin solaparlas.",
        "Aliñar con AOVE, zumo de limón, sal en escamas y pimienta recién molida.",
        "Disponer rúcula en el centro y lascas de parmesano por encima.",
        "Servir con pan integral tostado al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #39 — Pollo crujiente al airfryer con boniato
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pollo_crujiente_af_boniato",
      title: "Pollo crujiente al airfryer con boniato asado",
      emoji: "🍗",
      protein: "pollo",
      proteinType: "ave",
      plateType: "airfryer_pollo",
      tags: ["airfryer", "pollo", "boniato", "magro"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 550, baseP: 44, baseF: 14, baseC: 60,
      energyDensity: "medium"
    },
    scaling: {
      primario: "boniato",
      secundario: "pollo",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Pechuga de pollo crujiente al airfryer con rebozado proteico · boniato asado en gajos",
      p2: "Ensalada verde · mostaza dulce · pimentón ahumado",
      shopping: [
        "Pechuga de pollo (180g)",
        "Boniato (250g)",
        "Clara de huevo (1)", "Pan rallado integral (20g)",
        "Mezclum (50g)",
        "Pimentón ahumado", "Mostaza (10g)",
        "AOVE (10ml)", "Sal", "Pimienta", "Ajo en polvo"
      ],
      recipe: [
        "Cortar el boniato en gajos, mezclar con AOVE, sal y pimentón. Airfryer 200°C 18 min.",
        "Cortar el pollo en tiras o filetes. Salpimentar.",
        "Pasar el pollo por clara batida y luego por pan rallado con ajo en polvo.",
        "Airfryer el pollo 180°C 12 min girando a mitad.",
        "Servir con ensalada verde aliñada y la mostaza dulce al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #40 — Salmón al airfryer con verduras
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "salmon_af_verduras",
      title: "Salmón al airfryer con verduras asadas",
      emoji: "🐟",
      protein: "salmon",
      proteinType: "pescado",
      plateType: "airfryer_pescado",
      tags: ["airfryer", "pescado_graso", "verduras", "omega3"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 520, baseP: 34, baseF: 26, baseC: 30,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "salmon",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Filete de salmón al airfryer con costra de hierbas · patata, calabacín y pimiento asados",
      p2: "Limón · ajo · eneldo · AOVE",
      shopping: [
        "Salmón fresco o congelado (160g)",
        "Patata (150g)", "Calabacín (1/2)", "Pimiento rojo (1/2)",
        "Limón (1/2)", "Ajo (2 dientes)",
        "Eneldo fresco o seco", "AOVE (10ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Cortar verduras en dados, mezclar con AOVE, sal y ajo picado.",
        "Airfryer las verduras 200°C 15 min.",
        "Salpimentar el salmón, frotar con eneldo y limón.",
        "Añadir el salmón sobre las verduras y airfryer 180°C 8-10 min más.",
        "Servir con zumo de limón fresco."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #41 — Croquetas caseras de jamón al airfryer
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "croquetas_jamon_af",
      title: "Croquetas caseras de jamón al airfryer con ensalada",
      emoji: "🥟",
      protein: "jamon",
      proteinType: "carne",
      plateType: "croquetas_af",
      tags: ["spanish", "airfryer", "jamon", "tradicional"],
      containsGluten: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 515, baseP: 22, baseF: 25, baseC: 42,
      energyDensity: "medium"
    },
    scaling: {
      primario: "croquetas",
      secundario: "ensalada",
      noEscalar: ["croqueta_grasa"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.3
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "ocasional",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: false, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: true,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "6-8 croquetas caseras de jamón al airfryer (sin freír) · ensalada verde con tomate",
      p2: "Aliño con vinagre de Jerez y AOVE",
      shopping: [
        "Croquetas caseras de jamón congeladas (8 unidades / 180g)",
        "Mezclum (60g)", "Tomate cherry (10)",
        "Cebolla morada (1/4)",
        "Vinagre de Jerez", "AOVE (15ml)", "Sal"
      ],
      recipe: [
        "Airfryer las croquetas directamente sin descongelar a 190°C durante 12-14 min.",
        "Girar a mitad de cocción.",
        "Mientras, preparar ensalada con mezclum, tomate cherry y cebolla.",
        "Aliñar la ensalada con AOVE, vinagre de Jerez y sal.",
        "Servir las croquetas calientes con la ensalada al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #42 — Nuggets caseros de pollo al airfryer
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "nuggets_caseros_pollo_af",
      title: "Nuggets caseros de pollo al airfryer con patata gajo",
      emoji: "🍗",
      protein: "pollo",
      proteinType: "ave",
      plateType: "nuggets_af",
      tags: ["airfryer", "pollo", "casero", "magro"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 535, baseP: 40, baseF: 14, baseC: 55,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "pollo",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: true
    },
    content: {
      p1: "Nuggets caseros de pollo rebozados al airfryer · patatas gajo · ketchup casero ligero",
      p2: "Mostaza dulce o salsa de yogur con ajo y eneldo",
      shopping: [
        "Pechuga de pollo (170g)",
        "Clara de huevo (1)", "Pan rallado integral (25g)", "Parmesano (10g)",
        "Patata (200g)",
        "Ketchup ligero (15g)", "Mostaza dulce o yogur natural (20g)",
        "AOVE (10ml)", "Sal", "Pimienta", "Pimentón", "Ajo en polvo"
      ],
      recipe: [
        "Cortar el pollo en bocados pequeños y salpimentar.",
        "Mezclar pan rallado con parmesano, pimentón y ajo en polvo.",
        "Pasar nuggets por clara y luego por la mezcla seca.",
        "Cortar patatas en gajos, condimentar con AOVE y pimentón.",
        "Airfryer las patatas 200°C 18 min, añadir nuggets en los últimos 10 min a 180°C.",
        "Servir con ketchup y mostaza."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #43 — Verduras crujientes al airfryer con proteína
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "verduras_crujientes_af_proteina",
      title: "Verduras crujientes al airfryer con pollo",
      emoji: "🥦",
      protein: "pollo",
      proteinType: "ave",
      plateType: "airfryer_verduras",
      tags: ["airfryer", "verduras", "pollo", "magro", "lowCarb"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 525, baseP: 38, baseF: 22, baseC: 25,
      energyDensity: "low"
    },
    scaling: {
      primario: "pollo",
      secundario: "verduras",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Brócoli, coliflor y zanahoria crujientes al airfryer · pechuga de pollo a la plancha",
      p2: "Salsa de yogur con curry suave · semillas de sésamo",
      shopping: [
        "Pechuga de pollo (180g)",
        "Brócoli (150g)", "Coliflor (100g)", "Zanahoria (1)",
        "Yogur natural (40g)", "Curry suave en polvo",
        "Semillas de sésamo",
        "AOVE (10ml)", "Sal", "Pimienta", "Ajo en polvo"
      ],
      recipe: [
        "Cortar verduras en floretes y bastones. Mezclar con AOVE, sal, pimienta y ajo en polvo.",
        "Airfryer las verduras 200°C 14 min girando a mitad.",
        "Salpimentar el pollo y hacer a la plancha 4 min por lado. Cortar en tiras.",
        "Mezclar yogur con curry y un poco de sal para salsa.",
        "Servir verduras crujientes con pollo encima, salsa y semillas de sésamo."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #44 — Huevos rellenos
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "huevos_rellenos",
      title: "Huevos rellenos de atún con ensalada",
      emoji: "🥚",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "huevos_rellenos",
      tags: ["spanish", "tradicional", "frio", "huevo"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 400, baseP: 36, baseF: 24, baseC: 12,
      energyDensity: "low"
    },
    scaling: {
      primario: "atun",
      secundario: "ensalada",
      noEscalar: ["huevo", "mayonesa"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "4 mitades de huevo duro rellenas de atún con mayonesa ligera · ensalada de tomate y lechuga",
      p2: "Pimentón dulce por encima · pan tostado opcional",
      shopping: [
        "Huevos (3)",
        "Atún en conserva al natural (80g)",
        "Mayonesa ligera (20g)",
        "Tomate (1)", "Lechuga (50g)", "Cebolla dulce (1/4)",
        "Pimentón dulce",
        "AOVE (10ml)", "Vinagre", "Sal", "Pimienta"
      ],
      recipe: [
        "Hervir los huevos 10 min, pasarlos a agua fría y pelar.",
        "Cortar por la mitad y separar las yemas.",
        "Mezclar yemas con atún escurrido y mayonesa.",
        "Rellenar las claras con la mezcla.",
        "Espolvorear pimentón por encima.",
        "Servir con ensalada de tomate, lechuga y cebolla aliñada."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #45 — Espárragos con mayo, atún y huevo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "esparragos_mayo_atun_huevo",
      title: "Espárragos con mayonesa, atún y huevo duro",
      emoji: "🥒",
      protein: "huevo",
      proteinType: "huevo",
      plateType: "esparragos_plato",
      tags: ["spanish", "frio", "verduras", "huevo"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 410, baseP: 28, baseF: 20, baseC: 25,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "atun",
      noEscalar: ["mayonesa", "huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: true
    },
    content: {
      p1: "Espárragos blancos en conserva · 2 huevos duros · atún al natural · mayonesa ligera · pan tostado",
      p2: "Pimentón dulce · cebolleta picada · perejil",
      shopping: [
        "Espárragos blancos en conserva (6-8 unidades / 200g)",
        "Huevos (2)",
        "Atún en conserva al natural (60g)",
        "Mayonesa ligera (25g)",
        "Pan integral (40g)",
        "Cebolleta (1)", "Pimentón dulce", "Perejil fresco", "Sal"
      ],
      recipe: [
        "Hervir los huevos 10 min, pelar y cortar en cuartos.",
        "Escurrir bien los espárragos y disponer en plato.",
        "Mezclar la mayonesa con un poco del agua de los espárragos para aligerar.",
        "Disponer el atún escurrido por encima de los espárragos.",
        "Añadir los cuartos de huevo y bañar con la mayonesa.",
        "Terminar con pimentón, cebolleta picada y perejil. Servir con pan tostado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #46 — Wrap mediterráneo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "wrap_mediterraneo",
      title: "Wrap mediterráneo de pollo, hummus y verduras",
      emoji: "🌯",
      protein: "pollo",
      proteinType: "ave",
      plateType: "wrap",
      tags: ["mediterranean", "tortilla_integral", "pollo", "hummus", "rapido"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 625, baseP: 51, baseF: 22, baseC: 50,
      energyDensity: "medium"
    },
    scaling: {
      primario: "tortilla",
      secundario: "pollo",
      noEscalar: ["hummus"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: true
    },
    content: {
      p1: "Tortilla integral grande con hummus, pollo en tiras a la plancha, tomate, pepino, lechuga y cebolla morada",
      p2: "AOVE · zumo de limón · sal · hierbas mediterráneas",
      shopping: [
        "Tortilla integral grande (1 / 80g)",
        "Pechuga de pollo (160g)",
        "Hummus (40g)",
        "Tomate (1)", "Pepino (1/2)", "Lechuga (3 hojas)", "Cebolla morada (1/4)",
        "Limón (1/2)", "AOVE (5ml)",
        "Sal", "Pimienta", "Orégano"
      ],
      recipe: [
        "Salpimentar el pollo y hacer a la plancha 4 min por lado. Cortar en tiras.",
        "Calentar la tortilla 30 seg en sartén.",
        "Untar el hummus por el centro de la tortilla.",
        "Disponer pollo, tomate, pepino, lechuga y cebolla morada.",
        "Aliñar con AOVE, limón, sal y orégano.",
        "Enrollar firmemente y cortar por la mitad."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #47 — Buddha bowl completo
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "buddha_bowl_completo",
      title: "Buddha bowl con quinoa, pollo, aguacate y verduras",
      emoji: "🥗",
      protein: "pollo",
      proteinType: "ave",
      plateType: "bowl",
      tags: ["bowl", "quinoa", "pollo", "verduras", "highCarb"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 695, baseP: 42, baseF: 25, baseC: 75,
      energyDensity: "medium"
    },
    scaling: {
      primario: "quinoa",
      secundario: "pollo",
      noEscalar: ["aguacate"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "diario",
      satietyScore: 5,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: false
    },
    content: {
      p1: "Quinoa · pollo a la plancha · aguacate · garbanzos asados · tomate cherry · zanahoria rallada · espinacas baby",
      p2: "Salsa de tahini con limón · semillas de sésamo y de calabaza",
      shopping: [
        "Quinoa (80g seca)",
        "Pechuga de pollo (150g)",
        "Aguacate (1/2)",
        "Garbanzos cocidos (60g)",
        "Tomate cherry (8)", "Zanahoria (1)", "Espinacas baby (50g)",
        "Tahini (10g)", "Limón (1/2)",
        "Semillas de sésamo y calabaza (10g)",
        "AOVE (10ml)", "Sal", "Pimentón", "Comino"
      ],
      recipe: [
        "Cocer la quinoa según paquete (unos 15 min) y dejar templar.",
        "Salpimentar el pollo y hacer a la plancha 4 min por lado. Cortar en tiras.",
        "Asar los garbanzos en sartén o airfryer con AOVE, pimentón y comino 8 min.",
        "Cortar tomate, zanahoria rallada y aguacate en láminas.",
        "Mezclar tahini con limón, agua y sal para la salsa.",
        "Montar bowl: quinoa de base, sectores de pollo, garbanzos, verduras y espinacas. Aliñar con tahini y terminar con semillas."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #48 — Bol de fruta variada con yogur y frutos secos
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "bol_fruta_yogur",
      title: "Bol de fruta variada con yogur griego y frutos secos",
      emoji: "🍓",
      protein: "fruta",
      proteinType: "vegetal",
      plateType: "bol_fruta",
      tags: ["fruta", "yogur", "frutos_secos", "rapido", "verano_friendly"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 470, baseP: 25, baseF: 16, baseC: 55,
      energyDensity: "low"
    },
    scaling: {
      primario: "fruta",
      secundario: "yogur",
      noEscalar: ["frutos_secos"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Al"],
      frecuencia: "diario",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: true },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 5,
      familiar: true
    },
    content: {
      p1: "Yogur griego natural alto en proteína · fruta variada de temporada (fresa, plátano, kiwi, manzana) · frutos secos y semillas",
      p2: "Miel o sirope opcional · canela · ralladura de limón",
      shopping: [
        "Yogur griego alto en proteína (200g)",
        "Plátano (1/2)", "Fresas (60g)", "Kiwi (1)", "Manzana (1/2)",
        "Almendras crudas (10g)", "Nueces (5g)", "Semillas de chía o lino (5g)",
        "Miel (5g, opcional)", "Canela", "Ralladura de limón"
      ],
      recipe: [
        "Lavar y cortar la fruta en trozos del tamaño que apetezca.",
        "Servir el yogur griego en un bol.",
        "Colocar la fruta encima por sectores.",
        "Espolvorear frutos secos picados y semillas.",
        "Añadir un hilo de miel si se quiere algo más dulce.",
        "Terminar con un toque de canela y ralladura de limón."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #49 — Pollo teriyaki con arroz
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pollo_teriyaki_arroz",
      title: "Pollo teriyaki con arroz jazmín y verduras",
      emoji: "🍱",
      protein: "pollo",
      proteinType: "ave",
      plateType: "teriyaki",
      tags: ["asian", "japones", "pollo", "arroz", "mainstream"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 650, baseP: 45, baseF: 14, baseC: 70,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "pollo",
      noEscalar: ["salsa_teriyaki"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Pollo glaseado con salsa teriyaki casera · arroz jazmín · brócoli al vapor · zanahoria",
      p2: "Cebolleta · sésamo tostado · jengibre fresco · ajo",
      shopping: [
        "Pechuga de pollo (180g)",
        "Arroz jazmín (80g seco)",
        "Brócoli (120g)", "Zanahoria (1)",
        "Salsa de soja (30ml)", "Miel o azúcar moreno (10g)",
        "Mirin o vinagre de arroz (10ml)",
        "Jengibre fresco", "Ajo (1 diente)",
        "Cebolleta (1)", "Semillas de sésamo",
        "Aceite de sésamo (5ml)", "Aceite de girasol (10ml)"
      ],
      recipe: [
        "Cocer el arroz jazmín según paquete.",
        "Mezclar salsa de soja, miel, mirin, jengibre rallado y ajo machacado para teriyaki.",
        "Cortar el pollo en bocados y dorarlo en sartén con aceite de girasol 4 min.",
        "Verter la salsa sobre el pollo y reducir 3-4 min hasta glasear.",
        "Cocer brócoli y zanahoria al vapor 6 min.",
        "Servir el arroz de base, pollo glaseado encima, verduras al lado.",
        "Terminar con cebolleta, semillas de sésamo y aceite de sésamo."
      ]
    }
  },

/* ────────────────────────────────────────────────────────────────
 * TANDA 4.6a — Españoles canónicos (5 combos, #50–#54)
 * ────────────────────────────────────────────────────────────────
 *
 * DISTRIBUCIÓN
 *   slot:          { C: 3, Ce: 3 }
 *   digestiveLoad: { low: 3, medium: 2, high: 0 }
 *   satietyScore:  { 3: 2, 4: 3, 5: 0 }
 *   frecuencia:    { diario: 2, semanal: 3, ocasional: 0 }
 *
 * NUEVOS CAMPOS EN identity (v3.2 — intolerancias)
 *   containsGluten:  boolean
 *   containsLactosa: boolean
 *   Forward-compatible: usados por inflateFreeFormForPool()
 *   cuando se implemente el filtro (Prompt 4).
 * ────────────────────────────────────────────────────────────────
 */

  // ────────────────────────────────────────────────────────
  // #50 — Sopa castellana con jamón y huevo pochado
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "sopa_castellana_jamon",
      title: "Sopa castellana con jamón serrano y huevo pochado",
      emoji: "🥣",
      protein: "jamon",
      proteinType: "carne",
      plateType: "sopa_castellana",
      tags: ["spanish", "castellano", "sopa", "cena_ligera", "invierno"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 380, baseP: 24, baseF: 15, baseC: 35,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "jamon",
      noEscalar: ["huevo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Caldo de ajo y pimentón con pan tostado deshecho · jamón serrano en tiras · huevo pochado",
      p2: "Pimentón dulce y ahumado · AOVE · ajo · perejil",
      shopping: [
        "Pan de pueblo (60g, mejor del día anterior)",
        "Jamón serrano (50g)",
        "Huevo (1)",
        "Ajo (3 dientes)", "Pimentón dulce (1 cdita)", "Pimentón ahumado (1/2 cdita)",
        "Caldo de pollo o agua (500ml)",
        "AOVE (15ml)", "Perejil fresco", "Sal"
      ],
      recipe: [
        "Corta el pan en dados. Dora el ajo laminado en AOVE a fuego bajo hasta dorado. Retira.",
        "En el mismo aceite tuesta los dados de pan 2-3 min hasta crujientes.",
        "Añade el pimentón fuera del fuego (no quemes), remueve 10 seg.",
        "Incorpora el caldo caliente y los ajos. Cuece 8 min.",
        "Pocha el huevo aparte en agua con un chorrito de vinagre 3 min.",
        "Sirve la sopa con el jamón en tiras y el huevo pochado encima. Termina con perejil."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #51 — Pollo al ajillo con patatas nuevas
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pollo_ajillo_patatas",
      title: "Pollo al ajillo con patatas nuevas",
      emoji: "🧄",
      protein: "pollo",
      proteinType: "ave",
      plateType: "pollo_ajillo",
      tags: ["spanish", "tradicional", "ajo", "patata", "invierno"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 560, baseP: 44, baseF: 18, baseC: 45,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "pollo",
      noEscalar: ["ajo"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: true
    },
    content: {
      p1: "Muslo y contramuslo de pollo dorado en cazuela · ajo entero sin pelar y laminado · patatas nuevas pequeñas",
      p2: "Vino blanco seco · laurel · romero · AOVE · sal · pimienta negra",
      shopping: [
        "Pollo en trozos (muslo + contramuslo, 280g)",
        "Patatas nuevas pequeñas (250g)",
        "Ajo (8 dientes, sin pelar)",
        "Vino blanco seco (60ml)",
        "Laurel (1 hoja)", "Romero (1 rama)",
        "AOVE (20ml)", "Sal", "Pimienta negra"
      ],
      recipe: [
        "Dora el pollo salpimentado en AOVE a fuego fuerte 4 min por lado. Reserva.",
        "En el mismo aceite añade los ajos enteros sin pelar y dora 2 min.",
        "Incorpora el vino y deja evaporar 1 min.",
        "Devuelve el pollo, añade las patatas enteras (si son pequeñas) o en mitades, laurel y romero.",
        "Cuece tapado a fuego medio-bajo 25 min girando a mitad.",
        "Destapa los últimos 5 min para que tome color. Rectifica sal."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #52 — Menestra de verduras de temporada con virutas de jamón
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "menestra_verduras_jamon",
      title: "Menestra de verduras de temporada con jamón",
      emoji: "🥦",
      protein: "jamon",
      proteinType: "carne",
      plateType: "menestra",
      tags: ["spanish", "navarra", "verduras", "ligero", "cena_ligera"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 320, baseP: 22, baseF: 9, baseC: 30,
      energyDensity: "low"
    },
    scaling: {
      primario: "verduras",
      secundario: "jamon",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: true
    },
    content: {
      p1: "Alcachofas, guisantes, espárragos verdes, judías verdes y zanahoria cocidos al dente · virutas de jamón ibérico",
      p2: "Sofrito suave de ajo y AOVE · 1 huevo duro opcional · sal · pimienta",
      shopping: [
        "Alcachofas (2, o en conserva 80g)", "Guisantes frescos o congelados (80g)",
        "Espárragos verdes (6)", "Judías verdes (80g)", "Zanahoria (1)",
        "Jamón ibérico en virutas (50g)",
        "Ajo (2 dientes)", "AOVE (10ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Cuece cada verdura por separado en agua con sal al dente (tiempos distintos).",
        "Alcachofas 15 min, zanahoria 10 min, judías 8 min, espárragos 5 min, guisantes 3 min.",
        "Sofríe el ajo laminado en AOVE hasta dorado.",
        "Añade todas las verduras juntas y saltea 2 min.",
        "Coloca en plato y coloca las virutas de jamón encima (se funden ligeramente con el calor).",
        "Sirve inmediatamente. Opcional: añadir huevo duro en cuartos."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #53 — Marmitako de bonito del norte
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "marmitako_bonito",
      title: "Marmitako de bonito del norte",
      emoji: "🐟",
      protein: "bonito",
      proteinType: "pescado",
      plateType: "marmitako",
      tags: ["spanish", "vasco", "pescado", "patata", "verano_friendly"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 540, baseP: 38, baseF: 10, baseC: 65,
      energyDensity: "medium"
    },
    scaling: {
      primario: "patata",
      secundario: "bonito",
      noEscalar: ["choricero"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 40,
      familiar: true
    },
    content: {
      p1: "Bonito del norte en tacos · patata cachada en guiso · pimiento verde y rojo · cebolleta",
      p2: "Carne de pimiento choricero · tomate triturado · ajo · AOVE · sal",
      shopping: [
        "Bonito del norte fresco (180g)",
        "Patata (250g)", "Pimiento verde (1)", "Pimiento rojo (1/2)",
        "Cebolleta (1)", "Tomate triturado (100g)", "Ajo (2 dientes)",
        "Carne de pimiento choricero (1 cda) o pimiento seco rehidratado",
        "AOVE (15ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Pocha cebolleta, ajo y pimientos en AOVE 10 min a fuego medio.",
        "Añade la carne de choricero y el tomate. Sofríe 5 min más.",
        "Incorpora las patatas chascadas (rotas a mitad del corte para que suelten almidón).",
        "Cubre con agua o caldo de pescado y cuece 20 min.",
        "Añade el bonito en dados cuando la patata esté casi lista.",
        "Cuece 3-4 min más, no más (el bonito se seca). Rectifica sal y reposa 5 min."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #54 — Berberechos al vapor con limón y pan tostado
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "berberechos_vapor_pan",
      title: "Berberechos al vapor con limón y pan tostado",
      emoji: "🦪",
      protein: "berberechos",
      proteinType: "marisco",
      plateType: "marisco_vapor",
      tags: ["spanish", "galicia", "marisco", "ligero", "cena_ligera"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 310, baseP: 26, baseF: 6, baseC: 30,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "berberechos",
      noEscalar: ["limon"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: false
    },
    content: {
      p1: "Berberechos frescos al vapor · limón · pan de pueblo tostado · ensalada verde",
      p2: "AOVE virgen extra · perejil · ajo · sal · pimienta",
      shopping: [
        "Berberechos frescos (400g en concha / 160g limpio)",
        "Limón (1)", "Ajo (1 diente)",
        "Pan de pueblo (60g)",
        "Mezclum (50g)",
        "Perejil fresco", "AOVE (10ml)", "Sal", "Pimienta negra"
      ],
      recipe: [
        "Purga los berberechos en agua fría con sal 30 min. Escurre y lava bien.",
        "En cazuela o sartén con tapa, añade un poco de agua, ajo laminado y el zumo de medio limón.",
        "Añade los berberechos, tapa y cuece a fuego fuerte 3-4 min hasta que abran.",
        "Descarta los que no hayan abierto.",
        "Tuesta el pan. Aliña la ensalada con AOVE, limón y sal.",
        "Sirve los berberechos con su jugo, perejil picado, limón partido y pan al lado."
      ]
    }
  },

/* ────────────────────────────────────────────────────────────────
 * TANDA 4.6b — Mediterráneos (5 combos, #55–#59)
 * ────────────────────────────────────────────────────────────────
 *
 * DISTRIBUCIÓN
 *   slot:          { C: 3, Ce: 3 }
 *   digestiveLoad: { low: 3, medium: 2, high: 0 }
 *   satietyScore:  { 3: 2, 4: 3, 5: 0 }
 *   frecuencia:    { diario: 2, semanal: 3, ocasional: 0 }
 * ────────────────────────────────────────────────────────────────
 */

  // ────────────────────────────────────────────────────────
  // #55 — Falafel con tabulé y yogur de menta
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "falafel_tabule_yogur",
      title: "Falafel con tabulé de bulgur y yogur de menta",
      emoji: "🧆",
      protein: "garbanzos",
      proteinType: "legumbre",
      plateType: "falafel_bowl",
      tags: ["mediterranean", "oriente_medio", "vegetariano", "legumbre", "highCarb"],
      containsGluten: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 595, baseP: 24, baseF: 22, baseC: 70,
      energyDensity: "medium"
    },
    scaling: {
      primario: "bulgur",
      secundario: "garbanzos",
      noEscalar: ["yogur"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: false
    },
    content: {
      p1: "Falafel casero de garbanzos al horno · tabulé de bulgur con perejil, menta y tomate · yogur griego de menta",
      p2: "Pita integral para acompañar · limón · AOVE",
      shopping: [
        "Garbanzos secos en remojo (100g) o cocidos (200g)",
        "Bulgur fino (60g seco)",
        "Perejil fresco (1 manojo grande)", "Menta fresca (8 hojas)",
        "Tomate (2)", "Cebolla morada (1/4)", "Pepino (1/2)",
        "Yogur griego natural (80g)",
        "Pita integral (1 pequeña / 50g)",
        "Comino", "Cilantro molido", "Ajo (2 dientes)",
        "Limón (1)", "AOVE (15ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Tritura garbanzos con ajo, comino, cilantro, sal y perejil. No triturar demasiado, debe tener textura.",
        "Forma bolas o discos, pinta con AOVE y hornea 200°C 20 min girando a mitad.",
        "Hidrata el bulgur con agua hirviendo (doble volumen) 15 min. Escurre y enfría.",
        "Mezcla el bulgur con perejil picado, menta, tomate en dados, pepino y cebolla. Aliña con AOVE y limón.",
        "Mezcla yogur con menta picada, un poco de limón y sal.",
        "Sirve el tabulé, coloca el falafel encima, añade yogur de menta y la pita al lado."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #56 — Sardinas a la plancha con escalivada y pan
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "sardinas_plancha_escalivada",
      title: "Sardinas a la plancha con escalivada y pan tostado",
      emoji: "🐟",
      protein: "sardinas",
      proteinType: "pescado",
      plateType: "sardinas_plancha",
      tags: ["mediterranean", "spanish", "pescado_graso", "verano_friendly", "omega3"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 420, baseP: 36, baseF: 18, baseC: 25,
      energyDensity: "low"
    },
    scaling: {
      primario: "sardinas",
      secundario: "pan",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: true, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Sardinas frescas a la plancha con sal y limón · escalivada de pimiento y berenjena · pan tostado",
      p2: "AOVE virgen extra · ajo · perejil · vinagre de Jerez",
      shopping: [
        "Sardinas frescas limpias (4-5 unidades / 220g limpio)",
        "Berenjena (1)", "Pimiento rojo (1)",
        "Pan de pueblo o integral (60g)",
        "Ajo (2 dientes)", "Perejil fresco",
        "Limón (1/2)", "Vinagre de Jerez (1 cdita)",
        "AOVE (15ml)", "Sal gruesa"
      ],
      recipe: [
        "Asa la berenjena y el pimiento enteros bajo el grill o en plancha directa 20 min girando.",
        "Pela cuando estén fríos, lamina la carne y aliña con AOVE, ajo laminado, vinagre y sal.",
        "Calienta la plancha fuerte. Sal gruesa encima. Cocina las sardinas 2 min por lado.",
        "Tuesta el pan.",
        "Sirve las sardinas con limón, la escalivada al lado y el pan tostado.",
        "Termina con perejil picado y un hilo de AOVE crudo."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #57 — Mejillones en salsa verde con pan
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "mejillones_salsa_verde",
      title: "Mejillones en salsa verde con pan de pueblo",
      emoji: "🦪",
      protein: "mejillones",
      proteinType: "marisco",
      plateType: "mejillones_salsa",
      tags: ["mediterranean", "spanish", "marisco", "ligero", "cena_ligera"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 340, baseP: 28, baseF: 10, baseC: 30,
      energyDensity: "low"
    },
    scaling: {
      primario: "pan",
      secundario: "mejillones",
      noEscalar: [],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: true
    },
    content: {
      p1: "Mejillones frescos abiertos en salsa verde de ajo, perejil y vino blanco · pan de pueblo",
      p2: "AOVE · harina (1 cdita para ligar la salsa) · sal",
      shopping: [
        "Mejillones frescos (700g en concha / 280g limpio)",
        "Ajo (3 dientes)", "Perejil fresco (1 manojo)",
        "Vino blanco seco (80ml)",
        "Harina de trigo (1 cdita)",
        "Pan de pueblo (60g)",
        "AOVE (15ml)", "Sal", "Pimienta"
      ],
      recipe: [
        "Limpia los mejillones quitando las barbas. Desecha los que estén abiertos y no cierren.",
        "Sofríe el ajo picado en AOVE a fuego bajo 2 min sin que dore.",
        "Añade la harina y tuéstala 1 min.",
        "Vierte el vino blanco y el perejil picado. Liga la salsa 2 min.",
        "Añade los mejillones, tapa y cuece a fuego fuerte 3-4 min hasta que abran.",
        "Sirve con la salsa por encima y el pan para mojar. Desecha los que no hayan abierto."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #58 — Pita de pollo a la harissa con ensalada árabe
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "pita_pollo_harissa",
      title: "Pita de pollo a la harissa con ensalada árabe y yogur",
      emoji: "🫓",
      protein: "pollo",
      proteinType: "ave",
      plateType: "pita_rellena",
      tags: ["mediterranean", "oriente_medio", "pita", "pollo", "especiado"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 570, baseP: 46, baseF: 16, baseC: 55,
      energyDensity: "medium"
    },
    scaling: {
      primario: "pita",
      secundario: "pollo",
      noEscalar: ["yogur"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Pita integral rellena de tiras de pollo marinado en harissa · ensalada árabe de tomate, pepino y perejil",
      p2: "Yogur griego con ajo y limón · lechuga · cebolla morada",
      shopping: [
        "Pita integral (1-2 unidades / 80g)",
        "Pechuga de pollo (170g)",
        "Harissa (15g) o pasta de chile + comino + ajo",
        "Yogur griego natural (60g)", "Ajo (1 diente)", "Limón (1/2)",
        "Tomate (1)", "Pepino (1/2)", "Perejil fresco",
        "Cebolla morada (1/4)", "Lechuga (2 hojas)",
        "AOVE (10ml)", "Sal", "Comino"
      ],
      recipe: [
        "Marina el pollo en harissa, AOVE, comino y sal 10 min mínimo.",
        "Haz el pollo en plancha fuerte 4 min por lado. Corta en tiras.",
        "Prepara la ensalada árabe: tomate + pepino + perejil + cebolla aliñados con AOVE y limón.",
        "Mezcla el yogur con ajo machacado, limón y sal.",
        "Calienta la pita 1 min en plancha.",
        "Rellena o abre la pita con lechuga, pollo, ensalada y yogur."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #59 — Ensalada de lentejas con feta y tomate
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "ensalada_lentejas_feta",
      title: "Ensalada tibia de lentejas con feta, tomate y hierbas",
      emoji: "🫘",
      protein: "lentejas",
      proteinType: "legumbre",
      plateType: "ensalada_legumbre",
      tags: ["mediterranean", "griego", "legumbre", "feta", "frio"],
      containsGluten: false,
      containsLactosa: true
    },
    nutrition: {
      baseKcal: 440, baseP: 24, baseF: 15, baseC: 45,
      energyDensity: "low"
    },
    scaling: {
      primario: "lentejas",
      secundario: null,
      noEscalar: ["feta"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C", "Ce"],
      frecuencia: "diario",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: false },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: false
    },
    content: {
      p1: "Lentejas pardinas cocidas tibias · feta desmenuzado · tomate cherry · pepino · cebolla morada",
      p2: "Aliño de AOVE, limón y orégano · menta fresca · perejil",
      shopping: [
        "Lentejas pardinas cocidas (200g, de bote o cocidas previamente)",
        "Queso feta (80g)",
        "Tomate cherry (10)", "Pepino (1/2)", "Cebolla morada (1/3)",
        "Menta fresca", "Perejil fresco",
        "Limón (1/2)", "Orégano seco",
        "AOVE (15ml)", "Sal", "Pimienta negra"
      ],
      recipe: [
        "Escurre y enjuaga las lentejas. Templa en sartén con un chorrito de AOVE 2 min.",
        "Corta el tomate por la mitad, el pepino en medias lunas y la cebolla en juliana fina.",
        "Mezcla las lentejas tibias con las verduras.",
        "Aliña con AOVE, zumo de limón, orégano, sal y pimienta.",
        "Desmenuza el feta por encima.",
        "Termina con menta y perejil picados. Sirve tibia o a temperatura ambiente."
      ]
    }
  },

/* ────────────────────────────────────────────────────────────────
 * TANDA 4.6c — Asiáticos (5 combos, #60–#64)
 * ────────────────────────────────────────────────────────────────
 *
 * DISTRIBUCIÓN
 *   slot:          { C: 3, Ce: 4 }
 *   digestiveLoad: { low: 2, medium: 3, high: 0 }
 *   satietyScore:  { 3: 1, 4: 3, 5: 1 }
 *   frecuencia:    { diario: 2, semanal: 2, ocasional: 1 }
 * ────────────────────────────────────────────────────────────────
 */

  // ────────────────────────────────────────────────────────
  // #60 — Tom Kha Gai (sopa tailandesa de pollo y coco)
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "tom_kha_gai",
      title: "Tom Kha Gai — sopa tailandesa de pollo y coco",
      emoji: "🍲",
      protein: "pollo",
      proteinType: "ave",
      plateType: "sopa_coco",
      tags: ["asian", "thai", "sopa", "coco", "cena_ligera"],
      containsGluten: false,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 420, baseP: 32, baseF: 22, baseC: 25,
      energyDensity: "low"
    },
    scaling: {
      primario: "pollo",
      secundario: "setas",
      noEscalar: ["coco"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 25,
      familiar: false
    },
    content: {
      p1: "Sopa cremosa de leche de coco con pechuga de pollo en tiras · setas shiitake · galanga o jengibre",
      p2: "Lemongrass · hojas de lima kaffir · salsa de pescado · lima · cilantro · chile",
      shopping: [
        "Pechuga de pollo (150g)",
        "Leche de coco light (200ml)",
        "Caldo de pollo (200ml)",
        "Setas shiitake o de cultivo (80g)",
        "Galanga fresca (o jengibre, 20g)",
        "Lemongrass (1 tallo)", "Hojas de lima kaffir (3, frescas o secas)",
        "Salsa de pescado (15ml)", "Lima (1)",
        "Chile rojo (1/2)", "Cilantro fresco"
      ],
      recipe: [
        "Calienta el caldo con galanga en rodajas, lemongrass aplastado y hojas de lima 5 min.",
        "Añade la leche de coco y calienta sin hervir.",
        "Incorpora el pollo en tiras finas y las setas laminadas. Cuece 8 min a fuego suave.",
        "Sazona con salsa de pescado al gusto.",
        "Sirve en bol con zumo de lima, chile laminado y cilantro fresco.",
        "No comer el lemongrass ni la galanga, son aromáticos de cocción."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #61 — Bowl de salmón teriyaki con edamame y arroz
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "bowl_salmon_teriyaki",
      title: "Bowl de salmón teriyaki con edamame, arroz y pepino",
      emoji: "🍱",
      protein: "salmon",
      proteinType: "pescado",
      plateType: "bowl_salmon",
      tags: ["asian", "japones", "salmon", "bowl", "omega3", "highCarb"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 620, baseP: 38, baseF: 18, baseC: 65,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "salmon",
      noEscalar: ["salsa_teriyaki"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 4,
      digestiveLoad: "low",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 20,
      familiar: false
    },
    content: {
      p1: "Arroz jazmín · salmón glaseado con teriyaki casero · edamame · pepino · aguacate · sésamo",
      p2: "Salsa teriyaki (soja + mirin + miel) · cebolleta · jengibre encurtido opcional",
      shopping: [
        "Salmón fresco o congelado (160g)",
        "Arroz jazmín o sushi (80g seco)",
        "Edamame congelado (80g)",
        "Pepino (1/2)", "Aguacate (1/3)",
        "Salsa de soja (20ml)", "Mirin (15ml)", "Miel (5g)",
        "Cebolleta (1)", "Semillas de sésamo tostado",
        "Jengibre encurtido (opcional)", "Aceite de sésamo (5ml)"
      ],
      recipe: [
        "Cuece el arroz y el edamame.",
        "Mezcla soja, mirin y miel para el teriyaki. Calienta en sartén 1 min hasta espesar ligeramente.",
        "Sella el salmón en sartén con poco aceite 2 min por lado. Añade la salsa teriyaki y glasea 1 min.",
        "Corta el pepino y el aguacate en láminas.",
        "Monta el bowl: arroz de base, salmón glaseado, edamame, pepino y aguacate en sectores.",
        "Termina con cebolleta, sésamo y aceite de sésamo."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #62 — Bibimbap de ternera picada con huevo y verduras
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "bibimbap_ternera_huevo",
      title: "Bibimbap de ternera picada, huevo y verduras salteadas",
      emoji: "🍚",
      protein: "ternera",
      proteinType: "carne",
      plateType: "bibimbap",
      tags: ["asian", "coreano", "arroz", "carne", "huevo", "multi_fuente"],
      multi_fuente_roles: ["base", "topping"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 680, baseP: 42, baseF: 22, baseC: 70,
      energyDensity: "medium"
    },
    scaling: {
      primario: "arroz",
      secundario: "ternera",
      noEscalar: ["huevo", "gochujang"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "semanal",
      satietyScore: 5,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 30,
      familiar: false
    },
    content: {
      p1: "Arroz blanco · ternera picada especiada · espinacas salteadas · zanahoria · brotes de soja · huevo a la sartén",
      p2: "Gochujang (pasta de chile coreana) · salsa de soja · aceite de sésamo · ajo",
      shopping: [
        "Arroz de grano corto o jazmín (80g seco)",
        "Ternera picada magra (140g)",
        "Espinacas baby (80g)", "Zanahoria (1)", "Brotes de soja (60g)",
        "Huevo (1)",
        "Gochujang (1 cda)", "Salsa de soja (15ml)",
        "Ajo (2 dientes)", "Jengibre fresco",
        "Aceite de sésamo (10ml)", "Semillas de sésamo",
        "Aceite de girasol (10ml)", "Azúcar (1 cdita)", "Sal"
      ],
      recipe: [
        "Cuece el arroz. Reserva caliente.",
        "Marina la ternera con soja, ajo, jengibre, azúcar y aceite de sésamo 5 min. Saltea en sartén 4 min.",
        "Saltea las espinacas con ajo y aceite de sésamo 2 min. Reserva.",
        "Saltea la zanahoria en juliana 3 min. Reserva. Aliña los brotes de soja crudos con soja y sésamo.",
        "Fríe el huevo con la yema líquida.",
        "Monta el bol: arroz de base, sectores de ternera, espinacas, zanahoria y brotes, huevo en el centro.",
        "Añade gochujang al gusto, aceite de sésamo y semillas. Mezcla todo antes de comer."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #63 — Bao de pollo con pepino, cebolleta y hoisin
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "bao_pollo_hoisin",
      title: "Bao de pollo deshilachado con pepino y salsa hoisin",
      emoji: "🫓",
      protein: "pollo",
      proteinType: "cereal",
      plateType: "bao",
      tags: ["asian", "chino", "vapor", "pollo", "callejero"],
      containsGluten: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 490, baseP: 32, baseF: 14, baseC: 55,
      energyDensity: "medium"
    },
    scaling: {
      primario: "bao",
      secundario: "pollo",
      noEscalar: ["hoisin"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.4
    },
    behavior: {
      slot: ["C"],
      frecuencia: "ocasional",
      satietyScore: 4,
      digestiveLoad: "medium",
      trainingProfile: { pre: false, post: true, highCarb: true },
      lightMealCompatible: false,
      avoidInAggressiveCut: false,
      tiempo: 35,
      familiar: false
    },
    content: {
      p1: "Bollos bao al vapor · muslo de pollo deshilachado con salsa hoisin y soja · pepino en bastones · cebolleta",
      p2: "Semillas de sésamo · cilantro opcional · salsa sriracha",
      shopping: [
        "Bollos bao precocinados congelados (3-4 unidades / 160g)",
        "Muslo de pollo deshuesado y sin piel (180g)",
        "Salsa hoisin (25ml)", "Salsa de soja (10ml)",
        "Ajo (1 diente)", "Jengibre fresco",
        "Pepino (1/2)", "Cebolleta (2)",
        "Semillas de sésamo tostado",
        "Sriracha al gusto", "Aceite de sésamo (5ml)"
      ],
      recipe: [
        "Marina el pollo con hoisin, soja, ajo y jengibre rallado 15 min.",
        "Hornea el pollo en papel a 180°C 25 min. Deja reposar 5 min y deshilacha con dos tenedores.",
        "Mezcla el pollo deshilachado con la salsa del horneado y un poco más de hoisin.",
        "Calienta los bao al vapor según instrucciones (5-6 min en vaporizador o 2 min en microondas con papel húmedo).",
        "Corta el pepino en bastones finos y la cebolleta en tiras.",
        "Rellena cada bao con pollo, pepino, cebolleta, sésamo y sriracha al gusto."
      ]
    }
  },

  // ────────────────────────────────────────────────────────
  // #64 — Sopa de miso con tofu firme y setas shiitake
  // ────────────────────────────────────────────────────────
  {
    freeForm: true,
    identity: {
      id: "sopa_miso_tofu",
      title: "Sopa de miso con tofu firme, setas shiitake y alga wakame",
      emoji: "🍵",
      protein: "tofu",
      proteinType: "vegetal",
      plateType: "sopa_miso",
      tags: ["asian", "japones", "vegetariano", "sopa", "cena_ligera", "digestivo"],
      containsGluten: true,
      glutenFreeAdaptable: true,
      containsLactosa: false
    },
    nutrition: {
      baseKcal: 280, baseP: 20, baseF: 8, baseC: 28,
      energyDensity: "low"
    },
    scaling: {
      primario: "tofu",
      secundario: null,
      noEscalar: ["miso", "alga"],
      minScaleFactor: 0.6,
      maxScaleFactor: 1.5
    },
    behavior: {
      slot: ["Ce"],
      frecuencia: "diario",
      satietyScore: 3,
      digestiveLoad: "low",
      trainingProfile: { pre: true, post: false, highCarb: false },
      lightMealCompatible: true,
      avoidInAggressiveCut: false,
      tiempo: 15,
      familiar: false
    },
    content: {
      p1: "Caldo dashi · miso blanco disuelto · tofu firme en dados · setas shiitake · alga wakame · cebolleta",
      p2: "Acompañar con arroz blanco (50g seco) si se quiere versión más saciante (+180kcal)",
      shopping: [
        "Tofu firme (180g)",
        "Pasta de miso blanco o rojo (2 cdas / 30g)",
        "Caldo dashi (500ml, de sobre dashi + agua o caldo de alga kombu)",
        "Setas shiitake secas (10g) o frescas (60g)",
        "Alga wakame seca (5g)",
        "Cebolleta (2)", "Salsa de soja (5ml, opcional)",
        "Aceite de sésamo (3ml)"
      ],
      recipe: [
        "Hidrata el alga wakame en agua fría 5 min. Escurre.",
        "Hidrata las setas secas en agua caliente 10 min. Cuela el agua (guárdala para el caldo).",
        "Calienta el caldo dashi hasta casi hervir. NO hervir el miso.",
        "Añade el tofu en dados pequeños y las setas. Cuece 3 min.",
        "Apaga el fuego. Disuelve el miso en un poco de caldo frío y añade a la sopa.",
        "Añade el wakame y la cebolleta en rodajas finas. Unas gotas de aceite de sésamo al servir."
      ]
    }
  }

];

/* ────────────────────────────────────────────────────────────────
 * checkDuplicates
 * ──────────────────────────────────────────────────────────────── */
export function checkDuplicates(combos) {
  var byId = {};
  var byProteinPlate = {};
  var hardDuplicates = [];
  var softDuplicates = [];

  if (!Array.isArray(combos)) {
    return { hardDuplicates: [], softDuplicates: [] };
  }

  for (var i = 0; i < combos.length; i++) {
    var c = combos[i];
    if (!c || !c.identity) continue;

    var id = c.identity.id;
    var key = (c.identity.protein || "?") + "|" + (c.identity.plateType || "?");

    if (id) {
      if (byId[id] !== undefined) {
        hardDuplicates.push({ id: id, indices: [byId[id], i] });
      } else {
        byId[id] = i;
      }
    }

    if (byProteinPlate[key] !== undefined) {
      softDuplicates.push({
        key: key,
        ids: [
          combos[byProteinPlate[key]].identity.id,
          id
        ]
      });
    } else {
      byProteinPlate[key] = i;
    }
  }

  return { hardDuplicates, softDuplicates };
}

/* ────────────────────────────────────────────────────────────────
 * checkDistribution
 * ──────────────────────────────────────────────────────────────── */
export function checkDistribution(combos) {
  var dist = {
    slot: { C:0, Ce:0, Al:0 },
    digestiveLoad: { low:0, medium:0, high:0 },
    satietyScore: { 1:0,2:0,3:0,4:0,5:0 },
    frecuencia: { diario:0, semanal:0, ocasional:0 }
  };

  if (!Array.isArray(combos)) return dist;

  for (var i = 0; i < combos.length; i++) {
    var c = combos[i];
    if (!c || !c.behavior) continue;

    var b = c.behavior;

    if (Array.isArray(b.slot)) {
      for (var j = 0; j < b.slot.length; j++) {
        var s = b.slot[j];
        if (dist.slot[s] !== undefined) dist.slot[s]++;
      }
    }

    if (dist.digestiveLoad[b.digestiveLoad] !== undefined) {
      dist.digestiveLoad[b.digestiveLoad]++;
    }

    if (dist.satietyScore[b.satietyScore] !== undefined) {
      dist.satietyScore[b.satietyScore]++;
    }

    if (dist.frecuencia[b.frecuencia] !== undefined) {
      dist.frecuencia[b.frecuencia]++;
    }
  }

  return dist;
}

/* ────────────────────────────────────────────────────────────────
 * loadFreeFormCombos
 * ──────────────────────────────────────────────────────────────── */
export function loadFreeFormCombos(combos, validateFreeFormPool, opts) {
  opts = opts || {};
  var strict = opts.strict === true;
  var healthRatioMin = typeof opts.healthRatioMin === "number"
    ? opts.healthRatioMin
    : 0.8;

  var validationResult = validateFreeFormPool(combos, { strict: strict });

  var pool = validationResult.validCombos;

  var duplicates = checkDuplicates(pool);
  var distribution = checkDistribution(pool);

  var ratio = combos.length > 0
    ? validationResult.summary.valid / combos.length
    : 1;

  var healthy =
    ratio >= healthRatioMin &&
    duplicates.hardDuplicates.length === 0;

  var summary = {
    total: combos.length,
    valid: validationResult.summary.valid,
    invalid: validationResult.summary.invalid,
    ratio: ratio,
    totalErrors: validationResult.summary.totalErrors,
    totalWarnings: validationResult.summary.totalWarnings
  };

  if (strict || !healthy) {
    console.warn("[loadFreeFormCombos] summary", summary);
    console.warn("[loadFreeFormCombos] distribution", distribution);

    if (duplicates.hardDuplicates.length) {
      console.warn("[loadFreeFormCombos] HARD DUPLICATES", duplicates.hardDuplicates);
    }

    if (duplicates.softDuplicates.length) {
      console.warn("[loadFreeFormCombos] SOFT DUPLICATES", duplicates.softDuplicates);
    }
  }

  return {
    pool,
    summary,
    duplicates,
    distribution,
    healthy
  };
}
