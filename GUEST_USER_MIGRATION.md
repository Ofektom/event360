# Guest-to-User Link Migration

## Overview

This migration adds the ability to link Invitee (guest) records to User accounts, enabling the social media-like experience where guests must register to access full event features.

## Schema Changes

### Invitee Model Updates

**Added Fields:**
- `userId` (String?, optional) - Links to User when guest registers
- `registeredAt` (DateTime?, optional) - Timestamp when guest registered/linked account

**Added Relations:**
- `user` - Relation to User model (optional, nullable)

**Added Constraints:**
- `@@unique([eventId, email])` - One invitee per email per event
- `@@unique([eventId, phone])` - One invitee per phone per event
- `@@index([userId])` - Index for faster user lookups

### User Model Updates

**Added Relations:**
- `invitees` - Array of Invitee records (events user is invited to as guest)

## Migration Details

**Migration File:** `prisma/migrations/20251121094114_add_user_link_to_invitee/migration.sql`

**Changes:**
1. Adds `userId` column to Invitee table
2. Adds `registeredAt` column to Invitee table
3. Creates index on `userId` for performance
4. Adds foreign key constraint linking Invitee to User
5. Creates unique constraints on (eventId, email) and (eventId, phone)

## Important Notes

### Unique Constraints

The unique constraints may fail if there are existing duplicate emails or phones for the same event. If the migration fails:

**Clean up email duplicates:**
```sql
DELETE FROM "Invitee" WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId", "email" ORDER BY "createdAt") as rn
    FROM "Invitee" WHERE "email" IS NOT NULL
  ) t WHERE rn > 1
);
```

**Clean up phone duplicates:**
```sql
DELETE FROM "Invitee" WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId", "phone" ORDER BY "createdAt") as rn
    FROM "Invitee" WHERE "phone" IS NOT NULL
  ) t WHERE rn > 1
);
```

### Nullable Fields

- `userId` is nullable - invitees without registered accounts will have `null`
- `registeredAt` is nullable - only set when guest registers
- Unique constraints allow multiple NULL values (standard SQL behavior)

## How to Apply Migration

### Development
```bash
npx prisma migrate dev
```

### Production
```bash
npx prisma migrate deploy
```

## Next Steps

After migration:
1. Update Prisma Client: `npx prisma generate`
2. Implement auto-linking logic in auth flow
3. Create access control helpers
4. Create public event pages
5. Implement user profile pages

## Usage Example

```typescript
// Link user to invitee after registration
await prisma.invitee.updateMany({
  where: {
    OR: [
      { email: user.email },
      { phone: user.phone }
    ],
    userId: null
  },
  data: {
    userId: user.id,
    registeredAt: new Date()
  }
})

// Get user's events (created + invited)
const userEvents = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    events: true,        // Events they created
    invitees: {          // Events they're invited to
      include: {
        event: true
      }
    }
  }
})
```

