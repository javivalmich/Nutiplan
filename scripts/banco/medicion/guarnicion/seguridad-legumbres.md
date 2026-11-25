# Seguridad de las legumbres de guarnición (2026-11-23)

Salida de `seguridadLegumbres.mjs`. Qué filtros de la app quitarían hoy cada legumbre si apareciera en el texto de un plato, con el texto que escribiría el prototipo. Solo comprueba; no cambia nada.

| Legumbre | Texto | Intolerancia «legumbres»: alergenos.js | Intolerancia «legumbres»: engine2App.js:77 | Intolerancia «soja» | SIBO (fodmapRestante) |
|---|---|---|---|---|---|
| garbanzos | Garbanzos cocidos (120 g) | la quita | la quita | no aplica | la quita |
| alubias blancas | Alubias blancas cocidas (120 g) | la quita | la quita | no aplica | la quita |
| alubias rojas | Alubias rojas cocidas (120 g) | la quita | la quita | no aplica | la quita |
| alubias pintas | Alubias pintas cocidas (120 g) | la quita | la quita | no aplica | la quita |
| alubias negras | Alubias negras cocidas (120 g) | la quita | la quita | no aplica | la quita |
| lentejas pardinas | Lentejas pardinas cocidas (120 g) | la quita | la quita | no aplica | la quita |
| lentejas beluga | Lentejas beluga cocidas (120 g) | la quita | la quita | no aplica | la quita |
| habitas | Habitas (120 g) | **NO la quita** | **NO la quita** | no aplica | **NO la quita** |
| guisantes | Guisantes (120 g) | la quita | la quita | no aplica | la quita |
| edamame | Edamame (120 g) | la quita | la quita | la quita | la quita |

## eliminatedFoods (texto libre)

| Legumbre | Palabra escrita por el usuario | ¿La quita? |
|---|---|---|
| garbanzos | «garbanzos» | sí |
| garbanzos | «garbanzo» | sí |
| garbanzos | «legumbres» | **no** |
| alubias blancas | «alubias» | sí |
| alubias blancas | «alubia» | sí |
| alubias blancas | «alubias blancas» | sí |
| alubias blancas | «judías blancas» | **no** |
| alubias blancas | «judías» | **no** |
| alubias blancas | «legumbres» | **no** |
| alubias rojas | «alubias» | sí |
| alubias rojas | «alubias rojas» | sí |
| alubias rojas | «judías rojas» | **no** |
| alubias rojas | «frijoles» | **no** |
| alubias rojas | «frijoles rojos» | **no** |
| alubias rojas | «legumbres» | **no** |
| alubias pintas | «alubias» | sí |
| alubias pintas | «alubias pintas» | sí |
| alubias pintas | «judías pintas» | **no** |
| alubias pintas | «frijoles» | **no** |
| alubias pintas | «legumbres» | **no** |
| alubias negras | «alubias» | sí |
| alubias negras | «alubias negras» | sí |
| alubias negras | «frijoles» | **no** |
| alubias negras | «frijoles negros» | **no** |
| alubias negras | «judías negras» | **no** |
| alubias negras | «legumbres» | **no** |
| lentejas pardinas | «lentejas» | sí |
| lentejas pardinas | «lenteja» | sí |
| lentejas pardinas | «legumbres» | **no** |
| lentejas beluga | «lentejas» | sí |
| lentejas beluga | «lenteja» | sí |
| lentejas beluga | «legumbres» | **no** |
| habitas | «habas» | **no** |
| habitas | «haba» | **no** |
| habitas | «habitas» | sí |
| habitas | «legumbres» | **no** |
| guisantes | «guisantes» | sí |
| guisantes | «guisante» | sí |
| guisantes | «legumbres» | **no** |
| edamame | «edamame» | sí |
| edamame | «soja» | **no** |
| edamame | «habas de soja» | **no** |
| edamame | «legumbres» | **no** |

## Huecos

- **habitas**: con intolerancia a legumbres, ningún filtro la quita.
- **habitas**: con SIBO, fodmapRestante no la marca.
- garbanzos: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- alubias blancas: quien escribe «judías blancas» en sus alimentos eliminados la seguiría recibiendo.
- alubias blancas: quien escribe «judías» en sus alimentos eliminados la seguiría recibiendo.
- alubias blancas: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- alubias rojas: quien escribe «judías rojas» en sus alimentos eliminados la seguiría recibiendo.
- alubias rojas: quien escribe «frijoles» en sus alimentos eliminados la seguiría recibiendo.
- alubias rojas: quien escribe «frijoles rojos» en sus alimentos eliminados la seguiría recibiendo.
- alubias rojas: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- alubias pintas: quien escribe «judías pintas» en sus alimentos eliminados la seguiría recibiendo.
- alubias pintas: quien escribe «frijoles» en sus alimentos eliminados la seguiría recibiendo.
- alubias pintas: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- alubias negras: quien escribe «frijoles» en sus alimentos eliminados la seguiría recibiendo.
- alubias negras: quien escribe «frijoles negros» en sus alimentos eliminados la seguiría recibiendo.
- alubias negras: quien escribe «judías negras» en sus alimentos eliminados la seguiría recibiendo.
- alubias negras: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- lentejas pardinas: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- lentejas beluga: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- habitas: quien escribe «habas» en sus alimentos eliminados la seguiría recibiendo.
- habitas: quien escribe «haba» en sus alimentos eliminados la seguiría recibiendo.
- habitas: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- guisantes: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
- edamame: quien escribe «soja» en sus alimentos eliminados la seguiría recibiendo.
- edamame: quien escribe «habas de soja» en sus alimentos eliminados la seguiría recibiendo.
- edamame: quien escribe «legumbres» en sus alimentos eliminados la seguiría recibiendo.
