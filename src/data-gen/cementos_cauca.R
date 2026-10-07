# =============================================================================
# cementos_cauca.R — Generador de datos de resistencia de cementos
# para "Cementos del Cauca" (Módulo 5: P-splines).
#
# Produce: public/data/cementos.csv
#   Columnas: temperatura, dureza
#
# Diseño: relación no lineal entre temperatura de curado y dureza del cemento,
# con varianza creciente (heterocedasticidad). La relación es cuadrática
# invertida (óptimo alrededor de 25°C) con ruido que aumenta en los extremos.
# Esto motiva el uso de P-splines para μ y modelado de σ.
#
# Referencia: Eilers & Marx (1996); Stasinopoulos et al. (2017, Cap. 5).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/cementos_cauca.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 400

# Temperatura de curado: 5°C a 60°C
temperatura <- runif(n, 5, 60)

# Dureza media: relación cuadrática invertida (óptimo ~25°C)
mu_dureza <- 45 - 0.02 * (temperatura - 25)^2

# Varianza creciente en los extremos (heterocedasticidad)
sigma_dureza <- 2 + 0.15 * abs(temperatura - 25)

# Dureza observada
dureza <- rnorm(n, mean = mu_dureza, sd = sigma_dureza)
dureza <- pmax(dureza, 10)  # no negativa

cementos <- data.frame(
  temperatura = round(temperatura, 1),
  dureza = round(dureza, 2)
)

write.csv(cementos, file.path(out_dir, "cementos.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "cementos.csv"), "\n")
