# Laravel React Messenger Guidelines

## Code Style
- Backend: Follow Laravel conventions and keep business logic out of routes; use controllers, form requests, and Eloquent models.
- Frontend: Use TypeScript strict mode patterns already used in this project (`strict: true`), and prefer existing components/layouts before introducing new UI primitives.
- Keep changes minimal and scoped to the task; avoid broad refactors unless requested.

## Architecture
- Backend is Laravel 13 in `app/` with route entry points in `routes/web.php` and `routes/auth.php`.
- Frontend is Inertia + React in `resources/js/` with pages resolved from `resources/js/Pages/**/*.tsx` in `resources/js/app.tsx`.
- Authentication baseline comes from Breeze-style controllers/pages; preserve middleware and named-route patterns.
- Real-time stack uses Reverb/Echo (`configureEcho` in `resources/js/app.tsx`), but messaging features are still being scaffolded.

## Build And Test
- Initial setup: `composer run-script setup`
- Full local dev stack (server, queue, logs, Vite): `composer run-script dev`
- Frontend dev only: `npm run dev`
- Frontend production build: `npm run build`
- Lint/fix frontend: `npm run lint`
- Run tests: `php artisan test` (test environment uses in-memory SQLite from `phpunit.xml`)

## Conventions
- Use Inertia page names that map to file paths under `resources/js/Pages`.
- Use the `@/` alias for imports from `resources/js` (configured in `tsconfig.json`).
- Keep auth-protected routes inside middleware groups and preserve route names used by frontend `route()` calls.
- Tailwind scan targets include Blade and TSX files; keep UI code in scanned paths so styles compile.
- Prefer additive migration changes; do not edit old migrations unless explicitly requested.

## Project Pitfalls
- `README.md` is mostly upstream Laravel boilerplate; prioritize repository files over README assumptions.
- Local app environment is configured for MySQL in `.env.example`; keep migrations and queries compatible with MySQL unless explicitly changing database engine.
- Realtime/broadcasting plumbing exists, but channel/event wiring may be incomplete; verify end-to-end flow before claiming realtime behavior works.

## References
- See `composer.json` scripts for the canonical dev/test workflow.
- See `package.json` scripts for frontend build/lint commands.
- See `resources/js/app.tsx` for Inertia page resolution and Echo setup.
- See `routes/web.php` and `routes/auth.php` for route organization patterns.
