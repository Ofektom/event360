# Fix: "Configuration" Error in NextAuth

## Error Message
```
Authentication Error
There is a problem with the server configuration.
```

## Root Cause

The "Configuration" error in NextAuth typically means one of these environment variables is missing or incorrect in Vercel:

1. **`NEXTAUTH_SECRET`** - Required for JWT token signing
2. **`NEXTAUTH_URL`** - Required for OAuth callbacks (you've already set this)
3. **OAuth Provider Secrets** - Missing `FACEBOOK_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET`

## Solution: Verify Environment Variables in Vercel

### Step 1: Check Required Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `event360-three`
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:

**Required:**
- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - **MUST BE SET** (generate with: `openssl rand -base64 32`)
- ✅ `NEXTAUTH_URL` - `https://event360-three.vercel.app` (no trailing slash)

**OAuth (if using):**
- ✅ `FACEBOOK_CLIENT_ID` - Your Facebook App ID
- ✅ `FACEBOOK_CLIENT_SECRET` - Your Facebook App Secret
- ✅ `GOOGLE_CLIENT_ID` - (if using Google OAuth)
- ✅ `GOOGLE_CLIENT_SECRET` - (if using Google OAuth)

### Step 2: Generate NEXTAUTH_SECRET (if missing)

If `NEXTAUTH_SECRET` is missing or you need to regenerate it:

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32

### Step 3: Add NEXTAUTH_SECRET to Vercel

1. Copy the generated secret
2. In Vercel Dashboard → Settings → Environment Variables
3. Click **Add New**
4. Add:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: (paste the generated secret)
   - **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 4: Redeploy

After adding/updating environment variables:

1. **Redeploy** your application
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a redeploy

2. **Wait 2-3 minutes** for deployment to complete

3. **Clear browser cache** or use incognito mode

4. **Test again** - The configuration error should be resolved

## Verify It's Working

1. Check Vercel logs for any errors:
   - Go to **Deployments** → Latest deployment → **Functions** tab
   - Look for any authentication-related errors

2. Test the Facebook OAuth flow:
   - Should redirect to production URL (not localhost) ✅
   - Should not show "Configuration" error ✅
   - Should complete the OAuth flow successfully ✅

## Common Issues

### Issue: "NEXTAUTH_SECRET is undefined"

**Solution**: Make sure `NEXTAUTH_SECRET` is set in Vercel environment variables and you've redeployed after adding it.

### Issue: "Invalid NEXTAUTH_URL"

**Solution**: 
- Ensure `NEXTAUTH_URL` is set to `https://event360-three.vercel.app` (no trailing slash)
- Make sure it's set for the correct environment (Production)

### Issue: "OAuth provider configuration error"

**Solution**: 
- Verify `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` are set correctly
- Check that the values match your Facebook App settings

## Quick Checklist

Before testing, ensure:

- [ ] `NEXTAUTH_SECRET` is set in Vercel
- [ ] `NEXTAUTH_URL` is set to `https://event360-three.vercel.app` (no trailing slash)
- [ ] `DATABASE_URL` is set correctly
- [ ] `FACEBOOK_CLIENT_ID` is set (if using Facebook OAuth)
- [ ] `FACEBOOK_CLIENT_SECRET` is set (if using Facebook OAuth)
- [ ] All environment variables are set for **Production** environment
- [ ] Application has been **redeployed** after adding/updating variables
- [ ] Browser cache has been cleared

## Still Not Working?

If the error persists after verifying all environment variables:

1. **Check Vercel Logs**:
   - Go to Deployments → Latest → Functions tab
   - Look for specific error messages

2. **Verify Environment Variable Names**:
   - NextAuth v5 might use `AUTH_SECRET` instead of `NEXTAUTH_SECRET`
   - Check your NextAuth version and use the correct variable name

3. **Test Locally**:
   - Make sure your `.env` file has all required variables
   - Test the OAuth flow locally to isolate the issue

4. **Contact Support**:
   - If all variables are set correctly and the error persists, there might be a deeper configuration issue

