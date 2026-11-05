import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const LOC = 'Localizar'
const INT = 'Interpretar'
const EVA = 'Evaluar'
const INF = 'Inferencias y distractores'
const TES = 'Tesis, argumentos y tono'
const DIS = 'Textos discontinuos'

export const lectora: Deck = {
  id: 'lectora',
  title: 'Competencia Lectora',
  subject: 'lectora',
  mono: 'CL',
  description: 'Lo que evalúa el DEMRE: localizar, interpretar y evaluar, inferencias válidas, distractores clásicos, tesis y argumentos, tono y gráficos.',
  units: [LOC, INT, EVA, INF, TES, DIS],
  cards: [
    // Localizar
    card('cl-01', LOC, '¿Qué te pide una pregunta de **Localizar**?', 'Encontrar información que está escrita en el texto, de forma literal o con otras palabras. No hay que deducir nada.', [
      'Si está bien respondida, puedes señalar la frase con el dedo.',
      'Frases típicas: «según el texto», «el autor menciona», «¿qué dato entrega…?».',
    ]),
    card('cl-02', LOC, '¿Cómo se responde una pregunta de Localizar sin perder tiempo?', 'Toma la palabra clave del enunciado, vuelve al párrafo donde aparece y lee esa oración completa junto con la anterior y la siguiente.', [
      'No respondas de memoria: el DEMRE cuenta con eso.',
    ]),
    card('cl-03', LOC, '¿Por qué la alternativa correcta casi nunca copia el texto palabra por palabra?', 'Porque el DEMRE parafrasea: dice lo mismo con sinónimos. En cambio, una alternativa que repite palabras del texto suele cambiar lo que dice.', [
      'Compara el sentido, no las palabras.',
    ]),
    card('cl-04', LOC, '¿Cuál es la diferencia entre información **explícita** e **implícita**?', 'La explícita está dicha en el texto. La implícita no está dicha, pero se deduce de lo que sí dice.', [
      'Explícita: se localiza.',
      'Implícita: se interpreta.',
    ]),

    // Interpretar
    card('cl-05', INT, '¿Qué te pide una pregunta de **Interpretar**?', 'Construir un sentido que no está escrito literalmente, juntando información de una o varias partes del texto.', [
      'Tres operaciones: inferir, sintetizar y relacionar.',
    ]),
    card('cl-06', INT, 'El texto dice: «Ana salió con paraguas y miró el cielo». ¿Qué sería Localizar y qué sería Interpretar?', 'Localizar: qué llevaba Ana (un paraguas). Interpretar: Ana probablemente temía que lloviera, aunque el texto no lo diga.'),
    card('cl-07', INT, '¿Cuál es la diferencia entre el **tema** y la **idea principal**?', 'El tema es de qué trata el texto y cabe en pocas palabras. La idea principal es lo que el texto afirma sobre ese tema, y necesita una oración.', [
      'Tema: el agua en Chile.',
      'Idea principal: la sequía obliga a cambiar cómo se reparte el agua en Chile.',
    ]),
    card('cl-08', INT, '¿Cómo reconoces la mejor **síntesis** de un párrafo?', 'Es la que cubre todo el párrafo. Descarta la que habla solo de un detalle (muy específica) y la que serviría para cualquier texto (muy general).'),
    card('cl-09', INT, '¿Cómo se responde una pregunta de **vocabulario en contexto**?', 'Reemplaza la palabra por cada alternativa y lee la oración completa. Queda la que mantiene el sentido del texto, aunque no sea el significado más común de la palabra.', [
      'El DEMRE suele poner el significado de diccionario como trampa.',
    ]),
    card('cl-10', INT, '¿Qué relaciones entre párrafos pregunta el DEMRE y cómo las detectas?', 'Causa y efecto, problema y solución, comparación, ejemplo de una idea anterior o contraste. Los conectores suelen delatarlas.', [
      '«Por ello» indica consecuencia.',
      '«En cambio» indica contraste.',
    ]),

    // Evaluar
    card('cl-11', EVA, '¿Qué te pide una pregunta de **Evaluar**?', 'Tomar distancia y juzgar cómo y para qué está escrito el texto: su propósito, la postura del emisor, sus recursos y su forma.'),
    card('cl-12', EVA, '¿Cuál es la diferencia entre **Interpretar** y **Evaluar**?', 'Interpretar responde qué quiere decir el texto. Evaluar responde por qué lo dice así y para qué.'),
    card('cl-13', EVA, '¿Cómo se ataca una pregunta sobre el **propósito** del texto?', 'Mira primero el verbo con que parte cada alternativa: informar, explicar, convencer, criticar, advertir, entretener. Descarta los verbos que no calzan con lo que hace el texto completo.', [
      'Un texto que da razones para convencer no solo «informa».',
    ]),
    card('cl-14', EVA, '¿Qué te preguntan cuando piden la **función** de un ejemplo, una cita o un párrafo?', 'No lo que dice, sino para qué está ahí: respaldar una idea, ilustrarla, introducir un tema, presentar una postura contraria o concluir.'),
    card('cl-15', EVA, '¿Cómo distingues un **hecho** de una **opinión**?', 'Un hecho se puede comprobar. Una opinión es un juicio del emisor.', [
      'Marcas de opinión: «a mi juicio», «debería», adjetivos valorativos como «lamentable».',
    ]),
    card('cl-16', EVA, '¿Para qué puede usar un autor las **comillas**?', 'Para citar a otro o para tomar distancia de una palabra, muchas veces con ironía. Fíjate en el contexto para saber cuál de las dos es.', [
      'Sus «soluciones» empeoraron todo: las comillas indican que no fueron soluciones.',
    ]),

    // Inferencias y distractores
    card('cl-17', INF, '¿Qué hace válida a una **inferencia**?', 'Que el texto la respalde aunque no la diga: puedes justificarla con frases concretas del propio texto.'),
    card('cl-18', INF, '¿Qué es una **sobregeneralización**?', 'Extender a todos lo que el texto dice solo de algunos.', [
      'Señales: siempre, nunca, todos, ninguno, únicamente.',
      'Si el texto dice «muchos jóvenes», «todos los jóvenes» es falso.',
    ]),
    card('cl-19', INF, '¿Qué es una **suposición** en una alternativa?', 'Una idea razonable según lo que tú sabes, pero que el texto no respalda. En la PAES solo vale lo que permite el texto, aunque la alternativa sea cierta en la vida real.'),
    card('cl-20', INF, '¿Cuál es la prueba rápida para saber si una inferencia sirve?', 'Pregúntate: «¿qué frase del texto me permite afirmar esto?». Si no puedes señalar ninguna, descártala.'),
    card('cl-21', INF, 'Distractor de **contradicción**: ¿cómo funciona?', 'Afirma lo contrario de lo que dice el texto, a menudo con una negación agregada o cambiando una sola palabra.', [
      'Atento a pares como aumenta y disminuye, o causa y consecuencia.',
    ]),
    card('cl-22', INF, 'Distractor de **dato parcial**: ¿cómo funciona?', 'Dice algo verdadero según el texto, pero no responde lo que se pregunta o solo cubre una parte de la respuesta. Por eso parece correcto.', [
      'Que sea cierto no basta: tiene que responder la pregunta.',
    ]),
    card('cl-23', INF, 'Distractor de **extrapolación**: ¿cómo funciona?', 'Lleva la idea más allá de lo que dice el texto: agrega consecuencias, causas o contextos que el autor nunca planteó.'),
    card('cl-24', INF, '¿Cómo descartar alternativas de forma ordenada?', 'Clasifica cada una: lo dice el texto, lo contradice o no lo menciona. Solo sobrevive la que el texto respalda y además responde la pregunta.', [
      'Tacharlas te ayuda a no volver a caer en ellas.',
    ]),

    // Tesis, argumentos y tono
    card('cl-25', TES, '¿Cuál es la diferencia entre **tesis** y **argumento**?', 'La tesis es la postura que el autor defiende. El argumento es la razón con que la sostiene.', [
      'Tesis: se debe reducir la jornada laboral.',
      'Argumento: las personas descansadas rinden más.',
    ]),
    card('cl-26', TES, '¿Cómo encuentras la tesis de una columna de opinión?', 'Pregúntate de qué te quiere convencer el autor. Suele estar al inicio o al cierre, y es la frase a la que puedes preguntarle «¿por qué?» y el resto del texto responde.'),
    card('cl-27', TES, '¿Qué tipos de **argumento** aparecen más en la PAES?', 'De autoridad (cita a un experto), con datos (cifras o estudios), de ejemplo (un caso concreto), por analogía (compara con algo parecido) y de causa (muestra una consecuencia).'),
    card('cl-28', TES, '¿Qué es un **contraargumento** y por qué confunde?', 'Es una postura contraria que el autor presenta para rebatirla. Confunde porque está en el texto, pero no es lo que el autor piensa.', [
      'Señales: «si bien», «aunque», «algunos sostienen».',
    ]),
    card('cl-29', TES, '¿Cómo reconoces un **tono irónico**?', 'El emisor da a entender lo contrario de lo que dice literalmente.', [
      'Señales: elogios fuera de lugar, exageraciones y comillas.',
      '«Qué gran idea cerrar la única biblioteca del barrio».',
    ]),
    card('cl-30', TES, '¿Cómo reconoces un **tono crítico**?', 'El emisor cuestiona o desaprueba algo y lo dice abiertamente, con adjetivos negativos y verbos que juzgan, como «falla», «ignora» o «descuida».', [
      'A diferencia de la ironía, aquí lo dicho y lo pensado coinciden.',
    ]),
    card('cl-31', TES, '¿Cuál es la diferencia entre un tono **objetivo** y uno **reflexivo**?', 'El objetivo expone datos en tercera persona, sin juzgar. El reflexivo piensa en voz alta: se hace preguntas, matiza y suele usar la primera persona.'),

    // Textos discontinuos
    card('cl-32', DIS, '¿Qué es un **texto discontinuo**?', 'Uno que entrega la información sin párrafos seguidos: gráficos, tablas, infografías, afiches o mapas. Se lee saltando entre sus partes.'),
    card('cl-33', DIS, '¿En qué orden conviene leer un gráfico?', 'Primero el título, luego qué mide cada eje y en qué unidad, y la fuente. Recién entonces mira la forma de la curva o el tamaño de las barras.'),
    card('cl-34', DIS, '¿Qué **función** cumple un gráfico o una infografía dentro de un texto?', 'Respaldar una afirmación con evidencia, resumir información, comparar datos o mostrar una tendencia en el tiempo.', [
      'Pregunta típica: ¿qué afirmación del texto respalda el gráfico?',
    ]),
    card('cl-35', DIS, '¿Cuál es la trampa típica al cruzar un texto con un gráfico?', 'Una alternativa verdadera según el párrafo pero que el gráfico no muestra, o concluir una causa cuando el gráfico solo muestra que dos cosas cambian juntas.', [
      'Lee de qué fuente te piden responder.',
    ]),
  ],
}
