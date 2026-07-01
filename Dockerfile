# ─── Stage 1: Node builder ────────────────────────────────────────────────────
# Mục đích: compile frontend assets (Vite + TypeScript + Tailwind)
# Stage này chỉ được COPY vào production image (public/build/)
# Dev không dùng stage này (npm run dev chạy trên host)
FROM node:22-alpine AS node-builder

WORKDIR /app

# Copy package files trước (layer cache: chỉ npm install lại khi deps thay đổi)
COPY package*.json ./

# KHÔNG đặt NODE_ENV=production ở đây!
# Lý do: vite, tailwindcss, laravel-vite-plugin, typescript đều là devDependencies
# → NODE_ENV=production làm npm ci skip devDependencies → vite: not found khi build
# NODE_ENV=production đúng chỗ là runtime container (compose.prod.yml environment:)
RUN npm ci

COPY . .

# Build assets và xóa npm cache để không bloat layer (~100MB)
RUN npm run build \
    && npm cache clean --force

# ─── Stage 2: PHP base ────────────────────────────────────────────────────────
# Base chung cho cả dev và production
# Dùng alpine để image nhỏ (~100MB vs ~400MB debian-based)
FROM php:8.3-fpm-alpine AS php-base

# ── Cài packages theo pattern Docker PHP official ──────────────────────────────
# Pattern: tách runtime deps và build-only deps thành 2 nhóm riêng biệt
# - Runtime deps: cần trong container mãi mãi
# - Build-only deps: chỉ cần để compile PHP extensions, sau đó XÓA hoàn toàn
#
# Tại sao dùng virtual group (.build-deps)?
#   apk add --virtual .build-deps nhóm tất cả build tools vào 1 label
#   apk del .build-deps xóa TOÀN BỘ nhóm đó (bao gồm cả *-dev libs)
#   Nếu không dùng pattern này: libpng-dev, freetype-dev,... ở lại image mãi mãi
#   Image size difference: ~80-150MB
#
# Tại sao set -eux?
#   -e: exit ngay nếu bất kỳ lệnh nào fail (fail fast, không bỏ qua lỗi)
#   -u: error nếu dùng biến chưa định nghĩa
#   -x: print mỗi lệnh trước khi chạy (debug visibility trong build log)
RUN set -eux; \
    \
    # ── Runtime deps: cần mãi mãi ──────────────────────────────────────────
    # bash: entrypoint.sh cần bash (không phải sh)
    # git: composer install đôi khi cần git để clone packages
    # curl: health check endpoints, wget thay thế
    # zip/unzip: composer extract packages
    # fcgi: cung cấp cgi-fcgi command → check FPM qua FastCGI protocol
    #        chính xác hơn pgrep (check actual request handling, không chỉ process)
    #
    # !! QUAN TRỌNG: Runtime shared libraries của PHP extensions !!
    # Khi apk del .build-deps xóa *-dev packages, APK cũng xóa luôn runtime
    # libraries mà chúng kéo theo (libpng, libicu, libzip,...).
    # Extensions như gd.so, intl.so, zip.so LINK vào các .so này lúc runtime.
    # Giải pháp: install runtime libs RIÊNG (không trong .build-deps) → không bị xóa.
    apk add --no-cache \
        bash \
        git \
        curl \
        zip \
        unzip \
        fcgi \
        # Runtime libs cho PHP extensions (PHẢI có sau khi xóa .build-deps)
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        icu-libs \
        libxml2 \
        oniguruma; \
    \
    # ── Build-only deps: tất cả vào virtual group .build-deps ──────────────
    # $PHPIZE_DEPS: biến do image php:*-alpine định nghĩa sẵn
    #   Chứa: autoconf automake g++ libtool make pkgconf
    #   Cần cho: docker-php-ext-install và pecl install
    #   Không có: "Cannot find autoconf" error
    # *-dev libs: header files cần khi compile extensions
    #   Lưu ý: *-dev packages kéo theo runtime libs như dependencies
    #   → sau khi compile xong, apk del .build-deps sẽ xóa cả *-dev lẫn runtime libs
    #   → nhưng runtime libs đã được install riêng ở trên (không bị xóa)
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
    # ── Configure extensions cần tham số đặc biệt ──────────────────────────
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    \
    # ── Install PHP extensions ──────────────────────────────────────────────
    # -j"$(nproc)": compile song song trên tất cả CPU cores
    #   nproc = số logical CPUs (GitHub Actions: 2, local: 4-16)
    #   Speedup: ~2x trên 2 cores, ~4x trên 4 cores
    # pdo_mysql: kết nối MySQL
    # mbstring: xử lý multibyte string (UTF-8)
    # exif: đọc metadata ảnh (upload)
    # pcntl: POSIX process control → Horizon cần để nhận signals (SIGTERM, SIGINT)
    #         Lý do Horizon không chạy trên Windows Laragon: Windows không có pcntl
    # bcmath: arbitrary precision math (payment, crypto)
    # gd: xử lý ảnh (resize, thumbnail)
    # zip: compress/extract archives
    # intl: internationalization (Carbon, Symfony)
    # opcache: compile PHP → bytecode, cache in memory → 3-5x faster
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
    # ── Redis extension qua PECL (không có trong core PHP) ─────────────────
    # phpredis (C extension) nhanh hơn predis (pure PHP) 3-5x
    # Lý do dùng PECL thay apt: alpine không có package, phải compile từ source
    pecl install redis; \
    docker-php-ext-enable redis; \
    \
    # ── Dọn dẹp ────────────────────────────────────────────────────────────
    # apk del .build-deps: xóa TOÀN BỘ virtual group
    #   Bao gồm: $PHPIZE_DEPS (autoconf, g++,...) VÀ *-dev libraries
    #   Runtime libs (libpng, icu-libs,...) đã install riêng → KHÔNG bị xóa
    #   Compiled .so files (gd.so, redis.so,...) ở lại vì không thuộc group
    apk del .build-deps; \
    rm -rf /tmp/pear /var/cache/apk/*

# Composer từ official image (không cài vào image, chỉ copy binary)
# Composer 2.x: install nhanh hơn, hỗ trợ parallel downloads
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# ─── Stage 3: Development ─────────────────────────────────────────────────────
# Dùng với compose.yml (volume mount code từ host)
# Không bake code vào image → changes reflect ngay không cần rebuild
FROM php-base AS development

# Dev PHP config: verbose errors, generous limits, display errors
COPY docker/php/local.ini /usr/local/etc/php/conf.d/zzz-local.ini

# FPM pool config: bật ping endpoint cho healthcheck chính xác
COPY docker/php/fpm-pool.conf /usr/local/etc/php-fpm.d/zzz-pool.conf

COPY docker/healthcheck.sh /healthcheck.sh
COPY docker/entrypoint.sh  /entrypoint.sh
RUN chmod +x /healthcheck.sh /entrypoint.sh

# Uncomment để bật Xdebug khi debug:
# RUN pecl install xdebug && docker-php-ext-enable xdebug \
#     && printf "xdebug.mode=debug\nxdebug.start_with_request=yes\nxdebug.client_host=host.docker.internal\n" \
#        >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]

# ─── Stage 4: Production ──────────────────────────────────────────────────────
# Image nhỏ hơn: opcache aggressive, no display_errors, no dev tools
# Dùng với compose.prod.yml
FROM php-base AS production

# Prod PHP config: opcache tối đa, errors to stderr, ẩn PHP version
COPY docker/php/opcache.ini    /usr/local/etc/php/conf.d/zzz-opcache.ini
COPY docker/php/production.ini /usr/local/etc/php/conf.d/zzz-production.ini

# FPM pool config: bật ping endpoint cho healthcheck chính xác
COPY docker/php/fpm-pool.conf /usr/local/etc/php-fpm.d/zzz-pool.conf

COPY docker/healthcheck.sh /healthcheck.sh
COPY docker/entrypoint.sh  /entrypoint.sh
RUN chmod +x /healthcheck.sh /entrypoint.sh

# ── CI/CD mode: bake code vào image ──────────────────────────────────────────
# Uncomment toàn bộ block này khi build image cho registry (GitHub Actions):
#
# COPY --from=node-builder /app/public/build ./public/build
#   └─ Chỉ copy compiled assets (CSS, JS), không copy node_modules
#
# COPY --chown=www-data:www-data . .
#   └─ --chown: set ownership ngay khi COPY (thay vì RUN chown sau - nhanh hơn)
#
# RUN composer install \
#       --no-dev \               ← không cần phpunit/faker trong prod
#       --optimize-autoloader \  ← classmap thay psr-4 autoloading → 30% nhanh hơn
#       --prefer-dist \          ← download zip thay git clone (nhanh hơn)
#       --no-progress \          ← bỏ progress bar trong CI log
#       --no-scripts \           ← scripts chạy trong entrypoint (cần DB)
#     && chown -R www-data:www-data /var/www \
#     && chmod -R 755 /var/www/storage /var/www/bootstrap/cache

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
