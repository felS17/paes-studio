#!/usr/bin/env python3
"""Prepara lotes de preguntas de la PAES de Invierno 2026 y 2027 para redactar soluciones específicas.

Cada lote es una carpeta con `input.json` (enunciado, alternativas, clave oficial, ruta absoluta del recorte
.webp y de la lectura asociada) que un subagente resuelve escribiendo `output.json`. Las preguntas del Módulo
Común de Ciencias se repiten entre las pruebas de Biología, Física y Química del mismo año: se resuelven una
sola vez y `dupes.json` registra dónde se replican.

Uso: python3 scripts/pipeline/solutions/prepare_batches.py --work <carpeta>
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EXAMS = ROOT / "src" / "data" / "exams"
PUBLIC = ROOT / "public"
TARGETS = ["m1", "m2", "lectora", "historia", "ciencias"]
YEARS = ["2026", "2027"]
CHUNK = 22


def norm(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\W+", " ", t).strip()[:220]


def item(exam: dict, q: dict, passage_file: str | None) -> dict:
    snap = q.get("snapshot")
    return {
        "id": q["id"],
        "exam": exam["id"],
        "subject": exam["subject"],
        "area": exam.get("area"),
        "number": q["number"],
        "axis": q["axis"],
        "topic": q.get("topic"),
        "stem": q["stem"],
        "options": q["options"],
        "answer": q["answer"],
        "text_quality": "aproximado" if q.get("textQuality") == "approximate" else "fiel",
        "image": str(PUBLIC / snap["src"].lstrip("/")) if snap else None,
        "passage_file": passage_file,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", type=Path, required=True)
    args = ap.parse_args()
    work: Path = args.work
    work.mkdir(parents=True, exist_ok=True)
    batches: list[dict] = []
    dupes: dict[str, list[str]] = {}

    def emit(batch_id: str, items: list[dict], passages: dict[str, str]):
        d = work / batch_id
        d.mkdir(parents=True, exist_ok=True)
        for name, body in passages.items():
            (d / name).write_text(body, encoding="utf-8")
        for it in items:
            if it["passage_file"]:
                it["passage_file"] = str(d / it["passage_file"])
        (d / "input.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
        batches.append({"id": batch_id, "dir": str(d), "count": len(items)})

    for year in YEARS:
        for subject in ["m1", "m2", "historia"]:
            exam = json.loads((EXAMS / subject / f"{subject}-{year}-invierno.json").read_text())
            qs = exam["questions"]
            n = -(-len(qs) // CHUNK)
            size = -(-len(qs) // n)
            for i in range(n):
                emit(f"{subject}-{year}-{i + 1}", [item(exam, q, None) for q in qs[i * size:(i + 1) * size]], {})
        # Lectora: dos lecturas por lote.
        exam = json.loads((EXAMS / "lectora" / f"lectora-{year}-invierno.json").read_text())
        groups: list[list[dict]] = []
        for p in exam["passages"]:
            groups.append([q for q in exam["questions"] if q.get("passageId") == p["id"]])
        loose = [q for q in exam["questions"] if not q.get("passageId")]
        for i in range(0, len(exam["passages"]), 2):
            ps = exam["passages"][i:i + 2]
            files, items = {}, []
            for p, qs in zip(ps, groups[i:i + 2]):
                name = f"{p['id']}.md"
                notes = "\n\n".join(p.get("footnotes", []))
                files[name] = f"# {p['title']}\n\n{p['body']}\n\n{notes}".strip() + "\n"
                items += [item(exam, q, name) for q in qs]
            emit(f"lectora-{year}-{i // 2 + 1}", items, files)
        if loose:
            emit(f"lectora-{year}-sueltas", [item(exam, q, None) for q in loose], {})
        # Ciencias: preguntas únicas del año (el Módulo Común aparece en las tres pruebas).
        seen: dict[str, str] = {}
        unique: list[dict] = []
        for area in ["biologia", "fisica", "quimica"]:
            exam = json.loads((EXAMS / "ciencias" / f"ciencias-{area}-{year}-invierno.json").read_text())
            for q in exam["questions"]:
                k = norm(q["stem"]) + "|" + norm(" ".join(o["text"] for o in q["options"])) + "|" + q["answer"]
                if k in seen:
                    dupes.setdefault(seen[k], []).append(q["id"])
                else:
                    seen[k] = q["id"]
                    unique.append(item(exam, q, None))
        n = -(-len(unique) // CHUNK)
        size = -(-len(unique) // n)
        for i in range(n):
            emit(f"ciencias-{year}-{i + 1}", unique[i * size:(i + 1) * size], {})

    (work / "batches.json").write_text(json.dumps(batches, indent=1), encoding="utf-8")
    (work / "dupes.json").write_text(json.dumps(dupes, indent=1), encoding="utf-8")
    total = sum(b["count"] for b in batches)
    print(f"{len(batches)} lotes, {total} preguntas únicas, {sum(len(v) for v in dupes.values())} duplicadas en Ciencias")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
