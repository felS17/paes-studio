import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const CEL = 'Organización celular'
const PRO = 'Procesos y funciones biológicas'
const HER = 'Herencia y evolución'
const AMB = 'Organismo y ambiente'
const r = String.raw

export const biologia: Deck = {
  id: 'biologia',
  title: 'Ciencias: Biología',
  subject: 'ciencias',
  mono: 'BI',
  description: 'Célula, procesos y funciones, herencia y evolución, organismo y ambiente.',
  units: [CEL, PRO, HER, AMB],
  cards: [
    card('bio-01', CEL, r`¿Qué diferencia estructural principal hay entre una célula procarionte y una eucarionte?`, r`La eucarionte tiene **núcleo** delimitado por membrana y organelos membranosos; la procarionte no (su ADN está en el nucleoide).`, [r`Procariontes: bacterias y arqueas.`, r`Ambas tienen membrana plasmática, citoplasma, ribosomas y ADN.`]),
    card('bio-02', CEL, r`¿Qué estructuras tiene la célula vegetal que no tiene la animal?`, r`**Pared celular** de celulosa, **cloroplastos** y una **vacuola central** grande.`, [r`La animal tiene centríolos; la mayoría de las vegetales no.`]),
    card('bio-03', CEL, r`Función de la mitocondria`, r`Realizar la **respiración celular aeróbica**: oxida glucosa y produce la mayor parte del ATP de la célula.`, [r`Tiene ADN y ribosomas propios (evidencia de la teoría endosimbiótica).`]),
    card('bio-04', CEL, r`Función del ribosoma`, r`Sintetizar **proteínas** traduciendo el ARN mensajero.`, [r`Libres en el citoplasma o adheridos al retículo endoplasmático rugoso.`]),
    card('bio-05', CEL, r`¿Qué es la osmosis?`, r`Paso de **agua** a través de una membrana semipermeable desde el medio con menos solutos (hipotónico) hacia el medio con más solutos (hipertónico).`, [r`Es transporte pasivo: no gasta ATP.`]),
    card('bio-06', CEL, r`Una célula animal en un medio **hipertónico**, ¿qué le ocurre?`, r`**Pierde agua** por osmosis y se arruga (crenación).`, [r`En medio hipotónico, en cambio, gana agua y puede estallar (lisis).`]),
    card('bio-07', CEL, r`Transporte pasivo vs. transporte activo`, r`El **pasivo** ocurre a favor del gradiente de concentración y sin gasto de energía; el **activo**, en contra del gradiente y con gasto de **ATP**.`, [r`Ejemplo de activo: bomba de sodio y potasio.`]),
    card('bio-08', CEL, r`Modelo de mosaico fluido`, r`La membrana es una **bicapa de fosfolípidos** con proteínas insertas que pueden desplazarse lateralmente.`, [r`Cabezas hidrofílicas hacia afuera, colas hidrofóbicas hacia adentro.`]),
    card('bio-09', CEL, r`¿Qué propone la teoría endosimbiótica?`, r`Que **mitocondrias y cloroplastos** se originaron de procariontes que fueron englobados por otra célula y quedaron viviendo en simbiosis.`, [r`Evidencias: doble membrana, ADN circular y ribosomas propios.`]),
    card('bio-10', PRO, r`Ecuación global de la fotosíntesis`, r`$$6\,\mathrm{CO_2}+6\,\mathrm{H_2O}\xrightarrow{\text{luz}}\mathrm{C_6H_{12}O_6}+6\,\mathrm{O_2}$$`, [r`Ocurre en los cloroplastos.`, r`El $\mathrm{O_2}$ liberado proviene del agua (fotólisis).`]),
    card('bio-11', PRO, r`Ecuación global de la respiración celular aeróbica`, r`$$\mathrm{C_6H_{12}O_6}+6\,\mathrm{O_2}\rightarrow 6\,\mathrm{CO_2}+6\,\mathrm{H_2O}+\text{ATP}$$`, [r`Etapas: glucólisis (citoplasma), ciclo de Krebs y cadena respiratoria (mitocondria).`]),
    card('bio-12', PRO, r`¿Cómo actúa una enzima?`, r`Es una proteína que **disminuye la energía de activación** de una reacción, acelerándola, sin consumirse.`, [r`Es específica para su sustrato (modelo llave-cerradura o ajuste inducido).`]),
    card('bio-13', PRO, r`¿Qué le pasa a una enzima a temperaturas mucho mayores que su óptima?`, r`Se **desnaturaliza**: pierde su estructura tridimensional y su sitio activo deja de funcionar.`, [r`Lo mismo ocurre con un pH muy distinto del óptimo.`]),
    card('bio-14', PRO, r`Función de la **insulina**`, r`**Disminuye la glicemia**: favorece la entrada de glucosa a las células y su almacenamiento como glucógeno en el hígado.`, [r`La secretan las células beta del páncreas.`]),
    card('bio-15', PRO, r`Función del **glucagón**`, r`**Aumenta la glicemia**: estimula al hígado a degradar glucógeno y liberar glucosa a la sangre.`, [r`Lo secretan las células alfa del páncreas, en ayuno.`]),
    card('bio-16', PRO, r`¿Qué es la retroalimentación negativa?`, r`Mecanismo homeostático en que la respuesta **se opone al cambio** que la provocó, devolviendo la variable a su valor normal.`, [r`Ejemplo: regulación de la glicemia y de la temperatura corporal.`]),
    card('bio-17', PRO, r`Sinapsis química: ¿cómo se transmite el impulso entre neuronas?`, r`La neurona presináptica libera **neurotransmisores** que se unen a receptores de la neurona postsináptica.`, [r`El impulso viaja como señal eléctrica a lo largo del axón.`]),
    card('bio-18', PRO, r`Inmunidad innata vs. adaptativa`, r`La **innata** es inespecífica y rápida (piel, fagocitos, inflamación); la **adaptativa** es específica, más lenta y genera **memoria** (linfocitos B y T, anticuerpos).`),
    card('bio-19', PRO, r`¿Por qué una vacuna protege?`, r`Presenta un **antígeno inofensivo** que activa la respuesta adaptativa y deja **células de memoria**; ante el patógeno real, la respuesta es rápida e intensa.`, [r`Los antibióticos actúan contra bacterias, no contra virus.`]),
    card('bio-20', HER, r`Mitosis: resultado`, r`**2 células hijas** genéticamente idénticas a la madre, con el mismo número de cromosomas ($2n$).`, [r`Función: crecimiento, reparación y reproducción asexual.`]),
    card('bio-21', HER, r`Meiosis: resultado`, r`**4 células haploides** ($n$), genéticamente distintas entre sí: los gametos.`, [r`El entrecruzamiento (profase I) y la segregación al azar generan variabilidad.`]),
    card('bio-22', HER, r`Número de cromosomas en una célula somática y en un gameto humano`, r`Somática: $2n=46$. Gameto: $n=23$.`),
    card('bio-23', HER, r`Cruce $Aa\times Aa$: proporciones esperadas`, r`Genotipos $1\,AA:2\,Aa:1\,aa$. Fenotipos $3$ dominante $:1$ recesivo.`, [r`Probabilidad de $aa$: $\frac{1}{4}$.`]),
    card('bio-24', HER, r`¿Para qué sirve un cruce de prueba?`, r`Para saber si un individuo de fenotipo dominante es $AA$ o $Aa$: se cruza con un homocigoto recesivo $aa$.`, [r`Si aparece descendencia recesiva, el individuo era $Aa$.`]),
    card('bio-25', HER, r`Genotipo vs. fenotipo`, r`**Genotipo**: los alelos que porta el individuo. **Fenotipo**: las características observables, resultado del genotipo y del ambiente.`),
    card('bio-26', HER, r`Flujo de la información genética (dogma central)`, r`**ADN** $\xrightarrow{\text{transcripción}}$ **ARN** $\xrightarrow{\text{traducción}}$ **proteína**.`, [r`La replicación copia el ADN antes de la división celular.`]),
    card('bio-27', HER, r`Selección natural (Darwin y Wallace)`, r`En una población con **variabilidad heredable**, los individuos con rasgos ventajosos para su ambiente **sobreviven y se reproducen más**, por lo que esos rasgos aumentan su frecuencia.`, [r`Evolucionan las poblaciones, no los individuos.`]),
    card('bio-28', HER, r`¿Por qué aparecen bacterias resistentes a antibióticos?`, r`Ya existían variantes resistentes (mutaciones al azar); el antibiótico eliminó a las sensibles y las resistentes **dejaron más descendencia**.`, [r`El antibiótico no «causa» la resistencia: la selecciona.`]),
    card('bio-29', AMB, r`Regla del 10 % en una cadena trófica`, r`Solo cerca del **10 %** de la energía de un nivel trófico pasa al siguiente; el resto se pierde principalmente como **calor**.`, [r`Por eso las cadenas tróficas son cortas.`]),
    card('bio-30', AMB, r`¿Fluye o se recicla? Energía y materia en un ecosistema`, r`La **energía fluye** en un solo sentido; la **materia se recicla** en ciclos biogeoquímicos (carbono, nitrógeno, agua).`),
    card('bio-31', AMB, r`Mutualismo, comensalismo y parasitismo`, r`**Mutualismo**: ambos se benefician. **Comensalismo**: uno se beneficia y al otro le es indiferente. **Parasitismo**: uno se beneficia a costa del otro.`),
    card('bio-32', AMB, r`Rol de los descomponedores`, r`Degradan la materia orgánica muerta y **devuelven nutrientes** al suelo, cerrando los ciclos de la materia.`, [r`Hongos y bacterias.`]),
    card('bio-33', AMB, r`Factores que determinan el tamaño de una población`, r`Natalidad e inmigración (lo aumentan); mortalidad y emigración (lo disminuyen).`, [r`La capacidad de carga es el tamaño máximo que el ambiente puede sostener.`]),
    card('bio-34', AMB, r`¿Qué es la capacidad de carga?`, r`El **tamaño máximo de población** que un ambiente puede sostener en el tiempo con sus recursos.`, [r`En el modelo logístico, la curva de crecimiento se estabiliza en ella.`]),
    card('bio-35', AMB, r`Efecto invernadero vs. calentamiento global`, r`El **efecto invernadero** es natural y retiene calor gracias a gases como el $\mathrm{CO_2}$; el **calentamiento global** es su intensificación por emisiones humanas.`),
  ],
}
