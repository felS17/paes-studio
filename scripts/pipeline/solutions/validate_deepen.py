#!/usr/bin/env python3
"""Valida el output.json de un lote de profundización. Uso: python3 validate_deepen.py <carpeta-del-lote>

Imprime «OK» si todo está bien; si no, lista cada problema para corregirlo. Reglas en INSTRUCCIONES.md.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

GROWTH = 1.3

d = Path(sys.argv[1])
inp = {q["id"]: q for q in json.loads((d / "input.json").read_text(encoding="utf-8"))}
problems: list[str] = []
try:
    out = json.loads((d / "output.json").read_text(encoding="utf-8"))
except FileNotFoundError:
    print("FALTA output.json"); sys.exit(1)
except json.JSONDecodeError as e:
    print(f"JSON INVÁLIDO: {e}"); sys.exit(1)
if not isinstance(out, list):
    print("output.json debe ser una lista"); sys.exit(1)

ids = [s.get("id") for s in out if isinstance(s, dict)]
for missing in sorted(set(inp) - set(ids)):
    problems.append(f"{missing}: falta en output.json")
for extra in sorted(set(ids) - set(inp)):
    problems.append(f"{extra}: id que no está en input.json")
if len(ids) != len(set(ids)):
    problems.append("hay ids repetidos en output.json")

CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
DOLLAR = re.compile(r"(?<!\\)\$")
STEP_PREFIX = re.compile(r"^\s*(\*\*)?\s*paso\s*\d", re.I)
FORBIDDEN = re.compile(r"texto extra[ií]do|el recorte|soluci[oó]n anterior|explicaci[oó]n actual|\bcurrent\b", re.I)


def size(expl: dict) -> int:
    return sum(len(x) for x in expl.get("steps", [])) + sum(len(x) for x in (expl.get("distractors") or {}).values())


for s in out:
    if not isinstance(s, dict):
        problems.append("cada elemento de output.json debe ser un objeto"); continue
    sid = s.get("id", "?")
    q = inp.get(sid)
    if not q:
        continue
    if not isinstance(s.get("verified"), bool):
        problems.append(f"{sid}: 'verified' debe ser true o false"); continue
    if not s["verified"]:
        continue
    summary, plan, steps = s.get("summary"), s.get("planteamiento"), s.get("steps")
    if not isinstance(summary, str) or len(summary.strip()) < 25:
        problems.append(f"{sid}: 'summary' vacío o muy corto")
    if not isinstance(plan, str) or len(plan.strip()) < 50:
        problems.append(f"{sid}: 'planteamiento' vacío o muy corto (qué pide y qué datos entrega)")
    if not isinstance(steps, list) or not 3 <= len(steps) <= 10 or not all(isinstance(x, str) and len(x.strip()) >= 15 for x in steps):
        problems.append(f"{sid}: 'steps' debe tener entre 3 y 10 pasos de texto (mínimo 15 caracteres cada uno)"); continue
    old = q["current"]
    if len(steps) < min(len(old.get("steps", [])), 9):
        problems.append(f"{sid}: tiene menos pasos ({len(steps)}) que la explicación actual ({len(old['steps'])})")
    if any(STEP_PREFIX.match(x) for x in steps):
        problems.append(f"{sid}: no antepongas «Paso N» a los pasos; la interfaz los numera")
    if not re.search(rf"alternativa correcta es la {q['answer']}\b", steps[-1]):
        problems.append(f"{sid}: el último paso debe terminar con «Por lo tanto, la alternativa correcta es la {q['answer']}.»")
    for other in "ABCDE":
        if other != q["answer"] and re.search(rf"alternativa correcta es la {other}\b", " ".join(steps)):
            problems.append(f"{sid}: concluye con la letra {other}, pero la clave oficial es {q['answer']}")
    keys = {o["key"] for o in q["options"]}
    wrong = keys - {q["answer"]}
    dis = s.get("distractors")
    if not isinstance(dis, dict):
        problems.append(f"{sid}: 'distractors' debe ser un objeto"); continue
    if set(dis) != wrong:
        problems.append(f"{sid}: 'distractors' debe tener exactamente las letras incorrectas {sorted(wrong)} (tiene {sorted(dis)})")
    if any(not isinstance(v, str) or len(v.strip()) < 20 for v in dis.values()):
        problems.append(f"{sid}: cada distractor necesita una explicación (mínimo 20 caracteres)")
        continue
    new_size = len(plan or "") + size({"steps": steps, "distractors": dis})
    if new_size < GROWTH * size(old):
        problems.append(f"{sid}: la versión nueva ({new_size} caracteres) no es lo bastante más detallada que la actual ({size(old)}); se espera ≥ {int(GROWTH * size(old))}")
    for t in [summary, plan, *steps, *dis.values()]:
        if CTRL.search(t) or "\t" in t:
            problems.append(f"{sid}: carácter de control en el texto (¿\\frac o \\times con una sola barra en el JSON? usa \\\\frac)"); break
        if len(DOLLAR.findall(t)) % 2:
            problems.append(f"{sid}: signos $ desbalanceados en «{t[:60]}»"); break
        if "\\$" in t:
            problems.append(f"{sid}: no uses \\$ para dinero; escribe «pesos»"); break
        if FORBIDDEN.search(t):
            problems.append(f"{sid}: no menciones el texto extraído, el recorte ni la explicación anterior («{FORBIDDEN.search(t).group(0)}»)"); break

r = subprocess.run(["node", str(Path(__file__).with_name("validate_katex.mjs")), str(d / "output.json")], capture_output=True, text=True)
if r.returncode:
    problems += [line for line in r.stdout.splitlines() if line.strip()]
if problems:
    print("\n".join(problems)); sys.exit(1)
verified = sum(1 for s in out if s.get("verified"))
print(f"OK: {len(out)} preguntas, {verified} profundizadas y verificadas, {len(out) - verified} sin verificar")
