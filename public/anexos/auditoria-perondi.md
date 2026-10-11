# Auditoría de las cifras sobre la tabla de Perondi et al. (2004)

Fecha: 26 de septiembre de 2026.

**Método.** Recalculé cada cifra desde cero en Python (NumPy y SciPy 1.17.1), sin usar `exact2x2` ni `Exact`. No pude instalar esos paquetes: ni este entorno ni la máquina enlazada tienen acceso a CRAN. Por eso escribí el script `verificar_en_R.R` para correrlo en tu propio R 4.6.1.

**Qué hace la reimplementación independiente:**

- Fisher bilateral por el criterio *minlike*.
- Boschloo como sup sobre π de la cola ordenada por el valor p de Fisher, con una malla de 20.001 puntos y refinamiento local.
- Barnard-CSM con el algoritmo de convexidad de Barnard (1947), en dos variantes: simétrica y con dos colas libres.
- Enumeración completa de las 1.225 tablas.
- Altham por integración numérica.

El código y su salida están en `auditoria_perondi.py` y `salida_auditoria_python.txt`.

## 1. Datos del ensayo

| Afirmación | Estado | Fuente |
|---|---|---|
| Ensayo prospectivo, aleatorizado, doble ciego, n = 68 (34 + 34) | Confirmado | Reseña en PMC6986458 |
| Dosis alta de 0,1 mg/kg como terapia de rescate tras una dosis estándar fallida, paro intrahospitalario | Confirmado | Ídem |
| Supervivencia a 24 h: 7/34 (dosis estándar) frente a 1/34 (dosis alta) | Confirmado | Ídem |
| Los autores reportaron P = 0,05 | Confirmado | Ídem; coincide con Fisher 0,0544 redondeado |
| Alta hospitalaria: 4 frente a 0 | No verificado en esta sesión | Hay que cotejarlo con el PDF original |
| Sede en São Paulo | No verificado en esta sesión | Hay que cotejarlo con el PDF original |

## 2. Cifras estadísticas

| Cifra del ensayo | Recalculado | Veredicto |
|---|---|---|
| Fisher bilateral 0,054 | 0,054400 (igual con SciPy) | **Confirmado** |
| Boschloo 0,038 (*minlike*) | 0,038464, con el sup en π = 0,5 | **Confirmado** |
| Boschloo 0,028 "según la definición bilateral" (*central*) | 0,038464: con n₁ = n₂ la definición *central* da exactamente lo mismo que *minlike* | **No se sostiene.** Ver nota A |
| Barnard-CSM 0,024 | 0,0281 en ambas variantes de CSM | **No reproducido.** Ver nota B |
| Discordancia Fisher-Boschloo 11,6 % | 11,56 % | **Confirmado** |
| 40 tablas rechazadas por Boschloo y no por Fisher; 0 en sentido inverso | 40 y 0 | **Confirmado** |
| Discordancia Fisher-CSM 23,7 % | 17,5 % | **No reproducido.** Depende de CSM |
| Potencia: Fisher 43,3 % y Boschloo 54,9 % | 43,33 % y 54,89 % | **Confirmado** |
| Potencia CSM 67,0 % | 60,8 % | **No reproducido** |
| Tamaño máximo: Fisher 3,1 % (0,0305) y Boschloo 4,7 % (0,0466) | 0,0305 y 0,0466 | **Confirmado** |
| Tamaño máximo CSM 5,7 % (0,0571) | 0,049 | **No reproducido.** Ver nota C |
| SciPy `barnard_exact`: 0,0505 con varianza combinada y 0,161 sin combinar; idénticos con 32, 64 y 256 puntos | 0,050489 y 0,160792, idénticos en las tres mallas | **Confirmado** |
| Altham: Fisher unilateral 0,0272 = posterior con Beta(0,1) y Beta(1,0) | 0,027200065 en ambos cálculos | **Confirmado** (coinciden hasta 10⁻¹⁵) |
| Previas uniformes: 0,0138 | 0,013752 | **Confirmado** |
| 1.225 tablas; 9 tablas con 8 supervivientes; 1 de cada 70 en la dama del té | 1.225; 9; C(8,4) = 70 | **Confirmado** |
| Diferencia de riesgos de casi 18 puntos; RR ≈ 7; OR "cerca de ocho y medio" | 0,1765; 7,0; 8,556 | **Confirmado.** El documento técnico dice 8,7: corregir a 8,6 |

### Nota A. El 0,028 de Boschloo es un máximo local

Como función del parámetro de estorbo π, la cola de Boschloo tiene tres picos:

- π = 0,134, con valor 0,02817.
- π = 0,5, con valor 0,03846. Este es el máximo global.
- π = 0,866, con valor 0,02817.

Doblar la cola unilateral en su pico local da 2 × 0,01409 = 0,0282, que es el "0,0281" del documento técnico. Lo más probable es que ese valor salga de una maximización que se quedó en el pico local, y no de una diferencia legítima entre definiciones bilaterales. Con dos grupos del mismo tamaño, *minlike* y *central* coinciden: 0,0385.

La sección 1 de `verificar_en_R.R` lo confirma o lo refuta: recalcula el valor con una malla de 2.000 puntos y evalúa la cola en los dos picos.

La paradoja de fondo es que esto ilustra justo lo que el ensayo advierte sobre el error numérico de los procedimientos incondicionales.

### Nota B. Barnard-CSM, 0,024 frente a 0,028

Implementé el ordenamiento CSM así: en cada paso se añade la tabla candidata, admisible por convexidad, que minimiza el sup de la región ampliada. Lo probé con mallas de 10 a 4.001 puntos y el valor p de (7,1) quedó siempre entre 0,027 y 0,028. Nunca bajó a 0,024.

Es posible que el paquete `Exact` use una regla de selección o de simetría distinta de la que reconstruí. No puedo descartarlo sin ejecutar el paquete: la sección 3 del script R lo resuelve.

### Nota C. Un tamaño de 5,7 % es incompatible con la definición del test

Si el valor p de cada tabla es el sup sobre π de la probabilidad de la región acumulada, entonces la región de rechazo al 5 % tiene, por construcción, un tamaño máximo de a lo sumo 5 %. Solo un error numérico puede llevarlo por encima.

Un tamaño de 0,0571, junto con la potencia de 67 % y el valor p de 0,024, sugiere que las cifras de CSM vienen de un cálculo que subestima el sup. La causa probable es una malla gruesa o una configuración particular del paquete.

Además, la frase de que el exceso está "ya documentado para la prueba original (Berger y Boos, 1994)" no me parece respaldada. Berger y Boos proponen maximizar sobre un intervalo de confianza del parámetro de estorbo; no documentan que el test de Barnard exceda el nivel nominal. Conviene retirar esa atribución.

## 3. Consecuencias para el ensayo

**Se sostiene sin cambios.** El núcleo del argumento está confirmado de forma independiente:

- Fisher da 0,054 y Boschloo 0,038: el veredicto cambia.
- La discordancia es de 11,6 %, uno de cada ocho ensayos posibles, y va en una sola dirección (40 tablas frente a 0).
- Potencias de 43,3 % y 54,9 %.
- Tamaños máximos de 3,1 % y 4,7 %.
- El cálculo de Altham.
- Los valores de SciPy.

**Hay que corregir o suspender hasta correr el script R:**

1. **Boschloo "0,038 o 0,028 según la definición bilateral".** Dejar solo 0,038 y quitar la frase sobre la otra definición, o reemplazarla por la observación del máximo local.
2. **Barnard-CSM (0,024; 23,7 %; 67,0 %; 5,7 %).** Mientras no se confirmen en R, hay dos opciones:
   - Retirar CSM del cuerpo del ensayo y quedarse con Fisher frente a Boschloo, que basta para el argumento.
   - Reportar las cifras de la reimplementación (0,028; 17,5 %; 60,8 %; 4,9 %) y declarar la discrepancia entre implementaciones. Esa discrepancia refuerza la tesis de que "test de Barnard" nombra una familia.
3. **"Barnard-CSM se pasa levemente de la promesa... (Berger y Boos, 1994)".** Eliminar esa frase.
4. **Documento técnico.** Cambiar OR ≈ 8,7 por 8,6.

**Fuentes de los datos clínicos:**

- [Reseña del ensayo en PMC (PMC6986458)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6986458)
- [PubMed 15102998](https://pubmed.ncbi.nlm.nih.gov/15102998/)
- [NEJM, DOI 10.1056/NEJMoa032440](https://www.nejm.org/doi/full/10.1056/NEJMoa032440). No fue accesible desde esta sesión.
