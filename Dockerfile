# ============================================
# IRONPLAN WEB - Dockerfile para Railway
# ============================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build -- --configuration=production

# Etapa 2: Runtime con Node.js para SSR
FROM node:20-alpine

WORKDIR /app

# Copiar archivos necesarios para SSR
COPY --from=builder /app/dist/ironplan-web ./dist/ironplan-web
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio para SSR (Railway inyecta PORT automáticamente)
CMD ["node", "dist/ironplan-web/server/server.mjs"]
