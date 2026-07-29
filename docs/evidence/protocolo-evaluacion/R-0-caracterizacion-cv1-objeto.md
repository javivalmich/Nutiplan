# R-0 — Caracterización de la relación C v1 ↔ objeto

**Naturaleza:** Reconocimiento estrictamente read-only. Demuestra hasta el borde
del perímetro leído; no decide, no adjudica, no resuelve. Todo enunciado
estructural se ancla a `archivo:línea` contra el HEAD vivo.

**Ancla:** `origin/main @ 71ace2984ee14015c58e8d2aea0f4fc54776a843`
(`asiento: D-077 estatus ii-auto no decidible`). Árbol limpio antes y después.

**Objeto:** exhibir qué caracterización de la relación C v1 ↔ objeto sostiene el
corpus entre las dos en conflicto —[C v1 ↔ proyección] vs. [C v1 ↔ definición
contractual del objeto]—, precondición del asiento de Rama 1 (mediador de ii-med,
puerta §6.1 de Fase 7).

## Perímetro

- **DECISIONS.md:** barrido D-058 → HEAD (append-only; una entrada posterior podía
  tocar o reconciliar la relación). Justificado a posteriori: el hallazgo portante
  (D-075) es posterior a las tres entradas nombradas; un perímetro mínimo lo habría
  perdido.
- **docs/spec/plan-observable.md §4.2:** contrato del objeto aguas arriba.
- **Fuera:** `protocolo-evaluacion.md`. Sin remisión expresa desde §4.2; no se abrió.

## Hallazgos, anclados

**Predicado — uniforme en las tres fuentes.** La relación se enuncia como *no
derivada* en las tres, sin variación de plano:
- `DECISIONS.md:2610` (D-058): «nunca identificadas ni derivadas entre sí».
- `DECISIONS.md:2685` (D-061): «—nunca derivada—».
- `DECISIONS.md:3263` (D-072): «—“nunca derivada”—» (afirmada, sin interrogación).

No hay choque en el predicado.

**Término-destino — divergente.** La divergencia vive exclusivamente en el objeto
de la relación:
- D-058 (`:2610`): «proyección» (`plan-observable.md` §2).
- D-061 (`:2685`) y D-072 (`:3263`): «la definición contractual del objeto»
  (`plan-observable.md` §2/§4).

Ambos destinos anclan en §2. §2 no está en el perímetro leído (B1 cubrió §4.2).

**Contrato del objeto (`plan-observable.md` §4.2, líneas 48–54).** Fija la estructura
de `days` (obligaciones de orden, identificabilidad, colecciones enumerables). No
remite expresamente a `protocolo-evaluacion.md §6/§6.1`. No adjudica entre las dos
caracterizaciones ni fija la co-referencia proyección ↔ definición contractual;
esa relación se ancla en §2, no leído.

**Certificación de incompatibilidad — es aserción de asiento, no exhibición de
fuente.** `DECISIONS.md:3325` (D-075) declara la relación en «divergencia registrada
y no resuelta» y nombra «dos caracterizaciones incompatibles en corpus: C v1 ↔
proyección vs. C v1 ↔ definición contractual del objeto». Pero D-075 se tipifica a
sí misma en `:3315` como «Decisión normativa. Adopta una partición sobre terreno ya
demostrado; no reconoce, no demuestra», y remite su demostración en `:3317` a otro
artefacto —`R-0-observacion-vs-muestreo-ii.md` (sellado en `abb468f`)—, cuyo objeto
es la partición observación/muestreo, no la co-referencia proyección ↔ definición
contractual. En consecuencia: la incompatibilidad entre ambos términos-destino está
**afirmada** por D-075 y **no exhibida** por ninguna fuente primaria del perímetro.
Dos relaciones no-derivadas hacia destinos distintos no son, por sí solas,
lógicamente incompatibles; la incompatibilidad exige que «proyección (§2)» y
«definición contractual del objeto (§2/§4)» co-refieran al mismo lugar como
caracterizaciones rivales, y esa co-referencia no está fijada en el literal leído.

## Estado terminal

De las cuatro situaciones de cierre del reconocimiento —(1) corpus sostiene
proyección; (2) sostiene definición contractual; (3) sostiene ambas de forma
incompatible; (4) no sostiene ninguna limpiamente—, **ninguna encaja como
exhibición del perímetro**. El literal no fuerza (1), (2) ni (4). La (3) está
**declarada por D-075 e infradeterminada por las fuentes primarias**: la co-referencia
de los dos términos-destino queda indeterminada dentro del perímetro B1, por
compartir anclaje en §2, no leído.

Formulación exacta del resultado: *la divergencia C v1 ↔ objeto está declarada por
el corpus (D-075) y no exhibida por las fuentes primarias del perímetro leído.*

## Phantom retirado

La cadena «objeto contractual» (ese orden, forma corta) **NO LOCALIZADA** por grep
literal en todo el perímetro `DECISIONS.md [2599–3348]`. La forma real del corpus es
«definición contractual del objeto» (D-061 `:2685`, D-072 `:3263`, D-075 `:3325`).
El rótulo de handoff «C v1 ↔ objeto contractual [D-061/D-072]» es phantom de rótulo:
el referente está en corpus, la etiqueta corta no. Se retira; el término vinculante
es el expandido.

## Lo que este R-0 NO hace

- No adjudica la co-referencia proyección ↔ definición contractual del objeto:
  requiere abrir `plan-observable.md §2/§4`, fuera de este perímetro, y es acto de
  decisión —materia del asiento de Rama 1—, no de reconocimiento.
- No resuelve la divergencia ni elige caracterización.
- No determina si D-075 leyó correctamente o sobre-leyó la incompatibilidad: lo deja
  como pregunta nítida y acotada para el asiento.
