# Auditoría B: qué causa el exceso de pescado (2026-11-13)

Solo medición: no se ha cambiado ninguna regla. Muestra: los 9 perfiles del banco que comen pescado,
8 semanas cada uno (72 semanas). Pescado incluye marisco, igual que en el banco.

Scripts (en esta carpeta):
- `auditoriaPescado.mjs`: recuento por semana, momento y racha.
- `contrafactualesPescado.mjs`: hook que instrumenta `runWalk.js` y, con `--sin=…`, desactiva reglas en memoria.
- `auditoriaPescadoDetalle.mjs`: candidatos por etapa del walk, causas del paso 4, catálogo y alternativas.

```
node --import ./scripts/banco/resolver.mjs --import ./scripts/banco/medicion/contrafactualesPescado.mjs \
  scripts/banco/medicion/auditoriaPescado.mjs [--sin=suelo,legumbre,separacion,tope,verdura,prefA]
```

## Situación actual

- **Volumen:** 4,85 platos de pescado por semana (1,93 en comida y 2,92 en cena), con un suelo de 3.
- **Semanas altas:** 41 de 72 tienen 5 o más.
- **Rachas:** 8 semanas tienen rachas de 5 o 6 días seguidos.

## Contrafactuales (cada regla desactivada en memoria)

| Desactivada | Pescado/semana | Semanas con ≥ 5 | Semanas con racha ≥ 5 |
|---|---|---|---|
| Ninguna | 4,85 | 41 | 8 |
| Suelo de pescado | 4,26 | 31 | 4 |
| Verdura diaria | 4,67 | 34 | 4 |
| Suelo y verdura | 3,54 | 20 | 1 |
| Suelo, verdura y legumbre | 4,40 | 34 | 1 |
| Separación por especie | 4,69 | 37 | 7 |
| Tope por proteína | 4,69 | 39 | 8 |
| Preferencia A (tipo de plato) | 4,82 | 39 | 8 |
| Suelo de legumbre | 4,85 | 42 | 8 |

## Hallazgos

1. **Peso del catálogo.**
   - Con el suelo, la verdura y la legumbre desactivados salen 4,40 platos por semana: es lo que da el catálogo por sí solo.
   - El 3,54 aparece cuando, sin la verdura, el suelo de legumbre sí ocupa comidas y desplaza pescado.
   - Las reglas juntas añaden unos 0,45 por semana sobre la base del catálogo (4,85 frente a 4,40).
   - El 35 % de las comidas y el 27 % de las cenas del catálogo omnívoro filtrado son pescado; con SIBO, el 42 % y el 30 %.
2. **El suelo semanal solo actúa en la cena.**
   - De los 993 huecos que elige el walk, 494 caen en el nivel de verdura, que se evalúa antes que los suelos y casi siempre gana en la comida, porque el día aún no tiene verdura.
   - El suelo de pescado se atendió 109 veces, todas en cena. Por eso la cena tiene más pescado que la comida (2,92 frente a 1,93).
3. **La verdura diaria enriquece de pescado la comida.**
   - El 76 % de las comidas de pescado del catálogo cubren la verdura del día, frente al 66 % de las de ave y el 61 % de las de legumbre.
   - Las de cereal no la cubren nunca, y muchas de ave tienen la verdura como «desconocida».
   - En el nivel de verdura, el pescado pasa del 26 % de los candidatos al 32 %.
   - Entre los huecos de pescado servidos, la verdura es la causa del 38 %, el suelo del 31 % y el azar entre candidatos equivalentes del 27 %.
4. **El suelo de legumbre casi nunca llega a actuar.**
   - En la comida lo bloquea la verdura: se atendió 1 vez en 72 semanas.
   - En la cena no hay legumbres que elegir, y en 249 huecos se cae a «frecuencia corta sin candidato», con elección al azar. Así, la legumbre se queda en 0,8 por semana.
5. **Las rachas de 5 o 6 días son 8, y 7 empiezan el lunes.** Las produce una combinación de tres reglas:
   - el suelo, corto desde el lunes, pone pescado en la cena con un día de descanso;
   - la verdura pone pescado en las comidas de los días intermedios (en el nivel final, entre un 18 % y un 57 % de pescado);
   - el azar en la cena lo pone cuando la legumbre se queda sin candidato.

   No hay ningún caso de falta de candidatos: salvo cuando lo pedía el suelo, el pescado siempre estaba en minoría en el nivel final.
6. **Las demás reglas pesan poco.**
   - La separación por especie y el tope semanal por proteína suben algo el pescado al descartar carnes y aves repetidas; quitar cualquiera de los dos baja 0,16 por semana.
   - La preferencia A apenas influye.
   - La sugerencia del sábado cuenta para el suelo aunque no se sirva. Cuando es pescado se sirven 4,42 de media, frente a 5,09 cuando no lo es, y el suelo puede cumplirse con solo 2 servidos.
7. **Alternativas** (semana 60):
   - Con el deseo «ligero», el 35 % de las alternativas son pescado.
   - Si se cambia un plato de pescado, vuelve a salir pescado el 54 % de las veces con «ligero», el 41 % con «rápido» y el 37 % con «sorpréndeme».

Javi no ha decidido nada sobre esta auditoría. No se proponen techos semanales.
