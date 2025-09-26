ALTER TABLE "Quote"
ADD COLUMN "receiptEmailSentAt" TIMESTAMP(3),
ADD COLUMN "receiptEmailRecipients" TEXT[] DEFAULT '{}'::text[],
ADD COLUMN "receiptEmailError" TEXT;
