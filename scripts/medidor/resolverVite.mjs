// Permite ejecutar con node módulos de src/ escritos para Vite, que importan
// rutas relativas sin extensión («../data/FREEFORM_COMBOS»). Si una ruta
// relativa no se encuentra, prueba con «.js». Uso:
//   node --import ./scripts/medidor/resolverVite.mjs <script>
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
}`;
register('data:text/javascript,' + encodeURIComponent(hooks));
