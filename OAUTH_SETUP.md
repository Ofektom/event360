# OAuth Setup Guide

## Overview

Event360 now supports OAuth authentication with Google and Facebook in addition to email/password authentication.

## Setup Instructions

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`
   - Copy the Client ID and Client Secret

4. **Add to Environment Variables**
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### 2. Facebook OAuth Setup

1. **Go to Facebook Developers**
   - Visit [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or select an existing one

2. **Add Facebook Login Product**
   - In your app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"

3. **Configure OAuth Settings**
   - Go to "Settings" > "Basic"
   - Add your app domains and site URL
   - Go to "Settings" > "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/facebook`
     - Production: `https://yourdomain.com/api/auth/callback/facebook`

4. **Get App ID and Secret**
   - Go to "Settings" > "Basic"
   - Copy the App ID and App Secret

5. **Add to Environment Variables**
   ```env
   FACEBOOK_CLIENT_ID="your-facebook-app-id"
   FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
   ```

### 3. Update Environment Variables

Add these to your `.env` file:

```env
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

### 4. Update Vercel Environment Variables

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add all four OAuth variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FACEBOOK_CLIENT_ID`
   - `FACEBOOK_CLIENT_SECRET`
4. Select all environments (Production, Preview, Development)
5. Redeploy your application

## How It Works

### User Flow

1. **OAuth Sign In/Sign Up**
   - User clicks "Continue with Google" or "Continue with Facebook"
   - They're redirected to the OAuth provider's login page
   - After authentication, they're redirected back to your app
   - A user account is automatically created if it doesn't exist
   - User is logged in and redirected to the dashboard

2. **Account Linking**
   - If a user signs up with OAuth, an account is created automatically
   - The account is linked to the OAuth provider via the `Account` table
   - Users can sign in with the same OAuth provider in the future
   - Email/password and OAuth accounts are separate (same email can have both)

### Database

- OAuth accounts are stored in the `Account` table (created by NextAuth)
- User information is stored in the `User` table
- The `Account` table links users to their OAuth providers

## Features

- ✅ Google OAuth authentication
- ✅ Facebook OAuth authentication
- ✅ Automatic user creation for OAuth users
- ✅ Email verification automatically set for OAuth users
- ✅ Profile picture synced from OAuth provider
- ✅ Works alongside email/password authentication

## Troubleshooting

### Common Issues

1. **"Invalid OAuth redirect URI"**
   - Make sure the redirect URI in your OAuth provider matches exactly:
     - Development: `http://localhost:3000/api/auth/callback/[provider]`
     - Production: `https://yourdomain.com/api/auth/callback/[provider]`

2. **"OAuth provider not configured"**
   - Check that all environment variables are set correctly
   - Restart your development server after adding environment variables

3. **"User creation failed"**
   - Check database connection
   - Ensure Prisma migrations are up to date
   - Check server logs for detailed error messages

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all OAuth credentials
- Regularly rotate OAuth secrets
- Use HTTPS in production
- Configure proper CORS settings in OAuth provider dashboards

