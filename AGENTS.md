# Repository Guidelines

> Agent and contributor reference for DQuote (Next.js + Prisma + Tailwind).

## Project Structure & Module Organization
- App routes and UI: `src/app/...` (Next.js App Router). Example: `src/app/(app)/quotes/page.tsx`.
- Components and hooks: `src/components/**`, `src/hooks/**`.
- Server logic: `src/server/**` (auth, pricing, pdf, email).
- Domain libs: `src/lib/**` (utils, currency, data, navigation).
- Auth helpers: `src/auth/**`; middleware in `middleware.ts`.
- Database: `prisma/schema.prisma`, migrations in `prisma/migrations/**`, seed in `prisma/seed.ts`.
- Tests: minimal targeted tests under `src/server/**` and `tests/**`.
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `prettier.config.mjs`, `tailwind.config.ts`.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js dev server.
- `npm run build` — Build app (runs `prisma generate` via `prebuild`).
- `npm start` — Run production server.
- `npm run lint` — ESLint via Next config.
- `npm run format` — Prettier with Tailwind plugin.
- `npm run test:pricing` — TS test for pricing rules.
- Prisma: `npm run migrate:create`, `npm run migrate:apply`, `npx prisma studio`.

## Coding Style & Naming Conventions
- TypeScript, React 19, Next 15; Tailwind v4 for styling.
- Indentation: 2 spaces; prefer named exports.
- Filenames: kebab-case for files, PascalCase for React components.
- Components in `src/components/ui/**` mirror shadcn patterns.
- Linting: ESLint (`npm run lint`); Formatting: Prettier (`npm run format`).
- Keep server-only code in `src/server/**`; avoid importing server modules in client components.

## Testing Guidelines
- Use `tsx`-run TS tests (see `src/server/pricing/rules.test.ts`).
- Place unit tests next to modules or under `tests/**`.
- Name tests `*.test.ts` or `*.spec.ts[x]`.
- Aim to cover pricing rules, auth guards, and critical data transforms.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject; scope in parentheses when relevant.
  - Example: `feat(quotes): add bulk select to table`.
- Include rationale in body when changing behavior or schema.
- PRs: clear description, linked issues, screenshots for UI, and steps to validate.
- For schema changes, include migration and update `prisma/seed.ts` if needed.

## Security & Configuration Tips
- Copy `.env.example` to `.env`. Never commit secrets.
- Stripe and auth callbacks live under `src/app/api/**`; validate inputs with `zod`.
- When adding server routes, use App Router handlers and keep side effects isolated.
