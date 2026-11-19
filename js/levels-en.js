// English titles, stories and hints, keyed by level id.
export const LEVELS_EN = {
  'bit-cevir': {
    title: 'Flip the Bit',
    story: 'Welcome to the lab. You have a single qubit, asleep in |0⟩. Turn it into |1⟩.',
    hint: 'The X gate works like a classical NOT.',
  },
  superpozisyon: {
    title: 'Superposition',
    story: 'Now make the qubit both 0 and 1 at once: (|0⟩ + |1⟩)/√2. Measure it and you get a fair coin toss.',
    hint: 'This is exactly what Hadamard is for.',
  },
  'eksi-dunya': {
    title: 'Minus World',
    story: '(|0⟩ − |1⟩)/√2: still fifty-fifty, but with a hidden minus sign. Measurement can\'t see it; interference can.',
    hint: 'Either flip first and then H, or H first and then flip the phase.',
  },
  'hayali-yon': {
    title: 'Imaginary Direction',
    story: 'Amplitudes are complex numbers. (|0⟩ + i|1⟩)/√2 points along the Y axis of the Bloch sphere. Get there.',
    hint: 'The S gate multiplies the |1⟩ part by i.',
  },
  'sekizde-bir': {
    title: 'An Eighth of a Turn',
    story: 'Turn 45° around the equator: (|0⟩ + e^{iπ/4}|1⟩)/√2. Watch the phase colour slide towards orange.',
    hint: 'The T gate is a 45° phase.',
  },
  girisim: {
    title: 'Interference',
    story: 'The X gate is gone! Turn the qubit into |1⟩ using only H and Z. Hint: waves can cancel each other out.',
    hint: 'H · Z · H = X. Interference turns phase into probability.',
  },
  bell: {
    title: 'Bell Pair',
    story: 'Your first entanglement. (|00⟩ + |11⟩)/√2: each qubit alone is random, yet they always agree. Watch the Bloch arrows shrink!',
    hint: 'Put one qubit into superposition, then use it as a control.',
  },
  'hadamard-yagmuru': {
    title: 'Hadamard Rain',
    story: 'Three qubits, eight outcomes, all equal. Filling 2ⁿ amplitudes with n gates: your first taste of quantum parallelism.',
    hint: 'One raindrop for each qubit.',
  },
  'kardes-bitler': {
    title: 'Sibling Bits',
    story: '(|01⟩ + |10⟩)/√2: this time the qubits always disagree.',
    hint: 'Build a Bell pair, then flip one.',
  },
  'hayali-bell': {
    title: 'Imaginary Bell',
    story: '(|00⟩ + i|11⟩)/√2. Rotate the shared phase of an entangled pair.',
    hint: 'Does it matter where you put the phase gate? Try it!',
  },
  'gizli-faz': {
    title: 'Hidden Phase',
    story: '½(|00⟩ + |01⟩ + |10⟩ − |11⟩). Probabilities are uniform; the only difference is the minus on |11⟩. This is the smallest "graph state", a resource for quantum computing.',
    hint: 'CZ adds a minus when both qubits are 1.',
  },
  singlet: {
    title: 'Singlet',
    story: '(|01⟩ − |10⟩)/√2: the most famous entangled state in physics. Measure along any axis and the results are always opposite.',
    hint: 'It\'s easier to add the minus sign before you entangle.',
  },
  ghz: {
    title: 'GHZ Trio',
    story: '(|000⟩ + |111⟩)/√2: three-way entanglement. The moment one qubit is measured, all three are decided.',
    hint: 'Extend the Bell pair by one more qubit.',
  },
  takasci: {
    title: 'The Swapper',
    story: 'X only fits on the top qubit and SWAP is broken. But you need |01⟩ (the bottom qubit set to 1). Can you swap using CNOTs?',
    hint: 'Three CNOTs with alternating directions make a SWAP. But here the top qubit has to end up back at 0…',
  },
  'faz-labirenti': {
    title: 'Phase Maze',
    story: 'Final exam: ½(|00⟩ + i|01⟩ + |10⟩ + i|11⟩). Entangled or not? Decide by looking at the Bloch spheres, then build it.',
    hint: 'If the arrows have length 1, it\'s a product state: prepare each qubit separately.',
  },
  'ceyrek-sans': {
    title: 'Quarter Chance',
    story: 'Hadamard always gives fifty-fifty. What if you want a 25% chance of measuring 1? Target: (√3/2)|0⟩ + (1/2)|1⟩. The Ry gate tilts the qubit by any angle you like.',
    hint: 'After Ry(θ) the probability of 1 is sin²(θ/2). For sin²(θ/2) = 1/4, θ = ?',
  },
  'altida-bir': {
    title: 'A Sixth of a Turn',
    story: '(|0⟩ + e^{iπ/3}|1⟩)/√2: turn 60° around the equator. S (90°) and T (45°) can\'t give this angle; Rz can. You\'ll notice Rz also adds a phase to |0⟩, but a shared (global) phase is physically invisible.',
    hint: 'Climb to the equator first, then turn around the Z axis.',
  },
  'yarim-dolanik': {
    title: 'Half-Hearted Entanglement',
    story: '(√3/2)|00⟩ + (1/2)|11⟩: the qubits still always agree, but no longer with equal odds. Entanglement isn\'t an on/off switch, it\'s a dial: watch the Bloch arrows shrink only halfway.',
    hint: 'Replace the H of the Bell pair with a tilted Ry.',
  },
  deutsch: {
    title: 'Deutsch\'s Oracle',
    story: 'The first quantum algorithm (1985). The locked U_f box hides a one-bit function f: either constant (f(0) = f(1)) or balanced. A classical computer must query the box twice. You need just one: at the end q0 must read 0 for constant boxes and 1 for balanced ones. Your circuit has to work for all four possible boxes.',
    hint: 'Put q1 into |−⟩ (X then H) and q0 into superposition. The box "kicks back" f(x) as a phase onto q0. Then one more H on q0.',
  },
  'bernstein-vazirani': {
    title: 'Bernstein–Vazirani',
    story: 'The U_s box hides a two-bit secret string s and computes f(x) = s·x (mod 2). Classically you need a separate query for each bit of s. Quantumly one query is enough: at the end q0q1 should show s directly. q2 is a helper qubit.',
    hint: 'The same trick as Deutsch: helper qubit in |−⟩, inputs in superposition, then H on the inputs again.',
  },
  grover: {
    title: 'Grover\'s Search',
    story: 'One of four boxes hides a treasure, and the U_ω oracle "marks" it by flipping its phase. Classically you\'d look 2.25 times on average. Grover\'s algorithm on 2 qubits finds it with certainty in a single query. Whichever box is marked, your circuit must end in exactly that state.',
    hint: 'Start with an equal superposition. After the oracle, reflect about the mean (diffusion): H H, X X, CZ, X X, H H.',
  },
  'super-yogun': {
    title: 'Superdense Coding',
    story: 'Ayşe and Bora share a Bell pair: q0 is Ayşe\'s, q1 is Bora\'s. Ayşe encodes a two-bit message on her qubit with the locked M box and sends her qubit to Bora. Two classical bits in one qubit! Build the pair first, then decode as Bora: at the end, |b1 b2⟩ must be measured.',
    hint: 'Build a Bell pair before the box. After it, undo the Bell pair: the same gates in reverse order.',
  },
  isinlanma: {
    title: 'Quantum Teleportation',
    story: 'q0 is prepared in an unknown state by the ψ box. Your job is to move that state to q2. But q0 and q2 are far apart: no CNOT between them. Build a bridge of entanglement through q1. In the real protocol Ayşe measures and sends Bora two classical bits; here we apply those corrections with controlled gates (the principle of deferred measurement). The CZ from q0 to q2 stands in for one of those classical bits.',
    hint: 'A Bell pair between q1 and q2; then "measure" q0 and q1 in the Bell basis: CNOT 0→1 and H q0. Finally fix q2 with a controlled-X from q1 and a controlled-Z from q0.',
  },
  'fourier-saati': {
    title: 'Fourier Clock',
    story: 'The quantum Fourier transform (QFT) writes a number into phases. Target: QFT|001⟩, eight amplitudes each 45° ahead of the last, like a clock. Watch the colour wheel go full circle. The secret: this state isn\'t entangled at all; each qubit is a separate needle turning at its own speed.',
    hint: 'q0 should turn half a turn (180°), q1 a quarter (90°), q2 an eighth (45°). Start each with an H.',
  },
  'faz-kestirimi': {
    title: 'Phase Estimation',
    story: 'The heart of Shor\'s algorithm. The U^k box applies U = P(2πφ) to q2, once controlled by q1 and twice controlled by q0. If q2 = |1⟩, U leaves it alone and only adds the phase e^{2πiφ}, which "kicks back" onto the control qubits. Your job is to read φ as a two-bit number: at the end q0q1 = 4φ.',
    hint: 'First set q2 to |1⟩ and put the counting qubits into superposition. After the box, the inverse QFT: SWAP, H q1, CP(−π/2), H q0.',
  },
  'bit-cevirme-kodu': {
    title: 'Bit-Flip Code',
    story: 'The first step of quantum error correction. The ψ box puts an unknown state on q0; then the noise in the "?" box randomly flips at most one qubit (or none). Quantum information can\'t be copied (the no-cloning theorem), but entanglement can spread it over three qubits. "Spread" the state onto q1 and q2, and after the error, repair it by majority vote: in the end q0 must be ψ again.',
    hint: 'Encode: two CNOTs turn α|0⟩+β|1⟩ into α|000⟩+β|111⟩. Decode: the same two CNOTs; now q1 and q2 tell you where the error was (the syndrome). If both are 1, q0 was flipped: fix it with a Toffoli.',
  },
};
