"""Lectura de clavijeros oficiales: claves, preguntas piloto (*) y tabla de transformación P → PAES."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf

KEY_PAIR_RE = re.compile(r"(?<!\d)(\d{1,3})\s*(\*?)\s+([A-E])(?![A-Za-zÁ-ú])")
VOID_RE = re.compile(r"(?<!\d)(\d{1,3})\s*\*\*")
SCALE_PAIR_RE = re.compile(r"(?<!\d)(\d{1,3})\s+(\d{3,4})(?!\d)")
TOTAL_RE = re.compile(r"tiene\s+(\d+)\s+preguntas,?\s+y\s+solo\s+(\d+)", re.IGNORECASE)


@dataclass
class AnswerKey:
    answers: dict[int, str] = field(default_factory=dict)
    pilot: set[int] = field(default_factory=set)
    voided: set[int] = field(default_factory=set)  # preguntas anuladas (**): sin clave, no puntúan
    scale: list[int] = field(default_factory=list)  # índice = Puntaje P
    total_questions: int = 0
    scorable_questions: int = 0

    def validate(self) -> list[str]:
        problems = []
        if not self.answers:
            problems.append("no se encontraron claves")
        expected = set(range(1, self.total_questions + 1))
        missing = expected - set(self.answers) - self.voided
        if missing:
            problems.append(f"faltan claves para {sorted(missing)[:8]}…")
        if self.scale:
            if self.scale[0] != 100 or self.scale[-1] != 1000:
                problems.append(f"tabla de transformación inusual ({self.scale[0]}…{self.scale[-1]})")
            if any(b < a for a, b in zip(self.scale, self.scale[1:])):
                problems.append("tabla de transformación no monótona")
            if len(self.scale) != self.scorable_questions + 1:
                problems.append(
                    f"tabla con {len(self.scale)} filas para {self.scorable_questions} preguntas puntuables"
                )
        else:
            problems.append("no se encontró la tabla de transformación")
        return problems


def _rows(page: pymupdf.Page) -> list[str]:
    """Reconstruye filas visuales a partir de palabras (robusto ante tablas en columnas)."""
    words = page.get_text("words")
    rows: list[list[tuple[float, float, str]]] = []
    for x0, y0, x1, y1, word, *_ in sorted(words, key=lambda w: ((w[1] + w[3]) / 2, w[0])):
        cy = (y0 + y1) / 2
        if rows and abs(rows[-1][0][1] - cy) < 3.5:
            rows[-1].append((x0, cy, word))
        else:
            rows.append([(x0, cy, word)])
    return [" ".join(w for _, _, w in sorted(r)) for r in rows]


def parse_answer_key(path: Path) -> AnswerKey:
    key = AnswerKey()
    section = "intro"
    with pymupdf.open(path) as doc:
        for page in doc:
            for row in _rows(page):
                upper = row.upper()
                if m := TOTAL_RE.search(row):
                    key.total_questions, key.scorable_questions = int(m[1]), int(m[2])
                if upper.strip().startswith("CLAVES"):
                    section = "keys"
                    continue
                if "TABLA DE TRANSFORMACI" in upper:
                    section = "scale"
                    continue
                if section == "keys":
                    if upper.startswith("EN EL CLAVIJERO"):
                        section = "after-keys"
                        continue
                    for num in VOID_RE.findall(row):
                        key.voided.add(int(num))
                    for num, star, letter in KEY_PAIR_RE.findall(row):
                        n = int(num)
                        key.answers[n] = letter
                        if star:
                            key.pilot.add(n)
                elif section == "scale":
                    for p, paes in SCALE_PAIR_RE.findall(row):
                        p_i, paes_i = int(p), int(paes)
                        if 100 <= paes_i <= 1000:
                            while len(key.scale) <= p_i:
                                key.scale.append(-1)
                            key.scale[p_i] = paes_i
    if not key.total_questions and key.answers:
        key.total_questions = max(key.answers)
        key.scorable_questions = key.total_questions - len(key.pilot)
    if key.voided and len(key.scale) == key.scorable_questions + 1 - len(key.voided):
        key.scorable_questions -= len(key.voided)
    # Completa huecos improbables por interpolación lineal (no debería ocurrir).
    for i, v in enumerate(key.scale):
        if v < 0:
            prev = next((key.scale[j] for j in range(i - 1, -1, -1) if key.scale[j] >= 0), 100)
            nxt = next((key.scale[j] for j in range(i + 1, len(key.scale)) if key.scale[j] >= 0), 1000)
            key.scale[i] = round((prev + nxt) / 2)
    return key
