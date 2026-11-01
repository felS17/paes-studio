"""Metadatos por asignatura (duración oficial, ejes temáticos) y clasificación heurística de preguntas."""

from __future__ import annotations

import re
import unicodedata

SUBJECTS: dict[str, dict] = {
    "m1": {"name": "Competencia Matemática 1 (M1)", "official_minutes": 140, "official_questions": 65},
    "m2": {"name": "Competencia Matemática 2 (M2)", "official_minutes": 140, "official_questions": 55},
    "lectora": {"name": "Competencia Lectora", "official_minutes": 150, "official_questions": 65},
    "ciencias": {"name": "Ciencias", "official_minutes": 160, "official_questions": 80},
    "historia": {"name": "Historia y Ciencias Sociales", "official_minutes": 120, "official_questions": 65},
}

AREAS = {"biologia": "Biología", "fisica": "Física", "quimica": "Química", "tp": "Técnico Profesional"}
MODALITIES = {"regular": "Regular", "invierno": "Invierno"}


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _score(text: str, keywords: list[str]) -> int:
    return sum(len(re.findall(r"\b" + k, text)) for k in keywords)


MATH_AXES: dict[str, list[str]] = {
    "Números": [
        "porcentaje", "%", "racional", "irracional", "potencia", "raiz", "raices", "decimal", "fraccion",
        "entero", "interes", "proporcion", "razon", "logaritmo", "aproxim", "redonde", "numero real",
        "recta numerica", "\\$", "precio", "descuento",
    ],
    "Álgebra y funciones": [
        "funcion", "ecuacion", "inecuacion", "sistema", "expresion algebraica", "factoriz", "lineal",
        "cuadratic", "parabola", "pendiente", "grafico de la funcion", "variable", "f\\(", "dominio",
        "recorrido", "exponencial", "intervalo", "solucion",
    ],
    "Geometría": [
        "triangulo", "angulo", "area", "perimetro", "volumen", "circunferencia", "circulo", "rectangulo",
        "cuadrado", "vector", "traslacion", "rotacion", "reflexion", "homotecia", "semejan", "pitagoras",
        "plano cartesiano", "poligono", "cilindro", "cono", "esfera", "cubo", "prisma", "trazo", "figura",
    ],
    "Probabilidad y estadística": [
        "probabilidad", "promedio", "media", "mediana", "moda", "frecuencia", "muestra", "datos",
        "grafico", "tabla", "encuesta", "azar", "dado", "moneda", "percentil", "cuartil", "desviacion",
        "rango", "diagrama", "aleatori", "evento", "binomial", "normal",
    ],
}

LECTORA_SKILLS: dict[str, list[str]] = {
    "Localizar": [
        "segun el texto", "de acuerdo con el texto", "segun el", "que informacion", "se menciona",
        "se afirma", "se senala", "segun lo", "de acuerdo con lo", "cual de las siguientes opciones se",
    ],
    "Interpretar": [
        "proposito", "idea central", "idea principal", "se infiere", "inferir", "funcion", "sentido",
        "significa", "sintesis", "tema", "relacion", "por que", "interpret", "se puede concluir",
        "caracteriza", "sustituir", "reemplaz",
    ],
    "Evaluar": [
        "evalua", "juicio", "opinion", "pertinen", "critic", "argument", "valid", "postura",
        "de acuerdo", "contradice", "refuta", "apoya", "fortalece", "debilita", "eficaz", "adecuad",
    ],
}

SCIENCE_AREAS: dict[str, list[str]] = {
    "Biología": [
        "celula", "celular", "adn", "arn", "gen", "cromosoma", "proteina", "enzima", "organismo", "especie",
        "hormona", "tejido", "organo", "sistema nervioso", "ecosistema", "poblacion", "fotosintesis",
        "respiracion celular", "mitosis", "meiosis", "herencia", "evolucion", "bacteria", "virus",
        "glucosa", "insulina", "sangre", "planta", "animal", "inmun", "nutriente", "membrana",
    ],
    "Física": [
        "velocidad", "aceleracion", "fuerza", "energia", "onda", "frecuencia", "sonido", "luz", "lente",
        "espejo", "carga", "corriente", "voltaje", "resistencia", "circuito", "calor", "temperatura",
        "presion", "masa", "newton", "movimiento", "trabajo", "potencia", "sismo", "magnet", "fluido",
        "densidad", "rapidez", "joule", "watt", "m/s",
    ],
    "Química": [
        "atomo", "molecula", "enlace", "reaccion", "solucion", "disolucion", "mol", "ph", "acido", "base",
        "compuesto", "carbono", "electron", "proton", "neutron", "isotopo", "orbital", "hibridacion",
        "estequiometr", "concentracion", "soluto", "solvente", "oxidacion", "quimic", "organic",
        "polimero", "elemento", "tabla periodica", "gas", "ebullicion",
    ],
}

HISTORY_AXES: dict[str, list[str]] = {
    "Formación ciudadana": [
        "constitucion", "derecho", "democracia", "ciudadan", "estado", "ley", "poder", "eleccion",
        "voto", "tribunal", "congreso", "parlamento", "participacion", "institucion", "gobierno",
        "municipal", "soberania", "partido",
    ],
    "Sistema económico": [
        "economi", "mercado", "precio", "oferta", "demanda", "inflacion", "pib", "consumidor", "banco",
        "credito", "ahorro", "inversion", "empresa", "trabajo", "salario", "impuesto", "exportacion",
        "importacion", "comercio", "renta", "desempleo",
    ],
    "Historia: mundo, América y Chile": [
        "siglo", "guerra", "revolucion", "independencia", "colonial", "republica", "imperio", "dictadura",
        "historia", "periodo", "epoca", "reforma", "conquista", "crisis", "movimiento", "proceso",
        "mundial", "fria", "transicion",
    ],
    "Geografía y espacio": [
        "territorio", "region", "migracion", "poblacion", "urban", "rural", "clima", "recurso",
        "ambiental", "espacio geografico", "ciudad", "densidad", "paisaje", "riesgo", "natural",
    ],
}


def classify(subject: str, area: str | None, text: str) -> tuple[str, str]:
    """Devuelve (eje, tema) estimados para una pregunta. El tema es la palabra clave dominante."""
    t = _norm(text)
    table_name = {"m1": "math", "m2": "math"}.get(subject, subject)
    if subject in ("m1", "m2"):
        table = MATH_AXES
    elif subject == "lectora":
        table = LECTORA_SKILLS
    elif subject == "ciencias":
        table = SCIENCE_AREAS
    else:
        table = HISTORY_AXES
    scores = {axis: _score(t, kws) for axis, kws in table.items()}
    axis = max(scores, key=lambda a: scores[a])
    if scores[axis] == 0:
        axis = {
            "m1": "Números",
            "m2": "Álgebra y funciones",
            "lectora": "Interpretar",
            "ciencias": AREAS.get(area or "", "Química") if area != "tp" else "Física",
            "historia": "Historia: mundo, América y Chile",
        }[subject]
    best_kw = max(table[axis], key=lambda k: len(re.findall(r"\b" + k, t)))
    topic = topic_label(best_kw, axis, table_name) if re.search(r"\b" + best_kw, t) else axis
    return axis, topic


AREA_KEYS = {"biologia": "Biología", "fisica": "Física", "quimica": "Química"}


def science_blocks(area: str, texts_by_number: dict[int, str]) -> dict[int, str]:
    """Asigna el área de cada bloque del Módulo Común (1–18, 19–36, 37–54) por votación de palabras clave.

    Estructura declarada en los folletos de 80 preguntas: 54 del Módulo Común (18 por área; el primer
    bloque es el área de la prueba) y 26 del Módulo Electivo (55–80, área de la prueba). El orden de las
    otras dos áreas varía entre años, por eso se decide con la evidencia de todo el bloque.
    """
    own = AREA_KEYS[area]
    result: dict[int, str] = {}
    remaining = [a for a in SCIENCE_AREAS if a != own]
    blocks = [(19, 36), (37, 54)]
    votes = []
    for lo, hi in blocks:
        text = _norm(" ".join(t for n, t in texts_by_number.items() if lo <= n <= hi))
        votes.append({a: _score(text, SCIENCE_AREAS[a]) for a in remaining})
    # Asignación conjunta: la permutación de las dos áreas restantes con más votos.
    a, b = remaining
    keep = votes[0][a] + votes[1][b] >= votes[0][b] + votes[1][a]
    order = [a, b] if keep else [b, a]
    for n in texts_by_number:
        if 1 <= n <= 18 or n >= 55:
            result[n] = own
        elif 19 <= n <= 36:
            result[n] = order[0]
        elif 37 <= n <= 54:
            result[n] = order[1]
    return result


def topic_within(axis: str, table_name: str, text: str) -> str:
    table = {"ciencias": SCIENCE_AREAS}[table_name]
    t = _norm(text)
    kws = table.get(axis, [])
    if not kws:
        return axis
    best = max(kws, key=lambda k: len(re.findall(r"\b" + k, t)))
    return topic_label(best, axis, table_name) if re.search(r"\b" + best, t) else axis


# Etiquetas legibles para las raíces de palabras clave (el tema visible en la app y en las guías).
TOPIC_LABELS: dict[str, dict[str, str]] = {
    "math": {
        "porcentaje": "Porcentajes", "%": "Porcentajes", "racional": "Números racionales", "irracional": "Números irracionales",
        "potencia": "Potencias", "raiz": "Raíces", "raices": "Raíces", "decimal": "Números decimales", "fraccion": "Fracciones",
        "entero": "Números enteros", "interes": "Interés", "proporcion": "Proporcionalidad", "razon": "Razones",
        "logaritmo": "Logaritmos", "aproxim": "Aproximación", "redonde": "Redondeo", "numero real": "Números reales",
        "recta numerica": "Recta numérica", "$": "Problemas con dinero", "precio": "Problemas con dinero", "descuento": "Porcentajes",
        "funcion": "Funciones", "ecuacion": "Ecuaciones", "inecuacion": "Inecuaciones", "sistema": "Sistemas de ecuaciones",
        "expresion algebraica": "Expresiones algebraicas", "factoriz": "Factorización", "lineal": "Función lineal y afín",
        "cuadratic": "Función cuadrática", "parabola": "Función cuadrática", "pendiente": "Pendiente de una recta",
        "grafico de la funcion": "Gráficos de funciones", "variable": "Modelamiento con variables", "f(": "Funciones",
        "dominio": "Dominio y recorrido", "recorrido": "Dominio y recorrido", "exponencial": "Función exponencial",
        "intervalo": "Intervalos", "solucion": "Ecuaciones",
        "triangulo": "Triángulos", "angulo": "Ángulos", "area": "Áreas", "perimetro": "Perímetros", "volumen": "Volúmenes",
        "circunferencia": "Circunferencia y círculo", "circulo": "Circunferencia y círculo", "rectangulo": "Cuadriláteros",
        "cuadrado": "Cuadriláteros", "vector": "Vectores", "traslacion": "Transformaciones isométricas",
        "rotacion": "Transformaciones isométricas", "reflexion": "Transformaciones isométricas", "homotecia": "Homotecia",
        "semejan": "Semejanza", "pitagoras": "Teorema de Pitágoras", "plano cartesiano": "Plano cartesiano",
        "poligono": "Polígonos", "cilindro": "Cuerpos geométricos", "cono": "Cuerpos geométricos", "esfera": "Cuerpos geométricos",
        "cubo": "Cuerpos geométricos", "prisma": "Cuerpos geométricos", "trazo": "Trazos y segmentos", "figura": "Figuras planas",
        "probabilidad": "Probabilidad", "promedio": "Medidas de tendencia central", "media": "Medidas de tendencia central",
        "mediana": "Medidas de tendencia central", "moda": "Medidas de tendencia central", "frecuencia": "Tablas de frecuencia",
        "muestra": "Muestreo", "datos": "Análisis de datos", "grafico": "Gráficos estadísticos", "tabla": "Tablas de datos",
        "encuesta": "Análisis de datos", "azar": "Probabilidad", "dado": "Probabilidad", "moneda": "Probabilidad",
        "percentil": "Medidas de posición", "cuartil": "Medidas de posición", "desviacion": "Medidas de dispersión",
        "rango": "Medidas de dispersión", "diagrama": "Gráficos estadísticos", "aleatori": "Variable aleatoria",
        "evento": "Probabilidad", "binomial": "Modelo binomial", "normal": "Distribución normal",
        "funcion": "Funciones", "solucion": "Ecuaciones", "potencia": "Potencias", "precio": "Problemas con dinero",
    },
    "lectora": {
        "segun el texto": "Información explícita", "de acuerdo con el texto": "Información explícita", "segun el": "Información explícita",
        "que informacion": "Información explícita", "se menciona": "Información explícita", "se afirma": "Información explícita",
        "se senala": "Información explícita", "segun lo": "Información explícita", "de acuerdo con lo": "Información explícita",
        "cual de las siguientes opciones se": "Información explícita",
        "proposito": "Propósito", "idea central": "Idea central", "idea principal": "Idea central", "se infiere": "Inferencias",
        "inferir": "Inferencias", "funcion": "Función de un fragmento", "sentido": "Sentido de expresiones",
        "significa": "Sentido de expresiones", "sintesis": "Síntesis", "tema": "Tema", "relacion": "Relación entre ideas",
        "por que": "Causas y razones", "interpret": "Interpretación", "se puede concluir": "Conclusiones",
        "caracteriza": "Caracterización", "sustituir": "Vocabulario contextual", "reemplaz": "Vocabulario contextual",
        "evalua": "Evaluación", "juicio": "Juicios sobre el texto", "opinion": "Opiniones", "pertinen": "Pertinencia",
        "critic": "Postura crítica", "argument": "Argumentación", "valid": "Validez de afirmaciones", "postura": "Postura del emisor",
        "de acuerdo": "Postura del emisor", "contradice": "Contraargumentos", "refuta": "Contraargumentos",
        "apoya": "Apoyo a una tesis", "fortalece": "Apoyo a una tesis", "debilita": "Contraargumentos", "eficaz": "Eficacia comunicativa",
        "adecuad": "Adecuación",
        "funcion": "Función de un fragmento",
    },
    "ciencias": {
        "celula": "Célula", "celular": "Célula", "adn": "ADN y genética", "arn": "ADN y genética", "gen": "Genética",
        "cromosoma": "Cromosomas", "proteina": "Proteínas", "enzima": "Enzimas", "organismo": "Organismos", "especie": "Especies",
        "hormona": "Hormonas", "tejido": "Tejidos", "organo": "Órganos y sistemas", "sistema nervioso": "Sistema nervioso",
        "ecosistema": "Ecosistemas", "poblacion": "Poblaciones", "fotosintesis": "Fotosíntesis", "respiracion celular": "Respiración celular",
        "mitosis": "División celular", "meiosis": "División celular", "herencia": "Herencia", "evolucion": "Evolución",
        "bacteria": "Microorganismos", "virus": "Microorganismos", "glucosa": "Metabolismo", "insulina": "Regulación hormonal",
        "sangre": "Sistema circulatorio", "planta": "Plantas", "animal": "Animales", "inmun": "Sistema inmune",
        "nutriente": "Nutrición", "membrana": "Membrana celular",
        "velocidad": "Cinemática", "aceleracion": "Cinemática", "fuerza": "Fuerzas y leyes de Newton", "energia": "Energía",
        "onda": "Ondas", "sonido": "Sonido", "luz": "Luz y óptica", "lente": "Luz y óptica", "espejo": "Luz y óptica",
        "carga": "Electricidad", "corriente": "Electricidad", "voltaje": "Electricidad", "resistencia": "Circuitos eléctricos",
        "circuito": "Circuitos eléctricos", "calor": "Calor y temperatura", "temperatura": "Calor y temperatura",
        "presion": "Presión y fluidos", "masa": "Masa y peso", "newton": "Fuerzas y leyes de Newton", "movimiento": "Cinemática",
        "trabajo": "Trabajo y potencia", "potencia": "Trabajo y potencia", "sismo": "Sismos", "magnet": "Magnetismo",
        "fluido": "Presión y fluidos", "densidad": "Densidad", "rapidez": "Cinemática", "joule": "Energía", "watt": "Trabajo y potencia",
        "m/s": "Cinemática",
        "atomo": "Modelos atómicos", "molecula": "Moléculas", "enlace": "Enlace químico", "reaccion": "Reacciones químicas",
        "solucion": "Disoluciones", "disolucion": "Disoluciones", "mol": "Estequiometría", "ph": "Ácidos y bases",
        "acido": "Ácidos y bases", "base": "Ácidos y bases", "compuesto": "Compuestos", "carbono": "Química orgánica",
        "electron": "Estructura atómica", "proton": "Estructura atómica", "neutron": "Estructura atómica", "isotopo": "Isótopos",
        "orbital": "Configuración electrónica", "hibridacion": "Química orgánica", "estequiometr": "Estequiometría",
        "concentracion": "Disoluciones", "soluto": "Disoluciones", "solvente": "Disoluciones", "oxidacion": "Óxido-reducción",
        "quimic": "Química general", "organic": "Química orgánica", "polimero": "Polímeros", "elemento": "Tabla periódica",
        "tabla periodica": "Tabla periódica", "gas": "Gases", "ebullicion": "Propiedades coligativas",
        "frecuencia": "Ondas", "movimiento": "Cinemática", "trabajo": "Trabajo y potencia",
    },
    "historia": {
        "constitucion": "Constitución", "derecho": "Derechos", "democracia": "Democracia", "ciudadan": "Ciudadanía",
        "estado": "Estado", "ley": "Leyes", "poder": "Poderes del Estado", "eleccion": "Elecciones", "voto": "Elecciones",
        "tribunal": "Tribunales", "congreso": "Congreso", "parlamento": "Congreso", "participacion": "Participación",
        "institucion": "Instituciones", "gobierno": "Gobierno", "municipal": "Municipios", "soberania": "Soberanía", "partido": "Partidos políticos",
        "economi": "Economía", "mercado": "Mercado", "precio": "Precios", "oferta": "Oferta y demanda", "demanda": "Oferta y demanda",
        "inflacion": "Inflación", "pib": "PIB", "consumidor": "Consumo", "banco": "Sistema financiero", "credito": "Crédito",
        "ahorro": "Ahorro", "inversion": "Inversión", "empresa": "Empresas", "salario": "Trabajo", "impuesto": "Impuestos",
        "exportacion": "Comercio exterior", "importacion": "Comercio exterior", "comercio": "Comercio", "renta": "Renta",
        "desempleo": "Empleo",
        "siglo": "Procesos históricos", "guerra": "Guerras", "revolucion": "Revoluciones", "independencia": "Independencia",
        "colonial": "Período colonial", "republica": "República", "imperio": "Imperios", "dictadura": "Dictaduras",
        "historia": "Historia", "periodo": "Procesos históricos", "epoca": "Procesos históricos", "reforma": "Reformas",
        "conquista": "Conquista", "crisis": "Crisis", "movimiento": "Movimientos sociales", "proceso": "Procesos históricos",
        "mundial": "Guerras mundiales", "fria": "Guerra Fría", "transicion": "Transición",
        "territorio": "Territorio", "region": "Regiones", "migracion": "Migraciones", "urban": "Espacio urbano",
        "rural": "Espacio rural", "clima": "Clima", "recurso": "Recursos naturales", "ambiental": "Medio ambiente",
        "espacio geografico": "Espacio geográfico", "ciudad": "Ciudades", "riesgo": "Riesgos naturales", "natural": "Medio natural",
        "paisaje": "Paisaje",
        "trabajo": "Trabajo", "poblacion": "Población", "movimiento": "Movimientos sociales",
    },
}

def topic_label(keyword: str, axis: str, table: str) -> str:
    """Etiqueta legible del tema; las raíces se interpretan según la asignatura (p. ej. «potencia»)."""
    return TOPIC_LABELS[table].get(keyword.replace("\\", "").strip().lower(), axis)
