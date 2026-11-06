# Profundizar soluciones paso a paso (PAES Studio)

Cada lote es una carpeta con `input.json`: una lista de preguntas de la PAES (Chile) con su enunciado
(`stem`), alternativas (`options`), **clave oficial** (`answer`), ruta absoluta al recorte del folleto
(`image`, puede ser `null`), lectura asociada (`passage_file`, puede ser `null`) y la explicación que ya
existe (`current`: `summary`, `steps`, `distractors`).

Tu trabajo: reescribir cada explicación para que sea **significativamente más detallada, explícita y
pedagógica**, sin saltar pasos algebraicos ni inferencias, y guardar el resultado en `output.json` dentro de
la misma carpeta del lote.

**Si `current` es `null`, la pregunta aún no tiene explicación:** redáctala desde cero con esta misma estructura.
Ignora lo que este documento dice sobre compararla con la actual; el validador exige un mínimo de 800 caracteres entre planteamiento, pasos y distractores (lo habitual ronda los 1.500).

**No inventes.** Nunca adivines un dato de una figura, tabla o texto que no puedas leer, ni fuerces un razonamiento
para llegar a la clave. Si no llegas a la clave oficial por tu cuenta, marca esa pregunta con `"verified": false`:
es preferible dejarla sin explicación a publicar una falsa.

## Cómo trabajar cada pregunta
1. Si `image` no es `null`, **abre la imagen** con la herramienta Read: es el recorte fiel del folleto. Cuando
   `text_quality` es `aproximado` (casi todo Matemática), el texto de `stem`/`options` puede estar corrupto o
   vacío: manda la imagen. Si hay `passage_file`, léelo completo una vez por lectura.
2. Resuelve tú mismo la pregunta y compárala con `current`. La clave oficial `answer` **no se cambia nunca**.
   Si la explicación actual tiene un error, corrígelo en tu versión.
3. Redacta la nueva explicación con esta estructura:
   - `summary` (1–2 oraciones): la idea clave o el concepto que destraba la pregunta.
   - `planteamiento` (1–3 oraciones): **qué pide exactamente** el enunciado y **qué datos entrega**.
     - Matemática/Física/Química: los datos con sus valores y unidades en KaTeX (p. ej. «Se pide $x$ tal
       que…; datos: $v_0 = 0$, $a = 2\ \mathrm{m/s^2}$, $t = 5\ \mathrm{s}$»).
     - Lectora: el **fragmento clave** citado entre «» y dónde está (párrafo, verso, sección).
     - Biología/Historia: qué variables, fuente, período o concepto están en juego.
   - `steps` (de 3 a 9 cadenas): el desarrollo completo, **un paso por operación o inferencia**.
     - No escribas «Paso 1:» al inicio: la interfaz los numera sola.
     - Matemática y Ciencias: muestra el planteamiento de la ecuación, **cada despeje intermedio**, el
       **reemplazo de valores** y **nombra la propiedad o ley aplicada** («por la propiedad distributiva…»,
       «producto de potencias de igual base…», «por conservación de la masa…»). Una cadena larga de
       igualdades puede ir en display: `$$a = b = c$$`.
     - Lectora, Biología e Historia: análisis deductivo explícito: qué dice el texto o la fuente, qué se
       infiere y por qué, y cómo eso descarta o confirma cada idea.
     - El **último paso** confirma el resultado y termina exactamente con:
       `Por lo tanto, la alternativa correcta es la X.` (X = `answer`).
   - `distractors`: **una entrada por cada alternativa incorrecta** (todas las letras de `options` excepto
     `answer`). Cada una dice qué afirma o qué valor da esa alternativa y **qué error o trampa típica del
     DEMRE lleva a ella** (signo, unidad, porcentaje sobre la base equivocada, confundir variable dependiente
     con independiente, afirmación verdadera pero que no responde la pregunta, etc.). Si una alternativa no
     tiene un error típico claro, explica brevemente por qué no cumple.
4. Marca `"verified": true` solo si llegaste por tu cuenta a la clave oficial. Si no puedes (falta la figura,
   el enunciado es ambiguo…), marca `"verified": false` con los demás campos omitidos: se conservará la
   explicación actual.

## Formato de `output.json`
Una lista con **todas** las preguntas del lote, en el mismo orden:

```json
[
 {
  "id": "m1-2026-invierno-q07",
  "verified": true,
  "summary": "Hay que descontar en el orden en que ocurren las acciones: lo apartado se calcula sobre el total, pero la mitad del queque se calcula sobre lo que queda.",
  "planteamiento": "Se pide cuántos huevos quedan disponibles. Datos: la caja tiene $12$ huevos; se apartan $\\frac{1}{3}$ y $\\frac{1}{6}$ **del total**, luego se usa **la mitad de los restantes** y finalmente se rompe $1$ huevo.",
  "steps": [
   "Calcula lo que se aparta, ambas fracciones sobre el total de $12$: tortilla $\\frac{1}{3}\\cdot 12 = \\frac{12}{3} = 4$ huevos y revueltos $\\frac{1}{6}\\cdot 12 = \\frac{12}{6} = 2$ huevos.",
   "Resta lo apartado del total: $12 - 4 - 2 = 6$ huevos restantes.",
   "El queque usa la mitad **de los restantes** (no del total): $\\frac{1}{2}\\cdot 6 = 3$ huevos, así que quedan $6 - 3 = 3$ huevos.",
   "Descuenta el huevo que se rompe al guardar la caja: $3 - 1 = 2$ huevos.",
   "Comprobación: $4 + 2 + 3 + 1 + 2 = 12$, se reparten los 12 huevos. Por lo tanto, la alternativa correcta es la B."
  ],
  "distractors": {
   "A": "…",
   "C": "3 huevos: olvida descontar el huevo que se rompe al final; es el resultado del paso 3.",
   "D": "…"
  }
 },
 { "id": "…", "verified": false }
]
```

## Reglas de texto (las verifica `validate_deepen.py`)
- Español de Chile, tono de profesor cercano y preciso; tuteo o impersonal (sin voseo). Sin emojis.
- Fórmulas en KaTeX entre `$…$` (en línea) o `$$…$$` (display). Los `$` deben quedar balanceados.
- En JSON cada barra invertida va doble: `\\frac`, `\\cdot`, `\\times`, `\\mathrm`. Una sola barra rompe el
  JSON o crea caracteres de control.
- **No** uses `\\$` ni `$` para dinero: escribe «pesos» (p. ej. «$1\\,500$ pesos»).
- Usa `\\cdot` o `\\times` para multiplicar, `\\frac{a}{b}` para fracciones, `\\%` dentro de fórmulas.
  Comandos de texto dentro de fórmulas con `\\text{…}` o `\\mathrm{…}`.
- La versión nueva debe ser claramente más extensa que la actual (el validador exige al menos ~1,3 veces
  el largo de `steps` + `distractors` actuales y no menos pasos que antes), pero sin relleno: cada oración
  aporta un dato, una operación o una inferencia.
- No menciones «el texto extraído», «la imagen», «el recorte» ni «la solución anterior»: escribe como si
  explicaras sobre el folleto impreso («la figura muestra…», «el gráfico indica…» sí está bien).

## Validación (obligatoria)
Al terminar ejecuta:

```
python3 /home/fels/Desktop/APP_PAES/scripts/pipeline/solutions/validate_deepen.py <carpeta-del-lote>
```

Corrige cada problema que liste y vuelve a ejecutarlo hasta que imprima `OK`.
