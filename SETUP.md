# Event360 Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- pnpm installed globally (`npm install -g pnpm`)

## Database Setup

### Option 1: Vercel Postgres (Recommended for Vercel Deployment)
1. Create a Vercel account
2. Create a new Postgres database in Vercel
3. Copy the connection string

### Option 2: Neon (Serverless Postgres)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option 3: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb event360`
3. Connection string: `postgresql://user:password@localhost:5432/event360?schema=public`

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Social Media API Keys (for future integrations)
WHATSAPP_API_KEY=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""

FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_ACCESS_TOKEN=""

# Email Service
EMAIL_API_KEY=""
EMAIL_FROM="noreply@event360.com"

# SMS Service
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Media Storage
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Streaming
MUX_TOKEN_ID=""
MUX_TOKEN_SECRET=""

# Authentication
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

## Installation Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev --name init
   ```

3. **Seed invitation templates (required for invitation features):**
   ```bash
   pnpm seed:templates
   ```
   This seeds the database with default invitation templates that all users can use.
   **Note:** This should be run ONCE during initial setup. Templates are shared across all users.

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open Prisma Studio (optional - for database management):**
   ```bash
   npx prisma studio
   ```

## Project Structure

```
event360/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── prisma.ts          # Prisma Client singleton
├── public/                    # Static assets
└── package.json
```

## Database Schema Overview

The schema includes models for:

- **User**: Event creators and family members
- **Family**: Grouping for multiple family members
- **Event**: Main event (e.g., "Wedding Celebration")
- **Ceremony**: Multiple ceremonies per event (Traditional, White Wedding, etc.)
- **ScheduleItem**: Order of events within ceremonies
- **Invitee**: Guest list with RSVP tracking
- **Invite**: Invitation delivery tracking
- **MediaAsset**: Photos/videos from various sources
- **Interaction**: Comments, reactions, guestbook entries
- **Theme**: Event themes/templates

## Next Steps

1. Set up your database connection in `.env`
2. Run migrations to create the database tables
3. Start building the UI components
4. Implement authentication
5. Add API routes for event management
6. Integrate social media APIs

## Useful Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Format Prisma schema
npx prisma format
```

