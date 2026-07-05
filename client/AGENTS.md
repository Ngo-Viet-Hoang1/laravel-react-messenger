# Frontend Architectural Guidelines (React 19 + TypeScript + Vite + FSD)

These rules govern all frontend development inside `client/`.

---

## 0. Workspace Governance & Integrity

1. **Strictly Never Modify Files in `archive/`**:
   - The directory `archive/` is an immutable legacy codebase. Never edit, format, or delete anything inside `archive/`.
   - All active frontend development is strictly confined within `client/`.

2. **Mandatory Contract Synchronization (Single Source of Truth)**:
   - Every time backend endpoints, DTOs, or schema changes occur, **MUST** run `pnpm run api:generate` (or `pnpm --dir client run api:generate`) to refresh `./src/shared/api/schema.d.ts`.
   - All frontend types, API clients, and TanStack queries MUST match directly with `schema.d.ts`. Zero manual type drift allowed.

---

## 1. Feature-Sliced Design (FSD) Directory Hierarchy

All code under `client/src/` must adhere to strict downward dependency flow (`app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`). Never import upward or cross-import on the same layer without public API (`index.ts`).

1. **`app/`**: Composition root, global styles (`index.css`), layout templates (`layouts/AuthLayout.tsx`, `layouts/WorkspaceLayout.tsx`), provider stack (`QueryProvider`, `AuthProvider`, `StoreProvider`), route definitions (`routes/router.tsx`).
2. **`pages/`**: Thin composition containers. Pages must **not** become "God Components" (keep them under ~50 lines by assembling widgets). Example: `ChatPage.tsx` delegates directly to `<ChatPane />`.
3. **`widgets/`**: Self-contained UI blocks composed of multiple features and entities. Examples: `WorkspaceHeader`, `WorkspaceSidebar`, `ChatPane`.
   - **Granular Error Boundaries**: Wrap critical widgets in localized `<ErrorBoundary>` components to prevent an isolated error from crashing the whole viewport (No White Screen of Death).
4. **`features/`**: User actions and workflows that bring business value. Examples: `auth` (forms, login/register logic), `create-channel`, `send-message`.
   - **Model Isolation**: Place Zod schemas and validation in `features/<feature>/model/<name>Schema.ts`. **Never** declare Zod schemas inside TSX UI files.
   - **No Pass-Through Re-Exports**: Features must focus on user workflow UI (Modals, Dialogs, Forms) and local validation. They consume domain mutations directly from `@/entities/*`. **Never** create intermediate pass-through files (e.g. `features/create-channel/model/useCreateChannelMutation.ts`) that just re-export from `entities`.
5. **`entities/`**: Domain models, entity state, basic domain UI items, and **Domain-Driven Data Layer**.
   - **Single Source of Truth for Server Data**: All API endpoint definitions (`entities/<entity>/api/<entity>Api.ts`), TanStack Queries, and Domain Mutations reside inside the corresponding entity.
   - **Clean CQRS File Separation**:
     - `<entity>Queries.ts`: Purely contains Query Keys (`channelKeys`) and Read queries (`useUserChannelsQuery`, `useChannelDetailQuery`).
     - `<entity>Mutations.ts`: Purely contains Write/Command mutations (`useCreateChannelMutation`, `useStartDirectChatMutation`) alongside centralized cache invalidation logic.
   - **Reusable Domain List Item Primitives (DRY Rows)**: Any recurring entity display row (e.g. `UserListItem.tsx`, `ChannelItem.tsx`) must reside in `entities/{entity}/ui/` supporting responsive sizes (`sm` for compact sidebar/popovers, `md` for modals). Never duplicate identical entity display JSX across features/widgets.
6. **`shared/`**: Reusable primitives, API client, design tokens, UI components (`shared/ui/` like Button, Input, Modal, Sonner), and generic hooks (`shared/lib/useDebounce.ts`).

---

## 2. API Contracts & Contract-First OpenAPI Generation

1. **Never write manual API response/request DTO types**:
   - Run `pnpm --dir client run api:generate` to regenerate `./src/shared/api/schema.d.ts` from `http://localhost:5212/openapi/v1.json`.
   - Entity models and API functions must derive directly from `components['schemas']` in `schema.d.ts`.
   - **Single Source of Truth**: When backend DTOs change, re-run `api:generate`. Do not invent standalone TS types that duplicate or drift from `schema.d.ts`.
2. **Standardized API Consumption (`api` Wrapper)**:
   - Always import the convenience wrapper `api` from `@/shared/api` (`api.get`, `api.post`, `api.put`, `api.delete`).
   - Do not call raw `baseClient` and manually unwrap `response.data` across features/entities.
3. **Compile-time Assertion**:
   - Ensure Zod form schemas maintain bidirectional compatibility with generated OpenAPI DTOs:
     `export const _assertCompat: LoginCommand = {} as z.infer<typeof loginSchema>;`

---

## 3. TanStack Query & Real-Time Cache Synchronization

1. **Clean Read/Write Separation in Entities**:
   - In `entities/<entity>/api/`, separate queries and mutations into `<entity>Queries.ts` and `<entity>Mutations.ts`.
   - Mutations import query keys (`channelKeys.lists()`) from `<entity>Queries.ts` to execute precise cache invalidations upon success.
2. **FSD Compliance & Dependency Direction**:
   - Features (`features/`) and Widgets (`widgets/`) consume queries and mutations directly from `@/entities/<entity>`.
   - This strictly adheres to FSD downward dependency flow (`widgets -> features -> entities -> shared`).
3. **Cache Seeding vs Redundant Invalidation**:
   - In auth mutations (`useLoginMutation`, `useGoogleLoginMutation`, `useRegisterMutation`), seed the cache directly:
     ```ts
     queryClient.setQueryData(authKeys.currentUser(), data.user);
     ```
   - **DO NOT** call `invalidateQueries(authKeys.currentUser())` immediately after `setQueryData`. Doing so wastes a network roundtrip and overwrites newly seeded fresh data with an identical fetch.
4. **Enterprise Retry Philosophy**:
   - **NEVER retry 4xx errors** (400, 401, 403, 404). Doing so corrupts server logs and wastes bandwidth.
   - Only retry max 1x for 5xx server errors or transient physical network errors (`status === 0`, `408`, `504`).
5. **Cache Timeouts**:
   - `staleTime: 5 * 60 * 1000` (5 minutes).
   - `gcTime: 10 * 60 * 1000` (10 minutes).
6. **No Duplicate Toast in Mutations**:
   - `QueryClient` defines a global `MutationCache.onError` handler that automatically parses RFC 7807/9457 ProblemDetails via `getErrorMessage(error)` and displays `toast.error`.
   - **DO NOT call `toast.error(...)` manually** inside `*Mutations.ts` `onError` callbacks. Doing so triggers two stacked duplicate toasts.
   - If a form needs to display inline field errors without showing a global floating toast, specify `meta: { suppressToast: true }`.
7. **Single-Pass Array Partitioning (O(N))**:
   - When categorizing and filtering entity lists (e.g. segregating `channels` into groups vs direct messages while filtering by search term), execute **a single `useMemo` with an O(N) loop** (`for...of`) rather than chaining multiple independent `.filter()` passes and redundant `useMemo` hooks.
8. **Real-time SignalR vs Query Cache Sync**:
   - When real-time events arrive (`ReceiveMessage`, `ReactionAdded`), update cache directly using `queryClient.setQueryData`.
   - Do **NOT** blindly call `invalidateQueries` on every websocket event to prevent UI flicker and redundant network roundtrips.
   - **SignalR Client Connection Lifecycle & React 19 StrictMode Trap (Cạm bẫy 2)**:
     - In React 19 development mode, `StrictMode` executes mount effects twice. Never call `connection.start()` directly inside a naive `useEffect` without connection-state guards, as it spawns duplicate WebSocket connections and throws aborted handshake errors.
     - Manage connections via a shared singleton manager in `@/shared/lib/signalr/` with exponential backoff reconnect `[0, 2000, 5000, 10000, 30000]`.
     - Supply the access token via `accessTokenFactory: () => store.getState().auth.accessToken`. The SignalR browser client automatically appends this as `?access_token=...` to satisfy server-side `JwtBearerEvents.OnMessageReceived`.
    - **View-Scoped Channel Room Lifecycle (Typing & Ephemeral Events)**:
      - Ephemeral events (typing indicators, presence in room) require active room subscription via SignalR Groups.
      - `ChatWindow` automatically invokes `chatHubService.joinChannel(channelId)` on mount and `chatHubService.leaveChannel(channelId)` on unmount/cleanup.
      - Never leave active channel groups uncleaned to prevent memory leaks and ghost notifications.

---

## 4. State Management, Custom Hooks & Authentication Concurrency

1. **State Partitioning**:
   - **Server State**: Managed strictly by TanStack Query in `entities/<entity>/api/`.
   - **Global Auth & Session**: Redux Toolkit (`authSlice.ts`) dedicated strictly to In-Memory RAM state (Active user info, Access Token in RAM). Never store promises or API thunks in Redux.
   - **Global Transient UI State (Modal Manager)**: Managed via type-safe Zustand (`useModalStore` in `@/shared/model/useModalStore.ts`) using TypeScript Discriminated Unions (`ModalPayload`).
     - Modals are mounted once at the root layout (`WorkspaceLayout.tsx`).
     - Never duplicate modal instances or local `useState(false)` pairs across multiple pages or widgets.

2. **Controlled Modal Pattern & Exit Transitions**:
   - Always mount dialogs/modals as Controlled Components: `open={isOpen}` and `onOpenChange={(open) => { if (!open) closeModal(); }}`.
   - **NEVER** conditionally mount dialogs using `{isOpen && <Modal />}`. Doing so immediately destroys the DOM node and breaks Radix UI's CSS exit transitions (fade-out, scale-down).

3. **When to Extract Custom Hooks vs Avoiding "God Hooks"**:
   - **Extract** when stateful logic is reused across $\ge 2$ components (e.g., `useUserSearch` used in both `StartDirectChatModal` and `NewPeopleSection`, or `useDebounce`).
   - **Never extract** pass-through "God Hooks" that merely bundle 10+ `useState` variables for a single component and re-introduce prop drilling. Keep component-specific state colocated inside the component.

4. **Token Security & Refresh Mutex**:
   - **NEVER store tokens in `localStorage` or `sessionStorage`** (XSS vulnerability).
   - Store Access Token strictly in Redux RAM state.
   - Store Refresh Token in secure `HttpOnly` cookie managed by the browser.
   - **Refresh Mutex**: Axios response interceptor must queue concurrent 401 requests during a token refresh cycle to prevent race conditions from triggering backend Token Reuse Detection.

---

## 5. Design System, Aesthetics & HCI (Slack Jade)

1. **Slack Jade Color Palette (HSL)**:
   - Primary: Balanced Slack Jade `hsl(158, 60%, 38%)`.
   - Default Theme: **Light Mode First** (`hsl(0, 0%, 100%)` background, `hsl(158, 20%, 97%)` sidebar, crisp `1px` borders).
   - Dark Mode: Deep slate background `hsl(215, 28%, 10%)` with high-contrast text and crisp border separation `hsl(215, 20%, 20%)`.

2. **Avatar HCI & Flex Cross-Axis Distortion Prevention**:
   - All circular avatars (`UserAvatar`) must enforce `aspect-square rounded-full shrink-0` across the outer container and all child elements (`Avatar`, `AvatarImage`, `AvatarFallback`).
   - This prevents adjacent flexbox elements with larger heights (e.g. 40px buttons) from pulling the cross-axis and distorting avatars into ovals.

3. **No "AI-Generated Vibe"**:
   - Maximize standard shadcn/ui components.
   - Avoid excessive icons, flashy gradients, and cartoonish animations. Keep layout dense, content-first, and professional.

4. **Keyboard & Event Hygiene**:
   - Always clean up keyboard listeners (`Ctrl + K`, `Escape`) and websocket connections on component unmount.
