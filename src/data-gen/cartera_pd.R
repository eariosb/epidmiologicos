# =============================================================================
# cartera_pd.R — Generador de datos de probabilidad de incumplimiento (PD)
# para los Módulos 6 y 14 (Efectos aleatorios, PD binomial).
#
# Produce: public/data/cartera_pd.csv
#   Columnas: id_cliente, sector, antiguedad, ratio_liquidez, endeudamiento,
#             default, trimestre
#
# Diseño: variable binomial (default sí/no) con probabilidad dependiente de
# covariables financieras y efecto aleatorio por sector. La probabilidad
# base es baja (2-5%) pero aumenta con endeudamiento y baja liquidez.
# El efecto sectorial induce correlación intra-grupo (motiva re()).
#
# Referencia: IFRS 9; Stasinopoulos et al. (2017, Cap. 9).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/cartera_pd.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 2500
sectores <- c("manufactura", "comercio", "construccion", "agro", "servicios")

id_cliente <- sprintf("CLI-%05d", seq_len(n))
sector <- sample(sectores, n, replace = TRUE, prob = c(0.25, 0.30, 0.15, 0.10, 0.20))
antiguedad <- pmax(0, round(rgamma(n, shape = 2, rate = 0.3), 1))
ratio_liquidez <- round(rnorm(n, 1.5, 0.5), 3)
ratio_liquidez <- pmax(ratio_liquidez, 0.1)
endeudamiento <- round(runif(n, 0.1, 0.9), 3)
trimestre <- sample(1:8, n, replace = TRUE)

# Efecto aleatorio por sector (N(0, sigma_sector))
sigma_sector <- 0.5
efecto_sector <- rnorm(length(sectores), 0, sigma_sector)
names(efecto_sector) <- sectores

# Probabilidad de default (logit-link)
eta <- -3.0 +
  efecto_sector[sector] +
  1.5 * endeudamiento -
  0.8 * (ratio_liquidez - 1.5) -
  0.03 * antiguedad
p_default <- 1 / (1 + exp(-eta))

# Generar default
default <- rbinom(n, 1, p_default)

cartera_pd <- data.frame(
  id_cliente = id_cliente,
  sector = sector,
  antiguedad = antiguedad,
  ratio_liquidez = ratio_liquidez,
  endeudamiento = endeudamiento,
  default = default,
  trimestre = trimestre
)

write.csv(cartera_pd, file.path(out_dir, "cartera_pd.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "cartera_pd.csv"),
    "(default rate:", round(mean(default), 4), ")\n")
