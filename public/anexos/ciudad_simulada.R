# ================================================================
# CIUDAD SIMULADA — población con verdad conocida para el curso
# ================================================================
# Genera una ciudad cerrada de 20 000 habitantes con:
#   C  = comorbilidad (confusor sembrado: causa E y D)
#   E  = exposición  (P(E|C) depende de C -> confusión)
#   D  = desenlace   (asignación EXACTA por estrato: el número de
#        casos es round(riesgo * n_estrato), así la verdad de la
#        ciudad finita coincide con el mecanismo — el azar queda
#        en el muestreo, donde pedagógicamente pertenece)
#   H  = hospitalización (asignación exacta; D y E abren la puerta
#        -> colisionador para el ejercicio de Berkson)
#
# La VERDAD es conocida por construcción:
#   RR causal de E sobre D, condicionado a C: 3.00 (exacto)
#   RR crudo poblacional: ~4.1 (inflado por la confusión con C)
#
# Uso:   source("ciudad_simulada.R")   -> queda `ciudad` en memoria
#        ciudad <- generar_ciudad()   -> lo mismo, explícito
# ================================================================

generar_ciudad <- function(N = 20000, semilla = 2024) {
  set.seed(semilla)

  # Asignación exacta en cascada: todas las prevalencias y riesgos de
  # la ciudad finita igualan al mecanismo; el azar vive solo en QUÉ
  # habitantes reciben cada marca y en el muestreo posterior.
  idx <- sample(N)
  C <- integer(N); C[idx[seq_len(round(0.30 * N))]] <- 1

  E <- integer(N)
  for (cc in 0:1) {
    pool <- which(C == cc)
    k <- round((0.15 + 0.30 * cc) * length(pool))
    E[sample(pool, k)] <- 1
  }

  # Asignación exacta por estrato (E, C): mezclar y contar la fracción
  D <- integer(N)
  for (e in 0:1) for (cc in 0:1) {
    idx <- which(E == e & C == cc)
    k <- round(0.04 * (3 ^ e) * (2 ^ cc) * length(idx))
    D[sample(idx, k)] <- 1
  }
  # Hospitalización: idem, con probabilidad por estrato (D, E)
  H <- integer(N)
  for (d in 0:1) for (e in 0:1) {
    idx <- which(D == d & E == e)
    k <- round((0.02 + 0.40 * d + 0.20 * e) * length(idx))
    H[sample(idx, k)] <- 1
  }

  data.frame(C, E, D, H)
}

verdad <- function(ciudad) {
  with(ciudad, {
    r1 <- mean(D[E == 1]); r0 <- mean(D[E == 0])
    or <- (r1 / (1 - r1)) / (r0 / (1 - r0))
    cat(sprintf("Población: %d habitantes\n", length(D)))
    cat(sprintf("P(E)=%.3f  P(D)=%.3f  P(H)=%.3f\n",
                mean(E), mean(D), mean(H)))
    cat(sprintf("RR crudo poblacional = %.2f   OR crudo = %.2f\n",
                r1 / r0, or))
    cat(sprintf("RR dentro de C=0: %.2f   RR dentro de C=1: %.2f\n",
                mean(D[E == 1 & C == 0]) / mean(D[E == 0 & C == 0]),
                mean(D[E == 1 & C == 1]) / mean(D[E == 0 & C == 1])))
    cat("(la verdad causal sembrada es RR = 3.00 dentro de cada C)\n")
  })
}

# --- Ejecutable directo ------------------------------------------------
ciudad <- generar_ciudad()
verdad(ciudad)
