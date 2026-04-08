# ── Etapa 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Instalar dependencias primero (cache de capas)
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ── Etapa 2: Producción ──
FROM node:20-alpine AS production

# Seguridad: usuario no-root (OWASP A05)
RUN addgroup -g 1001 -S nestjs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos compilados
COPY --from=builder /usr/src/app/dist ./dist

# No ejecutar como root
USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]