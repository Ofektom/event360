# Facebook OAuth Setup Guide

## Issues Fixed

1. **Removed deprecated `email` scope** - Facebook has deprecated the `email` permission. Email is now provided via `public_profile` scope.
2. **Updated OAuth scopes** - Changed from `public_profile,email,user_friends` to `public_profile,user_friends`

## Facebook App Configuration

There are **TWO separate settings** you need to configure. Both are required:

### ✅ Step 1: Add App Domains (THIS IS WHAT'S MISSING!)

**This is different from the redirect URI!** Facebook needs to know which domains your app uses.

1. Go to [Facebook Developers](https://developers.facebook.com/apps/387945120557219/settings/basic/)
2. In the left sidebar, click **Settings** → **Basic** (NOT the OAuth settings)
3. Scroll down to find the **"App Domains"** section
4. Click **+ Add Domain** button
5. Add the domain **without** `https://` or trailing slash:
   - `event360-three.vercel.app` (for production)
   - `localhost` (for development - optional)
6. Click **Save Changes** at the bottom of the page

**Important:** This is a separate field from "Valid OAuth Redirect URIs". The App Domains field tells Facebook which domains are allowed to use your app.

### ✅ Step 2: Configure OAuth Redirect URIs (You've already done this!)

1. Go to **Products** → **Facebook Login** → **Settings**
2. Under **Valid OAuth Redirect URIs**, you should already have:
   - `https://event360-three.vercel.app/api/auth/callback/facebook` ✅
3. Make sure **Client OAuth Login** and **Web OAuth Login** are **Enabled** (toggle them ON)
4. Click **Save Changes**

### Step 3: Verify Site URL (Optional but Recommended)

1. In **Settings** → **Basic**, scroll to **Site URL**
2. Add: `https://event360-three.vercel.app`
3. Click **Save Changes**

## Common Confusion

- **App Domains** (Settings > Basic): The root domain of your app (`event360-three.vercel.app`)
- **Valid OAuth Redirect URIs** (Products > Facebook Login > Settings): The full callback URL (`https://event360-three.vercel.app/api/auth/callback/facebook`)

Both are required! The redirect URI you added is correct, but you also need to add the domain itself to App Domains.

### Important Notes:

- **Email Permission**: Facebook no longer requires the `email` scope. Email addresses are automatically provided with the `public_profile` scope if the user has verified their email on Facebook.
- **User Friends Permission**: The `user_friends` permission requires App Review for production use. For development, it works with test users.
- **Redirect URIs**: Must match exactly (including `http://` vs `https://` and trailing slashes)

## Testing

After updating the Facebook App settings:

1. Try connecting Facebook again from the send invitations page
2. You should be redirected to Facebook's login page
3. After authorizing, you'll be redirected back to your app

## References

- [Facebook Login Permissions](https://developers.facebook.com/docs/facebook-login/permissions)
- [Facebook OAuth Redirect URIs](https://developers.facebook.com/docs/facebook-login/security#redirect-uris)
