#!/usr/bin/env python3
"""Genera los ensayos curados (con desarrollo paso a paso) en src/data/exams/<asignatura>/.

El contenido vive en scripts/pipeline/curated/<asignatura>.py escrito con cadenas crudas (r"...") para que
el LaTeX se lea tal cual. Este script valida cada pregunta (clave existente, alternativas únicas, signos
$ balanceados, explicación con pasos) y escribe el JSON con el esquema de src/types/exam.ts.

Uso:
    python3 scripts/pipeline/build_curated.py
"""

from __future__ import annotations

import importlib
import json
import re
import subprocess
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from curated.tables import REFERENCE_TABLES  # noqa: E402

OFFICIAL = {  # minutos y preguntas de la prueba oficial completa
    "m1": (140, 65),
    "m2": (140, 55),
    "lectora": (150, 65),
    "ciencias": (160, 80),
    "historia": (120, 65),
}
LETTERS = "ABCDE"
UNESCAPED_DOLLAR = re.compile(r"(?<!\\)\$")


def _check_math(text: str, where: str, problems: list[str]) -> None:
    if len(UNESCAPED_DOLLAR.findall(text)) % 2:
        problems.append(f"{where}: signos $ desbalanceados")


def build(module_name: str) -> tuple[dict, list[str]]:
    mod = importlib.import_module(f"curated.{module_name}")
    meta = mod.EXAM
    subject = meta["subject"]
    exam_id = meta["id"]
    problems: list[str] = []
    questions = []
    passage_ids = {p["id"] for p in meta.get("passages", [])}
    for n, q in enumerate(meta["questions"], start=1):
        where = f"{exam_id} pregunta {n}"
        options = q["options"]
        if not 4 <= len(options) <= 5:
            problems.append(f"{where}: {len(options)} alternativas")
        if len(set(options)) != len(options):
            problems.append(f"{where}: alternativas repetidas")
        if q["answer"] not in LETTERS[: len(options)]:
            problems.append(f"{where}: clave {q['answer']} fuera de rango")
        if len(q["steps"]) < 2:
            problems.append(f"{where}: la explicación necesita al menos 2 pasos")
        if q.get("passage") and q["passage"] not in passage_ids:
            problems.append(f"{where}: lectura {q['passage']} inexistente")
        for k, text in enumerate([q["stem"], q["summary"], *options, *q["steps"], *(q.get("distractors") or {}).values()]):
            _check_math(text, f"{where} (texto {k})", problems)
        entry = {
            "id": f"{exam_id}-q{n:02d}",
            "number": n,
            "axis": q["axis"],
            "topic": q["topic"],
            **({"skill": q["skill"]} if q.get("skill") else {}),
            "difficulty": q.get("difficulty", "media"),
            **({"passageId": q["passage"]} if q.get("passage") else {}),
            "stem": q["stem"].strip(),
            "options": [{"key": LETTERS[i], "text": t.strip()} for i, t in enumerate(options)],
            "answer": q["answer"],
            "presentation": "text",
            "textQuality": "clean",
            "explanation": {
                "kind": "desarrollo",
                "summary": q["summary"].strip(),
                "steps": [s.strip() for s in q["steps"]],
                **({"distractors": q["distractors"]} if q.get("distractors") else {}),
            },
        }
        questions.append(entry)

    for p in meta.get("passages", []):
        _check_math(p["body"], f"{exam_id} {p['id']}", problems)

    minutes, official_n = OFFICIAL[subject]
    duration = max(10, round(minutes * len(questions) / official_n / 5) * 5)
    counts = {k: sum(1 for q in questions if q["answer"] == k) for k in LETTERS}
    exam = {
        "id": exam_id,
        "subject": subject,
        "title": meta["title"],
        "description": meta["description"],
        "year": meta.get("year", 2027),
        "modality": "curado",
        "source": "curado",
        "durationMinutes": meta.get("durationMinutes", duration),
        "scoring": {"method": "reference-table", "table": REFERENCE_TABLES[subject]},
        "generatedBy": "scripts/pipeline/build_curated.py",
        "passages": [
            {
                "id": p["id"],
                "title": p["title"],
                "body": p["body"].strip(),
                **({"footnotes": p["footnotes"]} if p.get("footnotes") else {}),
                **({"source": p["source"]} if p.get("source") else {}),
                "questionRange": [
                    min(q["number"] for q in questions if q.get("passageId") == p["id"]),
                    max(q["number"] for q in questions if q.get("passageId") == p["id"]),
                ],
            }
            for p in meta.get("passages", [])
        ],
        "questions": questions,
    }
    print(
        f"{'✓' if not problems else '✗'} {exam_id:22} {len(questions):3d} preguntas  {duration:3d} min  "
        f"claves {' '.join(f'{k}:{v}' for k, v in counts.items() if v)}"
    )
    return exam, problems


def main() -> int:
    all_problems: list[str] = []
    for name in ("m1", "m2", "lectora", "ciencias", "historia"):
        exam, problems = build(name)
        all_problems += problems
        if problems:
            continue
        dest = ROOT / "src" / "data" / "exams" / exam["subject"] / f"{exam['id']}.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(exam, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for p in all_problems:
        print("  ·", p)
    node = shutil.which("node")
    if node and not all_problems:
        subprocess.run([node, str(ROOT / "scripts" / "build-exam-index.mjs")], check=False, cwd=ROOT)
    return 1 if all_problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
