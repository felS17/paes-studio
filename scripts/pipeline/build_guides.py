#!/usr/bin/env python3
"""Genera src/data/guides.json: guías de ejercicios resueltos por subtema (vista `guías`, pestaña `ejercicios`).

El contenido vive en scripts/pipeline/guides/<materia>.py con cadenas crudas (r"...") para leer el LaTeX tal cual.
Este script valida cada ejercicio (subtema vigente, clave existente, alternativas únicas y en la cantidad de la
prueba oficial, signos $ balanceados y al menos 2 pasos) y agrega del temario el título, el eje y cuántas preguntas
oficiales del banco tiene el subtema. Las fórmulas se compilan con KaTeX en `npm run validate:exams`.

Uso:
    python3 scripts/pipeline/build_guides.py
"""

from __future__ import annotations

import importlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

TEMARIO = ROOT / "src" / "data" / "temario" / "index.json"
OUT = ROOT / "src" / "data" / "guides.json"
MODULES = ("m1", "m2", "ciencias")
OPTION_COUNT = {"m1": 4, "m2": 4, "ciencias": 5}
LETTERS = "ABCDE"
UNESCAPED_DOLLAR = re.compile(r"(?<!\\)\$")


def main() -> int:
    temario = json.loads(TEMARIO.read_text(encoding="utf-8"))
    subtopics = {
        sub["id"]: {**sub, "subject": s["subject"], "axis": e["name"]}
        for s in temario["subjects"] for e in s["axes"] for sub in e["subtopics"]
    }
    problems: list[str] = []
    guides = []
    for name in MODULES:
        for g in importlib.import_module(f"guides.{name}").GUIDES:
            sub = subtopics.get(g["subtopic"])
            if not sub or sub.get("retired"):
                problems.append(f"{g['subtopic']}: no es un subtema vigente")
                continue
            exercises = []
            for n, e in enumerate(g["exercises"], start=1):
                where = f"{g['subtopic']} ejercicio {n}"
                opts = e["options"]
                if len(opts) != OPTION_COUNT[sub["subject"]]:
                    problems.append(f"{where}: {len(opts)} alternativas")
                if len(set(opts)) != len(opts):
                    problems.append(f"{where}: alternativas repetidas")
                if e["answer"] not in LETTERS[: len(opts)]:
                    problems.append(f"{where}: clave fuera de rango")
                if len(e["steps"]) < 2:
                    problems.append(f"{where}: necesita al menos 2 pasos")
                bad = set(e["distractors"]) - set(LETTERS[: len(opts)]) | ({e["answer"]} & set(e["distractors"]))
                if bad:
                    problems.append(f"{where}: distractores inválidos {sorted(bad)}")
                for k, text in enumerate([e["stem"], e["summary"], *opts, *e["steps"], *e["distractors"].values()]):
                    if len(UNESCAPED_DOLLAR.findall(text)) % 2:
                        problems.append(f"{where} (texto {k}): signos $ desbalanceados")
                exercises.append({
                    "stem": e["stem"].strip(),
                    "options": [{"key": LETTERS[i], "text": t.strip()} for i, t in enumerate(opts)],
                    "answer": e["answer"],
                    # Redactadas con IA: la interfaz lo indica con la etiqueta de las soluciones («solucion»).
                    "explanation": {
                        "kind": "solucion",
                        "summary": e["summary"].strip(),
                        "steps": [s.strip() for s in e["steps"]],
                        **({"distractors": e["distractors"]} if e["distractors"] else {}),
                    },
                })
            guides.append({
                "id": g["subtopic"],
                "subject": sub["subject"],
                "subtopic": g["subtopic"],
                "axis": sub["axis"],
                "title": sub["title"],
                "pattern": g["pattern"],
                "officialCount": sub.get("questionCount", 0),
                "exercises": exercises,
            })
    for p in problems:
        print("  ·", p)
    if problems:
        return 1
    OUT.write_text(json.dumps(guides, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    total = sum(len(g["exercises"]) for g in guides)
    print(f"✓ guides.json: {len(guides)} guías, {total} ejercicios resueltos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
