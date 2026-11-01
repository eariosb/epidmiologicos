# Animación: las tablas más extremas del test de Fisher (caso Perondi).
# Versión local con gganimate — en la web la misma narrativa vive en el
# componente interactivo <FisherExtremesLab> y en el RCell 06/tablas-extremas
# (versión estática de 4 paneles, compatible con webR).
#
# Paquetes: install.packages(c("ggplot2", "gganimate", "gifski", "dplyr", "tidyr"))
library(ggplot2)
library(gganimate)
library(dplyr)
library(tidyr)

# 1. Caso Perondi: supervivientes en paro cardíaco pediátrico
n1 <- 34
n2 <- 34
M  <- 8           # total de sobrevivientes (margen condicionado)
x1_obs <- 7       # sobrevivientes con dosis estándar

# 2. Espacio condicional: todas las tablas posibles dado M
df <- data.frame(x1 = max(0, M - n2):min(n1, M)) %>%
  mutate(
    x2 = M - x1,
    prob = dhyper(x1, n1, n2, M),
    observada = x1 == x1_obs,
    p_obs = dhyper(x1_obs, n1, n2, M),
    # minlike: al menos tan improbable que la observada
    extrema = prob <= p_obs * (1 + 1e-9)
  )

p_valor <- sum(df$prob[df$extrema])

# 3. Coreografía en 4 estadios (los mismos del componente web)
df_anim <- df %>%
  expand_grid(frame = 1:4) %>%
  mutate(
    color = case_when(
      frame == 1 ~ "Neutral",
      frame == 2 & observada ~ "Observada",
      frame == 3 & extrema ~ "Extrema",
      frame == 4 & extrema ~ "Region_Rechazo",
      TRUE ~ "Neutral"
    ),
    estadio = factor(frame, labels = c(
      "1. El espacio",
      "2. La observada",
      "3. Las extremas",
      "4. La suma"
    ))
  )

# 4. Gráfico animado
p <- ggplot(df_anim, aes(x = factor(x1), y = prob, fill = color)) +
  geom_col(width = 0.7, color = "black", linewidth = 0.2) +
  geom_hline(data = df, aes(yintercept = p_obs),
             linetype = "dashed", color = "#4C72B0", linewidth = 0.7) +
  scale_fill_manual(values = c(
    "Neutral" = "#CBD5E1",
    "Observada" = "#4C72B0",
    "Extrema" = "#F2C9AC",
    "Region_Rechazo" = "#DD8452"
  )) +
  labs(
    title = "{closest_state}",
    subtitle = sprintf(
      "Perondi: %d/%d vs. %d/%d sobrevivientes — valor p minlike = %.4f",
      x1_obs, n1, M - x1_obs, n2, p_valor
    ),
    x = "x1 (sobrevivientes en grupo 1)",
    y = "P(tabla | márgenes)",
    caption = "Línea punteada: P de la tabla observada. Las extremas son las que caen por debajo."
  ) +
  theme_minimal(base_size = 14) +
  theme(
    legend.position = "none",
    plot.title = element_text(face = "bold"),
    panel.grid.major.x = element_blank()
  ) +
  transition_states(estadio, transition_length = 1, state_length = 2) +
  ease_aes("cubic-in-out")

animate(p, nframes = 120, fps = 20, width = 800, height = 600,
        renderer = gifski_renderer("animacion_extremos.gif"))
