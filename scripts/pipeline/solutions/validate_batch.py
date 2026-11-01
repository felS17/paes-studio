#!/usr/bin/env python3
"""Valida el output.json de un lote. Uso: python3 validate_batch.py <carpeta-del-lote>

Imprime «OK» si todo está bien; si no, lista cada problema para corregirlo.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

d = Path(sys.argv[1])
inp = {q["id"]: q for q in json.loads((d / "input.json").read_text(encoding="utf-8"))}
problems = []
try:
    raw = (d / "output.json").read_text(encoding="utf-8")
    out = json.loads(raw)
except FileNotFoundError:
    print("FALTA output.json"); sys.exit(1)
except json.JSONDecodeError as e:
    print(f"JSON INVÁLIDO: {e}"); sys.exit(1)
if not isinstance(out, list):
    print("output.json debe ser una lista"); sys.exit(1)
ids = [s.get("id") for s in out]
for missing in set(inp) - set(ids):
    problems.append(f"{missing}: falta en output.json")
for extra in set(ids) - set(inp):
    problems.append(f"{extra}: id que no está en input.json")
CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
for s in out:
    sid = s.get("id", "?")
    q = inp.get(sid)
    if not q:
        continue
    if not isinstance(s.get("verified"), bool):
        problems.append(f"{sid}: 'verified' debe ser true o false")
        continue
    if not s["verified"]:
        continue
    summary, steps = s.get("summary", ""), s.get("steps", [])
    if not isinstance(summary, str) or len(summary.strip()) < 15:
        problems.append(f"{sid}: 'summary' vacío o muy corto")
    if not isinstance(steps, list) or not 2 <= len(steps) <= 9 or not all(isinstance(x, str) and x.strip() for x in steps):
        problems.append(f"{sid}: 'steps' debe tener entre 2 y 9 pasos de texto")
        continue
    if not re.search(rf"\b{q['answer']}\b", steps[-1]):
        problems.append(f"{sid}: el último paso debe concluir con la clave oficial {q['answer']}")
    keys = {o["key"] for o in q["options"]}
    dis = s.get("distractors", {}) or {}
    if not isinstance(dis, dict) or any(k not in keys or k == q["answer"] for k in dis):
        problems.append(f"{sid}: 'distractors' solo puede tener letras incorrectas existentes")
    for t in [summary, *steps, *(dis.values() if isinstance(dis, dict) else [])]:
        if CTRL.search(t) or "\t" in t:
            problems.append(f"{sid}: carácter de control en el texto (¿escribiste \\frac o \\times con una sola barra en el JSON? usa \\\\frac)")
            break
        if len(re.findall(r"(?<!\\)\$", t)) % 2:
            problems.append(f"{sid}: signos $ desbalanceados en «{t[:60]}»")
            break
        if "\\$" in t:
            problems.append(f"{sid}: no uses \\$ para dinero; escribe «pesos»")
            break
r = subprocess.run(["node", str(Path(__file__).with_name("validate_katex.mjs")), str(d / "output.json")], capture_output=True, text=True)
if r.returncode:
    problems += [l for l in r.stdout.splitlines() if l.strip()]
if problems:
    print("\n".join(problems)); sys.exit(1)
verified = sum(1 for s in out if s.get("verified"))
print(f"OK: {len(out)} preguntas, {verified} resueltas y verificadas, {len(out) - verified} sin verificar")
