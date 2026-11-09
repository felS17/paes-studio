#!/usr/bin/env python3
"""Temario DEMRE (Admisión 2027: 77 subtemas vigentes y 8 no vigentes) → datos de la app + subtema de cada pregunta.

1. Escribe `src/data/temario/index.json` (liviano: asignatura → eje → subtema, con la página del subtema en el
   compendio PDF) y `src/data/temario/notes.json` (teoría, recuadro, ideas clave, método y trampas de cada
   subtema; la app lo carga bajo demanda en el Zettelkasten).
2. Asigna `subtopic` a cada pregunta de `src/data/exams/*/*.json`:
   - los candidatos son los subtemas del eje de la pregunta (más los transversales: suficiencia de datos,
     habilidades científicas y análisis de fuentes, que se detectan por la forma de la pregunta);
   - la etiqueta de tema (`topic`) suma puntos a los subtemas que la cubren (`labels` del temario);
   - las palabras clave del enunciado y las alternativas desempatan y resuelven los temas genéricos
     («Números», «Interpretar», «Procesos históricos»…).

Se ejecuta al final de `extract_demre.py` y `build_curated.py`, así que una nueva extracción conserva el
subtema. Uso: python3 scripts/pipeline/assign_subtopics.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

from temario import SUBJECTS, load  # noqa: E402

EXAMS = ROOT / "src" / "data" / "exams"
OUT = ROOT / "src" / "data" / "temario"
PDFS = ROOT / "public" / "pdfs"


def norm(t: str) -> str:
    t = unicodedata.normalize("NFD", (t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t)


# Palabras clave por subtema (texto normalizado: minúsculas y sin tildes). Cada coincidencia suma 1 punto.
KEYWORDS: dict[str, list[str]] = {
    # ── M1 ──
    "m1-racionales": [r"fraccion", r"decimal", r"\bentero", r"recta numerica", r"aproxima", r"redonde", r"truncamiento",
                      r"racional", r"irracional", r"\bmcm\b", r"\bmcd\b", r"multiplo", r"divisor", r"\bprimo", r"bajo cero",
                      r"numero real", r"periodico", r"\\frac"],
    "m1-porcentajes": [r"%", r"porcentaje", r"por ciento", r"descuento", r"interes", r"\biva\b", r"precio", r"pesos",
                       r"dinero", r"sueldo", r"cuota", r"ganancia", r"\bcosto", r"rebaja", r"oferta"],
    "m1-potencias": [r"potencia", r"\braiz", r"\braices", r"exponente", r"notacion cientifica", r"\\sqrt", r"\^\{?-?\d",
                     r"cuadrado perfecto", r"10\^"],
    "m1-proporcionalidad": [r"proporcional", r"\brazon", r"directamente", r"inversamente", r"por cada",
                            r"trabajadores", r"rendimiento", r"\bonza", r"\bml\b", r"receta"],
    "m1-expresiones": [r"expresion algebraica", r"factoriz", r"reducir", r"producto notable", r"binomio", r"\bmodel",
                       r"representa", r"expresion"],
    "m1-ecuaciones": [r"ecuacion", r"inecuacion", r"intervalo", r"desigualdad", r"despej", r"solucion de la"],
    "m1-sistemas": [r"sistema de ecuaciones", r"sistema", r"dos ecuaciones"],
    "m1-funcion-afin": [r"funcion", r"pendiente", r"\brecta", r"\bf\(x\)", r"dominio", r"recorrido", r"\blineal", r"\bafin",
                        r"tarifa", r"cargo fijo"],
    "m1-cuadratica": [r"cuadratica", r"parabola", r"vertice", r"x\^2", r"x\^\{2\}", r"concavidad", r"segundo grado"],
    "m1-areas": [r"\barea", r"perimetro", r"cuadrado", r"rectangul", r"triangulo", r"circulo", r"circunferencia", r"trapecio",
                 r"paralelogramo", r"rombo", r"pitagoras", r"hipotenusa", r"cateto", r"diagonal", r"\bradio\b", r"diametro",
                 r"poligono", r"angulo"],
    "m1-cuerpos": [r"volumen", r"(?<!al )\bcubos?\b", r"prisma", r"cilindr", r"paralelepiped", r"capacidad", r"\blitros?\b",
                   r"estanque", r"\bcaja\b", r"area total", r"superficie (total|lateral)", r"\bcaras?\b"],
    "m1-transformaciones": [r"plano cartesiano", r"coordenad", r"vector", r"traslacion", r"rotacion", r"reflexion",
                            r"simetri", r"isometri", r"eje de simetria"],
    "m1-triangulos": [r"semejan", r"escala\b", r"\btales\b", r"thales", r"maqueta", r"sombra", r"homolog", r"ampliacion",
                      r"reduccion", r"plano a escala"],
    "m1-tendencia": [r"\bmedia\b", r"promedio", r"\bmoda\b", r"frecuencia", r"grafico", r"encuesta", r"tabla", r"datos"],
    "m1-posicion": [r"percentil", r"cuartil", r"quintil", r"diagrama de (caja|cajon)", r"mediana", r"\bq_?[123]\b"],
    "m1-probabilidad": [r"probabilidad", r"\bazar\b", r"\bdado", r"moneda", r"extrae", r"ruleta", r"\burna\b",
                        r"al menos", r"regla (aditiva|multiplicativa)"],
    # ── M2 ──
    "m2-reales": [r"\braiz", r"racionaliz", r"irracional", r"\breal", r"potencia", r"aproxima", r"\\sqrt", r"decimal"],
    "m2-logaritmos": [r"\blog", r"logaritm"],
    "m2-financiera": [r"interes", r"compuesto", r"capital", r"porcentaje", r"%", r"credito", r"deposit", r"\btasa",
                      r"\bafp\b", r"jubilacion", r"hipotecari", r"cuota"],
    "m2-sistemas": [r"sistema", r"dos ecuaciones", r"infinitas soluciones", r"no tiene solucion", r"solucion unica",
                    r"unica solucion", r"rectas paralelas"],
    "m2-exponencial": [r"exponencial", r"crecimiento", r"decrecimiento", r"bacteria", r"poblacion", r"logaritmica",
                       r"funcion potencia"],
    "m2-funciones-trig": [r"funcion (seno|coseno|trigonometrica)", r"\bperiodo", r"amplitud", r"sin\s*\(\s*x", r"cos\s*\(\s*x",
                          r"marea", r"periodica"],
    "m2-cuadraticas": [r"cuadratica", r"discriminante", r"x\^2", r"x\^\{2\}", r"parabola", r"segundo grado", r"vertice",
                       r"inecuacion", r"ecuacion", r"factoriz"],
    "m2-inversa": [r"inversa", r"composicion", r"\\circ", r"f\^\{-1\}", r"f\^-1", r"biyectiv", r"inyectiv", r"sobreyectiv"],
    "m2-homotecia": [r"homotecia", r"semejan", r"razon de", r"escala", r"\btales\b", r"centro de homotecia"],
    "m2-trigonometria": [r"\bseno", r"coseno", r"tangente", r"\\sin", r"\\cos", r"\\tan", r"\bsen\b", r"\bcos\b", r"\btan\b",
                         r"angulo de (elevacion|depresion)", r"triangulo rectangulo"],
    "m2-circunferencia": [r"circunferencia", r"angulo inscrito", r"angulo del centro", r"\barco", r"\bcuerdas?\b",
                          r"secante", r"inscrit"],
    "m2-esfera": [r"esfera", r"semiesfera", r"\bpelota", r"\bbalon"],
    "m2-analitica": [r"\brecta", r"pendiente", r"distancia entre", r"punto medio", r"plano cartesiano", r"vector",
                     r"perpendicular", r"paralela"],
    "m2-dispersion": [r"desviacion", r"varianza", r"dispersion", r"\brango\b", r"\bmedia\b", r"promedio", r"percentil"],
    "m2-condicional": [r"condicional", r"dado que", r"sabiendo que", r"independiente", r"probabilidad"],
    "m2-combinatoria": [r"permutac", r"combinac", r"maneras", r"formas distintas", r"de cuantas formas", r"factorial"],
    "m2-modelos": [r"binomial", r"distribucion normal", r"\bnormal\b", r"campana", r"valor esperado", r"esperanza",
                   r"\bz\s*=", r"estandariz"],
    # ── Lectora (se mira sobre todo la pregunta) ──
    "cl-localizar": [r"segun el texto", r"de acuerdo con", r"se afirma", r"se menciona", r"se senala", r"informacion"],
    "cl-inferencia": [r"se infiere", r"se deduce", r"se puede concluir", r"por que", r"causa", r"razon", r"relacion",
                      r"consecuencia", r"se desprende"],
    "cl-vocabulario": [r"sentido", r"significa", r"se refiere", r"expresion", r"palabra", r"termino", r"reemplaz", r"sinonimo"],
    "cl-idea-central": [r"\btema\b", r"idea central", r"idea principal", r"sintesis", r"resum", r"titulo", r"de que trata",
                        r"jerarquia", r"idea mas importante"],
    "cl-proposito": [r"funcion", r"que funcion", r"para que se", r"con que (proposito|finalidad) se (incluye|menciona|cita|utiliza|alude|presenta)",
                     r"se (incluye|menciona|cita) .{0,40}(para|con el fin)", r"\bparrafo", r"fragmento", r"la cita", r"el ejemplo"],
    "cl-literario": [r"narrador", r"personaje", r"hablante", r"poema", r"\bverso", r"estrofa", r"cuento", r"novela", r"relato"],
    "cl-intencion": [r"proposito (comunicativo|principal|del texto|de la carta|del articulo|de la columna|del afiche|de la noticia|de la entrevista|del reportaje)",
                     r"intencion", r"que (busca|pretende)", r"finalidad (del|de la) (texto|carta|columna|noticia)",
                     r"(principal )?proposito del (emisor|autor)", r"para que (fue escrito|se escribio)"],
    "cl-argumentos": [r"argument", r"tesis", r"contraargument", r"opinion", r"valid", r"apoy", r"refut",
                      r"falacia", r"suficien", r"consisten", r"credibilidad"],
    "cl-forma": [r"pertinen", r"eficacia", r"adecuad", r"recurso", r"estructura", r"organiza", r"lenguaje", r"registro"],
    "cl-postura": [r"actitud", r"\btono\b", r"postura", r"que piensa (el|la)", r"valoracion", r"ironi", r"punto de vista",
                   r"posicion (del|de la)"],
    "cl-multimodal": [r"infografia", r"grafico", r"tabla", r"imagen", r"esquema", r"recuadro", r"ilustracion", r"afiche"],
    "cl-contextos": [r"situacion(es)? (que )?(ilustra|ejemplifica|se relaciona)", r"cual(es)? de las siguientes situaciones",
                     r"texto 2", r"ambos textos", r"ambos fragmentos", r"nuevo contexto", r"en que (caso|situacion)",
                     r"otro texto", r"podria (aplicarse|relacionarse)"],
    # ── Ciencias: Biología ──
    "cs-celula": [r"celula", r"celular", r"organelo", r"membrana", r"mitocondria", r"ribosoma", r"\bnucleo\b", r"tejido",
                  r"golgi", r"reticulo", r"lisosoma", r"pared celular", r"procariont", r"eucariont", r"enterocito",
                  r"osmosis", r"transporte", r"microorganismo", r"bacteria", r"vacuola", r"citoesqueleto"],
    "cs-nervioso": [r"neurona", r"sinapsis", r"impulso nervioso", r"neurotransmisor", r"reflejo", r"medula espinal",
                    r"sistema nervioso", r"cerebr", r"\baxon", r"dendrita", r"droga", r"alcohol", r"cafe", r"\bsueno\b",
                    r"estimulo"],
    "cs-reproduccion": [r"fecundacion", r"ovulo", r"ovocito", r"espermatozoide", r"ciclo (menstrual|ovarico|uterino)",
                        r"ovulacion", r"utero", r"endometrio", r"anticoncep", r"preservativo", r"condon",
                        r"control de (la )?natalidad", r"\bits\b", r"\bvih\b", r"gonorrea", r"clamidia", r"herpes",
                        r"sexual", r"embarazo", r"estrogeno", r"progesterona", r"\bfsh\b", r"\blh\b", r"testosterona",
                        r"gameto"],
    "cs-genetica": [r"mitosis", r"meiosis", r"ciclo celular", r"interfase", r"cromatina", r"cromosoma", r"cancer",
                    r"transgenic", r"manipulacion genetica", r"ingenieria genetica", r"recombinante", r"clonacion",
                    r"profase", r"metafase", r"anafase", r"telofase", r"entrecruzamiento", r"cromatida"],
    "cs-evolucion": [r"evolucion", r"especie", r"seleccion natural", r"darwin", r"fosil", r"biodiversidad", r"adaptacion",
                     r"lamarck", r"wallace", r"homolog", r"analog", r"ancestr", r"resistencia a"],
    "cs-ecologia": [r"fotosintesis", r"clorofila", r"cloroplasto", r"respiracion celular", r"autotrof", r"heterotrof",
                    r"flujo de energia", r"nivel trofico", r"productor", r"cadena trofica", r"ciclo del carbono",
                    r"dioxido de carbono", r"\bco_?2", r"estoma", r"intensidad (de la )?luz"],
    "cs-biomoleculas": [r"proteina", r"enzima", r"lipido", r"carbohidrato", r"aminoacido", r"sustrato", r"desnaturaliz",
                        r"vitamina", r"nutriente", r"metabolismo", r"\batp\b"],
    "cs-sistemas": [r"hormona", r"insulina", r"glucagon", r"glicemia", r"tiroides", r"sangre", r"corazon", r"inmun",
                    r"anticuerpo", r"vacuna", r"digest", r"renal", r"\brinon", r"homeostasis", r"respiratori"],
    "cs-poblaciones": [r"poblacion", r"comunidad", r"depredador", r"\bpresa", r"competencia", r"mutualismo",
                       r"comensalismo", r"parasit", r"tasa de natalidad", r"crecimiento poblacional", r"ecosistema"],
    # ── Ciencias: Física ──
    "cs-luz": [r"\bluz\b", r"espejo", r"\blente", r"refraccion", r"reflexion", r"\bcolor", r"optic", r"prisma", r"\bfoco",
               r"electromagnetic", r"espectro", r"rayos x", r"ultravioleta", r"infrarroj", r"microonda", r"\bradio\b",
               r"laser", r"fibra optica", r"doppler", r"difraccion", r"interferencia", r"\bimagen"],
    "cs-cinematica": [r"velocidad", r"rapidez", r"aceleracion", r"posicion", r"desplazamiento", r"trayectoria",
                      r"itinerario", r"\bmrua?\b", r"km/h", r"m/s", r"sistema de referencia"],
    "cs-dinamica": [r"fuerza", r"newton", r"\bmasa\b", r"\bpeso\b", r"\broce", r"\bnormal\b", r"tension", r"resorte",
                    r"hooke", r"cuerpo libre", r"inercia", r"accion y reaccion"],
    "cs-universo": [r"planeta", r"sistema solar", r"galaxia", r"universo", r"big bang", r"big crunch", r"estrella",
                    r"kepler", r"copernico", r"ptolomeo", r"galileo", r"heliocentr", r"geocentr", r"orbita",
                    r"\bluna\b", r"astro", r"corrimiento al rojo"],
    "cs-tierra": [r"sism", r"terremoto", r"tsunami", r"placa", r"tectonic", r"subduccion", r"volcan", r"magma", r"manto",
                  r"nucleo (terrestre|interno|externo)", r"corteza", r"litosfera", r"astenosfera", r"deriva continental",
                  r"wegener", r"epicentro", r"hipocentro", r"richter", r"mercalli", r"geosfera", r"cordillera"],
    "cs-electricidad": [r"electric", r"corriente", r"voltaje", r"resistenc", r"circuito", r"\bohm", r"ampere", r"\bkwh\b",
                        r"\bwatt", r"consumo", r"eficiencia energetica", r"enchufe", r"fusible", r"ampolleta", r"bateria",
                        r"\bpila\b", r"instalacion"],
    "cs-ondas": [r"sonido", r"decibel", r"\beco\b", r"ultrasonid", r"\btono\b", r"timbre", r"\bcuerda", r"\btubo",
                 r"acustic", r"audible", r"onda mecanica", r"medio material", r"\boido"],
    "cs-energia": [r"energia (cinetica|potencial|mecanica)", r"trabajo mecanico", r"\bcalor", r"temperatura", r"dilatacion",
                   r"termometr", r"conduccion", r"conveccion", r"calor especifico", r"presion", r"fluido", r"densidad",
                   r"\bflot", r"empuje", r"arquimedes", r"pascal", r"hidrostatic", r"\bjoule"],
    # ── Ciencias: Química ──
    "cs-atomo": [r"\batomo", r"proton", r"neutron", r"electron", r"isotop", r"modelo atomico", r"rutherford", r"\bbohr",
                 r"thomson", r"dalton", r"numero (atomico|masico)", r"mezcla", r"sustancia pura", r"homogene",
                 r"heterogene", r"decantacion", r"filtracion", r"destilacion", r"tamizado", r"separacion",
                 r"punto de (ebullicion|fusion)"],
    "cs-organica": [r"organic", r"hidrocarburo", r"alcano", r"alqueno", r"alquino", r"alcohol", r"aldehido", r"cetona",
                    r"ester", r"amina", r"amida", r"carbono", r"grupo funcional", r"isomer", r"\bcadena", r"benceno",
                    r"aromatic", r"nomenclatura", r"eter\b", r"acido carboxilico", r"hibridacion"],
    "cs-reacciones": [r"reaccion", r"estequiometr", r"\bmol\b", r"\bmoles\b", r"masa molar", r"reactivo limitante",
                      r"balance", r"coeficiente", r"conservacion de la (masa|materia)", r"lavoisier", r"proust",
                      r"proporciones (definidas|multiples)", r"formula (empirica|molecular)", r"composicion porcentual",
                      r"rendimiento", r"reactante"],
    "cs-disoluciones": [r"disolucion", r"solucion", r"soluto", r"solvente", r"disolvente", r"concentracion", r"molaridad",
                        r"molalidad", r"fraccion molar", r"%\s*m", r"\bppm\b", r"dilu", r"solubilidad", r"saturad",
                        r"coligativ", r"punto de congelacion"],
    "cs-enlace": [r"enlace", r"covalente", r"ionico", r"metalico", r"lewis", r"geometria molecular", r"polaridad",
                  r"electronegatividad", r"configuracion electronica", r"tabla periodica", r"radio atomico",
                  r"ionizacion", r"electrones de valencia", r"intermolecular", r"puente de hidrogeno"],
    # ── Historia ──
    "hi-revoluciones": [r"revolucion francesa", r"ilustracion", r"liberalismo", r"liberal", r"nacionalismo",
                        r"estado-?nacion", r"unificacion", r"republican", r"siglo xix", r"independencias? (de america|hispanoamericana|americana)",
                        r"revolucion industrial", r"imperialismo"],
    "hi-chile-xix": [r"independencia", r"republica", r"portales", r"1833", r"araucania", r"guerra del pacifico", r"colonial",
                     r"ensayos constitucionales", r"conservador", r"salitre", r"exportacion", r"trigo", r"plata",
                     r"organizacion de la republica"],
    "hi-cuestion-social": [r"cuestion social", r"obrer", r"huelga", r"mancomunal", r"parlamentari", r"conventillo",
                           r"1891", r"leyes sociales", r"1920", r"1924"],
    "hi-guerras": [r"primera guerra mundial", r"segunda guerra mundial", r"guerra mundial", r"nazi", r"fascis", r"totalitari",
                   r"crisis de 1929", r"gran depresion", r"populismo", r"estado de bienestar", r"keynes", r"peron",
                   r"estado liberal", r"entreguerras"],
    "hi-guerra-fria": [r"guerra fria", r"\burss\b", r"sovietic", r"bipolar", r"revolucion cubana", r"naciones unidas", r"\bonu\b",
                       r"declaracion universal", r"descoloniz", r"muro de berlin", r"globalizacion", r"alianza para el progreso",
                       r"seguridad nacional", r"america latina"],
    "hi-chile-xx": [r"estado de compromiso", r"frente popular", r"corfo", r"\bisi\b", r"sustitucion de importaciones",
                    r"reforma agraria", r"chilenizacion", r"nacionalizacion del cobre", r"unidad popular", r"allende",
                    r"\bfrei\b", r"alessandri", r"voto femenino", r"campamento", r"poblaciones", r"migracion campo"],
    "hi-dictadura": [r"dictadura", r"golpe de estado", r"1973", r"pinochet", r"junta militar", r"derechos humanos",
                     r"desaparecid", r"rettig", r"valech", r"plebiscito", r"1988", r"transicion", r"constitucion de 1980",
                     r"neoliberal", r"privatiz", r"chicago", r"protesta", r"aylwin", r"concertacion"],
    "hi-democracia": [r"democracia", r"ciudadan", r"participacion", r"\bvoto", r"eleccion", r"partido", r"pluralismo",
                      r"estado de derecho", r"libertades"],
    "hi-estado": [r"\bestado\b", r"constitucion", r"poder ejecutivo", r"poder legislativo", r"congreso", r"presidente",
                  r"\bley\b", r"municip", r"gobierno regional", r"contraloria", r"servel", r"institucion"],
    "hi-informacion": [r"medios de comunicacion", r"redes sociales", r"internet", r"noticias? falsas?", r"fake news",
                       r"desinformacion", r"prensa", r"libertad de expresion", r"algoritmo", r"datos personales",
                       r"privacidad", r"tecnologia", r"digital"],
    "hi-justicia": [r"tribunal", r"\bjuez", r"poder judicial", r"corte suprema", r"fiscal", r"ministerio publico",
                    r"defensoria", r"reforma procesal", r"juicio", r"imputado", r"acceso a la justicia",
                    r"tribunal constitucional"],
    "hi-mercado": [r"mercado", r"precio", r"oferta", r"demanda", r"escasez", r"costo de oportunidad", r"consumidor", r"empresa",
                   r"monopolio", r"colusion", r"competencia", r"bienes"],
    "hi-macro": [r"inflacion", r"\bpib\b", r"banco central", r"tasa de interes", r"credito", r"ahorro", r"inversion",
                 r"impuesto", r"politica (fiscal|monetaria|economica)", r"modelo de desarrollo", r"crecimiento economico",
                 r"desarrollo sustentable", r"medioambient"],
    "hi-laborales": [r"trabaj", r"empleo", r"sindicat", r"derechos laborales", r"codigo del trabajo", r"direccion del trabajo",
                     r"contrato", r"sueldo minimo", r"salario", r"jornada", r"cotizacion", r"seguro de cesantia",
                     r"plataformas", r"teletrabajo", r"informal", r"negociacion colectiva"],
    "hi-geografia": [r"poblacion", r"territorio", r"region", r"migra", r"urban", r"rural", r"clima", r"recursos naturales",
                     r"medio ambiente", r"riesgo", r"ciudad", r"piramide", r"geograf", r"relieve"],
}

# Formas de pregunta que pertenecen a los ejes transversales.
SUFICIENCIA = re.compile(r"cada una por si sola|se requiere informacion adicional|ambas juntas|\(1\) por si sola")
HABILIDADES = re.compile(
    r"precaucion (debe|deberia)|al repetir el (procedimiento|experimento)|preguntas? de investigacion"
    r"|objetivo de (la |esta )?investigacion|objetivo de investigacion|(presenta|corresponde a) una conclusion"
    r"|informacion (necesita|se necesita|necesaria) para (corroborar|comprobar)|error (del|en el) diseno"
    r"|explicacion de la diferencia entre (ambos|los) experimentos|resultados? se deberia(n)? obtener"
    r"|permitiria (mostrar|comprobar|determinar|verificar)|acciones? permitiria"
    r"|se puede responder (directamente )?con la informacion|"
    r"hipotesis|variable (independiente|dependiente|controlada)|variables? (del|de este|de la|en el|en la) (experimento|investigacion|estudio)"
    r"|problema de investigacion|pregunta de investigacion|procedimiento experimental|diseno experimental|grupo control"
    r"|corresponde a una (ley|teoria|conclusion|inferencia|observacion)|es una (ley|teoria|conclusion|inferencia)"
)
FUENTES = re.compile(
    r"tipo de fuente|fuente (primaria|secundaria)|historiograf|historiador|interpretacion(es)? (historica|de los)"
    r"|segun (su|la|esta) interpretacion|(postura|perspectiva|vision) del autor|el autor de (la|esta) (fuente|caricatura)"
    r"|caricatura|se (puede )?desprende(r)? de (la|esta) fuente|evidencia en (la|esta) fuente|la fuente (corresponde|es una)"
)
# Señales inequívocas: deciden el subtema aunque el eje heurístico de la pregunta sea otro (solo Matemática).
STRONG: list[tuple[str, str, re.Pattern[str]]] = [(subj, sid, re.compile(rx)) for subj, sid, rx in [
    ("m2", "m2-logaritmos", r"\blog\b|\blog_|\\log|logaritm"),
    ("m2", "m2-combinatoria", r"de cuantas (maneras|formas)|(maneras|formas) distintas|combinac|permutac|factorial|"
                              r"\\binom\{\d+\}\{\d+\}(?!.*p\^)"),
    ("m2", "m2-funciones-trig", r"funcion(es)? (seno|coseno|trigonometrica)|f\(x\) ?= ?[\d,.]*\s*\\?(sin|cos|sen)\b"),
    ("m2", "m2-trigonometria", r"\bseno\b|coseno|trigonom|\\sin|\\cos|\\tan\b|\bsen\s*\(?[a-z0-9α-ω]"),
    ("m2", "m2-homotecia", r"homotecia"),
    ("m2", "m2-esfera", r"esfera"),
    ("m2", "m2-circunferencia", r"angulo inscrito|angulo del centro|cuerdas? |secantes?\b"),
    ("m2", "m2-exponencial", r"exponencial|duplica su cantidad|se duplica cada|se triplica cada"),
    ("m2", "m2-inversa", r"funcion inversa|f\^\{-1\}|composicion de funciones|\\circ"),
    ("m2", "m2-financiera", r"interes (compuesto|simple)"),
    ("m2", "m2-modelos", r"binomial|distribucion normal|distribuye normal"),
    ("m2", "m2-condicional", r"probabilidad condicional"),
    ("m2", "m2-dispersion", r"desviacion estandar|varianza"),
    ("m2", "m2-sistemas", r"infinitas soluciones|no tiene solucion|solucion unica|unica solucion"),
    ("m1", "m1-posicion", r"percentil|cuartil|quintil|diagramas? de (cajon|caja)"),
    ("m1", "m1-cuadratica", r"cuadratica|parabola"),
    ("m1", "m1-sistemas", r"sistema de ecuaciones"),
    ("m1", "m1-potencias", r"notacion cientifica"),
    ("m1", "m1-probabilidad", r"probabilidad"),
    ("m2", "m2-condicional", r"probabilidad"),
]]
SCIENCE_STRONG: list[tuple[str, str, re.Pattern[str]]] = [(axis, sid, re.compile(rx)) for axis, sid, rx in [
    ("Biología", "cs-ecologia", r"fotosint|cloroplasto|clorofila|ciclo de calvin|autotrof"),
    ("Biología", "cs-nervioso", r"sinapsis|neurona|neurotransmisor|arco reflejo|impulso nervioso|medula espinal"),
    ("Biología", "cs-reproduccion", r"ciclo (menstrual|ovarico|uterino)|anticoncep|transmision sexual|fecundacion"
                                    r"|ovulacion|metodos? de control de (la )?natalidad"),
    ("Biología", "cs-genetica", r"mitosis|meiosis|ciclo celular|transgenic|manipulacion genetica|ingenieria genetica"),
    ("Física", "cs-universo", r"galaxia|big bang|sistema solar|kepler|heliocentr|geocentr|copernico|ptolomeo|planeta"),
    ("Física", "cs-tierra", r"tectonic|sism|volcan|deriva continental|subduccion|placa de nazca|epicentro|hipocentro"
                            r"|\brocas?\b|geosfera"),
    ("Química", "cs-organica", r"enlaces? (simples?|dobles?|triples?)|longitud de enlace|energia de enlace"
                               r"|angulo de enlace|hibridacion|numero (correcto )?de enlaces"),
    ("Química", "cs-atomo", r"punto de (fusion|ebullicion)|temperaturas? de (fusion|ebullicion)|separacion de mezclas"
                            r"|destilacion|decantacion|filtracion"),
]]
# Historia: temas del temario 2027 que las etiquetas del extractor confundían con «Estado» o «Democracia».
HISTORY_STRONG: list[tuple[str, re.Pattern[str]]] = [(sid, re.compile(rx)) for sid, rx in [
    ("hi-justicia", r"poder judicial|tribunal(es)? (de justicia|de garantia|oral)|corte suprema|ministerio publico|fiscalia"
                    r"|defensoria|reforma procesal|acceso a la justicia|sistema judicial"),
    ("hi-informacion", r"medios de comunicacion|redes sociales|noticias falsas|desinformacion|libertad de (expresion|prensa)"
                       r"|sociedad de la informacion|datos personales"),
    ("hi-laborales", r"derechos laborales|sindica|codigo del trabajo|direccion del trabajo|negociacion colectiva"),
    ("hi-dictadura", r"dictadura militar|golpe de estado|pinochet|plebiscito de 1988|transicion a la democracia|rettig|valech"),
]]
MULTIMODAL = re.compile(r"infografia|grafico|tabla|esquema|recuadro|ilustracion|afiche|diagrama|imagen|fotografia|mapa\b")
# Etiquetas de tema tan generales que no ayudan a elegir subtema.
GENERIC = {norm(x) for x in [
    "Números", "Álgebra y funciones", "Geometría", "Probabilidad y estadística", "Interpretar", "Localizar", "Evaluar",
    "Biología", "Física", "Química", "Química general", "Procesos históricos", "Historia",
    "Historia: mundo, América y Chile", "Economía", "Funciones", "Probabilidad",
]}
# Respaldo cuando nada distingue a un subtema dentro del eje.
FALLBACK = {
    ("m1", "Números"): "m1-racionales", ("m1", "Álgebra y funciones"): "m1-expresiones",
    ("m1", "Geometría"): "m1-areas", ("m1", "Probabilidad y estadística"): "m1-tendencia",
    ("m2", "Números"): "m2-reales", ("m2", "Álgebra y funciones"): "m2-cuadraticas",
    ("m2", "Geometría"): "m2-homotecia", ("m2", "Probabilidad y estadística"): "m2-dispersion",
    ("lectora", "Localizar"): "cl-localizar", ("lectora", "Interpretar"): "cl-inferencia", ("lectora", "Evaluar"): "cl-argumentos",
    ("ciencias", "Biología"): "cs-celula", ("ciencias", "Física"): "cs-dinamica", ("ciencias", "Química"): "cs-reacciones",
    ("historia", "Historia: mundo, América y Chile"): "hi-chile-xx", ("historia", "Formación ciudadana"): "hi-estado",
    ("historia", "Sistema económico"): "hi-mercado", ("historia", "Geografía y espacio"): "hi-geografia",
}
# Subtemas transversales: no cambian el eje de la pregunta (una pregunta de fuentes sigue siendo de su eje histórico).
TRANSVERSAL = {"m2-suficiencia", "cs-habilidades", "hi-fuentes"}
AXIS_OF: dict[str, str] = {}
COMPILED = {k: [re.compile(p) for p in v] for k, v in KEYWORDS.items()}


def question_sentence(stem: str) -> str:
    """La oración interrogativa final (en Lectora y Ciencias define el tipo de pregunta)."""
    s = norm(stem)
    i = s.rfind("¿")
    return s[i:] if i >= 0 else s[-260:]


# Desde la Admisión 2026 el temario es el vigente (el de 2027 solo reordena textos): toda pregunta de esas pruebas se
# desprende de él, así que no puede caer en un subtema no vigente. Las anteriores sí pueden (calor, sonido, geografía…).
CURRENT_FROM = 2026


def is_current(exam: dict) -> bool:
    return (exam.get("admissionYear") or CURRENT_FROM) >= CURRENT_FROM


def classify(subject: str, q: dict, temario: dict, current: bool = True) -> str:
    ejes = temario["ejes"]
    stem = q.get("stem", "")
    options = " ".join(o.get("text", "") for o in q.get("options", []))
    text = norm(stem + " " + options)
    ask = question_sentence(stem)

    if subject == "m2" and SUFICIENCIA.search(text):
        return "m2-suficiencia"
    for subj, sid, rx in STRONG:
        if subj == subject and rx.search(text):
            return sid
    if subject == "ciencias" and HABILIDADES.search(ask):
        return "cs-habilidades"
    if subject == "historia":
        for sid, rx in HISTORY_STRONG:
            if rx.search(text):
                return sid
    if subject == "ciencias":
        for axis, sid, rx in SCIENCE_STRONG:
            if axis == q.get("axis") and rx.search(text):
                return sid
    if subject == "historia" and FUENTES.search(ask):
        return "hi-fuentes"
    # Lectora: si la pregunta remite a un recurso gráfico, es lectura de un texto discontinuo o multimodal.
    if subject == "lectora" and MULTIMODAL.search(ask):
        return "cl-multimodal"

    # En Ciencias el eje (Biología, Física o Química) sale de la posición en el folleto y es fiable: los candidatos son
    # los subtemas de ese eje. En el resto, el eje lo infirió el extractor: se consideran todos los subtemas de la
    # asignatura y el eje original solo suma un punto a los suyos (así un subtema puede cambiar de eje en el temario).
    eje = next((e for e in ejes if e["nombre"] == q.get("axis")), None)
    axis_of = {s["id"]: e["nombre"] for e in ejes for s in e["subtemas"]}
    if subject == "ciencias" and eje:
        pool = [s for s in eje["subtemas"] if s["labels"]]
    else:
        pool = [s for e in ejes for s in e["subtemas"] if s["labels"]]
    if current:
        pool = [s for s in pool if s.get("vigente", True)]
    if len(pool) == 1:
        return pool[0]["id"]

    topic = norm(q.get("topic", ""))
    scores: dict[str, float] = {}
    for sub in pool:
        labels = [norm(x) for x in sub["labels"]]
        score = 0.0
        if not sub.get("vigente", True):
            # Fuera del temario vigente: sin las etiquetas del extractor ni el bono de eje, y con una pequeña
            # penalización. Solo gana si sus propias palabras clave dominan (calor, sonido, geografía…).
            own = ask if subject == "lectora" else text
            scores[sub["id"]] = sum(1 for rx in COMPILED.get(sub["id"], []) if rx.search(own)) - 0.5
            continue
        if topic and topic not in GENERIC:
            if topic in labels:
                score += 3
            elif any(lab in topic or topic in lab for lab in labels):
                score += 2
        # En Lectora pesa la pregunta; en el resto, todo el enunciado y las alternativas.
        haystack = ask if subject == "lectora" else text
        score += sum(1 for rx in COMPILED.get(sub["id"], []) if rx.search(haystack))
        if subject == "lectora":
            score += 0.25 * sum(1 for rx in COMPILED.get(sub["id"], []) if rx.search(text))
        if score > 0 and subject != "ciencias" and axis_of[sub["id"]] == q.get("axis"):
            score += 1
        scores[sub["id"]] = score
    best = max(scores.values())
    if best <= 0:
        fallback = FALLBACK.get((subject, q.get("axis")), pool[0]["id"])
        return fallback if fallback in {s["id"] for s in pool} else pool[0]["id"]
    # Empate: gana el primero en el orden del temario.
    return next(s["id"] for s in pool if scores[s["id"]] == best)


def pdf_pages(subject: str) -> dict[str, int]:
    """Página de cada subtema en el compendio, leída del índice (marcadores) del PDF compilado."""
    path = PDFS / f"guia_{subject}.pdf"
    if not path.exists():
        return {}
    try:
        import pymupdf  # type: ignore
    except ImportError:
        return {}
    with pymupdf.open(path) as doc:
        return {norm(title): page for level, title, page in doc.get_toc() if level == 2}


def build_temario() -> tuple[dict, dict]:
    index, notes = [], {}
    for subject in SUBJECTS:
        t = load(subject)
        pages = pdf_pages(subject)
        ejes = []
        for e in t["ejes"]:
            subs = []
            for s in e["subtemas"]:
                entry = {"id": s["id"], "title": s["titulo"]}
                if not s.get("vigente", True):
                    entry["retired"] = True
                page = pages.get(norm(s["titulo"]))
                if page:
                    entry["pdfPage"] = page
                subs.append(entry)
                notes[s["id"]] = {
                    "theory": s["teoria"],
                    "box": {"kind": s["caja"]["tipo"], "title": s["caja"]["titulo"], "body": s["caja"]["contenido"]},
                    "keyIdeas": s["claves"],
                    "method": s["metodo"],
                    "traps": s["trampas"],
                }
            ejes.append({"name": e["nombre"], "description": e["descripcion"], "subtopics": subs})
        index.append({"subject": subject, "name": t["nombre"], "pdf": f"/pdfs/guia_{subject}.pdf", "axes": ejes})
    return {"subjects": index}, notes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sample", type=str, default="", help="imprime las preguntas asignadas a este subtema")
    args = ap.parse_args()

    index, notes = build_temario()
    temarios = {s: load(s) for s in SUBJECTS}
    AXIS_OF.update({sub["id"]: e["nombre"] for t in temarios.values() for e in t["ejes"] for sub in e["subtemas"]})
    counts: Counter[str] = Counter()
    samples: list[str] = []
    changed_files = 0
    for path in sorted(EXAMS.glob("*/*.json")):
        exam = json.loads(path.read_text(encoding="utf-8"))
        if "questions" not in exam:
            continue
        changed = False
        for q in exam["questions"]:
            sub = classify(exam["subject"], q, temarios[exam["subject"]], is_current(exam))
            counts[sub] += 1
            if args.sample and sub == args.sample:
                samples.append(f"{q['id']:34} [{q.get('topic')}] {norm(q['stem'])[:110]}")
            if q.get("subtopic") != sub:
                q["subtopic"] = sub
                changed = True
            # Fuera de Ciencias, el eje de la pregunta sigue al de su subtema (el del extractor era una suposición).
            axis = AXIS_OF[sub]
            if exam["subject"] != "ciencias" and sub not in TRANSVERSAL and q.get("axis") != axis:
                q["axis"] = axis
                changed = True
        if changed and not args.dry_run:
            path.write_text(json.dumps(exam, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
            changed_files += 1

    by_subject: dict[str, list[str]] = defaultdict(list)
    for s in index["subjects"]:
        for e in s["axes"]:
            for sub in e["subtopics"]:
                sub["questionCount"] = counts.get(sub["id"], 0)
                by_subject[s["subject"]].append(f"{sub['id']}={counts.get(sub['id'], 0)}")
    if not args.dry_run:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        (OUT / "notes.json").write_text(json.dumps(notes, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    total_subs = sum(len(e["subtopics"]) for s in index["subjects"] for e in s["axes"])
    print(f"Temario: {total_subs} subtemas; {sum(counts.values())} preguntas asignadas; {changed_files} ensayos actualizados")
    for subject, items in by_subject.items():
        print(f"  {subject:9} " + "  ".join(items))
    empty = [k for s in index["subjects"] for e in s["axes"] for k in [x["id"] for x in e["subtopics"]] if not counts.get(k)]
    if empty:
        print("  Subtemas sin preguntas: " + ", ".join(empty))
    for line in samples:
        print("   ", line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
