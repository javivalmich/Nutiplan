// ─── BASE DE DATOS DE ALIMENTOS ──────────────────────────────────────────────
// Extraído de App.jsx — NO modificar lógica, sólo se mueven las definiciones.

// ─── BASE DE DATOS DE ALIMENTOS (kcal por 100g) ────────────────────────────
export const FOOD_DB = [
  // ── HUEVOS ──────────────────────────────────────────────────────────────
  {name:"Huevo frito",              kcal100:196, defaultG:60},
  {name:"Huevo cocido",             kcal100:155, defaultG:55},
  {name:"Huevo revuelto con leche", kcal100:170, defaultG:100},
  {name:"Tortilla francesa",        kcal100:155, defaultG:100},
  {name:"Tortilla de patata",       kcal100:185, defaultG:150},
  // ── LÁCTEOS ─────────────────────────────────────────────────────────────
  {name:"Leche entera",             kcal100:65,  defaultG:250},
  {name:"Leche semidesnatada",      kcal100:46,  defaultG:250},
  {name:"Leche desnatada",          kcal100:34,  defaultG:250},
  {name:"Yogur natural",            kcal100:61,  defaultG:125},
  {name:"Yogur griego 0%",          kcal100:57,  defaultG:125},
  {name:"Yogur de sabores",         kcal100:95,  defaultG:125},
  {name:"Kéfir",                    kcal100:52,  defaultG:200},
  {name:"Queso manchego",           kcal100:392, defaultG:30},
  {name:"Queso brie",               kcal100:334, defaultG:30},
  {name:"Queso fresco 0%",          kcal100:74,  defaultG:80},
  {name:"Queso en lonchas",         kcal100:330, defaultG:20},
  {name:"Mozzarella",               kcal100:280, defaultG:50},
  {name:"Parmesano rallado",        kcal100:431, defaultG:15},
  {name:"Requesón",                 kcal100:90,  defaultG:100},
  {name:"Nata para cocinar",        kcal100:195, defaultG:50},
  {name:"Mantequilla",              kcal100:717, defaultG:10},
  // ── CARNES ──────────────────────────────────────────────────────────────
  {name:"Pechuga de pollo plancha", kcal100:150, defaultG:150},
  {name:"Pechuga de pollo frita",   kcal100:215, defaultG:150},
  {name:"Muslo de pollo asado",     kcal100:215, defaultG:150},
  {name:"Pechuga de pavo plancha",  kcal100:135, defaultG:150},
  {name:"Ternera magra plancha",    kcal100:185, defaultG:150},
  {name:"Chuletón de ternera",      kcal100:270, defaultG:300},
  {name:"Hamburguesa de ternera",   kcal100:250, defaultG:150},
  {name:"Cerdo lomo plancha",       kcal100:180, defaultG:150},
  {name:"Solomillo de cerdo",       kcal100:165, defaultG:150},
  {name:"Costillas de cerdo",       kcal100:290, defaultG:200},
  {name:"Cordero chuletas",         kcal100:290, defaultG:150},
  {name:"Conejo al horno",          kcal100:160, defaultG:200},
  {name:"Pato asado",               kcal100:339, defaultG:150},
  // ── EMBUTIDOS ───────────────────────────────────────────────────────────
  {name:"Jamón serrano",            kcal100:250, defaultG:30},
  {name:"Jamón cocido",             kcal100:130, defaultG:30},
  {name:"Chorizo",                  kcal100:455, defaultG:30},
  {name:"Salchichón",               kcal100:425, defaultG:30},
  {name:"Fuet",                     kcal100:440, defaultG:30},
  {name:"Mortadela",                kcal100:311, defaultG:30},
  {name:"Pavo fiambre",             kcal100:105, defaultG:40},
  {name:"Panceta",                  kcal100:520, defaultG:30},
  {name:"Bacon",                    kcal100:476, defaultG:30},
  {name:"Morcilla",                 kcal100:350, defaultG:50},
  {name:"Salchicha frankfurt",      kcal100:290, defaultG:50},
  {name:"Salchicha fresca",         kcal100:315, defaultG:80},
  {name:"Sobrasada",                kcal100:500, defaultG:30},
  // ── PESCADO Y MARISCO ───────────────────────────────────────────────────
  {name:"Salmón a la plancha",      kcal100:183, defaultG:175},
  {name:"Salmón ahumado",           kcal100:145, defaultG:50},
  {name:"Merluza al horno",         kcal100:82,  defaultG:175},
  {name:"Dorada a la sal",          kcal100:96,  defaultG:175},
  {name:"Bacalao al horno",         kcal100:105, defaultG:150},
  {name:"Trucha al horno",          kcal100:135, defaultG:175},
  {name:"Caballa en lata",          kcal100:185, defaultG:100},
  {name:"Sardinas en aceite",       kcal100:208, defaultG:100},
  {name:"Atún al natural",          kcal100:103, defaultG:80},
  {name:"Atún en aceite",           kcal100:200, defaultG:80},
  {name:"Gambas a la plancha",      kcal100:85,  defaultG:150},
  {name:"Langostinos cocidos",      kcal100:90,  defaultG:150},
  {name:"Mejillones al vapor",      kcal100:86,  defaultG:100},
  {name:"Pulpo a la gallega",       kcal100:82,  defaultG:150},
  {name:"Calamar a la romana",      kcal100:240, defaultG:150},
  {name:"Calamar a la plancha",     kcal100:90,  defaultG:150},
  {name:"Boquerones en vinagre",    kcal100:150, defaultG:100},
  {name:"Anchoas en aceite",        kcal100:210, defaultG:20},
  // ── VEGETALES Y VERDURAS ─────────────────────────────────────────────────
  {name:"Ensalada mixta",           kcal100:25,  defaultG:150},
  {name:"Espinacas cocidas",        kcal100:23,  defaultG:150},
  {name:"Brócoli al vapor",         kcal100:34,  defaultG:180},
  {name:"Coliflor al vapor",        kcal100:25,  defaultG:180},
  {name:"Judías verdes",            kcal100:31,  defaultG:180},
  {name:"Zanahorias crudas",        kcal100:41,  defaultG:100},
  {name:"Tomate",                   kcal100:18,  defaultG:100},
  {name:"Pepino",                   kcal100:16,  defaultG:100},
  {name:"Pimiento rojo",            kcal100:31,  defaultG:100},
  {name:"Calabacín a la plancha",   kcal100:35,  defaultG:150},
  {name:"Berenjena asada",          kcal100:35,  defaultG:150},
  {name:"Espárragos al horno",      kcal100:20,  defaultG:140},
  {name:"Champiñones salteados",    kcal100:45,  defaultG:100},
  {name:"Cebolla caramelizada",     kcal100:80,  defaultG:50},
  {name:"Aguacate",                 kcal100:160, defaultG:80},
  {name:"Alcachofa cocida",         kcal100:53,  defaultG:120},
  {name:"Acelgas cocidas",          kcal100:20,  defaultG:150},
  {name:"Puerro cocido",            kcal100:31,  defaultG:100},
  {name:"Apio",                     kcal100:16,  defaultG:80},
  {name:"Remolacha cocida",         kcal100:45,  defaultG:80},
  // ── LEGUMBRES ────────────────────────────────────────────────────────────
  {name:"Lentejas cocidas",         kcal100:116, defaultG:200},
  {name:"Garbanzos cocidos",        kcal100:164, defaultG:200},
  {name:"Alubias blancas cocidas",  kcal100:130, defaultG:200},
  {name:"Judías pintas cocidas",    kcal100:127, defaultG:200},
  {name:"Edamame",                  kcal100:121, defaultG:100},
  {name:"Hummus",                   kcal100:177, defaultG:50},
  // ── CEREALES Y HARINAS ───────────────────────────────────────────────────
  {name:"Arroz blanco cocido",      kcal100:130, defaultG:180},
  {name:"Pasta cocida",             kcal100:131, defaultG:180},
  {name:"Avena cruda",              kcal100:389, defaultG:55},
  {name:"Pan blanco",               kcal100:265, defaultG:50},
  {name:"Pan de centeno",           kcal100:258, defaultG:50},
  {name:"Pan de molde",             kcal100:270, defaultG:30},
  {name:"Boniato asado",            kcal100:90,  defaultG:180},
  {name:"Patata cocida",            kcal100:87,  defaultG:180},
  {name:"Patata asada",             kcal100:93,  defaultG:180},
  {name:"Patatas fritas caseras",   kcal100:312, defaultG:150},
  {name:"Patatas fritas bolsa",     kcal100:536, defaultG:30},
  {name:"Cuscús cocido",            kcal100:112, defaultG:150},
  {name:"Quinoa cocida",            kcal100:120, defaultG:150},
  // ── FRUTAS ───────────────────────────────────────────────────────────────
  {name:"Manzana",                  kcal100:52,  defaultG:150},
  {name:"Plátano",                  kcal100:89,  defaultG:120},
  {name:"Naranja",                  kcal100:47,  defaultG:150},
  {name:"Mandarina",                kcal100:53,  defaultG:100},
  {name:"Pera",                     kcal100:57,  defaultG:150},
  {name:"Uvas",                     kcal100:69,  defaultG:100},
  {name:"Fresas",                   kcal100:32,  defaultG:150},
  {name:"Arándanos",                kcal100:57,  defaultG:100},
  {name:"Mango",                    kcal100:60,  defaultG:150},
  {name:"Piña",                     kcal100:50,  defaultG:150},
  {name:"Kiwi",                     kcal100:61,  defaultG:100},
  {name:"Sandía",                   kcal100:30,  defaultG:200},
  {name:"Melón",                    kcal100:34,  defaultG:200},
  {name:"Melocotón",                kcal100:39,  defaultG:150},
  {name:"Cereza",                   kcal100:63,  defaultG:100},
  {name:"Ciruela",                  kcal100:46,  defaultG:80},
  {name:"Higo",                     kcal100:74,  defaultG:60},
  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────
  {name:"Almendras",                kcal100:579, defaultG:25},
  {name:"Nueces",                   kcal100:654, defaultG:25},
  {name:"Pistachos",                kcal100:562, defaultG:25},
  {name:"Avellanas",                kcal100:628, defaultG:25},
  {name:"Anacardos",                kcal100:553, defaultG:25},
  {name:"Cacahuetes",               kcal100:567, defaultG:30},
  {name:"Pipas de girasol",         kcal100:582, defaultG:30},
  {name:"Semillas de chía",         kcal100:486, defaultG:15},
  {name:"Semillas de lino",         kcal100:534, defaultG:15},
  // ── ACEITES Y GRASAS ─────────────────────────────────────────────────────
  {name:"AOVE (aceite de oliva)",   kcal100:884, defaultG:10},
  {name:"Aceite de coco",           kcal100:862, defaultG:10},
  {name:"Mantequilla de cacahuete", kcal100:588, defaultG:30},
  // ── BOLLERÍA Y DULCES ────────────────────────────────────────────────────
  {name:"Palmera de chocolate",     kcal100:430, defaultG:80},
  {name:"Palmera normal",           kcal100:390, defaultG:80},
  {name:"Croissant mantequilla",    kcal100:406, defaultG:65},
  {name:"Croissant chocolate",      kcal100:430, defaultG:65},
  {name:"Napolitana chocolate",     kcal100:380, defaultG:80},
  {name:"Donut glaseado",           kcal100:380, defaultG:50},
  {name:"Magdalena",                kcal100:390, defaultG:40},
  {name:"Bizcocho",                 kcal100:340, defaultG:60},
  {name:"Tarta de queso",           kcal100:320, defaultG:100},
  {name:"Tiramisú",                 kcal100:280, defaultG:100},
  {name:"Brownie",                  kcal100:400, defaultG:80},
  {name:"Churros",                  kcal100:315, defaultG:100},
  {name:"Porras",                   kcal100:310, defaultG:100},
  {name:"Buñuelo",                  kcal100:350, defaultG:50},
  {name:"Galletas María",           kcal100:430, defaultG:30},
  {name:"Galletas Oreo",            kcal100:470, defaultG:30},
  {name:"Galletas digestive",       kcal100:463, defaultG:30},
  {name:"Galleta de avena",         kcal100:400, defaultG:30},
  {name:"Flan",                     kcal100:130, defaultG:100},
  {name:"Arroz con leche",          kcal100:130, defaultG:200},
  {name:"Natillas",                 kcal100:120, defaultG:125},
  {name:"Helado de vainilla",       kcal100:207, defaultG:100},
  {name:"Helado de chocolate",      kcal100:230, defaultG:100},
  {name:"Sorbete de limón",         kcal100:109, defaultG:100},
  // ── CHOCOLATE ────────────────────────────────────────────────────────────
  {name:"Chocolate negro 70%",      kcal100:570, defaultG:30},
  {name:"Chocolate con leche",      kcal100:530, defaultG:30},
  {name:"Chocolate blanco",         kcal100:539, defaultG:30},
  {name:"Kinder Bueno",             kcal100:555, defaultG:43},
  {name:"Kitkat",                   kcal100:508, defaultG:41},
  {name:"Ferrero Rocher",           kcal100:567, defaultG:12},
  {name:"Snickers",                 kcal100:488, defaultG:52},
  {name:"Twix",                     kcal100:495, defaultG:58},
  {name:"Lacasitos",                kcal100:476, defaultG:40},
  // ── SNACKS SALADOS ───────────────────────────────────────────────────────
  {name:"Nachos",                   kcal100:495, defaultG:50},
  {name:"Palomitas de cine",        kcal100:375, defaultG:100},
  {name:"Palomitas microondas",     kcal100:440, defaultG:40},
  {name:"Ritz crackers",            kcal100:483, defaultG:30},
  {name:"Doritos",                  kcal100:490, defaultG:40},
  // ── BEBIDAS ALCOHÓLICAS ──────────────────────────────────────────────────
  {name:"Cerveza (lata 330ml)",     kcal100:43,  defaultG:330},
  {name:"Cerveza sin alcohol",      kcal100:28,  defaultG:330},
  {name:"Vino tinto (copa)",        kcal100:85,  defaultG:150},
  {name:"Vino blanco (copa)",       kcal100:82,  defaultG:150},
  {name:"Vino rosado (copa)",       kcal100:80,  defaultG:150},
  {name:"Cava o champán",           kcal100:76,  defaultG:150},
  {name:"Whisky",                   kcal100:250, defaultG:40},
  {name:"Gin tonic",                kcal100:80,  defaultG:250},
  {name:"Ron con cola",             kcal100:65,  defaultG:200},
  {name:"Sangría",                  kcal100:65,  defaultG:250},
  {name:"Sidra",                    kcal100:36,  defaultG:330},
  // ── BEBIDAS SIN ALCOHOL ──────────────────────────────────────────────────
  {name:"Refresco cola",            kcal100:42,  defaultG:330},
  {name:"Refresco naranja",         kcal100:45,  defaultG:330},
  {name:"Zumo naranja natural",     kcal100:45,  defaultG:200},
  {name:"Zumo de manzana",          kcal100:47,  defaultG:200},
  {name:"Batido de chocolate",      kcal100:80,  defaultG:250},
  {name:"Café con leche",           kcal100:35,  defaultG:200},
  {name:"Café solo",                kcal100:2,   defaultG:50},
  {name:"Café con azúcar",          kcal100:20,  defaultG:100},
  {name:"Zumo verde (kale-manzana)",kcal100:40,  defaultG:250},
  {name:"Agua con gas",             kcal100:0,   defaultG:330},
  // ── COMIDA RÁPIDA Y RESTAURANTE ──────────────────────────────────────────
  {name:"Pizza margarita",          kcal100:265, defaultG:200},
  {name:"Pizza pepperoni",          kcal100:300, defaultG:200},
  {name:"Hamburguesa completa",     kcal100:295, defaultG:250},
  {name:"Perrito caliente",         kcal100:280, defaultG:150},
  {name:"Patatas fritas McDonald's",kcal100:312, defaultG:115},
  {name:"Kebab de pollo",           kcal100:190, defaultG:300},
  {name:"Kebab de ternera",         kcal100:210, defaultG:300},
  {name:"Sushi (pieza)",            kcal100:145, defaultG:30},
  {name:"Sushi variado (bandeja)",  kcal100:145, defaultG:200},
  {name:"Pad thai",                 kcal100:185, defaultG:300},
  {name:"Tacos de pollo (ud)",      kcal100:185, defaultG:100},
  // ── TAPAS Y RACIONES ─────────────────────────────────────────────────────
  {name:"Croqueta de jamón",        kcal100:230, defaultG:40},
  {name:"Patatas bravas",           kcal100:200, defaultG:150},
  {name:"Pan con tomate",           kcal100:165, defaultG:80},
  {name:"Empanada gallega",         kcal100:280, defaultG:100},
  {name:"Pimientos de padrón",      kcal100:60,  defaultG:100},
  {name:"Gambas al ajillo",         kcal100:175, defaultG:150},
  {name:"Chipirones plancha",       kcal100:90,  defaultG:150},
  {name:"Jamón ibérico (tapa)",     kcal100:375, defaultG:30},
  {name:"Tabla de quesos",          kcal100:370, defaultG:80},
  {name:"Aceitunas",                kcal100:145, defaultG:50},
  {name:"Anchoas en tosta",         kcal100:215, defaultG:50},
  {name:"Pulpo a la gallega",       kcal100:82,  defaultG:150},
  {name:"Boquerones fritos",        kcal100:220, defaultG:100},
  // ── PLATOS TÍPICOS ───────────────────────────────────────────────────────
  {name:"Paella valenciana",        kcal100:130, defaultG:350},
  {name:"Cocido madrileño",         kcal100:155, defaultG:400},
  {name:"Fabada asturiana",         kcal100:180, defaultG:350},
  {name:"Gazpacho",                 kcal100:50,  defaultG:250},
  {name:"Salmorejo",                kcal100:120, defaultG:200},
  {name:"Puchero",                  kcal100:140, defaultG:350},
  {name:"Menú del día (medio)",     kcal100:250, defaultG:500},
  // ── SALSAS Y CONDIMENTOS ────────────────────────────────────────────────
  {name:"Mayonesa",                 kcal100:680, defaultG:20},
  {name:"Ketchup",                  kcal100:100, defaultG:20},
  {name:"Salsa barbacoa",           kcal100:120, defaultG:30},
  {name:"Salsa de soja",            kcal100:60,  defaultG:15},
  {name:"Mostaza",                  kcal100:66,  defaultG:15},
  {name:"Miel",                     kcal100:304, defaultG:15},
  {name:"Mermelada",                kcal100:250, defaultG:20},
  {name:"Crema de cacao (Nutella)", kcal100:539, defaultG:20},
  {name:"Guacamole",                kcal100:155, defaultG:50},
  {name:"Hummus",                   kcal100:177, defaultG:50},
];

export function searchFoods(query) {
  if(!query || query.length<2) return [];
  const q = query.toLowerCase().trim();
  // Score: starts-with gets higher priority than includes
  return FOOD_DB
    .map(f=>{
      const name=f.name.toLowerCase();
      const score=name.startsWith(q)?0:name.includes(q)?1:99;
      return {f,score};
    })
    .filter(x=>x.score<99)
    .sort((a,b)=>a.score-b.score)
    .map(x=>x.f)
    .slice(0,6);
}


export function calcFoodKcal(food, grams) {
  return Math.round(food.kcal100 * grams / 100);
}

export function getDefaultAlts(meal) {
  if(meal.alt && meal.alt.length>0) return meal.alt;
  const p1=(meal.p1||"").toLowerCase();
  const _time=(meal.time||"").toLowerCase();
  if(p1.includes("pollo"))   return ["Pavo a la plancha en lugar de pollo","Ternera magra en lugar de pollo","Solomillo de cerdo en lugar de pollo"];
  if(p1.includes("pavo"))    return ["Pollo a la plancha en lugar de pavo","Ternera magra en lugar de pavo","Solomillo de cerdo en lugar de pavo"];
  if(p1.includes("ternera")) return ["Pollo a la plancha en lugar de ternera","Pavo a la plancha en lugar de ternera","Solomillo de cerdo en lugar de ternera"];
  if(p1.includes("cerdo") || p1.includes("solomillo") || p1.includes("lomo"))
                             return ["Pollo a la plancha en lugar de cerdo","Pavo a la plancha en lugar de cerdo","Ternera magra en lugar de cerdo"];
  if(p1.includes("salmón"))  return ["Trucha al horno en lugar de salmón","Caballa al horno en lugar de salmón","Merluza al horno en lugar de salmón"];
  if(p1.includes("merluza")) return ["Bacalao al horno en lugar de merluza","Dorada al horno en lugar de merluza","Salmón al horno en lugar de merluza"];
  if(p1.includes("dorada"))  return ["Merluza al horno en lugar de dorada","Lubina a la sal en lugar de dorada","Bacalao al horno en lugar de dorada"];
  if(p1.includes("bacalao")) return ["Merluza al horno en lugar de bacalao","Dorada al horno en lugar de bacalao","Trucha al horno en lugar de bacalao"];
  if(p1.includes("trucha"))  return ["Salmón al horno en lugar de trucha","Caballa al horno en lugar de trucha","Merluza al horno en lugar de trucha"];
  if(p1.includes("gambas"))  return ["Langostinos en lugar de gambas","Merluza a la plancha si no hay gambas","Pollo a la plancha en lugar de gambas"];
  if(p1.includes("langostino")) return ["Gambas a la plancha en lugar de langostinos","Merluza a la plancha en lugar de langostinos","Pollo a la plancha"];
  if(p1.includes("atún"))    return ["Sardinas en lugar de atún","Pollo a la plancha en lugar de atún","Huevo duro en lugar de atún"];
  if(p1.includes("lentejas"))return ["Alubias blancas en lugar de lentejas","Garbanzos en lugar de lentejas","Judías pintas en lugar de lentejas"];
  if(p1.includes("alubias")) return ["Lentejas en lugar de alubias","Garbanzos en lugar de alubias","Judías pintas en lugar de alubias"];
  if(p1.includes("garbanzo"))return ["Lentejas en lugar de garbanzos","Alubias blancas en lugar de garbanzos","Judías pintas en lugar de garbanzos"];
  if(p1.includes("pasta"))   return ["Arroz blanco en lugar de pasta","Boniato asado en lugar de pasta","Patata cocida en lugar de pasta"];
  if(p1.includes("huevo") || p1.includes("tortilla") || p1.includes("revuelto"))
                             return ["Añadir jamón serrano (40g)","Pavo a la plancha en lugar de huevos","Queso fresco 0% en lugar de aguacate"];
  if(p1.includes("crema") || p1.includes("sopa"))
                             return ["Crema de calabaza en lugar de calabacín","Sopa de verduras en lugar de crema","Gazpacho frío en verano"];
  if(p1.includes("avena"))   return ["2 huevos a la plancha en lugar de avena","Tostadas con jamón en lugar de avena","Yogur griego con fruta en lugar de avena"];
  if(p1.includes("tostada")) return ["Avena caliente en lugar de tostadas","2 huevos a la plancha en lugar de tostadas","Yogur griego con fruta"];
  // second plate swaps
  if((meal.p2||"").toLowerCase().includes("arroz"))   return ["Boniato asado en lugar de arroz","Patata cocida en lugar de arroz","Quinoa cocida en lugar de arroz"];
  if((meal.p2||"").toLowerCase().includes("patata"))  return ["Boniato asado en lugar de patata","Arroz blanco en lugar de patata","Coliflor al vapor en lugar de patata"];
  if((meal.p2||"").toLowerCase().includes("boniato")) return ["Patata cocida en lugar de boniato","Arroz blanco en lugar de boniato","Coliflor al vapor en lugar de boniato"];
  return ["Cambiar proteína principal","Cambiar el hidrato del plato 2","Pedir sugerencia al nutricionista"];
}
