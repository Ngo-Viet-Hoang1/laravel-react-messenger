.PHONY: help up down build shell tinker test logs migrate fresh \
        horizon-pause horizon-continue restart-reverb \
        prod-up prod-down prod-build prod-deploy prod-logs

COMPOSE      = docker compose
COMPOSE_PROD = docker compose -f compose.prod.yml

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ─── Dev lifecycle ────────────────────────────────────────────────────────────

up: ## Khởi động dev stack
	$(COMPOSE) up -d
	@echo "App:     http://localhost:$${APP_PORT:-8000}"
	@echo "Horizon: http://localhost:$${APP_PORT:-8000}/horizon"
	@echo "Mailpit: http://localhost:$${MAILPIT_UI_PORT:-8025}"
	@echo "MinIO:   http://localhost:$${MINIO_CONSOLE_PORT:-9001}"

down: ## Dừng dev stack (giữ volumes)
	$(COMPOSE) down

build: ## Rebuild dev images (no cache)
	$(COMPOSE) build --no-cache

setup: ## Lần đầu: build + khởi động (DB + Redis trước, sau đó tất cả)
	@echo "==> Starting infrastructure..."
	$(COMPOSE) up -d mysql redis
	@echo "==> Waiting 20s for MySQL init..."
	@sleep 20
	@echo "==> Starting all services..."
	$(COMPOSE) up -d
	@echo "==> Waiting for app healthcheck..."
	@$(COMPOSE) exec app php artisan --version
	@echo "✅ Done!"

shell: ## Bash trong app container
	$(COMPOSE) exec app bash

tinker: ## Laravel Tinker
	$(COMPOSE) exec app php artisan tinker

# ─── Dev logging ──────────────────────────────────────────────────────────────

logs: ## Logs của app + horizon + reverb
	$(COMPOSE) logs -f app horizon reverb

logs-all: ## Logs tất cả services
	$(COMPOSE) logs -f

# ─── Dev database ─────────────────────────────────────────────────────────────

migrate: ## Chạy migrations
	$(COMPOSE) exec app php artisan migrate --force

fresh: ## Drop + migrate + seed
	$(COMPOSE) exec app php artisan migrate:fresh --seed

# ─── Dev queue / Horizon ──────────────────────────────────────────────────────

horizon-pause: ## Tạm dừng Horizon (không nhận job mới)
	$(COMPOSE) exec app php artisan horizon:pause

horizon-continue: ## Resume Horizon
	$(COMPOSE) exec app php artisan horizon:continue

restart-reverb: ## Graceful restart Reverb
	$(COMPOSE) exec reverb php artisan reverb:restart

# ─── Testing ──────────────────────────────────────────────────────────────────

test: ## Chạy toàn bộ tests
	$(COMPOSE) exec app php artisan test --compact

test-filter: ## Chạy test theo filter: make test-filter F=TestName
	$(COMPOSE) exec app php artisan test --compact --filter=$(F)

pint: ## Chạy Laravel Pint formatter
	$(COMPOSE) exec app vendor/bin/pint --dirty --format agent

artisan: ## Chạy artisan: make artisan CMD="cache:clear"
	$(COMPOSE) exec app php artisan $(CMD)

# ─── Production lifecycle ─────────────────────────────────────────────────────

prod-up: ## Khởi động production stack
	$(COMPOSE_PROD) up -d

prod-down: ## Dừng production stack
	$(COMPOSE_PROD) down

prod-build: ## Build production images
	$(COMPOSE_PROD) build --no-cache

prod-logs: ## Logs production
	$(COMPOSE_PROD) logs -f app horizon reverb scheduler

prod-shell: ## Shell trong production app container
	$(COMPOSE_PROD) exec app bash

prod-horizon-terminate: ## Graceful shutdown Horizon (chờ jobs đang chạy xong)
	$(COMPOSE_PROD) exec horizon php artisan horizon:terminate

# ─── Full production deploy workflow ─────────────────────────────────────────
prod-deploy: ## Full deploy: pull code → install deps → build assets → restart
	@echo "==> [1/5] Installing PHP dependencies..."
	$(COMPOSE_PROD) run --rm app composer install --no-dev --optimize-autoloader --prefer-dist
	@echo "==> [2/5] Installing Node dependencies & building assets..."
	npm ci && npm run build
	@echo "==> [3/5] Graceful Horizon shutdown (chờ jobs hiện tại xong)..."
	$(COMPOSE_PROD) exec horizon php artisan horizon:terminate 2>/dev/null || true
	@echo "==> [4/5] Restarting containers..."
	$(COMPOSE_PROD) up -d --build
	@echo "==> [5/5] Done!"
	@echo "✅ Deploy completed."
