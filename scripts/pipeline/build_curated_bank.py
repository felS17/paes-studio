#!/usr/bin/env python3
"""Arma ensayos curados con preguntas reales del banco DEMRE (`<materia>-curado-2`, `-3`, …).

A diferencia de `build_curated.py` (preguntas originales escritas a mano), aquí cada pregunta es una pregunta oficial
ya extraída, con su clave y su explicación paso a paso validada. Se copia con un id propio del ensayo curado y guarda
su procedencia en `origin` (id de la pregunta oficial), para que:

- el índice del catálogo no la cuente dos veces en los temas, las prácticas ni el desafío diario;
- `assign_subtopics.py` conserve el subtema de la original;
- la interfaz pueda decir de qué prueba viene.

Criterios de selección (deterministas, sin azar):
- solo preguntas oficiales con explicación, que puntúan (no piloto) y de un subtema vigente del temario 2027;
- reparto por eje según el peso de cada eje en las pruebas oficiales, rotando por subtemas para cubrir el temario;
- de la prueba más reciente a la más antigua, sin repetir preguntas entre los curados de una misma materia;
- Lectora toma lecturas completas (todas sus preguntas, con explicación) de pruebas distintas.

Uso:
    python3 scripts/pipeline/build_curated_bank.py            # escribe los JSON y regenera el índice
    python3 scripts/pipeline/build_curated_bank.py --dry-run  # solo muestra el resumen
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from curated.tables import REFERENCE_TABLES  # noqa: E402

EXAMS = ROOT / "src" / "data" / "exams"
TEMARIO = ROOT / "src" / "data" / "temario" / "index.json"
OFFICIAL = {"m1": (140, 65), "m2": (140, 55), "lectora": (150, 65), "ciencias": (160, 80), "historia": (120, 65)}
SUBJECT_NAME = {"m1": "M1", "m2": "M2", "lectora": "Competencia Lectora", "ciencias": "Ciencias", "historia": "Historia"}
# Ensayos nuevos por materia: (número del curado, preguntas). Lectora cuenta lecturas, no preguntas.
PLAN = {
    "m1": [(2, 30), (3, 30)],
    "m2": [(2, 25), (3, 25)],
    "ciencias": [(2, 30), (3, 30)],
    "historia": [(2, 30), (3, 30)],
    "lectora": [(2, 3), (3, 3)],
}
COPY = ("axis", "topic", "subtopic", "skill", "difficulty", "stem", "options", "answer", "presentation", "snapshot", "textQuality", "explanation")


def load_official(subject: str) -> list[dict]:
    exams = []
    for path in sorted((EXAMS / subject).glob("*.json")):
        exam = json.loads(path.read_text(encoding="utf-8"))
        if exam.get("source") == "demre":
            exams.append(exam)
    # Más recientes primero; Regular antes que Invierno en el mismo año.
    exams.sort(key=lambda e: (-int(e["year"]), 0 if e["modality"] == "regular" else 1, e.get("area") or ""))
    return exams


def vigentes() -> set[str]:
    index = json.loads(TEMARIO.read_text(encoding="utf-8"))
    return {sub["id"] for s in index["subjects"] for e in s["axes"] for sub in e["subtopics"] if not sub.get("retired")}


def usable(q: dict, current: set[str]) -> bool:
    return bool(q.get("explanation")) and not q.get("pilot") and q.get("subtopic") in current


def quotas(weights: Counter[str], n: int) -> dict[str, int]:
    """Reparte `n` preguntas entre ejes en proporción a su peso (mayores restos)."""
    total = sum(weights.values())
    raw = {axis: n * w / total for axis, w in weights.items()}
    out = {axis: int(v) for axis, v in raw.items()}
    for axis, _ in sorted(raw.items(), key=lambda kv: kv[1] - int(kv[1]), reverse=True)[: n - sum(out.values())]:
        out[axis] += 1
    return out


def pick_questions(subject: str, exams: list[dict], n: int, used: set[str], current: set[str]) -> list[tuple[dict, dict]]:
    weights: Counter[str] = Counter()
    # Pool por eje y, dentro del eje, por subtema; cada subtema conserva el orden de prueba más reciente primero.
    pool: dict[str, dict[str, list[tuple[dict, dict]]]] = defaultdict(lambda: defaultdict(list))
    for exam in exams:
        for q in exam["questions"]:
            if q.get("passageId"):
                continue
            weights[q["axis"]] += 1
            if usable(q, current) and q["id"] not in used:
                pool[q["axis"]][q["subtopic"]].append((exam, q))
    weights = Counter({axis: w for axis, w in weights.items() if axis in pool})
    chosen: list[tuple[dict, dict]] = []
    for axis, quota in quotas(weights, n).items():
        subs = pool[axis]
        # Rotación por subtema (de más a menos preguntas en el banco) para cubrir el temario y no repetir patrón.
        order = sorted(subs, key=lambda s: (-len(subs[s]), s))
        taken: list[tuple[dict, dict]] = []
        round_ = 0
        while len(taken) < quota and any(len(subs[s]) > round_ for s in order):
            for s in order:
                if len(taken) < quota and len(subs[s]) > round_:
                    # Alterna la prueba de origen: en cada vuelta toma la siguiente pregunta del subtema.
                    taken.append(subs[s][round_])
            round_ += 1
        chosen += taken
    for _, q in chosen:
        used.add(q["id"])
    # Orden de presentación: por eje (como en la prueba oficial) y, dentro del eje, por subtema.
    axis_order = list(dict.fromkeys(q["axis"] for e in exams for q in e["questions"]))
    chosen.sort(key=lambda eq: (axis_order.index(eq[1]["axis"]), eq[1]["subtopic"], -int(eq[0]["year"])))
    return chosen


def pick_passages(exams: list[dict], n: int, used: set[str], current: set[str]) -> list[tuple[dict, dict, list[dict]]]:
    chosen: list[tuple[dict, dict, list[dict]]] = []
    seen_exams: set[str] = set()
    for exam in exams:
        if len(chosen) >= n:
            break
        if exam["id"] in seen_exams:
            continue
        for p in exam["passages"]:
            key = f"{exam['id']}/{p['id']}"
            qs = [q for q in exam["questions"] if q.get("passageId") == p["id"]]
            if key in used or len(qs) < 4 or not all(usable(q, current) for q in qs):
                continue
            used.add(key)
            seen_exams.add(exam["id"])
            chosen.append((exam, p, qs))
            break
    return chosen


def copy_question(exam_id: str, number: int, source: dict, q: dict, passage_id: str | None = None) -> dict:
    out = {"id": f"{exam_id}-q{number:02d}", "number": number, "origin": q["id"]}
    for k in COPY:
        if k in q:
            out[k] = q[k]
    if passage_id:
        out["passageId"] = passage_id
    return out


def source_label(exam: dict) -> str:
    return f"{exam['title']}" + (f" ({exam['area']})" if exam.get("area") else "")


def build(subject: str, number: int, size: int, exams: list[dict], used: set[str], current: set[str]) -> dict:
    exam_id = f"{subject}-curado-{number}"
    questions: list[dict] = []
    passages: list[dict] = []
    if subject == "lectora":
        for i, (src, p, qs) in enumerate(pick_passages(exams, size, used, current), start=1):
            pid = f"lectura-{i}"
            start = len(questions) + 1
            for q in qs:
                questions.append(copy_question(exam_id, len(questions) + 1, src, q, pid))
            passages.append({
                "id": pid,
                "title": f"Lectura {i}",
                "body": p["body"],
                **({"footnotes": p["footnotes"]} if p.get("footnotes") else {}),
                "source": f"{src['title']}, {p['title'].lower()}",
                "questionRange": [start, len(questions)],
            })
    else:
        for src, q in pick_questions(subject, exams, size, used, current):
            questions.append(copy_question(exam_id, len(questions) + 1, src, q))
    minutes, official_n = OFFICIAL[subject]
    origins = sorted({q["origin"].rsplit("-q", 1)[0] for q in questions})
    years = sorted({int(e["year"]) for e in exams if e["id"] in origins})
    span = f"{years[0]} a {years[-1]}" if years[0] != years[-1] else str(years[0])
    what = f"{len(passages)} lecturas completas ({len(questions)} preguntas)" if passages else f"{len(questions)} preguntas"
    return {
        "id": exam_id,
        "subject": subject,
        "title": f"Ensayo curado {number}",
        "description": (
            f"{what} oficiales del DEMRE (pruebas rendidas de {span}) que recorren los ejes de {SUBJECT_NAME[subject]}, "
            "cada una con su explicación paso a paso y la prueba de la que viene."
        ),
        "year": 2027,
        "modality": "curado",
        "source": "curado",
        "durationMinutes": max(10, round(minutes * len(questions) / official_n / 5) * 5),
        "scoring": {"method": "reference-table", "table": REFERENCE_TABLES[subject]},
        "generatedBy": "scripts/pipeline/build_curated_bank.py",
        "passages": passages,
        "questions": questions,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    current = vigentes()
    problems: list[str] = []
    for subject, plan in PLAN.items():
        exams = load_official(subject)
        by_id = {q["id"]: q for e in exams for q in e["questions"]}
        used: set[str] = set()
        for number, size in plan:
            exam = build(subject, number, size, exams, used, current)
            for q in exam["questions"]:
                src = by_id[q["origin"]]
                if src["answer"] != q["answer"] or not any(o["key"] == q["answer"] for o in q["options"]):
                    problems.append(f"{q['id']}: clave distinta de {q['origin']}")
            axes = Counter(q["axis"] for q in exam["questions"])
            subs = len({q["subtopic"] for q in exam["questions"]})
            print(
                f"{exam['id']:20} {len(exam['questions']):3d} preguntas  {exam['durationMinutes']:3d} min  {subs:2d} subtemas  "
                + ", ".join(f"{a} {c}" for a, c in axes.items())
            )
            if not args.dry_run:
                dest = EXAMS / subject / f"{exam['id']}.json"
                dest.write_text(json.dumps(exam, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for p in problems:
        print("  ·", p)
    node = shutil.which("node")
    if node and not args.dry_run and not problems:
        subprocess.run([node, str(ROOT / "scripts" / "build-exam-index.mjs")], check=False, cwd=ROOT)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
