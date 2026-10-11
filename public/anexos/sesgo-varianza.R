# =============================================================================
# sesgo_varianza.R
# Complemento de simulacion3.R. Reproduce las cifras, tablas y figuras de la
# Sección "Calibración, estimación y el compromiso entre sesgo y varianza"
# del ensayo "El test exacto de Fisher en tablas 2x2 pequeñas: cuándo
# condicionar y qué alternativas considerar".
#
# Orientación (la misma del ensayo):
#   grupo 1 = dosis estándar, x1 = 7 de n1 = 34 sobrevivientes a 24 h
#   grupo 2 = dosis alta,     x2 = 1 de n2 = 34
#   theta = logit(p1) - logit(p2)  (log de la razón de odds, log-OR)
#   Delta = p1 - p2                (diferencia de riesgos, DR)
#
# Todo se obtiene por ENUMERACIÓN EXACTA de las (n1+1)(n2+1) = 1225 tablas
# bajo dos binomiales independientes. No hay Monte Carlo ni semillas.
# Solo usa R base (stats, graphics, grDevices).
#
# Bloques
#   1. Valores p de la tabla observada (Fisher, mid-p, z, Boschloo, Berger-Boos)
#   2. Calibración: tamaño real bajo H0 y versión aleatorizada de Fisher (Tocher)
#   3. Potencia en una región plausible y potencia predictiva (assurance)
#   4. Estimadores de theta y Delta: sesgo, varianza y ECM exactos
#   5. Curva de la corrección aditiva c (ECM en p-hat y ponderado por la posterior)
#   6. Cobertura de IC para theta; IC para Delta y número necesario para dañar
#   7. Exportación: resultados_sesgo_varianza.txt y fig_sv_*.pdf en simulacion/
#
# Uso: directorio de trabajo = carpeta del ensayo o la subcarpeta simulacion/.
# =============================================================================
setwd("C:/www/UNAL/Epidemiologicos/monografia/ensayo/ensayo tecnico/sesgo_varianza")
out_dir <- if (basename(getwd()) == "sesgo_varianza") "." else "sesgo_varianza"
dir.create(out_dir, showWarnings = FALSE)
ruta <- function(f) file.path(out_dir, f)
coma <- function(x, d = 4) formatC(x, format = "f", digits = d, decimal.mark = ",")

x1_obs <- 7; n1 <- 34          # dosis estándar
x2_obs <- 1; n2 <- 34          # dosis alta
alpha    <- 0.05
gamma_BB <- 0.001              # Berger-Boos: 1 - gamma = cobertura del IC del nuisance
REL_TOL  <- 1e-7               # tolerancia de empates de fisher.test
MALLA_P  <- seq(0.0005, 0.9995, by = 0.0005)   # 1999 valores del parámetro nuisance
N  <- n1 + n2
p1o <- x1_obs / n1; p2o <- x2_obs / n2

sink(ruta("resultados_sesgo_varianza.txt"), split = TRUE)
cat("Fecha:", format(Sys.time()), "\n", R.version.string, "\n\n")

## Utilidades -----------------------------------------------------------------
logit <- function(p) log(p / (1 - p))
X1 <- matrix(0:n1, n1 + 1, n2 + 1)
X2 <- matrix(0:n2, n1 + 1, n2 + 1, byrow = TRUE)
M  <- X1 + X2
bmat <- function(p, n) outer(p, 0:n, function(pp, k) dbinom(k, n, pp))
# E_{p1,p2}[F] para todos los pares de dos rejillas: matriz length(p1) x length(p2)
E_surf  <- function(F, p1, p2) bmat(p1, n1) %*% F %*% t(bmat(p2, n2))
E_point <- function(F, p1, p2) sum(outer(dbinom(0:n1, n1, p1), dbinom(0:n2, n2, p2)) * F)

## =============================================================================
## 1. VALORES p
## =============================================================================
pF <- pS <- pM <- matrix(NA_real_, n1 + 1, n2 + 1)   # Fisher, parte estricta, mid-p
for (i in 0:n1) for (j in 0:n2) {
  m <- i + j; sop <- max(0, m - n2):min(n1, m)
  d <- dhyper(sop, n1, n2, m); d0 <- dhyper(i, n1, n2, m)
  pF[i + 1, j + 1] <- min(1, sum(d[d <= d0 * (1 + REL_TOL)]))
  pS[i + 1, j + 1] <- sum(d[d < d0 / (1 + REL_TOL)])
  pM[i + 1, j + 1] <- pS[i + 1, j + 1] + 0.5 * (pF[i + 1, j + 1] - pS[i + 1, j + 1])
}
se0 <- sqrt((M / N) * (1 - M / N) * (1 / n1 + 1 / n2))
Zabs <- ifelse(se0 > 0, abs(X1 / n1 - X2 / n2) / se0, 0)

joint <- function(pset) {             # |pset| x 1225 probabilidades bajo H0
  P <- bmat(pset, n1); Q <- bmat(pset, n2)
  P[, as.vector(X1) + 1] * Q[, as.vector(X2) + 1]
}
J <- joint(MALLA_P)
# p incondicional: sup_p P_p(T >= t); 'ext' mayor = más extremo
p_incond <- function(ext) {
  e <- as.vector(ext); out <- numeric(length(e))
  for (k in seq_along(e)) out[k] <- max(J[, e >= e[k] - 1e-10, drop = FALSE] %*% rep(1, sum(e >= e[k] - 1e-10)))
  matrix(pmin(1, out), n1 + 1, n2 + 1)
}
pZ <- p_incond(Zabs)           # prueba z con varianza combinada (Suissa-Shuster)
pB <- p_incond(-pF)            # Boschloo
pBB <- matrix(NA_real_, n1 + 1, n2 + 1)   # Berger-Boos sobre el ordenamiento de Boschloo
{
  e <- as.vector(-pF)
  for (k in seq_along(e)) {
    m  <- as.vector(M)[k]
    ic <- c(if (m == 0) 0 else qbeta(gamma_BB / 2, m, N - m + 1),
            if (m == N) 1 else qbeta(1 - gamma_BB / 2, m + 1, N - m))
    keep <- MALLA_P >= ic[1] & MALLA_P <= ic[2]
    cola <- e >= e[k] - 1e-10
    pBB[k] <- min(1, max(J[keep, cola, drop = FALSE] %*% rep(1, sum(cola))) + gamma_BB)
  }
}
io <- x1_obs + 1; jo <- x2_obs + 1
tab_p <- data.frame(
  Procedimiento = c("Fisher", "Mid-p", "z (Suissa-Shuster)", "Boschloo",
                    sprintf("Berger-Boos (gamma=%g)", gamma_BB)),
  p = c(pF[io, jo], pM[io, jo], pZ[io, jo], pB[io, jo], pBB[io, jo]))
stopifnot(abs(tab_p$p[1] - fisher.test(matrix(c(7, 27, 1, 33), 2, byrow = TRUE))$p.value) < 1e-8)
cat("== 1. Valores p bilaterales (tabla observada) ==\n"); print(tab_p, digits = 4)

## =============================================================================
## 2. CALIBRACIÓN
## =============================================================================
# Función de decisión phi(x) en [0,1]; Tocher: aleatoriza en la frontera para
# que el tamaño condicional sea exactamente alpha en cada margen no degenerado.
phi <- list(
  Fisher           = 1 * (pF <= alpha),
  `Mid-p`          = 1 * (pM <= alpha),
  `z (S-S)`        = 1 * (pZ <= alpha),
  Boschloo         = 1 * (pB <= alpha),
  `Berger-Boos`    = 1 * (pBB <= alpha),
  `Fisher aleat.`  = ifelse(pF <= alpha, 1,
                      ifelse(pS < alpha, (alpha - pS) / pmax(pF - pS, 1e-300), 0)))
for (k in names(phi)) phi[[k]][M == 0 | M == N] <- 0

tam <- sapply(phi, function(f) diag(E_surf(f, MALLA_P, MALLA_P)))
tab_tam <- data.frame(Procedimiento = names(phi),
                      Tam_max = apply(tam, 2, max), Tam_medio = colMeans(tam),
                      Nivel_no_usado = 1 - apply(tam, 2, max) / alpha)
cat("\n== 2. Tamaño real bajo H0 (malla de 1999 valores) ==\n"); print(tab_tam, digits = 4)
# ¿Cuántas tablas separan a Berger-Boos de Boschloo a alpha = 0.05?
cat("Tablas en que Berger-Boos y Boschloo deciden distinto:",
    sum(phi$`Berger-Boos` != phi$Boschloo), "\n")

## =============================================================================
## 3. POTENCIA
## =============================================================================
g  <- seq(0.0025, 0.9975, by = 0.0025)
reg1 <- g >= 0.15 & g <= 0.35        # p1: dosis estándar
reg2 <- g <= 0.10                    # p2: dosis alta
pot_surf <- lapply(phi, function(f) E_surf(f, g[reg1], g[reg2]))
w1 <- dbeta(g, x1_obs + .5, n1 - x1_obs + .5); w2 <- dbeta(g, x2_obs + .5, n2 - x2_obs + .5)
W  <- outer(w1, w2); W <- W / sum(W)            # posterior de Jeffreys sobre la rejilla
asur <- sapply(phi, function(f) sum(E_surf(f, g, g) * W))
tab_pot <- data.frame(Procedimiento = names(phi),
                      Pot_region = sapply(pot_surf, mean),
                      Pot_predictiva = asur)
cat("\n== 3. Potencia media en la región p1 en [0,15; 0,35], p2 <= 0,10 y potencia predictiva ==\n")
print(tab_pot, digits = 4)

## =============================================================================
## 4. ESTIMADORES: SESGO, VARIANZA, ECM
## =============================================================================
A <- X1; B <- n1 - X1; C <- X2; D <- n2 - X2
add_c <- function(cv) log((A + cv) * (D + cv) / ((B + cv) * (C + cv)))
est_theta <- list(
  `c = 1/3`              = add_c(1/3),
  `c = 1/2 (Haldane; Firth)` = add_c(1/2),
  `c = 1`                = add_c(1),
  `Media post. Jeffreys` = (digamma(A + .5) - digamma(B + .5)) - (digamma(C + .5) - digamma(D + .5)))
est_delta <- list(
  `EMV (p1-p2)`          = A / n1 - C / n2,
  `Agresti-Caffo`        = (A + 1) / (n1 + 2) - (C + 1) / (n2 + 2),
  `Media post. Jeffreys` = (A + .5) / (n1 + 1) - (C + .5) / (n2 + 1))

svm_point <- function(E, verd, p1, p2) {
  m1 <- E_point(E, p1, p2); m2 <- E_point(E^2, p1, p2)
  c(Sesgo = m1 - verd, Var = m2 - m1^2, ECM = (m1 - verd)^2 + m2 - m1^2)
}
ecm_post <- function(E, verd_fun) {
  m1 <- E_surf(E, g, g); m2 <- E_surf(E^2, g, g)
  sum(((m1 - verd_fun)^2 + m2 - m1^2) * W)
}
TH <- outer(logit(g), logit(g), "-"); DL <- outer(g, g, "-")

obs <- c(EMV = log(7 * 33 / (27 * 1)),
         EMVC = log(unname(fisher.test(matrix(c(7, 27, 1, 33), 2, byrow = TRUE))$estimate)),
         sapply(est_theta, function(E) E[io, jo]))
cat("\n== 4a. Estimaciones de la razón de odds en la tabla observada ==\n"); print(round(exp(obs), 3))

tab_theta <- data.frame(Estimador = names(est_theta),
  t(sapply(est_theta, svm_point, verd = logit(p1o) - logit(p2o), p1 = p1o, p2 = p2o)),
  ECM_post = sapply(est_theta, ecm_post, verd_fun = TH))
tab_delta <- data.frame(Estimador = names(est_delta),
  t(sapply(est_delta, svm_point, verd = p1o - p2o, p1 = p1o, p2 = p2o)),
  ECM_post = sapply(est_delta, ecm_post, verd_fun = DL))
P_inf <- E_point(1 * (A == 0 | B == 0 | C == 0 | D == 0), p1o, p2o)
cat("\n== 4b. log-OR: sesgo, varianza y ECM en p-hat; ECM ponderado por la posterior ==\n")
print(tab_theta, digits = 4)
cat("P(EMV del log-OR no finito) en p-hat:", coma(P_inf), "\n")
cat("\n== 4c. Diferencia de riesgos ==\n"); print(tab_delta, digits = 4)

## =============================================================================
## 5. CURVA DE LA CORRECCIÓN ADITIVA c
## =============================================================================
c_grid <- seq(0.05, 2, by = 0.05)
curva <- t(sapply(c_grid, function(cv) {
  E <- add_c(cv)
  c(svm_point(E, logit(p1o) - logit(p2o), p1o, p2o), ECM_post = ecm_post(E, TH))
}))
curva <- data.frame(c = c_grid, curva)
c_hat  <- curva$c[which.min(curva$ECM)]
c_post <- curva$c[which.min(curva$ECM_post)]
cat("\n== 5. c que minimiza el ECM: en p-hat =", c_hat, "; ponderado por la posterior =", c_post, "\n")
cat("ECM en p-hat para c = 0,5 y c óptimo:", coma(curva$ECM[curva$c == 0.5]), coma(min(curva$ECM)), "\n")
cat("ECM posterior para c = 0,5 y c óptimo:", coma(curva$ECM_post[curva$c == 0.5]), coma(min(curva$ECM_post)), "\n")

## =============================================================================
## 6. INTERVALOS
## =============================================================================
z <- qnorm(1 - alpha / 2)
wc <- add_c(.5); wse <- sqrt(1 / (A + .5) + 1 / (B + .5) + 1 / (C + .5) + 1 / (D + .5))
ic_woolf <- list(lo = wc - z * wse, hi = wc + z * wse)
lo <- hi <- matrix(NA_real_, n1 + 1, n2 + 1)
for (i in 0:n1) for (j in 0:n2) {
  ci <- suppressWarnings(fisher.test(matrix(c(i, n1 - i, j, n2 - j), 2, byrow = TRUE))$conf.int)
  lo[i + 1, j + 1] <- log(ci[1]); hi[i + 1, j + 1] <- log(ci[2])
}
ic_cond <- list(lo = lo, hi = hi)
cobertura <- function(ic, p1, p2) {
  th <- logit(p1) - logit(p2); E_point(1 * (ic$lo <= th & ic$hi >= th), p1, p2)
}
pc <- seq(0.02, 0.50, by = 0.02)
cov_W <- outer(pc, pc, Vectorize(function(a, b) cobertura(ic_woolf, a, b)))
cov_C <- outer(pc, pc, Vectorize(function(a, b) cobertura(ic_cond, a, b)))
tab_cov <- data.frame(IC = c("Woolf-Haldane", "Exacto condicional"),
  Cob_min = c(min(cov_W), min(cov_C)), Cob_media = c(mean(cov_W), mean(cov_C)),
  Cob_post = NA_real_,                                                  # se rellena abajo
  P_long_inf = c(0, E_point(1 * is.infinite(hi - lo), p1o, p2o)))
gc <- seq(0.01, 0.6, by = 0.01)
Wc <- outer(dbeta(gc, 7.5, 27.5), dbeta(gc, 1.5, 33.5)); Wc <- Wc / sum(Wc)
tab_cov$Cob_post <- c(sum(outer(gc, gc, Vectorize(function(a, b) cobertura(ic_woolf, a, b))) * Wc),
                      sum(outer(gc, gc, Vectorize(function(a, b) cobertura(ic_cond, a, b))) * Wc))
cat("\n== 6a. Cobertura de IC al 95 % para theta (rejilla 0,02-0,50) ==\n"); print(tab_cov, digits = 4)
cat("Longitud esperada de Woolf-Haldane en p-hat:", coma(E_point(ic_woolf$hi - ic_woolf$lo, p1o, p2o), 2), "\n")

# IC para Delta en la tabla observada
ac_p1 <- (x1_obs + 1) / (n1 + 2); ac_p2 <- (x2_obs + 1) / (n2 + 2)
ac <- (ac_p1 - ac_p2) + c(-1, 1) * z * sqrt(ac_p1 * (1 - ac_p1) / (n1 + 2) + ac_p2 * (1 - ac_p2) / (n2 + 2))
wilson <- function(x, n) { p <- x / n
  (p + z^2 / (2 * n) + c(-1, 1) * z * sqrt(p * (1 - p) / n + z^2 / (4 * n^2))) / (1 + z^2 / n) }
l1 <- wilson(x1_obs, n1); l2 <- wilson(x2_obs, n2); d <- p1o - p2o
nw <- c(d - sqrt((p1o - l1[1])^2 + (l2[2] - p2o)^2), d + sqrt((l1[2] - p1o)^2 + (p2o - l2[1])^2))
cat("\n== 6b. Diferencia de riesgos observada:", coma(d, 3), "\n")
cat("IC 95% Agresti-Caffo: [", coma(ac[1], 3), ";", coma(ac[2], 3), "]\n")
cat("IC 95% Newcombe (Wilson híbrido): [", coma(nw[1], 3), ";", coma(nw[2], 3), "]\n")
cat("NND = 1/DR =", coma(1 / d, 1), "; a partir de Newcombe: [", coma(1 / nw[2], 1), ";", coma(1 / nw[1], 1), "]\n")

## =============================================================================
## 7. FIGURAS (mismo estilo que simulacion3.R)
## =============================================================================
col_v <- c(ses = "#b2182b", var = "#2166ac", ecm = "black")
cairo_pdf(ruta("fig_sv_correccion.pdf"), width = 4.2, height = 2.6, family = "serif")
par(mar = c(2.6, 3.4, 0.6, 0.4), mgp = c(1.5, 0.4, 0), tcl = -0.25, cex = 0.62, las = 1)
plot(curva$c, curva$ECM, type = "n", ylim = c(0, 2.2), xlab = expression("Corrección aditiva " * italic(c)),
     ylab = "")
title(ylab = expression("Sesgo"^2 * ", varianza y ECM"), line = 2.3)
lines(curva$c, curva$Sesgo^2, col = col_v["ses"], lwd = 1.4)
lines(curva$c, curva$Var, col = col_v["var"], lwd = 1.4)
lines(curva$c, curva$ECM, col = col_v["ecm"], lwd = 1.8)
lines(curva$c, curva$ECM_post, col = col_v["ecm"], lwd = 1.4, lty = 2)
abline(v = 0.5, col = "grey60", lty = 3)
legend("topright", bty = "n", cex = 0.95,
       legend = c(expression("Sesgo"^2 * " en " * hat(p)), expression("Varianza en " * hat(p)),
                  expression("ECM en " * hat(p)), "ECM ponderado por la posterior"),
       col = col_v[c("ses", "var", "ecm", "ecm")], lty = c(1, 1, 1, 2), lwd = c(1.4, 1.4, 1.8, 1.4))
dev.off()

# Cobertura en dos cortes que pasan por el escenario de referencia (0,20; 0,03)
corte <- seq(0.005, 0.5, by = 0.005)
cv <- function(ic, a, b) mapply(function(u, v) cobertura(ic, u, v), a, b)
c_izq <- cbind(cv(ic_woolf, 0.20, corte), cv(ic_cond, 0.20, corte))   # p1 = 0,20 fijo
c_der <- cbind(cv(ic_woolf, corte, 0.03), cv(ic_cond, corte, 0.03))   # p2 = 0,03 fijo
cairo_pdf(ruta("fig_sv_cobertura.pdf"), width = 4.2, height = 2.0, family = "serif")
par(mfrow = c(1, 2), mar = c(2.6, 3.4, 1.4, 0.4), mgp = c(1.5, 0.4, 0), tcl = -0.25, cex = 0.62, las = 1)
for (k in list(list(c_izq, expression(p[2]), expression(p[1] == "0,20")),
               list(c_der, expression(p[1]), expression(p[2] == "0,03")))) {
  matplot(corte, k[[1]], type = "l", lty = 1, lwd = c(1.3, 1.3), col = c("#b2182b", "#2166ac"),
          ylim = c(0.85, 1), xlab = k[[2]], ylab = "", main = k[[3]])
  title(ylab = "Cobertura", line = 2.3)
  abline(h = 0.95, lty = 3)
}
legend("bottomright", c("Woolf (c = 1/2)", "Exacto condicional"), col = c("#b2182b", "#2166ac"),
       lty = 1, bty = "n", cex = 0.9)
dev.off()
cat("Cobertura mínima en los cortes (Woolf, exacto):", coma(min(c(c_izq[,1], c_der[,1]))),
    coma(min(c(c_izq[,2], c_der[,2]))), "\n")
cat("Cobertura en (0,20; 0,03) y en (0,20; 0,01), Woolf:", coma(cobertura(ic_woolf, .20, .03)),
    coma(cobertura(ic_woolf, .20, .01)), "; exacto:", coma(cobertura(ic_cond, .20, .03)), "\n")

sink()
cat("Listo:", normalizePath(out_dir), "\n")

