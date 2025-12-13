# Vercel Project Rename: event360 → gbedoo

## Warning Explanation

When renaming a Vercel project, you may see this warning:
> "Changing the project name will affect the OpenID Connect Token claims..."

**This warning is safe to ignore** if you're using NextAuth.js (which we are). It only applies if you're using Vercel's native OIDC features, which we're not.

## Steps After Renaming

### 1. Update Environment Variables in Vercel

After renaming to `gbedoo`, verify these environment variables:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update these if they reference the old project name:
   - `NEXTAUTH_URL` → Should be `https://gbedoo.vercel.app` (no trailing slash)
   - `NEXT_PUBLIC_APP_URL` → Should be `https://gbedoo.vercel.app` (no trailing slash)

### 2. Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, update:
   - Remove: `https://event360-three.vercel.app/api/auth/callback/google`
   - Add: `https://gbedoo.vercel.app/api/auth/callback/google`
5. Click **Save**

### 3. Update Facebook OAuth Settings

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**:
   - Update **App Domains**: `gbedoo.vercel.app`
   - Update **Site URL**: `https://gbedoo.vercel.app`
4. Go to **Products** → **Facebook Login** → **Settings**:
   - Under **Valid OAuth Redirect URIs**, update:
     - Remove: `https://event360-three.vercel.app/api/auth/callback/facebook`
     - Add: `https://gbedoo.vercel.app/api/auth/callback/facebook`
5. Click **Save Changes**

### 4. Test After Rename

After completing the above steps:

1. ✅ Verify app loads at `https://gbedoo.vercel.app`
2. ✅ Test Google OAuth login
3. ✅ Test Facebook OAuth login
4. ✅ Verify redirects work correctly
5. ✅ Check that environment variables are accessible

## What Doesn't Need to Change

- ✅ Database connection strings (DATABASE_URL) - No change needed
- ✅ API keys (RESEND_API_KEY, etc.) - No change needed
- ✅ NextAuth secret (NEXTAUTH_SECRET) - No change needed
- ✅ Application code - Already updated to use `gbedoo`

## Troubleshooting

### Issue: OAuth redirects still go to old URL
**Solution**: Clear browser cache or use incognito mode. The OAuth providers may have cached the old redirect URI.

### Issue: "Invalid redirect URI" error
**Solution**: Double-check that you've updated the redirect URIs in both Google Cloud Console and Facebook App Settings exactly as shown above.

### Issue: Environment variables not updating
**Solution**: After updating environment variables in Vercel, you may need to trigger a new deployment for changes to take effect.

