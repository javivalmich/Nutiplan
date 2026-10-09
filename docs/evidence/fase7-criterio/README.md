# R-0 · Motivo de la migración — 2026-10-09

Reconocimiento de solo lectura. Describe y no decide: la disposición sobre su resultado está en D-092.

## 1. Freeze
El titular ratificó la versión 2 del freeze antes de ejecutar. Texto literal: `freeze-r0-motivo-v2.md`. R-0.9 preveía versionar esta evidencia en el PR del asiento del criterio. Por decisión posterior del titular, se versiona en el PR de D-092, en la misma carpeta. El texto del freeze no se modifica.

## 2. Ejecución
- Ancla: `ff0779974492f68ee704a91f73393fbb8b0b08de`, con árbol limpio.
- Canal: terminal del titular, salida pegada literalmente.
- Fecha: 2026-10-09.

| Fichero | Contenido | Origen | sha256 del fichero local |
|---|---|---|---|
| `fase0.txt` | Fase 0 (sha y estado del árbol) | Reejecutada para capturarla, con HEAD sin cambios | `ecf72d84c9b29324f20e21844faf25562ce3b6ccfd85b2dc8a20a0ba868d96e4` |
| `fase1.txt` | Fase 1 (existencia de raíces y enumeración) | Reejecutada para capturarla, con HEAD sin cambios | `8043cd84b8f6d9aa1867732a739a0f910cb599e3daf3e4ec299c34791760c909` |
| `fase2.txt` | Fase 2 (53 coincidencias) | Segunda ejecución de la Fase 2 | `5bb32cd9487888f8a3368db088618773d858770da3617915bd326ab68fe7e714` |
| `fase2-total.txt` | Línea TOTAL de la Fase 2 | Variable de la segunda ejecución de la Fase 2 | `90f12a442e6e1161fe0a6cbb37ea5df5bb4fe0268196cd367ee86968bd0d0216` |
| `fase3.txt` | Fase 3 (contexto de ±3 líneas) | Ejecutada sobre la segunda ejecución de la Fase 2 | `8edcf741b6f59bcd2aae01b14bff5d7f63a726d46a86aaf47f0d9f48fbc24d95` |

Los ficheros están escritos con `Set-Content -Encoding UTF8` de PowerShell 5: UTF-8 con BOM y fin de línea CRLF. Se versionan sin normalizar, con `.gitattributes` `* -text` en esta carpeta.

Los sha256 de la tabla son los de los ficheros locales en `C:\Users\javiv\fase7-materiales\r0-motivo\`, calculados con `Get-FileHash` antes de versionar. Que el contenido de cada blob versionado coincida con ellos se comprueba después del commit y se registra aparte.

La Fase 2 se ejecutó dos veces con el mismo comando de R-0.10 sobre el mismo árbol: la primera junto con las Fases 0 y 1, y la segunda inmediatamente antes de la Fase 3. Ambas informaron TOTAL: 53. Los ficheros de la Fase 2 y de la Fase 3 proceden de la segunda. La salida de la primera no se conservó en fichero, y este acta no afirma que las dos sean idénticas línea a línea.

## 3. Resultado literal
53 coincidencias en 4 ficheros del perímetro: `CLAUDE.md`, `DECISIONS.md`, `docs/spec/plan-observable.md` y `docs/spec/protocolo-evaluacion.md`. No saltó ninguna parada.

## 4. Clasificación
Claude la propuso a partir de la salida literal y el titular la ratificó. Las L2 se ratificaron una a una y las L3 en bloque. El titular no releyó por su cuenta los 53 bloques.
- **L1:** 0.
- **L2:** 2.
  - `CLAUDE.md:6`: relaciona un rasgo de engine2 con la migración sin presentarlo como razón. La lectura L1 se consideró defendible y no se adoptó.
  - `DECISIONS.md:276`: relaciona un defecto concreto de legacy con una solución de engine2; es local.
- **L3:** 51.
  - `CLAUDE.md:12`
  - `DECISIONS.md:305`, `413`, `707`, `804`, `852`, `1016`, `1030`, `1065`, `1275`, `1409`, `1494`, `1570`, `1605`, `1664`, `1855`, `1917`, `1966`, `1974`, `1976`, `2175`, `2177`, `2178`, `2180`, `2209`, `2225`, `2330`, `2342`, `2415`, `2472`, `2503`, `2521`, `2615`, `2959`, `2997`, `3121`, `3164`, `3176`, `3207`, `3350`, `3354`, `3439`, `3613`, `3636`, `3698`, `3723`, `3725`
  - `docs/spec/plan-observable.md:13`, `:36`
  - `docs/spec/protocolo-evaluacion.md:34`, `:45`

## 5. Contaminación declarada
Al leer el contexto quedaron expuestos pasajes que el freeze no permite clasificar:
- `CLAUDE.md:6`, «gana»: es la condición de la migración, no su motivo, y queda fuera del objeto.
- `CLAUDE.md:3`: regla de prevalencia.
- `DECISIONS.md:2333`: tesis de D-048. Es contexto, no coincidencia.

No se clasificaron. Su tratamiento corresponde a actos propios.

## 6. Limitaciones
- La búsqueda es línea a línea: un motivo enunciado en varias líneas sin coincidencias de M, ni de E y J juntas, no se detecta.
- El perímetro y el conjunto de términos están cerrados.
- Se leyó la copia de trabajo, que equivale al blob porque la puerta exige árbol limpio en el ancla.
- Las capturas de las Fases 0 y 1 son reejecuciones posteriores a la ejecución original, con el mismo HEAD.

## 7. Conclusión
Solo hay L2. Dentro del perímetro, los términos y la regla declarados, el motivo queda indeterminado documentalmente. No se afirma que no exista. El titular no elevó ninguna L2 y dispuso la vía (ii): una declaración constitutiva, asentada en D-092.

## 8. Comandos posteriores al freeze
Estos comandos se generaron después de ratificar el freeze, bien como preveía su Fase 3, bien para capturar salidas. No forman parte de las instrucciones congeladas ni enmiendan R-0.10. Se transcriben tal como se ejecutaron en PowerShell, sin los indicadores del prompt.

8.1. Fase 3, con la captura de las salidas de la Fase 2 y de la Fase 3. Se ejecutó en la misma sesión que la segunda ejecución de la Fase 2:
```
New-Item -ItemType Directory -Force C:\Users\javiv\fase7-materiales\r0-motivo | Out-Null
$salida | Set-Content C:\Users\javiv\fase7-materiales\r0-motivo\fase2.txt -Encoding UTF8
$contexto = foreach ($entrada in $salida) { $partes = $entrada -split ':', 3; $rutaC = $partes[0]; $nC = [int]$partes[1]; $lin = @(Get-Content $rutaC -Encoding UTF8 -ErrorAction Stop); "=== ${rutaC}:${nC}"; $desde = [Math]::Max(1, $nC - 3); $hasta = [Math]::Min($lin.Count, $nC + 3); $desde..$hasta | ForEach-Object { $marca = if ($_ -eq $nC) { '>>' } else { '  ' }; '{0} {1}: {2}' -f $marca, $_, $lin[$_ - 1] } }
$contexto | Set-Content C:\Users\javiv\fase7-materiales\r0-motivo\fase3.txt -Encoding UTF8
$contexto
```

8.2. Captura de las Fases 0 y 1 y de la línea TOTAL de la Fase 2:
```
$dirR0 = 'C:\Users\javiv\fase7-materiales\r0-motivo'
& { git log -1 --format=%H; git status --porcelain } | Set-Content "$dirR0\fase0.txt" -Encoding UTF8
& { foreach ($raiz in 'DECISIONS.md','CLAUDE.md','docs/spec') { git cat-file -e "ff07799:$raiz" 2>$null; if ($LASTEXITCODE -eq 0) { "EXISTE: $raiz" } else { "NO LOCALIZADO: $raiz" } }; git ls-tree -r --name-only ff07799 -- DECISIONS.md CLAUDE.md docs/spec } | Set-Content "$dirR0\fase1.txt" -Encoding UTF8
"TOTAL: $($salida.Count)" | Set-Content "$dirR0\fase2-total.txt" -Encoding UTF8
Get-ChildItem $dirR0
```

8.3. Cálculo de los sha256 de la sección 2:
```
Get-ChildItem C:\Users\javiv\fase7-materiales\r0-motivo | Get-FileHash -Algorithm SHA256 | Select-Object Hash, @{n='Fichero';e={Split-Path $_.Path -Leaf}}
```
