import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const OND = 'Ondas'
const MEC = 'Mecánica'
const ENE = 'Energía'
const ELE = 'Electricidad y magnetismo'
const r = String.raw

export const fisica: Deck = {
  id: 'fisica',
  title: 'Ciencias: Física',
  subject: 'ciencias',
  mono: 'FI',
  description: 'Ondas, mecánica, energía, electricidad y magnetismo.',
  units: [OND, MEC, ENE, ELE],
  cards: [
    card('fis-01', OND, r`Relación entre rapidez, longitud de onda y frecuencia`, r`$$v=\lambda\,f$$`, [r`Período: $T=\frac{1}{f}$.`]),
    card('fis-02', OND, r`¿Qué magnitud **no cambia** cuando una onda pasa de un medio a otro?`, r`La **frecuencia**. Cambian la rapidez y la longitud de onda.`),
    card('fis-03', OND, r`Ondas mecánicas vs. electromagnéticas`, r`Las **mecánicas** (sonido, sismos) necesitan un medio material; las **electromagnéticas** (luz, rayos X) también se propagan en el vacío.`),
    card('fis-04', OND, r`Onda transversal vs. longitudinal`, r`**Transversal**: el medio oscila perpendicular a la propagación (luz, cuerda). **Longitudinal**: oscila en la misma dirección (sonido).`),
    card('fis-05', OND, r`¿Qué determina el **tono** y la **intensidad** de un sonido?`, r`El **tono** depende de la frecuencia (agudo = alta frecuencia); la **intensidad**, de la amplitud.`, [r`El timbre depende de la forma de la onda.`]),
    card('fis-06', OND, r`Rango audible humano y rapidez del sonido en el aire`, r`Aproximadamente **20 Hz a 20 000 Hz**; cerca de **340 m/s** en el aire.`, [r`Infrasonido < 20 Hz; ultrasonido > 20 000 Hz.`]),
    card('fis-07', OND, r`Ley de reflexión`, r`El ángulo de incidencia es **igual** al de reflexión, ambos medidos respecto de la **normal**.`),
    card('fis-08', OND, r`Refracción de la luz al pasar del aire al agua`, r`La luz disminuye su rapidez y el rayo **se acerca a la normal**.`, [r`Índice de refracción: $n=\frac{c}{v}$.`]),
    card('fis-09', OND, r`Efecto Doppler`, r`Cambio en la **frecuencia percibida** cuando la fuente y el observador se mueven uno respecto del otro: al acercarse se percibe más aguda; al alejarse, más grave.`),
    card('fis-10', MEC, r`Primera ley de Newton (inercia)`, r`Si la **fuerza neta es cero**, un cuerpo mantiene su estado de reposo o de movimiento con velocidad constante.`),
    card('fis-11', MEC, r`Segunda ley de Newton`, r`$$F_{\text{neta}}=m\,a$$`, [r`La aceleración tiene la dirección de la fuerza neta.`]),
    card('fis-12', MEC, r`Tercera ley de Newton`, r`A toda acción corresponde una reacción de **igual magnitud y sentido opuesto**, aplicada sobre el **otro cuerpo**.`, [r`Por actuar en cuerpos distintos, no se anulan.`]),
    card('fis-13', MEC, r`Masa vs. peso`, r`La **masa** es la cantidad de materia (kg) y no cambia; el **peso** es la fuerza de gravedad, $P=mg$ (N), y depende del lugar.`),
    card('fis-14', MEC, r`Ecuaciones del MRUA`, r`$$v=v_0+at \qquad x=x_0+v_0t+\tfrac{1}{2}at^2$$`, [r`MRU: $x=x_0+vt$.`]),
    card('fis-15', MEC, r`En un gráfico velocidad–tiempo, ¿qué representan la pendiente y el área?`, r`La **pendiente** es la aceleración; el **área bajo la curva**, el desplazamiento.`, [r`En posición–tiempo, la pendiente es la velocidad.`]),
    card('fis-16', MEC, r`Conversión de km/h a m/s`, r`Divide por **3,6**: $72\ \text{km/h}=20\ \text{m/s}$.`),
    card('fis-17', MEC, r`¿Qué fuerza neta actúa sobre un auto que va a 60 km/h constantes en línea recta?`, r`**Cero**: velocidad constante implica aceleración nula.`, [r`El motor equilibra los roces.`]),
    card('fis-18', MEC, r`Presión y densidad`, r`$$p=\frac{F}{A} \qquad \rho=\frac{m}{V}$$`, [r`Presión hidrostática: $p=\rho g h$.`]),
    card('fis-19', MEC, r`Principio de Arquímedes`, r`Un cuerpo sumergido recibe un **empuje** hacia arriba igual al **peso del fluido desplazado**.`),
    card('fis-20', ENE, r`Energía cinética y potencial gravitatoria`, r`$$E_c=\tfrac{1}{2}mv^2 \qquad E_p=mgh$$`),
    card('fis-21', ENE, r`Conservación de la energía mecánica`, r`Sin roce, $E_c+E_p$ se mantiene **constante**; con roce, parte se transforma en calor.`, [r`Caída libre desde $h$: $v=\sqrt{2gh}$.`]),
    card('fis-22', ENE, r`Trabajo y potencia`, r`$$W=F\,d\cos\theta \qquad P=\frac{W}{t}$$`, [r`Unidades: joule (J) y watt (W).`]),
    card('fis-23', ENE, r`Calor vs. temperatura`, r`El **calor** es energía transferida por diferencia de temperatura; la **temperatura** mide la agitación promedio de las partículas.`),
    card('fis-24', ENE, r`Calor sensible`, r`$$Q=m\,c\,\Delta T$$`, [r`Agua: $c=1\ \text{cal}/(\text{g}\cdot{}^\circ\text{C})$.`]),
    card('fis-25', ENE, r`Conducción, convección y radiación`, r`**Conducción**: por contacto (sólidos). **Convección**: por movimiento del fluido. **Radiación**: por ondas electromagnéticas, incluso en el vacío.`),
    card('fis-26', ENE, r`Equilibrio térmico`, r`Dos cuerpos en contacto intercambian calor hasta alcanzar la **misma temperatura**.`, [r`El calor fluye del cuerpo de mayor al de menor temperatura.`]),
    card('fis-27', ENE, r`Escalas Celsius y Kelvin`, r`$$T(\text{K})=T({}^\circ\text{C})+273$$`, [r`0 K es el cero absoluto.`]),
    card('fis-28', ELE, r`Ley de Ohm`, r`$$V=I\,R$$`, [r`$V$ en volt, $I$ en ampere, $R$ en ohm.`]),
    card('fis-29', ELE, r`Potencia eléctrica`, r`$$P=V\,I=I^2R$$`),
    card('fis-30', ELE, r`Resistencias en serie`, r`La **corriente es la misma** en todas; los voltajes se suman: $R_{eq}=R_1+R_2+\dots$`),
    card('fis-31', ELE, r`Resistencias en paralelo`, r`El **voltaje es el mismo** en todas; las corrientes se suman: $\dfrac{1}{R_{eq}}=\dfrac{1}{R_1}+\dfrac{1}{R_2}$.`, [r`La equivalente es menor que la menor resistencia.`]),
    card('fis-32', ELE, r`¿Cómo se conectan los artefactos en una casa y por qué?`, r`En **paralelo**: todos reciben el mismo voltaje y funcionan de forma independiente.`),
    card('fis-33', ELE, r`Interacción entre cargas eléctricas`, r`Cargas de **igual signo se repelen** y de **distinto signo se atraen**.`, [r`Ley de Coulomb: $F=k\dfrac{q_1q_2}{d^2}$.`]),
    card('fis-34', ELE, r`Métodos de electrización`, r`**Frotamiento**, **contacto** e **inducción**.`, [r`La carga total se conserva.`]),
    card('fis-35', ELE, r`Inducción electromagnética`, r`Un **campo magnético variable** induce una corriente eléctrica en un conductor.`, [r`Base de generadores y transformadores.`]),
  ],
}
