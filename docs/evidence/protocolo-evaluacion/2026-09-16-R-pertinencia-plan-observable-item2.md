# R — Pertinencia de `plan-observable.md` para §6 ítem 2 (Acto A nuevo): suspendido en HS-4

## 0. Estado

- **Acto:** Nuevo Acto A — comprobación de reconocimiento de posible pertinencia de `docs/spec/plan-observable.md` para `docs/spec/protocolo-evaluacion.md` §6 ítem 2 (`:54`).
- **Estado final:** **suspendido en HS-4** durante la Fase 3 (unidad `:13`).
- **Resultado del acto:** **ninguno.** No existe clasificación de Fase 3 ni resultado RA-1, RA-2 o RA-3. El cierre en RA-3a ratificado durante la sesión fue retirado (F-R.1, §8.4).
- **Naturaleza:** evidencia de reconocimiento. No contiene disposición normativa. Por disposición de Javi, el acto no genera asiento en `DECISIONS.md`; D-084 permanece libre.
- **No determina:** el propósito de §6 ítem 2, el significado de «común», ni la pertinencia o no pertinencia de `plan-observable.md` para §6 ítem 2.
- **No prejuzga** la continuación: completar el freeze en un acto nuevo o abandonar esta vía de reconocimiento.

## 1. Ancla, canal y régimen

- **Ancla:** `fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb` (`main`), verificada con `git log -1` al inicio de la sesión y en cada ejecución.
- **Canal:** Javi ejecuta en su terminal (Windows 10, PowerShell) y pega la salida literal; Code queda excluido. Claude propone los comandos congelados y clasifica sobre la salida pegada. Javi revisa y ratifica.
- **Notación:** `[V]` = verificado en esta sesión sobre el ancla. `[H]` = heredado, no re-verificado.
- **Nomenclatura:** §6 ítem 1 (`:53`), §6 ítem 2 (`:54`), §6 ítem 3 (`:55`), Nota normativa (`:57`). En el protocolo no existen los rótulos «§6.1» ni «§6.2» (C-0.4).
- **Transcripción de salidas:** cada bloque «Salida registrada» se transcribe desde la primera línea de salida efectiva de la ejecución. Se omiten prompts (`PS …>`), eco de comandos (`>> …`) y texto de mensaje adyacente en el pegado. No se altera, reordena ni omite ninguna línea de salida.

## 2. Relación con actos previos

- **Acto A anterior:** quedó suspendido en hard stop. Su freeze (A-0.2, A-1.1, A-2.1) no se hereda (F-A.7).
- **R-0 de procedencia:** su resultado se usó como base de F-A.1.0. El R-0 **no está versionado** y su versionado sigue diferido. Este artefacto no lo absorbe. Las remisiones documentales en que se apoya la base de F-A.1.0 se observan `[V]` en §3; el R-0 como acto no se re-verifica.
- **Hard stop del freeze madre §6:** sigue activo.

## 3. Remisiones en que se apoya la base de F-A.1.0, observadas en esta sesión (F-V.1, v2)

Solo se registra el hecho observado: estas líneas del protocolo contienen remisiones a `plan-observable.md`. No se reabre la clasificación del R-0 de procedencia.

Comando:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$l = @(git show fc1fec8:docs/spec/protocolo-evaluacion.md)
foreach ($n in 16,24,32,33,34) { "{0}: {1}" -f $n, $l[$n-1] }
"fin"
```

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
16: 2. No deberá regular: (a) el proceso interno de generación de planes por ningún motor; (b) la implementación concreta de ningún instrumento de medición o evaluador; (c) el contrato del objeto de plan observable, materia exclusiva de `docs/spec/plan-observable.md`.
24: - **Unidad de observación**: el día. Cada elemento de la colección `days` del plan observable (`docs/spec/plan-observable.md` §4.2, `docs/spec/plan-observable.md:49`). Esta definición completa, para efectos de este protocolo, la delegación que `docs/spec/plan-observable.md:49` (§4.2.1) hace al "protocolo de evaluación vigente".
32: 1. Este documento se apoya en `docs/spec/plan-observable.md` v1.0: dicha especificación norma el objeto evaluado — el plan observable (§4, `docs/spec/plan-observable.md:42-68`; §5, `docs/spec/plan-observable.md:70-82`; §6, `docs/spec/plan-observable.md:84-94`) —; este documento norma el proceso que evalúa ese objeto. No repite ni reinterpreta las obligaciones de esas secciones.
33: 2. Este documento se apoya en el contrato mínimo de `CLAUDE.md:17-28` (Contrato de shape entre motores), en los mismos términos de prevalencia que establece `docs/spec/plan-observable.md` §3.2 (`docs/spec/plan-observable.md:37`): en caso de conflicto, prevalece `CLAUDE.md`.
34: 3. Este documento hereda como precedente, sin reemplazarlo, el procedimiento de D-053 (`DECISIONS.md:2448-2457`): ubicación y forma de artefactos de verificación de conformidad en `docs/evidence/<nombre-spec>/` (F-V1), y doble ancla de hash (F-V2). D-053 rige la forma de los artefactos de verificación de conformidad exigidos por `docs/spec/plan-observable.md` §7.3 (`docs/spec/plan-observable.md:106`); este documento no modifica esa forma ni la extiende a los artefactos de medición propios de la evaluación comparativa: dichos artefactos quedan fuera del alcance de D-053; su forma no queda regulada por este documento (§1.2.b), sin perjuicio de las obligaciones de reproducibilidad que §5 les impone.
fin
```

Las remisiones a otros destinos (`CLAUDE.md`, D-053 y secciones internas de `plan-observable.md`) se registran y no se siguen (F-A.5). El doble ancla de hash de D-053 no se aplica a este artefacto: según `:34`, rige solo para la verificación de conformidad.

**Nota.** La tensión entre `:24` («`plan-observable.md:49` […] delega […] al "protocolo de evaluación vigente"») y la Fase 2 original (P0 = 0) llevó a revisar el comando. **No fundamenta** la corrección de §8: `:24` es texto del protocolo, no un literal verificado de `plan-observable.md`, y la guarda (i) de F-A.1.0 impide usarla como expectativa.

## 4. Fase 0 — control de registro sobre `protocolo-evaluacion.md` `[V]`

### 4.1 Líneas 51–57

Comando:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$l = git show fc1fec8:docs/spec/protocolo-evaluacion.md
50..56 | ForEach-Object { "{0}: {1}" -f ($_+1), $l[$_] }
```

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
51: ## §6 — Propiedades del cegado
52:
53: 1. El protocolo no deberá introducir información ajena al contenido evaluado que permita inferir el productor de un plan.
54: 2. Toda transformación destinada al cegado deberá ser común a todos los motores comparados.
55: 3. El procedimiento de cegado deberá ser reproducible y auditable.
56:
57: **Nota normativa.** La implementación concreta del cegado es materia procedimental abierta, fuera del alcance normativo de esta sección (§1.2). Su primera instanciación deberá registrarse como evidencia versionada antes de que se realice ninguna evaluación de la Fase 7.
```

### 4.2 Línea 58 (F-0.1(a))

Comando:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$l = git show fc1fec8:docs/spec/protocolo-evaluacion.md
"total: {0}" -f $l.Count
"58: [{0}]" -f $l[57]
```

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
total: 72
58: []
```

### 4.3 Primera línea no vacía a partir de `:59` (F-0.2(b))

Solo se observa el nivel de encabezado; el texto de la línea no se muestra.

Comando:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$l = git show fc1fec8:docs/spec/protocolo-evaluacion.md
$i = 58; while ($i -lt $l.Count -and $l[$i].Trim() -eq '') { $i++ }
if ($i -ge $l.Count) { "fin de archivo" } else { "linea {0}: nivel={1}" -f ($i+1), ($l[$i] -replace '^(#*).*','$1').Length }
```

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
linea 59: nivel=2
```

### 4.4 Controles

| Control | Resultado |
|---|---|
| C-0.1 | `[V]` §6 = `:51–57` (`:58` vacía; `:59` encabezado de nivel 2) |
| C-0.2 | `[V]` `:54` = ítem 2 |
| C-0.3 | `[V]` §6 no contiene remisión a `plan-observable.md` |
| C-0.4 | `[V]` lista de ítems 1–3 más Nota normativa; sin rótulos §6.1/§6.2 |
| C-0.5 | `[V]` literal de `:54`: «Toda transformación destinada al cegado deberá ser común a todos los motores comparados.» |

La cita heredada del registro («transformación común a todos los motores comparados») no era literal: omitía «destinada al cegado». El term-set se construyó exclusivamente sobre C-0.5.

## 5. Freeze ratificado

### 5.1 Autorización y objeto

> **F-A.1.0 — Disposición.** Por disposición constitutiva, no derivada del corpus, la dependencia normativa general del protocolo respecto de `plan-observable.md`, acreditada `[V]` en el R-0 de procedencia en `fc1fec8`, se establece como base suficiente para autorizar una comprobación de reconocimiento de posible pertinencia de ese documento para §6, ítem 2.
> Fundamento: solo la dependencia general.
> Ocasión: la indeterminación registrada del ítem 2, sin presuponer ningún resultado.
> No acredita: pertinencia, propósito del ítem 2 ni significado de «común».
> Guardas: (i) la expectativa de un resultado positivo no fundamenta ningún fork del acto; (ii) la autorización se limita a `plan-observable.md` y no es transitiva; (iii) la remisión de D-083 a §4 no orienta la lectura hacia el ítem 2.

Nota de registro: el texto anterior es el ratificado y se transcribe sin alteración. Su inciso «acreditada `[V]` en el R-0 de procedencia» no es `[V]` en esta sesión: el R-0 no está versionado ni se re-verificó como acto. Lo observado `[V]` en esta sesión son las remisiones documentales de §3, en las que se apoya esa base. La guarda (iii) menciona «la remisión de D-083 a §4», que es `[H]`.

> **F-A.0 — Objeto.** Comprobar, en `fc1fec8`, si `plan-observable.md` contiene pasajes que cumplan el criterio congelado en F-A.2 respecto de §6 ítem 2, dentro de la autorización de F-A.1.0.
> **Salida:** clasificación de cada pasaje con `archivo:línea`, o indeterminación dentro del perímetro.
> **Fuera del objeto:** extraer el propósito del ítem 2, interpretar «común» y adjudicar cualquier disposición.

### 5.2 Criterio de pertinencia (F-A.2(b) con enmiendas)

| Cubo | Condición | Resultado |
|---|---|---|
| Nivel 1 | Remisión según F-A.2.1 | Pertinencia reconocida |
| Nivel 2 | Término del term-set marcado **por construcción textual explícita** como objeto de definición o norma (F-A.4.3, F-A.4.4) | Pertinencia candidata |
| Nivel 3 (F-A.2.4, g1) | Coincidencia léxica fuera de las relaciones R-a a R-d y m2, haya o no marcador en la oración | Sin pertinencia |
| No clasificado (F-A.2.4, g1) | Ambigüedad estructural: la construcción textual admite dos o más análisis gramaticales incompatibles respecto de las relaciones admisibles, al menos uno dentro y otro fuera. La mera inseguridad del ejecutor no constituye ambigüedad estructural | Sin pertinencia; se cita con `archivo:línea` |

Test del Nivel 2: «¿El propio texto marca literalmente ese término como aquello que define, obliga, prohíbe o condiciona?». Queda excluida la pregunta de si el pasaje regula el mismo concepto que §6 ítem 2.

Guardas de F-A.2:
- (i) «común» funciona solo como término de localización; nunca se decide qué significa.
- (ii) Ningún nivel permite extraer el propósito del ítem 2.
- (iii) Una remisión que apunte a `:53` (ítem 1), a `:55` (ítem 3) o a la Nota normativa (`:57`) sin conexión textual explícita con el ítem 2 se registra como R1 ajeno al objeto y no produce pertinencia. La referencia a `:53`, `:55` o `:57` es una identificación estructural del texto vivo, no una afirmación sobre cómo `plan-observable.md` podría denominar esas partes.

> **F-A.2.1 — Alcance del Nivel 1.** Una remisión de `plan-observable.md` constituye pertinencia reconocida solo si nombra el protocolo y apunta textualmente al ítem 2 de su §6. Una remisión al protocolo que apunte al cegado o a su §6 sin especificar ítem se clasifica como pertinencia candidata. Una remisión al protocolo que apunte a otra parte se registra como R1 ajeno al objeto y no produce pertinencia.

> **F-A.2.2 — Referente de «§N».** Dentro de `plan-observable.md`, toda referencia «§N» o a una parte numerada se entiende referida al propio `plan-observable.md` salvo mención explícita del protocolo en la misma remisión. Solo una remisión que nombre el protocolo puede clasificarse en el Nivel 1 o como candidata por remisión.

> **F-A.2.3 — Rótulos sin correlato.** Si `plan-observable.md` remite al protocolo usando «§6.1», «§6.2» u otro rótulo que no existe como tal en §6, la remisión se clasifica como pertinencia candidata y nunca como reconocida. Hacerla corresponder con un ítem sería una adjudicación, porque el texto no establece esa correspondencia.

### 5.3 Instrumento (F-A.4)

> **F-A.4.1 (a) — Term-set.** «transformación», «cegado», «común», «motores comparados» (este último solo como sintagma completo).

> **F-A.4.2 — Variantes.** Flexión de número y de género donde gramaticalmente exista; mayúsculas indiferentes; ausencia de tilde admitida. Quedan excluidos derivados, sinónimos y equivalentes en otros idiomas. Un RA-3 significa solo ausencia de coincidencias dentro de este term-set.

> **F-A.4.2-c — Correferencia.** Solo cuentan las apariciones literales (F-A.4.2). Pronombres, posesivos y anáforas que remiten a un término del term-set no se computan, aunque el antecedente sea inequívoco.

> **F-A.4.3 — Marcadores del Nivel 2 (lista cerrada, secuencias contiguas).**
> **Definitorios:** «se entiende por», «se denomina», «se denominan», «se define», «se definen», «significa», «significan», «designa», «designan»; y el patrón de glosario en Markdown `**X**:` o `**X** —` en el que X es el término.
> **Normativos afirmativos:** «deberá», «deberán», «debe», «deben», «podrá», «podrán», «se prohíbe», «se prohíben», «queda prohibido», «queda prohibida», «quedan prohibidos», «quedan prohibidas», «requiere», «requieren», «exige», «exigen», «solo si», «siempre que», «salvo».
> **Normativos negativos:** «no» seguido inmediatamente de cualquiera de estas formas: «deberá», «deberán», «debe», «deben», «podrá», «podrán», «requiere», «requieren», «exige», «exigen».
> **Regla de forma:** mayúsculas indiferentes y ausencia de tilde admitida («solo»/«sólo», «prohibe»). No se admite ninguna otra forma, tiempo verbal ni perífrasis.

> **F-A.4.4 — Relación con el marcador** (texto vigente tras la enmienda m2.r, r1). Un término del term-set cuenta en el Nivel 2 solo si, en la misma oración que el marcador, ocupa una de estas relaciones, identificables por construcción y sin resolver el significado:
> **R-a** sujeto gramatical de la forma marcada, incluido el sujeto paciente;
> **R-b** complemento directo de la forma marcada;
> **R-c** atributo o predicativo de la construcción gobernada por la forma marcada;
> **R-d** definiendum de una construcción definitoria o X del patrón de glosario.
> **m2:** se incluyen solo modificadores de primer grado de un núcleo que ocupe R-a a R-c. Los modificadores anidados por debajo del primer grado se rigen por F-A.2.4(g1): Nivel 3, salvo ambigüedad estructural.
> **m2.1 (p1):** «modificador de primer grado» incluye cualquier dependiente directo del núcleo: adjetivo o participio adyacente, complemento del nombre y complemento del adjetivo, incluido el preposicional de régimen. Nada anidado por debajo.
> **Casos dudosos:** se rigen por F-A.2.4(g1).

Aplicación ratificada de p1: en un complemento preposicional, m2 se aplica al término de la preposición, no a la preposición.

Delimitación de oraciones: no se congela ninguna técnica de segmentación. Un límite inequívoco se aplica sin más. Si la construcción admite análisis incompatibles sobre si el término y el marcador están en la misma oración, rige «no clasificado» por g1.

> **F-A.4.5 (v2) — Calibración de decidibilidad.** Antes de abrir `plan-observable.md`, se aplican F-A.4.1 a F-A.4.4, incluida F-A.2.4(g1), F-A.4.4-m2.1(p1) y F-A.4.2-c, a todas las apariciones literales de términos del term-set en `protocolo-evaluacion.md:53–55` y `:57`, ya verificadas `[V]`. Condición de validez: cada aparición deberá poder clasificarse aplicando exclusivamente reglas ya congeladas. Falla / hard stop: si alguna aparición exige introducir una regla, relación o criterio no congelado; en tal caso se reconstituye F-A.4. Guarda anti-sobreajuste: la reconstitución no podrá introducir una relación ad hoc destinada a resolver únicamente la aparición fallida; cualquier modificación deberá formularse como regla general. Solo se admite una iteración; un segundo fallo mantiene el acto en hard stop. Nivel 3 no constituye por sí mismo un fallo de calibración: se registra como punto ciego declarado del instrumento y limita el alcance de cualquier RA-3 posterior. Sin efecto normativo.

> **F-A.4.6 — Formas de nombrar el protocolo (lista cerrada).** Solo cuentan como nombre del protocolo: `protocolo-evaluacion.md` (con o sin ruta, incluido como destino de un enlace Markdown), «protocolo de evaluación» y «protocolo de evaluacion». Mayúsculas indiferentes.
> **n1:** «protocolo» aislado no cuenta como nombre; sus apariciones se registran como referencia no nominal, sin pertinencia, y constituyen punto ciego declarado.
> Límite declarado: F-A.4.6 no puede calibrarse sobre `:53–57` y queda sin calibrar.

### 5.4 Fases y unidades (F-A.3)

- **Tres fases.** Fase 1: existencia y unicidad de ruta. Fase 2: localización mecánica de coincidencias (solo número de línea, etiqueta y número de coincidencias; sin texto). Fase 3: lectura de las unidades que contienen coincidencias.
- **u1:** la unidad es el bloque Markdown que contiene la línea coincidente, delimitado mecánicamente por línea en blanco, marcador de lista o encabezado.
- **u.1:** en tabla, la fila coincidente más la fila de cabecera; en código cercado, el bloque completo entre cercas. En ambos casos el Nivel 2 no opera. Una remisión (Nivel 1, candidata o R1 ajeno) sí se evalúa; si no la hay, Nivel 3.
- **s1:** un sintagma partido por salto de línea es punto ciego declarado.
- **F-A.3-f1:** rutas de `fc1fec8` cuyo último componente es exactamente `plan-observable.md`, distinguiendo mayúsculas. Si hay 1, se fija la ruta. Si hay 0 o más de 1, HS-2. Sin lectura de contenido.
- **F-A.3-f2, patrones** (insensibles a mayúsculas, palabra completa):
  - T1: `transformación`, `transformacion`, `transformaciones`
  - T2: `cegado`, `cegada`, `cegados`, `cegadas`
  - T3: `común`, `comun`, `comunes`
  - T4: `motores comparados`, `motor comparado`, con un solo espacio literal
  - N1: forma de archivo y forma nominal según F-A.3-f2-N1
  - P0: `protocolo` en singular, una vez retiradas de la línea las coincidencias de N1
- **F-A.3-f2-N1:** la forma de archivo cuenta como N1 solo si `protocolo-evaluacion.md` es un token completo. Por la izquierda: inicio de línea o carácter que no sea letra, dígito, `_`, `-` ni `.`. Por la derecha: fin de línea o carácter que no sea letra, dígito, `_` ni `-`, ni un `.` seguido de letra o dígito. La forma nominal cuenta con límites de letra, dígito o `_` a ambos lados. Una coincidencia que no cumple los límites no es N1 y la línea sigue sometida a P0. «Con o sin ruta» significa cualquier ruta; no se comprueba `docs/spec/`.
- **F-A.3-f2-b (b2):** los límites de palabra se implementan con `[\p{L}\p{N}_]` en lugar de `\b`. Es una corrección de implementación; la semántica de T1–T4 y P0 no cambia.
- **F-A.3-f2-d:** una línea con T1–T4 o N1 pasa a Fase 3. Una línea con solo P0 se registra como referencia no nominal y no se lee. Si no hay ninguna coincidencia T1–T4 ni N1, no hay Fase 3 y el resultado es RA-3a con acotación.
- **F-R.4:** implementación mecánica de u1/u.1 (§10.1), con autocontrol sintético congelado y PC-u-1.

### 5.5 No transitividad, canal y no herencia

> **F-A.5.** Las remisiones de `plan-observable.md` a otros documentos que aparezcan dentro de unidades leídas en la Fase 3 se registran con `archivo:línea` y destino literal, y no se siguen. No producen hard stop. La Fase 2 no busca remisiones salientes, así que ese registro no pretende ser completo y no puede presentarse como inventario de dependencias de `plan-observable.md`.

> **F-A.6.** Javi ejecuta todos los comandos en su terminal y pega la salida literal. Code queda excluido como canal. Claude propone comandos congelados antes de cada fase y clasifica sobre la salida pegada, citando por cada fila la regla que la decide. Javi revisa la clasificación. Una salida truncada, editada o con codificación corrupta no es `[V]`: el mismo comando se repite sin cambios, y no cuenta como fase ejecutada.

> **F-A.6-c — Control de integridad de entrada.** Se comprueba que los patrones ejecutados contienen los puntos de código esperados: T1 → `243` (ó); T3 → `250` (ú); N1 → `243`. Cualquier otro valor deja la salida de Fase 2 sin `[V]` para las formas acentuadas.

> **F-A.7.** No se hereda ninguna pieza del freeze del Acto A suspendido (A-0.2, A-1.1, A-2.1). A-2.1 («solo `git ls-tree`») queda desplazado por F-A.3. La constatación de su puerta de arranque (`:54` sin remisión a `plan-observable.md`) no se hereda: la establece de nuevo C-0.3 `[V]` en esta sesión.

### 5.6 Resultados posibles

> **RA-1.** Al menos una remisión de Nivel 1.
> **RA-2.** Ninguna de Nivel 1 y al menos una pertinencia candidata, sea por Nivel 2, por F-A.2.1 (cegado o §6 sin ítem) o por F-A.2.3 (rótulo sin correlato).
> **RA-3a.** Ninguna reconocida, ninguna candidata y ningún caso no clasificado.
> **RA-3b.** Ninguna reconocida, ninguna candidata y al menos un caso no clasificado, que se enumera. RA-3b no convierte un caso no clasificado en pertinencia candidata.
> **RA-4.** Hard stop.
> **Cláusulas comunes.** Ningún resultado acredita el propósito del ítem 2 ni el significado de «común». RA-1 y RA-2 no se leen como «hay propósito». RA-3 no se lee como «no pertinente» ni como «no existe».

**Acotación obligatoria de cualquier RA-3** (se registra aunque no se emitió ningún RA-3): variantes excluidas (F-A.4.2); correferencia (F-A.4.2-c); PC-cal-1; PC-cal-2; «protocolo» sin más (n1); sintagma partido por salto de línea (s1); parte nominal de F-A.4.6 sin calibrar; PC-f2-1 (T4 con espacios múltiples, tabulador o espacio duro); PC-f2-2 (términos partidos por marcado Markdown); PC-f2-3 (variantes del nombre de archivo fuera de N1: no forman N1 y, según su forma, pueden registrarse como P0 o no producir ninguna coincidencia); PC-f2-4 («protocolos» en plural); PC-N1-1 (formas codificadas o escapadas del nombre); PC-u-1 (citas `>` y HTML no tratados como delimitadores de unidad).

### 5.7 Hard stops

> **HS-1.** El ancla no coincide con `fc1fec8`.
> **HS-2.** La Fase 1 devuelve 0 o más de 1 rutas.
> **HS-3.** La calibración F-A.4.5 falla dos veces.
> **HS-4.** Durante la ejecución, alguna clasificación exige una regla, relación, forma o unidad no congelada.
> **HS-5.** Cualquier ampliación del term-set, de las formas de F-A.4.6 o de la unidad de lectura durante la ejecución.
> **Efecto.** Ante un hard stop, el acto queda suspendido. No se clasifica nada más y no se emite ningún resultado RA-1 a RA-3.

## 6. Calibración F-A.4.5 (v2)

Se aplicó sobre el literal `[V]` de `:53–55` y `:57` (§4.1), sin comandos.

### 6.1 Primera emisión: fallo

La aparición «cegado» en `:54` («destinada al cegado») es modificador de segundo grado bajo el núcleo del sujeto. Con el texto de m2 vigente entonces («Los modificadores más profundos quedan como "no clasificado"») iba a «no clasificado». Con F-A.2.4(g1), que reserva ese cubo a la ambigüedad estructural, iba a Nivel 3. Elegir entre ambas exigía un criterio no congelado. Se consumió la única reconstitución: **F-A.4.4-m2.r (r1)**, que suprime esa frase de m2 y remite los modificadores anidados a g1. Queda registrado que la afirmación previa de que m2 resolvía también «cegado» en `:54` era errónea.

### 6.2 Segunda emisión: válida

| # | Línea | Término | Marcador | Relación | Cubo | Regla |
|---|---|---|---|---|---|---|
| — | `:53` | sin apariciones del term-set | — | — | — | F-A.4.1, F-A.4.2 |
| 1 | `:54` | transformación | «deberá» | R-a, núcleo del sujeto | Nivel 2 | F-A.4.3, F-A.4.4 R-a |
| 2 | `:54` | cegado | «deberá» | complemento de «destinada»; segundo grado, sin ambigüedad | Nivel 3 | m2.r (r1) + F-A.2.4(g1) |
| 3 | `:54` | común | «deberá» | R-c, atributo de «ser» | Nivel 2 | F-A.4.4 R-c |
| 4 | `:54` | motores comparados | «deberá» | término del complemento de régimen de «común» (R-c); primer grado | Nivel 2 | m2 + p1 |
| 5 | `:55` | cegado | «deberá» | complemento del nombre de «procedimiento» (R-a); primer grado | Nivel 2 | m2 + p1 |
| 6 | `:57` | cegado | ninguno en la oración; límite inequívoco | fuera de las relaciones | Nivel 3 | F-A.2.4(g1) |

Exclusiones: «su» en `:57` (F-A.4.2-c); «el protocolo» en `:53` (fuera del term-set; F-A.4.6 sin calibrar).

Puntos ciegos declarados por la calibración:
- **PC-cal-1.** Un término anidado en segundo grado o más bajo un núcleo que ocupa una relación admisible es Nivel 3, aunque la oración sea normativa.
- **PC-cal-2.** Un término en una oración sin marcador de la lista cerrada es Nivel 3, aunque la oración siguiente sea normativa.

La calibración no tiene efecto normativo y no clasifica el protocolo a efectos del acto. HS-3 no se activó.

## 7. Fase 1 `[V]`

Comando:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$r = @(git ls-tree -r --name-only fc1fec8 | Where-Object { ($_ -split '/')[-1] -ceq 'plan-observable.md' })
"rutas: {0}" -f $r.Count
$r
```

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
rutas: 1
docs/spec/plan-observable.md
```

Ruta fijada: `docs/spec/plan-observable.md`. HS-2 no se activó.

## 8. Fase 2 original, defecto y retirada

### 8.1 Ejecución original

Script: `r-pertinencia-fase2-original.ps1`. Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
total: 120
fin
```

### 8.2 Control de canal F-A.6-c

Ejecutado en la misma ventana, sobre `$f`.

Comando:

```powershell
foreach ($k in 'T1','T3','N1') { "{0}: {1}" -f $k, (($f[$k].ToCharArray() | Where-Object { [int]$_ -gt 127 } | ForEach-Object { [int]$_ }) -join ',') }
```

Salida registrada:

```text
T1: 243
T3: 250
N1: 243
```

`243`, `250` y `243` son **puntos de código Unicode** (ó, ú, ó) presentes en los patrones ejecutados. **No son recuentos de coincidencias.** El control acreditó la integridad de la entrada de los patrones; no podía detectar el defecto de §8.3.

### 8.3 Defecto del instrumento

En PowerShell los nombres de variable no distinguen mayúsculas. En el script original, `$l` (líneas del archivo) y `$L` (límite izquierdo del patrón) son la misma variable. `"total: 120"` se imprimió antes de la reasignación. Después, `$L = '(?<![\p{L}\p{N}_])'` sustituyó el contenido y el bucle recorrió un único elemento, esa cadena, en lugar del documento. La salida de §8.1 no escaneó `plan-observable.md`.

**Comprobación directa, no concluyente.** Se ejecutó en la misma ventana después del comando de §3, que reasignó `$l`.

Comando:

```powershell
"{0} / {1}" -f $l.GetType().Name, $l.Count
```

Salida registrada:

```text
Object[] / 72
```

El valor corresponde al protocolo (72 líneas), no al estado de §8.1. No confirma ni refuta el defecto.

**Acreditación empírica del defecto.** Con patrones, archivo y ancla idénticos, cambiando solo los nombres de variable, la Fase 2 pasó de 0 coincidencias (§8.1) a 9 líneas con coincidencias (§9).

### 8.4 Disposiciones

- **F-R.1.** La salida de §8.1 no es `[V]` para T1–T4, N1 ni P0. El cierre en RA-3a, ratificado sobre esa salida, queda retirado. Repetir el comando «sin cambios» (F-A.6) reproduciría el defecto.
- **F-R.2.** Corrección de implementación: renombrado de variables sin cambios en patrones, term-set, formas ni unidades. HS-5 no afectado.
- **F-R.3.** Autocontrol del instrumento con cadenas sintéticas y salida congelada, más recuento de líneas iteradas igual a `total`.

## 9. Fase 2 (repetición) `[V]`

Script: `r-pertinencia-fase2-repeticion.ps1`. Ejecutado en ventana nueva. Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
cp T1: 243
cp T3: 250
cp N1: 243
S1: T1 x1
S1: T2 x1
S1: T3 x1
S1: T4 x1
S1: N1 x2
S1: P0 x1
S2: P0 x1
total: 120
13: N1 x1
15: T3 x1
21: P0 x1
31: T1 x1
49: N1 x1
72: T1 x2
72: P0 x1
88: T1 x1
110: P0 x1
iteradas: 120
fin
```

Controles congelados (puntos de código, S1, S2, `iteradas` = `total`, `fin`): todos coinciden.

Derivación según F-A.3-f2-d. **Solo es derivación: no hubo clasificación, ni provisional ni ratificada.**

| Línea | Coincidencias | Destino |
|---|---|---|
| 13 | N1 | Fase 3 |
| 15 | T3 | Fase 3 |
| 21 | P0 | referencia no nominal, no leída |
| 31 | T1 | Fase 3 |
| 49 | N1 | Fase 3 |
| 72 | T1 x2, P0 | Fase 3 |
| 88 | T1 | Fase 3 |
| 110 | P0 | referencia no nominal, no leída |

## 10. Fase 3

### 10.1 Instrumento y autocontrol `[V]`

Script: `r-pertinencia-fase3-unidades.ps1` (implementación de u1/u.1 según F-R.4). Autocontrol sintético congelado: `U encabezado [1]`, `U bloque [3,4]`, `U bloque [5,6]`, `U bloque [7]`, `U tabla [9,11]`, `U codigo [13,14,15,16,17]`. El resultado observado coincide.

Salida registrada:

```text
fc1fec831ccb0c6f91effc148f4ba2a2c3c263eb
U encabezado [1]
U bloque [3,4]
U bloque [5,6]
U bloque [7]
U tabla [9,11]
U codigo [13,14,15,16,17]
total: 120
linea 13 -> [13]
U bloque [13]
13: 1. **Norma del objeto de evaluación, no especificación de migración.** Este documento deberá leerse como la norma que define qué es un plan evaluable. No deberá leerse como un plan de trabajo, una guía de implementación ni una especificación del proceso de migración legacy→engine2. El protocolo de evaluación que operará sobre este objeto será materia de norma propia.
linea 15 -> [15]
U bloque [15]
15: 3. **Agnóstica ≠ mínimo común denominador.** Si la evaluación requiere una propiedad que algún motor existente no expone, este documento deberá exigirla igualmente. La no conformidad de un motor deberá registrarse como deuda de ese motor, no como recorte de la norma.
linea 31 -> [31]
U bloque [31]
31: - **Proyección**: transformación de un plan observable a la representación que consumirá la evaluación, sujeta a §5.
linea 49 -> [49]
U bloque [49]
49: 1. `days` deberá ser una colección enumerable cuyos elementos representen, en orden estable, las unidades temporales definidas por el protocolo de evaluación vigente.
linea 72 -> [72]
U bloque [72]
72: **§5.0 — Ámbito.** Esta sección regula la proyección definida en §2: la transformación de un plan observable a la representación que consumirá la evaluación. Regula la transformación como función del objeto; no regula el diseño del protocolo que consumirá su resultado (§1.2.b).
linea 88 -> [88]
U bloque [88]
88: **§6.1 — No adición.** La proyección no deberá contener información no derivable del plan observable por transformación explicitable.
fin
```

### 10.2 Activación de HS-4 en `:13`

La unidad `:13` contiene N1 en forma nominal y ningún término de T1–T4, así que solo es clasificable por la vía de remisión (F-A.2.1). F-A.2.1 prevé tres casos: remisión al ítem 2 (reconocida), al cegado o a §6 sin ítem (candidata) y a otra parte (R1 ajeno). La unidad nombra el protocolo en su conjunto, sin apuntar a ninguna parte, y no encaja en ninguno de los tres:
- la vía candidata exigiría aplicar por analogía el caso «§6 sin ítem», analogía no congelada;
- «otra parte» no es aplicable al conjunto;
- F-A.2.4(g1) define Nivel 3 y «no clasificado» para el term-set y el Nivel 2, no para N1.

Además, ninguna regla congelada define «remisión». La clasificación exige un criterio no congelado. Se activa **HS-4**.

### 10.3 Efecto

Aplicado sin excepción:
- el acto queda suspendido;
- no se clasifica ninguna unidad, incluidas `:15`, `:31`, `:49`, `:72` y `:88`, que quedan **expuestas y no clasificadas**;
- no se emite resultado;
- no hay reconstitución disponible (la calibración consumió la única).

No se adjudica si el «§6.1» de `:88` se refiere al propio `plan-observable.md` o al protocolo.

## 11. Defecto del freeze y contaminación

### 11.1 Defecto de F-A.2.1

F-A.2.1 se redactó como partición completa de las remisiones sin que lo fuera: no cubre la remisión al protocolo en su conjunto y no define «remisión». Es un **defecto del freeze**, no una característica del documento examinado. La calibración no podía detectarlo, porque el protocolo no se nombra a sí mismo (límite declarado de F-A.4.6).

### 11.2 Contaminación

El texto de las unidades `:13`, `:15`, `:31`, `:49`, `:72` y `:88` quedó expuesto en esta sesión. Cualquier acto posterior que complete F-A.2.1 o defina «remisión» se redactará conociendo `:13`, y deberá declararlo ex ante y justificar la regla en términos generales. Nada de lo leído puede funcionar como expectativa ni como orientación (F-A.1.0, guarda (i)).

## 12. Registro de régimen y correcciones

1. **Ratificaciones posteriores a la ejecución.** F-A.6-c, F-V.1 (v2) y F-R.1–F-R.4 se ejecutaron sin ratificación expresa previa o con ratificación en el mismo mensaje. Se aceptaron por coincidir el resultado con lo congelado, y fueron ratificadas después por Javi.
2. **Entrada no visible.** En varias ejecuciones la terminal pegada no mostró el comando completo, solo la salida.
3. **Identidad de los scripts.** Los `.ps1` adjuntos reproducen byte a byte los comandos congelados tal como constan en la sesión. Su identidad con lo tecleado no es observable. Se apoya en la coincidencia de las salidas con los controles congelados y en la declaración de ejecución sin modificación.
4. **F-R.3** no ratificó ninguna clasificación provisional: la tabla de §9 solo deriva.
5. **Nomenclatura.** Durante la sesión se usaron «§6.1» y «§6.2» como si fueran rótulos del protocolo antes de C-0.4. Este artefacto usa solo la nomenclatura de §1.
6. **Instrumentos.** Los defectos de instrumento (variables en §8.3, partición de F-A.2.1, conflicto m2/g1 de §6.1) proceden de la redacción de Claude y quedaron registrados en el momento de detectarse.

## 13. Estado al cierre de la sesión

- Nuevo Acto A: **suspendido en HS-4**, sin resultado.
- Fases 0, 1, 2 (repetición) e instrumento de Fase 3: `[V]`.
- RA-3a: retirado (F-R.1).
- Hard stop del freeze madre §6: activo.
- Propósito de §6 ítem 2 y significado de «común»: no determinados.
- `DECISIONS.md`: sin asiento, por disposición de Javi. D-084 libre.
- R-0 de procedencia: versionado diferido.
- `.xlsx` (`Anotacion_cocinero_242_v4`, `_v5`): fuera de perímetro.

## 14. Archivos adjuntos

- `r-pertinencia-fase2-original.ps1`: script de Fase 2 con el defecto de §8.3, conservado como evidencia.
- `r-pertinencia-fase2-repeticion.ps1`: script de Fase 2 corregido (F-R.2, F-R.3).
- `r-pertinencia-fase3-unidades.ps1`: script de Fase 3 (F-R.4).
