# Perfil sin carne ni ave: main frente a HEAD (2026-11-22)

Perfil SINTÉTICO `sin-carne-ave-2000` (`cortasProteina.mjs`): como sin-lactosa-2000 sin la lactosa, con pollo, pavo, ternera, cerdo, conejo, jamón, lacón y guanciale eliminados. No tiene ningún segundo posible, así que con A1 (`1c23a97`) no sortea días y no hay comidas dobles. 200 semanas desde la 60, por la entrada de la app (`generarPlan`), con el mismo medidor en los dos árboles. `main` es `19a300c` (exportado con `git archive`); HEAD es `9b3da71`. Las variantes de HEAD se aplican en memoria con `variantesPescado.mjs`: `--sinTope` (valor por defecto 99) y `--sinFamilia` (el walk empieza sin el filtro de familia en días seguidos de D-115).

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Legumbre como plato único/sem | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados |
|---|---|---|---|---|---|---|---|
| main (19a300c) | 200 | 2,94 | 101,1 % | 1,78 | 8,77 | 0,00 | 0 |
| HEAD, tope 3 | 200 | 4,21 | 98,2 % | 3,35 | 6,74 | 0,00 | 0 |
| HEAD, sin tope | 200 | 4,17 | 98,6 % | 2,94 | 7,47 | 0,00 | 0 |
| HEAD, tope 3, sin filtro de familia | 200 | 4,29 | 98,3 % | 3,42 | 6,91 | 0,00 | 0 |
| HEAD, sin tope ni filtro de familia | 200 | 3,04 | 101,0 % | 1,87 | 8,78 | 0,00 | 0 |

| Medición | cereal: servidos / cortos | huevo: servidos / cortos | legumbre: servidos / cortos | pescado: servidos / cortos | vegetal: servidos / cortos |
|---|---|---|---|---|---|
| main (19a300c) | 0,00 / 0,00 | 1,99 / 1,33 | 1,78 / 1,56 | 8,77 / 0,04 | 0,47 / 0,00 |
| HEAD, tope 3 | 0,41 / 0,00 | 2,00 / 1,49 | 3,35 / 2,67 | 6,74 / 0,06 | 0,50 / 0,00 |
| HEAD, sin tope | 0,24 / 0,01 | 2,00 / 1,57 | 2,94 / 2,50 | 7,32 / 0,08 | 0,50 / 0,00 |
| HEAD, tope 3, sin filtro de familia | 0,17 / 0,00 | 2,00 / 1,50 | 3,42 / 2,73 | 6,91 / 0,07 | 0,50 / 0,00 |
| HEAD, sin tope ni filtro de familia | 0,00 / 0,00 | 1,95 / 1,36 | 1,87 / 1,66 | 8,78 / 0,02 | 0,41 / 0,00 |

En la segunda tabla, cada comida y cena servida (sin la sugerencia) va con la familia proteica de su plato (`familiaProteica`, con pescado y marisco como una sola familia). Los números son por semana: cuántas se sirven de esa familia y cuántas de ellas quedan por debajo del 95 % de su objetivo de proteína.

## Lectura

- **A1 no le devuelve lo que tenía en `main`.** Con A1 y el tope de 3, el perfil tiene 4,21 comidas y cenas cortas por semana, frente a 2,94 en `main`. La proteína del día es 98,2 % frente a 101,1 %.
- **Por qué, con evidencia:** las comidas cortas de más son legumbre como plato único.
  - En `main` sirve 1,78 legumbres por semana, de las que 1,56 quedan cortas. En HEAD sirve 3,35, de las que 2,67 quedan cortas: son 1,11 cortas más de las 1,27 que separan a HEAD de `main`.
  - El pescado casi nunca queda corto (0,04 a 0,08 por semana). En HEAD se sirven 2,03 platos de pescado menos por semana, y lo que entra en su lugar es sobre todo legumbre (+1,57) y algo de cereal (+0,41).
  - El huevo añade el resto (1,33 → 1,49 cortas).
  - La legumbre como plato único queda corta el 80 % de las veces: es la razón de D-116, pero este perfil no tiene ningún segundo posible.
- **Qué quita el pescado:** en este perfil la proteína sale casi solo del pescado, el huevo y la legumbre. Dos reglas de la rama, que `main` no tiene, quitan pescado:
  - el tope de pescado de D-118;
  - el filtro de familia en días seguidos de D-115, que trata pescado y marisco como una sola familia y no deja pescado en dos días seguidos si hay otro candidato.
- **Hacen falta las dos para la distancia:**
  - Si se quita una sola, la distancia no cambia: sin tope, 4,17 cortas y 2,94 legumbres por semana; sin filtro de familia, 4,29 y 3,42.
  - Si se quitan las dos, el perfil vuelve a lo de `main`: 3,04 cortas, 1,87 legumbres, 8,78 de pescado y 101,0 % de proteína.
  - Cada regla sola basta para sacar el pescado de unos 2 días por semana. El hueco libre lo llena sobre todo la legumbre, que es lo que queda en el pool de este perfil (sin carne ni ave). No he medido qué paso del walk la elige en cada hueco.
- **Lo que queda con las dos reglas quitadas** (3,04 frente a 2,94; 1,87 frente a 1,78 legumbres) es del orden del ruido entre dos árboles. No lo he desglosado.
