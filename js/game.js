// Oyun kuralları: gizli kutular (kehanet, mesaj, hazırlık) ve bölüm başarı değerlendirmesi.
// Hem arayüz hem testler bu modülü kullanır; DOM'a bağımlı değildir.
import {
  runCircuit, stateFromAmplitudes, fidelity, probabilities, blochVector, ketLabel,
} from './quantum.js';

// Verilen kübitlerin ölçümünde `bits` dizisini görme olasılığı
export function marginalProb(s, qubits, bits) {
  const p = probabilities(s);
  let sum = 0;
  p.forEach((v, i) => {
    const ok = qubits.every((q, k) => ((i >> (s.n - 1 - q)) & 1) === bits[k]);
    if (ok) sum += v;
  });
  return sum;
}

const bitsOf = (m, len) => Array.from({ length: len }, (_, k) => (m >> (len - 1 - k)) & 1);
const bitStr = (m, len) => m.toString(2).padStart(len, '0');

// Grover kehaneti: yalnızca |m⟩ durumunun fazını çevirir (n = 2).
const groverOps = (m) => {
  const flips = [0, 1].filter((q) => !((m >> (1 - q)) & 1)).map((q) => ({ g: 'X', q }));
  return [...flips, { g: 'CZ', q: 0, q2: 1 }, ...flips];
};

// Işınlanacak durumlar: q0'ı hazırlayan gizli kapılar
const PREPS = [
  { name: '|1⟩', ops: [{ g: 'X', q: 0 }] },
  { name: '|−⟩', ops: [{ g: 'X', q: 0 }, { g: 'H', q: 0 }] },
  { name: '|+i⟩', ops: [{ g: 'H', q: 0 }, { g: 'S', q: 0 }] },
  { name: 'Ry(π/3)Rz(π/4)|0⟩', ops: [{ g: 'RY', q: 0, theta: Math.PI / 3 }, { g: 'RZ', q: 0, theta: Math.PI / 4 }] },
];

function blochOfOps(ops) {
  const s = runCircuit(1, ops.map((o, k) => ({ ...o, col: k })));
  return blochVector(s, 0);
}

export const ORACLES = {
  // Deutsch: q0 girdi x, q1 çıktı y; |x, y⟩ → |x, y ⊕ f(x)⟩
  deutsch: {
    label: 'U_f',
    variants: [
      { name: 'f(x) = 0', goal: 'sabit: q0 = 0', ops: [], expect: 0 },
      { name: 'f(x) = 1', goal: 'sabit: q0 = 0', ops: [{ g: 'X', q: 1 }], expect: 0 },
      { name: 'f(x) = x', goal: 'dengeli: q0 = 1', ops: [{ g: 'CNOT', q: 0, q2: 1 }], expect: 1 },
      { name: 'f(x) = ¬x', goal: 'dengeli: q0 = 1', ops: [{ g: 'CNOT', q: 0, q2: 1 }, { g: 'X', q: 1 }], expect: 1 },
    ],
    score: (s, v) => marginalProb(s, [0], [v.expect]),
  },
  grover: {
    label: 'U_ω',
    variants: [0, 1, 2, 3].map((m) => ({
      name: `ω = ${ketLabel(m, 2)}`, goal: `ölç: ${ketLabel(m, 2)}`, ops: groverOps(m), marked: m,
    })),
    score: (s, v) => marginalProb(s, [0, 1], bitsOf(v.marked, 2)),
  },
  // Bernstein–Vazirani: f(x) = s·x (mod 2); q0,q1 girdi, q2 çıktı
  bv: {
    label: 'U_s',
    variants: [0, 1, 2, 3].map((m) => ({
      name: `s = ${bitStr(m, 2)}`,
      goal: `q0q1 = ${bitStr(m, 2)}`,
      ops: [0, 1].filter((q) => bitsOf(m, 2)[q]).map((q) => ({ g: 'CNOT', q, q2: 2 })),
      secret: m,
    })),
    score: (s, v) => marginalProb(s, [0, 1], bitsOf(v.secret, 2)),
  },
  // Süper yoğun kodlama: Ayşe q0 üzerinde mesajı kodlar (b1 → Z, b2 → X)
  dense: {
    label: 'M',
    rows: [0, 0],
    variants: [0, 1, 2, 3].map((m) => {
      const [b1, b2] = bitsOf(m, 2);
      return {
        name: `mesaj ${bitStr(m, 2)}`,
        goal: `ölç: ${ketLabel(m, 2)}`,
        ops: [...(b2 ? [{ g: 'X', q: 0 }] : []), ...(b1 ? [{ g: 'Z', q: 0 }] : [])],
        message: m,
      };
    }),
    score: (s, v) => marginalProb(s, [0, 1], bitsOf(v.message, 2)),
  },
  // Faz kestirimi: q2 özdurumu |1⟩ olan U = P(2πφ); kutu kontrollü U (q1) ve U² (q0) içerir
  qpe: {
    label: 'U^k',
    variants: [0, 1, 2, 3].map((m) => {
      const phi = m / 4;
      return {
        name: `φ = ${m}/4`,
        goal: `q0q1 = ${bitStr(m, 2)}`,
        ops: [
          { g: 'CP', q: 1, q2: 2, theta: 2 * Math.PI * phi },
          { g: 'CP', q: 0, q2: 2, theta: 4 * Math.PI * phi },
        ],
        phase: m,
      };
    }),
    score: (s, v) => marginalProb(s, [0, 1], bitsOf(v.phase, 2)),
  },
  // Işınlanma: q0 bilinmeyen bir durumda hazırlanır; q2'de aynısı belirmeli
  teleport: {
    label: 'ψ',
    rows: [0, 0],
    variants: PREPS.map((p) => ({ name: `ψ = ${p.name}`, goal: 'q2 = ψ', ops: p.ops, bloch: blochOfOps(p.ops) })),
    score: (s, v) => {
      const b = blochVector(s, 2);
      // saf hedef ile q2'nin indirgenmiş durumu arasındaki benzerlik
      return (1 + b.x * v.bloch.x + b.y * v.bloch.y + b.z * v.bloch.z) / 2;
    },
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

// Kutunun kapladığı satırlar
export function oracleRows(level) {
  const orc = oracleOf(level);
  return orc?.rows ?? [0, level.n - 1];
}

// Bölümün başlangıçta kilitli (oyuncunun silemeyeceği) işlemleri
export function lockedOps(level) {
  if (!level.oracle) return [];
  const [q, q2] = oracleRows(level);
  return [{ g: 'ORACLE', col: level.oracle.col, q, q2, locked: true }];
}

// Kapı bu bölümde bu kübitlere konabilir mi?
export function placementAllowed(level, op) {
  const rows = level.allowedRows?.[op.g];
  if (rows && !rows.includes(op.q)) return false;
  const pairs = level.allowedPairs?.[op.g];
  if (pairs && op.q2 != null) {
    return pairs.some(([a, b]) => (a === op.q && b === op.q2) || (a === op.q2 && b === op.q));
  }
  return true;
}

export function playerGateCount(ops) {
  return ops.filter((o) => !o.locked).length;
}

// Bir bölüm için devreyi değerlendir.
// Dönüş: { score: 0..1, solved, checks: [{ name, goal, ok, value }] }
export function evaluateLevel(level, ops) {
  const n = level.n;
  const orc = oracleOf(level);
  if (!orc) {
    const f = fidelity(runCircuit(n, ops), stateFromAmplitudes(n, level.target));
    return { score: f, solved: f > 0.999, checks: [{ name: 'hedef', ok: f > 0.999, value: f }] };
  }
  const checks = orc.variants.map((v) => {
    const value = orc.score(runCircuit(n, expandOracle(ops, v)), v);
    return { name: v.name, goal: v.goal, ok: value > 0.999, value };
  });
  const score = checks.reduce((a, c) => a + c.value, 0) / checks.length;
  return { score, solved: checks.every((c) => c.ok), checks };
}

export function starsFor(level, ops) {
  const used = playerGateCount(ops);
  return used <= level.par ? 3 : used <= level.par + 2 ? 2 : 1;
}
