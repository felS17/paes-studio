# PAES Studio

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-informational)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![KaTeX](https://img.shields.io/badge/KaTeX-0.19-44cc11)
![Ensayos validados](https://img.shields.io/badge/ensayos%20validados-53-success)

Entorno abierto e interactivo de preparación para la PAES (DEMRE, Chile), con las pruebas oficiales, explicaciones paso a paso y material de síntesis. Es un sitio estático con una sola función serverless para la voz: no tiene cuentas ni base de datos, y tu progreso se guarda en tu navegador.

| Contenido | Cantidad |
| --- | ---: |
| Ensayos (48 oficiales y 5 curados) | 53 |
| Preguntas | 3.137 |
| Soluciones paso a paso | 1.892+ |
| Subtemas del temario DEMRE vigente (Admisión 2027) | 77 |
| Flashcards con repaso espaciado (SM-2) | 298 |
| Guías en PDF (LaTeX y Beamer) | 10 |

Las explicaciones oficiales las redactó una IA y se validaron contra la clave del DEMRE; la interfaz lo indica en cada una.

## Qué trae

- **Shell `animfetch`:** el inicio es una ventana de terminal con nebulosa animada, cuenta regresiva a la PAES, comandos de un clic y un prompt opcional con menú `/`. Puedes ponerle tu nombre a la sesión con `/nombre <alias>`.
- **10 temas de color y 5 tipografías**, de GitHub Dark y Catppuccin a Papel Cálido.
- **Motor de ensayos:** modo práctica y cronometrado, tachado de alternativas, atajos de teclado y puntaje en escala PAES.
- **Tutor de voz `LaTeX-to-Speech`:** lee cada explicación por bloques y convierte las fórmulas a español hablado, con velocidad de 1x, 1,25x y 1,5x.
- **Animaciones al estilo Manim** en SVG nativo, solo donde ver la figura ayuda: geometría y probabilidad de M1 y M2, con los datos de la pregunta cuando se pueden leer y sincronizadas con la voz.
- **Zettelkasten:** mapa interactivo de cómo se conectan los subtemas, con tu dominio de cada uno.
- **Task Manager:** estadísticas como un administrador de tareas, con procesos por eje, telemetría de ritmo, cuaderno de errores y descarga de tu progreso.
- **Flashcards** con repaso espaciado, **Formulario Express** y **guías en PDF** compiladas con LaTeX.

## Instalación

Requiere Node.js 22 o superior.

```bash
git clone https://github.com/felS17/paes-studio.git
cd paes-studio
npm install
npm run dev              # servidor de desarrollo, con /api/tts incluido
npm run build            # compilación estática en dist/
npm run validate:exams   # valida los 53 ensayos: claves, fórmulas y soluciones
```

Otros comandos:

```bash
npm run lint        # revisión del código con ESLint
npm run check:tts   # prueba /api/tts contra el servidor de Vite (requiere internet)
npm run pipeline    # extrae los PDF del DEMRE a JSON (requiere Python 3)
npm run pdfs        # recompila las guías (requiere Python 3 y pdfLaTeX)
```

## Cómo funciona la voz

`/api/tts?text=...` devuelve audio `audio/mpeg`. El mismo código corre como función de Vercel (`api/tts.ts`) y como middleware de Vite (`vite.config.ts`). Usa el servicio de voz de Google Translate, que no pide llaves, pero no es una API pública con garantías: puede cambiar o limitar el acceso sin aviso. Si falla, el reproductor sigue con la voz del dispositivo (`speechSynthesis`), y si tampoco hay una voz en español lo avisa.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Zustand y KaTeX en el frontend. Python para extraer los PDF y LaTeX para las guías. Se despliega en Vercel.

## Licencia y contacto

Código bajo [licencia MIT](LICENSE), 2026. Las pruebas, claves y solucionarios oficiales pertenecen al DEMRE.

Hecho por **felS** · [`@felS17`](https://github.com/felS17). Sugerencias y errores en [issues](https://github.com/felS17/paes-studio/issues).
