// Gürültü: yoğunluk matrisi (ρ) simülatörü ve standart kuantum kanalları.
// Her kapıdan sonra, kapının dokunduğu her kübite seçilen kanal uygulanır.
// DOM'a bağımlı değildir; Qiskit'in DensityMatrix + Kraus hesabıyla CI'da karşılaştırılır.
import { applyOp, applyMatrix, sortOps, defaultRng } from './quantum.js';

const S = Math.sqrt;

// Kraus operatörleri: 2x2 matrisler, eleman biçimi [re, im] (quantum.js ile aynı)
export const CHANNELS = {
  depolarize: {
    name: 'Depolarize',
    desc: 'p olasılıkla kübite rastgele bir X, Y ya da Z hatası gelir. Ok her yönden eşit olarak küçülür.',
    kraus: (p) => [
      [[S(1 - p), 0], [0, 0], [0, 0], [S(1 - p), 0]],
      [[0, 0], [S(p / 3), 0], [S(p / 3), 0], [0, 0]],
      [[0, 0], [0, -S(p / 3)], [0, S(p / 3)], [0, 0]],
      [[S(p / 3), 0], [0, 0], [0, 0], [-S(p / 3), 0]],
    ],
  },
  sonum: {
    name: 'Genlik sönümü (T1)',
    desc: 'Kübit enerjisini çevreye kaptırıp |0⟩\'a düşer. Ok yavaş yavaş kuzey kutbuna çekilir.',
    kraus: (g) => [
      [[1, 0], [0, 0], [0, 0], [S(1 - g), 0]],
      [[0, 0], [S(g), 0], [0, 0], [0, 0]],
    ],
  },
  faz: {
    name: 'Faz bozulması (T2)',
    desc: 'Olasılıklar korunur ama faz bilgisi kaybolur. Ok yatayda küçülür, dikeyde aynı kalır: süperpozisyon klasik yazı-turaya döner.',
    kraus: (l) => [
      [[S(1 - l), 0], [0, 0], [0, 0], [S(1 - l), 0]],
      [[S(l), 0], [0, 0], [0, 0], [-S(l), 0]],
    ],
  },
};

export function zeroRho(n) {
  const N = 1 << n;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  re[0] = 1;
  return { n, N, re, im };
}

function dagger(r) {
  const { N } = r;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      re[j * N + i] = r.re[i * N + j];
      im[j * N + i] = -r.im[i * N + j];
    }
  }
  return { n: r.n, N, re, im };
}

// M · ρ : fn her sütuna (bir durum vektörü gibi) uygulanır
function applyLeft(r, fn) {
  const { N } = r;
  const out = { n: r.n, N, re: new Float64Array(N * N), im: new Float64Array(N * N) };
  const v = { n: r.n, re: new Float64Array(N), im: new Float64Array(N) };
  for (let c = 0; c < N; c++) {
    for (let i = 0; i < N; i++) { v.re[i] = r.re[i * N + c]; v.im[i] = r.im[i * N + c]; }
    fn(v);
    for (let i = 0; i < N; i++) { out.re[i * N + c] = v.re[i]; out.im[i * N + c] = v.im[i]; }
  }
  return out;
}

// ρ → M ρ M†  (ρ Hermitsel olduğu için M (M ρ)† = M ρ M†)
function conjugate(r, fn) {
  return applyLeft(dagger(applyLeft(r, fn)), fn);
}

export function applyUnitary(r, op) {
  return conjugate(r, (v) => applyOp(v, op));
}

export function applyChannel(r, q, krausList) {
  const { N } = r;
  const sum = { n: r.n, N, re: new Float64Array(N * N), im: new Float64Array(N * N) };
  for (const K of krausList) {
    const t = conjugate(r, (v) => applyMatrix(v, q, K));
    for (let k = 0; k < N * N; k++) { sum.re[k] += t.re[k]; sum.im[k] += t.im[k]; }
  }
  return sum;
}

// noise: { kind: 'depolarize' | 'sonum' | 'faz', p: 0..1 }
export function runNoisy(n, ops, noise, upToCol = Infinity) {
  let r = zeroRho(n);
  const ch = noise && noise.p > 0 ? CHANNELS[noise.kind] : null;
  const kraus = ch ? ch.kraus(noise.p) : null;
  for (const op of sortOps(ops)) {
    if (op.col > upToCol) break;
    r = applyUnitary(r, op);
    if (kraus) {
      r = applyChannel(r, op.q, kraus);
      if (op.q2 != null) r = applyChannel(r, op.q2, kraus);
      if (op.q3 != null) r = applyChannel(r, op.q3, kraus);
    }
  }
  return r;
}

export function rhoProbabilities(r) {
  return Array.from({ length: r.N }, (_, i) => Math.max(0, r.re[i * r.N + i]));
}

export function rhoBloch(r, q) {
  const bit = 1 << (r.n - 1 - q);
  const { N } = r;
  let p0 = 0, p1 = 0, xr = 0, xi = 0;
  for (let i = 0; i < N; i++) {
    if (i & bit) continue;
    const j = i | bit;
    p0 += r.re[i * N + i];
    p1 += r.re[j * N + j];
    xr += r.re[i * N + j];
    xi += r.im[i * N + j];
  }
  return { x: 2 * xr, y: -2 * xi, z: p0 - p1 };
}

// tr(ρ²): 1 = saf durum, 1/2ⁿ = tamamen karışık
export function purity(r) {
  let s = 0;
  for (let k = 0; k < r.N * r.N; k++) s += r.re[k] * r.re[k] + r.im[k] * r.im[k];
  return s;
}

// ⟨ψ|ρ|ψ⟩: gürültülü sonucun ideal duruma benzerliği
export function rhoFidelity(r, psi) {
  const { N } = r;
  let tot = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      // conj(ψ_i) ρ_ij ψ_j, gerçek kısmı
      const ar = psi.re[i], ai = -psi.im[i];
      const br = r.re[i * N + j], bi = r.im[i * N + j];
      const cr = ar * br - ai * bi, ci = ar * bi + ai * br;
      tot += cr * psi.re[j] - ci * psi.im[j];
    }
  }
  return tot;
}

export function sampleRho(r, rng = defaultRng) {
  const p = rhoProbabilities(r);
  let x = rng(), acc = 0;
  for (let i = 0; i < p.length; i++) { acc += p[i]; if (x < acc) return i; }
  return p.length - 1;
}

export function measureShotsRho(r, shots, rng = defaultRng) {
  const counts = new Array(r.N).fill(0);
  for (let k = 0; k < shots; k++) counts[sampleRho(r, rng)]++;
  return counts;
}
