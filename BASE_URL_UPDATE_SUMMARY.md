# Base URL Update Summary

## Overview
Updated the application to use a centralized base URL utility function instead of hardcoded `localhost:3000` or inconsistent URL handling throughout the codebase.

## Changes Made

### 1. Created Centralized Utility Function
**File**: `src/lib/utils.ts`

Added `getBaseUrl()` function that:
- Checks `NEXT_PUBLIC_APP_URL` first (highest priority)
- Falls back to `NEXTAUTH_URL` if `NEXT_PUBLIC_APP_URL` is not set
- Falls back to production URL `https://gbedoo.vercel.app` as final fallback
- Removes trailing slashes for consistency

```typescript
export function getBaseUrl(): string {
  const baseUrl = 
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.NEXTAUTH_URL || 
    'https://gbedoo.vercel.app'
  
  return baseUrl.replace(/\/$/, '')
}
```

### 2. Updated Files to Use `getBaseUrl()`

#### Event Service
**File**: `src/services/event.service.ts`
- Updated share link generation to use `getBaseUrl()`
- Changed from: `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`
- Changed to: `getBaseUrl()`

#### Invite Sending API
**File**: `src/app/api/invites/send/route.ts`
- Updated share link generation for invitations
- Changed from: `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`
- Changed to: `getBaseUrl()`
- Also fixed share link format to use `/e/{slug}` instead of `/events/{slug}`

#### Vendor Invitation Service
**File**: `src/services/vendor/vendor-invitation.service.ts`
- Updated invitation link generation
- Changed from: Multiple fallback checks with hardcoded production URL
- Changed to: `getBaseUrl()`

#### WhatsApp Invite Service
**File**: `src/services/invite/whatsapp.service.ts`
- Updated image URL conversion from relative to absolute
- Changed from: Multiple fallback checks with hardcoded production URL
- Changed to: `getBaseUrl()`

#### Facebook OAuth Link
**File**: `src/app/api/social/facebook/link/route.ts`
- Updated OAuth redirect URI generation
- Changed from: Multiple fallback checks with `localhost:3000` fallback
- Changed to: `getBaseUrl()`

#### NextAuth Configuration
**File**: `src/auth.ts`
- Updated redirect callback to use `getBaseUrl()`
- Changed from: `process.env.NEXTAUTH_URL || baseUrl`
- Changed to: `getBaseUrl()`

### 3. Environment Variables

#### Required Environment Variable
Add to your `.env` file (and Vercel environment variables):

```env
NEXT_PUBLIC_APP_URL=https://gbedoo.vercel.app
```

**Note**: Do NOT include a trailing slash.

#### Priority Order
The `getBaseUrl()` function uses the following priority:
1. `NEXT_PUBLIC_APP_URL` (highest priority)
2. `NEXTAUTH_URL` (fallback)
3. `https://gbedoo.vercel.app` (final fallback)

### 4. Documentation Updates

**File**: `VERCEL_ENV_SETUP.md`
- Added `NEXT_PUBLIC_APP_URL` to the required environment variables list
- Documented its purpose and usage

## Benefits

1. **Consistency**: All URLs throughout the app now use the same base URL source
2. **Maintainability**: Single source of truth for base URL logic
3. **Environment-aware**: Automatically uses the correct URL based on environment
4. **No hardcoded URLs**: Removed all `localhost:3000` hardcoded references
5. **Production-ready**: Defaults to production URL if environment variables are not set

## Files Modified

1. `src/lib/utils.ts` - Added `getBaseUrl()` utility function
2. `src/services/event.service.ts` - Updated share link generation
3. `src/app/api/invites/send/route.ts` - Updated invitation share link
4. `src/services/vendor/vendor-invitation.service.ts` - Updated vendor invitation links
5. `src/services/invite/whatsapp.service.ts` - Updated image URL conversion
6. `src/app/api/social/facebook/link/route.ts` - Updated OAuth redirect URI
7. `src/auth.ts` - Updated NextAuth redirect callback
8. `VERCEL_ENV_SETUP.md` - Updated documentation

## Next Steps

1. **Set Environment Variable in Vercel**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `NEXT_PUBLIC_APP_URL` = `https://gbedoo.vercel.app` (no trailing slash)
   - Apply to Production, Preview, and Development environments
   - Redeploy the application

2. **Verify Share Links**:
   - Test creating a new event and verify the share link uses the production URL
   - Test sending invitations and verify links use the production URL
   - Test vendor invitations and verify links use the production URL

3. **Local Development**:
   - For local development, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in your `.env.local` file
   - The app will automatically use this for local development

## Testing Checklist

- [ ] Create a new event and verify share link uses production URL
- [ ] Send an invitation and verify the link in the message uses production URL
- [ ] Add a vendor and verify the invitation link uses production URL
- [ ] Test Facebook OAuth and verify redirect URI uses production URL
- [ ] Verify all share links in the UI display production URLs
- [ ] Test in local development with `NEXT_PUBLIC_APP_URL=http://localhost:3000`

