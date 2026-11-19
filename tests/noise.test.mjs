import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCircuit, blochVector, probabilities } from '../js/quantum.js';
import { runNoisy, rhoBloch, rhoProbabilities, purity, rhoFidelity, measureShotsRho, CHANNELS } from '../js/noise.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const ghzOps = [{ g: 'H', q: 0, col: 0 }, { g: 'CNOT', q: 0, q2: 1, col: 1 }, { g: 'T', q: 1, col: 2 }, { g: 'RY', q: 0, theta: 0.7, col: 3 }];

test('gürültüsüz ρ, durum vektörüyle aynı', () => {
  const r = runNoisy(2, ghzOps, null);
  const s = runCircuit(2, ghzOps);
  close(purity(r), 1);
  close(rhoFidelity(r, s), 1);
  probabilities(s).forEach((p, i) => close(rhoProbabilities(r)[i], p));
  for (const q of [0, 1]) {
    const a = rhoBloch(r, q), b = blochVector(s, q);
    close(a.x, b.x); close(a.y, b.y); close(a.z, b.z);
  }
});

test('kanallar iz korur (tr ρ = 1) ve saflığı düşürür', () => {
  for (const kind of Object.keys(CHANNELS)) {
    const r = runNoisy(2, ghzOps, { kind, p: 0.1 });
    close(rhoProbabilities(r).reduce((a, b) => a + b, 0), 1);
    assert.ok(purity(r) < 1 - 1e-6, kind);
    assert.ok(purity(r) > 0.25 - 1e-12, kind);
  }
});

test('depolarize: |+⟩ oku 1 − 4p/3 oranında küçülür', () => {
  const p = 0.15;
  const v = rhoBloch(runNoisy(1, [{ g: 'H', q: 0, col: 0 }], { kind: 'depolarize', p }), 0);
  close(v.x, 1 - (4 * p) / 3);
});

test('genlik sönümü: |1⟩ γ olasılıkla |0⟩\'a düşer', () => {
  const r = runNoisy(1, [{ g: 'X', q: 0, col: 0 }], { kind: 'sonum', p: 0.3 });
  close(rhoProbabilities(r)[0], 0.3);
});

test('faz bozulması: olasılıklar aynı, x bileşeni 1 − 2λ', () => {
  const r = runNoisy(1, [{ g: 'H', q: 0, col: 0 }], { kind: 'faz', p: 0.2 });
  close(rhoProbabilities(r)[0], 0.5);
  close(rhoBloch(r, 0).x, 0.6);
  close(rhoBloch(r, 0).z, 0);
});

test('gürültülü ölçüm örneklemesi', () => {
  const r = runNoisy(1, [{ g: 'X', q: 0, col: 0 }], { kind: 'sonum', p: 1 });
  assert.deepEqual(measureShotsRho(r, 20), [20, 0]);
});
