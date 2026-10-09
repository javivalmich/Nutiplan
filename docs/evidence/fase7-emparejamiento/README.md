# Comprobación de la correspondencia día–posición (primera Fase 7)

Fecha: 2026-10-09. Rama `fase-7-evidencia-emparejamiento`, creada desde `3ccd122`.

## 1. Objeto

Pregunta: en los 40 planes de la generación del 2026-10-06 (manifiesto `manifiesto-generacion.json`, sha256 `51e6cbf7c5305447f1ed6e46ca094cbe442740965b3abd8882894bdefe240a98`; D-090, punto 3), ¿corresponde la posición 1..7 a lunes..domingo, en ese orden, en ambos motores?

La vista cegada muestra los días solo por su posición (D-086, punto 4). Esta comprobación sirve de base para indicar al evaluador qué día de la semana corresponde a cada posición.

Alcance: los 40 planes de ese manifiesto, y solo esos. No se afirma nada sobre otras generaciones.

## 2. Archivos

| Archivo | sha256 |
| --- | --- |
| `verificar-dias.mjs` | `69c55f7806ec1b2e9a178758333c4a8a7df3f5e6693ac44c1f50d0688b08b181` |
| `salida-verificar-dias.txt` | `1a04a82aa536bdcfba1c69de1ea97330b8f7ea292c357641016d40092118e83e` |

`.gitattributes` (`* -text`) es copia de `docs/evidence/fase7-generacion/.gitattributes` en `3ccd122`.

## 3. Procedimiento

`verificar-dias.mjs` es de solo lectura: no escribe nada, no modifica ni regenera planes y no ejecuta ningún motor. Antes de leer los planes comprueba el sha256 del manifiesto. Antes de leer cada plan comprueba su `sha256Plan`. Después lee `days[i].name` en legacy y `days[i].day` en engine2 (`scripts/fase7/casos.js:126`, `:135` en `3ccd122`) y los compara con los nombres de día de cada motor (`scripts/fase7/casos.js:63–64`). Para con código 1 si falta un plan, si un hash no coincide o si no hay 40 planes. Un plan sin la clave esperada, o con otra secuencia, se registra como fallo, sin probar claves alternativas.

Material leído: `C:\Users\javiv\fase7-materiales\generacion-2001-2010`, ubicación original de los 40 planes (D-090, punto 3).

## 4. Ejecuciones

Las ejecuciones se hicieron en el equipo del titular, desde `C:\Users\javiv\app-comida`, con Node v24.14.1; las salidas se comunicaron en la sesión.

1. Primera ejecución, desde `C:\Users\javiv\fase7-materiales\verificar-dias.mjs`, con la salida en consola: 40/40 y código 0. Es un antecedente y no se versiona.
2. Captura versionada, ejecutada con estas órdenes:

```
set EVD=docs\evidence\fase7-emparejamiento
set GEN=C:\Users\javiv\fase7-materiales\generacion-2001-2010
echo [%EVD%] [%GEN%]
node %EVD%\verificar-dias.mjs %GEN% > %EVD%\salida-verificar-dias.txt 2>&1
echo %ERRORLEVEL%
```

`echo [%EVD%] [%GEN%]` imprimió `[docs\evidence\fase7-emparejamiento] [C:\Users\javiv\fase7-materiales\generacion-2001-2010]`. Código de salida: `0`.

## 5. Resultado

De `salida-verificar-dias.txt`: 40 planes leídos, 40 coinciden y 0 fallos. Literal: «RESULTADO: posición 1..7 = Lunes..Domingo en los 40 planes». El sha256 del manifiesto leído coincide con el de D-090.

## 6. Incidencias sin efecto material

1. Al pegar órdenes se unieron dos líneas en un `git checkout -b`. Git rechazó la orden (`fatal`) y no creó ninguna rama. La rama se creó en el intento siguiente.
2. Un `copy /b` sin destino copió `verificar-dias.mjs` en la raíz del repositorio. Se movió con `move` a esta carpeta, y su sha256 en destino coincide con el de la tabla del apartado 2.
3. Primer intento de captura: la orden se partió en dos líneas al pegarla. `node` se ejecutó sin argumento y paró en `PARADA: uso` antes de leer nada. La ruta del material se ejecutó como si fuera una orden, y el archivo de salida recogió el error de CMD (sha256 `cd39538e968c49b0d10683fc1084a05a4f382ee07d80f4bfc0ee0e9d4a208a1f`, código 9009).
4. Segundo intento de captura: dos líneas se unieron al pegarlas y `GEN` quedó como `C:\Users\javiv\fase7-materiales\generacion-2001-2010del %EVD%\salida-verificar-dias.txt`. El script paró en `PARADA: no existe …\manifiesto-generacion.json` antes de leer ningún plan (sha256 `ab02c708bd6c82aae1cc5894851775432a60ab75c853c9eced6cf84e1e164c74`, código 1).

Las salidas de los intentos 3 y 4 quedaron sobrescritas por la captura válida y no se versionan.

## 7. Codificación

`salida-verificar-dias.txt` es UTF-8 válido sin BOM, comprobado con `TextDecoder` en modo estricto con estas órdenes:

```
set F=docs\evidence\fase7-emparejamiento\salida-verificar-dias.txt
node -e "const b=require('fs').readFileSync(process.env.F);new TextDecoder('utf-8',{fatal:true}).decode(b);console.log(b.includes(Buffer.from([0xc3,0xa9])),b[0])"
```

Salida: `true 110`. La decodificación estricta no falló, el archivo contiene la secuencia UTF-8 de «é» (`c3 a9`) y su primer byte es `110` («n»), así que no hay BOM. La consola de Windows puede mostrar mal las tildes al hacer `type`.
