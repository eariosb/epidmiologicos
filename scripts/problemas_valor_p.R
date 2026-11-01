# ============================================================
# Problemas del calculo del valor p en una tabla 2x2
# Caso: 12/50 frente a 2/34 (12 eventos en 50 del grupo 1,
# 2 eventos en 34 del grupo 2).
# Ejecutar: Rscript scripts/problemas_valor_p.R
#
# La tabla se usa como excusa para mostrar cinco problemas que
# no aparecen con datos continuos: dos convenciones bilaterales
# que dan conclusiones opuestas, una region de rechazo que
# depende de la tabla observada, un valor p que no es la suma de
# su region, un tamano real muy por debajo de alfa y una
# correccion (mid-p) que rompe la garantia exacta.
# ============================================================

x1 <- 12; n1 <- 50
x2 <- 2;  n2 <- 34
m  <- x1 + x2

xs <- max(0, m - n2):min(n1, m)
pr <- dhyper(xs, n1, n2, m)
P0 <- dhyper(x1, n1, n2, m)

p_minlike <- function(x) {
  p0 <- dhyper(x, n1, n2, m)
  sum(pr[pr <= p0 * (1 + 1e-9)])
}
cola_izq <- function(x) sum(pr[xs <= x])
cola_der <- function(x) sum(pr[xs >= x])
p_central <- function(x) min(1, 2 * min(cola_izq(x), cola_der(x)))

cat("== 1. El espacio condicional ==\n")
cat(sprintf("Margenes fijos: m = %d eventos; soporte x1 = %d..%d (%d tablas)\n",
            m, min(xs), max(xs), length(xs)))
cat(sprintf("P(tabla observada) = %.5f\n", P0))
cat(sprintf("E[x1] bajo H0 = %.2f, asi que 12 cae en la cola derecha\n\n",
            m * n1 / (n1 + n2)))

cat("== 2. Cuatro cifras para el mismo dato ==\n")
cat(sprintf("minlike (fisher.test)        = %.4f\n", p_minlike(x1)))
cat(sprintf("central (exact2x2)           = %.4f\n", p_central(x1)))
cat(sprintf("unilateral derecha           = %.4f\n", cola_der(x1)))
cat(sprintf("unilateral izquierda         = %.4f\n", cola_izq(x1)))
cat(sprintf("mid-p bilateral              = %.4f\n", p_minlike(x1) - 0.5 * P0))
cat("\nVerificacion contra R:\n")
cat(sprintf("fisher.test bilateral        = %.4f\n",
            fisher.test(matrix(c(x1, n1 - x1, x2, n2 - x2), 2))$p.value))
cat(sprintf("fisher.test alternative=greater = %.4f\n",
            fisher.test(matrix(c(x1, n1 - x1, x2, n2 - x2), 2),
                        alternative = "greater")$p.value))
cat(sprintf("fisher.test alternative=less    = %.4f\n\n",
            fisher.test(matrix(c(x1, n1 - x1, x2, n2 - x2), 2),
                        alternative = "less")$p.value))

cat("== 3. Problema 1: las dos convenciones concluyen distinto en alfa = 0.05 ==\n")
cat(sprintf("minlike = %.4f  -> se rechaza H0\n", p_minlike(x1)))
cat(sprintf("central = %.4f  -> no se rechaza H0\n", p_central(x1)))
cat("El mismo dato, el mismo alfa, dos conclusiones. Ninguna es un error:\n")
cat("minlike suma tablas tan improbables como la observada; central duplica\n")
cat("la cola menor. La diferencia no es de redondeo, es de definicion.\n\n")

cat("== 4. Problema 2: la region de rechazo depende de la tabla observada ==\n")
r12 <- xs[pr <= P0 * (1 + 1e-9)]
r03 <- xs[pr <= dhyper(3, n1, n2, m) * (1 + 1e-9)]
cat(sprintf("Observada 12: se rechaza en x1 = {%s} (%d tablas)\n",
            paste(r12, collapse = ", "), length(r12)))
cat(sprintf("Observada  3: se rechaza en x1 = {%s} (%d tablas)\n",
            paste(r03, collapse = ", "), length(r03)))
cat("La region no es fija: cada observacion define la suya. Por eso minlike\n")
cat("no es un contraste derivado de una particion unica del espacio, y su\n")
cat("region puede ser disjunta (aqui, colas 0..4 y 12..14).\n\n")

cat("== 5. Problema 3: el valor p central no es la suma de su region ==\n")
cola_dup <- xs[xs >= x1]
cat(sprintf("Cola menor resaltada: x1 = {%s}, masa = %.4f\n",
            paste(cola_dup, collapse = ", "), cola_der(x1)))
cat(sprintf("p central = 2 x %.4f = %.4f, no la suma de las barras resaltadas\n",
            cola_der(x1), p_central(x1)))
alfa <- 0.05
reg_min <- xs[sapply(xs, p_minlike) <= alfa]
reg_cen <- xs[sapply(xs, p_central) <= alfa]
cat(sprintf("A alfa = %.2f, la region minlike es {%s} con tamano real %.4f\n",
            alfa, paste(reg_min, collapse = ", "), sum(pr[xs %in% reg_min])))
cat(sprintf("A alfa = %.2f, la region central es {%s} con tamano real %.4f\n",
            alfa, paste(reg_cen, collapse = ", "), sum(pr[xs %in% reg_cen])))
mt <- sapply(xs, function(x) min(cola_izq(x), cola_der(x)))
salto <- which(mt > alfa / 2)[1]
cat(sprintf("La cola menor salta de %.4f (x1 = %d) a %.4f (x1 = %d):\n",
            mt[salto - 1], xs[salto - 1], mt[salto], xs[salto]))
cat(sprintf("el valor p pasa de %.4f a %.4f sin poder valer nunca 0.05.\n",
            2 * mt[salto - 1], 2 * mt[salto]))
cat("El contraste central gasta solo una fraccion de alfa, porque la rejilla\n")
cat("discreta no le permite afinar el corte.\n\n")

cat("== 6. Problema 4: 'bilateral' no es 'dos veces la cola' ==\n")
cat(sprintf("2 x cola derecha = %.4f, pero minlike = %.4f\n",
            2 * cola_der(x1), p_minlike(x1)))
cat("Solo central coincide con ese doble, y solo porque elige la cola menor.\n")
cat("El mid-p resta media masa de la tabla observada y deja de ser exacto:\n")
cat("puede quedar por debajo de alfa con probabilidad mayor que alfa.\n\n")

cat("== 7. Tabla completa del espacio ==\n")
tab <- data.frame(
  x1 = xs,
  P = round(pr, 5),
  minlike = round(sapply(xs, p_minlike), 4),
  central = round(sapply(xs, p_central), 4),
  izq = round(sapply(xs, cola_izq), 4),
  der = round(sapply(xs, cola_der), 4)
)
print(tab, row.names = FALSE)

# ------------------------------------------------------------
# Graficos: la distribucion con las dos regiones, y el valor p
# como funcion de la tabla observada. Se escriben en un archivo
# temporal para no dejar artefactos en el repositorio.
# ------------------------------------------------------------
col_obs <- "#4C72B0"; col_min <- "#DD8452"; col_cen <- "#2A6F77"; col_off <- "#CBD5E1"

salida <- file.path(tempdir(), "problemas_valor_p.png")
png(salida, width = 1200, height = 520, res = 110)
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1), mgp = c(2.2, 0.7, 0))

# Panel 1: las dos regiones sobre el mismo espacio. La cola central
# se marca con una llave para no tapar las barras que tambien entran
# en la region minlike.
bp <- barplot(pr, names.arg = xs, border = NA,
              col = ifelse(xs %in% reg_min, col_min, col_off),
              ylim = c(-0.045, max(pr) * 1.12),
              main = "Dos regiones para la misma tabla",
              xlab = "x1 (eventos en el grupo 1)", ylab = "P(tabla | margenes)")
abline(h = P0, lty = 2, col = "grey30")
x_ini <- bp[which(xs == min(cola_dup))] - 0.4
x_fin <- bp[which(xs == max(cola_dup))] + 0.4
segments(x_ini, -0.020, x_fin, -0.020, col = col_cen, lwd = 3)
segments(c(x_ini, x_fin), -0.026, y1 = -0.014, col = col_cen, lwd = 3)
legend("topleft", bty = "n", cex = 0.8,
       fill = c(col_min, col_off), border = c(NA, NA),
       legend = c("region minlike (alfa = 0.05)", "fuera de ella"))
legend("topright", bty = "n", cex = 0.8, lwd = 3, col = col_cen,
       legend = "cola menor que central duplica")

# Panel 2: el valor p segun la tabla observada
plot(NA, xlim = range(xs), ylim = c(0, 1), xlab = "x1 observado",
     ylab = "valor p bilateral", main = "Dos funciones de valor p")
abline(h = alfa, lty = 3, col = "grey40")
lines(xs, sapply(xs, p_minlike), type = "b", pch = 16, col = col_min)
lines(xs, sapply(xs, p_central), type = "b", pch = 17, col = col_cen)
abline(v = x1, lty = 2, col = col_obs)
text(x1, 0.75, "12/50", col = col_obs, cex = 0.8, pos = 4)
legend("topright", bty = "n", cex = 0.8, col = c(col_min, col_cen), lty = 1,
       pch = c(16, 17), legend = c("minlike", "central"))

invisible(dev.off())
cat(sprintf("\nGraficos escritos en %s\n", salida))
