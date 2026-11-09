import type { CheatCard, SheetId } from '@/types/cheatsheets'

const r = String.raw

export const SHEETS: { id: SheetId; label: string }[] = [
  { id: 'm1', label: 'Matemática M1' },
  { id: 'm2', label: 'Matemática M2' },
  { id: 'fisica', label: 'Física' },
  { id: 'quimica', label: 'Química' },
  { id: 'biologia', label: 'Biología' },
  { id: 'lectora', label: 'Lectora' },
  { id: 'historia', label: 'Historia' },
]

/** Fórmulas, leyes y propiedades críticas para repasar antes de un ensayo. */
export const CHEAT_CARDS: CheatCard[] = [
  // ─────────────────────────────── Matemática M1 ───────────────────────────────
  {
    id: 'm1-fracciones', sheet: 'm1', axis: 'Números', title: 'Fracciones y operatoria', subtopics: ['m1-racionales'],
    rows: [
      ['Suma', r`$\dfrac{a}{b}+\dfrac{c}{d}=\dfrac{ad+bc}{bd}$`],
      ['Producto', r`$\dfrac{a}{b}\cdot\dfrac{c}{d}=\dfrac{ac}{bd}$`],
      ['División', r`$\dfrac{a}{b}:\dfrac{c}{d}=\dfrac{a}{b}\cdot\dfrac{d}{c}$`],
      ['Decimal periódico', r`$0{,}\overline{3}=\dfrac{3}{9}$ y $0{,}\overline{12}=\dfrac{12}{99}$`],
      ['Prioridad', 'Paréntesis, potencias, multiplicación y división, adición y sustracción.'],
    ],
  },
  {
    id: 'm1-porcentajes', sheet: 'm1', axis: 'Números', title: 'Porcentajes', subtopics: ['m1-porcentajes', 'm2-financiera'],
    rows: [
      ['Calcular', r`$p\%$ de $x=\dfrac{p}{100}\cdot x$`],
      ['Aumentar', r`$x\left(1+\dfrac{p}{100}\right)$`],
      ['Disminuir', r`$x\left(1-\dfrac{p}{100}\right)$`],
      ['Variación', r`$\dfrac{\text{final}-\text{inicial}}{\text{inicial}}\cdot 100$`],
      ['Cambios sucesivos', r`Se multiplican: subir y luego bajar un 10 % deja $0{,}99x$, no $x$.`],
    ],
  },
  {
    id: 'm1-potencias', sheet: 'm1', axis: 'Números', title: 'Potencias', subtopics: ['m1-potencias', 'm2-reales'],
    rows: [
      ['Igual base', r`$a^m\cdot a^n=a^{m+n}$ y $\dfrac{a^m}{a^n}=a^{m-n}$`],
      ['Potencia de potencia', r`$(a^m)^n=a^{m\cdot n}$`],
      ['Igual exponente', r`$(ab)^n=a^n b^n$ y $\left(\dfrac{a}{b}\right)^n=\dfrac{a^n}{b^n}$`],
      ['Exponente cero', r`$a^0=1$, con $a\neq 0$`],
      ['Exponente negativo', r`$a^{-n}=\dfrac{1}{a^n}$`],
    ],
  },
  {
    id: 'm1-raices', sheet: 'm1', axis: 'Números', title: 'Raíces', subtopics: ['m1-potencias', 'm2-reales'],
    rows: [
      ['Como potencia', r`$\sqrt[n]{a^m}=a^{m/n}$`],
      ['Producto', r`$\sqrt[n]{a}\cdot\sqrt[n]{b}=\sqrt[n]{ab}$`],
      ['Cociente', r`$\dfrac{\sqrt[n]{a}}{\sqrt[n]{b}}=\sqrt[n]{\dfrac{a}{b}}$`],
      ['Raíz de raíz', r`$\sqrt[m]{\sqrt[n]{a}}=\sqrt[m\cdot n]{a}$`],
      ['Racionalizar', r`$\dfrac{1}{\sqrt{a}}=\dfrac{\sqrt{a}}{a}$`],
      ['Cuidado', r`$\sqrt{a+b}\neq\sqrt{a}+\sqrt{b}$`],
    ],
  },
  {
    id: 'm1-proporcionalidad', sheet: 'm1', axis: 'Álgebra y funciones', title: 'Proporcionalidad', subtopics: ['m1-proporcionalidad'],
    rows: [
      ['Proporción', r`$\dfrac{a}{b}=\dfrac{c}{d}\iff ad=bc$`],
      ['Directa', r`$\dfrac{y}{x}=k$: si una sube, la otra sube.`],
      ['Inversa', r`$x\cdot y=k$: si una sube, la otra baja.`],
    ],
  },
  {
    id: 'm1-productos', sheet: 'm1', axis: 'Álgebra y funciones', title: 'Productos notables', subtopics: ['m1-expresiones'],
    rows: [
      ['Cuadrado de binomio', r`$(a\pm b)^2=a^2\pm 2ab+b^2$`],
      ['Suma por diferencia', r`$(a+b)(a-b)=a^2-b^2$`],
      ['Término común', r`$(x+a)(x+b)=x^2+(a+b)x+ab$`],
      ['Cubo de binomio', r`$(a\pm b)^3=a^3\pm 3a^2b+3ab^2\pm b^3$`],
      ['Factor común', r`$ab+ac=a(b+c)$`],
    ],
  },
  {
    id: 'm1-ecuaciones', sheet: 'm1', axis: 'Álgebra y funciones', title: 'Ecuaciones y sistemas', subtopics: ['m1-ecuaciones', 'm1-sistemas', 'm2-sistemas'],
    rows: [
      ['Ecuación lineal', r`$ax+b=c\Rightarrow x=\dfrac{c-b}{a}$`],
      ['Resolver sistemas', 'Sustitución, igualación o reducción.'],
      ['Solución única', r`$\dfrac{a_1}{a_2}\neq\dfrac{b_1}{b_2}$`],
      ['Sin solución', r`$\dfrac{a_1}{a_2}=\dfrac{b_1}{b_2}\neq\dfrac{c_1}{c_2}$`],
      ['Infinitas soluciones', r`$\dfrac{a_1}{a_2}=\dfrac{b_1}{b_2}=\dfrac{c_1}{c_2}$`],
    ],
  },
  {
    id: 'm1-afin', sheet: 'm1', axis: 'Álgebra y funciones', title: 'Función afín', subtopics: ['m1-funcion-afin', 'm2-analitica'],
    rows: [
      ['Forma', r`$f(x)=mx+n$`],
      ['Pendiente', r`$m=\dfrac{y_2-y_1}{x_2-x_1}$`],
      ['Coeficiente de posición', r`$n$: corta al eje $y$ en $(0,n)$`],
      ['Función lineal', r`$f(x)=mx$: pasa por el origen`],
      ['Rectas', r`Paralelas: $m_1=m_2$. Perpendiculares: $m_1\cdot m_2=-1$`],
    ],
  },
  {
    id: 'm1-cuadratica', sheet: 'm1', axis: 'Álgebra y funciones', title: 'Función cuadrática', subtopics: ['m1-cuadratica', 'm2-cuadraticas'],
    rows: [
      ['Forma', r`$f(x)=ax^2+bx+c$, con $a\neq 0$`],
      ['Fórmula general', r`$x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}$`],
      ['Discriminante', r`$\Delta=b^2-4ac$`],
      [r`$\Delta>0$`, 'Dos soluciones reales distintas: corta dos veces al eje $x$.'],
      [r`$\Delta=0$`, 'Una solución real: toca una vez al eje $x$.'],
      [r`$\Delta<0$`, 'Sin soluciones reales: no corta al eje $x$.'],
      ['Vértice', r`$V=\left(-\dfrac{b}{2a},\,f\!\left(-\dfrac{b}{2a}\right)\right)$`],
      ['Eje de simetría', r`$x=-\dfrac{b}{2a}$`],
      ['Concavidad', r`$a>0$ abre hacia arriba; $a<0$, hacia abajo`],
      ['Corte con el eje y', r`$(0,c)$`],
    ],
  },
  {
    id: 'm1-triangulos', sheet: 'm1', axis: 'Geometría', title: 'Triángulos, Pitágoras y Thales', subtopics: ['m1-areas', 'm1-triangulos', 'm2-trigonometria', 'm2-homotecia'],
    rows: [
      ['Pitágoras', r`$a^2+b^2=c^2$, con $c$ la hipotenusa`],
      ['Tríos pitagóricos', r`$3,4,5$; $\;5,12,13$; $\;8,15,17$`],
      ['Ángulos', 'Los interiores suman 180°; los exteriores, 360°.'],
      ['Semejanza', 'Criterios: AA, LAL y LLL.'],
      ['Razón de semejanza', r`Si los lados están en razón $k$, las áreas lo están en $k^2$.`],
      ['Thales', r`Paralelas cortan a dos transversales en trazos proporcionales: $\dfrac{a}{b}=\dfrac{c}{d}$`],
    ],
  },
  {
    id: 'm1-areas', sheet: 'm1', axis: 'Geometría', title: 'Perímetros y áreas', subtopics: ['m1-areas'],
    rows: [
      ['Cuadrado', r`$A=a^2$`],
      ['Rectángulo', r`$A=a\cdot b$`],
      ['Triángulo', r`$A=\dfrac{b\cdot h}{2}$`],
      ['Paralelogramo', r`$A=b\cdot h$`],
      ['Trapecio', r`$A=\dfrac{(a+c)\cdot h}{2}$`],
      ['Rombo', r`$A=\dfrac{d_1\cdot d_2}{2}$`],
      ['Círculo', r`$A=\pi r^2$ y perímetro $P=2\pi r$`],
    ],
  },
  {
    id: 'm1-volumenes', sheet: 'm1', axis: 'Geometría', title: 'Volúmenes', subtopics: ['m1-cuerpos', 'm2-esfera'],
    rows: [
      ['Cubo', r`$V=a^3$`],
      ['Paralelepípedo', r`$V=a\cdot b\cdot c$`],
      ['Prisma', r`$V=A_{\text{base}}\cdot h$`],
      ['Cilindro', r`$V=\pi r^2 h$ y área lateral $2\pi r h$`],
      ['Pirámide', r`$V=\dfrac{1}{3}A_{\text{base}}\cdot h$`],
      ['Cono', r`$V=\dfrac{1}{3}\pi r^2 h$`],
      ['Esfera', r`$V=\dfrac{4}{3}\pi r^3$ y área $A=4\pi r^2$`],
    ],
  },
  {
    id: 'm1-transformaciones', sheet: 'm1', axis: 'Geometría', title: 'Transformaciones en el plano', subtopics: ['m1-transformaciones'],
    rows: [
      ['Traslación', r`$(x,y)\to(x+a,\,y+b)$`],
      ['Reflexión en eje x', r`$(x,y)\to(x,-y)$`],
      ['Reflexión en eje y', r`$(x,y)\to(-x,y)$`],
      ['Rotación de 90°', r`$(x,y)\to(-y,x)$, antihoraria desde el origen`],
      ['Rotación de 180°', r`$(x,y)\to(-x,-y)$`],
      ['Rotación de 270°', r`$(x,y)\to(y,-x)$, antihoraria desde el origen`],
      ['Suma de vectores', r`$(a,b)+(c,d)=(a+c,\,b+d)$`],
    ],
  },
  {
    id: 'm1-tendencia', sheet: 'm1', axis: 'Probabilidad y estadística', title: 'Tendencia central', subtopics: ['m1-tendencia'],
    rows: [
      ['Media', r`$\bar{x}=\dfrac{x_1+x_2+\dots+x_n}{n}$`],
      ['Mediana', 'Dato central con los datos ordenados; si son pares, el promedio de los dos centrales.'],
      ['Moda', 'Dato que más se repite.'],
    ],
  },
  {
    id: 'm1-posicion', sheet: 'm1', axis: 'Probabilidad y estadística', title: 'Medidas de posición', subtopics: ['m1-posicion'],
    rows: [
      ['Cuartiles', r`$Q_1$, $Q_2$ y $Q_3$ dividen los datos ordenados en cuatro partes iguales.`],
      ['Percentil', r`$P_k$ deja bajo él al $k\%$ de los datos.`],
      ['Equivalencias', r`$Q_1=P_{25}$, $\;Q_2=P_{50}=$ mediana, $\;Q_3=P_{75}$`],
      ['Rango intercuartil', r`$Q_3-Q_1$`],
    ],
  },
  {
    id: 'm1-probabilidad', sheet: 'm1', axis: 'Probabilidad y estadística', title: 'Probabilidad', subtopics: ['m1-probabilidad'],
    rows: [
      ['Laplace', r`$P(A)=\dfrac{\text{casos favorables}}{\text{casos posibles}}$`],
      ['Complemento', r`$P(A^c)=1-P(A)$`],
      ['Unión', r`$P(A\cup B)=P(A)+P(B)-P(A\cap B)$`],
      ['Independientes', r`$P(A\cap B)=P(A)\cdot P(B)$`],
      ['Principio multiplicativo', r`$m$ opciones y luego $n$ opciones dan $m\cdot n$ casos.`],
    ],
  },

  // ─────────────────────────────── Matemática M2 ───────────────────────────────
  {
    id: 'm2-reales', sheet: 'm2', axis: 'Números', title: 'Números reales', subtopics: ['m2-reales'],
    rows: [
      ['Conjuntos', r`$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$`],
      ['Irracionales', r`No se escriben como fracción: $\sqrt{2}$, $\pi$, $e$.`],
      ['Raíz de un cuadrado', r`$\sqrt{a^2}=|a|$`],
      ['Racionalizar', r`$\dfrac{1}{\sqrt{a}+\sqrt{b}}=\dfrac{\sqrt{a}-\sqrt{b}}{a-b}$`],
    ],
  },
  {
    id: 'm2-logaritmos', sheet: 'm2', axis: 'Números', title: 'Logaritmos', subtopics: ['m2-logaritmos', 'm2-exponencial'],
    rows: [
      ['Definición', r`$\log_b a=c\iff b^c=a$, con $a>0$, $b>0$ y $b\neq 1$`],
      ['Producto', r`$\log_b(xy)=\log_b x+\log_b y$`],
      ['Cociente', r`$\log_b\dfrac{x}{y}=\log_b x-\log_b y$`],
      ['Potencia', r`$\log_b x^n=n\log_b x$`],
      ['Cambio de base', r`$\log_b a=\dfrac{\log_c a}{\log_c b}$`],
      ['Valores clave', r`$\log_b 1=0$ y $\log_b b=1$`],
    ],
  },
  {
    id: 'm2-financiera', sheet: 'm2', axis: 'Números', title: 'Matemática financiera', subtopics: ['m2-financiera'],
    rows: [
      ['Interés simple', r`$C_f=C\,(1+i\cdot n)$`],
      ['Interés compuesto', r`$C_f=C\,(1+i)^n$`],
      ['Interés ganado', r`$I=C_f-C$`],
      ['Ojo', r`La tasa $i$ va en decimal (5 % es $0{,}05$) y en el mismo período que $n$.`],
    ],
  },
  {
    id: 'm2-cuadraticas', sheet: 'm2', axis: 'Álgebra y funciones', title: 'Cuadráticas: otras formas', subtopics: ['m2-cuadraticas', 'm1-cuadratica'],
    rows: [
      ['Suma de raíces', r`$x_1+x_2=-\dfrac{b}{a}$`],
      ['Producto de raíces', r`$x_1\cdot x_2=\dfrac{c}{a}$`],
      ['Forma factorizada', r`$f(x)=a(x-x_1)(x-x_2)$`],
      ['Forma canónica', r`$f(x)=a(x-h)^2+k$, con vértice $(h,k)$`],
    ],
  },
  {
    id: 'm2-sistemas', sheet: 'm2', axis: 'Álgebra y funciones', title: 'Sistemas: tipos de solución', subtopics: ['m2-sistemas'],
    rows: [
      ['Única solución', r`$\dfrac{a}{d}\neq\dfrac{b}{e}$: rectas secantes`],
      ['Sin solución', r`$\dfrac{a}{d}=\dfrac{b}{e}\neq\dfrac{c}{f}$: rectas paralelas`],
      ['Infinitas soluciones', r`$\dfrac{a}{d}=\dfrac{b}{e}=\dfrac{c}{f}$: la misma recta`],
    ],
  },
  {
    id: 'm2-exponencial', sheet: 'm2', axis: 'Álgebra y funciones', title: 'Función exponencial', subtopics: ['m2-exponencial'],
    rows: [
      ['Forma', r`$f(x)=a\cdot b^x$, con $b>0$ y $b\neq 1$`],
      ['Crece o decrece', r`$b>1$ crece; $0<b<1$ decrece`],
      ['Ecuación', r`$b^x=b^y\iff x=y$`],
      ['Crecimiento', r`$N(t)=N_0\,(1+r)^t$`],
    ],
  },
  {
    id: 'm2-inversa', sheet: 'm2', axis: 'Álgebra y funciones', title: 'Inversa y composición', subtopics: ['m2-inversa'],
    rows: [
      ['Composición', r`$(f\circ g)(x)=f(g(x))$`],
      ['Inversa', r`$f(f^{-1}(x))=x$`],
      ['Cómo calcularla', r`Escribe $y=f(x)$, despeja $x$ e intercambia $x$ con $y$.`],
      ['Cuándo existe', 'Si la función es biyectiva: inyectiva y sobreyectiva.'],
    ],
  },
  {
    id: 'm2-trigonometria', sheet: 'm2', axis: 'Geometría', title: 'Razones trigonométricas', subtopics: ['m2-trigonometria'],
    rows: [
      ['Seno', r`$\operatorname{sen}\alpha=\dfrac{\text{opuesto}}{\text{hipotenusa}}$`],
      ['Coseno', r`$\cos\alpha=\dfrac{\text{adyacente}}{\text{hipotenusa}}$`],
      ['Tangente', r`$\tan\alpha=\dfrac{\text{opuesto}}{\text{adyacente}}=\dfrac{\operatorname{sen}\alpha}{\cos\alpha}$`],
      ['Identidad', r`$\operatorname{sen}^2\alpha+\cos^2\alpha=1$`],
      ['Complementarios', r`$\operatorname{sen}\alpha=\cos(90^\circ-\alpha)$`],
      ['30°', r`$\operatorname{sen}=\dfrac{1}{2}$, $\;\cos=\dfrac{\sqrt{3}}{2}$, $\;\tan=\dfrac{\sqrt{3}}{3}$`],
      ['45°', r`$\operatorname{sen}=\cos=\dfrac{\sqrt{2}}{2}$, $\;\tan=1$`],
      ['60°', r`$\operatorname{sen}=\dfrac{\sqrt{3}}{2}$, $\;\cos=\dfrac{1}{2}$, $\;\tan=\sqrt{3}$`],
    ],
  },
  {
    id: 'm2-funciones-trig', sheet: 'm2', axis: 'Álgebra y funciones', title: 'Funciones seno y coseno', subtopics: ['m2-funciones-trig'],
    rows: [
      ['Forma general', r`$y=a\sin(bx)+c$`],
      ['Amplitud', r`$|a|$`],
      ['Período', r`$\dfrac{2\pi}{|b|}$ (o $\dfrac{360^\circ}{|b|}$)`],
      ['Recorrido', r`$[\,c-|a|,\ c+|a|\,]$`],
      ['Valores clave', r`$\sin 0=0$, $\sin 90^\circ=1$, $\cos 0=1$, $\cos 90^\circ=0$`],
    ],
  },
  {
    id: 'm2-circunferencia', sheet: 'm2', axis: 'Geometría', title: 'Circunferencia', subtopics: ['m2-circunferencia'],
    rows: [
      ['Ángulo inscrito', r`$\alpha=\dfrac{\text{ángulo del centro}}{2}$`],
      ['En semicircunferencia', r`Ángulo inscrito de $90^\circ$`],
      ['Cuadrilátero inscrito', r`Ángulos opuestos suman $180^\circ$`],
      ['Cuerdas que se cortan', r`$PA\cdot PB=PC\cdot PD$`],
      ['Secantes desde $P$', r`$PA\cdot PB=PC\cdot PD$ (exterior por secante completa)`],
      ['Arco', r`$L=\dfrac{\alpha}{360^\circ}\cdot 2\pi r$`],
    ],
  },
  {
    id: 'm2-euclides', sheet: 'm2', axis: 'Geometría', title: 'Euclides y homotecia', subtopics: ['m2-homotecia', 'm1-triangulos'],
    rows: [
      ['Euclides: altura', r`$h^2=p\cdot q$, con $p$ y $q$ las proyecciones de los catetos`],
      ['Euclides: catetos', r`$a^2=c\cdot p$ y $b^2=c\cdot q$`],
      ['Altura', r`$h=\dfrac{a\cdot b}{c}$`],
      ['Homotecia desde el origen', r`$(x,y)\to(kx,\,ky)$`],
      ['Razón k', r`$|k|>1$ amplía; $|k|<1$ reduce; $k<0$ invierte`],
      ['Áreas y volúmenes', r`Las áreas se multiplican por $k^2$; los volúmenes, por $|k|^3$.`],
    ],
  },
  {
    id: 'm2-analitica', sheet: 'm2', axis: 'Geometría', title: 'Geometría analítica', subtopics: ['m2-analitica'],
    rows: [
      ['Distancia', r`$d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$`],
      ['Punto medio', r`$M=\left(\dfrac{x_1+x_2}{2},\,\dfrac{y_1+y_2}{2}\right)$`],
      ['Ecuación principal', r`$y=mx+n$`],
      ['Ecuación general', r`$ax+by+c=0$, con pendiente $m=-\dfrac{a}{b}$`],
    ],
  },
  {
    id: 'm2-condicional', sheet: 'm2', axis: 'Probabilidad y estadística', title: 'Probabilidad condicional', subtopics: ['m2-condicional'],
    rows: [
      ['Condicional', r`$P(A\mid B)=\dfrac{P(A\cap B)}{P(B)}$`],
      ['Intersección', r`$P(A\cap B)=P(A\mid B)\cdot P(B)$`],
      ['Independencia', r`$P(A\mid B)=P(A)$`],
      ['Probabilidad total', r`$P(A)=P(A\mid B)P(B)+P(A\mid B^c)P(B^c)$`],
    ],
  },
  {
    id: 'm2-dispersion', sheet: 'm2', axis: 'Probabilidad y estadística', title: 'Dispersión y normal', subtopics: ['m2-dispersion', 'm2-modelos'],
    rows: [
      ['Rango', r`$x_{\max}-x_{\min}$`],
      ['Varianza', r`$\sigma^2=\dfrac{\sum (x_i-\bar{x})^2}{n}$`],
      ['Desviación estándar', r`$\sigma=\sqrt{\sigma^2}$`],
      ['Sumar una constante', r`No cambia $\sigma$.`],
      ['Multiplicar por k', r`$\sigma$ queda multiplicada por $|k|$.`],
      ['Distribución normal', r`Cerca del 68 %, 95 % y 99,7 % de los datos cae a 1, 2 y 3 $\sigma$ de la media.`],
    ],
  },
  {
    id: 'm2-combinatoria', sheet: 'm2', axis: 'Probabilidad y estadística', title: 'Combinatoria y binomial', subtopics: ['m2-combinatoria', 'm2-modelos'],
    rows: [
      ['Factorial', r`$n!=n\cdot(n-1)\cdots 2\cdot 1$ y $0!=1$`],
      ['Permutación', r`$P_n=n!$: ordenar todos`],
      ['Variación', r`$V^n_k=\dfrac{n!}{(n-k)!}$: importa el orden`],
      ['Combinación', r`$\dbinom{n}{k}=\dfrac{n!}{k!\,(n-k)!}$: no importa el orden`],
      ['Simetría', r`$\dbinom{n}{k}=\dbinom{n}{n-k}$`],
      ['Binomial', r`$P(X=k)=\dbinom{n}{k}p^k(1-p)^{n-k}$`],
      ['Media binomial', r`$\mu=n\cdot p$`],
    ],
  },
  {
    id: 'm2-suficiencia', sheet: 'm2', axis: 'Habilidades transversales', title: 'Suficiencia de datos', subtopics: ['m2-suficiencia'],
    rows: [
      ['A', '(1) por sí sola'],
      ['B', '(2) por sí sola'],
      ['C', 'Ambas juntas, (1) y (2)'],
      ['D', 'Cada una por sí sola, (1) o (2)'],
      ['E', 'Se requiere información adicional'],
      ['Paso 1', 'Prueba (1) sola y luego (2) sola, olvidando la otra.'],
      ['Paso 2', 'Júntalas solo si ninguna alcanza por separado.'],
      ['Ojo', 'No hay que resolver: basta saber si se podría.'],
    ],
  },

  // ─────────────────────────────── Física ───────────────────────────────
  {
    id: 'fi-cinematica', sheet: 'fisica', axis: 'Mecánica', title: 'Cinemática: MRU y MRUA', subtopics: ['cs-cinematica'],
    rows: [
      ['Rapidez media', r`$v=\dfrac{d}{t}$`],
      ['MRU', r`$x=x_0+v\,t$`],
      ['Aceleración', r`$a=\dfrac{\Delta v}{\Delta t}$`],
      ['MRUA: velocidad', r`$v=v_0+a\,t$`],
      ['MRUA: distancia', r`$d=v_0 t+\dfrac{1}{2}a t^2$`],
      ['MRUA: sin tiempo', r`$v^2=v_0^2+2ad$`],
      ['Gravedad', r`$g\approx 10\ \text{m/s}^2$`],
    ],
  },
  {
    id: 'fi-newton', sheet: 'fisica', axis: 'Mecánica', title: 'Leyes de Newton y fuerzas', subtopics: ['cs-dinamica'],
    rows: [
      ['1.ª ley: inercia', 'Sin fuerza neta, un cuerpo sigue en reposo o con velocidad constante.'],
      ['2.ª ley', r`$F_{\text{neta}}=m\cdot a$`],
      ['3.ª ley', 'A toda acción hay una reacción igual y opuesta, en cuerpos distintos.'],
      ['Peso', r`$P=m\cdot g$`],
      ['Roce', r`$f=\mu\cdot N$`],
      ['Hooke', r`$F=k\cdot x$`],
      ['Presión', r`$p=\dfrac{F}{A}$`],
      ['Densidad', r`$\rho=\dfrac{m}{V}$`],
    ],
  },
  {
    id: 'fi-energia', sheet: 'fisica', axis: 'Energía', title: 'Trabajo y energía', subtopics: ['cs-energia'],
    rows: [
      ['Trabajo', r`$W=F\cdot d\cdot\cos\theta$`],
      ['Energía cinética', r`$E_c=\dfrac{1}{2}m v^2$`],
      ['Energía potencial', r`$E_p=m g h$`],
      ['Conservación', r`Sin roce, $E_c+E_p$ es constante.`],
      ['Trabajo neto', r`$W_{\text{neto}}=\Delta E_c$`],
      ['Potencia', r`$P=\dfrac{W}{t}$`],
      ['Calor', r`$Q=m\,c\,\Delta T$`],
    ],
  },
  {
    id: 'fi-electricidad', sheet: 'fisica', axis: 'Electricidad y magnetismo', title: 'Electricidad', subtopics: ['cs-electricidad'],
    rows: [
      ['Intensidad', r`$I=\dfrac{q}{t}$`],
      ['Ley de Ohm', r`$V=I\cdot R$`],
      ['Potencia', r`$P=V\cdot I=I^2 R$`],
      ['Resistencias en serie', r`$R_{\text{eq}}=R_1+R_2$`],
      ['Resistencias en paralelo', r`$\dfrac{1}{R_{\text{eq}}}=\dfrac{1}{R_1}+\dfrac{1}{R_2}$`],
      ['Energía consumida', r`$E=P\cdot t$ (en kWh en la cuenta de la luz)`],
      ['Ley de Coulomb', r`$F=k\dfrac{q_1 q_2}{r^2}$`],
    ],
  },
  {
    id: 'fi-tierra-universo', sheet: 'fisica', axis: 'Energía y Tierra', title: 'Tierra y universo', subtopics: ['cs-tierra', 'cs-universo'],
    rows: [
      ['Geosfera', 'Corteza, manto y núcleo; la litosfera se divide en placas.'],
      ['Borde convergente', 'Subducción: sismos, volcanes y cordilleras (Nazca bajo la Sudamericana).'],
      ['Epicentro e hipocentro', 'Hipocentro: punto interior del sismo. Epicentro: sobre él, en la superficie.'],
      ['Magnitud e intensidad', 'Magnitud: energía liberada. Intensidad: efectos en cada lugar.'],
      ['Leyes de Kepler', r`Órbitas elípticas; áreas iguales en tiempos iguales; $T^2\propto a^3$.`],
      ['Big Bang', 'Evidencias: galaxias que se alejan y radiación de fondo de microondas.'],
    ],
  },
  {
    id: 'fi-ondas', sheet: 'fisica', axis: 'Ondas', title: 'Ondas, sonido y luz', subtopics: ['cs-ondas', 'cs-luz'],
    rows: [
      ['Velocidad', r`$v=\lambda\cdot f$`],
      ['Período', r`$T=\dfrac{1}{f}$`],
      ['Tipos', 'Transversal: vibra perpendicular al avance. Longitudinal: en la misma dirección.'],
      ['Sonido', r`Necesita un medio; en el aire viaja a unos $340\ \text{m/s}$.`],
      ['Tono e intensidad', 'La frecuencia define el tono; la amplitud, la intensidad.'],
      ['Luz', r`$c\approx 3\cdot 10^8\ \text{m/s}$ en el vacío`],
      ['Reflexión', r`$\theta_i=\theta_r$`],
      ['Refracción', r`$n_1\operatorname{sen}\theta_1=n_2\operatorname{sen}\theta_2$, con $n=\dfrac{c}{v}$`],
    ],
  },

  // ─────────────────────────────── Química ───────────────────────────────
  {
    id: 'qu-atomo', sheet: 'quimica', axis: 'Estructura atómica', title: 'Átomo y enlace', subtopics: ['cs-atomo', 'cs-enlace'],
    rows: [
      ['Número atómico', r`$Z$ = protones`],
      ['Número másico', r`$A=Z+N$, con $N$ los neutrones`],
      ['Ion', 'Catión: perdió electrones. Anión: ganó electrones.'],
      ['Isótopos', r`Igual $Z$ y distinto $A$.`],
      ['Enlace iónico', 'Metal con no metal: transfieren electrones.'],
      ['Enlace covalente', 'No metales: comparten electrones.'],
      ['Tabla periódica', 'La electronegatividad sube hacia arriba y a la derecha; el radio atómico, hacia abajo y a la izquierda.'],
    ],
  },
  {
    id: 'qu-estequiometria', sheet: 'quimica', axis: 'Reacciones químicas', title: 'Mol y estequiometría', subtopics: ['cs-reacciones'],
    rows: [
      ['Moles', r`$n=\dfrac{m}{MM}$`],
      ['Avogadro', r`$1\ \text{mol}=6{,}02\cdot 10^{23}$ partículas`],
      ['Gas en CNPT', r`$1\ \text{mol}$ ocupa $22{,}4\ \text{L}$`],
      ['Lavoisier', 'La masa se conserva: balancea antes de calcular.'],
      ['Pasos', 'Balancear, pasar a moles, usar la razón de coeficientes y convertir a lo pedido.'],
      ['Reactivo limitante', 'Es el que se agota primero: define cuánto producto se forma.'],
    ],
  },
  {
    id: 'qu-disoluciones', sheet: 'quimica', axis: 'Soluciones', title: 'Concentración y pH', subtopics: ['cs-disoluciones'],
    rows: [
      ['Molaridad', r`$M=\dfrac{n}{V}$, con $V$ en litros`],
      ['Dilución', r`$C_1V_1=C_2V_2$`],
      ['Masa/masa', r`$\%\,m/m=\dfrac{m_{\text{soluto}}}{m_{\text{disolución}}}\cdot 100$`],
      ['Masa/volumen', r`$\%\,m/v=\dfrac{m_{\text{soluto}}\ (\text{g})}{V_{\text{disolución}}\ (\text{mL})}\cdot 100$`],
      ['pH', r`$\text{pH}=-\log[\text{H}^+]$`],
      ['pOH', r`$\text{pH}+\text{pOH}=14$, a 25 °C`],
      ['Escala', 'Bajo 7 es ácido; 7, neutro; sobre 7, básico.'],
    ],
  },
  {
    id: 'qu-organica', sheet: 'quimica', axis: 'Química orgánica', title: 'Química orgánica', subtopics: ['cs-organica', 'cs-biomoleculas'],
    rows: [
      ['Alcano', r`$\text{C}_n\text{H}_{2n+2}$, enlace simple`],
      ['Alqueno', r`$\text{C}_n\text{H}_{2n}$, enlace doble`],
      ['Alquino', r`$\text{C}_n\text{H}_{2n-2}$, enlace triple`],
      ['Prefijos', 'Met (1), et (2), prop (3), but (4), pent (5).'],
      ['Alcohol', r`$-\text{OH}$`],
      ['Aldehído', r`$-\text{CHO}$`],
      ['Cetona', r`$-\text{CO}-$`],
      ['Ácido carboxílico', r`$-\text{COOH}$`],
      ['Éster', r`$-\text{COO}-$`],
      ['Amina', r`$-\text{NH}_2$`],
    ],
  },

  // ─────────────────────────────── Biología ───────────────────────────────
  {
    id: 'bi-organelos', sheet: 'biologia', axis: 'Organización celular', title: 'Organelos celulares', subtopics: ['cs-celula'],
    rows: [
      ['Núcleo', 'Guarda el ADN y dirige a la célula.'],
      ['Mitocondria', 'Respiración celular: produce ATP.'],
      ['Cloroplasto', 'Fotosíntesis (solo en células vegetales).'],
      ['Ribosoma', 'Sintetiza proteínas.'],
      ['RE rugoso', 'Sintetiza y modifica proteínas.'],
      ['RE liso', 'Sintetiza lípidos y detoxifica.'],
      ['Aparato de Golgi', 'Modifica, empaca y distribuye.'],
      ['Lisosoma', 'Digestión celular.'],
      ['Vacuola', 'Almacena; en vegetales da turgencia.'],
      ['Membrana plasmática', 'Regula lo que entra y sale.'],
      ['Pared celular', 'Da rigidez (vegetales, hongos y bacterias).'],
    ],
  },
  {
    id: 'bi-division', sheet: 'biologia', axis: 'Organización celular', title: 'Mitosis y meiosis', subtopics: ['cs-celula', 'cs-genetica'],
    rows: [
      ['Interfase', 'El ADN se duplica antes de dividirse (fase S).'],
      ['Profase', 'Los cromosomas se condensan y se desarma la envoltura nuclear.'],
      ['Metafase', 'Los cromosomas se alinean en el ecuador.'],
      ['Anafase', 'Se separan las cromátidas hermanas hacia los polos.'],
      ['Telofase', 'Reaparece el núcleo; luego la citocinesis separa las células.'],
      ['Resultado de la mitosis', r`2 células $2n$ idénticas: crecimiento y reparación.`],
      ['Resultado de la meiosis', r`4 células $n$ distintas: gametos.`],
      ['Profase I', 'Entrecruzamiento: genera variabilidad.'],
      ['Anafase I', 'Se separan los cromosomas homólogos.'],
      ['Anafase II', 'Se separan las cromátidas hermanas.'],
    ],
  },
  {
    id: 'bi-biomoleculas', sheet: 'biologia', axis: 'Procesos y funciones biológicas', title: 'Biomoléculas y energía', subtopics: ['cs-biomoleculas'],
    rows: [
      ['Carbohidratos', 'Energía rápida y estructura.'],
      ['Lípidos', 'Reserva de energía y membranas.'],
      ['Proteínas', 'Formadas por aminoácidos: enzimas, transporte y estructura.'],
      ['Ácidos nucleicos', 'ADN y ARN: información genética.'],
      ['Fotosíntesis', r`$6\,\text{CO}_2+6\,\text{H}_2\text{O}\xrightarrow{\text{luz}}\text{C}_6\text{H}_{12}\text{O}_6+6\,\text{O}_2$`],
      ['Respiración celular', r`$\text{C}_6\text{H}_{12}\text{O}_6+6\,\text{O}_2\to 6\,\text{CO}_2+6\,\text{H}_2\text{O}+\text{ATP}$`],
    ],
  },
  {
    id: 'bi-genetica', sheet: 'biologia', axis: 'Herencia y evolución', title: 'Herencia y evolución', subtopics: ['cs-genetica', 'cs-evolucion'],
    rows: [
      ['Monohíbrido', r`$Aa\times Aa$ da 3:1 en fenotipo y 1:2:1 en genotipo.`],
      ['Dihíbrido', r`$AaBb\times AaBb$ da 9:3:3:1 en fenotipo.`],
      ['Bases del ADN', 'A con T, y C con G. En el ARN, U reemplaza a T.'],
      ['Flujo de información', 'ADN, ARN y proteína: transcripción y traducción.'],
      ['Selección natural', 'Hay variación heredable y sobreviven y se reproducen más los mejor adaptados.'],
    ],
  },
  {
    id: 'bi-sistemas', sheet: 'biologia', axis: 'Procesos y funciones biológicas', title: 'Sistemas y regulación', subtopics: ['cs-sistemas', 'cs-nervioso'],
    rows: [
      ['Homeostasis', 'Mantener estable el medio interno.'],
      ['Insulina', 'Baja la glucosa en la sangre.'],
      ['Glucagón', 'Sube la glucosa en la sangre.'],
      ['Sistema nervioso', 'Respuesta rápida por impulsos eléctricos.'],
      ['Sistema endocrino', 'Respuesta lenta y sostenida por hormonas.'],
    ],
  },
  {
    id: 'bi-reproduccion', sheet: 'biologia', axis: 'Procesos y funciones biológicas', title: 'Reproducción e ITS', subtopics: ['cs-reproduccion'],
    rows: [
      ['Fecundación', 'Ovocito (n) + espermatozoide (n) forman un cigoto (2n).'],
      ['Ciclo de 28 días', 'Menstruación, fase folicular, ovulación (día 14 aprox.) y fase lútea.'],
      ['Métodos de barrera', 'Previenen el embarazo y las ITS (condón).'],
      ['Métodos hormonales', 'Previenen el embarazo, pero no las ITS.'],
      ['ITS', 'VIH y herpes son virus; gonorrea y clamidia, bacterias.'],
    ],
  },
  {
    id: 'bi-ecologia', sheet: 'biologia', axis: 'Organismo y ambiente', title: 'Ecología', subtopics: ['cs-ecologia'],
    rows: [
      ['Cadena trófica', 'Productores, consumidores y descomponedores.'],
      ['Regla del 10 %', 'A cada nivel trófico pasa cerca del 10 % de la energía.'],
      ['Mutualismo', 'Ambas especies ganan (+/+).'],
      ['Comensalismo', 'Una gana y a la otra no le afecta (+/0).'],
      ['Depredación y parasitismo', 'Una gana y la otra pierde (+/−).'],
      ['Competencia', 'Ambas pierden (−/−).'],
    ],
  },
  {
    id: 'bi-habilidades', sheet: 'biologia', axis: 'Habilidades científicas', title: 'Diseño experimental', subtopics: ['cs-habilidades'],
    rows: [
      ['Hipótesis', 'Respuesta posible y comprobable a una pregunta.'],
      ['Variable independiente', 'La que el investigador cambia.'],
      ['Variable dependiente', 'La que se mide.'],
      ['Variables controladas', 'Las que se mantienen constantes.'],
      ['Grupo control', 'No recibe el tratamiento: sirve para comparar.'],
      ['Conclusión', 'No debe ir más allá de los datos.'],
    ],
  },

  // ─────────────────────────────── Competencia Lectora ───────────────────────────────
  {
    id: 'cl-tipos', sheet: 'lectora', axis: 'Tipos de preguntas', title: 'Tipos de preguntas DEMRE', subtopics: ['cl-localizar', 'cl-idea-central', 'cl-inferencia', 'cl-proposito', 'cl-forma', 'cl-contextos'],
    rows: [
      ['Localizar', 'Hallar información explícita. «Según el texto…», «¿qué dato menciona…?».'],
      ['Interpretar', 'Inferir, sintetizar y relacionar. «Se puede inferir…», «¿cuál es la idea principal?».'],
      ['Evaluar', 'Juzgar propósito, postura y forma. «¿Cuál es el propósito?», «¿qué función cumple…?».'],
    ],
  },
  {
    id: 'cl-distractores', sheet: 'lectora', axis: 'Tipos de preguntas', title: 'Distractores clásicos', subtopics: ['cl-inferencia', 'cl-localizar'],
    rows: [
      ['Contradicción', 'Dice lo contrario del texto, a veces cambiando una sola palabra.'],
      ['Dato parcial', 'Es cierto, pero no responde lo pedido o se queda corto.'],
      ['Extrapolación', 'Va más allá de lo que dice el texto.'],
      ['Sobregeneralización', 'Pasa de «algunos» a «todos»: siempre, nunca, únicamente.'],
      ['Prueba rápida', '¿Qué frase del texto lo respalda? Si no hay ninguna, descártala.'],
    ],
  },
  {
    id: 'cl-conectores', sheet: 'lectora', axis: 'Conectores', title: 'Conectores clave', subtopics: ['cl-argumentos', 'cl-forma', 'cl-idea-central'],
    rows: [
      ['Adición', 'además, asimismo, también'],
      ['Contraste', 'sin embargo, no obstante, en cambio'],
      ['Concesión', 'aunque, si bien, a pesar de'],
      ['Causa', 'porque, ya que, puesto que'],
      ['Consecuencia', 'por lo tanto, por ello, en consecuencia'],
      ['Condición', 'si, siempre que, a menos que'],
      ['Ejemplo', 'por ejemplo, tal como, es el caso de'],
      ['Reformulación', 'es decir, o sea, en otras palabras'],
      ['Cierre', 'en suma, en conclusión, finalmente'],
    ],
  },
  {
    id: 'cl-argumentos', sheet: 'lectora', axis: 'Textos argumentativos', title: 'Tesis, argumentos y tono', subtopics: ['cl-argumentos', 'cl-postura', 'cl-intencion'],
    rows: [
      ['Tesis', 'La postura que defiende el autor.'],
      ['Argumento', 'La razón que sostiene la tesis.'],
      ['Contraargumento', 'Postura contraria que el autor presenta para rebatirla.'],
      ['Propósitos', 'Informar, explicar, convencer, criticar, advertir o entretener.'],
      ['Tono objetivo', 'Datos en tercera persona, sin juzgar.'],
      ['Tono crítico', 'Cuestiona abiertamente.'],
      ['Tono irónico', 'Da a entender lo contrario de lo que dice.'],
      ['Tono reflexivo', 'Piensa en voz alta y matiza.'],
    ],
  },
  {
    id: 'cl-vocabulario', sheet: 'lectora', axis: 'Vocabulario', title: 'Vocabulario en contexto', subtopics: ['cl-vocabulario'],
    rows: [
      ['Paso 1', 'Vuelve a la oración completa donde aparece la palabra.'],
      ['Paso 2', 'Reemplázala por cada alternativa.'],
      ['Paso 3', 'Queda la que mantiene el sentido, aunque no sea el significado más común.'],
    ],
  },
  {
    id: 'cl-literario', sheet: 'lectora', axis: 'Textos literarios', title: 'Textos literarios', subtopics: ['cl-literario'],
    rows: [
      ['Narrador protagonista', 'Cuenta su propia historia, en primera persona.'],
      ['Narrador testigo', 'Cuenta lo que vio, sin ser el centro.'],
      ['Narrador omnisciente', 'Lo sabe todo, incluso lo que piensan los personajes.'],
      ['Metáfora', 'Identifica una cosa con otra sin usar «como».'],
      ['Comparación', 'Relaciona dos cosas con «como» o «igual que».'],
      ['Personificación', 'Da rasgos humanos a lo que no lo es.'],
      ['Hipérbole', 'Exagera para enfatizar.'],
    ],
  },
  {
    id: 'cl-discontinuos', sheet: 'lectora', axis: 'Textos discontinuos', title: 'Gráficos e infografías', subtopics: ['cl-multimodal'],
    rows: [
      ['Orden de lectura', 'Título, ejes y unidades, fuente y recién entonces la forma.'],
      ['Función', 'Respaldar, resumir, comparar o mostrar una tendencia.'],
      ['Trampa', 'Dos cosas que cambian juntas no prueban que una cause la otra.'],
    ],
  },

  // ─────────────────────────────── Historia ───────────────────────────────
  {
    id: 'hi-xix', sheet: 'historia', axis: 'Línea de tiempo', title: 'Revoluciones y Chile en el siglo XIX', subtopics: ['hi-revoluciones', 'hi-chile-xix'],
    rows: [
      ['Desde 1760', 'Revolución Industrial en Inglaterra.'],
      ['1776', 'Independencia de Estados Unidos.'],
      ['1789', 'Revolución Francesa.'],
      ['1810', 'Primera Junta Nacional de Gobierno en Chile.'],
      ['1818', 'Proclamación de la Independencia de Chile.'],
      ['1833', 'Constitución de 1833 y orden conservador.'],
      ['1861–1883', 'Ocupación de la Araucanía.'],
      ['1879–1884', 'Guerra del Pacífico.'],
      ['1891', 'Guerra civil entre Balmaceda y el Congreso.'],
    ],
  },
  {
    id: 'hi-mundo-xx', sheet: 'historia', axis: 'Línea de tiempo', title: 'El mundo en el siglo XX', subtopics: ['hi-guerras', 'hi-guerra-fria'],
    rows: [
      ['1914–1918', 'Primera Guerra Mundial.'],
      ['1917', 'Revolución Rusa.'],
      ['1929', 'Crisis económica y Gran Depresión.'],
      ['1939–1945', 'Segunda Guerra Mundial.'],
      ['1945', 'Fundación de la ONU.'],
      ['1947–1991', 'Guerra Fría.'],
      ['1959', 'Revolución Cubana.'],
      ['1962', 'Crisis de los misiles.'],
      ['1989', 'Caída del Muro de Berlín.'],
      ['1991', 'Disolución de la URSS.'],
    ],
  },
  {
    id: 'hi-chile-xx', sheet: 'historia', axis: 'Línea de tiempo', title: 'Chile en el siglo XX', subtopics: ['hi-cuestion-social', 'hi-chile-xx', 'hi-dictadura'],
    rows: [
      ['1907', 'Matanza de la Escuela Santa María de Iquique.'],
      ['1925', 'Constitución presidencialista; se separan la Iglesia y el Estado.'],
      ['1938', 'Frente Popular: gana Pedro Aguirre Cerda.'],
      ['1939', 'Creación de la CORFO.'],
      ['1949', 'Voto femenino en elecciones presidenciales y parlamentarias.'],
      ['1967', 'Ley de Reforma Agraria de Frei Montalva.'],
      ['1970–1973', 'Unidad Popular: gobierno de Salvador Allende.'],
      ['1971', 'Nacionalización del cobre.'],
      ['1973', 'Golpe de Estado del 11 de septiembre e inicio de la dictadura.'],
      ['1980', 'Nueva Constitución.'],
      ['1988', 'Plebiscito: gana el No.'],
      ['1990', 'Retorno a la democracia con Patricio Aylwin.'],
    ],
  },
  {
    id: 'hi-ciudadania', sheet: 'historia', axis: 'Formación ciudadana', title: 'Estado y ciudadanía', subtopics: ['hi-estado', 'hi-democracia', 'hi-informacion'],
    rows: [
      ['Poder Ejecutivo', 'Presidente y ministros: gobiernan y administran.'],
      ['Poder Legislativo', 'Congreso, con Cámara y Senado: hace las leyes.'],
      ['Poder Judicial', 'Tribunales: aplican las leyes.'],
      ['Órganos autónomos', 'Contraloría, Banco Central, Tribunal Constitucional y Servel.'],
      ['Ciudadanía', 'Chilenos de 18 años o más, sin condena a pena aflictiva.'],
    ],
  },
  {
    id: 'hi-justicia-trabajo', sheet: 'historia', axis: 'Formación ciudadana', title: 'Justicia y derechos laborales', subtopics: ['hi-justicia', 'hi-laborales'],
    rows: [
      ['Ministerio Público', 'Investiga y acusa (Fiscalía).'],
      ['Defensoría Penal Pública', 'Defiende a quien no puede pagar un abogado.'],
      ['Juez de garantía', 'Protege los derechos del imputado.'],
      ['Tribunal Constitucional', 'Revisa que las leyes respeten la Constitución.'],
      ['Dirección del Trabajo', 'Fiscaliza y recibe denuncias laborales.'],
      ['Sindicatos', 'Negocian colectivamente las condiciones de trabajo.'],
    ],
  },
  {
    id: 'hi-economia', sheet: 'historia', axis: 'Sistema económico', title: 'Economía', subtopics: ['hi-mercado', 'hi-macro'],
    rows: [
      ['Escasez', 'Las necesidades superan a los recursos: toda elección tiene un costo de oportunidad.'],
      ['Demanda', 'Si sube el precio, baja la cantidad demandada.'],
      ['Oferta', 'Si sube el precio, sube la cantidad ofrecida.'],
      ['PIB', 'Valor de lo producido en un país durante un período.'],
      ['Inflación', 'Alza general de precios; el IPC la mide.'],
      ['Política monetaria', 'Banco Central: la tasa de interés.'],
      ['Política fiscal', 'Gobierno: gasto público e impuestos.'],
    ],
  },
  {
    id: 'hi-geografia', sheet: 'historia', axis: 'Geografía y espacio', title: 'Geografía y población', subtopics: ['hi-geografia'],
    rows: [
      ['Densidad', 'Habitantes divididos por superficie.'],
      ['Crecimiento natural', 'Natalidad menos mortalidad.'],
      ['Saldo migratorio', 'Inmigrantes menos emigrantes.'],
      ['Pirámide de población', 'Base ancha: población joven. Cima ancha: población envejecida.'],
    ],
  },
  {
    id: 'hi-fuentes', sheet: 'historia', axis: 'Pensamiento histórico', title: 'Análisis de fuentes', subtopics: ['hi-fuentes'],
    rows: [
      ['Fuente primaria', 'De la época estudiada: cartas, leyes, prensa, fotos.'],
      ['Fuente secundaria', 'Interpretación posterior: libros de historia.'],
      ['Preguntas clave', '¿Quién la escribió, cuándo, para quién y con qué propósito?'],
      ['Multicausalidad', 'Los procesos históricos tienen varias causas.'],
      ['Continuidad y cambio', 'Distingue lo que se mantiene de lo que se transforma.'],
    ],
  },
]

/** Tarjetas que cubren al menos uno de estos temas (un tema, un eje o una materia). */
export function cheatCardsFor(subtopicIds: string[]): CheatCard[] {
  const wanted = new Set(subtopicIds)
  return CHEAT_CARDS.filter((c) => c.subtopics.some((id) => wanted.has(id)))
}
