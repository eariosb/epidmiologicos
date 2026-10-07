# =============================================================================
# precompute_outputs.R — Genera todos los PNG precomputados para los MDX
#
# Ejecutar desde la raiz del proyecto:
#   Rscript src/data-gen/precompute_outputs.R
#
# Requiere: gamlss, gamlss.data, survival
# =============================================================================

library(gamlss)
library(gamlss.data)
library(survival)

out_base <- file.path("public", "precomputed")
data_dir <- file.path("public", "data")

# ---- Paleta del curso --------------------------------------------------------
COL_PRIMARY   <- "#1e3a5f"   # azul oscuro
COL_SECONDARY <- "#2e7d32"   # verde
COL_ACCENT    <- "#e67e22"   # naranja
COL_DANGER    <- "#c0392b"   # rojo
COL_GRID      <- "#e9ecef"   # gris claro para grid
COL_BG        <- "#ffffff"   # fondo blanco
COL_TEXT      <- "#343a40"   # texto oscuro
COL_MUTED     <- "#6b7280"   # texto secundario

# ---- Tema limpio consistente -------------------------------------------------
set_clean_par <- function(mfrow = c(1, 1), mar = c(4.5, 4.5, 3, 2)) {
  par(
    mfrow       = mfrow,
    bg          = COL_BG,
    fg          = COL_TEXT,
    col.main    = COL_TEXT,
    col.lab     = COL_TEXT,
    col.axis    = COL_MUTED,
    col.sub     = COL_MUTED,
    font.main   = 2,
    font.lab    = 1,
    font.axis   = 1,
    cex.main    = 1.1,
    cex.lab     = 0.95,
    cex.axis    = 0.85,
    mar         = mar,
    las         = 1,
    bty         = "o"
  )
}

# ---- Helper: guardar plot en PNG de alta calidad -----------------------------
save_png <- function(path, expr, width = 1000, height = 700) {
  dir.create(dirname(path), recursive = TRUE, showWarnings = FALSE)
  png(path, width = width, height = height, res = 150, bg = "white")
  tryCatch(
    {
      set_clean_par()
      expr
    },
    finally = {
      dev.off()
      par(mfrow = c(1, 1), mar = c(5, 4, 4, 2) + 0.1)
    }
  )
  cat("OK:", path, "\n")
}

# =============================================================================
# Modulo 01: explorar carteras + histDist
# =============================================================================
cat("\n=== Modulo 01 ===\n")

severidad <- read.csv(file.path(data_dir, "severidad_acc.csv"))
severidad$sector <- as.factor(severidad$sector)

# 01/explorar-carteras.png
save_png(file.path(out_base, "01", "explorar-carteras.png"), {
  cartera_A <- severidad$severidad[severidad$sector == "manufactura"]
  cartera_B <- severidad$severidad[severidad$sector == "construccion"]
  plot(density(cartera_A), col = COL_PRIMARY, lwd = 2.5,
       main = "Densidades de severidad por cartera",
       xlab = "Severidad (millones COP)", xlim = range(severidad$severidad),
       col.lab = COL_TEXT, col.main = COL_TEXT)
  lines(density(cartera_B), col = COL_DANGER, lwd = 2.5)
  legend("topright", c("Manufactura", "Construccion"),
         col = c(COL_PRIMARY, COL_DANGER), lwd = 2.5, bty = "n",
         cex = 0.9)
})

# 01/histdist-severidad.png
save_png(file.path(out_base, "01", "histdist-severidad.png"), {
  y <- severidad$severidad
  m_no <- gamlss(y ~ 1, family = NO)
  m_ga <- gamlss(y ~ 1, family = GA)
  m_bct <- gamlss(y ~ 1, family = BCT)
  par(mfrow = c(1, 3), mar = c(4, 4, 3, 1))
  histDist(y, family = NO, main = "Normal")
  histDist(y, family = GA, main = "Gamma")
  histDist(y, family = BCT, main = "BCT")
  par(mfrow = c(1, 1))
})

# =============================================================================
# Modulo 02: gamlss Gamma mu y mu+sigma
# =============================================================================
cat("\n=== Modulo 02 ===\n")

# 02/gamlss-gamma-mu.png
save_png(file.path(out_base, "02", "gamlss-gamma-mu.png"), {
  m1 <- gamlss(severidad ~ log(monto) + sector, family = GA, data = severidad)
  term.plot(m1, what = "mu", pages = 1, ask = FALSE, se = TRUE)
})

# 02/gamlss-gamma-mu-sigma.png
save_png(file.path(out_base, "02", "gamlss-gamma-mu-sigma.png"), {
  m2 <- gamlss(severidad ~ log(monto) + sector,
               sigma.formula = ~ sector, family = GA, data = severidad)
  term.plot(m2, what = "sigma", pages = 1, ask = FALSE, se = TRUE)
})

# 02/residuos-rapido.png
save_png(file.path(out_base, "02", "residuos-rapido.png"), {
  plot(m2)
})

# =============================================================================
# Modulo 03: fitDist
# =============================================================================
cat("\n=== Modulo 03 ===\n")

save_png(file.path(out_base, "03", "fitdist-severidad.png"), {
  y <- severidad$severidad
  histDist(y, family = BCT, main = "BCT - severidad")
})

# =============================================================================
# Modulo 04: worm plots
# =============================================================================
cat("\n=== Modulo 04 ===\n")

data(dbbmi)

# 04/worm-plot-dbbmi.png (modelo bueno)
save_png(file.path(out_base, "04", "worm-plot-dbbmi.png"), {
  m_good <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                   nu.formula = ~ pb(age), family = BCCG, data = dbbmi)
  wp(m_good, xvar = dbbmi$age, n.inter = 4,
     main = "Worm plots - BCCG (buen ajuste)")
  mtext("Gusanos cerca de la linea horizontal: sin patologia",
        side = 3, line = -1, cex = 0.7, col = COL_SECONDARY)
})

# 04/worm-plot-falla.png (modelo malo: Normal sin suavizados)
save_png(file.path(out_base, "04", "worm-plot-falla.png"), {
  m_bad <- gamlss(bmi ~ age, family = NO, data = dbbmi)
  wp(m_bad, xvar = dbbmi$age, n.inter = 4,
     main = "Worm plots - Normal (mal ajuste)")
  mtext("Gusanos con forma de S/U: patologia de curtosis y asimetria",
        side = 3, line = -1, cex = 0.7, col = COL_DANGER)
})

# =============================================================================
# Modulo 05: cementos P-splines
# =============================================================================
cat("\n=== Modulo 05 ===\n")

cementos <- read.csv(file.path(data_dir, "cementos.csv"))

save_png(file.path(out_base, "05", "cementos-modelos.png"), {
  m3 <- gamlss(dureza ~ pb(temperatura),
               sigma.formula = ~ pb(temperatura),
               family = NO, data = cementos)
  par(mfrow = c(1, 2))
  term.plot(m3, what = "mu", se = TRUE,
            main = "Efecto de temperatura en mu")
  term.plot(m3, what = "sigma", se = TRUE,
            main = "Efecto de temperatura en sigma")
  par(mfrow = c(1, 1))
})

# =============================================================================
# Modulo 06: PD con efecto aleatorio
# =============================================================================
cat("\n=== Modulo 06 ===\n")

cartera_pd <- read.csv(file.path(data_dir, "cartera_pd.csv"))
cartera_pd$sector <- as.factor(cartera_pd$sector)
cartera_pd$trimestre <- as.factor(cartera_pd$trimestre)

save_png(file.path(out_base, "06", "pd-efecto-aleatorio.png"), {
  m2 <- gamlss(default ~ endeudamiento + ratio_liquidez + antiguedad + random(factor(sector)),
               family = BI, data = cartera_pd)
  plot(m2, xvar = cartera_pd$sector, main = "PD por sector")
})

# 06/multilevel-blups.png — BLUPs por sector y trimestre (efectos cruzados)
# En GAMLSS, random() no soporta ranef(). Extraemos efectos como:
#   b_j = mean(fitted_j) - mean(fitted_overall)  (en escala respuesta)
# Para BI (logit), usamos predict(type='link') y restamos el intercepto.
save_png(file.path(out_base, "06", "multilevel-blups.png"), {
  m_cross <- gamlss(default ~ endeudamiento + ratio_liquidez + antiguedad +
                      random(factor(sector)) + random(factor(trimestre)),
                    family = BI, data = cartera_pd)
  # Efecto por sector: fitted en escala link, menos intercepto
  fitted_link <- predict(m_cross, type = "link")
  overall_mu <- mean(fitted_link)
  re_sector <- tapply(fitted_link, cartera_pd$sector, mean) - overall_mu
  re_trim <- tapply(fitted_link, cartera_pd$trimestre, mean) - overall_mu
  par(mfrow = c(1, 2), mar = c(4.5, 4.5, 3, 1))
  barplot(re_sector, horiz = TRUE, las = 1, col = COL_PRIMARY,
          main = "Efecto por sector", xlab = "Desviacion del logit",
          names.arg = levels(cartera_pd$sector), cex.names = 0.8)
  abline(v = 0, lty = 2, col = COL_MUTED)
  barplot(re_trim, horiz = TRUE, las = 1, col = COL_ACCENT,
          main = "Efecto por trimestre", xlab = "Desviacion del logit",
          names.arg = paste0("T", levels(cartera_pd$trimestre)), cex.names = 0.8)
  abline(v = 0, lty = 2, col = COL_MUTED)
  par(mfrow = c(1, 1))
})

# 06/sigma-re-comparacion.png — Efectos aleatorios en mu y sigma (severidad)
save_png(file.path(out_base, "06", "sigma-re-comparacion.png"), {
  m_sigma <- gamlss(severidad ~ log(monto) + antiguedad + random(factor(sector)),
                    sigma.formula = ~ random(factor(sector)),
                    family = GA, data = severidad)
  # Extraer efectos: desviacion del fitted por sector vs promedio
  fitted_mu <- predict(m_sigma, type = "link")
  fitted_sigma <- predict(m_sigma, what = "sigma", type = "link")
  re_mu <- tapply(fitted_mu, severidad$sector, mean) - mean(fitted_mu)
  re_sigma <- tapply(fitted_sigma, severidad$sector, mean) - mean(fitted_sigma)
  par(mfrow = c(1, 2), mar = c(4.5, 4.5, 3, 1))
  barplot(re_mu, horiz = TRUE, las = 1, col = COL_PRIMARY,
          main = "Efecto en μ", xlab = "Desviacion (log)",
          names.arg = levels(severidad$sector), cex.names = 0.8)
  abline(v = 0, lty = 2, col = COL_MUTED)
  barplot(re_sigma, horiz = TRUE, las = 1, col = COL_ACCENT,
          main = "Efecto en σ", xlab = "Desviacion (log)",
          names.arg = levels(severidad$sector), cex.names = 0.8)
  abline(v = 0, lty = 2, col = COL_MUTED)
  par(mfrow = c(1, 1))
})

# =============================================================================
# Modulo 07: balance sesgo-varianza
# =============================================================================
cat("\n=== Modulo 07 ===\n")

save_png(file.path(out_base, "07", "balance-sesgo-varianza.png"), {
  m <- gamlss(dureza ~ pb(temperatura),
              sigma.formula = ~ pb(temperatura),
              family = NO, data = cementos)
  par(mfrow = c(1, 2))
  term.plot(m, what = "mu", se = TRUE, partial = TRUE,
            main = "Suavizado mu (df ~ 7)")
  term.plot(m, what = "sigma", se = TRUE, partial = TRUE,
            main = "Suavizado sigma (df ~ 5)")
  par(mfrow = c(1, 1))
})

# =============================================================================
# Modulo 09: lotes BEINF
# =============================================================================
cat("\n=== Modulo 09 ===\n")

lotes <- read.csv(file.path(data_dir, "lotes_defectuosos.csv"))
lotes$linea <- as.factor(lotes$linea)

save_png(file.path(out_base, "09", "lotes-beinf.png"), {
  m <- gamlss(proporcion_defectos ~ linea + temperatura + velocidad,
              sigma.formula = ~ linea,
              nu.formula = ~ linea,
              tau.formula = ~ linea,
              family = BEINF, data = lotes)
  plot(m)
})

# =============================================================================
# Modulo 10: BCT vs GB2 vs Gamma
# =============================================================================
cat("\n=== Modulo 10 ===\n")

save_png(file.path(out_base, "10", "bct-gb2-comparacion.png"), {
  fo <- severidad ~ log(monto) + sector + antiguedad
  sigma_fo <- ~ sector
  m_ga  <- gamlss(fo, sigma.formula = sigma_fo, family = GA,  data = severidad)
  m_bct <- gamlss(fo, sigma.formula = sigma_fo, family = BCT, data = severidad)
  par(mfrow = c(1, 2))
  histDist(severidad$severidad, family = GA, main = "Gamma")
  histDist(severidad$severidad, family = BCT, main = "BCT")
  par(mfrow = c(1, 1))
})

# =============================================================================
# Modulo 11: centiles LMS
# =============================================================================
cat("\n=== Modulo 11 ===\n")

# 11/centiles-dbbmi.png
save_png(file.path(out_base, "11", "centiles-dbbmi.png"), {
  m_lms <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                  nu.formula = ~ pb(age), family = BCCG, data = dbbmi)
  centiles(m_lms, xvar = dbbmi$age, cent = c(3, 15, 50, 85, 97),
           main = "Curvas de centiles de IMC (LMS)",
           xlab = "Edad (anos)", ylab = "IMC (kg/m2)")
})

# 11/lms-parametros.png
save_png(file.path(out_base, "11", "lms-parametros.png"), {
  m_lms <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                  nu.formula = ~ pb(age), family = BCCG, data = dbbmi)
  par(mfrow = c(1, 3))
  term.plot(m_lms, what = "mu", se = TRUE, main = "M: mediana del IMC")
  term.plot(m_lms, what = "sigma", se = TRUE, main = "S: coef. de variacion")
  term.plot(m_lms, what = "nu", se = TRUE, main = "L: Box-Cox (asimetria)")
  par(mfrow = c(1, 1))
})

# 11/worm-plot-lms.png
save_png(file.path(out_base, "11", "worm-plot-lms.png"), {
  m_lms <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                  nu.formula = ~ pb(age), family = BCCG, data = dbbmi)
  wp(m_lms, xvar = dbbmi$age, n.inter = 4,
     main = "Worm plots - LMS (BCCG)")
})

# 11/comparacion-lms-lmst.png
save_png(file.path(out_base, "11", "comparacion-lms-lmst.png"), {
  m_lms <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                  nu.formula = ~ pb(age), family = BCCG, data = dbbmi)
  m_lmst <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                   nu.formula = ~ pb(age), tau.formula = ~ pb(age),
                   family = BCT, data = dbbmi)
  par(mfrow = c(1, 2))
  centiles(m_lms, xvar = dbbmi$age, cent = c(3, 15, 50, 85, 97),
           main = "LMS (BCCG)", ylab = "IMC", xlab = "Edad")
  centiles(m_lmst, xvar = dbbmi$age, cent = c(3, 15, 50, 85, 97),
           main = "LMST (BCT)", ylab = "IMC", xlab = "Edad")
  par(mfrow = c(1, 1))
})

# 11/lmst-extension.png
save_png(file.path(out_base, "11", "lmst-extension.png"), {
  m_lmst <- gamlss(bmi ~ pb(age), sigma.formula = ~ pb(age),
                   nu.formula = ~ pb(age), tau.formula = ~ pb(age),
                   family = BCT, data = dbbmi)
  centiles(m_lmst, xvar = dbbmi$age, cent = c(3, 15, 50, 85, 97),
           main = "Curvas de centiles (LMST - BCT)")
})

# 11/centiles-severidad-plot.png
save_png(file.path(out_base, "11", "centiles-severidad-plot.png"), {
  m <- gamlss(severidad ~ pb(log(monto)) + sector,
              sigma.formula = ~ pb(log(monto)) + sector,
              family = BCT, data = severidad)
  newd <- data.frame(monto = seq(20, 500, length = 100), sector = "manufactura")
  mu_hat <- predict(m, newdata = newd, what = "mu", type = "response")
  sigma_hat <- predict(m, newdata = newd, what = "sigma", type = "response")
  nu_hat <- predict(m, newdata = newd, what = "nu", type = "response")
  tau_hat <- predict(m, newdata = newd, what = "tau", type = "response")
  q50 <- qBCT(0.50, mu = mu_hat, sigma = sigma_hat, nu = nu_hat, tau = tau_hat)
  q95 <- qBCT(0.95, mu = mu_hat, sigma = sigma_hat, nu = nu_hat, tau = tau_hat)
  q99 <- qBCT(0.99, mu = mu_hat, sigma = sigma_hat, nu = nu_hat, tau = tau_hat)
  plot(newd$monto, q50, type = "l", lwd = 2.5, col = COL_PRIMARY,
       main = "Centiles de severidad por monto (manufactura)",
       xlab = "Monto asegurado (millones COP)",
       ylab = "Severidad (millones COP)",
       ylim = c(0, max(q99) * 1.1))
  polygon(c(newd$monto, rev(newd$monto)), c(q50, rev(q99)),
          col = adjustcolor(COL_PRIMARY, 0.06), border = NA)
  lines(newd$monto, q95, lwd = 2.5, col = COL_ACCENT)
  lines(newd$monto, q99, lwd = 2.5, col = COL_DANGER)
  legend("topleft", c("P50 (mediana)", "P95", "P99 (cola)"),
         col = c(COL_PRIMARY, COL_ACCENT, COL_DANGER), lwd = 2.5, bty = "n",
         cex = 0.9)
  mtext("La cola P99 se ensancha con el monto: mayor incertidumbre",
        side = 3, line = 0.3, cex = 0.7, col = COL_MUTED)
})

# =============================================================================
# Modulo 12: Weibull censura
# =============================================================================
cat("\n=== Modulo 12 ===\n")

fatiga <- read.csv(file.path(data_dir, "fatiga.csv"))
fatiga$cens <- as.numeric(as.character(fatiga$censura))

save_png(file.path(out_base, "12", "weibull-censura.png"), {
  histDist(fatiga$ciclos, family = WEI3, main = "Weibull - ciclos hasta fallo",
           xlab = "Ciclos")
})

# =============================================================================
# Modulo 13: estacionalidad cy
# =============================================================================
cat("\n=== Modulo 13 ===\n")

demanda <- read.csv(file.path(data_dir, "demanda_skus.csv"))
demanda$semana <- as.numeric(factor(demanda$fecha))
demanda$sku <- as.factor(demanda$sku)
demanda$promocion <- as.factor(demanda$promocion)

# Usar un SKU erratico
sku_data <- demanda[demanda$sku == unique(demanda$sku)[15], ]

save_png(file.path(out_base, "13", "estacionalidad-cy.png"), {
  if (nrow(sku_data) > 0 && var(sku_data$demanda) > 0) {
    m <- gamlss(demanda ~ promocion + cy(semana, cyclic = TRUE),
                sigma.formula = ~ 1, family = NBI, data = sku_data)
    term.plot(m, what = "mu", se = TRUE,
              main = "Efecto estacional en la demanda")
  } else {
    plot.new()
    text(0.5, 0.5, "Datos insuficientes para SKU seleccionado")
  }
})

# =============================================================================
# Modulo 14: PD modelo completo
# =============================================================================
cat("\n=== Modulo 14 ===\n")

save_png(file.path(out_base, "14", "pd-modelo-completo.png"), {
  m3 <- gamlss(default ~ endeudamiento + ratio_liquidez + antiguedad +
                 random(factor(sector)) + random(factor(trimestre)),
               family = BI, data = cartera_pd)
  plot(m3)
})

# =============================================================================
# Modulo 15: LGD BEINF
# =============================================================================
cat("\n=== Modulo 15 ===\n")

rec <- read.csv(file.path(data_dir, "recuperaciones_acc.csv"))
rec$sector <- as.factor(rec$sector)
rec$colateral <- as.factor(rec$colateral)

save_png(file.path(out_base, "15", "lgd-beinf-completo.png"), {
  m <- gamlss(lgd ~ sector + log(monto) + antiguedad + colateral,
              sigma.formula = ~ colateral,
              nu.formula = ~ colateral + sector,
              tau.formula = ~ colateral,
              family = BEINF, data = rec)
  plot(m)
})

# =============================================================================
# Modulo 17: simulacion agregada
# =============================================================================
cat("\n=== Modulo 17 ===\n")

save_png(file.path(out_base, "17", "simulacion-agregada.png"), {
  set.seed(2026)
  n_sim <- 10000
  S_total <- numeric(n_sim)
  freq_mu <- 5.82
  freq_sigma <- 0.6
  freq_nu <- 0.08
  sev_mu <- 48.3
  sev_sigma <- 0.59
  sev_nu <- 1.0
  sev_tau <- 4.82

  for (s in 1:n_sim) {
    N <- rZINBI(1, mu = freq_mu, sigma = freq_sigma, nu = freq_nu)
    if (N == 0) {
      S_total[s] <- 0
    } else {
      severidades <- rBCT(N, mu = sev_mu, sigma = sev_sigma,
                          nu = sev_nu, tau = sev_tau)
      S_total[s] <- sum(severidades)
    }
  }

  hist(S_total, breaks = 50, main = "Perdida agregada - Construccion urbana",
       xlab = "Millones COP", col = "#dbe7f2", border = COL_PRIMARY)
  abline(v = mean(S_total), col = COL_SECONDARY, lwd = 2.5, lty = 2)
  abline(v = quantile(S_total, 0.995), col = COL_DANGER, lwd = 2.5, lty = 2)
  legend("topright", c("E[S] (prima pura)", "VaR 99.5% (capital)"),
         col = c(COL_SECONDARY, COL_DANGER), lwd = 2.5, lty = 2, bty = "n",
         cex = 0.9)
})

cat("\n=== DONE: todos los PNG generados ===\n")
