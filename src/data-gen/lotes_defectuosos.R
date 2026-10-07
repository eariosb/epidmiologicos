# =============================================================================
# lotes_defectuosos.R — Generador de datos de proporciones de defectos
# para el Módulo 9 (Beta, BEINF).
#
# Produce: public/data/lotes_defectuosos.csv
#   Columnas: id_lote, linea, temperatura, velocidad, proporcion_defectos
#
# Diseño: proporción de productos defectuosos por lote en (0,1) con masa
# en 0 (lotes perfectos) y en 1 (lotes completamente defectuosos).
# La media depende de la temperatura y velocidad de la línea de producción.
# Estructura 0/(0,1)/1 con patrón ~60/35/5.
#
# Referencia: Stasinopoulos et al. (2017, Cap. 10); Rigby et al. (2019, Cap. 8).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/lotes_defectuosos.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 800

id_lote <- sprintf("LOT-%04d", seq_len(n))
linea <- sample(c("A", "B", "C"), n, replace = TRUE, prob = c(0.4, 0.35, 0.25))
temperatura <- round(runif(n, 160, 220), 1)  # °C
velocidad <- round(runif(n, 50, 120), 1)     # unidades/min

# Probabilidad de cada componente
# Lotes perfectos más probables en línea A, baja temperatura y velocidad baja
p_zero <- 0.60
p_one <- 0.05
# Ajustar por línea
p_zero <- ifelse(linea == "A", p_zero + 0.10,
                 ifelse(linea == "C", p_zero - 0.15, p_zero))
p_one <- ifelse(linea == "C", p_one + 0.05, p_one)
p_parcial <- 1 - p_zero - p_one

u <- runif(n)
componente <- ifelse(u < p_zero, 0, ifelse(u < p_zero + p_one, 1, 2))

# Para parciales: Beta con media dependiente de temperatura y velocidad
mu_parcial <- plogis(-4 + 0.03 * (temperatura - 180) + 0.02 * (velocidad - 80))
sigma_parcial <- 0.15

proporcion <- numeric(n)
for (i in seq_len(n)) {
  if (componente[i] == 0) {
    proporcion[i] <- 0
  } else if (componente[i] == 1) {
    proporcion[i] <- 1
  } else {
    prec <- 1 / sigma_parcial^2
    alpha_b <- mu_parcial[i] * (prec - 1)
    beta_b <- (1 - mu_parcial[i]) * (prec - 1)
    proporcion[i] <- rbeta(1, alpha_b, beta_b)
  }
}

lotes <- data.frame(
  id_lote = id_lote,
  linea = linea,
  temperatura = temperatura,
  velocidad = velocidad,
  proporcion_defectos = round(proporcion, 4)
)

write.csv(lotes, file.path(out_dir, "lotes_defectuosos.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "lotes_defectuosos.csv"),
    "(0:", sum(proporcion == 0),
    "1:", sum(proporcion == 1),
    "parcial:", sum(proporcion > 0 & proporcion < 1), ")\n")
