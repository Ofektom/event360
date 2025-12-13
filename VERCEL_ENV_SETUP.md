# Vercel Environment Variables Setup

## Critical: Fix OAuth Redirect to Localhost Issue

If Facebook OAuth is redirecting to `localhost:3000` instead of your production URL, you need to set the `NEXTAUTH_URL` environment variable in Vercel.

## Required Environment Variables

### 1. Set NEXTAUTH_URL in Vercel

**This is the most important fix for the localhost redirect issue!**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `gbedoo`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://gbedoo.vercel.app` (NO trailing slash)
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you only want it for production)
6. Click **Save**
7. **Redeploy** your application (Vercel will automatically redeploy, or you can trigger a redeploy manually)

### 2. Verify All Required Environment Variables

Make sure these are all set in Vercel:

**Required:**
- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- ✅ `NEXTAUTH_URL` - **`https://gbedoo.vercel.app`** (NO trailing slash) ⚠️ **THIS IS THE FIX**
- ✅ `NEXT_PUBLIC_APP_URL` - **`https://gbedoo.vercel.app`** (NO trailing slash) - Used for generating share links, invitation links, and other absolute URLs

**OAuth Providers:**
- ✅ `FACEBOOK_CLIENT_ID` - Your Facebook App ID
- ✅ `FACEBOOK_CLIENT_SECRET` - Your Facebook App Secret
- ✅ `GOOGLE_CLIENT_ID` - (if using Google OAuth)
- ✅ `GOOGLE_CLIENT_SECRET` - (if using Google OAuth)

## After Setting NEXTAUTH_URL

1. **Redeploy** your application
2. **Wait 2-3 minutes** for the deployment to complete
3. **Clear your browser cache** or use incognito mode
4. **Test the Facebook OAuth flow again**

The redirect should now go to `https://gbedoo.vercel.app` instead of `localhost:3000`.

## How to Verify It's Working

1. After redeploying, check the Vercel logs
2. Look for any errors related to authentication
3. Try the Facebook OAuth flow again
4. The redirect should go to your production URL

## Troubleshooting

### Still redirecting to localhost?

1. **Double-check** `NEXTAUTH_URL` is set correctly (no trailing slash)
2. **Verify** the environment variable is set for the correct environment (Production)
3. **Redeploy** after adding/updating the variable
4. **Clear browser cache** - old redirects might be cached
5. **Check Vercel logs** for any errors

### Configuration Error Still Appearing?

If you see "There is a problem with the server configuration" error:
- This usually means `NEXTAUTH_SECRET` is missing or incorrect
- Make sure `NEXTAUTH_SECRET` is set in Vercel
- Regenerate it if needed: `openssl rand -base64 32`

## Code Changes Made

The code has been updated to:
1. Use `NEXTAUTH_URL` from environment variables in the redirect callback
2. Normalize base URLs to remove trailing slashes
3. Fall back to request origin if environment variable is not set

But **you still need to set `NEXTAUTH_URL` in Vercel** for it to work correctly in production.

