# Repository Guidelines

## Project Structure & Module Organization
- App Router pages live under `src/app/**`; feature routes stay grouped under `(app)` segments (e.g., `src/app/(app)/quotes/page.tsx`).
- Shared UI primitives belong in `src/components/ui/**`; broader reusable components and hooks sit in `src/components/**` and `src/hooks/**`.
- Keep server-only handlers within `src/server/**`, auth helpers in `src/auth/**`, and domain utilities in `src/lib/**`.
- Prisma schema and migrations live in `prisma/`; only Prisma-generated assets go under `prisma/migrations/**`. Co-locate focused tests with their subjects or store broader suites in `tests/**`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server with hot reloading.
- `npm run build` compiles the production bundle and runs `prisma generate`; launch it via `npm start`.
- `npm run lint` surfaces TypeScript, ESLint, and Tailwind issues; `npm run format` applies Prettier and Tailwind class sorting.
- `npm run migrate:apply` applies pending Prisma migrations; `npm run migrate:create` scaffolds a new migration; `npx prisma studio` inspects data; `npm run test:pricing` targets pricing specs.

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation, named exports, and React components in PascalCase.
- Follow kebab-case for filenames and mirror shadcn UI patterns inside `src/components/ui/**`.
- Run `npm run format` before commits to align Prettier, Tailwind, and import ordering.

## Testing Guidelines
- Tests execute with tsx-run; name files `*.test.ts` or `*.spec.tsx` and keep them near the code they validate when practical.
- Prioritize pricing rules, auth guards, and data transforms; fix failures before rerunning to keep feedback fast.
- Use `npm run test:pricing` for focused coverage and add complementary suites alongside new modules.

## Commit & Pull Request Guidelines
- Format commits as `<type>(<scope>): <imperative summary>` (e.g., `feat(quotes): add bulk select to table`).
- Describe intent, link relevant issues, and attach screenshots for UI-affecting changes.
- Pair Prisma schema updates with migrations and adjust `prisma/seed.ts` when seed expectations change.

## Security & Configuration Tips
- Copy `.env.example` to `.env`, never commit secrets, and validate API inputs in `src/app/api/**` with `zod`.
- Keep side effects inside server actions, honor the workspace sandbox, and avoid destructive commands without explicit approval.
