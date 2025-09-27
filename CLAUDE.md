# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DQuote is an interactive proposal experience that blends CPQ (Configure, Price, Quote) logic, curated slides, portfolio proofs, and instant acceptance. Prospects walk through a short slide sequence, compare A/B options, toggle add-ons, watch totals update in real time, and finish by accepting + paying a deposit via Stripe Checkout.

**Key Business Value**: Interactive sales proposals with real-time pricing, branded experiences, portfolio matching, e-signature capture, and instant deposit collection.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server
- `pnpm build` - Production build (must pass before deployment)
- `pnpm lint` - Lint code with Next.js config
- `pnpm test:pricing` - Run pricing engine unit tests

### Database & Prisma
- `pnpm run migrate:create -- --name <name>` - Generate new migration (requires DIRECT_URL)
- `pnpm run migrate:apply` - Apply pending migrations
- `pnpm exec prisma db seed` - Seed demo data
- `pnpm studio` - Open Prisma Studio

### Component System
- `./scripts/add-ui.sh <component>` - Install shadcn/ui component from local registry
- `pnpm registry:serve` - Serve local component registry on localhost:4000

## Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Prisma** ORM with PostgreSQL (Neon)
- **NextAuth v5** for authentication
- **shadcn/ui** component system with custom registry
- **Tailwind CSS v4** with design tokens

### Key Dependencies
- **Database**: `@prisma/client`, `@auth/prisma-adapter`
- **UI Components**: Full Radix UI suite (`@radix-ui/react-*`)
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Data Fetching**: `@tanstack/react-query`
- **Payments**: `stripe`, `@stripe/stripe-js`
- **Storage**: `@vercel/blob` for file uploads
- **PDF Generation**: `puppeteer`
- **Email**: `nodemailer`
- **Styling**: `tailwindcss`, `class-variance-authority`, `tailwind-merge`
- **Animation**: `framer-motion`, `tailwindcss-animate`

## Architecture Overview

### App Router Structure
```
src/app/
├── (marketing)/          # Public marketing pages
├── app/                  # Internal application
│   ├── (authenticated)/  # Protected dashboard routes
│   ├── (public)/        # Public auth pages (sign-in)
│   └── layout.tsx       # App shell with auth providers
├── admin/               # Admin analytics dashboard
├── api/                 # Route handlers for APIs
├── avatar/              # Avatar upload demo
├── proposals/           # Public proposal runtime
└── globals.css          # Global styles with CSS variables
```

### Route Groups
- **(marketing)**: Public marketing site
- **app/(authenticated)**: Protected dashboard for authenticated users
- **app/(public)**: Authentication entry points
- **admin**: Analytics and administrative interfaces
- **proposals/[shareId]**: Public proposal runtime pages

### Authentication & Authorization
- **NextAuth v5** with Prisma adapter
- **Credential-based** authentication (bcrypt password hashing)
- **Middleware Protection**: Routes under `/app/*` and `/admin/*` (see `middleware.ts`)
- **Organization-based**: Multi-tenant with org-scoped data access
- **Session Strategy**: Database sessions with role information

### Data Model (Prisma Schema)
Key entities:
- **Org**: Multi-tenant organization structure
- **User**: NextAuth users with org membership and roles
- **Client**: Customer/prospect records
- **CatalogItem**: Product/service catalog with pricing and tags
- **ProposalTemplate**: Reusable proposal structures
- **Proposal**: Individual proposal instances with share links
- **Slide/Option**: Proposal structure and choices
- **Selection**: User's current choices
- **Quote**: Final pricing and acceptance metadata
- **Event**: Analytics tracking for proposal interactions
- **Asset**: Portfolio images/videos with tag matching

## Core Business Logic

### 1. Proposal Runtime (`/proposals/[shareId]`)
- **Slide Types**: `INTRO`, `CHOICE_CORE`, `ADDONS`, `PORTFOLIO`, `REVIEW`, `ACCEPT`
- **Interactive Elements**: Option cards, quantity steppers, add-on toggles
- **Real-time Pricing**: Live updates via `/api/pricing` endpoint
- **Portfolio Matching**: Dynamic portfolio panel based on selections

### 2. Pricing Engine (`/src/server/pricing/rules.ts`)
Complex rule-based pricing system with:
- **Rule Types**: `require`, `mutex`, `discount_fixed`, `discount_pct`, `discount_threshold_pct`, `tax_pct`
- **Trigger Logic**: Option IDs and tag-based triggers
- **Validation**: Conflict detection and violation reporting
- **Unit Tests**: Comprehensive test coverage in `rules.test.ts`

### 3. Proposal Flow
1. **Load Proposal**: Fetch by shareId, check expiration
2. **Render Slides**: Progress through slide types in sequence
3. **Handle Selections**: Update state, trigger pricing calculation
4. **Portfolio Matching**: Show relevant assets based on selections
5. **Review & Accept**: Capture signature, generate deposit
6. **Payment**: Stripe Checkout for deposit collection
7. **Receipt**: PDF generation and email delivery

### 4. Analytics & Events
- **Event Types**: `VIEW`, `SELECT`, `DESELECT`, `ACCEPT`, `PAY`, `PORTFOLIO_OPEN`
- **Server Actions**: Real-time event logging during interactions
- **Dashboard**: Aggregate completion rates and timing analysis

## Key API Endpoints

### Pricing & Configuration
- `POST /api/pricing` - Real-time price calculation with rule validation
- `POST /api/proposals/[shareId]/analytics` - Log user interactions

### Acceptance Flow
- `POST /api/accept` - Capture acceptance with e-signature metadata
- `POST /api/stripe/checkout` - Create Stripe Checkout session for deposits
- `POST /api/stripe/webhook` - Handle payment confirmations

### File Management
- `POST /api/blob/upload` - Upload files to Vercel Blob
- `POST /api/avatar/upload` - Stream uploads with filename parameter

## Development Patterns

### 1. Server Components + Client Hydration
- Server components for data fetching and SEO
- Client components for interactivity (marked with `'use client'`)
- React Query for client-side state management

### 2. Type Safety
- Full TypeScript coverage
- Prisma-generated types
- Zod schemas for API validation
- NextAuth session typing extensions

### 3. Real-time Updates
- Optimistic UI updates for selections
- Server Actions for analytics logging
- React Query for cache management
- Error boundaries for network failures

### 4. Multi-tenant Architecture
- Organization-scoped data access
- Middleware-based route protection
- Role-based permissions (admin/editor/viewer)
- Seed data includes demo organization

## Component System (shadcn/ui)

### Local Registry Setup
- **Local Registry**: Components defined in `registry/` directory
- **Custom Installation**: Use `./scripts/add-ui.sh <component>` for easy setup
- **Registry Server**: `pnpm registry:serve` enables `@cumulus/component` imports
- **Configuration**: `components.json` defines aliases and paths

### Installing Components
1. **Via script**: `./scripts/add-ui.sh button`
2. **Manual**: `CI=1 npx --yes shadcn@latest add ./registry/button.json`
3. **From local registry**: Start registry server, then use `@cumulus/button` format

## Environment Setup

### Required Environment Variables
- `DATABASE_URL` / `DIRECT_URL`: Neon PostgreSQL connections
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET`: NextAuth configuration
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage access
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Payment processing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Client-side Stripe key
- SMTP configuration for email receipts
- `ENCRYPTION_KEY`: Future secure payload handling

### Setup Steps
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Configure: DATABASE_URL, NEXTAUTH_SECRET, STRIPE keys, BLOB_READ_WRITE_TOKEN

# Database setup
pnpm run migrate:apply
pnpm exec prisma db seed

# Start development
pnpm dev
```

## Testing & Demo Data

### Test Coverage
- **Pricing Engine**: Comprehensive unit tests in `rules.test.ts`
- **Development**: Manual testing via `/proposals/dq-demo-aurora`
- **Stripe**: Use test keys and Stripe CLI for webhook testing

### Demo Data
- **Seeded Organization**: Aurora Events with admin user
- **Demo Proposal**: `dq-demo-aurora` with full slide flow
- **Test Credentials**: `founder@aurora.events` / `dquote-demo`
- **Expired Link**: `dq-demo-expired` for testing expiration handling

## File Upload & Storage

### Vercel Blob Integration
- **Environment**: `BLOB_READ_WRITE_TOKEN` required
- **Endpoints**: `/api/blob/upload` and `/api/avatar/upload`
- **PDF Storage**: Generated receipts stored with public URLs
- **Demo Page**: `/avatar/upload` for testing blob functionality

## Security Considerations

- **Authentication**: All admin routes protected by middleware
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection**: Prisma ORM prevents direct SQL injection
- **File Uploads**: Size limits and type validation on blob uploads
- **Session Management**: Secure database session storage
- **Environment Variables**: Sensitive data in .env.local only

## Recent Changes (Sprint 10+)

### Migration from Supabase to Neon + NextAuth
- **Completed**: Full migration from Supabase Auth to NextAuth
- **Storage**: Moved from Supabase Storage to Vercel Blob
- **Database**: Using Neon PostgreSQL with Prisma
- **No Legacy Code**: All Supabase references removed

This architecture supports a complete interactive proposal system with real-time pricing, payment processing, and comprehensive analytics tracking.