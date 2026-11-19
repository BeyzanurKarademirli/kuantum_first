"""Dolanık simülatörünü IBM Qiskit'e karşı doğrular.

Her devre OpenQASM 2 ve 3 olarak Qiskit'e yüklenir, Qiskit'in Statevector'ü
hesaplanır ve Dolanık'ın genlikleriyle global faz hariç karşılaştırılır.
Gürültülü devrelerde Qiskit DensityMatrix + Kraus kanalları ile yoğunluk matrisi
eleman eleman karşılaştırılır.

Kullanım:
    node scripts/export-fixtures.mjs > fixtures.json
    python tests/qiskit/verify.py fixtures.json
"""
import json
import sys

import numpy as np
import qiskit.qasm2
import qiskit.qasm3
from qiskit.quantum_info import DensityMatrix, Kraus, Statevector


def kraus_ops(kind: str, p: float):
    """Dolanık'taki js/noise.js kanallarının aynısı."""
    i2 = np.eye(2)
    x = np.array([[0, 1], [1, 0]])
    y = np.array([[0, -1j], [1j, 0]])
    z = np.array([[1, 0], [0, -1]])
    if kind == "depolarize":
        return [np.sqrt(1 - p) * i2] + [np.sqrt(p / 3) * m for m in (x, y, z)]
    if kind == "sonum":
        return [np.array([[1, 0], [0, np.sqrt(1 - p)]]), np.array([[0, np.sqrt(p)], [0, 0]])]
    if kind == "faz":
        return [np.sqrt(1 - p) * i2, np.sqrt(p) * z]
    raise ValueError(kind)


def qiskit_noisy_rho(fx) -> np.ndarray:
    """Her kapıdan sonra, kapının dokunduğu her kübite Kraus kanalı uygula."""
    qc = qiskit.qasm3.loads(fx["qasm3"])
    channel = Kraus(kraus_ops(fx["kind"], fx["p"]))
    dm = DensityMatrix.from_label("0" * fx["n"])
    for inst in qc.data:
        qargs = [qc.find_bit(b).index for b in inst.qubits]
        dm = dm.evolve(inst.operation, qargs)
        for q in qargs:
            dm = dm.evolve(channel, [q])
    return dm.reverse_qargs().data


def qiskit_state(qasm: str, loader) -> np.ndarray:
    qc = loader(qasm)
    # Qiskit q[0]'ı en sağdaki bit sayar; Dolanık en soldaki. Sırayı ters çevir.
    return Statevector(qc).reverse_qargs().data


def main(path: str) -> int:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    fixtures, noisy = data["pure"], data["noisy"]
    failures = 0
    for fx in noisy:
        n = 2 ** fx["n"]
        ours = np.array([complex(r, i) for r, i in fx["rho"]]).reshape(n, n)
        err = np.max(np.abs(qiskit_noisy_rho(fx) - ours))
        if err > 1e-9:
            failures += 1
            print(f"UYUŞMAZLIK {fx['name']} max|Δρ|={err:.3e}")
    for fx in fixtures:
        ours = np.array([complex(r, i) for r, i in fx["amps"]])
        for label, loader in (("qasm2", qiskit.qasm2.loads), ("qasm3", qiskit.qasm3.loads)):
            theirs = qiskit_state(fx[label], loader)
            fid = abs(np.vdot(theirs, ours)) ** 2
            if fid < 1 - 1e-9:
                failures += 1
                print(f"UYUŞMAZLIK {fx['name']} [{label}] fidelity={fid:.12f}\n{fx[label]}")
    total = len(fixtures) * 2 + len(noisy)
    print(f"{total - failures}/{total} devre Qiskit ile birebir uyumlu "
          f"({len(noisy)} tanesi gürültülü yoğunluk matrisi).")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "fixtures.json"))
