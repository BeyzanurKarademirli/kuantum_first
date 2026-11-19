import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toQasm, fromQasm } from '../js/qasm.js';
import { runCircuit, fidelity } from '../js/quantum.js';

const ghz = [{ g: 'H', q: 0, col: 0 }, { g: 'CNOT', q: 0, q2: 1, col: 1 }, { g: 'CNOT', q: 1, q2: 2, col: 2 }];

test('OpenQASM 3 çıktısı', () => {
  assert.equal(toQasm(3, ghz), [
    'OPENQASM 3.0;', 'include "stdgates.inc";', 'qubit[3] q;', 'bit[3] c;',
    'h q[0];', 'cx q[0], q[1];', 'cx q[1], q[2];', 'c = measure q;', '',
  ].join('\n'));
});

test('OpenQASM 2 çıktısı (swap → 3 cx)', () => {
  const s = toQasm(2, [{ g: 'SWAP', q: 0, q2: 1, col: 0 }], { version: 2 });
  assert.match(s, /^OPENQASM 2\.0;\ninclude "qelib1\.inc";\nqreg q\[2\];\ncreg c\[2\];\ncx q\[0\], q\[1\];\ncx q\[1\], q\[0\];\ncx q\[0\], q\[1\];\nmeasure q -> c;\n$/);
});

test('gidiş-dönüş aynı durumu verir (v2 ve v3)', () => {
  const ops = [
    { g: 'H', q: 0, col: 0 }, { g: 'T', q: 1, col: 0 }, { g: 'CZ', q: 0, q2: 2, col: 1 },
    { g: 'Y', q: 2, col: 2 }, { g: 'S', q: 0, col: 2 }, { g: 'SWAP', q: 1, q2: 2, col: 3 },
  ];
  for (const version of [2, 3]) {
    const back = fromQasm(toQasm(3, ops, { version }));
    assert.equal(back.n, 3);
    const f = fidelity(runCircuit(3, ops), runCircuit(3, back.ops));
    assert.ok(f > 1 - 1e-12);
  }
});

test('ASAP katmanlama: bağımsız kapılar aynı sütuna, aradaki kablolar bloklanır', () => {
  const { ops } = fromQasm('OPENQASM 3.0; qubit[3] q; h q[0]; h q[1]; cx q[0], q[2]; x q[1];');
  assert.deepEqual(ops.map((o) => o.col), [0, 0, 1, 2]);
});

test('yorumlar, barrier ve ölçüm yok sayılır', () => {
  const { n, ops } = fromQasm(`OPENQASM 2.0;
    include "qelib1.inc"; // standart
    /* blok yorum */
    qreg r[2]; creg c[2];
    h r[0]; barrier r; cx r[0], r[1];
    measure r -> c;`);
  assert.equal(n, 2);
  assert.equal(ops.length, 2);
});

test('anlaşılır hata mesajları', () => {
  assert.throws(() => fromQasm('qubit[2] q; rx(0.1) q[0];'), /Anlaşılamayan/);
  assert.throws(() => fromQasm('qubit[2] q; ccx q[0], q[1];'), /yanlış sayıda|Desteklenmeyen/);
  assert.throws(() => fromQasm('qubit[9] q;'), /En fazla 4/);
  assert.throws(() => fromQasm('h q[0];'), /Kübit tanımı/);
  assert.throws(() => fromQasm('qubit[2] q; x q[5];'), /aralık dışında/);
});
