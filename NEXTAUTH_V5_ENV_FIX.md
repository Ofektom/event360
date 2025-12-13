# Fix: NextAuth v5 Configuration Error

## Issue
Environment variables are set in Vercel, but you're still getting a "Configuration" error.

## Root Cause

You're using **NextAuth v5** (`5.0.0-beta.30`), which uses different environment variable names:

- ✅ **`AUTH_SECRET`** (preferred in v5) OR `NEXTAUTH_SECRET` (backward compatible)
- ✅ **`AUTH_URL`** (preferred in v5) OR `NEXTAUTH_URL` (backward compatible)

However, the most common issue is that **the deployment hasn't been redeployed** after adding/updating environment variables.

## Solution

### Option 1: Add AUTH_SECRET and AUTH_URL (Recommended for NextAuth v5)

Even though `NEXTAUTH_SECRET` and `NEXTAUTH_URL` should work, NextAuth v5 prefers the new names:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `gbedoo`
3. Go to **Settings** → **Environment Variables**
4. Add these additional variables (use the same values):

   - **Key**: `AUTH_SECRET`
   - **Value**: (same value as `NEXTAUTH_SECRET`: `WCrMjmnZnoy4BiFqdkSQ9cEFLmVgb9WpH...`)
   - **Environment**: Production, Preview, Development

   - **Key**: `AUTH_URL`
   - **Value**: `https://gbedoo.vercel.app` (no trailing slash)
   - **Environment**: Production, Preview, Development

5. Click **Save**

### Option 2: Redeploy (Most Likely Fix)

The variables are set, but your deployment might be from before they were added:

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the three dots (⋯) menu
4. Click **Redeploy**
5. Select **Use existing Build Cache** (optional, but faster)
6. Click **Redeploy**
7. Wait 2-3 minutes for deployment to complete
8. Test again

### Option 3: Both (Best Practice)

Do both:
1. Add `AUTH_SECRET` and `AUTH_URL` (for NextAuth v5 compatibility)
2. Redeploy the application

## Why This Happens

- **Environment variables are only available to NEW deployments**
- If you added `NEXTAUTH_URL` 25 minutes ago, but your current deployment is older, it won't have access to that variable
- NextAuth v5 prefers `AUTH_SECRET` and `AUTH_URL` over the old names

## Verify It's Working

After redeploying:

1. **Check Vercel Logs**:
   - Go to **Deployments** → Latest deployment → **Functions** tab
   - Look for any authentication errors
   - Should see successful auth initialization

2. **Test the OAuth Flow**:
   - Try connecting Facebook again
   - Should NOT show "Configuration" error
   - Should redirect correctly to production URL
   - Should complete the OAuth flow

## Quick Checklist

- [ ] `NEXTAUTH_SECRET` is set (you have this ✅)
- [ ] `NEXTAUTH_URL` is set (you have this ✅)
- [ ] `AUTH_SECRET` is set (add this for v5 compatibility)
- [ ] `AUTH_URL` is set (add this for v5 compatibility)
- [ ] **Application has been REDEPLOYED after adding variables** ⚠️ **THIS IS CRITICAL**
- [ ] Browser cache cleared or using incognito mode

## Most Likely Solution

**Just redeploy!** Your environment variables are set correctly, but the running deployment doesn't have them. Redeploy and the error should go away.

