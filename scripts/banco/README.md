# Banco I-0 — medición reproducible del motor de menús

Mide lo que el motor genera de verdad, con perfiles sintéticos y semillas fijas, para poder
comparar antes y después de cada cambio. Mide, no decide: nada de `src/` importa este directorio.

No usa red, Supabase, variables de entorno ni datos de producción. No escribe fuera de
`scripts/banco/linea-base/` (y solo con `--guardar`).

## Uso

```bash
node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs
```

Mide y compara con la línea base. Código de salida: `0` sin diferencias, `1` con diferencias
(las lista), `2` si una semilla no es reproducible.

| Opción | Efecto |
|---|---|
| `--guardar` | Congela la medición como línea base (solo con todos los perfiles y 8 semanas) |
| `--salida <archivo>` | Escribe la medición en otro archivo, para comparar dos ramas |
| `--perfil <id>` | Solo ese perfil (repetible) |
| `--semanas <n>` | Semanas por perfil; con un valor distinto de 8 no se compara |

`npm test` incluye `banco.test.js`: misma semilla, misma medición; y dos perfiles de la línea
base coinciden con lo que se mide hoy. Un cambio del motor que altere esos menús hace fallar ese
test hasta que se regenere la línea base **en el mismo commit que el cambio**, con el antes y el
después a la vista en el diff de `linea-base.json`.

## Entradas

- **Perfiles** (`perfiles.mjs`): 12 sintéticos con las calorías fijadas a mano. Cuatro sin
  restricciones (1434, 2174, 2600 con 3 comidas, 3714 kcal), celíaco, sin lactosa, sin pescado
  ni marisco, SIBO, vegetariana, vegana, uno con «cocinar en cantidad» y uno con un alimento
  eliminado.
- **Semillas**: la de la app, `userId:weekNumber`, con `userId = banco-<perfil>` y semanas 60 a
  67 seguidas; cada semana recibe los platos de la anterior (`platosRecientesPara`), como en
  producción. 96 semillas. No coinciden con las del visor (90001–90010) ni con las de Fase 7.
- **Punto de entrada**: `generarPlan` (`src/plan/generarPlan.js`), el mismo que usa la app.
  Sin `fuenteEditorial`, igual que la app hoy.

## Reproducibilidad

Cada semilla se genera dos veces y se compara el plan entero (también `decisionLog`). Única
exclusión: `day.id`, que el motor viejo forma con `Date.now()` y declara fuera de su
determinismo (`src/engine/buildPlan.js:44` y `:2267`). El banco informa de en cuántas semillas
es la única diferencia (hoy, en las 96). Cualquier otra diferencia detiene el banco.

## Qué mide

Dos familias de medidas, que no se mezclan (`catalogo` y `menus` en el JSON).

**Catálogo (sin generar planes)**

- `filtradoPorPerfil`: platos disponibles por familia proteica y momento tras `filtrarCatalogo`.
- `idaYVuelta`: para cada plato e ingrediente ajustable, se decide cada cantidad de su rango, se
  escribe como lo hace la app (`recomponer` / `reescribirComida`) y se relee. Cuenta dónde lo
  releído no es lo decidido (más de 1 g) o no se puede leer.

**Menús generados (por perfil)**

- `composicion`: platos por familia (`proteinType` del resolvedor) y por especie, en comida y en
  cena; pescado y legumbre por semana (media y máximo); racha de días con pescado; pares de días
  seguidos con la misma familia o especie (con y sin el ancla); misma familia en comida y cena;
  redactados; sugerencia del sábado aparte; y las reglas de D-099.3 contadas (plato repetido en
  la semana o de la anterior, especie más de dos veces, legumbre en la cena).
- `cantidades`: gramos decididos por `racionesDia` frente a los que se releen de la compra;
  kcal declaradas frente a releídas; cantidad del texto frente a la de la compra; ingredientes en
  el techo de su rango; máximos de arroz, pasta, patata, legumbre y pan; pan y fruta añadidos;
  huevos por comida y por día.
- `restricciones`: comidas con algo vetado por el perfil (`intoleranciasDe`) o con un alimento
  eliminado.
- `nutricion`: desvío semanal de kcal, días fuera de ±10 %, comidas principales cortas de proteína.
- `planes`: por semana, huella del texto visible y lista de platos, para ver qué menú cambia.

## Límites del instrumento

- Los gramos decididos no se guardan en el plan: `racionesCalculadas` repite la entrada de
  `ajustarDia` y se valida contra `meal.nutricion.kcal` (`replicaDistinta` debe ser 0).
- «Texto frente a compra» es una heurística sobre el texto libre: «distinta» puede incluir
  frases que nombran dos ingredientes. `textoSinCantidad` son ingredientes cuyo texto no da cifra.
- La familia de un plato es la de su proteína principal: un plato de carne con huevo cuenta
  como carne.
- 8 semanas por perfil: sirve para comparar antes y después, no para estimar frecuencias raras.

## Línea base

`linea-base/linea-base.json`, generada en `main` `19a300c`.
sha256 `bc03bd42f950d80d460146bfddc07f5575fa7ba00c99891e31c49118766c575f`.
