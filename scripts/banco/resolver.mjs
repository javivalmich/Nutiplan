// Permite ejecutar con node los módulos de src/ escritos para Vite:
//   - rutas relativas sin extensión («../data/FREEFORM_COMBOS») → prueba «.js»;
//   - JSON importado sin atributo (src/plan/catalogo.js) → se carga como JSON.
// Uso: node --import ./scripts/banco/resolver.mjs scripts/banco/banco.mjs …
import { register } from 'node:module';

const hooks = `
export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && /^\\.{1,2}\\//.test(especificador) && !/\\.[cm]?js$/.test(especificador)) {
      return siguiente(especificador + '.js', contexto);
    }
    throw err;
  }
}
export async function load(url, contexto, siguiente) {
  if (url.endsWith('.json')) return siguiente(url, { ...contexto, importAttributes: { ...(contexto.importAttributes || {}), type: 'json' } });
  return siguiente(url, contexto);
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
