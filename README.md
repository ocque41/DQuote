# DQuote — Interactive Proposal Builder

DQuote is an interactive proposal experience that blends CPQ logic, curated slides, portfolio proofs, and instant acceptance. Prospects walk through a short slide sequence, compare A/B options, toggle add-ons, watch totals update in real time, and finish by accepting + paying a deposit via Stripe Checkout. After acceptance they can immediately book a kickoff demo.

## Architecture Overview
- **Next.js 15 App Router** with server components, route groups for marketing vs. application surfaces, and Route Handlers for APIs.
- **Prisma** data model targeting Supabase Postgres (manual SQL migration generated via `prisma migrate diff`).
- **React Query + Server Actions** for optimistic selection updates and analytics logging.
- **Stripe Checkout** (App Router handler) for deposit payments.
- **shadcn/ui** components sourced from a custom local registry (`registry/*.json`).
- **Tailwind CSS v4** with design tokens mapped to proposal themes.

> **Binary assets policy:** The project intentionally ships without binary image assets (including the default Next.js favicon) so that pull requests remain compatible with the “no binary files” guardrail in our workflow. When you scaffold new features, replace media with text-based placeholders (SVG-as-text, data URIs, etc.) or host assets externally.

## Baseline Dependencies
The project already includes the core libraries required for Sprint 0. Key packages to verify after running `pnpm install`:
- `zod`, `react-hook-form`, and `@hookform/resolvers` for form validation.
- `@tanstack/react-query` and `@tanstack/react-query-devtools` for client data fetching.
- `prisma` and `@prisma/client` for database access.
- `stripe` and `@stripe/stripe-js` for payments.
- `puppeteer` for PDF generation.

## Getting Started
```bash
pnpm install
cp .env.example .env.local # populate with Supabase + Stripe credentials
pnpm dev
```
Visit `http://localhost:3000/` for the marketing site, `/app` for the internal dashboard, and `/proposals/dq-demo-aurora` for the seeded interactive experience.

### Environment Variables
`.env.example` documents the required configuration:
- `DATABASE_URL` / `DIRECT_URL`: Supabase Postgres connection strings.
- `NEXT_PUBLIC_APP_URL`: Base URL for success/cancel redirects.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `ENCRYPTION_KEY`: Reserved for future secure payload handling (32 chars).

## Database & Prisma Workflow
1. **Generate SQL migration (manual review first):**
   ```bash
   # Requires a running Postgres database when using migrate dev
   DIRECT_URL=... DATABASE_URL=... pnpm run migrate:create -- --name init
   ```
   The command writes a new folder under `prisma/migrations/` (e.g. `20250926194629_init/migration.sql`) without applying it so you can inspect the SQL before rollout.
2. **Apply migrations locally or against Supabase:**
   ```bash
   DIRECT_URL=... DATABASE_URL=... pnpm run migrate:apply
   ```
3. **Seed demo data:**
   ```bash
   pnpm exec prisma db seed
   ```
  The seed script inserts an org, catalog items (with portfolio tags), tagged assets, analytics events, and a proposal with the slide flow `INTRO → CHOICE_CORE → ADDONS → PORTFOLIO → REVIEW → ACCEPT` so you can exercise the interactive deck end-to-end.

> **Note:** Prisma warns that the `package.json#prisma` config is deprecated. For Supabase deployment, you can move the `seed` command into a `prisma.config.ts` or Vercel build step when ready.

## Supabase Notes
- Create a Supabase project and enable the native Postgres connection string (non-pooled) for `DIRECT_URL` when using Prisma migrate.
- Provision a service role key if you plan to run serverless functions that manipulate data outside of Prisma.
- Configure Supabase Row Level Security policies as you move beyond the seeded demo org.

## Stripe Integration
- Configure test keys in `.env.local` and ensure `NEXT_PUBLIC_APP_URL` reflects your dev domain.
- Create a webhook endpoint pointing to `/api/stripe/webhook` (future enhancement) and store the signing secret in `STRIPE_WEBHOOK_SECRET`.
- After acceptance the `/api/stripe/checkout` handler launches a deposit-only Checkout Session (line item name `DQuote Deposit — <proposal title>`) using the stored quote totals, so the client only needs to provide the `shareId`.

## PDF Receipts
- `/proposals/[shareId]/receipt` renders a printable recap (totals, selections, acceptance metadata) for the active quote.
- The acceptance handler uses Puppeteer to load that page and write the PDF under `public/receipts/` (configurable via `PUPPETEER_EXECUTABLE_PATH` if you bundle Chromium separately).
- The resulting `pdfUrl` is stored on the quote and surfaced to the proposal runtime so clients can download the receipt immediately after acceptance.

## shadcn/ui with Custom Registry
Components are installed from the local registry at `registry/`. Two convenient options:

1. **Manual command:**
   ```bash
   CI=1 npx --yes shadcn@latest add ./registry/button.json
   ```
2. **Helper script:**
   ```bash
   ./scripts/add-ui.sh button
   ./scripts/add-ui.sh card
   ./scripts/add-ui.sh form
   ```
   The script resolves JSON definitions within the local registry and runs the CLI with `CI=1` to disable spinners.

Need to pull these components into another project with the familiar registry syntax (`@cumulus/button`)?

3. **Serve the registry locally and consume via `@cumulus`:**
   ```bash
   # Terminal A: expose the registry (defaults to http://localhost:4000)
   pnpm run registry:serve

   # Terminal B: from the target project with `components.json` pointing
   #             @cumulus -> http://localhost:4000/{name}.json
   pnpm dlx shadcn@latest add @cumulus/button
   ```
   The tiny HTTP server streams JSON from `registry/`, responds to `/registry.json`
   with an aggregated index, and enables `pnpm dlx shadcn@latest add @cumulus/<item>`
   to succeed without the "Unknown registry" error. If your shell exports
   `HTTP_PROXY` / `HTTPS_PROXY`, set `NO_PROXY=localhost,127.0.0.1` (and clear the
   proxy variables) while running the command so the CLI can talk to the local server.

## Available Scripts
- `pnpm dev` — start Next.js in development mode.
- `pnpm build` / `pnpm start` — production build & run.
- `pnpm lint` — lint with Next.js config.
- `pnpm test:pricing` — execute the pricing rules engine unit tests via `node:test`.
- `pnpm run migrate:create` — generate migration SQL (requires Postgres).
- `pnpm run migrate:apply` — apply migrations to the configured database.
- `pnpm prisma db seed` — run the demo seed script via `tsx`.

## Sample Flow
1. Seed the database (`pnpm prisma db seed`).
2. Open `http://localhost:3000/proposals/dq-demo-aurora`.
3. Step through slides, toggle add-ons, and watch totals update alongside the portfolio panel as it refreshes with 2–4 matched proofs.
4. On the **Review** step, capture the acceptor name and email to prep the signature record.
5. Move to **Accept** and click **Accept proposal** to store the signature metadata and compute the 20 % deposit.
6. Hit **Pay deposit via Stripe** to launch Checkout (requires valid test keys); returning with `session_id` marks the quote as paid and updates the runtime badge.
7. Download the PDF receipt from the success panel and share it with the client if needed.
8. Use the **Schedule kickoff demo** button to drive the Calendly hand-off.

## Project Structure Highlights
```
src/app/(marketing)      # Marketing site
src/app/(app)            # Authenticated dashboard + proposal runtime
src/app/api              # Route Handlers (pricing, proposals, accept, stripe)
src/components/proposal  # Client runtime UI
prisma/                  # Schema, migrations, seed data
docs/user-stories        # User stories for Sprint 1
registry/                # Custom shadcn registry items
```

## API Endpoints
- `POST /api/pricing` — calculate subtotal, tax, and total for a proposal based on the provided selections.
  - Responds with `400` when selections violate require/mutex rules and includes a `violations` array for context.
- `POST /api/accept` — validate the acceptor details, persist signature metadata (UUID, timestamp, IP/UA), generate the receipt PDF, and respond with the computed 20 % deposit amount plus the `pdfUrl`.
- `POST /api/stripe/checkout` — create a Stripe Checkout Session for the stored deposit, persist the session/payment IDs, and return the hosted payment URL.

## Testing & Quality
- `pnpm lint`
- `pnpm test:pricing`
- Run `pnpm dev` and interact with `/proposals/dq-demo-aurora` to validate live pricing & flows.
- Stripe Checkout requires valid test keys; use Stripe CLI or dashboard to inspect sessions.

## Next Steps
- Plug in Supabase auth & multi-org permissions.
- Implement Stripe webhook handler to mark invoices paid.
- Expand pricing rules to support stacked promotions and time-bound incentives.
- Email the generated PDF receipt to the acceptor as part of a confirmation workflow.
