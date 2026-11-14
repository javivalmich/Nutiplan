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
| `2bc9c61` | `DECISIONS.md`: D-112 (mínimos de la ficha) y D-113 (SIBO, aceite aromatizado) |
| `8af6b7d` | `ESTADO.md` al día y scripts del diseño medido de pescado y legumbres |
| `47705c1` | S: la sugerencia de la comida libre no es consumo (`runWalk.js`, test `runWalk.sugerencia.test.js`, línea base regenerada) |
| `fe1367e` | Ñoquis con espinacas y requesón: el texto nombra cada ingrediente con su cantidad (test `noquisTexto.test.js`) |
| `2b40664` | `DECISIONS.md`: D-114 (la sugerencia de la comida libre no es consumo) |
| `e2eaf89` | Bm: no repetir familia proteica en días seguidos (`runWalk.js`, `bases.js`, test `runWalk.familia.test.js`, línea base regenerada) |
| `c22367a` | Bm, red de seguridad: el walk se repite sin el filtro de familia antes de fallar |
| `12c3aff` | Bm en las alternativas (`alternativa.js`) |
| el siguiente a `12c3aff` | `DECISIONS.md`: D-115; barrido de fichas con una cifra para dos ingredientes |

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
- **D-112 y D-113:** escritas en `DECISIONS.md` (`2bc9c61`). En D-112, la variante con las masas incluidas cambia 139 comidas (el borrador decía 142).
- **Pescado y legumbres (2026-11-13):**
  - **S, aprobada e implementada:** la sugerencia de la comida libre del sábado no sube los contadores de los suelos ni marca la verdura del día. Sigue contando para no repetir plato.
    - Además, el paso 4 no la dirige (así se midió); sigue contando para el tope y la separación por especie.
    - El motor con S da los mismos menús que la variante medida en memoria (2400 semanas idénticas). `--cf=sinS` reproduce la línea anterior.
    - Asiento: D-114.
  - **Bm, aprobada e implementada:** una familia proteica que sale el día anterior o el siguiente no se repite; pescado y marisco son una sola familia. Solo omnívoros. Si dejaría el hueco sin candidatos no se aplica, y queda en la evidencia del hueco.
    - No mira la comida y la cena del mismo día. La sugerencia del sábado ni se filtra ni cuenta como vecina. El ancla no pasa por el filtro (la coloca `expandWeekArc.js` antes del walk).
    - El motor con Bm da los mismos menús que la variante medida en memoria (2400 semanas idénticas). `--cf=sinBm` la deshace.
    - Red de seguridad (`c22367a`): si el walk se queda sin platos en un hueco posterior, se repite entero sin el filtro y lo dice en el log (`familia_dias_seguidos_retirada`). No se activa en las 2400 semanas del banco.
    - También en las alternativas (`12c3aff`), salvo cuando el plato que se quita era del ancla.
    - Asiento: D-115 (extiende D-099.3.e).
    - Ampliarla al mismo día está medido y sin implementar (pescado 3,87 por semana, el 82 % de las semanas en 4).
  - **A** (en la comida, los suelos antes que la verdura): sin implementar.

## Pendientes y de qué dependen

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
- **Diseño medido de pescado y legumbres** (200 semanas por perfil, en memoria; scripts `contrafactualesDiseno.mjs`, `medirDiseno.mjs`, `resumenDiseno.mjs`, `analisisDiseno.mjs` y `verduraDesconocida.mjs`). Cifras de los 9 perfiles con pescado:
  - Línea actual: 4,91 pescados y 0,97 legumbres por semana. En bloques de 72 semanas va de 4,74 a 5,13: con ese tamaño, menos de 0,3 de diferencia es ruido.
  - Azar puro sobre el catálogo: 4,11. Con el tope y la separación por especie, 4,84: el ave baja de 3,82 a 2,75 platos por semana.
  - El 4,40 de la auditoría se reproduce (4,41), pero no es el peso del catálogo.
  - A: legumbre 2,72, pescado 4,33, ningún día sin verdura fuera del sábado. Con el suelo de legumbre en 2: legumbre 2,02 y pescado 4,70 (A+S).
  - B con la definición del README deja rachas (pescado y marisco se alternan). Con Bm la racha máxima es de 2 días y el pescado baja a 4,42.
  - S: los días sin verdura (0,64 por semana, todos sábados) pasan a 0.
  - Verdura «desconocida»: 63 de 235 platos (16 de ave, los 9 de cereal).
  - Pendiente de decidir: A y el suelo de legumbre (A, sin implementar por decisión de Javi). No proponer techos semanales.
- **Estructura de la comida y legumbre (2026-11-14):** medido y sin implementar. Informe, scripts y borradores de asientos en [`medicion/estructura-comida.md`](medicion/estructura-comida.md).
  - La legumbre de primero con un segundo de proteína (regla de Javi de octubre, sin asiento) cubre la proteína: las comidas y cenas cortas bajan de 3,08 a 1,82 por semana.
  - Los días de legumbre se sortean con la semilla; modifica D-024. Con 3 días, legumbre 2,95 por semana.
  - Pendiente de Javi: suelo 2 o 3, segundo con o sin pescado, los platos redactados de legumbre y el domingo.
- **Fichas con una cifra para dos ingredientes** (`medicion/barridoCifraCompartida.mjs`, 183 fichas, solo `p1` y `p2`): queda 1 como los ñoquis, sin corregir: «Crema de calabacín y espinacas con quinoa y semillas» («espinacas y patata (100g)»). Otros 34 tramos nombran dos ingredientes pero la cifra es de uno solo y se reescribe bien.
- **Perfiles de 2600 y 3714 kcal:** quedan un 2,4 % por debajo de su objetivo de media, con las raciones en el techo. De ahí salen casi todas las semanas fuera de ±5 % (12 de 1800 con Bm). Es anterior a S y a Bm.
- **Test intermitente** `scripts/fase7/entrega.test.js:639` (tiempo límite de 5 s): ya fallaba en `main` y no se toca.
- **Lint:** 154 problemas que ya estaban en `main`. Ninguno en los archivos tocados por esta rama.

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
