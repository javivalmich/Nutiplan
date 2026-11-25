# Infracciones de especie de la primera medición (commit `4182b9d`)

Generado con `scripts/banco/medicion/detalleInfraccionesTiempo.mjs` sobre la medición sin la red de la semana. Son las 9 de poco+novato y las 7 de poco+intermedio en los perfiles no veganos (el control, normal+intermedio, tiene 0). Las 16 son de `sin-pescado-2000`, el único perfil omnívoro sin pescado ni marisco.

## Por qué salen

No es un error del hook: ninguna cae en un hueco donde el filtro se saltara una regla. 15 de las 16 caen en el fin de semana, que no se filtra, y la otra (s252, pollo) une un viernes filtrado con un sábado sin filtro.

- Sin pescado, la semana se reparte entre pollo, pavo, ternera, cerdo, huevo, conejo y algún embutido, con un tope de 2 platos por especie.
- Entre semana, el filtro deja sobre todo platos rápidos y fáciles de pollo, pavo, ternera, cerdo y huevo. Esas especies llegan pronto a su tope de 2.
- El conejo apenas pasa el filtro (al horno son 50 min y guisado es «media»), así que no sale entre semana. El fin de semana es casi lo único que queda.
- En el último o los dos últimos huecos del domingo, «proteína separada» y «familia en días seguidos» ya no se pueden aplicar sin dejar el hueco vacío, y el walk las retira hueco a hueco, como en cualquier semana. Por eso salen conejo dos veces el domingo, o conejo sábado y domingo.
- En el control, el conejo se reparte entre semana y no se acumula al final.

El filtro mira un hueco cada vez y su red solo salta cuando el hueco se queda sin candidatos. No veía que gastaba las especies que el fin de semana necesitaba para separarse.

## Corrección (red de la semana)

Si la semana filtrada incumple D-099.3, se repite entera con la misma semilla sin el filtro, y se queda la repetición solo si incumple menos. Es el mismo patrón que la red de D-099.3 de la guarnición (`redD099Guarnicion`, `src/engine2/walk/guarnicion.js:191`). Con ella, las infracciones de especie de los perfiles no veganos quedan en 0. La red rehace 7 semanas de 3200 con poco+novato y 8 con poco+intermedio, todas de `sin-pescado-2000`. En vegana solo se queda la repetición cuando incumple menos: las infracciones que el control vegano ya tiene no retiran el filtro.

## Las 16

| Perfil | Combinación | Semana | Infracción | Especie | Huecos (cómo se colocaron) |
|---|---|---|---|---|---|
| sin-pescado-2000 | poco+intermedio | 63 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 95 | días seguidos | conejo | Viernes cena: Conejo al ajillo con alcachofas *(red)*<br>Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 156 | días seguidos | conejo | Viernes cena: Conejo al ajillo con alcachofas *(red)*<br>Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 177 | mismo día | conejo | Domingo comida: Conejo al horno con alcachofas y garbanzos *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 189 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con alcachofas *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 214 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+intermedio | 237 | días seguidos | pavo | Sábado cena: Pechuga de pavo a la plancha con curry y cúrcuma con judías verdes y boniato *(fin de semana, sin filtro)*<br>Domingo cena: Hamburguesa de pavo con pan integral y patatas gajo *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 82 | mismo día | conejo | Domingo comida: Conejo al horno con espinacas y garbanzos *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 144 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 159 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con alcachofas *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 202 | días seguidos | conejo | Sábado cena: Conejo al ajillo con alcachofas *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 204 | días seguidos | conejo | Sábado cena: Conejo al ajillo con alcachofas *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 206 | mismo día | conejo | Domingo comida: Conejo al horno con alcachofas y garbanzos *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 227 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 240 | días seguidos | conejo | Sábado cena: Conejo al horno con espinacas y patata *(fin de semana, sin filtro)*<br>Domingo cena: Conejo al ajillo con champiñones y arroz blanco *(fin de semana, sin filtro)* |
| sin-pescado-2000 | poco+novato | 252 | días seguidos | pollo | Viernes comida: Crema de brócoli con pechuga de pollo encima *(filtro)*<br>Sábado cena: Ramen simplificado con pollo y huevo *(fin de semana, sin filtro)* |
