# Laravel React Messenger

> A full-featured, real-time chat application — built with Laravel 13, Inertia.js v2, React 18, and Laravel Reverb.

![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue)

Supports group channels, direct messaging with optional end-to-end encryption, emoji reactions, full-text message search, chunked file uploads, AI-powered reply suggestions (Google Gemini), a PayPal-based premium subscription, and a full admin panel.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running (Development)](#running-development)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Directory Structure](#directory-structure)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Real-time messaging** via Laravel Reverb (WebSockets) and Laravel Echo
- **End-to-end encrypted (E2EE) direct messages** — ECDH P-256 key exchange + AES-GCM-256, entirely in the browser
- **Emoji reactions** on messages
- **Full-text message search** with cursor-based pagination (350 ms debounce)
- **Chunked file uploads** with live progress tracking and cancellation
- **Video streaming** with HTTP Range Request support (206 Partial Content)
- **AI reply suggestions** powered by Google Gemini API (rate-limited 6/min per user)
- **Premium subscription** via PayPal (1, 3, or 12 months)
- **Admin panel** — user management (promote/demote/block), message report review
- **Typing indicators** via Echo whisper events
- **Per-channel draft persistence** in `localStorage`
- **Online presence** tracking via Echo Presence channels
- **Dark/light theme** toggle

---

## Tech Stack

### Backend

| Package                   | Version                                    |
| ------------------------- | ------------------------------------------ |
| PHP                       | ^8.3                                       |
| laravel/framework         | ^13.0                                      |
| inertiajs/inertia-laravel | ^2.0                                       |
| laravel/reverb            | ^1.0                                       |
| laravel/sanctum           | ^4.0                                       |
| laravel/tinker            | ^3.0                                       |
| tightenco/ziggy           | ^2.0                                       |
| pusher/pusher-php-server  | `*` (required by Reverb's transport layer) |

### Frontend

| Package                          | Version                                     |
| -------------------------------- | ------------------------------------------- |
| react                            | ^18.2                                       |
| @inertiajs/react                 | ^2.0                                        |
| @laravel/echo-react              | ^2.3                                        |
| laravel-echo                     | ^2.3                                        |
| tailwindcss                      | ^4.3                                        |
| daisyui                          | ^5.5                                        |
| @headlessui/react                | ^2.2                                        |
| @heroicons/react                 | ^2.2                                        |
| typescript                       | ^5.0                                        |
| vite                             | ^7.0                                        |
| emoji-picker-react               | ^4.18                                       |
| react-markdown + rehype-sanitize | ^10.1 / ^6.0                                |
| idb-keyval                       | ^6.2 (IndexedDB — E2EE private key storage) |
| uuid                             | ^13.0                                       |

> All versions are taken directly from `composer.json` and `package.json`.

---

## Architecture Overview

The codebase follows several well-defined patterns to keep business logic out of controllers:

- **Service Layer** (`app/Services/`) — `ChannelService`, `MessageService`, `ChunkUploadService`, `VideoThumbnailService`, `MessageSuggestionService`, `PremiumCheckoutService`.
- **Repository Pattern** (`app/Repositories/Eloquent/`) — `ChannelRepo` and `MessageRepo` behind interfaces in `app/Repositories/Interfaces/`, keeping Eloquent queries out of services.
- **Form Requests + API Resources** — all incoming data is validated via Form Requests; all outgoing JSON is shaped through API Resources (never raw `toArray()` on models).
- **Observer Pattern** (`app/Observers/MessageObserver`) — handles `channels.last_message_id` updates and attachment cleanup on message create/delete.
- **Template Method Pattern** (`app/Patterns/TemplateMethod/DirectChannel/`) — `DirectChannelCreator` (abstract), `DirectCreator` (plain DM), `E2EEDirectCreator` (encrypted DM).
- **Adapter Pattern** (`app/Adapters/GeminiMessageSuggestionAdapter`) — implements `app/Contracts/MessageSuggestionProvider`; swap AI providers by rebinding the contract in a service provider.
- **Payment Gateway Abstraction** (`app/Contracts/PaymentGateway`) — `PaypalPaymentGateway` + `PaymentGatewayFactory`; `PremiumController` is decoupled from PayPal specifics.
- **EventBus Pattern** (frontend, `resources/js/EventBus.tsx`) — cross-component event emission without prop drilling (`useEventBus()` → `emit()` / `on()`).

---

## Requirements

- PHP 8.3+
- Composer
- Node.js (LTS) + npm
- **MySQL** — used for development and production (configured via `DB_*` env vars)
- A running Reverb server — started automatically by `composer run-script dev`

> The test suite uses an **in-memory SQLite** database (configured in `phpunit.xml`) — no separate SQLite installation is required for development.

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url> laravel-react-messenger
cd laravel-react-messenger

# 2. One-command setup
composer run-script setup
```

The `setup` script performs the following steps in order:

1. `composer install`
2. Copies `.env.example` → `.env` (if `.env` does not already exist)
3. `php artisan key:generate`
4. `php artisan migrate --force`
5. `npm install`
6. `npm run build`

Then open `.env` and fill in the database connection and service credentials listed in the [Environment Variables](#environment-variables) section.

---

## Running (Development)

```bash
composer run-script dev
```

This starts **four processes concurrently** via `concurrently`:

| Process                 | Command                                          |
| ----------------------- | ------------------------------------------------ |
| HTTP server             | `php artisan serve` → http://localhost:8000      |
| Queue worker            | `php artisan queue:listen --tries=1 --timeout=0` |
| Vite dev server         | `npm run dev`                                    |
| Reverb WebSocket server | `php artisan reverb:start --debug`               |

---

## Testing

Tests use **PHPUnit** (not Pest) and run against an **in-memory SQLite** database automatically configured in `phpunit.xml` — no extra database setup is needed for testing.

```bash
# Run the full test suite
php artisan test --compact

# Run a specific file
php artisan test --compact tests/Feature/ExampleTest.php

# Filter by test name
php artisan test --compact --filter=testName
```

---

## Environment Variables

Copy `.env.example` to `.env` (done automatically by `composer run-script setup`) and configure:

### Application

```env
APP_NAME=Laravel
APP_URL=http://localhost
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

### Broadcasting (Reverb)

These variables are not in `.env.example` by default — add them after running `php artisan reverb:install` or set them manually:

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Google Gemini (AI reply suggestions)

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
```

> The model name `gemini-3.1-flash-lite` is the default in `config/services.php`. Change it to another valid Gemini model if needed.

### PayPal (Premium subscription)

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_PREMIUM_PRICE_CENTS=499
PAYPAL_PREMIUM_CURRENCY=USD
```

> Use `https://api-m.paypal.com` for production (not the sandbox URL above).

---

## Directory Structure

```
.
├── app/
│   ├── Adapters/          # GeminiMessageSuggestionAdapter
│   ├── Contracts/         # MessageSuggestionProvider, PaymentGateway interfaces
│   ├── Events/            # Broadcast events (MessageCreated, MessageDeleted,
│   │                      #   MessageReactionUpdated, ChannelDeleted, ChannelReadUpdated)
│   ├── Http/
│   │   ├── Controllers/   # Thin controllers delegating to services
│   │   ├── Requests/      # Form Request validation classes
│   │   └── Resources/     # API Resources for JSON responses
│   ├── Jobs/              # DeleteChannelJob, SendUserCreatedJob
│   ├── Mail/              # UserCreated mailable
│   ├── Models/            # Channel, Message, MessageAttachment, MessageReaction,
│   │                      #   MessageReport, PremiumPayment, PremiumPaymentEvent, User
│   ├── Observers/         # MessageObserver
│   ├── Patterns/
│   │   └── TemplateMethod/DirectChannel/  # DirectCreator, E2EEDirectCreator
│   ├── Repositories/
│   │   ├── Eloquent/      # ChannelRepo, MessageRepo
│   │   └── Interfaces/
│   └── Services/          # ChannelService, MessageService, ChunkUploadService,
│                          #   VideoThumbnailService, MessageSuggestionService,
│                          #   PremiumCheckoutService, Payments/PaypalPaymentGateway
│
├── resources/js/
│   ├── Contexts/          # E2EEContext, UploadContext, ConfirmContext,
│   │                      #   ChannelModalContext, UserModalContext
│   ├── hooks/             # useChannelSockets, useMessages, useSendMessage,
│   │                      #   useTypingIndicator, useDraftMessages, useMessageSearch,
│   │                      #   useAiMessageSuggestion, useAdminUsers, and more
│   ├── Pages/
│   │   ├── Admin/         # Users.tsx, Reports.tsx
│   │   ├── Auth/          # Login, Register, etc.
│   │   ├── Premium/       # Index.tsx (PayPal checkout)
│   │   ├── Profile/       # Edit.tsx
│   │   └── Home.tsx       # Main chat page
│   ├── types/             # TypeScript type definitions (chat.d.ts, events.d.ts, …)
│   └── utils/             # crypto.ts, key-storage.ts, chunkedUpload.ts, etc.
│
└── routes/
    ├── web.php            # All application routes
    ├── auth.php           # Breeze auth routes
    ├── channels.php       # Broadcast channel authorization
    └── console.php        # Artisan console commands
```

---

## Known Issues

- **`GroupFactory` references a non-existent model.** `database/factories/GroupFactory.php` is scaffolded against `App\Models\Group`, which does not exist. Groups are `Channel` records with `type = 'group'`. Always use `ChannelFactory` in tests.
- **Reverb must be running** for real-time features to work. If `BROADCAST_CONNECTION` is not set to `reverb`, all broadcasting falls back silently to the log driver.

---

## Contributing

This is a personal/learning project. It is not currently accepting external contributions, but feel free to fork it and adapt it to your own use case.

---

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
