#!/usr/bin/env python3
"""Prepara lotes para profundizar las soluciones paso a paso que ya existen en src/data/exams/.

Toma todas las preguntas con `explanation` (las «solucion» de Invierno 2026–2027 y los «desarrollo» de los
ensayos curados) y las agrupa en lotes con su enunciado, alternativas, clave oficial, recorte .webp, lectura
asociada y la explicación actual. Un subagente reescribe cada explicación con la estructura
Planteamiento → Paso a paso → Análisis de distractores (ver INSTRUCCIONES.md) y `validate_deepen.py` la
valida antes de fusionarla con `merge_solutions.py --collect-deep`.

Las preguntas del Módulo Común de Ciencias se repiten en las tres pruebas del mismo año: se profundizan una
sola vez y `dupes.json` registra dónde se replican.

Con `--missing` toma en cambio las preguntas SIN explicación (`current` queda en null y se redactan desde cero), y
`--only <regex>` limita los ensayos por id.

Uso: python3 scripts/pipeline/solutions/prepare_deepen.py --work <carpeta> [--missing] [--only <regex>]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
EXAMS = ROOT / "src" / "data" / "exams"
PUBLIC = ROOT / "public"
CHUNK = 24


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
        "current": q.get("explanation"),
    }


def chunks(items: list[dict], size: int = CHUNK) -> list[list[dict]]:
    if not items:
        return []
    n = -(-len(items) // size)
    step = -(-len(items) // n)
    return [items[i * step:(i + 1) * step] for i in range(n)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", type=Path, required=True)
    ap.add_argument("--missing", action="store_true", help="preguntas sin explicación, en vez de las que ya tienen")
    ap.add_argument("--only", type=re.compile, help="regex sobre el id del ensayo")
    args = ap.parse_args()
    work: Path = args.work.resolve()
    work.mkdir(parents=True, exist_ok=True)
    shutil.copy(HERE / "INSTRUCCIONES_PROFUNDIZAR.md", work / "INSTRUCCIONES.md")
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

    exams = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(EXAMS.glob("*/*.json"))]
    exams = [e for e in exams if "questions" in e and (not args.only or args.only.search(e["id"]))]
    science_seen: dict[str, str] = {}
    science: dict[str, list[dict]] = {}

    for exam in exams:
        explained = [q for q in exam["questions"] if bool(q.get("explanation")) != args.missing]
        if not explained:
            continue
        tag = exam["id"].replace("ciencias-", "")
        if exam["subject"] == "lectora":
            # Dos lecturas por lote: el subagente las lee completas.
            by_passage: dict[str, list[dict]] = {}
            for q in explained:
                by_passage.setdefault(q.get("passageId") or "", []).append(q)
            passages = [p for p in exam["passages"] if p["id"] in by_passage]
            for i in range(0, len(passages), 2):
                files, items = {}, []
                for p in passages[i:i + 2]:
                    name = f"{p['id']}.md"
                    notes = "\n\n".join(p.get("footnotes", []))
                    files[name] = f"# {p['title']}\n\n{p['body']}\n\n{notes}".strip() + "\n"
                    items += [item(exam, q, name) for q in by_passage[p["id"]]]
                emit(f"{tag}-{i // 2 + 1}", items, files)
            if by_passage.get(""):
                emit(f"{tag}-sueltas", [item(exam, q, None) for q in by_passage[""]], {})
        elif exam["subject"] == "ciencias":
            group = f"ciencias-{exam.get('admissionYear', exam['year'])}-{exam['modality']}"
            for q in explained:
                k = norm(q["stem"]) + "|" + norm(" ".join(o["text"] for o in q["options"])) + "|" + q["answer"]
                if k in science_seen:
                    dupes.setdefault(science_seen[k], []).append(q["id"])
                else:
                    science_seen[k] = q["id"]
                    science.setdefault(group, []).append(item(exam, q, None))
        else:
            for i, part in enumerate(chunks([item(exam, q, None) for q in explained]), start=1):
                emit(f"{tag}-{i}", part, {})

    for group, items in science.items():
        for i, part in enumerate(chunks(items), start=1):
            emit(f"{group}-{i}", part, {})

    (work / "batches.json").write_text(json.dumps(batches, indent=1), encoding="utf-8")
    (work / "dupes.json").write_text(json.dumps(dupes, indent=1), encoding="utf-8")
    total = sum(b["count"] for b in batches)
    print(f"{len(batches)} lotes, {total} preguntas únicas, {sum(len(v) for v in dupes.values())} duplicadas en Ciencias")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
