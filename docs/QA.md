# Puertas de no-regresión (`pnpm qa`)

Cinco puertas que deben correr antes de fusionar cualquier fase.
Línea base registrada en `docs/baseline/` (typecheck, test, build).

| Puerta | Comando | Qué protege |
|---|---|---|
| Tipos | `pnpm typecheck` | Errores TypeScript nuevos |
| Build | `pnpm build` | Compilación de producción |
| Tests | `pnpm test` | Lógica (`exact2x2`, `precision`, prompts, componentes) |
| MDX | `pnpm check:mdx` | Los 20 archivos MDX (repaso + 19 módulos) compilan con el pipeline real |
| Salidas R | `pnpm check:r` | Cada `RCell`/`LabExercise` produce la salida de `tests/r-snapshots/` |
| Capturas | `pnpm test:visual` | Píxeles idénticos a `tests/visual/__snapshots__/` en claro, 1280×800 y 390×844 |

Todo junto: `pnpm qa` (tarda varios minutos: incluye build y R).

## Snapshots de R

`scripts/run_all_r.py` corre cada celda en R local (`$RSCRIPT` → `PATH` →
ruta típica de Windows) con `cwd=public/data`, como hace webR.

- **Actualizar a propósito**: `pnpm check:r:update`. Solo cuando la fase
  cambia una celda deliberadamente; listar las celdas afectadas en el PR.
- Una celda sin snapshot nuevo es un fallo de la puerta, no una advertencia.

## Capturas visuales

Playwright contra `next start -p 3001` (reutiliza un servidor ya activo).
Modo claro, `reducedMotion`, espera de fuentes, KaTeX y altura estable.

- **Regenerar línea base**: `pnpm build && pnpm test:visual:update`.
  Úsese solo para cambios visuales declarados (fases 5–7); cada captura
  nueva se revisa una por una en el PR.
- Mismo entorno siempre: fuentes y render varían entre OS. La línea base
  de este repo se capturó en Windows + Chromium headless 156.
- Para añadir una página, basta el MDX: el spec itera `src/content/modules`.

## Notas

- Los `SasBlock` no corren en `check:r` (es SAS, no R).
- `public/data/Rplots.pdf` es un residuo de R: borrarlo, nunca commitearlo.
- Si `pnpm install` cambia dependencias, reiniciar el `next dev`/`start`
  activo: el `.next` anterior queda con vendor-chunks obsoletos (500s).
