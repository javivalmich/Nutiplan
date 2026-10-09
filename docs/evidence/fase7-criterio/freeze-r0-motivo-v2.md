## Freeze R-0 · Motivo de la migración (versión 2)

**R-0.1 Objeto.** Localizar, dentro del perímetro, pasajes que enuncien el motivo, la finalidad o la justificación de sustituir el motor legacy por engine2. Quedan fuera:
* valorar el motivo;
* elegir entre motivos;
* inferir la intención a partir de pasajes que no la enuncian.

El resumen «strangler-fig» del contexto del proyecto es `[H]`: sirve para orientar el conjunto de términos, no como evidencia.

**R-0.2 Ancla y perímetro** *(enmendado)*.
* Ancla: `ff07799`.
* Raíces: `DECISIONS.md`, `CLAUDE.md` y `docs/spec/`.
* La existencia de cada raíz en el árbol de `ff07799` se comprueba por separado, una por una, con `git cat-file -e`. Si una raíz falta, se informa como NO LOCALIZADO, no se sustituye por otra y la búsqueda sigue sobre las demás.
* Los ficheros de las raíces que existen se enumeran con `git ls-tree` en esa ancla.
* Se lee la copia de trabajo. Equivale al blob solo porque la puerta exige árbol limpio en `ff07799`, y así se declara.

**R-0.3 Conjunto de términos (cerrado, sin ampliación durante la ejecución)** *(enmendado)*. La búsqueda no distingue mayúsculas. Solo se contemplan las variantes acentuadas que aparecen expresamente en estas expresiones regulares congeladas. Ninguna otra variante entra, ni se añade nada durante la ejecución.
* **M (acción de migrar):** `migra`, `sustitu`, `reemplaz`, `strangler`, `replac`, `rewrit`, `deprecat`, `retir`
* **E (motores):** `engine2`, `buildplan`, `legacy`, `materializeplan`, `motor nuevo`, `nuevo motor`
* **J (motivo):** `motiv`, `justific`, `objetivo`, `prop[oó]sito`, `finalidad`, `para que`, `por qu[eé]`, `porque`

**R-0.4 Regla de coincidencia.** Una línea es coincidencia si:
* contiene algún término de M, o
* contiene a la vez un término de E y uno de J.

Límite declarado: se busca línea a línea, así que un motivo enunciado en varias líneas sin esas coincidencias se escapa. Un resultado negativo vale solo dentro de este límite.

**R-0.5 Clasificación.** Para clasificar se lee el contexto de ±3 líneas alrededor de cada coincidencia. Esas líneas de contexto no cuentan como coincidencias nuevas.

| Clase | Definición |
|---|---|
| **L1 · motivo enunciado** | El pasaje afirma la razón, finalidad o justificación de la migración o de sustituir legacy por engine2. |
| **L2 · candidata** | El pasaje relaciona la migración con un rasgo, como un defecto de legacy o una ventaja de engine2, sin presentarlo como razón. |
| **L3 · mención** | Todo lo demás. |

* Varias L2 no se suman para formar una L1.
* Yo propongo la clase citando el texto literal. Tú ratificas una por una las L1 y L2; las L3, en bloque.

**R-0.6 Lectura de los resultados.**
* **Ninguna L1:** el motivo no está localizado en el perímetro declarado, con estos términos y esta regla. Nunca se afirma «no existe». Se abre la vía (ii), y la declaración del titular lo hace constar.
* **Solo L2:** queda indeterminado. Tú decides si alguna L2 basta o se va a (ii). No se eleva ninguna automáticamente.
* **Varias L1 con motivos distintos:** se reportan todas. No elijo entre ellas; decide el asiento.

**R-0.7 Paradas** *(enmendado en HS-1)*.
* **HS-0:** la puerta falla, porque HEAD ≠ `ff07799` o el árbol no está limpio.
* **HS-1:** cualquier error al leer un fichero del perímetro detiene la Fase 2 en ese punto. La salida identifica la ruta y el mensaje de error, no imprime el TOTAL y no presenta como resultado ninguna coincidencia parcial. La búsqueda no se da por completa.
* **HS-2:** más de 200 coincidencias. Se para antes de leerlas y solo se informa el recuento por fichero, para revisar el conjunto de términos.
* **HS-3:** un pasaje solo puede clasificarse con contexto mayor de ±3 líneas o de fuera del perímetro. Queda «no clasificado» y se para para que decidas. No se amplía nada.

**R-0.8 Canal.** Ejecutas tú en tu terminal y pegas la salida literal. No pasa por Code.

**R-0.9 Evidencia: (a).** Comandos, salidas literales y clasificación con su ratificación se versionan en `docs/evidence/fase7-criterio/`, en el PR del asiento del criterio. Se distinguen tres cosas:
* el resultado literal de la búsqueda;
* la clasificación y su ratificación;
* las limitaciones del método y, si procede, la conclusión de que el motivo no quedó localizado, con su alcance.

No incluye vistas de evaluación ni el contenido de ninguna clave.

**R-0.10 Comandos de ejecución** *(enmendado en Fase 1 y Fase 2)*.

Fase 0, en CMD o en PowerShell:
```
git log -1 --format=%H
git status --porcelain
```
Esperado: `ff0779974492f68ee704a91f73393fbb8b0b08de` y ninguna salida en el segundo comando.

Fase 1, en PowerShell. Primero la existencia de cada raíz y después la enumeración:
```
foreach ($raiz in 'DECISIONS.md','CLAUDE.md','docs/spec') { git cat-file -e "ff07799:$raiz" 2>$null; if ($LASTEXITCODE -eq 0) { "EXISTE: $raiz" } else { "NO LOCALIZADO: $raiz" } }
git ls-tree -r --name-only ff07799 -- DECISIONS.md CLAUDE.md docs/spec
```

Fase 2, en PowerShell. Se detiene ante el primer error de lectura. Los nombres de variable no coinciden entre sí aunque se ignoren las mayúsculas. `@(...)` evita que un fichero de una sola línea se indexe por caracteres.
```
$rutas = git ls-tree -r --name-only ff07799 -- DECISIONS.md CLAUDE.md docs/spec
$pM = 'migra|sustitu|reemplaz|strangler|replac|rewrit|deprecat|retir'
$pE = 'engine2|buildplan|legacy|materializeplan|motor nuevo|nuevo motor'
$pJ = 'motiv|justific|objetivo|prop[oó]sito|finalidad|para que|por qu[eé]|porque'
$salida = @(); $hs1 = $null
foreach ($ruta in $rutas) { try { $lineasRuta = @(Get-Content $ruta -Encoding UTF8 -ErrorAction Stop) } catch { $hs1 = "HS-1: error de lectura en ${ruta}: $($_.Exception.Message)"; break }; for ($i = 0; $i -lt $lineasRuta.Count; $i++) { $linea = $lineasRuta[$i]; if ($linea -match $pM -or ($linea -match $pE -and $linea -match $pJ)) { $salida += '{0}:{1}: {2}' -f $ruta, ($i + 1), $linea } } }
if ($hs1) { $hs1 } else { "TOTAL: $($salida.Count)"; if ($salida.Count -le 200) { $salida } else { $salida | ForEach-Object { ($_ -split ':')[0] } | Group-Object | Select-Object Name, Count } }
```

Fase 3: el comando de contexto de ±3 líneas lo genero con la salida de la Fase 2. Solo imprime líneas ya localizadas; no añade términos ni rutas.
