#!/bin/bash
set -e

APP_ENV="${APP_ENV:-local}"
echo "╔══════════════════════════════════════════╗"
echo "║  Entrypoint │ ENV=${APP_ENV} │ CMD=$*"
echo "╚══════════════════════════════════════════╝"

# ─── Vendor check ─────────────────────────────────────────────────────────────
if [ ! -f /var/www/vendor/autoload.php ]; then
    if [ "$APP_ENV" = "production" ]; then
        echo "ERROR: vendor/autoload.php not found in production!" >&2
        echo "Hint: Chạy 'composer install --no-dev' trước khi deploy." >&2
        exit 1
    fi
    echo "==> Installing Composer dependencies (lần đầu run)..."
    cd /var/www && composer install --no-interaction --prefer-dist --no-progress
fi

# ─── Setup chỉ chạy cho PHP-FPM (app container) ───────────────────────────────
# Horizon, Reverb, Scheduler dùng CMD khác → bỏ qua block này
# Tránh 4 containers đồng loạt chạy migrate gây race condition
if [[ "$1" == "php-fpm" ]]; then

    # Permissions
    chmod -R 775 /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true
    chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true

    # .env
    if [ ! -f /var/www/.env ]; then
        echo "==> .env not found → copying .env.example..."
        cp /var/www/.env.example /var/www/.env
    fi

    # App key
    current_key=$(grep "^APP_KEY=" /var/www/.env | cut -d'=' -f2 | tr -d '"')
    if [ -z "$current_key" ]; then
        echo "==> Generating APP_KEY..."
        php /var/www/artisan key:generate --force
    fi

    # Storage symlink
    if [ ! -L /var/www/public/storage ]; then
        echo "==> Creating storage symlink..."
        php /var/www/artisan storage:link 2>/dev/null || true
    fi

    # Production: cache config/routes/events để giảm filesystem reads
    if [ "$APP_ENV" = "production" ]; then
        echo "==> Caching for production..."
        php /var/www/artisan config:cache
        php /var/www/artisan route:cache
        php /var/www/artisan event:cache
        # view:cache không cache ở đây vì storage/ có thể trên volume khác
    fi

    # Migrations (idempotent và safe)
    # --isolated: acquire advisory lock trong DB → chỉ 1 instance migrate tại 1 thời điểm
    # An toàn khi rolling deploy hoặc nhiều replicas start cùng lúc
    echo "==> Running migrations..."
    php /var/www/artisan migrate --force --isolated --no-interaction

fi

echo "==> Starting: $*"
exec "$@"
