"""Ensayo curado de Competencia Lectora: tres textos originales y 15 preguntas con fundamentación."""

from . import q

LOC = "Localizar"
INT = "Interpretar"
EVA = "Evaluar"

PASSAGES = [
    {
        "id": "lectura-1",
        "title": "Lectura 1",
        "body": r"""
Columna de opinión publicada en un diario regional.

**Las bibliotecas no son bodegas de libros**

Un sábado cualquiera, en la biblioteca municipal de mi comuna, conté a qué venía la gente. Dos estudiantes resolvían una guía de física con el wifi del edificio; un caballero de unos ochenta años leía el diario de punta a cabo; en la sala del fondo, un grupo de vecinas haitianas practicaba español con una voluntaria, y en la alfombra de colores una bibliotecaria leía un cuento a nueve niños que no se perdían una palabra. Solo una persona, en dos horas, pidió un libro prestado.

Lo anterior no es una señal de decadencia, sino de transformación. La biblioteca pública es hoy uno de los pocos lugares de la ciudad donde se puede estar sin pagar, sin consumir y sin dar explicaciones. Es, si se quiere, una plaza pública bajo techo: un espacio que no le pide a nadie que demuestre nada para entrar.

Se suele objetar que la digitalización volvió obsoletas a las bibliotecas, porque cualquier texto está a un clic de distancia. El argumento tiene algo de cierto: buscar un dato ya no exige desplazarse a una sala de lectura. Pero confunde el acceso a la información con el acceso a un lugar.

Esa es una lectura miope del problema. Tener un teléfono no equivale a tener silencio para estudiar, una mesa donde apoyar el cuaderno, conexión estable o alguien que enseñe a distinguir una fuente confiable de un rumor. Para muchas familias, la biblioteca es precisamente el lugar donde esas condiciones existen; para otras, es la única puerta de entrada a lo digital.

Por eso, la discusión sobre el presupuesto municipal debería cambiar de pregunta. En lugar de medir el éxito de una biblioteca por la cantidad de libros que presta, habría que medirlo por la cantidad de personas que encuentran en ella un motivo para quedarse. Ampliar los horarios, contratar más personal y abrir los fines de semana no es un lujo cultural: es invertir en el único espacio público que todavía nos recibe a todos por igual.
""",
    },
    {
        "id": "lectura-2",
        "title": "Lectura 2",
        "body": r"""
Artículo de divulgación científica.

**Cuando llueve en el desierto más árido del mundo**

El desierto de Atacama es uno de los lugares más secos del planeta. En algunos sectores pueden pasar años sin que caiga una gota de lluvia, y su paisaje habitual es una extensión de tierra, piedras y cerros sin vegetación aparente.

Sin embargo, algunos años ocurre algo extraordinario. Cuando las lluvias de otoño e invierno superan con claridad el promedio, fenómeno que suele asociarse a la presencia de El Niño en el océano Pacífico, el sur del desierto se cubre de flores durante la primavera. Es el llamado desierto florido, un espectáculo que atrae a miles de visitantes a la Región de Atacama.

¿De dónde salen esas flores en un suelo que parecía muerto? La respuesta está bajo tierra. Durante los años secos, miles de semillas, bulbos y raíces permanecen en estado de latencia, es decir, vivos pero inactivos, a la espera de condiciones favorables. Cuando el suelo recibe agua suficiente y la temperatura es adecuada, germinan y crecen con rapidez: en pocas semanas florecen, son polinizadas y producen nuevas semillas que volverán a esperar, quizás durante años, la próxima lluvia.

El fenómeno no solo es llamativo, también es valioso desde el punto de vista biológico. En el desierto florido se han registrado más de doscientas especies de plantas, muchas de ellas endémicas, como la pata de guanaco, de flores fucsias, o la garra de león, cuya escasez la ha convertido en una especie amenazada. Insectos, aves y pequeños roedores aprovechan también esta abundancia pasajera.

Precisamente por su fragilidad, el desierto florido enfrenta amenazas. Los vehículos que salen de los caminos compactan el suelo y destruyen las semillas, y quienes arrancan flores o bulbos impiden que la planta complete su ciclo. Las recomendaciones de los organismos de conservación son simples: circular solo por las rutas habilitadas, no extraer plantas y llevarse la basura. Lo que se pierde en una temporada puede tardar décadas en recuperarse.
""",
    },
    {
        "id": "lectura-3",
        "title": "Lectura 3",
        "body": r"""
Relato breve.

**Las cinco y diez**

El reloj de la abuela llegó a nuestra casa envuelto en una frazada, como si fuera un animal enfermo. Era de madera oscura, con un péndulo de bronce y unos números romanos que a mí me parecían letras de otro idioma. Marcaba las cinco y diez. Había marcado las cinco y diez durante los últimos veinte años.

—Lo voy a llevar a arreglar —dijo mi mamá, mientras le limpiaba el polvo con la manga—. Un reloj que no da la hora es un adorno caro.

Yo sabía la historia porque la abuela me la había contado muchas veces, siempre con las mismas palabras. A las cinco y diez de una tarde de junio, el abuelo salió a comprar pan y no volvió. Esa noche, ella detuvo el péndulo con dos dedos y nunca más quiso darle cuerda. «Así no se me escapa», decía, y no explicaba qué era lo que se le podía escapar.

Durante semanas defendí el reloj detenido como si defendiera a la abuela. Lo puse en mi pieza, frente a la cama, y cada noche me dormía mirando esas dos agujas quietas que parecían señalar un lugar al que nadie más podía ir. Mi mamá no insistió. Solo una vez, al pasar, dijo que la abuela tampoco había querido que el tiempo se detuviera para todos.

Una mañana de domingo abrí la puertecita de vidrio, busqué la llave en el fondo de la caja y le di cuerda, despacio, contando las vueltas. Después empujé el péndulo con dos dedos, igual que ella lo había detenido. El tictac sonó en la pieza como una respiración que volvía.

No moví las agujas. Lo dejé avanzar desde las cinco y diez, a su ritmo, hasta que alcanzó por su cuenta la hora verdadera.
""",
    },
]

QUESTIONS = [
    # ── Lectura 1 ──
    q(INT, "Propósito de un recurso",
      r"¿Con qué propósito el emisor relata lo que observó en la biblioteca durante un sábado (primer párrafo)?",
      [r"Para denunciar el escaso interés de los vecinos por la lectura de libros.",
       r"Para ilustrar la variedad de usos que las personas dan hoy a la biblioteca.",
       r"Para criticar que la biblioteca destine sus salas a actividades no literarias.",
       r"Para demostrar que los préstamos de libros han desaparecido por completo."],
      "B",
      r"La anécdota funciona como ejemplo concreto que prepara la tesis del segundo párrafo: la biblioteca se transformó en un espacio de usos diversos.",
      [
          r"Identifica qué enumera el párrafo: estudiar con wifi, leer el diario, aprender español, escuchar un cuento. Son usos distintos del préstamo de libros.",
          r"Relaciona con lo que sigue: el segundo párrafo afirma que eso «no es una señal de decadencia, sino de transformación». La anécdota anticipa y respalda esa idea.",
          r"Por lo tanto, el propósito es ilustrar la diversidad de usos.",
      ],
      {"A": r"El emisor no lo valora como desinterés: dice expresamente que no es decadencia.",
       "D": r"El texto dice que una persona sí pidió un libro: los préstamos disminuyeron, no desaparecieron."},
      passage="lectura-1", skill="Interpretar"),
    q(LOC, "Información explícita",
      r"Según el tercer párrafo, ¿qué sostienen quienes consideran obsoletas a las bibliotecas?",
      [r"Que los textos están disponibles de manera inmediata gracias a la digitalización.",
       r"Que el presupuesto municipal debería destinarse a otros espacios públicos.",
       r"Que las nuevas generaciones ya no tienen interés por la lectura en papel.",
       r"Que los catálogos de las bibliotecas se encuentran desactualizados."],
      "A",
      r"La respuesta está explícita: «la digitalización volvió obsoletas a las bibliotecas, porque cualquier texto está a un clic de distancia».",
      [
          r"Ubica el párrafo que presenta la objeción: comienza con «Se suele objetar…».",
          r"La razón de la objeción aparece introducida por «porque»: cualquier texto está a un clic de distancia.",
          r"«A un clic de distancia» equivale a disponibilidad inmediata, que es lo que expresa la alternativa A.",
      ],
      {"C": r"Es una idea plausible, pero el texto no la menciona en ningún párrafo."},
      passage="lectura-1", skill="Localizar", difficulty="baja"),
    q(INT, "Vocabulario contextual",
      r"En el contexto del cuarto párrafo, ¿cuál de las siguientes palabras puede reemplazar a MIOPE sin que cambie el sentido del texto?",
      [r"Lejana", r"Apresurada", r"Estrecha", r"Borrosa"],
      "C",
      r"«Miope» se usa en sentido figurado: una lectura que solo ve lo cercano y no alcanza a captar el problema completo.",
      [
          r"El emisor llama «miope» al argumento de la digitalización, que considera solo el acceso a la información.",
          r"A continuación enumera lo que ese argumento no ve: silencio, una mesa, conexión estable, orientación.",
          r"Una lectura que deja fuera parte del problema es una lectura **estrecha**, limitada.",
      ],
      {"D": r"«Borrosa» alude a la falta de nitidez, no a la falta de alcance, que es lo que critica el emisor.",
       "A": r"Invierte el sentido: el miope ve bien lo cercano y mal lo lejano."},
      passage="lectura-1", skill="Interpretar"),
    q(INT, "Tesis",
      r"¿Cuál es la tesis que defiende el emisor de la columna?",
      [r"Las bibliotecas deben modernizarse incorporando más tecnología digital.",
       r"El préstamo de libros es el mejor indicador del éxito de una biblioteca.",
       r"La digitalización ha vuelto innecesarias las salas de lectura tradicionales.",
       r"La biblioteca pública es un espacio comunitario cuyo valor excede el préstamo de libros."],
      "D",
      r"La tesis es la postura que el texto completo defiende; aquí se formula en el segundo párrafo y se retoma en la conclusión.",
      [
          r"Segundo párrafo: la biblioteca es «una plaza pública bajo techo».",
          r"Quinto párrafo: el éxito debería medirse por «la cantidad de personas que encuentran en ella un motivo para quedarse», no por los préstamos.",
          r"Ambas ideas se resumen en D: el valor de la biblioteca va más allá de prestar libros.",
      ],
      {"B": r"Es justamente el criterio que el emisor propone abandonar.",
       "C": r"Es la objeción que el emisor refuta, no su postura."},
      passage="lectura-1", skill="Interpretar"),
    q(EVA, "Estrategia argumentativa",
      r"En el tercer y cuarto párrafo, ¿qué estrategia utiliza el emisor para responder a quienes consideran obsoletas a las bibliotecas?",
      [r"Cita la opinión de expertos que contradicen esa postura.",
       r"Presenta estadísticas sobre el uso de bibliotecas en distintas comunas.",
       r"Descalifica a quienes sostienen esa postura por desconocer la realidad local.",
       r"Reconoce parcialmente el argumento y luego muestra que confunde dos tipos de acceso."],
      "D",
      r"Es una concesión seguida de refutación: se admite una parte del argumento contrario y luego se muestra su límite.",
      [
          r"Concesión: «El argumento tiene algo de cierto: buscar un dato ya no exige desplazarse…».",
          r"Refutación: «Pero confunde el acceso a la información con el acceso a un lugar», idea que el cuarto párrafo desarrolla con ejemplos.",
          r"El texto no incluye citas de expertos ni datos estadísticos, y no ataca a las personas, sino a su razonamiento.",
      ],
      passage="lectura-1", skill="Evaluar", difficulty="alta"),
    # ── Lectura 2 ──
    q(LOC, "Información explícita",
      r"De acuerdo con el texto, ¿qué condición desencadena el desierto florido?",
      [r"Lluvias de otoño e invierno claramente superiores al promedio.",
       r"Temperaturas más bajas de lo normal durante la primavera.",
       r"La llegada de insectos polinizadores desde otras regiones.",
       r"El aumento de visitantes que transportan semillas al desierto."],
      "A",
      r"El segundo párrafo establece la condición: «Cuando las lluvias de otoño e invierno superan con claridad el promedio…».",
      [
          r"Busca el conector que introduce la condición: «Cuando…».",
          r"Lo que sigue a ese «cuando» es la causa; la consecuencia es que «el sur del desierto se cubre de flores».",
      ],
      {"C": r"Los insectos aparecen en el cuarto párrafo como beneficiados por el fenómeno, no como su causa."},
      passage="lectura-2", skill="Localizar", difficulty="baja"),
    q(INT, "Relación entre párrafos",
      r"¿Qué relación existe entre el tercer párrafo y el segundo?",
      [r"El tercero plantea una objeción a lo afirmado en el segundo.",
       r"El tercero describe las consecuencias económicas del fenómeno del segundo.",
       r"El tercero explica el mecanismo biológico del fenómeno presentado en el segundo.",
       r"El tercero compara el desierto de Atacama con otros desiertos del mundo."],
      "C",
      r"El segundo párrafo presenta el fenómeno (el desierto florece) y el tercero responde cómo ocurre.",
      [
          r"El tercer párrafo abre con una pregunta: «¿De dónde salen esas flores…?».",
          r"Responde con un proceso: latencia de semillas y bulbos, germinación con agua y temperatura adecuadas, floración y producción de semillas.",
          r"Explicar cómo ocurre un fenómeno es describir su mecanismo.",
      ],
      passage="lectura-2", skill="Interpretar"),
    q(INT, "Inferencia",
      r"A partir del tercer párrafo, ¿qué se puede inferir sobre las plantas del desierto florido?",
      [r"Solo pueden sobrevivir en años en que se presenta El Niño.",
       r"Su ciclo de vida está adaptado para aprovechar periodos breves de humedad.",
       r"Necesitan ser sembradas por las personas para volver a florecer.",
       r"Florecen todos los años, aunque solo en algunos se vuelven visibles."],
      "B",
      r"Una inferencia se apoya en el texto sin estar dicha literalmente: crecer, florecer y producir semillas «en pocas semanas» es una adaptación a la escasez de agua.",
      [
          r"Datos del texto: las semillas esperan años en latencia y, cuando llueve, el ciclo completo ocurre en pocas semanas.",
          r"Conclusión: completar el ciclo rápido permite aprovechar una humedad que dura poco. Eso es una adaptación.",
      ],
      {"A": r"Las semillas sobreviven en latencia durante los años secos; no mueren cuando no hay El Niño.",
       "D": r"El texto dice que en los años secos permanecen inactivas: no florecen."},
      passage="lectura-2", skill="Interpretar"),
    q(LOC, "Información explícita",
      r"¿Qué especie menciona el texto como ejemplo de planta amenazada?",
      [r"La pata de guanaco", r"El bulbo de latencia", r"La garra de león", r"La flor fucsia del desierto"],
      "C",
      r"El cuarto párrafo afirma que la garra de león tiene una escasez que «la ha convertido en una especie amenazada».",
      [
          r"El párrafo menciona dos especies: la pata de guanaco (descrita por sus flores fucsias) y la garra de león.",
          r"Solo la segunda se asocia con la condición de amenaza.",
      ],
      {"A": r"Se menciona como especie endémica, no como amenazada."},
      passage="lectura-2", skill="Localizar", difficulty="baja"),
    q(EVA, "Función de un párrafo",
      r"¿Cuál es la función del último párrafo dentro del texto?",
      [r"Advertir sobre las amenazas al fenómeno y proponer conductas para protegerlo.",
       r"Resumir las características biológicas del desierto florido.",
       r"Refutar la idea de que el desierto florido tiene valor biológico.",
       r"Narrar una experiencia personal de visita al desierto florido."],
      "A",
      r"El párrafo final pasa de explicar a orientar la conducta del lector.",
      [
          r"Identifica las amenazas que nombra: vehículos fuera de los caminos y extracción de flores o bulbos.",
          r"Identifica las recomendaciones: circular por rutas habilitadas, no extraer plantas y llevarse la basura.",
          r"Amenazas más recomendaciones equivalen a advertir y proponer conductas de protección.",
      ],
      passage="lectura-2", skill="Evaluar"),
    # ── Lectura 3 ──
    q(LOC, "Información explícita",
      r"Según el relato, ¿por qué el reloj marcaba siempre las cinco y diez?",
      [r"Porque se había descompuesto durante el traslado a la casa.",
       r"Porque la abuela lo detuvo a la hora en que el abuelo se fue y no volvió.",
       r"Porque la madre había decidido no darle cuerda para conservarlo.",
       r"Porque la llave para darle cuerda se había perdido hace años."],
      "B",
      r"El tercer párrafo relata el origen: el abuelo salió a las cinco y diez y no volvió, y esa noche la abuela detuvo el péndulo.",
      [
          r"Ubica el párrafo que cuenta «la historia».",
          r"Hecho: «Esa noche, ella detuvo el péndulo con dos dedos y nunca más quiso darle cuerda».",
      ],
      {"D": r"La llave estaba en el fondo de la caja: la narradora la usa en el quinto párrafo."},
      passage="lectura-3", skill="Localizar", difficulty="baja"),
    q(INT, "Sentido de un símbolo",
      r"¿Qué representaba el reloj detenido para la abuela, según se desprende de la frase «Así no se me escapa»?",
      [r"Una manera de retener el recuerdo del último momento con el abuelo.",
       r"Una forma de castigar al abuelo por haberse marchado.",
       r"Un objeto valioso que temía que le robaran.",
       r"Una costumbre que heredó de su propia familia."],
      "A",
      r"Detener el reloj a la hora de la partida «congela» ese instante: lo que no quiere que se escape es el último momento compartido.",
      [
          r"Relaciona la hora detenida (cinco y diez) con el hecho que ocurrió a esa hora (la partida del abuelo).",
          r"«Así no se me escapa» sugiere conservar algo que el paso del tiempo alejaría: ese momento y su recuerdo.",
      ],
      passage="lectura-3", skill="Interpretar"),
    q(INT, "Caracterización de personajes",
      r"¿Cuál de las siguientes opciones caracteriza mejor a la madre en el relato?",
      [r"Indiferente ante el dolor de su hija.",
       r"Autoritaria, pues obliga a reparar el reloj.",
       r"Práctica, aunque respetuosa de los tiempos de su hija.",
       r"Nostálgica, porque se aferra al pasado familiar."],
      "C",
      r"Se infiere de sus palabras y acciones: valora la utilidad del reloj, pero no impone su opinión.",
      [
          r"Rasgo práctico: «Un reloj que no da la hora es un adorno caro».",
          r"Rasgo respetuoso: «Mi mamá no insistió»; solo deja una observación al pasar.",
      ],
      {"B": r"Quiso arreglarlo, pero no insistió ni lo hizo contra la voluntad de la narradora.",
       "D": r"Quien se aferra al pasado en el relato es la narradora, al menos al comienzo."},
      passage="lectura-3", skill="Interpretar"),
    q(INT, "Transformación del personaje",
      r"¿Qué cambio experimenta la narradora al final del relato?",
      [r"Decide olvidar la historia de sus abuelos para no sufrir.",
       r"Acepta que el tiempo siga su curso sin renunciar al recuerdo.",
       r"Se arrepiente de haber defendido el reloj frente a su madre.",
       r"Descubre que el reloj nunca estuvo realmente detenido."],
      "B",
      r"Dar cuerda al reloj sin mover las agujas combina dos gestos: dejar que el tiempo avance y partir desde las cinco y diez.",
      [
          r"Al inicio defiende el reloj detenido «como si defendiera a la abuela».",
          r"Al final le da cuerda (el tiempo vuelve a correr), pero «no movió las agujas»: el avance parte desde la hora del recuerdo.",
          r"Por eso no hay olvido ni arrepentimiento, sino aceptación con memoria.",
      ],
      {"A": r"Respetar la hora de partida al dar cuerda muestra que no busca olvidar."},
      passage="lectura-3", skill="Interpretar", difficulty="alta"),
    q(EVA, "Lenguaje figurado",
      r"En el quinto párrafo, ¿qué sugiere la expresión «El tictac sonó en la pieza como una respiración que volvía»?",
      [r"Que el reloj tenía un mecanismo defectuoso que hacía ruido.",
       r"Que la narradora sentía miedo ante el sonido del reloj.",
       r"Que la habitación estaba en completo silencio desde hacía años.",
       r"Que con el reloj en marcha algo vuelve a la vida en la casa."],
      "D",
      r"La comparación asocia el tictac con una respiración, es decir, con un signo vital que regresa.",
      [
          r"Identifica la comparación: el tictac es «como una respiración».",
          r"Una respiración «que volvía» sugiere vida que se recupera, en contraste con el tiempo detenido del inicio.",
      ],
      {"C": r"El reloj estuvo detenido veinte años, pero estaba en la pieza recién hace semanas; además, la expresión destaca el regreso de la vida, no el silencio previo."},
      passage="lectura-3", skill="Evaluar"),
]

EXAM = {
    "id": "lectora-curado-1",
    "subject": "lectora",
    "title": "Ensayo curado 1",
    "description": (
        "Tres textos originales (una columna de opinión, un artículo de divulgación y un relato breve) con 15 "
        "preguntas de localizar, interpretar y evaluar. Cada respuesta se fundamenta con citas del texto."
    ),
    "passages": PASSAGES,
    "questions": QUESTIONS,
}
