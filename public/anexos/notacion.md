# Apéndice de notación

Los símbolos del curso siguen una convención única. Cuando un módulo usa
notación heredada de una fuente (las tablas de la clase, un artículo
citado), el texto lo advierte. Esta tabla es la referencia rápida.

## La tabla 2×2

|       | D+ (enfermo) | D− (sano) | Total |
|-------|--------------|-----------|-------|
| **E+** (expuesto) | a | b | n₁ |
| **E−** (no expuesto) | c | d | n₀ |
| **Total** | m₁ | m₀ | n |

- Convención de orientación: **filas = exposición, columnas =
  desenlace**. En R la matriz se construye por columnas — el orden de
  los cuatro conteos en el vector es a, c, b, d — o por filas con
  `byrow = TRUE` y orden a, b, c, d. Ambas producen la misma tabla; lo
  que no puede variar es quién es fila.
- En estudios de casos y controles (módulos 14–15) la tabla se dibuja
  igual, pero los totales de columna son cuotas del diseño: ahi `a` es
  "caso expuesto", `c` "control expuesto".

## Medidas de asociación y de impacto

| Símbolo | Nombre | Definición | Convención de signo |
|---|---|---|---|
| $R_1, R_0$ | Riesgo en expuestos / no expuestos | $a/n_1$, $c/n_0$ | — |
| $RR$ | Riesgo relativo | $R_1 / R_0$ | > 1 = daño |
| $OR$ | Razón de odds | $ad/bc$ | > 1 = daño |
| $RD$ | Diferencia de riesgos (exceso) | $R_1 - R_0$ | > 0 = exceso |
| $ARR$ | Reducción absoluta | $R_0 - R_1$ | > 0 = beneficio |
| $NNT$ | Número necesario a tratar | $1/ARR$ | entero de decisión |
| $NNH$ | Número necesario para dañar | $1/\lvert ARR\rvert$ cuando ARR < 0 | entero de decisión |
| $PRA$ | Riesgo atribuible poblacional | $R_P - R_0$ | exceso poblacional |
| $PRAP$ | Fracción atribuible poblacional | $PRA / R_P$ | proporción |

> La convención de signo es única en el curso: **ARR siempre es
> control − tratamiento**. Una ARR negativa es daño y su inverso en
> valor absoluto es el NNH (caso lidocaína, módulo 5).

## Frecuencia y pruebas diagnósticas

| Símbolo | Nombre | Definición |
|---|---|---|
| $I, P, D$ | Incidencia, prevalencia, duración | $P \approx I \times D$ |
| $Se$ | Sensibilidad | $P(T^+ \mid E)$ |
| $Sp$ | Especificidad | $P(T^- \mid S)$ |
| $VPP, VPN$ | Valores predictivos | $P(E \mid T^+)$, $P(S \mid T^-)$ |
| $LR^+, LR^-$ | Razones de verosimilitud | $Se/(1-Sp)$, $(1-Se)/Sp$ |

## Interacción aditiva (módulo 10)

$RERI = RR_{11} - RR_{10} - RR_{01} + 1$; $AP = RERI/RR_{11}$;
$S = (RR_{11}-1) / [(RR_{10}-1)+(RR_{01}-1)]$.
Subíndices: 11 = ambos factores, 10 = solo E, 01 = solo F, 00 = ninguno.

## Confusión, estratificación y ajuste (módulos 7–9)

- $E, D, C, M, X$: exposición, desenlace, confusor, mediador,
  colisionador en los DAGs.
- $OR_{MH}$: estimador de Mantel–Haenszel; $\chi^2_{BD}$: Breslow–Day
  de homogeneidad.
- $SMR$: razón de mortalidad estandarizada = observados / esperados.

## Supervivencia y persona-tiempo (módulos 11–13)

| Símbolo | Nombre |
|---|---|
| $S(t)$ | Probabilidad de sobrevivir más allá de $t$ (Kaplan–Meier) |
| $h(t), \lambda$ | Riesgo instantáneo (hazard); tasa |
| $HR$ | Hazard ratio de Cox |
| `censor` | flag de censura (1 = censurado en VALUNG; el evento es 0) |
| persona-tiempo | suma de tiempos bajo riesgo, denominador de tasas |

## Inferencia exacta (módulo 6)

- $x_1, n_1$: éxitos y total del grupo 1; $\pi_1, \pi_2$: tasas
  poblacionales bajo la alternativa; $\theta$: parámetro de estorbo.
- Bilaterales: *minlike* (ordenar por probabilidad, `fisher.test`) vs.
  *central* (cola menor duplicada, `exact2x2` por defecto).
- Garantía de precisión: $P(L \le L_0)$ sobre la longitud aleatoria del
  IC; su versión con prior Beta es *assurance*.

## Miscelánea de los datasets

- `e, cc` en algunos scripts de la clase: expuestos / casos-controles.
- `valung.csv`: `SurvTime` (días), `censor` (1 = censurado),
  `Prior` (0/10, código de protocolo — no es 0/1).
- `recid.csv`: `emp1`–`emp52` empleo semanal; formato largo en módulo 13.
