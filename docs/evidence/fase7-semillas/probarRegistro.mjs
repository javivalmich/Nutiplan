// Prueba el registro con el contrato real del generador: verificarSemillas de <repo>/scripts/fase7/casos.js.
// Uso: node probarRegistro.mjs <repo> <registro-semillas.json>
// Debe imprimir: SEMILLAS_EVALUACION = 2001..2010; ACEPTA para la ventana; RECHAZA para 1001..1010 (y el origen del uso).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [repo, registroPath] = process.argv.slice(2);
const { verificarSemillas, SEMILLAS_EVALUACION } = await import(pathToFileURL(path.join(repo, 'scripts', 'fase7', 'casos.js')).href);
const registro = JSON.parse(fs.readFileSync(registroPath, 'utf8'));
const intento = (nombre, semillas) => {
  try { verificarSemillas(semillas, registro); console.log(`${nombre}: ACEPTA`); return 'ACEPTA'; }
  catch (e) { console.log(`${nombre}: RECHAZA — ${e.message}`); return 'RECHAZA'; }
};
console.log(`SEMILLAS_EVALUACION = ${[...SEMILLAS_EVALUACION].join(',')}`);
const a = intento('ventana (SEMILLAS_EVALUACION)', [...SEMILLAS_EVALUACION]);
const b = intento('1001..1010', Array.from({ length: 10 }, (_, i) => 1001 + i));
const ok = a === 'ACEPTA' && b === 'RECHAZA' && [...SEMILLAS_EVALUACION].join(',') === '2001,2002,2003,2004,2005,2006,2007,2008,2009,2010';
console.log(ok ? 'RESULTADO: OK' : 'RESULTADO: FALLO');
process.exitCode = ok ? 0 : 1;
