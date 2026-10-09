# Comprobación posterior de D-094 — 2026-10-09

Comprobación de solo lectura. Describe y no decide. Registra la verificación del versionado de D-094: el commit `57b86b7` en la rama `docs/d-094-autorizacion-pares` y su merge `660eb6b` en `main`. Se versiona en el PR de evidencia de la ejecución (D-094, F-094.5), en carpeta propia, separada de `docs/evidence/fase7-pares/`.

## 1. Objeto
Comprobar, partiendo del ancla `38cd9eea1ef50cacc57aa176b8fc3fe53b7a3b9d`:
- Antes de crear la rama: que el repositorio está en el ancla, en `main`, con el árbol limpio, con el `origin` previsto, con `origin/main` en el ancla, sin la subcarpeta `docs/evidence/fase7-criterio/comprobacion-d093/` y sin la rama `docs/d-094-autorizacion-pares`; y que `d094-entrada.txt` está bien formada.
- Antes del commit: que la copia de trabajo generaría los blobs previstos.
- En el commit de la rama y en el merge: que `DECISIONS.md` es el blob del ancla seguido de un LF y de `d094-entrada.txt`; que `comprobacion-d093/` contiene exactamente 15 rutas, cada una con el sha256 fijado en el script; que `git diff --name-only` desde el ancla devuelve exactamente 16 rutas; y que los blobs de `scripts/fase7/pares-run.mjs` y `scripts/fase7/pares.js` son los fijados en D-094 (F-094.1(f) y (g)). En el merge, además, que el segundo padre es el sha de la rama indicado.

## 2. Ficheros

| Fichero | Contenido | sha256 |
|---|---|---|
| `verificar-d094.mjs` | Script de verificación con tres modos: `--puerta`, `--pre` y commit. Solo lee: no escribe ni modifica nada | `9931be9c835679dec3dcf4342cfb3e1898010a99c538bcb639556aca94a8032d` |
| `d094-entrada.txt` | Texto de la entrada de D-094 con el que se compara `DECISIONS.md` | `7c123b7253ec5adeb0464a87669bb432c011834cf4e491ac5b14ab8f83d28a4b` |
| `salidas/1-puerta.txt` | Salida del script en modo `--puerta` y su código de salida | `a303ba7e90883930bfb9914190441928b9229c063d3fe2c0d95d5ecd43d719cb` |
| `salidas/2-checkout.txt` | Creación de la rama, su código de salida y nombre de la rama activa | `779b5a6b0f82bb247ca62a21ae06aaa727f7cea70c14352a6f75eff406bb6cac` |
| `salidas/3-aplicar.txt` | Salida de `aplicar-d094.mjs` y su código de salida | `8ef70acfcb4cd5484c9edd005f6b4a9c9cd6d2e5876ed27034a928e75fd0fc17` |
| `salidas/4-pre.txt` | Salida del script en modo `--pre` y su código de salida | `b3415caa591389900cb720b34fede3d4443f575ab7d0768f0d748d301cd7715e` |
| `salidas/5-add.txt` | Código de salida de `git add` | `6057f53f80391a7bda9a92b40ce0ac688727b12650dd4ecee8531e47924ac6ac` |
| `salidas/5-commit.txt` | Salida del commit y su código de salida | `e1587ddfea6960e66b351bec3253763cc4fbfc0ef94ea2dddee8916d2839a351` |
| `salidas/6-rama.txt` | Salida del script sobre el commit de la rama, sin código de salida (sección 7) | `1e7850421465239093252deb3a420067f4587e1163df1c911503a36621cb7722` |
| `salidas/6b-rama.txt` | Repetición de la verificación sobre el commit de la rama y su código de salida (sección 7) | `f59ec0bbf9065d09c99aac50e1e685daa9863b958b27da1383318abdbe9b63ee` |
| `salidas/7-checkout.txt` | Código de salida del paso 6 (sección 7) | `6057f53f80391a7bda9a92b40ce0ac688727b12650dd4ecee8531e47924ac6ac` |
| `salidas/7b-checkout.txt` | Cambio a `main` y su código de salida | `6878c32723d0cc340b614f2e3d2b694ceb82820faa4cfd98f1d6d75d704d46ba` |
| `salidas/8-merge.txt` | Salida del merge y su código de salida | `26a1912a0b0aaf6eb0be446732f0ea1ae3ac479295c3f9e725b2420c8bf19eab` |
| `salidas/9-main.txt` | Salida del script sobre el merge en `main`, con el sha de la rama indicado, y su código de salida | `5882e3dd6bf10e9cd435fb16d00fab8d8078f8ab0049c3d27e17036129a79d72` |
| `salidas/10-push.txt` | Salida del push y su código de salida | `d60f45d58b747e9821815773123c6d587e112882d78af8346a98f6488d0f8bd0` |
| `salidas/11-branch.txt` | Borrado de la rama y su código de salida | `d47475046fa0476b546dd31e7374b3dc557cb266086ef679c61a9165b13f5faf` |
| `salidas/12-log.txt` | Último commit de `main` tras el push | `88cca898aa08713158daa0d515706b70606e203f07d1c0ead730f04cb12a837f` |
| `salidas/12-status.txt` | Estado de `main` frente a `origin/main` tras el push | `5fbcb2990ad25e368c12219bf3ddca36e464d044e7acac16696fa8cd54159185` |

Todos los ficheros están en UTF-8 sin BOM, con fin de línea LF, salvo la línea `CODIGO=0` (seguida de un espacio), que termina en CRLF. Esa línea está en todas las salidas excepto `6-rama.txt`, `12-log.txt` y `12-status.txt`. En `2-checkout.txt` es la segunda de tres líneas; en `5-add.txt` y `7-checkout.txt` es la única, y por eso los dos ficheros tienen los mismos bytes; en las demás es la última. Los sha256 se calcularon sobre las copias que el titular aportó desde `C:\Users\javiv\fase7-materiales\d094\`, dentro de `paquete-evidencia-d094.zip` (sha256 `55fec010b61b1a4a5bde221d8aa05e8a0dc47d11f61268adde1f041663abd0ee`, que coincide con el que el titular calculó con `certutil` en su terminal). Este acta no transcribe los comandos de invocación.

No se versionan:
- `aplicar-d094.mjs`, sha256 `131db0ee70df6eb9821480bc313916e5c366bf408f6df28e8cebea0fd6718f35`.
- `acta-comprobacion-d093.md`, sha256 `06164b8e4cc26c89368837ba64eb40c03b6902a1ae9977dafff4c17ff1c4252b`. Ya está versionado como `comprobacion-d093/README.md` (`6-rama.txt:20`, `6b-rama.txt:20`, `9-main.txt:21`).
- `decisions-38cd9ee.md`, sha256 `a4691660de43a859e9c0dcc2673e610c3bac84cebfb05f01e586961b09b8b72e`. Es el blob de `DECISIONS.md` en el ancla (control A-0).

## 3. Controles
Comunes a los tres modos de `verificar-d094.mjs`:
- **E-0:** el sha256 de `d094-entrada.txt` coincide con el valor fijado en el script.
- **A-0:** el sha256 de `DECISIONS.md` en el ancla es `a4691660de43a859e9c0dcc2673e610c3bac84cebfb05f01e586961b09b8b72e`.

Modo `--puerta` (13 controles):
- **P-1 a P-8:** raíz del repositorio; rama `main`; HEAD igual al ancla; árbol limpio, incluidos los ficheros sin seguimiento; `origin` previsto; la subcarpeta `comprobacion-d093/` no existe en el ancla ni en disco; `origin/main` igual al ancla; la rama `docs/d-094-autorizacion-pares` no existe.
- **E-1 a E-3:** la cabecera `## D-094 ` no aparece en `DECISIONS.md` del ancla; la entrada tiene una sola cabecera de asiento y es la de D-094; ni la entrada ni el blob del ancla contienen CR, y la entrada no tiene BOM y termina en salto de línea.

Modo `--pre` (23 controles):
- **P-1:** raíz del repositorio.
- **R-1 y R-2:** rama `docs/d-094-autorizacion-pares`; HEAD igual al ancla.
- **V-a.1:** el blob que generaría `git add` para `DECISIONS.md` es el esperado.
- **V-a (15 controles, uno por fichero):** el sha256 en disco coincide con el fijado y `git add` no aplicaría conversión.
- **V-a.3:** el atributo `text` está sin definir (`unset`) en las 15 rutas.
- **V-a.2:** `git status` muestra exactamente las 16 entradas previstas.

Modo commit (25 controles en el commit de la rama; 26 en el merge):
- **V-p:** el primer padre es el ancla.
- **V-r:** en el commit de la rama, la rama activa es `docs/d-094-autorizacion-pares`; en el merge, la rama activa es `main` y hay dos padres.
- **V-q (solo en el merge):** el segundo padre es igual al sha de la rama indicado en la invocación.
- **V-s:** el asunto es el previsto.
- **V-b:** el blob de `DECISIONS.md` es igual, byte a byte, al del ancla seguido de un LF y de `d094-entrada.txt`.
- **V-c.0:** `comprobacion-d093/` contiene exactamente 15 rutas.
- **V-c (15 controles):** el sha256 de cada blob coincide con el fijado.
- **V-d:** `git diff --name-only` desde el ancla devuelve exactamente 16 rutas.
- **V-e (2 controles):** los blobs de `scripts/fase7/pares-run.mjs` y `scripts/fase7/pares.js` son `df12fa7e98287510612034019dca4f08024469d2` y `85f636c37e671d3d6af8e4da66ce1058c340593d`.

`aplicar-d094.mjs` emite 25 controles propios y solo escribe si todos pasan (`aplicar-d094.mjs:86`).

## 4. Ejecuciones

| Salida | Modo | Commit verificado | Rama | Fecha (UTC) |
|---|---|---|---|---|
| `1-puerta.txt` | `--puerta` | copia de trabajo, HEAD `38cd9ee` | `main` | 2026-10-09T16:11:16.524Z |
| `3-aplicar.txt` | `aplicar-d094.mjs` | copia de trabajo, HEAD `38cd9ee` | `docs/d-094-autorizacion-pares` | 2026-10-09T16:11:47.603Z |
| `4-pre.txt` | `--pre` | copia de trabajo, HEAD `38cd9ee` | `docs/d-094-autorizacion-pares` | 2026-10-09T16:11:59.492Z |
| `6-rama.txt` | commit | `57b86b7892fcd695da0c05bb10dae72eea3ac415` (padre `38cd9ee`) | `docs/d-094-autorizacion-pares` | 2026-10-09T16:12:39.449Z |
| `6b-rama.txt` | commit | `57b86b7892fcd695da0c05bb10dae72eea3ac415` (padre `38cd9ee`) | `docs/d-094-autorizacion-pares` | 2026-10-09T16:14:37.122Z |
| `9-main.txt` | commit | `660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4` (padres `38cd9ee`, `57b86b7`) | `main` | 2026-10-09T16:15:11.934Z |

Node v24.14.1 en todas. Los datos de esta tabla son los que los propios scripts escriben en la cabecera de cada salida. En `9-main.txt`, el sha de la rama indicado en la invocación es `57b86b7892fcd695da0c05bb10dae72eea3ac415`.

## 5. Resultado
- En `1-puerta.txt`, `4-pre.txt`, `6-rama.txt`, `6b-rama.txt` y `9-main.txt`, todos los controles dan PASA, ninguno da FALLA, y la última línea antes del código de salida, o la última línea del fichero en `6-rama.txt`, es «RESULTADO: TODO PASA». En `3-aplicar.txt`, los 25 controles dan PASA, hay 16 líneas ESCRITO y el resultado es «RESULTADO: APLICADO».
- En `6-rama.txt`, `6b-rama.txt` y `9-main.txt`, el sha256 de `DECISIONS.md` en el commit es `1f6b6f03ed4f335cd3030e3924cf3917ad23b1ad0dd877f384d040c893a291d8`, igual al esperado. Los 15 blobs de `comprobacion-d093/` coinciden con los valores fijados, el diff devuelve 16 rutas y los dos blobs del código coinciden con los de F-094.1(f) y (g).
- En `4-pre.txt`, el blob que generaría `git add` para `DECISIONS.md` es `d007feb44a2cf673dfa0fb57fe7e6c556608624f`.
- En `9-main.txt`, V-q: segundo padre `57b86b7892fcd695da0c05bb10dae72eea3ac415`, igual al sha de la rama indicado.
- `5-commit.txt`: commit `57b86b7` en `docs/d-094-autorizacion-pares`, asunto «D-094 autorizacion de una unica ejecucion del modo pares», 16 ficheros, 535 inserciones.
- `8-merge.txt`: estrategia `ort`, 16 ficheros, 535 inserciones.
- `10-push.txt`: `38cd9ee..660eb6b  main -> main`.
- `11-branch.txt`: `Deleted branch docs/d-094-autorizacion-pares (was 57b86b7).`
- `12-log.txt`: primera línea, `660eb6b5…` con padres `38cd9ee…` y `57b86b7…` y asunto «Merge D-094 autorizacion modo pares»; segunda línea, `660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4`. El fichero no registra qué comando produjo la segunda línea.
- `12-status.txt`: `## main...origin/main`.
- Códigos de salida: `CODIGO=0` en `1-puerta.txt`, `2-checkout.txt`, `3-aplicar.txt`, `4-pre.txt`, `5-add.txt`, `5-commit.txt`, `6b-rama.txt`, `7-checkout.txt`, `7b-checkout.txt`, `8-merge.txt`, `9-main.txt`, `10-push.txt` y `11-branch.txt`. `6-rama.txt`, `12-log.txt` y `12-status.txt` no registran código.
- Orden: la verificación sobre `main` (16:15:11.934 UTC) es posterior a la fecha de autor del merge (2026-10-09 18:15:00 +0200, 16:15:00 UTC, según `git log -1` en frío en la sesión de la ejecución). Ningún fichero registra la hora del push; que fuera posterior a esa verificación solo lo indica la numeración de los ficheros.

## 6. Alcance del script
Los modos `--puerta` y `--pre` solo son válidos en el estado del ancla que describen. El modo commit solo es válido sobre `57b86b7` o `660eb6b`. Sobre commits posteriores, V-p y V-d fallarán por diseño, porque el primer padre ya no es el ancla y el diff tiene más rutas; en particular, sobre el commit que añade esta subcarpeta. Esto describe el comportamiento previsto por el código (`verificar-d094.mjs:141`, `:159–160`), no una ejecución realizada.

## 7. Incidencia del versionado de D-094
7. Código de salida en fichero equivocado. Ocurrió el 2026-10-09, en el paso 6 del versionado de D-094. Según la declaración del titular, el código de salida del paso 6 se escribió en `7-checkout.txt` en vez de en `6-rama.txt`. En los bytes se observa:
   - `6-rama.txt` no contiene línea `CODIGO=` y termina en «RESULTADO: TODO PASA» seguido de LF.
   - `7-checkout.txt` contiene una sola línea, `CODIGO=0` seguida de un espacio y de CRLF, y no contiene salida de `git checkout`.
   - `6b-rama.txt` repite la verificación sobre el mismo commit `57b86b7` a las 16:14:37.122Z, con la rama activa `docs/d-094-autorizacion-pares`, y contiene `CODIGO=0`.
   - `7b-checkout.txt` contiene el cambio a `main` y su código.

   Que la rama activa en `6b-rama.txt` sea todavía `docs/d-094-autorizacion-pares` es compatible con que el cambio a `main` no se hubiera hecho antes de las 16:14:37 UTC. Es una reconstrucción a partir de los bytes, no una observación del comando. Los ficheros se crearon en `fase7-materiales\d094\salidas\`, fuera del repositorio, y la incidencia no afectó a contenido versionado. `6-rama.txt` y `7-checkout.txt` se versionan con su nombre y sus bytes originales: el primero contiene la única salida de la verificación inicial de la rama y el segundo, el único código de salida capturado de esa verificación.
