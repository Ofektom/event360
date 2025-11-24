-- Update all existing events to have PUBLIC visibility
UPDATE "Event" SET "visibility" = 'PUBLIC' WHERE "visibility" = 'INVITED_ONLY';

