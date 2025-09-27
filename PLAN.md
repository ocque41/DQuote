# SPRINT 14 PLAN

## Item 1: Shadcn foundation & green theme
- Ensure shadcn registry is initialized, tailwindcss-animate plugin is registered, and theme provider supports color modes.
- Align design tokens so the brand primary inherits Tailwind green across light/dark schemes.

### Acceptance Criteria
- [x] `npx shadcn@latest init -d` completes without diff churn, confirming registry scaffolding and `components/ui` readiness.
- [x] Global CSS and Tailwind tokens expose green-flavored `--primary` colors applied in both light and dark themes without hex literals.

## Item 2: Neon Auth login/signup experience
- Import the login-04 block and implement login & signup routes bound to Neon Auth flows with redirects to `/dashboard`.
- Surface the Neon `<UserButton />` in authenticated shells.

### Acceptance Criteria
- [x] `/login` and `/signup` render shadcn login-04 layouts with working Neon Auth buttons or submit handlers redirecting to `/dashboard` on success.
- [x] Authenticated areas display `<UserButton />` while unauthenticated visitors are redirected to `/login`.

## Item 3: Dashboard home protected by requireUser
- Add the dashboard-01 block at `/dashboard` and protect it with server-side `requireUser` and middleware.
- Provide navigation linking to the future quotes surface.

### Acceptance Criteria
- [x] Signed-in users reach `/dashboard` with the shadcn dashboard UI, including sidebar links to Dashboard and Quotes plus a top-right `<UserButton />`.
- [x] Guests hitting `/dashboard` are redirected to `/login` via middleware + server protection.

## Item 4: Quote Terminal table experience
- Scaffold `/quotes` using the Tasks example patterns (data table, filters, actions) tailored for quotes data backed by a stub data source.
- Create reusable components for filters/actions and a server utility to fetch demo quotes.

### Acceptance Criteria
- [x] `/quotes` renders the table with columns (symbol, name, bid, ask, last, changePct, updatedAt, actions) supporting search, filtering, CSV export, and modal for new quote.
- [x] Quotes data loads via a server action hitting `lib/data/quotes.ts`, with TODO notes for org-scoped RLS if applicable.

## Item 5: Polish, routing, and documentation
- Ensure green theming carries through dashboard charts, provide empty/loading/error states, and update docs with guidance.
- Implement root redirect logic and record testing steps.

### Acceptance Criteria
- [x] `/` redirects to `/dashboard` for authenticated users and `/login` otherwise; `/dashboard` and `/quotes` expose sensible loading/error fallbacks.
- [x] README documents shadcn block usage, theme tokens, and the Quote Terminal location, with QA notes on known deployment caveats.

# SPRINT 13 PLAN

## Item 1: Neon Auth integration & UI shell
- Replace legacy Supabase/NextAuth wiring with Neon Auth Stack provider, handler routes, and authenticated header controls across the Next.js app router.

### Acceptance Criteria
- [x] Root layout mounts `StackProvider` with env-driven keys and `/handler/[...stack]` route exposes Neon Auth handler endpoints.
- [x] Authenticated header renders `UserButton` sourced from Neon Auth SDK while legacy Supabase/NextAuth client code is removed.

## Item 2: Session enforcement & Prisma user mapping
- Introduce shared server utilities that validate Neon Auth sessions, gate `/app/**` and `/admin/**` routes, and expose synced users through Prisma’s multi-schema support.

### Acceptance Criteria
- [x] Navigating to `/app` or `/admin` without a session redirects to the Neon Auth sign-in experience, while signed-in users render successfully.
- [x] Prisma schema defines a `NeonAuthUser` model mapped to `neon_auth.users_sync`, and domain relations reference it without migration conflicts.

## Item 3: Environment & documentation updates
- Document required Neon Auth environment variables, optional Neon RLS hardening steps, and ensure `.env.example`/README match the new setup instructions.

### Acceptance Criteria
- [x] README enumerates Neon Auth setup, including enabling the beta, configuring keys, and referencing the new sign-in routes with verification steps.
- [x] `.env.example` lists Neon Auth variables (`NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`) alongside Neon database URLs.

# SPRINT 10 PLAN

## Item 1: Auth & storage migration
- Replace Supabase auth helpers with NextAuth credentials backed by Prisma + Neon, updating middleware and UI flows.
- Persist generated quote PDFs to Vercel Blob instead of the filesystem, removing Supabase references from docs/env.

### Acceptance Criteria
- [x] `/app` and `/admin` routes rely on NextAuth sessions; sign-in/out works against seeded Prisma credentials without Supabase codepaths.
- [x] README and `.env.example` describe Neon + NextAuth + Vercel Blob setup with no Supabase env vars or dependencies remaining.

# SPRINT 9 PLAN

## Item 1: Supabase authentication & multi-org permissions
- Integrate Supabase Auth helpers for the App Router, add a credential-based sign-in flow, and gate internal routes by the viewer's organization membership.

### Acceptance Criteria
- [x] Authenticated admins can sign in at `/app/sign-in`, hit protected `/app/**` and `/admin/**` routes, and only see proposals tied to their `orgId`.
- [x] Visitors without a session are redirected to the sign-in page and share links remain publicly accessible without auth barriers.

## Item 2: Pricing promotions & tiered discounts
- Extend the pricing rules engine with order-value promotions (e.g., threshold percentage discounts) and ensure totals propagate through the pricing API and runtime.

### Acceptance Criteria
- [x] New `discount_threshold_pct` rule type reduces totals when selections cross configured subtotal thresholds and is covered by unit tests.
- [x] Pricing responses and UI reflect the promotion details without breaking existing discount/tax logic.

## Item 3: Acceptance automation & communications
- Trigger transactional email delivery with the generated PDF receipt and ensure acceptance routes capture delivery outcomes for auditing.

### Acceptance Criteria
- [x] Accepting a proposal emails the PDF receipt to the acceptor and client contacts using configured SMTP credentials, logging failures without blocking storage updates.
- [x] Quote records persist email delivery metadata for admins to review in analytics or future dashboards.

## Item 4: Stripe webhook deposit reconciliation
- Add a Stripe webhook route handler that confirms deposit payments asynchronously and updates quotes, events, and analytics data accordingly.

### Acceptance Criteria
- [x] The webhook validates signatures, marks quotes as paid, and emits PAY events when Stripe sends `checkout.session.completed` notifications.
- [x] README and `.env.example` list the webhook secret and testing instructions so deposits stay consistent even if the browser closes early.

# SPRINT 2 PLAN

## Item 1: Public proposal runtime page
- Build `/proposals/[shareId]` route that loads proposal, slides, and options for public viewing.

### Acceptance Criteria
- [x] Visiting `/proposals/<seedShareId>` renders Intro → choice → add-ons → review flow powered by fetched data.
- [x] Slides and options load from Prisma by `shareId` without server errors.

## Item 2: Interactive selections + summary
- Implement OptionCard, QuantityStepper, AddOnToggle, ProgressSteps, and SummaryTray components with live pricing feedback.

### Acceptance Criteria
- [x] Selecting A/B choices or toggling add-ons updates local state and visible totals without reloads.
- [x] Sticky SummaryTray displays subtotal, tax, and total using values from the pricing endpoint.

## Item 3: Pricing API
- Expose `/api/pricing` POST handler that validates input and computes totals based on selections.

### Acceptance Criteria
- [x] Request body is validated via Zod `.safeParse`, returning 400 on invalid payloads.
- [x] Successful calls respond with `{ subtotal, tax, total }` numbers reflecting current selections.

# SPRINT 3 PLAN

## Item 1: Pricing rules engine foundations
- Implement deterministic rule evaluation in `src/server/pricing/rules.ts` covering require, mutex, fixed/percent discounts, and taxes.

### Acceptance Criteria
- [x] Rules combine into a single calculator that produces consistent totals for a given proposal configuration.
- [x] Unit tests cover require/mutex conflict cases and ensure discounts/taxes apply as expected.

## Item 2: API integration and validation
- Wire the new rules engine into the pricing service invoked by `/api/pricing`, maintaining Zod validation paths.

### Acceptance Criteria
- [x] API responses reflect rule outcomes for shared demo data and error on invalid combinations.
- [x] Existing pricing tests (or new ones) verify integration without regressions in previous behavior.

## Item 3: Summary tray micro-interactions
- Surface short-lived price delta indicators (e.g., `+€X`) within `SummaryTray` when selections change.

### Acceptance Criteria
- [x] Totals and transient delta messaging update in sync with pricing responses.
- [x] Interaction remains accessible/responsive on desktop and mobile breakpoints.

# SPRINT 4 PLAN

## Item 1: Portfolio tagging data plumbing
- Extend catalog items and assets with shared tag metadata, expose matching assets in the proposal loader, and surface them through the pricing selections service.

### Acceptance Criteria
- [x] Catalog items and assets in the seed data include overlapping tags that can be matched at runtime.
- [x] Server-side proposal query returns 2–4 tagged assets aligned with the active option selections for use in the portfolio panel.

## Item 2: Dynamic PortfolioPanel UI
- Introduce a portfolio panel component beneath the slide viewport that listens to selection changes and renders the server-provided assets.

### Acceptance Criteria
- [x] Portfolio panel updates immediately as core choices or add-ons are toggled.
- [x] Matching case studies and proofs render with imagery and titles relevant to the user’s current configuration.

# SPRINT 5 PLAN

## Item 1: Review slide acceptance UX
- Enhance the REVIEW step to show the final itemized breakdown and collect acceptor name/email prior to submission.

### Acceptance Criteria
- [x] Review slide lists all selected items with quantities, subtotals, tax, and total matching the summary tray.
- [x] Submission requires acceptor name and email with validation feedback on missing/invalid values.

## Item 2: Acceptance capture service
- Implement the `/api/accept` route to validate payloads, persist acceptance metadata on the quote, and return the computed deposit share.

### Acceptance Criteria
- [x] Accepted payload generates a signature UUID, timestamps, IP, and user-agent stored on the associated quote record.
- [x] Response returns a deterministic deposit amount (e.g., 20% of total) derived on the server.

## Item 3: Stripe deposit checkout
- Add a `/api/stripe/checkout` route that launches a Stripe Checkout Session for the deposit and reflects successful payments in the proposal runtime.

### Acceptance Criteria
- [x] Calling the endpoint creates a checkout session with the quote’s deposit amount and returns the hosted URL.
- [x] On successful payment the proposal runtime shows a “Deposit paid” indicator sourced from stored Stripe session results.

# SPRINT 6 PLAN

## Item 1: Printable receipt surface
- Add a server-rendered `/proposals/[shareId]/receipt` page that summarizes totals, selections, and acceptance metadata for PDF export.

### Acceptance Criteria
- [x] Navigating to `/proposals/<shareId>/receipt` renders a printable recap sourced from Prisma without runtime errors.
- [x] The receipt view presents totals, itemized selections, and acceptance contact details for the accepted quote.

## Item 2: PDF generation + download handoff
- Introduce a Puppeteer-based generator in `src/server/pdf/quote.ts` and wire acceptance to store and surface the generated PDF URL.

### Acceptance Criteria
- [x] Accepting a proposal produces a PDF file persisted to disk (or storage) and saves its URL on the quote record.
- [x] The proposal runtime exposes a “Download PDF” control once acceptance completes, returning the stored PDF.

# SPRINT 7 PLAN

## Item 1: Event instrumentation for proposal funnel
- Record lifecycle events (view/select/deselect/accept/pay/portfolio interactions) when visitors interact with the proposal runtime and backend handlers.

### Acceptance Criteria
- [x] Quote lifecycle endpoints and runtime UI create Event records with correct `type`, metadata, and timestamps for demo data.
- [x] Portfolio open, selection, and acceptance flows persist events without duplicate writes during normal navigation.

## Item 2: Admin analytics dashboard
- Build `/app/admin/analytics` page that summarizes funnel performance (per-slide completion rates, timings) for the demo proposal using stored events.

### Acceptance Criteria
- [x] Admin analytics view renders aggregate counts and completion percentages for each slide of the demo proposal without runtime errors.
- [x] Dashboard surfaces average time on step derived from event timestamps for completed slide views.

# SPRINT 8 PLAN

## Item 1: Proposal theming & branding
- Introduce theme fields on `Proposal` to drive logo/brand colors and render a branded header in the runtime.

### Acceptance Criteria
- [x] Proposal records can store logo URL and brand color tokens consumed by the runtime layout.
- [x] Visiting the demo proposal renders the branded header and themed accents using the stored configuration.

## Item 2: Share link expiration & access polish
- Support optional `expiresAt` timestamps on share links with expired-state handling in the proposal route.

### Acceptance Criteria
- [x] Loading an expired share link surfaces an “Link expired” message while blocking runtime interaction.
- [x] Valid share links continue to render normally, and seed data covers both scenarios for verification.

## Item 3: Error handling, skeletons, and accessibility
- Add resilient UI states for pricing/network failures, loading skeletons, and keyboard/a11y improvements for controls.

### Acceptance Criteria
- [x] Pricing failures and network errors display actionable inline feedback without crashing the runtime.
- [x] Core controls (options, toggles, steppers) meet keyboard focus expectations and have visible skeletons during initial load.

## Item 4: Documentation & environment updates
- Finalize README instructions, `.env.example`, and deployment notes covering Supabase, Stripe webhooks, and PDF storage follow-ups.

### Acceptance Criteria
- [x] README enumerates final setup/run commands, environment variables, and notes on Stripe webhooks/Supabase usage.
- [x] `.env.example` contains placeholders for all required secrets and optional configs referenced in documentation.

# SPRINT 12 PLAN

## Item 1: Restore Vercel production build
- Resolve Tailwind utility errors introduced by the Tailwind v4 migration and ensure design tokens compile without `border-border` failures.
- Address the missing `(marketing)` route artifact so the Next.js build completes without ENOENT crashes in Vercel.

### Acceptance Criteria
- [x] `npm run build` finishes locally with no Tailwind utility errors or missing-manifest exceptions, matching Vercel expectations.
- [x] README documents the verified build command so contributors can reproduce the fix.

# SPRINT 11 PLAN

## Item 1: Finalize Neon-auth storage migration
- Remove remaining Supabase-specific auth/storage references, relying on NextAuth credentials with Prisma + Neon.
- Persist generated receipts via Vercel Blob and ensure acceptance + proposal flows read from Blob-backed URLs only.

### Acceptance Criteria
- [x] Supabase client/helpers are absent from the runtime, middleware, and docs; `.env.example` and README only list Neon, NextAuth, and Blob configuration.
- [x] Authentication/session flows use the new NextAuth provider (server + client) and proposal acceptance writes receipts exclusively to Vercel Blob.

