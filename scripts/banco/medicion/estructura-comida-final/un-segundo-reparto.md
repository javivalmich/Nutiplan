# Perfiles con un solo segundo posible: reparto de la diferencia main → HEAD (2026-11-22)

Solo medición: no cambia ninguna regla. 200 semanas desde la 60, por la entrada de la app, con `cortasProteina.mjs`. `main` es `19a300c`; HEAD es `7fe9bc2`.

Variantes de HEAD, en memoria con `variantesPescado.mjs`:
- «Sin tope»: `--sinTope`, valor por defecto 99. Ningún perfil trae `pescadoMaxSemana`, así que es como en `main`.
- «Sin tope ni D-115»: además, `--sinFamilia`, el walk empieza sin el filtro de familia en días seguidos.

Perfiles:
- `solo-pollo-2000`: la única carne es el pollo; 8 segundos, todos de pollo.
- `un-segundo-2000`: un solo plato vale de segundo (un conejo al horno con espinacas).

## solo-pollo-2000

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| main | 200 | 2,50 | 102,6 % | 1,43 | 7,29 | 0,00 | 0 | 0 |
| HEAD | 200 | 3,46 | 102,2 % | 2,08 | 6,22 | 1,17 | 151 | 0 |
| HEAD sin tope | 200 | 3,42 | 102,5 % | 1,96 | 6,51 | 1,20 | 153 | 0 |
| HEAD sin tope ni D-115 | 200 | 2,60 | 104,8 % | 1,55 | 7,17 | 1,24 | 155 | 0 |

## un-segundo-2000

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| main | 200 | 3,00 | 100,8 % | 1,40 | 7,99 | 0,00 | 0 | 0 |
| HEAD | 200 | 4,36 | 99,0 % | 2,69 | 5,25 | 0,46 | 188 | 0 |
| HEAD sin tope | 200 | 4,18 | 99,5 % | 2,61 | 5,63 | 0,46 | 187 | 0 |
| HEAD sin tope ni D-115 | 200 | 3,73 | 100,5 % | 2,51 | 6,92 | 0,49 | 195 | 0 |

## Reparto (comidas y cenas cortas de proteína por semana)

| | solo-pollo-2000 | un-segundo-2000 |
|---|---|---|
| main → HEAD | +0,96 | +1,36 |
| Tope de pescado (HEAD sin tope → HEAD) | +0,04 | +0,18 |
| El resto (main → HEAD sin tope) | +0,92 | +1,18 |
| … de ello, D-115 (sin tope ni D-115 → sin tope) | +0,82 | +0,45 |
| … y la regla de la legumbre de D-116 y D-117, con lo demás de la rama (main → sin tope ni D-115) | +0,10 | +0,73 |

**Lectura:**
- **El tope de pescado pesa poco** en los dos perfiles: +0,04 y +0,18 cortas por semana.
- **Lo que no es el tope** se reparte distinto en cada perfil:
  - En solo-pollo-2000, casi todo es el filtro de familia de D-115 (+0,82). La regla de la legumbre, con lo demás de la rama, añade +0,10. Por qué D-115 pesa tanto aquí no lo he medido. Una hipótesis: el pollo es la única carne y es ave, así que D-115 lo aparta de los días seguidos, y con él a sus 8 segundos.
  - En un-segundo-2000, la mayor parte es la regla de la legumbre (+0,73), con el único segundo que no repite de una semana a la siguiente. D-115 añade +0,45.
- **«Lo demás de la rama»** son los otros cambios del motor que `main` no tiene. No los he separado: los primeros, el aceite 10 + 10 y las raciones de la comida doble.
- **El reparto depende del orden.** He quitado primero el tope y después D-115. En el perfil sin carne ni ave, quitar D-115 con el tope puesto no cambiaba nada (`sin-d115-y-un-segundo.md`). Así que las partes de D-115 y del tope no son independientes.
- Infracciones de D-099.3: 0 en las cuatro mediciones de los dos perfiles.
