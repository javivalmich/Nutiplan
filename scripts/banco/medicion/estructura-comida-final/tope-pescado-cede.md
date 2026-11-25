# Tope de pescado que cede, SIBO y perfiles sin segundo posible (2026-11-16)

200 semanas por perfil, por la entrada de la app (`generarPlan`). Mediciones en memoria; el tope que cede está en `0878f81`.

## 1. El tope de pescado cede ante una infracción de D-099.3

| Perfiles | Medición | Pescado y marisco/sem | Veces que cede | Infracciones de D-099.3 | Comidas y cenas cortas de proteína/sem | Proteína del día |
|---|---|---|---|---|---|---|
| 8 omnívoros sin SIBO | tope de 3, sin ceder (`b87ccc3`) | 3,00 | — | 0 | 2,03 | 108,0 % |
| 8 omnívoros sin SIBO | tope de 3 que cede (`0878f81`) | 3,01 | 20 | 0 | 2,03 | 108,1 % |
| sibo-2000 | sin tope | 5,03 | — | 0 | 1,85 | 99,5 % |
| sibo-2000 | tope de 3, sin ceder | 3,00 | — | 7 | 2,30 | 98,2 % |
| sibo-2000 | tope de 3 que cede | 3,05 | 10 | 0 | 2,29 | 98,1 % |
| sibo-2000 | valor por defecto 4 (en memoria, `variantesPescado.mjs --defecto=4`) | 4,00 | 2 | 0 | 2,10 | 98,6 % |

Ningún walk falla ni cae al motor viejo. En los 8 omnívoros el tope no se relaja nunca por falta de candidatos.

## 2. Perfil sin carne ni ave (A1 y el tope)

Perfil SINTÉTICO `sin-carne-ave-2000` (`cortasProteina.mjs`): como sin-lactosa-2000 sin la lactosa, con pollo, pavo, ternera, cerdo, conejo, jamón, lacón y guanciale eliminados; ningún segundo posible. `main` es `19a300c` (exportado con `git archive`). A1 (sin segundo posible no hay sorteo) está en el árbol de trabajo, sin commit.

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados |
|---|---|---|---|---|---|---|
| main | 200 | 2,94 | 101,1 % | 8,77 | 0,00 | 0 |
| rama sin A1 (HEAD), tope 3 | 200 | 4,64 | 97,4 % | 6,76 | 0,00 | 200 |
| rama con A1, tope 3 | 200 | 4,21 | 98,2 % | 6,74 | 0,00 | 0 |
| rama con A1, sin tope | 200 | 4,17 | 98,6 % | 7,47 | 0,00 | 0 |
| rama con A1, tope 3, sin filtro de familia | 200 | 4,29 | 98,3 % | 6,91 | 0,00 | 0 |
| rama con A1, sin tope, sin filtro de familia | 200 | 3,04 | 101,0 % | 8,78 | 0,00 | 0 |

- A1 mejora la rama: comidas cortas 4,64 → 4,21 por semana (no hay sorteo, así que la legumbre deja de ir como plato único los días sorteados).
- La distancia con `main` (2,94) la hacen juntos el tope de pescado y el filtro de familia en días seguidos (D-115, con pescado y marisco como una familia): sin los dos, 3,04; sin uno solo, unas 4,2. Este perfil casi solo tiene pescado, huevo y legumbre como proteína.
- El tope de 3 empeora la proteína frente a no tener tope (4,21 frente a 4,17 comidas cortas; 98,2 % frente a 98,6 %): por la regla de Javi, el tope no se cierra y se para aquí.
- Con el tope de 3, este perfil sirve 6,74 platos de pescado por semana: el tope cede casi siempre, porque sin pescado no quedan candidatos que respeten la separación por especie.

## 3. Perfil con un solo segundo posible

Perfil SINTÉTICO `un-segundo-2000`: pollo, pavo, ternera, cerdo y alcachofa eliminados; solo «Conejo al ajillo con espinacas» vale de segundo.

| Medición | Semanas | Comidas y cenas cortas de proteína/sem | Proteína del día (% del objetivo) | Pescado/sem | Comidas dobles/sem | Semanas con días sorteados |
|---|---|---|---|---|---|---|
| main | 200 | 3,00 | 100,8 % | 7,99 | 0,00 | 0 |
| rama con A1, tope 3 | 200 | 4,36 | 99,0 % | 5,25 | 0,46 | 188 |

- Hay sorteo en 188 de 200 semanas, pero solo 0,46 comidas dobles por semana: el único segundo no se repite de una semana a la siguiente (D-099.3.d), así que la mayoría de los días sorteados la legumbre va como plato único. Las comidas cortas suben de 3,00 a 4,36. A1 no lo cubre (hay un segundo posible).
