# Ejecución del modo pares de la primera Fase 7 — 2026-10-09

Acta factual. Describe y no decide. Registra la única ejecución de `scripts/fase7/pares-run.mjs` autorizada por D-094 (`DECISIONS.md:3864–4002` en `660eb6b`) y la custodia de su resultado, conforme a F-094.5 (`DECISIONS.md:3927–3945`). No contiene la vista ni la clave.

## 1. Ancla y código
- A11: `660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4`, padres `38cd9eea1ef50cacc57aa176b8fc3fe53b7a3b9d` y `57b86b7892fcd695da0c05bb10dae72eea3ac415`, asunto «Merge D-094 autorizacion modo pares» (`consola-ejecucion-d094.txt:58`).
- `HEAD:scripts/fase7/pares-run.mjs` = `df12fa7e98287510612034019dca4f08024469d2` (`consola-ejecucion-d094.txt:81`).
- `HEAD:scripts/fase7/pares.js` = `85f636c37e671d3d6af8e4da66ce1058c340593d` (`consola-ejecucion-d094.txt:84`).

## 2. Ficheros

| Fichero | Contenido | sha256 |
|---|---|---|
| `consola-ejecucion-d094.txt` | Contenido de la ventana de CMD en que se hizo la ejecución, guardado por el titular (sección 3.1) | `384101ccff3c10ca59478839209917164f1f3917aac40582dd4f0f3813ce218b` |
| `stdout.txt` | Salida estándar del paso 9 | `078e43b64dbd1836b26ca9f3d4e5bf928da85a32833bd66ba5471c917adbaf2f` |
| `stderr.txt` | Salida de error del paso 9 (0 bytes) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `transcripcion-preparacion-d094.txt` | Transcripción de la preparación previa a la secuencia, con una omisión (sección 7) | `a5a6a027285595f9031336f04c7f3c5aa72062de239e464f7103079c9355a029` |
| `.gitattributes` | `* -text` | `705fd4d6451a31d36b3df7de96f83f30ac976c9b4a6d1e51671d8e2f33e2d0da` |

Formatos:
- `consola-ejecucion-d094.txt`: UTF-8 sin BOM, 264 líneas, todas terminadas en CRLF, sin salto final; termina en el indicador `C:\Users\javiv\app-comida>`. El sha256 coincide con el que el titular calculó con `certutil` en su terminal.
- `stdout.txt`: UTF-8 sin BOM, 3 líneas terminadas en LF.
- `stderr.txt`: vacío.
- `transcripcion-preparacion-d094.txt`: UTF-8 sin BOM, fin de línea LF, con salto final.

Los sha256 de `stdout.txt` y `stderr.txt` se calcularon sobre las copias contenidas en `paquete-evidencia-d094.zip` (sha256 `55fec010b61b1a4a5bde221d8aa05e8a0dc47d11f61268adde1f041663abd0ee`, que coincide con el que el titular calculó con `certutil`).

No se versionan:
- `vista-pares.json` ni `clave-pares.json` (F-094.5). Sus sha256 constan en la sección 3.4.
- `lectura-d094-660eb6b.txt`, sha256 `1b77fcc90da4effb14928f414fd9e20040267fa95b8d9f57fce10675a1649ce5`: salida de `git --no-pager diff 38cd9ee 660eb6b -- DECISIONS.md`, reproducible desde el repositorio.

## 3. Categoría (i). Observado y registrado

### 3.1 Fuente
`consola-ejecucion-d094.txt` contiene, en este orden:
- Líneas 1–52: preparación anterior a la secuencia (cabecera de la ventana; `cd /d C:\Users\javiv\app-comida`; un `type` de `6b-rama.txt` con ruta equivocada, que responde «El sistema no puede encontrar el archivo especificado.»; la búsqueda con `dir /s /b`; y el `type` con la ruta correcta, `d094\salidas\6b-rama.txt`, que muestra el sha del segundo padre, `57b86b7892fcd695da0c05bb10dae72eea3ac415`, y `CODIGO=0`).
- Líneas 54–149: pasos 1 a 11 de F-094.8.
- Líneas 151–237: custodia (F-094.4).
- Líneas 239–263: comprobaciones posteriores (sección 3.5).

Las 14 líneas de comando de los pasos 1 a 11 coinciden carácter a carácter con el texto de D-094 en `DECISIONS.md` de `660eb6b` y aparecen consecutivas, sin ningún otro comando entre ellas:

| Paso | `DECISIONS.md` | Consola | Resultado |
|---|---|---|---|
| 1 | `:3963` | `:54` | `main` |
| 2 | `:3964` | `:57` | `660eb6b5… 38cd9eea… 57b86b78… Merge D-094 autorizacion modo pares` (línea 58) |
| 3 | `:3965` | `:60` | Sin salida |
| 4 | `:3966` | `:62` | `DECISIONS.md` y 15 rutas bajo `docs/evidence/fase7-criterio/comprobacion-d093/` (líneas 63–78) |
| 5 | `:3967` | `:80` | `df12fa7e98287510612034019dca4f08024469d2` |
| 6 | `:3968` | `:83` | `85f636c37e671d3d6af8e4da66ce1058c340593d` |
| 7 | `:3970–3972` | `:86`, `:97`, `:108` | Cada directorio: «0 archivos», solo `.` y `..` |
| 8 | `:3975` | `:119` | `v24.14.1` |
| 9 | `:3977` | `:122` | Sin salida en la consola (redirigida) |
| 10 | `:3978` | `:124` | `0` |
| 11 | `:3982–3983` | `:127`, `:139` | `vista-pares.json`, 53.489 bytes; `clave-pares.json`, 5.696 bytes; los dos con hora 18:32 |

El cotejo se hizo comparando los bytes de las líneas de la consola con el texto de D-094. Procedencia: el titular copió los comandos de los mensajes de Claude en la conversación de la sesión, que los había transcrito del texto de D-094; no los copió directamente de `DECISIONS.md`.

### 3.2 Comprobación de F-094.1
- (a) Rama `main` (paso 1).
- (b) y (c) Dos padres; el primero, `38cd9ee…`; el segundo, `57b86b7892fcd695da0c05bb10dae72eea3ac415`, igual al sha registrado durante el versionado de D-094 (`docs/evidence/fase7-criterio/comprobacion-d094/salidas/6-rama.txt`, `6b-rama.txt` y `9-main.txt`); asunto literal (paso 2).
- (d) El diff lista solo `DECISIONS.md` y rutas bajo `comprobacion-d093/` (paso 4).
- (e) Árbol limpio (paso 3).
- (f) y (g) Blobs del código (pasos 5 y 6).

### 3.3 Ejecución
- Código de salida del paso 9, capturado en el paso 10: `0`.
- `stdout.txt` contiene tres líneas: «pares-run: 20 pares escritos (seed 2457331441).» y las rutas de la vista y de la clave (`consola-ejecucion-d094.txt:259–261`). 2457331441 = `parseInt('9277e6f1', 16)`, la semilla de D-091 citada en el Contexto de D-094.
- `stderr.txt` tiene 0 bytes (`consola-ejecucion-d094.txt:253`, `:263`).
- Solo el paso 9 tiene código de salida explícito. Los pasos 1 a 8 y 11 quedan acreditados por su salida: F-094.8 no prevé capturar su código y añadirlo habría intercalado comandos.
- No se produjo ninguna de las paradas de F-094.6. La única ejecución autorizada por D-094 se ha consumido.

### 3.4 Custodia (F-094.4)

| Fichero | H0 (original) | H1 (copia en `E:`) | H2 (original) |
|---|---|---|---|
| `vista-pares.json` | `4242f89de6a44a4c20584b3166b0a2eeae57da5e7a0341d43281a0cc0500ed59` | igual a H0 | igual a H0 |
| `clave-pares.json` | `97cf01877e8d6587f17e2a5375095f6652a18b16de0b193a9bb54ce0631336b6` | igual a H0 | igual a H0 |

- H0: `consola-ejecucion-d094.txt:151–165`.
- Destinos `E:\fase7-custodia\pares-evaluador\` y `E:\fase7-custodia\pares-clave\` sin ficheros antes de copiar: `:167–193` (volumen SAMSUNG, serie `50CA-9E30`).
- Copia con `copy /b /-y`, un comando por fichero; cada uno responde «1 archivo(s) copiado(s).» sin pregunta de confirmación: `:195–205`.
- H1: `:207–221`. H2: `:223–237`.
- Todos los comandos de la custodia tienen su código de salida capturado inmediatamente después; todos son `0`.
- H1 = H0 y H2 = H0 para la vista y para la clave: la custodia es válida conforme a F-094.4(d). No hubo repetición (e) ni parada por discrepancia (f).

### 3.5 Comprobaciones posteriores
`consola-ejecucion-d094.txt:239–263`, fuera de F-094.8 y de F-094.4:
- `git --no-pager grep` de las escrituras a consola en `pares-run.mjs` y `pares.js` en `660eb6b`: cuatro coincidencias, `pares-run.mjs:31` (`console.error`) y `:134–136` (`console.log`).
- `dir /a` de `pares-ejecucion` y `type` de `stdout.txt` y `stderr.txt`.

Ni `stdout.txt` ni `stderr.txt` contienen la asignación A/B. No se abrieron ni la vista ni la clave.

## 4. Categoría (ii). Limitación conocida por inspección del código
En la sesión del freeze: las escrituras de `pares-run.mjs:132–133` no están protegidas frente a una salida parcial.

## 5. Categoría (iii). Declarado y no verificado de forma independiente
- Que la parada por hash de plan distinto no tiene test.
- Que `309fdf3` lleva un `Co-Authored-By`.
- Que Code citó mal las líneas en su primer informe.

## 6. Constancias exigidas por F-094.5
- Que no haya test de la parada por hash de plan no acredita que el control funcione ni que falle.
- La condición de D-090.6 es procedimental y no constituye una demostración técnica del cegado.

## 7. Preparación previa a la secuencia
Esta sección no pertenece a ninguna de las categorías (i) a (iii).

### 7.1 Fuente
`transcripcion-preparacion-d094.txt` es una transcripción hecha por Claude de los fragmentos que el titular pegó en la conversación de la sesión entre las 18:20 y las 18:27 (hora de Madrid). No es una captura de consola: la ventana en que se ejecutaron esos comandos se cerró sin guardar su contenido. Limitaciones:
- Son fragmentos. No acreditan que no se ejecutaran otros comandos entre ellos.
- Las cabeceras `===` son de Claude e indican la hora del mensaje, no la del comando.
- El espaciado puede no ser el original de la consola. Por ejemplo, `git ls-remote` separa el sha y la referencia con un tabulador, y la transcripción lleva espacios.
- El fragmento F empieza con el mismo bloque que el fragmento E, con los mismos bytes libres. Se interpreta como un solapamiento al copiar, no como una segunda ejecución; esto no está acreditado.

### 7.2 Contenido
- A: `git log -1` y `git status --short` en frío (HEAD `660eb6b`, árbol limpio); lectura de D-094 a `lectura-d094-660eb6b.txt`, con `CODIGO=0`; `git ls-remote origin refs/heads/main` = `660eb6b5de6e3a04e369ea65ac0ec149a04ce3b4`.
- B: `lectura-d094-660eb6b.txt`, 13.981 bytes.
- C: no existe ningún `pares-*` en `fase7-materiales`; `dir /a E:\fase7-custodia` responde «El sistema no puede encontrar la ruta especificada.».
- D: `dir E:\` (volumen SAMSUNG, serie `50CA-9E30`, con `fase7-custodia` creada el 09/10/2026 a las 09:21) y `wmic logicaldisk` (`C:` y `E:`).
- E: `dir /a E:\fase7-custodia` lista `generacion-2001-2010`.
- F: creación de los cinco directorios (`pares-evaluador`, `pares-clave` y `pares-ejecucion` en `fase7-materiales`; `pares-evaluador` y `pares-clave` en `E:\fase7-custodia`), sin salida, y comprobación de que los dos de `E:` están vacíos.

### 7.3 Omisión
En el fragmento D se omitieron 9 de las 10 líneas del listado de `dir E:\`, por contener datos personales ajenos a la evaluación (sección 8). Se conservan las líneas de volumen, número de serie y directorio, la línea de `fase7-custodia` y las dos de totales. Las líneas omitidas están sustituidas por dos marcas que lo indican.

### 7.4 Incidencia 8. Fallo transitorio de `E:`
Ocurrió el 2026-10-09, durante la preparación. En el fragmento C, `dir /a E:\fase7-custodia` respondió que no encontraba la ruta. En los fragmentos D y E, minutos después, el volumen `E:` y la carpeta `E:\fase7-custodia` existen y la carpeta tiene fecha de creación 09/10/2026 09:21, anterior al fallo. La causa no está determinada; lo observado es compatible con que el volumen no estuviera disponible en ese momento. La incidencia se produjo antes de la secuencia y no afectó a la ejecución ni a la custodia.

## 8. Decisiones de forma
- La comprobación posterior de D-094 se versiona en este PR, en carpeta propia (`docs/evidence/fase7-criterio/comprobacion-d094/`), y la preparación entra en este acta en sección propia: decisiones del titular.
- La ruta concreta de esa carpeta, los ficheros que no se versionan en ella y la omisión de la sección 7.3: decisiones tomadas por Claude por delegación expresa del titular.
