# Prototipo 2, subvariante (b) nueva: solo omnívora, suelo por guarnición y ración de partida (2026-11-23)

Solo medición: no cambia ninguna regla ni toca `src/`. Se aplica en memoria con `variantesGuarnicion2.mjs` sobre HEAD `5bd8c9b`, con `--compuestosSoloSinOtro --soloOmnivora --sueloGuarnicion --baseGuarnicion=180` (o `=200`).

Archivos de esta carpeta:
- `prototipo3-resumen.md`: todas las cifras, también por perfil.
- `prototipo3-ejemplos.md`: dos semanas de ejemplo.

Lo anterior: `prototipo2.md`. Javi acepta que el tope de 3 cuente los platos de legumbre.

## Cambios sobre la (b) actual

1. **La (b) solo se aplica a dietas omnívoras.** Vegetariana y vegana conservan sus compuestos de legumbre, como en D-116.9.
2. **Suelo de 2 legumbres por semana, que solo actúa a través de la guarnición.**
   - Desde la mitad de la semana (el jueves, índice 3), si la semana lleva menos de 2 legumbres, el siguiente hueco de comida que admite guarnición la lleva sin el paso de la mitad. Causa: `guarnicion_suelo_semana`.
   - Si ninguna legumbre de su lista vale esa semana (guisantes y habitas ya usados…), se queda el hidrato original (`guarnicion_suelo_sin_legumbre_valida`).
   - Nunca fuerza un plato de legumbre suelto.
3. **Ración de la guarnición:** partida en 180 g y en 200 g, con rango 80–240 g escurridos. La (b) actual parte de 150 g.

## Resultados: 200 semanas, 16 perfiles

Agregado de los 9 omnívoros (los 8 con pescado y sin-pescado-2000), 1800 semanas por medición:

| Métrica | main | HEAD | (b) actual | (b) nueva 180 g | (b) nueva 200 g |
|---|---|---|---|---|---|
| Comidas y cenas cortas/sem | 2,87 | 2,15 | 2,43 | 2,38 | 2,38 |
| … de legumbre suelta | 1,08 | 0,08 | 0,15 | 0,14 | 0,14 |
| … de huevo | 1,05 | 1,37 | 1,51 | 1,51 | 1,51 |
| … otras | 0,74 | 0,70 | 0,77 | 0,73 | 0,73 |
| Proteína del día | 101,2 % | 107,6 % | 102,3 % | 102,2 % | 101,9 % |
| Legumbres/sem (guarnición + plato) | 1,16 (0 + 1,16) | 3,01 (0 + 3,01) | 1,65 (1,42 + 0,23) | 2,14 (1,93 + 0,21) | 2,14 (1,93 + 0,21) |
| Semanas con 0 / 1 / 2 / 3 / más de 3 legumbres | 413 / 809 / 466 / 106 / 6 | 1 / 17 / 59 / 1601 / 122 | 217 / 580 / 618 / 385 / 0 | 25 / 252 / 971 / 552 / 0 | 25 / 252 / 971 / 552 / 0 |
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 736 | 773 | 773 |
| Comidas con guarnición que llevan pan | — | — | 89,9 % (91 g) | 91,1 % (91 g) | 91,1 % (91 g) |
| Comidas y cenas fuera de ±5 % de kcal | 10,7 % | 8,5 % | 11,5 % | 12,5 % | 12,6 % |
| Infracciones de D-099.3 | 6 | 2 | 9 | 10 | 10 |
| Pescado/sem | 4,28 | 2,68 | 2,67 | 2,67 | 2,67 |

**Lectura:**
- **El suelo por guarnición recupera legumbre sin empeorar la proteína.**
  - Las legumbres suben de 1,65 a 2,14 por semana, y las semanas sin ninguna bajan de 217 a 25 de 1800.
  - Las comidas cortas bajan un poco (2,43 → 2,38): las cortas de legumbre suelta no vuelven (0,14), porque el suelo solo pone guarnición.
  - Actúa 2138 veces en 3200 semanas, y nunca se queda sin legumbre válida.
  - Sobre las 25 semanas sin legumbre, deduzco por descarte (no lo he contado) que no tienen ningún hueco de comida desde el jueves que admita guarnición: el suelo actúa en cualquiera que la admita, y nunca se quedó sin legumbre válida.
- **Siguen por debajo del suelo de 2:** 277 de 1800 semanas (25 con 0 y 252 con 1). El suelo solo puede actuar en los huecos que admiten guarnición y quedan desde el jueves.
- **Las cortas de huevo** (1,51) son ahora la mayor parte de las comidas cortas. Ver «Platos de huevo» en `prototipo2.md`.
- **Vegetariana y vegana vuelven a lo de la (a):**
  - vegetariana-2000: 2,41 legumbres por semana y 4,42 comidas cortas, frente a 2,42 y 4,50 en HEAD;
  - vegana-1400: 2,75 legumbres y 4,54 comidas cortas, frente a 3,04 y 4,79 en HEAD.
- **Otros perfiles con la (b) nueva de 180 g** (comidas cortas por semana):
  - solo-pollo-2000: 2,85 (HEAD 3,46, `main` 2,50);
  - sin-carne-ave-2000: 3,31 (HEAD 4,21, `main` 2,94);
  - sin-garbanzos-guisantes-2000: 2,07, con 2,21 legumbres por semana, frente a 1,68 en la (b) actual;
  - sin-legumbres-2000 y sibo-2000: iguales a HEAD, sin ninguna legumbre.

### Ración: 180 g y 200 g dan lo mismo, salvo los gramos de legumbre

Las dos partidas dan las mismas cifras de proteína, legumbre, hidrato e infracciones. El pan sale igual: el 91 % de las comidas con guarnición lo lleva, con 91 g de media.

**Por qué, con evidencia** (`gramosGuarnicion.mjs`, omni-2174, 20 semanas):

| Partida | Legumbre de media (mín.–máx.) | En 240 g | Comidas con pan | Pan de media |
|---|---|---|---|---|
| 150 g | 206 g (170–240) | 5 de 40 | 40 de 40 | 82 g |
| 180 g | 228 g (200–240) | 17 de 40 | 40 de 40 | 81 g |
| 200 g | 235 g (210–240) | 29 de 40 | 40 de 40 | 82 g |

- **La partida cambia cuánta legumbre lleva el plato, pero no el pan.**
- **Las raciones añaden pan cuando el plato**, con todos sus ingredientes en el máximo, se queda más de un 5 % por debajo de su objetivo de kcal (`raciones.js:358-381`). Después reajustan el plato entero, y por eso la legumbre acaba por debajo de 240 g aunque lleve pan.
- **240 g de legumbre no llegan a la energía del hidrato que sustituyen:** garbanzos 319 kcal, alubias unas 222 y lentejas 177. La comida de omni-2174 pide unas 815 kcal, y el arroz puede llegar a 160 g en seco (rango del grupo hidrato), unas 620 kcal él solo.
- **Para que no haga falta el pan,** el máximo de la guarnición tendría que pasar de un bote, o mantener parte del hidrato junto a la legumbre. No está medido.

## Las 9 infracciones de D-099.3 de sin-pescado-2000 en la (b) actual

Todas son de sin-pescado-2000 (en HEAD, 2 semanas con infracciones). Con la (b) nueva de 180 g son 10.

| Tipo | Infracciones | Ejemplos (semana: especie, días) |
|---|---|---|
| Especie en días seguidos | 4 | 65: pavo sábado y domingo en la cena · 108: conejo sábado y domingo en la cena · 208: conejo sábado y domingo en la cena · 213: ternera viernes en la comida y sábado en la cena |
| Misma especie el mismo día | 3 | 75: conejo en la comida y en la cena del domingo · 142: conejo, también el domingo · 166: cerdo en la comida y en la cena del domingo |
| Especie más de 2 veces en la semana | 2 | 156: huevo (martes, viernes y domingo en la cena) · 244: pollo (lunes y miércoles en la comida y domingo en la cena) |

**Por qué:**
- **Casi todas caen al final de la semana** (sábado y domingo), cuando quedan pocos platos que cumplan las reglas.
- **El perfil sin pescado ni marisco solo tiene como proteína** ave, carne, huevo y legumbre.
  - En HEAD, sus platos de legumbre (2,77 por semana, con su segundo) ocupan huecos con especies que no chocan con la carne.
  - Con la (b), los compuestos de legumbre salen del pool: los platos de legumbre bajan a 0,81 por semana, y esos huecos los llenan ave (2,69 → 3,60) y carne (5,23 → 6,16).
  - Con tope de 2 por especie y unas 7 especies animales (pollo, pavo, ternera, cerdo, conejo, huevo, jamón), la semana se queda sin margen. La separación por especie se relaja con su vuelta atrás.
- **La red de D-116.5**, que en HEAD repetía la semana sin la regla, no está: D-116 y D-117 van apagadas.
- **Si (b) siguiera adelante,** este perfil necesitaría una red propia. Por ejemplo, repetir la semana sin la (b) si la semana incumple D-099.3, como hace hoy la red de D-116.5. No está medido.

## De dónde sale la subida del hidrato repetido en días seguidos

| | main | HEAD | (b) actual | (b) nueva 180 g |
|---|---|---|---|---|
| Semanas con el mismo hidrato en días seguidos | 619 | 431 | 736 | 773 |
| Días con algún hidrato de plantilla, por semana | 4,43 | 3,35 | 5,30 | 5,33 |
| Pares de días seguidos con el mismo hidrato, por semana: arroz / patata / boniato / quinoa / pasta / legumbre | 0,27 / 0,12 / 0,03 / 0,02 / 0 / 0 | 0,12 / 0,12 / 0,02 / 0,01 / 0 / 0 | 0,20 / 0,12 / 0,03 / 0,01 / 0 / 0,16 | 0,15 / 0,10 / 0,02 / 0,01 / 0 / 0,26 |

Frente a HEAD, la subida tiene dos causas, que se ven en la tabla:
1. **Hay más días con un hidrato de plantilla** (3,35 → 5,30 por semana).
   - En HEAD, tres comidas por semana son comidas dobles con un primero de legumbre, que no tiene hidrato de plantilla.
   - En la (b) esos compuestos salen del pool y su hueco lo ocupa un plato con arroz, patata, boniato o quinoa.
   - Con más días con hidrato hay más ocasiones de repetirlo: el arroz pasa de 0,12 a 0,20 pares por semana.
2. **La guarnición de legumbre cuenta como hidrato:** dos días seguidos con guarnición de legumbre, aunque sea distinta (alubias un día y lentejas el siguiente), cuentan como el mismo hidrato. Son 0,16 pares por semana en la (b) actual y 0,26 en la nueva, que pone más guarnición.

Frente a `main` (619), la (b) nueva tiene menos arroz repetido (0,15 frente a 0,27), pero suma los pares de legumbre. Si la repetición de la legumbre se contara por legumbre y no como un solo hidrato, la cifra bajaría. No está medido.

## Ejemplos (`prototipo3-ejemplos.md`)

(b) nueva con 180 g, omni-2174, semanas 61 y 64. En las dos, el suelo actúa dos veces, el jueves o el viernes y el domingo, porque la semana iba corta (0 y después 1 legumbre):
- **Semana 61:** ternera a la plancha con alubias pintas y pavo al horno con garbanzos, las dos en lugar de patata.
- **Semana 64:** lomo de cerdo con lentejas pardinas y lomo de cerdo con alubias blancas, las dos en lugar de patata.
