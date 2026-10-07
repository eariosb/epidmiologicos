# =============================================================================
# recuperaciones_acc.R — Generador de datos de LGD (Loss Given Default)
# para el Módulo 15 (LGD con BEINF).
#
# Produce: public/data/recuperaciones_acc.csv
#   Columnas: id_credito, sector, monto, antiguedad, lgd, colateral
#
# Diseño: LGD con estructura 0/1/(0,1) siguiendo el patrón 56/14/30
# (56% recuperación total = LGD 0, 14% pérdida total = LGD 1,
# 30% parcial en (0,1)). La componente continua sigue una Beta con
# media dependiente del sector y colateral.
#
# Referencia: Calabrese (2014); Tong et al. (2013).
# Semilla: 2026. Ejecutar: Rscript src/data-gen/recuperaciones_acc.R
# =============================================================================

set.seed(2026)

out_dir <- file.path("public", "data")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

n <- 2000

id_credito <- sprintf("CR-%05d", seq_len(n))
sector <- sample(c("manufactura", "comercio", "construccion", "agro", "servicios"),
                 n, replace = TRUE, prob = c(0.25, 0.30, 0.15, 0.10, 0.20))
monto <- round(exp(rnorm(n, 4.0, 0.8)), 1)  # millones COP
antiguedad <- pmax(0, round(rgamma(n, shape = 2, rate = 0.3), 1))
colateral <- sample(c("hipotecario", "prendario", "sin_colateral"),
                    n, replace = TRUE, prob = c(0.3, 0.4, 0.3))

# Probabilidad de cada componente (0, 1, parcial)
# Sector y colateral afectan la probabilidad de recuperación total
p_total <- 0.56
p_perdida <- 0.14
# Ajustar por colateral
p_total <- ifelse(colateral == "hipotecario", p_total + 0.10,
                  ifelse(colateral == "sin_colateral", p_total - 0.15, p_total))
p_perdida <- ifelse(colateral == "sin_colateral", p_perdida + 0.12, p_perdida)
p_total <- pmax(pmin(p_total, 0.85), 0.20)
p_perdida <- pmax(pmin(p_perdida, 0.40), 0.05)
p_parcial <- 1 - p_total - p_perdida

# Asignar componente
u <- runif(n)
componente <- ifelse(u < p_total, 0,
                     ifelse(u < p_total + p_perdida, 1, 2))  # 2 = parcial

# Para los parciales: Beta con media dependiente de sector
beta_mu_sector <- c(manufactura = 0.35, comercio = 0.40, construccion = 0.55,
                    agro = 0.45, servicios = 0.30)
mu_parcial <- beta_mu_sector[sector]
sigma_parcial <- 0.25  # precisión = 1/sigma^2 = 16

# Generar LGD
lgd <- numeric(n)
for (i in seq_len(n)) {
  if (componente[i] == 0) {
    lgd[i] <- 0
  } else if (componente[i] == 1) {
    lgd[i] <- 1
  } else {
    # Beta con parametrización gamlss: mean = mu, precision = 1/sigma^2
    prec <- 1 / sigma_parcial^2
    alpha_b <- mu_parcial[i] * (prec - 1)
    beta_b <- (1 - mu_parcial[i]) * (prec - 1)
    lgd[i] <- rbeta(1, alpha_b, beta_b)
  }
}

recuperaciones <- data.frame(
  id_credito = id_credito,
  sector = sector,
  monto = monto,
  antiguedad = antiguedad,
  lgd = round(lgd, 4),
  colateral = colateral
)

write.csv(recuperaciones, file.path(out_dir, "recuperaciones_acc.csv"), row.names = FALSE)

cat("OK: escrito", file.path(out_dir, "recuperaciones_acc.csv"),
    "(0:", sum(lgd == 0), "1:", sum(lgd == 1), "parcial:", sum(lgd > 0 & lgd < 1), ")\n")
