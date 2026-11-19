// Her bölüm için örnek bir ideal çözüm. Testler ve Qiskit doğrulaması kullanır.
// Biçim: [kapı, kübit, ikinci kübit?, sütun?, açı?]. Sütun verilmezse sırayla 0, 1, 2…
export const SOLUTIONS = {
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
  // kehanet sütunu: 2
  deutsch: [['X', 1, null, 0], ['H', 0, null, 1], ['H', 1, null, 1], ['H', 0, null, 3]],
  // kehanet sütunu: 1
  grover: [
    ['H', 0, null, 0], ['H', 1, null, 0],
    ['H', 0, null, 2], ['H', 1, null, 2],
    ['X', 0, null, 3], ['X', 1, null, 3],
    ['CZ', 0, 1, 4],
    ['X', 0, null, 5], ['X', 1, null, 5],
    ['H', 0, null, 6], ['H', 1, null, 6],
  ],
  'ceyrek-sans': [['RY', 0, null, 0, Math.PI / 3]],
  'altida-bir': [['H', 0], ['RZ', 0, null, 1, Math.PI / 3]],
  'yarim-dolanik': [['RY', 0, null, 0, Math.PI / 3], ['CNOT', 0, 1]],
  // kehanet sütunu: 2
  'bernstein-vazirani': [
    ['X', 2, null, 0], ['H', 0, null, 1], ['H', 1, null, 1], ['H', 2, null, 1],
    ['H', 0, null, 3], ['H', 1, null, 3],
  ],
  // mesaj kutusu: sütun 2, yalnız q0
  'super-yogun': [['H', 0, null, 0], ['CNOT', 0, 1, 1], ['CNOT', 0, 1, 3], ['H', 0, null, 4]],
  // ψ kutusu: sütun 0, yalnız q0
  isinlanma: [
    ['H', 1, null, 1], ['CNOT', 1, 2, 2], ['CNOT', 0, 1, 3], ['H', 0, null, 4],
    ['CNOT', 1, 2, 5], ['CZ', 0, 2, 6],
  ],
};

export function solutionOps(id) {
  return SOLUTIONS[id].map(([g, q, q2, col, theta], i) => ({
    g, q, ...(q2 != null ? { q2 } : {}), col: col ?? i, ...(theta != null ? { theta } : {}),
  }));
}
