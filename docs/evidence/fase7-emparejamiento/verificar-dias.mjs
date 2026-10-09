// verificar-dias — comprobación de solo lectura sobre el material de la
// primera Fase 7 (generación del 2026-10-06, manifiesto 51e6cbf7…240a98).
//
// Pregunta: en los 40 planes, ¿la posición i (1..7) corresponde al día
// Lunes..Domingo, en ese orden, en ambos motores?
//
// No escribe nada. No modifica ni regenera planes. No ejecuta motores.
// Fuentes de los nombres esperados y de las claves (en 3ccd122):
//   - scripts/fase7/casos.js:63–64 (NOMBRE_DIA de cada motor)
//   - scripts/fase7/casos.js:126 (legacy: days[i].name)
//   - scripts/fase7/casos.js:135 (engine2: days[i].day)
//
// Paradas duras (código de salida 1, sin seguir):
//   - el sha256 del manifiesto no es el esperado
//   - un plan falta o su sha256 no coincide con sha256Plan del manifiesto
//   - el número de planes leídos no es 40
// Un plan sin la clave esperada o con una secuencia distinta se registra
// como FALLO (sin heurísticas ni claves alternativas) y el resultado global
// es negativo.
//
// Uso:
//   node verificar-dias.mjs <directorio de generacion-2001-2010>

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MANIFIESTO_ESPERADO = '51e6cbf7c5305447f1ed6e46ca094cbe442740965b3abd8882894bdefe240a98';
const ESPERADO = {
  legacy: { clave: 'name', dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
  engine2: { clave: 'day', dias: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] },
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function parar(msg) {
  console.error(`PARADA: ${msg}`);
  process.exit(1);
}

const dir = process.argv[2];
if (!dir) parar('uso: node verificar-dias.mjs <directorio de generacion-2001-2010>');

console.log(`node ${process.version}`);
console.log(`directorio: ${path.resolve(dir)}`);

const rutaManifiesto = path.join(dir, 'manifiesto-generacion.json');
if (!fs.existsSync(rutaManifiesto)) parar(`no existe ${rutaManifiesto}`);
const bytesManifiesto = fs.readFileSync(rutaManifiesto);
const shaManifiesto = sha256(bytesManifiesto);
console.log(`manifiesto sha256: ${shaManifiesto}`);
if (shaManifiesto !== MANIFIESTO_ESPERADO) parar('el sha256 del manifiesto no es el esperado');

const manifiesto = JSON.parse(bytesManifiesto.toString('utf8'));
if (!Array.isArray(manifiesto.casos)) parar('manifiesto.casos no es un array');

let leidos = 0;
let ok = 0;
const fallos = [];

for (const caso of manifiesto.casos) {
  for (const p of caso.planes) {
    const esperado = ESPERADO[p.motor];
    if (!esperado) parar(`${p.id}: motor desconocido ${JSON.stringify(p.motor)}`);
    const ruta = path.join(dir, p.archivo);
    if (!fs.existsSync(ruta)) parar(`${p.id}: no existe ${ruta}`);
    const bytes = fs.readFileSync(ruta);
    if (sha256(bytes) !== p.sha256Plan) parar(`${p.id}: sha256 distinto del manifiesto`);
    leidos++;

    const plan = JSON.parse(bytes.toString('utf8'));
    let encontrados;
    if (!Array.isArray(plan.days) || plan.days.length !== 7) {
      encontrados = null;
    } else {
      encontrados = plan.days.map((d) => (d && Object.prototype.hasOwnProperty.call(d, esperado.clave) ? d[esperado.clave] : undefined));
    }
    const coincide = Array.isArray(encontrados)
      && encontrados.length === 7
      && encontrados.every((v, i) => v === esperado.dias[i]);
    if (coincide) {
      ok++;
      console.log(`OK     ${p.id}  days[*].${esperado.clave} = ${JSON.stringify(encontrados)}`);
    } else {
      fallos.push(p.id);
      console.log(`FALLO  ${p.id}  days[*].${esperado.clave} = ${JSON.stringify(encontrados)}  esperado ${JSON.stringify(esperado.dias)}`);
    }
  }
}

if (leidos !== 40) parar(`se leyeron ${leidos} planes, se esperaban 40`);

console.log('');
console.log(`planes leídos: ${leidos}; coinciden: ${ok}; fallos: ${fallos.length}`);
if (fallos.length > 0) {
  console.log(`RESULTADO: NEGATIVO (${fallos.join(', ')})`);
  process.exit(1);
}
console.log('RESULTADO: posición 1..7 = Lunes..Domingo en los 40 planes');
