# 🚀 Laravel React Messenger

<div align="center">

**A production-grade, real-time messaging application built with Laravel 13, Inertia.js v2, React 18, and Laravel Reverb.**

[![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[![Live Demo](https://img.shields.io/badge/Live_Demo-twiliver.dev-4F46E5?style=for-the-badge&logo=render&logoColor=white)](https://twiliver.dev)
[![GitHub Stars](https://img.shields.io/github/stars/Ngo-Viet-Hoang1/laravel-react-messenger?style=for-the-badge&logo=github)](https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/Ngo-Viet-Hoang1/laravel-react-messenger?style=for-the-badge)](https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger/issues)

</div>

---

## 📖 Overview

Full-stack real-time chat application focused on **production-level engineering practices**. Key highlights:

- **End-to-end encryption** with ECDH P-256 key exchange + AES-GCM-256 entirely in the browser (Web Crypto API)
- **WebSocket infrastructure** via Laravel Reverb (self-hosted, no Pusher dependency)
- **8 design patterns** applied deliberately across backend (Service, Repository, Observer, Template Method, Adapter, Factory, Contract, EventBus)
- **Freemium model** — free users retain messages for 90 days; premium unlocks unlimited history via PayPal
- **Fully containerized** — Docker Compose with 8 services (PHP-FPM, Nginx, MySQL, Redis, Horizon, Reverb, MinIO, Mailpit)

---

## 🖥️ Screenshots

> Screenshots will be added after the UI stabilizes. Live demo: [twiliver.dev](https://twiliver.dev)

<!-- ![Home — Channel List](docs/screenshots/home.png) -->
<!-- ![Group Chat](docs/screenshots/group-chat.png) -->
<!-- ![E2EE Direct Message](docs/screenshots/e2ee-dm.png) -->
<!-- ![Admin Panel](docs/screenshots/admin.png) -->
<!-- ![Premium Subscription](docs/screenshots/premium.png) -->

---

## ✨ Features

### 💬 Messaging

| Feature | Details |
|---|---|
| **Real-time messaging** | WebSockets via Laravel Reverb + Laravel Echo |
| **Group channels** | Create, edit, delete groups with member management |
| **Direct messages** | One-on-one private conversations |
| **E2EE direct messages** | ECDH P-256 key exchange + AES-GCM-256; keys never leave the browser |
| **Message reactions** | Emoji reactions with live broadcast updates |
| **Reply to messages** | Threaded reply preview in the composer |
| **Audio recording** | Record and send voice messages directly in-chat (MediaRecorder API) |
| **Typing indicators** | Live whisper events via Echo private channels |
| **Message search** | Full-text search with 350ms debounce and cursor pagination |
| **Per-channel drafts** | Draft text persisted in `localStorage` per channel |

### 📎 Files & Media

| Feature | Details |
|---|---|
| **Chunked file uploads** | Multi-chunk upload with live progress tracking and cancellation |
| **Video streaming** | HTTP Range Requests (206 Partial Content) for efficient playback |
| **Video thumbnails** | Auto-generated server-side thumbnails |
| **Attachment preview** | Full-screen modal for images, videos, and files |
| **Shared media panel** | Per-channel media and file browser |

### 🤖 AI & Premium

| Feature | Details |
|---|---|
| **AI reply suggestions** | Google Gemini API (rate-limited 6 req/min per user) |
| **Premium subscription** | PayPal checkout (1, 3, or 12 months) with idempotent capture |
| **Message retention** | Free users: 90-day retention; Premium: unlimited history |

### 🔐 Security & Auth

| Feature | Details |
|---|---|
| **Authentication** | Laravel Breeze (session-based, via Inertia) |
| **End-to-end encryption** | ECDH P-256 + AES-GCM-256; public keys stored server-side |
| **Online presence** | Public Echo Presence channel |
| **Read tracking** | Per-channel `last_read_message_id` with unread counts |

### 🧑‍💼 Admin Panel

| Capability | Details |
|---|---|
| **User management** | Create, promote to admin, demote, block/unblock, delete |
| **Message reporting** | Users report messages; admins review and resolve |
| **User search** | Filter and paginate users |

---

## 🛠️ Tech Stack

### Backend

| Package | Version | Role |
|---|---|---|
| PHP | ^8.3 | Runtime |
| laravel/framework | ^13.0 | Core framework |
| inertiajs/inertia-laravel | ^2.0 | Server-side Inertia adapter |
| laravel/reverb | ^1.0 | Self-hosted WebSocket server |
| laravel/sanctum | ^4.0 | Session & token authentication |
| laravel/horizon | ^5.47 | Queue dashboard & monitoring |
| tightenco/ziggy | ^2.0 | Named Laravel routes in JS |
| pusher/pusher-php-server | `*` | Required by Reverb's transport layer |

> All versions taken directly from `composer.json`.

### Frontend

| Package | Version | Role |
|---|---|---|
| react | ^18.2 | UI library |
| @inertiajs/react | ^2.0 | Client-side Inertia adapter |
| @laravel/echo-react | ^2.3 | Echo hooks for React |
| laravel-echo | ^2.3 | WebSocket client |
| tailwindcss | ^4.3 | Utility-first CSS |
| daisyui | ^5.5 | Tailwind component library |
| @headlessui/react | ^2.2 | Accessible unstyled components |
| @heroicons/react | ^2.2 | SVG icon library |
| typescript | ^5.0 | Type safety (strict mode) |
| vite | ^7.0 | Frontend build tool |
| emoji-picker-react | ^4.18 | Emoji picker |
| react-markdown + rehype-sanitize | ^10.1 / ^6.0 | Safe markdown rendering |
| idb-keyval | ^6.2 | IndexedDB for E2EE private key storage |
| uuid | ^13.0 | Client-side unique IDs |

> All versions taken directly from `package.json`.

### Infrastructure

| Service | Technology | Role |
|---|---|---|
| App (PHP-FPM) | PHP 8.3 + Laravel | Application server |
| Web server | Nginx 1.27-alpine | Reverse proxy & static files |
| Database | MySQL 8.0 | Primary relational store |
| Cache / Queue / Sessions | Redis 7 (AOF persistence) | Fast ephemeral storage |
| Queue manager | Laravel Horizon | Queue monitoring & worker management |
| WebSocket server | Laravel Reverb | Real-time event broadcasting |
| File storage (dev) | MinIO | S3-compatible local object storage |
| File storage (prod) | AWS S3 | Cloud object storage |
| Mail catcher (dev) | Mailpit | Intercept and inspect outgoing mail |

---

## 🏗️ Architecture Overview

The codebase enforces clear separation of concerns through 8 applied design patterns:

```
Controllers  →  Form Requests (validate)  →  Services (business logic)
                                           →  Repositories (Eloquent queries)
                                           →  API Resources (JSON shape)
```

| Pattern | Location | Purpose |
|---|---|---|
| **Service Layer** | `app/Services/` | `ChannelService`, `MessageService`, `ChunkUploadService`, `VideoThumbnailService`, `MessageSuggestionService`, `PremiumCheckoutService` |
| **Repository Pattern** | `app/Repositories/Eloquent/` | `ChannelRepo`, `MessageRepo` behind interfaces — Eloquent queries out of services |
| **Observer Pattern** | `app/Observers/MessageObserver` | Handles `last_message_id` atomic update and attachment cleanup on message create/delete |
| **Template Method** | `app/Patterns/TemplateMethod/DirectChannel/` | `DirectCreator` (plain DM) and `E2EEDirectCreator` (encrypted DM) share abstract base |
| **Adapter Pattern** | `app/Adapters/GeminiMessageSuggestionAdapter` | Implements `MessageSuggestionProvider` contract — swap AI providers by rebinding |
| **Contract / Interface** | `app/Contracts/` | `MessageSuggestionProvider`, `PaymentGateway` — controllers depend on interfaces, not concretions |
| **Factory Pattern** | `app/Services/Payments/PaymentGatewayFactory` | Resolves payment gateway from config |
| **EventBus (Frontend)** | `resources/js/EventBus.tsx` | Cross-component event emission without prop drilling (`useEventBus()` → `emit()` / `on()`) |

### Real-Time Architecture

```
Browser  ──[WebSocket]──▶  Laravel Reverb (port 8080)
                                │
                          Laravel Events
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
  message.channel.{id}    user.{userId}         online
  (private channel)       (private channel)   (presence channel)
  MessageCreated          ChannelUpdated       Online users
  MessageDeleted          ChannelDeleted
  MessageReactionUpdated  ChannelReadUpdated
```

### E2EE Encryption Flow

```
Alice generates ECDH P-256 key pair  →  public key stored server-side  (PUT /users/public-key)
Alice opens E2EE DM with Bob         →  fetches Bob's public key        (GET /users/{user}/public-key)
Alice sends message                  →  ECDH shared secret → AES-GCM-256 encrypt in browser
                                     →  {is_encrypted: true, iv, ciphertext} stored in DB
                                        (content column is NULL — server never sees plaintext)
Bob receives message                 →  useChannelSockets decrypts before EventBus emit
```

---

## 🐳 Docker Services

```
compose.yml (development)                    compose.prod.yml (production)
─────────────────────────                    ────────────────────────────
app        PHP-FPM 8.3          (internal)   app        PHP-FPM (optimized)
nginx      Nginx 1.27-alpine    :8000        nginx      Nginx           :80/:443
mysql      MySQL 8.0            :3306        mysql      MySQL 8.0
redis      Redis 7-alpine       :6379        redis      Redis 7
horizon    Laravel Horizon      (internal)   horizon    Laravel Horizon
reverb     Laravel Reverb       :8080        reverb     Laravel Reverb
minio      MinIO (S3-compat)    :9000/:9001  —          (AWS S3 in production)
mailpit    Mailpit              :8025        —          (real SMTP in production)
```

> All services include proper `healthcheck` configurations. `horizon` depends only on Redis (not the app) to avoid the 120s app startup delay.

---

## 📁 Directory Structure

```
.
├── app/
│   ├── Adapters/              # GeminiMessageSuggestionAdapter
│   ├── Console/Commands/      # CancelExpiredPremiumPayments, PruneExpiredFreeUserMessages
│   ├── Contracts/             # MessageSuggestionProvider, PaymentGateway interfaces
│   ├── Events/                # MessageCreated, MessageDeleted, MessageReactionUpdated,
│   │                          #   ChannelDeleted, ChannelReadUpdated
│   ├── Http/
│   │   ├── Controllers/       # 11 thin controllers delegating to services
│   │   ├── Requests/          # 16 Form Request validation classes
│   │   └── Resources/         # 8 API Resources for JSON responses
│   ├── Jobs/                  # DeleteChannelJob, SendUserCreatedJob
│   ├── Mail/                  # UserCreated mailable
│   ├── Models/                # Channel, Message, MessageAttachment, MessageReaction,
│   │                          #   MessageReport, PremiumPayment, PremiumPaymentEvent, User
│   ├── Observers/             # MessageObserver
│   ├── Patterns/
│   │   └── TemplateMethod/DirectChannel/  # DirectCreator, E2EEDirectCreator
│   ├── Repositories/
│   │   ├── Eloquent/          # ChannelRepo, MessageRepo
│   │   └── Interfaces/
│   └── Services/              # ChannelService, MessageService, ChunkUploadService,
│                              #   VideoThumbnailService, MessageSuggestionService,
│                              #   PremiumCheckoutService, Payments/PaypalPaymentGateway
│
├── resources/js/
│   ├── Components/App/        # 47+ components (MessageInput, AudioRecorder, ReplyPreview,
│   │                          #   AttachmentPreviewModal, TypingIndicator, CodeBlock, ...)
│   ├── Contexts/              # E2EEContext, UploadContext, ConfirmContext,
│   │                          #   ChannelModalContext, UserModalContext
│   ├── hooks/                 # 18 custom hooks (useChannelSockets, useMessages,
│   │                          #   useTypingIndicator, useDraftMessages, useMessageSearch,
│   │                          #   useAiMessageSuggestion, useOnlinePresence, ...)
│   ├── Pages/
│   │   ├── Admin/             # Users.tsx, Reports.tsx
│   │   ├── Auth/              # Login, Register, ForgotPassword, ...
│   │   ├── Premium/           # Index.tsx (PayPal checkout)
│   │   ├── Profile/           # Edit.tsx
│   │   └── Home.tsx           # Main chat page
│   ├── types/                 # TypeScript type definitions (chat.d.ts, events.d.ts, ...)
│   └── utils/                 # crypto.ts, key-storage.ts, chunkedUpload.ts, ...
│
├── routes/
│   ├── web.php                # All application routes (Inertia-style, no separate API file)
│   ├── auth.php               # Breeze auth routes
│   ├── channels.php           # Broadcast channel authorization (online, message.channel, user)
│   └── console.php            # Artisan scheduled commands
│
├── tests/
│   └── Feature/               # 20+ PHPUnit feature tests
│
├── docker/                    # Nginx config, PHP config, entrypoint scripts
├── compose.yml                # Development Docker Compose (8 services)
├── compose.prod.yml           # Production Docker Compose
├── Makefile                   # Dev/prod lifecycle shortcuts
├── Dockerfile                 # Multi-stage build (development + production targets)
├── ansible/                   # Ansible playbooks for server provisioning
└── terraform/                 # Terraform IaC for cloud infrastructure
```

---

## ⚡ Quick Start

### Option A — Local Development (no Docker)

**Prerequisites:** PHP 8.3+, Composer, Node.js (LTS), MySQL

```bash
# 1. Clone
git clone https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger.git
cd laravel-react-messenger

# 2. One-command setup
#    (composer install → copy .env → key:generate → migrate → npm install → npm run build)
composer run-script setup
```

Then open `.env` and fill in database and service credentials (see [Environment Variables](#%EF%B8%8F-environment-variables)), then:

```bash
# Start all 4 processes concurrently (HTTP server, queue worker, Vite, Reverb)
composer run-script dev
```

| Process | Command | URL |
|---|---|---|
| HTTP server | `php artisan serve` | http://localhost:8000 |
| Queue worker | `php artisan queue:listen --tries=1 --timeout=0` | — |
| Vite dev server | `npm run dev` | (HMR assets) |
| Reverb WebSocket | `php artisan reverb:start --debug` | ws://localhost:8080 |

### Option B — Docker Compose

**Prerequisites:** Docker + Docker Compose

```bash
git clone https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger.git
cd laravel-react-messenger
cp .env.example .env   # edit credentials

# Start infrastructure first, then bring up full stack
make setup
```

App at **http://localhost:8000** · Horizon at `/horizon` · Mailpit at http://localhost:8025 · MinIO console at http://localhost:9001

---

## 🔧 Development Commands

### Composer Scripts

| Command | Description |
|---|---|
| `composer run-script setup` | First-time setup (install deps, copy `.env`, generate key, migrate, build assets) |
| `composer run-script dev` | Start all 4 processes concurrently |
| `composer run-script test` | Clear config cache + run PHPUnit suite |

### Makefile (Docker workflow)

| Command | Description |
|---|---|
| `make up` | Start dev stack, print service URLs |
| `make down` | Stop dev stack (keep volumes) |
| `make build` | Rebuild images (no cache) |
| `make shell` | Open bash in app container |
| `make tinker` | Laravel Tinker in container |
| `make migrate` | Run migrations |
| `make fresh` | Drop + migrate + seed |
| `make test` | Run PHPUnit suite |
| `make test-filter F=TestName` | Run filtered tests |
| `make pint` | Run Laravel Pint formatter |
| `make logs` | Tail app + horizon + reverb logs |
| `make horizon-pause` | Pause Horizon (stop accepting new jobs) |
| `make restart-reverb` | Graceful Reverb restart |
| `make prod-deploy` | Full deploy: install → build assets → restart containers |

### npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite HMR dev server |
| `npm run build` | `tsc && vite build` — TypeScript compile then bundle |
| `npm run lint` | ESLint + Prettier fix across `resources/js/` |

---

## ✅ Test Suite

Tests use **PHPUnit** (not Pest) against an **in-memory SQLite** database — no external database setup required.

```bash
php artisan test --compact                          # full suite
php artisan test --compact --filter=PremiumPayment  # filtered
```

| Test file | What it covers |
|---|---|
| `PremiumPaymentTest.php` | PayPal checkout, capture, idempotency, expiry cancellation |
| `ChunkUploadTest.php` | Multi-chunk upload, temp file merge, validation |
| `VideoStreamAndThumbnailTest.php` | Range request streaming, 206 responses, thumbnail generation |
| `MessageReactionTest.php` | Toggle reactions, broadcast events, aggregation |
| `AiMessageSuggestionTest.php` | Gemini adapter, rate limiting, 503 fallback |
| `MessageStoreTest.php` | Store with attachments, validation |
| `MessageDeleteTest.php` | Delete with broadcast, attachment cleanup |
| `GroupAuthorizationTest.php` | Channel membership access control |
| `UserAdminActionsTest.php` | Promote, demote, block, unblock |
| `CancelExpiredPremiumPaymentsTest.php` | Scheduled command integration |
| `PruneExpiredFreeUserMessagesTest.php` | 90-day retention logic |
| `ChannelUnreadTest.php` | `last_read_message_id` tracking |
| `UserSearchTest.php` | User search with pagination |
| + 7 more | Auth, profile, group delete flows, ... |

---

## ⚙️ Environment Variables

### Application

```env
APP_NAME=Laravel
APP_URL=http://localhost:8000
```

### Database

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel-react-messenger
DB_USERNAME=root
DB_PASSWORD=
```

> The test suite overrides `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:` via `phpunit.xml` — no separate setup needed.

### Session / Cache / Queue

```env
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Broadcasting (Reverb)

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

### File Storage

```env
# Development — MinIO (S3-compatible, runs as Docker service)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=messenger
AWS_ENDPOINT=http://localhost:9000
AWS_USE_PATH_STYLE_ENDPOINT=true

# Production — replace with real AWS S3 credentials
```

### Google Gemini (AI reply suggestions)

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
```

> Change `GEMINI_MODEL` to any valid Gemini model if needed.

### PayPal (Premium subscription)

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_PREMIUM_PRICE_CENTS=499
PAYPAL_PREMIUM_CURRENCY=USD
```

> Use `https://api-m.paypal.com` (not the sandbox URL) in production.

---

## 🔐 Security Highlights

| Mechanism | Implementation |
|---|---|
| **End-to-end encryption** | ECDH P-256 + AES-GCM-256 in browser; `content` stored as `NULL` — server never sees plaintext |
| **Session storage** | Redis-backed (not cookie-only) |
| **Channel authorization** | Broadcast channels gated by membership check in `channels.php` |
| **Rate limiting** | AI suggestions: `throttle:6,1` middleware |
| **CSRF protection** | Laravel's built-in CSRF via Inertia |
| **Input validation** | 16 Form Request classes with strict rules |
| **Admin gate** | `admin` middleware on all privileged routes |
| **Active user gate** | `active` middleware prevents blocked users from accessing the app |

---

## 💡 Key Technical Decisions

**Why Laravel Reverb instead of Pusher?**
Self-hosted WebSocket server — no third-party SaaS dependency, no per-message pricing, runs as a first-class Docker service alongside the app.

**Why Inertia.js instead of a separate REST API?**
Eliminates the need to maintain a separate API layer while retaining a full React SPA experience. Laravel handles routing and auth; Inertia handles page rendering and state hydration.

**Why Repository Pattern on top of Eloquent?**
`ChannelRepo` and `MessageRepo` behind interfaces make complex query logic independently testable and swappable without touching controllers or services.

**Why MinIO for development file storage?**
S3-compatible API means zero code changes between development (MinIO Docker service) and production (AWS S3) — only env vars differ.

**Why Laravel Horizon?**
`DeleteChannelJob` and `SendUserCreatedJob` run asynchronously. Horizon provides a real-time dashboard for monitoring queue throughput, job failures, and worker health — without any additional infrastructure.

---

## 📋 Scheduled Commands

Registered in `routes/console.php` and run by Laravel's built-in task scheduler:

| Command | Schedule | Description |
|---|---|---|
| `premium:cancel-expired-payments` | Hourly | Cancels PayPal orders not captured within 3 hours |
| `messages:prune-expired-free-users` | Daily | Deletes messages older than 90 days from non-premium senders |

---

## 🗺️ Route Overview

All routes use Inertia (no separate REST API file). Auth middleware: `auth + verified + active`.

| Group | Key Routes |
|---|---|
| **Channels** | `GET/POST /channels`, `GET/PUT/DELETE /channels/{channel}` |
| **Direct / E2EE** | `POST /channels/direct/{user}`, `POST /channels/secret-direct/{user}` |
| **Members** | `POST/DELETE /channels/{channel}/members/{user}` |
| **Messages** | `GET/POST /channels/{channel}/messages`, `GET .../messages/search` |
| **Chunked upload** | `POST /messages/upload-chunk` |
| **Reactions** | `POST /messages/{message}/reactions` |
| **AI Suggestions** | `POST /channels/{channel}/message-suggestions` (throttle: 6/min) |
| **Video Streaming** | `GET /attachments/{attachment}/stream` (Range Request / 206) |
| **Premium / PayPal** | `GET /premium`, `POST /premium/paypal/checkout`, `POST /premium/paypal/capture/{orderId}` |
| **E2EE Keys** | `PUT /users/public-key`, `GET /users/{user}/public-key` |
| **Admin** | `GET /admin/users`, `GET /admin/reports`, user CRUD + block/promote |
| **Profile** | `GET/PATCH/DELETE /profile` |

---

## 📋 Known Issues

- **`GroupFactory` references a non-existent model.** `database/factories/GroupFactory.php` is scaffolded against `App\Models\Group`, which does not exist. Groups are `Channel` records with `type = 'group'`. Always use `ChannelFactory` in tests.
- **Reverb must be running** for real-time features to work. If `BROADCAST_CONNECTION` is not set to `reverb`, all broadcasting falls back silently to the log driver.

---

## 🤝 Contributing

This is a personal/learning project and is not currently accepting external contributions. Feel free to fork it and adapt it to your own use case.

---

## 🙏 Acknowledgments

- **[Laravel](https://laravel.com)** — Elegant PHP framework
- **[Laravel Reverb](https://reverb.laravel.com)** — First-party self-hosted WebSocket server
- **[Inertia.js](https://inertiajs.com)** — The modern monolith
- **[React](https://react.dev)** — Declarative UI
- **[Vite](https://vitejs.dev)** — Blazing fast frontend tooling
- **[Tailwind CSS](https://tailwindcss.com)** + **[DaisyUI](https://daisyui.com)** — Utility-first styling

---

## 📄 License

This project is open-sourced software licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [Ngo-Viet-Hoang1](https://github.com/Ngo-Viet-Hoang1)

[Live Demo](https://twiliver.dev) · [Report Bug](https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger/issues) · [GitHub](https://github.com/Ngo-Viet-Hoang1/laravel-react-messenger)

</div>
