# 🚀 MIGRATION RUNBOOK: LARAVEL TO .NET 10 & REACT 19 (FSD)
> **Target Architecture:** Backend = Clean Architecture (.NET 10) | Frontend = Feature-Sliced Design (React 19 Vite)  
> **Timeline:** 01/06/2026 – 31/07/2026 (28 Atomic Vertical Commits)  
> **Branch:** `v2-dotnet-clean-architecture`

---

## 📌 HƯỚNG DẪN DÀNH CHO AI THỰC THI (INSTRUCTION FOR AI WORKER)
Khi giao việc cho AI, chỉ cần đưa câu lệnh:
> *"Hãy đọc file `MIGRATION_PLAN_28_COMMITS.md` và thực hiện chính xác các yêu cầu của **Commit #X**. Tuân thủ nghiêm ngặt danh sách file được phép sửa, code contract, quy tắc phòng tránh lỗi ẩn và chạy verification test trước khi hoàn thành."*

### ⚠️ NGUYÊN TẮC CỐT LÕI (STRICT CONSTRAINTS)
1. **Zero Broken Builds:** Mỗi commit khi hoàn thành bắt buộc phải build thành công (`dotnet build` và `pnpm run build` không lỗi).
2. **Strict File Boundaries:** Không tạo hoặc sửa file ngoài phạm vi được chỉ định của commit đó.
3. **Enterprise Standards:** Không dùng mock data tạm bợ; áp dụng Result pattern, Strongly-typed contracts và CSS Tailwind hoàn chỉnh.

---

## 🗺️ DANH SÁCH 28 COMMITS ĐẶC TẢ CHI TIẾT

---

### 📦 MILESTONE 1: NỀN TẢNG KIẾN TRÚC & CONTRACTS (TUẦN 1: 01/06 - 07/06/2026)

#### 🔹 COMMIT 1
* **Date:** `2026-06-01T09:30:00`
* **Message:** `chore(scaffold): initialize .NET 10 Clean Architecture and React 19 FSD monorepo`
* **Files Allowed:**
  * `MessengerApp.sln`
  * `src/Domain/MessengerApp.Domain.csproj`
  * `src/Application/MessengerApp.Application.csproj`
  * `src/Infrastructure/MessengerApp.Infrastructure.csproj`
  * `src/WebAPI/MessengerApp.WebAPI.csproj`, `src/WebAPI/Program.cs`
  * `client/package.json`, `client/vite.config.ts`, `client/src/app/`, `client/src/pages/health/HealthPage.tsx`
* **Technical Spec:**
  * C# Target: `net10.0`. References: WebAPI -> Infrastructure -> Application -> Domain.
  * WebAPI `Program.cs`: Cấu hình CORS (`http://localhost:5173`), map `/api/health` trả về `{ status: "Healthy", version: "1.0.0" }`.
  * Frontend: React 19, TypeScript, Vite. Tạo khung FSD: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
  * `HealthPage.tsx` fetch `/api/health` hiển thị trạng thái hệ thống.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-01T09:30:00"; $env:GIT_COMMITTER_DATE="2026-06-01T09:30:00"
  git commit -m "chore(scaffold): initialize .NET 10 Clean Architecture and React 19 FSD monorepo"
  ```

---

#### 🔹 COMMIT 2
* **Date:** `2026-06-03T14:15:00`
* **Message:** `feat(core): implement Result pattern and RFC 7807 ProblemDetails exception handling`
* **Files Allowed:**
  * `src/Domain/Common/Result.cs`, `src/Domain/Common/Error.cs`
  * `src/WebAPI/Middleware/ExceptionHandlingMiddleware.cs`
  * `client/src/shared/api/baseClient.ts`
* **Technical Spec:**
  * `Error` struct: `Code`, `Description`, `ErrorType` (Failure, Validation, NotFound, Conflict, Unauthorized).
  * `Result<T>`: `IsSuccess`, `Value`, `Error`.
  * `ExceptionHandlingMiddleware`: Convert mọi unhandled exception thành RFC 7807 ProblemDetails format (Status, Title, Detail).
  * `baseClient.ts`: Axios client tự động parse ProblemDetails response.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-03T14:15:00"; $env:GIT_COMMITTER_DATE="2026-06-03T14:15:00"
  git commit -m "feat(core): implement Result pattern and RFC 7807 ProblemDetails exception handling"
  ```

---

#### 🔹 COMMIT 3
* **Date:** `2026-06-05T20:45:00`
* **Message:** `feat(client/shared): setup shadcn-ui in FSD shared layer with atomic primitives and theme provider`
* **Files Allowed:**
  * `client/components.json`
  * `client/src/shared/lib/utils.ts`
  * `client/src/shared/ui/button.tsx`
  * `client/src/shared/ui/input.tsx`
  * `client/src/shared/ui/dialog.tsx`
  * `client/src/shared/ui/avatar.tsx`
  * `client/src/shared/ui/badge.tsx`
  * `client/src/shared/theme/ThemeProvider.tsx`
  * `client/src/app/styles/index.css`
* **Technical Spec:**
  * Cấu hình shadcn/ui tương thích chuẩn Feature-Sliced Design (FSD):
    * `components.json`: cấu hình alias `@/shared/ui` cho components và `@/shared/lib/utils` cho helper `cn()`.
    * Cài đặt Radix UI primitives: `@radix-ui/react-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-slot`, `class-variance-authority` (cva), `clsx`, `tailwind-merge`.
  * `button.tsx`: Hỗ trợ đầy đủ variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`), sizes (`default`, `sm`, `lg`, `icon`), và `asChild` slot polymorphism.
  * `dialog.tsx`: Hỗ trợ đầy đủ Accessibility (A11y), focus trapping, ESC keyboard listener, overlay backdrop.
  * `ThemeProvider`: Hỗ trợ toggle Dark/Light mode dựa trên CSS variables (`hsl(var(--background))`).
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-05T20:45:00"; $env:GIT_COMMITTER_DATE="2026-06-05T20:45:00"
  git commit -m "feat(client/shared): setup shadcn-ui in FSD shared layer with atomic primitives and theme provider"
  ```

---

#### 🔹 COMMIT 4
* **Date:** `2026-06-07T11:20:00`
* **Message:** `feat(infra): setup EF Core 10 PostgreSQL DbContext with auditable entity interceptor`
* **Files Allowed:**
  * `src/Domain/Common/BaseAuditableEntity.cs`
  * `src/Infrastructure/Persistence/AppDbContext.cs`
  * `src/Infrastructure/Persistence/Interceptors/AuditableEntityInterceptor.cs`
* **Technical Spec:**
  * `BaseAuditableEntity`: `Guid Id`, `DateTimeOffset CreatedAt`, `DateTimeOffset? UpdatedAt`.
  * `AuditableEntityInterceptor`: Kế thừa `SaveChangesInterceptor`, tự động gán UTC timestamp.
  * Cấu hình connection pooling PostgreSQL trong `AppDbContext`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-07T11:20:00"; $env:GIT_COMMITTER_DATE="2026-06-07T11:20:00"
  git commit -m "feat(infra): setup EF Core 10 PostgreSQL DbContext with auditable entity interceptor"
  ```

---

### 🔐 MILESTONE 2: IDENTITY & AUTHENTICATION (TUẦN 2: 08/06 - 16/06/2026)

#### 🔹 COMMIT 5
* **Date:** `2026-06-10T15:30:00`
* **Message:** `feat(auth/be): implement User entity, MediatR CQRS commands and FluentValidation`
* **Files Allowed:**
  * `src/Domain/Entities/User.cs`
  * `src/Application/Auth/Commands/Register/RegisterCommand.cs`
  * `src/Application/Auth/Commands/Register/RegisterCommandValidator.cs`
  * `src/Application/Auth/Commands/Login/LoginCommand.cs`
* **Technical Spec:**
  * `User`: `Email`, `Username`, `PasswordHash`, `AvatarUrl`, `IsOnline`, `LastSeenAt`.
  * `RegisterCommandValidator`: Kiểm tra định dạng Email, mật khẩu >= 8 ký tự (chữ hoa, số, ký tự đặc biệt).
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-10T15:30:00"; $env:GIT_COMMITTER_DATE="2026-06-10T15:30:00"
  git commit -m "feat(auth/be): implement User entity, MediatR CQRS commands and FluentValidation"
  ```

---

#### 🔹 COMMIT 6
* **Date:** `2026-06-12T10:10:00`
* **Message:** `feat(auth/security): add Argon2id password hashing and JWT token service with refresh rotation`
* **Files Allowed:**
  * `src/Infrastructure/Security/Argon2PasswordHasher.cs`
  * `src/Infrastructure/Security/JwtTokenService.cs`
  * `src/Domain/Entities/RefreshToken.cs`
  * `src/WebAPI/Controllers/AuthController.cs`
  * `src/WebAPI/Program.cs`
* **Technical Spec:**
  * Hashing mật khẩu bằng Argon2id.
  * Access Token 15 phút, Refresh Token 7 ngày. Endpoints: `register`, `login`, `refresh`.
  * Cấu hình OpenAPI: Đăng ký `builder.Services.AddOpenApi()` và `app.MapOpenApi()` để expose endpoint contract `/openapi/v1.json` phục vụ tự động đồng bộ Types sang Frontend.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-12T10:10:00"; $env:GIT_COMMITTER_DATE="2026-06-12T10:10:00"
  git commit -m "feat(auth/security): add Argon2id password hashing and JWT token service with refresh rotation"
  ```

---

#### 🔹 COMMIT 7
* **Date:** `2026-06-14T16:40:00`
* **Message:** `feat(auth/fe): build entities/user and features/auth-by-email in FSD with openapi-typescript`
* **Files Allowed:**
  * `client/package.json`
  * `client/pnpm-lock.yaml`
  * `client/src/shared/api/schema.d.ts`
  * `client/src/entities/user/model/types.ts`
  * `client/src/entities/user/ui/UserAvatar.tsx`
  * `client/src/features/auth-by-email/ui/LoginForm.tsx`
  * `client/src/features/auth-by-email/ui/RegisterForm.tsx`
* **Technical Spec:**
  * Cài đặt `openapi-typescript` (devDependency), cấu hình script `"gen:api": "openapi-typescript http://localhost:5000/openapi/v1.json -o src/shared/api/schema.d.ts"`.
  * Type-safe Contract: Sử dụng types tự sinh từ `schema.d.ts` cho `entities/user/model/types.ts` đảm bảo End-to-End Type Safety 100%.
  * Form đăng nhập/đăng ký giao diện chuẩn FSD, có xử lý inline validation error từ RFC 7807 và loading state.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-14T16:40:00"; $env:GIT_COMMITTER_DATE="2026-06-14T16:40:00"
  git commit -m "feat(auth/fe): build entities/user and features/auth-by-email in FSD with openapi-typescript"
  ```

---

#### 🔹 COMMIT 8
* **Date:** `2026-06-16T21:05:00`
* **Message:** `feat(auth/pages): assemble pages/auth and implement route authorization guards`
* **Files Allowed:**
  * `client/src/pages/auth/LoginPage.tsx`, `client/src/pages/auth/RegisterPage.tsx`
  * `client/src/app/providers/AuthProvider.tsx`, `client/src/app/routes/ProtectedRoute.tsx`
* **Technical Spec:**
  * `AuthProvider`: Lưu token, gọi `/api/auth/me` khôi phục phiên khi reload trang.
  * Bảo vệ route: Chưa login redirect về `/login`, đã login redirect về `/chat`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-16T21:05:00"; $env:GIT_COMMITTER_DATE="2026-06-16T21:05:00"
  git commit -m "feat(auth/pages): assemble pages/auth and implement route authorization guards"
  ```

---

### 👥 MILESTONE 3: KÊNH CHAT & SIDEBAR (TUẦN 3: 17/06 - 23/06/2026)

#### 🔹 COMMIT 9
* **Date:** `2026-06-18T09:45:00`
* **Message:** `feat(channels/be): implement Channel domain aggregate and direct-message pair resolver`
* **Files Allowed:**
  * `src/Domain/Entities/Channel.cs`, `src/Domain/Entities/ChannelMember.cs`
  * `src/Application/Channels/Commands/CreateChannel/CreateChannelCommand.cs`
  * `src/Application/Channels/Commands/GetOrCreateDirectChat/GetOrCreateDirectChatCommand.cs`
  * `src/WebAPI/Controllers/ChannelsController.cs`
* **Technical Spec:**
  * `ChannelType`: `Direct` (1-1) hoặc `Group`.
  * `GetOrCreateDirectChatCommand`: Tìm hoặc tạo mới phòng chat 1-1 giữa 2 người trong Transaction.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-18T09:45:00"; $env:GIT_COMMITTER_DATE="2026-06-18T09:45:00"
  git commit -m "feat(channels/be): implement Channel domain aggregate and direct-message pair resolver"
  ```

---

#### 🔹 COMMIT 10
* **Date:** `2026-06-20T14:20:00`
* **Message:** `feat(channels/fe): build entities/channel and features/create-channel modal`
* **Files Allowed:**
  * `client/src/entities/channel/ui/ChannelItem.tsx`
  * `client/src/features/create-channel/ui/CreateChannelModal.tsx`
* **Technical Spec:**
  * `ChannelItem`: Tên channel, avatar, tin nhắn cuối, unread badge.
  * Modal tạo channel hỗ trợ nhập tên và chọn thành viên.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-20T14:20:00"; $env:GIT_COMMITTER_DATE="2026-06-20T14:20:00"
  git commit -m "feat(channels/fe): build entities/channel and features/create-channel modal"
  ```

---

#### 🔹 COMMIT 11
* **Date:** `2026-06-22T20:30:00`
* **Message:** `feat(sidebar/widget): assemble widgets/sidebar-channels with active channel routing`
* **Files Allowed:**
  * `client/src/widgets/sidebar-channels/ui/SidebarChannels.tsx`
  * `client/src/pages/chat/ChatLayout.tsx`
* **Technical Spec:**
  * Widget Sidebar gồm 2 danh sách "Direct Messages" và "Group Channels". Bấm vào channel chuyển route `/channels/:id`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-22T20:30:00"; $env:GIT_COMMITTER_DATE="2026-06-22T20:30:00"
  git commit -m "feat(sidebar/widget): assemble widgets/sidebar-channels with active channel routing"
  ```

---

### ⚡ MILESTONE 4: REALTIME CHAT VỚI SIGNALR (TUẦN 4: 24/06 - 02/07/2026)

#### 🔹 COMMIT 12
* **Date:** `2026-06-24T11:15:00`
* **Message:** `feat(signalr/security): setup ChatHub with query-string JWT auth and group authorization`
* **Files Allowed:**
  * `src/WebAPI/Hubs/ChatHub.cs`, `src/WebAPI/Hubs/IChatClient.cs`
  * `src/WebAPI/Extensions/JwtSignalRAuthExtensions.cs`
* **Technical Spec:**
  * **Cạm bẫy 1:** Trích xuất `access_token` từ Query String trong `OnMessageReceived` khi đường dẫn là `/hubs/chat`.
  * **Cạm bẫy 4:** `JoinChannel(Guid channelId)` phải kiểm tra user có trong `channel_members` không trước khi `Groups.AddToGroupAsync`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-24T11:15:00"; $env:GIT_COMMITTER_DATE="2026-06-24T11:15:00"
  git commit -m "feat(signalr/security): setup ChatHub with query-string JWT auth and group authorization"
  ```

---

#### 🔹 COMMIT 13
* **Date:** `2026-06-26T16:50:00`
* **Message:** `feat(signalr/presence): build thread-safe PresenceTracker using ConcurrentDictionary`
* **Files Allowed:**
  * `src/Infrastructure/Presence/PresenceTracker.cs`
  * `src/Application/Common/Interfaces/IPresenceTracker.cs`
* **Technical Spec:**
  * Quản lý kết nối nhiều tab: `ConcurrentDictionary<string, HashSet<string>>`.
  * Bắn event `UserConnected` và `UserDisconnected` chính xác, không bị spam khi reload.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-26T16:50:00"; $env:GIT_COMMITTER_DATE="2026-06-26T16:50:00"
  git commit -m "feat(signalr/presence): build thread-safe PresenceTracker using ConcurrentDictionary"
  ```

---

#### 🔹 COMMIT 14
* **Date:** `2026-06-28T10:35:00`
* **Message:** `feat(client/signalr): implement resilient SignalR client with exponential backoff reconnect`
* **Files Allowed:**
  * `client/src/shared/lib/signalr/signalrConnection.ts`
  * `client/src/shared/lib/signalr/useSignalREvent.ts`
* **Technical Spec:**
  * **Cạm bẫy 2:** Ngăn chặn double-connection do React 19 `StrictMode`.
  * Cấu hình auto-reconnect backoff `[0, 2000, 5000, 10000, 30000]`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-28T10:35:00"; $env:GIT_COMMITTER_DATE="2026-06-28T10:35:00"
  git commit -m "feat(client/signalr): implement resilient SignalR client with exponential backoff reconnect"
  ```

---

#### 🔹 COMMIT 15
* **Date:** `2026-06-30T15:40:00`
* **Message:** `feat(chat/messaging): implement SendMessageCommand and live SignalR dispatch pipeline`
* **Files Allowed:**
  * `src/Domain/Entities/Message.cs`
  * `src/Application/Messages/Commands/SendMessage/SendMessageCommand.cs`
  * `src/WebAPI/Hubs/ChatHub.cs`
* **Technical Spec:**
  * Nhận tin nhắn -> Lưu DB qua EF Core -> `Clients.Group(channelId).ReceiveMessage(dto)`.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-06-30T15:40:00"; $env:GIT_COMMITTER_DATE="2026-06-30T15:40:00"
  git commit -m "feat(chat/messaging): implement SendMessageCommand and live SignalR dispatch pipeline"
  ```

---

#### 🔹 COMMIT 16
* **Date:** `2026-07-02T21:10:00`
* **Message:** `feat(chat/widgets): assemble widgets/chat-window with features/send-message`
* **Files Allowed:**
  * `client/src/entities/message/ui/MessageBubble.tsx`
  * `client/src/features/send-message/ui/MessageInput.tsx`
  * `client/src/widgets/chat-window/ui/ChatWindow.tsx`
* **Technical Spec:**
  * Khung chat hiển thị tin nhắn thời gian thực. Hỗ trợ Optimistic UI (hiển thị ngay trước khi server trả về).
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-02T21:10:00"; $env:GIT_COMMITTER_DATE="2026-07-02T21:10:00"
  git commit -m "feat(chat/widgets): assemble widgets/chat-window with features/send-message"
  ```

---

### 🟢 MILESTONE 5: TYPING & REACTIONS (TUẦN 5: 03/07 - 09/07/2026)

#### 🔹 COMMIT 17
* **Date:** `2026-07-05T10:05:00`
* **Message:** `feat(typing): implement in-memory typing whisper events with server-side auto-expiry`
* **Files Allowed:**
  * `src/WebAPI/Hubs/ChatHub.cs`
  * `client/src/features/typing-indicator/ui/TypingIndicator.tsx`
  * `client/src/features/typing-indicator/model/useTypingPublisher.ts`
* **Technical Spec:**
  * Typing event chạy thuần trên RAM socket (0 query DB). Client debounce 350ms, auto-stop sau 3s.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-05T10:05:00"; $env:GIT_COMMITTER_DATE="2026-07-05T10:05:00"
  git commit -m "feat(typing): implement in-memory typing whisper events with server-side auto-expiry"
  ```

---

#### 🔹 COMMIT 18
* **Date:** `2026-07-07T16:25:00`
* **Message:** `feat(reactions): implement atomic toggle reaction with live counter broadcast`
* **Files Allowed:**
  * `src/Domain/Entities/MessageReaction.cs`
  * `src/Application/Messages/Commands/ToggleReaction/ToggleReactionCommand.cs`
  * `client/src/features/toggle-reaction/ui/ReactionPicker.tsx`
  * `client/src/features/toggle-reaction/ui/ReactionBadges.tsx`
* **Technical Spec:**
  * Bấm emoji lần 1 -> thêm; bấm lần 2 -> xóa. Broadcast realtime cho cả 2 bên.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-07T16:25:00"; $env:GIT_COMMITTER_DATE="2026-07-07T16:25:00"
  git commit -m "feat(reactions): implement atomic toggle reaction with live counter broadcast"
  ```

---

### 🛡️ MILESTONE 6: ZERO-KNOWLEDGE E2EE (TUẦN 6: 10/07 - 17/07/2026)

#### 🔹 COMMIT 19
* **Date:** `2026-07-10T09:50:00`
* **Message:** `feat(e2ee/be): add ECDH public key registry and ciphertext payload storage`
* **Files Allowed:**
  * `src/Domain/Entities/UserPublicKey.cs`
  * `src/Application/E2EE/Commands/PublishPublicKeyCommand.cs`
  * `src/Application/E2EE/Queries/GetRecipientPublicKeyQuery.cs`
  * `src/WebAPI/Controllers/E2EEController.cs`
* **Technical Spec:**
  * API lưu và lấy Public Key của user. Server không lưu bất kỳ Private Key nào.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-10T09:50:00"; $env:GIT_COMMITTER_DATE="2026-07-10T09:50:00"
  git commit -m "feat(e2ee/be): add ECDH public key registry and ciphertext payload storage"
  ```

---

#### 🔹 COMMIT 20
* **Date:** `2026-07-12T15:15:00`
* **Message:** `feat(e2ee/crypto): build Web Crypto ECDH key generator with IndexedDB private key persistence`
* **Files Allowed:**
  * `client/src/shared/lib/crypto/ecdhCrypto.ts`
  * `client/src/shared/lib/crypto/keyStorageIndexedDB.ts`
* **Technical Spec:**
  * **Cạm bẫy 3:** Sinh cặp khóa ECDH P-256 bằng Web Crypto API, lưu Private Key vào **IndexedDB** an toàn, không bị mất khi F5.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-12T15:15:00"; $env:GIT_COMMITTER_DATE="2026-07-12T15:15:00"
  git commit -m "feat(e2ee/crypto): build Web Crypto ECDH key generator with IndexedDB private key persistence"
  ```

---

#### 🔹 COMMIT 21
* **Date:** `2026-07-14T20:40:00`
* **Message:** `feat(e2ee/pipeline): implement AES-GCM-256 client encryption and live decryption pipeline`
* **Files Allowed:**
  * `client/src/features/e2ee-encryption/model/useE2EEMessaging.ts`
  * `client/src/shared/lib/crypto/aesGcmCrypto.ts`
* **Technical Spec:**
  * Bắt tay sinh Shared Secret từ ECDH -> Mã hóa tin nhắn bằng AES-GCM-256 -> Bắn ciphertext. Người nhận tự giải mã hiển thị.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-14T20:40:00"; $env:GIT_COMMITTER_DATE="2026-07-14T20:40:00"
  git commit -m "feat(e2ee/pipeline): implement AES-GCM-256 client encryption and live decryption pipeline"
  ```

---

#### 🔹 COMMIT 22
* **Date:** `2026-07-16T11:20:00`
* **Message:** `feat(e2ee/ui): add visual E2EE shield indicator and safety-number verification modal`
* **Files Allowed:**
  * `client/src/features/e2ee-encryption/ui/E2EEShieldBadge.tsx`
  * `client/src/features/e2ee-encryption/ui/SafetyNumbersModal.tsx`
* **Technical Spec:**
  * Icon khiên bảo vệ E2EE; Modal hiển thị chuỗi số Fingerprint đối chiếu bảo mật giữa 2 người dùng.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-16T11:20:00"; $env:GIT_COMMITTER_DATE="2026-07-16T11:20:00"
  git commit -m "feat(e2ee/ui): add visual E2EE shield indicator and safety-number verification modal"
  ```

---

### 📁 MILESTONE 7: CHUNKED UPLOAD & RANGE STREAMING (TUẦN 7: 18/07 - 24/07/2026)

#### 🔹 COMMIT 23
* **Date:** `2026-07-18T16:10:00`
* **Message:** `feat(media/be): implement chunked file upload receiver with SHA256 integrity verification`
* **Files Allowed:**
  * `src/WebAPI/Controllers/MediaController.cs`
  * `src/Infrastructure/Storage/ChunkedUploadService.cs`
* **Technical Spec:**
  * API nhận từng chunk 2MB, ghép file an toàn, kiểm tra hash SHA256 chống lỗi file.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-18T16:10:00"; $env:GIT_COMMITTER_DATE="2026-07-18T16:10:00"
  git commit -m "feat(media/be): implement chunked file upload receiver with SHA256 integrity verification"
  ```

---

#### 🔹 COMMIT 24
* **Date:** `2026-07-20T21:00:00`
* **Message:** `feat(media/fe): build features/upload-media with slice progress and AbortController cancellation`
* **Files Allowed:**
  * `client/src/features/upload-media/model/useChunkUploader.ts`
  * `client/src/features/upload-media/ui/UploadProgressBar.tsx`
* **Technical Spec:**
  * Cắt file thành các blob 2MB, thanh % upload thời gian thực, nút Cancel dừng upload ngay lập tức.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-20T21:00:00"; $env:GIT_COMMITTER_DATE="2026-07-20T21:00:00"
  git commit -m "feat(media/fe): build features/upload-media with slice progress and AbortController cancellation"
  ```

---

#### 🔹 COMMIT 25
* **Date:** `2026-07-22T10:45:00`
* **Message:** `feat(streaming): enable HTTP 206 partial content video streaming via FileStreamResult`
* **Files Allowed:**
  * `src/WebAPI/Controllers/MediaController.cs`
  * `client/src/entities/message/ui/VideoAttachmentPlayer.tsx`
* **Technical Spec:**
  * C# trả về `FileStreamResult` với `EnableRangeProcessing = true`. Player trên UI kéo tua video tới phút thứ 5 phát ngay lập tức.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-22T10:45:00"; $env:GIT_COMMITTER_DATE="2026-07-22T10:45:00"
  git commit -m "feat(streaming): enable HTTP 206 partial content video streaming via FileStreamResult"
  ```

---

### 🚀 MILESTONE 8: PAGINATION, DOCKER & TÀI LIỆU HÓA (TUẦN 8: 25/07 - 31/07/2026)

#### 🔹 COMMIT 26
* **Date:** `2026-07-25T15:35:00`
* **Message:** `perf(chat): add cursor-based message pagination and debounced full-text search API`
* **Files Allowed:**
  * `src/Application/Messages/Queries/GetMessagesCursor/GetMessagesCursorQuery.cs`
  * `client/src/widgets/chat-window/model/useInfiniteMessages.ts`
* **Technical Spec:**
  * Cursor query `WHERE ChannelId = @channelId AND Id < @cursor ORDER BY Id DESC LIMIT 20`.
  * Client: IntersectionObserver tự động load tin nhắn cũ khi cuộn lên đỉnh màn hình không bị giật trang.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-25T15:35:00"; $env:GIT_COMMITTER_DATE="2026-07-25T15:35:00"
  git commit -m "perf(chat): add cursor-based message pagination and debounced full-text search API"
  ```

---

#### 🔹 COMMIT 27
* **Date:** `2026-07-28T11:15:00`
* **Message:** `chore(docker): setup multi-stage Dockerfiles for .NET 10 WebAPI and Nginx FSD SPA`
* **Files Allowed:**
  * `src/WebAPI/Dockerfile`
  * `client/Dockerfile`
  * `nginx/default.conf`
* **Technical Spec:**
  * Multi-stage build .NET 10 và Nginx Alpine reverse proxy điều phối WebSocket `/hubs/chat` và REST API.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-28T11:15:00"; $env:GIT_COMMITTER_DATE="2026-07-28T11:15:00"
  git commit -m "chore(docker): setup multi-stage Dockerfiles for .NET 10 WebAPI and Nginx FSD SPA"
  ```

---

#### 🔹 COMMIT 28
* **Date:** `2026-07-31T20:30:00`
* **Message:** `chore(deploy): add docker-compose with automated PostgreSQL seeder and architecture documentation`
* **Files Allowed:**
  * `docker-compose.yml`
  * `src/Infrastructure/Persistence/DatabaseSeeder.cs`
  * `README.md`
* **Technical Spec:**
  * `docker compose up -d` tự động khởi chạy Database, Backend, Frontend.
  * Tự động seed tài khoản admin mẫu `admin@messenger.com / Admin@123`.
  * README chứa sơ đồ Clean Architecture, sơ đồ FSD và kịch bản demo 5 phút cho nhà tuyển dụng.
* **Git Command:**
  ```powershell
  $env:GIT_AUTHOR_DATE="2026-07-31T20:30:00"; $env:GIT_COMMITTER_DATE="2026-07-31T20:30:00"
  git commit -m "chore(deploy): add docker-compose with automated PostgreSQL seeder and architecture documentation"
  ```
