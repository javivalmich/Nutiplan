# Evidencia de la generación de Fase 7 (semillas 2001–2010)

Acta factual. Fecha: 2026-10-09. Ancla de partida: `765b90a265ade50ac07e99fab82012d565611e98` (`main`).
Generación autorizada por D-089 (`DECISIONS.md:3693` en `765b90a`).
Este documento registra hechos y su evidencia. No contiene decisiones: las decisiones sobre estos hechos se asientan en `DECISIONS.md`.

## 1. Contenido

| Archivo | SHA-256 | Función |
|---|---|---|
| `.gitattributes` | — | `* -text`: los bytes se versionan sin conversión de fin de línea |
| `manifiesto-generacion.json` | `51e6cbf7c5305447f1ed6e46ca094cbe442740965b3abd8882894bdefe240a98` | Manifiesto de la generación original |
| `cotejo-regeneracion.mjs` | `09c410ad22849e9c8ef3e790b6426e46469546dd72679a2a8510610aa1ac0e50` | Cotejo de la regeneración frente al manifiesto original |
| `diff-legacy.mjs` | `1e3849383ace557a8c3c05f229ba7e2fab3f3f1216957678de1004561852419a` | Diagnóstico estructural de las diferencias de legacy |
| `verificar-copia.mjs` | `3c0f9635ac462c3e3f1dcb7c4c724bcce5b955ab3db7c2aac4d70b7f57322686` | Verificación de la copia de custodia |
| `salida-*.txt` | — (el blob versionado es la referencia) | Salida de cada guion, con su código de salida |

Los planes generados no se incluyen en esta carpeta.

## 2. Generación original

- Ubicación, fuera del repositorio: `C:\Users\javiv\fase7-materiales\generacion-2001-2010` (`manifiesto-generacion.json` + `planes\`).
- El manifiesto declara `generadoEn = 2026-10-06T12:22:58.901Z`, `codigo.head = 765b90a265ade50ac07e99fab82012d565611e98` y `codigo.arbolLimpio = true`.
- `registroSemillas.ruta = docs/evidence/fase7-semillas/registro-semillas.json`, `sha256 = cee27373cfaacc4658bf27241c6d82b1c36d6e10220ce2a315d01db363bc002b`, `ancla = 289d90d833bb4219707fbb3b18d31fdba0e4ebca`. El 2026-10-09, `certutil` sobre el registro versionado dio el mismo hash.
- 40 planes: `P{1,2}-{2001…2010}-{engine2,legacy}.json`. El nombre de cada archivo identifica el motor.

## 3. Regeneración en clon limpio (2026-10-09)

```
cd C:\Users\javiv\fase7-materiales
git clone https://github.com/javivalmich/Nutiplan.git clon-765b90a
cd clon-765b90a
git checkout --detach 765b90a
npm ci
node scripts/fase7/generarCasos.mjs --registro docs/evidence/fase7-semillas/registro-semillas.json --salida C:\Users\javiv\fase7-materiales\regeneracion-765b90a --confirmo-generacion
```

- `git log -1` → `765b90a…`. `git status` limpio tras `npm ci` y tras la generación. Node v24.14.1.
- La carpeta de salida no existía antes de la ejecución.
- Salida del generador: `generarCasos: 20 casos, 40 planes en C:\Users\javiv\fase7-materiales\regeneracion-765b90a (HEAD 765b90a265ade50ac07e99fab82012d565611e98).`
- La salida regenerada se conserva fuera del repositorio.

## 4. Cotejo — `salida-cotejo-regeneracion.txt` (código de salida 1)

Criterio fijado antes de la ejecución (F-EG.2, ratificado por el titular antes de lanzar la regeneración): los `sha256Plan` de los 40 planes regenerados coinciden con los del manifiesto original, y el manifiesto regenerado declara el mismo hash de registro.

- (0) Procedencia, en ambos manifiestos: hash de registro, `head` y `arbolLimpio` coinciden.
- (iii) 40 archivos con los mismos nombres en disco y en el manifiesto.
- (ii) Original conservado frente a su manifiesto: 40/40.
- (i) Regenerado frente al manifiesto original: **20/40**. Los 20 planes `engine2` coinciden; los 20 `legacy` difieren.
- Coherencia interna del regenerado: 40/40.
- `sha256Vista` original frente a regenerado (dato secundario, no es criterio): 40/40.

**Veredicto: NO REPRODUCE. El criterio de igualdad byte a byte no se satisface.**

## 5. Diagnóstico — `salida-diff-legacy.txt` (código de salida 0)

- Comparación estructural, por unión de claves, de los 20 pares de planes legacy (original frente a regenerado). Una sola ruta difiere: `$.days[*].id`, con 140 ocurrencias (20 planes × 7 días). Ningún par difiere solo en bytes.
- En cada plan, el sufijo numérico del `id` es el mismo en los 7 días. En el ejemplo `P1-2001-legacy`, ese sufijo es `1791289377658` (2026-10-06T12:22:57.658Z, 1,243 s antes de `generadoEn`) en el original y `1791529860587` (2026-10-09T07:11:00.587Z) en el regenerado. Conversión: `new Date(n).toISOString()`.
- Origen en el código, localizado con `git grep` en `765b90a`, perímetro `src/engine` y `scripts/fase7`, términos `Date.now`, `planSeed` y `day-`:
  - `src/engine/buildPlan.js:2267`: `const planSeed = Date.now();`
  - `src/engine/buildPlan.js:2319` y `:2508`: `id:"day-"+_dayIdx+"-"+planSeed`
  - `src/engine/buildPlan.js:2264`: comentario que declara el no determinismo de `planSeed` como conocido.

## 6. Custodia — `salida-verificar-copia.txt` (código de salida 0)

- 2026-10-09, 09:21: `robocopy` de `generacion-2001-2010` a `E:\fase7-custodia\generacion-2001-2010`, en un disco externo. 41 archivos y 2 directorios copiados, 0 errores.
- Manifiesto de la copia idéntico al original (`51e6cbf7…240a98`). `sha256Plan` 40/40 contra el manifiesto original. Raíz exacta: `manifiesto-generacion.json` + `planes`.

## 7. Incidencia del comando partido

Según informó el titular, en la sesión del 2026-10-06 un primer intento de lanzar el generador se pegó partido y abortó sin escribir. Pruebas de que la salida conservada corresponde a una ejecución completa y coherente:

- el manifiesto declara `head = 765b90a…` y `arbolLimpio = true` (§2);
- los 40 planes conservados coinciden con su manifiesto en nombre y hash (§4, cotejos (ii) y (iii));
- el generador escribe con `flag: 'wx'` (`scripts/fase7/generarCasos.mjs:145` y `:173` en `765b90a`), que falla si el archivo ya existe.

Alcance: estas pruebas acreditan la integridad y la completitud de la salida conservada. No acreditan qué hizo el intento abortado más allá de que no dejó archivos que entren en conflicto con ella.

## 8. Límite `freeFormPool: []`

- El generador pasa a legacy `freeFormPool: []` (`scripts/fase7/casos.js:40` en `765b90a`), valor fijado por `scripts/fase7/casos.test.js:43` y registrado en el manifiesto (`opcionesLegacy`).
- Límite: el legacy comparado se ejecuta sin un conjunto de platos de forma libre. Esta acta no examina el efecto de ese valor sobre la selección de legacy ni su diferencia con la configuración de producción.

## 9. Hechos relevantes para el cegado

- El repositorio `javivalmich/Nutiplan` es público (comprobado por el titular el 2026-10-09).
- El manifiesto contiene metadatos de la generación, las entradas de cada motor (perfil, opciones y semilla) y los hashes de cada plan y de su vista. No contiene el contenido de los planes. Comprobado por inspección de `casos[0]` y por el inventario de todas las rutas hoja del manifiesto.
- Con el repositorio en `765b90a` y el registro versionado, el generador reproduce los planes salvo `$.days[*].id` (§4, §5). Por tanto, los planes se pueden reconstruir a partir del repositorio público.
