# Entorno de desarrollo del curso GAMLSS (Fase 1: sin WebR, sin R)
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]
