/** Dominio: Formulario Express, tarjetas de referencia por materia y eje. */

export type SheetId = 'm1' | 'm2' | 'fisica' | 'quimica' | 'biologia' | 'lectora' | 'historia'

export interface CheatCard {
  id: string
  sheet: SheetId
  axis: string
  title: string
  /** Temas del temario que cubre: así el resumen de un tema muestra solo lo suyo. */
  subtopics: string[]
  /** Pares etiqueta y contenido (Markdown + LaTeX). */
  rows: [string, string][]
}
