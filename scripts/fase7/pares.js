// pares — lógica pura del modo pares de la primera Fase 7 (D-091).
//
// Sin I/O, sin importar de los motores, sin Math.random, Date ni entorno.
// Reagrupa la salida de blind() en pares A/B y construye las dos salidas
// (vista del evaluador y clave). La orientación A/B y el orden de los pares
// los determina solo el orden de evaluador.planes[] que devuelve blind().

export const CONTEXTO = 'Los días van del 1 (lunes) al 7 (domingo). En todos los planes se omite la comida del día 6.';

export const DESCRIPCION_PERFIL = Object.freeze({
  P1: 'Objetivo: mantener el peso. Entrena lunes, miércoles y viernes. Sin intolerancias.',
  P2: 'Objetivo: mantener el peso. No entrena. Sin intolerancias.',
});

export const MANIFIESTO_SHA256 = '51e6cbf7c5305447f1ed6e46ca094cbe442740965b3abd8882894bdefe240a98';

export function semillaDeSha(sha) {
  if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error('sha: deben ser exactamente 40 caracteres hexadecimales en minúscula');
  }
  return parseInt(sha.slice(0, 8), 16);
}

export function validarManifiesto(manifiesto) {
  if (manifiesto === null || typeof manifiesto !== 'object') {
    throw new Error('manifiesto: debe ser un objeto');
  }
  const { casos, planes } = manifiesto;
  if (!Array.isArray(casos) || casos.length !== 20) {
    throw new Error('manifiesto.casos: se esperaba un array de exactamente 20 casos');
  }
  if (!Array.isArray(planes)) {
    throw new Error('manifiesto.planes: debe ser un array');
  }

  const casoPorId = {};
  const perfilPorCaso = {};
  const motorPorId = {};
  const archivoPorId = {};
  const cuentaPerfil = {};

  casos.forEach((c, k) => {
    const where = `casos[${k}]`;
    if (c === null || typeof c !== 'object') throw new Error(`${where}: debe ser un objeto`);
    if (typeof c.caso !== 'string' || c.caso.length === 0) throw new Error(`${where}.caso: vacío`);
    if (Object.prototype.hasOwnProperty.call(perfilPorCaso, c.caso)) {
      throw new Error(`${where}.caso: duplicado (${JSON.stringify(c.caso)})`);
    }
    if (c.perfil !== 'P1' && c.perfil !== 'P2') {
      throw new Error(`${where}.perfil: debe ser P1 o P2 (${JSON.stringify(c.perfil)})`);
    }
    perfilPorCaso[c.caso] = c.perfil;
    cuentaPerfil[c.perfil] = (cuentaPerfil[c.perfil] || 0) + 1;

    if (!Array.isArray(c.planes) || c.planes.length !== 2) {
      throw new Error(`${where}.planes: se esperaban exactamente 2 planes`);
    }
    const motores = c.planes.map((p) => p && p.motor).sort();
    if (motores[0] !== 'engine2' || motores[1] !== 'legacy') {
      throw new Error(`${where}.planes: se esperaba un plan legacy y uno engine2`);
    }
    c.planes.forEach((p, j) => {
      const wp = `${where}.planes[${j}]`;
      if (typeof p.id !== 'string' || p.id.length === 0) throw new Error(`${wp}.id: vacío`);
      if (Object.prototype.hasOwnProperty.call(casoPorId, p.id)) {
        throw new Error(`${wp}.id: duplicado (${JSON.stringify(p.id)})`);
      }
      casoPorId[p.id] = c.caso;
      motorPorId[p.id] = p.motor;
      archivoPorId[p.id] = p.archivo;
    });
  });

  if (cuentaPerfil.P1 !== 10 || cuentaPerfil.P2 !== 10) {
    throw new Error('manifiesto.casos: se esperaban exactamente 10 casos P1 y 10 casos P2');
  }

  const idsPlanes = new Set();
  planes.forEach((p, k) => {
    if (p === null || typeof p !== 'object') throw new Error(`planes[${k}]: debe ser un objeto`);
    if (idsPlanes.has(p.id)) throw new Error(`planes[${k}].id: duplicado (${JSON.stringify(p.id)})`);
    idsPlanes.add(p.id);
  });
  const idsCasos = Object.keys(casoPorId);
  if (idsPlanes.size !== idsCasos.length || idsCasos.some((id) => !idsPlanes.has(id))) {
    throw new Error('manifiesto: el conjunto de ids de planes[] no coincide con el de casos[].planes[]');
  }
  planes.forEach((p, k) => {
    if (p.motor !== motorPorId[p.id]) {
      throw new Error(`planes[${k}]: motor distinto del de casos[] para ${JSON.stringify(p.id)}`);
    }
    if (p.archivo !== archivoPorId[p.id]) {
      throw new Error(`planes[${k}]: archivo distinto del de casos[] para ${JSON.stringify(p.id)}`);
    }
  });

  return { casoPorId, perfilPorCaso, motorPorId };
}

export function formarPares(resultadoBlind, casoPorId) {
  const { evaluador, clave } = resultadoBlind;
  const idPorEtiqueta = new Map();
  for (const e of clave.entradas) {
    if (idPorEtiqueta.has(e.etiqueta)) throw new Error(`etiqueta repetida en la clave: ${e.etiqueta}`);
    idPorEtiqueta.set(e.etiqueta, e.id);
  }

  const vistas = new Set();
  const pares = [];
  const abiertos = new Map(); // caso -> par en construcción
  const cerrados = new Set();
  for (const plan of evaluador.planes) {
    if (vistas.has(plan.etiqueta)) throw new Error(`etiqueta repetida en el evaluador: ${plan.etiqueta}`);
    vistas.add(plan.etiqueta);
    if (!idPorEtiqueta.has(plan.etiqueta)) throw new Error(`etiqueta sin id: ${plan.etiqueta}`);
    const id = idPorEtiqueta.get(plan.etiqueta);
    if (!Object.prototype.hasOwnProperty.call(casoPorId, id)) throw new Error(`id sin caso: ${id}`);
    const caso = casoPorId[id];
    if (cerrados.has(caso)) throw new Error(`tercer plan para el caso ${caso}`);
    const entrada = { etiqueta: plan.etiqueta, id, dias: plan.dias };
    const abierto = abiertos.get(caso);
    if (abierto) {
      abierto.B = entrada;
      abiertos.delete(caso);
      cerrados.add(caso);
    } else {
      const par = { caso, A: entrada, B: null };
      abiertos.set(caso, par);
      pares.push(par);
    }
  }
  if (abiertos.size > 0) {
    throw new Error(`par incompleto: ${[...abiertos.keys()].join(', ')}`);
  }
  if (vistas.size !== idPorEtiqueta.size) {
    throw new Error('la clave contiene etiquetas que no aparecen en el evaluador');
  }
  return pares;
}

export function construirSalidas({ pares, perfilPorCaso, motorPorId, sha, seed, manifiestoSha256 }) {
  const evaluador = {
    contexto: CONTEXTO,
    pares: pares.map((p, k) => ({
      par: k + 1,
      perfil: DESCRIPCION_PERFIL[perfilPorCaso[p.caso]],
      A: { etiqueta: p.A.etiqueta, dias: p.A.dias },
      B: { etiqueta: p.B.etiqueta, dias: p.B.dias },
    })),
  };
  const clave = {
    sha,
    seed,
    manifiestoSha256,
    pares: pares.map((p, k) => ({
      par: k + 1,
      caso: p.caso,
      A: { etiqueta: p.A.etiqueta, id: p.A.id, motor: motorPorId[p.A.id] },
      B: { etiqueta: p.B.etiqueta, id: p.B.id, motor: motorPorId[p.B.id] },
    })),
  };
  return { evaluador, clave };
}
