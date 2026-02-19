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
RUN echo 'user nginx;' > /etc/nginx/nginx.conf \
    && echo 'worker_processes auto;' >> /etc/nginx/nginx.conf \
    && echo 'error_log /var/log/nginx/error.log warn;' >> /etc/nginx/nginx.conf \
    && echo 'events { worker_connections 1024; }' >> /etc/nginx/nginx.conf \
    && echo 'http {' >> /etc/nginx/nginx.conf \
    && echo '  include /etc/nginx/mime.types;' >> /etc/nginx/nginx.conf \
    && echo '  default_type application/octet-stream;' >> /etc/nginx/nginx.conf \
    && echo '  sendfile on;' >> /etc/nginx/nginx.conf \
    && echo '  client_max_body_size 20M;' >> /etc/nginx/nginx.conf \
    && echo '  server {' >> /etc/nginx/nginx.conf \
    && echo '    listen 8000;' >> /etc/nginx/nginx.conf \
    && echo '    root /var/www/html/public;' >> /etc/nginx/nginx.conf \
    && echo '    index index.php;' >> /etc/nginx/nginx.conf \
    && echo '    location / { try_files $uri $uri/ /index.php?$query_string; }' >> /etc/nginx/nginx.conf \
    && echo '    location ~ \.php$ {' >> /etc/nginx/nginx.conf \
    && echo '      fastcgi_pass 127.0.0.1:9000;' >> /etc/nginx/nginx.conf \
    && echo '      fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;' >> /etc/nginx/nginx.conf \
    && echo '      include fastcgi_params;' >> /etc/nginx/nginx.conf \
    && echo '      fastcgi_read_timeout 300;' >> /etc/nginx/nginx.conf \
    && echo '    }' >> /etc/nginx/nginx.conf \
    && echo '    location ~ /\.(?!well-known).* { deny all; }' >> /etc/nginx/nginx.conf \
    && echo '  }' >> /etc/nginx/nginx.conf \
    && echo '}' >> /etc/nginx/nginx.conf

# ============================
# CONFIGURATION SUPERVISOR
# ============================
RUN echo '[supervisord]' > /etc/supervisord.conf \
    && echo 'nodaemon=true' >> /etc/supervisord.conf \
    && echo 'user=root' >> /etc/supervisord.conf \
    && echo 'logfile=/var/log/supervisord.log' >> /etc/supervisord.conf \
    && echo '[program:nginx]' >> /etc/supervisord.conf \
    && echo 'command=nginx -g "daemon off;"' >> /etc/supervisord.conf \
    && echo 'autostart=true' >> /etc/supervisord.conf \
    && echo 'autorestart=true' >> /etc/supervisord.conf \
    && echo '[program:php-fpm]' >> /etc/supervisord.conf \
    && echo 'command=php-fpm -F' >> /etc/supervisord.conf \
    && echo 'autostart=true' >> /etc/supervisord.conf \
    && echo 'autorestart=true' >> /etc/supervisord.conf

# ============================
# COMPOSER
# ============================
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ============================
# APPLICATION
# ============================
WORKDIR /var/www/html

# Copier les dépendances d'abord (cache Docker layers)
COPY composer.json composer.lock ./
RUN composer install \
    --no-interaction \
    --no-scripts \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader

# Copier le reste du code
COPY . .

# Générer APP_KEY si absent dans .env
RUN php artisan key:generate --force 2>/dev/null || true

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# ============================
# SCRIPT DE DÉMARRAGE
# ============================
RUN printf '#!/bin/sh\nset -e\n\
echo "⏳ Attente MySQL..."\n\
until php -r "new PDO('"'"'mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}'"'"', '"'"'${DB_USERNAME}'"'"', '"'"'${DB_PASSWORD}'"'"');" 2>/dev/null; do\n\
  echo "   retry dans 3s..."; sleep 3\n\
done\n\
echo "✅ MySQL prêt"\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
php artisan migrate --force\n\
php artisan storage:link --force 2>/dev/null || true\n\
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache\n\
echo "🚀 Backend démarré"\n\
exec /usr/bin/supervisord -c /etc/supervisord.conf\n' > /start.sh \
    && chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"]