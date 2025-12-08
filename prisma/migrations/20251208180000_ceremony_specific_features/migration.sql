-- Add visibility to Ceremony
ALTER TABLE "Ceremony" ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Add ceremonyId to EventVendor
ALTER TABLE "EventVendor" ADD COLUMN "ceremonyId" TEXT;

-- Add foreign key constraint for EventVendor.ceremonyId
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_ceremonyId_fkey" 
  FOREIGN KEY ("ceremonyId") REFERENCES "Ceremony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for EventVendor.ceremonyId
CREATE INDEX "EventVendor_ceremonyId_idx" ON "EventVendor"("ceremonyId");

-- Drop old unique constraint
ALTER TABLE "EventVendor" DROP CONSTRAINT IF EXISTS "EventVendor_eventId_vendorId_key";

-- Add new unique constraint with ceremonyId
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_eventId_ceremonyId_vendorId_key" 
  UNIQUE ("eventId", "ceremonyId", "vendorId");

-- Add ceremonyId to Invite
ALTER TABLE "Invite" ADD COLUMN "ceremonyId" TEXT;

-- Add foreign key constraint for Invite.ceremonyId
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_ceremonyId_fkey" 
  FOREIGN KEY ("ceremonyId") REFERENCES "Ceremony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for Invite.ceremonyId
CREATE INDEX "Invite_ceremonyId_idx" ON "Invite"("ceremonyId");

