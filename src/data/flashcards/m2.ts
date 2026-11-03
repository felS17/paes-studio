import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const NUM = 'Números'
const ALG = 'Álgebra y funciones'
const GEO = 'Geometría'
const EST = 'Probabilidad y estadística'
const SUF = 'Suficiencia de datos'
const r = String.raw

export const m2: Deck = {
  id: 'm2',
  title: 'Matemática M2',
  subject: 'm2',
  mono: 'M2',
  description: 'Logaritmos, interés compuesto, funciones exponencial e inversa, trigonometría, homotecia, dispersión, combinatoria, binomial y suficiencia de datos.',
  units: [NUM, ALG, GEO, EST, SUF],
  cards: [
    // ── Números ──
    card('m2-01', NUM, r`Definición de logaritmo`, r`$$\log_b a=c\iff b^{c}=a\qquad (b>0,\ b\neq 1,\ a>0)$$`, [r`$\log_2 32=5$ porque $2^5=32$.`]),
    card('m2-02', NUM, r`Logaritmos notables`, r`$$\log_b 1=0\qquad \log_b b=1\qquad \log_b b^{n}=n\qquad b^{\log_b a}=a$$`, [r`$\log 1000=3$ (base 10).`]),
    card('m2-03', NUM, r`Logaritmo de un producto`, r`$$\log_b(x\cdot y)=\log_b x+\log_b y$$`, [r`$\log 6=\log 2+\log 3\approx 0{,}301+0{,}477=0{,}778$.`]),
    card('m2-04', NUM, r`Logaritmo de un cociente`, r`$$\log_b\frac{x}{y}=\log_b x-\log_b y$$`, [r`$\log 5=\log\frac{10}{2}=1-\log 2\approx 0{,}699$.`]),
    card('m2-05', NUM, r`Logaritmo de una potencia y de una raíz`, r`$$\log_b x^{n}=n\,\log_b x\qquad \log_b\sqrt[n]{x}=\frac{1}{n}\log_b x$$`, [r`$\log 8=3\log 2\approx 0{,}903$.`]),
    card('m2-06', NUM, r`Cambio de base`, r`$$\log_b a=\frac{\log_c a}{\log_c b}=\frac{\log a}{\log b}$$`, [r`$\log_4 8=\frac{\log 8}{\log 4}=\frac{3\log 2}{2\log 2}=\frac{3}{2}$.`]),
    card('m2-07', NUM, r`Errores típicos con logaritmos`, r`$$\log(x+y)\neq \log x+\log y\qquad (\log x)^2\neq \log x^{2}=2\log x$$`, [r`Las propiedades transforman **productos** en sumas, no sumas en productos.`]),
    card('m2-08', NUM, r`Resolver ecuaciones exponenciales`, r`Si se pueden igualar las bases, se igualan los exponentes: $2^{x}=32=2^{5}\Rightarrow x=5$. Si no, se aplica logaritmo: $$3^{x}=7\ \Rightarrow\ x=\frac{\log 7}{\log 3}$$`),
    card('m2-09', NUM, r`Interés simple`, r`$$C_f=C_0\,(1+i\cdot t)$$ El interés se calcula siempre sobre el capital inicial.`, [r`$i$ en decimal y $t$ en la misma unidad de tiempo que la tasa.`]),
    card('m2-10', NUM, r`Interés compuesto`, r`$$C_f=C_0\,(1+i)^{t}$$ El interés de cada período se suma al capital y genera nuevos intereses.`, [r`$100\,000$ pesos al 10 % anual por 2 años: $100\,000\cdot 1{,}1^2=121\,000$ pesos.`]),
    card('m2-11', NUM, r`Tasa anual con capitalización mensual`, r`$$C_f=C_0\left(1+\frac{i}{12}\right)^{12\,t}$$`, [r`La tasa y el número de períodos siempre deben estar en la misma unidad.`]),
    card('m2-12', NUM, r`Racionalizar denominadores`, r`$$\frac{k}{\sqrt{a}}=\frac{k\sqrt{a}}{a}\qquad \frac{k}{\sqrt{a}-\sqrt{b}}=\frac{k\left(\sqrt{a}+\sqrt{b}\right)}{a-b}$$`, [r`Con binomios se amplifica por el **conjugado**.`]),
    card('m2-13', NUM, r`Racionales e irracionales: ¿qué resultado da operar con ellos?`, r`Racional $\pm$ irracional es **irracional**. El producto de dos irracionales puede ser racional: $$\sqrt{2}\cdot\sqrt{8}=\sqrt{16}=4$$`, [r`$\pi$, $e$ y $\sqrt{2}$ son irracionales: decimales infinitos no periódicos.`]),

    // ── Álgebra y funciones ──
    card('m2-14', ALG, r`Función exponencial $f(x)=a\cdot b^{x}$`, r`Si $b>1$ es creciente (crecimiento); si $0<b<1$ es decreciente (decaimiento). Corta el eje $y$ en $(0,a)$ y tiene asíntota $y=0$.`),
    card('m2-15', ALG, r`Función logarítmica $f(x)=\log_b x$`, r`Dominio $x>0$, pasa por $(1,0)$ y es la **inversa** de $b^{x}$: sus gráficos son simétricos respecto de la recta $y=x$.`),
    card('m2-16', ALG, r`¿Cómo se obtiene la función inversa? Ejemplo: $f(x)=2x+3$`, r`Se despeja $x$ de $y=f(x)$ y se intercambian las variables: $$y=2x+3\Rightarrow x=\frac{y-3}{2}\Rightarrow f^{-1}(x)=\frac{x-3}{2}$$`, [r`Existe si $f$ es biyectiva. Se cumple $f^{-1}(f(x))=x$.`]),
    card('m2-17', ALG, r`Composición de funciones`, r`$$(f\circ g)(x)=f\big(g(x)\big)$$ Primero se aplica $g$ y luego $f$. En general $f\circ g\neq g\circ f$.`, [r`$f(x)=x^2$, $g(x)=x+1$: $(f\circ g)(x)=(x+1)^2$ y $(g\circ f)(x)=x^2+1$.`]),
    card('m2-18', ALG, r`Suma y producto de las raíces de $ax^2+bx+c=0$`, r`$$x_1+x_2=-\frac{b}{a}\qquad x_1\cdot x_2=\frac{c}{a}$$`, [r`Permite armar la ecuación: raíces $2$ y $5$ dan $x^2-7x+10=0$.`]),
    card('m2-19', ALG, r`Crecimiento con tiempo de duplicación $T$`, r`$$N(t)=N_0\cdot 2^{\,t/T}$$`, [r`1024 bacterias que se duplican cada hora: después de 3 horas hay $1024\cdot 2^3=8192$.`]),
    card('m2-20', ALG, r`Intersección de una recta y una parábola`, r`Se igualan las expresiones y se resuelve la ecuación cuadrática que resulta; su discriminante dice si hay 2, 1 o 0 puntos de intersección.`),
    card('m2-21', ALG, r`Resolver la inecuación $x^2-4<0$`, r`Las raíces son $\pm 2$ y la parábola abre hacia arriba, así que es negativa entre ellas: $$-2<x<2$$`, [r`Error típico: escribir $x<\pm 2$.`]),
    card('m2-22', ALG, r`Restricciones del dominio de una función`, r`Raíz de índice par: radicando $\ge 0$. Fracción: denominador $\neq 0$. Logaritmo: argumento $>0$.`, [r`$f(x)=\frac{1}{\sqrt{x-3}}$ tiene dominio $x>3$.`]),

    // ── Geometría ──
    card('m2-23', GEO, r`Razones trigonométricas en el triángulo rectángulo`, r`$$\sen\alpha=\frac{\text{cateto opuesto}}{\text{hipotenusa}}\qquad \cos\alpha=\frac{\text{cateto adyacente}}{\text{hipotenusa}}\qquad \tan\alpha=\frac{\text{cateto opuesto}}{\text{cateto adyacente}}$$`),
    card('m2-24', GEO, r`Identidades fundamentales`, r`$$\sen^2\alpha+\cos^2\alpha=1\qquad \tan\alpha=\frac{\sen\alpha}{\cos\alpha}$$`, [r`Si $\sen\alpha=\frac{3}{5}$ (ángulo agudo), entonces $\cos\alpha=\frac{4}{5}$ y $\tan\alpha=\frac{3}{4}$.`]),
    card('m2-25', GEO, r`Valores de $\sen$, $\cos$ y $\tan$ en $30^\circ$, $45^\circ$ y $60^\circ$`, r`$\sen$: $\frac{1}{2},\ \frac{\sqrt2}{2},\ \frac{\sqrt3}{2}$. $\cos$: $\frac{\sqrt3}{2},\ \frac{\sqrt2}{2},\ \frac{1}{2}$. $\tan$: $\frac{\sqrt3}{3},\ 1,\ \sqrt3$.`),
    card('m2-26', GEO, r`Razones de ángulos complementarios`, r`$$\sen\alpha=\cos\left(90^\circ-\alpha\right)\qquad \cos\alpha=\sen\left(90^\circ-\alpha\right)$$`),
    card('m2-27', GEO, r`Ángulo de elevación y de depresión`, r`Se miden desde la **horizontal** del observador. Con distancia horizontal $d$ y ángulo $\alpha$, la altura es $$h=d\cdot\tan\alpha$$`, [r`El ángulo de depresión desde arriba es igual al de elevación desde abajo (ángulos alternos).`]),
    card('m2-28', GEO, r`Homotecia de centro $O$ y razón $k$`, r`Cada punto $P$ va a $P'$ con $\overrightarrow{OP'}=k\,\overrightarrow{OP}$. Con centro en el origen: $$(x,y)\mapsto(kx,\ ky)$$`),
    card('m2-29', GEO, r`Homotecia con $k>0$ y con $k<0$`, r`$k>0$: la imagen queda del **mismo lado** del centro y con la misma orientación. $k<0$: queda del **lado opuesto** e invertida (equivale a rotar $180^\circ$).`, [r`$|k|>1$ amplía; $|k|<1$ reduce; $k=-1$ es una simetría central.`]),
    card('m2-30', GEO, r`Efecto de la razón de homotecia en longitudes, áreas y volúmenes`, r`Longitudes $\times|k|$, áreas $\times k^2$, volúmenes $\times|k|^3$.`, [r`Con $k=-2$, un área de $5$ pasa a $20$ (el área nunca es negativa).`]),
    card('m2-31', GEO, r`Ecuación de la recta: punto-pendiente y general`, r`$$y-y_1=m\,(x-x_1)\qquad ax+by+c=0\ \text{ con }\ m=-\frac{a}{b}$$`),
    card('m2-32', GEO, r`Área y volumen de la esfera; volumen del cono`, r`$$A_{\text{esfera}}=4\pi r^2\qquad V_{\text{esfera}}=\frac{4}{3}\pi r^3\qquad V_{\text{cono}}=\frac{1}{3}\pi r^2h$$`),

    // ── Probabilidad y estadística ──
    card('m2-33', EST, r`Varianza de una población`, r`$$\sigma^2=\frac{\sum\left(x_i-\mu\right)^2}{n}$$ Promedio de los cuadrados de las desviaciones respecto de la media.`),
    card('m2-34', EST, r`Desviación estándar`, r`$$\sigma=\sqrt{\sigma^2}$$ Mide cuánto se alejan los datos de la media, en la misma unidad que los datos.`, [r`Datos iguales: $\sigma=0$. Más dispersión, mayor $\sigma$.`]),
    card('m2-35', EST, r`Efecto de transformar todos los datos`, r`Sumar $c$: la media aumenta en $c$ y $\sigma$ **no cambia**. Multiplicar por $k$: la media y $\sigma$ se multiplican por $|k|$ (la media por $k$) y la varianza por $k^2$.`),
    card('m2-36', EST, r`Distribución normal $N(\mu,\sigma)$`, r`Es simétrica respecto de $\mu$: cerca del 68 % de los datos está en $\mu\pm\sigma$, el 95 % en $\mu\pm 2\sigma$ y el 99,7 % en $\mu\pm 3\sigma$. $$z=\frac{x-\mu}{\sigma}$$`),
    card('m2-37', EST, r`Permutaciones de $n$ elementos distintos`, r`Ordenar los $n$ elementos: $$P_n=n!$$`, [r`4 personas en una fila: $4!=24$ formas.`]),
    card('m2-38', EST, r`Variaciones: elegir $k$ de $n$ **importando el orden**`, r`$$V_k^n=\frac{n!}{(n-k)!}$$`, [r`Presidente y tesorero entre 10 personas: $10\cdot 9=90$.`]),
    card('m2-39', EST, r`Combinaciones: elegir $k$ de $n$ **sin importar el orden**`, r`$$\binom{n}{k}=\frac{n!}{k!\,(n-k)!}$$`, [r`Una comisión de 2 personas entre 5: $\binom{5}{2}=10$.`]),
    card('m2-40', EST, r`Permutaciones con elementos repetidos`, r`$$\frac{n!}{a!\,b!\cdots}$$ donde $a,b,\ldots$ son las repeticiones de cada elemento.`, [r`Anagramas de «ANA»: $\frac{3!}{2!}=3$.`]),
    card('m2-41', EST, r`Probabilidad condicional`, r`$$P(A\mid B)=\frac{P(A\cap B)}{P(B)},\qquad P(B)>0$$`, [r`En una tabla de doble entrada se divide por el total de la fila o columna de la condición.`]),
    card('m2-42', EST, r`¿Cuándo son independientes dos eventos?`, r`Cuando saber que ocurrió uno no cambia la probabilidad del otro: $$P(A\mid B)=P(A)\iff P(A\cap B)=P(A)\cdot P(B)$$`, [r`Excluyentes no es lo mismo que independientes.`]),
    card('m2-43', EST, r`Distribución binomial`, r`$n$ ensayos independientes con probabilidad de éxito $p$ constante: $$P(X=k)=\binom{n}{k}p^{k}(1-p)^{\,n-k}$$`, [r`Exactamente 2 caras en 4 lanzamientos: $\binom{4}{2}\left(\frac12\right)^4=\frac{6}{16}$.`]),
    card('m2-44', EST, r`Esperanza y varianza de una binomial`, r`$$E(X)=n\,p\qquad V(X)=n\,p\,(1-p)$$`, [r`20 preguntas al azar con 4 alternativas: se esperan $20\cdot\frac14=5$ aciertos.`]),
    card('m2-45', EST, r`Esperanza de una variable aleatoria discreta`, r`$$E(X)=\sum x_i\cdot P(X=x_i)$$`, [r`Es el promedio a largo plazo, no necesariamente un valor que $X$ pueda tomar.`]),
    card('m2-46', EST, r`Función de probabilidad: ¿qué condiciones cumple?`, r`Cada $P(X=x_i)$ está entre $0$ y $1$, y la suma de todas es $1$: $$\sum P(X=x_i)=1$$`),

    // ── Suficiencia de datos ──
    card('m2-47', SUF, r`Las cinco alternativas de una pregunta de suficiencia de datos`, r`**A)** (1) por sí sola. **B)** (2) por sí sola. **C)** Ambas juntas, (1) y (2). **D)** Cada una por sí sola, (1) o (2). **E)** Se requiere información adicional.`),
    card('m2-48', SUF, r`Estrategia para resolver suficiencia de datos`, r`Evalúa (1) **sola**, olvidando (2); luego (2) **sola**; solo si ninguna basta, júntalas. No hace falta calcular el valor: basta saber si queda **determinado**.`),
    card('m2-49', SUF, r`Si (1) por sí sola basta y (2) por sí sola también, ¿qué se marca?`, r`La **D)**: cada una por sí sola. Marcar C) es la trampa típica.`),
    card('m2-50', SUF, r`¿Qué significa que un dato «permite determinar» el valor?`, r`Que lleva a **un único** valor. Si quedan dos posibilidades (por ejemplo, $x^2=9$ da $x=\pm 3$), no es suficiente, salvo que el enunciado descarte una.`),
    card('m2-51', SUF, r`Error frecuente al evaluar (2) por sí sola`, r`Usar sin darse cuenta la información de (1). Cada afirmación se evalúa por separado, solo con el enunciado.`),
  ],
}
