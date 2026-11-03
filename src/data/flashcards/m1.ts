import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const NUM = 'Números'
const ALG = 'Álgebra y funciones'
const GEO = 'Geometría'
const EST = 'Probabilidad y estadística'
const r = String.raw

export const m1: Deck = {
  id: 'm1',
  title: 'Matemática M1',
  subject: 'm1',
  mono: 'M1',
  description: 'Potencias y raíces, productos notables, sistemas, funciones afín y cuadrática, Pitágoras y Thales, vectores, posición y probabilidad.',
  units: [NUM, ALG, GEO, EST],
  cards: [
    // ── Números ──
    card('m1-01', NUM, r`Producto y cociente de potencias de **igual base**`, r`$$a^m\cdot a^n=a^{m+n}\qquad \frac{a^m}{a^n}=a^{m-n}\ (a\neq 0)$$`, [r`Se conserva la base y se operan los exponentes: $2^3\cdot 2^4=2^7$.`]),
    card('m1-02', NUM, r`Potencia de una potencia y potencia de un producto`, r`$$\left(a^m\right)^n=a^{m\cdot n}\qquad (a\cdot b)^n=a^n\cdot b^n$$`, [r`Ojo: $(a+b)^n\neq a^n+b^n$.`]),
    card('m1-03', NUM, r`Exponente cero y exponente negativo`, r`$a^0=1$ (con $a\neq 0$) y $$a^{-n}=\frac{1}{a^n}\qquad \left(\frac{a}{b}\right)^{-n}=\left(\frac{b}{a}\right)^{n}$$`, [r`$2^{-3}=\frac{1}{8}$; un exponente negativo **no** hace negativo el resultado.`]),
    card('m1-04', NUM, r`Signo de una potencia de **base negativa**`, r`Exponente **par**: resultado positivo. Exponente **impar**: resultado negativo.`, [r`$(-2)^4=16$ y $(-2)^3=-8$.`, r`Sin paréntesis cambia: $-2^4=-(2^4)=-16$.`]),
    card('m1-05', NUM, r`Raíz como potencia de exponente fraccionario`, r`$$\sqrt[n]{a^m}=a^{\frac{m}{n}}$$`, [r`$\sqrt[3]{8^2}=8^{2/3}=\left(\sqrt[3]{8}\right)^2=4$.`]),
    card('m1-06', NUM, r`Propiedades de las raíces del mismo índice`, r`$$\sqrt[n]{a}\cdot\sqrt[n]{b}=\sqrt[n]{a\,b}\qquad \frac{\sqrt[n]{a}}{\sqrt[n]{b}}=\sqrt[n]{\frac{a}{b}}$$`, [r`La raíz **no** se distribuye en sumas: $\sqrt{9+16}=5\neq 3+4$.`]),
    card('m1-07', NUM, r`¿Cómo se simplifica $\sqrt{72}$?`, r`Se busca el mayor cuadrado perfecto que divide al radicando: $$\sqrt{72}=\sqrt{36\cdot 2}=6\sqrt{2}$$`, [r`Solo se suman raíces semejantes: $6\sqrt2+\sqrt2=7\sqrt2$.`]),
    card('m1-08', NUM, r`Notación científica`, r`Un número se escribe como $a\cdot 10^{n}$ con $1\le |a|<10$ y $n$ entero.`, [r`$0{,}00052=5{,}2\cdot 10^{-4}$ y $340\,000=3{,}4\cdot 10^{5}$.`, r`Al multiplicar se multiplican las mantisas y se suman los exponentes.`]),
    card('m1-09', NUM, r`Suma, multiplicación y división de fracciones`, r`$$\frac{a}{b}+\frac{c}{d}=\frac{ad+bc}{bd}\qquad \frac{a}{b}\cdot\frac{c}{d}=\frac{ac}{bd}\qquad \frac{a}{b}:\frac{c}{d}=\frac{a}{b}\cdot\frac{d}{c}$$`, [r`Para sumar conviene usar el mínimo común múltiplo de los denominadores.`]),
    card('m1-10', NUM, r`Decimal periódico y semiperiódico a fracción`, r`$0{,}\overline{3}=\frac{3}{9}=\frac{1}{3}$. Semiperiódico: $$0{,}1\overline{6}=\frac{16-1}{90}=\frac{15}{90}=\frac{1}{6}$$`, [r`Numerador: el número sin coma menos la parte no periódica. Denominador: un 9 por cifra periódica y un 0 por cifra no periódica.`]),
    card('m1-11', NUM, r`Calcular el $p\%$ de una cantidad $C$`, r`$$p\%\ \text{de}\ C=\frac{p}{100}\cdot C$$`, [r`El 15 % de 2400 es $0{,}15\cdot 2400=360$.`]),
    card('m1-12', NUM, r`Aumento y descuento porcentual en un solo paso`, r`Aumentar un $p\%$: multiplicar por $\left(1+\frac{p}{100}\right)$. Descontar un $p\%$: multiplicar por $\left(1-\frac{p}{100}\right)$.`, [r`Precio con 19 % de IVA: $1{,}19\cdot P$. Con 30 % de descuento: $0{,}7\cdot P$.`]),
    card('m1-13', NUM, r`Un precio sube 20 % y luego baja 20 %. ¿Vuelve al original?`, r`**No.** Los porcentajes sucesivos se multiplican: $$1{,}2\cdot 0{,}8=0{,}96$$ El precio final es 4 % menor que el inicial.`, [r`La segunda variación se calcula sobre el nuevo valor, no sobre el original.`]),
    card('m1-14', NUM, r`Proporcionalidad directa`, r`$x$ e $y$ son directamente proporcionales si su **cociente** es constante: $$\frac{y}{x}=k\iff y=k\,x$$`, [r`Su gráfico es una recta que pasa por el origen.`, r`Si una se duplica, la otra también.`]),
    card('m1-15', NUM, r`Proporcionalidad inversa`, r`$x$ e $y$ son inversamente proporcionales si su **producto** es constante: $$x\cdot y=k$$`, [r`Su gráfico es una hipérbola. Ejemplo: trabajadores y días para terminar una obra.`, r`Si 4 personas tardan 6 días, 8 personas tardan $\frac{24}{8}=3$ días.`]),
    card('m1-16', NUM, r`Repartir una cantidad $N$ en la razón $a:b$`, r`$$\text{partes: }\ \frac{a}{a+b}\,N\quad\text{y}\quad\frac{b}{a+b}\,N$$`, [r`Repartir 120 en razón $2:3$: $\frac{2}{5}\cdot 120=48$ y $\frac{3}{5}\cdot 120=72$.`]),

    // ── Álgebra y funciones ──
    card('m1-17', ALG, r`Cuadrado de binomio`, r`$$(a\pm b)^2=a^2\pm 2ab+b^2$$`, [r`Error típico: $(a+b)^2\neq a^2+b^2$; falta el doble producto $2ab$.`]),
    card('m1-18', ALG, r`Suma por su diferencia`, r`$$(a+b)(a-b)=a^2-b^2$$`, [r`$(x+5)(x-5)=x^2-25$; sirve también para calcular $21\cdot 19=400-1=399$.`]),
    card('m1-19', ALG, r`Producto de binomios con un término común`, r`$$(x+a)(x+b)=x^2+(a+b)\,x+ab$$`, [r`$(x+3)(x-7)=x^2-4x-21$.`]),
    card('m1-20', ALG, r`Cubo de binomio`, r`$$(a\pm b)^3=a^3\pm 3a^2b+3ab^2\pm b^3$$`, [r`$(x+1)^3=x^3+3x^2+3x+1$.`]),
    card('m1-21', ALG, r`Factorizar por **factor común**`, r`Se extrae el máximo común divisor de los coeficientes y la menor potencia de cada variable: $$6x^2+9x=3x\,(2x+3)$$`),
    card('m1-22', ALG, r`Factorizar un trinomio $x^2+bx+c$`, r`Se buscan dos números que **multiplicados** den $c$ y **sumados** den $b$: $$x^2-5x+6=(x-2)(x-3)$$`, [r`Comprueba multiplicando: $(x-2)(x-3)=x^2-5x+6$.`]),
    card('m1-23', ALG, r`Factorizar una diferencia de cuadrados`, r`$$a^2-b^2=(a+b)(a-b)\qquad 9x^2-25=(3x+5)(3x-5)$$`, [r`Una **suma** de cuadrados, $a^2+b^2$, no se factoriza en los reales.`]),
    card('m1-24', ALG, r`Resolver $3(x-2)=x+4$`, r`$$3x-6=x+4\ \Rightarrow\ 2x=10\ \Rightarrow\ x=5$$`, [r`Se aplica la misma operación inversa a ambos lados y se comprueba: $3\cdot 3=9=5+4$.`]),
    card('m1-25', ALG, r`¿Qué cambia al multiplicar o dividir una **inecuación** por un número negativo?`, r`Se **invierte** el sentido de la desigualdad: $$-2x<6\ \Rightarrow\ x>-3$$`, [r`Sumar o restar el mismo número no cambia el sentido.`, r`La solución se expresa como intervalo: $\left]-3,+\infty\right[$.`]),
    card('m1-26', ALG, r`Sistema $2\times 2$ con **solución única**`, r`Las rectas se cortan en un punto (compatible determinado): $$\frac{a_1}{a_2}\neq\frac{b_1}{b_2}$$`, [r`Para $a_1x+b_1y=c_1$ y $a_2x+b_2y=c_2$: pendientes distintas.`]),
    card('m1-27', ALG, r`Sistema $2\times 2$ **sin solución**`, r`Las rectas son paralelas distintas (incompatible): $$\frac{a_1}{a_2}=\frac{b_1}{b_2}\neq\frac{c_1}{c_2}$$`, [r`$x+y=2$ y $2x+2y=7$: misma pendiente, distinto corte.`]),
    card('m1-28', ALG, r`Sistema $2\times 2$ con **infinitas soluciones**`, r`Las rectas son coincidentes (compatible indeterminado): $$\frac{a_1}{a_2}=\frac{b_1}{b_2}=\frac{c_1}{c_2}$$`, [r`$x+y=2$ y $3x+3y=6$ son la misma recta.`]),
    card('m1-29', ALG, r`Resolver por reducción: $x+y=10$ y $x-y=4$`, r`Sumando ambas ecuaciones se elimina $y$: $$2x=14\Rightarrow x=7,\quad y=10-7=3$$`, [r`Otros métodos: sustitución e igualación. Verifica en las dos ecuaciones.`]),
    card('m1-30', ALG, r`Función afín $f(x)=mx+n$: ¿qué indican $m$ y $n$?`, r`$m$ es la **pendiente** (cambio de $y$ por cada unidad de $x$); $n$ es el **coeficiente de posición**: la recta corta el eje $y$ en $(0,n)$.`, [r`Si $n=0$ la función es lineal y pasa por el origen.`, r`Modela «cargo fijo + cobro por unidad».`]),
    card('m1-31', ALG, r`Pendiente de la recta que pasa por $(x_1,y_1)$ y $(x_2,y_2)$`, r`$$m=\frac{y_2-y_1}{x_2-x_1}$$`, [r`$m>0$: creciente; $m<0$: decreciente; $m=0$: constante (horizontal).`]),
    card('m1-32', ALG, r`Condición de rectas paralelas y perpendiculares`, r`Paralelas: $m_1=m_2$. Perpendiculares: $$m_1\cdot m_2=-1$$`, [r`La perpendicular a $y=2x+1$ tiene pendiente $-\frac{1}{2}$.`]),
    card('m1-33', ALG, r`Función cuadrática $f(x)=ax^2+bx+c$: concavidad y corte con el eje $y$`, r`Si $a>0$ la parábola abre hacia **arriba** (tiene mínimo); si $a<0$, hacia **abajo** (tiene máximo). Corta el eje $y$ en $(0,c)$.`),
    card('m1-34', ALG, r`Vértice y eje de simetría de la parábola`, r`$$x_v=-\frac{b}{2a}\qquad y_v=f\!\left(x_v\right)$$ El eje de simetría es la recta $x=-\frac{b}{2a}$.`, [r`$f(x)=x^2-6x+5$: $x_v=3$, $y_v=9-18+5=-4$, vértice $(3,-4)$.`]),
    card('m1-35', ALG, r`Discriminante $\Delta=b^2-4ac$ y cortes con el eje $x$`, r`$\Delta>0$: dos ceros reales distintos. $\Delta=0$: un cero (el vértice toca el eje $x$). $\Delta<0$: no corta el eje $x$.`, [r`$x^2+2x+5$: $\Delta=4-20=-16<0$, no tiene ceros reales.`]),
    card('m1-36', ALG, r`Fórmula general de la ecuación $ax^2+bx+c=0$`, r`$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$`, [r`$x^2-5x+6=0$: $x=\frac{5\pm 1}{2}$, es decir, $x=3$ o $x=2$.`]),

    // ── Geometría ──
    card('m1-37', GEO, r`Teorema de Pitágoras`, r`En un triángulo rectángulo de catetos $a$, $b$ e hipotenusa $c$: $$a^2+b^2=c^2$$`, [r`Tríos útiles: $3,4,5$; $5,12,13$; $8,15,17$ y sus múltiplos.`]),
    card('m1-38', GEO, r`Suma de ángulos interiores`, r`Triángulo: $180^\circ$. Polígono de $n$ lados: $$180^\circ\,(n-2)$$`, [r`Un ángulo exterior de un triángulo es igual a la suma de los dos interiores no adyacentes.`]),
    card('m1-39', GEO, r`Teorema de Thales`, r`Si dos transversales son cortadas por rectas **paralelas**, los segmentos que se forman son proporcionales: $$\frac{AB}{BC}=\frac{A'B'}{B'C'}$$`, [r`Se usa para calcular alturas con sombras: $\frac{h}{s}=\frac{h'}{s'}$.`]),
    card('m1-40', GEO, r`Criterios de semejanza de triángulos y efecto de la razón $k$`, r`Criterios **AA**, **LLL** (lados proporcionales) y **LAL**. Con razón $k$: lados y perímetros $\times k$, áreas $\times k^2$.`, [r`Si la razón es $3$, el área es $9$ veces mayor.`]),
    card('m1-41', GEO, r`Áreas de triángulo, trapecio y rombo`, r`$$A_\triangle=\frac{b\cdot h}{2}\qquad A_{\text{trapecio}}=\frac{(a+c)\,h}{2}\qquad A_{\text{rombo}}=\frac{d_1\cdot d_2}{2}$$`),
    card('m1-42', GEO, r`Círculo y sector circular`, r`Área $\pi r^2$ y perímetro $2\pi r$. Sector de ángulo $\alpha$: $$A=\frac{\alpha}{360^\circ}\,\pi r^2$$`, [r`Si el radio se duplica, el área se cuadruplica.`]),
    card('m1-43', GEO, r`Volumen de prismas y cilindros`, r`$$V=A_{\text{basal}}\cdot h\qquad V_{\text{cilindro}}=\pi r^2 h$$`),
    card('m1-44', GEO, r`Volumen de pirámide, cono y esfera`, r`$$V_{\text{pirámide}}=\frac{A_{\text{basal}}\cdot h}{3}\qquad V_{\text{cono}}=\frac{\pi r^2h}{3}\qquad V_{\text{esfera}}=\frac{4}{3}\pi r^3$$`, [r`Un cono cabe tres veces en el cilindro de igual base y altura.`]),
    card('m1-45', GEO, r`Cubo de arista $a$: área, volumen y diagonal`, r`Área total $6a^2$, volumen $a^3$, diagonal de una cara $a\sqrt{2}$ y diagonal del cubo $a\sqrt{3}$.`),
    card('m1-46', GEO, r`Vector $\vec v=(x,y)$: módulo y suma`, r`$$|\vec v|=\sqrt{x^2+y^2}\qquad (a,b)+(c,d)=(a+c,\ b+d)$$`, [r`$|(3,-4)|=\sqrt{9+16}=5$.`]),
    card('m1-47', GEO, r`Ponderar un vector y vector entre dos puntos`, r`$k\cdot(x,y)=(kx,\,ky)$ y $$\overrightarrow{AB}=(x_B-x_A,\ y_B-y_A)$$`, [r`Si $k<0$ el vector cambia de sentido.`]),
    card('m1-48', GEO, r`Traslación de un punto según el vector $\vec v=(a,b)$`, r`$$(x,y)\mapsto(x+a,\ y+b)$$`, [r`La traslación conserva forma, tamaño y orientación (isometría).`]),
    card('m1-49', GEO, r`Reflexión de $(x,y)$ respecto del eje $x$, del eje $y$ y del origen`, r`Eje $x$: $(x,-y)$. Eje $y$: $(-x,y)$. Origen: $(-x,-y)$.`),
    card('m1-50', GEO, r`Rotación de $(x,y)$ en torno al origen (sentido antihorario)`, r`$90^\circ$: $(-y,\,x)$. $180^\circ$: $(-x,\,-y)$. $270^\circ$: $(y,\,-x)$.`, [r`$(2,1)$ rotado $90^\circ$ queda en $(-1,2)$.`]),
    card('m1-51', GEO, r`Distancia y punto medio entre $(x_1,y_1)$ y $(x_2,y_2)$`, r`$$d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}\qquad M=\left(\frac{x_1+x_2}{2},\ \frac{y_1+y_2}{2}\right)$$`),

    // ── Probabilidad y estadística ──
    card('m1-52', EST, r`Media aritmética (con y sin tabla de frecuencias)`, r`$$\bar{x}=\frac{\sum x_i}{n}\qquad \bar{x}=\frac{\sum x_i\,f_i}{n}$$`, [r`La media es sensible a valores extremos.`]),
    card('m1-53', EST, r`Mediana y moda`, r`**Mediana**: el dato central con los datos **ordenados** (si $n$ es par, el promedio de los dos centrales). **Moda**: el dato más frecuente.`, [r`La mediana no se altera por un valor extremo.`]),
    card('m1-54', EST, r`Cuartiles y rango intercuartílico`, r`$Q_1$ deja bajo él el 25 % de los datos, $Q_2$ es la mediana y $Q_3$ deja el 75 %. $$RI=Q_3-Q_1$$`, [r`El rango intercuartílico mide la dispersión del 50 % central.`]),
    card('m1-55', EST, r`Percentil $P_k$`, r`Valor bajo el cual queda el $k\%$ de los datos ordenados. $$P_{25}=Q_1\qquad P_{50}=\text{mediana}\qquad P_{75}=Q_3$$`, [r`Estar en el percentil 80 significa superar o igualar al 80 % del grupo, no tener 80 puntos.`]),
    card('m1-56', EST, r`¿Qué muestra un **diagrama de cajón**?`, r`Mínimo, $Q_1$, mediana, $Q_3$ y máximo. La caja contiene el 50 % central de los datos.`, [r`Una caja o un bigote más largo indica datos más dispersos en ese tramo, no más datos.`]),
    card('m1-57', EST, r`Rango de un conjunto de datos`, r`$$\text{Rango}=\text{máximo}-\text{mínimo}$$`, [r`Es la medida de dispersión más simple y la más sensible a valores extremos.`]),
    card('m1-58', EST, r`Regla de Laplace`, r`Con resultados equiprobables: $$P(A)=\frac{\text{casos favorables}}{\text{casos posibles}},\qquad 0\le P(A)\le 1$$`, [r`Sacar un número par con un dado: $\frac{3}{6}=\frac{1}{2}$.`]),
    card('m1-59', EST, r`Probabilidad del complemento`, r`$$P(A^c)=1-P(A)$$`, [r`«Al menos uno» se calcula como $1-P(\text{ninguno})$.`]),
    card('m1-60', EST, r`Regla de la suma (probabilidad de $A$ **o** $B$)`, r`$$P(A\cup B)=P(A)+P(B)-P(A\cap B)$$`, [r`Si $A$ y $B$ son mutuamente excluyentes, $P(A\cap B)=0$ y basta sumar.`]),
    card('m1-61', EST, r`Regla del producto (probabilidad de $A$ **y** $B$)`, r`Si $A$ y $B$ son independientes: $$P(A\cap B)=P(A)\cdot P(B)$$`, [r`Dos caras al lanzar dos monedas: $\frac{1}{2}\cdot\frac{1}{2}=\frac{1}{4}$.`, r`Sin reposición, la segunda probabilidad cambia: los eventos dejan de ser independientes.`]),
    card('m1-62', EST, r`Principio multiplicativo`, r`Si una acción se puede hacer de $m$ formas y otra de $n$ formas, ambas juntas se pueden hacer de $m\cdot n$ formas.`, [r`Lanzar dos dados: $6\cdot 6=36$ resultados posibles.`]),
    card('m1-63', EST, r`Frecuencia relativa y ley de los grandes números`, r`$$f_r=\frac{f}{n}$$ Al aumentar el número de repeticiones, la frecuencia relativa se acerca a la probabilidad teórica.`),
  ],
}
