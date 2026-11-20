"""Guías de ejercicios resueltos (`build_guides.py`): un módulo por materia con una lista `GUIDES`.

Cada guía corresponde a un subtema vigente del temario 2027 y trae ejercicios con el formato de la PAES
(enunciado y alternativas), modelados sobre los patrones que se repiten en las pruebas oficiales del DEMRE,
cada uno con su resumen, su desarrollo paso a paso y por qué fallan las alternativas tentadoras.
"""


def ex(stem: str, options: list[str], answer: str, summary: str, steps: list[str], distractors: dict[str, str] | None = None) -> dict:
    return {"stem": stem, "options": options, "answer": answer, "summary": summary, "steps": steps, "distractors": distractors or {}}


def guide(subtopic: str, pattern: str, exercises: list[dict]) -> dict:
    return {"subtopic": subtopic, "pattern": pattern, "exercises": exercises}
