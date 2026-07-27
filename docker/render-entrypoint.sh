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

# 2. Re-create Storage Symlink chuẩn xác
rm -rf /var/www/public/storage
php /var/www/artisan storage:link 2>/dev/null || true

# Clear bất kỳ config cache cũ nào để tránh đọc cache_locks trước khi migration
php /var/www/artisan config:clear || true

# 3. Chạy Database Migrations (dùng CACHE_STORE=array để tránh tìm bảng cache_locks khi chưa tạo)
echo "==> Running database migrations..."
CACHE_STORE=array php /var/www/artisan migrate --force --no-interaction

# 4. Cache Config, Routes, Events trong môi trường Production
if [ "$APP_ENV" = "production" ]; then
    echo "==> Caching config, routes, events..."
    php /var/www/artisan config:cache
    php /var/www/artisan route:cache
    php /var/www/artisan event:cache
fi

# 5. Khởi chạy Queue Worker ở chế độ background
echo "==> Starting Queue Worker (Background)..."
php /var/www/artisan queue:work --tries=3 --timeout=90 &

# 6. Khởi chạy Reverb WebSocket Server ở chế độ background
echo "==> Starting Reverb WebSocket Server (Background)..."
php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080 &

# 7. Khởi chạy PHP-FPM daemon
echo "==> Starting PHP-FPM..."
php-fpm -D

# 8. Khởi chạy Nginx foreground (process chính giữ cho container sống)
echo "==> Starting Nginx Web Server..."
exec nginx -g 'daemon off;'
