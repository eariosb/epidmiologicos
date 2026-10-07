# =============================================================================
# fatiga_cables.R — Generador de datos de fatiga de cables con censura
# para el Módulo 12 (Confiabilidad y censura).
#
# Produce: public/data/fatiga.csv
#   Columnas: carga, temperatura, ciclos, censura
#
# Diseño: datos de vida útil (ciclos hasta fallo) bajo cargas y temperaturas
# variables, con censura administrativa (el experimento se detiene a 10^6 ciclos).
# La vida útil sigue una Weibull con escala dependiente de carga y temperatura
# (modelo acelerado de fallos).
#
# Referencia: Meeker, Escobar & Pascual (2022); Stasinopoulos et al. (2017, Cap. 13).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/fatiga_cables.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 300

# Variables explicativas
carga <- runif(n, 50, 200)          # MPa
temperatura <- runif(n, 20, 80)     # °C

# Weibull acelerada: escala λ = exp(α0 + α1*carga + α2*temp)
# Forma (shape) fijo en 2 (desgaste por fatiga)
alpha0 <- 15
alpha1 <- -0.04
alpha2 <- -0.02
lambda <- exp(alpha0 + alpha1 * carga + alpha2 * temperatura)
shape <- 2

# Ciclos hasta fallo (Weibull)
ciclos_true <- rweibull(n, shape = shape, scale = lambda)

# Censura administrativa: el experimento se detiene a 1,000,000 ciclos
censoring_time <- 1e6
censura <- as.integer(ciclos_true < censoring_time)
ciclos <- pmin(ciclos_true, censoring_time)

fatiga <- data.frame(
  carga = round(carga, 1),
  temperatura = round(temperatura, 1),
  ciclos = round(ciclos, 0),
  censura = censura
)

write.csv(fatiga, file.path(out_dir, "fatiga.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "fatiga.csv"),
    "(", sum(censura == 0), "censurados de", n, ")\n")
