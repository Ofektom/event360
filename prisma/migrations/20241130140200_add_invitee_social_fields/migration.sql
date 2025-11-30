-- AlterTable
ALTER TABLE "Invitee" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
ADD COLUMN IF NOT EXISTS "messenger" TEXT,
ADD COLUMN IF NOT EXISTS "instagram" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invitee_whatsapp_idx" ON "Invitee"("whatsapp");

