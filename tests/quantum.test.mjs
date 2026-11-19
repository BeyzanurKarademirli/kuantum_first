import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  zeroState, runCircuit, probabilities, fidelity, blochVector, stateFromAmplitudes,
  entanglementEntropy, measureShots, formatState, GATES, angleLabel,
} from '../js/quantum.js';
import { LEVELS } from '../js/levels.js';
import { evaluateLevel, lockedOps, starsFor, placementAllowed } from '../js/game.js';
import { solutionOps } from './solutions.mjs';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('başlangıç |0..0⟩', () => {
  const s = zeroState(3);
  assert.deepEqual(probabilities(s), [1, 0, 0, 0, 0, 0, 0, 0]);
});

test('X kübit sırası: kübit 0 en soldaki bit', () => {
  const s = runCircuit(2, [{ g: 'X', q: 0, col: 0 }]);
  close(probabilities(s)[0b10], 1);
});

test('HH = I, HZH = X', () => {
  close(probabilities(runCircuit(1, [{ g: 'H', q: 0, col: 0 }, { g: 'H', q: 0, col: 1 }]))[0], 1);
  const s = runCircuit(1, [{ g: 'H', q: 0, col: 0 }, { g: 'Z', q: 0, col: 1 }, { g: 'H', q: 0, col: 2 }]);
  close(probabilities(s)[1], 1);
});

test('Bell durumu ve dolanıklık', () => {
  const s = runCircuit(2, [{ g: 'H', q: 0, col: 0 }, { g: 'CNOT', q: 0, q2: 1, col: 1 }]);
  close(fidelity(s, stateFromAmplitudes(2, [1, 0, 0, 1])), 1);
  const v = blochVector(s, 0);
  close(Math.hypot(v.x, v.y, v.z), 0);
  close(entanglementEntropy(s, 0), 1);
});

test('Bloch: |+i⟩ Y eksenini gösterir', () => {
  const s = runCircuit(1, [{ g: 'H', q: 0, col: 0 }, { g: 'S', q: 0, col: 1 }]);
  const v = blochVector(s, 0);
  close(v.x, 0); close(v.y, 1); close(v.z, 0);
});

test('SWAP ve 3 CNOT eşdeğer', () => {
  const a = runCircuit(2, [{ g: 'X', q: 0, col: 0 }, { g: 'SWAP', q: 0, q2: 1, col: 1 }]);
  const b = runCircuit(2, [
    { g: 'X', q: 0, col: 0 },
    { g: 'CNOT', q: 0, q2: 1, col: 1 }, { g: 'CNOT', q: 1, q2: 0, col: 2 }, { g: 'CNOT', q: 0, q2: 1, col: 3 },
  ]);
  close(fidelity(a, b), 1);
  close(probabilities(a)[0b01], 1);
});

test('fidelity global fazı yok sayar', () => {
  const a = stateFromAmplitudes(1, [1, 1]);
  const b = stateFromAmplitudes(1, [[0, 1], [0, 1]]);
  close(fidelity(a, b), 1);
});

test('ölçüm sayıları toplamı ve deterministik rng', () => {
  const s = runCircuit(1, [{ g: 'H', q: 0, col: 0 }]);
  let k = 0;
  const rng = () => (k++ % 2 ? 0.9 : 0.1);
  assert.deepEqual(measureShots(s, 10, rng), [5, 5]);
});

test('formatState okunur', () => {
  const s = runCircuit(1, [{ g: 'X', q: 0, col: 0 }, { g: 'H', q: 0, col: 1 }]);
  assert.equal(formatState(s), '0.707|0⟩ − 0.707|1⟩');
});

for (const lv of LEVELS) {
  test(`bölüm çözülebilir: ${lv.title}`, () => {
    const ops = [...lockedOps(lv), ...solutionOps(lv.id)];
    for (const op of ops.filter((o) => !o.locked)) {
      assert.ok(lv.gates.includes(op.g), `${op.g} bu bölümde izinli`);
      assert.ok(GATES[op.g]);
      assert.ok(placementAllowed(lv, op), `${op.g} q${op.q} yerleşimi izinli`);
      if (GATES[op.g].param) assert.ok(Number.isFinite(op.theta), 'açı var');
      assert.ok(op.col < 8, 'sütun sınırı');
      for (const box of lockedOps(lv)) {
        if (op.col !== box.col) continue;
        const rows = [op.q, op.q2, op.q3].filter((x) => x != null);
        const lo = Math.min(...rows), hi = Math.max(...rows);
        assert.ok(hi < box.q || lo > box.q2, 'kutunun hücreleri dolu');
      }
    }
    const r = evaluateLevel(lv, ops);
    assert.ok(r.solved, JSON.stringify(r.checks));
    assert.equal(starsFor(lv, ops), 3, `par ${lv.par} ile çözülebilir`);
  });
}

test('kehanet: kehanetsiz devre bütün varyantları çözmez', () => {
  for (const lv of LEVELS.filter((l) => l.oracle)) {
    const r = evaluateLevel(lv, lockedOps(lv));
    assert.ok(!r.solved, lv.id);
  }
});

test('ışınlanma: 3 CNOT ile q0↔q2 takası yasak', () => {
  const lv = LEVELS.find((l) => l.id === 'isinlanma');
  assert.ok(!placementAllowed(lv, { g: 'CNOT', q: 0, q2: 2 }));
  assert.ok(!placementAllowed(lv, { g: 'CNOT', q: 2, q2: 0 }));
  assert.ok(placementAllowed(lv, { g: 'CZ', q: 0, q2: 2 }));
  assert.ok(placementAllowed(lv, { g: 'CNOT', q: 2, q2: 1 }));
});

test('döndürme kapıları: Rx(π) = −iX, Ry(π/2)|0⟩ = |+⟩, Rz yalnız faz', () => {
  const rx = runCircuit(1, [{ g: 'RX', q: 0, theta: Math.PI, col: 0 }]);
  close(rx.im[1], -1);
  const ry = runCircuit(1, [{ g: 'RY', q: 0, theta: Math.PI / 2, col: 0 }]);
  close(fidelity(ry, stateFromAmplitudes(1, [1, 1])), 1);
  const rz = runCircuit(1, [{ g: 'H', q: 0, col: 0 }, { g: 'RZ', q: 0, theta: 1.234, col: 1 }]);
  close(probabilities(rz)[0], 0.5);
  assert.throws(() => runCircuit(1, [{ g: 'RY', q: 0, col: 0 }]), /açı/);
});

test('açı etiketleri', () => {
  assert.equal(angleLabel(Math.PI / 4), 'π/4');
  assert.equal(angleLabel(-2 * Math.PI / 3), '−2π/3');
  assert.equal(angleLabel(Math.PI), 'π');
  assert.equal(angleLabel(3 * Math.PI / 4, { ascii: true }), '3*pi/4');
  assert.equal(angleLabel(0.3, { ascii: true }), '0.3');
});

test('Toffoli: yalnızca iki kontrol de 1 iken çevirir', () => {
  for (let m = 0; m < 8; m++) {
    const prep = [0, 1, 2].filter((q) => (m >> (2 - q)) & 1).map((q) => ({ g: 'X', q, col: 0 }));
    const s = runCircuit(3, [...prep, { g: 'CCX', q: 0, q2: 1, q3: 2, col: 1 }]);
    const expect = m >= 6 ? m ^ 1 : m;
    close(probabilities(s)[expect], 1);
  }
});

test('bit-çevirme kodu: kodlama olmadan q0 hatası düzeltilemez', () => {
  const lv = LEVELS.find((l) => l.id === 'bit-cevirme-kodu');
  const r = evaluateLevel(lv, lockedOps(lv));
  // her ψ için 'hata yok', 'q1' ve 'q2' kendiliğinden doğru; q0 hatası düzeltilmeden kalır
  assert.equal(r.checks.filter((c) => c.ok).length, 6);
  assert.ok(r.checks.filter((c) => !c.ok).every((c) => c.name.tr.includes('q0') && c.name.en.includes('q0')));
});

test('bölüm kimlikleri benzersiz', () => {
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
});
