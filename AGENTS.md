<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v2
- laravel/framework (LARAVEL) - v13
- laravel/reverb (REVERB) - v1
- laravel/sanctum (SANCTUM) - v4
- laravel/tinker (TINKER) - v3
- tightenco/ziggy (ZIGGY) - v2
- laravel/boost (BOOST) - v2
- laravel/breeze (BREEZE) - v2
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v2
- @laravel/echo-react (ECHO_REACT) - v2
- eslint (ESLINT) - v8
- laravel-echo (ECHO) - v2
- prettier (PRETTIER) - v3
- react (REACT) - v18
- tailwindcss (TAILWINDCSS) - v4

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `laravel-best-practices` — Apply this skill whenever writing, reviewing, or refactoring Laravel PHP code. This includes creating or modifying controllers, models, migrations, form requests, policies, jobs, scheduled commands, service classes, and Eloquent queries. Triggers for N+1 and query performance issues, caching strategies, authorization and security patterns, validation, error handling, queue and job configuration, route definitions, and architectural decisions. Also use for Laravel code reviews and refactoring existing Laravel code to follow best practices. Covers any task involving Laravel backend PHP code patterns.
- `inertia-react-development` — Develops Inertia.js v2 React client-side applications. Activates when creating React pages, forms, or navigation; using <Link>, <Form>, useForm, or router; working with deferred props, prefetching, or polling; or when user mentions React with Inertia, React pages, React forms, or React navigation.
- `echo-react-development` — Develops real-time broadcasting in React applications with Laravel Echo. Activates when configuring Echo in React (configureEcho); using hooks (useEcho, useEchoPublic, useEchoPresence, useEchoModel, useEchoNotification, useConnectionStatus); listening for broadcast events in React components; implementing client events (whisper) in React; or when the user mentions Echo with React, real-time React hooks, or broadcasting in React components.
- `echo-development` — Develops real-time broadcasting with Laravel Echo. Activates when setting up broadcasting (Reverb, Pusher, Ably); creating ShouldBroadcast events; defining broadcast channels (public, private, presence, encrypted); authorizing channels; configuring Echo; listening for events; implementing client events (whisper); setting up model broadcasting; broadcasting notifications; or when the user mentions broadcasting, Echo, WebSockets, real-time events, Reverb, or presence channels.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.
- `deploy-to-vercel` — Use for deploying the application or generating a preview deployment via Vercel.
- `vercel-composition-patterns` — Apply when refactoring components with boolean prop proliferation, building flexible component libraries, or designing reusable APIs using compound components, render props, or context providers.
- `vercel-react-best-practices` — Apply when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns.
- `web-design-guidelines` — Use to review UI code against Web Interface Guidelines compliance, accessibility, and UX best practices.

**Agent Skill Configuration (`boost.json`)**:

- The `boost.json` file in the project root configures which domain-specific skills are enabled for AI engines (e.g. `laravel-best-practices`, `inertia-react-development`, etc.). Ensure any new or custom skills are listed in `boost.json` to allow correct loading by agents.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.
- Frontend: Use TypeScript strict mode (`strict: true`). Write explicit type annotations for function parameters and return types. Example: `const toggleGroup = (groupId: number): void => {...}`.
- Backend: Use Form Requests for validation (e.g., `StoreMessageRequest`, `UpdateChannelRequest`). Use API Resources for data transformation (e.g., `UserResource`, `MessageResource`).
- Model serialization: Do not write custom serialization methods like `toConversationArray` or `toArray` directly on Eloquent models for frontend responses; always use API Resources.
- RESTful nested routing: Nest subresources logically under channels (e.g., `/channels/{channel}/messages`, `/channels/{channel}/members`). Avoid flat endpoint names.
- Two-Tier API Resources: Use `ChannelResource` for the lightweight sidebar channel listings and `ChannelDetailResource` (which extends `ChannelResource`) for active, opened channels.
- Use Inertia page names that map to file paths under `resources/js/Pages`.
- Use the `@/` alias for imports from `resources/js` (configured in `tsconfig.json`).
- Keep auth-protected routes inside middleware groups and preserve route names used by frontend `route()` calls.
- Tailwind scan targets include Blade and TSX files; keep UI code in scanned paths so styles compile.
- Prefer additive migration changes; do not edit old migrations unless explicitly requested.

## Frontend State & Broadcasting

- Real-time messaging uses an **EventBus pattern** (`EventBus.tsx`, `EventBusProvider`) for cross-component event emission. Use `useEventBus()` to access `emit()` and `on()` methods for app-level events.
- **EventBus Events** (defined in `AppEventMap` in `resources/js/types/events.d.ts`):
    - `message.created`: Fired when a message is created (payload: `ChatMessage`).
    - `message.deleted`: Fired when a message is deleted (payload: `MessageDeletedEvent` `{message: ChatMessage, newLastMessage: ChatMessage | null}`).
    - `message.reaction.updated`: Fired when reactions change (payload: `MessageReactionUpdatedEvent` `{message_id, channel_id, reactions: MessageReactionGroup[]}`).
    - `channel.deleted`: Fired when a channel is deleted (payload: `ChannelDeletedEvent` `{id: number, name: string}`).
    - `channel.read.updated`: Fired when a channel is marked as read (payload: `ChannelReadUpdatedEvent` `{channel_id, user_id, last_read_message_id}`).
    - `toast.show`: Triggers a toast notification with the given message (payload: `string`).
- **Echo/Reverb hooks** in `resources/js/hooks/` manage real-time subscriptions and app state:
    - `useChannelSockets`: Subscribes to message channels (`message.channel.{channelId}`) and user channels (`user.{userId}`); emits `message.created`, `message.deleted`, `message.reaction.updated` on incoming events; emits `channel.deleted` and `channel.read.updated` on user channel events. Also handles E2EE decryption of incoming encrypted messages via `useE2EE`.
    - `useChannels`: Manages sidebar channel lists, last message updates, and sidebar metadata when `ChannelUpdated` or message events are received.
    - `useMessages`: Manages message lists, appends new messages, and handles deletions.
    - `useSendMessage`: Handles message creation via API and UI feedback.
    - `useAttachments`: Manages file uploads (max 10 files, 1MB each per `StoreMessageRequest`).
    - `useErrorMessage`: Displays error feedback to users.
    - `useTheme`: Manages UI theme state.
    - `useOnlinePresence`: Subscribes to the public `online` Presence channel to track online statuses of peer users.
    - `useInfiniteScroll`: Utilizes `IntersectionObserver` to trigger cursor pagination for infinite scrolling through older messages.
    - `useChatScroll`: Handles scroll position management (including auto-scroll and stick-to-bottom) for reverse-scroll layouts (`flex-col-reverse`).
    - `useAttachmentsPreviewModal`: Manages open/close states and currently selected media for file/image preview modals.
    - `useTypingIndicator`: Sends and receives whisper events (`typing`) over Echo private channels to show live typing indicators. Uses debounced emit and auto-expiry timers.
    - `useDraftMessages`: Persists per-channel draft text in `localStorage` (`draft:{channelId}` key); restores on channel switch.
    - `useMessageSearch`: Debounced full-text search against `GET /channels/{channel}/messages/search` with cursor pagination and cancel-token cleanup.
    - `useAiMessageSuggestion`: Calls `POST /channels/{channel}/message-suggestions` (rate-limited 6/min) to generate AI reply suggestions via Gemini.
    - `useAdminUsers`: Fetches and manages the user list for the admin panel with filtering, pagination, and CRUD operations.
    - `useUserSearch`: Searches users for adding members or starting DMs.
    - `useDebounce`: Utility debounce hook used internally by search hooks.
- **Broadcast Channels** (defined in `routes/channels.php`):
    - `online`: Public Presence channel for tracking online users.
    - `message.channel.{channelId}`: Private channel for message broadcasting, authorized if the user is a member of that channel.
    - `user.{userId}`: Private channel for user-specific notifications (e.g. `ChannelDeleted`, `ChannelUpdated`, `ChannelReadUpdated` updates).
- **Real-Time Events**:
    - `MessageCreated`: Broadcasts on `message.channel.{channelId}` (payload: `{message: MessageResource}`) to notify others of new messages.
    - `MessageDeleted`: Broadcasts on `message.channel.{channelId}` (payload: `{message, newLastMessage}`) — no longer client-only; uses `ShouldBroadcastNow`.
    - `MessageReactionUpdated`: Broadcasts on `message.channel.{channelId}` (payload: `{message_id, channel_id, reactions}`) when a reaction is toggled.
    - `ChannelUpdated`: Broadcasts on `user.{userId}` to all channel members to update their sidebar list with the latest metadata and members (payload: `{channel: ...}`).
    - `ChannelDeleted`: Broadcasts on `user.{userId}` when a group is deleted (payload: `{id, name}`).
    - `ChannelReadUpdated`: Broadcasts on `user.{userId}` when a user marks a channel as read (payload: `{channel_id, user_id, last_read_message_id}`).
- Realtime/broadcasting plumbing exists, but channel/event wiring may be incomplete; verify end-to-end flow before claiming realtime behavior works.
- Always unsubscribe from channels on component unmount to prevent memory leaks.

## Frontend UI Libraries

- **daisyui** (v5+) provides pre-built Tailwind components; use classes like `btn`, `card`, `input` instead of creating primitives.
- **@headlessui/react** (v2.2+) for unstyled, accessible components (dropdowns, dialogs, menus, transition-wrapped elements). Used widely in `Dropdown`, `Modal`, etc.
- **@heroicons/react** (v2.2+) for SVG icons. Use it instead of custom SVGs when possible.
- **emoji-picker-react** for emoji selection in message composer.
- **react-markdown** with **rehype-sanitize** for rendering markdown in messages safely.
- **uuid** for client-side unique identifier generation.
- **Modal Context Utility (`createModalContext.tsx` in `resources/js/utils/`)**: A generic context factory used to build type-safe, lazy-loaded modal state contexts, eliminating layout boilerplate for modally-driven views.
- **App Modals & Dialogs**:
    - `CreateOrEditGroupModal`: Accessible group creation and editing dialog under `resources/js/Components/App/`.
    - `CreateOrEditUserModal`: Accessible user management modal for administration under `resources/js/Components/App/`.
    - `AddMemberModal`: Modal for adding a member to a group channel.
    - `ReportMessageModal`: Modal for reporting a message (under `resources/js/Components/App/`).
    - `AttachmentPreviewModal`: Full-screen media preview modal for images/videos/files.
- Prefer existing components in `resources/js/Components/` over creating new UI primitives.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.
- Initial setup: `composer run-script setup`.
- Full local dev stack (server, queue, Reverb, Vite): `composer run-script dev`.
- Run tests: `php artisan test` (test environment uses in-memory SQLite from `phpunit.xml`).

## Backend Patterns

- **Form Requests** validate and authorize incoming data. Create with `php artisan make:request StoreMessageRequest --no-interaction`. Define `rules()` method with all validation constraints (e.g., `required_without`, `prohibited_with`, `Rule::exists()`, `Rule::notIn()`). Use the `authorize()` method for policy checks.
- **API Resources** transform models for JSON responses. Create with `php artisan make:resource MessageResource --no-interaction`. Use in controllers: `return MessageResource::collection($messages)`. Leverage resource wrapping and conditional attributes for fine-grained API control.
- **Eloquent Scopes**:
    - `Message` model: Defines `scopeForChannel` (fetches messages for a channel) and `scopeBeforeCursor` (handles cursor pagination queries based on timestamps and message IDs).
    - `MessageAttachment` model: Defines `scopeDeleteAllForChannel` (cleans up channel attachment records in bulk).
- **Observers & Model Lifecycle**: The `MessageObserver` manages database consistency and cleanup on model operations:
    - `created`: Performs a conditional atomic update on `channels.last_message_id` to handle concurrent inserts without race conditions.
    - `deleting`: Cleans up and deletes attachment directories from storage before database records are deleted.
    - `deleted`: Recomputes `last_message_id` for the channel if and only if the deleted message was the current last message.
- **Asynchronous Deletion Jobs**: `DeleteChannelJob` handles background group channel deletion. It collects attachment directories, zeroes out `last_message_id` to avoid foreign key constraints, deletes database records, physically deletes attachment directories from storage, detaches members, deletes the channel, and dispatches a `ChannelDeleted` event to every channel member.
- **Mailables**: The `UserCreated` mailable (`app/Mail/UserCreated.php`) is sent automatically when an administrator creates a new user, notifying them of their account creation.
- **Services** (`app/Services/`): Encapsulate business logic extracted from controllers.
    - `ChannelService`: Channel creation, member management, read-tracking, and deletion orchestration.
    - `MessageService`: Message retrieval (`getMessagesForChannel`, `searchMessages`).
    - `MessageSuggestionService`: Delegates to `MessageSuggestionProvider` contract to generate AI suggestions.
    - `ChunkUploadService`: Handles multi-chunk large file uploads; chunks are stored in `storage/app/` temp directories and merged on final chunk.
    - `VideoThumbnailService`: Generates video thumbnails after upload.
    - `PremiumCheckoutService`: Orchestrates PayPal order creation and capture for premium subscriptions.
- **Repository Pattern** (`app/Repositories/Eloquent/`): `ChannelRepo` and `MessageRepo` wrap Eloquent queries behind interfaces in `app/Repositories/Interfaces/` for testability. Use these when adding complex query logic rather than putting raw Eloquent in controllers or services.
- **Template Method Pattern** (`app/Patterns/TemplateMethod/DirectChannel/`): `DirectChannelCreator` (abstract), `DirectCreator`, and `E2EEDirectCreator` encapsulate the two variants of creating a direct channel (plain vs. E2EE). Do not duplicate this logic inline.
- **Adapters** (`app/Adapters/`): `GeminiMessageSuggestionAdapter` implements `MessageSuggestionProvider` using the Gemini API. Swap adapters by rebinding the contract in a service provider.
- **Contracts** (`app/Contracts/`): `MessageSuggestionProvider` (AI text generation) and `PaymentGateway` (payment processing). Always program to these interfaces, not concrete implementations.
- **Payment Gateway** (`app/Services/Payments/`): `PaypalPaymentGateway` implements `PaymentGateway`. `PaymentGatewayFactory` resolves the correct gateway from config. Do not hardcode PayPal references in `PremiumController`.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.
- Backend is Laravel 13 in `app/` with route entry points in `routes/web.php`, `routes/auth.php`, `routes/channels.php`, and `routes/console.php`. The `routes/console.php` registers an `inspire` command.
- Backend routing utilizes `active` middleware alongside standard auth, and role-based actions (e.g., promote/demote/block) are protected by `admin` middleware.
- Frontend is Inertia + React in `resources/js/` with pages resolved from `resources/js/Pages/**/*.tsx` in `resources/js/app.tsx`.
- **Profile Edit Page**: The user profile management interface lives in `resources/js/Pages/Profile/Edit.tsx` and utilizes sub-components: `UpdateProfileInformationForm.tsx`, `UpdatePasswordForm.tsx`, and `DeleteUserForm.tsx`.
- **Admin Pages**: `resources/js/Pages/Admin/Users.tsx` (user management) and `resources/js/Pages/Admin/Reports.tsx` (message report review). Routes: `GET /admin/users` (`admin.users.index`) and `GET /admin/reports` (`admin.reports.index`).
- **Premium Page**: `resources/js/Pages/Premium/Index.tsx` — PayPal checkout flow for premium subscriptions. Routes: `GET /premium`, `POST /premium/paypal/checkout`, `POST /premium/paypal/capture/{orderId}`.
- **Sidebar Loading Performance**: Eager loading is used to fetch channels in `HomeController@index` and `ChannelController@show`. In the frontend, selecting a channel does a partial reload via Inertia request options (e.g. updating the active channel state and reloading message data), which preserves the already loaded sidebar channels without re-fetching them from the server.
- **Message Loading & Cursor Pagination**: `MessageController@index` supports loading older messages using cursor pagination. It queries messages with compound cursor parameters `before_id` and `before_at` to load pages smoothly and avoid duplicate/skipped messages.
- **Message Search**: `GET /channels/{channel}/messages/search` (route name `channels.messages.search`) accepts `query` and `page` params, returns paginated `MessageResource` collection. Frontend: `useMessageSearch` hook with 350ms debounce and cancel-token management.
- **Message Reactions**: `POST /messages/{message}/reactions` (route `messages.reactions.toggle`) — toggles emoji reactions. `MessageReaction` model stores `message_id`, `user_id`, `emoji`. On toggle, broadcasts `MessageReactionUpdated` event. `MessageReactionResource::aggregateForMessage()` groups reactions by emoji with counts and user IDs.
- **Message Reporting**: `POST /messages/{message}/report` (route `messages.report`) stores a `MessageReport`. Admins review via `PATCH /admin/reports/{messageReport}` (route `admin.reports.review`). `MessageReportController` handles both endpoints.
- **Chunked File Uploads**: Large files are uploaded via `POST /messages/upload-chunk` (route `messages.upload-chunk`) using `ChunkUploadService`. Frontend `UploadContext` (`resources/js/Contexts/UploadContext.tsx`) manages active upload tasks with progress tracking and cancellation. After all chunks land, the temp file is moved to public storage during `MessageController@store` when `uploaded_attachments` are present. Use `useUploads()` hook to access `uploadFile`, `cancelUpload`, `clearUpload`.
- **Video Streaming**: `GET /attachments/{attachment}/stream` (route `attachments.stream`) — `VideoStreamController` serves media with HTTP Range Requests (206 Partial Content) for efficient video playback.
- **AI Message Suggestions**: `POST /channels/{channel}/message-suggestions` (route `channels.message-suggestions.store`, throttle 6/min). `AiMessageSuggestionController` delegates to `MessageSuggestionService` → `MessageSuggestionProvider` interface → `GeminiMessageSuggestionAdapter`. Returns `503` when AI is unavailable (`MessageSuggestionUnavailableException`).
- **E2EE (End-to-End Encryption)**: Direct channels can be created as E2EE via `POST /channels/secret-direct/{user}` (route `channels.secret-direct`). E2EE uses ECDH P-256 key exchange + AES-GCM-256 encryption (via Web Crypto API). Key management lives in `resources/js/utils/crypto.ts` and `resources/js/utils/key-storage.ts`. The `E2EEProvider` context (`resources/js/Contexts/E2EEContext.tsx`) exposes `encryptForUser`, `decryptForPeer`, and `isE2EEReady`. User public keys are stored server-side via `PUT /users/public-key` (route `users.key.update`, handled by `UserKeyController`). Encrypted messages have `is_encrypted: true`, `iv`, and `ciphertext` fields; `content` is stored as `null` in the DB. `useChannelSockets` automatically decrypts incoming E2EE messages before emitting them to the EventBus.
- **Channel Read Tracking**: `POST /channels/{channel}/read` (route `channels.read`) marks a channel as read and broadcasts `ChannelReadUpdated` on the `user.{userId}` private channel. Frontend unread counts are tracked via `last_read_message_id` on `ChatItem`.
- Authentication baseline comes from Breeze-style controllers/pages; preserve middleware and named-route patterns.
- Global and feature-specific UI states are managed via React Context providers in `resources/js/Contexts/` (e.g., `ConfirmProvider` in `ConfirmContext.tsx` for confirmations; `ChannelModalProvider`/`UserModalProvider` for modals; `E2EEProvider` for encryption state; `UploadProvider` for chunked upload task management).
- Real-time stack uses Reverb/Echo (`configureEcho` in `resources/js/app.tsx`).
- **Models**: `Channel`, `Message`, `MessageAttachment`, `MessageReaction`, `MessageReport`, `PremiumPayment`, `PremiumPaymentEvent`, `User`. Do NOT create a `Group` model — groups are represented by `Channel` with `type='group'`.
- `README.md` is mostly upstream Laravel boilerplate; prioritize repository files over README assumptions.

## Frontend Bundling

- Frontend builds via Vite (`vite.config.js`, `laravel-vite-plugin`). **TypeScript compiles first** (`npm run build` runs `tsc && vite build`).
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.
- **Linting and formatting**: Run `npm run lint` to fix ESLint + Prettier violations across `resources/js/`. The project uses `eslint-plugin-react` and `@typescript-eslint/parser`.
- **Vite manifest error**: If you receive "Unable to locate file in Vite manifest", run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Frontend TypeScript Patterns

- Strictly use TypeScript strict mode. Never use `any` without explicit `// @ts-expect-error` or casting via `as`.
- Use **discriminated unions** for event types (see `AppEventMap` in `types/`).
- Define **types in `resources/js/types/`** (not inline in components). Export as default or named exports for reuse.
- Hook return types must be explicit: `const data = useSendMessage(): { isPending: boolean } => {...}`.
- Use **Record<K, V>** for typed object maps instead of plain objects.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
    - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.
- **Known Issues / Gotchas**:
    - `database/factories/GroupFactory.php` references `App\Models\Group` which does not exist in this application. The primary model representing both group and direct conversations is `App\Models\Channel`. Do not rely on `GroupFactory` for creating group channels; instead, use `ChannelFactory` with the appropriate state or attributes.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/Pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v2

- Use all Inertia features from v1 and v2. Check the documentation before making changes to ensure the correct approach.
- New features: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `php artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should cover all happy paths, failure paths, and edge cases.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files; these are core to the application.

## Running Tests

- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `php artisan test --compact`.
- To run all tests in a file: `php artisan test --compact tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --compact --filter=testName` (recommended after making a change to a related file).

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
