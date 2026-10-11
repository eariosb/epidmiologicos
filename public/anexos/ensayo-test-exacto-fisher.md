# El test exacto de Fisher en investigación biomédica

Esneider Ríos
Universidad Nacional de Colombia, sede Medellín
Historia de la salud, el cuerpo y la enfermedad, 2026

---

### Resumen

En la investigación biomédica, el test exacto de Fisher se usa casi por inercia para analizar tablas de contingencia 2×2, inclusive cuando hay pocas observaciones, y a menudo sin verificar que el diseño cumpla los supuestos bajo los cuales Fisher lo formuló. En el ensayo clínico de Perondi y colaboradores (2004) sobre epinefrina en niños con paro cardíaco, tres procedimientos aplicados a los mismos datos producen veredictos distintos. A partir de ese caso, la estadística, la historia de la salud, la filosofía de la medicina, la sociología del conocimiento y la ética examinan, cada una con sus propios medios, qué se decide al elegir un test. De su convergencia surge la tesis: esa elección fija qué diferencia llega a ser un hecho y, como toda decisión con consecuencias, debe tomarse a la vista. Abandonar el test exacto de Fisher sería un error, porque sigue siendo útil en muchos casos. Usarlo por costumbre, sin el debido discernimiento, lo es aún más.

Palabras clave: test exacto de Fisher, tablas 2×2, inferencia por aleatorización, historia de la cuantificación, normalidad, sociología del conocimiento, ética de la investigación.

---

## Sesenta y ocho niños

Un niño hospitalizado entra en paro cardíaco. El equipo inicia la reanimación y le aplica la dosis habitual de epinefrina, 0,01 miligramos por kilogramo de peso. El corazón no responde. En un ensayo clínico realizado en São Paulo y publicado en 2004, ese era el momento en que intervenía el sorteo: la siguiente dosis sería otra vez la estándar o una diez veces mayor, 0,1 miligramos por kilogramo, y ni los médicos que la aplicaban ni los investigadores sabían cuál de las dos estaban administrando. Así ocurrió con sesenta y ocho niños, treinta y cuatro en cada grupo (Perondi et al., 2004).

La pregunta tenía fundamento. Estudios en animales y algunas series de casos sugerían que una dosis alta podía ayudar a recuperar el pulso cuando la estándar había fallado. Si era así, valía la pena saberlo pronto, y la manera honesta de saberlo era compararlas en un ensayo aleatorizado y doble ciego.

El desenlace principal fue la supervivencia a las veinticuatro horas. Seguían vivos siete de los treinta y cuatro niños que habían recibido la dosis estándar y uno de los treinta y cuatro que habían recibido la dosis alta. Al alta hospitalaria la cuenta era de cuatro contra ninguno. El artículo, publicado en el New England Journal of Medicine, dejó un mensaje claro: la dosis alta no mejoraba la supervivencia y quizá la empeoraba.

Ese "quizá" guarda una pregunta que atraviesa toda la investigación clínica. Siete contra uno parece una diferencia enorme, pero con tan pocos niños el azar también produce diferencias enormes. El sorteo pudo haber enviado, sin que nadie lo advirtiera, a los niños con paros menos graves al grupo de la dosis estándar. ¿Cómo distinguir un efecto real de una casualidad del reparto?

La estadística responde con un razonamiento contrafáctico del que depende todo lo que sigue. Supongamos que las dos dosis fueran exactamente igual de eficaces; esa suposición se llama hipótesis nula. Si así fuera, ¿con qué frecuencia el puro azar del sorteo produciría una diferencia tan grande como la observada, o mayor? Esa frecuencia es el valor p: una medida de cuán sorprendentes resultarían los datos en un mundo donde la dosis no importa. Por sí sola dice poco sobre la probabilidad de que la dosis alta sea inútil o dañina, aunque con frecuencia se la lea así. Por una convención que tiene ya un siglo, cuando esa sorpresa cae por debajo de cinco en cien (p < 0,05) la diferencia se declara "estadísticamente significativa" y se la trata como algo más que azar.

Con los números de Perondi, siete de treinta y cuatro frente a uno de treinta y cuatro, el procedimiento que casi cualquier manual recomienda para tablas pequeñas, el test exacto de Fisher, da un valor p de 0,054. Apenas por encima de la línea: la diferencia no alcanzaría el umbral. El test de Boschloo, una alternativa publicada en 1970, da 0,038. La versión del test de Barnard conocida como CSM, 0,028. Ambos por debajo. Con los mismos niños, los mismos siete y el mismo uno, el veredicto cambia según el instrumento con que se mide.

Podría despacharse esto como una curiosidad técnica, uno de esos casos frontera que los estadísticos discuten en congresos. Durante un tiempo lo vi así. Pero cuanto más se mira la tabla, más pierde interés la pregunta de cuál de los tres números es el correcto, y más pesan otras que la tabla, por sí sola, no puede contestar. ¿Por qué el instrumento que los manuales recomiendan para los datos escasos es, aquí, el que menos ve? ¿Por qué casi nadie declara que eligió uno en lugar de otro? Detrás de ambas asoma una pregunta más incómoda y más vieja: quién decide qué vidas cuentan como evidencia, y con qué instrumentos lo decide.

### Cómo leer lo que sigue

Esa pregunta no pertenece a una sola disciplina, y sería un error pedirle a una que conteste por las demás. La historia no puede probar que un test estadístico es inadecuado, ni la estadística puede decir qué es lo normal en medicina. Por eso el ensayo avanza por estaciones, y en cada una cambia el tipo de afirmación que se hace.

La estadística aporta resultados de cálculo: qué decide cada procedimiento, con qué frecuencia se equivoca, bajo qué supuestos. Son afirmaciones reproducibles, y así se presentan. La historia aporta hechos documentados en fuentes: cómo se contó la enfermedad en otros tiempos y lugares, de dónde vienen las convenciones que hoy parecen naturales. La filosofía de la medicina, la sociología del conocimiento y la ética aportan interpretaciones: formas de leer los resultados y los hechos, que se proponen y se discuten, y que se identifican como tales. Ninguna estación demuestra la siguiente. La tesis, si convence, lo hará porque las cinco apuntan en la misma dirección.

El recorrido tiene, además, un doble movimiento. Unas estaciones preguntan cómo se ha contado la diferencia entre lo sano y lo enfermo, entre el efecto y el ruido, y buscan la respuesta en los textos y en las fuentes; otras preguntan cómo se cuenta hoy, y la buscan en lo que cada procedimiento hace con los mismos datos. Entre ambos movimientos, el ensayo volverá una y otra vez a los sesenta y ocho niños, porque cada estación permite verlos desde un ángulo distinto. Y cada una terminará con una proposición breve que condensa lo que aporta y prepara la siguiente.

---

## I. Lo que muestra la estadística

Empecemos por una paradoja. El procedimiento que hoy se recomienda para los diseños más inciertos nació en el experimento más controlado que pueda imaginarse.

### La dama y las tazas

El test lleva el nombre de Ronald Fisher, y su escena fundacional es casi doméstica. En The Design of Experiments (1935), Fisher imagina a una dama que afirma poder distinguir, al probar una taza de té con leche, si se sirvió primero la leche o primero el té. Para ponerla a prueba se preparan ocho tazas, cuatro de cada tipo, se le presentan en orden aleatorio y se le informa que hay exactamente cuatro de cada clase. Ella debe señalar cuáles son las cuatro de leche primero.

Los resultados del experimento caben en una tabla de dos filas y dos columnas: cómo se preparó cada taza y qué dijo la dama. Alrededor de sus cuatro casillas hay cuatro totales, la suma de cada fila y la de cada columna, que por escribirse al borde se llaman márgenes. En la escena de Fisher todos están decididos antes de empezar. El experimentador fija cuántas tazas hay de cada tipo, cuatro y cuatro, y la dama sabe que debe señalar exactamente cuatro, así que sus respuestas también suman cuatro y cuatro. Lo único que puede variar es cuántas acierta.

Si la dama adivina al azar, su situación es la de quien saca cuatro bolas, sin devolverlas, de una urna con cuatro blancas y cuatro negras, y se pregunta cuántas blancas le saldrán. Los matemáticos llaman a ese reparto distribución hipergeométrica, y con ella la probabilidad de cada resultado posible se calcula contando, sin aproximaciones. Acertar las cuatro por pura suerte ocurre una vez de cada setenta. De ahí el adjetivo del test: exacto.

Hay algo hermoso en ese razonamiento. Fisher logró eliminar del problema una cantidad desconocida, la probabilidad general de acierto, que no interesa pero estorba (lo que los estadísticos llaman un parámetro de estorbo, o nuisance). Lo hizo condicionando: razonando solo dentro del conjunto de tablas que comparten los márgenes observados. En ese conjunto la cantidad molesta desaparece y la inferencia queda limpia. Fisher defendió además que el total de éxitos aporta poca o ninguna información sobre la asociación que se quiere estudiar, de modo que fijarlo no cuesta nada. El argumento convenció incluso a su primer rival. En 1945, George Barnard había propuesto un test que no fijaba ningún total y que, cuando el diseño no los decidía, era más potente que el de Fisher (Barnard, 1945, 1947); pocos años después defendía el test condicional por encima del suyo (Barnard, 1949). Paradoja tanto más notable cuanto que su argumento técnico seguía en pie. Frank Yates sostuvo la posición de Fisher con elocuencia medio siglo después (Yates, 1984). El argumento merece respeto, y funciona muy bien cuando el diseño se parece a la dama del té.

### Cuando el diseño es otro

Volvamos a los sesenta y ocho niños. El ensayo de Perondi se parece poco a la dama del té. El protocolo fijó cuántos niños irían a cada brazo, treinta y cuatro y treinta y cuatro, pero no cuántos sobrevivirían; nadie podía fijarlo. Los totales de las filas estaban decididos. Los de las columnas, cuántos vivieron y cuántos murieron, los decidió el mundo. Si se piensa a esos niños como representantes de todos los que en el futuro sufrirán un paro semejante, el diseño corresponde a dos muestras binomiales independientes: cada grupo se comporta como treinta y cuatro lanzamientos de una moneda cargada, con una probabilidad de supervivencia propia que nadie conoce y que el estudio quiere comparar.

Para ver qué cambia hay que nombrar antes las dos maneras en que un estudio puede equivocarse. La primera consiste en declarar un efecto que no existe: concluir que la dosis importa cuando en realidad da lo mismo. Los estadísticos la llaman error de tipo I. En la práctica es una falsa alarma, y su costo clínico es adoptar o abandonar un tratamiento por una casualidad del sorteo. La segunda consiste en no ver un efecto que sí existe. Es el error de tipo II, la alarma que no suena, y su costo es seguir usando lo que daña o dejar de usar lo que salva. La probabilidad de evitar este segundo error, de detectar un efecto real cuando está ahí, se llama potencia.

Las dos equivocaciones tiran en sentidos contrarios, como en un detector de humo. Uno muy exigente casi nunca suena sin fuego, pero a veces tampoco suena con él. El umbral de cinco en cien es una promesa sobre la primera equivocación: si la dosis no importara, el procedimiento no debería gritar "efecto" más de cinco veces de cada cien. Esa promesa se llama nivel de significancia. Sobre cuántas veces callará el detector cuando sí haya fuego, la promesa guarda silencio.

Aplicado al diseño de Perondi, el test de Fisher cumple su promesa: nunca da falsas alarmas con más frecuencia de la anunciada. La cumple al precio de tratar como fijo algo que, en el modelo binomial, fue azaroso. Condiciona: razona solo dentro de las tablas que tienen el mismo total de sobrevivientes que la observada, como si únicamente hubieran sido posibles los repartos con exactamente ocho niños vivos. Con pocos datos, además, los valores p posibles forman una escalera de peldaños separados y no una rampa continua, y el test no puede detenerse exactamente en 0,05; para no pasarse, se queda en el peldaño de abajo. Condicionar reduce el número de tablas con las que se compara y, con ello, el número de peldaños. El resultado es un detector que promete cinco falsas alarmas de cada cien y en la práctica da menos, y esa prudencia se paga en potencia. Lydersen, Fagerland y Laake lo resumieron sin rodeos en 2009, al revisar las pruebas disponibles para tablas 2×2: el test exacto de Fisher tradicional "prácticamente nunca debería usarse", y las pruebas incondicionales y el enfoque mid-p deberían emplearse más de lo que se emplean. Ocho años después, Ripamonti, Lloyd y Quatto (2017) recordaban que, tras setenta años de debate, el análisis correcto de la tabla 2×2, la estructura de datos más simple que existe, sigue sin estar resuelto.

### Lo que Fisher tenía en mente

Hay, sin embargo, una lectura del ensayo de Perondi en la que Fisher tiene toda la razón. El ensayo fue aleatorizado, y para experimentos aleatorizados el propio Fisher (1935) propuso razonar desde el sorteo mismo. Supongamos la hipótesis nula en su versión más estricta: la dosis no cambió el destino de ningún niño. Entonces los ocho que sobrevivieron habrían sobrevivido con cualquier dosis, y los sesenta que murieron habrían muerto igual. En ese mundo, el total de sobrevivientes queda fijado por la hipótesis misma, y lo único azaroso es cómo repartió el sorteo a esos ocho entre los dos brazos. Ese reparto sigue exactamente la distribución hipergeométrica. Visto así, el test de Fisher es la prueba de aleatorización del ensayo, y su condicionamiento deja de ser una imposición arbitraria (Rosenbaum, 2002; Imbens y Rubin, 2015).

Las dos lecturas hacen, entonces, preguntas distintas. La de aleatorización pregunta por estos sesenta y ocho niños: si la dosis cambió el destino de alguno de ellos. La binomial pregunta por los niños que vendrán: si la probabilidad de sobrevivir difiere entre las dosis en la población de la que estos niños son una muestra. La segunda es la que interesa a una guía clínica, y es también la que suele suponer el cálculo del tamaño muestral de un ensayo. Ambas son legítimas, y la tabla por sí sola no elige entre ellas. La elige quien analiza, a menudo sin saber que está eligiendo. Formulada así, la pregunta de este ensayo adquiere una forma literal: qué vidas cuentan como evidencia, las de los niños que estuvieron en el estudio o las de los que vendrán después.

### Lo que dice la palabra

En estadística, exacto significa que la distribución del estadístico se calcula sin recurrir a aproximaciones de muestra grande: una propiedad del algoritmo. De ahí no se sigue que la conclusión sea verdadera, ni que el modelo sea el adecuado, ni que la pregunta que responde sea la que el estudio formuló. La sospecha sobre el adjetivo llega desde dos tradiciones opuestas. Dentro del propio frecuentismo, Alan Agresti y Brent Coull publicaron en 1998 un artículo sobre intervalos para proporciones cuyo título ya es el argumento: "Approximate is better than 'exact'". Los métodos llamados exactos cumplen su garantía a costa de ser tan conservadores que, en la práctica, informan peor que ciertas aproximaciones bien elegidas (Agresti y Coull, 1998). Lo que ellos muestran para los intervalos vale también para los tests, y por la misma razón: la distribución binomial avanza a saltos, y un procedimiento que se niega a exceder su promesa en ningún caso termina quedándose corto en casi todos. Desde la tradición bayesiana, el físico Giulio D'Agostini ha ironizado sobre el mismo adjetivo en sus notas de laboratorio; su observación, en paráfrasis, es que estos métodos merecen el nombre de exactos por seguir al pie de la letra una prescripción, y que de ahí no se deduce que respondan a la pregunta que interesa.

Patricia Altham mostró en 1969 hasta dónde llega esa distancia (Altham, 1969). El valor p unilateral de Fisher coincide exactamente con una probabilidad bayesiana: la probabilidad, una vez vistos los datos, de que la asociación vaya en sentido contrario al observado. La coincidencia exige partir de una creencia previa muy particular. En el caso de Perondi, esa creencia sobre la supervivencia con dosis estándar es una distribución Beta(0, 1), que acumula su peso cerca de cero, y la creencia sobre la dosis alta es una Beta(1, 0), que lo acumula cerca de uno. Antes de mirar los datos, la apuesta ya está hecha a favor de lo contrario de lo que estos sugieren. El cálculo es directo: el valor p unilateral de Fisher es 0,027, y la probabilidad posterior de que la dosis alta sea en realidad mejor, con la creencia previa de Altham, también es 0,027. Con una creencia neutral, que no privilegia ninguna probabilidad de supervivencia, esa probabilidad cae a 0,014, la mitad. La equivalencia no vuelve bayesiano a Fisher, y las dos cifras siguen respondiendo a preguntas distintas. Revela, eso sí, el contenido del adjetivo: la prudencia del test "exacto" puede describirse como una opinión previa en contra del efecto sugerido, y en la tradición bayesiana las opiniones previas se declaran.

### Nueve mundos posibles

Con treinta y cuatro niños en cada grupo, el número de sobrevivientes con dosis estándar puede ir de cero a treinta y cuatro, y lo mismo con dosis alta. Hay por tanto treinta y cinco por treinta y cinco: mil doscientas veinticinco tablas posibles, cada una un reparto de vida y muerte que pudo haber ocurrido. Un procedimiento incondicional, como Boschloo o Barnard, se llama así porque no fija el total de sobrevivientes: compara la tabla observada con el conjunto completo, cada tabla pesada según qué tan probable sería si la dosis no importara, y como se desconoce la probabilidad común de sobrevivir, la recorre entera y se queda con el escenario más desfavorable. El test de Fisher, al condicionar al total, solo mira las tablas en las que sobrevivieron exactamente ocho niños. Son nueve: ocho y cero, siete y uno, seis y dos, hasta cero y ocho. De mil doscientas veinticinco posibilidades, Fisher razona dentro de nueve.

Ningún niño real queda fuera del análisis; los sesenta y ocho están en la tabla. Lo que el condicionamiento recorta son posibilidades: el fondo contra el cual se juzga si lo observado es sorprendente. Y decidir cuál es ese fondo es decidir, en buena medida, qué resultará visible.

### Uno de cada ocho

En un trabajo anterior (Ríos, 2026) recorrí las mil doscientas veinticinco tablas bajo un escenario de referencia anclado en las proporciones observadas, veinte por ciento de supervivencia con dosis estándar y tres por ciento con dosis alta, y calculé para cada una qué decidiría cada procedimiento. Como el número de tablas es finito, no hace falta simular: basta enumerarlas y ponderarlas por su probabilidad exacta.

Fisher y Boschloo toman decisiones opuestas sobre tablas que, juntas, acumulan el 11,6 % de la probabilidad del escenario: aproximadamente uno de cada ocho ensayos posibles. Entre Fisher y Barnard-CSM la discordancia sube al 15,4 %. La discordancia entre Fisher y Boschloo tiene una sola dirección: ninguna tabla es rechazada por Fisher sin serlo también por Boschloo, mientras que cuarenta son rechazadas por Boschloo y no por Fisher. La tabla de Perondi cae exactamente en esa franja. Si la diferencia entre dosis fuera real y de esa magnitud, Fisher la detectaría el 43,3 % de las veces, Boschloo el 54,9 % y Barnard-CSM el 58,7 %.

Conviene detenerse en lo que esto significa. La franja dista de ser un borde estrecho reservado a la mala suerte. En cada uno de esos ensayos posibles, la conclusión que llegaría a las revistas dependería menos de lo que les ocurrió a los niños que del manual que el analista tuviera a mano.

### Lo que el cálculo no autoriza

Ninguno de los tres rompe su promesa. Si la dosis no importara, en el peor escenario posible Fisher declararía un efecto inexistente 3 veces de cada cien, Boschloo y Barnard-CSM algo menos de 5. Fisher desperdicia cerca de dos quintos del margen que se le concede; Boschloo y Barnard-CSM lo aprovechan casi entero sin pasarse, y por eso ven más. Los números dependen, sin embargo, de decisiones que rara vez se reportan, y algunas son tan pequeñas que pasan inadvertidas. Los programas que calculan estas pruebas esperan la tabla en una orientación determinada: uno supone que los grupos van en las filas, otro que van en las columnas. Si se les entrega al revés, no protestan. Fijan los totales de sobrevivientes y fallecidos en lugar de los tamaños de grupo, y responden a otra pregunta. Con la tabla de Perondi transpuesta, el CSM baja de 0,028 a 0,024, y la implementación del test de Barnard en otra biblioteca sube de 0,028 a 0,050 o a 0,161, según una sola opción de configuración: del lado significativo al otro. Algo parecido ocurre con la maximización. La probabilidad que Boschloo maximiza tiene, en esta tabla, varios picos, y una búsqueda que se detiene en el primero reporta 0,028 en lugar de 0,038. Ambos tropiezos aparecieron en versiones anteriores de mis propios cálculos, y solo una verificación independiente los hizo visibles (los detalles, en la nota final).

Los procedimientos incondicionales, por último, maximizan una probabilidad sobre un parámetro desconocido, y las implementaciones actuales lo hacen sobre una malla de valores, con un error numérico pequeño pero no nulo. El test de Fisher se libra de ese problema en tablas pequeñas: su cálculo es una suma finita. Los procedimientos que mejor se ajustan a la pregunta poblacional son, así, los que menos exactitud numérica pueden garantizar.

Hasta aquí llega la estadística, y conviene decir con precisión hasta dónde. Muestra que, en diseños pequeños con eventos escasos, el veredicto depende del procedimiento; que cada procedimiento responde a una pregunta distinta; y que la elección rara vez se declara. No muestra que la dosis alta fuera dañina, ni que Fisher haya retrasado una decisión clínica, ni autoriza a escoger después de ver los datos el procedimiento que da el valor p más pequeño. Tampoco dice de dónde viene la costumbre de elegir como se elige, ni qué significa el umbral que todos respetan.

**Primera proposición: en diseños pequeños, el procedimiento participa en el veredicto.**

---

## II. Lo que muestra la historia

Esas dos preguntas, de dónde viene y qué significa, no se contestan con cálculo. La primera es histórica. El cálculo mostró que el procedimiento participa en la producción de la evidencia; la historia de la salud muestra que esa participación no tiene nada de nuevo, porque ha documentado muchas veces que las formas de contar la enfermedad tienen genealogía: alguien las inventó, en un lugar y un momento, para unos propósitos, y después dejaron de parecer inventadas.

En 1974, Jean-Pierre Peter y Jacques Revel escribieron sobre el enfermo como sujeto de la historia y advirtieron que el conteo de los hechos mórbidos, por sí solo, no basta para hacer de la enfermedad un objeto histórico. El número, decían, convierte al hombre que tiene hambre, trabaja y muere en el soporte abstracto de cualidades generales, instalado en el espacio neutro del cuadro sociográfico. Su propuesta estaba lejos de renunciar a contar. Pedía saber que contar deja cosas fuera, y que eso que queda fuera también pertenece a la historia.

La historiografía colombiana ha trabajado esa intuición con fuentes propias. Victoria Estrada Orrego, con Oscar Gallo y Jorge Márquez Valderrama, estudió cómo, entre 1916 y 1946, las estadísticas de tuberculosis en Colombia se construyeron en la tensión entre las cifras de los médicos, las de las oficinas oficiales y las necesidades del mundo laboral (Estrada Orrego, Gallo y Márquez Valderrama, 2016). La expresión que da título a su trabajo, "retórica de la cuantificación", toma la palabra retórica en su sentido clásico, el arte de persuadir a un auditorio. Una cifra de muertes por tuberculosis tenía autores, destinatarios y propósitos, y la distancia entre las estadísticas médicas y los datos oficiales que el artículo examina puede leerse como la huella de auditorios distintos. Una muerte registrada como tuberculosis en un obrero tenía consecuencias diferentes de una muerte registrada con otro nombre.

Márquez Valderrama, por su parte, mostró cómo la irrupción de la ciencia pasteuriana en Antioquia transformó la manera de ver la ciudad, el agua, el aire y los cuerpos que los habitaban (Márquez Valderrama, 2005). El paso de los miasmas a los microbios cambió la teoría y, con ella, lo que se volvía observable, medible y, por tanto, gobernable. Junto con otros historiadores de Medellín ha insistido en que higienizar, medicar y gobernar forman parte de un mismo movimiento (Márquez Valderrama, Casas Orrego y Estrada Orrego, 2004).

La tensión entre contar y atender al caso singular es, además, antigua. En Hacer salud pública, que Jorge Márquez Valderrama y Víctor Manuel García tradujeron para los cursos de la Universidad Nacional, Didier Fassin recuerda la controversia que en el siglo XIX enfrentó a Pierre Louis, para quien la estadística era "la base fundamental y única de todas las ciencias médicas", con Claude Bernard, para quien el uso de promedios en medicina y fisiología conducía "necesariamente al error". Para el primero, el estudio de la población justificaba el cálculo; para el segundo, el individuo era siempre singular. Pensar en términos estadísticos, resume Fassin, es dar a cada persona el mismo valor en un sistema de cuentas, lo que permite calcular valores medios o normales (Fassin, 2008, p. 7). La tabla de Perondi es heredera de esa decisión, y también de la inquietud de Bernard.

El mismo texto reconstruye, a partir de la investigación de Anne-Jeanne Naudé, la historia del saturnismo infantil en Francia (Fassin y Naudé, 2004; Fassin, 2008). A comienzos de los años ochenta, los pediatras franceses que registraban casos dramáticos situaban el límite de plomo en sangre en 35 microgramos por decilitro; a fines de la década estaba por debajo de 25; luego se fijó en 15, y con ese umbral se identificaron 1.500 casos en París en 1990. Con el valor de 10, adoptado en 1991 por los Centers for Disease Control de Estados Unidos y después admitido internacionalmente, en 1998 se estimaron 85.000 niños contaminados. "A medida que el límite desciende", escribe Fassin, "la epidemia toma lógicamente amplitud en las estadísticas" (2008, p. 16). Y precisa de inmediato que la decisión de modificar la norma "no es evidentemente arbitraria", porque reposa sobre un mejor conocimiento de los efectos del plomo a bajas concentraciones.

Para nombrar lo ocurrido, Fassin distingue dos operaciones. La primera consiste en encontrar casos que existían y se ignoraban porque nadie los buscaba: la detección sistemática permite identificarlos, y en ese caso puede hablarse de descubrimiento. La segunda consiste en transformar los criterios por los cuales se define la enfermedad, "desplazar el cursor entre lo normal y lo patológico": en ese caso puede hablarse de invención (2008, p. 16). Los niños intoxicados existían. Lo que se inventó fue una entidad nueva, visible solo con el nuevo criterio. Y Fassin anota algo que para este ensayo resulta decisivo: el saturnismo puede describirse, según el umbral que se fije, "en términos de daño neurológico significativo o de disminución estadísticamente significativa del coeficiente intelectual" (p. 19). En su texto, el umbral clínico y el estadístico aparecen uno al lado del otro.

El umbral estadístico tiene su propia genealogía. Fisher propuso el 0,05 en 1925 como un punto de referencia conveniente, y una sugerencia práctica se volvió, con los años, una frontera casi moral entre lo que existe y lo que no. La American Statistical Association tuvo que recordar en 2016 que un valor p no mide la probabilidad de que una hipótesis sea cierta, y en 2019 llamó a ir más allá del "p < 0,05" (Wasserstein y Lazar, 2016; Wasserstein, Schirm y Lazar, 2019). Que una comunidad científica deba recordar a sus miembros el significado de su cifra más usada dice bastante de la vida que esa cifra había llevado por su cuenta.

Lo que la historia establece es esto: las cifras sobre la enfermedad han sido producidas con instrumentos, categorías y umbrales que tienen fecha, autor y propósito, y esas elecciones han decidido qué se volvía visible. Permite, además, distinguir con Fassin entre descubrir lo que existía e inventar un criterio nuevo para reconocerlo. No establece que el test de Fisher sea inadecuado para Perondi; eso lo dice, con sus propios límites, el cálculo. Lo que añade es la razón para no tratar el instrumento como si careciera de historia.

**Segunda proposición: todo umbral descubre e inventa a la vez.**

Queda por saber qué se inventa, en particular, cuando el umbral separa lo significativo de lo que no lo es. Esa pregunta ya no es histórica.

---

## III. Lo que pregunta la filosofía de la medicina

La filosofía de la medicina no mide nada. Pregunta qué significan las distinciones con las que la medicina trabaja, y la más antigua de ellas es la que separa lo normal de lo patológico.

Georges Canguilhem dedicó su tesis de medicina, publicada en 1943 y ampliada en 1966, a desmontar la idea de que lo normal es un promedio. Para él, la desviación estadística por sí sola no basta para hacer una patología: lo patológico es una norma de vida reducida, y la salud es la capacidad de un organismo de instituir nuevas normas frente a un medio cambiante. El hombre normal, escribió, es el hombre normativo (Canguilhem, 1966).

Esa tesis se traslada mal a los umbrales estadísticos, y conviene decirlo antes de usarla. La norma de Canguilhem es un acto del organismo vivo, y hacerla hablar de valores p sería usar al autor contra su propia ontología. Lo que sí ofrece es una pregunta. Canguilhem combatió la concepción de la medicina del siglo XIX para la cual lo patológico era una desviación cuantitativa respecto de lo normal, medible a partir de un promedio. Cabe preguntar si el test estadístico no reproduce ese esquema, trasladado de los cuerpos a los datos.

La respuesta que propongo es una interpretación, y como tal se ofrece. Cada aplicación del test clasifica un resultado en significativo o no significativo, efecto o ruido, aplicando una frontera fija a la magnitud de un desvío. Lo "normal", en este esquema, es el resultado que no supera el umbral. Un hecho empírico, bien documentado, da peso a esa lectura: los resultados no significativos se publican con menos frecuencia que los significativos (Dickersin, 1990). Lo que circula, se cita y termina en las guías es, en buena parte, el desvío que alcanzó a ser hecho. Leída con Canguilhem, la normalidad que el test ayuda a producir habita en esa frontera entre lo que se convierte en hecho y lo que se archiva, y la frontera, como toda norma, tiene autores.

Pensemos de nuevo en la tabla de Perondi. Con Fisher, la diferencia entre siete y uno queda del lado de lo normal, del resultado sin efecto; con Boschloo, cruza al lado del hecho. Los niños son los mismos. Lo que cambia es la orilla en que quedan.

El propio Canguilhem ofreció, en una conferencia de 1988, una observación que ilumina esa asimetría, aunque la formuló pensando en personas y no en resultados. "Salud pública es una denominación discutible", dijo; "lo que es público, publicado, es muy a menudo la enfermedad", mientras que el hombre sano, que se adapta silenciosamente a sus tareas, "está presente en la sociedad que lo ignora" (Canguilhem, 1990, p. 5). La literatura biomédica reproduce, en su propio terreno, una economía de la atención parecida: lo publicado es el desvío, y lo normal, el resultado sin efecto, permanece presente e ignorado.

En esa misma conferencia, endureciendo un enunciado de Kant, Canguilhem sostuvo que no hay ciencia de la salud: la salud es un concepto vulgar, "lo que no quiere decir trivial, sino simplemente común, accesible a todos" (p. 2). Trasladado con la cautela del caso, el recordatorio vale aquí. La pregunta de qué diferencia importa para los niños que vendrán no se vuelve asunto exclusivo de especialistas por el hecho de que su cálculo sea exacto.

La filosofía no decide si esa lectura es correcta en cada caso. Ofrece la pregunta que permite verla: quién fija la norma, con qué criterio, y qué queda del otro lado.

**Tercera proposición: la normalidad que el test ayuda a producir habita en la frontera entre lo que se publica y lo que se archiva.**

---

## IV. Lo que pregunta la sociología del conocimiento

Esta estación abre con una paradoja del presente. Nunca había sido tan fácil calcular las alternativas a Fisher, que hoy caben en un par de líneas de código, y sin embargo siguen siendo la excepción: cuanto más se ha escrito contra su uso por defecto, más firme parece su lugar. Si las alternativas se conocen desde 1945 y 1970, si la literatura especializada lleva décadas recomendándolas y si el software las ofrece, cabe preguntar por qué Fisher sigue siendo la primera opción. La ignorancia explica poco: muchos de quienes usan Fisher saben que existen otras pruebas. La pregunta pertenece a la sociología del conocimiento: cómo una categoría, en este caso "significativo según Fisher", se institucionaliza hasta dejar de parecer una elección.

Michel Foucault mostró que, desde el siglo XVIII, la estadística es la forma en que una población se vuelve visible y, con ello, gobernable (Foucault, 1976). En esa tradición, la estadística médica determina en qué condiciones una diferencia llega a existir como hecho público, publicado, citado e incorporado a una guía, y esa existencia pública es la que habilita la intervención. La enfermedad, si existe, existe sin el test. Su estatuto de evidencia, no.

Queda por entender cómo un procedimiento particular llega a ocupar ese lugar sin que nadie lo discuta. Para eso sirve mejor el trabajo de Bruno Latour, que pasó casi dos años en un laboratorio del Instituto Salk, en California, observándolo como un antropólogo observa una aldea, y que con Steve Woolgar escribió La vida de laboratorio (Latour y Woolgar, 1979). Dos de sus observaciones hacen aquí el trabajo pesado.

La primera es que un laboratorio es, ante todo, una máquina de inscripciones: dispositivos que transforman una sustancia, un tejido o una reacción en una curva o en una cifra sobre un papel, y a partir de ese momento la discusión se hace sobre la cifra. La tabla 2×2 y su valor p son inscripciones de ese tipo. La cama, el reloj de la reanimación y la jeringa quedan detrás; lo que circula es la cifra.

La segunda observación se refiere a cómo un enunciado se vuelve hecho. Latour y Woolgar clasificaron los enunciados científicos según lo que los acompaña. Una conjetura aparece con su autor y sus reservas: "X ha sugerido que...". Un enunciado más aceptado pierde las reservas: "se sabe que...". Un hecho plenamente estabilizado pierde incluso la mención y pasa a formar parte del instrumental con que se trabaja. Un enunciado se vuelve hecho a medida que se le retiran esas marcas, que los autores llaman modalidades.

"Con pocos datos, use Fisher" recorrió ese camino. Nació como una propuesta situada, ligada a un diseño con los dos márgenes fijos y discutida en su momento por Barnard, por Yates, por Boschloo. Hoy aparece en los manuales sin autor y sin condiciones, como parte del instrumental. Lo que Fisher razonó para unas tazas de té se volvió, sin las tazas, lo que se sabe de las tablas. Usarlo no exige explicar nada. Apartarse de él obliga a devolverle las modalidades que perdió: decir de quién es, para qué diseño sirve, qué pregunta responde. Ese trabajo tiene un costo, y lo paga quien se aparta, ante un revisor que quizá no conoce la alternativa. La estabilidad, además, es colectiva: el estadístico usa el test que el investigador espera, el investigador el que el revisor aceptará, el revisor el que aparece en los manuales, y los manuales repiten el que se usa en las revistas.

A escala individual, la psicología cognitiva ofrece una pieza complementaria. En 1971, Amos Tversky y Daniel Kahneman repartieron un cuestionario entre psicólogos, en una reunión del grupo de psicología matemática y en la convención de la American Psychological Association, gente con formación estadística que usaba la estadística a diario, y encontraron que confiaban en exceso en muestras pequeñas. Su conclusión tenía algo de consuelo y algo de advertencia: el verdadero creyente en la ley de los números pequeños comete sus muchos pecados contra la lógica de la inferencia estadística de buena fe (Tversky y Kahneman, 1971). Las heurísticas que describieron después ayudan a entender la costumbre (Tversky y Kahneman, 1974; Kahneman, 2011). Fisher está disponible: en el primer curso, en la función `fisher.test()` del paquete base de R, en el menú de SPSS. La etiqueta "exacto" representa la idea misma de rigor. "Celda pequeña, Fisher" es una respuesta del pensamiento rápido a una pregunta que merecía el lento.

Conviene precisar el estatuto de todo esto. Que los enunciados científicos se estabilizan y que las heurísticas afectan incluso a personas con formación estadística son hallazgos documentados en sus propios campos. Que expliquen la persistencia de Fisher es una hipótesis plausible y todavía sin demostrar; ponerla a prueba exigiría estudiar cómo eligen su test quienes analizan datos. Y parte de la persistencia tiene fundamento técnico: cada alternativa exige decisiones propias, y el propio Fisher tiene a su favor la lógica de la aleatorización. El problema aparece cuando esa incertidumbre legítima sirve para evitar la comparación en lugar de invitar a hacerla.

**Cuarta proposición: una regla se vuelve costumbre a medida que pierde a su autor, y la costumbre se sostiene entre muchos.**

---

## V. Lo que pregunta la ética

La ética no pregunta qué test es correcto. Pregunta quién responde por las consecuencias de elegir uno.

Fassin describe con precisión cómo una elección técnica se vuelve una elección de política. En las ciudades francesas donde se hizo la evaluación, fijar el límite de plomo en 15 microgramos por decilitro implicaba renovar unos cuantos alojamientos; fijarlo en 10, muchísimos. Y según se interpretara la intoxicación, como problema de comportamiento de las familias o como producto de las políticas de vivienda e inmigración, la respuesta sería educativa o estructural: algunas administraciones se limitaron durante años a enviar cartas en las que pedían a las madres cortar las uñas de sus hijos para que no arañaran los muros (Fassin, 2008, p. 19). Un umbral estadístico no rehabilita barrios, pero participa de la misma lógica. Decide qué se vuelve hecho, y los hechos convocan respuestas.

Volvamos a nuestros niños. Un ensayo con eventos raros expone a sus participantes a una intervención cuyo beneficio está por comprobarse, y esa exposición se justifica por lo que el estudio puede aprender. Si el procedimiento de análisis reduce sin necesidad la probabilidad de aprender, reduce también la justificación de la exposición. Con los números del escenario de referencia, Fisher detecta el efecto en cuatro de cada diez ensayos y Boschloo en más de cinco. Un procedimiento conservador exige, además, muestras más grandes para alcanzar la misma potencia, y en un ensayo pediátrico de paro cardíaco esa diferencia se mide en niños antes que en presupuesto. Manfred Max-Neef formuló para la economía la pregunta que aquí se vuelve pertinente, para qué se mide, con un postulado que vale también para la investigación clínica: el desarrollo se refiere a las personas y no a los objetos (Max-Neef, Elizalde y Hopenhayn, 1986).

Dos precauciones limitan este argumento. La primera es temporal: vale antes de ver los datos. La obligación consiste en elegir el procedimiento bajo escenarios plausibles declarados de antemano; invocar la potencia después, para reivindicar un veredicto, sería una forma de selección interesada. La segunda es de magnitud: las cifras pertenecen a un escenario de referencia, y la realidad del ensayo, que nadie conoce, puede ser otra. Lo que el argumento sostiene es estructural. Cuando el procedimiento se elige por costumbre en un diseño que no la justifica, se reduce sin necesidad la probabilidad de que la exposición de los participantes se traduzca en conocimiento.

Didier Fassin ha insistido en que la desigualdad más profunda está en que unas vidas sean más vivibles, más dignas de ser contadas y más reconocidas que otras. Retomando a Canguilhem y a Hannah Arendt, distingue entre la vida biológica, la que miden la esperanza de vida y la mortalidad, y la vida biográfica, la que se narra (Fassin, 2018). Ha descrito también lo que llama biolegitimidad: el cuerpo que sufre se ha convertido en una fuente privilegiada de reconocimiento (Fassin, 2010). En la tabla de Perondi solo cabe la vida biológica, la vida contabilizada, y es inevitable que así sea; no cabe lo que Canguilhem llamó la salud "libre, no condicionada, no contabilizada" (1990, p. 5). Precisamente porque la reducción es inevitable, la manera de tratar lo que queda merece cuidado. La estadística no puede devolver a esos niños su biografía. Puede, al menos, no desperdiciar lo que su paso por el estudio hizo posible saber.

Queda la pregunta que da nombre a esta estación. La cadena descrita en la sección anterior diluye la responsabilidad hasta que parece no pertenecer a nadie, y el valor p aparece en la tabla con la autoridad de lo que no tiene autor. La ética devuelve el autor, aunque no a uno solo. Que una decisión sea colectiva no la vuelve anónima: la reparte, y cada eslabón responde por la parte que podía controlar.

Quien analiza los datos responde por declarar lo que eligió: el modelo, la pregunta, la definición del valor p y las alternativas que consideró. Elegir por costumbre sigue siendo elegir, y la costumbre no exime de decir que se eligió. Quien investiga responde por la coherencia entre el protocolo que justificó reclutar a los participantes y el análisis que se hace de sus datos, porque esa coherencia es parte de lo que se les prometió. Quienes revisan y editan responden por lo que aceptan sin preguntar: un revisor que nunca pide justificar el procedimiento convierte la costumbre en norma editorial. Los comités de ética responden por aprobar diseños cuyo análisis puede desperdiciar la información que la exposición de los participantes hizo posible. Y quienes enseñan y escriben software responden por los valores por defecto, que son decisiones tomadas de antemano en nombre de miles de analistas que nunca las revisarán.

Ninguno de esos eslabones carga con toda la responsabilidad, y ninguno queda libre de ella. La pregunta ética se desplaza así de quién tiene la culpa de un veredicto a quién puede responder, en cada punto de la cadena, por lo que la elección hizo visible y por lo que dejó sin ver.

**Quinta proposición: la responsabilidad por una elección colectiva se reparte sin disolverse.**

---

## VI. Convergencia

Ninguna de las cinco estaciones prueba lo que dicen las otras, y ninguna lo necesita. Recapitulemos. La estadística mostró que, en diseños pequeños, el veredicto depende del procedimiento y que cada procedimiento responde a una pregunta distinta. La historia mostró que las formas de cuantificar la enfermedad tienen fecha, autor y propósito, y que han decidido qué se volvía visible. La filosofía de la medicina preguntó qué significa trazar una frontera entre lo normal y lo que se desvía, y quién la traza. La sociología del conocimiento mostró cómo una elección se estabiliza hasta parecer un hecho. La ética preguntó quién responde por ella. Las cinco proposiciones, leídas en fila, forman una escalera: el procedimiento participa en el veredicto; todo umbral descubre e inventa a la vez; la normalidad habita en la frontera entre lo publicado y lo archivado; la regla se vuelve costumbre al perder a su autor; y la responsabilidad se reparte sin disolverse.

Hay un punto donde las estaciones se tocan con particular nitidez: el umbral. Canguilhem mostró que ninguna desviación estadística basta, por sí sola, para hacer una patología. Fassin mostró que, a medida que descendía el límite de plomo en sangre, la epidemia crecía en las estadísticas sin que el plomo cambiara, y advirtió al mismo tiempo que ese descenso tenía razones. El umbral de 0,05, y el procedimiento que decide cuándo se cruza, comparten esa doble condición: descansan en razones, y aun así alguien los fija. Deciden cuáles de las diferencias que existen llegan a contar como hechos. En el vocabulario de Fassin, cambiar de procedimiento se parece menos a descubrir casos que a desplazar el cursor con que se los reconoce.

La tesis surge de ese cruce, y cabe en una frase: elegir un test estadístico es una decisión que fija qué diferencia llega a ser un hecho, una decisión con historia, con una idea implícita de lo normal, sostenida por instituciones y con consecuencias por las que alguien debe responder. Ninguna disciplina sola la habría formulado. Juntas la vuelven difícil de ignorar.

### Elegir a la vista

Si la elección forma parte de la producción de la evidencia, lo mínimo que puede pedirse es que sea visible. Nada de lo que sigue es nuevo para la literatura estadística. Lo que cambia, después de este recorrido, es la razón para no seguir aplazándolo.

Lo primero es describir el mecanismo que generó los datos y la pregunta que se quiere responder: qué fijó el protocolo, qué quedó al azar, si hubo apareamiento o estratificación, y si la conclusión se refiere a los participantes del estudio o a la población de la que provienen. Si el protocolo fijó los tamaños de grupo y la pregunta es poblacional, el modelo natural son dos binomiales independientes, y condicionar al total requiere una justificación explícita.

Lo segundo es separar la estimación del contraste. Un valor p calla sobre el tamaño de un efecto. En Perondi, la diferencia de supervivencia fue de casi dieciocho puntos porcentuales, veinte por ciento contra tres; la razón de riesgos, alrededor de siete; la razón de odds, cerca de ocho y medio. Esas cifras, con intervalos de confianza (el rango de efectos compatibles con los datos) calculados de manera coherente con el procedimiento elegido, dicen más que cualquier discusión sobre si p cayó a un lado u otro de 0,05.

Lo tercero es comparar los procedimientos antes de ver los datos. Aplicado a Perondi, un plan así habría dicho de antemano que el análisis principal usaría Boschloo bajo el modelo de dos binomiales, que Fisher se reportaría como prueba de aleatorización para los participantes del ensayo, y que en un escenario como el observado uno de cada ocho conjuntos de datos produciría veredictos discordantes. La discordancia formaría parte del resultado. La operación inversa, calcular varios valores p después de ver los datos y reportar el que conviene, fabrica la conclusión que la comparación preespecificada pone a prueba.

Lo cuarto es la coherencia entre planificación y análisis. Si el tamaño muestral se calculó suponiendo dos binomiales independientes, analizar con un procedimiento que condiciona al total contradice el diseño que justificó reclutar a esos participantes (Suissa y Shuster, 1985).

Nada de esto se logra con la buena voluntad de un analista aislado, por la misma razón que tampoco la costumbre la sostiene un analista aislado: cada eslabón de la cadena descrita en la sección V tiene su parte. La más duradera quizá sea la de la formación, que puede enseñar, antes de cualquier comando, una secuencia de preguntas: qué se fijó, qué es aleatorio, sobre quiénes se quiere concluir, qué se quiere estimar, cuánto cuesta equivocarse.

---

## Coda. La elección de un mundo

Vuelvo a los sesenta y ocho niños, aunque de ellos solo puede decirse lo que dice la tabla. Sus números hablan contra un fondo de mundos posibles que el procedimiento elige, bajo un umbral que tiene historia, con instrumentos que nombramos con palabras cargadas, dentro de instituciones que distribuyen la responsabilidad hasta que parece no pertenecer a nadie. Nada de esto hace falsa a la estadística. La hace humana, que es otra cosa.

La historia de la salud enseña que cada época ha decidido de algún modo qué cuerpos se ven y cuáles no: los tuberculosos que entraban o no en las cifras oficiales de Colombia en la primera mitad del siglo XX, los niños intoxicados con plomo que existían mucho antes de que un umbral los volviera casos. La tabla 2×2 pertenece a esa misma historia. Es una rejilla donde los cuerpos se vuelven cifras, y el test es la regla con la que se decide cuáles de esas cifras alcanzan a ser un hecho.

Esa regla, el test que decide cuándo una diferencia se vuelve hecho, merece ser elegida antes que abandonada. Fisher hizo lo que hizo en su contexto, y lo hizo bien; su razonamiento sobre la aleatorización sigue siendo una de las ideas más limpias de la estadística. La crítica apunta a la inercia con que seguimos aplicando su solución sin preguntar a qué pregunta responde. Elegir un test a la vista, declarando por qué, es aceptar que la evidencia se produce, y que quien la produce responde por ella.

Empezamos preguntando cuál de los tres números era el correcto, 0,054, 0,038 o 0,028. Terminamos con otra pregunta, más incómoda que la del comienzo: ante quiénes responde una tabla, y quién responde por la manera de leerla.

Queda abierta, además, una pregunta que quizá no tenga respuesta técnica. Si cada procedimiento dibuja un mundo distinto de posibilidades contra el cual juzgamos lo ocurrido, y si cada uno habla de un conjunto distinto de vidas, las que estuvieron o las que vendrán, entonces elegir un procedimiento es, de algún modo, elegir en qué mundo creemos estar y ante quiénes respondemos. Esa elección no la puede hacer un algoritmo. La hacemos nosotros, con lo que sabemos y con lo que somos.

Siete de treinta y cuatro. Uno de treinta y cuatro. Cuatro al alta, y ninguno. Detrás de cada cifra hubo una cama, un reloj que contaba los minutos de la reanimación, una jeringa con una dosis que nadie en la sala conocía. A esos niños ya no se les puede devolver nada. Lo único que todavía se decide por ellos es cómo se lee su tabla, y con eso, si lo que vivieron cuenta.

## Nota sobre las fuentes y los cálculos

Este ensayo combina tres tipos de material: resultados estadísticos, hechos históricos e interpretaciones. Conviene que el lector pueda distinguirlos.

La literatura estadística publicada sostiene las afirmaciones generales: que el test de Fisher es conservador cuando los márgenes no están fijados por el diseño (Lydersen, Fagerland y Laake, 2009), que Boschloo es al menos tan potente como Fisher en su construcción unilateral (Boschloo, 1970), que la maximización puede restringirse a un intervalo de confianza para el parámetro desconocido (Berger y Boos, 1994), que el propio Barnard terminó defendiendo el test condicional (Barnard, 1949) y que el debate sobre la tabla 2×2 sigue abierto (Ripamonti, Lloyd y Quatto, 2017).

Los cálculos sobre la tabla de Perondi son propios y se detallan en Ríos (2026). Los valores p (Fisher 0,054; Boschloo 0,038, idéntico con las definiciones bilaterales `minlike` y `central`; Barnard-CSM 0,028), las discordancias (Fisher-Boschloo 11,6 %; Fisher-Barnard-CSM 15,4 %, ambas en una sola dirección, con 40 tablas cada una), las probabilidades de detección (43,3 %, 54,9 % y 58,7 %) y las tasas máximas de falsas alarmas (3,0 %, 4,7 % y 4,7 %, evaluadas sobre una malla de 1.999 valores del parámetro común) se obtuvieron en R 4.6.1 por enumeración completa de las 1.225 tablas posibles bajo el escenario n₁ = n₂ = 34, p₁ = 0,20, p₂ = 0,03, con α = 0,05: Fisher con `fisher.test`, Boschloo con `exact2x2` 1.7.0 y Barnard-CSM con `Exact` 3.3. Las cifras de Fisher y Boschloo y el cálculo de Altham se reprodujeron además con una implementación independiente en Python (SciPy 1.17.1; Virtanen et al., 2020). Dos detalles de cálculo cambian el resultado y merecen declararse. El primero es la orientación de la tabla. `Exact::exact.test` supone por defecto que los grupos están en las filas (`cond.row = TRUE`), mientras que `scipy.stats.barnard_exact` y `boschloo_exact` suponen que están en las columnas. Bien orientados, ambos coinciden: Barnard-CSM 0,0279 y el test incondicional basado en el estadístico z 0,0281 con o sin varianza combinada, y Boschloo 0,0385. Con la tabla transpuesta, que fija los totales de sobrevivientes y fallecidos en lugar de los tamaños de grupo, `Exact` devuelve 0,0244 para CSM y `barnard_exact` devuelve 0,0505 con varianza combinada y 0,161 sin combinarla; ninguno de los dos programas lo advierte. El segundo es la maximización. La probabilidad de la cola de Boschloo, como función del parámetro desconocido, tiene tres máximos locales: 0,0282 en p ≈ 0,134 y en p ≈ 0,866, y 0,0385 en p = 0,5, que es el máximo global; una búsqueda que se detiene en un máximo local reporta 0,028. Bien orientadas y bien maximizadas, las pruebas incondicionales difieren poco entre sí en esta tabla: aquí pesan más la orientación y la maximización que el ordenamiento. El cálculo de Altham se verificó por integración numérica: el valor p unilateral de Fisher (0,0272) coincide con la probabilidad posterior de que la dosis alta supere a la estándar bajo las distribuciones previas Beta(0, 1) para la dosis estándar y Beta(1, 0) para la dosis alta; con distribuciones previas uniformes, Beta(1, 1), esa probabilidad es 0,0138. Todas estas cifras son propiedades de ese escenario y de esas implementaciones, no de las pruebas en general.

Los hechos históricos provienen de la historiografía citada (Peter y Revel, 1974; Márquez Valderrama, 2005; Estrada Orrego, Gallo y Márquez Valderrama, 2016; Fassin y Naudé, 2004; Fassin, 2008) y se presentan como lo que esos trabajos documentan. Las lecturas filosóficas, sociológicas y éticas son interpretaciones del autor: las conexiones entre la elección de un test y las obras de Canguilhem, Foucault, Fassin, Latour y Woolgar, Kahneman y Tversky, y Max-Neef son propuestas para pensar el problema, y ninguno de esos autores escribió sobre la tabla 2×2. La lectura de Canguilhem, en particular, se usa de manera restringida y así se declara en el texto.

La equivalencia entre el test de Fisher y la prueba de aleatorización bajo la hipótesis nula estricta es un resultado conocido (Rosenbaum, 2002; Imbens y Rubin, 2015); el documento técnico (Ríos, 2026) deja esa vía inferencial fuera de su alcance.

Las citas de Canguilhem (1990) y de Fassin (2008) provienen de las traducciones al español de Jorge Márquez Valderrama (1998) y de Jorge Márquez Valderrama y Víctor Manuel García García (2022), respectivamente; los números de página remiten a esas traducciones.

## Referencias

Agresti, A., y Coull, B. A. (1998). Approximate is better than "exact" for interval estimation of binomial proportions. *The American Statistician*, 52(2), 119–126.

Altham, P. M. E. (1969). Exact Bayesian analysis of a 2×2 contingency table, and Fisher's "exact" significance test. *Journal of the Royal Statistical Society, Series B*, 31(2), 261–269.

Barnard, G. A. (1945). A new test for 2×2 tables. *Nature*, 156, 177.

Barnard, G. A. (1947). Significance tests for 2×2 tables. *Biometrika*, 34(1–2), 123–138.

Barnard, G. A. (1949). Statistical inference. *Journal of the Royal Statistical Society, Series B*, 11(2), 115–149.

Berger, R. L., y Boos, D. D. (1994). P values maximized over a confidence set for the nuisance parameter. *Journal of the American Statistical Association*, 89(427), 1012–1016.

Boschloo, R. D. (1970). Raised conditional level of significance for the 2×2-table when testing the equality of two probabilities. *Statistica Neerlandica*, 24(1), 1–9.

Canguilhem, G. (1966). *Le normal et le pathologique*. París: PUF. [Ed. en español: *Lo normal y lo patológico*. México: Siglo XXI.]

Canguilhem, G. (1990). *La santé, concept vulgaire et question philosophique*. Toulouse: Sables. [Conferencia dictada en la Universidad de Estrasburgo en mayo de 1988. Trad. J. Márquez Valderrama, "La salud, concepto vulgar y problema filosófico", 1998.]

D'Agostini, G. (s. f.). Notas del curso de laboratorio de física (PhysLab), cap. 5. Roma: Sapienza Università di Roma. https://www.giuliodagostini.it/dagos/PhysLab/PhysLab_05.pdf

D'Agostini, G. (2003). *Bayesian Reasoning in Data Analysis: A Critical Introduction*. Singapur: World Scientific.

Dickersin, K. (1990). The existence of publication bias and risk factors for its occurrence. *JAMA*, 263(10), 1385–1389.

Estrada Orrego, V., Gallo, O., y Márquez Valderrama, J. (2016). Retórica de la cuantificación: tuberculosis, estadística y mundo laboral en Colombia, 1916-1946. *História, Ciências, Saúde-Manguinhos*, 23(2), 277–299.

Fassin, D. (2008). *Faire de la santé publique* (2.ª ed. revisada). Rennes: Éditions de l'École des Hautes Études en Santé Publique. [Trad. J. Márquez Valderrama y V. M. García García, "Hacer salud pública", Universidad Nacional de Colombia y Universidad El Bosque, 2022.]

Fassin, D. (2010). *La raison humanitaire. Une histoire morale du temps présent*. París: Gallimard/Seuil.

Fassin, D. (2018). *La vie. Mode d'emploi critique*. París: Seuil.

Fassin, D., y Naudé, A.-J. (2004). Plumbism reinvented: childhood lead poisoning in France, 1985–1990. *American Journal of Public Health*, 94(11), 1854–1863.

Fisher, R. A. (1925). *Statistical Methods for Research Workers*. Edimburgo: Oliver & Boyd.

Fisher, R. A. (1935). *The Design of Experiments*. Edimburgo: Oliver & Boyd.

Foucault, M. (1976). *Histoire de la sexualité I. La volonté de savoir*. París: Gallimard.

Imbens, G. W., y Rubin, D. B. (2015). *Causal Inference for Statistics, Social, and Biomedical Sciences: An Introduction*. Cambridge: Cambridge University Press.

Kahneman, D. (2011). *Thinking, Fast and Slow*. Nueva York: Farrar, Straus and Giroux.

Latour, B., y Woolgar, S. (1979). *Laboratory Life: The Social Construction of Scientific Facts*. Beverly Hills: Sage.

Lydersen, S., Fagerland, M. W., y Laake, P. (2009). Recommended tests for association in 2×2 tables. *Statistics in Medicine*, 28(7), 1159–1175.

Márquez Valderrama, J. (2005). *Ciudad, miasmas y microbios. La irrupción de la ciencia pasteriana en Antioquia*. Medellín: Editorial Universidad de Antioquia / Universidad Nacional de Colombia.

Márquez Valderrama, J., Casas Orrego, Á., y Estrada Orrego, V. (Eds.) (2004). *Higienizar, medicar, gobernar. Historia, medicina y sociedad en Colombia*. Medellín: Universidad Nacional de Colombia.

Max-Neef, M., Elizalde, A., y Hopenhayn, M. (1986). *Desarrollo a escala humana: una opción para el futuro*. Santiago: CEPAUR / Fundación Dag Hammarskjöld.

Perondi, M. B. M., Reis, A. G., Paiva, E. F., Nadkarni, V. M., y Berg, R. A. (2004). A comparison of high-dose and standard-dose epinephrine in children with cardiac arrest. *New England Journal of Medicine*, 350(17), 1722–1730.

Peter, J.-P., y Revel, J. (1974). Le corps: l'homme malade et son histoire. En J. Le Goff y P. Nora (Eds.), *Faire de l'histoire*, vol. III (pp. 169–191). París: Gallimard.

Ríos, E. (2026). *El test exacto de Fisher en tablas 2×2 pequeñas: condicionamiento, alternativas exactas y práctica explícita*. Medellín: Universidad Nacional de Colombia, Departamento de Estadística. Documento de trabajo.

Ripamonti, E., Lloyd, C. J., y Quatto, P. (2017). Contemporary frequentist views of the 2×2 binomial trial. *Statistical Science*, 32(4), 600–615.

Rosenbaum, P. R. (2002). *Observational Studies* (2.ª ed.). Nueva York: Springer.

Suissa, S., y Shuster, J. J. (1985). Exact unconditional sample sizes for the 2×2 binomial trial. *Journal of the Royal Statistical Society, Series A*, 148(4), 317–327.

Virtanen, P., et al. (2020). SciPy 1.0: fundamental algorithms for scientific computing in Python. *Nature Methods*, 17, 261–272.

Tversky, A., y Kahneman, D. (1971). Belief in the law of small numbers. *Psychological Bulletin*, 76(2), 105–110.

Tversky, A., y Kahneman, D. (1974). Judgment under uncertainty: heuristics and biases. *Science*, 185(4157), 1124–1131.

Wasserstein, R. L., y Lazar, N. A. (2016). The ASA's statement on p-values: context, process, and purpose. *The American Statistician*, 70(2), 129–133.

Wasserstein, R. L., Schirm, A. L., y Lazar, N. A. (2019). Moving to a world beyond "p < 0.05". *The American Statistician*, 73(sup1), 1–19.

Yates, F. (1984). Tests of significance for 2×2 contingency tables. *Journal of the Royal Statistical Society, Series A*, 147(3), 426–463.
