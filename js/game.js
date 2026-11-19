// Oyun kuralları: kehanet (oracle) kutuları ve bölüm başarı değerlendirmesi.
// Hem arayüz hem testler bu modülü kullanır; DOM'a bağımlı değildir.
import { runCircuit, stateFromAmplitudes, fidelity, probabilities, zeroState } from './quantum.js';

// Grover kehaneti: yalnızca |m⟩ durumunun fazını çevirir (n = 2).
const groverOps = (m) => {
  const flips = [0, 1].filter((q) => !((m >> (1 - q)) & 1)).map((q) => ({ g: 'X', q }));
  return [...flips, { g: 'CZ', q: 0, q2: 1 }, ...flips];
};

export const ORACLES = {
  // Deutsch: q0 girdi x, q1 çıktı y; |x, y⟩ → |x, y ⊕ f(x)⟩
  deutsch: {
    label: 'U_f',
    variants: [
      { name: 'f(x) = 0', kind: 'sabit', ops: [], expect: 0 },
      { name: 'f(x) = 1', kind: 'sabit', ops: [{ g: 'X', q: 1 }], expect: 0 },
      { name: 'f(x) = x', kind: 'dengeli', ops: [{ g: 'CNOT', q: 0, q2: 1 }], expect: 1 },
      { name: 'f(x) = ¬x', kind: 'dengeli', ops: [{ g: 'CNOT', q: 0, q2: 1 }, { g: 'X', q: 1 }], expect: 1 },
    ],
  },
  grover: {
    label: 'U_ω',
    variants: [0, 1, 2, 3].map((m) => ({
      name: `ω = |${m.toString(2).padStart(2, '0')}⟩`, ops: groverOps(m), marked: m,
    })),
  },
};

// ORACLE işlemini seçilen varyantın alt kapılarıyla değiştir.
// Alt kapılar aynı sütunda, sıralarını korumak için kesirli sütun alır.
export function expandOracle(ops, variant) {
  const out = [];
  for (const op of ops) {
    if (op.g !== 'ORACLE') { out.push(op); continue; }
    if (!variant) continue;
    variant.ops.forEach((sub, k) => out.push({ ...sub, col: op.col + (k + 1) / 100 }));
  }
  return out;
}

export function oracleOf(level) {
  return level.oracle ? ORACLES[level.oracle.kind] : null;
}

// Bölümün başlangıçta kilitli (oyuncunun silemeyeceği) işlemleri
export function lockedOps(level) {
  return level.oracle ? [{ g: 'ORACLE', col: level.oracle.col, locked: true }] : [];
}

export function playerGateCount(ops) {
  return ops.filter((o) => !o.locked).length;
}

function marginal(s, q) {
  const p = probabilities(s);
  const bit = 1 << (s.n - 1 - q);
  let p1 = 0;
  p.forEach((v, i) => { if (i & bit) p1 += v; });
  return p1;
}

// Bir bölüm için devreyi değerlendir.
// Dönüş: { score: 0..1, solved, checks: [{ name, ok, value }] }
export function evaluateLevel(level, ops) {
  const n = level.n;
  const orc = oracleOf(level);
  if (!orc) {
    const f = fidelity(runCircuit(n, ops), stateFromAmplitudes(n, level.target));
    return { score: f, solved: f > 0.999, checks: [{ name: 'hedef', ok: f > 0.999, value: f }] };
  }
  const checks = orc.variants.map((v) => {
    const s = runCircuit(n, expandOracle(ops, v));
    let value;
    if (level.oracle.kind === 'deutsch') {
      const p1 = marginal(s, 0);
      value = v.expect ? p1 : 1 - p1;
    } else {
      const t = zeroState(n); t.re[0] = 0; t.re[v.marked] = 1;
      value = fidelity(s, t);
    }
    return { name: v.name, ok: value > 0.999, value };
  });
  const score = checks.reduce((a, c) => a + c.value, 0) / checks.length;
  return { score, solved: checks.every((c) => c.ok), checks };
}

export function starsFor(level, ops) {
  const used = playerGateCount(ops);
  return used <= level.par ? 3 : used <= level.par + 2 ? 2 : 1;
}
