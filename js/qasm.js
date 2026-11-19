// OpenQASM 2.0 / 3.0 dışa ve içe aktarma.
// Kapı adları IBM Qiskit, Amazon Braket, Cirq vb. araçlardaki standart adlardır.
// Not: Dolanık'ta q[0] ket yazımında EN SOLDAKİ bittir; Qiskit gibi araçlar
// q[0]'ı en sağa yazar. Devre aynıdır, yalnızca bit dizilerinin okunuş sırası farklıdır.
import { sortOps, GATES, angleLabel } from './quantum.js';

// Hata: Türkçe mesaj + arayüzün çevirebilmesi için anahtar ve parametreler
function qerr(key, params, message) {
  const e = new Error(message);
  e.key = key;
  e.params = params;
  return e;
}

const TO_QASM = {
  H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', T: 't', CNOT: 'cx', CZ: 'cz', SWAP: 'swap', RX: 'rx', RY: 'ry', RZ: 'rz', CP: 'cp', CCX: 'ccx',
};
const FROM_QASM = Object.fromEntries(Object.entries(TO_QASM).map(([k, v]) => [v, k]));
// sık görülen eş adlar
Object.assign(FROM_QASM, { cnot: 'CNOT', CX: 'CNOT', cu1: 'CP', cphase: 'CP', toffoli: 'CCX' });

export function toQasm(n, ops, { version = 3, measure = true, comment } = {}) {
  const v3 = version === 3;
  const lines = v3
    ? ['OPENQASM 3.0;', 'include "stdgates.inc";']
    : ['OPENQASM 2.0;', 'include "qelib1.inc";'];
  if (comment) lines.push(...comment.split('\n').map((l) => `// ${l}`));
  lines.push(v3 ? `qubit[${n}] q;` : `qreg q[${n}];`);
  if (measure) lines.push(v3 ? `bit[${n}] c;` : `creg c[${n}];`);
  for (const op of sortOps(ops)) {
    const name = TO_QASM[op.g];
    if (!name) throw new Error(`${op.g} OpenQASM'a aktarılamaz`);
    if (op.g === 'SWAP' && !v3) {
      // qelib1.inc'te swap yok: üç CNOT ile ayrıştır
      const a = `q[${op.q}]`, b = `q[${op.q2}]`;
      lines.push(`cx ${a}, ${b};`, `cx ${b}, ${a};`, `cx ${a}, ${b};`);
      continue;
    }
    // qelib1.inc'te cp yok; eşdeğeri cu1
    const name2 = op.g === 'CP' && !v3 ? 'cu1' : name;
    const args = [op.q, op.q2, op.q3].filter((x) => x != null).map((x) => `q[${x}]`).join(', ');
    const param = GATES[op.g].param ? `(${angleLabel(op.theta, { ascii: true })})` : '';
    lines.push(`${name2}${param} ${args};`);
  }
  if (measure) lines.push(v3 ? 'c = measure q;' : 'measure q -> c;');
  return lines.join('\n') + '\n';
}

// Metni ayrıştır; kapıları mümkün olan en erken sütuna yerleştir (ASAP katmanlama).
export function fromQasm(text, { maxQubits = 4, maxCols = 12 } = {}) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const stmts = src.split(';').map((s) => s.trim()).filter(Boolean);
  let n = null;
  let reg = 'q';
  const gates = [];
  for (const st of stmts) {
    let m;
    if (/^OPENQASM\b/i.test(st) || /^include\b/.test(st)) continue;
    if ((m = st.match(/^qubit\s*\[\s*(\d+)\s*\]\s*(\w+)$/)) || (m = st.match(/^qreg\s+(\w+)\s*\[\s*(\d+)\s*\]$/))) {
      if (n != null) throw qerr('multiReg', {}, 'Yalnızca tek bir kübit yazmacı destekleniyor.');
      const isV3 = st.startsWith('qubit');
      n = +(isV3 ? m[1] : m[2]);
      reg = isV3 ? m[2] : m[1];
      continue;
    }
    if (/^(bit|creg)\b/.test(st) || /\bmeasure\b/.test(st) || /^barrier\b/.test(st)) continue;
    m = st.match(/^(\w+)\s*(?:\(([^)]*)\))?\s+(\w+\s*\[\s*\d+\s*\](?:\s*,\s*\w+\s*\[\s*\d+\s*\])*)$/);
    if (!m) throw qerr('unparsed', { st }, `Anlaşılamayan satır: "${st}"`);
    const g = FROM_QASM[m[1]];
    if (!g) throw qerr('unsupported', { g: m[1], list: Object.values(TO_QASM).join(', ') }, `Desteklenmeyen kapı: ${m[1]} (desteklenen: ${Object.values(TO_QASM).join(', ')})`);
    const isParam = !!GATES[g].param;
    if (isParam !== (m[2] != null)) throw isParam ? qerr('needAngle', { g: m[1] }, `${m[1]} kapısı bir açı ister: ${m[1]}(pi/4) q[0];`) : qerr('noAngle', { g: m[1] }, `${m[1]} kapısı açı almaz.`);
    const theta = isParam ? evalAngle(m[2]) : null;
    const args = m[3].split(',').map((a) => a.trim().match(/^(\w+)\s*\[\s*(\d+)\s*\]$/));
    for (const a of args) if (a[1] !== reg) throw qerr('reg', { r: a[1] }, `Bilinmeyen yazmaç: ${a[1]}`);
    if (args.length !== GATES[g].arity) throw qerr('arity', { g: m[1] }, `${m[1]} kapısına yanlış sayıda kübit verildi.`);
    const [q, q2, q3] = args.map((a) => +a[2]);
    gates.push({
      g, q, ...(q2 != null ? { q2 } : {}), ...(q3 != null ? { q3 } : {}), ...(isParam ? { theta } : {}),
    });
  }
  if (n == null) throw qerr('noQubits', {}, 'Kübit tanımı bulunamadı (qubit[n] q; ya da qreg q[n];).');
  if (n < 1 || n > maxQubits) throw qerr('tooMany', { max: maxQubits, n }, `En fazla ${maxQubits} kübit destekleniyor (${n} istendi).`);
  const ops = [];
  const nextFree = new Array(n).fill(0);
  for (const op of gates) {
    const rows = [op.q, op.q2, op.q3].filter((x) => x != null);
    if (rows.some((r) => r >= n)) throw qerr('range', { q: Math.max(...rows) }, `Kübit indeksi aralık dışında: q[${Math.max(...rows)}]`);
    if (new Set(rows).size !== rows.length) throw qerr('distinct', {}, 'Çok kübitli bir kapının kübitleri farklı olmalı.');
    // aradaki kablolar da çizimde kapandığı için onları da işgal et
    const lo = Math.min(...rows), hi = Math.max(...rows);
    let col = 0;
    for (let r = lo; r <= hi; r++) col = Math.max(col, nextFree[r]);
    if (col >= maxCols) throw qerr('cols', { k: maxCols }, `Devre ${maxCols} sütuna sığmıyor.`);
    for (let r = lo; r <= hi; r++) nextFree[r] = col + 1;
    ops.push({ ...op, col });
  }
  return { n, ops };
}

// Açı ifadesini güvenle hesapla: sayılar, pi/π, + − * / ve parantez. eval kullanılmaz.
export function evalAngle(src) {
  const toks = src.match(/\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|pi|π|[-+*/()]|\S/gi) || [];
  let i = 0;
  const peek = () => toks[i];
  const fail = () => { throw qerr('angle', { src }, `Açı anlaşılamadı: "${src}"`); };
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') v = toks[i++] === '+' ? v + term() : v - term();
    return v;
  }
  function term() {
    let v = factor();
    while (peek() === '*' || peek() === '/') v = toks[i++] === '*' ? v * factor() : v / factor();
    return v;
  }
  function factor() {
    const t = toks[i++];
    if (t === '-') return -factor();
    if (t === '+') return factor();
    if (t === '(') { const v = expr(); if (toks[i++] !== ')') fail(); return v; }
    if (t && /^(pi|π)$/i.test(t)) return Math.PI;
    if (t && /^(\d|\.)/.test(t)) return parseFloat(t);
    return fail();
  }
  const v = expr();
  if (i !== toks.length || !Number.isFinite(v)) fail();
  return v;
}
