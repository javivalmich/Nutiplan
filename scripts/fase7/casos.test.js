// Tests de la lógica pura del generador (sin ejecutar motores).
import { describe, it, expect } from 'vitest';
import {
  SEMILLAS_EVALUACION, ESTRATEGIA, PERFILES, PERFIL_BASE_LEGACY, TRADUCCION_PERFIL_BASE, CasoError,
  entradaLegacy, entradaEngine2, verificarEstrategia, verificarDiaLibreLegacy, verificarDiaLibreEngine2,
  verificarDeterminismo, verificarSemillas, listaCasos,
} from './casos.js';

// Semillas de test: nunca las de evaluación.
const S = 1;

const legacyMin = (libreEn = 5) => ({
  strategy: ESTRATEGIA,
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    .map((name, i) => ({ name, special: i === libreEn ? 'libre' : null })),
});
const engine2Min = (log) => ({
  strategy: ESTRATEGIA,
  days: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map((day) => ({ day })),
  decisionLog: log ?? [{ cause: 'cita_fija_libre', consequence: 'beats.Sabado.fixedRole = "libre"' }],
});
const registroOk = (usos = [{ desde: 0, hasta: 999, origen: 'N=1000' }]) => ({
  version: 1, ancla: 'a'.repeat(40), perimetro: 'repo completo', completo: true, usos,
});

describe('casos — definición', () => {
  it('20 casos: 2 perfiles × semillas 1001–1010', () => {
    expect([...SEMILLAS_EVALUACION]).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);
    expect(Object.keys(PERFILES)).toEqual(['P1', 'P2']);
    expect(listaCasos()).toHaveLength(20);
  });

  it('la traducción documenta exactamente todos los campos del perfil base', () => {
    expect(TRADUCCION_PERFIL_BASE.map((t) => t.campo).sort()).toEqual(Object.keys(PERFIL_BASE_LEGACY).sort());
  });
});

describe('casos — entradas nativas', () => {
  it('legacy P1: perfil base + entreno con nombres de legacy', () => {
    const e = entradaLegacy('P1', S);
    expect(e.profile).toEqual({ ...PERFIL_BASE_LEGACY, trainingDays: ['Lunes', 'Miércoles', 'Viernes'] });
    expect(e.targetKcal).toBe(2000);
    expect(e.opts).toEqual({ month: 5, weekNumber: 23, pastProteins: {}, freeFormPool: [] });
    expect(e.semilla).toBe(S);
  });
  it('legacy P2: sin entreno', () => {
    expect(entradaLegacy('P2', S).profile.trainingDays).toEqual([]);
  });
  it('engine2 P1: entreno con nombres de engine2, misma semilla y estrategia', () => {
    expect(entradaEngine2('P1', S)).toEqual({ profile: { trainingDays: ['Lunes', 'Miercoles', 'Viernes'] }, seed: S, strategy: ESTRATEGIA });
  });
  it('las entradas no comparten referencias con las constantes', () => {
    const e = entradaLegacy('P1', S);
    e.profile.intolerances.push('x');
    expect(PERFIL_BASE_LEGACY.intolerances).toEqual([]);
  });
  it('perfil desconocido: error', () => {
    expect(() => entradaLegacy('P3', S)).toThrow(CasoError);
  });
});

describe('casos — verificaciones', () => {
  it('estrategia', () => {
    expect(() => verificarEstrategia({ strategy: ESTRATEGIA }, 'x')).not.toThrow();
    expect(() => verificarEstrategia({ strategy: 'otra' }, 'x')).toThrow(/estrategia/);
  });
  it('día libre legacy: pasa solo con el día 6 como único libre', () => {
    expect(() => verificarDiaLibreLegacy(legacyMin())).not.toThrow();
    expect(() => verificarDiaLibreLegacy(legacyMin(2))).toThrow(/día libre/);
    const dos = legacyMin();
    dos.days[1].special = 'libre';
    expect(() => verificarDiaLibreLegacy(dos)).toThrow(/día libre/);
  });
  it('día libre engine2: pasa solo con cita_fija_libre única en el sábado', () => {
    expect(() => verificarDiaLibreEngine2(engine2Min())).not.toThrow();
    expect(() => verificarDiaLibreEngine2(engine2Min([]))).toThrow(/día libre/);
    expect(() => verificarDiaLibreEngine2(engine2Min([{ cause: 'cita_fija_libre', consequence: 'beats.Jueves.fixedRole = "libre"' }]))).toThrow(/día libre/);
    const malDia = engine2Min();
    malDia.days[5].day = 'Domingo';
    expect(() => verificarDiaLibreEngine2(malDia)).toThrow(/día 6/);
  });
  it('determinismo', () => {
    expect(() => verificarDeterminismo({ a: 1 }, { a: 1 }, 'x')).not.toThrow();
    expect(() => verificarDeterminismo({ a: 1 }, { a: 2 }, 'x')).toThrow(/vistas distintas/);
  });
});

describe('casos — semillas contra registro', () => {
  it('pasa con registro completo y sin solapamiento', () => {
    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk())).not.toThrow();
  });
  it('falla si alguna semilla está registrada como usada', () => {
    expect(() => verificarSemillas([...SEMILLAS_EVALUACION], registroOk([{ desde: 1005, hasta: 1005, origen: 'prueba X' }]))).toThrow(/1005 ya usada: prueba X/);
  });
  it('falla sin registro, sin ancla, sin perímetro o sin declararse completo', () => {
    expect(() => verificarSemillas([1001], undefined)).toThrow(/ausente/);
    expect(() => verificarSemillas([1001], { ...registroOk(), ancla: 'abc' })).toThrow(/ancla/);
    expect(() => verificarSemillas([1001], { ...registroOk(), perimetro: ' ' })).toThrow(/perímetro/);
    expect(() => verificarSemillas([1001], { ...registroOk(), completo: false })).toThrow(/completo/);
  });
  it('falla con usos mal formados', () => {
    expect(() => verificarSemillas([1001], registroOk([{ desde: 5, hasta: 1, origen: 'x' }]))).toThrow(/mal formado/);
    expect(() => verificarSemillas([1001], registroOk([{ desde: 1, hasta: 2 }]))).toThrow(/mal formado/);
  });
});
