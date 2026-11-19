"""Dolanık simülatörünü IBM Qiskit'e karşı doğrular.

Her devre OpenQASM 2 ve 3 olarak Qiskit'e yüklenir, Qiskit'in Statevector'ü
hesaplanır ve Dolanık'ın genlikleriyle global faz hariç karşılaştırılır.

Kullanım:
    node scripts/export-fixtures.mjs > fixtures.json
    python tests/qiskit/verify.py fixtures.json
"""
import json
import sys

import numpy as np
import qiskit.qasm2
import qiskit.qasm3
from qiskit.quantum_info import Statevector


def qiskit_state(qasm: str, loader) -> np.ndarray:
    qc = loader(qasm)
    # Qiskit q[0]'ı en sağdaki bit sayar; Dolanık en soldaki. Sırayı ters çevir.
    return Statevector(qc).reverse_qargs().data


def main(path: str) -> int:
    with open(path, encoding="utf-8") as f:
        fixtures = json.load(f)
    failures = 0
    for fx in fixtures:
        ours = np.array([complex(r, i) for r, i in fx["amps"]])
        for label, loader in (("qasm2", qiskit.qasm2.loads), ("qasm3", qiskit.qasm3.loads)):
            theirs = qiskit_state(fx[label], loader)
            fid = abs(np.vdot(theirs, ours)) ** 2
            if fid < 1 - 1e-9:
                failures += 1
                print(f"UYUŞMAZLIK {fx['name']} [{label}] fidelity={fid:.12f}\n{fx[label]}")
    total = len(fixtures) * 2
    print(f"{total - failures}/{total} devre Qiskit ile birebir uyumlu.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "fixtures.json"))
