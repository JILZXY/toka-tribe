# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa 2: Producción (Runtime)
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]