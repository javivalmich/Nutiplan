# R-0 — Reconocimiento de D-047 respecto a la distinción objeto/proyección (C v1)

**Tipo:** Reconocimiento R-0, read-only, demostrativo. NO es asiento: no decide, no versiona DECISIONS.md, no abre §, no realiza merges.
**Ancla:** `5b94e50` (HEAD -> main, origin/main, origin/HEAD alineados; Merge f43db50 6efe564).
**Fecha:** 2026-07-29.
**Objeto del reconocimiento:** determinar, mediante lectura estática estricta y sin interpretación, en qué lado de la distinción objeto/proyección (adjudicada en D-078) ubica el corpus a C v1 según el literal de D-047 (DECISIONS.md:2239-2324).

## 1. Perímetro declarado

```
D-047 (DECISIONS.md:2239-2324)
  ↳ D-024 (referencia explícita en D-047:2306, tabla F1) — sin remisión relevante a ubicación de C v1
  ↳ D-033 (referencia explícita en D-047:2306, tabla F1)
    ↳ D-028 §2 (referencia explícita en D-033:1453) — DECLARADA, NO SEGUIDA: contenido (estados de
      verdura confirmada/derivada) ajeno a la ubicación de C v1.
```

**Completitud:** verificada por grep `'D-0[0-9][0-9]|\.md|§'` sobre el rango [2239,2324]: únicos hits
2239 (cabecera propia del asiento) y 2306 (referencia a D-024/D-033 en la tabla F1 de la sonda de
localización de productores). D-047 NO cita `.md` alguno; en particular NO cita `plan-observable.md`,
D-058, D-061 ni D-072. Cero `§` salientes.

**Fork de evidencia técnica (ratificado por Javi):** las citas `.js` del bloque (`buildPlan.js`,
`frequencies.js`, `identity.js`, `compositionResolver.js`, `continuidad.js`, etc.) son "Evidencia
versionada" — evidencia técnica, no corpus normativo. Se declara su existencia y se constata que no
introducen definición normativa de objeto/proyección. No se siguen ni se expanden como perímetro.

## 2. Marco conceptual efectivo de D-047 (exhibición, no juicio)

Cita literal, archivo:línea, de los principios y el contrato que fijan el marco propio del documento:

- "C es representación canónica de EVALUACIÓN, no formato de plan." (DECISIONS.md:2247)
- "C es lenguaje intermedio, no adaptador: ambos motores expresan C; C no deriva del vocabulario
  nativo de ninguno. Las dos flechas entran a C." (DECISIONS.md:2248)
- "C es la intersección mínima de hechos compartidos; cada propiedad se justifica; quitar una no
  afecta la expresabilidad de otra." (DECISIONS.md:2250)
- "C es un conjunto de identificadores verificables estructuralmente; el significado humano vive en
  documentación separada y revisable, no en el contrato." (DECISIONS.md:2253)
- Contrato v1: "Ninguna categoría inventada. Cada candidata debe citar productor explícito
  (`archivo:línea`) o regla ya versionada que la derive. 'Derivable' sin cita no es respuesta válida.
  El contenido de C v1 es el conjunto de hechos que el reconocimiento ha demostrado compartidos entre
  ambos motores — no un objetivo de diseño." (DECISIONS.md:2257-2258)

Este marco se exhibe tal como aparece en el literal. No se mapea contra la distinción objeto/proyección
ni se reconcilia con D-078 en este acto (ver §5).

## 3. Las cuatro salidas

**(a) PROYECCIÓN — sin sustento.** El eje objeto/proyección es EXTERNO al vocabulario de D-047. La
única ocurrencia léxica "proyección" en el perímetro es el nombre de un instrumento propio, "Sonda de
proyección (F1/F2)" (DECISIONS.md:2312), no una proposición sobre la naturaleza de C v1.

**(b) OBJETO — sin sustento.** Ídem exogeneidad del eje. La frase "el objeto retornado"
(DECISIONS.md:2292, en el hallazgo de Identidad de plato: "legacy no tiene implementación de identidad
de combo en el objeto retornado") es uso genérico de programación (el valor que retorna una función),
no el término contractual de la distinción objeto/proyección. D-047 no cita `plan-observable.md`, donde
el corpus, fuera de este perímetro, aloja la definición contractual de ese término.

**(c) D-047 NO fija el lado — sostenida por el literal.** Dos anclas textuales:
- DECISIONS.md:2271 — "C v1 queda congelada con ese alcance. La suficiencia de C v1 para soportar el
  protocolo de evaluación NO forma parte de este frente y queda heredada explícitamente al Frente B."
- DECISIONS.md:2320 — "Dado que el único hecho compartido es el andamiaje temporal, el Frente B hereda
  la pregunta: ¿sobre qué evalúa el juez la tesis de humanización? B no puede 'añadir F1'; solo puede
  'construir un terreno común nuevo que justifique F1'. Esa distinción de gobernanza es consecuencia
  directa de congelar C v1 ahora."

**(d) DEPENDE de cadena explícita — sin sustento en el perímetro leído.** La única cadena explícita
saliente de D-047 (→ D-024/D-033, DECISIONS.md:2306) termina en el mecanismo de verdura (regla
`satisfaceVerdura`), ajeno a la distinción objeto/proyección.

Las cuatro salidas se presentan sin privilegiar por diseño; el sustento diferencial (fuerte en (c),
nulo en (a)/(b)/(d)) surge del literal citado, no del orden o formato de presentación.

## 4. Tesis terminal (verbatim, ratificada por Javi)

> D-047 no ubica C v1 en la dicotomía objeto/proyección. Desarrolla un marco conceptual propio
> (representación canónica, lenguaje intermedio e intersección mínima de hechos compartidos) y difiere
> expresamente la suficiencia de C v1 para el protocolo de evaluación al Frente B. La correspondencia
> entre ese marco y la distinción objeto/proyección permanece fuera del perímetro de D-047.

## 5. Nota de método

(i) El fork de citas `.js` está ratificado: son evidencia técnica, no corpus normativo; no se siguen
como perímetro.
(ii) D-028 §2 queda declarada-no-seguida por relevancia de contenido (estados de verdura
confirmada/derivada, ajenos a objeto/proyección).
(iii) Este R-0 es demostrativo y no reconcilia el tercer marco (representación canónica / lenguaje
intermedio) con D-078. Esa reconciliación, si procede, es materia del asiento siguiente — no de este
reconocimiento.
