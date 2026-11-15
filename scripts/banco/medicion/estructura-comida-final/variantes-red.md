# Variantes de la red de seguridad de D-116.5

Salida de `resumenVariantesRed.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`), con la comida doble montada y los segundos en `platosSemana` (`medirEstructura.mjs`). Medido en memoria con `variantesRed.mjs`.

## sin-pescado-2000

| Variante | Comidas y cenas cortas de proteína/sem | Legumbre/sem | Comidas con segundo/sem | Proteína del día (% del objetivo) | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Semanas con infracción y sin segundos |
|---|---|---|---|---|---|---|---|
| Hoy (ba52d21) | 4,29 | 2,16 | 0,00 | 99,6 % | 0 | 0 / 0 | 0 |
| Red anterior (sin segundos, días sorteados) | 3,64 | 3,15 | 1,98 | 101,2 % | 0 | 71 / 0 | 0 |
| Red con la regla apagada (D-024) | 3,15 | 2,83 | 2,15 | 102,3 % | 2 | 63 / 0 | 2 |

## gluten-sin-pescado-2000

| Variante | Comidas y cenas cortas de proteína/sem | Legumbre/sem | Comidas con segundo/sem | Proteína del día (% del objetivo) | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Semanas con infracción y sin segundos |
|---|---|---|---|---|---|---|---|
| Hoy (ba52d21) | 4,03 | 2,21 | 0,00 | 95,2 % | 28 | 0 / 0 | 0 |
| Red anterior (sin segundos, días sorteados) | 4,71 | 3,10 | 0,17 | 93,8 % | 2 | 186 / 0 | 2 |
| Red con la regla apagada (D-024) | 3,92 | 2,25 | 0,10 | 95,6 % | 25 | 192 / 0 | 24 |

## lactosa-gluten-sin-pescado-2000

| Variante | Comidas y cenas cortas de proteína/sem | Legumbre/sem | Comidas con segundo/sem | Proteína del día (% del objetivo) | Infracciones de D-099.3 | Semanas con la red (D-099 / pool vacío) | Semanas con infracción y sin segundos |
|---|---|---|---|---|---|---|---|
| Hoy (ba52d21) | 4,22 | 2,23 | 0,00 | 94,7 % | 28 | 0 / 0 | 0 |
| Red anterior (sin segundos, días sorteados) | 5,01 | 3,15 | 0,09 | 93,0 % | 2 | 192 / 0 | 2 |
| Red con la regla apagada (D-024) | 4,18 | 2,25 | 0,07 | 94,9 % | 28 | 195 / 0 | 27 |

Las semanas «con la red» son las que se repitieron sin segundos (D-099) o tras quedarse sin platos (pool vacío). En «Hoy» no hay regla ni red. Planes que no son de engine2: Hoy (ba52d21): 0 · Red anterior (sin segundos, días sorteados): 0 · Red con la regla apagada (D-024): 0.

La fila «regla apagada» es el motor real desde `ff2fa23` (`--red=actual`). Coincide semana a semana con la variante medida en memoria antes de implementarla (600 de 600 semanas con el mismo menú y el mismo texto). La fila «red anterior» es el motor de `3622d54`.
