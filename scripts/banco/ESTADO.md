# Estado de la rama `motor/i0-banco-cantidades` (traspaso, 2026-11-13)

Worktree `C:\Users\javiv\app-comida-motor`, rama `motor/i0-banco-cantidades`, creada desde `main`
`19a300c`. Sin merge a `main`. La sesión de auditoría de seguridad trabaja aparte, en
`C:\Users\javiv\app-comida` (rama `fix/autorizacion-rpc`): no se toca.

## Commits (de más antiguo a más nuevo)

| Commit | Qué hace |
|---|---|
| `c2622e1`, `f6806da` | I-0: banco reproducible (`scripts/banco/`), línea base congelada y tolerancia de 5 g declarada |
| `666d4c1` | El lector entiende «½» y «N½» en cantidades por piezas |
| `1130e4d`, `aeb1639` | La patata por piezas se escribe solo en gramos («Patata (350 g)») |
| `eb3f91b` | El pan del gazpacho suma lo decidido entre sus dos partes |
| `42f6851`, `9ae4a5e` | SIBO: test y corrección de la pasta sin gluten (se escribe con los gramos decididos) |
| `cafc506`, `3238e0c`, `3948650`, `8e9f293` | README del banco: pendientes, notas de medición, test intermitente y deuda del lector compartido |
| `08c05f3` | Scripts de medición versionados en `medicion/` (variantes de mínimos, diagnóstico SIBO) |
| `33abeae`, `1ca217c`, `5c2e1a9` | SIBO: el aceite aromatizado con ajo sustituye al aceite de cocinar; el texto nombra el mismo aceite; pad thai |
| `4a0f8db` | Variante B: lo que la ficha pide por debajo del mínimo queda fijo en la ficha, salvo las masas |
| `dd0c6d4` | Auditoría B: scripts de medición del pescado (sin cambiar reglas) |

## Decisiones de Javi (2026-11-12 y 2026-11-13)

- **Patata:** solo en gramos, sin piezas ni «aprox.» (las piezas quedan desfasadas en el plan compartido).
- **Queso en lonchas:** el cambio de escritura se descartó. Con la variante B queda en «1 loncha».
- **Aceite:** se decide en gramos y se escribe en ml redondeados a 5; es un redondeo dentro de tolerancia.
- **SIBO:**
  - El aceite aromatizado con ajo sustituye al aceite de cocinar: el AOVE o, si no hay, el girasol, incluido «Aceite de sésamo o girasol».
  - Nunca sustituye al aceite de sésamo solo.
  - El texto del plato nombra el mismo aceite que la compra.
- **Mínimos:** variante B (lo que la ficha pide por debajo del mínimo queda fijo en la ficha). Las masas marcadas en la ficha (`masa: true`: crepes de avena y batido de soja) conservan el comportamiento anterior.
  - Consecuencia aceptada: los ingredientes fijados por la ficha, incluidos los que dan nombre al plato, no crecen con el objetivo.
- **D-112:** el borrador está abajo, sin escribir en `DECISIONS.md`.

## Pendientes y de qué dependen

- **D-112 en `DECISIONS.md`:** necesita la autorización de Javi para editar ese archivo.
- **Masa como unidad:** depende de una decisión de Javi. Diseño propuesto: un solo factor para toda la masa, en pasos del ingrediente más grueso (medio factor en las crepes, que llevan 2 huevos; uno entero en el batido, por su plátano). Grupo proteico si lleva algo proteico, y sin mínimos sueltos por ingrediente. Hay que medirlo antes de implementarlo.
- **Huevo de las crepes:** su proporción ya se desvía hoy (huevo/avena 1,77 frente a 2,65 de la ficha). Va ligado a la masa como unidad.
- **Batido:** en el banco solo sale a 1400 kcal (perfil vegano); el caso de 3714 kcal no se ha visto en un plan real.
- **Comprobación independiente del lector:** propuesta, sin implementar (README, «Límites del instrumento»). Necesita la aprobación de Javi.
  - Deuda: el medidor no se ejecuta en la app; el ±5 % solo está garantizado en tests.
- **Auditoría B (pescado):** informe completo en [`medicion/auditoria-pescado.md`](medicion/auditoria-pescado.md). Javi no ha decidido nada todavía. No proponer techos semanales.
  - Con el suelo, la verdura y la legumbre desactivados salen 4,40 por semana: es el peso del catálogo.
  - El 3,54 aparece cuando, sin la verdura, el suelo de legumbre ocupa comidas.
  - Las reglas juntas añaden unos 0,45 sobre la base del catálogo.
  - El suelo de pescado solo actúa en la cena.
  - La regla de verdura diaria enriquece de pescado la comida y bloquea el suelo de legumbre (la legumbre se queda en 0,8 por semana).
  - La sugerencia del sábado cuenta para el suelo sin servirse.
  - Muchos platos de ave tienen la verdura como «desconocida».
  - Las alternativas «ligero» devuelven pescado el 54 % de las veces.
- **Test intermitente** `scripts/fase7/entrega.test.js:639` (tiempo límite de 5 s): ya fallaba en `main` y no se toca.
- **Lint:** 154 problemas que ya estaban en `main`. Ninguno en los archivos tocados por esta rama.

## Borrador de D-112 (texto completo, sin escribir en `DECISIONS.md`)

> **D-112 — 2026-11-13 Raciones: lo que la ficha pide por debajo del mínimo se respeta**
> Decide: Javi. Implementado en `4a0f8db` (rama `motor/i0-banco-cantidades`).
>
> **Contexto.** D-100 fija un «rango humano por ingrediente» (`DECISIONS.md:4254`) sin valores; los valores están en `raciones.js` (`RANGO`, `RANGO_UD`, `RANGO_GRUPO`). `ajustarComida` subía al mínimo todo lo que quedaba por debajo. En 21 fichas hay 12 ingredientes por debajo de su mínimo (más los dos aceites, cuyo «por debajo» es la conversión de 5 ml a 4,6 g). Así, el yogur que va de salsa (20 g) se servía a 125 g, ¼ de aguacate a ½, una clara de rebozar a 2, y a 3714 kcal la cancha del ceviche llegaba a 145 g. Se midió también la variante A (el mínimo pasa a ser lo que pide la ficha) y se descartó: el yogur de salsa llegaba a 420 g.
>
> **Decisión.**
> 1. Si la ficha pide de un ingrediente ajustable menos que el mínimo de su rango, ese ingrediente queda fijo en la cantidad de la ficha: no sube al mínimo ni crece con el objetivo. Su energía cuenta, y el resto del plato se ajusta alrededor.
> 2. Quedan fuera el aceite, lo que añade engine2 (pan, fruta y frutos secos) y las masas de receta marcadas en la ficha (`masa: true`: crepes de avena y batido de soja), que conservan el comportamiento anterior.
> 3. Cada ingrediente fijado así deja en el decision log la causa `cantidad_de_la_ficha`, con la cantidad de la ficha y el mínimo.
> 4. Tests en `minimosFicha.test.js`: 19 fichas a 1434, 2174 y 3714 kcal conservan su cantidad, las dos masas mantienen el comportamiento anterior y la causa queda en el log.
>
> **Resultado medido** (banco, 12 perfiles × 8 semanas): cambian 62 de 2688 comidas. Ningún perfil sale de ±5 % (la vegana de 1400 kcal pasa de 3 a 2 semanas fuera), y la proteína media del día cambia como mucho 0,4 g. Con las masas incluidas habría llegado a 0,6 g, en 142 comidas. La energía va a la patata (+900 g) y al pan (+240 g).
>
> **Pendiente.**
> - **La masa como unidad.** Para conservar la proporción de la receta dentro de ±10 %, la masa tendría que escalar con un solo factor, en pasos del ingrediente más grueso: medio factor en las crepes (1 de sus 2 huevos) y uno entero en el batido (1 plátano). Iría en el grupo proteico si lleva algo proteico, y sin mínimos sueltos por ingrediente. Escalar cada ingrediente con su propio grupo no basta: el huevo/avena de las crepes sale entre 1,12 y 2,27, frente a 2,65 en la ficha.
> - **El huevo de las crepes.** Ya hoy se desvía de la proporción (huevo/avena 1,77 a 1434 kcal, frente a 2,65 en la ficha).
> - **El batido solo se ha visto a 1400 kcal.** En el banco solo aparece en el perfil vegano de 1400 kcal; el caso de 3714 kcal se midió poniéndolo a mano en un día.

## Prohibiciones

- No tocar Supabase, producción, funciones SQL o RPC, RLS, permisos ni el flujo de plan compartido. No desplegar.
- No editar `DECISIONS.md` sin autorización. No hacer merge a `main`.
- Push solo a esta rama; nunca a `main` ni a otras ramas.
- No modificar el worktree de la auditoría de seguridad ni sus documentos. No tocar `scripts/fase7`.
- No usar datos personales ni planes de producción. El banco funciona sin red, sin Supabase y sin variables de entorno (no hay `.env.local` en este worktree).
- No introducir cambios gastronómicos arbitrarios ni relajar restricciones nutricionales para ganar variedad.
- No cambiar objetivos energéticos ni reglas generales de raciones para resolver un problema de presentación.
- Si una corrección requiere una decisión funcional abierta, no implementarla: dejar la propuesta documentada.

## Forma de trabajo

- **Paradas:** se para donde Javi dice («PARA tras el punto N») y se informa. Medir o verificar no autoriza a implementar.
- **Commits:** un commit por cambio. Si es una corrección, primero el test de reproducción, que debe fallar antes del cambio.
- **Línea base:** si un cambio altera los menús, se regenera en el mismo commit (`--guardar`).
  - Medir: `node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs`
  - Guardar: añadir `--guardar` al mismo comando.
- **Mediciones:** antes y después en el banco, con los scripts de `scripts/banco/medicion/`. Las variantes y los contrafactuales se aplican en memoria, sin tocar `src/`.
- **Respuestas:** a cada propuesta de Javi se responde por separado, con los desacuerdos explícitos. Las cifras salen de lo medido, no de lo inferido.
- **Idioma:** español.
