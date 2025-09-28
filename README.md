# DQuote — Interactive Proposal Builder

DQuote is an interactive proposal experience that blends CPQ logic, curated slides, portfolio proofs, and instant acceptance. Prospects walk through a short slide sequence, compare A/B options, toggle add-ons, watch totals update in real time, and finish by accepting + paying a deposit via Stripe Checkout. After acceptance they can immediately book a kickoff demo.

## Architecture Overview

- **Next.js 15 App Router** with server components, route groups for marketing vs. application surfaces, and Route Handlers for APIs.
- **Prisma** data model targeting Neon Postgres (manual SQL migration generated via `prisma migrate diff`).
- **Neon Auth (Stack)** with App Router provider + handler, syncing users into `neon_auth.users_sync` and gating `/app` + `/admin` via middleware and server utilities.
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
cp .env.example .env.local # populate with Neon Auth keys, Neon database URLs, Blob, and Stripe credentials
pnpm dev
# Validate the production build locally before deploying
pnpm build
```

> **Heads up:** `pnpm build` now runs `prisma migrate deploy` before `next build`.
> Make sure `DATABASE_URL` (and `DIRECT_URL` when required) point at the database
> you intend to migrate before running the command locally or in CI.

Visit `http://localhost:3000/` for the marketing site, `/app` for the internal dashboard, and `/proposals/dq-demo-aurora` for the seeded interactive experience.

An admin analytics view is available at `/admin/analytics`, summarising slide completion and dwell time for the seeded proposal. Set `DEMO_PROPOSAL_SHARE_ID` if you seed additional demos and want to pivot the dashboard.

Create or authenticate a Neon Auth user at `/login` (or `/signup`). On a fresh database the first signed-in account now provisions a default workspace (slugged from the user) and gains admin access automatically, so `/dashboard` loads without bouncing back to `/login`. Verify the flow by signing in with a new user and confirming an `Org`/`OrgMember` pair exists plus the dashboard renders successfully.

### Environment Variables

`.env.example` documents the required configuration:

- `DATABASE_URL` / `DIRECT_URL`: Neon Postgres connection strings (use `DIRECT_URL` for migrations that need an unpooled connection).
- `NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`: Neon Auth (Stack) project + API keys used by the Next.js provider, middleware, and handler.
- `NEXT_PUBLIC_APP_URL`: Base URL for success/cancel redirects.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `BLOB_READ_WRITE_TOKEN`: Server-side token that enables uploads to Vercel Blob storage.
- `DEMO_PROPOSAL_SHARE_ID` (optional): Overrides the proposal used by the analytics dashboard (`dq-demo-aurora` by default).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`: SMTP credentials for emailing receipt PDFs after acceptance.
- `ENCRYPTION_KEY`: Reserved for future secure payload handling (32 chars).

## Database & Prisma Workflow

### Regenerate the Prisma Client

Run `pnpm prisma generate` whenever you edit `prisma/schema.prisma` so that the typed client picks up new models like `OrgMember`. The `prebuild` script now executes this command automatically, guaranteeing Vercel (and local) production builds refresh the generated client before `prisma migrate deploy` and `next build` run.

1. **Generate SQL migration (manual review first):**
   ```bash
   # Requires a running Postgres database when using migrate dev
   DIRECT_URL=... DATABASE_URL=... pnpm run migrate:create -- --name init
   ```
   The command writes a new folder under `prisma/migrations/` (e.g. `20250926194629_init/migration.sql`) without applying it so you can inspect the SQL before rollout.
2. **Apply migrations locally or against Neon/Postgres:**
   ```bash
   DIRECT_URL=... DATABASE_URL=... pnpm run migrate:apply
   ```
3. **Seed demo data:**
   ```bash
   pnpm exec prisma db seed
   ```
   The seed script inserts an org, catalog items (with portfolio tags), tagged assets, analytics events, and a proposal with the slide flow `INTRO → CHOICE_CORE → ADDONS → PORTFOLIO → REVIEW → ACCEPT` so you can exercise the interactive deck end-to-end.

> **Note:** Prisma warns that the `package.json#prisma` config is deprecated. For Neon deployments, you can move the `seed` command into a `prisma.config.ts` or Vercel build step when ready.

## Neon Auth Notes

- Enable Neon Auth (beta) for your Neon project and copy the **Next.js** keys into `.env.local` / Vercel (`NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`).
- Prisma exposes `neon_auth.users_sync` via the `NeonAuthUser` model. The first authenticated account automatically seeds an `OrgMember` linked to the Aurora Events org; run `SELECT id, email FROM neon_auth.users_sync ORDER BY created_at DESC LIMIT 5;` in Neon to verify new sign-ups.
- The default Stack routes live under `/handler/[...stack]` (sign-in, sign-up, sign-out). Configure the "After sign-in" target in the Neon Auth dashboard to `/app` so contributors land on the internal workspace after authentication.
- Generate a Vercel Blob read/write token (`BLOB_READ_WRITE_TOKEN`) in the Vercel dashboard and scope it to the bucket where proposal receipts should live.

### Optional: Neon RLS (JWT/JWKS)

- Neon Auth can issue JWTs signed via JWKS; once you’re ready to expose the database directly, enable RLS in the Neon console and attach row policies that compare `OrgMember.userId` (or `neon_auth.users_sync.id`) against the JWT subject.
- Keep Prisma access server-side for v0; when RLS is active ensure any HTTP APIs include the Neon-issued `Authorization` header so row checks succeed.

## Stripe Integration

- Configure test keys in `.env.local` and ensure `NEXT_PUBLIC_APP_URL` reflects your dev domain.
- Create a webhook endpoint pointing to `/api/stripe/webhook`, store the signing secret in `STRIPE_WEBHOOK_SECRET`, and run `stripe listen --forward-to localhost:3000/api/stripe/webhook` during local testing to mirror deposit confirmations.
- After acceptance the `/api/stripe/checkout` handler launches a deposit-only Checkout Session (line item name `DQuote Deposit — <proposal title>`) using the stored quote totals, so the client only needs to provide the `shareId`.

## PDF Receipts

- `/proposals/[shareId]/receipt` renders a printable recap (totals, selections, acceptance metadata) for the active quote.
- The acceptance handler uses Puppeteer to load that page and stream the PDF to Vercel Blob (configurable via `PUPPETEER_EXECUTABLE_PATH` if you bundle Chromium separately).
- The resulting public Blob URL is stored on the quote and surfaced to the proposal runtime so clients can download the receipt immediately after acceptance.
- When SMTP credentials are present the acceptance flow emails the PDF receipt (and hosted link) to the acceptor plus the client contact.

## Error Handling & Accessibility

- Proposal themes feed CSS variables into the runtime so the seeded demo renders a branded hero, colored progress indicator, and accented option cards.
- Pricing/network failures are caught client-side and surfaced inline without crashing the slide flow; the summary tray shows skeleton placeholders while new totals load.
- Option toggles and steppers now expose `aria` attributes, keyboard-friendly controls, and visible focus states to meet baseline accessibility expectations.
- Expired share links return a guarded state instead of rendering the runtime, keeping archived proposals private while guiding prospects back to the sales team.

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

### Installed blocks & workflow

- `npx shadcn@latest add login-04` & `dashboard-01` establish the Neon Auth sign-in flow and the authenticated sidebar shell.
- The **Quote Terminal** extends the Tasks example (`/quotes`) and lives under `src/app/(app)/quotes/**` with shared UI in
  `src/components/quote-*.tsx`.
- Token tweaks for the green brand live in `src/app/globals.css` (HSL variables) and `tailwind.config.ts` (CSS variable mapping).
- When you add another block, run the CLI command from the project root, review the generated files, and map new imports to the
  green palette via CSS variables—avoid hard-coding colors.

If charts appear grayscale in a fork or staging deploy, ensure the `--chart-*` tokens in `globals.css` propagate to the element
and that `@/components/ui/chart.tsx` receives the right `ChartConfig` colors (we pass `hsl(var(--chart-X))`).

## Available Scripts

- `pnpm dev` — start Next.js in development mode.
- `pnpm build` / `pnpm start` — production build & run (`pnpm build` runs `prisma migrate deploy` first).
- `pnpm lint` — lint with Next.js config.
- `pnpm format` — run Prettier with the Tailwind plugin on src and markdown docs.
- `pnpm test:pricing` — execute the pricing rules engine unit tests via `node:test`.
- `pnpm run migrate:create` — generate migration SQL (requires Postgres).
- `pnpm run migrate:apply` — apply migrations to the configured database.
- `pnpm prisma db seed` — run the demo seed script via `tsx`.

## Demo Script

1. Seed the database (`pnpm prisma db seed`).
2. Visit `http://localhost:3000/proposals/dq-demo-aurora` to confirm the branded hero (logo + theme colors) renders above the interactive deck.
3. Step through slides, toggle add-ons, and watch totals update alongside the portfolio panel as it refreshes with 2–4 matched proofs.
4. Intentionally disconnect your network (or use DevTools throttling) when toggling an option to surface the inline pricing error state, then restore connectivity to verify recovery.
5. On the **Review** step, capture the acceptor name and email to prep the signature record.
6. Move to **Accept** and click **Accept proposal** to store the signature metadata and compute the 20 % deposit.
7. Hit **Pay deposit via Stripe** to launch Checkout (requires valid test keys); returning with `session_id` marks the quote as paid and updates the runtime badge.
8. Download the PDF receipt from the success panel and share it with the client if needed, then trigger the **Schedule kickoff demo** CTA.
9. Visit `http://localhost:3000/proposals/dq-demo-expired` to confirm expired share links render the appropriate messaging without exposing the runtime.
10. Finish at `/admin/analytics` to review per-slide completion, dwell time, and event totals captured during the run-through.

## Analytics & Event Tracking

- The proposal runtime logs lifecycle events (`VIEW`, `SELECT`, `DESELECT`, `PORTFOLIO_OPEN`) using server actions so admins can reconstruct viewer funnels.
- The acceptance flow writes `ACCEPT` and `PAY` events from the backend, with the Stripe webhook replaying deposit confirmations so payments are captured even if the viewer closes the browser early.
- The analytics dashboard aggregates those events into completion percentages per slide, average time spent between slides, and total counts per event type for quick health checks.

## Project Structure Highlights

```
src/app/(marketing)      # Public marketing site (home, docs, support)
src/app/(auth)           # Neon Auth login/signup screens (login-04 block)
src/app/(app)/dashboard  # Dashboard home (dashboard-01 block)
src/app/(app)/quotes     # Quote Terminal data grid + filters
src/app/api              # Route Handlers (pricing, proposals, accept, stripe)
src/components/proposal  # Client runtime UI
src/components/typography.tsx # Shared typography primitives for marketing
prisma/                  # Schema, migrations, seed data
docs/user-stories        # User stories for Sprint 1
registry/                # Custom shadcn registry items
```

## API Endpoints

- `POST /api/pricing` — calculate subtotal, tax, and total for a proposal based on the provided selections.
  - Responds with `400` when selections violate require/mutex rules and includes a `violations` array for context.
- `POST /api/accept` — validate the acceptor details, persist signature metadata (UUID, timestamp, IP/UA), generate the receipt PDF, and respond with the computed 20 % deposit amount plus the `pdfUrl`.
- `POST /api/stripe/checkout` — create a Stripe Checkout Session for the stored deposit, persist the session/payment IDs, and return the hosted payment URL.
- `POST /api/stripe/webhook` — validate Stripe signatures and mark quotes as paid on `checkout.session.completed`, emitting `PAY` events even if the viewer doesn’t return to the proposal.
- `POST /api/blob/upload` — accept a `multipart/form-data` upload with a `file` field, store it in Vercel Blob under the `dquote/` prefix, and respond with the public URL.
- `POST /api/avatar/upload` — stream the raw request body to Vercel Blob using the provided `filename` query parameter and return the blob metadata.

### Verifying Blob uploads locally

1. Ensure `BLOB_READ_WRITE_TOKEN` is present in `.env.local` (copy it from Vercel > Storage > Blob) and restart `pnpm dev` if needed.
2. Visit `http://localhost:3000/avatar/upload` while `pnpm dev` is running, choose an image (≤4.5 MB, server upload limit), and submit the form to verify the server-upload flow. The resulting blob URL should render as a clickable link.
3. Upload a sample file via curl:
   ```bash
   curl -X POST "http://localhost:3000/api/blob/upload" \
     -H "Accept: application/json" \
     -F "file=@README.md"
   ```
   The response contains `{ "url": "https://..." }`. Open the URL in a browser to confirm it is publicly reachable.
4. Optionally list stored blobs via the CLI (requires `vercel`):
   ```bash
   vercel blob list --prefix dquote/
   ```

## Testing & Quality

- `pnpm lint`
- `pnpm test:pricing`
- Run `pnpm dev` and interact with `/proposals/dq-demo-aurora` to validate live pricing & flows.
- Stripe Checkout requires valid test keys; use Stripe CLI or dashboard to inspect sessions.

## Next Steps

- Layer Neon Auth-backed role management and invitation flows so additional org members can join without manual seeding.
- Expand the pricing engine with time-bound or stacked promotions to cover seasonal incentives.
- Capture webhook updates for Stripe refunds/cancellations and surface the state change inside the proposal runtime.
- Harden Vercel Blob retention policies (versioning, lifecycle rules) to support long-lived receipt archives in production.
- Visualise analytics with trend lines and cohort filters so admins can compare proposal performance over time.
