# Repository Guidelines

## Project Structure & Module Organization
Keep UI routes under `src/app/**` using the App Router, e.g. `src/app/(app)/quotes/page.tsx`. Place shared UI and hooks in `src/components/**` and `src/hooks/**`; server-only logic lives in `src/server/**`. Store domain utilities in `src/lib/**`, auth helpers in `src/auth/**`, and Prisma assets inside `prisma/`. Add focused tests alongside code or in `tests/**` and keep migrations in `prisma/migrations/**` with `prisma/schema.prisma` as the schema source of truth.

## Build, Test, and Development Commands
Use `npm run dev` for the Next.js dev server and `npm run build` to create a production bundle (runs `prisma generate`). Start the compiled app with `npm start`. Run linting via `npm run lint`, formatting through `npm run format`, and targeted pricing checks with `npm run test:pricing`. Manage migrations using `npm run migrate:create` and `npm run migrate:apply`; inspect data with `npx prisma studio`.

## Coding Style & Naming Conventions
Write TypeScript/React with 2-space indentation and prefer named exports. Follow Next.js 15, React 19, and Tailwind v4 patterns; UI primitives belong in `src/components/ui/**` mirroring shadcn naming. Use kebab-case filenames, PascalCase React components, and run Prettier + Tailwind formatting before commits.

## Testing Guidelines
Tests execute with tsx-run; name files `*.test.ts` or `*.spec.tsx`. Prioritize pricing rules, auth guards, and core data transforms. Run suites locally with `npm run test:pricing` and place new specs next to the logic they cover. Investigate and resolve failures before re-running to keep feedback fast.

## Commit & Pull Request Guidelines
Adopt `<type>(<scope>): <imperative summary>` commit messages, e.g. `feat(quotes): add bulk select to table`. PRs should describe the rationale, link relevant issues, and include UI screenshots whenever behavior changes. Ensure schema edits ship with matching migrations and update `prisma/seed.ts` for new data expectations.

## Security & Configuration Tips
Copy `.env.example` to `.env`, keep secrets out of version control, and validate inputs in `src/app/api/**` using `zod`. Isolate side effects within server handlers, respect sandbox constraints, and avoid destructive commands without explicit approval.
