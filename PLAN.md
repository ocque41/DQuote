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

# SPRINT 10 PLAN

## Item 1: Vercel Blob upload endpoint
- Add a Next.js route at `src/app/api/blob/upload/route.ts` using `@vercel/blob`'s `put` helper to accept form uploads and return the public URL.

### Acceptance Criteria
- [x] Posting `multipart/form-data` with a `file` field stores the blob with a random suffix under the `dquote/` prefix and responds with `{ url }`.
- [x] Missing file inputs respond with HTTP 400 and a JSON body containing an `error` message.

## Item 2: Storage documentation refresh
- Update `README.md` with instructions for configuring `BLOB_READ_WRITE_TOKEN`, testing uploads via the API route, and verifying the resulting public URL.

### Acceptance Criteria
- [x] README lists the new environment variable and API usage steps alongside verification instructions.
- [x] Setup section references the blob upload route and links the verification command or curl example.

## Item 3: Environment template update
- Add the `BLOB_READ_WRITE_TOKEN` placeholder to `.env.example` so deployments surface the required credential.

### Acceptance Criteria
- [x] `.env.example` includes `BLOB_READ_WRITE_TOKEN=` with a short note that it enables Vercel Blob uploads.
- [x] Existing variables remain unchanged aside from the new token entry.

# SPRINT 11 PLAN

## Item 1: Avatar upload UI
- Create a client-side upload page at `/avatar/upload` following Vercel's example so users can submit avatars through the server upload flow.

### Acceptance Criteria
- [x] Navigating to `/avatar/upload` renders the upload form with file input limited to image types and a submit button wired to call the API.
- [x] After a successful upload, the UI shows the returned blob URL as a clickable link.

## Item 2: Avatar upload API route
- Add a route handler at `src/app/api/avatar/upload/route.ts` that streams the request body to Vercel Blob using the provided filename query parameter.

### Acceptance Criteria
- [x] POST requests with a `filename` query store the blob under that name with public access and respond with the blob payload from Vercel.
- [x] Invalid requests without a `filename` respond with HTTP 400 and a JSON error message.

## Item 3: Blob dependency and docs refresh
- Install `@vercel/blob` as a dependency and update documentation with usage instructions and environment requirements for the avatar upload feature.

### Acceptance Criteria
- [x] `@vercel/blob` appears in `package.json` dependencies and the README documents running the upload demo and verifying blob URLs.
- [x] README run instructions mention the `/avatar/upload` page and note the 4.5 MB server upload limit.

