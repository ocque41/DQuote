# IMPLEMENTATION REPORT — Sprint 18

## Environment Checks
- `DATABASE_URL` (local shell): **not configured** in this workspace. Unable to confirm Neon branch/host.
- Neon connection + migrations list: **not executed** (missing database credentials).
- Table inventory query: **not executed** (missing database credentials).

## Actions Taken
- Updated `pnpm build` to run `prisma generate && prisma migrate deploy && next build` so production deploys automatically apply pending migrations.
- Added a server-component guard on `/dashboard` that surfaces a friendly message and server log when Prisma raises `P2021` for the `OrgMember` table.
- Documented the new migration requirement in the README and WORKLOG.

## Follow-up for Deploy Owners
1. Ensure Vercel’s `DATABASE_URL` / `DIRECT_URL` values point to the intended Neon production branch.
2. From a trusted environment with access to Neon, run:
   ```sql
   SELECT migration_name, applied_steps_count, finished_at
   FROM "_prisma_migrations"
   ORDER BY finished_at DESC NULLS LAST;
   ```
   ```sql
   SELECT table_schema, table_name
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name ILIKE '%org%';
   ```
3. Apply pending migrations: `npx prisma migrate deploy` (or `pnpm build`) with production credentials, then redeploy.
