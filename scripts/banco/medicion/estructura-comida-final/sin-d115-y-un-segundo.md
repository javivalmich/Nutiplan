# Sin D-115 en el perfil sin carne ni ave, y perfiles con un solo segundo (2026-11-22)

Solo medición: no cambia ninguna regla. 200 semanas desde la 60, por la entrada de la app (`generarPlan`), con `cortasProteina.mjs` en los dos árboles. `main` es `19a300c` (exportado con `git archive`) y HEAD es `0e2d6d8`. Las variantes de HEAD se aplican en memoria con `variantesPescado.mjs`:
- `--sinFamilia`: el walk empieza sin el filtro de familia en días seguidos de D-115.
- `--defecto=4`: el valor por defecto del tope de pescado pasa a 4.

Las infracciones de D-099.3 se cuentan sobre lo servido, con `composicionSemana` del banco: plato repetido en la semana o de la anterior, especie más de 2 veces, el mismo día o en días seguidos sin ancla, y legumbre en la cena.

## 1. Perfil sin carne ni ave (`sin-carne-ave-2000`, ningún segundo posible)

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| main (19a300c) | 200 | 2,94 | 101,1 % | 1,78 | 8,77 | 0,00 | 0 | 0 |
| HEAD (tope 3, con D-115) | 200 | 4,21 | 98,2 % | 3,35 | 6,74 | 0,00 | 0 | 0 |
| (a) sin D-115, tope 3 | 200 | 4,29 | 98,3 % | 3,42 | 6,91 | 0,00 | 0 | 0 |
| (b) sin D-115, tope 4 | 200 | 3,96 | 99,0 % | 3,09 | 7,26 | 0,00 | 0 | 0 |

| Medición | cereal: servidos / cortos | huevo: servidos / cortos | legumbre: servidos / cortos | pescado: servidos / cortos | vegetal: servidos / cortos |
|---|---|---|---|---|---|
| main (19a300c) | 0,00 / 0,00 | 1,99 / 1,33 | 1,78 / 1,56 | 8,77 / 0,04 | 0,47 / 0,00 |
| HEAD (tope 3, con D-115) | 0,41 / 0,00 | 2,00 / 1,49 | 3,35 / 2,67 | 6,74 / 0,06 | 0,50 / 0,00 |
| (a) sin D-115, tope 3 | 0,17 / 0,00 | 2,00 / 1,50 | 3,42 / 2,73 | 6,91 / 0,07 | 0,50 / 0,00 |
| (b) sin D-115, tope 4 | 0,16 / 0,00 | 1,99 / 1,34 | 3,09 / 2,56 | 7,26 / 0,06 | 0,50 / 0,00 |

- Con (a), sin D-115 y con tope de 3, el perfil queda en 4,29 cortas por semana. Con (b), sin D-115 y con tope de 4, queda en 3,96. Ninguna de las dos llega a 3,3, así que no se implementa nada (regla de Javi).
- Quitar D-115 con el tope en 3 no mejora nada (4,21 → 4,29): con el tope en 3, sin D-115 entra muy poco más pescado (6,74 → 6,91 por semana).
- El tope de 4 recupera algo: 0,35 platos de pescado y 0,33 legumbres como plato único por semana.
- Lo que acerca el perfil a `main` es quitar el tope y D-115 a la vez: 3,04 cortas por semana (`sin-carne-ave-main-head.md`).
- Infracciones de D-099.3: 0 en las cuatro mediciones.

## 2. Perfiles con un solo segundo posible

- `solo-pollo-2000`: el pollo es la única carne (pavo, ternera, cerdo, conejo, jamón, lacón y guanciale eliminados). Hay 8 platos que valen de segundo, todos de pollo, y el tope por especie es de 2 por semana.
- `un-segundo-2000`: un solo plato vale de segundo (pollo, pavo, ternera, cerdo y alcachofa eliminados; queda un conejo al horno con espinacas).

### solo-pollo-2000

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| main (19a300c) | 200 | 2,50 | 102,6 % | 1,43 | 7,29 | 0,00 | 0 | 0 |
| HEAD | 200 | 3,46 | 102,2 % | 2,08 | 6,22 | 1,17 | 151 | 0 |

| Medición | ave: servidos / cortos | cereal: servidos / cortos | huevo: servidos / cortos | legumbre: servidos / cortos | pescado: servidos / cortos | vegetal: servidos / cortos |
|---|---|---|---|---|---|---|
| main (19a300c) | 1,82 / 0,01 | 0,13 / 0,02 | 1,95 / 1,24 | 1,43 / 1,21 | 7,29 / 0,03 | 0,39 / 0,00 |
| HEAD | 0,79 / 0,01 | 0,25 / 0,00 | 2,00 / 1,68 | 3,25 / 1,68 | 6,21 / 0,10 | 0,50 / 0,00 |

### un-segundo-2000

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados | Infracciones de D-099.3 |
|---|---|---|---|---|---|---|---|---|
| main (19a300c) | 200 | 3,00 | 100,8 % | 1,40 | 7,99 | 0,00 | 0 | 0 |
| HEAD | 200 | 4,36 | 99,0 % | 2,69 | 5,25 | 0,46 | 188 | 0 |

| Medición | carne: servidos / cortos | cereal: servidos / cortos | huevo: servidos / cortos | legumbre: servidos / cortos | pescado: servidos / cortos | vegetal: servidos / cortos |
|---|---|---|---|---|---|---|
| main (19a300c) | 1,20 / 0,42 | 0,00 / 0,00 | 1,98 / 1,34 | 1,40 / 1,21 | 7,99 / 0,01 | 0,43 / 0,00 |
| HEAD | 2,03 / 0,50 | 0,10 / 0,05 | 1,98 / 1,51 | 3,15 / 2,23 | 5,25 / 0,07 | 0,50 / 0,00 |

- **Los dos quedan peor en HEAD que en `main`:**
  - solo-pollo-2000: 2,50 → 3,46 cortas por semana; la proteína del día casi no cambia (102,6 → 102,2 %).
  - un-segundo-2000: 3,00 → 4,36 cortas por semana; proteína del día 100,8 → 99,0 %.
- **Hay sorteo de días de legumbre** (151 y 188 de 200 semanas), pero pocos segundos colocados: 1,17 y 0,46 comidas dobles por semana. El resto de días sorteados lleva la legumbre como plato único (2,08 y 2,69 por semana, frente a 1,43 y 1,40 en `main`).
- **En solo-pollo-2000**, el pollo como segundo le quita sitio al pollo como plato: el ave servida sola pasa de 1,82 a 0,79 por semana. El tope por especie (2 por semana) no deja más.
- **En un-segundo-2000**, el único segundo no puede repetir de una semana a la siguiente (D-099.3.d).
- **Las cortas de más vuelven a ser legumbre y huevo.** En solo-pollo-2000, la legumbre corta pasa de 1,21 a 1,68 y el huevo corto de 1,24 a 1,68 por semana. En un-segundo-2000, de 1,21 a 2,23 y de 1,34 a 1,51.
- A1 no cubre a ninguno de los dos: tienen al menos un segundo posible.
- Infracciones de D-099.3: 0 en las cuatro mediciones.
