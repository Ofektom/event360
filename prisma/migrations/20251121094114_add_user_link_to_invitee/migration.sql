-- AlterTable: Add userId and registeredAt columns to Invitee
ALTER TABLE "Invitee" ADD COLUMN     "userId" TEXT;
ALTER TABLE "Invitee" ADD COLUMN     "registeredAt" TIMESTAMP(3);

-- CreateIndex: Add index on userId for faster lookups
CREATE INDEX "Invitee_userId_idx" ON "Invitee"("userId");

-- AddForeignKey: Link Invitee to User
ALTER TABLE "Invitee" ADD CONSTRAINT "Invitee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note: The unique constraints below may fail if there are duplicate emails/phones for the same event
-- If migration fails, clean up duplicates first by running:
-- 
-- For email duplicates:
-- DELETE FROM "Invitee" WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId", "email" ORDER BY "createdAt") as rn
--     FROM "Invitee" WHERE "email" IS NOT NULL
--   ) t WHERE rn > 1
-- );
--
-- For phone duplicates:
-- DELETE FROM "Invitee" WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId", "phone" ORDER BY "createdAt") as rn
--     FROM "Invitee" WHERE "phone" IS NOT NULL
--   ) t WHERE rn > 1
-- );

-- CreateIndex: Unique constraint for email per event (allows multiple NULLs)
CREATE UNIQUE INDEX "Invitee_eventId_email_key" ON "Invitee"("eventId", "email");

-- CreateIndex: Unique constraint for phone per event (allows multiple NULLs)
CREATE UNIQUE INDEX "Invitee_eventId_phone_key" ON "Invitee"("eventId", "phone");

