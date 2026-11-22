# Prototipo 2: guarnición de legumbre decidida en el walk (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `c6e2156`.

Archivos de esta carpeta:
- `prototipo2-resumen.md`: todas las cifras, también por perfil (`resumenGuarnicion2.mjs`).
- `prototipo2-ejemplos.md`: semanas de ejemplo.
- `huevos-cortos.md`: los platos de huevo cortos de proteína (`huevosCortos.mjs`).

## Qué cambia respecto al prototipo 1

1. **Elección en dos pasos, sin pesos.** En la comida, después de elegir el plato del hueco, y si el plato admite legumbre:
   - primero, con la semilla, entre «hidrato original» y «legumbre», uniforme entre las dos;
   - si sale legumbre, cuál de su lista, uniforme entre las que valen esa semana.
2. **En la cena, ninguna guarnición** de legumbre (D-099.3).
3. **La guarnición cuenta para el suelo de legumbre de D-024.** Sube el contador semanal de legumbre y marca el día (la veda de días seguidos), así que los huecos siguientes ven la semana menos corta de legumbre. No hay suelo de 2 propio: el suelo es el de D-024.
4. **Dos subvariantes:**
   - **(a):** solo los puntos 1 a 3.
   - **(b):** además, un plato compuesto de legumbre (plantilla «legumbre») solo entra en el pool si el hueco no tiene otro candidato, con causa en el log. Los redactados de legumbre no cambian.
5. **Se mantienen:** el tope de 3 legumbres por semana, guisantes y habitas juntos como mucho 1, no repetir legumbre, el tope de pescado de 3, D-115, los filtros de seguridad, los ingredientes y la ración del prototipo 1 (80–240 g escurridos).

**Cambio sobre lo pedido, que hay que validar.** El tope de 3 cuenta también los platos de legumbre que elige el walk después de la guarnición.
- Al decidir la guarnición dentro del walk, en la prueba con omni-2174 salieron semanas de 4 legumbres (1 guarnición y 3 platos).
- Por eso añadí un filtro con vuelta atrás: con 3 legumbres en la semana, salen del pool los platos de legumbre si queda otro candidato.
- Así ninguna semana pasa de 3 en (a) ni en (b).

## Resultados: 200 semanas, 16 perfiles, frente a `main` (`19a300c`) y HEAD

Agregado de los 9 omnívoros (los 8 con pescado y sin-pescado-2000), 1800 semanas por medición:

| Métrica | main | HEAD | (a) | (b) |
|---|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,15 | 3,37 | **2,43** |
| … de legumbre suelta | 1,08 | 0,08 | 1,30 | 0,15 |
| … de huevo | 1,05 | 1,37 | 1,38 | 1,51 |
| … otras | 0,74 | 0,70 | 0,69 | 0,77 |
| Proteína del día | 101,2 % | 107,6 % | 100,6 % | 102,3 % |
| Legumbres/sem (guarnición + plato) | 1,16 (0 + 1,16) | 3,01 (0 + 3,01) | 2,44 (1,05 + 1,39) | 1,65 (1,42 + 0,23) |
| Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | 413 / 809 / 466 / 106 / 6 | 1 / 17 / 59 / 1601 / 122 | 26 / 198 / 541 / 1035 / 0 | 217 / 580 / 618 / 385 / 0 |
| Semanas con una legumbre repetida | 285 | 1208 | 560 | 109 |
| Pescado/sem | 4,28 | 2,68 | 2,67 | 2,67 |
| Arroz / patata / boniato / quinoa / pasta / legumbre, por semana | 1,89 / 1,69 / 0,56 / 0,49 / 0,47 / 0 | 1,20 / 1,46 / 0,50 / 0,27 / 0,31 / 0 | 1,25 / 1,35 / 0,56 / 0,38 / 0,46 / 1,05 | 1,44 / 1,53 / 0,65 / 0,48 / 0,54 / 1,42 |
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 505 | 736 |
| Comidas y cenas fuera de ±5 % de kcal | 10,7 % | 8,5 % | 11,2 % | 11,5 % |
| Aceite por día (ml) | 37,3 | 37,8 | 37,2 | 37,3 |
| Comidas con guarnición que llevan pan | — | — | 89,4 % (92 g de media) | 89,9 % (91 g de media) |
| Infracciones de D-099.3 | 6 | 2 | 1 | 9 |

**Lectura:**
- **(b) es la mejor en proteína:** 2,43 comidas cortas por semana, mejor que `main` (2,87) aunque peor que HEAD (2,15). Las cortas de legumbre suelta casi desaparecen (1,30 en (a), 0,15 en (b)), porque la legumbre va de guarnición y no como plato único.
  - Las de huevo suben un poco (1,38 → 1,51). Supongo, sin haberlo medido, que el walk pone huevo en algunos huecos que antes llevaban un compuesto de legumbre.
- **(a) apenas cambia respecto al prototipo 1** (3,37 frente a 3,42). La guarnición cuenta para D-024, pero el walk sigue eligiendo compuestos de legumbre como plato único (1,39 por semana).
- **El coste de (b) son las legumbres:**
  - bajan a 1,65 por semana, por debajo del suelo de D-024 (3);
  - 217 de 1800 semanas no llevan ninguna;
  - con los compuestos fuera, D-024 solo puede atender el suelo con los redactados de legumbre o con la guarnición, que sale el 50 % de las veces.
- **Pan:** casi 9 de cada 10 comidas con guarnición llevan pan, unos 91 g de media. La legumbre da menos energía que el arroz o la patata que sustituye, y las raciones lo cubren con pan.
- **Hidrato en días seguidos:** en (b) sube a 736 semanas, frente a 619 en `main` y 431 en HEAD. Hay más platos de plantilla con hidrato (los compuestos de legumbre salen del pool), y el arroz y la patata repiten más a menudo.
- **D-099.3: las 9 infracciones de (b) son todas de sin-pescado-2000.** Con D-116 apagada no está su red de D-116.5, y sin compuestos de legumbre su catálogo se queda corto. No he desglosado de qué tipo son.
- **Fuera de ±5 % de kcal:** sube a 11,2–11,5 %, frente a 8,5 % en HEAD.

**Perfiles con restricciones** (detalle en `prototipo2-resumen.md`):
- **vegetariana-2000 y vegana-1400 (efecto de (b) que no se buscaba):** (b) también les quita los compuestos de legumbre, que son su proteína.
  - vegetariana-2000 pasa de 2,41 legumbres por semana a 0; vegana-1400, de 2,75 a 0,99.
  - Sus comidas cortas bajan (4,42 → 2,92 y 4,54 → 3,58), pero con mucha menos legumbre.
  - Si (b) sigue adelante, habría que limitarla a dietas omnívoras, como D-116.9.
- **solo-pollo-2000:** 3,46 en HEAD, 3,38 en (a) y 2,81 en (b), frente a 2,50 en `main`.
- **sin-carne-ave-2000:** 4,21 en HEAD, 3,81 en (a) y 3,31 en (b), frente a 2,94 en `main`.
- **sin-garbanzos-guisantes-2000:** 2,08 en (b), sin garbanzos ni guisantes.
- **sin-legumbres-2000 y sibo-2000:** ninguna legumbre en ninguna medición, e iguales a HEAD.

**Veces que actúa cada regla** (16 perfiles, 3200 semanas por subvariante):

| Regla | (a) | (b) |
|---|---|---|
| Tope de 3: guarnición no puesta | 668 | 138 |
| Guisantes y habitas, como mucho 1 | 3 | 11 |
| No repetir legumbre: aplicada / sin aplicar | 1008 / 22 | 780 / 9 |

## Ejemplos (`prototipo2-ejemplos.md`)

Subvariante (b), omni-2174:
- **Semana 67:** dos guarniciones, alubias blancas en la ensalada de pollo con quinoa y alubias rojas en el pavo al horno con arroz, cada una en lugar del hidrato. No hay plato de legumbre; la comida libre sugiere un curry de garbanzos, que no se sirve.
- **Semana 73:** tres guarniciones (alubias negras, lentejas pardinas y garbanzos) y ningún plato de legumbre.

## Aparte: platos de huevo cortos de proteína (`huevos-cortos.md`)

HEAD, 200 semanas, los 9 perfiles omnívoros: 3329 comidas o cenas de huevo servidas, y 2474 de ellas (74,3 %) quedan cortas.

**Por qué:**

| Motivo | Cortas | % |
|---|---|---|
| Tope de huevos de D-111: 3 en la comida | 1245 | 50,3 % |
| Tope de D-111 repartido: otra comida del día también lleva huevo, y el tope de 4 al día se reparte | 1092 | 44,1 % |
| Por debajo del tope, con la comida ya en su objetivo de kcal | 6 | 0,2 % |
| Otro | 131 | 5,3 % |

- **Es el tope, junto con el catálogo, no la ración.**
  - En el 94 % de los casos los huevos ya están en el tope de D-111 de ese día.
  - Los platos que quedan cortos son de huevo solo: tortillas, revueltos, huevos a la plancha, cremas con huevo y huevo con tomate, sin ninguna otra proteína. Con 2 o 3 huevos no llegan: los peores se quedan en el 62–72 % de su objetivo.
  - Los platos de huevo con una segunda proteína (crema de calabacín con queso fresco y huevo, huevos rellenos de atún, espárragos con atún y huevo) casi nunca quedan cortos: 106–120 % de su objetivo.
- **El tope repartido** pasa cuando otra comida del mismo día también lleva huevo. No he medido cuál es esa otra comida (desayuno, tentempié u otra principal).
- **Los «otro»** son 43 de la shakshuka con pan, 60 del pisto con huevo, 21 de la crema de calabacín con queso fresco y 7 de los huevos rellenos de atún: platos redactados que quedan por debajo del 95 % sin estar en el tope. No los he desglosado.
