# WORKLOG

## 2025-02-14 — Prisma migration guard for dashboard

- Added `prisma migrate deploy` to the `pnpm build` pipeline so Neon production migrations apply during deploys.
- Documented the build prerequisite in the README and added a dashboard fallback when the `OrgMember` table is missing.

## Planned File Touches

- PLAN.md
- README.md
- middleware.ts
- package.json
- package-lock.json
- prettier.config.mjs
- src/app/page.tsx
- src/app/(marketing)/layout.tsx
- src/app/(marketing)/page.tsx
- src/app/(marketing)/docs/page.tsx
- src/app/(auth)/login/page.tsx
- src/app/(auth)/signup/page.tsx
- src/components/auth/auth-card.tsx
- src/components/typography.tsx
- src/components/app-sidebar.tsx
- src/components/ui/sidebar.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/loading.tsx
- src/app/dashboard/error.tsx
- src/app/dashboard/data.json
- src/app/quotes/page.tsx
- src/app/quotes/loading.tsx
- src/app/quotes/error.tsx
- src/app/quotes/columns.tsx
- src/app/quotes/data-table.tsx
- src/app/quotes/schema.ts
- src/app/(app)/layout.tsx
- src/app/(app)/dashboard/page.tsx
- src/app/(app)/dashboard/loading.tsx
- src/app/(app)/dashboard/error.tsx
- src/app/(app)/dashboard/data.json
- src/app/(app)/quotes/page.tsx
- src/app/(app)/quotes/loading.tsx
- src/app/(app)/quotes/error.tsx
- src/app/(app)/quotes/columns.tsx
- src/app/(app)/quotes/data-table.tsx
- src/app/(app)/quotes/schema.ts
- src/app/api/auth/log/route.ts
- src/app/(marketing)/support/page.tsx
