# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers package
COPY package.json package-lock.json* ./

# Configurer npm pour être plus tolérant aux erreurs réseau
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 300000

# Installer les dépendances avec retry
RUN npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps

# Copier le reste de l'application
COPY . .

# Build de production
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=build /app/build /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]