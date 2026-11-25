# Pescado y marisco: reparto actual y topes semanales

Salida de `resumenPescado.mjs`. 200 semanas seguidas por perfil, por la entrada de la app (`generarPlan`), con las variantes en memoria de `variantesPescado.mjs` (sin tocar `src/`). Platos servidos: comida, segundo de la comida doble y cena, sin la sugerencia de la comida libre del sábado. Pescado y marisco, por especie (también los bowls de atún o gambas). Carne roja = ternera; cerdo = lomo, jamón, lacón y guanciale; «otro» = tofu, mozzarella o sin proteína principal. «Comidas sin proteína animal»: comidas o cenas servidas sin carne, pescado ni huevo. Salvo que se diga otra cosa, los 8 perfiles omnívoros sin SIBO (1600 semanas); sibo-2000 aparte.

## 1. Reparto actual, platos por semana

| Perfil | pescado y marisco | ave | carne roja | cerdo | conejo | huevo | legumbre | otro | Comidas sin proteína animal |
|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,01 | 3,42 | 1,30 | 1,85 | 0,52 | 1,72 | 3,04 | 0,17 | 0,17 |
| omni-2174 | 3,90 | 3,49 | 1,23 | 1,84 | 0,58 | 1,75 | 3,05 | 0,20 | 0,20 |
| omni-2600-3comidas | 3,96 | 3,44 | 1,28 | 1,90 | 0,44 | 1,81 | 3,03 | 0,17 | 0,17 |
| omni-3714 | 3,96 | 3,54 | 1,22 | 1,86 | 0,54 | 1,73 | 3,04 | 0,16 | 0,16 |
| celiaco-2400 | 4,08 | 3,60 | 1,43 | 1,49 | 0,63 | 1,77 | 3,04 | 0,00 | 0,00 |
| sin-lactosa-2000 | 4,07 | 3,50 | 1,15 | 1,81 | 0,54 | 1,74 | 3,02 | 0,21 | 0,21 |
| sibo-2000 | 5,03 | 3,17 | 1,14 | 1,32 | 0,52 | 1,82 | 0,00 | 0,00 | 0,00 |
| omni-2174-ancla | 3,71 | 3,51 | 1,24 | 1,91 | 0,47 | 1,73 | 3,04 | 0,17 | 0,43 |
| omni-2000-sin-atun | 3,60 | 3,57 | 1,33 | 2,02 | 0,43 | 1,81 | 3,08 | 0,23 | 0,23 |
| **8 omnívoros sin SIBO** | 3,91 | 3,51 | 1,27 | 1,84 | 0,52 | 1,76 | 3,04 | 0,16 | 0,20 |

Distribución del pescado y marisco por semana (porcentaje de semanas con ese número de platos):

| Perfil | Media | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 o más | Semanas con 4 o más |
|---|---|---|---|---|---|---|---|---|---|---|
| omni-1434 | 4,01 | 0 % | 0 % | 0 % | 26 % | 51 % | 21 % | 3 % | 1 % | 148 (74 %) |
| omni-2174 | 3,90 | 0 % | 0 % | 0 % | 27 % | 58 % | 14 % | 2 % | 0 % | 146 (73 %) |
| omni-2600-3comidas | 3,96 | 0 % | 0 % | 0 % | 25 % | 57 % | 17 % | 1 % | 1 % | 150 (75 %) |
| omni-3714 | 3,96 | 0 % | 0 % | 0 % | 26 % | 54 % | 20 % | 1 % | 0 % | 149 (75 %) |
| celiaco-2400 | 4,08 | 0 % | 0 % | 0 % | 14 % | 66 % | 19 % | 1 % | 1 % | 172 (86 %) |
| sin-lactosa-2000 | 4,07 | 0 % | 0 % | 0 % | 19 % | 58 % | 22 % | 2 % | 0 % | 162 (81 %) |
| sibo-2000 | 5,03 | 0 % | 0 % | 0 % | 2 % | 28 % | 41 % | 26 % | 5 % | 196 (98 %) |
| omni-2174-ancla | 3,71 | 0 % | 0 % | 2 % | 38 % | 49 % | 12 % | 1 % | 0 % | 121 (61 %) |
| omni-2000-sin-atun | 3,60 | 0 % | 0 % | 2 % | 43 % | 48 % | 7 % | 1 % | 0 % | 110 (55 %) |
| **8 omnívoros sin SIBO** | 3,91 | 0 % | 0 % | 0 % | 27 % | 55 % | 16 % | 1 % | 0 % | 1158 (72 %) |

## 2 y 3. Topes de pescado y marisco por semana

En cada hueco, si la semana ya llega al tope, se quitan del pool los platos de pescado o marisco (justo después del tope de 2 por especie) y el hueco sigue por la cascada normal; si eso lo dejara sin candidatos, no se aplica. El suelo de pescado de D-024 (3) no cambia.

**Los 8 perfiles omnívoros sin SIBO**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,91 | 3,51 | 1,27 | 1,84 | 0,52 | 1,76 | 3,04 | 0,16 | 0,20 | 1158 | 1,84 | 108,4 % | 0 | 0 / 0 | 0,9 | 3 |
| Tope de 4 | 3,73 | 3,53 | 1,30 | 1,90 | 0,52 | 1,78 | 3,04 | 0,20 | 0,24 | 1166 | 1,88 | 108,3 % | 0 | 1948 / 0 | 1,3 | 4 |
| Tope de 3 | 3,00 | 3,64 | 1,39 | 2,14 | 0,63 | 1,83 | 3,03 | 0,32 | 0,36 | 0 | 2,03 | 108,0 % | 0 | 7763 / 0 | 2,1 | 0 |
| Tope de 2 | 2,00 | 3,77 | 1,52 | 2,46 | 0,83 | 1,93 | 3,06 | 0,40 | 0,48 | 0 | 2,15 | 107,4 % | 0 | 13620 / 0 | 1,9 | 1 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,68 | 1,42 | 2,14 | 0,64 | 1,78 | 3,74 | 0,30 | 0,35 | 0 | 1,94 | 109,6 % | 0 | 6211 / 0 | 16,7 | 1 |

**Qué ocupa los huecos que deja el pescado** (diferencia frente al motor actual, platos por semana, 8 perfiles):

| Variante | pescado y marisco | ave | carne roja | cerdo | conejo | huevo | legumbre | otro | Comidas sin proteína animal |
|---|---|---|---|---|---|---|---|---|---|
| Tope de 4 | -0,19 | +0,03 | +0,03 | +0,07 | +0,00 | +0,02 | -0,00 | +0,04 | +0,04 |
| Tope de 3 | -0,91 | +0,13 | +0,12 | +0,30 | +0,11 | +0,08 | -0,01 | +0,16 | +0,17 |
| Tope de 2 | -1,91 | +0,26 | +0,25 | +0,62 | +0,32 | +0,17 | +0,02 | +0,24 | +0,28 |
| Tope de 3 y legumbre a 4 | -0,92 | +0,17 | +0,15 | +0,30 | +0,12 | +0,02 | +0,70 | +0,14 | +0,15 |

**omni-1434**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 4,01 | 3,42 | 1,30 | 1,85 | 0,52 | 1,72 | 3,04 | 0,17 | 0,17 | 148 | 2,40 | 101,1 % | 0 | 0 / 0 | 2,0 | 0 |
| Tope de 4 | 3,77 | 3,51 | 1,24 | 2,00 | 0,46 | 1,83 | 3,04 | 0,20 | 0,20 | 155 | 2,38 | 100,9 % | 0 | 260 / 0 | 1,0 | 0 |
| Tope de 3 | 3,00 | 3,62 | 1,39 | 2,15 | 0,64 | 1,84 | 3,06 | 0,36 | 0,36 | 0 | 2,62 | 100,5 % | 0 | 1018 / 0 | 1,5 | 0 |
| Tope de 2 | 2,00 | 3,75 | 1,54 | 2,54 | 0,77 | 1,94 | 3,10 | 0,45 | 0,45 | 0 | 2,44 | 100,2 % | 0 | 1721 / 0 | 1,5 | 1 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,67 | 1,40 | 2,22 | 0,56 | 1,80 | 3,85 | 0,34 | 0,34 | 0 | 2,48 | 101,0 % | 0 | 792 / 0 | 15,0 | 1 |

**omni-2174**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,90 | 3,49 | 1,23 | 1,84 | 0,58 | 1,75 | 3,05 | 0,20 | 0,20 | 146 | 1,60 | 107,3 % | 0 | 0 / 0 | 0,5 | 0 |
| Tope de 4 | 3,71 | 3,52 | 1,30 | 1,99 | 0,51 | 1,73 | 3,06 | 0,23 | 0,23 | 143 | 1,65 | 107,2 % | 0 | 275 / 0 | 1,5 | 0 |
| Tope de 3 | 3,00 | 3,62 | 1,36 | 2,21 | 0,57 | 1,85 | 3,06 | 0,37 | 0,37 | 0 | 1,87 | 106,8 % | 0 | 1026 / 0 | 3,0 | 0 |
| Tope de 2 | 2,00 | 3,77 | 1,44 | 2,61 | 0,81 | 1,93 | 3,08 | 0,44 | 0,46 | 0 | 2,10 | 106,3 % | 0 | 1756 / 0 | 1,5 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,71 | 1,38 | 2,19 | 0,58 | 1,78 | 3,81 | 0,36 | 0,36 | 0 | 1,97 | 108,1 % | 0 | 798 / 0 | 19,0 | 0 |

**omni-2600-3comidas**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,96 | 3,44 | 1,28 | 1,90 | 0,44 | 1,81 | 3,03 | 0,17 | 0,17 | 150 | 1,38 | 115,9 % | 0 | 0 / 0 | 0,5 | 2 |
| Tope de 4 | 3,78 | 3,56 | 1,30 | 1,84 | 0,48 | 1,80 | 3,02 | 0,23 | 0,23 | 156 | 1,34 | 115,9 % | 0 | 232 / 0 | 1,0 | 2 |
| Tope de 3 | 3,00 | 3,61 | 1,35 | 2,19 | 0,64 | 1,83 | 3,04 | 0,37 | 0,37 | 0 | 1,42 | 116,0 % | 0 | 969 / 0 | 1,5 | 0 |
| Tope de 2 | 2,00 | 3,75 | 1,53 | 2,60 | 0,73 | 1,93 | 3,08 | 0,46 | 0,46 | 0 | 1,52 | 115,4 % | 0 | 1694 / 0 | 1,0 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,67 | 1,42 | 2,21 | 0,61 | 1,71 | 3,79 | 0,36 | 0,38 | 0 | 1,34 | 117,9 % | 0 | 798 / 0 | 20,0 | 0 |

**omni-3714**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,96 | 3,54 | 1,22 | 1,86 | 0,54 | 1,73 | 3,04 | 0,16 | 0,16 | 149 | 2,65 | 108,5 % | 0 | 0 / 0 | 0,0 | 1 |
| Tope de 4 | 3,75 | 3,50 | 1,23 | 2,02 | 0,50 | 1,75 | 3,04 | 0,24 | 0,24 | 151 | 2,80 | 108,4 % | 0 | 266 / 0 | 0,5 | 1 |
| Tope de 3 | 3,00 | 3,63 | 1,36 | 2,27 | 0,56 | 1,80 | 3,04 | 0,38 | 0,38 | 0 | 3,02 | 107,9 % | 0 | 1015 / 0 | 1,0 | 0 |
| Tope de 2 | 2,00 | 3,81 | 1,43 | 2,65 | 0,71 | 1,93 | 3,08 | 0,47 | 0,47 | 0 | 3,08 | 107,4 % | 0 | 1740 / 0 | 3,0 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,69 | 1,43 | 2,23 | 0,57 | 1,75 | 3,79 | 0,33 | 0,33 | 0 | 2,54 | 110,1 % | 0 | 794 / 0 | 21,5 | 0 |

**celiaco-2400**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 4,08 | 3,60 | 1,43 | 1,49 | 0,63 | 1,77 | 3,04 | 0,00 | 0,00 | 172 | 1,47 | 111,0 % | 0 | 0 / 0 | 1,5 | 0 |
| Tope de 4 | 3,90 | 3,56 | 1,49 | 1,51 | 0,67 | 1,85 | 3,02 | 0,00 | 0,02 | 179 | 1,58 | 110,5 % | 0 | 293 / 0 | 1,5 | 0 |
| Tope de 3 | 3,00 | 3,71 | 1,64 | 1,66 | 1,02 | 1,91 | 2,94 | 0,00 | 0,07 | 0 | 1,70 | 110,1 % | 0 | 1040 / 0 | 2,0 | 0 |
| Tope de 2 | 2,00 | 3,81 | 1,78 | 1,79 | 1,34 | 1,98 | 2,83 | 0,00 | 0,29 | 0 | 1,96 | 108,2 % | 0 | 1745 / 0 | 2,5 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,72 | 1,65 | 1,68 | 1,06 | 1,86 | 3,74 | 0,00 | 0,03 | 0 | 1,64 | 113,6 % | 0 | 799 / 0 | 24,5 | 0 |

**sin-lactosa-2000**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 4,07 | 3,50 | 1,15 | 1,81 | 0,54 | 1,74 | 3,02 | 0,21 | 0,21 | 162 | 1,50 | 108,9 % | 0 | 0 / 0 | 0,5 | 0 |
| Tope de 4 | 3,81 | 3,51 | 1,19 | 1,84 | 0,61 | 1,77 | 3,05 | 0,27 | 0,27 | 163 | 1,51 | 109,1 % | 0 | 307 / 0 | 0,0 | 0 |
| Tope de 3 | 3,00 | 3,63 | 1,29 | 2,19 | 0,64 | 1,82 | 3,04 | 0,43 | 0,43 | 0 | 1,58 | 108,8 % | 0 | 1042 / 0 | 3,5 | 0 |
| Tope de 2 | 2,00 | 3,85 | 1,50 | 2,38 | 0,83 | 1,93 | 3,08 | 0,49 | 0,53 | 0 | 1,73 | 108,5 % | 0 | 1732 / 0 | 2,5 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,69 | 1,34 | 2,13 | 0,70 | 1,72 | 3,85 | 0,41 | 0,42 | 0 | 1,52 | 110,5 % | 0 | 800 / 0 | 16,5 | 0 |

**sibo-2000**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 5,03 | 3,17 | 1,14 | 1,32 | 0,52 | 1,82 | 0,00 | 0,00 | 0,00 | 196 | 1,85 | 99,5 % | 0 | 0 / 0 | 0,0 | 0 |
| Tope de 4 | 3,98 | 3,37 | 1,37 | 1,68 | 0,68 | 1,87 | 0,00 | 0,06 | 0,06 | 197 | 2,08 | 98,7 % | 0 | 681 / 0 | 0,0 | 0 |
| Tope de 3 | 3,00 | 3,63 | 1,39 | 2,04 | 0,95 | 1,89 | 0,00 | 0,10 | 0,10 | 0 | 2,30 | 98,2 % | 7 | 1264 / 0 | 0,0 | 0 |
| Tope de 2 | 2,00 | 3,71 | 1,53 | 2,38 | 1,28 | 1,92 | 0,00 | 0,17 | 0,17 | 0 | 2,46 | 97,6 % | 17 | 1893 / 0 | 0,0 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,63 | 1,39 | 2,04 | 0,95 | 1,89 | 0,00 | 0,10 | 0,10 | 0 | 2,30 | 98,2 % | 7 | 1264 / 0 | 0,0 | 0 |

**omni-2174-ancla**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,71 | 3,51 | 1,24 | 1,91 | 0,47 | 1,73 | 3,04 | 0,17 | 0,43 | 121 | 1,77 | 106,4 % | 0 | 0 / 0 | 0,5 | 0 |
| Tope de 4 | 3,56 | 3,54 | 1,29 | 2,00 | 0,43 | 1,70 | 3,02 | 0,21 | 0,48 | 112 | 1,83 | 106,3 % | 0 | 155 / 0 | 1,0 | 1 |
| Tope de 3 | 3,00 | 3,60 | 1,33 | 2,21 | 0,49 | 1,78 | 3,00 | 0,32 | 0,58 | 0 | 1,98 | 105,9 % | 0 | 885 / 0 | 2,0 | 0 |
| Tope de 2 | 2,00 | 3,70 | 1,49 | 2,47 | 0,76 | 1,89 | 3,09 | 0,43 | 0,70 | 0 | 2,10 | 105,8 % | 0 | 1632 / 0 | 1,0 | 0 |
| Tope de 3 y legumbre a 4 | 3,00 | 3,60 | 1,31 | 2,25 | 0,51 | 1,76 | 3,25 | 0,30 | 0,57 | 0 | 1,99 | 106,2 % | 0 | 876 / 0 | 3,5 | 0 |

**omni-2000-sin-atun**

| Variante | Pescado y marisco/sem | Ave | Carne roja | Cerdo | Conejo | Huevo | Legumbre | Otro | Comidas sin proteína animal/sem | Semanas con 4 o más pescados | Comidas y cenas cortas de proteína/sem | Proteína del día | Infracciones de D-099.3 | Tope aplicado / sin aplicar | Día sorteado sin legumbre /100 sem | Semanas fuera de ±5 % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Motor actual (sin tope) | 3,60 | 3,57 | 1,33 | 2,02 | 0,43 | 1,81 | 3,08 | 0,23 | 0,23 | 110 | 1,98 | 108,2 % | 0 | 0 / 0 | 2,0 | 0 |
| Tope de 4 | 3,52 | 3,56 | 1,34 | 2,04 | 0,49 | 1,80 | 3,06 | 0,24 | 0,24 | 107 | 1,96 | 108,2 % | 0 | 160 / 0 | 3,5 | 0 |
| Tope de 3 | 3,00 | 3,70 | 1,41 | 2,23 | 0,49 | 1,80 | 3,06 | 0,35 | 0,35 | 0 | 2,10 | 108,0 % | 0 | 768 / 0 | 2,5 | 0 |
| Tope de 2 | 2,00 | 3,75 | 1,48 | 2,65 | 0,72 | 1,93 | 3,13 | 0,46 | 0,47 | 0 | 2,31 | 107,7 % | 0 | 1600 / 0 | 2,5 | 0 |
| Tope de 3 y legumbre a 4 | 2,98 | 3,71 | 1,43 | 2,19 | 0,54 | 1,83 | 3,87 | 0,33 | 0,34 | 0 | 2,04 | 109,5 % | 0 | 554 / 0 | 13,5 | 0 |

## Lectura (2026-11-16)

- **Hoy:** 3,91 platos de pescado y marisco por semana en los 8 omnívoros, y el 72 % de las semanas con 4 o más (282 de 1600 con más de 4). Con SIBO, 5,03 (sin legumbre: su hueco lo ocupa el pescado). Ave 3,51, cerdo 1,84, huevo 1,76, carne roja 1,27, conejo 0,52; legumbre 3,04 (primeros de la comida doble).
- **Tope de 4:** quita poco (3,91 → 3,73): solo recorta las semanas de 5 o más. Lo que se quita lo ocupan cerdo y otros platos.
- **Tope de 3:** 3,00 por semana exactos, ninguna semana con 4 o más. El hueco lo ocupan sobre todo cerdo (+0,30), ave (+0,13), carne roja (+0,12), conejo (+0,11) y platos sin proteína animal (+0,17). Comidas y cenas cortas de proteína 1,84 → 2,03 por semana; proteína del día 108,4 → 108,0 %; D-099.3, 0.
- **Tope de 2:** 2,00 por semana; el cerdo sube a 2,46 y las comidas sin proteína animal a 0,48. Cortas 2,15 por semana. **Choca con el suelo de pescado de D-024 (3):** las 1600 semanas se quedan por debajo y el log no lo dice, porque el filtro quita el pescado antes de que el paso 4 lo vea (0 casos de `frecuencia_corta_sin_candidato`). Si se quisiera un tope por debajo de 3, el suelo tendría que bajar con él.
- **Tope de 3 y legumbre a 4:** legumbre 3,04 → 3,74 por semana, no 4: un día sorteado se queda sin legumbre 16,7 veces por cada 100 semanas (0,9 hoy). Con el sábado libre solo hay un conjunto de 4 días sin dos seguidos (lunes, miércoles, viernes y domingo), así que los días quedan fijos en 1397 de 1600 semanas; el resto, cuando el ancla ocupa alguno. Cortas 1,94 por semana y proteína del día 109,6 %: algo mejor que el tope de 3 solo, por los segundos de la comida doble.
- **Infracciones de D-099.3:** 0 en las cinco variantes.

## 4. Cómo recibiría el motor un parámetro de perfil así (sin implementar)

- **Hoy no hay tope de familia de pescado.** Hay un tope por especie, la constante `TOPE_PROTEINA_SEMANA = 2` (`src/engine2/dishes/bases.js:100`), que se lee en cuatro sitios: el pool de cada hueco (`runWalk.js:582`), el segundo de la comida doble (`runWalk.js:452`, que lo pasa a `elegirSegundo`), las infracciones de la red de D-116.5 (`legumbre.js:216`) y las alternativas (`alternativa.js:95`). Y hay un suelo, `DEFAULT_WEEKLY_TARGETS.pescado = 3` (`contracts/weeklyTargets.js`), que lee el paso 4 (`frequencies.js:328`).
- **Cómo llega hoy el perfil al motor:** `generarPlanEngine2` (`src/plan/engine2App.js:219`) le pasa a `materializePlan` un perfil reducido (`trainingDays`, `intolerances` y `dieta`), que llega a `runWalk` como `input.profile`. `contracts/profile.js` (`validateProfile`) solo valida los campos que algún consumidor usa.
- **Sitio natural:**
  1. Un campo nuevo del perfil de la app (por ejemplo, `pescadoMaxSemana`), que `engine2App.js` añade a ese perfil reducido.
  2. `contracts/profile.js` lo valida (un entero en un rango cerrado), porque ya tiene consumidor.
  3. `runWalk.js` lo lee de `input.profile` y lo aplica como filtro con vuelta atrás, justo después del tope por especie (donde lo pone la medición). Su causa va en el log.
  4. `regenerarComidaEngine2` se lo pasa a `elegirAlternativa`, para que una alternativa no lo rompa.
  5. El suelo de pescado del paso 4 no puede quedar por encima del tope: o el paso 4 recibe los suelos de la semana como entrada (hoy los importa como constante), o se usa el menor de los dos. Sin esto, un tope de 2 deja el suelo de 3 sin cumplir y sin causa.
  6. No es una regla de D-099.3: no entra en las infracciones de la red.
  7. En el banco, un perfil con el campo, para medirlo.
- No toca Supabase si el perfil se guarda como hasta ahora; no lo he comprobado.
