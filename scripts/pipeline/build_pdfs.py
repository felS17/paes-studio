#!/usr/bin/env python3
"""Compila los compendios y presentaciones de latex/output/ a PDF y los publica en public/pdfs/.

Los .tex se compilan tal cual (pdfLaTeX, dos pasadas para el índice y el total de diapositivas).
Si al TeX Live local le faltan dependencias que tcolorbox carga pero estos documentos no usan
(tikzfill.image, pdfcol, listingsutf8), se agregan a TEXINPUTS solo los sustitutos de latex/compat/
que correspondan; si el paquete real existe, se usa el real.

Escribe además src/data/pdfs.json ({archivo .tex: {pdf, pages, bytes}}), que lee la vista de Material.

Uso: python3 scripts/pipeline/build_pdfs.py [--only guia_m1 beamer_m1 ...]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "latex" / "output"
COMPAT = ROOT / "latex" / "compat"
PUBLIC = ROOT / "public" / "pdfs"
DATA = ROOT / "src" / "data" / "pdfs.json"


def needed_shims() -> list[Path]:
    """Sustitutos de latex/compat cuyo paquete real no está instalado."""
    shims = []
    for shim in sorted(COMPAT.glob("*.sty")):
        found = subprocess.run(["kpsewhich", shim.name], capture_output=True, text=True).stdout.strip()
        if not found:
            shims.append(shim)
    return shims


def compile_one(tex: Path, build: Path, env: dict[str, str]) -> tuple[Path, int, list[str]]:
    log_path = build / f"{tex.stem}.log"
    for _ in range(2):
        r = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", f"-output-directory={build}", tex.name],
            cwd=OUTPUT, env=env, capture_output=True, text=True, errors="replace",
        )
        if r.returncode:
            log = log_path.read_text(errors="replace") if log_path.exists() else r.stdout
            errors = [ln for ln in log.splitlines() if ln.startswith("!")][:5]
            raise RuntimeError(f"{tex.name}: pdflatex terminó con código {r.returncode}: {' | '.join(errors)}")
    log = log_path.read_text(errors="replace")
    m = re.search(r"Output written on .*?\((\d+) pages?", log.replace("\n", ""))
    if not m:
        raise RuntimeError(f"{tex.name}: no se generó el PDF")
    warnings = []
    if (n := log.count("Overfull \\hbox")):
        warnings.append(f"{n} overfull hbox")
    if (n := log.count("Missing character")):
        warnings.append(f"{n} caracteres faltantes")
    if "Rerun to get" in log or "There were undefined references" in log:
        warnings.append("referencias sin resolver")
    return build / f"{tex.stem}.pdf", int(m.group(1)), warnings


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="nombres sin extensión (por defecto, todo el manifest)")
    args = ap.parse_args()
    if not shutil.which("pdflatex"):
        print("pdflatex no está instalado: no se compilan los PDF.", file=sys.stderr)
        return 1

    manifest = json.loads((OUTPUT / "manifest.json").read_text(encoding="utf-8"))
    files = [e["file"] for e in manifest]
    if args.only:
        files = [f for f in files if Path(f).stem in set(args.only)]

    PUBLIC.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else {}
    failures = 0
    with tempfile.TemporaryDirectory(prefix="paes-pdf-") as tmp:
        build, shim_dir = Path(tmp) / "build", Path(tmp) / "compat"
        build.mkdir()
        shim_dir.mkdir()
        shims = needed_shims()
        for s in shims:
            shutil.copy(s, shim_dir / s.name)
        env = dict(os.environ)
        if shims:
            env["TEXINPUTS"] = f"{shim_dir}//:{env.get('TEXINPUTS', '')}"
            print("Sustitutos locales:", ", ".join(s.name for s in shims))
        for name in files:
            try:
                pdf, pages, warnings = compile_one(OUTPUT / name, build, env)
            except RuntimeError as e:
                failures += 1
                print(f"✗ {e}")
                continue
            dest = PUBLIC / pdf.name
            shutil.copy(pdf, dest)
            data[name] = {"pdf": f"/pdfs/{pdf.name}", "pages": pages, "bytes": dest.stat().st_size}
            print(f"✓ {pdf.name:24} {pages:3d} páginas  {dest.stat().st_size / 1024:6.0f} KB" + (f"  ({', '.join(warnings)})" if warnings else ""))

    DATA.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(files) - failures}/{len(files)} PDF en {PUBLIC.relative_to(ROOT)}; metadatos en {DATA.relative_to(ROOT)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
