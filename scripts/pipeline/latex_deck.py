"""Resumen en láminas (Beamer 16:9) por asignatura, armado con los ensayos oficiales del DEMRE del repositorio.

Estructura de cada presentación:
  1. Portada.
  2. Cómo usar este resumen.
  3. Sumario (ejes y temas con su número de lámina).
  4. Qué se repite en las pruebas: tabla Tema / Frecuencia / Dificultad / Trampa habitual, calculada solo con
     las preguntas de los ensayos oficiales (`source == "demre"`).
  5. Por tema: una lámina de teoría (ideas clave, recuadro de fórmulas o leyes, regla práctica y error común)
     y luego ejercicios oficiales: el enunciado (con el ensayo de origen) en una lámina y la solución paso a paso
     en la siguiente.

Cómo se calcula la tabla:
  * Frecuencia: preguntas oficiales del tema dividido por el número de aplicaciones (Regular o Invierno de cada
    admisión). En Ciencias las preguntas repetidas entre las versiones de Biología, Física y Química se cuentan
    una vez.
  * Dificultad: no hay datos de rendimiento por pregunta en el repositorio, así que es una medida relativa dentro
    de la materia: el largo medio de la solución paso a paso de sus preguntas oficiales, repartido en tercios
    (baja, media, alta). Temas sin preguntas resueltas quedan con «s/d».
  * Trampa habitual: la primera trampa que lista el temario del tema (scripts/pipeline/temario/).

Los ejercicios se eligen entre preguntas oficiales con solución: las más recientes primero, de ensayos distintos
y con soluciones cortas, para que cada una quepa en una lámina.
"""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
OUTPUT = ROOT / "latex" / "output"
IMG_DIR = OUTPUT / "img"

SUBJECT_SHORT = {"m1": "M1", "m2": "M2", "lectora": "Competencia Lectora", "ciencias": "Ciencias", "historia": "Historia"}
AREA_LABEL = {"biologia": "Biología", "fisica": "Física", "quimica": "Química", "tp": "Técnico Profesional"}
EXERCISES_PER_TOPIC = 2


def _norm_stem(q: dict) -> str:
    return re.sub(r"\W+", "", (q["stem"] + "".join(o["text"] for o in q["options"])).lower())[:400]


def official_questions(exams: list[dict]) -> tuple[list[tuple[dict, dict]], int]:
    """(ensayo, pregunta) de los ensayos oficiales, sin repetir preguntas idénticas entre versiones, y el número de
    aplicaciones (admisión + modalidad)."""
    seen: set[str] = set()
    out = []
    applications = set()
    for e in sorted((e for e in exams if e["source"] == "demre"), key=lambda e: (-e["admissionYear"], e["modality"] != "regular", e["id"])):
        applications.add((e["admissionYear"], e["modality"]))
        for q in e["questions"]:
            key = _norm_stem(q)
            if key in seen and len(key) > 40:
                continue
            seen.add(key)
            out.append((e, q))
    return out, len(applications)


def key_quotes(q: dict) -> list[str]:
    """Citas textuales («…») que la solución toma de la lectura: el fragmento clave para resolver sin el texto."""
    return [m.strip() for m in re.findall(r"«([^«»]{8,400})»", (q.get("explanation") or {}).get("planteamiento", ""))]


def solution_size(q: dict) -> int:
    return sum(len(s) for s in q["explanation"]["steps"])


def topic_stats(temario: dict, questions: list[tuple[dict, dict]], applications: int) -> dict[str, dict]:
    by_sub: dict[str, list[dict]] = defaultdict(list)
    for _, q in questions:
        by_sub[q.get("subtopic", "")].append(q)
    stats = {}
    sizes = {}
    for eje in temario["ejes"]:
        for s in eje["subtemas"]:
            qs = by_sub.get(s["id"], [])
            solved = [q for q in qs if q.get("explanation", {}).get("steps")]
            stats[s["id"]] = {"n": len(qs), "per": len(qs) / applications if applications else 0}
            if solved:
                sizes[s["id"]] = sum(solution_size(q) for q in solved) / len(solved)
    ranked = sorted(sizes, key=sizes.get)
    for i, sid in enumerate(ranked):
        stats[sid]["dificultad"] = ("baja", "media", "alta")[min(2, i * 3 // len(ranked))]
    for st in stats.values():
        st.setdefault("dificultad", "s/d")
    return stats


def exam_label(e: dict) -> str:
    label = f"{e['title']}, {SUBJECT_SHORT.get(e['subject'], e['subject'])}"
    if e.get("area"):
        label += f" {AREA_LABEL.get(e['area'], e['area'])}"
    return label


def snapshot_png(src: str) -> str | None:
    """Convierte el recorte webp del folleto a PNG (pdfLaTeX no lee webp). Devuelve la ruta relativa a latex/output."""
    source = PUBLIC / src.lstrip("/")
    if not source.exists():
        return None
    rel = Path("img") / Path(src.lstrip("/")).relative_to("exam-assets").with_suffix(".png")
    dest = OUTPUT / rel
    if not dest.exists() or dest.stat().st_mtime < source.stat().st_mtime:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as im:
            im.convert("L").save(dest, optimize=True)
    return rel.as_posix()


SAFE_EXTRA = set("–—‘’“”«»•…−→←≤≥≠×·÷±≈πΩαβθΔμλ√∞°²³¹⁰⁴⁵⁶⁷⁸⁹\u00a0\u2009\u202f")


def latex_safe(text: str) -> bool:
    """Solo caracteres que pdfLaTeX sabe escribir (latín, más lo que convierte el generador)."""
    return all(ord(c) < 0x250 or c in SAFE_EXTRA or 0x1D400 <= ord(c) <= 0x1D7FF for c in text)


def _question_text(q: dict) -> str:
    expl = q.get("explanation") or {}
    parts = [expl.get("summary", ""), *expl.get("steps", []), *(expl.get("distractors") or {}).values()]
    if q.get("presentation") != "snapshot":
        parts += [q["stem"], *(o["text"] for o in q["options"])]
    return "".join(parts)


def _usable(e: dict, q: dict, text_ok) -> bool:
    expl = q.get("explanation") or {}
    if not expl.get("steps") or q.get("pilot") or not latex_safe(_question_text(q)):
        return False
    if q.get("presentation") == "snapshot":
        return bool(q.get("snapshot")) and (PUBLIC / q["snapshot"]["src"].lstrip("/")).exists()
    return text_ok(e, q)


def pick_exercises(sub_id: str, questions: list[tuple[dict, dict]], text_ok, n: int = EXERCISES_PER_TOPIC) -> list[tuple[dict, dict]]:
    """Las más recientes primero; entre ellas, las de solución más breve, y de ensayos distintos."""
    pool = [(e, q) for e, q in questions if q.get("subtopic") == sub_id and _usable(e, q, text_ok)]
    # Primero las que caben cómodas en una lámina; entre ellas, las más recientes.
    pool.sort(key=lambda eq: (len(eq[1]["explanation"]["steps"]) > 5 or solution_size(eq[1]) > 900, -eq[0]["admissionYear"], solution_size(eq[1])))
    chosen, exams_used = [], set()
    for e, q in pool:
        if e["id"] in exams_used:
            continue
        chosen.append((e, q))
        exams_used.add(e["id"])
        if len(chosen) == n:
            break
    return chosen


def build_deck(subject: str, temario: dict, exams: list[dict], tx, *, text_ok, date_text: str) -> tuple[str, str, dict]:
    """`tx` reúne los conversores del generador (inline, md, esc, table). Devuelve el bloque META, el bloque
    CONTENIDO y un resumen para el manifest."""
    inline, md, esc = tx["inline"], tx["md"], tx["esc"]
    questions, applications = official_questions(exams)
    stats = topic_stats(temario, questions, applications)
    official = sorted({(e["admissionYear"], e["modality"]) for e, _ in questions}, reverse=True)
    years = sorted({y for y, _ in official})
    short = temario["nombre"].split(" (")[0]
    subs = [(eje, s) for eje in temario["ejes"] for s in eje["subtemas"]]
    exercises = {s["id"]: pick_exercises(s["id"], questions, text_ok) for _, s in subs}
    n_ex = sum(len(v) for v in exercises.values())

    meta = "\n".join([
        rf"\title[Resumen PAES: {esc(short)}]{{Resumen PAES}}",
        rf"\subtitle{{{esc(temario['nombre'])}}}",
        rf"\date{{{esc(date_text)}}}",
        rf"\renewcommand{{\portadaDetalle}}{{{esc(f'{len(subs)} temas del temario 2027 y {n_ex} ejercicios de pruebas oficiales del DEMRE (admisiones {years[0]} a {years[-1]})')}}}",
    ])

    frames: list[str] = []
    frames.append(
        r"\begin{frame}{Cómo usar este resumen}" + "\n"
        + r"\begin{columns}[T,onlytextwidth]" + "\n" + r"\column{0.56\textwidth}\small" + "\n"
        + r"\begin{enumerate}" + "\n"
        + r"\item Parte por la tabla \emph{Qué se repite en las pruebas}: dice qué temas aparecen más y cuál es su trampa habitual." + "\n"
        + r"\item Cada tema trae una lámina de teoría y luego ejercicios oficiales del DEMRE: el enunciado en una lámina y la solución en la siguiente." + "\n"
        + r"\item Resuelve el ejercicio y anota tu alternativa \emph{antes} de avanzar. Si fallaste, vuelve a la teoría." + "\n"
        + r"\item Usa el sumario para saltar al tema que necesites." + "\n"
        + r"\end{enumerate}" + "\n"
        + r"\column{0.4\textwidth}" + "\n"
        + r"\begin{cajaregla}[Regla práctica]\footnotesize Las cajas con borde negro son reglas para aplicar directo en la prueba.\end{cajaregla}" + "\n"
        + r"\begin{notagris}\footnotesize Las notas en gris son errores comunes.\end{notagris}" + "\n"
        + r"\vspace{0.4em}{\scriptsize\color{zinc500} " + esc(
            f"Datos: {len(official)} aplicaciones oficiales ({', '.join(f'{m} {y}' for y, m in official)}; año de admisión). "
            "Las soluciones paso a paso fueron redactadas con IA y revisadas contra la respuesta oficial del DEMRE.") + r"\par}" + "\n"
        + r"\end{columns}" + "\n" + r"\end{frame}")

    # Sumario: ejes y temas con el número de su lámina de teoría.
    def sumario_col(ejes: list[dict]) -> str:
        lines = []
        for eje in ejes:
            lines.append(rf"\sumarioeje{{{esc(eje['nombre'])}}}")
            lines += [rf"\sumariotema{{{esc(s['titulo'])}}}{{tema-{s['id']}}}" for s in eje["subtemas"]]
        return "\n".join(lines)

    ejes = temario["ejes"]
    weights = [len(e["subtemas"]) + 1 for e in ejes]
    half, acc, cut = sum(weights) / 2, 0, len(ejes)
    for i, w in enumerate(weights):
        if acc + w / 2 > half:
            cut = max(1, i)
            break
        acc += w
    frames.append(
        r"\begin{frame}{Sumario}" + "\n" + r"\begin{columns}[T,onlytextwidth]" + "\n"
        + r"\column{0.47\textwidth}\footnotesize" + "\n" + rf"\sumarioitem{{Qué se repite en las pruebas}}{{repite}}" + "\n" + sumario_col(ejes[:cut]) + "\n"
        + r"\column{0.47\textwidth}\footnotesize" + "\n" + sumario_col(ejes[cut:]) + "\n"
        + r"\end{columns}" + "\n" + r"\end{frame}")

    # Qué se repite en las pruebas.
    rows = sorted(subs, key=lambda es: (-stats[es[1]["id"]]["n"], es[1]["titulo"]))
    n_chunks = -(-len(rows) // 6)
    per_frame = -(-len(rows) // n_chunks)
    chunks = [rows[i:i + per_frame] for i in range(0, len(rows), per_frame)]
    for k, chunk in enumerate(chunks, start=1):
        body = []
        for _, s in chunk:
            st = stats[s["id"]]
            freq = "0" if not st["n"] else f"{st['per']:.1f}".replace(".", "{,}")
            trap = inline(s["trampas"][0]) if s.get("trampas") else "---"
            body.append(rf"{esc(s['titulo'])} & {freq} & {st['dificultad']} & {trap} \\")
        frames.append(
            r"\begin{frame}{Qué se repite en las pruebas}" + ("\n" + r"\label{repite}" if k == 1 else "") + "\n"
            + rf"\framesubtitle{{{esc(f'{len(questions)} preguntas de {applications} aplicaciones oficiales, de la más frecuente a la menos')}" + (f" ({k}/{len(chunks)})" if len(chunks) > 1 else "") + "}\n"
            + r"\begin{ajustar}[0.72\textheight]\scriptsize\renewcommand{\arraystretch}{1.25}" + "\n"
            + r"\begin{tabular}{@{}>{\raggedright\arraybackslash}p{0.25\textwidth}>{\raggedright\arraybackslash}p{0.13\textwidth}p{0.1\textwidth}>{\raggedright\arraybackslash}p{0.42\textwidth}@{}}" + "\n"
            + r"\toprule \textbf{Tema} & \textbf{Frecuencia}\newline{\tiny preguntas por prueba} & \textbf{Dificultad} & \textbf{Trampa habitual} \\ \midrule" + "\n"
            + "\n".join(body) + "\n" + r"\bottomrule\end{tabular}\end{ajustar}" + "\n"
            + (r"\par\vspace{0.4em}{\tiny\color{zinc500} Dificultad relativa dentro de la materia, según el largo de la solución de sus preguntas oficiales.}" + "\n" if k == len(chunks) else "")
            + r"\end{frame}")

    for eje in ejes:
        frames.append(rf"\section{{{esc(eje['nombre'])}}}")
        for s in eje["subtemas"]:
            frames.append(rf"\subsection{{{esc(s['titulo'])}}}")
            frames.append(theory_frame(eje, s, stats[s["id"]], inline, md, esc, tx["table"]))
            for i, (e, q) in enumerate(exercises[s["id"]], start=1):
                frames.append(statement_frame(s, i, e, q, inline, md, esc))
                frames.append(solution_frame(s, i, e, q, inline, esc))
            if not exercises[s["id"]]:
                frames.append(
                    rf"\begin{{frame}}{{{esc(s['titulo'])}}}" + "\n" + r"\framesubtitle{Ejercicios}" + "\n" + r"\vfill\centering"
                    + r"{\small\color{zinc500} Aún no hay preguntas oficiales resueltas de este tema en PAES Studio.\par "
                    + r"Practica con el ejemplo de la guía y con la sección temas de la app.}" + "\n" + r"\vfill" + "\n" + r"\end{frame}")

    summary = {"slides_hint": len(frames), "exercises": n_ex, "applications": applications}
    return meta, "\n\n".join(frames), summary


def theory_frame(eje: dict, s: dict, st: dict, inline, md, esc, table) -> str:
    claves = "\n".join(rf"\item {inline(c)}" for c in s["claves"])
    regla = r"\begin{enumerate}" + "".join(rf"\item {inline(m)}" for m in s["metodo"][:3]) + r"\end{enumerate}"
    caja = s["caja"]
    freq = f"{st['per']:.1f}".replace(".", ",") + " preguntas por prueba" if st["n"] else "sin preguntas en las pruebas oficiales del repositorio"
    out = (
        rf"\begin{{frame}}{{{esc(s['titulo'])}}}" + "\n" + rf"\label{{tema-{s['id']}}}" + "\n"
        + rf"\framesubtitle{{{esc(eje['nombre'])} · Teoría · {esc(freq)}}}" + "\n"
        + r"\begin{ajustar}" + "\n"
        + r"\begin{columns}[T,onlytextwidth]" + "\n"
        + r"\column{0.52\textwidth}" + "\n"
        + "\\begin{itemize}\\footnotesize\n" + claves + "\n\\end{itemize}\n"
        + r"\column{0.44\textwidth}" + "\n"
        + r"\begin{cajaregla}[Regla práctica]\scriptsize " + regla + r"\end{cajaregla}" + "\n"
        + (r"\begin{notagris}\scriptsize \textbf{Error común:} " + inline(s["trampas"][0]) + r"\end{notagris}" + "\n" if s.get("trampas") else "")
        + r"\end{columns}" + "\n"
        # A todo el ancho, las fórmulas separadas por \qquad caben en una línea: no se apilan.
        + rf"\begin{{cajaclave}}[{esc(caja['titulo'])}]\footnotesize" + "\n" + md(caja["contenido"].replace(r"\qquad", r"\quad\quad")) + "\n" + r"\end{cajaclave}" + "\n"
        + r"\end{ajustar}" + "\n"
        + r"\end{frame}")
    if s.get("tabla"):
        out += (
            "\n\n" + rf"\begin{{frame}}{{{esc(s['titulo'])}}}" + "\n" + rf"\framesubtitle{{{esc(eje['nombre'])} · Esquema comparativo}}" + "\n"
            + table(s["tabla"]["head"], s["tabla"]["rows"], small=r"\footnotesize") + "\n" + r"\end{frame}")
    if s.get("linea"):
        out += (
            "\n\n" + rf"\begin{{frame}}{{{esc(s['titulo'])}}}" + "\n" + rf"\framesubtitle{{{esc(eje['nombre'])} · Línea de tiempo}}" + "\n"
            + "\\begin{lineatiempo}\n" + "\n".join(rf"{esc(f)} & {inline(h)} \\" for f, h in s["linea"]) + "\n\\end{lineatiempo}\n"
            + r"\end{frame}")
    return out


def statement_frame(s: dict, i: int, e: dict, q: dict, inline, md, esc) -> str:
    source = esc(f"{exam_label(e)}, pregunta {q['number']}")
    fragment = ""
    if q.get("passageId"):
        passage = next((p for p in e.get("passages", []) if p["id"] == q["passageId"]), None)
        quotes = key_quotes(q)
        if quotes:
            title = esc(passage["title"]) if passage else "la lectura"
            fragment = (r"\begin{notagris}\scriptsize \textbf{Fragmento clave de " + ("«" + title + "»" if passage else title) + ":} "
                        + " [\\ldots] ".join("«" + inline(t) + "»" for t in quotes[:3]) + r"\end{notagris}" + "\n")
    if q.get("presentation") == "snapshot":
        path = snapshot_png(q["snapshot"]["src"])
        body = fragment + r"\begin{center}" + rf"\recorte{{{path}}}" + r"\end{center}"
    else:
        alts = "\n".join(rf"\alternativa{{{o['key']}}}{{{inline(o['text'])}}}" for o in q["options"])
        body = r"\begin{ajustar}[0.7\textheight]" + "\n" + fragment + "{\\small " + md(q["stem"]) + "}\n\\vspace{0.4em}\n" + alts + "\n" + r"\end{ajustar}"
    return (
        rf"\begin{{frame}}{{Ejercicio {i} · {esc(s['titulo'])}}}" + "\n"
        + rf"\framesubtitle{{Fuente: {source}}}" + "\n"
        + body + "\n"
        + r"\vfill{\tiny\color{zinc500}\hfill Anota tu alternativa: la solución está en la lámina siguiente.}" + "\n"
        + r"\end{frame}")


def solution_frame(s: dict, i: int, e: dict, q: dict, inline, esc) -> str:
    expl = q["explanation"]
    steps = "\n".join(rf"\paso{{{n}}}{{{inline(p)}}}" for n, p in enumerate(expl["steps"], start=1))
    size = solution_size(q)
    font = r"\footnotesize" if size > 650 else r"\small"
    # Cada línea extra del título o del subtítulo le quita alto al cuerpo.
    room = 0.7 - 0.06 * (len(s["titulo"]) > 48) - 0.06 * (len(expl["summary"]) > 120) - 0.06 * (len(expl["summary"]) > 220)
    wrong = [(k, v) for k, v in (expl.get("distractors") or {}).items() if k != q["answer"] and v]
    note = ""
    if wrong:
        k, v = min(wrong, key=lambda kv: len(kv[1]))
        note = rf"\begin{{notagris}}\scriptsize \textbf{{Si marcaste {k}:}} {inline(v)}\end{{notagris}}"
    return (
        rf"\begin{{frame}}{{Solución {i} · {esc(s['titulo'])}}}" + "\n"
        + rf"\framesubtitle{{{inline(expl['summary'])}}}" + "\n"
        + rf"\begin{{ajustar}}[{room:.2f}\textheight]" + "\n"
        + "{" + font + "\n" + steps + "\n}\n"
        + rf"\respuesta{{{q['answer']}}}{{{esc(exam_label(e))}, pregunta {q['number']}}}" + "\n"
        + note + "\n" + r"\end{ajustar}" + "\n"
        + r"\end{frame}")
