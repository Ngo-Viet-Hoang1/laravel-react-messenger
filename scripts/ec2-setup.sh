set -e

echo "╔══════════════════════════════════════════════╗"
echo "║  EC2 Setup Script — Laravel Messenger        ║"
echo "║  OS: Amazon Linux 2023                       ║"
echo "╚══════════════════════════════════════════════╝"

echo "==> [1/9] Updating system packages..."
sudo dnf update -y

echo "==> [2/9] Installing Docker..."
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker

sudo usermod -aG docker ec2-user
echo "  ✅ Docker installed: $(docker --version)"

echo "==> [3/9] Installing Docker Compose plugin..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest \
    | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
echo "  ✅ Docker Compose installed: $(docker compose version)"

echo "==> [4/9] Installing Git..."
sudo dnf install -y git
echo "  ✅ Git installed: $(git --version)"

echo "==> [5/9] Installing Certbot for Let's Encrypt SSL..."
sudo dnf install -y cronie 2>/dev/null || echo "  ⚠️  Cron install skipped"
sudo systemctl enable crond 2>/dev/null || true
sudo systemctl start crond 2>/dev/null || true

sudo dnf install -y python3-certbot-nginx 2>/dev/null || \
    sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
    pip3 install certbot certbot-nginx 2>/dev/null || \
    echo "  ⚠️  Certbot install failed. Install manually: pip3 install certbot certbot-nginx"
echo "  ✅ Certbot ready"

(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker exec laravel_nginx nginx -s reload'") | crontab - 2>/dev/null || echo "  ⚠️  Skipped crontab setup"

echo "==> [6/9] Creating self-signed SSL placeholder..."
# Why self-signed placeholder?
#   Nginx image (nginx-production) has 'ssl_certificate' directives baked in.
#   If /etc/letsencrypt/live/<domain>/ doesn't exist, Nginx crashes on startup.
#   Solution: create a dummy self-signed cert at the exact path Nginx expects.
#   Certbot will OVERWRITE these files with a real cert when you run it.
#   This step is idempotent — skipped if the file already exists.
#
# Ansible equivalent:
#   - name: Generate self-signed placeholder
#     command: openssl req -x509 ...
#     args:
#       creates: /etc/letsencrypt/live/{{ domain }}/fullchain.pem
DOMAIN=$(grep '^APP_URL=' /app/.env 2>/dev/null | sed 's|APP_URL=https\?://||' | tr -d '\r\n')
DOMAIN=${DOMAIN:-twiliver.dev}

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
    echo "  Generating self-signed placeholder cert for ${DOMAIN}..."
    sudo mkdir -p "${CERT_DIR}"
    sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "${CERT_DIR}/privkey.pem" \
        -out    "${CERT_DIR}/fullchain.pem" \
        -subj   "/CN=${DOMAIN}" \
        2>/dev/null
    echo "  ✅ Self-signed cert created at ${CERT_DIR}"
    echo "  ⚠️  Run Certbot after DNS is pointed to get a real cert:"
    echo "       certbot certonly --webroot -w /app/public -d ${DOMAIN}"
    echo "       docker exec laravel_nginx nginx -s reload"
else
    echo "  ✅ Cert already exists at ${CERT_DIR} (skipping placeholder)"
fi

echo "==> [7/9] Setting up application directory..."
APP_DIR="/app"
REPO_URL="${REPO_URL:-https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger.git}"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "  Cloning repository to $APP_DIR..."
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R ec2-user:ec2-user "$APP_DIR"
else
    echo "  ✅ Repository already exists at $APP_DIR"
fi

cd "$APP_DIR"

echo "==> [8/9] Setting up production .env..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo ""
    echo "  ⚠️  QUAN TRỌNG: Sửa file /app/.env với thông tin production!"
    echo "  Các biến cần thay đổi:"
    echo "    APP_ENV=production"
    echo "    APP_DEBUG=false"
    echo "    APP_URL=https://yourdomain.com"
    echo "    DB_PASSWORD=<strong-password>"
    echo "    REDIS_PASSWORD=<strong-password>"
    echo "    REVERB_APP_SECRET=<random-secret>"
    echo "    MAIL_MAILER=smtp (hoặc ses)"
    echo ""
    echo "  Sau khi sửa .env, chạy:"
    echo "    docker compose -f compose.prod.yml up -d"
else
    echo "  ✅ .env already exists"
fi

echo "==> [9/9] Security reminder..."
echo ""
echo "  ⚠️  Đảm bảo AWS Security Group cho phép:"
echo "    - Port 80  (HTTP)        → 0.0.0.0/0"
echo "    - Port 443 (HTTPS)       → 0.0.0.0/0"
echo "    - Port 22  (SSH)         → Your IP only (không để 0.0.0.0!)"
echo "    - Port 8080 (Reverb WS)  → Đóng hoàn toàn (Nginx proxy qua port 80/443)"
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ EC2 Setup Complete!                       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  NEXT STEPS:"
echo "  1. Re-login để docker group có hiệu lực:"
echo "       logout   # hoặc: exec sudo su -l ec2-user"
echo ""
echo "  2. Sửa file production .env:"
echo "       nano /app/.env"
echo ""
echo "  3. Start services (Nginx sẽ dùng self-signed cert tạm):"
echo "       cd /app && docker compose -f compose.prod.yml up -d"
echo ""
echo "  4. Sau khi DNS trỏ về server, lấy cert thật từ Let's Encrypt:"
echo "       certbot certonly --webroot -w /app/public -d \${DOMAIN:-yourdomain.com}"
echo "       docker exec laravel_nginx nginx -s reload"
echo "       # Sau bước này HTTPS dùng cert thật, không còn browser warning."
echo ""
echo "  5. GitHub Actions Secrets cần thêm:"
echo "       EC2_HOST       = $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "       EC2_USER       = ec2-user"
echo "       EC2_SSH_KEY    = (nội dung private key .pem)"
echo "       GHCR_READ_TOKEN = (GitHub PAT với scope read:packages)"
