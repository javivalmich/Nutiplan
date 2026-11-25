# Plan: sacar de la historia los datos en bruto de `db9a2fd` (2026-11-25)

**Sustituido (Javi, 2026-11-25):** no se reescribe la historia. Los 9 `.json` se borran en un commit normal (`03d1740`, con la carpeta en `.gitignore`) y el PR #28 se mergea con «Squash and merge», como en la alternativa del final. Se conserva como referencia.

Solo el plan, sin ejecutar.

## Qué hay

- `db9a2fd` («Banco: medición de la comida con primero y segundo») añadió 9 archivos `.json` en `scripts/banco/medicion/estructura-comida/`. Ningún otro commit los toca:
  - `off.json`;
  - `s2-pescado-lentejas.json`, `s2-pescado-todas.json`, `s2-sinPescado-lentejas.json` y `s2-sinPescado-todas.json`;
  - `s3-pescado-lentejas.json`, `s3-pescado-todas.json`, `s3-sinPescado-lentejas.json` y `s3-sinPescado-todas.json`.
- Pesan 26,6 MB sin comprimir, entre 2,5 y 3,4 MB cada uno. Los `.md` con sus cifras se quedan.
- Solo los lee `scripts/banco/medicion/resumenEstructura.mjs`.
- `db9a2fd` solo está en `motor/i0-banco-cantidades`, en local y en `origin`. No está en `main` ni en `fix/autorizacion-rpc`.
- Desde `db9a2fd` hay 122 commits en la rama. Uno es un merge: `ce21c11`, que trae `main` `9522e92`.

## Dos cosas que hay que saber antes

1. **Cambian todos los hashes desde `db9a2fd`.** `DECISIONS.md`, `ESTADO.md` y los informes de `scripts/banco/medicion/` citan muchos de esos hashes (`e80d3dd`, `6297fec`…). Después de reescribir, esas citas apuntarían a commits que ya no están en la rama.
   - Hay que guardar la tabla de hash viejo a hash nuevo.
   - Después, cambiar las citas en un commit propio.
2. **El `.git` está compartido.** Vive en `C:\Users\javiv\app-comida` y lo usa también el worktree de `fix/autorizacion-rpc`. Hoy ya da avisos: `garbage found` e índices `.idx` sin su `.pack`.
   - La reescritura se hace en un clon aparte.
   - En el `.git` compartido no se ejecuta `gc`, `prune` ni `reflog expire`.

## Pasos

1. **Copia de seguridad.** Con la rama tal cual está en `origin`:
   ```
   git fetch origin
   git bundle create C:\Users\javiv\OneDrive\Nutiplan\motor-i0-banco-cantidades-<fecha>.bundle origin/motor/i0-banco-cantidades
   git bundle verify C:\Users\javiv\OneDrive\Nutiplan\motor-i0-banco-cantidades-<fecha>.bundle
   ```
   - Se anota el hash de la punta: es el `--force-with-lease` del paso 6.
   - No se sube una rama de copia a GitHub, porque volvería a llevar los 26 MB.
2. **Clon aparte, solo de esta rama,** en una carpeta nueva fuera del repo:
   ```
   git clone --single-branch --branch motor/i0-banco-cantidades https://github.com/javivalmich/Nutiplan.git nutiplan-limpieza
   ```
3. **Quitar los 9 archivos de los commits de la rama, y solo de esos,** sin instalar nada (`git filter-branch` viene con git):
   ```
   git filter-branch --index-filter "git rm --cached --ignore-unmatch -q scripts/banco/medicion/estructura-comida/*.json" -- db9a2fd^..HEAD
   ```
   - El rango deja intactos los commits de `main`: `9522e92` sigue siendo el padre del merge `ce21c11`.
   - La alternativa es `git filter-repo`, que hay que instalar (`pip install git-filter-repo`, una descarga). Deja la tabla de hashes hecha en `.git/filter-repo/commit-map`.
   - Con `filter-branch`, la tabla se saca comparando `git log --format=%H` del bundle y del clon, que tienen el mismo orden.
4. **Comprobar en el clon:**
   - `git log --all -- 'scripts/banco/medicion/estructura-comida/*.json'` no devuelve nada;
   - `git diff <punta vieja del bundle> HEAD --stat` solo muestra los 9 `.json` borrados;
   - `git diff origin/main...HEAD` no lleva ningún `.json` de `scripts/banco/medicion/`;
   - la batería completa pasa y el banco no tiene diferencias con la línea base;
   - `git count-objects -vH` da un tamaño menor.
5. **Commit de arreglo, en el clon:**
   - `.gitignore` con `scripts/banco/medicion/**/*.json`, para que no vuelva a pasar;
   - una nota en `resumenEstructura.mjs` sobre cómo regenerar los `.json` (`medirEstructura.mjs`, con el commit de la medición);
   - las citas de hashes de `DECISIONS.md`, `ESTADO.md` y `scripts/banco/**/*.md` cambiadas por los nuevos, con la tabla del paso 3.
6. **Subir solo esta rama:**
   ```
   git push --force-with-lease=motor/i0-banco-cantidades:<punta vieja> origin motor/i0-banco-cantidades
   ```
   Sin tocar `main` ni `fix/autorizacion-rpc`, que además solo existe en local.
7. **Este worktree** (`C:\Users\javiv\app-comida-motor`), sin cambios a medias:
   ```
   git fetch origin
   git reset --hard origin/motor/i0-banco-cantidades
   ```
   - Los objetos viejos se quedan en el `.git` compartido hasta un `gc`, que se deja para cuando la rama de seguridad haya terminado.
   - GitHub puede guardar un tiempo los objetos viejos, y los commits viejos siguen en el bundle. Lo que importa es que el merge no los lleva a `main`.
8. **Después:**
   - el PR borrador se actualiza solo, con los commits nuevos;
   - Vercel crea un Preview nuevo para la punta nueva;
   - se comprueba que el diff del PR no tiene los `.json`.

## Alternativa sin reescribir

«Squash and merge» del PR: `main` recibe un solo commit con el árbol de la punta, sin los 9 `.json`, porque la punta ya no los tiene si antes se borran en un commit normal. Además, la rama se queda como está y sus hashes siguen valiendo.

A cambio, `main` pierde los commits uno a uno, y las citas de `DECISIONS.md` apuntan a commits que solo están en la rama. Por eso habría que conservar la rama en GitHub.
