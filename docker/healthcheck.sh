set -e

# ─── PHP-FPM via FastCGI ping ─────────────────────────────────────────────────
FPM_CHECK=$(
    SCRIPT_NAME=/fpm-ping \
    SCRIPT_FILENAME=/fpm-ping \
    REQUEST_METHOD=GET \
    cgi-fcgi -bind -connect 127.0.0.1:9000 2>/dev/null
)

if ! echo "$FPM_CHECK" | grep -q "pong"; then
    echo "FAIL: PHP-FPM not responding to ping (workers may be deadlocked)" >&2
    echo "FPM response: $FPM_CHECK" >&2
    exit 1
fi

# ─── Database connection ──────────────────────────────────────────────────────
DB_CHECK=$(php -r "
try {
    \$pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'mysql',
            getenv('DB_PORT') ?: '3306',
            getenv('DB_DATABASE') ?: 'laravel'
        ),
        getenv('DB_USERNAME') ?: 'laravel',
        getenv('DB_PASSWORD') ?: 'secret',
        [PDO::ATTR_TIMEOUT => 5, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo 'ok';
} catch (Exception \$e) {
    fwrite(STDERR, 'DB: ' . \$e->getMessage() . PHP_EOL);
    exit(1);
}
" 2>&1)

if [ "$DB_CHECK" != "ok" ]; then
    echo "FAIL: DB connection failed - $DB_CHECK" >&2
    exit 1
fi

REDIS_CHECK=$(php -r "
try {
    \$redis = new Redis();
    if (!\$redis->connect(
        getenv('REDIS_HOST') ?: 'redis',
        (int)(getenv('REDIS_PORT') ?: 6379),
        5  // connection timeout seconds
    )) { exit(1); }

    // REDIS_PASSWORD=null (string) → không auth
    // REDIS_PASSWORD='' (empty) → không auth
    // REDIS_PASSWORD=secret → auth với password
    \$pass = getenv('REDIS_PASSWORD');
    if (\$pass && \$pass !== 'null' && !empty(\$pass)) {
        \$redis->auth(\$pass);
    }

    \$redis->ping();
    echo 'ok';
} catch (Exception \$e) {
    fwrite(STDERR, 'Redis: ' . \$e->getMessage() . PHP_EOL);
    exit(1);
}
" 2>&1)

if [ "$REDIS_CHECK" != "ok" ]; then
    echo "FAIL: Redis connection failed - $REDIS_CHECK" >&2
    exit 1
fi

echo "OK: fpm-ping + mysql + redis"
exit 0
