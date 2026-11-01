import type { Deck } from '@/types/flashcards'
import { card } from './helpers'

const ATO = 'Estructura atómica'
const ORG = 'Química orgánica'
const REA = 'Reacciones químicas y estequiometría'
const SOL = 'Soluciones'
const r = String.raw

export const quimica: Deck = {
  id: 'quimica',
  title: 'Ciencias: Química',
  subject: 'ciencias',
  mono: 'QU',
  description: 'Estructura atómica, química orgánica, reacciones y estequiometría, soluciones.',
  units: [ATO, ORG, REA, SOL],
  cards: [
    card('qui-01', ATO, r`Número atómico ($Z$) y número másico ($A$)`, r`$Z$ = número de **protones**. $A$ = protones + neutrones. Neutrones: $n=A-Z$.`),
    card('qui-02', ATO, r`¿Qué son los isótopos?`, r`Átomos del **mismo elemento** (igual $Z$) con **distinto número de neutrones** (distinto $A$).`, [r`Ejemplo: carbono-12 y carbono-14.`]),
    card('qui-03', ATO, r`Catión vs. anión`, r`**Catión**: ion positivo, perdió electrones. **Anión**: ion negativo, ganó electrones.`, [r`Electrones del ion: $Z-\text{carga}$.`]),
    card('qui-04', ATO, r`¿Cuántos electrones tiene el ion $\mathrm{Na^+}$ ($Z=11$)?`, r`**10 electrones**: el átomo neutro tiene 11 y el catión perdió uno.`),
    card('qui-05', ATO, r`Aporte del modelo de Rutherford`, r`El átomo tiene un **núcleo pequeño, denso y positivo** que concentra casi toda la masa; los electrones giran alrededor y la mayor parte del átomo es espacio vacío.`, [r`Basado en el experimento de la lámina de oro.`]),
    card('qui-06', ATO, r`Aporte del modelo de Bohr`, r`Los electrones ocupan **niveles de energía** definidos; emiten o absorben energía al saltar entre niveles.`),
    card('qui-07', ATO, r`Configuración electrónica del cloro ($Z=17$)`, r`$1s^2\,2s^2\,2p^6\,3s^2\,3p^5$: período 3, grupo 17, **7 electrones de valencia**.`, [r`Tiende a ganar 1 electrón: $\mathrm{Cl^-}$.`]),
    card('qui-08', ATO, r`Tendencia de la electronegatividad en la tabla periódica`, r`**Aumenta** hacia arriba y hacia la derecha (el flúor es el más electronegativo).`, [r`El radio atómico aumenta hacia abajo y hacia la izquierda.`]),
    card('qui-09', ATO, r`Enlace iónico vs. covalente`, r`**Iónico**: transferencia de electrones entre metal y no metal. **Covalente**: compartición de electrones entre no metales.`, [r`Ejemplos: $\mathrm{NaCl}$ (iónico), $\mathrm{H_2O}$ (covalente polar).`]),
    card('qui-10', ORG, r`¿Cuántos enlaces forma el carbono y por qué es tan versátil?`, r`Forma **4 enlaces** y puede unirse a otros carbonos formando cadenas y anillos (concatenación).`),
    card('qui-11', ORG, r`Hibridación del carbono según sus enlaces`, r`Solo simples: $sp^3$ (tetraédrico, $109{,}5^\circ$). Un doble: $sp^2$ (plano, $120^\circ$). Un triple o dos dobles: $sp$ (lineal, $180^\circ$).`),
    card('qui-12', ORG, r`Enlaces sigma ($\sigma$) y pi ($\pi$)`, r`Todo enlace simple es $\sigma$. Un doble enlace = 1 $\sigma$ + 1 $\pi$. Un triple = 1 $\sigma$ + 2 $\pi$.`),
    card('qui-13', ORG, r`Fórmulas generales de alcanos, alquenos y alquinos`, r`Alcanos $\mathrm{C_nH_{2n+2}}$; alquenos $\mathrm{C_nH_{2n}}$; alquinos $\mathrm{C_nH_{2n-2}}$.`),
    card('qui-14', ORG, r`Grupo funcional **alcohol**`, r`$\mathrm{R{-}OH}$ (hidroxilo). Ejemplo: etanol, $\mathrm{CH_3CH_2OH}$.`),
    card('qui-15', ORG, r`Aldehído vs. cetona`, r`Ambos tienen carbonilo ($\mathrm{C{=}O}$). **Aldehído**: en el extremo de la cadena ($\mathrm{R{-}CHO}$). **Cetona**: en un carbono interno ($\mathrm{R{-}CO{-}R'}$).`, [r`Ejemplos: etanal y propanona (acetona).`]),
    card('qui-16', ORG, r`Grupo funcional **ácido carboxílico**`, r`$\mathrm{R{-}COOH}$ (carboxilo). Ejemplo: ácido acético, $\mathrm{CH_3COOH}$.`),
    card('qui-17', ORG, r`Éter, éster y amina`, r`Éter $\mathrm{R{-}O{-}R'}$; éster $\mathrm{R{-}COO{-}R'}$; amina $\mathrm{R{-}NH_2}$.`),
    card('qui-18', ORG, r`¿Qué son los isómeros?`, r`Compuestos con la **misma fórmula molecular** y **distinta estructura** (y propiedades).`, [r`Ejemplo: butano e isobutano ($\mathrm{C_4H_{10}}$).`]),
    card('qui-19', REA, r`Ley de conservación de la masa (Lavoisier)`, r`En una reacción química la **masa total se conserva**: masa de reactantes = masa de productos.`, [r`Por eso las ecuaciones deben estar balanceadas.`]),
    card('qui-20', REA, r`¿Qué es un mol?`, r`La cantidad de sustancia que contiene $6{,}02\cdot 10^{23}$ partículas (número de Avogadro).`),
    card('qui-21', REA, r`Relación entre masa, moles y masa molar`, r`$$n=\frac{m}{M}$$`, [r`$M$ del agua: $2\cdot 1+16=18$ g/mol.`]),
    card('qui-22', REA, r`¿Qué indican los coeficientes de una ecuación balanceada?`, r`La **proporción en moles** (o moléculas) entre reactantes y productos, no en gramos.`),
    card('qui-23', REA, r`Reactivo limitante`, r`El reactante que **se consume primero** y determina la cantidad máxima de producto.`, [r`El otro queda en exceso.`]),
    card('qui-24', REA, r`Volumen molar de un gas en condiciones normales`, r`**22,4 L** por mol (0 °C y 1 atm).`, [r`Gas ideal: $PV=nRT$.`]),
    card('qui-25', REA, r`Oxidación y reducción`, r`**Oxidación**: pérdida de electrones (aumenta el estado de oxidación). **Reducción**: ganancia de electrones.`, [r`Ocurren siempre juntas (reacción redox).`]),
    card('qui-26', REA, r`Combustión completa de un hidrocarburo`, r`Hidrocarburo + $\mathrm{O_2}\rightarrow\mathrm{CO_2}+\mathrm{H_2O}$ + energía.`),
    card('qui-27', REA, r`Factores que aumentan la rapidez de una reacción`, r`Mayor **temperatura**, mayor **concentración**, mayor **superficie de contacto** y presencia de un **catalizador**.`),
    card('qui-28', SOL, r`Soluto, disolvente y disolución`, r`El **soluto** se disuelve en el **disolvente** (en mayor cantidad); juntos forman una **disolución**, mezcla homogénea.`),
    card('qui-29', SOL, r`Molaridad`, r`$$M=\frac{n_{\text{soluto}}}{V_{\text{disolución}}\ (\text{L})}$$`, [r`Unidad: mol/L.`]),
    card('qui-30', SOL, r`Dilución`, r`$$C_1V_1=C_2V_2$$`, [r`Al diluir, los moles de soluto no cambian.`]),
    card('qui-31', SOL, r`Porcentaje masa/masa`, r`$$\%\,m/m=\frac{m_{\text{soluto}}}{m_{\text{disolución}}}\cdot 100$$`),
    card('qui-32', SOL, r`Definición de pH`, r`$$\mathrm{pH}=-\log[\mathrm{H^+}]$$`, [r`A 25 °C: pH < 7 ácido, = 7 neutro, > 7 básico.`]),
    card('qui-33', SOL, r`Si el pH baja de 5 a 3, ¿cuánto cambia $[\mathrm{H^+}]$?`, r`Aumenta **100 veces**: cada unidad de pH es un factor 10.`),
    card('qui-34', SOL, r`Relación entre pH y pOH a 25 °C`, r`$$\mathrm{pH}+\mathrm{pOH}=14$$`),
    card('qui-35', SOL, r`Propiedades coligativas`, r`Dependen de la **cantidad de partículas** de soluto: descenso del punto de congelación, aumento del punto de ebullición, descenso de la presión de vapor y presión osmótica.`, [r`Por eso la sal derrite el hielo de las calles.`]),
  ],
}
