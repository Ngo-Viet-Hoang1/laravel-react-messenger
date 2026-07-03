# ─── Stage 1: Node builder ────────────────────────────────────────────────────
FROM node:22-alpine AS node-builder

WORKDIR /app

COPY package*.json ./

# Not put NODE_ENV=production here! because vite, tailwindcss, laravel-vite-plugin, typescript are devDependencies
RUN npm ci

COPY . .

# Build assets and clean npm cache to avoid bloating the layer (~100MB)
RUN npm run build \
    && npm cache clean --force

# ─── Stage 2: PHP base ────────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS php-base

RUN set -eux; \
    \
    apk add --no-cache \
        bash \
        git \
        curl \
        zip \
        unzip \
        fcgi \
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        icu-libs \
        libxml2 \
        oniguruma; \
    \

    apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        freetype-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        libzip-dev \
        icu-dev \
        libxml2-dev \
        oniguruma-dev; \
    \

    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    \

    docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache; \
    \

    pecl install redis; \
    docker-php-ext-enable redis; \
    \

    apk del .build-deps; \
    rm -rf /tmp/pear /var/cache/apk/*

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# ─── Stage 3: Development ─────────────────────────────────────────────────────
FROM php-base AS development

# Dev PHP config: verbose errors, generous limits, display errors
COPY docker/php/local.ini /usr/local/etc/php/conf.d/zzz-local.ini

# FPM pool config: turn ping endpoint on for healthcheck 
COPY docker/php/fpm-pool.conf /usr/local/etc/php-fpm.d/zzz-pool.conf

COPY docker/healthcheck.sh /healthcheck.sh
COPY docker/entrypoint.sh  /entrypoint.sh
RUN chmod +x /healthcheck.sh /entrypoint.sh

# Uncomment to enable Xdebug when debugging:
# RUN pecl install xdebug && docker-php-ext-enable xdebug \
#     && printf "xdebug.mode=debug\nxdebug.start_with_request=yes\nxdebug.client_host=host.docker.internal\n" \
#        >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]

# ─── Stage 4: Production ──────────────────────────────────────────────────────
FROM php-base AS production

# Prod PHP config
COPY docker/php/opcache.ini    /usr/local/etc/php/conf.d/zzz-opcache.ini
COPY docker/php/production.ini /usr/local/etc/php/conf.d/zzz-production.ini

# FPM pool config: turn ping endpoint on for healcheck
COPY docker/php/fpm-pool.conf /usr/local/etc/php-fpm.d/zzz-pool.conf

COPY docker/healthcheck.sh /healthcheck.sh
COPY docker/entrypoint.sh  /entrypoint.sh
RUN chmod +x /healthcheck.sh /entrypoint.sh

# Bake compiled frontend assets from node-builder stage
COPY --from=node-builder /app/public/build ./public/build

COPY --chown=www-data:www-data . .

RUN composer install \
      --no-dev \
      --optimize-autoloader \
      --prefer-dist \
      --no-progress \
      --no-scripts \
    && chmod -R 755 /var/www/storage /var/www/bootstrap/cache

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
