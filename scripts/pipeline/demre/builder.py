"""Ensambla el JSON de un ensayo (esquema `src/types/exam.ts`) a partir del layout y del clavijero."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import pymupdf

from .answer_keys import AnswerKey
from .catalog import SourceTest
from .layout import DocumentLayout, Line, RawPassage, RawQuestion, looks_tabular, rows_to_paragraphs, visual_weight
from .snapshots import render_rect, render_region
from .taxonomy import AREA_KEYS, AREAS, MODALITIES, SUBJECTS, classify, science_blocks, topic_within
from .text import escape_markdown, looks_lossy, to_superscript

FORM_RE = re.compile(r"Forma\s+(\d+)", re.IGNORECASE)


@dataclass
class BuildOptions:
    assets_dir: Path  # carpeta física public/exam-assets
    public_prefix: str = "/exam-assets"
    snapshots: bool = True
    zoom: float = 2.0
    quality: int = 76


@dataclass
class BuildReport:
    exam_id: str
    questions: int = 0
    passages: int = 0
    snapshots: int = 0
    bytes_written: int = 0
    skipped: list[int] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _md(lines: list[Line], body_size: float) -> str:
    paragraphs = rows_to_paragraphs(lines, body_size)
    return "\n\n".join(escape_markdown(p) for _, _, p in paragraphs)


def _plain(lines: list[Line]) -> str:
    return " ".join(ln.text for ln in sorted(lines, key=lambda l: (l.page, l.cy, l.x0)))


def _duration(subject: str, n: int) -> int:
    meta = SUBJECTS[subject]
    minutes = meta["official_minutes"] * n / meta["official_questions"]
    return max(10, int(round(minutes / 5.0)) * 5)


def _needs_snapshot(subject: str, q: RawQuestion, option_texts: dict[str, str]) -> bool:
    if subject in ("m1", "m2"):
        return True
    images, drawings = visual_weight(q.region)
    if images or drawings >= 2:
        return True
    if looks_tabular(q.stem):
        return True
    if any(not t.strip() for t in option_texts.values()) or len(option_texts) < 4:
        return True
    raw = _plain(q.stem) + " " + " ".join(option_texts.values())
    return looks_lossy(raw)


def _passage_markdown(
    doc: pymupdf.Document,
    rp: RawPassage,
    body_size: float,
    opts: BuildOptions,
    asset_dir: Path,
    public_dir: str,
    report: BuildReport,
) -> tuple[str, list[str]]:
    region = rp.region
    blocks: list[tuple[int, float, str]] = []  # (página, y, markdown)
    consumed: set[int] = set()

    # 1) Páginas visualmente densas (infografías, columnas múltiples) → imagen de página completa.
    pages = sorted({ln.page for ln in region.lines} | set(region.bands))
    for pno in pages:
        page_lines = [ln for ln in region.lines if ln.page == pno]
        page_vis = [v for v in region.visuals if v.page == pno]
        drawings = sum(1 for v in page_vis if v.kind == "drawing" and (v.rect.width > 24 or v.rect.height > 24))
        image_area = sum(v.rect.width * v.rect.height for v in page_vis if v.kind == "image")
        page_area = doc[pno].rect.width * doc[pno].rect.height
        right_col = sum(1 for ln in page_lines if ln.x0 > 230)
        dense = drawings >= 10 or image_area > 0.38 * page_area or (
            page_lines and right_col / len(page_lines) > 0.4 and len(page_lines) > 8
        )
        if dense and opts.snapshots and pno in region.bands:
            sub = type(region)(
                lines=page_lines, visuals=page_vis, bands={pno: region.bands[pno]}
            )
            name = f"passage-{rp.number}-p{pno + 1}.webp"
            res = render_region(doc, sub, asset_dir / name, zoom=opts.zoom, quality=opts.quality)
            if res:
                w, h, mono = res
                report.snapshots += 1
                report.bytes_written += (asset_dir / name).stat().st_size
                blocks.append((pno, region.bands[pno][0], f"![Lectura {rp.number}, página {pno + 1}]({public_dir}/{name}){{w={w} h={h}{' mono' if mono else ''}}}"))
                consumed.update(id(ln) for ln in page_lines)

    # 2) Figuras (fotografías, gráficos) con su pie de figura.
    fig_count = 0
    for v in region.visuals:
        if v.kind != "image" or id(v) in consumed or v.rect.width * v.rect.height < 6000:
            continue
        if any(b[0] == v.page and b[2].startswith("![Lectura") for b in blocks):
            continue
        rect = pymupdf.Rect(v.rect)
        caption_lines = [
            ln for ln in region.lines
            if ln.page == v.page and ln.y0 >= rect.y1 - 14 and ln.y0 <= rect.y1 + 22
            and ln.x0 >= rect.x0 - 12 and ln.x1 <= rect.x1 + 40
        ]
        for ln in caption_lines:
            rect |= ln.rect
        caption = " ".join(ln.text for ln in caption_lines).strip() or f"Figura de la lectura {rp.number}"
        for ln in region.lines:
            if ln.page == v.page and ln.rect.intersects(rect) and (ln.rect & rect).get_area() > 0.5 * ln.rect.get_area():
                consumed.add(id(ln))
        if opts.snapshots:
            fig_count += 1
            name = f"passage-{rp.number}-fig{fig_count}.webp"
            w, h, mono = render_rect(doc, v.page, rect, asset_dir / name, zoom=opts.zoom, quality=opts.quality)
            report.snapshots += 1
            report.bytes_written += (asset_dir / name).stat().st_size
            blocks.append((v.page, rect.y0, f"![{escape_markdown(caption)}]({public_dir}/{name}){{w={w} h={h}{' mono' if mono else ''}}}"))

    # 3) Notas al pie y fuentes: líneas de cuerpo menor en la mitad inferior de la página.
    note_lines: list[Line] = []
    text_lines: list[Line] = []
    for ln in region.lines:
        if id(ln) in consumed:
            continue
        page_h = doc[ln.page].rect.height
        if ln.size < body_size * 0.9 and ln.y0 > page_h * 0.55:
            note_lines.append(ln)
        else:
            text_lines.append(ln)
    footnotes = [para for _, _, para in rows_to_paragraphs(note_lines, body_size * 0.85, use_md=False)]
    footnotes = [re.sub(r"^\*?\*?(\d{1,2})\s+", lambda m: to_superscript(m[1]) + " ", f) for f in footnotes]
    footnotes = [part.strip() for f in footnotes for part in re.split(r"\s(?=[¹²³⁴⁵⁶⁷⁸⁹⁰]+\s)", f) if part.strip()]

    for y, page, para in rows_to_paragraphs(text_lines, body_size):
        blocks.append((page, y, escape_markdown(para)))
    blocks.sort(key=lambda b: (b[0], b[1]))
    body = "\n\n".join(b[2] for b in blocks)
    return body, [escape_markdown(f) for f in footnotes]


def _description(test: SourceTest, key: AnswerKey, n: int, name: str, area_label: str | None) -> str:
    subject = f"{name} ({area_label})" if area_label else name
    applied = test.applied_on.strftime("%d-%m-%Y")
    voided = f" ({len(key.voided)} anulada por el DEMRE)" if key.voided else ""
    if n >= key.total_questions - len(key.voided):
        head = f"Prueba oficial completa de {subject}: {n} preguntas{voided}"
    else:
        head = f"Selección oficial de {n} de las {key.total_questions} preguntas de {subject}"
    return f"{head}, aplicada el {applied} (Admisión {test.admission_year}). Claves del clavijero oficial DEMRE."


def build_exam(
    test: SourceTest,
    key: AnswerKey,
    doc: pymupdf.Document,
    layout: DocumentLayout,
    opts: BuildOptions,
) -> tuple[dict, BuildReport]:
    exam_id = test.exam_id
    report = BuildReport(exam_id)
    report.warnings.extend(layout.warnings)
    asset_dir = opts.assets_dir / exam_id
    public_dir = f"{opts.public_prefix}/{exam_id}"
    if opts.snapshots and asset_dir.exists():
        for old in asset_dir.glob("*.webp"):
            old.unlink()

    cover = doc[0].get_text("text")
    form = FORM_RE.search(cover)
    declared = re.search(r"selecci[oó]n\s+de\s+(\d+)\s+preguntas", " ".join(cover.split()), re.IGNORECASE)
    expected_total = int(declared[1]) if declared else key.total_questions
    found = {q.number for q in layout.questions}
    if len(found) < expected_total:
        report.warnings.append(
            f"se detectaron {len(found)} de {expected_total} preguntas declaradas"
            + ("" if declared else f" (faltan {sorted(set(key.answers) - found)[:10]})")
        )

    # ── Lecturas ──
    passages_json = []
    passage_for_question: dict[int, str] = {}
    sorted_q = [q.number for q in layout.questions]
    for idx, rp in enumerate(layout.passages):
        pid = f"lectura-{rp.number}"
        body, notes = _passage_markdown(doc, rp, layout.body_size, opts, asset_dir, public_dir, report)
        q_from = rp.first_question
        q_to = rp.last_question
        if q_from is None:
            nxt = layout.passages[idx + 1].header if idx + 1 < len(layout.passages) else None
            inside = [
                q.number for q in layout.questions
                if (q.number_line.page, q.number_line.cy) > (rp.header.page, rp.header.cy)
                and (nxt is None or (q.number_line.page, q.number_line.cy) < (nxt.page, nxt.cy))
            ]
            q_from, q_to = (inside[0], inside[-1]) if inside else (None, None)
        if q_from is not None and q_to is not None:
            for n in sorted_q:
                if q_from <= n <= q_to:
                    passage_for_question[n] = pid
        passages_json.append(
            {
                "id": pid,
                "title": f"Lectura {rp.number}",
                "body": body,
                **({"footnotes": notes} if notes else {}),
                **({"questionRange": [q_from, q_to]} if q_from is not None else {}),
            }
        )
        report.passages += 1

    # ── Preguntas ──
    questions_json = []
    for q in layout.questions:
        answer = key.answers.get(q.number)
        if answer is None:
            report.skipped.append(q.number)
            continue
        option_texts = {
            letter: escape_markdown(" ".join(p for _, _, p in rows_to_paragraphs(lines, layout.body_size)))
            for letter, lines in q.options.items()
        }
        stem_md = _md(q.stem, layout.body_size)
        plain = _plain(q.stem)
        axis, topic = classify(test.subject, test.area, plain + " " + " ".join(option_texts.values()))
        snapshot = None
        presentation = "text"
        if _needs_snapshot(test.subject, q, option_texts):
            presentation = "snapshot"
            if opts.snapshots:
                name = f"q{q.number:02d}.webp"
                res = render_region(
                    doc, q.region, asset_dir / name,
                    extra_rects={q.number_line.page: [q.number_line.rect]},
                    zoom=opts.zoom, quality=opts.quality,
                )
                if res:
                    w, h, mono = res
                    snapshot = {"src": f"{public_dir}/{name}", "width": w, "height": h, "mono": mono}
                    report.snapshots += 1
                    report.bytes_written += (asset_dir / name).stat().st_size
                else:
                    presentation = "text"
        found = [k for k in "ABCDE" if k in option_texts]
        count = max(len(found), "ABCDE".index(answer) + 1, 4)
        if presentation == "text" and len(found) < count:
            presentation = "snapshot" if snapshot else presentation
        options = [{"key": k, "text": option_texts.get(k, "")} for k in "ABCDE"[:count]]
        qj: dict = {
            "id": f"{exam_id}-q{q.number:02d}",
            "number": q.number,
            "axis": axis,
            "topic": topic,
            "stem": stem_md,
            "options": options,
            "answer": answer,
            "presentation": presentation,
        }
        if q.number in passage_for_question:
            qj["passageId"] = passage_for_question[q.number]
        if q.number in key.pilot:
            qj["pilot"] = True
        if snapshot:
            qj["snapshot"] = snapshot
        if presentation == "snapshot" or looks_lossy(plain):
            qj["textQuality"] = "approximate"
        questions_json.append(qj)
        report.questions += 1

    # Ciencias (80 preguntas): el área sale de la estructura de módulos, no de cada enunciado aislado.
    if test.subject == "ciencias" and test.area in AREA_KEYS and key.total_questions == 80:
        texts = {q["number"]: q["stem"] + " " + " ".join(o["text"] for o in q["options"]) for q in questions_json}
        areas = science_blocks(test.area, texts)
        for q in questions_json:
            q["axis"] = areas[q["number"]]
            q["topic"] = topic_within(q["axis"], "ciencias", texts[q["number"]])

    n = len(questions_json)
    subject_meta = SUBJECTS[test.subject]
    area_label = AREAS.get(test.area or "")
    exam = {
        "id": exam_id,
        "subject": test.subject,
        **({"area": test.area} if test.area else {}),
        "title": f"PAES {MODALITIES[test.modality]} {test.admission_year}",
        "description": _description(test, key, n, subject_meta["name"], area_label),
        "year": test.admission_year,
        "modality": test.modality,
        "source": "demre",
        **({"form": form[1]} if form else {}),
        "appliedOn": test.applied_on.isoformat(),
        "durationMinutes": _duration(test.subject, n),
        "scoring": {
            "method": "official-table",
            "table": key.scale,
            "officialQuestionCount": key.total_questions,
            "officialScorableCount": key.scorable_questions,
        },
        "generatedBy": "scripts/pipeline/extract_demre.py",
        "generatedAt": date.today().isoformat(),
        "passages": passages_json,
        "questions": questions_json,
    }
    return exam, report
