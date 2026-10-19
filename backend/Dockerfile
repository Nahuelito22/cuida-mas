# Una sola imagen para los tres servicios del monorepo (y el seed).
# docker-compose elige qué aplicación arranca cada contenedor con `command`.

# ---------- Etapa 1: compilar ----------
FROM node:24-alpine AS build
WORKDIR /app
# Evita que mongodb-memory-server (solo para tests) descargue MongoDB al instalar.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Etapa 2: imagen final, solo dependencias de producción ----------
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY scripts ./scripts
# No correr como root dentro del contenedor.
USER node
CMD ["node", "dist/apps/api-gateway/main.js"]
