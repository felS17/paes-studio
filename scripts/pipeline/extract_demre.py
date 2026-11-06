#!/usr/bin/env python3
"""Pipeline DEMRE → PAES Studio.

Recorre los folletos oficiales (`pruebas-oficiales/`) y sus clavijeros (`facsimiles-oficiales/`), segmenta
lecturas y preguntas, cruza cada pregunta con su clave oficial, genera recortes WebP de las preguntas con
fórmulas o figuras y escribe un JSON por ensayo en `src/data/exams/<asignatura>/`.

Uso:
    python3 scripts/pipeline/extract_demre.py                    # procesa todo
    python3 scripts/pipeline/extract_demre.py --subject m1 --year 2025
    python3 scripts/pipeline/extract_demre.py --dry-run          # solo reporta, no escribe
    python3 scripts/pipeline/extract_demre.py --list             # muestra el cruce prueba ↔ clavijero

Requisitos: `pip install -r scripts/pipeline/requirements.txt` (PyMuPDF + Pillow).
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))

from demre.answer_keys import parse_answer_key  # noqa: E402
from demre.builder import BuildOptions, build_exam  # noqa: E402
from demre.catalog import discover, resolve_dir  # noqa: E402
from demre.layout import analyse  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tests-dir", type=Path, help="Carpeta con los folletos (por defecto pruebas-oficiales/)")
    ap.add_argument("--keys-dir", type=Path, help="Carpeta con clavijeros (por defecto facsimiles-oficiales/)")
    ap.add_argument("--out", type=Path, default=ROOT / "src" / "data" / "exams", help="Destino de los JSON")
    ap.add_argument("--assets", type=Path, default=ROOT / "public" / "exam-assets", help="Destino de los WebP")
    ap.add_argument("--subject", choices=["m1", "m2", "lectora", "ciencias", "historia"], action="append")
    ap.add_argument("--year", type=int, action="append", help="Año de admisión (p. ej. 2025)")
    ap.add_argument("--modality", choices=["regular", "invierno"], action="append")
    ap.add_argument("--include-unkeyed", action="store_true", help="Reporta también pruebas sin clavijero")
    ap.add_argument("--no-snapshots", action="store_true", help="No renderiza imágenes (solo texto)")
    ap.add_argument("--zoom", type=float, default=1.75, help="Escala de render (1.75 ≈ 126 dpi)")
    ap.add_argument("--quality", type=int, default=66, help="Calidad WebP (0-100)")
    ap.add_argument("--dry-run", action="store_true", help="Procesa y reporta sin escribir archivos")
    ap.add_argument("--list", action="store_true", help="Solo lista el cruce prueba ↔ clavijero")
    ap.add_argument("--report", type=Path, default=ROOT / "scripts" / "pipeline" / "last_report.json")
    return ap.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    tests_dir = args.tests_dir or resolve_dir(ROOT, "pruebas-oficiales", "Pruebas_DEMRE")
    keys_dir = args.keys_dir or resolve_dir(ROOT, "facsimiles-oficiales", "Clavijeros_Pruebas_DEMRE")
    if tests_dir is None:
        print("✗ No se encontró la carpeta de pruebas (pruebas-oficiales/).", file=sys.stderr)
        return 1

    pairs, ignored = discover(tests_dir, keys_dir)
    pairs = [
        (t, k) for t, k in pairs
        if (not args.subject or t.subject in args.subject)
        and (not args.year or t.admission_year in args.year)
        and (not args.modality or t.modality in args.modality)
    ]

    print(f"Pruebas: {tests_dir}\nClavijeros: {keys_dir}\n")
    if args.list:
        for t, k in pairs:
            print(f"  {t.exam_id:34} ← {t.path.name}\n  {'':34}   clave: {k.path.name if k else '— sin clavijero —'}")
        for p in ignored:
            print(f"  (ignorado) {p.name}")
        return 0

    opts = BuildOptions(
        assets_dir=args.assets, snapshots=not args.no_snapshots and not args.dry_run,
        zoom=args.zoom, quality=args.quality,
    )
    summary = []
    total_bytes = 0
    for test, key_src in pairs:
        if key_src is None:
            msg = "sin clavijero: se omite (no hay claves para corregir)"
            print(f"⚠ {test.exam_id:34} {msg}")
            summary.append({"exam": test.exam_id, "status": "skipped", "reason": msg})
            continue
        key = parse_answer_key(key_src.path)
        problems = key.validate()
        with pymupdf.open(test.path) as doc:
            layout = analyse(doc, expected_numbers=set(key.answers) | key.voided)
            exam, report = build_exam(test, key, doc, layout, opts)
        report.warnings = problems + report.warnings
        if not args.dry_run:
            dest = args.out / test.subject / f"{test.exam_id}.json"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(exam, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        total_bytes += report.bytes_written
        status = "✓" if not report.warnings else "△"
        print(
            f"{status} {test.exam_id:34} {report.questions:3d} preguntas  {report.passages:2d} lecturas  "
            f"{report.snapshots:3d} recortes  {report.bytes_written / 1024:7.0f} KB"
            + (f"  omitidas={report.skipped}" if report.skipped else "")
        )
        for w in report.warnings[:6]:
            print(f"    · {w}")
        summary.append({
            "exam": test.exam_id, "status": "ok", "questions": report.questions, "passages": report.passages,
            "snapshots": report.snapshots, "bytes": report.bytes_written, "skipped": report.skipped,
            "warnings": report.warnings,
        })

    print(f"\nTotal recortes: {total_bytes / 1024 / 1024:.1f} MB")
    if not args.dry_run:
        args.report.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        # Vuelve a aplicar las soluciones paso a paso guardadas (soluciones.json).
        subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "solutions" / "merge_solutions.py")], check=False, cwd=ROOT)
        # Subtema del temario DEMRE para cada pregunta (explorador por subtemas, drills y Zettelkasten).
        subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "assign_subtopics.py")], check=False, cwd=ROOT)
        node = shutil.which("node")
        index_script = ROOT / "scripts" / "build-exam-index.mjs"
        if node and index_script.exists():
            subprocess.run([node, str(index_script)], check=False, cwd=ROOT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
