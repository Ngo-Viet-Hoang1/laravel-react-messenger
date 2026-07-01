#!/bin/bash
##############################################################################
# EC2 Initial Setup Script
# Chạy 1 lần trên EC2 instance mới (Amazon Linux 2023)
#
# Cách dùng:
#   chmod +x scripts/ec2-setup.sh
#   ./scripts/ec2-setup.sh
#
# Sau khi chạy xong:
#   1. Sửa /app/.env với thông tin production
#   2. Chạy: docker compose -f compose.prod.yml up -d
#   3. Cấu hình SSL: certbot --nginx -d yourdomain.com
##############################################################################
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║  EC2 Setup Script — Laravel Messenger        ║"
echo "║  OS: Amazon Linux 2023                       ║"
echo "╚══════════════════════════════════════════════╝"

# ─── 1. Cập nhật hệ thống ────────────────────────────────────────────────────
echo "==> [1/8] Updating system packages..."
sudo dnf update -y

# ─── 2. Cài Docker ───────────────────────────────────────────────────────────
echo "==> [2/8] Installing Docker..."
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker

# Thêm user vào docker group (không cần sudo mỗi lần)
sudo usermod -aG docker ec2-user
echo "  ✅ Docker installed: $(docker --version)"

# ─── 3. Cài Docker Compose plugin ────────────────────────────────────────────
echo "==> [3/8] Installing Docker Compose plugin..."
# Docker Compose v2 là plugin (docker compose), không phải standalone (docker-compose)
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest \
    | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
echo "  ✅ Docker Compose installed: $(docker compose version)"

# ─── 4. Cài Git ──────────────────────────────────────────────────────────────
echo "==> [4/8] Installing Git..."
sudo dnf install -y git
echo "  ✅ Git installed: $(git --version)"

# ─── 5. Cài Certbot (SSL) ────────────────────────────────────────────────────
echo "==> [5/8] Installing Certbot for Let's Encrypt SSL..."
# Certbot + nginx plugin
sudo dnf install -y python3-certbot-nginx 2>/dev/null || \
    sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
    pip3 install certbot certbot-nginx 2>/dev/null || \
    echo "  ⚠️  Certbot install failed. Install manually: pip3 install certbot certbot-nginx"
echo "  ✅ Certbot ready"

# Auto-renewal cron (Let's Encrypt cert hết hạn sau 90 ngày, renew trước 30 ngày)
# Certbot tự thêm cron job, nhưng thêm manual để chắc:
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --nginx") | crontab -
echo "  ✅ Auto-renewal cron added (daily at 03:00)"

# ─── 6. Clone repository ─────────────────────────────────────────────────────
echo "==> [6/8] Setting up application directory..."
APP_DIR="/app"
REPO_URL="${REPO_URL:-https://github.com/your-username/laravel-react-messenger.git}"

if [ ! -d "$APP_DIR/.git" ]; then
    echo "  Cloning repository to $APP_DIR..."
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R ec2-user:ec2-user "$APP_DIR"
else
    echo "  ✅ Repository already exists at $APP_DIR"
fi

cd "$APP_DIR"

# ─── 7. Tạo .env production ──────────────────────────────────────────────────
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

# ─── 8. Firewall / Security Group ────────────────────────────────────────────
echo "==> [8/8] Security reminder..."
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
echo "  3. Start services:"
echo "       cd /app && docker compose -f compose.prod.yml up -d"
echo ""
echo "  4. Setup SSL (sau khi DNS trỏ về server):"
echo "       # Sửa server_name trong docker/nginx/prod/default.conf"
echo "       certbot --nginx -d yourdomain.com"
echo ""
echo "  5. GitHub Actions Secrets cần thêm:"
echo "       EC2_HOST       = $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "       EC2_USER       = ec2-user"
echo "       EC2_SSH_KEY    = (nội dung private key .pem)"
echo "       APP_DOMAIN     = yourdomain.com"
