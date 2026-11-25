// Diseño medido de pescado y legumbres: análisis de los volcados de medirDiseno.mjs (solo lee JSON).
// Uso: node scripts/banco/medicion/analisisDiseno.mjs <análisis> <nombre=archivo.json> [...]
//   reparto    pescados servidos por semana (0 a 7 o más), perfiles con pescado
//   legumbres  comidas de legumbre: clase de plato y especie; tope por especie en la semana
//   vegana     vegana-1400: kcal por toma y por familia de la comida, y desvío según las legumbres
//   familias   platos por familia y semana (perfiles con pescado)
//   texto      comida y cena de cada día, omni-2174, semanas 60 a 62
import fs from 'node:fs';

const [que, ...resto] = process.argv.slice(2);
const V = resto.map((a) => { const i = a.indexOf('='); return [a.slice(0, i), JSON.parse(fs.readFileSync(a.slice(i + 1)))]; });
const SIN_PESCADO = ['sin-pescado-2000', 'vegetariana-2000', 'vegana-1400'];
const conPescado = (d) => d.filas.filter((r) => !SIN_PESCADO.includes(r.perfil));
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pc = (a, b) => (b ? (100 * a / b).toFixed(1) : '—');
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

if (que === 'reparto') {
  console.log('Pescados servidos por semana, % de semanas (9 perfiles con pescado)');
  console.log('variante'.padEnd(12) + [0, 1, 2, 3, 4, 5, 6, '7+'].map((x) => String(x).padStart(7)).join('') + '   media');
  for (const [n, d] of V) {
    const f = conPescado(d);
    const h = Array(8).fill(0);
    for (const r of f) h[Math.min(7, r.pescado)] += 1;
    console.log(n.padEnd(12) + h.map((x) => pc(x, f.length).padStart(7)).join('') + '   ' + media(f.map((r) => r.pescado)).toFixed(2) + `  (n=${f.length}; máx ${Math.max(...f.map((r) => r.pescado))})`);
  }
}

if (que === 'legumbres') {
  // Plato único: plato compuesto de la plantilla «legumbre» sin cereal (legumbre y verdura).
  const clase = (p) => (!p.comp ? 'redactado' : p.c ? 'compuesto con cereal' : 'plato único (legumbre y verdura)');
  for (const [n, d] of V) {
    for (const [g, filas] of [['8 perfiles con pescado y legumbre', conPescado(d).filter((r) => r.perfil !== 'sibo-2000')], ['sin-pescado-2000', d.filas.filter((r) => r.perfil === 'sin-pescado-2000')], ['vegetariana-2000', d.filas.filter((r) => r.perfil === 'vegetariana-2000')], ['vegana-1400', d.filas.filter((r) => r.perfil === 'vegana-1400')]]) {
      const porClase = {}; const porEspecie = {}; const titulos = {}; let total = 0;
      const maxServida = {}; const maxConSug = {}; let semMas2 = 0; let semMas2Sug = 0;
      for (const r of filas) {
        const sem = {}; const semSug = {};
        for (const p of r.platos) {
          if (p.f !== 'legumbre') continue;
          semSug[p.e] = (semSug[p.e] || 0) + 1;
          if (p.libre) continue;
          sem[p.e] = (sem[p.e] || 0) + 1;
          total += 1; porClase[clase(p)] = (porClase[clase(p)] || 0) + 1; porEspecie[p.e] = (porEspecie[p.e] || 0) + 1;
          if (!p.comp) titulos[p.t] = (titulos[p.t] || 0) + 1;
        }
        for (const [e, k] of Object.entries(sem)) maxServida[e] = Math.max(maxServida[e] || 0, k);
        for (const [e, k] of Object.entries(semSug)) maxConSug[e] = Math.max(maxConSug[e] || 0, k);
        if (Object.values(sem).some((k) => k > 2)) semMas2 += 1;
        if (Object.values(semSug).some((k) => k > 2)) semMas2Sug += 1;
      }
      const lista = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${pc(v, total)} %)`).join(' · ');
      console.log(`\n── ${n} · ${g} (${filas.length} semanas): ${total} comidas de legumbre servidas, ${(total / filas.length).toFixed(2)} por semana`);
      console.log(`  clase:   ${lista(porClase)}`);
      console.log(`  especie: ${lista(porEspecie)}`);
      console.log(`  máximo de una especie en una semana, servida: ${JSON.stringify(maxServida)}; contando la sugerencia: ${JSON.stringify(maxConSug)}`);
      console.log(`  semanas con alguna legumbre más de 2 veces: servida ${semMas2}; contando la sugerencia ${semMas2Sug}`);
      const top = Object.entries(titulos).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} (${v})`).join('; ');
      if (top) console.log(`  redactados: ${top}`);
    }
  }
}

if (que === 'vegana') {
  for (const [n, d] of V) {
    const f = d.filas.filter((r) => r.perfil === 'vegana-1400');
    console.log(`\n── ${n} · vegana-1400 (${f.length} semanas): desvío medio ${media(f.map((r) => r.desvio)).toFixed(2)} %, fuera de ±5 %: ${f.filter((r) => !r.dentro).length}, kcal/día ${media(f.map((r) => r.kcalDia)).toFixed(0)}, legumbre/sem ${media(f.map((r) => r.legumbre)).toFixed(2)}`);
    const porToma = {};
    for (const r of f) for (const dia of r.tomas) for (const [t, k] of dia) (porToma[t] = porToma[t] || []).push(k);
    console.log('  kcal medias por toma: ' + Object.entries(porToma).map(([t, xs]) => `${t} ${media(xs).toFixed(0)} (${(xs.length / f.length).toFixed(1)}/sem)`).join(' · '));
    const porFam = {}; const cenaTras = {}; const diaTras = {};
    for (const r of f) for (let i = 0; i < 7; i++) {
      const c = r.platos.find((p) => p.d === i && p.mo === 'C'); const ce = r.platos.find((p) => p.d === i && p.mo === 'N');
      if (!c || c.libre) continue;
      (porFam[c.f] = porFam[c.f] || []).push(c.kcal);
      if (ce) (cenaTras[c.f] = cenaTras[c.f] || []).push(ce.kcal);
      (diaTras[c.f] = diaTras[c.f] || []).push(r.tomas[i].reduce((a, x) => a + x[1], 0));
    }
    for (const k of Object.keys(porFam)) console.log(`  comida de ${k}: ${porFam[k].length} (${(porFam[k].length / f.length).toFixed(2)}/sem), ${media(porFam[k]).toFixed(0)} kcal; cena de ese día ${media(cenaTras[k] || []).toFixed(0)} kcal; día entero ${media(diaTras[k]).toFixed(0)} kcal`);
    const porN = {};
    for (const r of f) (porN[r.legumbre] = porN[r.legumbre] || []).push(r);
    console.log('  por nº de legumbres de la semana: ' + Object.entries(porN).map(([k, xs]) => `${k} → ${xs.length} sem, desvío ${media(xs.map((r) => r.desvio)).toFixed(1)} %, fuera ${xs.filter((r) => !r.dentro).length}`).join(' · '));
    const plato = {};
    for (const r of f) for (const p of r.platos) if (!p.libre && p.mo === 'C') { const x = plato[p.t] = plato[p.t] || { n: 0, k: 0, f: p.f }; x.n += 1; x.k += p.kcal; }
    console.log('  comidas más frecuentes: ' + Object.entries(plato).sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([t, x]) => `${t} [${x.f}] ×${x.n}, ${(x.k / x.n).toFixed(0)} kcal`).join('; '));
  }
}

if (que === 'familias') {
  const FAM = ['pescado', 'marisco', 'ave', 'carne', 'huevo', 'legumbre', 'cereal', 'vegetal'];
  console.log('Platos servidos por semana y familia (9 perfiles con pescado)');
  console.log('variante'.padEnd(14) + 'pesc+mar'.padStart(9) + FAM.map((x) => x.padStart(9)).join('') + '  especies distintas/sem');
  for (const [n, d] of V) {
    const f = conPescado(d);
    const t = {}; let esp = 0;
    for (const r of f) { const s = new Set(); for (const p of r.platos) if (!p.libre) { t[p.f] = (t[p.f] || 0) + 1; if (p.e) s.add(p.e); } esp += s.size; }
    console.log(n.padEnd(14) + (((t.pescado || 0) + (t.marisco || 0)) / f.length).toFixed(2).padStart(9) + FAM.map((x) => ((t[x] || 0) / f.length).toFixed(2).padStart(9)).join('') + '  ' + (esp / f.length).toFixed(1));
  }
}

if (que === 'texto') {
  for (const s of [60, 61, 62]) {
    console.log(`\n════ omni-2174, semana ${s} ════`);
    for (const [n, d] of V) {
      const r = d.filas.find((x) => x.perfil === 'omni-2174' && x.s === s);
      console.log(`\n── ${n}: ${r.pescado} de pescado, ${r.legumbre} de legumbre, ${r.desvio} % kcal, ${r.protDia} g de proteína al día`);
      for (let i = 0; i < 7; i++) {
        const c = r.platos.find((p) => p.d === i && p.mo === 'C'); const ce = r.platos.find((p) => p.d === i && p.mo === 'N');
        const txt = (p) => (p ? `${p.libre ? 'libre (sugerencia: ' + p.t + ')' : p.t} [${p.f}]` : '—');
        console.log(`  ${DIAS[i].padEnd(9)} comida: ${txt(c)}\n  ${''.padEnd(9)} cena:   ${txt(ce)}`);
      }
    }
  }
}
