# Seeding Invitation Templates

## Overview

Invitation templates are seeded **once during development setup** to make them available to all users. Templates are shared across the entire application - any user can select, customize, or create their own templates.

## Quick Start

Run the seed script once during initial setup:

```bash
pnpm seed:templates
```

This will:
- Add 8 default invitation templates to the database
- Generate preview images using Unsplash
- Make templates available to all users immediately

## When to Seed

**One-time setup:**
- During initial development setup
- After cloning the repository for the first time
- After database reset/migration

**Not needed:**
- On every app start
- By end users (templates are already available)
- During normal development (unless database was reset)

## Available Templates

The seed script adds the following templates:

1. **Elegant Wedding** - Classic and elegant wedding invitations
2. **Modern Birthday** - Fun and modern birthday celebrations
3. **Corporate Event** - Professional corporate events
4. **Celebration** - General celebration invitations
5. **Rustic Wedding** - Rustic and charming wedding style
6. **Kids Birthday** - Fun and colorful kids birthday parties
7. **Anniversary** - Elegant anniversary celebrations
8. **Graduation** - Academic graduation invitations

## How It Works

1. **Templates are shared** - All users see the same default templates
2. **Users can customize** - Users can customize templates for their events
3. **Users can create** - Users can create their own custom templates
4. **Users can upload** - Users can upload their own invitation designs

## Script Details

The seed script (`scripts/seed-templates.ts`):
- Checks for existing templates
- Adds new templates or updates existing ones
- Generates preview images from Unsplash
- Provides clear console output

## Troubleshooting

**Templates not showing?**
- Make sure you've run `pnpm seed:templates`
- Check database connection
- Verify migrations have been run

**Want to re-seed?**
- The script is idempotent - safe to run multiple times
- Existing templates will be updated, new ones will be added
- Run: `pnpm seed:templates`

**Need to reset templates?**
- Delete templates from database manually
- Or truncate the `InvitationTemplate` table
- Then run: `pnpm seed:templates`

## Alternative: API Endpoint

For programmatic seeding (admin use), you can also use the API endpoint:

```bash
POST /api/invitations/templates/seed
```

**Note:** Requires authentication. The script method is recommended for initial setup.

## Production Deployment

For production, include template seeding in your deployment process:

```bash
# In your CI/CD pipeline or deployment script
pnpm seed:templates
```

Or add to your build process:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && pnpm seed:templates && next build"
  }
}
```

## Summary

- ✅ Run `pnpm seed:templates` **once** during setup
- ✅ Templates are available to **all users**
- ✅ Users can **customize, create, or upload** their own
- ✅ Safe to run multiple times (idempotent)
- ✅ No user action required in the frontend

