"""Contenido de los ensayos curados. Cada módulo expone `EXAM` (ver build_curated.py)."""


def q(axis, topic, stem, options, answer, summary, steps, distractors=None, difficulty="media", passage=None, skill=None):
    """Pregunta curada. `options` en orden A, B, C, D (, E); `answer` es la letra correcta."""
    return {
        "axis": axis,
        "topic": topic,
        "stem": stem,
        "options": options,
        "answer": answer,
        "summary": summary,
        "steps": steps,
        "distractors": distractors or {},
        "difficulty": difficulty,
        "passage": passage,
        "skill": skill,
    }
