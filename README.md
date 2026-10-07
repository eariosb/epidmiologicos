# Curso Procesos Estocásticos, con una introducción a las EDE

Curso interactivo de **procesos estocásticos** con introducción a las **ecuaciones
diferenciales estocásticas (EDE)**, con R, para la Escuela de Estadística de la
Universidad Nacional de Colombia, sede Medellín. Hereda arquitectura, pizarra
digital, asistente IA con RAG y sistema de diseño de los cursos *Modelos Mixtos
Aplicados a Ciencias de la Salud* y *GAMLSS*, con identidad propia en violeta
profundo.

## Temario (16 módulos, 4 bloques)

**Bloque I — Fundamentos y cadenas de Markov**

1. Procesos estocásticos: el azar que evoluciona
2. Cadenas de Markov en tiempo discreto
3. El largo plazo: clases, recurrencia y estacionariedad
4. Procesos de segundo orden y estacionariedad

**Bloque II — Procesos gaussianos y EDO aleatorias**

5. Procesos gaussianos
6. Cálculo en media cuadrática
7. EDO aleatorias (RODE): Euler y Heun
8. Cruces y descomposiciones: Rice, Durbin y Karhunen-Loève

**Bloque III — Ruido Wiener e Itô**

9. El proceso de Wiener
10. La integral de Itô
11. EDE lineales: OU, Vasicek y bonos
12. Ruido multiplicativo: GBM y momentos

**Bloque IV — Poisson, saltos y síntesis**

13. El proceso de Poisson
14. Poisson compuesto y difusiones con saltos
15. Fokker-Planck y primeros arribos
16. Procesos de Lévy y el modelo de embalses

## Textos

- **Giraldo Gómez, N.D.** *Procesos estocásticos, con una introducción a las
  ecuaciones diferenciales estocásticas, con R.* Notas de clase, UNAL Medellín
  (texto guía).
- **Ross, S.M.** *Stochastic Processes.* Wiley, 2ª ed. (apoyo clásico).
- **Lawler, G.F.** *Introduction to Stochastic Processes.* Chapman & Hall/CRC
  (apoyo introductorio).

## Desarrollo

1. `pnpm install`
2. `pnpm dev` → http://localhost:3000

Verificación: `pnpm typecheck`, `pnpm vitest run`, `pnpm build`.

## Ejecución de R en el navegador

Las celdas `RCell` corren en WebR (R compilado a WebAssembly). La simulación del
curso es mayormente base R (caminatas, cadenas de Markov, Poisson, Browniano,
Euler-Maruyama), por lo que los laboratorios son rápidos. Paquetes del texto
guía (`sde`, `Sim.DiffProc`, `yuima`, `fptdApprox`, `MASS`, `expm`,
`markovchain`) están en el repo binario de WebR y se instalan bajo demanda la
primera vez que una celda los llama.
