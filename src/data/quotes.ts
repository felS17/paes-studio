/** Frases de impulso del Inicio. Rotan una por día, sin repetirse hasta completar la lista. */
export const QUOTES: readonly string[] = [
  'El puntaje no se construye el día de la prueba; se construye con las 10 preguntas que resuelves hoy cuando nadie te está mirando.',
  'Equivocarse aquí es gratis: cada error que entiendes hoy es una trampa menos en que caerás en la PAES.',
  'No necesitas ganas para partir. Las ganas suelen llegar a la tercera pregunta.',
  'Un mal ensayo no dice cuánto vales. Dice qué repasar mañana.',
  'Veinte minutos todos los días le ganan a seis horas el domingo antes de la prueba.',
  'Esa materia que evitas es justo donde están tus puntos más fáciles de ganar.',
  'Nadie nace sabiendo logaritmos. Los que hoy los entienden también estuvieron perdidos.',
  'No compitas con el puntaje de tu compañero. Compite con el que sacaste en tu último ensayo.',
  'Si hoy no das para mucho, haz una sola pregunta. La racha también se cuida en los días malos.',
  'Entender por qué fallaste vale más que acertar de pura suerte.',
  'Cada pregunta difícil que terminas hoy es una pregunta que no te va a asustar en la sala.',
  'Estudiar cansado cuenta. Volver después de haberlo dejado cuenta todavía más.',
  'La confianza de ese día no se improvisa: se junta de a poco, ensayo tras ensayo.',
  'Tu punto de partida no decide tu puntaje. Lo que hagas de aquí a la prueba, sí.',
  'No tienes que entenderlo todo hoy. Solo una cosa más que ayer.',
  'Lo que hoy te toma diez minutos, con práctica te va a tomar dos. Así se gana tiempo en la prueba.',
  'Dejar el celular lejos por 25 minutos ya es entrenar.',
  'Las preguntas que te frustran son las que más te están enseñando.',
  'Repasar un tema otra vez no es perder el tiempo: es dejar de depender de la suerte.',
  'Nadie va a contar cuántas veces te equivocaste practicando. Lo que queda es lo que aprendiste.',
  'Empezar tarde es mejor que no empezar. Parte con la pregunta que tienes enfrente.',
  'Hay días en que avanzar es solo no soltar. Esos días también suman.',
  'Tu futuro no se define en una mañana de prueba, pero a esa mañana sí puedes llegar preparado.',
  'Pedir ayuda y volver a intentarlo no es debilidad: así aprende la gente que llega lejos.',
  'Diez preguntas no cambian tu vida. Diez preguntas todos los días, quizás sí.',
  'Cuando una alternativa te parezca demasiado obvia, léela de nuevo: ahí se esconden las trampas.',
  'Tienes derecho a no saberlo todavía. La palabra importante es «todavía».',
  'Un poco de orden le gana a mucho talento: elige un tema, cierra lo demás y parte.',
]

/** Índice de la frase de hoy: avanza una por día local. */
export function quoteIndexOf(date: Date): number {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return day % QUOTES.length
}
