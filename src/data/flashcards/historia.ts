import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const HIS = 'Chile y el mundo (siglos XIX y XX)'
const CIU = 'Formación ciudadana'
const ECO = 'Sistema económico'
const r = String.raw

export const historia: Deck = {
  id: 'historia',
  title: 'Historia y Ciencias Sociales',
  subject: 'historia',
  mono: 'HI',
  description: 'Chile y el mundo en los siglos XIX y XX, formación ciudadana y sistema económico.',
  units: [HIS, CIU, ECO],
  cards: [
    card('his-01', HIS, r`¿Qué principio del Antiguo Régimen rompe la Declaración de los Derechos del Hombre (1789)?`, r`Los **privilegios estamentales**: proclama que las personas nacen **libres e iguales en derechos**.`, [r`También afirma la soberanía nacional.`]),
    card('his-02', HIS, r`Consecuencias sociales de la Revolución Industrial`, r`**Urbanización** acelerada, surgimiento del **proletariado** y de la burguesía industrial, y la llamada cuestión obrera.`),
    card('his-03', HIS, r`¿Qué desencadenó la formación de juntas de gobierno en América en 1810?`, r`La **invasión napoleónica a España** (1808) y la captura de **Fernando VII**, que generó una crisis de legitimidad.`),
    card('his-04', HIS, r`¿Qué fue la Primera Junta Nacional de Gobierno de Chile?`, r`El gobierno formado en el cabildo abierto del **18 de septiembre de 1810**, que juró gobernar **en nombre de Fernando VII**.`, [r`No declaró la independencia.`]),
    card('his-05', HIS, r`Año de la proclamación de la independencia de Chile`, r`**1818**.`, [r`Ese año también se libró la batalla de Maipú.`]),
    card('his-06', HIS, r`Rasgos de la Constitución de 1833`, r`Estado **centralizado** y **presidencialista**, con religión católica oficial y voto censitario.`),
    card('his-07', HIS, r`Consecuencia económica de la Guerra del Pacífico (1879–1884)`, r`Chile incorporó Tarapacá y Antofagasta y comenzó el **ciclo del salitre**: grandes ingresos fiscales por impuestos de exportación.`),
    card('his-08', HIS, r`¿Qué fue la cuestión social?`, r`El conjunto de problemas de **vivienda, salud y trabajo** de los sectores populares (fines del siglo XIX e inicios del XX): conventillos, epidemias, bajos salarios.`, [r`1907: matanza de la Escuela Santa María de Iquique.`]),
    card('his-09', HIS, r`Cambios de la Constitución de 1925`, r`Restableció el **presidencialismo** y estableció la **separación entre la Iglesia y el Estado**.`),
    card('his-10', HIS, r`Causas estructurales de la Primera Guerra Mundial`, r`**Imperialismo**, **nacionalismo**, **carrera armamentista** (paz armada) y sistema de **alianzas**.`, [r`Detonante: asesinato del archiduque Francisco Fernando (1914).`]),
    card('his-11', HIS, r`Efecto de la crisis de 1929 en Chile`, r`Fuerte **caída de las exportaciones** (salitre y cobre), desempleo masivo y crisis fiscal.`),
    card('his-12', HIS, r`¿Qué fue la industrialización por sustitución de importaciones (ISI)?`, r`Modelo (desde 1938) en que el **Estado promueve la industria nacional** para producir lo que antes se importaba.`, [r`Símbolo: la CORFO (1939).`]),
    card('his-13', HIS, r`Rasgo central de la Guerra Fría`, r`Rivalidad entre **Estados Unidos y la URSS** (capitalismo y socialismo) **sin enfrentamiento militar directo** entre ambos.`, [r`1962: crisis de los misiles. 1989: caída del Muro de Berlín.`]),
    card('his-14', HIS, r`Chilenización vs. nacionalización del cobre`, r`**Chilenización** (1966, Frei Montalva): el Estado compra parte de las minas. **Nacionalización** (1971, Allende): el Estado asume su propiedad total, con apoyo unánime del Congreso.`),
    card('his-15', HIS, r`Objetivo de la reforma agraria (1962–1973)`, r`**Redistribuir la tierra**, terminar con el latifundio y mejorar la situación del campesinado.`, [r`Ley de 1967 durante el gobierno de Frei Montalva.`]),
    card('his-16', HIS, r`Resultado del plebiscito del 5 de octubre de 1988`, r`Triunfó la opción **«No»**, lo que llevó a elecciones presidenciales y parlamentarias en 1989.`, [r`En 1990 asumió Patricio Aylwin.`]),
    card('his-17', CIU, r`¿Qué es el Estado de derecho?`, r`Situación en que **gobernantes y gobernados se someten a la Constitución y las leyes**, con separación de poderes y respeto a los derechos.`),
    card('his-18', CIU, r`Poderes del Estado en Chile y su función principal`, r`**Ejecutivo** (Presidente): gobernar y administrar. **Legislativo** (Congreso): legislar. **Judicial** (tribunales): juzgar.`),
    card('his-19', CIU, r`¿Qué órgano fiscaliza los actos del Gobierno?`, r`La **Cámara de Diputadas y Diputados** (atribución exclusiva): comisiones investigadoras, interpelaciones, acusaciones constitucionales.`, [r`El Senado actúa como jurado en las acusaciones constitucionales.`]),
    card('his-20', CIU, r`Función de la Contraloría General de la República`, r`**Controlar la legalidad** de los actos de la administración del Estado.`),
    card('his-21', CIU, r`Función del Tribunal Constitucional`, r`Velar por que las **leyes se ajusten a la Constitución**.`),
    card('his-22', CIU, r`Etapas de la formación de la ley`, r`Iniciativa (mensaje o moción) → discusión y aprobación en ambas cámaras → sanción del Presidente → promulgación → publicación.`),
    card('his-23', CIU, r`Características de los derechos humanos`, r`**Universales**, **inalienables**, **indivisibles** e **interdependientes**.`, [r`Referente: Declaración Universal de 1948.`]),
    card('his-24', CIU, r`Democracia directa vs. representativa`, r`**Directa**: la ciudadanía decide por sí misma (plebiscito). **Representativa**: elige autoridades que deciden.`),
    card('his-25', CIU, r`¿Qué significa que la soberanía reside en la nación?`, r`El **poder político emana del pueblo**, que lo ejerce mediante elecciones, plebiscitos y las autoridades que establece la Constitución.`),
    card('his-26', CIU, r`Ejemplos de participación ciudadana`, r`Votar, organizarse (juntas de vecinos, sindicatos, partidos), informarse, opinar en consultas y ejercer control ciudadano.`),
    card('his-27', ECO, r`¿Qué es el problema económico?`, r`La **escasez**: necesidades ilimitadas frente a recursos limitados, lo que obliga a **elegir**.`),
    card('his-28', ECO, r`Costo de oportunidad`, r`El valor de la **mejor alternativa a la que se renuncia** al tomar una decisión.`, [r`Algo gratuito puede tener un costo de oportunidad alto.`]),
    card('his-29', ECO, r`Efecto de un aumento de la demanda (oferta constante)`, r`**Sube el precio** de equilibrio y aumenta la cantidad transada.`),
    card('his-30', ECO, r`Efecto de una disminución de la oferta (por ejemplo, una helada)`, r`**Sube el precio** de equilibrio y disminuye la cantidad transada.`),
    card('his-31', ECO, r`Agentes económicos`, r`**Familias** (consumen y ofrecen trabajo), **empresas** (producen) y **Estado** (regula, cobra impuestos y provee bienes públicos).`),
    card('his-32', ECO, r`¿Qué es la inflación y cómo se mide en Chile?`, r`El **alza sostenida y generalizada de los precios**; se mide con el **IPC** que calcula el INE.`, [r`Reduce el poder adquisitivo del dinero.`]),
    card('his-33', ECO, r`¿Qué hace el Banco Central para frenar la inflación?`, r`**Sube la tasa de política monetaria**: encarece el crédito, modera el gasto y desacelera los precios.`, [r`Meta de inflación: 3 % anual.`]),
    card('his-34', ECO, r`Política monetaria vs. política fiscal`, r`**Monetaria**: Banco Central (tasa de interés). **Fiscal**: Gobierno (gasto público e impuestos).`),
    card('his-35', ECO, r`¿Qué mide el PIB?`, r`El **valor de los bienes y servicios finales** producidos en un país durante un período.`),
    card('his-36', ECO, r`¿Para qué sirve la CAE de un crédito?`, r`Para **comparar créditos**: expresa en un porcentaje anual el costo total (intereses, comisiones y seguros).`, [r`Los derechos del consumidor los resguarda el SERNAC.`]),
  ],
}
