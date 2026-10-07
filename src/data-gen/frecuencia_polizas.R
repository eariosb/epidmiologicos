# =============================================================================
# frecuencia_polizas.R — Generador de datos de frecuencia de siniestros
# para el Módulo 8 (Datos de conteo) y Módulo 17 (Tarificación).
#
# Produce: public/data/frecuencia_polizas.csv
#   Columnas: id_poliza, sector, antiguedad, exposure, n_siniestros, zona
#
# Diseño: frecuencia de siniestros con sobredispersión y ceros inflados.
# La media depende del sector, antigüedad y zona. Se genera con NBI
# (Binomial Negativa I) para inducir sobredispersión, y una fracción
# de pólizas con ceros estructurales (ZIP/ZINBI).
#
# Referencia: Stasinopoulos et al. (2017, Cap. 9); Heller et al. (2007).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/frecuencia_polizas.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 3000

id_poliza <- sprintf("POL-%05d", seq_len(n))
sector <- sample(c("manufactura", "comercio", "construccion", "agro", "servicios"),
                 n, replace = TRUE, prob = c(0.25, 0.30, 0.15, 0.10, 0.20))
zona <- sample(c("urbana", "suburbana", "rural"), n, replace = TRUE,
               prob = c(0.5, 0.3, 0.2))
antiguedad <- pmax(0, round(rgamma(n, shape = 2, rate = 0.4), 1))
exposure <- round(runif(n, 0.5, 1.0), 2)  # fracción del año expuesta

# Media de la frecuencia (log-link)
beta0 <- 0.5
beta_sector <- c(manufactura = 0.0, comercio = 0.2, construccion = 0.6,
                 agro = -0.1, servicios = 0.1)
beta_zona <- c(urbana = 0.3, suburbana = 0.0, rural = -0.2)
beta_antig <- -0.05

mu_freq <- exp(beta0 + beta_sector[sector] + beta_zona[zona] +
               beta_antig * antiguedad) * exposure

# Sobredispersión (sigma de NBI)
sigma_freq <- 0.6  # CV = 0.6

# Fracción de ceros inflados (pólizas que nunca reportan)
p_inflated <- 0.15

# Generar conteos
r <- 1 / sigma_freq^2
prob <- sigma_freq^2 * mu_freq / (1 + sigma_freq^2 * mu_freq)

n_siniestros <- numeric(n)
for (i in seq_len(n)) {
  if (runif(1) < p_inflated) {
    n_siniestros[i] <- 0
  } else {
    n_siniestros[i] <- rnbinom(1, size = r, prob = 1 - prob[i])
  }
}

frecuencia <- data.frame(
  id_poliza = id_poliza,
  sector = sector,
  zona = zona,
  antiguedad = antiguedad,
  exposure = exposure,
  n_siniestros = n_siniestros
)

write.csv(frecuencia, file.path(out_dir, "frecuencia_polizas.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "frecuencia_polizas.csv"),
    "(media:", round(mean(n_siniestros), 3),
    "var:", round(var(n_siniestros), 3),
    "zeros:", sum(n_siniestros == 0), ")\n")
