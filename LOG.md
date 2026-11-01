# LOG.md - Bitácora Técnica y Progreso (PAES Studio)

## Estado Actual
- **Modo de ejecución:** Construcción autónoma End-to-End (sin pausas manuales). Completada el 2026-10-31.
- **Entradas disponibles:** `/pruebas-oficiales` → `Pruebas_DEMRE/` y `/facsimiles-oficiales` → `Clavijeros_Pruebas_DEMRE/` (enlaces simbólicos; los PDF originales no se movieron ni modificaron).
- **Skill activa:** `frontend-design` (Anthropic) bajo reglas de `CLAUDE.md`, instalada en `.claude/skills/frontend-design/SKILL.md`.
- **Build:** `npm run build` pasa con 0 errores de TypeScript; `npm run lint` con 0 problemas (verificado de nuevo al cierre de la Fase 5).
- **Datos:** 46 ensayos y 2.796 preguntas (41 oficiales DEMRE con clavijero + 5 curados). Soluciones paso a paso: 85 curadas (`desarrollo`) y **973 de las 978 preguntas de las PAES de Invierno 2026 y 2027** (`solucion`, redactadas con IA y validadas contra la clave). El resto muestra solo la clave oficial (las mini-pautas genéricas se eliminaron en la Fase 3).
- **Fase 2 (2026-11-01):** mini-pautas en todas las preguntas oficiales, Analítica simplificada a 3 bloques (diagnóstico, cuaderno de errores con modo revancha, evolución), Flashcards SM-2 para Ciencias e Historia (141 tarjetas) y compendios LaTeX/Beamer extensos generados desde un temario de 67 subtemas.
- **Fase 3 (2026-11-01):** mini-pautas eliminadas; soluciones específicas para Invierno 2026–2027; rediseño con identidad por asignatura (revertido en la Fase 4).
- **Fase 4 (2026-11-01):** reversión estética estricta a Zinc monocromático. Se eliminan colores e íconos por asignatura, degradados y adornos; se conservan intactos los datos, las soluciones, el material LaTeX y toda la funcionalidad.
- **Fase 5 (2026-11-01, cierre):** 10 PDF compilados y servidos desde `public/pdfs/`, Analítica reorganizada con revelación progresiva, `LICENSE` MIT 2026 y footer.

---

## Historial de Decisiones y Cambios

### [2026-10-31] - Inicialización de `app-paes`
- **Estructura de Datos Brutos:** Se establecen las carpetas `/pruebas-oficiales` y `/facsimiles-oficiales` en la raíz de `app-paes`.
- **Arquitectura Modular:** Se instruye ramificación completa por dominios en `src/` (`components/ui`, `components/exam`, `components/analytics`, `hooks`, `store`, `utils`, `data/exams`, `scripts/pipeline`, `latex/templates`).
- **Infraestructura:** SPA estática lista para desplegar en Vercel sin servidor.

### [2026-10-31] - Construcción autónoma completa

#### Carpetas de entrada
- Los PDF venían en `Pruebas_DEMRE/` (49 folletos) y `Clavijeros_Pruebas_DEMRE/` (42 clavijeros). Para respetar los nombres de `CLAUDE.md` sin tocar los originales se crearon los enlaces simbólicos `pruebas-oficiales → Pruebas_DEMRE` y `facsimiles-oficiales → Clavijeros_Pruebas_DEMRE`. El pipeline acepta cualquiera de los dos nombres.
- `.gitignore` excluye ambas carpetas (y sus alias): son ~106 MB de material con «Derechos reservados».
- `SKILL.md` (skill `frontend-design`) se movió a `.claude/skills/frontend-design/SKILL.md` a pedido del usuario.

#### Pipeline DEMRE (`scripts/pipeline/`)
- **Herramienta:** PyMuPDF (`import pymupdf`) + Pillow. `pdfplumber` no fue necesario.
- **Cruce prueba ↔ clavijero** por nombre de archivo: los 4 primeros dígitos son el año de admisión, y se suman la modalidad (regular/invierno) y la asignatura (`demre/catalog.py`).
- **Clavijeros** (`demre/answer_keys.py`): se reconstruyen filas visuales con coordenadas de palabras para leer:
  - las claves;
  - las preguntas piloto `(*)`, que no puntúan;
  - las preguntas **anuladas** `(**)`, una en cada M2 de 2025–2027;
  - la **tabla oficial de transformación P → PAES**.

  Los 42 clavijeros validan: total de preguntas, tabla monótona de 100 a 1000 y filas = puntuables + 1.
- **Segmentación** (`demre/layout.py`):
  - Los números de pregunta se detectan por tamaño de fuente (18 pt frente a 12 pt del cuerpo), incluso cuando comparten línea o span con el enunciado.
  - Se omiten la portada y las páginas de instrucciones; las lecturas se detectan con `LECTURA N: preguntas a a b`.
  - Cada pregunta abarca hasta el siguiente evento, aunque cruce páginas, y se recorta en la página de su última alternativa.
  - Los conteos coinciden con lo declarado en cada portada («selección de N preguntas»).
- **Texto** (`demre/text.py`): la fuente Symbol/MathType usa el área de uso privado (`U+F02D` = −, etc.) y se traduce a Unicode. Las negritas y cursivas pasan a Markdown, los superíndices a ¹²³ y el `$` se escapa porque el renderizador lo interpreta como fórmula.
- **Recortes fieles** (`demre/snapshots.py`):
  - Toda pregunta de M1/M2 (las fracciones apiladas no sobreviven a la extracción de texto) y las de Ciencias/Historia/Lectora con figuras, tablas o símbolos se guardan como WebP en `public/exam-assets/<ensayo>/`.
  - Escala de grises: paleta de 16 niveles + WebP sin pérdida, `method=4` (la mitad del peso con pérdida y unas 80× más rápido que `method=6`). Se invierten en modo oscuro.
  - Color: WebP con pérdida (calidad 70).
  - Ancho fijo de página para que todas las preguntas compartan escala.
- **Lecturas de Lectora:**
  - Se extraen como texto editorial y se reconstruyen los párrafos por el espacio vertical entre líneas, lo que permite numerarlos.
  - Las figuras se recortan con su pie de foto y las notas al pie se separan por superíndice.
  - Las páginas visualmente densas (infografías) se guardan como imagen.
- **Ejes temáticos:**
  - Matemática, Historia y Lectora usan clasificación heurística por palabras clave (`demre/taxonomy.py`), con etiquetas de tema legibles y específicas por asignatura.
  - En Ciencias, el área sale de la **estructura declarada** del folleto de 80 preguntas: 1–18 son el área propia, 19–36 y 37–54 las otras dos (orden decidido por votación del bloque) y 55–80 el módulo electivo.
- **Duración:** proporcional al tiempo oficial de la prueba completa (M1 y M2: 2 h 20 min; Lectora: 2 h 30 min; Ciencias: 2 h 40 min; Historia: 2 h).
- **Omitidos (sin clavijero disponible):** los 7 folletos PAES Regular p2026 (aplicados en diciembre de 2025) y Ciencias TP 2024. El reporte queda en `scripts/pipeline/last_report.json`.
- **Ensayos curados** (`scripts/pipeline/build_curated.py` + `scripts/pipeline/curated/*.py`):
  - **Contenido:** 85 preguntas originales (M1 20, M2 16, Lectora 15 con 3 textos propios, Ciencias 18, Historia 16), cada una con resumen, desarrollo paso a paso y por qué fallan las alternativas tentadoras.
  - **Validación:** clave dentro de las alternativas, alternativas únicas, `$` balanceados y al menos 2 pasos. Las claves quedan balanceadas entre A–D.
  - **Puntaje:** se estima con la tabla oficial de la PAES Regular 2025 de cada asignatura (`curated/tables.py`).
  - **KaTeX:** las 496 fórmulas se verificaron en modo estricto.
- **Índice del catálogo:** `scripts/build-exam-index.mjs` genera `src/data/exams/index.json` y valida cada ensayo (ids únicos, clave existente, lecturas referenciadas). Corre solo en `predev` y `prebuild`.

#### Aplicación web
- **Stack:** Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 (`@tailwindcss/vite`) + Zustand 5 + KaTeX 0.19 + React Router 7 + Radix (Dialog, Slot) + Lucide. Fuentes self-hosted: Geist, Newsreader y JetBrains Mono (`@fontsource-variable`).
- **Persistencia:** todos los stores viven bajo la clave única de localStorage `paes-studio-storage`, cada uno en su campo (`settings`, `sessions`, `analytics`), mediante un `StateStorage` con alcance (`src/store/storage.ts`).
- **Carga de datos:** el índice es liviano y cada ensayo es un chunk JSON propio (`import.meta.glob`). Las rutas pesadas (ensayo, resultados, analítica, material) se cargan con `React.lazy`, lo que deja el bundle inicial en 358 kB (109 kB gzip).
- **Dashboard:**
  - La «regla PAES» 100–1000 con el último puntaje de cada asignatura es el elemento distintivo del diseño.
  - Filtros por asignatura, modalidad (regular, invierno, curado) y año, sincronizados con la URL.
  - Lista densa por asignatura con el mejor puntaje y los ensayos en curso.
- **Motor de ensayos (`ExamRunner`):**
  - *Modo práctica:* verificación inmediata contra el clavijero, desarrollo paso a paso desplegable con KaTeX (se abre solo si fallaste) y cronómetro ascendente.
  - *Modo ensayo:* cuenta regresiva oficial con avisos a los 5 min y a 1 min, entrega automática al llegar a cero y diálogo de entrega con respondidas, sin responder y con duda.
  - *Hoja de respuestas:* respondida, sin responder, con duda y, en práctica, correcta o incorrecta. Se agrupa por lectura y tiene filtros.
  - *Vista dividida redimensionable* (mouse, touch y teclado) cuando la pregunta tiene `passageId`. Incluye tipografía Serif/Sans, siete tamaños de letra y numeración de párrafos en el margen. En móvil se alterna con pestañas Texto/Pregunta.
  - *Atajos:* `A`–`E` responden, `←`/`→` navegan, `F` marca duda, `Enter` verifica o avanza y `⌫` borra la respuesta.
  - El avance y el tiempo se guardan solos; el reloj solo corre con la pestaña visible.
- **Puntaje (`src/utils/scoring.ts`):**
  - La prueba completa usa la tabla oficial exacta (`tabla[P]`, sin piloto).
  - Las selecciones y los ensayos curados se estiman proporcionalmente con interpolación.
  - En práctica, el puntaje se calcula sobre las preguntas respondidas.
- **Resultados:** puntaje sobre la regla junto al mejor anterior, estadísticas, rendimiento por eje y revisión pregunta a pregunta con filtros.
- **Analítica:**
  - Resumen por asignatura e historial de intentos (con borrado de intentos individuales).
  - Evolución del puntaje: una serie con cursor guía, tooltip y vista de tabla.
  - Rendimiento por eje y puntos débiles (temas con menos de 75 % de acierto y al menos 3 preguntas, con enlace a práctica).
  - `BackupManager`: exportar e importar JSON (combinar o reemplazar), con validación de formato.
- **Material LaTeX:** página que lista plantillas y resúmenes generados, con vista de código y descarga.
- **Diseño** (`frontend-design` + `CLAUDE.md`):
  - Paleta Zinc exacta del brief (`#FAFAFA`/`#09090B`, superficies `#FFFFFF`/`#121215`, hairlines de 1px); sin azul/índigo, gradientes, `shadow-lg/xl` ni `rounded-2xl/3xl`.
  - Monoespaciada solo en reloj, puntajes, números de pregunta y `<kbd>`.
  - Anatomía de alternativas A–E exactamente como en `CLAUDE.md`.
  - Sin rótulos en mayúsculas, sin metadatos unidos con «·» y sin «→» en botones.
  - Foco visible, `prefers-reduced-motion` respetado y modo claro/oscuro/sistema sin destello inicial.
  - Para gráficos se siguió la skill `dataviz`: barras en vez de radar polar, una serie por gráfico e identidad nunca solo por color.
- **Revisión visual:** 23 capturas con Chromium headless (escritorio y móvil, claro y oscuro). Se corrigieron:
  - la clave de `import.meta.glob`, que no coincidía con el índice;
  - el solapamiento del encabezado en móvil;
  - el pie de figura duplicado;
  - el panel estirado en resultados;
  - el exceso de botones primarios en el listado.

#### Material LaTeX
- `latex/templates/guia_sintesis_paes.tex`: A4 a dos columnas con cajas `tcolorbox` (`definicion`, `formula`, `ejemplo`, `errorfrecuente`, `dato`) y alternativas con su tecla, como en la app.
- `latex/templates/beamer_repaso_paes.tex`: Beamer 16:9 minimalista con paleta Zinc, sin símbolos de navegación, con barras de frecuencia por eje y diapositivas de pregunta y desarrollo.
- `scripts/pipeline/generate_latex_summary.py`:
  - Cuenta ejes y temas en todos los ensayos y los ordena por frecuencia.
  - Convierte Markdown+LaTeX a LaTeX (escapes, Unicode, tablas y citas).
  - Escribe `latex/output/guia_<asignatura>.tex` y `repaso_<asignatura>.tex` (10 archivos).
- **Verificación:** el contenido generado de los 10 archivos compila con el `pdflatex` local, usando stubs de las cajas porque `tcolorbox` y `beamer` no están instalados en este equipo. A raíz de eso, las plantillas cargan `lmodern` antes de `fontenc` y usan `\spanishplainpercent`, de modo que no dependen de las fuentes EC y `\%` funciona en modo matemático. Overleaf incluye ambos paquetes.

### [2026-11-01] - Fase 2: mini-pautas, analítica accionable, flashcards y compendios

#### Temario estructurado (`scripts/pipeline/temario/`)
- Base de conocimiento única para las mini-pautas y el material LaTeX: 5 asignaturas, **67 subtemas** (M1 15, M2 13, Lectora 9, Ciencias 18, Historia 12).
- Cada subtema trae:
  - teoría en 2–3 párrafos;
  - un recuadro (fórmula, ley, mecanismo o definición);
  - esquema comparativo o línea de tiempo cuando corresponde;
  - ideas clave, método de resolución y trampas frecuentes del DEMRE;
  - un ejemplo resuelto tipo PAES.
- Incluye ejes transversales: suficiencia de datos (M2), habilidades de pensamiento científico (Ciencias) y análisis de fuentes (Historia).
- **Verificación:** se validan claves, alternativas no repetidas y `$` balanceados, y se compilan las 645 fórmulas en KaTeX con 0 errores. Se corrigió un ejemplo con dos alternativas de igual valor.

#### 1. Solución y mini-pauta en todas las preguntas
- `scripts/pipeline/generate_pautas.py` (se ejecuta solo al final de `extract_demre.py`) compone una mini-pauta para cada pregunta oficial:
  - **Tipo de pregunta:** se detecta en el enunciado y las alternativas. Lectora: localizar, sentido de una expresión, propósito o función, idea central, inferencia, relación, literario, evaluar. Ciencias: variables, hipótesis, conclusión, modelo/ley, cálculo, datos, concepto. Historia: fuente, datos, causas, continuidad y cambio, concepto. Matemática: suficiencia de datos, afirmaciones I/II/III, error en un procedimiento, modelación, cálculo.
  - **Subtema del temario:** según el eje y el tema; aporta el método, la herramienta clave (fórmulas en KaTeX) y las trampas.
  - **Referencias del enunciado:** el párrafo aludido, el fragmento citado entre comillas y la lectura asociada.
  - **Cierre:** contrasta con la clave oficial y cita la alternativa correcta cuando el texto extraído es fiel.
  - **Apoyo conceptual:** se elige la idea del subtema que más vocabulario comparte con el enunciado.
- **Resultado:** 2.711 mini-pautas (`explanation.kind = "pauta"`, con `traps`, `topicRef` y `questionType`). Las 85 curadas quedan como `kind = "desarrollo"`. Ninguna pregunta muestra solo la letra de la clave.
- **Sin OCR:** todas las preguntas, incluidas las mostradas como recorte, ya tenían texto extraído con PyMuPDF, por lo que no fue necesario OCR (tampoco hay tesseract instalado). En Matemática ese texto es aproximado, así que la pauta usa el método del subtema y no cita la alternativa.
- **Límite honesto:** sin clave de API ni modelo local, la pauta no resuelve cada ejercicio. Guía cómo abordarlo y por qué la clave cumple el criterio del tipo de pregunta, y la interfaz lo indica: «Mini-pauta generada a partir de la clave oficial, el tipo de pregunta y el método del tema».
- **Interfaz:**
  - `SolutionAccordion` pasa a llamarse «Solución y mini-pauta» (o «Desarrollo paso a paso», con la marca «Verificado»); muestra trampas frecuentes y la nota de origen.
  - Se despliega solo cuando la respuesta es incorrecta u omitida, tanto en práctica como en la revisión.
  - En Resultados, el filtro por defecto es «Para repasar» (incorrectas + omitidas) y la primera se abre sola.

#### 2. Analítica simplificada (`/analitica`)
- Quedan solo **3 bloques** y, arriba a la derecha, los botones discretos Exportar/Importar (`BackupActions`).
  1. **«Qué te falta por mejorar»:** por asignatura, los 3 ejes con menor acierto según el último intento de cada pregunta. Muestran el % de acierto, una prioridad (alta < 50 %, media < 70 %, baja) con color y texto, el tema más débil y el botón **«Practicar este eje»**.
  2. **«En qué me equivoqué»:** cuaderno de errores con las preguntas cuyo último intento fue incorrecto; salen del cuaderno al responderlas bien. Se filtra por asignatura y cada fila muestra tu letra frente a la clave. Al abrirla se ve la pregunta, la respuesta marcada, la clave y la mini-pauta. Incluye el botón **«Modo revancha»** (hasta 20 preguntas falladas de una asignatura).
  3. **«Cómo vas»:** último puntaje frente al promedio por asignatura, en una pista 100–1000, con enlace al último resultado.
- **Eliminado:** gráfico de historial, tabla de intentos, rendimiento acumulado por eje y el bloque antiguo de respaldo (más el código muerto asociado).
- **Prácticas personalizadas (`PracticeSet` en el store `sessions`):**
  - `loadExam("set-…")` las arma como ensayos con preguntas de varios ensayos, renumeradas y con sus lecturas, de modo que el motor, los resultados y la analítica funcionan sin cambios.
  - El índice ahora incluye `axisQuestions`, para armarlas sin descargar los ensayos.
  - La práctica por eje prioriza tus errores recientes y luego las preguntas no vistas (primero las curadas).

#### 3. Flashcards (`/flashcards`): solo Ciencias e Historia
- **Mazos:** Biología (35), Física (35), Química (35) e Historia (36) = **141 tarjetas**, organizadas en las unidades pedidas. Están en `src/data/flashcards/*.ts` con `String.raw` y se cargan bajo demanda. **No hay mazos de Matemática ni de Lectora.**
- **Planificador SM-2** (`src/utils/srs.ts`):
  - Tarjeta nueva o en aprendizaje: `1` Otra vez → 10 min, `2` Difícil → 1 día, `3` Bien → 3 días, `4` Fácil → 7 días.
  - En repaso, el factor de facilidad se ajusta con la fórmula SM-2 (mínimo 1,3) y el intervalo crece ×1,2 / ×EF / ×EF×1,3. «Otra vez» es un olvido: reaprendizaje en 10 min sin cambiar el factor, como en SM-2.
  - Probado con aserciones; una prueba detectó y corrigió que «Otra vez» bajaba el factor.
- **Cola estilo Anki:** primero aprendizaje, luego repasos del día y al final nuevas (20 por día, ampliable). Contadores: Nuevas (zinc), En aprendizaje (ámbar) y Por repasar (esmeralda). El estado se guarda en `paes-studio-storage` → `flashcards`.
- **Interfaz:** tarjeta giratoria en 3D (`Espacio` o `Enter` para voltear; `1`–`4` para calificar, con la vista previa del intervalo en cada botón), reverso con puntos clave en KaTeX y pantalla de fin de sesión.

#### 4. Compendios LaTeX y Beamer (`latex/output/`)
- **Generador reescrito:** `generate_latex_summary.py` recorre el temario completo.
  - **Guías (`guia_*.tex`):** para cada eje y subtema, teoría, recuadro (`formula`/`ley`/`mecanismo`/`definicion`), esquema comparativo, línea de tiempo (Historia), ideas clave, método, «Trampas frecuentes del DEMRE», el ejemplo resuelto (enunciado, análisis y desarrollo) y hasta 2 ejemplos curados afines.
  - **Presentaciones (`beamer_*.tex`, antes `repaso_*`):** contenidos, distribución por eje, portada por eje y, por subtema, diapositivas de teoría con recuadro, desafío y solución con trampas. Son **53 (M1), 48 (M2), 34 (Lectora), 62 (Ciencias) y 45 (Historia)**.
- **Plantillas:** nuevos entornos `mecanismo`, `ley`, `ideasclave`, `metodo`, `lineatiempo`, `cajaclave` y `cajatrampa`. Las fórmulas con `\qquad` se apilan con `gather*` para no desbordar la columna.
- **Verificación:** las 10 salidas compilan con el `pdflatex` local usando stubs de las cajas (las guías ocupan de 7 a 12 páginas incluso sin el estilo real), con 0 *overfull* en las guías.
- **Sin PDF:** **no se generaron PDF** porque `tcolorbox` y `beamer` no están instalados en este equipo y descargar paquetes de CTAN quedó bloqueado por permisos. En Overleaf compilan tal cual.

#### Verificación final (navegador headless, Chromium)
- 15 de 15 verificaciones automáticas y sin errores de consola:
  - la revisión abre «Solución y mini-pauta» en la primera pregunta a repasar;
  - la Analítica tiene los 3 bloques y Exportar/Importar;
  - el cuaderno muestra la solución;
  - «Practicar este eje» y «Modo revancha» abren el motor;
  - Flashcards tiene 4 mazos sin Matemática ni Lectora;
  - `Espacio` voltea y los intervalos de una tarjeta nueva son `<10 min / 1 d / 3 d / 7 d`;
  - calificar avanza la cola y «Otra vez» pasa la tarjeta a aprendizaje;
  - el estado queda persistido en `paes-studio-storage`.
- Capturas revisadas en escritorio, modo oscuro y móvil.

### [2026-11-01] - Fase 3: identidad visual y soluciones de Invierno 2026–2027

#### 1. Limpieza de mini-pautas
- Se eliminaron las **2.711 mini-pautas** genéricas (`kind: "pauta"`) de todos los JSON, junto con `generate_pautas.py`, su llamada en `extract_demre.py` y el script `npm run pautas`. Las **85 soluciones curadas** se conservan.
- `Explanation.kind` queda en `'desarrollo' | 'solucion'` (sin `traps`, `topicRef` ni `questionType`).
- `SolutionAccordion`:
  - **sin explicación:** muestra una sola línea limpia, «Clave oficial del clavijero DEMRE: X»;
  - **con explicación:** título **«Solución del ejercicio»**, insignia «Revisada» (curada) o «Redactada con IA», pasos numerados, «Por qué no las otras» y una nota de origen.
- En revisión y práctica, la solución se despliega sola si la respuesta fue incorrecta u omitida.

#### 2. Soluciones específicas de las PAES de Invierno 2026 y 2027
- **Alcance:** 14 ensayos (M1, M2, Lectora, Historia y Ciencias Biología/Física/Química de cada año), con **978 preguntas**. El Módulo Común de Ciencias aparece repetido en las tres pruebas de cada año: se deduplicó por enunciado y quedaron **764 preguntas únicas**.
- **Lotes** (`scripts/pipeline/solutions/prepare_batches.py`): 39 lotes de ~22 preguntas, cada uno con id, enunciado, alternativas, clave, ruta absoluta al recorte `.webp` y la lectura (Lectora va en lotes de 2 lecturas).
- **Redacción:** 39 subagentes **Haiku** en paralelo (3 olas). Cada uno abrió las imágenes, resolvió por su cuenta y marcó `verified: true` solo si llegaba a la clave oficial; si no, dejó la pregunta sin solución en lugar de forzar un razonamiento.
- **Validador** (`validate_batch.py` + `validate_katex.mjs`), que cada lote debía pasar:
  - JSON e ids exactos;
  - 2–9 pasos, con el último cerrando en «la alternativa correcta es la X» con la clave oficial;
  - distractores válidos;
  - `$` balanceados, sin `\$`;
  - cada fórmula compilada con KaTeX.
  - **Resultado:** 39 de 39 lotes OK.
- **Resultado:** **973 de 978** preguntas con solución.
  - **Sin verificar (5), muestran solo la clave:**
    - Biología 2026 q73;
    - Química 2026 q61 (la figura no está en el recorte);
    - Biología 2027 q79 (la lectura del gráfico no llega a la clave);
    - Química 2027 q60 (texto de isótopos ambiguo);
    - Química 2027 q65 (A y B cumplen la condición con los datos dados).
- **Almacén versionado** `scripts/pipeline/solutions/soluciones.json` (id → clave + explicación). `merge_solutions.py` lo aplica a `src/data/exams/` y `extract_demre.py` lo vuelve a aplicar al final, así que una nueva extracción no borra las soluciones. Si la clave de una pregunta cambia, su solución se omite.
- **Revisión manual de muestras:** M1 2026 q07 y q15, M2 2026 q26, Lectora 2026 q03, Física 2026 q25, Física 2027 q42, Historia 2027 q20 y M2 2027 q01 son correctas y específicas.
  - **Biología 2027 q48:** el PDF dice literalmente $\mathrm{N_3O_5}$ en la alternativa B; se quitó una mención al «texto extraído».
- **Para revisar (interpretativas según los propios subagentes):**
  - Lectora 2026 q10, q13, q58, q60 y q64;
  - Historia 2026 q17;
  - Ciencias 2026 q28 y q33;
  - M1 2027 q05 y q50 (giros del cubo).
- **Hallazgo de extracción:** en varias preguntas de M1/M2 el texto de las alternativas del JSON está corrupto (letras desplazadas u opciones vacías: M1 2026 q46, q62, q65; M2 2026 q20, q22, q27, q29, q32, q34, q39, q42; M1 2027 q08, q14, q16, q22; M2 2027 q09, q10, q12, q19, q21, q23, q25, q27, q29, q39, q42, q44, q50, q51, q53, q54). En la app no se nota porque esas preguntas se muestran como recorte, y las soluciones se escribieron leyendo la imagen.

#### 3. Identidad visual por asignatura (revertida en la Fase 4)
- `src/data/identity.ts` (`THEMES`, `AREA_ICONS`, `themeFor`, `areaFromAxis`, `axisIcon`) y `src/components/ui/subject-identity.tsx` (`SubjectIcon`, `SubjectBadge`) reemplazan a `subject-mark`.
  - **Asignaturas:** M1 `Sigma`/indigo, M2 `DraftingCompass`/violet, Lectora `BookOpen`/amber, Ciencias `Dna`·`Atom`·`FlaskConical`·`Microscope`/emerald, Historia `Landmark`/rose.
- **Validación con el script de la skill `dataviz`:**
  - indigo/violet tienen ΔE 6,3 → el color nunca va solo, siempre con ícono y nombre;
  - ámbar y esmeralda tienen bajo contraste sobre blanco → el texto usa tonos 700.
  - Documentado en `CLAUDE.md` §1.1.
- **Rediseño hecho por un subagente Sonnet con la skill `frontend-design`:**
  - **Dashboard:** `ProjectionChart` («Tu proyección en la escala PAES (100 – 1000 pts)»).
    - Curva del promedio de los últimos puntajes por asignatura, eje fijo 100–1000 con hitos punteados en 600/750/900/1000 y el único degradado permitido bajo la curva.
    - Tooltip, vista de tabla, chips por asignatura con ícono y último puntaje.
    - Sin intentos no dibuja ninguna curva.
    - Filtros y filas de ensayos con ícono y borde de color.
  - **Motor:** insignia de asignatura/eje en la cabecera de cada pregunta (en modo ensayo no revela el eje), barra de progreso y pestañas Texto/Pregunta con el color de la asignatura.
  - **Flashcards:**
    - borde superior e ícono del mazo, y barra de progreso de dos tramos;
    - contadores en pastillas: Nuevas celeste, En aprendizaje ámbar y Por repasar esmeralda;
    - giro 3D con perspectiva de 1600 px, respetando `prefers-reduced-motion`;
    - botones 1–4: Otra vez rosa, Difícil ámbar, Bien esmeralda, Fácil celeste.
  - **Material** → «Biblioteca de compendios y presentaciones», que lee `latex/output/manifest.json`:
    - compendios como portadas con lomo de color, ejes y subtemas;
    - presentaciones como miniaturas 16:9 sobre un mazo, con el número de diapositivas;
    - «Descargar .tex», «Abrir en Overleaf» (POST a `overleaf.com/docs`) y «Ver código».
  - **Analítica:**
    - barras con color semántico (rojo < 50 %, ámbar < 70 %, esmeralda ≥ 70 %) e ícono por eje;
    - cuaderno de errores en tarjetas con «Marcaste X» / «Clave Y»;
    - tarjeta «Modo revancha» con un botón por asignatura;
    - «Cómo vas» por asignatura.
- Arreglo posterior: la portada del compendio de Historia desbordaba (faltaba `min-w-0`) y se cambiaron los textos de interfaz que aún decían «mini-pauta».

#### Verificación final (navegador headless, Chromium)
- **Comprobaciones automáticas, todas OK y sin errores de consola:**
  - Dashboard vacío sin curva falsa;
  - curva, degradado, hitos, chips y vista de tabla después de rendir 4 ensayos de Invierno;
  - «Solución del ejercicio» con insignia «Redactada con IA» y KaTeX sin `.katex-error`, también con todas las soluciones de Química 2027 abiertas;
  - Química 2027 q65 muestra solo la clave;
  - flashcards: `Espacio` voltea y aparecen los 4 botones;
  - biblioteca: «Abrir en Overleaf», «Descargar .tex» y «Ver código» con el `.tex`;
  - Analítica con sus 3 bloques;
  - en móvil (390 px), sin scroll horizontal.
- Capturas revisadas en claro, oscuro y móvil. **Sin probar:** el POST real a Overleaf.

### [2026-11-01] - Fase 4: reversión estética estricta (Zinc monocromático)
El rediseño de la Fase 3 (íconos y colores por asignatura, portadas y barras multicolor) se percibía como plantilla genérica. Se volvió a la estética sobria de Linear / Geist sin tocar datos ni funcionalidad.

#### Qué no se tocó
- `src/data/exams/**` (soluciones de Invierno y curadas), `latex/**`, `scripts/**`, stores, `srs.ts`, la lógica de flashcards (SM-2, mazos, `Espacio` y `1`–`4`), los 3 bloques de Analítica y `SolutionAccordion`.

#### Sistema de identidad eliminado
- Borrados: `src/data/identity.ts`, `src/components/ui/subject-identity.tsx`, `src/components/flashcards/deck-identity.ts` y `src/utils/mastery.ts`. También se quitaron `activeClass` de `Segmented`, las variantes de color de `Badge` (`success`/`danger`/`warning`) y de `Button` (`danger`), y los keyframes `draw`/`rise`.
- Nuevo `src/components/ui/subject-tag.tsx`:
  - **`Tag` / `SubjectTag`:** etiqueta neutra `bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200` con borde de 1 px.
  - **`SubjectMono`:** monograma M1/M2/CL/CS/HI en mono, usado en «En curso» de la barra lateral.

#### Vistas
- **Dashboard:** filtros y filas de ensayos sin íconos ni bordes de color.
  - **Gráfico:** «Proyección en la escala PAES (100 – 1000)» es ahora un trazo `currentColor` de 1,75 px (zinc-900 / zinc-100), sin degradado, halos ni animación. Los hitos son líneas punteadas zinc, el tooltip no usa color y la lista de asignaturas lleva separadores finos.
- **Motor de ensayo:** cabecera sin ícono, barra de progreso zinc y pestañas Texto/Pregunta neutras. La insignia de eje es un `Tag` y en modo ensayo no se muestra.
  - **Reloj:** a 5 min, superficie zinc con borde; a 1 min, invertido (zinc-900).
  - **Duda:** la marca y su punto en la hoja de respuestas pasan a zinc.
- **Flashcards:**
  - mazos en tarjetas blancas u oscuras con borde de 1 px, sin ícono ni borde superior de color;
  - progreso en dos tonos zinc;
  - contadores como fila tipográfica (mono `tabular-nums`) sin íconos;
  - en el estudio, una tarjeta simple sin mazo apilado ni sombras, giro 3D más sobrio (500 ms, sin rebote) y botones `1`–`4` neutros con `<kbd>`.
- **Material LaTeX:** «Compendios y presentaciones».
  - Un panel por asignatura con sus ejes y subtemas, y dos filas (compendio y Beamer) con nombre de archivo en mono y cifras `tabular-nums`.
  - Acciones: «Descargar .tex», «Abrir en Overleaf» y «Ver código». Sin portadas, lomos ni miniaturas.
- **Analítica:**
  - barras zinc con marcas en 50 % y 70 %, y prioridad como etiqueta neutra;
  - cuaderno de errores en una lista con separadores, `SubjectTag` y «marcaste / clave» en mono;
  - «Modo revancha» como panel simple;
  - «Cómo vas» como tabla con mono `tabular-nums` (intentos, último, promedio, mejor, variación y escala).
- **Colores semánticos:** solo `emerald`/`rose` para corregir respuestas (alternativas, hoja de respuestas, revisión y la línea «Correcta/Incorrecta»). Los mensajes de respaldo y errores de carga pasan a zinc.
- **Navbar móvil:** las pestañas ya no se parten en dos líneas (`shrink-0 whitespace-nowrap`).
- `CLAUDE.md` §1 vuelve a la Lista Negra estricta: prohibidos los colores por asignatura, los gradientes y los íconos decorativos.

#### Verificación (Chromium headless)
- **Detector de color:** recorre todos los elementos visibles y lee sus colores calculados (texto, fondo, borde, fill, stroke, outline y sombra) en `rgb()`, `oklch()` y `oklab()`.
- **Pantallas auditadas:** Dashboard vacío y con intentos, motor en modo ensayo, Flashcards (mazos, anverso y reverso), Material y Analítica, en claro y en oscuro → **0 colores cromáticos**.
- **Pantallas con corrección:** en la práctica corregida y en Resultados solo aparecen esmeralda/rosa.
- **Funcionalidad comprobada:**
  - «Solución del ejercicio» con KaTeX sin errores;
  - el gráfico tiene un único trazo y ningún degradado;
  - `Espacio` voltea la tarjeta y `3` califica y avanza la cola;
  - 12 botones «Abrir en Overleaf» y «Ver código» con el `.tex`;
  - Analítica con 3 bloques;
  - móvil (390 px) sin scroll horizontal en Dashboard, Material, Analítica y Flashcards;
  - sin errores de consola.
- `npm run lint` y `npm run build` con 0 errores.

### [2026-11-01] - Fase 5: cierre (PDF, Analítica, licencia y footer)

#### 1. Estética
- La reversión a Zinc de la Fase 4 se mantiene: no quedan colores ni íconos por asignatura, y el gráfico de la escala PAES es un trazo monocromático (`currentColor`) sin degradado.
- `emerald`/`rose` siguen solo para marcar respuestas correctas e incorrectas al corregir, como fija `CLAUDE.md` §4.
- Todo el trabajo visual se hizo con la skill `frontend-design`.

#### 2. PDF compilados
- **TeX Live local:** ahora sí trae `tcolorbox` y `beamer`, pero le faltan tres dependencias que `tcolorbox` carga con `[most]`: `tikzfill.image`, `pdfcol` y `listingsutf8`.
- **Sustitutos en `latex/compat/`:**
  - `tikzfill.image` (solo se usa para rellenos con imágenes, que no usamos) y `listingsutf8` (listados de código) son sustitutos vacíos.
  - `pdfcol` es una reimplementación fiel de su API para pdfTeX (`\pdfcolInitStack`, `\pdfcolSwitchStack`, `\pdfcolSetCurrent`, `\pdfcolIfStackExists`), sobre la pila de colores de pdfTeX.
  - Con esto los `.tex` se compilan **tal cual**, con el `tcolorbox` y el `beamer` reales, sin un preámbulo alternativo.
- **`scripts/pipeline/build_pdfs.py` (`npm run pdfs`):**
  - copia a un directorio temporal solo los sustitutos cuyo paquete real falta y los antepone en `TEXINPUTS`;
  - compila con `pdflatex` en dos pasadas (índice y total de diapositivas) y falla si hay errores;
  - copia los PDF a `public/pdfs/` y escribe `src/data/pdfs.json` (páginas y tamaño).
- **Resultado: 10/10 PDF, 0 errores.**

  | Documento | M1 | M2 | Lectora | Ciencias | Historia |
  | --- | --- | --- | --- | --- | --- |
  | Guía (páginas A4) | 14 | 11 | 9 | 14 | 12 |
  | Presentación (diapositivas 16:9) | 55 | 50 | 33 | 62 | 50 |

  En total ~3,6 MB.
- **Defectos de maquetación detectados al revisar las páginas, corregidos en el generador y las plantillas (sin cambiar el texto):**
  - **Tablas:** la fórmula `p{0.19\linewidth}` × n no descontaba el espacio entre columnas y se salía del recuadro. Ahora las tablas de celdas cortas usan `tabular*` a todo el ancho y las demás `p{\dimexpr(\linewidth-…\tabcolsep)/n}`.
  - **Desafíos de Beamer:** cuando el enunciado tiene tabla, es largo o las alternativas llevan fracciones, las alternativas van en dos columnas (`tcbraster`). Antes la alternativa D se montaba sobre el pie de página.
  - **Líneas de tiempo:** el año quedaba una línea más abajo que su hecho porque el `\color` iniciaba la celda `p{}`; se resolvió con `\leavevmode`. Además, en Beamer cada línea de tiempo va en su propia lámina («Línea de tiempo»).
  - **Comprobación:** un diff contra la versión anterior muestra que solo cambiaron líneas de `tabular`, `tcbraster` y `lineatiempo`.
  - **Quedan cuatro avisos menores**, que vienen de fórmulas largas del temario y no se tocaron: fórmulas de 3 a 14 pt de más en `guia_m1`, `guia_m2` y `guia_ciencias`, y una lámina de Historia 5 pt más alta.
- **Material:** cada asignatura es un panel con dos documentos (compendio y presentación).
  - Acciones principales: «Abrir PDF» (pestaña nueva) y «Descargar» (`download`).
  - Debajo, en texto discreto: el nombre del `.tex`, «Descargar .tex», «Abrir en Overleaf» y «Ver código».

#### 3. Analítica con revelación progresiva
- **Franja de resumen:** 4 cifras en mono (promedio actual, intentos guardados, preguntas por repasar y eje más débil), con separadores de 1 px.
- **Pestañas (`Tabs`, accesibles con ←/→, Inicio y Fin):** *Ejes por mejorar*, *Cuaderno de errores* y *Evolución*. La pestaña activa queda en la URL (`?vista=errores|evolucion`).
  - **Ejes por mejorar:** una asignatura a la vez, empezando por la del eje más débil. Cada eje muestra su barra con marcas en 50 % y 70 %, el tema más débil y «Practicar este eje».
  - **Cuaderno de errores:** maestro-detalle en escritorio (lista a la izquierda, pregunta con su «Solución del ejercicio» a la derecha) y acordeón en móvil. El filtro por asignatura activa «Modo revancha»; con «Todas», el botón se desactiva y una línea explica por qué.
  - **Evolución:** la tabla de puntajes de la Fase 4.
- No se eliminó ninguna funcionalidad; solo se redistribuyó.

#### 4. Licencia y footer
- `LICENSE`: MIT License, © 2026 felS (Felipe Schneeberger).
- `Footer.tsx`, al pie de todas las vistas con layout:
  - «© 2026 · Desarrollado por felS»;
  - «MIT License», que abre un diálogo con el texto del `LICENSE` importado con `?raw` (sin duplicarlo);
  - `mailto:felipe.schneeberger@estudiante.uc.cl`;
  - GitHub `@felS17`, con enlace a https://github.com/felS17.

#### Verificación (Chromium headless)
- **46 de 47 comprobaciones automáticas OK y sin errores de consola:**
  - **PDF:** los 10 responden `200 application/pdf` (cabecera `%PDF-`) desde los enlaces «Abrir PDF» de la interfaz; también funcionan «Descargar» con `download`, los enlaces `.tex` secundarios y «Ver código».
  - **Analítica:** 3 pestañas, franja de 4 métricas y la vista inicial solo con «Ejes»; la flecha → navega a `?vista=errores`; el maestro-detalle cambia de pregunta; la revancha se activa al filtrar y abre la práctica; `?vista=evolucion` abre la tabla.
  - **Footer:** texto exacto, `mailto`, GitHub y diálogo de licencia.
  - **Resto:** gráfico de un solo trazo sin degradados, flashcards (`Espacio` + `3`), auditoría de color sin colores en claro y oscuro, y móvil sin scroll horizontal.
- **La comprobación restante** («Abrir PDF» abre una pestaña con la URL del PDF) falla solo porque el Chrome headless no trae visor de PDF. Se verificó aparte que la pestaña nueva pide `/pdfs/guia_m1.pdf` y recibe `200 application/pdf`.
- `npm run lint` y `npm run build` con 0 errores.

---

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Regenera el índice y abre el servidor de desarrollo |
| `npm run build` | Regenera el índice, compila TypeScript y genera `dist/` para Vercel |
| `npm run lint` | ESLint (incluye las reglas de React Compiler de `react-hooks` v7) |
| `npm run pipeline` | `python3 scripts/pipeline/extract_demre.py`: PDFs → JSON + recortes (`--subject`, `--year`, `--modality`, `--dry-run`, `--list`, `--no-snapshots`) |
| `npm run solutions` | `python3 scripts/pipeline/solutions/merge_solutions.py`: aplica `soluciones.json` (Invierno 2026–2027) a los ensayos; `--collect <carpeta>` incorpora lotes nuevos validados |
| `npm run curated` | `python3 scripts/pipeline/build_curated.py`: valida y escribe los ensayos curados |
| `npm run pdfs` | `python3 scripts/pipeline/build_pdfs.py`: compila los 10 `.tex` a `public/pdfs/` y escribe `src/data/pdfs.json` (`--only guia_m1 …`) |
| `npm run latex` | `python3 scripts/pipeline/generate_latex_summary.py`: compendios (`guia_*`) y presentaciones (`beamer_*`) en `latex/output/` |
| `npm run exams:index` | Regenera solo `src/data/exams/index.json` |

Dependencias del pipeline: `pip install -r scripts/pipeline/requirements.txt` (PyMuPDF, Pillow).

---

## Estructura final
```
APP_PAES/
├── .claude/skills/frontend-design/SKILL.md   skill de diseño (movida desde la raíz)
├── CLAUDE.md · LOG.md · LICENSE · vercel.json · package.json · vite.config.ts · eslint.config.js · tsconfig*.json · index.html
├── Pruebas_DEMRE/ ← pruebas-oficiales (symlink)           49 folletos oficiales (sin modificar, ignorados por git)
├── Clavijeros_Pruebas_DEMRE/ ← facsimiles-oficiales       42 clavijeros (sin modificar, ignorados por git)
├── latex/
│   ├── templates/   guia_sintesis_paes.tex · beamer_repaso_paes.tex
│   ├── output/      guia_{m1,m2,lectora,ciencias,historia}.tex · beamer_{…}.tex · manifest.json
│   └── compat/      sustitutos de tikzfill.image · pdfcol · listingsutf8 (solo si faltan)
├── public/
│   ├── favicon.svg
│   ├── pdfs/                                  10 PDF compilados (guías y presentaciones)
│   └── exam-assets/<ensayo>/q01.webp …       ~1.600 recortes de preguntas y figuras
├── scripts/
│   ├── build-exam-index.mjs                   índice + validación del catálogo
│   └── pipeline/
│       ├── extract_demre.py                   CLI del pipeline DEMRE
│       ├── demre/  catalog · answer_keys · layout · text · snapshots · taxonomy · builder
│       ├── build_curated.py                   ensayos curados → JSON
│       ├── curated/  m1 · m2 · lectora · ciencias · historia · tables
│       ├── temario/  m1 · m2 · lectora · ciencias · historia   67 subtemas (teoría, método, trampas, ejemplos)
│       ├── solutions/  prepare_batches · validate_batch (+ validate_katex.mjs) · merge_solutions · soluciones.json
│       ├── generate_latex_summary.py          temario + ensayos → compendios y Beamer
│       ├── build_pdfs.py                      .tex → public/pdfs/*.pdf (pdfLaTeX)
│       └── requirements.txt · last_report.json
└── src/
    ├── main.tsx · App.tsx · styles/index.css · lib/utils.ts
    ├── types/        exam.ts · analytics.ts · user.ts · flashcards.ts
    ├── data/         catalog.ts · subjects.ts · exams/{index.json, m1/, …} · flashcards/{biologia, fisica, quimica, historia}.ts
    ├── store/        storage.ts · useExamStore.ts (sesiones + prácticas) · useAnalyticsStore.ts · useSettingsStore.ts · useFlashcardStore.ts
    ├── hooks/        useKeyboardShortcuts · useExamTimer · useTheme · useExam · useMediaQuery · usePracticeSet
    ├── utils/        scoring.ts · analytics.ts · practice.ts · projection.ts · srs.ts · flashcardQueue.ts · format.ts · markdown.ts · validators.ts
    ├── pages/        Dashboard · Exam · Results · Analytics · Flashcards · FlashcardStudy · Material · NotFound
    └── components/
        ├── ui/         button · badge · kbd · dialog (+sheet) · segmented · select · panel · empty-state · subject-tag · tabs
        ├── layout/     AppShell · Sidebar · Navbar · Footer · nav · Logo · ThemeToggle · SplitPane
        ├── exam/       ExamRunner · ExamIntro · QuestionCard · OptionButton · PassageViewer · QuestionNavigator · ExamTimer · SolutionAccordion
        ├── analytics/  ScoreRuler · AxisRadar · DiagnosisPanel · MistakeNotebook · ScoreSummary · BackupActions
        ├── flashcards/ QueueCounts
        ├── dashboard/  ProjectionChart · ExamFilters · ExamList
        └── math/       MathText · katex.ts
```

---

## Pendientes y consideraciones
- **Derechos de autor:** los folletos del DEMRE indican «Derechos reservados». Los recortes y textos extraídos viven en `public/exam-assets/` y `src/data/exams/`. Están pensados para estudio personal; antes de publicar el sitio abiertamente conviene revisar las condiciones de uso del DEMRE o desplegar solo los ensayos curados (basta con borrar los JSON oficiales y `public/exam-assets/` y regenerar el índice).
- **Peso del despliegue:** los recortes ocupan ~33 MB, dentro de los límites de Vercel.
- **Ejes de preguntas oficiales:** fuera de Ciencias son heurísticos; pueden corregirse a mano en el JSON y el índice se actualiza en el siguiente build.
- **Texto de preguntas oficiales de Matemática:** es aproximado y solo se usa como texto alternativo; la pregunta se muestra con su recorte fiel.
- **Folletos regulares p2026:** cuando el DEMRE publique sus clavijeros, basta con copiarlos a `Clavijeros_Pruebas_DEMRE/` y ejecutar `npm run pipeline`.
- **LaTeX local:** `npm run pdfs` compila con el TeX Live local; si faltan `tikzfill`, `pdfcol` o `listingsutf8`, usa los sustitutos de `latex/compat/`. Instalar los paquetes reales (`texlive-tikzfill`, `texlive-pdfcol`, `texlive-listingsutf8`) hace que se usen esos en su lugar. Tras cambiar el temario: `npm run latex && npm run pdfs`.
- **Soluciones de Invierno 2026–2027:** están redactadas con IA y validadas para concluir en la clave oficial, pero no tienen revisión docente pregunta a pregunta; la interfaz lo indica. Conviene revisar primero las interpretativas listadas en la Fase 3. Para otros años: `prepare_batches.py` → subagentes → `validate_batch.py` → `merge_solutions.py --collect`.
- **Alternativas corruptas en el JSON (M1/M2):** no afectan la vista (se usa el recorte), pero sí el texto alternativo; corregirlas requiere ajustar la extracción de alternativas en `demre/text.py`.
- **Flashcards:** 141 tarjetas iniciales; se agregan nuevas en `src/data/flashcards/*.ts` sin tocar el progreso existente (el estado se guarda por id de tarjeta).

---

## Plan de Ejecución Autónoma (Checklist)
- [x] **Etapa 1 (Scaffolding & Ramificación):** Inicializar Vite + React + TS + Tailwind + KaTeX + Zustand y crear toda la estructura de directorios.
- [x] **Etapa 2 (Pipeline & Datos):** Inspeccionar `/pruebas-oficiales` y `/facsimiles-oficiales`, crear el script extractor en `/scripts/pipeline/` y poblar `/src/data/exams/` con ensayos estructurados en JSON por asignatura.
- [x] **Etapa 3 (Motor de Estudio & UI):** Invocar `frontend-design` y construir el Dashboard, selector de ensayos, vista Split-Screen para lecturas, Modo Práctica (con clavijero inmediato), Modo Ensayo (con cronómetro oficial), renderizador KaTeX y atajos de teclado.
- [x] **Etapa 4 (Analítica & LaTeX):** Construir vista de estadísticas locales + Exportar/Importar JSON, y generar las plantillas LaTeX (Guía 2 columnas y Beamer 16:9) en `/latex/templates/`.
- [x] **Etapa 5 (QA & Build):** Ejecutar `npm run build` y corregir cualquier error de TypeScript o estilos hasta que compile limpio.

### Fase 2
- [x] Mini-pauta en todas las preguntas oficiales y solución desplegada en revisión y práctica.
- [x] Analítica simplificada a 3 bloques (diagnóstico, cuaderno de errores con modo revancha, evolución) + Exportar/Importar.
- [x] Flashcards SM-2 solo para Biología, Física, Química e Historia (141 tarjetas).
- [x] Compendios LaTeX y presentaciones Beamer extensas (34–62 diapositivas) generados desde el temario.
- [x] Lint y build con 0 errores; verificación headless sin errores de consola. (PDF no generados: faltan `tcolorbox`/`beamer` locales.)

### Fase 3
- [x] Mini-pautas genéricas eliminadas; sin solución se muestra solo la clave limpia; las 85 curadas se conservan.
- [x] «Solución del ejercicio» específica en 973/978 preguntas de las PAES de Invierno 2026 y 2027 (subagentes Haiku por lotes + validador + KaTeX).
- [x] Identidad visual por asignatura y rediseño de Dashboard (proyección), Flashcards, Biblioteca LaTeX y Analítica (revertido en la Fase 4).
- [x] Lint y build con 0 errores; verificación headless sin errores de consola; `CLAUDE.md` y `LOG.md` actualizados.

### Fase 4
- [x] Reversión a Zinc monocromático: sin colores ni íconos por asignatura, sin degradados ni adornos; emerald/rose solo al corregir respuestas.
- [x] Datos, soluciones, LaTeX y funcionalidad (SM-2, atajos, 3 bloques de Analítica, «Solución del ejercicio») intactos.
- [x] `CLAUDE.md` con la Lista Negra estricta; lint y build con 0 errores; auditoría de color headless en claro y oscuro.

### Fase 5 (cierre)
- [x] Estética sobria Zinc conservada (sin colores ni íconos por asignatura; gráfico monocromático).
- [x] 10 PDF reales compilados (0 errores) en `public/pdfs/`, servidos con HTTP 200 y como acción principal en Material; `.tex` como enlace secundario.
- [x] Analítica con revelación progresiva (resumen + pestañas + maestro-detalle), sin perder funcionalidades.
- [x] `LICENSE` MIT 2026 y footer con autoría, licencia, correo y GitHub.
- [x] Lint y build con 0 errores; verificación headless; `CLAUDE.md` y `LOG.md` actualizados.
