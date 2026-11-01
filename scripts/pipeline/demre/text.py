"""Normalización de texto extraído de los PDFs del DEMRE (fuentes Symbol/MathType, viñetas, superíndices)."""

from __future__ import annotations

import re
import unicodedata

# Codificación de la fuente "Symbol" (Adobe). Los PDF de MathType la exponen en el área de uso privado
# U+F020..U+F0FF; restamos 0xF000 y traducimos al carácter Unicode equivalente.
SYMBOL_MAP: dict[int, str] = {
    0x20: " ", 0x21: "!", 0x22: "∀", 0x23: "#", 0x24: "∃", 0x25: "%", 0x26: "&", 0x27: "∋",
    0x28: "(", 0x29: ")", 0x2A: "∗", 0x2B: "+", 0x2C: ",", 0x2D: "−", 0x2E: ".", 0x2F: "/",
    0x3A: ":", 0x3B: ";", 0x3C: "<", 0x3D: "=", 0x3E: ">", 0x3F: "?", 0x40: "≅",
    0x41: "Α", 0x42: "Β", 0x43: "Χ", 0x44: "Δ", 0x45: "Ε", 0x46: "Φ", 0x47: "Γ", 0x48: "Η",
    0x49: "Ι", 0x4B: "Κ", 0x4C: "Λ", 0x4D: "Μ", 0x4E: "Ν", 0x4F: "Ο", 0x50: "Π", 0x51: "Θ",
    0x52: "Ρ", 0x53: "Σ", 0x54: "Τ", 0x55: "Υ", 0x57: "Ω", 0x58: "Ξ", 0x59: "Ψ", 0x5A: "Ζ",
    0x5B: "[", 0x5C: "∴", 0x5D: "]", 0x5E: "⊥", 0x5F: "_",
    0x61: "α", 0x62: "β", 0x63: "χ", 0x64: "δ", 0x65: "ε", 0x66: "φ", 0x67: "γ", 0x68: "η",
    0x69: "ι", 0x6A: "ϕ", 0x6B: "κ", 0x6C: "λ", 0x6D: "μ", 0x6E: "ν", 0x6F: "ο", 0x70: "π",
    0x71: "θ", 0x72: "ρ", 0x73: "σ", 0x74: "τ", 0x75: "υ", 0x77: "ω", 0x78: "ξ", 0x79: "ψ",
    0x7A: "ζ", 0x7B: "{", 0x7C: "|", 0x7D: "}", 0x7E: "∼",
    0xA2: "′", 0xA3: "≤", 0xA5: "∞", 0xAB: "↔", 0xAC: "←", 0xAD: "↑", 0xAE: "→", 0xAF: "↓",
    0xB0: "°", 0xB1: "±", 0xB2: "″", 0xB3: "≥", 0xB4: "×", 0xB5: "∝", 0xB6: "∂", 0xB7: "•",
    0xB8: "÷", 0xB9: "≠", 0xBA: "≡", 0xBB: "≈", 0xBC: "…",
    0xC7: "∩", 0xC8: "∪", 0xC9: "⊃", 0xCA: "⊇", 0xCB: "⊄", 0xCC: "⊂", 0xCD: "⊆", 0xCE: "∈",
    0xCF: "∉", 0xD0: "∠", 0xD6: "√", 0xD7: "·", 0xD8: "¬", 0xD9: "∧", 0xDA: "∨",
    0xDB: "⇔", 0xDC: "⇐", 0xDE: "⇒", 0xE5: "∑", 0xF2: "∫",
}
# Piezas de paréntesis/llaves extensibles de Symbol (0xE6–0xFE): no aportan al texto lineal.
SYMBOL_DROP = set(range(0xE6, 0xF0)) | set(range(0xF3, 0xFF))

SUPERSCRIPT = str.maketrans("0123456789+-−()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁽⁾ⁿ")

PUA_RE = re.compile(r"[-]")


def map_private_use(text: str, font: str) -> str:
    """Traduce caracteres del área de uso privado según la fuente que los dibuja."""
    if not PUA_RE.search(text):
        return text
    is_symbol = "symbol" in font.lower() or "mt extra" in font.lower()
    out = []
    for ch in text:
        cp = ord(ch)
        if 0xF000 <= cp <= 0xF0FF:
            code = cp - 0xF000
            if is_symbol:
                if code in SYMBOL_DROP:
                    continue
                out.append(SYMBOL_MAP.get(code, ""))
            else:  # Wingdings y similares: casi siempre son viñetas
                out.append("•")
        else:
            out.append(ch)
    return "".join(out)


def to_superscript(text: str) -> str:
    return text.strip().translate(SUPERSCRIPT)


def clean_inline(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = text.replace("­", "")  # guiones blandos
    text = text.replace("‒", "–").replace("‐", "-")
    text = re.sub(r"[ \t ]+", " ", text)
    text = re.sub(r"\s+([,.;:)\]?!])", r"\1", text)
    text = re.sub(r"([(\[¿¡])\s+", r"\1", text)
    return text.strip()


def escape_markdown(text: str) -> str:
    """Escapa los caracteres que el renderizador MathText interpreta (dólar = fórmula)."""
    return text.replace("\\", "\\\\").replace("$", "\\$")


def is_page_chrome(text: str) -> bool:
    t = text.strip()
    return bool(
        re.fullmatch(r"[-–•·]\s*\d+\s*[-–•·]", t)
        or re.match(r"^FORMA\s+\d+", t)
        or t in {"demre.cl"}
    )


def looks_lossy(text: str) -> bool:
    """Heurística: el texto perdió símbolos (operadores sueltos, fracciones apiladas, etc.)."""
    if PUA_RE.search(text):
        return True
    return bool(re.search(r"\s[−+=·×÷]\s*$|^\s*[−+=·×÷]\s|\(\s*\)", text))
