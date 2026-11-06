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
- **Temas:** 10 paletas con tokens CSS bajo `[data-theme]` y 5 tipografías de interfaz bajo `[data-font]`; ver «Temas» más abajo.

---

## Estructura y Ramificación del Proyecto
El repositorio cuenta con dos carpetas de entrada intocables con el material bruto:
- `/pruebas-oficiales/`: PDFs de las pruebas oficiales publicadas por el DEMRE.
- `/facsimiles-oficiales/`: PDFs de los facsímiles, solucionarios y clavijeros oficiales.

Tienes total libertad y mandato para crear una arquitectura modular y bien ramificada:
- `/src/types/`: Definiciones TypeScript separadas por dominio (`exam.ts`, `analytics.ts`, `user.ts`).
- `/src/data/exams/`: Catálogo e índice de ensayos procesados en formato JSON estático (`m1/`, `m2/`, `lectora/`, `ciencias/`, `historia/`).
- `/src/components/ui/`: Primitivas de interfaz reutilizables (botones, badges, modales, selectores, `LoadBar`).
- `/src/components/layout/`: App Shell (`AppShell` con la cabecera contextual, `Sidebar` como barra de tareas, colapsable a íconos y con cajón móvil, `Breadcrumbs` + `crumbs.ts`, `nav.ts` con las 7 aplicaciones, `ThemeToggle` que abre el selector, `AppearanceDialog` con los 10 temas y las 5 tipografías, `StatusBar` de 24px, `SplitPane`, `Footer` con `ContactLine`). El desplazamiento vive en `<main>`, no en la ventana; `ExamPage` va dentro del shell y el `ExamRunner` ocupa toda el área.
- `/src/components/inspector/`: Inspector contextual global (`Inspector` a la derecha en escritorio y hoja en móvil, `InspectorContent` con Resumen, Guía en PDF, Tarjetas rápidas y Formulario, cargado bajo demanda, `TheoryButton`). Se abre desde cualquier vista con `useInspectorStore`.
- `/src/components/exam/`: Motor de evaluación (`ExamRunner`, `QuestionCard`, `PassageViewer`, `QuestionNavigator`, `ExamTimer`, `SolutionAccordion`).
- `/src/components/analytics/`: Administrador de tareas (`ProcessTable`, `TelemetryCounters`, `MistakeNotebook`, `BackupActions`) y vistas de resultados (`AxisRadar`, `ScoreRuler`, `CadenceMatrix`, `CadenceStrip`).
- `/src/components/icons/PixelIcon.tsx`: íconos Pixel Art en grilla de 16 × 16 (`<rect>` + `shape-rendering="crispEdges"`), monocromos con `currentColor`.
- `/src/pages/`: `HomePage` (`/`: una ventana de terminal, heatmap del mismo ancho y línea de contacto), `DashboardPage` (catálogo en `/ensayos`), `SubtopicsPage` (`/subtemas`), `ZettelkastenPage` y el resto de vistas.
- `/src/components/dashboard/`: Inicio (`AnimfetchHero` con `NebulaCanvas`, `DailyQuote` y `HubShell`, cuyo menú `/` sale de `hubCommands.ts`; `ActivityHeatmap`), `ExamList`, `TopicBrowser` (materia, buscador y acordeón por eje, compartido por `/subtemas` y `/zettelkasten`), `SubtopicExplorer` (filas de una línea: el nombre abre el resumen, donde se elige 10, 20 o todas; `practicar` parte con 10) y `Accuracy`.
- `/src/components/cheatsheets/` + `src/data/cheatsheets.ts`: Formulario Express en `/material?vista=formulario` y en el Inspector. Cada tarjeta declara sus `subtopics`, para que el Inspector muestre solo las del tema abierto.
- `/src/components/zettelkasten/`: Red de conocimiento (`KnowledgeGraph` en Canvas con `react-force-graph-2d`, `NodeDrawer`).
- `src/data/themes.ts` y `src/data/fonts.ts`: datos de los 10 temas y las 5 tipografías de interfaz.
- `/src/data/temario/` + `src/data/temario.ts`: temario DEMRE (asignatura → eje → 67 subtemas, página en el compendio PDF, notas teóricas bajo demanda y enlaces cruzados del Zettelkasten).
- `/src/components/math/`: Renderizador `MathText` para texto híbrido Markdown + LaTeX.
- `/src/hooks/`: Hooks personalizados (`useKeyboardShortcuts`, `useExamTimer`, `useQuestionClock`, `useWorkspace`, `useSubtopicNotes`, `useTheme`, `useUiFont`, `useDailyAction`, `useStreak`).
- `/src/store/`: Stores de Zustand (`useExamStore.ts` con sesiones, prácticas, alternativas tachadas y racha de aciertos; `useAnalyticsStore.ts`; `useFlashcardStore.ts`; `useStreakStore.ts` con los días de estudio de la racha; `useInspectorStore.ts` y `useWorkspaceStore.ts`, sin persistencia).
- `/src/utils/`: Cálculo de puntajes escala PAES (100-1000), formateadores, validadores, `activity.ts` (heatmap), `topicSearch.ts` (búsqueda sin tildes), `nebula.ts` (motor de la nebulosa del Hero, con el campo separado del dibujo), `dateKey.ts` (claves de fecha, sin importar nada: `data/catalog` importa `useExamStore`, así que ese store no puede importar `utils/daily`) y `telemetry.ts` (umbrales, 4 perfiles de respuesta y balance de cambios de alternativa). La telemetría de un intento se lee siempre con `readTelemetry`: los intentos anteriores a la v2.1 no la traen.
- `/scripts/pipeline/`: Scripts en Python para extracción de texto/imágenes desde `/pruebas-oficiales` y cruce con `/facsimiles-oficiales`.
- `/latex/templates/` y `/latex/output/`: Plantillas `.tex` de guías (`tcolorbox`) y presentaciones Beamer (`16:9`). `/latex/compat/` guarda sustitutos mínimos (`tikzfill.image`, `pdfcol`, `listingsutf8`) que `build_pdfs.py` usa solo si faltan en el TeX Live local.
- `/public/pdfs/`: los 10 PDF compilados que sirve la vista de Material (metadatos en `src/data/pdfs.json`).
- `LICENSE` (MIT 2026, felS) y `src/components/layout/Footer.tsx` (autoría, licencia y contacto) al pie de todas las vistas con layout.

---

## Voz y textos de la interfaz
La app le habla a un estudiante, no a un programador: cercana, motivadora, en tú y en español de Chile, con verbos que invitan a practicar.
- **Cero jerga visible:** nada de KaTeX, LaTeX, SM-2, localStorage, navegador, clavijero, grafo, nodo, banco, compendio, drill (salvo en la tarjeta «Drills rápidos» del Inicio), Inspector, respaldo, importar o exportar. Se dice «explicación paso a paso», «tarjetas inteligentes», «respuesta oficial», «mapa», «guía», «resumen del tema» y «descargar o subir tu progreso».
- **Minúsculas y nombres cortos (v2.4):** toda la interfaz va en minúsculas (`body` lleva `text-transform: lowercase` y los controles lo heredan) y con nombres cortos: `inicio`, `ensayos`, `temas`, `flashcards`, `mapa`, `guías`, `stats`, `practicar`, `resumen`, `apariencia`, `retomar`. Escribe los textos nuevos ya en minúsculas.
- **Excepción de las minúsculas:** lo académico conserva su escritura normal: `.mt-prose` (`MathText`), `.katex`, `QuestionCard`, el texto y título de las lecturas, las letras A-E y las citas. `pre`, `code` y `kbd` tampoco cambian. Lo que deba conservarse fuera de eso lleva `normal-case` (p. ej. `felS`). `Button` va siempre en minúsculas, también dentro de una pregunta, así que no le pongas fórmulas ni texto académico. Nunca agregues texto con fórmulas sin `MathText`: la minúscula convertiría Δ en δ.
- **Vocabulario de sistema operativo:** en `stats` (Administrador de Tareas) y en la ventana del Inicio se admiten `procesos`, `telemetría`, `sistema`, `exportar datos`, `importar datos`, `flashcards` y el prompt `~/paes-studio ❯`. El resto de la app sigue sin jerga.
- **Código abierto y MIT:** solo como detalle pequeño en el pie de página.
- **Transparencia:** las explicaciones redactadas con IA siguen indicándolo, en lenguaje simple.
- **Citas del Inicio:** viven en `src/data/quotes.ts`: 30 citas reales con autor y obra de origen, que rotan una por día y con «Otra cita». Antes de agregar una, comprueba su fuente: abundan las frases famosas mal atribuidas.

---

## Directrices UI/UX: Uso de la Skill `frontend-design` (Anthropic Oficial)

**REGLA CRÍTICA:** Invoca y aplica la skill oficial **`frontend-design`** en toda la interfaz bajo estas reglas estrictas de herramienta de precisión y lectura editorial:

### 0. Regla de Oro: escritorio simple, respirable y silencioso
La app se ve como el escritorio limpio de un sistema operativo ligero. Si una vista se siente saturada, se le quita algo.
- **Nunca obliga a usar una terminal:** el prompt del Inicio es opcional; toda acción se puede hacer con un clic normal.
- **Prohibido el párrafo de introducción o de instrucciones** bajo un título: se entra directo a la lista o a los controles. Lo que haga falta explicar va en una definición de pocas palabras o en un `title`.
- **Máximo 3 datos por fila o tarjeta**, en una sola línea en escritorio (en móvil, el nombre puede ocupar dos para seguir siendo legible).
- **Nada de cajas dentro de cajas:** los listados se separan con líneas finas (`divide-y`, `border-y`), sin tarjeta alrededor. Solo van en caja la ventana y el heatmap del Inicio, los medidores de `stats`, el mapa y los diálogos.
- **Una sola sección a la vez:** lo secundario va en pestañas o en un desplegable cerrado (`<details>`).
- **Dentro de un ensayo** las preguntas, lecturas y fórmulas siguen cómodas y con su escritura académica.

### 1. Dirección Estética y Lista Negra
- **Inspiración:** Linear, Vercel Geist y Readwise Reader. Interfaz sobria y técnica; monocromática (Zinc) en los temas Geist.
- **Lista Negra: Prohibido usar colores por asignatura, gradientes o íconos decorativos.**
  - Nada de acentos de color por asignatura (indigo, violet, amber, sky, etc.), ni íconos de asignatura, ni portadas, barras o tarjetas multicolor. Las asignaturas, ejes y estados se identifican con texto: etiquetas neutras `Tag` / `SubjectTag` (`src/components/ui/subject-tag.tsx`) con `bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80`.
  - PROHIBIDO `bg-blue-*` / `bg-indigo-*` y cualquier color de interfaz que no sea Zinc o un token de tema (GitHub Dark y Papel Cálido cambian de color redefiniendo esos tokens, nunca con clases propias), gradientes (`bg-gradient-to-*`, `linearGradient` en SVG), sombras pesadas (`shadow-lg`, `shadow-xl`) y bordes redondeados exagerados (`rounded-2xl`, `rounded-3xl`). Usa `rounded-lg` o `rounded-xl` y bordes finos de `1px`.
  - **Íconos Pixel Art:** la barra de tareas, el Inicio, los comandos y la barra de estado usan `PixelIcon`, siempre a 16 px o múltiplos para que queden nítidos. En el resto se admite Lucide (marcar duda, correcto/incorrecto, flechas), siempre con función y nunca como adorno.
- **Excepción acotada de la Lista Negra:** la nebulosa del Hero (`NebulaCanvas`) es el único lugar con gradiente, y sale siempre de los colores del tema activo (`accent2` → `accent` → `text`). Las muestras de color (`█` del Inicio y `ThemePreview`) pintan con los colores de `themes.ts` porque su función es mostrar la paleta. La barrita del ítem activo de la barra de tareas lleva un brillo de 6 px en `accent`, y es la única sombra de color.
- **Únicos colores semánticos permitidos:** `emerald` sutil para respuestas correctas y `rose` sutil para respuestas incorrectas al corregir una pregunta (alternativas, hoja de respuestas, revisión, resultado del Desafío Diario y nodos de pregunta del Zettelkasten, con leyenda), siempre con ícono o texto. En el grafo, el dominio de un subtema se expresa solo con contraste zinc (tenue → medio → alto) y los errores pendientes con un anillo punteado. `amber` sutil se permite solo en las marcas de la telemetría de ritmo (`Cadence*`), para lo lento y los cambios de alternativa. En la telemetría, emerald y rose nunca van solos porque se confunden con daltonismo (ΔE 5,6 con deuteranopia): llevan posición fija, separación y cifra propia; en los tramos contiguos se usa `emerald-400`/`rose-700` (claro) y `emerald-300`/`rose-600` (oscuro) para que difieran en luminosidad. Todo lo demás (alertas del reloj, marcas de duda, prioridades de la analítica, mensajes de respaldo, calificación de flashcards) va en escala Zinc.
- **Gráficos:** trazo monocromático `zinc-900` / `zinc-100` (`currentColor`), sin rellenos ni degradados; barras de progreso en `bg-progress` sobre `zinc-200`, por segmentos (`LoadBar`) en `stats`, flashcards y medidores.

### 2. Temas, paleta y superficies
El sistema tiene **10 temas**, en este orden: `GitHub Dark` (`github-dark`), `Catppuccin Mocha` (`catppuccin-mocha`), `Tokyo Night` (`tokyo-night`), `Gruvbox Dark` (`gruvbox-dark`), `Nord` (`nord`), `Rosé Pine` (`rose-pine`), `Dracula` (`dracula`), `Geist Dark` (`geist-dark`), `Geist Light` (`geist-light`) y `Papel Cálido` (`paper`), más la opción de seguir al dispositivo (con los dos Geist). `useTheme` pone `data-theme` en `<html>` y la clase `dark` en todos salvo `Geist Light` y `Papel Cálido`; la preferencia se guarda en `settings.theme` y el script de `index.html` la aplica antes de pintar, así que **un tema nuevo se agrega en `index.css`, `themes.ts`, `ThemeId` y ese script**. Se eligen en `AppearanceDialog`, que abren la barra de tareas, la ventana del Inicio y la `StatusBar`.
- **Cómo funciona:** `src/styles/index.css` define por tema los tokens `--canvas`, `--surface`, `--accent`, `--progress` y `--heat-0` a `--heat-4`, y fuera de los Geist redefine las escalas de Tailwind (`--color-zinc-*`, y en las paletas de editor también `emerald`, `rose` y `amber`; Rosé Pine no tiene verde y usa su espuma para lo correcto). Así las clases `zinc` existentes siguen al tema sin tocar los componentes.
- **Regla al escribir UI:** nunca uses hexadecimales de superficie. Usa `bg-canvas`, `bg-surface`, `bg-progress` y `accent` (`border-accent`, `ring-accent`, `text-accent`); el texto y los bordes siguen en clases `zinc` con su variante `dark:`.
- **Canvas del grafo y de la nebulosa:** no pueden leer clases de Tailwind; toman sus colores de `src/data/themes.ts` (`graph`, `accent`, `accent2`, `text`), que también guarda los colores de cada tema para el selector.
- **Canvas Principal:** `bg-canvas` (el hexadecimal de cada tema está en `themes.ts`)
- **Superficie de Paneles / Tarjetas:** `bg-surface`
- **Bordes Estructurales (Hairlines):** `border border-zinc-200/80 dark:border-zinc-800/80`
- **Texto Primario:** `text-zinc-900 dark:text-zinc-100`
- **Texto Secundario / Metadatos:** `text-zinc-500 dark:text-zinc-400`
- **Acción Primaria:** `bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`

### 3. Tipografía y Atajos
- **UI:** `Geist` por defecto (`tracking-tight` en títulos). En `AppearanceDialog` se puede cambiar a `Space Grotesk`, `JetBrains Mono`, `Fira Code` o `IBM Plex Mono` (`settings.uiFont`, `data-font` en `<html>`). Space Grotesk, Fira Code e IBM Plex Mono vienen de Google Fonts (`index.html`, sin bloquear el pintado); Geist, JetBrains Mono y Newsreader siguen self-hosted y van primero.
- **Aislamiento del `ExamRunner`:** con un `ExamRunner` en pantalla, `useUiFont` deja siempre `geist`. Se hace en `<html>` y no con un contenedor porque los diálogos del ensayo viven en un portal. No apliques `settings.uiFont` por otra vía.
- **Lecturas Largas:** `text-[16px] leading-[1.75] max-w-[65ch]`. Parten en Geist Sans, la letra normal de examen; el botón `serif/sans` ofrece `Newsreader` a quien lo elija.
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
- **Barra de tareas (`Sidebar`):** lista plana de 7 aplicaciones (`inicio`, `ensayos`, `temas`, `flashcards`, `mapa`, `guías`, `stats`) con `PixelIcon`, etiqueta en mono y una barrita luminosa en la activa. Abajo, la bandeja: `retomar` (solo si hay algo en curso; lleva a lo más reciente), `apariencia` y `racha`. Las rutas y los nombres internos (`/zettelkasten`, `/material`, `/analitica`, `ZettelkastenPage`, `Inspector`) no cambian. En ensayo cronometrado la barra parte oculta (Modo Zen) y el Inspector queda bloqueado hasta entregar. El ancho disponible del `ExamRunner` se mide en el propio componente, no en la ventana, porque depende de la barra y del Inspector.
- **Inicio (`/`):** ventana de `max-w-6xl` (nebulosa, 5 datos, cita breve, 7 comandos de un clic con su descripción tenue y el prompt), heatmap del mismo ancho y `ContactLine`. No lleva `Footer` ni cabecera en escritorio. El Desafío del Día no tiene bloque: se abre con `/daily`. La nebulosa parte detenida con movimiento reducido y se detiene sola fuera de pantalla. El `@container` de la ventana decide sus columnas; no le pongas `overflow-hidden`, porque recortaría el menú flotante.
- **Prompt (`HubShell`):** menú `/` navegable con `↑`/`↓`, `Enter`, `Tab` para completar y `Esc`, o con el mouse. Se abre al escribir `/` o `help` y con el chip `[ / comandos ]`. Con el campo vacío, `Enter` lanza 10 rápidas. Un comando nuevo se agrega en `hubCommands.ts`.
- **Racha:** cualquier práctica suma el día (`isActiveDay`): responder una pregunta en un ensayo o práctica, aunque quede sin terminar (`markPractice` en `select`), el Desafío Diario o las flashcards. Léela siempre con `useStreak`, que también cuenta los intentos guardados e importados.
- **Heatmap:** `ActivityHeatmap` muestra 52 semanas con cuadritos fluidos que llenan el ancho; en pantallas angostas muestra menos semanas en vez de achicarlos bajo 9 px.
- **Stats (`/analitica`) como Administrador de Tareas:** 4 medidores (`acierto global`, `ensayos completados`, `errores en cola` con `limpiar errores`, `ritmo promedio`) y 4 pestañas con la activa en la URL (`procesos`, `telemetria`, `errores`, `sistema`). `ProcessTable` es un árbol materia → eje, ordenable y con `entrenar` en cada fila. Estado de un proceso (`processState`): `dominado` con 75 % o más y al menos 3 preguntas, `crítico` bajo 50 %, `estable` lo demás, `sin datos`.
- **Revelación progresiva:** las vistas densas muestran una sola sección a la vez (pestañas `Tabs` de `src/components/ui/tabs.tsx`). Los listados largos abren el detalle en la misma fila.
- **Cabecera contextual:** en escritorio `StageHeader` solo aparece si entraste a algo (migas de dos niveles) o hay un resumen abierto.
- **Temas de estudio:** `TopicBrowser` agrupa por eje en acordeones (parte con uno abierto; al buscar se abren los que tienen resultados). Un tema está dominado con 75 % o más y al menos 3 preguntas, en todas las vistas (`MASTERY_ACCURACY`).
- **Ensayos:** cada fila muestra el nombre, un dato (`en curso`, tu último puntaje, o preguntas y tiempo) y `práctica` / `iniciar`.
- **Mapa:** el grafo ocupa casi toda la pantalla; la leyenda y la lista de temas van en desplegables cerrados.
- **Guías:** pestañas `resúmenes pdf` y `formulario express`. El PDF compilado es la acción principal (`abrir`, `descargar`); el `.tex` y Overleaf quedan tras un enlace mínimo `tex`, y las plantillas en el desplegable `formatos base`.
- **Barra de estado:** `StatusBar` de 24px al pie del layout, con racha, tema y fuente a un clic; oculta durante un `ExamRunner`.
