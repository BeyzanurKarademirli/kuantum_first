// Dolanık — küçük ama gerçek bir kuantum durum-vektörü simülatörü.
// Kübit 0 ket gösteriminde en soldaki bittir: |q0 q1 q2 ...⟩
// Bağımlılık yok; hem tarayıcıda hem Node'da (testler) çalışır.

const S2 = Math.SQRT1_2;

// 2x2 matrisler: [m00, m01, m10, m11], her eleman [re, im]
export const MATRICES = {
  H: [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]],
  X: [[0, 0], [1, 0], [1, 0], [0, 0]],
  Y: [[0, 0], [0, -1], [0, 1], [0, 0]],
  Z: [[1, 0], [0, 0], [0, 0], [-1, 0]],
  S: [[1, 0], [0, 0], [0, 0], [0, 1]],
  T: [[1, 0], [0, 0], [0, 0], [S2, S2]],
};

// Kapı tanımları (arayüz de bunları kullanır)
export const GATES = {
  H: { arity: 1, label: 'H', name: 'Hadamard', desc: '|0⟩ ve |1⟩ arasında eşit süperpozisyon kurar. İki kez uygularsan geri döner.' },
  X: { arity: 1, label: 'X', name: 'Pauli-X (NOT)', desc: 'Biti çevirir: |0⟩ ↔ |1⟩. Bloch küresinde X ekseni etrafında 180°.' },
  Y: { arity: 1, label: 'Y', name: 'Pauli-Y', desc: 'Biti çevirir ve faz ekler. Y ekseni etrafında 180°.' },
  Z: { arity: 1, label: 'Z', name: 'Pauli-Z', desc: '|1⟩ bileşeninin işaretini çevirir (faz 180°). Olasılıklar değişmez!' },
  S: { arity: 1, label: 'S', name: 'S (faz 90°)', desc: '|1⟩ bileşenine i çarpanı ekler. Z ekseni etrafında çeyrek tur.' },
  T: { arity: 1, label: 'T', name: 'T (faz 45°)', desc: '|1⟩ bileşenine e^{iπ/4} ekler. Sekizde bir tur.' },
  CNOT: { arity: 2, label: '⊕', name: 'CNOT', desc: 'Kontrol kübiti |1⟩ ise hedefi çevirir. Dolanıklığın anahtarı. Önce kontrolü, sonra aynı sütunda hedefi seç.' },
  CZ: { arity: 2, label: 'CZ', name: 'Kontrollü-Z', desc: 'İki kübit de |1⟩ ise faz −1 ekler. Simetriktir.' },
  SWAP: { arity: 2, label: '×', name: 'SWAP', desc: 'İki kübitin durumlarını takas eder.' },
  RX: { arity: 1, param: true, label: 'Rx', name: 'Rx(θ)', desc: 'Bloch küresinde X ekseni etrafında θ kadar döndürür. Açıyı yandaki listeden seç.' },
  RY: { arity: 1, param: true, label: 'Ry', name: 'Ry(θ)', desc: 'Y ekseni etrafında θ kadar döndürür. Genlikler gerçek kalır; olasılığı istediğin oranda ayarlamanın yolu.' },
  RZ: { arity: 1, param: true, label: 'Rz', name: 'Rz(θ)', desc: 'Z ekseni etrafında θ kadar döndürür: yalnızca göreli fazı değiştirir.' },
};

// Döndürme matrisleri: R(θ) = exp(−iθσ/2)
export function rotationMatrix(g, theta) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  switch (g) {
    case 'RX': return [[c, 0], [0, -s], [0, -s], [c, 0]];
    case 'RY': return [[c, 0], [-s, 0], [s, 0], [c, 0]];
    case 'RZ': return [[c, -s], [0, 0], [0, 0], [c, s]];
    default: throw new Error(`Döndürme kapısı değil: ${g}`);
  }
}

// Arayüzde sunulan açılar (radyan); π/24'ün katları okunaklı yazılır.
export const ANGLES = [1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, -1 / 4, -1 / 2].map((k) => k * Math.PI);

function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }

// θ'yı "π/4", "−2π/3" gibi yaz; π/24'ün katı değilse ondalık.
export function angleLabel(theta, { ascii = false } = {}) {
  const k = Math.round((theta / Math.PI) * 24);
  const pi = ascii ? 'pi' : 'π';
  const minus = ascii ? '-' : '−';
  if (Math.abs(k * Math.PI / 24 - theta) > 1e-9) return ascii ? `${+theta.toPrecision(15)}` : theta.toFixed(3);
  if (k === 0) return '0';
  const g = gcd(Math.abs(k), 24);
  const num = Math.abs(k) / g, den = 24 / g;
  const sign = k < 0 ? minus : '';
  const top = num === 1 ? pi : ascii ? `${num}*${pi}` : `${num}${pi}`;
  return `${sign}${top}${den === 1 ? '' : `/${den}`}`;
}

export function zeroState(n) {
  const N = 1 << n;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  re[0] = 1;
  return { n, re, im };
}

export function cloneState(s) {
  return { n: s.n, re: Float64Array.from(s.re), im: Float64Array.from(s.im) };
}

export function stateFromAmplitudes(n, amps) {
  const N = 1 << n;
  if (amps.length !== N) throw new Error(`${N} genlik bekleniyordu, ${amps.length} geldi`);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  let norm = 0;
  amps.forEach((a, i) => {
    const [r, m] = typeof a === 'number' ? [a, 0] : a;
    re[i] = r; im[i] = m; norm += r * r + m * m;
  });
  if (norm === 0) throw new Error('Sıfır vektör normalize edilemez');
  const k = 1 / Math.sqrt(norm);
  for (let i = 0; i < N; i++) { re[i] *= k; im[i] *= k; }
  return { n, re, im };
}

const bitOf = (n, q) => 1 << (n - 1 - q);

// Tek kübitlik matris uygula; ctrlMask verilirse yalnız kontrol bitleri 1 olan alt uzayda.
export function applyMatrix(s, q, m, ctrlMask = 0) {
  const bit = bitOf(s.n, q);
  const N = s.re.length;
  const { re, im } = s;
  const [[ar, ai], [br, bi], [cr, ci], [dr, di]] = m;
  for (let i = 0; i < N; i++) {
    if (i & bit) continue;
    if ((i & ctrlMask) !== ctrlMask) continue;
    const j = i | bit;
    const xr = re[i], xi = im[i], yr = re[j], yi = im[j];
    re[i] = ar * xr - ai * xi + br * yr - bi * yi;
    im[i] = ar * xi + ai * xr + br * yi + bi * yr;
    re[j] = cr * xr - ci * xi + dr * yr - di * yi;
    im[j] = cr * xi + ci * xr + dr * yi + di * yr;
  }
  return s;
}

export function applySwap(s, a, b) {
  const ba = bitOf(s.n, a), bb = bitOf(s.n, b);
  const { re, im } = s;
  for (let i = 0; i < re.length; i++) {
    if ((i & ba) && !(i & bb)) {
      const j = (i & ~ba) | bb;
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  return s;
}

// op: { g, q, q2?, col }
export function applyOp(s, op) {
  switch (op.g) {
    case 'CNOT': return applyMatrix(s, op.q2, MATRICES.X, bitOf(s.n, op.q));
    case 'CZ': return applyMatrix(s, op.q2, MATRICES.Z, bitOf(s.n, op.q));
    case 'SWAP': return applySwap(s, op.q, op.q2);
    case 'RX': case 'RY': case 'RZ':
      if (typeof op.theta !== 'number' || !Number.isFinite(op.theta)) throw new Error(`${op.g} için açı gerekli`);
      return applyMatrix(s, op.q, rotationMatrix(op.g, op.theta));
    default: {
      const m = MATRICES[op.g];
      if (!m) throw new Error(`Bilinmeyen kapı: ${op.g}`);
      return applyMatrix(s, op.q, m);
    }
  }
}

export function sortOps(ops) {
  return [...ops].sort((a, b) => (a.col - b.col) || (a.q - b.q));
}

export function runCircuit(n, ops, upToCol = Infinity) {
  const s = zeroState(n);
  for (const op of sortOps(ops)) {
    if (op.col > upToCol) break;
    applyOp(s, op);
  }
  return s;
}

export function probabilities(s) {
  return Array.from(s.re, (r, i) => r * r + s.im[i] * s.im[i]);
}

// |⟨a|b⟩|² — global fazı önemsemez
export function fidelity(a, b) {
  let r = 0, m = 0;
  for (let i = 0; i < a.re.length; i++) {
    // conj(a) * b
    r += a.re[i] * b.re[i] + a.im[i] * b.im[i];
    m += a.re[i] * b.im[i] - a.im[i] * b.re[i];
  }
  return r * r + m * m;
}

// Kübit q'nun indirgenmiş yoğunluk matrisinden Bloch vektörü.
// |v| < 1 ise kübit diğerleriyle dolanıktır (ya da karışık durumdadır).
export function blochVector(s, q) {
  const bit = bitOf(s.n, q);
  let p0 = 0, p1 = 0, rr = 0, ri = 0; // rho01 = Σ a0 * conj(a1)
  for (let i = 0; i < s.re.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const ar = s.re[i], ai = s.im[i], br = s.re[j], bi = s.im[j];
    p0 += ar * ar + ai * ai;
    p1 += br * br + bi * bi;
    rr += ar * br + ai * bi;
    ri += ai * br - ar * bi;
  }
  return { x: 2 * rr, y: -2 * ri, z: p0 - p1 };
}

// Kübit q ile geri kalanı arasındaki dolanıklık entropisi (bit cinsinden, 0..1)
export function entanglementEntropy(s, q) {
  const { x, y, z } = blochVector(s, q);
  const r = Math.min(1, Math.hypot(x, y, z));
  const l1 = (1 + r) / 2, l2 = (1 - r) / 2;
  const h = (p) => (p > 1e-12 ? -p * Math.log2(p) : 0);
  return h(l1) + h(l2);
}

export function ketLabel(i, n) {
  return '|' + i.toString(2).padStart(n, '0') + '⟩';
}

// rng(): [0,1) — varsayılan olarak işletim sisteminin kriptografik rastgeleliği
export function defaultRng() {
  if (globalThis.crypto?.getRandomValues) {
    const u = new Uint32Array(1);
    globalThis.crypto.getRandomValues(u);
    return u[0] / 2 ** 32;
  }
  return Math.random();
}

export function sample(s, rng = defaultRng) {
  const p = probabilities(s);
  let r = rng(), acc = 0;
  for (let i = 0; i < p.length; i++) {
    acc += p[i];
    if (r < acc) return i;
  }
  return p.length - 1;
}

export function measureShots(s, shots, rng = defaultRng) {
  const counts = new Array(s.re.length).fill(0);
  for (let k = 0; k < shots; k++) counts[sample(s, rng)]++;
  return counts;
}

// Bir durumu insan diliyle yaz: 0.707|00⟩ + 0.707|11⟩
export function formatState(s, eps = 1e-6) {
  const parts = [];
  for (let i = 0; i < s.re.length; i++) {
    const r = s.re[i], m = s.im[i];
    if (r * r + m * m < eps) continue;
    parts.push(`${formatComplex(r, m)}${ketLabel(i, s.n)}`);
  }
  return parts.join(' + ').replace(/\+ −(?=[\d.])/g, '− ') || '0';
}

export function formatComplex(r, m) {
  const f = (x) => (Math.abs(x) < 5e-4 ? 0 : +x.toFixed(3));
  const num = (x) => (x < 0 ? `−${-x}` : `${x}`);
  const a = f(r), b = f(m);
  if (b === 0) return num(a);
  if (a === 0) return `${num(b)}i`;
  return `(${num(a)}${b < 0 ? '−' : '+'}${Math.abs(b)}i)`;
}
