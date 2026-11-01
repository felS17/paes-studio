# CLAUDE.md - Guía de Arquitectura y Diseño (PAES Studio)

## Propósito del Proyecto
Plataforma web estática de estudio para la PAES (Chile) + pipeline de extracción de PDFs del DEMRE + generador de material de síntesis en LaTeX y Beamer. Enfocada en alto rendimiento visual, soporte nativo de fórmulas matemáticas y cero costo de servidor (Vercel).

## Comandos Principales
- `npm run dev`: Servidor de desarrollo Vite
- `npm run build`: Compilación estática (`tsc -b && vite build`)
- `npm run lint`: Verificación de código con ESLint
- `python3 scripts/pipeline/extract_demre.py`: Procesamiento de PDFs oficiales y facsímiles a JSON
- `npm run latex` / `npm run pdfs`: regenerar los `.tex` de compendios y presentaciones y compilarlos a `public/pdfs/` (pdfLaTeX, dos pasadas)

## Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS + `shadcn/ui` (Estilo: **New York**, Color base: **Zinc**) + Lucide React
- **Matemáticas:** `katex` (renderizado rápido de bloques `$inline$` y `$$display$$`)
- **Estado:** Zustand con middleware `persist` (`localStorage` key: `paes-studio-storage`)

---

## Estructura y Ramificación del Proyecto
El repositorio cuenta con dos carpetas de entrada intocables con el material bruto:
- `/pruebas-oficiales/`: PDFs de las pruebas oficiales publicadas por el DEMRE.
- `/facsimiles-oficiales/`: PDFs de los facsímiles, solucionarios y clavijeros oficiales.

Tienes total libertad y mandato para crear una arquitectura modular y bien ramificada:
- `/src/types/`: Definiciones TypeScript separadas por dominio (`exam.ts`, `analytics.ts`, `user.ts`).
- `/src/data/exams/`: Catálogo e índice de ensayos procesados en formato JSON estático (`m1/`, `m2/`, `lectora/`, `ciencias/`, `historia/`).
- `/src/components/ui/`: Primitivas de interfaz reutilizables (botones, badges, modales, selectores).
- `/src/components/layout/`: Estructura global (`Navbar`, `Sidebar`, `ThemeToggle`, `SplitPane`).
- `/src/components/exam/`: Motor de evaluación (`ExamRunner`, `QuestionCard`, `PassageViewer`, `QuestionNavigator`, `ExamTimer`, `SolutionAccordion`).
- `/src/components/analytics/`: Visualización de progreso (`ScoreHistory`, `AxisRadar`, `WeakTopicsList`, `BackupManager`).
- `/src/components/math/`: Renderizador `MathText` para texto híbrido Markdown + LaTeX.
- `/src/hooks/`: Hooks personalizados (`useKeyboardShortcuts`, `useExamTimer`, `useTheme`).
- `/src/store/`: Stores de Zustand (`useExamStore.ts`, `useAnalyticsStore.ts`).
- `/src/utils/`: Cálculo de puntajes escala PAES (100-1000), formateadores y validadores.
- `/scripts/pipeline/`: Scripts en Python para extracción de texto/imágenes desde `/pruebas-oficiales` y cruce con `/facsimiles-oficiales`.
- `/latex/templates/` y `/latex/output/`: Plantillas `.tex` de guías (`tcolorbox`) y presentaciones Beamer (`16:9`). `/latex/compat/` guarda sustitutos mínimos (`tikzfill.image`, `pdfcol`, `listingsutf8`) que `build_pdfs.py` usa solo si faltan en el TeX Live local.
- `/public/pdfs/`: los 10 PDF compilados que sirve la vista de Material (metadatos en `src/data/pdfs.json`).
- `LICENSE` (MIT 2026, felS) y `src/components/layout/Footer.tsx` (autoría, licencia y contacto) al pie de todas las vistas con layout.

---

## Directrices UI/UX: Uso de la Skill `frontend-design` (Anthropic Oficial)

**REGLA CRÍTICA:** Invoca y aplica la skill oficial **`frontend-design`** en toda la interfaz bajo estas reglas estrictas de herramienta de precisión y lectura editorial:

### 1. Dirección Estética y Lista Negra
- **Inspiración:** Linear, Vercel Geist y Readwise Reader. Interfaz sobria, técnica y monocromática (Zinc).
- **Lista Negra: Prohibido usar colores por asignatura, gradientes o íconos decorativos.**
  - Nada de acentos de color por asignatura (indigo, violet, amber, sky, etc.), ni íconos de asignatura, ni portadas, barras o tarjetas multicolor. Las asignaturas, ejes y estados se identifican con texto: etiquetas neutras `Tag` / `SubjectTag` / `SubjectMono` (`src/components/ui/subject-tag.tsx`) con `bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80`.
  - PROHIBIDO `bg-blue-*` / `bg-indigo-*` y cualquier color de interfaz que no sea Zinc, gradientes (`bg-gradient-to-*`, `linearGradient` en SVG), sombras pesadas (`shadow-lg`, `shadow-xl`) y bordes redondeados exagerados (`rounded-2xl`, `rounded-3xl`). Usa `rounded-lg` o `rounded-xl` y bordes finos de `1px`.
  - Los íconos de Lucide solo se usan con función (navegación, tema, cerrar, flechas, marcar duda, correcto/incorrecto, enlace externo), nunca como adorno.
- **Únicos colores semánticos permitidos:** `emerald` sutil para respuestas correctas y `rose` sutil para respuestas incorrectas al corregir una pregunta (alternativas, hoja de respuestas y revisión), siempre con ícono o texto. Todo lo demás (alertas del reloj, marcas de duda, prioridades de la analítica, mensajes de respaldo, calificación de flashcards) va en escala Zinc.
- **Gráficos:** trazo monocromático `zinc-900` / `zinc-100` (`currentColor`), sin rellenos ni degradados; barras de progreso en `zinc-900` / `zinc-100` sobre `zinc-200`.

### 2. Paleta y Superficies (Light & Dark Mode)
- **Canvas Principal:** `bg-[#FAFAFA] dark:bg-[#09090B]`
- **Superficie de Paneles / Tarjetas:** `bg-white dark:bg-[#121215]`
- **Bordes Estructurales (Hairlines):** `border border-zinc-200/80 dark:border-zinc-800/80`
- **Texto Primario:** `text-zinc-900 dark:text-zinc-100`
- **Texto Secundario / Metadatos:** `text-zinc-500 dark:text-zinc-400`
- **Acción Primaria:** `bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`

### 3. Tipografía y Atajos
- **UI:** `Geist` o `Inter` (`tracking-tight` en títulos).
- **Lecturas Largas:** `Newsreader` o `Source Serif 4`, `text-[16px] leading-[1.75] max-w-[65ch]`, con botón para alternar Serif/Sans.
- **Reloj, Puntajes y `<kbd>`:** `JetBrains Mono` con `font-mono tabular-nums`.
- **Atajos de teclado activos:** `A`-`E` para responder, `←`/`→` para navegar, `F` para marcar duda, `Enter` para verificar en Modo Práctica.

### 4. Anatomía de las Alternativas (A - E)
- **Base:** `group flex w-full items-start gap-3.5 rounded-lg border border-zinc-200/90 bg-white p-3.5 text-left transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-[#121215] dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50`
- **Badge `<kbd>`:** `flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400`
- **Seleccionada:** `border-zinc-900 bg-zinc-900/[0.03] ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-100/[0.04] dark:ring-zinc-100`
- **Correcta (Modo Práctica):** `border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-950 dark:text-emerald-100`
- **Incorrecta (Modo Práctica):** `border-rose-500/40 bg-rose-500/[0.06] text-rose-950 dark:text-rose-100`

### 5. Arquitectura de información
- **Revelación progresiva:** las vistas densas muestran primero un resumen y luego una sola sección a la vez (pestañas `Tabs` de `src/components/ui/tabs.tsx`, con la pestaña activa en la URL, p. ej. `/analitica?vista=errores`). Los listados largos usan maestro-detalle en escritorio y acordeón en móvil.
- **Material:** el PDF compilado es la acción principal («Abrir PDF», «Descargar»); el `.tex`, Overleaf y el código quedan como enlaces secundarios en texto.
