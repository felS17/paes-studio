#!/usr/bin/env python3
"""Soluciones paso a paso de las PAES de Invierno: almacén versionado + integración en los ensayos.

Las soluciones viven en `scripts/pipeline/solutions/soluciones.json` ({id de pregunta: {answer, explanation}}),
así que sobreviven a una nueva extracción de los PDF: `extract_demre.py` vuelve a aplicarlas al final.

    # 1) Recolectar los lotes ya redactados y validados (carpeta de trabajo de prepare_batches.py)
    python3 scripts/pipeline/solutions/merge_solutions.py --collect <carpeta de lotes>
    # 2) Aplicar el almacén a src/data/exams (también lo hace --collect al terminar)
    python3 scripts/pipeline/solutions/merge_solutions.py

Solo se guardan las preguntas con verified=true. Las del Módulo Común de Ciencias se copian a sus duplicados de
las otras dos pruebas del mismo año (dupes.json). Al aplicar, una solución se omite si la clave de la pregunta ya
no coincide con la clave con la que se redactó.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
EXAMS = ROOT / "src" / "data" / "exams"
STORE = HERE / "soluciones.json"
VALIDATOR = HERE / "validate_batch.py"


def collect(work: Path) -> int:
    batches = json.loads((work / "batches.json").read_text())
    dupes: dict[str, list[str]] = json.loads((work / "dupes.json").read_text())
    store = json.loads(STORE.read_text(encoding="utf-8")) if STORE.exists() else {}
    bad = 0
    for b in batches:
        d = Path(b["dir"])
        if not (d / "output.json").exists():
            print(f"  {b['id']:20} pendiente")
            continue
        r = subprocess.run([sys.executable, str(VALIDATOR), str(d)], capture_output=True, text=True)
        if r.returncode:
            bad += 1
            print(f"  {b['id']:20} no valida: {r.stdout.strip().splitlines()[0][:90]}")
            continue
        answers = {q["id"]: q["answer"] for q in json.loads((d / "input.json").read_text(encoding="utf-8"))}
        ok = 0
        for s in json.loads((d / "output.json").read_text(encoding="utf-8")):
            if not s.get("verified"):
                continue
            expl = {"kind": "solucion", "summary": s["summary"].strip(), "steps": [x.strip() for x in s["steps"]]}
            if s.get("distractors"):
                expl["distractors"] = {k: v.strip() for k, v in sorted(s["distractors"].items())}
            for qid in [s["id"], *dupes.get(s["id"], [])]:
                store[qid] = {"answer": answers[s["id"]], "explanation": expl}
            ok += 1
        print(f"  {b['id']:20} ok  {ok:3d}/{b['count']}")
    STORE.write_text(json.dumps(dict(sorted(store.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Almacén: {len(store)} soluciones en {STORE.relative_to(ROOT)}")
    return 1 if bad else 0


def apply() -> None:
    store = json.loads(STORE.read_text(encoding="utf-8")) if STORE.exists() else {}
    applied, totals, mismatched = Counter(), Counter(), []
    for path in sorted(EXAMS.glob("*/*.json")):
        exam = json.loads(path.read_text(encoding="utf-8"))
        if "questions" not in exam:
            continue
        changed = False
        for q in exam["questions"]:
            entry = store.get(q["id"])
            if entry is None:
                continue
            totals[exam["id"]] = len(exam["questions"])
            if entry["answer"] != q["answer"]:
                mismatched.append(q["id"])
                continue
            if q.get("explanation") != entry["explanation"]:
                q["explanation"] = entry["explanation"]
                changed = True
            applied[exam["id"]] += 1
        if changed:
            path.write_text(json.dumps(exam, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for eid in sorted(totals):
        print(f"  {eid:34} {applied[eid]:3d}/{totals[eid]}")
    print(f"Soluciones aplicadas: {sum(applied.values())}/{sum(totals.values())} preguntas")
    for qid in mismatched:
        print(f"  · {qid}: la clave cambió desde que se redactó la solución; se omitió")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--collect", type=Path, metavar="CARPETA", help="carpeta de lotes de prepare_batches.py")
    args = ap.parse_args()
    code = collect(args.collect) if args.collect else 0
    apply()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
