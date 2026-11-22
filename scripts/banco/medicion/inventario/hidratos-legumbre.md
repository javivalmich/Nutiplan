# Inventario: hidrato o legumbre de guarnición (2026-11-22, pendiente de validar por Javi)

Propuesta para el prototipo de «legumbre de bote como guarnición». Es solo inventario: no cambia ninguna regla ni toca `src/`. Archivo: `hidratos-legumbre.csv` (separado por `;`, UTF-8 con BOM para Excel). Lo genera un script en el directorio temporal de la sesión a partir de `catalogoApp()`, la vista de `resolveDishComposition` y el texto de `FREEFORM_POOL`.

## Qué hay en el .csv

- **92 platos de plantilla con hueco de hidrato** (`tupla.C`): 35 de arroz, 23 de patata, 14 de pasta, 11 de boniato y 9 de quinoa. Son los únicos en los que el prototipo puede elegir el hidrato con la semilla.
- **48 platos redactados** que llevan algún hidrato en su receta (arroz, patata, boniato, pasta o fideos, quinoa, pan). Todos van con «no»: su receta está cerrada y no tienen hueco que cambiar.
- **Pan:** ningún plato de plantilla tiene el pan como hueco. Solo aparece en los redactados y como complemento que añaden las raciones.

## Columnas

- `admite_legumbre`: «sí» o «no».
- `pescado_a_revisar`: «sí» en los 30 platos de pescado o marisco que pasan a «sí», para mirarlos con atención.
- `legumbre_principal`: la que mejor pega.
- `legumbres_propuestas`: todas las que encajan, de mejor a peor.
- `razon`: por qué se admite o no.

## Propuesta: 74 «sí» y 18 «no» en los platos de plantilla

- **No:** toda la pasta (14), la tortilla de patata (1), los revueltos de huevo (2) y las lentejas con arroz, que ya son un plato de legumbre (1).
- **Asiáticos con soja y jengibre (4): pasan a «sí», solo con edamame.** El edamame es la legumbre de esa cocina, como en un poke; garbanzos o alubias no encajan. Son:
  - el bowl asiático de pollo con arroz;
  - los dos bowls asiáticos de salmón (con arroz y con quinoa);
  - el salmón al horno con soja y jengibre con quinoa.
- **Legumbres por proteína**, de mejor a peor, en cocina española y mediterránea:
  - pollo y pavo: garbanzos, alubias blancas, guisantes, habitas, lentejas pardinas;
  - ternera: alubias pintas, alubias rojas, garbanzos, lentejas pardinas;
  - cerdo: alubias blancas, alubias pintas, garbanzos, lentejas pardinas;
  - conejo: garbanzos, alubias blancas, habitas, lentejas pardinas;
  - merluza: guisantes, alubias blancas, habitas, garbanzos;
  - bacalao: garbanzos, alubias blancas, habitas, guisantes;
  - dorada: lentejas beluga, alubias blancas, garbanzos, habitas;
  - salmón: lentejas beluga, lentejas pardinas, garbanzos, alubias blancas;
  - sardinas: alubias blancas, garbanzos, habitas;
  - atún en conserva: alubias blancas, garbanzos, lentejas pardinas, frijoles negros;
  - gambas: garbanzos, alubias blancas, habitas;
  - calamares: habitas, garbanzos, alubias blancas.
- **Ajustes sobre esa lista:**
  - curry: garbanzos, lentejas pardinas y alubias rojas;
  - platos con alcachofa: las habitas primero;
  - ensaladas y platos fríos: solo las que se toman frías (sin guisantes ni habitas), y se añaden garbanzos y lentejas beluga si faltan;
  - bowls mediterráneos: garbanzos y lentejas beluga primero;
  - bowls proteicos: se añaden frijoles negros y edamame;
  - guisos: se añaden garbanzos, alubias blancas y lentejas pardinas si faltan.

## Legumbres como ingrediente (`ingredientes.js` y `composicion.js`)

| Legumbre | Ingrediente | Nutrición por 100 g | Estado |
|---|---|---|---|
| Garbanzos | `garbanzos_cocidos` | 133 kcal, 7,2 g de proteína (BEDCA 2191, garbanzo en conserva) | Existe |
| Lentejas | `lentejas_cocidas` | 74 kcal, 6,3 g de proteína (BEDCA 1126, lenteja en conserva) | Existe, sin variedad |
| Edamame | `edamame` | 158 kcal, 13 g de proteína (BEDCA 1124, soja fresca) | Existe |
| Guisantes | `guisantes` | 62 kcal, 5,4 g de proteína (guisante congelado, crudo) | Existe |
| Frijoles negros | `alubias_cocidas` | 92 kcal, 8,4 g de proteína (BEDCA 900, alubia negra remojada y hervida) | Existe con otro nombre: el ingrediente se llama «Alubias cocidas», pero su nutrición es de alubia negra |
| Alubias blancas de bote | — | — | Hay que crearla, o corregir la fuente de `alubias_cocidas`. Hoy la alubia blanca solo está en seco (`alubias_seco`, BEDCA 899) |
| Alubias rojas | — | — | Hay que crearla |
| Alubias pintas | — | — | Hay que crearla |
| Lentejas pardinas | — | — | Hay que crearla. Puede compartir la nutrición de `lentejas_cocidas`, si Javi lo acepta |
| Lentejas beluga | — | — | Hay que crearla. Igual que la pardina |
| Habitas | — | — | Hay que crearla (habas tiernas o baby, en conserva o congeladas) |

Cada ingrediente nuevo necesita su fila en `composicion.js` con su fuente (BEDCA u otra) y su entrada en `ingredientes.js`. No he buscado sus valores. Su rango de ración se propone con el prototipo.

## Reglas del prototipo (punto 2, sin implementar)

- D-116 y D-117 apagadas: sin sorteo ni segundos, por el camino de la red.
- Tope de pescado de 3, D-115 y todo lo demás de HEAD, activos.
- En los platos que admiten legumbre, el hidrato se elige con la semilla entre las opciones válidas, sin pesos.
- **Legumbre en la semana**, contando guarnición y platos de legumbre:
  - **suelo de 2**: si va corta, se prefiere legumbre en el siguiente hueco que la admita, con vuelta atrás y causa en el log;
  - **tope de 3**;
  - **guisantes, como mucho 1** de ellas.
- Espárragos: siguen siendo verdura.
- Ración de la guarnición de legumbre ajustable por las raciones, con un rango que se propondrá.
