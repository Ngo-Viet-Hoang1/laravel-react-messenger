#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             Starting App for Render Deployment               ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# 1. Tạo thư mục storage cần thiết & phân quyền
mkdir -p \
    /var/www/storage/framework/{sessions,views,cache/data} \
    /var/www/storage/logs \
    /var/www/storage/app/public

chmod -R 775 /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true

# 2. Tạo Storage Symlink nếu chưa có
if [ ! -L /var/www/public/storage ]; then
    echo "==> Creating storage symlink..."
    php /var/www/artisan storage:link 2>/dev/null || true
fi

# 3. Cache Config & Routes trong môi trường Production
if [ "$APP_ENV" = "production" ]; then
    echo "==> Caching config, routes, events..."
    php /var/www/artisan config:cache
    php /var/www/artisan route:cache
    php /var/www/artisan event:cache
fi

# 4. Chạy Database Migrations
echo "==> Running database migrations..."
php /var/www/artisan migrate --force --isolated --no-interaction

# 5. Chạy Seeder nếu biến môi trường SEED_DATABASE=true
if [ "$SEED_DATABASE" = "true" ]; then
    echo "==> SEED_DATABASE=true detected! Running database seeder..."
    php /var/www/artisan db:seed --force
fi

# 6. Khởi chạy Queue Worker ở chế độ background
echo "==> Starting Queue Worker (Background)..."
php /var/www/artisan queue:work --tries=3 --timeout=90 &

# 7. Khởi chạy Reverb WebSocket Server ở chế độ background
echo "==> Starting Reverb WebSocket Server (Background)..."
php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080 &

# 8. Khởi chạy PHP-FPM daemon
echo "==> Starting PHP-FPM..."
php-fpm -D

# 9. Khởi chạy Nginx foreground (process chính giữ cho container sống)
echo "==> Starting Nginx Web Server..."
exec nginx -g 'daemon off;'
