# Repository Guidelines

## Project Structure & Module Organization
Keep UI routes under `src/app/**` using the App Router, e.g. `src/app/(app)/quotes/page.tsx`. Shared components and hooks live in `src/components/**` and `src/hooks/**`; server-only logic belongs in `src/server/**`. Domain utilities reside in `src/lib/**`, while authentication helpers stay under `src/auth/**` with middleware in `middleware.ts`. Database assets are managed through `prisma/schema.prisma`, `prisma/migrations/**`, and `prisma/seed.ts`. Place focused tests next to modules or under `tests/**`.

## Build, Test, and Development Commands
Use `npm run dev` for the Next.js dev server, and `npm run build` to create a production bundle (automatically runs `prisma generate`). Start the built app with `npm start`. Lint and format prior to PRs via `npm run lint` and `npm run format`. Execute targeted pricing tests with `npm run test:pricing`; invoke Prisma workflows with `npm run migrate:create`, `npm run migrate:apply`, and `npx prisma studio`.

## Coding Style & Naming Conventions
Write TypeScript/React with 2-space indentation and prefer named exports. Follow Next.js 15, React 19, and Tailwind v4 patterns; UI components mirror shadcn style under `src/components/ui/**`. Use kebab-case filenames, PascalCase React components, and run the Prettier + Tailwind formatter through `npm run format`.

## Testing Guidelines
Tests rely on tsx-run; keep naming `*.test.ts` or `*.spec.tsx`. Prioritize pricing rules, auth guards, and critical data transforms. Run suites with `npm run test:pricing`, and add new tests alongside the code they cover. Investigate failures before re-running to maintain fast feedback.

## Commit & Pull Request Guidelines
Commit messages follow `<type>(<scope>): <imperative summary>` such as `feat(quotes): add bulk select to table`. PRs must describe rationale, link relevant issues, and include UI screenshots when behavior changes. Ensure migrations accompany schema edits and update `prisma/seed.ts` as needed.

## Security & Configuration Tips
Copy `.env.example` to `.env` locally and avoid committing secrets. Validate inputs in `src/app/api/**` with `zod`, and isolate side effects within server handlers. Respect sandbox boundaries; escalate commands only when necessary.
