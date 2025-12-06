-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Interaction_parentId_idx" ON "Interaction"("parentId");

