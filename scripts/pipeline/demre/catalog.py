"""Descubrimiento de PDFs y cruce prueba ↔ clavijero a partir del nombre de archivo.

Convención observada en los archivos del DEMRE:
  pruebas:     2025-24-12-04-paes-regular-matematica1-p2025.pdf
               2024-23-06-22-paes-invierno-oficial-historia-p2024.pdf
  clavijeros:  2025-25-01-06-clavijero-paes-regular-m1.pdf

Los cuatro primeros dígitos corresponden al año de admisión (p2025 → Admisión 2025).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

TEST_RE = re.compile(
    r"^(?P<adm>\d{4})-(?P<yy>\d{2})-(?P<mm>\d{2})-(?P<dd>\d{2})-paes-(?P<mod>regular|invierno)-"
    r"(?:oficial-)?(?P<subj>.+?)-p(?P<p>\d{4})\.pdf$"
)
KEY_RE = re.compile(
    r"^(?P<adm>\d{4})-(?P<yy>\d{2})-(?P<mm>\d{2})-(?P<dd>\d{2})-clavijero-paes-(?P<mod>regular|invierno)-(?P<subj>.+)\.pdf$"
)

# slug de archivo → (asignatura, área)
TEST_SUBJECTS: dict[str, tuple[str, str | None]] = {
    "matematica1": ("m1", None),
    "matematica2": ("m2", None),
    "competencia-lectora": ("lectora", None),
    "historia": ("historia", None),
    "ciencias-biologia": ("ciencias", "biologia"),
    "ciencias-fisica": ("ciencias", "fisica"),
    "ciencias-quimica": ("ciencias", "quimica"),
    "ciencias-tp": ("ciencias", "tp"),
}
KEY_SUBJECTS: dict[str, tuple[str, str | None]] = {
    "m1": ("m1", None),
    "m2": ("m2", None),
    "competencia-lectora": ("lectora", None),
    "historia": ("historia", None),
    "ciencias-biologia": ("ciencias", "biologia"),
    "ciencias-fisica": ("ciencias", "fisica"),
    "ciencias-quimica": ("ciencias", "quimica"),
    "ciencias-tp": ("ciencias", "tp"),
}


@dataclass(frozen=True)
class SourceTest:
    path: Path
    admission_year: int
    applied_on: date
    modality: str  # "regular" | "invierno"
    subject: str
    area: str | None

    @property
    def exam_id(self) -> str:
        subject = f"{self.subject}-{self.area}" if self.area else self.subject
        return f"{subject}-{self.admission_year}-{self.modality}"

    @property
    def match_key(self) -> tuple[int, str, str, str | None]:
        return (self.admission_year, self.modality, self.subject, self.area)


@dataclass(frozen=True)
class SourceKey:
    path: Path
    admission_year: int
    published_on: date
    modality: str
    subject: str
    area: str | None

    @property
    def match_key(self) -> tuple[int, str, str, str | None]:
        return (self.admission_year, self.modality, self.subject, self.area)


def _date(yy: str, mm: str, dd: str) -> date:
    return date(2000 + int(yy), int(mm), int(dd))


def parse_test_filename(path: Path) -> SourceTest | None:
    m = TEST_RE.match(path.name)
    if not m or m["subj"] not in TEST_SUBJECTS:
        return None
    subject, area = TEST_SUBJECTS[m["subj"]]
    return SourceTest(
        path=path,
        admission_year=int(m["p"]),
        applied_on=_date(m["yy"], m["mm"], m["dd"]),
        modality=m["mod"],
        subject=subject,
        area=area,
    )


def parse_key_filename(path: Path) -> SourceKey | None:
    m = KEY_RE.match(path.name)
    if not m or m["subj"] not in KEY_SUBJECTS:
        return None
    subject, area = KEY_SUBJECTS[m["subj"]]
    return SourceKey(
        path=path,
        admission_year=int(m["adm"]),
        published_on=_date(m["yy"], m["mm"], m["dd"]),
        modality=m["mod"],
        subject=subject,
        area=area,
    )


def resolve_dir(root: Path, *candidates: str) -> Path | None:
    """Devuelve la primera carpeta existente (permite alias/symlinks)."""
    for name in candidates:
        p = (root / name).resolve()
        if p.is_dir():
            return p
    return None


def discover(tests_dir: Path, keys_dir: Path | None) -> tuple[list[tuple[SourceTest, SourceKey | None]], list[Path]]:
    """Lista las pruebas reconocidas con su clavijero (o None) y los archivos ignorados."""
    keys: dict[tuple, SourceKey] = {}
    if keys_dir is not None:
        for p in sorted(keys_dir.glob("*.pdf")):
            k = parse_key_filename(p)
            if k:
                keys[k.match_key] = k
    pairs: list[tuple[SourceTest, SourceKey | None]] = []
    ignored: list[Path] = []
    for p in sorted(tests_dir.glob("*.pdf")):
        t = parse_test_filename(p)
        if t is None:
            ignored.append(p)
            continue
        pairs.append((t, keys.get(t.match_key)))
    pairs.sort(key=lambda pair: (pair[0].subject, pair[0].area or "", pair[0].admission_year, pair[0].modality))
    return pairs, ignored
