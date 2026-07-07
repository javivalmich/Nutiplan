# Insumo de cierre del gate F4 — lectura interpretativa de D2

Estado: RATIFICADO (Javi, 2026-07-07).
Base de evidencia: comparacion-D2.md / comparacion-D2.json (HEAD a62c935),
extracción literal verificada markdown↔JSON sin divergencias, y auditoría
de mecanismos del motor legacy (mismo HEAD).
Este documento es capa interpretativa: los números citados existen
literalmente en los artefactos D2; los agregados (sumas semanales) son de
esta capa y se marcan como tales.

## 1. densidadDiaria — la única comparación directa legítima

**1.1 Conmensurabilidad real: 6/7 días, con causa citada.**
El lado legacy presenta Sábado en status:"unknown" en las 9 fixtures.
Causa verificada, conforme a diseño del legacy, no defecto del comparador:
la comida de Sábado es un placeholder de comida libre (libreComida(), sin
_spec.tmpl — buildPlan.js:2269,2390-2393), ilegible para isLegibleMeal
(planReader.js:11-13), lo que deja las comidas legibles del día por debajo
del mínimo de 2 que exige classifyDayDensity (dayDensity.js:23-26).
Toda comparación de densidad es por tanto sobre L-V + Domingo.

**1.2 Hallazgo principal: engine2 no condiciona densidad al objetivo.**
Sumas semanales sobre los 6 días comparables (agregado de esta capa):
legacy muestra gradiente por estrategia (volumen 12/12, definición 5/8,
resto intermedio); engine2 no muestra gradiente y llega a invertirlo
(volumen_limpio = 4, la semana más ligera; mant+isSimple = 13, la más
densa). Es la cuantificación de goal=SIN_TRADUCCION, ya confirmado por
control negativo: la densidad de engine2 es hoy realización de seed, no
respuesta al objetivo. No es defecto de implementación; es ausencia de
diseño registrada como pregunta de roadmap (§5.1).

**1.3 Forma intra-semanal.** El Domingo de engine2 tiende a ligero (≤2 en
las 9 fixtures), similar al patrón legacy. La forma entre semana (legacy
alterna picos; engine2 aparece más plano en mantenimiento base) no es
concluyente con n=1 por configuración — incertidumbre explícita, sin
conclusión.

## 2. Métricas parciales — dispuestas, no leídas

**2.1** Los datos valor+cobertura están extraídos y archivados (extracción
literal, sin agregados). Su lectura interpretativa queda diferida a
después de la sesión editorial, cuando la cobertura mejore.

**2.2 Colapso en la fixture de intolerancias.** Con lactosa+gluten, las
tres parciales de anotación caen a 0/14: el veto desplaza la selección
íntegramente hacia platos sin anotación confirmada. Consecuencia: para el
usuario intolerante hoy no se mide ninguna dimensión humana salvo
densidad. Las anotaciones gluten/lactosa (~236 filas scaffold) son
condición de medibilidad de ese segmento, no refinamiento. El gate cierra
sin conclusiones sobre el segmento intolerante.

**2.3 Caveat de comparabilidad transversal (ratificado).** Las submetricas
con estado parcial solo son comparables verticalmente (engine2 vs su
fixture legacy). No son comparables entre fixtures: la cobertura depende
de seed × legibilidad. Adicionalmente, toda fixture cuyo único
diferenciador legacy sea un campo SIN_TRADUCCION (goal, hambre,
experiencia, weight, activity) es, del lado engine2, otra realización del
mismo espacio de generación que su fixture base — compararlas mediría
varianza de seed, no efecto del campo. Alcance: catálogo y fixtures
actuales de D2.

## 3. Limitaciones conocidas del alcance de D2

**3.1 Control 1b (mutación de seed).** Verifica reproducibilidad del
proceso (seed distinta → artefacto distinto), no autenticidad del
artefacto persistido: no protege contra drift entre el .md/.json en disco
y el HEAD. Registrado como limitación de alcance, sin PR. Si algún día se
necesita cierre con garantías del informe persistido, es otro concern.

**3.2 Reproducibilidad del legacy.** El determinismo del legacy es puro
dado (userId, weekNumber, mes de invocación): el seasonalBonus depende del
month que los call-sites pasan como fecha de pared (buildPlan.js:41,1907).
En D2 no afecta (las fixtures inyectan month), pero toda afirmación futura
de reproducibilidad legacy debe arrastrar el tercer parámetro.

**3.3 Divergencia de claves entre lados.** Días con/sin tilde, time vs
momento, capitalización (conforme a R7 ASCII en engine2). El comparador
D2 la sobrevive porque nunca cruza lados clave a clave; cualquier
herramienta futura que compute deltas por día necesitará normalización
de claves.

## 4. Contexto del motor saliente (auditoría legacy, mismo HEAD)

**4.1** La asimetría freeform (D-014) sigue vigente y cuantificada: 10 de
19 factores de scoring evalúan a 0/omitido para freeform, que además
carga 5 penalizaciones exclusivas (P1-P5). Refuerza el criterio ya
ratificado: engine2 no reproduce esta estructura, y la sesión editorial
da al freeform la legibilidad que en el legacy nunca tuvo.

**4.2** El legacy contiene un sesgo de orden de definición en empates de
score (sort estable + peso por rango: buildPlan.js:2053,2090-2093): el
orden de escritura de los combos determina probabilidad de selección.
Motiva la verificación §5.3 sobre engine2.

## 5. Preguntas abiertas de roadmap (registradas, no bloqueantes del gate)

**5.1 ¿Debe engine2 modular densidad por objetivo del usuario?** Evidencia:
§1.2. Si un plan humano da semanas más densas a volumen, la dimensión está
estructuralmente ausente y no la resuelve la sesión editorial (no depende
de anotación). Si el diseño de esta fase excluye el objetivo, el resultado
es conforme a diseño y esta entrada es la deuda.

**5.2 ¿Debe engine2 modelar el día libre (sábado)?** Evidencia: §1.1.
Engine2 genera plato donde el legacy deliberadamente no genera nada. Si el
sábado libre es decisión de producto que debe sobrevivir la migración, es
un gap de diseño; si era limitación del legacy, es una mejora. Decisión
pendiente de ratificación, con implicación de producto (coordinar el
enunciado con Conversación A si se aborda; la decisión de motor se toma
en B).

**5.3 Neutralidad de orden del catálogo en engine2.** Verificar que el
walk no tiene análogo del sesgo §4.2 (¿es neutral el orden de dishes.json
en la selección?). Verificación pendiente, con cita, antes o durante P2c
restante.

## 6. Condiciones que quedan fuera del cierre

- Lectura de parciales: condicionada a sesión editorial (anchors →
  caprichos → gluten/lactosa ~236 → verdura ~63) e ingesta del catálogo
  confirmado.
- Segmento intolerante: sin conclusiones hasta anotación (§2.2).
- Deudas previas no alteradas por este insumo: MemoryStore inter-semana
  (Fork 2), verificación RLS en Supabase, destino del XLSX en
  scripts/phaseB2/output/ (fleco de working tree), micro-PR de limpieza
  de los 9 archivos vacíos trackeados (deuda menor de repo, sin fase).
