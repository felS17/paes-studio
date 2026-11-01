"""Segmentación geométrica de los folletos DEMRE en lecturas (pasajes) y preguntas.

Modelo: cada página se reduce a una lista de `Line` (texto normalizado + bbox + estilo). Luego se detectan
"eventos" (inicio de lectura, inicio de pregunta, fin de prueba) y cada evento abarca el contenido hasta el
siguiente, incluso a través de saltos de página.
"""

from __future__ import annotations

import re
import statistics
from dataclasses import dataclass, field

import pymupdf

from .text import clean_inline, is_page_chrome, map_private_use, to_superscript

QNUM_RE = re.compile(r"^(\d{1,2})(\.?)\s*$")
OPTION_RE = re.compile(r"^([A-E])\)\s*(.*)$")
PASSAGE_RE = re.compile(
    r"^(?:LECTURA|TEXTO)\s+(\d+)\s*[:.]?\s*(?:preguntas?\s+(\d+)\s*(?:a|y|al|-|–)\s*(\d+))?",
    re.IGNORECASE,
)
INSTRUCTIONS_RE = re.compile(
    r"^(EN ESTA PRUEBA SE CONSIDERAR|INSTRUCCIONES|Registro de Propiedad Intelectual|SÍMBOLOS MATEMÁTICOS)"
)
STOP_RE = re.compile(r"^(Listado de referencias|Referencias bibliogr|FIN DE LA PRUEBA)", re.IGNORECASE)

HEADER_LIMIT = 66.0  # pt: encabezado "FORMA xxx – año"
FOOTER_MARGIN = 52.0  # pt desde el borde inferior: número de página


@dataclass
class Line:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str  # texto plano normalizado
    md: str  # texto con marcas **negrita** / *cursiva*
    size: float
    bold: bool

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2

    @property
    def rect(self) -> pymupdf.Rect:
        return pymupdf.Rect(self.x0, self.y0, self.x1, self.y1)


@dataclass
class Visual:
    page: int
    rect: pymupdf.Rect
    kind: str  # "image" | "drawing"


@dataclass
class Region:
    """Contenido entre dos eventos: líneas, elementos gráficos y franjas por página."""

    lines: list[Line] = field(default_factory=list)
    visuals: list[Visual] = field(default_factory=list)
    bands: dict[int, tuple[float, float]] = field(default_factory=dict)  # página → (y_ini, y_fin)


@dataclass
class RawQuestion:
    number: int
    region: Region
    number_line: Line
    stem: list[Line]
    options: dict[str, list[Line]]
    option_markers: dict[str, Line]


@dataclass
class RawPassage:
    number: int
    first_question: int | None
    last_question: int | None
    header: Line
    region: Region


@dataclass
class DocumentLayout:
    passages: list[RawPassage]
    questions: list[RawQuestion]
    body_size: float
    warnings: list[str]


# ───────────────────────────── extracción de líneas ─────────────────────────────


def page_lines(page: pymupdf.Page, pno: int) -> list[Line]:
    height = page.rect.height
    out: list[Line] = []
    data = page.get_text("dict", flags=pymupdf.TEXT_PRESERVE_WHITESPACE | pymupdf.TEXT_MEDIABOX_CLIP)
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            # Se conservan los spans de solo espacios: separan palabras entre cambios de estilo.
            spans = [s for s in line["spans"] if s["text"]]
            while spans and not spans[0]["text"].strip():
                spans.pop(0)
            if not spans or not any(s["text"].strip() for s in spans):
                continue
            # "10. Texto…": el número de pregunta (cuerpo mayor) comparte línea con el enunciado → separarlos.
            lettered = [s["size"] for s in spans if re.search(r"[A-Za-zÁ-úñ¿]", s["text"])]
            small = statistics.median(lettered) if lettered else None
            if small and len(spans) > 1 and re.match(r"^\s*\d", spans[0]["text"]):
                k, lead = 0, ""
                while k < len(spans) and spans[k]["size"] >= 1.2 * small and re.fullmatch(r"[\d.\s]*", spans[k]["text"]):
                    lead += spans[k]["text"]
                    k += 1
                tail_text = ""
                if k == 0:  # número y texto en el mismo span grande ("10. Texto…" con cuerpo 18)
                    nm = re.match(r"^\s*(\d{1,2})\.\s*(.*)$", spans[0]["text"])
                    if nm and spans[0]["size"] >= 1.2 * small:
                        lead, tail_text, k = nm[1] + ".", nm[2], 1
                nm = re.fullmatch(r"\s*(\d{1,2})\s*\.?\s*", lead) if lead else None
                if nm and k < len(spans) + (1 if tail_text else 0):
                    number_spans = spans[:k]
                    rest = spans[k:]
                    if rest and not tail_text:
                        rest = [{**rest[0], "text": re.sub(r"^\s*\.\s*", "", rest[0]["text"])}] + rest[1:]
                    if tail_text:
                        rest = [{**spans[0], "text": tail_text, "size": small}] + rest
                    rest = [s for s in rest if s["text"].strip()]
                    nx0 = min(s["bbox"][0] for s in number_spans)
                    ny0 = min(s["bbox"][1] for s in number_spans)
                    nx1 = max(s["bbox"][2] for s in number_spans)
                    ny1 = max(max(s["bbox"][3] for s in number_spans), line["bbox"][3])
                    if not (ny1 <= HEADER_LIMIT or ny0 >= height - FOOTER_MARGIN):
                        label = f"{nm[1]}."
                        out.append(Line(pno, nx0, ny0, nx1, ny1, label, label, round(number_spans[0]["size"], 1), False))
                    if not rest:
                        continue
                    spans = rest
                    line = {**line, "bbox": (spans[0]["bbox"][0], line["bbox"][1], line["bbox"][2], line["bbox"][3])}
            max_size = max(s["size"] for s in spans)
            plain_parts, md_parts = [], []
            bold_flags = []
            for s in spans:
                t = map_private_use(s["text"], s["font"])
                is_super = bool(s["flags"] & 1) or (s["size"] < 0.72 * max_size and t.strip().isdigit())
                if is_super and t.strip():
                    t = to_superscript(t)
                bold = bool(s["flags"] & 16) or "bold" in s["font"].lower()
                italic = bool(s["flags"] & 2) or "italic" in s["font"].lower() or "oblique" in s["font"].lower()
                bold_flags.append(bold)
                plain_parts.append(t)
                stripped = t.strip()
                if stripped and bold and not is_super:
                    md_parts.append(t.replace(stripped, f"**{stripped}**"))
                elif stripped and italic and not is_super and len(stripped) > 1:
                    md_parts.append(t.replace(stripped, f"*{stripped}*"))
                else:
                    md_parts.append(t)
            text = clean_inline("".join(plain_parts))
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            if y1 <= HEADER_LIMIT or y0 >= height - FOOTER_MARGIN or is_page_chrome(text):
                continue
            md = clean_inline("".join(md_parts)).replace("****", "")
            out.append(
                Line(pno, x0, y0, x1, y1, text, md, round(max_size, 1), all(bold_flags))
            )
    out.sort(key=lambda ln: (round(ln.cy / 3), ln.x0))
    return out


def page_visuals(page: pymupdf.Page, pno: int) -> list[Visual]:
    height = page.rect.height
    vis: list[Visual] = []
    for info in page.get_image_info():
        r = pymupdf.Rect(info["bbox"]) & page.rect
        if r.is_empty or r.width * r.height < 900 or r.height < 12:
            continue
        if r.y1 <= HEADER_LIMIT or r.y0 >= height - FOOTER_MARGIN:
            continue
        vis.append(Visual(pno, r, "image"))
    for d in page.get_drawings():
        r = pymupdf.Rect(d["rect"])
        if r.y1 <= HEADER_LIMIT + 4 or r.y0 >= height - FOOTER_MARGIN:
            continue
        if r.width < 2 and r.height < 2:
            continue
        vis.append(Visual(pno, r, "drawing"))
    return vis


# ───────────────────────────── utilidades geométricas ─────────────────────────────


def group_rows(lines: list[Line], tol: float = 3.2) -> list[list[Line]]:
    rows: list[list[Line]] = []
    for ln in sorted(lines, key=lambda l: (l.page, l.cy, l.x0)):
        if rows and rows[-1][0].page == ln.page and abs(rows[-1][0].cy - ln.cy) <= tol:
            rows[-1].append(ln)
        else:
            rows.append([ln])
    return [sorted(r, key=lambda l: l.x0) for r in rows]


def looks_tabular(lines: list[Line]) -> bool:
    """Detecta tablas sin bordes: filas con ≥3 celdas separadas por espacios amplios."""
    wide_rows = 0
    for row in group_rows(lines):
        cells = 1
        for a, b in zip(row, row[1:]):
            if b.x0 - a.x1 > 22:
                cells += 1
        if cells >= 3:
            wide_rows += 1
    return wide_rows >= 2


def visual_weight(region: Region) -> tuple[int, int]:
    """(imágenes, trazos relevantes) dentro de la región."""
    images = sum(1 for v in region.visuals if v.kind == "image")
    drawings = sum(1 for v in region.visuals if v.kind == "drawing" and (v.rect.width > 24 or v.rect.height > 24))
    return images, drawings


# ───────────────────────────── segmentación ─────────────────────────────


@dataclass
class _Event:
    kind: str  # "passage" | "question" | "stop"
    page: int
    y: float
    line: Line
    number: int = 0
    q_from: int | None = None
    q_to: int | None = None


def analyse(doc: pymupdf.Document, expected_numbers: set[int] | None = None) -> DocumentLayout:
    warnings: list[str] = []
    all_lines: list[Line] = []
    visuals: list[Visual] = []
    for pno, page in enumerate(doc):
        all_lines.extend(page_lines(page, pno))
        visuals.extend(page_visuals(page, pno))

    sizes = [ln.size for ln in all_lines if len(ln.text) > 25]
    body_size = statistics.median(sizes) if sizes else 12.0

    skip_pages = {0} | {ln.page for ln in all_lines if INSTRUCTIONS_RE.search(ln.text)}
    number_sizes = [ln.size for ln in all_lines if QNUM_RE.match(ln.text) and ln.x0 < 92 and ln.page not in skip_pages]
    # Los números de pregunta usan un cuerpo claramente mayor que el texto (18 pt vs 12 pt en los folletos).
    big_numbers = [s for s in number_sizes if s >= body_size * 1.2]
    min_number_size = body_size * 1.2 if len(big_numbers) >= 3 else 0.0

    events: list[_Event] = []
    last_q = 0
    started = False
    for ln in all_lines:
        if ln.page in skip_pages:
            continue  # portada e instrucciones
        if STOP_RE.match(ln.text) and started:
            events.append(_Event("stop", ln.page, ln.y0, ln))
            break
        pm = PASSAGE_RE.match(ln.text)
        if pm and ln.x0 < 120 and (ln.text.isupper() or "pregunta" in ln.text.lower()):
            started = True
            events.append(
                _Event(
                    "passage", ln.page, ln.y0, ln, int(pm[1]),
                    int(pm[2]) if pm[2] else None, int(pm[3]) if pm[3] else None,
                )
            )
            continue
        qm = QNUM_RE.match(ln.text)
        if qm and ln.x0 < 92 and (qm[2] or min_number_size > 0):
            n = int(qm[1])
            plausible = n > last_q and (expected_numbers is None or n in expected_numbers)
            if plausible and ln.size >= min_number_size:
                started = True
                last_q = n
                events.append(_Event("question", ln.page, ln.y0, ln, n))

    if not any(e.kind == "question" for e in events):
        warnings.append("no se detectaron preguntas")

    page_count = len(doc)
    passages: list[RawPassage] = []
    questions: list[RawQuestion] = []
    for i, ev in enumerate(events):
        if ev.kind == "stop":
            break
        end = events[i + 1] if i + 1 < len(events) else None
        end_page = end.page if end else page_count - 1
        end_y = end.y if end else float("inf")
        region = Region()
        for ln in all_lines:
            if ln is ev.line:
                continue
            if (ln.page, ln.cy) >= (ev.page, ev.y - 1) and (ln.page, ln.cy) < (end_page, end_y - 1):
                region.lines.append(ln)
        for v in visuals:
            cy = (v.rect.y0 + v.rect.y1) / 2
            if (v.page, cy) >= (ev.page, ev.y - 2) and (v.page, cy) < (end_page, end_y - 2):
                region.visuals.append(v)
        for p in range(ev.page, end_page + 1):
            page_h = doc[p].rect.height
            y_start = ev.y - 2 if p == ev.page else HEADER_LIMIT
            y_end = end_y - 4 if (end and p == end_page) else page_h - FOOTER_MARGIN
            if y_end - y_start > 6:
                region.bands[p] = (y_start, y_end)

        if ev.kind == "passage":
            passages.append(RawPassage(ev.number, ev.q_from, ev.q_to, ev.line, region))
            continue

        # ── pregunta: separa enunciado y alternativas ──
        markers: dict[str, Line] = {}
        content: list[Line] = []
        for ln in region.lines:
            om = OPTION_RE.match(ln.text)
            if om and ln.x0 > 70 and om[1] not in markers:
                expected_letter = "ABCDE"[len(markers)] if len(markers) < 5 else None
                if om[1] == expected_letter:
                    markers[om[1]] = ln
                    if om[2].strip():
                        rest = OPTION_RE.match(ln.md)
                        content.append(
                            Line(ln.page, ln.x0 + 18, ln.y0, ln.x1, ln.y1, om[2], rest[2] if rest else om[2], ln.size, ln.bold)
                        )
                    continue
            content.append(ln)

        stem: list[Line] = []
        options: dict[str, list[Line]] = {k: [] for k in markers}
        ordered = sorted(markers.items(), key=lambda kv: (kv[1].page, kv[1].cy, kv[1].x0))
        first = ordered[0][1] if ordered else None
        for ln in content:
            if first is None or (ln.page, ln.cy) < (first.page, first.cy - 2.5):
                stem.append(ln)
                continue
            owner = None
            for letter, mk in ordered:
                if (mk.page, mk.cy - 2.5) <= (ln.page, ln.cy) and mk.x0 <= ln.x0 + 2:
                    if owner is None or (mk.page, round(mk.cy), mk.x0) >= (
                        owner[1].page, round(owner[1].cy), owner[1].x0
                    ):
                        owner = (letter, mk)
            if owner:
                options[owner[0]].append(ln)
            else:
                stem.append(ln)
        if len(markers) >= 4:
            # Lo que viene después de la página de la última alternativa (bibliografía, contraportada)
            # no pertenece a la pregunta.
            last_page = max(mk.page for mk in markers.values())
            region.lines = [ln for ln in region.lines if ln.page <= last_page]
            region.visuals = [v for v in region.visuals if v.page <= last_page]
            region.bands = {p: b for p, b in region.bands.items() if p <= last_page}
            for letter in options:
                options[letter] = [ln for ln in options[letter] if ln.page <= last_page]
            stem = [ln for ln in stem if ln.page <= last_page]
        if len(markers) < 4:
            warnings.append(f"pregunta {ev.number}: solo {len(markers)} alternativas detectadas")
        questions.append(RawQuestion(ev.number, region, ev.line, stem, options, markers))

    return DocumentLayout(passages, questions, body_size, warnings)


# ───────────────────────────── texto corrido ─────────────────────────────


def rows_to_paragraphs(lines: list[Line], body_size: float, use_md: bool = True) -> list[tuple[float, int, str]]:
    """Agrupa líneas en párrafos. Devuelve (y, página, texto)."""
    rows = group_rows(lines)
    paragraphs: list[tuple[float, int, list[str]]] = []
    prev: list[Line] | None = None
    for row in rows:
        text = " ".join((ln.md if use_md else ln.text) for ln in row).strip()
        if not text:
            continue
        head = row[0]
        is_heading = all(ln.bold for ln in row)
        new_par = prev is None
        if prev is not None:
            p0 = prev[0]
            prev_text = " ".join(ln.text for ln in prev).strip()
            if head.page != p0.page:
                new_par = bool(re.search(r"[.:!?”\"»)]$", prev_text)) and (
                    text[:1].isupper() or text[:1] in "¿¡“\"«(*"
                )
            else:
                gap = head.y0 - max(ln.y1 for ln in prev)
                new_par = gap > max(4.0, body_size * 0.38)
            if is_heading != all(ln.bold for ln in prev):
                new_par = True
            if re.match(r"^[•\-–]\s", text):
                new_par = True
        if new_par:
            paragraphs.append((head.y0, head.page, [text]))
        else:
            paragraphs[-1][2].append(text)
        prev = row
    out = []
    for y, page, parts in paragraphs:
        joined = ""
        for part in parts:
            last_word = joined.rsplit(" ", 1)[-1]
            if joined.endswith(("-", "/", ".")) and ("http" in last_word or "www." in last_word) and " " not in part.strip():
                joined += part  # URL partida en dos líneas
            elif joined.endswith("-") and part[:1].islower():
                joined = joined[:-1] + part
            elif joined:
                joined += " " + part
            else:
                joined = part
        joined = re.sub(r"\*\*\s*\*\*", " ", joined)
        joined = re.sub(r"\s{2,}", " ", joined).strip()
        if re.match(r"^•\s*", joined):
            joined = "- " + re.sub(r"^•\s*", "", joined)
        out.append((y, page, joined))
    return out
