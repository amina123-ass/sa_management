# ============================
# ÉTAPE 1 : BUILD REACT
# ============================
FROM node:18-alpine AS builder

WORKDIR /app

# Copier tout le projet
COPY . .

# Variables injectées depuis docker-compose build args
ARG REACT_APP_API_URL=http://192.168.1.45:8001/api
ARG REACT_APP_NAME="SA Management"
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_NAME=$REACT_APP_NAME

# npm install plus tolérant que npm ci (gère les conflits de peer deps)
RUN npm install --legacy-peer-deps

# Builder le projet
RUN npm run build

# ============================
# ÉTAPE 2 : SERVIR AVEC NGINX
# ============================
FROM nginx:alpine

# Copier le build React vers nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Configuration Nginx pour React Router (SPA)
RUN echo 'server {' > /etc/nginx/conf.d/default.conf \
    && echo '  listen 80;' >> /etc/nginx/conf.d/default.conf \
    && echo '  root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf \
    && echo '  index index.html;' >> /etc/nginx/conf.d/default.conf \
    && echo '  gzip on;' >> /etc/nginx/conf.d/default.conf \
    && echo '  gzip_types text/plain text/css application/json application/javascript;' >> /etc/nginx/conf.d/default.conf \
    && echo '  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {' >> /etc/nginx/conf.d/default.conf \
    && echo '    expires 1y;' >> /etc/nginx/conf.d/default.conf \
    && echo '    add_header Cache-Control "public, no-transform";' >> /etc/nginx/conf.d/default.conf \
    && echo '  }' >> /etc/nginx/conf.d/default.conf \
    && echo '  location / {' >> /etc/nginx/conf.d/default.conf \
    && echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf \
    && echo '  }' >> /etc/nginx/conf.d/default.conf \
    && echo '  add_header X-Frame-Options "SAMEORIGIN";' >> /etc/nginx/conf.d/default.conf \
    && echo '  add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/default.conf \
    && echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
