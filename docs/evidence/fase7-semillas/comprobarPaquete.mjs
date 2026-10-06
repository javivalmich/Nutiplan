// Comprueba que cada archivo listado en manifiesto.json existe y tiene el sha256 indicado.
// Uso (desde esta carpeta): node comprobarPaquete.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('manifiesto.json', 'utf8'));
let mal = 0;
for (const [archivo, esperado] of Object.entries(m.archivos)) {
  const real = fs.existsSync(archivo) ? crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex') : 'AUSENTE';
  const ok = real === esperado;
  if (!ok) mal++;
  console.log(`${ok ? 'OK   ' : 'FALLO'} ${archivo}${ok ? '' : `  (esperado ${esperado}, real ${real})`}`);
}
console.log(mal === 0 ? `RESULTADO: OK (${Object.keys(m.archivos).length} archivos)` : `RESULTADO: FALLO (${mal})`);
process.exitCode = mal === 0 ? 0 : 1;
