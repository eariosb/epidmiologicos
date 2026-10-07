# =============================================================================
# precompute.R — Ejecuta todos los bloques <CodeBlock> de los módulos MDX y
# guarda sus salidas de referencia en public/precomputed/.
#
# Flujo:
#   1. Lee cada src/content/modules/*.mdx.
#   2. Extrae los bloques identificados por  <CodeBlock ... id="NN/desc" code={` ... `}
#      con expresiones regulares.
#   3. Ejecuta cada bloque en un entorno limpio (working dir = public/, para
#      que read.csv("data/...") resuelva igual que en el texto).
#   4. Captura la salida de consola con sink() y los gráficos con png().
#   5. Escribe public/precomputed/NN/<desc>.json  { console, image } y el PNG.
#
# Uso:   Rscript scripts/precompute.R          # todos los módulos
#        Rscript scripts/precompute.R 01       # solo el módulo 01
#
# Requisitos: R >= 4.3 con gamlss, gamlss.data, gamlss.dist instalados.
# La salida de este script ES la fuente de verdad de los `precomputed` de los
# MDX: si un resultado difiere del texto del módulo, se corrige el texto.
# =============================================================================

suppressPackageStartupMessages({
  ok <- requireNamespace("gamlss", quietly = TRUE)
  if (!ok) stop("Instala gamlss: install.packages('gamlss')")
  library(gamlss)
})

args        <- commandArgs(trailingOnly = TRUE)
modules_dir <- file.path("src", "content", "modules")
out_root    <- file.path("public", "precomputed")

mdx_files <- list.files(modules_dir, pattern = "\\.mdx$", full.names = TRUE)
if (length(args) > 0) {
  mdx_files <- mdx_files[grepl(paste0("^", args[1]), basename(mdx_files))]
}

# --- Extraer bloques <CodeBlock id="..." code={`...`} de un MDX -------------
extract_blocks <- function(path) {
  txt <- paste(readLines(path, warn = FALSE), collapse = "\n")
  # id="..."  seguido (en cualquier orden dentro del tag) de code={`...`}
  pattern <- "<CodeBlock[^>]*?id=\"([^\"]+)\"[\\s\\S]*?code=\\{`([\\s\\S]*?)`\\}"
  m <- gregexpr(pattern, txt, perl = TRUE)
  starts <- m[[1]]
  if (starts[1] == -1) return(list())
  res <- list()
  reg <- regmatches(txt, m)[[1]]
  for (chunk in reg) {
    id   <- sub(pattern, "\\1", regmatches(chunk, regexpr(pattern, chunk, perl = TRUE)), perl = TRUE)
    code <- sub(pattern, "\\2", regmatches(chunk, regexpr(pattern, chunk, perl = TRUE)), perl = TRUE)
    res[[length(res) + 1]] <- list(id = id, code = code)
  }
  res
}

# --- Ejecutar un bloque, capturando consola y gráfico ------------------------
run_block <- function(block) {
  parts   <- strsplit(block$id, "/")[[1]]
  mod_dir <- file.path(out_root, parts[1])
  if (!dir.exists(mod_dir)) dir.create(mod_dir, recursive = TRUE)
  slug     <- gsub("[^a-z0-9-]", "-", parts[2])
  png_path <- file.path(mod_dir, paste0(slug, ".png"))
  json_path<- file.path(mod_dir, paste0(slug, ".json"))

  old_wd <- getwd()
  setwd("public")  # los MDX usan read.csv("data/...")
  on.exit(setwd(old_wd), add = TRUE)

  png(file.path("..", png_path), width = 1400, height = 900, res = 150)
  con <- textConnection("captured", "w", local = TRUE)
  sink(con); sink(con, type = "message")
  err <- NULL
  tryCatch(
    eval(parse(text = block$code), envir = new.env(parent = globalenv())),
    error = function(e) err <<- conditionMessage(e)
  )
  sink(type = "message"); sink()
  close(con)
  dev.off()

  has_plot <- file.exists(file.path("..", png_path)) &&
    file.info(file.path("..", png_path))$size > 1000
  if (!has_plot && file.exists(file.path("..", png_path))) {
    unlink(file.path("..", png_path))
  }

  setwd(old_wd)
  result <- list(
    console = paste(captured, collapse = "\n"),
    image   = if (has_plot) paste0("/precomputed/", parts[1], "/", slug, ".png") else NULL,
    error   = err
  )
  writeLines(
    jsonlite::toJSON(result, auto_unbox = TRUE, null = "null", pretty = TRUE),
    json_path
  )
  if (!is.null(err)) {
    cat("  [ERROR]", block$id, ":", err, "\n")
  } else {
    cat("  [ok]", block$id, "\n")
  }
  is.null(err)
}

# --- Main --------------------------------------------------------------------
if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("jsonlite")

all_ok <- TRUE
for (f in mdx_files) {
  cat("Módulo:", basename(f), "\n")
  blocks <- extract_blocks(f)
  if (length(blocks) == 0) { cat("  (sin bloques)\n"); next }
  for (b in blocks) all_ok <- run_block(b) && all_ok
}

if (!all_ok) quit(status = 1)  # CI falla si algún bloque tiene código roto
cat("Precomputación completa.\n")
