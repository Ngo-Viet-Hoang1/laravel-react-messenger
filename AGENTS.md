# Workspace Agent Guidelines

This file is the entry point for AI agents working in this repository. Read it first, then read the domain-specific guide before editing code:

- Backend: `src/AGENTS.md`
- Frontend: `client/AGENTS.md`

If instructions conflict, this file wins for workspace governance. The domain guides win for layer-specific implementation details. `README.md` is the source of truth for the current product and stack.

---

## 1. Workspace Map

| Path | Purpose |
|---|---|
| `src/Domain` | Pure domain entities, enums, audit/soft-delete contracts, invariants |
| `src/Application` | CQRS commands/queries, handlers, validators, DTOs, service interfaces |
| `src/Infrastructure` | EF Core/PostgreSQL, JWT, Argon2id, Google auth, S3 storage, presence |
| `src/WebAPI` | Controllers, SignalR hub, middleware, OpenAPI, auth cookie helpers |
| `client/` | React 19 + TypeScript + Vite frontend using Feature-Sliced Design |
| `tests/MessengerApp.Application.UnitTests/` | Active xUnit backend test suite |
| `archive/` | Frozen legacy Laravel implementation; historical reference only |
| `docker-compose.yml` | Local PostgreSQL and MinIO services |

The active application is the .NET 10 + React 19 implementation. Do not use `archive/` as a source of truth for current behavior.

---

## 2. Non-Negotiable Rules

1. **Never modify `archive/`.**
   - No edits, formatting, refactoring, renaming, or deletion.
   - Do not run formatters or package managers against it.
   - It is an immutable historical artifact.

2. **Keep active code inside the active workspace.**
   - Backend changes belong in `src/` and `tests/MessengerApp.Application.UnitTests/`.
   - Frontend changes belong in `client/`.
   - Do not create new top-level folders without approval.

3. **Contract-first synchronization is mandatory.**
   - After changing backend endpoints, DTOs, commands, or queries:
     1. Run the API so OpenAPI is available at `http://localhost:5212/openapi/v1.json`.
     2. Run `pnpm --dir client run api:generate`.
     3. Verify `client/src/shared/api/schema.d.ts` reflects the change.
   - Do not hand-write duplicate request/response types.

4. **Never commit secrets.**
   - Do not add real JWT keys, database passwords, Google credentials, or storage keys.
   - Existing development secrets in `appsettings.json` and `docker-compose.yml` are local-only and must be replaced before deployment.

5. **Do not stage the whole repository blindly.**
   - This workspace can show stat-only line-ending noise from `core.autocrlf`.
   - Do not run `git add -A` or commit without inspecting `git status` and `git diff`.
   - Never commit `archive/`, build output, local env files, or generated noise.

6. **Keep documentation honest.**
   - Do not claim production readiness, zero-knowledge E2EE, or features that are not implemented.
   - The current secret-room model is passphrase-based AES-GCM, not Signal Protocol.

---

## 3. Active Stack

- .NET 10, ASP.NET Core, C# nullable enabled
- MediatR 12, FluentValidation 12, Riok.Mapperly 4
- EF Core 10 + Npgsql, PostgreSQL 16
- SignalR WebSockets at `/hubs/chat`
- AWSSDK.S3 with MinIO locally
- JWT access tokens + refresh cookies, Google sign-in, Argon2id
- React 19, TypeScript 5.7, Vite 6, TanStack Query 5
- Redux Toolkit for in-memory auth state, Zustand for transient UI/secret-room state
- Tailwind CSS 4, Radix UI, Zod, React Hook Form
- pnpm 10 for frontend dependency management

The active .NET app does **not** currently include the legacy Laravel admin panel, premium/PayPal flow, AI suggestions, or Reverb broadcasting. Do not reintroduce those patterns from `archive/` unless explicitly requested.

---

## 4. Backend Rules

Read `src/AGENTS.md` for the full guide. Core expectations:

- Domain has no EF Core, MediatR, or ASP.NET dependencies.
- Application uses `Result<T>` for expected failures; do not throw for normal control flow.
- Commands and queries return `Task<Result<TResponse>>`.
- Add FluentValidation validators alongside commands.
- Use explicit types instead of `var` except when the type is obvious from the right-hand side.
- Use Mapperly for DTO mapping; do not introduce AutoMapper.
- Controllers stay thin: receive DTOs/commands, call MediatR, return `HandleResult`/`HandleNoContentResult`.
- Do not return EF entities from controllers.
- Use RFC 7807/9457 `ProblemDetails` for errors.
- Use partial unique indexes for soft-deleted entities.
- Wrap explicit transactions in EF Core execution strategies.

### Authentication and cookies

- Access tokens are short-lived and returned in the JSON response.
- Refresh tokens must never appear in JSON response bodies.
- Refresh tokens belong in `HttpOnly`, `Secure`, `SameSite=Lax` cookies scoped to the auth path.
- Refresh-token rotation and reuse detection must be preserved.
- Google login supports both ID-token and access-token verification paths.

### SignalR

- Hubs use strongly typed `Hub<TClient>` contracts.
- Browser WebSocket handshakes pass the JWT via `?access_token=...`; keep the `OnMessageReceived` extraction configured.
- `JoinChannel` must verify membership and that the channel is not deleted before adding the connection to a group.
- Persistent events go to affected users; ephemeral typing events go only to active channel viewers.
- Keep CORS explicit (`http://localhost:5173`) with credentials enabled; never use wildcard origins.

---

## 5. Frontend Rules

Read `client/AGENTS.md` for the full guide. Core expectations:

- Respect FSD dependency direction: `app -> pages -> widgets -> features -> entities -> shared`.
- Do not cross-import between slices except through public `index.ts` APIs.
- Keep pages thin; compose widgets instead of building God components.
- Put server state in TanStack Query under `entities/<entity>/api/`.
- Keep auth/session state in Redux Toolkit; keep transient UI and secret-room state in Zustand.
- Do not store tokens in `localStorage` or `sessionStorage`.
- Use the shared `api` wrapper, not raw Axios calls scattered through components.
- Update query caches directly for SignalR events; avoid blanket invalidation on every event.
- Clean up SignalR subscriptions and keyboard listeners on unmount.
- Use existing shared UI primitives before creating new ones.
- Follow the existing Tailwind/Radix design system; avoid flashy one-off styles.
- Use `pnpm`, not `npm`.

---

## 6. Verification Commands

### Infrastructure

```bash
docker compose up -d
```

### Backend

```bash
dotnet restore MessengerApp.slnx
dotnet ef database update --project src/Infrastructure --startup-project src/WebAPI
dotnet run --project src/WebAPI/MessengerApp.WebAPI.csproj
dotnet build MessengerApp.slnx
dotnet test tests/MessengerApp.Application.UnitTests --nologo
```

### Frontend

```bash
pnpm --dir client install
pnpm --dir client dev
pnpm --dir client lint
pnpm --dir client build
pnpm --dir client run api:generate
```

### Local URLs

- Client: `http://localhost:5173`
- API: `http://localhost:5212`
- OpenAPI: `http://localhost:5212/openapi/v1.json`
- Scalar: `http://localhost:5212/scalar/v1`
- Health: `http://localhost:5212/api/health`
- MinIO console: `http://localhost:9001`

### Development seed data

- 35 users, 10 group channels, 8 direct conversations, roughly 280 messages
- Default password: `Password123!`
- Example accounts: `admin@messenger.local`, `alex.rivers@messenger.local`

---

## 7. Testing Expectations

- Every backend behavior change needs a unit test or an updated existing test.
- Prefer focused test runs while iterating, then run the affected suite.
- Cover happy paths, conflict paths, authorization failures, and security-sensitive flows.
- The active test project is `tests/MessengerApp.Application.UnitTests/`.
- Legacy Laravel/PHP tests under the repository root are not part of active validation.
- Do not remove tests without approval.

---

## 8. Known Drift and Cleanup Backlog

These are known inconsistencies to fix when working in the relevant area:

- `src/AGENTS.md` still says 38 users, 20 groups, and 14 direct chats; actual seed data is 35/10/8.
- The stated Argon2id target is 64 MB and 3 iterations, but the current implementation uses lower parameters.
- Refresh tokens are currently stored as raw values; hashing at rest is still a hardening task.
- Cookie settings and auth-path scoping need a production review.
- Auth and message endpoints do not yet have comprehensive rate limiting.
- Any member can add members in some channel flows; ownership/role checks need auditing.
- Secret-room passphrases cannot be rotated yet; changing one would require re-encrypting message history.
- Attachment download authorization should be audited end-to-end.
- Presence tracking is in-memory and needs a backplane before multi-instance deployment.
- `archive/` contains outdated Laravel documentation and must not be used to infer current behavior.
- The repository currently has no `LICENSE` file.

When fixing one of these, update the relevant docs and add or adjust tests.

---

## 9. Documentation Rules

- Keep `README.md` aligned with the active .NET/React implementation.
- Do not add new documentation files unless explicitly requested.
- Prefer updating existing guides over creating parallel ones.
- When a feature, endpoint, or setup step changes, update the README and the relevant AGENTS guide.
- Do not document planned features as if they already exist.
