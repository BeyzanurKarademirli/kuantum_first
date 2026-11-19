import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toQasm, fromQasm, evalAngle } from '../js/qasm.js';
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

test('döndürme kapıları dışa/içe aktarılır', () => {
  const ops = [{ g: 'RY', q: 0, theta: Math.PI / 3, col: 0 }, { g: 'RZ', q: 1, theta: -Math.PI / 4, col: 0 }, { g: 'RX', q: 0, theta: 0.3, col: 1 }];
  const text = toQasm(2, ops);
  assert.match(text, /ry\(pi\/3\) q\[0\];/);
  assert.match(text, /rz\(-pi\/4\) q\[1\];/);
  assert.match(text, /rx\(0\.3\) q\[0\];/);
  const back = fromQasm(text);
  assert.ok(fidelity(runCircuit(2, ops), runCircuit(2, back.ops)) > 1 - 1e-12);
});

test('açı ifadeleri güvenle hesaplanır', () => {
  assert.equal(evalAngle('pi/2'), Math.PI / 2);
  assert.equal(evalAngle('-3*pi/4'), -3 * Math.PI / 4);
  assert.equal(evalAngle('(pi + pi)/4'), Math.PI / 2);
  assert.equal(evalAngle('1.5e-1'), 0.15);
  assert.equal(evalAngle('π'), Math.PI);
  assert.throws(() => evalAngle('alert(1)'), /anlaşılamadı/);
  assert.throws(() => evalAngle('pi pi'), /anlaşılamadı/);
  assert.throws(() => fromQasm('qubit[1] q; ry q[0];'), /açı ister/);
  assert.throws(() => fromQasm('qubit[1] q; h(0.1) q[0];'), /açı almaz/);
});

test('Toffoli (ccx) dışa/içe aktarılır', () => {
  const ops = [{ g: 'H', q: 0, col: 0 }, { g: 'X', q: 2, col: 0 }, { g: 'CCX', q: 0, q2: 2, q3: 1, col: 1 }];
  for (const version of [2, 3]) {
    const text = toQasm(3, ops, { version });
    assert.match(text, /ccx q\[0\], q\[2\], q\[1\];/);
    const back = fromQasm(text);
    assert.deepEqual(back.ops[2], { g: 'CCX', q: 0, q2: 2, q3: 1, col: 1 });
  }
  assert.throws(() => fromQasm('qubit[3] q; ccx q[0], q[0], q[1];'), /farklı olmalı/);
});

test('anlaşılır hata mesajları', () => {
  assert.throws(() => fromQasm('qubit[2] q; u3(0.1, 0.2, 0.3) q[0];'), /Desteklenmeyen/);
  assert.throws(() => fromQasm('qubit[2] q; ccx q[0], q[1];'), /yanlış sayıda/);
  assert.throws(() => fromQasm('qubit[9] q;'), /En fazla 4/);
  assert.throws(() => fromQasm('h q[0];'), /Kübit tanımı/);
  assert.throws(() => fromQasm('qubit[2] q; x q[5];'), /aralık dışında/);
});
