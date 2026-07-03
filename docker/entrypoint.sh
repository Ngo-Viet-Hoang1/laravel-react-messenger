#!/bin/bash
set -e

APP_ENV="${APP_ENV:-local}"
echo "╔══════════════════════════════════════════╗"
echo "║  Entrypoint │ ENV=${APP_ENV} │ CMD=$*"
echo "╚══════════════════════════════════════════╝"

if [ ! -f /var/www/vendor/autoload.php ]; then
    echo "==> WARN: vendor/ not found → installing Composer dependencies..."
    echo "    Nếu đây là production, image có thể bị thiếu 'composer install'."
    cd /var/www && composer install --no-interaction --prefer-dist --no-progress
fi

# ─── Setup chỉ chạy cho PHP-FPM (app container) ───────────────────────────────
# Horizon, Reverb, Scheduler dùng CMD khác → bỏ qua block này
# Tránh 4 containers đồng loạt chạy migrate gây race condition
if [[ "$1" == "php-fpm" ]]; then

    echo "==> Ensuring storage directories exist..."
    mkdir -p \
        /var/www/storage/framework/{sessions,views,cache/data} \
        /var/www/storage/logs \
        /var/www/storage/app/public

    chmod -R 775 /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true
    chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true

    if [ ! -f /var/www/.env ]; then
        echo "==> .env not found → copying .env.example..."
        cp /var/www/.env.example /var/www/.env
    fi

    current_key=$(grep "^APP_KEY=" /var/www/.env | cut -d'=' -f2 | tr -d '"')
    if [ -z "$current_key" ]; then
        echo "==> Generating APP_KEY..."
        php /var/www/artisan key:generate --force
    fi

    if [ ! -L /var/www/public/storage ]; then
        echo "==> Creating storage symlink..."
        php /var/www/artisan storage:link 2>/dev/null || true
    fi

    if [ "$APP_ENV" = "production" ]; then
        echo "==> Caching config, routes, events for production..."
        php /var/www/artisan config:cache
        php /var/www/artisan route:cache
        php /var/www/artisan event:cache
    fi

    echo "==> Running migrations..."
    php /var/www/artisan migrate --force --isolated --no-interaction

fi

echo "==> Starting: $*"
exec "$@"
