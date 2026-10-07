# =============================================================================
# triangulo_ibnr_caucion.R — Generador del triángulo de desarrollo de siniestros
# de la aseguradora ficticia ACC para el Módulo 16 (Reservas IBNR).
#
# Produce: public/data/triangulo_caucion.csv
#   Columnas: origen (año), desarrollo (año de devengo), incremental (pagos)
#
# Diseño: triángulo 8x8 con sobredispersión creciente en los años de desarrollo
# posteriores (patrón típico de seguros de caución: pagos concentrados en los
# primeros años de desarrollo con cola larga).
#
# Referencia: England & Verrall (2002), Spedicato et al. (2014).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/triangulo_ibnr_caucion.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n_years <- 8
origin_years <- 2018:(2018 + n_years - 1)

# Patrón de pagos acumulado (chain ladder): proporción incremental por año
# de desarrollo. Calibrado para caución: 40%, 25%, 15%, 10%, 5%, 3%, 1%, 1%
incr_pattern <- c(0.40, 0.25, 0.15, 0.10, 0.05, 0.03, 0.01, 0.01)

# Prima emitida por año (crecimiento del 8% anual)
premium <- 1000 * 1.08^(0:(n_years - 1))

# Frecuencia esperada (siniestros por año) con tendencia creciente
freq_rate <- 0.04  # 4% de la prima se convierte en siniestros

rows <- list()
for (i in seq_len(n_years)) {
  origin <- origin_years[i]
  # Pagos acumulados esperados
  expected_total <- premium[i] * freq_rate
  # Solo se desarrollan los años disponibles (triángulo superior)
  n_dev <- n_years - i + 1
  cumulative <- 0
  for (j in seq_len(n_dev)) {
    dev_year <- origin_years[j]
    # Pago incremental con sobredispersión creciente
    expected_inc <- expected_total * incr_pattern[j]
    # La sobredispersión aumenta con el año de desarrollo (cola incierta)
    dispersion <- 1 + 0.15 * j
    incremental <- max(0, rgamma(1, shape = 1 / dispersion^2,
                                  rate = 1 / (dispersion^2 * expected_inc)))
    cumulative <- cumulative + incremental
    rows[[length(rows) + 1]] <- data.frame(
      origen = origin,
      desarrollo = dev_year,
      incremental = round(incremental, 2),
      acumulado = round(cumulative, 2)
    )
  }
}

triangulo <- do.call(rbind, rows)
write.csv(triangulo, file.path(out_dir, "triangulo_caucion.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "triangulo_caucion.csv"), "\n")
