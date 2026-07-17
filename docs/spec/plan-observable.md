# Especificación normativa del objeto de plan observable

Versión: 1.0
Estado: ratificada por D-052
Trazabilidad: toda versión de este documento se relaciona con el asiento de DECISIONS.md que la ratificó (§8.3).

## §0 — Género y principios del documento

Este documento pertenece al género de **especificación normativa** (`docs/spec/`, D-050/B-A3-A). Establece obligaciones, no describe estados. Todo enunciado normativo de este documento deberá formularse en modo obligación ("deberá", "no deberá"); ningún enunciado deberá formularse como descripción de comportamiento existente.

Principios rectores:

1. **Norma del objeto de evaluación, no especificación de migración.** Este documento deberá leerse como la norma que define qué es un plan evaluable. No deberá leerse como un plan de trabajo, una guía de implementación ni una especificación del proceso de migración legacy→engine2. El protocolo de evaluación que operará sobre este objeto será materia de norma propia.
2. **Agnóstica de motor (B-E1→B).** Las obligaciones de este documento deberán aplicar a cualquier plan que pretenda ser evaluado, con independencia del motor que lo produzca.
3. **Agnóstica ≠ mínimo común denominador.** Si la evaluación requiere una propiedad que algún motor existente no expone, este documento deberá exigirla igualmente. La no conformidad de un motor deberá registrarse como deuda de ese motor, no como recorte de la norma.
4. **Verificabilidad sobre el objeto terminado.** Toda obligación relativa al objeto de plan observable deberá poder verificarse mediante la observación del propio objeto terminado, sin ejecutar ningún motor y sin conocer el proceso de generación.

## §1 — Alcance

1. Este documento deberá regular exclusivamente el **objeto de plan observable**: el objeto que un productor materializa para evaluación.
2. No deberá regular: (a) el proceso interno de generación del plan; (b) el diseño del protocolo ciego de evaluación, que será objeto de norma propia; (c) la implementación concreta de ningún productor.
3. Las obligaciones sobre motores concretos deberán limitarse a lo establecido en §7.

## §2 — Definiciones

A efectos de este documento:

- **Motor**: sistema de decisión que genera planes. Las denominaciones "legacy" y "engine2" se usan como identificadores, sin cargar semántica normativa.
- **Productor**: código que materializa un plan observable a partir de la ejecución de un motor.
- **Plan observable**: objeto que satisface el contrato de §4, con independencia de su origen.
- **Proyección**: transformación de un plan observable a la representación que consumirá la evaluación, sujeta a §5.
- **Fidelidad**: propiedad de una proyección que no añade, omite ni distorsiona información del plan observable respecto de lo exigido en §6.

## §3 — Relación con normas existentes

1. Esta especificación **desarrolla el contrato de shape definido en `CLAUDE.md:17-28`**, en su redacción corregida por D-051. No lo sustituye ni lo excepciona: donde CLAUDE.md fija el contrato mínimo, este documento fija las obligaciones adicionales que la evaluación requiere.
2. En caso de conflicto entre este documento y CLAUDE.md, deberá prevalecer CLAUDE.md. El conflicto deberá registrarse como defecto de esta especificación y resolverse mediante su propio ciclo de modificación.
3. Este documento se apoya en, pero no repite: D-048 (tesis y objeto de evaluación), D-049/R-1 (estado de productores), D-050 (arquitectura del frente y frontera de decisión), D-051 (contrato corregido).
4. Ninguna entrada futura de DECISIONS.md deberá reinterpretar este documento sin modificarlo; los cambios deberán versionarse en el propio documento conforme a §8.
5. Esta especificación no modifica el significado de los términos definidos por D-048, D-049, D-050 ni CLAUDE.md; únicamente añade obligaciones normativas sobre el objeto de plan observable.

## §4 — Contrato normativo del objeto de plan observable

**§4.0 — Regla de contención estructural.** Las obligaciones estructurales sobre elementos anidados solo podrán introducirse cuando sean necesarias para que el plan constituya un objeto observable evaluable. Esta especificación no impondrá organización interna, metadatos ni semántica cuya necesidad para la evaluación no haya sido establecida. Toda revisión futura de esta sección deberá satisfacer esta misma regla.

**§4.1 — Claves obligatorias.** Todo plan observable deberá exponer las claves establecidas por el contrato de shape (`CLAUDE.md:17-28`): `days`, `strategy`, `weekWarnings`, `weekProblems`, `weekScore`, y opcionalmente `decisionLog`. Esta sección desarrolla las obligaciones estructurales de dichas claves; no altera su enumeración ni su carácter obligatorio u opcional.

**§4.2 — Estructura de `days`.**
1. `days` deberá ser una colección enumerable cuyos elementos representen, en orden estable, las unidades temporales definidas por el protocolo de evaluación vigente.
2. Cada elemento deberá ser identificable por su posición dentro de la colección, y dicha posición deberá corresponder de forma estable a una unidad temporal del plan.
3. Cada unidad temporal deberá exponer sus comidas como colección enumerable.
4. Cada comida deberá ser identificable dentro de su unidad temporal de forma no ambigua.
5. Cada comida deberá exponer los platos o componentes que la constituyen de forma que la identidad entre dos ocurrencias cualesquiera pueda establecerse de manera inequívoca por observación del objeto u objetos de plan, sin ejecutar ningún motor. Esta obligación es epistemológica, no tecnológica: no impone ningún mecanismo concreto de representación de identidad.

**§4.3 — Estructura de `strategy`.** `strategy` deberá exponerse como valor del plan, ligado al objeto y recuperable desde él. Un valor computado durante la generación pero no incorporado al objeto no satisface esta obligación.

**§4.4 — Estructura de `weekWarnings` y `weekProblems`.**
1. Ambas claves deberán ser colecciones enumerables, admitiendo la colección vacía como valor conforme.
2. Cada elemento deberá constituir una observación autosuficiente; su significado no deberá depender de estado externo al objeto de plan.

**§4.5 — `weekScore`.** `weekScore` deberá exponerse con el carácter que le asigna el contrato superior: campo de compatibilidad de display, cuya semántica para engine2 queda diferida por `CLAUDE.md:17-28`. Esta especificación no añade a `weekScore` obligación semántica alguna, por prevalencia (§3.2). Su presencia como clave es obligatoria; su interpretación no es materia de esta norma.

**§4.6 — `decisionLog`.**
1. Si el plan expone `decisionLog`, este deberá ser una única colección enumerable ligada al objeto de plan.
2. Cada entrada deberá representar una decisión registrada y constituir una observación autosuficiente.
3. La existencia de registros de decisión parciales, no ligados al objeto de plan, no satisface esta obligación.

**§4.7 — Autosuficiencia del objeto.** En aplicación del principio de verificabilidad (§0.4), el plan observable deberá ser autosuficiente para su observación. Los campos instrumentales o condicionados por mecanismos de depuración quedan fuera de este contrato, conforme a `CLAUDE.md:17-28`, y no podrán utilizarse para satisfacer ninguna obligación de §4.

## §5 — Requisitos de proyección

**§5.0 — Ámbito.** Esta sección regula la proyección definida en §2: la transformación de un plan observable a la representación que consumirá la evaluación. Regula la transformación como función del objeto; no regula el diseño del protocolo que consumirá su resultado (§1.2.b).

**§5.1 — El objeto como única fuente.** Toda proyección deberá computarse exclusivamente a partir del plan observable. Ninguna proyección podrá incorporar información procedente de la ejecución de un motor, de estado externo al objeto ni de campos excluidos del contrato por §4.7.

**§5.2 — Simetría.** La definición de una proyección no podrá depender del motor de origen del plan. Una misma proyección deberá ser aplicable a cualquier plan observable conforme a §4. Si una proyección requiere una propiedad que un plan no expone, el defecto es del plan (no conformidad con §4) o de la proyección (exigencia no cubierta por la norma), y deberá resolverse por el ciclo de modificación correspondiente.

**§5.3 — Determinismo.** Toda proyección deberá ser determinista: el mismo plan observable deberá producir la misma representación proyectada.

**§5.4 — No enriquecimiento.** Una proyección podrá omitir o agregar información del plan conforme a las condiciones de fidelidad (§6), pero no deberá añadir información no derivable del objeto.

**§5.5 — Neutralidad de origen.** La representación proyectada no deberá permitir inferir el motor de origen por rasgos ajenos al contenido del plan (formato, orden de claves, convenciones de nombrado u otros artefactos de serialización). Los rasgos del propio contenido no son materia de esta obligación.

## §6 — Condiciones de fidelidad

**§6.0 — Ámbito.** Esta sección establece las condiciones bajo las cuales una proyección es fiel (§2). La fidelidad es una propiedad de la proyección respecto del plan, verificable comparando ambos, en aplicación de §0.4.

**§6.1 — No adición.** La proyección no deberá contener información no derivable del plan observable por transformación explicitable.

**§6.2 — Omisión declarada.** La proyección podrá omitir información del plan, pero toda omisión deberá ser consecuencia de una regla declarada de la proyección, no de una pérdida no documentada. La omisión selectiva no declarada constituye distorsión.

**§6.3 — No distorsión.** La proyección no deberá alterar las relaciones que el plan establece: identidad (§4.2.5), orden estable (§4.2.1-2), pertenencia (comida→unidad temporal, componente→comida) y cardinalidad de las colecciones proyectadas.

**§6.4 — Explicitabilidad.** Toda proyección deberá definirse de forma suficientemente precisa para que un tercero pueda reproducirla y verificar su conformidad con §6.1–§6.3 únicamente a partir del plan observable y de la definición de la propia proyección.

## §7 — Obligaciones de conformidad por motor

**§7.0 — Ámbito.** Esta sección establece las obligaciones que esta especificación genera para los motores del sistema. No describe el estado de conformidad de ningún motor; dicho estado es materia de evidencia versionada (`docs/evidence/`), no de esta norma.

**§7.1 — Obligación universal.** Todo motor cuyo plan pretenda ser evaluado deberá disponer de un productor que materialice un plan observable conforme a §4. Esta obligación es exigible a todo motor por igual (§0.2).

**§7.2 — Posiciones de conformidad.** Respecto de las obligaciones reguladas por esta especificación, un motor podrá encontrarse, entre otras, en las siguientes posiciones de conformidad:
1. **Verificable**: existe un productor identificado por evidencia versionada. Su plan puede y deberá someterse a verificación de conformidad con §4.
2. **Pendiente de productor**: no existe productor identificado por evidencia versionada. Esta especificación constituye el criterio de aceptación del productor futuro: ningún productor podrá darse por construido si su plan no es conforme a §4.

**§7.3 — Verificación.** La verificación de conformidad deberá realizarse por observación del plan producido (§0.4), deberá quedar registrada como evidencia versionada, y deberá referir la versión de esta especificación contra la que se verificó (§8).

**§7.4 — No conformidad.** La no conformidad de un plan con §4 deberá registrarse como no conformidad del productor respecto de esta especificación (§0.3). La no conformidad no suspende la obligación ni habilita excepciones a esta norma.

**§7.5 — Posición vinculante para la evaluación.** Ningún plan podrá entrar en evaluación comparativa si su motor no se encuentra en posición verificable con verificación de conformidad registrada. La evaluación de planes no conformes queda fuera de protocolo.

## §8 — Estado y versionado

**§8.1 — Identidad y versión.** Este documento tiene identidad estable (`docs/spec/plan-observable.md`) y versión explícita. La versión inicial ratificada será la 1.0.

**§8.2 — Ciclo de modificación.** Toda modificación deberá: (a) ratificarse mediante asiento en DECISIONS.md que registre su causa; (b) incrementar la versión; (c) satisfacer los principios de §0, incluida la regla de contención (§4.0) para cambios estructurales.

**§8.3 — Trazabilidad de versiones.** Toda versión deberá poder relacionarse de forma inequívoca con el asiento que la ratificó. El asiento pertenece a la historia del documento, no a su identidad (F-S1).

**§8.4 — Estado inicial.** Hasta su ratificación por asiento, este documento carece de fuerza normativa. Ninguna obligación de §4–§7 será exigible con carácter previo a la versión 1.0.
