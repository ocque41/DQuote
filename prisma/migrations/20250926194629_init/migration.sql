-- CreateEnum
CREATE TYPE "public"."SlideType" AS ENUM ('INTRO', 'CHOICE_CORE', 'ADDONS', 'PORTFOLIO', 'REVIEW', 'ACCEPT');

-- CreateEnum
CREATE TYPE "public"."OptionKind" AS ENUM ('ITEM', 'BUNDLE');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('VIEW', 'SELECT', 'DESELECT', 'ACCEPT', 'PAY', 'PORTFOLIO_OPEN');

-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProposalTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "theme" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Slide" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "proposalId" TEXT,
    "type" "public"."SlideType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "position" INTEGER NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Option" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "kind" "public"."OptionKind" NOT NULL,
    "description" TEXT,
    "priceOverride" DECIMAL(12,2),
    "currency" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAddOn" BOOLEAN NOT NULL DEFAULT false,
    "minQty" INTEGER,
    "maxQty" INTEGER,
    "defaultQty" INTEGER,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricingRule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "shareId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "theme" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Selection" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Selection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "deposit" DECIMAL(12,2),
    "pdfUrl" TEXT,
    "signatureId" TEXT,
    "stripeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "title" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "type" "public"."EventType" NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Org_slug_key" ON "public"."Org"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_code_key" ON "public"."CatalogItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_shareId_key" ON "public"."Proposal"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "Selection_proposalId_optionId_key" ON "public"."Selection"("proposalId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_proposalId_key" ON "public"."Quote"("proposalId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CatalogItem" ADD CONSTRAINT "CatalogItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalTemplate" ADD CONSTRAINT "ProposalTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Slide" ADD CONSTRAINT "Slide_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ProposalTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Slide" ADD CONSTRAINT "Slide_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Option" ADD CONSTRAINT "Option_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "public"."Slide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Option" ADD CONSTRAINT "Option_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "public"."CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingRule" ADD CONSTRAINT "PricingRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Selection" ADD CONSTRAINT "Selection_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Selection" ADD CONSTRAINT "Selection_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "public"."CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
