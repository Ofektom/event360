-- AlterTable: Make email optional (nullable) and phone unique
-- This migration enables phone/WhatsApp as a login identifier

-- Step 1: Clean up duplicate phone numbers (keep the oldest one)
-- This prevents unique constraint violations
DO $$
DECLARE
  duplicate_phones RECORD;
BEGIN
  FOR duplicate_phones IN
    SELECT phone, array_agg(id ORDER BY "createdAt" ASC) as user_ids
    FROM "User"
    WHERE phone IS NOT NULL
    GROUP BY phone
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first user, set phone to NULL for others
    UPDATE "User"
    SET phone = NULL
    WHERE id = ANY(duplicate_phones.user_ids[2:])
      AND phone = duplicate_phones.phone;
  END LOOP;
END $$;

-- Step 2: Add index on phone (before making it unique)
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");

-- Step 3: Make email nullable (if not already)
-- First, drop the unique constraint if it exists
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

-- Make email nullable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Re-add unique constraint on email (allows NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email") WHERE "email" IS NOT NULL;

-- Step 4: Make phone unique (allows NULL values)
-- Drop existing unique constraint if it exists
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_phone_key";

-- Create unique index on phone (allows NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone") WHERE "phone" IS NOT NULL;

-- Step 5: Ensure at least one identifier exists (application-level validation)
-- This is enforced in the application code, not at database level

