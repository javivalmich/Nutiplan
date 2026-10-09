# Comprobación posterior del versionado de la evidencia de pares — 2026-10-09

Comprobación de solo lectura. Describe y no decide. Registra la verificación del versionado de la evidencia de la ejecución del modo pares (D-094, F-094.5): el commit `b5ad383` en la rama `docs/evidencia-pares` y su merge `94e6115` en `main`. Se versiona en un PR documental propio, en esta subcarpeta de `docs/evidence/fase7-pares/`.

## 1. Objeto
Comprobar, partiendo del ancla `660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4`:
- En los tres modos: que la carpeta de contenido preparada fuera del repositorio tiene exactamente las 25 rutas previstas, cada una con el sha256 fijado en el script (`verificar-evidencia.mjs:22–48`).
- Antes de crear la rama: que el repositorio está en el ancla, en `main`, con el árbol limpio, con el `origin` previsto, con `origin/main` en el ancla, sin `docs/evidence/fase7-pares/` ni `docs/evidence/fase7-criterio/comprobacion-d094/` y sin la rama `docs/evidencia-pares`.
- Antes del commit: que la copia de trabajo generaría los blobs previstos, sin conversión de fin de línea.
- En el commit de la rama y en el merge: que las dos carpetas contienen exactamente las 25 rutas previstas, cada una con el sha256 fijado, y que `git diff --name-only` desde el ancla devuelve exactamente esas 25 rutas. En el merge, además, que el segundo padre es el sha de la rama indicado.

## 2. Ficheros

| Fichero | Contenido | sha256 |
|---|---|---|
| `verificar-evidencia.mjs` | Script de verificación con tres modos: `--puerta`, `--pre` y commit. Solo lee: no escribe ni modifica nada | `1c6b58c599f622525e5bfbd144e3183f88810eeef4a00b3e0802aca2be342072` |
| `salidas/1-puerta.txt` | Salida del script en modo `--puerta` y su código de salida | `8bcabccfd5033ae60c9efac8aa4403f272632660eee5d83c5f8de288ab904b19` |
| `salidas/2-checkout.txt` | Creación de la rama y su código de salida | `fae68c3cec7d3d57bd296a035e647e7236a9a0328a3c9724ef0c5997b90d8ee0` |
| `salidas/3-aplicar.txt` | Salida de `aplicar-evidencia.mjs` y su código de salida | `4f963fa3a8e086734f6b9d247a8bdfd9dddc7d97b5d8c0942d474139e539fefd` |
| `salidas/4-pre.txt` | Salida del script en modo `--pre` y su código de salida | `de5f0503d68baae3b4b7f6734ee9e37c9c76d73dd4b63d09751b7ef73ca2d151` |
| `salidas/5-add.txt` | Código de salida de `git add` | `6057f53f80391a7bda9a92b40ce0ac688727b12650dd4ecee8531e47924ac6ac` |
| `salidas/5-commit.txt` | Salida del commit y su código de salida | `2b3af869d8922d17d0fb5dd985d0929ff7e04ee57b6a55ca0b6e7362af3f8a24` |
| `salidas/6-rama.txt` | Salida del script sobre el commit de la rama y su código de salida | `9fd30b018366c9d1c3d3ac4c1bce368fcb104759b736dba511bb7f1ceea0d34f` |
| `salidas/7-checkout.txt` | Cambio a `main` y su código de salida | `6878c32723d0cc340b614f2e3d2b694ceb82820faa4cfd98f1d6d75d704d46ba` |
| `salidas/8-merge.txt` | Salida del merge y su código de salida | `1c93aedef865b9034acead51d963df53250784a55ca192b5eb47d9bbc0d38f25` |
| `salidas/9-main.txt` | Salida del script sobre el merge en `main`, con el sha de la rama indicado, y su código de salida | `fc6f91414828514090f476b9cfeb21542eac4914484350c587793766958199ea` |
| `salidas/10-push.txt` | Salida del push y su código de salida | `23694c4a4e7e275a88836391dd4ad0eccf0f9a4d97286af20ded235d421bc2ba` |
| `salidas/11-branch.txt` | Borrado de la rama y su código de salida | `a4c4255b3f03eec1c4db3f3be3b0ffe31fa31b05ec3c1bac99ef2ffca6016929` |
| `salidas/12-log.txt` | Último commit de `main` tras el push y su código de salida | `c6656ce397b633c62c112cbcea5d0db797bc3ee0d740c2d6797d9e1fb2c06424` |
| `salidas/12-status.txt` | Estado de `main` frente a `origin/main` tras el push y su código de salida | `325e42434e58a7a254b9a7bcc9c2c3992d92d9346b169f9117bd92d3abe1e49d` |

Todos los ficheros están en UTF-8 sin BOM, con fin de línea LF, salvo la línea `CODIGO=0` (seguida de un espacio), que termina en CRLF. Esa línea está en las 14 salidas y es siempre la última; en `5-add.txt` es la única, y por eso ese fichero tiene los mismos bytes que `fase7-criterio/comprobacion-d094/salidas/5-add.txt`. `7-checkout.txt` tiene los mismos bytes que `fase7-criterio/comprobacion-d094/salidas/7b-checkout.txt`, porque ambos registran el mismo mensaje de `git checkout main` y el mismo código. Los sha256 se calcularon sobre las copias que el titular aportó desde `C:\Users\javiv\fase7-materiales\evidencia-pares\`, dentro de `evidencia-pares.zip` (sha256 `1dfd95a6ba4b643235e5faf635e0c83367051b94b97523800d528e26e4df0635`, que coincide con el que el titular calculó con `certutil` en su terminal). El sha256 de `verificar-evidencia.mjs` también coincide con el que el titular calculó con `certutil` sobre el fichero original. Este acta no transcribe los comandos de invocación.

No se versionan:
- `aplicar-evidencia.mjs`, sha256 `0d0a8f65c86736dfebc3d60588b5986ac0b17cefd6b19e269eac05ba799155a2`.
- La carpeta `contenido\`, con las 25 rutas que ya están versionadas en `94e6115`. Sus sha256 coinciden con los fijados en el script (control C-1 en todas las ejecuciones; recalculados también sobre la copia del zip: 25 de 25).

## 3. Controles
Comunes a los tres modos de `verificar-evidencia.mjs`:
- **C-0:** la carpeta de contenido tiene exactamente las 25 rutas previstas (`verificar-evidencia.mjs:96`).
- **C-1:** el sha256 de las 25 rutas coincide con el fijado (`:103`).

Modo `--puerta` (11 controles, `:105–124`):
- **P-1 a P-8:** raíz del repositorio; rama `main`; HEAD igual al ancla; árbol limpio, incluidos los ficheros sin seguimiento; `origin` previsto; cada una de las dos carpetas no existe en el ancla ni en disco (dos controles P-6); `origin/main` igual al ancla; la rama `docs/evidencia-pares` no existe.

Modo `--pre` (32 controles, `:126–147`):
- **P-1:** raíz del repositorio.
- **R-1 y R-2:** rama `docs/evidencia-pares`; HEAD igual al ancla.
- **V-a (25 controles, uno por fichero):** el sha256 en disco coincide con el fijado y `git add` no aplicaría conversión.
- **V-a.3:** el atributo `text` está sin definir (`unset`) en las 25 rutas.
- **V-a.2:** `git status` muestra exactamente las 25 entradas previstas.

Modo commit (32 controles en el commit de la rama; 33 en el merge, `:149–171`):
- **V-p:** el primer padre es el ancla (`:152`).
- **V-r:** en el commit de la rama, la rama activa es `docs/evidencia-pares`; en el merge, la rama activa es `main` y hay dos padres.
- **V-q (solo en el merge):** el segundo padre es igual al sha de la rama indicado en la invocación (`:158`).
- **V-s:** el asunto es el previsto.
- **V-c.0:** las dos carpetas contienen exactamente 25 rutas.
- **V-c (25 controles):** el sha256 de cada blob coincide con el fijado.
- **V-d:** `git diff --name-only` desde el ancla devuelve exactamente las 25 rutas (`:168–169`).

`aplicar-evidencia.mjs` emite 33 controles propios y solo escribe si todos pasan (`aplicar-evidencia.mjs:101`).

## 4. Ejecuciones

| Salida | Modo | Commit verificado | Rama | Fecha (UTC) |
|---|---|---|---|---|
| `1-puerta.txt` | `--puerta` | copia de trabajo, HEAD `660eb6b` | `main` | 2026-10-09T17:03:33.977Z |
| `3-aplicar.txt` | `aplicar-evidencia.mjs` | copia de trabajo, HEAD `660eb6b` | `docs/evidencia-pares` | 2026-10-09T17:03:56.858Z |
| `4-pre.txt` | `--pre` | copia de trabajo, HEAD `660eb6b` | `docs/evidencia-pares` | 2026-10-09T17:04:11.408Z |
| `6-rama.txt` | commit | `b5ad3832b0e3107751f9cfb07916f5739392d17b` (padre `660eb6b`) | `docs/evidencia-pares` | 2026-10-09T17:05:02.634Z |
| `9-main.txt` | commit | `94e61157e2d83f84acd101ac24fea66262637667` (padres `660eb6b`, `b5ad383`) | `main` | 2026-10-09T17:05:55.791Z |

Node v24.14.1 en todas. Los datos de esta tabla son los que los propios scripts escriben en la cabecera de cada salida. En `9-main.txt`, el sha de la rama indicado en la invocación es `b5ad3832b0e3107751f9cfb07916f5739392d17b`.

## 5. Resultado
- En `1-puerta.txt` (11), `4-pre.txt` (32), `6-rama.txt` (32) y `9-main.txt` (33), todos los controles dan PASA, ninguno da FALLA, y la última línea antes del código de salida es «RESULTADO: TODO PASA». En `3-aplicar.txt`, los 33 controles dan PASA, hay 25 líneas ESCRITO y el resultado es «RESULTADO: APLICADO».
- En `6-rama.txt` y `9-main.txt`, los 25 blobs coinciden con los valores fijados, las dos carpetas contienen 25 rutas y el diff desde el ancla devuelve 25 rutas.
- En `9-main.txt`, V-q: segundo padre `b5ad3832b0e3107751f9cfb07916f5739392d17b`, igual al sha de la rama indicado.
- `5-commit.txt`: commit `b5ad383` en `docs/evidencia-pares`, asunto «Evidencia de la ejecucion del modo pares (D-094)», 25 ficheros, 1244 inserciones.
- `8-merge.txt`: estrategia `ort`, 25 ficheros, 1244 inserciones.
- `10-push.txt`: `660eb6b..94e6115  main -> main`.
- `11-branch.txt`: `Deleted branch docs/evidencia-pares (was b5ad383).`
- `12-log.txt`: `94e61157…` con padres `660eb6b5…` y `b5ad3832…` y asunto «Merge evidencia ejecucion modo pares».
- `12-status.txt`: `## main...origin/main`.
- Códigos de salida: `CODIGO=0` en las 14 salidas.
- Orden: la verificación sobre `main` (17:05:55.791 UTC) es posterior a la fecha de autor del merge (2026-10-09 19:05:25 +0200, 17:05:25 UTC, según `git log -1` en frío al inicio de la sesión siguiente). Ningún fichero registra en su contenido la hora del push. Como indicio, no como observación del comando: en `evidencia-pares.zip`, la fecha de modificación de `9-main.txt` es 19:05:58 y la de `10-push.txt`, 19:06:30 (hora local, resolución de 2 segundos).

## 6. Alcance del script
Los modos `--puerta` y `--pre` solo son válidos en el estado del ancla que describen. El modo commit solo es válido sobre `b5ad383` o `94e6115`. Sobre commits posteriores, V-p y V-d fallarán por diseño, porque el primer padre ya no es el ancla y el diff tiene más rutas; en particular, sobre el commit que añade esta subcarpeta. Esto describe el comportamiento previsto por el código (`verificar-evidencia.mjs:152`, `:168–169`), no una ejecución realizada.

## 7. Incidencias
No se registran incidencias en el versionado de la evidencia de pares: los 12 pasos tienen salida, los pasos 5 y 12 en dos ficheros cada uno, y las 14 salidas registran su código de salida.

Nota, sin numeración de incidencia: el resumen de cierre de la sesión de la ejecución, que no está versionado, hablaba de 16 salidas. La carpeta `salidas\` contiene 14 ficheros, que cubren los 12 pasos. La discrepancia se atribuye al resumen; no se ha reconstruido ni añadido ningún fichero.
