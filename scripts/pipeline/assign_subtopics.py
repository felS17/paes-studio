#!/usr/bin/env python3
"""Temario DEMRE (67 subtemas) → datos de la app + subtema de cada pregunta del banco.

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
    "m1-proporcionalidad": [r"proporcional", r"\brazon", r"escala", r"directamente", r"inversamente", r"por cada",
                            r"trabajadores", r"rendimiento", r"\bonza", r"\bml\b", r"receta"],
    "m1-expresiones": [r"expresion algebraica", r"factoriz", r"reducir", r"producto notable", r"binomio", r"\bmodel",
                       r"representa", r"expresion"],
    "m1-ecuaciones": [r"ecuacion", r"inecuacion", r"intervalo", r"desigualdad", r"despej", r"solucion de la"],
    "m1-sistemas": [r"sistema de ecuaciones", r"sistema", r"dos ecuaciones"],
    "m1-funcion-afin": [r"funcion", r"pendiente", r"\brecta", r"\bf\(x\)", r"dominio", r"recorrido", r"\blineal", r"\bafin",
                        r"cargo fijo", r"tarifa", r"grafico de la"],
    "m1-cuadratica": [r"cuadratica", r"parabola", r"vertice", r"x\^2", r"x\^\{2\}", r"concavidad"],
    "m1-areas": [r"\barea", r"perimetro", r"volumen", r"\bcubo", r"prisma", r"cilindro", r"cuadrado", r"rectangul",
                 r"circulo", r"circunferencia", r"poligono", r"\bcono", r"esfera", r"\bcm\b", r"trapecio", r"rombo"],
    "m1-triangulos": [r"triangulo", r"angulo", r"pitagoras", r"semejan", r"hipotenusa", r"cateto", r"\btales\b", r"isosceles",
                      r"equilatero"],
    "m1-transformaciones": [r"plano cartesiano", r"coordenad", r"vector", r"traslacion", r"rotacion", r"reflexion",
                            r"simetri", r"isometr", r"\beje x", r"\beje y", r"giro"],
    "m1-tendencia": [r"\bmedia\b", r"promedio", r"mediana", r"\bmoda\b", r"frecuencia", r"grafico", r"encuesta",
                     r"muestra", r"tabla", r"datos"],
    "m1-posicion": [r"percentil", r"cuartil", r"\brango\b", r"desviacion", r"dispersion", r"diagrama de caja",
                    r"quintil", r"posicion"],
    "m1-probabilidad": [r"probabilidad", r"\bazar\b", r"\bdado", r"moneda", r"extrae", r"ruleta", r"\burna\b",
                        r"equiprobable", r"evento", r"sucesos?\b"],
    # ── M2 ──
    "m2-reales": [r"\braiz", r"racionaliz", r"irracional", r"\breal", r"potencia", r"aproxima", r"\\sqrt", r"decimal",
                  r"fraccion", r"\bentero"],
    "m2-logaritmos": [r"\blog", r"logaritm"],
    "m2-financiera": [r"interes", r"compuesto", r"capital", r"porcentaje", r"%", r"credito", r"deposit", r"\btasa",
                      r"pesos", r"ahorro", r"dinero", r"precio"],
    "m2-cuadraticas": [r"cuadratica", r"discriminante", r"x\^2", r"x\^\{2\}", r"sistema", r"inecuacion", r"ecuacion",
                       r"parabola", r"vertice", r"factoriz"],
    "m2-exponencial": [r"exponencial", r"crecimiento", r"decrecimiento", r"bacteria", r"poblacion", r"logaritmica",
                       r"\d\^\{?x", r"\d\^\{?t", r"duplica", r"se triplica"],
    "m2-inversa": [r"inversa", r"composicion", r"\\circ", r"f\^\{-1\}", r"f\^-1", r"biyectiv", r"inyectiv", r"sobreyectiv",
                   r"funcion", r"f\(g\("],
    "m2-trigonometria": [r"\bseno", r"coseno", r"tangente", r"\\sin", r"\\cos", r"\\tan", r"\bsen\b", r"\bcos\b", r"\btan\b",
                         r"trigonom", r"elevacion", r"depresion", r"triangulo rectangulo", r"angulo", r"triangulo", r"pitagoras"],
    "m2-homotecia": [r"homotecia", r"semejan", r"razon de", r"escala", r"\btales\b", r"volumen", r"\barea", r"\bcono",
                     r"esfera", r"cilindro", r"prisma", r"cuerpo", r"circunferencia", r"circulo", r"cuadrilatero", r"perimetro"],
    "m2-analitica": [r"\brecta", r"pendiente", r"distancia entre", r"punto medio", r"plano cartesiano", r"vector",
                     r"coordenad", r"traslacion", r"rotacion", r"reflexion", r"ecuacion de la recta"],
    "m2-condicional": [r"condicional", r"binomial", r"dado que", r"sabiendo que", r"variable aleatoria", r"independiente",
                       r"probabilidad", r"\bazar\b", r"\bdado", r"moneda", r"extrae"],
    "m2-dispersion": [r"desviacion", r"varianza", r"\bnormal\b", r"dispersion", r"\bmedia\b", r"promedio", r"percentil",
                      r"cuartil", r"\brango\b", r"muestra", r"datos", r"mediana", r"\bmoda\b", r"frecuencia", r"grafico", r"tabla"],
    "m2-combinatoria": [r"permutac", r"combinac", r"maneras", r"formas distintas", r"de cuantas formas", r"factorial",
                        r"ordenar", r"\bclaves?\b", r"contrasena", r"\d+!"],
    # ── Lectora (se mira sobre todo la pregunta) ──
    "cl-localizar": [r"segun el texto", r"de acuerdo con", r"se afirma", r"se menciona", r"se senala", r"informacion"],
    "cl-vocabulario": [r"sentido", r"significa", r"se refiere", r"expresion", r"palabra", r"termino", r"reemplaz", r"sinonimo",
                       r"entre comillas", r"subrayad"],
    "cl-idea-central": [r"\btema\b", r"idea central", r"idea principal", r"sintesis", r"resum", r"titulo", r"de que trata",
                        r"principalmente"],
    "cl-proposito": [r"proposito", r"funcion", r"finalidad", r"para que", r"objetivo", r"con que fin", r"intencion"],
    "cl-inferencia": [r"se infiere", r"se deduce", r"se puede concluir", r"por que", r"causa", r"razon", r"relacion",
                      r"consecuencia", r"se desprende", r"inferir", r"conclu"],
    "cl-literario": [r"narrador", r"personaje", r"hablante", r"poema", r"\bverso", r"estrofa", r"cuento", r"novela",
                     r"lirico", r"protagonista", r"obra", r"relato"],
    "cl-multimodal": [r"infografia", r"grafico", r"tabla", r"imagen", r"esquema", r"recuadro", r"ilustracion", r"afiche",
                      r"figura", r"diagrama"],
    "cl-argumentos": [r"argument", r"postura", r"tesis", r"contraargument", r"opinion", r"valid", r"apoy", r"refut",
                      r"juicio", r"evalua", r"critic", r"actitud", r"perspectiva", r"emisor frente", r"respalda", r"contraste"],
    "cl-forma": [r"pertinen", r"eficacia", r"adecuad", r"recurso", r"estructura", r"organiza", r"lenguaje", r"finalidad",
                 r"\busa\b", r"\bcita", r"inclu", r"comillas", r"seccion", r"titulo", r"termino", r"formato"],
    # ── Ciencias: Biología ──
    "cs-celula": [r"celula", r"celular", r"organelo", r"membrana", r"mitocondria", r"ribosoma", r"nucleo", r"tejido",
                  r"bacteria", r"microorganismo", r"\bvirus", r"osmosis", r"difusion", r"citoplasma", r"cloroplasto",
                  r"reticulo", r"golgi", r"lisosoma", r"pared celular", r"procariont", r"eucariont", r"hongo"],
    "cs-biomoleculas": [r"proteina", r"enzima", r"lipido", r"carbohidrato", r"glucosa", r"\batp\b", r"fotosintesis",
                        r"respiracion celular", r"metabolismo", r"aminoacido", r"sustrato", r"nutriente", r"almidon",
                        r"biomolecula", r"vitamina", r"fermentacion"],
    "cs-genetica": [r"\bgen\b", r"\bgenes\b", r"\badn\b", r"\barn\b", r"cromosoma", r"mitosis", r"meiosis", r"herencia",
                    r"alelo", r"mutacion", r"genotipo", r"fenotipo", r"cariotipo", r"replicacion", r"gameto", r"hereditari",
                    r"homocigot", r"heterocigot", r"dominante", r"recesiv", r"ciclo celular", r"genetic"],
    "cs-evolucion": [r"evolucion", r"especie", r"seleccion natural", r"darwin", r"fosil", r"biodiversidad", r"adaptacion",
                     r"filogen", r"especiacion", r"lamarck", r"ancestro", r"variabilidad"],
    "cs-sistemas": [r"hormona", r"insulina", r"glucagon", r"nervio", r"neurona", r"organo", r"sangre", r"inmun",
                    r"anticuerpo", r"vacuna", r"homeostasis", r"digestiv", r"\brinon", r"corazon", r"reproduct",
                    r"menstrual", r"testosterona", r"estrogeno", r"progesterona", r"glicemia", r"sinapsis", r"linfocito",
                    r"\bpresion arterial", r"pancreas", r"hipofisis", r"tiroides"],
    "cs-ecologia": [r"ecosistema", r"poblacion", r"comunidad", r"trama", r"cadena trofica", r"productor", r"consumidor",
                    r"ciclo del", r"\bplanta", r"ambiente", r"depredador", r"competencia", r"nicho", r"trofic",
                    r"descomponedor", r"biomasa", r"especie invasora", r"habitat"],
    # ── Ciencias: Física ──
    "cs-ondas": [r"\bonda", r"sonido", r"frecuencia", r"longitud de onda", r"sism", r"amplitud", r"\bperiodo", r"\beco\b",
                 r"decibel", r"epicentro", r"hipocentro", r"resonancia", r"\bhz\b", r"vibra", r"tsunami"],
    "cs-luz": [r"\bluz\b", r"espejo", r"\blente", r"refraccion", r"reflexion", r"\bcolor", r"optic", r"prisma", r"\bfoco",
               r"rayo de luz", r"luminos", r"\bimagen"],
    "cs-cinematica": [r"velocidad", r"rapidez", r"aceleracion", r"posicion", r"desplazamiento", r"trayectoria",
                      r"movimiento rectilineo", r"\bmru", r"km/h", r"m/s", r"itinerario", r"distancia recorrida", r"caida libre"],
    "cs-dinamica": [r"fuerza", r"newton", r"\bmasa\b", r"\bpeso\b", r"\broce", r"\bnormal\b", r"presion", r"fluido",
                    r"densidad", r"empuje", r"arquimedes", r"pascal", r"inercia", r"accion y reaccion", r"torque", r"hooke",
                    r"resorte", r"impulso", r"momentum"],
    "cs-energia": [r"energia", r"trabajo", r"potencia", r"\bcalor", r"temperatura", r"dilatacion", r"cinetica",
                   r"potencial", r"termic", r"termometro", r"celsius", r"kelvin", r"cambio de fase", r"calor especifico",
                   r"\bjoule", r"conduccion", r"conveccion", r"radiacion", r"equilibrio termico"],
    "cs-electricidad": [r"electric", r"corriente", r"voltaje", r"resistencia", r"circuito", r"\bcarga", r"\bohm", r"magnet",
                        r"\biman", r"campo", r"induccion", r"ampere", r"\bvolt", r"conductor", r"aislante", r"electriza",
                        r"ampolleta", r"bateria", r"pila\b"],
    # ── Ciencias: Química ──
    "cs-atomo": [r"\batomo", r"proton", r"neutron", r"electron", r"isotop", r"modelo atomico", r"rutherford", r"\bbohr",
                 r"thomson", r"dalton", r"configuracion electronica", r"tabla periodica", r"numero atomico", r"masico",
                 r"electronegatividad", r"radio atomico", r"\bion\b", r"\biones\b", r"periodo", r"\bgrupo"],
    "cs-enlace": [r"enlace", r"covalente", r"ionico", r"metalico", r"lewis", r"molecula", r"geometria molecular", r"polar",
                  r"puente de hidrogeno", r"intermolecular", r"compuesto", r"nomenclatura", r"electrones de valencia",
                  r"hibrida"],
    "cs-organica": [r"organic", r"hidrocarburo", r"alcano", r"alqueno", r"alquino", r"alcohol", r"aldehido", r"cetona",
                    r"acido carboxilico", r"\bester", r"amina", r"amida", r"grupo funcional", r"isomer", r"polimer", r"benceno",
                    r"aromatic", r"\bch_?\{?3", r"carbono"],
    "cs-reacciones": [r"reaccion", r"estequiometr", r"\bmol\b", r"\bmoles\b", r"masa molar", r"reactivo limitante",
                      r"ecuacion quimica", r"balance", r"rendimiento", r"\bgas", r"volumen molar", r"redox", r"oxidacion",
                      r"reduccion", r"conservacion de la masa", r"lavoisier", r"producto", r"reactante", r"combustion"],
    "cs-disoluciones": [r"disolucion", r"solucion", r"soluto", r"solvente", r"disolvente", r"concentracion", r"molaridad",
                        r"\bmolar", r"\bph\b", r"\bacid", r"\bbase", r"basic", r"neutraliz", r"dilucion", r"solubilidad",
                        r"coligativ", r"ebullicion", r"congelacion", r"osmotica", r"m/v", r"\bppm", r"indicador"],
    # ── Historia ──
    "hi-revoluciones": [r"revolucion francesa", r"revolucion industrial", r"liberalismo", r"nacionalismo", r"ilustracion",
                        r"imperialismo", r"europa", r"siglo xix", r"napoleon", r"burgues", r"proletari", r"colonialismo",
                        r"revolucion", r"industrializacion", r"socialismo", r"marx"],
    "hi-chile-xix": [r"independencia", r"republica", r"portales", r"1833", r"araucania", r"guerra del pacifico", r"colonial",
                     r"conquista", r"cabildo", r"patria vieja", r"patria nueva", r"organizacion de la republica", r"o'higgins",
                     r"1891", r"balmaceda", r"virreinato", r"criollo", r"liberales", r"conservadores", r"siglo xix"],
    "hi-cuestion-social": [r"cuestion social", r"obrer", r"huelga", r"mancomunal", r"parlamentari", r"salitre", r"1920",
                           r"alessandri", r"sufragio femenino", r"conventillo", r"legislacion social", r"oligarquia",
                           r"centenario"],
    "hi-guerras": [r"primera guerra mundial", r"segunda guerra mundial", r"guerra mundial", r"nazi", r"fascis", r"totalitari",
                   r"crisis de 1929", r"gran depresion", r"holocausto", r"entreguerras", r"hitler", r"1929", r"crac"],
    "hi-guerra-fria": [r"guerra fria", r"\burss\b", r"sovietic", r"bipolar", r"revolucion cubana", r"dictadura",
                       r"golpe de estado", r"seguridad nacional", r"muro de berlin", r"descolonizacion", r"capitalismo y comunismo",
                       r"comunis", r"alianza para el progreso"],
    "hi-chile-xx": [r"estado de compromiso", r"frente popular", r"corfo", r"\bisi\b", r"sustitucion de importaciones",
                    r"reforma agraria", r"unidad popular", r"allende", r"1973", r"pinochet", r"regimen militar", r"transicion",
                    r"plebiscito", r"1988", r"concertacion", r"neoliberal", r"constitucion de 1980", r"cobre", r"siglo xx",
                    r"frei", r"1990"],
    "hi-estado": [r"estado", r"constitucion", r"poder ejecutivo", r"poder legislativo", r"poder judicial", r"congreso",
                  r"tribunal", r"\bley", r"gobierno", r"municipal", r"soberania", r"presidente", r"contraloria", r"senado",
                  r"camara de diputados", r"ministerio", r"servicio electoral", r"institucion"],
    "hi-democracia": [r"democracia", r"derecho", r"ciudadan", r"participacion", r"\bvoto", r"eleccion", r"partido",
                      r"derechos humanos", r"sociedad civil", r"deberes", r"inclusion", r"discriminacion", r"libertad",
                      r"igualdad", r"plebiscito", r"organizaciones"],
    "hi-mercado": [r"mercado", r"precio", r"oferta", r"demanda", r"escasez", r"costo de oportunidad", r"consumidor", r"empresa",
                   r"competencia", r"monopolio", r"trabajo", r"empleo", r"bienes", r"necesidades", r"agentes economicos",
                   r"publicidad", r"consumo"],
    "hi-macro": [r"inflacion", r"\bpib\b", r"banco central", r"tasa de interes", r"credito", r"ahorro", r"inversion",
                 r"impuesto", r"\bipc\b", r"comercio exterior", r"exportac", r"importac", r"presupuesto", r"deuda", r"\bafp\b",
                 r"financ", r"politica monetaria", r"politica fiscal", r"desempleo", r"tipo de cambio"],
    "hi-geografia": [r"poblacion", r"territorio", r"region", r"migra", r"urban", r"rural", r"clima", r"recursos naturales",
                     r"medio ambiente", r"espacio geografico", r"ciudad", r"riesgo", r"paisaje", r"desastre", r"censo"],
}

# Formas de pregunta que pertenecen a los ejes transversales.
SUFICIENCIA = re.compile(r"cada una por si sola|se requiere informacion adicional|ambas juntas|\(1\) por si sola")
HABILIDADES = re.compile(
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
                              r"cuantos (grupos|equipos|codigos|numeros distintos|arreglos)|se pueden formar|ordenar(se)? en (una )?fila"),
    ("m2", "m2-trigonometria", r"\bseno\b|coseno|trigonom|\\sin|\\cos|\\tan\b|\bsen\s*\(?[a-z0-9α-ω]"),
    ("m2", "m2-homotecia", r"homotecia"),
    ("m2", "m2-exponencial", r"exponencial|duplica su cantidad|se duplica cada|se triplica cada"),
    ("m2", "m2-inversa", r"funcion inversa|f\^\{-1\}|composicion de funciones|\\circ"),
    ("m2", "m2-financiera", r"interes (compuesto|simple)"),
    ("m2", "m2-condicional", r"probabilidad condicional|binomial"),
    ("m2", "m2-dispersion", r"desviacion estandar|varianza|distribucion normal|diagramas? de (cajon|caja)"),
    ("m1", "m1-posicion", r"percentil|cuartil|quintil|diagramas? de (cajon|caja)"),
    ("m1", "m1-cuadratica", r"cuadratica|parabola"),
    ("m1", "m1-sistemas", r"sistema de ecuaciones"),
    ("m1", "m1-potencias", r"notacion cientifica"),
    ("m1", "m1-probabilidad", r"probabilidad"),
    ("m2", "m2-condicional", r"probabilidad"),
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
    ("lectora", "Interpretar"): "cl-inferencia", ("lectora", "Evaluar"): "cl-argumentos",
    ("ciencias", "Biología"): "cs-celula", ("ciencias", "Física"): "cs-dinamica", ("ciencias", "Química"): "cs-reacciones",
    ("historia", "Historia: mundo, América y Chile"): "hi-chile-xx", ("historia", "Formación ciudadana"): "hi-estado",
    ("historia", "Sistema económico"): "hi-mercado", ("historia", "Geografía y espacio"): "hi-geografia",
}
COMPILED = {k: [re.compile(p) for p in v] for k, v in KEYWORDS.items()}


def question_sentence(stem: str) -> str:
    """La oración interrogativa final (en Lectora y Ciencias define el tipo de pregunta)."""
    s = norm(stem)
    i = s.rfind("¿")
    return s[i:] if i >= 0 else s[-260:]


def classify(subject: str, q: dict, temario: dict) -> str:
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
    if subject == "historia" and FUENTES.search(ask):
        return "hi-fuentes"
    # Lectora: si la pregunta remite a un recurso gráfico, es lectura de un texto discontinuo o multimodal.
    if subject == "lectora" and MULTIMODAL.search(ask):
        return "cl-multimodal"

    eje = next((e for e in ejes if e["nombre"] == q.get("axis")), None)
    pool = [s for s in (eje["subtemas"] if eje else [s for e in ejes for s in e["subtemas"]]) if s["labels"]]
    if len(pool) == 1:
        return pool[0]["id"]

    topic = norm(q.get("topic", ""))
    scores: dict[str, float] = {}
    for sub in pool:
        labels = [norm(x) for x in sub["labels"]]
        score = 0.0
        if topic and topic not in GENERIC:
            if topic in labels:
                score += 6
            elif any(lab in topic or topic in lab for lab in labels):
                score += 4
        # En Lectora pesa la pregunta; en el resto, todo el enunciado y las alternativas.
        haystack = ask if subject == "lectora" else text
        score += sum(1 for rx in COMPILED.get(sub["id"], []) if rx.search(haystack))
        if subject == "lectora":
            score += 0.25 * sum(1 for rx in COMPILED.get(sub["id"], []) if rx.search(text))
        scores[sub["id"]] = score
    best = max(scores.values())
    if best <= 0:
        return FALLBACK.get((subject, q.get("axis")), pool[0]["id"])
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
    counts: Counter[str] = Counter()
    samples: list[str] = []
    changed_files = 0
    for path in sorted(EXAMS.glob("*/*.json")):
        exam = json.loads(path.read_text(encoding="utf-8"))
        if "questions" not in exam:
            continue
        changed = False
        for q in exam["questions"]:
            sub = classify(exam["subject"], q, temarios[exam["subject"]])
            counts[sub] += 1
            if args.sample and sub == args.sample:
                samples.append(f"{q['id']:34} [{q.get('topic')}] {norm(q['stem'])[:110]}")
            if q.get("subtopic") != sub:
                q["subtopic"] = sub
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
