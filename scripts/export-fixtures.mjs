// Qiskit çapraz doğrulaması için test verisi üretir.
// Her kayıt: devrenin OpenQASM 2 ve 3 hali + Dolanık simülatörünün hesapladığı genlikler.
// Kullanım: node scripts/export-fixtures.mjs > fixtures.json
import { runCircuit } from '../js/quantum.js';
import { toQasm } from '../js/qasm.js';
import { LEVELS } from '../js/levels.js';
import { expandOracle, lockedOps, oracleOf } from '../js/game.js';
import { solutionOps } from '../tests/solutions.mjs';
import { runNoisy, CHANNELS } from '../js/noise.js';

const out = [];
const add = (name, n, ops) => {
  const s = runCircuit(n, ops);
  out.push({
    name, n,
    qasm2: toQasm(n, ops, { version: 2, measure: false }),
    qasm3: toQasm(n, ops, { version: 3, measure: false }),
    amps: Array.from(s.re, (r, i) => [r, s.im[i]]),
  });
};

for (const lv of LEVELS) {
  const ops = [...lockedOps(lv), ...solutionOps(lv.id)];
  const orc = oracleOf(lv);
  if (!orc) add(`bölüm:${lv.id}`, lv.n, ops);
  else orc.variants.forEach((v) => add(`bölüm:${lv.id}:${v.name}`, lv.n, expandOracle(ops, v)));
}

// Tohumlu rastgele devreler (mulberry32) — her çalıştırmada aynı
let seed = 20261119;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ONE = ['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ'];
const TWO = ['CNOT', 'CZ', 'SWAP', 'CP'];
const randomCircuits = [];
for (let k = 0; k < 60; k++) {
  const n = 1 + Math.floor(rnd() * 4);
  const len = 5 + Math.floor(rnd() * 25);
  const ops = [];
  for (let c = 0; c < len; c++) {
    if (n > 1 && rnd() < 0.35) {
      const q = Math.floor(rnd() * n);
      let q2 = Math.floor(rnd() * (n - 1));
      if (q2 >= q) q2++;
      const g = TWO[Math.floor(rnd() * TWO.length)];
      ops.push({ g, q, q2, col: c, ...(g === 'CP' ? { theta: Math.round(rnd() * 16 - 8) * Math.PI / 8 } : {}) });
    } else {
      const g = ONE[Math.floor(rnd() * ONE.length)];
      const op = { g, q: Math.floor(rnd() * n), col: c };
      // yarısı π/24 katı (okunaklı), yarısı keyfi açı
      if (g.startsWith('R')) op.theta = rnd() < 0.5 ? Math.round(rnd() * 48 - 24) * Math.PI / 24 : rnd() * 8 - 4;
      ops.push(op);
    }
  }
  add(`rastgele:${k}`, n, ops);
  randomCircuits.push({ n, ops });
}

// Gürültülü devreler: ilk 24 rastgele devre × 3 kanal (QASM 3: swap ve cp yerel kapı)
const noisy = [];
const kinds = Object.keys(CHANNELS);
randomCircuits.slice(0, 24).forEach(({ n, ops }, k) => {
  const kind = kinds[k % kinds.length];
  const p = 0.02 + 0.03 * (k % 5);
  const r = runNoisy(n, ops, { kind, p });
  noisy.push({
    name: `gürültü:${kind}:${k}`, n, kind, p,
    qasm3: toQasm(n, ops, { version: 3, measure: false }),
    rho: Array.from(r.re, (x, i) => [x, r.im[i]]),
  });
});

process.stdout.write(JSON.stringify({ pure: out, noisy }, null, 1));
