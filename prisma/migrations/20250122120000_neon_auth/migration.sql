-- Drop NextAuth tables now that Neon Auth manages identities
DROP TABLE IF EXISTS "public"."Account" CASCADE;
DROP TABLE IF EXISTS "public"."Session" CASCADE;
DROP TABLE IF EXISTS "public"."VerificationToken" CASCADE;
DROP TABLE IF EXISTS "public"."User" CASCADE;

-- Create OrgMember table tying Neon Auth users to orgs
CREATE TABLE "public"."OrgMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrgMember_userId_orgId_key" ON "public"."OrgMember"("userId", "orgId");

ALTER TABLE "public"."OrgMember"
  ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."OrgMember"
  ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."users_sync"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
