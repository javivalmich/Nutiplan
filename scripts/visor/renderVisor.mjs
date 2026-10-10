// renderVisor — convierte los datos de datosVisor.mjs en una página HTML autónoma.
//
// Uso:
//   node scripts/visor/renderVisor.mjs <salida.html> <datos.json>[=Título[=nota|nota]] [<datos2.json>=Título=nota|nota ...]
//
// El motor actual (legacy) se toma del primer archivo. De cada archivo se toma
// la versión de engine2 con el título dado; así se comparan versiones del motor
// nuevo (antes / después de un cambio) con las mismas semillas.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , salida, ...fuentes] = process.argv;
if (!salida || fuentes.length === 0) {
  console.error('uso: renderVisor.mjs <salida.html> <datos.json>[=Título[=nota|nota]] [<datos2.json>=Título=nota|nota ...]');
  process.exit(1);
}

const leidos = fuentes.map((f, k) => {
  const [archivo, titulo, notas] = f.split('=');
  return {
    datos: JSON.parse(fs.readFileSync(archivo, 'utf8')),
    titulo: titulo || (k === 0 ? 'Motor nuevo (engine2)' : `Motor nuevo · versión ${k + 1}`),
    notas: notas ? notas.split('|') : [],
  };
});
const base = leidos[0].datos;
for (const { datos } of leidos) {
  if (datos.semanas.length !== base.semanas.length || datos.semanas.some((s, k) => s.semilla !== base.semanas[k].semilla || s.perfil !== base.semanas[k].perfil)) {
    console.error('renderVisor: los archivos no tienen las mismas semanas (semilla y perfil)');
    process.exit(1);
  }
}

const versiones = leidos.map(({ datos, titulo, notas }, k) => ({ clave: `e${k}`, titulo, notas, head: datos.head, variante: datos.variante || null }));
const semanas = base.semanas.map((s, k) => {
  const out = { n: s.n, semilla: s.semilla, perfil: s.perfil, semanaDelUsuario: s.semanaDelUsuario, legacy: s.legacy };
  leidos.forEach(({ datos }, j) => { out[`e${j}`] = datos.semanas[k].engine2; });
  return out;
});
const todo = { head: base.head, generadoEn: base.generadoEn, versiones, semanas };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plantilla = fs.readFileSync(path.join(__dirname, 'visor.template.html'), 'utf8');
const json = JSON.stringify(todo).replace(/</g, '\\u003c');
fs.writeFileSync(salida, plantilla.replace('/*__DATOS__*/null', json));
console.log(`renderVisor: ${salida} (${versiones.length} versiones de engine2)`);
