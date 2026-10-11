# =============================================================================
# simulacion3.R
# Reproduce todas las cifras, tablas y figuras del ensayo
# "El test exacto de Fisher en tablas 2x2 pequeñas: cuándo condicionar y qué
#  alternativas considerar".
#
# Todo se obtiene por ENUMERACIÓN EXACTA de las tablas posibles bajo el modelo
# de dos binomiales independientes; no hay simulación Monte Carlo ni semillas.
# (Las versiones anteriores de este archivo usaban réplicas aleatorias y
#  entregaban a Exact::exact.test la tabla con los grupos en columnas; ambas
#  cosas quedaron corregidas aquí.)
#
# Secciones del ensayo que reproduce cada bloque:
#   1. Tabla 2 (Perondi) y detalles de cálculo ............... Sección 4
#   2. Enumeración n1 = n2 = 34: potencia, tamaño, Tabla 3 ..... Sección 4.1
#   3. Figura 1 (mapa de decisiones Fisher/Boschloo) ........... Sección 4.1
#   4. Figura 2 (discordancia en función de n) ................. Sección 4.1
#   5. Figura 3 y Tabla 4 (superficie de potencia) ............. Sección 4.2
#   6. Figura 4 (tamaño bajo H0) y rangos de tamaño ............ Sección 4.2
#   7. Prueba z con varianza combinada (Suissa--Shuster) ....... Sección 4.2
#   8. Definición bilateral en diseños desbalanceados .......... Sección 4.3
#   9. Tamaño equivalente para la discusión ética .............. Sección 6.4
#  10. Equivalencia bayesiana de Altham (1969) .................. Sección 4
#
# Uso: directorio de trabajo = carpeta del ensayo (la que contiene
#      test_exacto_fisher.tex) o la subcarpeta simulacion/.
#      El bloque 2 calcula Barnard--CSM con Exact en las 1225 tablas y tarda
#      varios minutos; el resultado se guarda en enumeracion_n34.rds y se
#      reutiliza en ejecuciones posteriores.
#
# Paquetes: exact2x2 (>= 1.7.0), Exact (>= 3.3), ggplot2, scales.
# Salidas (en simulacion/): resultados_simulacion3.txt, resultados_simulacion3.rds,
#   discordancia_vs_n.csv, superficie_resumen.csv, tamano_vs_n.csv,
#   fig_discordancia_heatmap.pdf, fig_discordancia_vs_n.pdf,
#   fig_superficie_potencia.pdf, fig_error_tipo1.pdf
# =============================================================================

suppressPackageStartupMessages({
  library(exact2x2)
  library(Exact)
  library(ggplot2)
})
setwd("C:/www/UNAL/Epidemiologicos/monografia/ensayo/ensayo tecnico/sesgo_varianza")
out_dir <- if (basename(getwd()) == "sesgo_varianza") "." else "sesgo_varianza"
dir.create(out_dir, showWarnings = FALSE)
ruta <- function(f) file.path(out_dir, f)

alpha   <- 0.05
REL_TOL <- 1e-7                        # misma tolerancia de empates que fisher.test
MALLA_P <- seq(0, 1, length.out = 10001)   # malla del parámetro de estorbo
MALLA_H0 <- seq(0.0005, 0.9995, by = 0.0005) # 1999 valores para el tamaño bajo H0
# Exact >= 3.0 usa por defecto los ordenamientos CSM precalculados del paquete
# ExactData; si no está instalado, se calculan (mismo resultado, más lento).
CSM_ALMACENADO <- requireNamespace("ExactData", quietly = TRUE)
coma <- function(x, d = 4) formatC(x, format = "f", digits = d, decimal.mark = ",")

sink(ruta("resultados_simulacion3.txt"), split = TRUE)
cat("Fecha:", format(Sys.time()), "\n")
cat(R.version.string, "| exact2x2", as.character(packageVersion("exact2x2")),
    "| Exact", as.character(packageVersion("Exact")), "\n\n")

# -----------------------------------------------------------------------------
# Funciones de enumeración exacta
# -----------------------------------------------------------------------------
# Todas las tablas posibles, con x1 variando más rápido (igual que expand.grid)
tablas <- function(n1, n2) expand.grid(x1 = 0:n1, x2 = 0:n2)

# Tabla con los GRUPOS EN FILAS, como exige Exact::exact.test (cond.row = TRUE)
tab_ok <- function(a, n1, b, n2) rbind(c(a, n1 - a), c(b, n2 - b))

# Valor p bilateral de Fisher para todas las tablas.
#   minlike: suma de las probabilidades no mayores que la observada (fisher.test)
#   central: el doble de la cola menor
fisher_p <- function(n1, n2, tsmethod = c("minlike", "central")) {
  tsmethod <- match.arg(tsmethod)
  g <- tablas(n1, n2)
  p <- numeric(nrow(g))
  for (k in seq_len(nrow(g))) {
    a <- g$x1[k]; m <- g$x1[k] + g$x2[k]
    sop <- max(0, m - n2):min(n1, m)
    pr  <- dhyper(sop, n1, n2, m)
    pob <- dhyper(a, n1, n2, m)
    p[k] <- if (tsmethod == "minlike") sum(pr[pr <= pob * (1 + REL_TOL)])
            else 2 * min(sum(pr[sop <= a]), sum(pr[sop >= a]))
  }
  pmin(p, 1)
}

# Valores p unilaterales de Fisher: cola inferior y superior de X1 dado el margen
fisher_colas <- function(n1, n2) {
  g <- tablas(n1, n2); m <- g$x1 + g$x2
  list(inferior = phyper(g$x1, n1, n2, m),
       superior = phyper(g$x1 - 1, n1, n2, m, lower.tail = FALSE))
}

# |z| con varianza combinada (Suissa--Shuster); 0 cuando la varianza es nula
z_pooled <- function(n1, n2) {
  g <- tablas(n1, n2)
  pb <- (g$x1 + g$x2) / (n1 + n2)
  se <- sqrt(pb * (1 - pb) * (1 / n1 + 1 / n2))
  z <- ifelse(se > 0, (g$x1 / n1 - g$x2 / n2) / se, 0)
  abs(z)
}

# Valor p incondicional: máximo sobre la malla de p de P_p(T tan o más extremo).
#   menor = TRUE  -> valores pequeños del estadístico son más extremos (p de Fisher)
#   menor = FALSE -> valores grandes son más extremos (|z|)
p_incondicional <- function(stat, n1, n2, menor = TRUE, malla = MALLA_P) {
  g  <- tablas(n1, n2)
  s  <- if (menor) stat else -stat
  o  <- order(s)
  ss <- s[o]
  B1 <- sapply(malla, function(p) dbinom(0:n1, n1, p))   # (n1+1) x malla
  B2 <- sapply(malla, function(p) dbinom(0:n2, n2, p))
  acum <- numeric(length(malla))
  pv_o <- numeric(length(ss))
  i <- 1
  while (i <= length(ss)) {
    j <- i
    lim <- ss[i] + REL_TOL * max(abs(ss[i]), 1e-300)
    while (j < length(ss) && ss[j + 1] <= lim) j <- j + 1
    for (k in o[i:j]) acum <- acum + B1[g$x1[k] + 1, ] * B2[g$x2[k] + 1, ]
    pv_o[i:j] <- max(acum)
    i <- j + 1
  }
  pv <- numeric(length(ss)); pv[o] <- pv_o
  pmin(pv, 1)
}

# Valores p y regiones de rechazo de los procedimientos del ensayo
regiones <- function(n1, n2, con_central = FALSE, con_z = FALSE) {
  P <- list(fisher = fisher_p(n1, n2, "minlike"))
  P$boschloo <- p_incondicional(P$fisher, n1, n2, TRUE)
  if (con_central) {
    # Boschloo "central", como en exact2x2::boschloo(tsmethod = "central"):
    # el doble del menor de los dos valores p unilaterales de Boschloo, cada uno
    # ordenado por el valor p unilateral de Fisher correspondiente.
    P$fisher_central <- fisher_p(n1, n2, "central")
    colas <- fisher_colas(n1, n2)
    b_inf <- p_incondicional(colas$inferior, n1, n2, TRUE)
    b_sup <- p_incondicional(colas$superior, n1, n2, TRUE)
    P$boschloo_central <- pmin(1, 2 * pmin(b_inf, b_sup))
  }
  if (con_z) P$z <- p_incondicional(z_pooled(n1, n2), n1, n2, FALSE)
  R <- lapply(P, function(p) p <= alpha * (1 + REL_TOL))
  list(n1 = n1, n2 = n2, P = P, R = R)
}

# Potencia exacta: matriz length(p1) x length(p2)
potencia <- function(R, n1, n2, p1, p2) {
  B1 <- outer(p1, 0:n1, function(p, x) dbinom(x, n1, p))
  B2 <- outer(p2, 0:n2, function(p, x) dbinom(x, n2, p))
  B1 %*% matrix(as.numeric(R), n1 + 1, n2 + 1) %*% t(B2)
}
pot1 <- function(R, n1, n2, p1, p2) as.numeric(potencia(R, n1, n2, p1, p2))

# Probabilidad de rechazo bajo H0: p1 = p2 = p, para cada p de la malla
rechazo_h0 <- function(R, n1, n2, malla = MALLA_H0) {
  g <- tablas(n1, n2)
  sapply(malla, function(p) sum((dbinom(g$x1, n1, p) * dbinom(g$x2, n2, p))[R]))
}

# =============================================================================
cat("== 1. Tabla observada de Perondi et al. (2004): 7/34 frente a 1/34 ==\n")
# =============================================================================
n1 <- 34; n2 <- 34; p1 <- 0.20; p2 <- 0.03
T0 <- tab_ok(7, n1, 1, n2)
cat("Fisher bilateral                 :", coma(fisher.test(T0)$p.value), "\n")
cat("Boschloo minlike (exact2x2)      :", coma(boschloo(7, n1, 1, n2, tsmethod = "minlike")$p.value), "\n")
cat("Boschloo central (exact2x2)      :", coma(boschloo(7, n1, 1, n2, tsmethod = "central")$p.value), "\n")
cat("Boschloo minlike, nPgrid = 2000  :", coma(boschloo(7, n1, 1, n2, tsmethod = "minlike",
                                                     control = ucControl(nPgrid = 2000))$p.value), "\n")
cat("Boschloo (Exact)                 :", coma(exact.test(T0, method = "boschloo", to.plot = FALSE)$p.value, 5), "\n")
cat("Barnard--CSM (Exact)             :", coma(exact.test(T0, method = "csm", to.plot = FALSE,
                      useStoredCSM = CSM_ALMACENADO)$p.value), "\n")
cat("z combinado (Exact)              :", coma(exact.test(T0, method = "z-pooled", to.plot = FALSE)$p.value), "\n")
cat("z no combinado (Exact)           :", coma(exact.test(T0, method = "z-unpooled", to.plot = FALSE)$p.value), "\n")
cat("CSM con la tabla TRANSPUESTA     :", coma(exact.test(t(T0), method = "csm", to.plot = FALSE,
                      useStoredCSM = CSM_ALMACENADO)$p.value),
    "  <- responde a otra pregunta\n")

# Cola de Boschloo como función del parámetro de estorbo: tres máximos locales
pf34 <- fisher_p(n1, n2)
g34  <- tablas(n1, n2)
t_obs <- pf34[g34$x1 == 7 & g34$x2 == 1]
en_cola <- pf34 <= t_obs * (1 + REL_TOL)
cola <- sapply(MALLA_P, function(p) sum((dbinom(g34$x1, n1, p) * dbinom(g34$x2, n2, p))[en_cola]))
loc <- which(diff(sign(diff(cola))) == -2) + 1
cat("M\u00e1ximos locales de la cola de Boschloo:\n")
print(data.frame(p = round(MALLA_P[loc], 3), cola = round(cola[loc], 4)))
cat("M\u00e1ximo global:", coma(max(cola)), "en p =", MALLA_P[which.max(cola)], "\n")

d_riesgo <- 7 / 34 - 1 / 34
cat(sprintf("Diferencia de riesgos %.3f | raz\u00f3n de riesgos %.1f | raz\u00f3n de odds %.2f\n\n",
            d_riesgo, (7 / 34) / (1 / 34), (7 / 27) / (1 / 33)))

# =============================================================================
cat("== 2. Enumeraci\u00f3n de las 1225 tablas (n1 = n2 = 34) ==\n")
# =============================================================================
cache <- ruta("enumeracion_n34.rds")
if (file.exists(cache)) {
  g <- readRDS(cache)
  cat("(se reutiliza", cache, ")\n")
} else {
  g <- tablas(n1, n2)
  g$p_fisher <- g$p_boschloo <- g$p_csm <- NA_real_
  t0 <- Sys.time()
  for (i in seq_len(nrow(g))) {
    a <- g$x1[i]; b <- g$x2[i]; T <- tab_ok(a, n1, b, n2)
    g$p_fisher[i]   <- fisher.test(T)$p.value
    g$p_boschloo[i] <- boschloo(a, n1, b, n2, tsmethod = "minlike")$p.value
    g$p_csm[i]      <- tryCatch(exact.test(T, method = "csm", to.plot = FALSE,
                      useStoredCSM = CSM_ALMACENADO)$p.value,
                                error = function(e) NA_real_)
    if (i %% 100 == 0) message(i, "/", nrow(g), "  ",
                               round(difftime(Sys.time(), t0, units = "mins"), 1), " min")
  }
  saveRDS(g, cache)
}
cat("Tablas con p_csm NA:", sum(is.na(g$p_csm)), "\n")
F <- g$p_fisher <= alpha; B <- g$p_boschloo <= alpha; C <- g$p_csm <= alpha
w <- dbinom(g$x1, n1, p1) * dbinom(g$x2, n2, p2)

cat("\nProbabilidad exacta de rechazo bajo p1 = 0,20, p2 = 0,03:\n")
cat("  Fisher  :", coma(sum(w[F])), "\n  Boschloo:", coma(sum(w[B])), "\n  CSM     :", coma(sum(w[C])), "\n")
cat("  (control) Exact::power.exact.test, CSM:",
    coma(power.exact.test(p1 = p1, p2 = p2, n1 = n1, n2 = n2, alpha = alpha, method = "csm",
                           useStoredCSM = CSM_ALMACENADO)$power), "\n")

disc <- function(X, Y, nx, ny) {
  data.frame(comparacion = paste(nx, "vs.", ny),
             tablas = sum(X != Y), probabilidad = sum(w[X != Y]),
             solo_primero = sum(X & !Y), solo_segundo = sum(!X & Y))
}
tab3 <- rbind(disc(F, B, "Fisher", "Boschloo"), disc(F, C, "Fisher", "Barnard-CSM"),
              disc(B, C, "Boschloo", "Barnard-CSM"))
cat("\nTabla 3. Discordancia exacta entre procedimientos:\n"); print(tab3, digits = 4)
cat("Diferencias de potencia (iguales a la discordancia si las regiones est\u00e1n anidadas):\n")
cat("  Boschloo - Fisher:", coma(sum(w[B]) - sum(w[F])), "\n  CSM - Fisher     :", coma(sum(w[C]) - sum(w[F])), "\n")

size34 <- sapply(MALLA_H0, function(pp) {
  pr <- dbinom(g$x1, n1, pp) * dbinom(g$x2, n2, pp)
  c(Fisher = sum(pr[F]), Boschloo = sum(pr[B]), CSM = sum(pr[C]))
})
cat("\nTama\u00f1o m\u00e1ximo bajo H0 (malla de 1999 valores de p):\n")
for (k in rownames(size34)) cat("  ", k, ":", coma(max(size34[k, ])), "en p =", MALLA_H0[which.max(size34[k, ])], "\n")

# Control de la implementación propia frente a exact2x2
reg34 <- regiones(n1, n2, con_central = TRUE, con_z = TRUE)
# Nota: en algunas tablas exact2x2 no trata como empatadas tablas cuyo valor p
# de Fisher es idéntico en aritmética exacta pero difiere en el último decimal
# de coma flotante (p. ej., 21/34 frente a 12/34 y su versión con éxitos y
# fracasos intercambiados). La implementación propia usa una tolerancia
# relativa de 1e-7, como fisher.test. La diferencia no cambia ninguna decisión.
dif <- abs(reg34$P$boschloo - g$p_boschloo)
cat("\nControl: decisiones distintas Boschloo propio vs. exact2x2 =", sum(reg34$R$boschloo != B),
    "| m\u00e1x |dif| en tablas con p < 0,2 =", signif(max(dif[g$p_boschloo < 0.2]), 3),
    "| en la tabla observada =", signif(dif[g$x1 == 7 & g$x2 == 1], 3), "\n")
cat("Control: m\u00e1x |Fisher propio - fisher.test| =",
    signif(max(abs(reg34$P$fisher - g$p_fisher)), 3), "\n\n")

# =============================================================================
cat("== 3. Figura 1: mapa de decisiones Fisher/Boschloo ==\n")
# =============================================================================
etiquetas <- c(ninguno = "Ambos no rechazan", ambos = "Ambos rechazan",
               solo_B = "Fisher no / Boschloo s\u00ed", solo_F = "Fisher s\u00ed / Boschloo no")
g$estado <- factor(ifelse(!F & B, "solo_B", ifelse(F & !B, "solo_F",
                   ifelse(F & B, "ambos", "ninguno"))),
                   levels = names(etiquetas))
fig1 <- ggplot(g, aes(x = x2, y = x1, fill = estado)) +
  geom_tile() +
  scale_fill_manual(values = c(ninguno = "gray92", ambos = "#4C72B0",
                               solo_B = "#DD8452", solo_F = "#C44E52"),
                    labels = etiquetas, drop = FALSE) +
  coord_equal() +
  labs(title = "Mapa de discordancia Fisher vs. Boschloo en la grilla de tablas",
       subtitle = paste0("x\u2081 = sobrevivientes en dosis est\u00e1ndar, ",
                         "x\u2082 = sobrevivientes en dosis alta (n = 34 cada grupo)"),
       x = "x\u2082 (dosis alta)", y = "x\u2081 (dosis est\u00e1ndar)", fill = NULL,
       caption = paste0("Cada celda corresponde a una tabla 2\u00d72 posible. La franja naranja\n",
                        "son tablas donde Fisher no rechaza pero Boschloo s\u00ed.")) +
  theme_minimal(base_size = 11) +
  theme(legend.position = "right", plot.caption = element_text(hjust = 0, size = 9, color = "gray40"))
ggsave(ruta("fig_discordancia_heatmap.pdf"), fig1, width = 7.5, height = 6, device = cairo_pdf)
cat("Tabla observada (7, 1):", etiquetas[as.character(g$estado[g$x1 == 7 & g$x2 == 1])], "\n\n")

# =============================================================================
cat("== 4. Figura 2: discordancia Fisher/Boschloo en funci\u00f3n de n ==\n")
# =============================================================================
REG <- list()                       # regiones para todos los n balanceados 10..60
for (n in 10:60) REG[[as.character(n)]] <- regiones(n, n)
res_n <- do.call(rbind, lapply(10:60, function(n) {
  r <- REG[[as.character(n)]]; RF <- r$R$fisher; RB <- r$R$boschloo
  data.frame(n = n,
             discordancia = pot1(RB & !RF, n, n, p1, p2) + pot1(RF & !RB, n, n, p1, p2),
             fisher_si_bosch_no = sum(RF & !RB), bosch_si_fisher_no = sum(RB & !RF),
             pot_fisher = pot1(RF, n, n, p1, p2), pot_boschloo = pot1(RB, n, n, p1, p2))
}))
write.csv(res_n, ruta("discordancia_vs_n.csv"), row.names = FALSE)
cat("Discordancia en los tama\u00f1os citados en el texto:\n")
print(res_n[res_n$n %in% c(15, 20, 30, 34, 60), c("n", "discordancia")], digits = 3, row.names = FALSE)
cat("Tablas rechazadas por Fisher y no por Boschloo, n = 10..60:", sum(res_n$fisher_si_bosch_no), "\n")

n_fig2 <- c(15, 20, 25, 30, 34, 40, 50, 60)
d2 <- res_n[res_n$n %in% n_fig2, ]
naranja <- "#DD8452"
cairo_pdf(ruta("fig_discordancia_vs_n.pdf"), width = 6.2, height = 3.6, family = "serif")
par(mar = c(3.2, 3.6, 2.6, 0.8), mgp = c(2.2, 0.5, 0), tcl = -0.3, las = 1, cex = 0.9)
plot(d2$n, 100 * d2$discordancia, type = "n", xlim = c(13, 62), ylim = c(0, 16),
     xaxs = "i", yaxs = "i", axes = FALSE, xlab = "Tama\u00f1o por grupo (n)",
     ylab = "Decisiones opuestas (%)")
abline(h = seq(2, 16, 2), col = "gray90", lwd = 0.6)
lines(d2$n, 100 * d2$discordancia, col = naranja, lwd = 2)
points(d2$n, 100 * d2$discordancia, pch = 21, bg = naranja, col = "white", cex = 1.1)
debajo <- d2$n %in% c(20, 34)           # etiquetas bajo el punto donde la curva sube
text(d2$n, 100 * d2$discordancia + ifelse(debajo, -0.9, 0.9),
     paste0(formatC(100 * d2$discordancia, format = "f", digits = 1, decimal.mark = ","), " %"),
     cex = 0.72, col = "gray15")
text(34, 100 * d2$discordancia[d2$n == 34] - 2, "Perondi", font = 3, cex = 0.72, col = "gray40")
axis(1, at = n_fig2, col = "gray40", col.axis = "gray30")
axis(2, at = seq(0, 16, 2), col = "gray40", col.axis = "gray30")
box(bty = "l", col = "gray40")
mtext("Discordancia Fisher vs. Boschloo (enumeraci\u00f3n exacta)", side = 3, line = 1.3, adj = 0, cex = 0.95)
mtext(expression(italic(p)[1] == "0,20" * "," ~~ italic(p)[2] == "0,03" * "," ~~ alpha == "0,05"),
      side = 3, line = 0.2, adj = 0, cex = 0.95)
invisible(dev.off())
cat("\n")

# =============================================================================
cat("== 5. Figura 3 y Tabla 4: superficie de potencia Boschloo - Fisher ==\n")
# =============================================================================
rej <- round(seq(0.01, 0.60, by = 0.01), 2)
sup <- lower.tri(matrix(0, length(rej), length(rej)))   # p1 (filas) > p2 (columnas)
n_sup <- c(15, 25, 34, 50)
SUP <- lapply(n_sup, function(n) {
  r <- REG[[as.character(n)]]
  list(F = potencia(r$R$fisher, n, n, rej, rej), B = potencia(r$R$boschloo, n, n, rej, rej))
})
names(SUP) <- n_sup
tab4 <- do.call(rbind, lapply(n_sup, function(n) {
  s <- SUP[[as.character(n)]]; G <- (s$B - s$F)[sup]; f <- s$F[sup]
  zona <- f >= 0.2 & f <= 0.8
  im <- which.max(G)
  data.frame(n = n, mediana = 100 * median(G[zona]),
             p10 = 100 * quantile(G[zona], 0.1), p90 = 100 * quantile(G[zona], 0.9),
             ge5 = 100 * mean(G[zona] >= 0.05), maximo = 100 * max(G),
             p1_max = row(s$F)[sup][im] / 100, p2_max = col(s$F)[sup][im] / 100,
             min_ganancia = 100 * min(G),
             tam_max_fisher = max(rechazo_h0(REG[[as.character(n)]]$R$fisher, n, n)))
}))
rownames(tab4) <- NULL
write.csv(tab4, ruta("superficie_resumen.csv"), row.names = FALSE)
cat("Tabla 4 (ganancia en puntos porcentuales; zona informativa = potencia de Fisher en [0,2; 0,8]):\n")
print(tab4, digits = 3)

azules <- colorRampPalette(c("#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"))(100)
vmax <- 22
cairo_pdf(ruta("fig_superficie_potencia.pdf"), width = 4.2, height = 4.1, family = "serif")
layout(matrix(c(1, 2, 5, 3, 4, 5), 2, byrow = TRUE), widths = c(1, 1, 0.32))
par(mar = c(2.6, 2.8, 1.4, 0.4), mgp = c(1.5, 0.4, 0), tcl = -0.25, cex = 0.62, las = 1)
for (k in seq_along(n_sup)) {
  n <- n_sup[k]; s <- SUP[[as.character(n)]]
  G <- 100 * (s$B - s$F); G[!sup] <- NA
  Fp <- s$F; Fp[!sup] <- NA
  # image() usa x en filas: se transpone para tener p2 en el eje x y p1 en el eje y
  image(rej, rej, t(pmin(G, vmax)), zlim = c(0, vmax), col = azules,
        xlab = if (k > 2) expression(p[2]) else "", ylab = if (k %% 2 == 1) expression(p[1]) else "",
        xlim = c(0, 0.6), ylim = c(0, 0.6), axes = FALSE)
  contour(rej, rej, t(Fp), levels = c(0.2, 0.5, 0.8), labels = c("0,2", "0,5", "0,8"),
          add = TRUE, col = "gray25", lwd = 0.6, labcex = 0.55)
  ax <- seq(0, 0.6, 0.2)
  axis(1, at = ax, labels = sub(".", ",", ax, fixed = TRUE))
  axis(2, at = seq(0.1, 0.6, 0.1), labels = sub(".", ",", seq(0.1, 0.6, 0.1), fixed = TRUE))
  if (n == 34) points(0.03, 0.20, pch = 21, bg = "white", col = "black", cex = 1.1, lwd = 0.8)
  title(main = bquote(n[1] == n[2] ~ "=" ~ .(n)), font.main = 1, cex.main = 1)
}
par(mar = c(6, 0.6, 6, 3.2))
image(1, seq(0, vmax, length.out = 100), matrix(seq(0, vmax, length.out = 100), 1),
      col = azules, axes = FALSE, xlab = "", ylab = "")
axis(4, at = seq(0, 20, 5)); box()
mtext("Ganancia de potencia (puntos porcentuales)", side = 4, line = 1.8, las = 0, cex = 0.62)
invisible(dev.off())
cat("\n")

# =============================================================================
cat("== 6. Figura 4: probabilidad de rechazo bajo H0 ==\n")
# =============================================================================
tam_n <- do.call(rbind, lapply(10:60, function(n) {
  r <- REG[[as.character(n)]]
  data.frame(n = n, fisher = max(rechazo_h0(r$R$fisher, n, n)),
             boschloo = max(rechazo_h0(r$R$boschloo, n, n)))
}))
write.csv(tam_n, ruta("tamano_vs_n.csv"), row.names = FALSE)
en <- tam_n$n >= 15 & tam_n$n <= 50
cat("n entre 15 y 50: tama\u00f1o m\u00e1x. Fisher =", coma(max(tam_n$fisher[en])),
    "| Boschloo entre", coma(min(tam_n$boschloo[en])), "y", coma(max(tam_n$boschloo[en])), "\n")
cat("n entre 10 y 60: tama\u00f1o m\u00e1x. Boschloo =", coma(max(tam_n$boschloo)), "(nunca supera alpha)\n")

reg15 <- regiones(15, 15, con_z = TRUE)
H0 <- list("15" = reg15, "34" = reg34)
cairo_pdf(ruta("fig_error_tipo1.pdf"), width = 4.2, height = 2.0, family = "serif")
par(mfrow = c(1, 2), mar = c(2.6, 3.1, 1.4, 0.4), mgp = c(1.5, 0.4, 0), tcl = -0.25, cex = 0.62, las = 1)
estilos <- list(fisher = list("Fisher", "gray35", 1), boschloo = list("Boschloo", "#1f6f8b", 1),
                z = list(expression(italic(z) ~ "combinado"), "#d9822b", 2))
for (k in names(H0)) {
  r <- H0[[k]]; n <- r$n1
  plot(NA, xlim = c(0, 1), ylim = c(0, 0.06), xlab = expression(italic(p) ~ "bajo" ~ H[0]),
       ylab = "", axes = FALSE)
  if (k == "15") title(ylab = "Probabilidad de rechazo", line = 2.1)
  for (m in names(estilos)) lines(MALLA_H0, rechazo_h0(r$R[[m]], n, n),
                                  col = estilos[[m]][[2]], lty = estilos[[m]][[3]], lwd = 1.1)
  abline(h = alpha, col = "gray60", lty = 3, lwd = 0.6)
  axis(1, at = seq(0, 1, 0.25), labels = sub(".", ",", seq(0, 1, 0.25), fixed = TRUE))
  axis(2, at = seq(0, 0.06, 0.01), labels = sub(".", ",", seq(0, 0.06, 0.01), fixed = TRUE))
  title(main = bquote(n[1] == n[2] ~ "=" ~ .(n)), font.main = 1, cex.main = 1)
  if (k == "34") legend("bottom", legend = c("Fisher", "Boschloo", expression(italic(z) ~ "combinado")),
                        col = c("gray35", "#1f6f8b", "#d9822b"), lty = c(1, 1, 2), lwd = 1.1,
                        bty = "n", cex = 0.85)
}
invisible(dev.off())
cat("\n")

# =============================================================================
cat("== 7. Prueba z con varianza combinada (Suissa--Shuster) ==\n")
# =============================================================================
for (n in c(15, 20, 25, 34, 50)) {
  r <- if (n == 34) reg34 else if (n == 15) reg15 else regiones(n, n, con_z = TRUE)
  cat(sprintf("n = %2d: tablas Boschloo s\u00ed / z no = %d ; z s\u00ed / Boschloo no = %d\n",
              n, sum(r$R$boschloo & !r$R$z), sum(r$R$z & !r$R$boschloo)))
}
cat("Potencia de z en el escenario de referencia:", coma(pot1(reg34$R$z, 34, 34, p1, p2)),
    "| tama\u00f1o m\u00e1x.:", coma(max(rechazo_h0(reg34$R$z, 34, 34))), "\n")
cat("Valor p de z para (7, 1):", coma(reg34$P$z[g34$x1 == 7 & g34$x2 == 1]), "\n\n")

# =============================================================================
cat("== 8. Definici\u00f3n bilateral en dise\u00f1os desbalanceados ==\n")
# =============================================================================
for (d in list(c(10, 30), c(15, 45), c(20, 40))) {
  r <- regiones(d[1], d[2], con_central = TRUE)
  cambia <- r$R$boschloo != r$R$boschloo_central
  cat(sprintf("n1 = %d, n2 = %d (%d tablas): cambian de decisi\u00f3n seg\u00fan la definici\u00f3n = %d\n",
              d[1], d[2], (d[1] + 1) * (d[2] + 1), sum(cambia)))
  cat(sprintf("  Fisher s\u00ed / Boschloo no: minlike = %d, central = %d\n",
              sum(r$R$fisher & !r$R$boschloo), sum(r$R$fisher_central & !r$R$boschloo_central)))
  cat("  Tama\u00f1o m\u00e1x. (Fisher minlike, Fisher central, Boschloo minlike, Boschloo central):",
      coma(sapply(r$R[c("fisher", "fisher_central", "boschloo", "boschloo_central")],
                  function(R) max(rechazo_h0(R, d[1], d[2])))), "\n")
  if (d[1] == 10) {
    gg <- tablas(10, 30)
    for (ej in list(c(2, 0), c(2, 17))) {
      k <- which(gg$x1 == ej[1] & gg$x2 == ej[2])
      cat(sprintf("  Tabla %d/10 frente a %d/30: Fisher %s (minlike) / %s (central); Boschloo %s / %s\n",
                  ej[1], ej[2], coma(r$P$fisher[k]), coma(r$P$fisher_central[k]),
                  coma(r$P$boschloo[k]), coma(r$P$boschloo_central[k])))
      cat(sprintf("     control exact2x2::boschloo: %s (minlike) / %s (central)\n",
                  coma(boschloo(ej[1], 10, ej[2], 30, tsmethod = "minlike")$p.value),
                  coma(boschloo(ej[1], 10, ej[2], 30, tsmethod = "central")$p.value)))
    }
  }
}
cat("\n")

# =============================================================================
cat("== 9. Tama\u00f1o que necesitar\u00eda Fisher para igualar a Boschloo con n = 34 ==\n")
# =============================================================================
objetivo <- res_n$pot_boschloo[res_n$n == 34]
n_eq <- min(res_n$n[res_n$n >= 34 & res_n$pot_fisher >= objetivo])
cat("Potencia de Boschloo con n = 34:", coma(objetivo), "\n")
cat("Menor n por grupo con el que Fisher la alcanza:", n_eq,
    "(potencia", coma(res_n$pot_fisher[res_n$n == n_eq]), ")\n")
cat("Probabilidad de no detectar el efecto con n = 34: Fisher", coma(1 - sum(w[F])),
    "| Boschloo", coma(1 - sum(w[B])), "\n")

# =============================================================================
cat("\n== 10. Lectura bayesiana del valor p de Fisher (Altham, 1969) ==\n")
# =============================================================================
# P(p_alta > p_estandar | datos) con a priori independientes Beta(a, b)
post_inversion <- function(a_est, b_est, a_alta, b_alta, x1 = 7, x2 = 1, n = 34)
  integrate(function(x) dbeta(x, x1 + a_est, n - x1 + b_est) *
              pbeta(x, x2 + a_alta, n - x2 + b_alta, lower.tail = FALSE),
            0, 1, rel.tol = 1e-12)$value
cat("Fisher unilateral (greater)                   :",
    coma(fisher.test(T0, alternative = "greater")$p.value), "\n")
cat("Posterior, Beta(0,1) est\u00e1ndar / Beta(1,0) alta:", coma(post_inversion(0, 1, 1, 0)), "\n")
cat("Posterior, a priori uniformes Beta(1,1)       :", coma(post_inversion(1, 1, 1, 1)), "\n\n")

saveRDS(list(grilla_n34 = g, pesos = w, tabla3 = tab3, tamano_n34 = size34,
             discordancia_n = res_n, superficie = SUP, tabla4 = tab4, tamano_n = tam_n),
        ruta("resultados_simulacion3.rds"))
sink()
cat("Listo. Resultados en", ruta("resultados_simulacion3.txt"), "\n")
