# Comprobación posterior de D-093 — 2026-10-09

Comprobación de solo lectura. Describe y no decide. Registra la verificación del versionado de D-093: el commit `e81d893` en la rama `docs/d-093-criterio` y su merge `38cd9ee` en `main`. Se versiona en el PR de D-094, como prevén sus Consecuencias.

## 1. Objeto
Comprobar, partiendo del ancla `aa63f901f389d8fad8acc4c90c37b3a7aa9cf843`:
- Antes de crear la rama: que el repositorio está en el ancla, en `main`, con el árbol limpio, con el `origin` previsto y sin la subcarpeta `docs/evidence/fase7-criterio/comprobacion-d092/`.
- Antes del commit: que la copia de trabajo generaría los blobs previstos.
- En el commit de la rama y en el merge: que `DECISIONS.md` es el blob del ancla seguido de un LF y de `d093-entrada.txt`; que `comprobacion-d092/` contiene exactamente 5 rutas, cada una con el sha256 fijado en el script; y que `git diff --name-only` desde el ancla devuelve exactamente 6 rutas.

## 2. Ficheros

| Fichero | Contenido | sha256 |
|---|---|---|
| `verificar-d093.mjs` | Script de verificación con tres modos: `--puerta`, `--pre` y commit. Solo lee: no escribe ni modifica nada | `f96406c61173e2adfdeb560428b9fe832c9681873277bfda373727c35f4f948f` |
| `d093-entrada.txt` | Texto de la entrada de D-093 con el que se compara `DECISIONS.md` | `3e90860eaee23aa45edd4e880043e8a57e651f8f1a7dd51cf09a07f797cf99ef` |
| `salidas/1-puerta.txt` | Salida del script en modo `--puerta` | `4c8332fda400482c15da74ec5452748e2dcecbc0f5eead4628bd398859774992` |
| `salidas/1-puerta.txttype` | Código de salida del paso 1 (sección 7) | `8ec338231b3eeb7e0646542ccf180478969702e97ec4fe03cbff5ef559887cbf` |
| `salidas/2-check-attr.txt` | Atributo `text` de dos rutas de `comprobacion-d092/` | `8e9cf06cd12438da13b7e07b635af5fbb6a3e0c421aa51555c8c386df0a593b8` |
| `salidas/2-check-attr.txttype` | Código de salida del paso 2 (sección 7) | `212db553a60d7546f432f80a1b836d5cea539f74c8c1177c9fba02e19d0be858` |
| `salidas/3-rama.txt` | Nombre de la rama activa | `af096ccee2e0dd22c04b0e2f44ec9fc40f34757d6b0bc01c52c9e268f7f57ff0` |
| `salidas/4-aplicar.txt` | Salida de `aplicar-d093.mjs` y su código de salida | `2b0199f2d3ddb3cd7009fc64eeabb57e81d7da87285d742b5247eb8c5a3a7b2a` |
| `salidas/5-pre.txt` | Salida del script en modo `--pre` y su código de salida | `d43436ed1a2ac2809289265ef01b37cf96abcd43a145062f214dce337d347dd1` |
| `salidas/6-rama.txt` | Salida del script sobre el commit de la rama y su código de salida | `81dc5e81bb1ee82a1520b75f1e73a7d376ab85d8380441db5e7c1dc7867bfe07` |
| `salidas/7-main.txt` | Salida del script sobre el merge en `main` y su código de salida | `8e5bc15198f4020822a925e83685526fc24638cf5a9343f56606d3264dbecc0b` |
| `salidas/8-log.txt` | Último commit de `main` tras el merge | `808bbebcf487f06b77ae0326b83b31b889bbc319fc13c7697923ce6841f95ea0` |
| `salidas/8-push.txt` | Salida del push y su código de salida | `afebe6ab0c0741130c4eb55544f8b16d21beb721df905bc2d17bf736b93cd7b6` |
| `salidas/8-status.txt` | Estado de `main` frente a `origin/main` tras el push | `5fbcb2990ad25e368c12219bf3ddca36e464d044e7acac16696fa8cd54159185` |

Todos los ficheros están en UTF-8 sin BOM, con fin de línea LF, con estas excepciones: la última línea de `4-aplicar.txt`, `5-pre.txt`, `6-rama.txt`, `7-main.txt` y `8-push.txt` (`CODIGO=0`, seguida de un espacio) termina en CRLF, y los dos `.txttype` tienen una sola línea, terminada en CRLF. Los sha256 se calcularon sobre las copias que el titular aportó desde `C:\Users\javiv\fase7-materiales\d093\`, y coinciden con los que el titular calculó con `certutil` en su terminal. Este acta no transcribe los comandos de invocación.

No se versionan:
- `aplicar-d093.mjs`, sha256 `20669d1b43f470ee8663ada5f80ba52212f4cd8e646f1e2366b0861f98927c52`.
- `acta-comprobacion-d092.md`, sha256 `db0dfce5abbd4296ebe8d1d74393abc071bf06feb4bc2ac14b353c70c0849e29`. Ya está versionado como `comprobacion-d092/README.md` (`6-rama.txt:16`, `7-main.txt:16`).

## 3. Controles
Comunes a los tres modos de `verificar-d093.mjs`:
- **E-0:** el sha256 de `d093-entrada.txt` coincide con el valor fijado en el script.
- **A-0:** el sha256 de `DECISIONS.md` en el ancla es `412de41c37d8be4034b3e53e684e9f01bcbce594e9b752a676d5aed289b08d25`.

Modo `--puerta` (8 controles):
- **P-1 a P-6:** raíz del repositorio; rama `main`; HEAD igual al ancla; árbol limpio, incluidos los ficheros sin seguimiento; `origin` previsto; la subcarpeta `comprobacion-d092/` no existe en el ancla ni en disco.

Modo `--pre` (12 controles):
- **P-1:** raíz del repositorio.
- **R-1 y R-2:** rama `docs/d-093-criterio`; HEAD igual al ancla.
- **V-a.1:** el blob que generaría `git add` para `DECISIONS.md` es el esperado.
- **V-a (5 controles, uno por fichero):** el sha256 en disco coincide con el fijado y `git add` no aplicaría conversión.
- **V-a.2:** `git status` muestra exactamente las 6 entradas previstas.

Modo commit (11 controles):
- **V-p:** el primer padre es el ancla.
- **V-b:** el blob de `DECISIONS.md` es igual, byte a byte, al del ancla seguido de un LF y de `d093-entrada.txt`.
- **V-c.0:** `comprobacion-d092/` contiene exactamente 5 rutas.
- **V-c (5 controles):** el sha256 de cada blob coincide con el fijado.
- **V-d:** `git diff --name-only` desde el ancla devuelve exactamente 6 rutas.

`aplicar-d093.mjs` emite 14 controles propios y solo escribe si todos pasan.

## 4. Ejecuciones

| Salida | Modo | Commit verificado | Rama | Fecha (UTC) |
|---|---|---|---|---|
| `1-puerta.txt` | `--puerta` | copia de trabajo, HEAD `aa63f90` | `main` | 2026-10-09T12:53:54.585Z |
| `4-aplicar.txt` | `aplicar-d093.mjs` | copia de trabajo, HEAD `aa63f90` | `docs/d-093-criterio` | 2026-10-09T12:55:28.264Z |
| `5-pre.txt` | `--pre` | copia de trabajo, HEAD `aa63f90` | `docs/d-093-criterio` | 2026-10-09T12:55:43.022Z |
| `6-rama.txt` | commit | `e81d8934c2fccef2286f0787a66886d1f151ae97` (padre `aa63f90`) | `docs/d-093-criterio` | 2026-10-09T12:56:22.462Z |
| `7-main.txt` | commit | `38cd9eea1ef50cacc57aa176b8fc3fe53b7a3b9d` (padres `aa63f90`, `e81d893`) | `main` | 2026-10-09T12:56:41.160Z |

Node v24.14.1 en todas. Los datos de esta tabla son los que los propios scripts escriben en la cabecera de cada salida.

## 5. Resultado
- En `1-puerta.txt`, `5-pre.txt`, `6-rama.txt` y `7-main.txt`, todos los controles dan PASA, ninguno da FALLA, y la última línea es «RESULTADO: TODO PASA». En `4-aplicar.txt`, los 14 controles dan PASA, hay 6 líneas ESCRITO y el resultado es «RESULTADO: APLICADO».
- En `6-rama.txt` y `7-main.txt`, el sha256 de `DECISIONS.md` en el commit es `a4691660de43a859e9c0dcc2673e610c3bac84cebfb05f01e586961b09b8b72e`, igual al esperado. Los 5 blobs de `comprobacion-d092/` coinciden con los valores fijados, y el diff devuelve 6 rutas.
- `2-check-attr.txt`: las dos rutas dan `text: unset`.
- `8-log.txt`: merge `38cd9ee`, padres `aa63f90` y `e81d893`, fecha de autor 2026-10-09 14:56:37 +0200 (12:56:37 UTC), asunto «Merge D-093 criterio de superacion».
- `8-push.txt`: `aa63f90..38cd9ee  main -> main`.
- `8-status.txt`: `## main...origin/main`.
- Códigos de salida: `CODIGO=0` en `4-aplicar.txt`, `5-pre.txt`, `6-rama.txt`, `7-main.txt` y `8-push.txt`. Los de los pasos 1 y 2 constan solo en los `.txttype` (sección 7). `3-rama.txt`, `8-log.txt` y `8-status.txt` no registran código.
- Orden: la verificación sobre `main` (12:56:41 UTC) es posterior a la fecha de autor del merge. Ningún fichero registra la hora del push; que fuera posterior a esa verificación solo lo indica la numeración de los ficheros.

## 6. Alcance del script
Los modos `--puerta` y `--pre` solo son válidos en el estado del ancla que describen. El modo commit solo es válido sobre `e81d893` o `38cd9ee`. Sobre commits posteriores, V-p y V-d fallarán por diseño, porque el primer padre ya no es el ancla y el diff tiene más rutas; en particular, sobre el commit que añade esta subcarpeta. Esto describe el comportamiento previsto por el código (`verificar-d093.mjs:103–121`), no una ejecución realizada.

## 7. Incidencia del versionado de D-093
6. Líneas fusionadas. Ocurrió el 2026-10-09, durante los pasos 1 y 2 del versionado de D-093. Según la declaración del titular, se fusionaron dos líneas de comando, un `echo` y un `type`. En los bytes se observa:
   - `1-puerta.txt` y `2-check-attr.txt` no contienen línea `CODIGO=`.
   - `1-puerta.txttype` contiene una sola línea: `CODIGO=0  C:\Users\javiv\fase7-materiales\d093\salidas\1-puerta.txt`.
   - `2-check-attr.txttype` contiene la línea análoga con `2-check-attr.txt`.

   Ese contenido es compatible con que la redirección del `echo` tomara como destino la ruta del fichero de salida seguida de `type`, y escribiera como texto la ruta restante. Es una reconstrucción a partir de los bytes, no una observación del comando. Los ficheros se crearon en `fase7-materiales\d093\salidas\`, fuera del repositorio, y la incidencia no afectó a contenido versionado. Los dos `.txttype` se versionan con su nombre y sus bytes originales porque contienen los únicos códigos de salida capturados de los pasos 1 y 2.
