"""Renderizado de recortes (snapshots) WebP de preguntas, figuras y páginas visuales."""

from __future__ import annotations

import re
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops, ImageDraw

from .layout import Region

LEFT_MARGIN = 50.0
RIGHT_MARGIN = 44.0


def _is_mono(img: Image.Image) -> bool:
    """True si la imagen es esencialmente escala de grises (permite invertirla en modo oscuro)."""
    r, g, b = img.split()
    spread = ImageChops.lighter(ImageChops.difference(r, g), ImageChops.difference(g, b))
    hist = spread.histogram()
    colored = sum(hist[24:])
    return colored < 0.002 * img.width * img.height


def _render(page: pymupdf.Page, clip: pymupdf.Rect, zoom: float) -> Image.Image:
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def _save(img: Image.Image, out: Path, quality: int) -> tuple[int, int, bool]:
    out.parent.mkdir(parents=True, exist_ok=True)
    mono = _is_mono(img)
    if mono:
        # Texto en escala de grises: paleta de 16 niveles + WebP sin pérdida (≈50 % del tamaño con pérdida
        # y bordes nítidos en fórmulas).
        final = img.convert("L").quantize(16)
        final.save(out, "WEBP", lossless=True, quality=80, method=4)
    else:
        final = img
        final.save(out, "WEBP", quality=max(quality, 70), method=6)
    return final.width, final.height, mono


#: Lo que queda bajo este umbral es antialiasing de los bordes de las líneas ya capturadas.
LOST_INK_MIN = 20

#: Texto de una línea que parece un trozo de fórmula o de fracción apilada, no una palabra.
_FRAGMENT = re.compile(r"[A-Z][A-Za-z0-9]{0,3}|[a-z]|[0-9]{1,2}|[A-Z]?[a-z]?[0-9+\-]{1,3}")


def lost_ink(doc: pymupdf.Document, question) -> int:
    """Píxeles oscuros de la pregunta que no pertenecen a ninguna línea de texto capturada.

    Una fórmula dibujada con trazos vectoriales pequeños no cuenta como figura y tampoco deja texto: desaparecería en
    silencio. Medir la tinta sobrante detecta cualquier contenido perdido, sea cual sea su tipo.
    """
    scale = 1.5
    lines = [*question.stem, question.number_line, *question.option_markers.values()]
    lines += [line for option in question.options.values() for line in option]
    total = 0
    for pno in question.region.bands:
        on_page = [line for line in lines if line.page == pno]
        if not on_page:
            continue
        page = doc[pno]
        top = min(line.rect.y0 for line in on_page) - 1
        bottom = max(line.rect.y1 for line in on_page) + 1
        clip = pymupdf.Rect(0, top, page.rect.width, bottom)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=clip, colorspace=pymupdf.csGRAY, alpha=False)
        img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
        draw = ImageDraw.Draw(img)
        for line in on_page:
            r = line.rect
            draw.rectangle([(r.x0 - 2) * scale, (r.y0 - top - 2) * scale, (r.x1 + 2) * scale, (r.y1 - top + 2) * scale], fill=255)
        total += sum(img.histogram()[:150])
    return total


def has_formula_fragments(question) -> bool:
    """Dos o más líneas sueltas como `CH2` o `s` indican una fórmula o fracción que el texto dejó desordenada."""
    fragments = [line.text.strip() for line in question.stem if _FRAGMENT.fullmatch(line.text.strip() or "#")]
    return len([f for f in fragments if f != "-"]) >= 2


def render_region(
    doc: pymupdf.Document,
    region: Region,
    out: Path,
    extra_rects: dict[int, list[pymupdf.Rect]] | None = None,
    zoom: float = 2.0,
    quality: int = 76,
    pad: float = 7.0,
) -> tuple[int, int, bool] | None:
    """Recorta el contenido de la región (posiblemente en varias páginas) y lo apila verticalmente.

    El ancho del recorte es fijo (márgenes de la página) para que todas las preguntas compartan escala.
    """
    crops: list[Image.Image] = []
    for pno in sorted(region.bands):
        page = doc[pno]
        y_start, y_end = region.bands[pno]
        rects = [ln.rect for ln in region.lines if ln.page == pno]
        rects += [v.rect for v in region.visuals if v.page == pno and v.rect.y0 >= y_start - 4 and v.rect.y1 <= y_end + 4]
        if extra_rects:
            rects += extra_rects.get(pno, [])
        rects = [r for r in rects if not r.is_empty]
        if not rects:
            continue
        top = max(min(r.y0 for r in rects) - pad, y_start - pad)
        bottom = min(max(r.y1 for r in rects) + pad, y_end + pad)
        if bottom - top < 8:
            continue
        clip = pymupdf.Rect(LEFT_MARGIN, top, page.rect.width - RIGHT_MARGIN, bottom)
        crops.append(_render(page, clip, zoom))
    if not crops:
        return None
    gap = int(10 * zoom)
    width = max(c.width for c in crops)
    height = sum(c.height for c in crops) + gap * (len(crops) - 1)
    canvas = Image.new("RGB", (width, height), "white")
    y = 0
    for c in crops:
        canvas.paste(c, (0, y))
        y += c.height + gap
    return _save(canvas, out, quality)


def render_rect(
    doc: pymupdf.Document, pno: int, rect: pymupdf.Rect, out: Path, zoom: float = 2.0, quality: int = 78
) -> tuple[int, int, bool]:
    page = doc[pno]
    clip = (rect + (-4, -4, 4, 4)) & page.rect
    return _save(_render(page, clip, zoom), out, quality)
