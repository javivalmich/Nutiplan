# Comprobación posterior de D-092 — 2026-10-09

Comprobación de solo lectura. Describe y no decide. Registra aparte lo que la sección 2 de `docs/evidence/fase7-criterio/README.md` remite a una comprobación posterior al commit: que el contenido de cada blob versionado de las fases coincide con el sha256 de su fichero local. Se versiona en el PR de D-093, como prevén sus Consecuencias.

## 1. Objeto
Comprobar que el commit de D-092 y su merge en `main` contienen exactamente lo previsto, partiendo del ancla `ff0779974492f68ee704a91f73393fbb8b0b08de`:
- `CLAUDE.md`: el blob del ancla con una sola sustitución, la enmienda de la línea 6.
- `DECISIONS.md`: el blob del ancla, un LF y la entrada de D-092.
- `docs/evidence/fase7-criterio/`: exactamente 8 rutas, cada una con el sha256 fijado en el script. Para los cinco ficheros de las fases, esos valores son los de la tabla de la sección 2 del README de esa carpeta.
- `git diff --name-only` desde el ancla: exactamente 10 rutas.

## 2. Ficheros

| Fichero | Contenido | sha256 |
|---|---|---|
| `verificar-d092.mjs` | Script de verificación. Solo lee: no escribe ni modifica nada | `9e98051dfcf388972d543454fcc2d053edd70f9e6f3e12498a15ba7c9f5d6597` |
| `d092-entrada.txt` | Texto de la entrada de D-092 con el que se compara `DECISIONS.md` | `137729d61490ad97b0457ecdcb43929f4e24d58b17d087074e6e33ea24317241` |
| `verificar-rama.txt` | Salida de la ejecución sobre el commit de la rama | `df0243293d2167965c4cef589cb677d9467ebd1f362193523c3bbcd42454ad0d` |
| `verificar-main.txt` | Salida de la ejecución sobre el merge en `main` | `4a87faff9f91be76a51a4c8624515f3054a81513e4f506b30f14f11ae7a14c3b` |

Los cuatro ficheros están en UTF-8 sin BOM, con fin de línea LF. Los sha256 se calcularon sobre las copias que el titular aportó desde `C:\Users\javiv\fase7-materiales\d092\`. Las dos salidas son capturas de la salida estándar del script; este acta no transcribe los comandos de invocación.

## 3. Controles
El script define 13 controles:
- **E-0:** el sha256 de `d092-entrada.txt` coincide con el valor fijado en el script.
- **V-b.1:** el blob de `CLAUDE.md` es el del ancla con una única sustitución de «hasta que el nuevo gana una evaluación ciega.» por «hasta que el nuevo cumple la condición de sustitución que fija `DECISIONS.md` para la evaluación ciega.», y la frase sustituida aparece una sola vez en el ancla.
- **V-b.2:** el blob de `DECISIONS.md` es igual, byte a byte, al del ancla seguido de un LF y de `d092-entrada.txt`.
- **V-c.0:** `docs/evidence/fase7-criterio/` contiene exactamente las 8 rutas previstas.
- **V-c (8 controles, uno por fichero):** el sha256 de cada blob de la carpeta coincide con el valor fijado en el script.
- **V-d:** `git diff --name-only` desde el ancla devuelve exactamente las 10 rutas previstas: `CLAUDE.md`, `DECISIONS.md` y las 8 de la carpeta.

## 4. Ejecuciones

| Salida | Commit verificado | Padres | Rama | Fecha (UTC) | Node |
|---|---|---|---|---|---|
| `verificar-rama.txt` | `67094ee0d0c98a833f3eb08b244bb4ed5d1ba76a` | `ff07799` | `docs/d-092-motivo-condicion` | 2026-10-09T12:06:46.076Z | v24.14.1 |
| `verificar-main.txt` | `aa63f901f389d8fad8acc4c90c37b3a7aa9cf843` | `ff07799`, `67094ee` | `main` | 2026-10-09T12:07:54.996Z | v24.14.1 |

Los datos de esta tabla son los que el propio script escribe en la cabecera de cada salida.

## 5. Resultado
En cada ejecución, los 13 controles dan PASA, ninguno da FALLA, y la última línea es «RESULTADO: TODO PASA». Las dos salidas informan los mismos valores:
- `CLAUDE.md`: sha256 del ancla `ed1a49f8f8e901210dd21b4d2b8a6afbd27c956d146ebb58d616c365c3369f60`; sha256 del commit `08fbb7e9668c13fef1093e72335f36c426c42b83f6c3306941efd5a0a6f8ec6a`.
- `DECISIONS.md`: sha256 del ancla `b7bc8ecbcd5fc28f16d16f9d0bbe1bec534d9f7265e5aa9e7cb3c78b4eca6635`; sha256 del commit `412de41c37d8be4034b3e53e684e9f01bcbce594e9b752a676d5aed289b08d25`, igual al esperado.
- Los 8 blobs de la carpeta coinciden con los valores fijados en el script. Los cinco ficheros de las fases (`fase0.txt`, `fase1.txt`, `fase2.txt`, `fase2-total.txt` y `fase3.txt`) coinciden así con los sha256 de la tabla de la sección 2 del README de `docs/evidence/fase7-criterio/`.

El código de salida no se capturó. El script termina con 0 si todos los controles pasan y con 1 si alguno falla (`verificar-d092.mjs:89`), pero ninguna de las dos salidas registra el código con el que terminó la ejecución.

Discrepancia anotada: al cerrar el versionado de D-092 y al abrir la sesión siguiente se informó de «14 controles». El script define 13 y cada salida contiene 13 líneas PASA (`verificar-rama.txt:9–21`, `verificar-main.txt:9–21`). La cifra correcta es 13.

## 6. Alcance del script
El script solo es válido si se ejecuta con el commit que se quiere verificar como argumento (`67094ee` o `aa63f90`) y con la ruta de `d092-entrada.txt`. Sin argumento verifica HEAD. Sobre commits posteriores, V-c.0 y V-d fallarán por diseño, porque la carpeta y el diff ya no coinciden con lo previsto; en particular, sobre el commit que añade esta subcarpeta. Esto describe el comportamiento previsto por el código, no una ejecución realizada.

## 7. Incidencias del versionado de D-092
Las tres son declaraciones del titular al abrir la sesión del 2026-10-09. Ninguna afecta al resultado.
1. V-a se ejecutó después de `aplicar` y no antes, porque la línea del `for` quedó pegada a un `rem`. Según la declaración, las seis piezas se comprobaron antes del commit y coincidían.
2. Un `git checkout -b` falló porque dos líneas se juntaron, y no tuvo efecto. La rama correcta se creó justo después. La salida `verificar-rama.txt` registra la rama `docs/d-092-motivo-condicion`.
3. La verificación sobre `main` se hizo antes del push, y no después como preveía el procedimiento de versionado (V-4). Las fechas de la sección 4 y la fecha de autor del commit de merge (`aa63f90`, 2026-10-09 14:07:49 +0200, es decir, 12:07:49 UTC) muestran que se hizo después del merge. Que fuera antes del push no consta en ningún fichero.

## 8. Incidencias de la sesión del criterio
Ocurrieron el 2026-10-09 con el ancla `aa63f90`, durante la preparación de D-093. En los dos casos se creó un fichero sin seguimiento en la raíz del repositorio, que se movió fuera sin borrarlo. Después, `git status --short` salió vacío. Ninguna afectó a contenido versionado. Las pruebas no se versionan y quedan bajo custodia en `C:\Users\javiv\fase7-materiales\criterio\`.
4. Paginador. Un `git grep` abrió el paginador de git. El texto tecleado a continuación lo recibió el paginador, que guardó su entrada en un fichero cuyo nombre empezaba por `hell -NoProfile`. Prueba: `incidencia-paginador.txt`, 6.462 bytes, sha256 `28fde3af364d60b5990827bc1664cafa67e5ea2151bea7daab945274317c0cd2`. Contiene la salida de `git grep` con los códigos de color del terminal. Después de esta incidencia, los comandos que podían abrir el paginador se ejecutaron con `--no-pager` o volcando la salida a un fichero.
5. Redirección. Se pegó de vuelta en la consola una salida que incluía el indicador del prompt. El carácter `>` actuó como redirección y creó un fichero vacío llamado `certutil`. Prueba: `incidencia-certutil.txt`, 0 bytes, sha256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, calculado con `Get-FileHash`. El intento original de calcular el hash con `certutil` terminó con el error `0x800703ee`.
