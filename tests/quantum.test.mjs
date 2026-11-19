import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  zeroState, runCircuit, probabilities, fidelity, blochVector, stateFromAmplitudes,
  entanglementEntropy, measureShots, formatState, GATES,
} from '../js/quantum.js';
import { LEVELS } from '../js/levels.js';

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

// Her bölümün çözülebilir olduğunu kanıtlayan örnek çözümler
const SOLUTIONS = {
  'bit-cevir': [['X', 0]],
  superpozisyon: [['H', 0]],
  'eksi-dunya': [['X', 0], ['H', 0]],
  'hayali-yon': [['H', 0], ['S', 0]],
  'sekizde-bir': [['H', 0], ['T', 0]],
  girisim: [['H', 0], ['Z', 0], ['H', 0]],
  bell: [['H', 0], ['CNOT', 0, 1]],
  'hadamard-yagmuru': [['H', 0], ['H', 1], ['H', 2]],
  'kardes-bitler': [['H', 0], ['CNOT', 0, 1], ['X', 1]],
  'hayali-bell': [['H', 0], ['S', 0], ['CNOT', 0, 1]],
  'gizli-faz': [['H', 0], ['H', 1], ['CZ', 0, 1]],
  singlet: [['H', 0], ['Z', 0], ['CNOT', 0, 1], ['X', 1]],
  ghz: [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]],
  takasci: [['X', 0], ['CNOT', 0, 1], ['CNOT', 1, 0]],
  'faz-labirenti': [['H', 0], ['H', 1], ['S', 1]],
};

for (const lv of LEVELS) {
  test(`bölüm çözülebilir: ${lv.title}`, () => {
    const sol = SOLUTIONS[lv.id];
    assert.ok(sol, 'çözüm tanımlı');
    const ops = sol.map(([g, q, q2], col) => ({ g, q, q2, col }));
    for (const op of ops) {
      assert.ok(lv.gates.includes(op.g), `${op.g} bu bölümde izinli`);
      assert.ok(GATES[op.g]);
      const rows = lv.allowedRows?.[op.g];
      if (rows) assert.ok(rows.includes(op.q));
    }
    const s = runCircuit(lv.n, ops);
    const f = fidelity(s, stateFromAmplitudes(lv.n, lv.target));
    assert.ok(f > 0.999, `fidelity ${f}`);
    assert.ok(ops.length <= lv.par, `par ${lv.par} ile çözülebilir`);
  });
}
