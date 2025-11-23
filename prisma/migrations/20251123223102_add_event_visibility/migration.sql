-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'CONNECTED', 'INVITED_ONLY');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "visibility" "EventVisibility" NOT NULL DEFAULT 'INVITED_ONLY';

-- CreateTable
CREATE TABLE "InvitationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "preview" TEXT,
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationDesign" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT,
    "designData" JSONB NOT NULL,
    "imageUrl" TEXT,
    "customImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvitationTemplate_category_idx" ON "InvitationTemplate"("category");

-- CreateIndex
CREATE INDEX "InvitationTemplate_isActive_idx" ON "InvitationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "InvitationDesign_eventId_idx" ON "InvitationDesign"("eventId");

-- CreateIndex
CREATE INDEX "InvitationDesign_templateId_idx" ON "InvitationDesign"("templateId");

-- AddForeignKey
ALTER TABLE "InvitationDesign" ADD CONSTRAINT "InvitationDesign_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationDesign" ADD CONSTRAINT "InvitationDesign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InvitationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
