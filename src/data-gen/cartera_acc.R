# =============================================================================
# cartera_acc.R — Generador de datos simulados de la aseguradora ficticia
# "Andina de Crédito y Caución" (ACC) para el Módulo 1 del curso GAMLSS.
#
# Produce dos archivos en public/data/:
#   1. carteras_ab.csv  — dos carteras con la MISMA severidad media pero
#      dispersión y cola radicalmente distintas (caso de apertura del curso).
#   2. severidad_acc.csv — severidades de siniestros de crédito con media y
#      dispersión dependientes de covariables (monto, sector, antigüedad).
#
# Diseño de las distribuciones (justificación):
#   - La severidad se simula con una Gamma cuya media crece con el monto
#     asegurado (log-enlace, estándar actuarial: De Jong & Heller, 2008) y
#     una fracción de siniestros "de cola" lognormales para inducir la
#     asimetría fuerte y curtosis que motivan BCT/GB2 en el Módulo 10.
#   - Cartera A: Gamma con sigma moderado. Cartera B: misma media, mezcla
#     con cola pesada => mismo E[Y], distinto riesgo. Ilustra la limitación
#     de tarificar solo con la media (Kneib et al., 2023, Sec. 1).
#
# Reproducibilidad: semilla fija 2026. Versiones en renv.lock (pendiente).
# Ejecutar desde la raíz del proyecto:  Rscript src/data-gen/cartera_acc.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

# -----------------------------------------------------------------------------
# 1. carteras_ab.csv — mismo promedio, distinto riesgo
# -----------------------------------------------------------------------------
n_ab <- 600  # 300 siniestros por cartera

# Cartera A: Gamma(media = 50, cv moderado)
sev_a <- rgamma(n_ab / 2, shape = 4, rate = 4 / 50)  # E = 50, CV = 0.5

# Cartera B: mezcla 85% Gamma barata + 15% lognormal de cola pesada,
# calibrada para E[Y] ≈ 50: 0.85*26 + 0.15*145*exp(0.5^2/2) ≈ 46.7 (+ ruido
# muestral de la cola pesada => media muestral ≈ 51-53, comparable a A)
sev_b_base <- rgamma(n_ab / 2, shape = 6, rate = 6 / 26)          # E = 26
tail_idx   <- runif(n_ab / 2) < 0.15
sev_b_tail <- rlnorm(n_ab / 2, meanlog = log(145), sdlog = 0.5)   # cola
sev_b      <- ifelse(tail_idx, sev_b_tail, sev_b_base)

carteras_ab <- data.frame(
  cartera   = rep(c("A", "B"), each = n_ab / 2),
  severidad = round(c(sev_a, sev_b), 2)  # millones COP
)

write.csv(carteras_ab, file.path(out_dir, "carteras_ab.csv"), row.names = FALSE)

# -----------------------------------------------------------------------------
# 2. severidad_acc.csv — severidad condicional a covariables
# -----------------------------------------------------------------------------
n <- 1500

sector <- sample(
  c("manufactura", "comercio", "construccion", "agro", "servicios"),
  n, replace = TRUE, prob = c(0.25, 0.30, 0.15, 0.10, 0.20)
)
monto      <- round(exp(rnorm(n, meanlog <- 4.5, 0.9)), 1)  # monto asegurado (millones)
antiguedad <- pmax(0, round(rgamma(n, shape = 2, rate = 0.5), 1))  # años como cliente

# Media log-lineal en monto y efecto de sector; dispersión mayor en construcción
beta_sector  <- c(manufactura = 0.00, comercio = -0.10, construccion = 0.35,
                  agro = 0.15, servicios = -0.05)
sigma_sector <- c(manufactura = 0.45, comercio = 0.40, construccion = 0.80,
                  agro = 0.60, servicios = 0.45)

mu    <- exp(1.2 + 0.55 * log(monto) + beta_sector[sector] - 0.02 * antiguedad)
sigma <- sigma_sector[sector]

# Gamma parametrizada estilo gamlss::GA: Var(Y) = sigma^2 * mu^2
severidad <- rgamma(n, shape = 1 / sigma^2, rate = 1 / (sigma^2 * mu))

severidad_acc <- data.frame(
  id_siniestro = sprintf("SIN-%04d", seq_len(n)),
  sector       = sector,
  monto        = monto,
  antiguedad   = antiguedad,
  severidad    = round(severidad, 2)
)

write.csv(severidad_acc, file.path(out_dir, "severidad_acc.csv"), row.names = FALSE)

cat("OK: escritos", file.path(out_dir, "carteras_ab.csv"),
    "y", file.path(out_dir, "severidad_acc.csv"), "\n")
