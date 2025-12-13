# Facebook OAuth Troubleshooting Guide

## Issue: "The domain of this URL isn't included in the app's domains"

Even when both **App Domains** and **Valid OAuth Redirect URIs** are correctly configured, you may still see this error. Here are the most common causes and solutions:

### ✅ Solution 1: Wait for Facebook Cache to Clear

Facebook caches configuration changes. After updating settings:
- **Wait 5-10 minutes** before testing again
- Clear your browser cache
- Try in an incognito/private window

### ✅ Solution 2: Check for Trailing Slash Mismatch

The redirect URI must match **exactly** what's in Facebook settings:

**In Facebook App Settings:**
- ✅ Correct: `https://gbedoo.vercel.app/api/auth/callback/facebook`
- ❌ Wrong: `https://gbedoo.vercel.app/api/auth/callback/facebook/` (trailing slash)

**Check your Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check `NEXTAUTH_URL`:
   - ✅ Should be: `https://gbedoo.vercel.app` (no trailing slash)
   - ❌ Should NOT be: `https://gbedoo.vercel.app/` (with trailing slash)

### ✅ Solution 3: Verify Exact Match in Facebook Settings

1. Go to **Products** → **Facebook Login** → **Settings**
2. Check the **Valid OAuth Redirect URIs** field
3. It should be **exactly**: `https://gbedoo.vercel.app/api/auth/callback/facebook`
4. No trailing slash, no extra spaces

### ✅ Solution 4: Check App Domains Format

In **Settings** → **Basic** → **App Domains**:
- ✅ Correct: `gbedoo.vercel.app` (no `https://`, no trailing slash)
- ❌ Wrong: `https://gbedoo.vercel.app` (with protocol)
- ❌ Wrong: `gbedoo.vercel.app/` (with trailing slash)

### ✅ Solution 5: Verify Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `gbedoo`
3. Go to **Settings** → **Environment Variables**
4. Ensure `NEXTAUTH_URL` is set to: `https://gbedoo.vercel.app` (no trailing slash)
5. If it's missing or incorrect, add/update it
6. **Redeploy** your application after updating environment variables

### ✅ Solution 6: Test the Generated Redirect URI

The code generates the redirect URI dynamically. To verify what's being sent:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Connect Facebook" button
4. Look for the request to `/api/social/facebook/link`
5. Check the response - it should contain `authUrl` with the redirect URI
6. Verify the redirect URI in the `authUrl` matches exactly what's in Facebook settings

### ✅ Solution 7: Facebook App Mode

If your app is in **Development Mode**:
- Only you and test users can use it
- Make sure you're logged in as the app admin or a test user

To check:
1. Go to **Settings** → **Basic**
2. Look for "App Mode" - should show "Development" or "Live"
3. If "Development", add yourself as a test user in **Roles** → **Test Users**

### ✅ Solution 8: Re-save Facebook Settings

Sometimes Facebook needs you to explicitly save changes:

1. Go to **Products** → **Facebook Login** → **Settings**
2. Even if the redirect URI is already there, **remove it and add it again**
3. Click **Save Changes**
4. Wait 5-10 minutes
5. Try again

## Quick Checklist

Before testing, verify:

- [ ] App Domains contains: `gbedoo.vercel.app` (no protocol, no trailing slash)
- [ ] Valid OAuth Redirect URIs contains: `https://gbedoo.vercel.app/api/auth/callback/facebook` (with protocol, no trailing slash)
- [ ] Site URL is set to: `https://gbedoo.vercel.app` (with protocol, trailing slash OK here)
- [ ] Client OAuth Login is **Enabled**
- [ ] Web OAuth Login is **Enabled**
- [ ] `NEXTAUTH_URL` in Vercel is set to: `https://gbedoo.vercel.app` (no trailing slash)
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleared browser cache or using incognito mode

## Still Not Working?

If all the above are correct and you're still getting the error:

1. **Check Facebook App Status**: Go to **App Review** → **Permissions and Features** and ensure your app is not restricted
2. **Check Browser Console**: Look for any JavaScript errors that might be interfering
3. **Try Different Browser**: Sometimes browser extensions can interfere
4. **Check Vercel Logs**: Go to Vercel Dashboard → Your Project → Logs to see if there are any server-side errors

## Code Fix Applied

The code has been updated to normalize the base URL and remove trailing slashes to ensure exact matching with Facebook's requirements.

