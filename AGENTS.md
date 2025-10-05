# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `src/app/**`; feature routes stay grouped under `(app)` folders such as `src/app/(app)/quotes/page.tsx`. Shared UI primitives belong in `src/components/ui/**`, while broader reusable components and hooks live in `src/components/**` and `src/hooks/**`. Server-only logic resides in `src/server/**`, auth helpers in `src/auth/**`, and domain utilities in `src/lib/**`. Prisma schema files sit in `prisma/schema.prisma`, with generated migrations under `prisma/migrations/**`. Co-locate focused tests with their subjects or place wider suites in `tests/**`.

## Build, Test, and Development Commands
Use `npm run dev` for the hot-reloading development server. Run `npm run build` to produce the production bundle and regenerate Prisma clients, then `npm start` to verify the build. Surface lint, TypeScript, and Tailwind issues with `npm run lint`; apply Prettier and class sorting via `npm run format`. Database migrations are applied with `npm run migrate:apply`, while `npm run migrate:create` scaffolds new ones. Inspect data locally using `npx prisma studio`.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and prefer named exports. React components use PascalCase, while file names follow kebab-case (`quote-list.tsx`). Mirror shadcn patterns for UI primitives stored in `src/components/ui/**`. Before committing, run `npm run format` to keep imports, Prettier rules, and Tailwind class order synchronized.

## Testing Guidelines
Tests rely on tsx-run; name specs `*.test.ts` or `*.spec.tsx` and store them near the implementation when practical. Prioritize coverage for pricing rules, auth guards, and data transforms. Execute the focused suite with `npm run test:pricing` and ensure failing tests are resolved before rerunning to preserve useful feedback.

## Commit & Pull Request Guidelines
Format commit messages as `<type>(<scope>): <imperative summary>` (`feat(quotes): add bulk select`). Pull requests should describe intent, link relevant issues, and include screenshots for UI changes. Pair Prisma schema edits with matching migrations and keep `prisma/seed.ts` aligned with new expectations.

## Security & Configuration Tips
Copy `.env.example` to `.env` without committing secrets. Validate data flowing through `src/app/api/**` using `zod`, and keep side effects within server actions. Make destructive tasks explicit and respect the workspace sandbox when requesting elevated commands.
