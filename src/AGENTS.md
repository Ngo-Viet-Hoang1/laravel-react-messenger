# Backend Architectural Guidelines (.NET 10 Clean Architecture)

These rules govern all backend development in `src/` and test suites in `tests/`.

---

## 0. Workspace Governance & Integrity

1. **Strictly Never Modify Files in `archive/`**:
   - The directory `archive/` (including legacy Laravel files) is an immutable historical artifact.
   - Any modification, refactoring, formatting, or deletion of code in `archive/` is strictly forbidden.
   - All active backend engineering occurs exclusively in `src/` and `tests/`.

2. **Mandatory Contract-First Synchronization (BE <-> FE Matching)**:
   - Every time backend endpoints, DTOs, commands, or queries are created or modified:
     1. Expose the ASP.NET Core OpenAPI contract (`http://localhost:5212/openapi/v1.json`).
     2. Run `pnpm --dir client run api:generate` to regenerate `client/src/shared/api/schema.d.ts`.
     3. Verify zero contract drift between backend responses and frontend types.

---

## 1. Clean Architecture Layering & Responsibilities

1. **Domain (`src/Domain/`)**:
   - Contains pure Enterprise Business Rules: Entities, Value Objects, Domain Events, Enums.
   - **Zero external dependencies** (no EF Core, no MediatR, no ASP.NET packages).
   - Encapsulate collection properties with `IReadOnlyCollection<T>` and private backing fields.
   - Audit interfaces: `IAuditable` (`CreatedAt`, `LastModifiedAt`, `CreatedBy`, `LastModifiedBy`), `ISoftDelete` (`IsDeleted`, `DeletedAt`).
   - Invariants must be enforced via private setters and factory methods.

2. **Application (`src/Application/`)**:
   - Contains CQRS Handlers (MediatR), Validators (FluentValidation), DTOs, Service Interfaces.
   - **Flow Control via `Result<T>`**: Never throw business exceptions for predictable control flow. Use `Result.Success(...)` or `Result.Failure(Error)`.
   - CQRS conventions:
     - Commands in `Commands/{FeatureName}/{FeatureName}Command.cs` returning `Task<Result<TResponse>>`.
     - Queries in `Queries/{FeatureName}/{FeatureName}Query.cs` returning `Task<Result<TResponse>>`.
     - Dedicated FluentValidation validator alongside command: `AbstractValidator<TCommand>`.

3. **Infrastructure (`src/Infrastructure/`)**:
   - Implements Application interfaces: EF Core DbContext, PostgreSQL mappings, Redis, JWT token services, Argon2id hashing, SignalR hubs, Google Auth service.
   - `AppDbContext`: Register `AuditableEntityInterceptor` for automatic timestamps & soft delete. Apply Global Query Filter for `ISoftDelete` (`IsDeleted == false`).
   - **Partial Unique Indexes for Soft-Deleted Entities**: When a table implements `ISoftDelete`, unique constraints must be partial:
     `builder.HasIndex(u => u.Email).IsUnique().HasFilter("is_deleted = false");`
   - **Transactions with Retry Strategy**: Always wrap explicit transactions within execution strategy:
     `var strategy = db.Database.CreateExecutionStrategy(); await strategy.ExecuteAsync(async () => { ... });`

4. **WebAPI (`src/WebAPI/`)**:
   - Thin presentation layer: Minimal API endpoints, API Controllers, and SignalR Hubs (`src/WebAPI/Hubs/`).
   - **No EF Core entities in controllers**: Controllers only receive DTOs/Commands and return standard `HandleResult(result)` / `HandleNoContentResult(result)`.
   - Uniform RFC 7807/9457 `ProblemDetails` for errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict.
   - **Auth Cookies**: Centralized in `AuthCookieHelper.cs`. Refresh tokens must be written exclusively to `HttpOnly`, `SameSite=Lax`, `Secure` cookies under path `/api/auth`.
   - OpenAPI: Native ASP.NET Core OpenAPI (`/openapi/v1.json`) with Scalar UI (`/scalar/v1`).
   - **SignalR Realtime Hub & Security (`/hubs/chat`)**:
     - **Pitfall #1 (WebSocket Query-String Token Extraction)**: Browser WebSocket handshakes cannot pass custom `Authorization: Bearer` headers. Configure `JwtBearerEvents.OnMessageReceived` via `JwtSignalRAuthExtensions.ConfigureSignalRAuthentication()` to extract token from `context.Request.Query["access_token"]` when path matches `/hubs/chat`.
     - **Strongly-Typed Hub Contracts**: Hubs inherit `Hub<TClient>` (e.g. `ChatHub : Hub<IChatClient>`) to eliminate magic strings and enforce compile-time verification for all broadcasts.
     - **Pitfall #4 (Group Poisoning & BOLA Defense)**: `JoinChannel(Guid channelId)` must verify user membership against `dbContext.ChannelMembers` and ensure `!m.Channel.IsDeleted` before `Groups.AddToGroupAsync`. Unauthorized attempts must log a warning, notify caller via `HubError`, and throw `HubException`.
     - **User Addressing**: ASP.NET Core SignalR maps `ClaimTypes.NameIdentifier` automatically so `Clients.User(userId.ToString())` targets all connections of that user across tabs.
     - **Two-Tier Real-Time Event Architecture (Persistent vs Ephemeral)**:
       - **Tier 1 (Persistent / Global State)**: ReceiveMessage, MessageReactionUpdated, ChannelUpdated, ChannelMembersUpdated. Delivered via Clients.Users(memberUserIds) to all channel members across the workspace, ensuring unread badges and sidebar previews update even when users are viewing other channels.
       - **Tier 2 (Ephemeral / In-Memory View-Scoped)**: UserTyping, UserStoppedTyping, cursor positions. Delivered exclusively via Clients.OthersInGroup(channelId.ToString()) to active viewers who called JoinChannel(channelId). Never broadcast ephemeral events to Clients.Users() to prevent massive bandwidth and CPU waste at scale.
   - **CORS & Correlation ID Middleware**:
     - CORS policy `ClientAppCorsPolicy` requires `.AllowCredentials()` and explicit origins (`http://localhost:5173`) to support WebSocket handshakes. Wildcard `*` origins are strictly prohibited.
     - Middleware sets `context.TraceIdentifier` to incoming or newly generated `X-Correlation-ID` header and echoes it back in responses.
   - **Development Seeding & Smoke Endpoints**:
     - `DbInitializer.SeedAsync(db, hasher, logger)` seeds 38 realistic users, 20 group channels, and 14 direct chats on startup in Development.
     - Smoke test endpoints in `Program.cs`: `GET /api/test/error` (validates RFC 7807/9457 `ProblemDetails` pipeline) and `POST /api/test/seed`.

---

## 2. Type Clarity, `var` Usage & C# Best Practices

1. **Strict Rules on `var` Usage**:
   - **DO NOT** use `var` indiscriminately across Application and Infrastructure layers.
   - **ALLOWED**: Only use `var` when the type is blatantly obvious from the right-hand side (RHS):
     ```csharp
     var settings = new GoogleJsonWebSignature.ValidationSettings();
     // Or target-typed new (preferred in modern C#):
     GoogleJsonWebSignature.ValidationSettings settings = new();
     ```
   - **FORBIDDEN (Must use explicit types)**:
     - Method calls: `Result<GoogleUserPayload> validation = await service.ValidateAsync(...)`
     - Database queries: `User? user = await context.Users.FirstOrDefaultAsync(...)`
     - Domain operations: `string token = jwtService.GenerateAccessToken(user)`
     - Nullable types: Always explicitly flag `User?` or `string?` so IDE and developers are forced to check nullability.
     - Preventing namespace collisions: Avoid ambiguous types that shadow sibling namespaces (e.g. `Commands.RefreshToken` vs `Entities.RefreshToken`).

2. **High-Performance Object Mapping with `Riok.Mapperly`**:
   - **BANNED**: Legacy reflection-based mappers (AutoMapper) are strictly forbidden due to runtime overhead, lack of compile-time safety, and AOT incompatibility.
   - **STANDARD**: Use compile-time Roslyn Source Generator **`Riok.Mapperly`**:
     ```csharp
     [Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
     public static partial class AuthMappingExtensions
     {
         public static partial UserDto ToDto(this User user);
     }
     ```
   - Invocation in handlers: `UserDto userDto = user.ToDto();` (0% reflection, 100% compile-time verified).

---

## 3. Security, Token Handling & Decoupled Authentication

1. **Decoupled SPA vs Monolithic MVC Authentication**:
   - Traditional ASP.NET Core MVC `AddGoogle()` redirection is unsuitable for decoupled React SPA + Web API architectures.
   - Use direct token verification in `GoogleAuthService` supporting dual modes:
     1. Google JWT `id_token` validation with Audience (`ClientId`) verification via Google JWKS.
     2. Google OAuth2 `access_token` verification via Google `tokeninfo` (Audience match) + `userinfo` Bearer profile fetch.

2. **Token Encapsulation & Response DTO Decoupling**:
   - **Internal Application Model**: `AuthResult(UserDto User, string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt)`. Contains the refresh token for the controller to write to cookie.
   - **External Wire Model (HTTP JSON Response)**: `AuthResponse(UserDto User, string AccessToken)`.
   - **NEVER** expose the raw `RefreshToken` in the JSON response body. Secure it exclusively in `HttpOnly`, `SameSite=Lax`, `Secure` cookies to mitigate XSS credential theft.

3. **Argon2id Password Hashing**:
   - Memory cost >= 64MB (65536 KB), iterations >= 3, parallelism >= 1.

4. **Refresh Token Rotation & Reuse Detection**:
   - Every refresh replaces the current token with a newly generated one (Rotation).
   - If an expired or revoked token is presented, **revoke all active sessions for that user** (Reuse Attack Mitigation).
   - Store hashed token or cryptographic random GUID string in PostgreSQL `RefreshTokens` table with `FamilyId`, `IsRevoked`, `ExpiresAt`.

---

## 4. Unit & Integration Testing Standards

1. **Test Location**: All backend tests reside in `tests/MessengerApp.Application.UnitTests/`.
2. **Stack**: xUnit + FluentAssertions + NSubstitute + EF Core InMemory / Testcontainers.
3. **Coverage Mandates**:
   - Every Command Handler must have unit tests covering:
     - Happy path scenario.
     - Conflict scenarios (e.g., duplicate email/username returning 409 Conflict).
     - Security scenarios (wrong password, token expiration, revoked token reuse attack).
4. Run tests with: `dotnet test tests/MessengerApp.Application.UnitTests --nologo`.
