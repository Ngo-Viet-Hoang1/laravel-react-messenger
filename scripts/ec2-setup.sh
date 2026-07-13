set -e

echo "╔══════════════════════════════════════════════╗"
echo "║  EC2 Setup Script — Laravel Messenger        ║"
echo "║  OS: Amazon Linux 2023                       ║"
echo "╚══════════════════════════════════════════════╝"

echo "==> [1/8] Updating system packages..."
sudo dnf update -y

echo "==> [2/8] Installing Docker..."
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker

sudo usermod -aG docker ec2-user
echo "  ✅ Docker installed: $(docker --version)"

echo "==> [3/8] Installing Docker Compose plugin..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest \
    | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
echo "  ✅ Docker Compose installed: $(docker compose version)"

echo "==> [4/8] Installing Git..."
sudo dnf install -y git
echo "  ✅ Git installed: $(git --version)"

echo "==> [5/8] Installing Certbot for Let's Encrypt SSL..."
sudo dnf install -y cronie 2>/dev/null || echo "  ⚠️  Cron install skipped"
sudo systemctl enable crond 2>/dev/null || true
sudo systemctl start crond 2>/dev/null || true

sudo dnf install -y python3-certbot-nginx 2>/dev/null || \
    sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
    pip3 install certbot certbot-nginx 2>/dev/null || \
    echo "  ⚠️  Certbot install failed. Install manually: pip3 install certbot certbot-nginx"
echo "  ✅ Certbot ready"

(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker exec laravel_nginx nginx -s reload'") | crontab - 2>/dev/null || echo "  ⚠️  Skipped crontab setup"

# ── Cấu hình domain ─────────────────────────────────────────────────────────
# Có thể truyền từ ngoài vào: DOMAIN=yourdomain.com bash ec2-setup.sh
# Nếu không truyền, script sẽ đọc từ /app/.env ở Step 8 (sau khi clone)
# KHÔNG hardcode ở đây — để rỗng, đọc từ .env sau
# ---------------------------------------------------------------------------

echo "==> [6/8] Setting up application directory..."
APP_DIR="/app"
REPO_URL="${REPO_URL:-https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger.git}"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "  Cloning repository to $APP_DIR..."
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R ec2-user:ec2-user "$APP_DIR"
else
    echo "  ✅ Repository already exists at $APP_DIR"
fi

# Create .well-known directory for Certbot webroot ACME challenge.
# Nginx container bind-mounts ./public/.well-known:/var/www/public/.well-known.
# The directory must exist on the host BEFORE docker compose up — Docker would
# otherwise create it as root:root (owned by daemon, not ec2-user).
# mkdir -p is idempotent: safe to run on every setup re-run.
# This is server infrastructure, intentionally NOT tracked in git.
mkdir -p "$APP_DIR/public/.well-known"

cd "$APP_DIR"

echo "==> [7/8] Setting up production .env..."
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

# ── Step 8: Tạo self-signed cert SAU KHI .env đã được setup ────────────────
# BUG FIX: Bước này trước đây chạy TRƯỚC khi clone repo → /app/.env chưa tồn
# tại → DOMAIN luôn fallback về twiliver.dev bất kể domain thực là gì.
# Bây giờ chạy SAU Step 7 (.env setup) để đọc đúng APP_URL từ .env.
#
# Ưu tiên đọc DOMAIN theo thứ tự:
#   1. DOMAIN env var (truyền khi chạy script): DOMAIN=myapp.com bash ec2-setup.sh
#   2. APP_URL trong /app/.env (đã được setup ở Step 7)
#   3. Fallback về twiliver.dev (nếu cả 2 trên đều không có / là placeholder)
echo "==> [8/8] Creating self-signed SSL placeholder..."
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
# Đọc DOMAIN theo ưu tiên: biến môi trường → APP_URL trong .env → fallback
if [ -z "${DOMAIN:-}" ]; then
    DOMAIN=$(grep '^APP_URL=' "$APP_DIR/.env" 2>/dev/null \
        | sed 's|APP_URL=https\?://||' \
        | sed 's|/.*||' \
        | tr -d '\r\n')
fi

# Guard: reject placeholder values that would create a useless cert
case "${DOMAIN:-}" in
    ''|localhost|127.0.0.1|yourdomain.com|example.com)
        echo "  ⚠️  DOMAIN='${DOMAIN:-<empty>}' trông như placeholder."
        echo "  Gợi ý: Chạy script với DOMAIN thật:"
        echo "         DOMAIN=myapp.com bash ec2-setup.sh"
        echo "  Hoặc sửa APP_URL trong /app/.env rồi chạy lại bước này thủ công."
        echo "  Fallback: dùng domain từ deploy.yml (twiliver.dev)"
        DOMAIN="twiliver.dev"
        ;;
esac

echo "  Domain: ${DOMAIN}"

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

echo "" # security reminder below (not a numbered step)
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
echo "  5. GitHub Actions — cập nhật nếu đổi domain:"
echo "       Sửa APP_DOMAIN trong .github/workflows/deploy.yml dòng 18"
echo "       Hoặc dùng GitHub Variable: Settings → Variables → APP_DOMAIN"
echo ""
echo "  6. GitHub Actions Secrets cần thêm:"
echo "       EC2_HOST        = $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "       EC2_USER        = ec2-user"
echo "       EC2_SSH_KEY     = (nội dung private key .pem)"
echo "       GHCR_READ_TOKEN = (GitHub PAT với scope read:packages)"
