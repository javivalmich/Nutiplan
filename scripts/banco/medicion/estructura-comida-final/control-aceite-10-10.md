# Control del aceite 10 + 10 de la comida doble (D-116.6, modificado el 2026-11-16)

Salida de `controlComidaDoble.mjs`: la app con el cambio (`medirEstructura.mjs --ec=off`) frente a la variante 10 + 10 medida antes en memoria (`variantesComidaDoble.mjs --aceite=topeSegundo10`). Donde la tabla dice «prototipo», léase «variante medida». 200 semanas por perfil.

| Perfil | Semanas | Comidas dobles | Dobles fuera de ±5 % de kcal | Dobles cortas de proteína | Comidas y cenas cortas/sem | Proteína del día (% del objetivo) | Semanas fuera de ±5 % | Lectura junta distinta de plato a plato | Semanas con el mismo menú | Semanas con el mismo texto |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 200 | 605 | 25 | 0 | 2,30 | 100,9 % | 0 | 0 de 605 | 200 | 200 |
| omni-2174 | 200 | 608 | 0 | 0 | 1,61 | 105,7 % | 0 | 0 de 608 | 200 | 200 |
| omni-2600-3comidas | 200 | 597 | 0 | 0 | 1,32 | 112,3 % | 0 | 0 de 597 | 200 | 200 |
| omni-3714 | 200 | 608 | 1 | 0 | 2,72 | 108,5 % | 1 | 0 de 608 | 200 | 200 |
| celiaco-2400 | 200 | 602 | 0 | 0 | 1,52 | 107,0 % | 0 | 0 de 602 | 200 | 200 |
| sin-lactosa-2000 | 200 | 604 | 2 | 0 | 1,53 | 108,3 % | 0 | 0 de 604 | 200 | 200 |
| sin-pescado-2000 | 200 | 431 | 1 | 0 | 3,14 | 104,4 % | 1 | 0 de 431 | 200 | 200 |
| sibo-2000 | 200 | 0 | 0 | 0 | 1,85 | 99,5 % | 0 | 0 de 0 | 200 | 200 |
| omni-2174-ancla | 200 | 548 | 0 | 0 | 1,80 | 105,0 % | 0 | 0 de 548 | 200 | 200 |
| omni-2000-sin-atun | 200 | 611 | 3 | 0 | 1,94 | 107,5 % | 0 | 0 de 611 | 200 | 200 |
| **Total** | 2000 | 5214 | 32 | 0 | | | | 0 | 2000 | 2000 |

Planes que no son de engine2: src/plan 0 · prototipo 0.
Nada empeora respecto al prototipo.

Antes del cambio (motor de `c5b1b4c`), en los mismos 9 perfiles con comida doble: 134 comidas dobles fuera de ±5 % de kcal y 13 cortas de proteína (`control-src-plan.md`).
