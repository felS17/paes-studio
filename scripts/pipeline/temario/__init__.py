"""Temario estructurado por asignatura → eje → subtema.

Alimenta dos productos:
  * las mini-pautas de las preguntas oficiales (generate_pautas.py): `metodo`, `trampas`, `caja`;
  * los compendios LaTeX y Beamer (generate_latex_summary.py): todo el contenido.

El texto usa el mismo dialecto que la app (Markdown + LaTeX entre $…$), así se renderiza con KaTeX
en el navegador y se convierte a LaTeX para las guías.
"""

from __future__ import annotations

import importlib


def caja(titulo: str, contenido: str, tipo: str = "formula") -> dict:
    """Recuadro destacado. tipo: formula | definicion | mecanismo | ley."""
    return {"tipo": tipo, "titulo": titulo, "contenido": contenido}


def ejemplo(enunciado: str, opciones: list[str], clave: str, analisis: str, pasos: list[str]) -> dict:
    return {"enunciado": enunciado, "opciones": opciones, "clave": clave, "analisis": analisis, "pasos": pasos}


def sub(id: str, titulo: str, labels: list[str], teoria: list[str], caja: dict, claves: list[str],
        metodo: list[str], trampas: list[str], ejemplo: dict, tabla: dict | None = None,
        linea: list[tuple[str, str]] | None = None) -> dict:
    """Subtema del temario.

    labels: etiquetas de tema (taxonomy.TOPIC_LABELS) que este subtema cubre, para enlazar preguntas.
    tabla:  esquema comparativo opcional {"head": [...], "rows": [[...], ...]}.
    linea:  línea de tiempo opcional [(fecha, hecho), ...].
    """
    return {"id": id, "titulo": titulo, "labels": labels, "teoria": teoria, "caja": caja, "claves": claves,
            "metodo": metodo, "trampas": trampas, "ejemplo": ejemplo, "tabla": tabla, "linea": linea}


def eje(nombre: str, descripcion: str, subtemas: list[dict]) -> dict:
    return {"nombre": nombre, "descripcion": descripcion, "subtemas": subtemas}


SUBJECTS = ("m1", "m2", "lectora", "ciencias", "historia")


def load(subject: str) -> dict:
    return importlib.import_module(f"temario.{subject}").TEMARIO


def all_subtopics(temario: dict):
    for e in temario["ejes"]:
        for s in e["subtemas"]:
            yield e, s
