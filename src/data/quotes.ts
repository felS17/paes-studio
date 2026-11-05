export interface Quote {
  text: string
  author: string
  /** Obra o documento de origen, para poder comprobar la cita. */
  source: string
}

/**
 * Citas del Inicio. Rotan una por día, sin repetirse hasta completar la lista. Antes de agregar una, comprueba su
 * fuente: abundan las frases famosas mal atribuidas (la de «somos lo que hacemos repetidamente» es de Will Durant, no
 * de Aristóteles). Las escritas en otro idioma van en traducción al español.
 */
export const QUOTES: readonly Quote[] = [
  { text: 'Si no conviene, no lo hagas; si no es verdad, no lo digas.', author: 'Marco Aurelio', source: 'Meditaciones, XII, 17' },
  { text: 'El alma se tiñe del color de sus pensamientos.', author: 'Marco Aurelio', source: 'Meditaciones, V, 16' },
  { text: 'Lo que se interpone en el camino se convierte en el camino.', author: 'Marco Aurelio', source: 'Meditaciones, V, 20' },
  { text: 'No es que tengamos poco tiempo, sino que perdemos mucho.', author: 'Séneca', source: 'Sobre la brevedad de la vida, I' },
  { text: 'Mientras enseñamos, aprendemos.', author: 'Séneca', source: 'Cartas a Lucilio, VII' },
  { text: 'Mientras se aplaza, la vida pasa.', author: 'Séneca', source: 'Cartas a Lucilio, I' },
  { text: 'No nos perturban las cosas, sino las opiniones que tenemos de ellas.', author: 'Epicteto', source: 'Enquiridión, 5' },
  { text: 'Si quieres progresar, soporta que en lo externo te tengan por necio e insensato.', author: 'Epicteto', source: 'Enquiridión, 13' },
  { text: 'Todos los hombres desean por naturaleza saber.', author: 'Aristóteles', source: 'Metafísica, I, 1' },
  { text: 'Lo que hay que hacer después de haber aprendido, lo aprendemos haciéndolo.', author: 'Aristóteles', source: 'Ética a Nicómaco, II, 1' },
  { text: 'Una vida sin examen no merece ser vivida.', author: 'Sócrates', source: 'En Platón, Apología de Sócrates, 38a' },
  { text: 'Lo que no sé, tampoco creo saberlo.', author: 'Sócrates', source: 'En Platón, Apología de Sócrates, 21d' },
  { text: '¿Qué sé yo?', author: 'Michel de Montaigne', source: 'Ensayos, II, 12' },
  { text: 'Más vale una cabeza bien hecha que una cabeza bien llena.', author: 'Michel de Montaigne', source: 'Ensayos, I, 26' },
  { text: 'En medio del invierno aprendí por fin que había en mí un verano invencible.', author: 'Albert Camus', source: 'Retorno a Tipasa' },
  { text: 'La lucha por llegar a las cumbres basta para llenar un corazón de hombre.', author: 'Albert Camus', source: 'El mito de Sísifo' },
  { text: 'Lo que no me mata me hace más fuerte.', author: 'Friedrich Nietzsche', source: 'Crepúsculo de los ídolos' },
  { text: 'Quien tiene un porqué para vivir soporta casi cualquier cómo.', author: 'Friedrich Nietzsche', source: 'Crepúsculo de los ídolos' },
  { text: 'Que otros se jacten de las páginas que han escrito; a mí me enorgullecen las que he leído.', author: 'Jorge Luis Borges', source: '«Un lector», Elogio de la sombra' },
  { text: 'El tiempo es la sustancia de que estoy hecho.', author: 'Jorge Luis Borges', source: 'Nueva refutación del tiempo' },
  { text: 'Y sobre todo mirar con inocencia. Como si no pasara nada, lo cual es cierto.', author: 'Alejandra Pizarnik', source: '«Caminos del espejo», Extracción de la piedra de locura' },
  { text: 'Debemos tener perseverancia y, sobre todo, confianza en nosotros mismos.', author: 'Marie Curie', source: 'Carta a su hermano, 1894' },
  { text: 'El primer principio es que no debes engañarte a ti mismo, y tú eres la persona más fácil de engañar.', author: 'Richard Feynman', source: '«Cargo Cult Science», 1974' },
  { text: 'Lo que no puedo crear, no lo entiendo.', author: 'Richard Feynman', source: 'Escrito en su pizarrón, 1988' },
  { text: 'Si he visto más lejos, es por estar sobre hombros de gigantes.', author: 'Isaac Newton', source: 'Carta a Robert Hooke' },
  { text: 'La ignorancia engendra confianza con más frecuencia que el conocimiento.', author: 'Charles Darwin', source: 'El origen del hombre, introducción' },
  { text: 'Todo lo excelso es tan difícil como raro.', author: 'Baruch Spinoza', source: 'Ética, V, proposición 42' },
  { text: 'Aprender sin pensar es inútil; pensar sin aprender es peligroso.', author: 'Confucio', source: 'Analectas, II, 15' },
  { text: 'Donde haya un error que enmendar, enmiéndalo tú.', author: 'Gabriela Mistral', source: '«El placer de servir»' },
  { text: 'Caminante, no hay camino, se hace camino al andar.', author: 'Antonio Machado', source: 'Proverbios y cantares, XXIX, Campos de Castilla' },
]

/** Índice de la cita de hoy: avanza una por día local. */
export function quoteIndexOf(date: Date): number {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return day % QUOTES.length
}
