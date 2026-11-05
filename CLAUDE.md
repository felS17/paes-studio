# CLAUDE.md - Guía de Arquitectura y Diseño (PAES Studio)

## Propósito del Proyecto
Plataforma web estática de estudio para la PAES (Chile) + pipeline de extracción de PDFs del DEMRE + generador de material de síntesis en LaTeX y Beamer. Enfocada en alto rendimiento visual, soporte nativo de fórmulas matemáticas y cero costo de servidor (Vercel).

## Comandos Principales
- `npm run dev`: Servidor de desarrollo Vite
- `npm run build`: Compilación estática (`tsc -b && vite build`)
- `npm run lint`: Verificación de código con ESLint
- `python3 scripts/pipeline/extract_demre.py`: Procesamiento de PDFs oficiales y facsímiles a JSON
- `npm run latex` / `npm run pdfs`: regenerar los `.tex` de compendios y presentaciones y compilarlos a `public/pdfs/` (pdfLaTeX, dos pasadas)
- `npm run validate:exams`: valida los 46 JSON (parseo, claves, `$` balanceados y KaTeX de todas las soluciones)
- `python3 scripts/pipeline/assign_subtopics.py`: asigna a cada pregunta uno de los 67 subtemas del temario y escribe `src/data/temario/`

## Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS + `shadcn/ui` (Estilo: **New York**, Color base: **Zinc**) + Lucide React
- **Matemáticas:** `katex` (renderizado rápido de bloques `$inline$` y `$$display$$`)
- **Estado:** Zustand con middleware `persist` (`localStorage` key: `paes-studio-storage`)
- **Temas:** 4 temas (`Geist Light`, `Geist Dark`, `GitHub Dark` y `Papel Cálido`) con tokens CSS bajo `[data-theme]`; ver «Temas» más abajo.

---

## Estructura y Ramificación del Proyecto
El repositorio cuenta con dos carpetas de entrada intocables con el material bruto:
- `/pruebas-oficiales/`: PDFs de las pruebas oficiales publicadas por el DEMRE.
- `/facsimiles-oficiales/`: PDFs de los facsímiles, solucionarios y clavijeros oficiales.

Tienes total libertad y mandato para crear una arquitectura modular y bien ramificada:
- `/src/types/`: Definiciones TypeScript separadas por dominio (`exam.ts`, `analytics.ts`, `user.ts`).
- `/src/data/exams/`: Catálogo e índice de ensayos procesados en formato JSON estático (`m1/`, `m2/`, `lectora/`, `ciencias/`, `historia/`).
- `/src/components/ui/`: Primitivas de interfaz reutilizables (botones, badges, modales, selectores).
- `/src/components/layout/`: App Shell (`AppShell` con la cabecera contextual, `Sidebar` colapsable a íconos y cajón móvil, `Breadcrumbs`, `nav.ts` con las 4 secciones, `ThemeToggle` con los 4 temas, `SplitPane`, `Footer`). El desplazamiento vive en `<main>`, no en la ventana; `ExamPage` va dentro del shell y el `ExamRunner` ocupa toda el área.
- `/src/components/inspector/`: Inspector contextual global (`Inspector` a la derecha en escritorio y hoja en móvil, `InspectorContent` con Resumen, Guía en PDF, Tarjetas rápidas y Formulario, cargado bajo demanda, `InspectButton`, `TheoryButton`). Se abre desde cualquier vista con `useInspectorStore`.
- `/src/components/exam/`: Motor de evaluación (`ExamRunner`, `QuestionCard`, `PassageViewer`, `QuestionNavigator`, `ExamTimer`, `SolutionAccordion`).
- `/src/components/analytics/`: Visualización de progreso (`ScoreSummary`, `AxisRadar`, `DiagnosisPanel`, `MistakeNotebook`, `BackupActions`) y telemetría (`CadenceMatrix`, `CadenceStrip`, `CadencePanel`).
- `/src/pages/`: `HomePage` (Hub en `/`: presentación, métricas, Desafío Diario, módulos, mapa de subtemas y contacto), `DashboardPage` (catálogo en `/ensayos`), `SubtopicsPage` (`/subtemas`), `ZettelkastenPage` y el resto de vistas.
- `/src/components/dashboard/`: Inicio (`DailyQuote`, `DailyChallenge`, `ActivityHeatmap`, `ProjectionChart`, `ExamList`), `TopicBrowser` (materia, buscador, filtro por estado y acordeón por eje, compartido por `/subtemas`, el Inicio y `/zettelkasten`) y `SubtopicExplorer` (sus filas con Resumen y Practicar: 10 · 20 · Todas).
- `/src/components/cheatsheets/` + `src/data/cheatsheets.ts`: Formulario Express en `/material?vista=formulario` y en el Inspector. Cada tarjeta declara sus `subtopics`, para que el Inspector muestre solo las del tema abierto.
- `/src/components/zettelkasten/`: Red de conocimiento (`KnowledgeGraph` en Canvas con `react-force-graph-2d`, `NodeDrawer`).
- `/src/data/temario/` + `src/data/temario.ts`: temario DEMRE (asignatura → eje → 67 subtemas, página en el compendio PDF, notas teóricas bajo demanda y enlaces cruzados del Zettelkasten).
- `/src/components/math/`: Renderizador `MathText` para texto híbrido Markdown + LaTeX.
- `/src/hooks/`: Hooks personalizados (`useKeyboardShortcuts`, `useExamTimer`, `useQuestionClock`, `useWorkspace`, `useStorageUsage`, `useSubtopicNotes`, `useTheme`).
- `/src/store/`: Stores de Zustand (`useExamStore.ts` con sesiones, prácticas, alternativas tachadas y racha de aciertos; `useAnalyticsStore.ts`; `useFlashcardStore.ts`; `useStreakStore.ts` con los días de estudio de la racha; `useInspectorStore.ts` y `useWorkspaceStore.ts`, sin persistencia).
- `/src/utils/`: Cálculo de puntajes escala PAES (100-1000), formateadores, validadores, `activity.ts` (heatmap), `topicSearch.ts` (búsqueda sin tildes) y `telemetry.ts` (umbrales, 4 perfiles de respuesta y balance de cambios de alternativa). La telemetría de un intento se lee siempre con `readTelemetry`: los intentos anteriores a la v2.1 no la traen.
- `/scripts/pipeline/`: Scripts en Python para extracción de texto/imágenes desde `/pruebas-oficiales` y cruce con `/facsimiles-oficiales`.
- `/latex/templates/` y `/latex/output/`: Plantillas `.tex` de guías (`tcolorbox`) y presentaciones Beamer (`16:9`). `/latex/compat/` guarda sustitutos mínimos (`tikzfill.image`, `pdfcol`, `listingsutf8`) que `build_pdfs.py` usa solo si faltan en el TeX Live local.
- `/public/pdfs/`: los 10 PDF compilados que sirve la vista de Material (metadatos en `src/data/pdfs.json`).
- `LICENSE` (MIT 2026, felS) y `src/components/layout/Footer.tsx` (autoría, licencia y contacto) al pie de todas las vistas con layout.

---

## Voz y textos de la interfaz
La app le habla a un estudiante, no a un programador: cercana, motivadora, en tú y en español de Chile, con verbos que invitan a practicar.
- **Cero jerga visible:** nada de KaTeX, LaTeX, SM-2, localStorage, navegador, clavijero, grafo, nodo, banco, compendio, drill (salvo en la tarjeta «Drills rápidos» del Inicio), Inspector, respaldo, importar o exportar. Se dice «explicación paso a paso», «tarjetas inteligentes», «respuesta oficial», «mapa», «guía», «resumen del tema» y «descargar o subir tu progreso».
- **Código abierto y MIT:** solo como detalle pequeño en el pie de página.
- **Transparencia:** las explicaciones redactadas con IA siguen indicándolo, en lenguaje simple.
- **Citas del Inicio:** viven en `src/data/quotes.ts`: 30 citas reales con autor y obra de origen, que rotan una por día y con «Otra cita». Antes de agregar una, comprueba su fuente: abundan las frases famosas mal atribuidas.

---

## Directrices UI/UX: Uso de la Skill `frontend-design` (Anthropic Oficial)

**REGLA CRÍTICA:** Invoca y aplica la skill oficial **`frontend-design`** en toda la interfaz bajo estas reglas estrictas de herramienta de precisión y lectura editorial:

### 1. Dirección Estética y Lista Negra
- **Inspiración:** Linear, Vercel Geist y Readwise Reader. Interfaz sobria y técnica; monocromática (Zinc) en los temas Geist.
- **Lista Negra: Prohibido usar colores por asignatura, gradientes o íconos decorativos.**
  - Nada de acentos de color por asignatura (indigo, violet, amber, sky, etc.), ni íconos de asignatura, ni portadas, barras o tarjetas multicolor. Las asignaturas, ejes y estados se identifican con texto: etiquetas neutras `Tag` / `SubjectTag` / `SubjectMono` (`src/components/ui/subject-tag.tsx`) con `bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80`.
  - PROHIBIDO `bg-blue-*` / `bg-indigo-*` y cualquier color de interfaz que no sea Zinc o un token de tema (GitHub Dark y Papel Cálido cambian de color redefiniendo esos tokens, nunca con clases propias), gradientes (`bg-gradient-to-*`, `linearGradient` en SVG), sombras pesadas (`shadow-lg`, `shadow-xl`) y bordes redondeados exagerados (`rounded-2xl`, `rounded-3xl`). Usa `rounded-lg` o `rounded-xl` y bordes finos de `1px`.
  - Los íconos de Lucide solo se usan con función (navegación, tema, cerrar, flechas, marcar duda, correcto/incorrecto, enlace externo), nunca como adorno.
- **Únicos colores semánticos permitidos:** `emerald` sutil para respuestas correctas y `rose` sutil para respuestas incorrectas al corregir una pregunta (alternativas, hoja de respuestas, revisión, resultado del Desafío Diario y nodos de pregunta del Zettelkasten, con leyenda), siempre con ícono o texto. En el grafo, el dominio de un subtema se expresa solo con contraste zinc (tenue → medio → alto) y los errores pendientes con un anillo punteado. `amber` sutil se permite solo en las marcas de la telemetría de ritmo (`Cadence*`), para lo lento y los cambios de alternativa. En la telemetría, emerald y rose nunca van solos porque se confunden con daltonismo (ΔE 5,6 con deuteranopia): llevan posición fija, separación y cifra propia; en los tramos contiguos se usa `emerald-400`/`rose-700` (claro) y `emerald-300`/`rose-600` (oscuro) para que difieran en luminosidad. Todo lo demás (alertas del reloj, marcas de duda, prioridades de la analítica, mensajes de respaldo, calificación de flashcards) va en escala Zinc.
- **Gráficos:** trazo monocromático `zinc-900` / `zinc-100` (`currentColor`), sin rellenos ni degradados; barras de progreso en `bg-progress` sobre `zinc-200`.

### 2. Temas, paleta y superficies
El sistema tiene **4 temas**: `Geist Light` (`geist-light`), `Geist Dark` (`geist-dark`), `GitHub Dark` (`github-dark`) y `Papel Cálido` (`paper`), más la opción de seguir al dispositivo. `useTheme` pone `data-theme` en `<html>` y la clase `dark` solo en los temas oscuros; la preferencia se guarda en `settings.theme` y el script de `index.html` la aplica antes de pintar. `Papel Cálido` usa la paleta clara y `GitHub Dark` la oscura.
- **Cómo funciona:** `src/styles/index.css` define por tema los tokens `--canvas`, `--surface`, `--accent`, `--progress` y `--heat-0` a `--heat-4`, y en GitHub Dark y Papel Cálido redefine las escalas de Tailwind (`--color-zinc-*`, y en GitHub también `emerald`, `rose` y `amber`). Así las clases `zinc` existentes siguen al tema sin tocar los componentes.
- **Regla al escribir UI:** nunca uses hexadecimales de superficie. Usa `bg-canvas`, `bg-surface`, `bg-progress` y `accent` (`border-accent`, `ring-accent`, `text-accent`); el texto y los bordes siguen en clases `zinc` con su variante `dark:`.
- **Canvas del grafo:** no puede leer clases de Tailwind; toma sus colores de `graph` en `src/data/themes.ts`, que también guarda el fondo y el acento de cada tema para el selector.
- **Canvas Principal:** `bg-canvas` (`#FAFAFA`, `#09090B`, `#0D1117` o `#F6F1E7`)
- **Superficie de Paneles / Tarjetas:** `bg-surface` (`#FFFFFF`, `#121215`, `#161B22` o `#EFE8D8`)
- **Bordes Estructurales (Hairlines):** `border border-zinc-200/80 dark:border-zinc-800/80`
- **Texto Primario:** `text-zinc-900 dark:text-zinc-100`
- **Texto Secundario / Metadatos:** `text-zinc-500 dark:text-zinc-400`
- **Acción Primaria:** `bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`

### 3. Tipografía y Atajos
- **UI:** `Geist` o `Inter` (`tracking-tight` en títulos).
- **Lecturas Largas:** `Newsreader` o `Source Serif 4`, `text-[16px] leading-[1.75] max-w-[65ch]`, con botón para alternar Serif/Sans.
- **Reloj, Puntajes y `<kbd>`:** `JetBrains Mono` con `font-mono tabular-nums`.
- **Atajos de teclado activos:** `A`-`E` para responder, `Shift + A`-`E` (o clic derecho) para tachar/recuperar una alternativa, `←`/`→` para navegar, `F` para marcar duda, `Enter` para verificar en Modo Práctica, `Cmd/Ctrl + B` para colapsar la barra lateral, `Esc` para cerrar el Inspector. Sin temporizador visible por pregunta: solo el cronómetro global (el tiempo por pregunta se mide en silencio y se muestra al terminar).

### 4. Anatomía de las Alternativas (A - E)
- **Base:** `group flex w-full items-start gap-3.5 rounded-lg border border-zinc-200/90 bg-surface p-3.5 text-left transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50`
- **Badge `<kbd>`:** `flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400`
- **Seleccionada:** `border-accent bg-accent/[0.04] ring-1 ring-accent`
- **Correcta (Modo Práctica):** `border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-950 dark:text-emerald-100`
- **Incorrecta (Modo Práctica):** `border-rose-500/40 bg-rose-500/[0.06] text-rose-950 dark:text-rose-100`
- **Tachada (descartada):** `line-through opacity-35`; no se marca con la tecla de su letra, solo al recuperarla o con clic izquierdo explícito.

### 5. Arquitectura de información
- **Revelación progresiva:** las vistas densas muestran primero un resumen y luego una sola sección a la vez (pestañas `Tabs` de `src/components/ui/tabs.tsx`, con la pestaña activa en la URL, p. ej. `/analitica?vista=errores`). Los listados largos usan maestro-detalle en escritorio y acordeón en móvil.
- **Íconos en llamados a la acción:** el botón «Entrenar 10 preguntas rápidas ahora» lleva `Zap` y «Ver resumen de este tema» lleva `BookOpen`, ambos de Lucide y monocromos, en vez de emoji con color.
- **Temas de estudio:** `TopicBrowser` agrupa por eje en acordeones (parte con uno abierto; al filtrar se abren los que tienen resultados). Un tema está dominado con 75 % o más y al menos 3 preguntas, en todas las vistas (`MASTERY_ACCURACY`).
- **Espacio de trabajo:** barra lateral con 4 secciones: Hoy (Inicio, Racha de estudio, Desafío del Día), Práctica (Ensayos Completos, Practicar por Tema, Flashcards), Apuntes y Red (Mapa de Conocimiento, Guías y Resúmenes PDF) y Tu Avance (Estadísticas y Errores). Las rutas y los nombres internos (`/zettelkasten`, `/material`, `/analitica`, `ZettelkastenPage`, `Inspector`) no cambian. En ensayo cronometrado la barra parte oculta (Modo Zen) y el Inspector queda bloqueado hasta entregar. El ancho disponible del `ExamRunner` se mide en el propio componente, no en la ventana, porque depende de la barra y del Inspector.
- **Material:** el PDF compilado es la acción principal («Abrir PDF», «Descargar»); el `.tex`, Overleaf y el código quedan como enlaces secundarios en texto.
