# Vercel Deployment Fix for OAuth

## Issue
Getting 500 error on `/api/auth/session` when trying to use OAuth authentication after deployment.

## Root Causes

1. **Missing Environment Variables**: OAuth providers were being initialized even when credentials weren't set
2. **Missing `trustHost`**: NextAuth v5 requires `trustHost: true` for Vercel deployments
3. **Database Connection**: Prisma adapter might have connection issues in production

## Fixes Applied

### 1. Conditional OAuth Provider Initialization
- OAuth providers are now only added if their environment variables are present
- Prevents errors when credentials are missing

### 2. Added `trustHost: true`
- Required for NextAuth v5 on Vercel
- Allows NextAuth to trust the host header from Vercel's proxy

### 3. Environment Variables Checklist

Make sure these are set in Vercel:

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL: `https://gbedoo.vercel.app`

**Optional (for OAuth):**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

## Steps to Fix

1. **Check Vercel Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Verify all required variables are set
   - Make sure `NEXTAUTH_URL` is set to your production URL

2. **Verify Database Connection**
   - Ensure `DATABASE_URL` is correct
   - Test database connection in Vercel logs

3. **Redeploy**
   - After adding/updating environment variables, redeploy
   - Vercel will automatically redeploy on the next push

4. **Check Vercel Logs**
   - Go to your Vercel project > Deployments
   - Click on the latest deployment
   - Check "Functions" tab for error logs
   - Look for any Prisma or database connection errors

## Common Issues

### Issue: "AUTH_SECRET is missing"
**Solution**: Set `NEXTAUTH_SECRET` in Vercel environment variables

### Issue: "Invalid redirect URI"
**Solution**: 
- For Google: Add `https://gbedoo.vercel.app/api/auth/callback/google` to authorized redirect URIs
- For Facebook: Add `https://gbedoo.vercel.app/api/auth/callback/facebook` to valid OAuth redirect URIs

### Issue: Database connection timeout
**Solution**: 
- Check if your database allows connections from Vercel's IPs
- Verify `DATABASE_URL` is correct
- For Neon/Serverless Postgres, ensure connection pooling is enabled

### Issue: Prisma Client not generated
**Solution**: 
- Vercel should run `prisma generate` automatically (via postinstall script)
- Check build logs to ensure Prisma Client is generated
- If not, add `prisma generate` to your build command

## Testing

After deployment:
1. Try signing in with email/password (should work)
2. Try signing in with Google (if credentials are set)
3. Check browser console for errors
4. Check Vercel function logs for server-side errors

## Additional Notes

- The app will work with just email/password if OAuth credentials aren't set
- OAuth buttons will only appear if credentials are configured
- All authentication methods work independently

