FROM php:8.2-fpm-alpine

# ============================
# DÉPENDANCES SYSTÈME
# ============================
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    mysql-client \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libzip-dev \
    icu-dev

# ============================
# EXTENSIONS PHP
# ============================
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        xml \
        intl \
        opcache

# ============================
# CONFIGURATION PHP
# ============================
RUN echo "upload_max_filesize=20M" > /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "max_execution_time=120" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "date.timezone=Africa/Casablanca" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.memory_consumption=192" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/custom.ini

# ============================
# CONFIGURATION NGINX
# ============================
RUN cat > /etc/nginx/nginx.conf <<'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;

events { worker_connections 1024; }

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  client_max_body_size 20M;

  server {
    listen 8000;
    root /var/www/html/public;
    index index.php;

    location / {
      try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
      fastcgi_pass 127.0.0.1:9000;
      fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
      include fastcgi_params;
      fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
      deny all;
    }
  }
}
EOF

# ============================
# CONFIGURATION SUPERVISOR
# ============================
RUN cat > /etc/supervisord.conf <<'EOF'
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisord.log

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true

[program:php-fpm]
command=php-fpm -F
autostart=true
autorestart=true
EOF

# ============================
# COMPOSER
# ============================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ============================
# APPLICATION
# ============================
WORKDIR /var/www/html

# Copier d'abord les dépendances (cache layers)
COPY composer.json composer.lock ./

# Installer vendors sans scripts (évite package:discover pendant build)
RUN composer install \
    --no-interaction \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Copier le reste du code
COPY . .

# Autoloader optimisé SANS scripts (évite encore package:discover)
RUN composer dump-autoload --optimize --no-dev --no-scripts

# Permissions (Laravel)
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ============================
# SCRIPT DE DÉMARRAGE
# ============================
RUN cat > /start.sh <<'EOF'
#!/bin/sh
set -e

cd /var/www/html

# Créer .env si absent (utile en Docker)
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# Permissions (au cas où volume bind)
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

echo "⏳ Attente MySQL..."
until php -r "new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));"
do
  echo "   retry dans 3s..."
  sleep 3
done
echo "✅ MySQL prêt"

# APP_KEY si manquant
php artisan key:generate --force 2>/dev/null || true

# Nettoyer + cache (safe)
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migrer
php artisan migrate --force

# Storage link (optionnel)
php artisan storage:link --force 2>/dev/null || true

# Permissions finales
chown -R www-data:www-data storage bootstrap/cache || true

echo "🚀 Backend démarré"
exec /usr/bin/supervisord -c /etc/supervisord.conf
EOF

RUN chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"]
