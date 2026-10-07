# =============================================================================
# demanda_skus_logistica.R — Generador de datos de demanda intermitente
# para "Logística El Dorado" (Módulos 1, 7, 13).
#
# Produce: public/data/demanda_skus.csv
#   Columnas: sku, fecha, demanda, promocion, estacionalidad
#
# Diseño: 200 SKUs con demanda intermitente (ceros y picos) típica de
# inventarios. Mezcla de:
#   - 60% SKUs intermitentes (ADI > 1.32, CV² > 0.49) — Syntetos & Boylan (2005)
#   - 30% SKUs erráticos pero regulares
#   - 10% SKUs suaves (liso, predecible)
#
# Semilla: 2026. Ejecutar: Rscript src/data-gen/demanda_skus_logistica.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n_skus <- 200
n_weeks <- 52
dates <- seq(as.Date("2025-01-06"), by = "week", length.out = n_weeks)

rows <- list()
for (s in seq_len(n_skus)) {
  sku <- sprintf("SKU-%03d", s)
  tipo <- sample(c("intermitente", "erratico", "suave"), 1, prob = c(0.6, 0.3, 0.1))

  if (tipo == "intermitente") {
    # Probabilidad de demanda no nula en una semana dada
    p_demand <- runif(1, 0.2, 0.5)
    # Tamaño de demanda cuando ocurre (lognormal)
    mu_log <- runif(1, 2, 4)
    sigma_log <- runif(1, 0.5, 1.0)
  } else if (tipo == "erratico") {
    p_demand <- runif(1, 0.7, 0.9)
    mu_log <- runif(1, 3, 5)
    sigma_log <- runif(1, 0.8, 1.5)
  } else {
    p_demand <- 1
    mu_log <- runif(1, 3, 4.5)
    sigma_log <- runif(1, 0.1, 0.3)
  }

  # Promoción: 10% de las semanas, efecto multiplicador
  promocion <- rbinom(n_weeks, 1, 0.1)
  promo_mult <- ifelse(promocion == 1, runif(1, 1.5, 3.0), 1)

  # Estacionalidad: seno anual + navidad
  season <- 1 + 0.3 * sin(2 * pi * (1:n_weeks - 13) / 52) +
    0.5 * ifelse(1:n_weeks >= 48, 1, 0)

  for (w in seq_len(n_weeks)) {
    has_demand <- runif(1) < p_demand
    if (has_demand) {
      base <- rlnorm(1, meanlog = mu_log, sdlog = sigma_log)
      demanda <- round(base * promo_mult[w] * season[w], 0)
    } else {
      demanda <- 0
    }
    rows[[length(rows) + 1]] <- data.frame(
      sku = sku,
      fecha = dates[w],
      demanda = demanda,
      promocion = promocion[w],
      estacionalidad = round(season[w], 3)
    )
  }
}

demanda_skus <- do.call(rbind, rows)
write.csv(demanda_skus, file.path(out_dir, "demanda_skus.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "demanda_skus.csv"),
    "(", nrow(demanda_skus), "filas )\n")
