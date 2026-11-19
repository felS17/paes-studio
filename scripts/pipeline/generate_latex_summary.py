#!/usr/bin/env python3
"""Genera compendios de estudio (guías LaTeX a dos columnas) y presentaciones Beamer 16:9 por asignatura.

Fuentes:
  * scripts/pipeline/temario/<asignatura>.py: teoría, recuadros (fórmulas, leyes, mecanismos), esquemas
    comparativos, líneas de tiempo, ideas clave, método, trampas DEMRE y un ejemplo resuelto por subtema.
  * src/data/exams/**: frecuencia de cada eje en los ensayos (oficiales + curados) y preguntas curadas con
    desarrollo verificado, que se agregan como ejemplos tipo PAES en el subtema que les corresponde.

Salida (latex/output/):
  * guia_<asignatura>.tex   compendio completo: recorre cada eje y subtema del temario.
  * beamer_<asignatura>.tex resumen en láminas (latex_deck.py): qué se repite en las pruebas oficiales y, por
                            tema, teoría y ejercicios oficiales del DEMRE con su solución.

Uso:
    python3 scripts/pipeline/generate_latex_summary.py                 # todas las asignaturas
    python3 scripts/pipeline/generate_latex_summary.py --subject m1
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from temario import SUBJECTS, all_subtopics, load  # noqa: E402
import latex_deck  # noqa: E402


def vigente(temario: dict) -> dict:
    """Solo el temario vigente (Admisión 2027): las guías no incluyen los subtemas que el DEMRE ya no evalúa."""
    ejes = [{**e, "subtemas": [s for s in e["subtemas"] if s.get("vigente", True)]} for e in temario["ejes"]]
    return {**temario, "ejes": [e for e in ejes if e["subtemas"]]}

EXAMS_DIR = ROOT / "src" / "data" / "exams"
TEMPLATES = ROOT / "latex" / "templates"
OUTPUT = ROOT / "latex" / "output"
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
          "octubre", "noviembre", "diciembre"]
CAJA_ENV = {"formula": "formula", "definicion": "definicion", "mecanismo": "mecanismo", "ley": "ley"}

# ───────────────────────────── Markdown + LaTeX → LaTeX ─────────────────────────────

MATH_RE = re.compile(r"(?<!\\)\$\$(.+?)(?<!\\)\$\$|(?<!\\)\$(.+?)(?<!\\)\$", re.S)
TEXT_UNICODE = {
    "−": "$-$", "→": r"$\rightarrow$", "←": r"$\leftarrow$", "≤": r"$\le$", "≥": r"$\ge$",
    "≠": r"$\neq$", "×": r"$\times$", "·": r"$\cdot$", "÷": r"$\div$", "±": r"$\pm$", "≈": r"$\approx$",
    "π": r"$\pi$", "α": r"$\alpha$", "β": r"$\beta$", "θ": r"$\theta$", "Δ": r"$\Delta$", "Ω": r"$\Omega$",
    "μ": r"$\mu$", "λ": r"$\lambda$", "√": r"$\surd$", "∞": r"$\infty$", "…": r"\ldots{}",
    "°": r"\textdegree{}", "\u00a0": "~", "\u2009": r"\,", "\u202f": r"\,",
    "¹": r"\textsuperscript{1}", "²": r"\textsuperscript{2}", "³": r"\textsuperscript{3}",
    "⁴": r"\textsuperscript{4}", "⁵": r"\textsuperscript{5}", "⁶": r"\textsuperscript{6}",
    "⁷": r"\textsuperscript{7}", "⁸": r"\textsuperscript{8}", "⁹": r"\textsuperscript{9}", "⁰": r"\textsuperscript{0}",
}
MATH_UNICODE = {"°": r"^{\circ}", "−": "-", "·": r"\cdot ", "×": r"\times ", "≤": r"\le ", "≥": r"\ge "}


def _plain_math_letters(text: str) -> str:
    """Letras matemáticas Unicode (𝑂, 𝐱, …, U+1D400–U+1D7FF) a su letra normal: pdfLaTeX no las tiene."""
    return "".join(unicodedata.normalize("NFKC", c) if 0x1D400 <= ord(c) <= 0x1D7FF else c for c in text)


def _escape_text(text: str) -> str:
    text = _plain_math_letters(text)
    text = text.replace(r"\$", "\x00D\x00").replace("\\\\", "\x00B\x00")
    text = text.replace("\\", r"\textbackslash{}")
    for ch, rep in (("&", r"\&"), ("%", r"\%"), ("#", r"\#"), ("_", r"\_"), ("{", r"\{"), ("}", r"\}"),
                    ("~", r"\textasciitilde{}"), ("^", r"\textasciicircum{}")):
        text = text.replace(ch, rep)
    text = re.sub(r"\*\*(.+?)\*\*", r"\\textbf{\1}", text)
    text = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"\\emph{\1}", text)
    text = "".join(TEXT_UNICODE.get(ch, ch) for ch in text)
    return text.replace("\x00D\x00", r"\$").replace("\x00B\x00", r"\textbackslash{}")


def _fix_math(tex: str) -> str:
    return "".join(MATH_UNICODE.get(ch, ch) for ch in _plain_math_letters(tex.strip()))


def display_math(tex: str) -> str:
    r"""Fórmula destacada. Las cadenas separadas por \qquad se apilan (una por línea) para caber en columna."""
    parts = [p.strip() for p in re.split(r"\\qquad", _fix_math(tex)) if p.strip()]
    if len(parts) > 1:
        return "\\begin{gather*}\n" + " \\\\\n".join(parts) + "\n\\end{gather*}"
    return r"\[" + parts[0] + r"\]" if parts else ""


def inline(text: str) -> str:
    out, pos = [], 0
    for m in MATH_RE.finditer(text):
        out.append(_escape_text(text[pos:m.start()]))
        out.append(display_math(m[1]) if m[1] is not None else "$" + _fix_math(m[2]) + "$")
        pos = m.end()
    out.append(_escape_text(text[pos:]))
    return "".join(out).replace("\n", " ").replace("\\begin{gather*} ", "\\begin{gather*}\n")


def md_to_latex(md: str) -> str:
    blocks = []
    for chunk in re.split(r"\n[ \t]*\n", md.strip()):
        chunk = chunk.strip()
        if not chunk or re.match(r"^!\[", chunk):
            continue
        lines = chunk.split("\n")
        if len(lines) >= 2 and all(l.strip().startswith("|") for l in lines) and re.match(r"^\|?\s*:?-{2,}", lines[1].strip()):
            cells = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]  # noqa: E731
            blocks.append(table_latex(cells(lines[0]), [cells(l) for l in lines[2:]]))
        elif all(l.startswith(">") for l in lines):
            blocks.append(r"\begin{quote}\itshape " + inline(" ".join(l.lstrip("> ") for l in lines)) + r"\end{quote}")
        elif all(re.match(r"^\s*[-•]\s+", l) for l in lines):
            blocks.append("\\begin{itemize}\n" + "\n".join(r"  \item " + inline(re.sub(r"^\s*[-•]\s+", "", l)) for l in lines) + "\n\\end{itemize}")
        elif chunk.startswith("$$") and chunk.endswith("$$") and chunk.count("$$") == 2:
            blocks.append(display_math(chunk[2:-2]))
        else:
            blocks.append(inline(chunk))
    return "\n\n".join(blocks)


def table_latex(head: list[str], rows: list[list[str]], small: str = r"\small") -> str:
    n = len(head)
    longest = max(len(c) for r in [head, *rows] for c in r)
    env, spec = "tabular", "@{}" + "l" * n + "@{}"
    if n >= 3 and longest <= 14:
        # Celdas cortas (números, etiquetas): columnas naturales repartidas a todo el ancho.
        env, spec = "tabular*", "@{\\extracolsep{\\fill}}" + "l" * n + "@{}"
    elif n >= 3 or longest > 28:
        # Columnas de igual ancho que descuentan el espacio entre columnas (no se salen del recuadro).
        col = rf">{{\raggedright\arraybackslash}}p{{\dimexpr(\linewidth-{2 * (n - 1)}\tabcolsep)/{n}\relax}}"
        spec = "@{}" + col * n + "@{}"
    begin = rf"\begin{{{env}}}{{\linewidth}}{{{spec}}}" if env == "tabular*" else rf"\begin{{tabular}}{{{spec}}}"
    out = [rf"\begin{{center}}{small}", begin, r"\toprule",
           " & ".join(r"\textbf{" + inline(c) + "}" if c else "" for c in head) + r" \\", r"\midrule"]
    out += [" & ".join(inline(c) for c in r) + r" \\" for r in rows]
    out += [r"\bottomrule", rf"\end{{{env}}}", r"\end{center}"]
    return "\n".join(out)


def norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


# ───────────────────────────── datos de los ensayos ─────────────────────────────


def load_exams() -> dict[str, list[dict]]:
    by_subject: dict[str, list[dict]] = defaultdict(list)
    for path in sorted(EXAMS_DIR.glob("*/*.json")):
        exam = json.loads(path.read_text(encoding="utf-8"))
        by_subject[exam["subject"]].append(exam)
    return by_subject


def axis_stats(exams: list[dict]):
    axes = Counter(q["axis"] for e in exams for q in e["questions"])
    total = sum(axes.values()) or 1
    return [(a, n, n / total) for a, n in axes.most_common()], total


def curated_by_subtopic(temario: dict, exams: list[dict]) -> dict[str, list[dict]]:
    """Asigna cada pregunta curada (con desarrollo verificado) al subtema con más vocabulario en común."""
    subs = [(e, s) for e, s in all_subtopics(temario)]
    vocab = {s["id"]: set(re.findall(r"[a-zñ]{5,}", norm(" ".join([s["titulo"], *s["labels"], *s["claves"], e["nombre"]]))))
             for e, s in subs}
    out: dict[str, list[dict]] = defaultdict(list)
    for exam in exams:
        if exam["source"] != "curado":
            continue
        for q in exam["questions"]:
            if q.get("explanation", {}).get("kind") != "desarrollo":
                continue
            words = set(re.findall(r"[a-zñ]{5,}", norm(q["topic"] + " " + q["stem"])))
            same_axis = [(e, s) for e, s in subs if e["nombre"] == q["axis"]] or subs
            best = max(same_axis, key=lambda es: len(words & vocab[es[1]["id"]]))
            out[best[1]["id"]].append(q)
    return out


def today_es() -> str:
    d = date.today()
    return f"{d.day} de {MONTHS[d.month - 1]} de {d.year}"


def replace_block(template: str, name: str, content: str) -> str:
    pattern = re.compile(rf"%%<{name}>%%.*?%%</{name}>%%", re.S)
    if not pattern.search(template):
        raise ValueError(f"La plantilla no tiene el bloque %%<{name}>%%")
    return pattern.sub(lambda _: f"%%<{name}>%%\n{content.strip()}\n%%</{name}>%%", template)


# ───────────────────────────── guía (compendio) ─────────────────────────────


def ejemplo_tex(title: str, enunciado: str, opciones: list[str], clave: str, analisis: str, pasos: list[str]) -> str:
    alts = "\n".join(rf"\alternativa{{{'ABCDE'[i]}}}{{{inline(o)}}}" for i, o in enumerate(opciones))
    steps = "\n".join(rf"  \item {inline(p)}" for p in pasos)
    return (rf"\begin{{ejemplo}}[{_escape_text(title)}]" + "\n"
            + r"{\sffamily\footnotesize\color{zinc500} Enunciado}\par" + "\n" + md_to_latex(enunciado) + "\n" + alts + "\n"
            + rf"\clave{{{clave}}}" + "\n"
            + r"{\sffamily\footnotesize\color{zinc500} Análisis}\par " + inline(analisis) + "\n"
            + r"{\sffamily\footnotesize\color{zinc500} Desarrollo}" + "\n"
            + "\\begin{enumerate}\n" + steps + "\n\\end{enumerate}\n" + r"\end{ejemplo}")


def subtopic_guide(s: dict, curated: list[dict]) -> str:
    parts = [rf"\subsection{{{_escape_text(s['titulo'])}}}"]
    parts += [md_to_latex(t) for t in s["teoria"]]
    caja = s["caja"]
    env = CAJA_ENV.get(caja["tipo"], "formula")
    parts.append(rf"\begin{{{env}}}[{_escape_text(caja['titulo'])}]" + "\n" + md_to_latex(caja["contenido"]) + "\n" + rf"\end{{{env}}}")
    if s.get("tabla"):
        parts.append(r"{\sffamily\footnotesize\color{zinc500} Esquema comparativo}" + "\n" + table_latex(s["tabla"]["head"], s["tabla"]["rows"]))
    if s.get("linea"):
        rows = "\n".join(rf"{_escape_text(f)} & {inline(h)} \\" for f, h in s["linea"])
        parts.append("\\begin{lineatiempo}\n" + rows + "\n\\end{lineatiempo}")
    parts.append("\\begin{ideasclave}\n\\begin{itemize}\n" + "\n".join(rf"  \item {inline(c)}" for c in s["claves"]) + "\n\\end{itemize}\n\\end{ideasclave}")
    parts.append("\\begin{metodo}\n\\begin{enumerate}\n" + "\n".join(rf"  \item {inline(m)}" for m in s["metodo"]) + "\n\\end{enumerate}\n\\end{metodo}")
    parts.append("\\begin{errorfrecuente}[Trampas frecuentes del DEMRE]\n\\begin{itemize}\n" + "\n".join(rf"  \item {inline(t)}" for t in s["trampas"]) + "\n\\end{itemize}\n\\end{errorfrecuente}")
    ex = s["ejemplo"]
    parts.append(ejemplo_tex("Ejemplo resuelto", ex["enunciado"], ex["opciones"], ex["clave"], ex["analisis"], ex["pasos"]))
    for i, q in enumerate(curated[:2], start=2):
        expl = q["explanation"]
        parts.append(ejemplo_tex(f"Ejemplo tipo PAES {i}: {q['topic']}", q["stem"], [o["text"] for o in q["options"]],
                                 q["answer"], expl["summary"], expl["steps"]))
    return "\n\n".join(parts)


def build_guide(subject: str, exams: list[dict]) -> str:
    temario = vigente(load(subject))
    ranked, total = axis_stats(exams)
    curated = curated_by_subtopic(temario, exams)
    template = (TEMPLATES / "guia_sintesis_paes.tex").read_text(encoding="utf-8")
    n_sub = sum(len(e["subtemas"]) for e in temario["ejes"])
    official = sum(1 for e in exams if e["source"] == "demre")
    meta = "\n".join([
        r"\newcommand{\guiaTitulo}{Compendio de estudio}",
        rf"\newcommand{{\guiaAsignatura}}{{{_escape_text(temario['nombre'])}}}",
        rf"\newcommand{{\guiaDescripcion}}{{{_escape_text(temario['intro'])}}}",
        rf"\newcommand{{\guiaFuente}}{{{_escape_text(f'{len(temario['ejes'])} ejes y {n_sub} subtemas. Frecuencias calculadas sobre {len(exams)} ensayos ({official} oficiales DEMRE), {total} preguntas. Generado el {today_es()}.')}}}",
    ])
    body = [r"\section*{Cómo usar este compendio}",
            "Cada subtema sigue el mismo orden: teoría, recuadro con las fórmulas, leyes o mecanismos centrales, "
            "ideas clave, método para responder en la PAES, trampas frecuentes y ejemplos resueltos paso a paso. "
            "Resuelve cada ejemplo antes de leer su desarrollo.",
            r"\section*{Qué se evalúa}",
            "Distribución de las preguntas por eje en los ensayos disponibles en PAES Studio.",
            r"\begin{center}\small",
            r"\begin{tabular}{@{}p{0.42\linewidth}rrp{0.22\linewidth}@{}}",
            r"\toprule Eje & Preg. & \% & \\ \midrule"]
    body += [rf"{_escape_text(a)} & {n} & {sh * 100:.0f} & \barra{{{sh * 0.22:.3f}}} \\" for a, n, sh in ranked]
    body += [r"\bottomrule", r"\end{tabular}", r"\end{center}"]
    if len(ranked) >= 2:
        body.append(r"\begin{dato}" + _escape_text(
            f"{ranked[0][0]} y {ranked[1][0]} concentran el {(ranked[0][2] + ranked[1][2]) * 100:.0f} % de las preguntas: "
            "priorízalos si tienes poco tiempo.") + r"\end{dato}")
    for e in temario["ejes"]:
        body.append(rf"\section{{{_escape_text(e['nombre'])}}}")
        body.append(r"{\itshape\color{zinc700} " + inline(e["descripcion"]) + "}")
        for s in e["subtemas"]:
            body.append(subtopic_guide(s, curated.get(s["id"], [])))
    out = replace_block(template, "META", meta)
    return replace_block(out, "CONTENIDO", "\n\n".join(body))


# ───────────────────────────── presentación Beamer ─────────────────────────────


def text_ok(subject: str):
    """Preguntas en texto que caben en una lámina: sin figuras incrustadas ni texto de lectura asociado."""
    def ok(exam: dict, q: dict) -> bool:
        if "![" in q["stem"] or any("![" in o["text"] for o in q["options"]):
            return False
        if q.get("passageId") and not (subject == "lectora" and len(" ".join(latex_deck.key_quotes(q))) >= 30):
            return False  # sin el texto completo, solo se puede si la solución cita el fragmento clave
        return len(q["stem"]) <= 700
    return ok


def build_deck(subject: str, exams: list[dict]) -> tuple[str, dict]:
    temario = vigente(load(subject))
    template = (TEMPLATES / "beamer_repaso_paes.tex").read_text(encoding="utf-8")
    tx = {"inline": inline, "md": md_to_latex, "esc": _escape_text, "table": table_latex}
    meta, body, info = latex_deck.build_deck(subject, temario, exams, tx, text_ok=text_ok(subject), date_text=today_es())
    out = replace_block(template, "META", meta)
    # Los esquemas TikZ de Ciencias van solo en su presentación: las demás no los usan.
    esquemas = (TEMPLATES / "esquemas_ciencias.tex").read_text(encoding="utf-8") if subject == "ciencias" else ""
    out = replace_block(out, "ESQUEMAS", esquemas)
    return replace_block(out, "CONTENIDO", body), info


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--subject", choices=list(SUBJECTS), action="append")
    args = ap.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for old in OUTPUT.glob("repaso_*.tex"):
        old.unlink()  # nombre de la fase 1, reemplazado por beamer_*.tex
    data = load_exams()
    manifest = []
    for subject in args.subject or list(SUBJECTS):
        exams = data.get(subject, [])
        guide = OUTPUT / f"guia_{subject}.tex"
        deck = OUTPUT / f"beamer_{subject}.tex"
        guide.write_text(build_guide(subject, exams), encoding="utf-8")
        deck_tex, deck_info = build_deck(subject, exams)
        deck.write_text(deck_tex, encoding="utf-8")
        frames = len(re.findall(r"\\begin\{frame\}", deck_tex)) + 1  # + portada
        n_sub = sum(len(e["subtemas"]) for e in vigente(load(subject))["ejes"])
        print(f"✓ {subject:9} {n_sub:2d} subtemas → {guide.name} ({guide.stat().st_size // 1024} KB), {deck.name} ({frames} diapositivas)")
        temario = vigente(load(subject))
        curated = curated_by_subtopic(temario, exams)
        axes = [{"name": e["nombre"], "subtopics": [s["titulo"] for s in e["subtemas"]]} for e in temario["ejes"]]
        examples = n_sub + sum(min(2, len(v)) for v in curated.values())
        common = {"subject": subject, "title": temario["nombre"], "axes": axes, "subtopics": n_sub}
        manifest.append({**common, "kind": "guia", "file": guide.name, "examples": examples,
                         "includes": ["Teoría y definiciones", "Fórmulas, leyes y mecanismos", "Ideas clave y método",
                                      "Trampas frecuentes del DEMRE", "Ejemplos resueltos paso a paso"]})
        manifest.append({**common, "kind": "beamer", "file": deck.name, "slides": frames, "examples": deck_info["exercises"],
                         "includes": ["Qué se repite en las pruebas oficiales", "Teoría y reglas prácticas por tema",
                                      "Ejercicios oficiales del DEMRE", "Soluciones paso a paso"]})
    if not args.subject:
        (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
