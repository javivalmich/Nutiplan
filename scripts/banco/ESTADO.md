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
| `4a0f8db` | D-112 (borrador), variante B: lo que la ficha pide por debajo del mínimo queda fijo en la ficha, salvo las masas |
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
- **D-112:** el borrador está en el informe de la sesión, sin escribir en `DECISIONS.md`.

## Pendientes y de qué dependen

- **D-112 en `DECISIONS.md`:** necesita la autorización de Javi para editar ese archivo.
- **Masa como unidad:** depende de una decisión de Javi. Diseño propuesto: un solo factor para toda la masa, en pasos del ingrediente más grueso (medio factor en las crepes, que llevan 2 huevos; uno entero en el batido, por su plátano). Grupo proteico si lleva algo proteico, y sin mínimos sueltos por ingrediente. Hay que medirlo antes de implementarlo.
- **Huevo de las crepes:** su proporción ya se desvía hoy (huevo/avena 1,77 frente a 2,65 de la ficha). Va ligado a la masa como unidad.
- **Batido:** en el banco solo sale a 1400 kcal (perfil vegano); el caso de 3714 kcal no se ha visto en un plan real.
- **Comprobación independiente del lector:** propuesta, sin implementar (README, «Límites del instrumento»). Necesita la aprobación de Javi.
- **Auditoría B (pescado):** informe entregado; Javi no ha decidido nada todavía. No proponer techos semanales.
  - El catálogo da por sí solo unos 3,5 platos de pescado por semana.
  - El suelo de pescado solo actúa en la cena.
  - La regla de verdura diaria enriquece de pescado la comida y bloquea el suelo de legumbre (la legumbre se queda en 0,8 por semana).
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
