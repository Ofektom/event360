# Contact Import Setup Guide

## Overview

The contact import feature allows users to import contacts from:
1. **Phone Contacts** - Browser Contacts API (no third-party setup needed)
2. **Facebook Friends** - Facebook Graph API (requires Facebook App setup)
3. **Instagram Followers** - Instagram Graph API (requires Business account setup)

---

## 1. Phone Contacts Import

### ✅ No Third-Party Setup Required

The phone contacts import uses the **Browser Contacts API**, which is built into modern browsers.

### Requirements:
- **Chrome/Edge on Android** or **Safari on iOS**
- **HTTPS** (required for production, localhost works for development)
- User must grant permission when prompted

### How It Works:
- User clicks "Import from Phone"
- Browser prompts for permission
- User selects contacts from their device
- System validates and filters contacts based on selected channel

### Limitations:
- Only works on mobile browsers (Chrome/Edge Android, Safari iOS)
- Desktop browsers don't support this API
- User must grant permission each time (or browser remembers)

---

## 2. Facebook Friends Import

### ⚠️ Requires Facebook App Setup

### Step 1: Create Facebook App

1. **Go to Facebook Developers**
   - Visit [Facebook Developers](https://developers.facebook.com/)
   - Click "My Apps" → "Create App"
   - Choose "Consumer" or "Business" app type
   - Fill in app details

2. **Add Facebook Login Product**
   - In your app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Choose "Web" platform

3. **Configure OAuth Settings**
   - Go to "Settings" > "Basic"
   - Add your app domains:
     - Development: `localhost`
     - Production: `yourdomain.com`
   - Add site URL:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - Go to "Settings" > "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/facebook`
     - Production: `https://yourdomain.com/api/auth/callback/facebook`

### Step 2: Request `user_friends` Permission

1. **Add Permission to App**
   - Go to "App Review" > "Permissions and Features"
   - Find "user_friends" permission
   - Click "Request" or "Add"

2. **Important Notes:**
   - `user_friends` permission requires **App Review** for production use
   - During development, you can test with your own account and test users
   - Facebook only returns friends who **also use your app** (privacy policy)

### Step 3: App Review (Required for Production)

1. **Prepare Your App for Review**
   - Complete app details
   - Add privacy policy URL
   - Add terms of service URL
   - Provide use case explanation:
     ```
     Use Case: Users want to invite their Facebook friends to events.
     We use the user_friends permission to show friends who can be 
     invited via Facebook Messenger or Email.
     ```

2. **Submit for Review**
   - Go to "App Review" > "Permissions and Features"
   - Click "Request" for `user_friends`
   - Fill out the review form
   - Submit screenshots/videos showing the feature

3. **Review Process**
   - Facebook typically reviews within 7-14 days
   - They may request additional information
   - Once approved, all users can use the feature

### Step 4: Environment Variables

Add to your `.env` file:

```env
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

### Current Status in Code:

✅ **Already Configured:**
- OAuth scope includes `user_friends` in `src/auth.ts`
- API route created at `/api/social/facebook/friends`
- UI integration complete

⚠️ **What You Need to Do:**
1. Create Facebook App (if not already done)
2. Request `user_friends` permission
3. Submit for App Review (for production)
4. Add environment variables

### Limitations:

1. **Only Returns Friends Who Use Your App**
   - Facebook privacy policy: Only friends who have also connected with your app will be returned
   - This means if a user has 500 friends, but only 10 use your app, only those 10 will appear

2. **App Review Required**
   - Cannot access friends in production without App Review approval
   - Development mode works with test users

3. **Permission Granularity**
   - Users must grant permission when signing in
   - Permission can be revoked by user at any time

---

## 3. Instagram Followers Import

### ⚠️ Requires Instagram Business Account Setup

### Step 1: Convert to Business Account

1. **Convert Instagram Account**
   - Open Instagram app
   - Go to Settings → Account → Switch to Professional Account
   - Choose "Business" account type
   - Connect to a Facebook Page (required)

2. **Connect to Facebook Page**
   - Create or select a Facebook Page
   - Link your Instagram Business account to the Page

### Step 2: Facebook App Setup

1. **Add Instagram Product**
   - In your Facebook App dashboard
   - Go to "Add Product"
   - Find "Instagram" and click "Set Up"

2. **Get Instagram Business Account ID**
   - Go to "Instagram" > "Basic Display"
   - Your Instagram Business Account ID will be shown
   - Or use Graph API Explorer to find it

### Step 3: Request Permissions

Required permissions:
- `instagram_basic` - Basic profile access
- `pages_read_engagement` - Read page engagement
- `instagram_manage_messages` - Send DMs (for sending invitations)

### Step 4: App Review

Instagram permissions require App Review:
- Submit use case explanation
- Provide screenshots
- May take 7-14 days

### Current Status in Code:

⚠️ **Partially Implemented:**
- API route created at `/api/social/instagram/followers`
- Currently returns placeholder message
- Requires Business account connection

### Limitations:

1. **Business Account Required**
   - Personal accounts cannot access followers list via API
   - Must be Business or Creator account

2. **Facebook Page Connection Required**
   - Instagram Business account must be connected to a Facebook Page

3. **Limited API Access**
   - Instagram Graph API has strict rate limits
   - Getting full followers list may not be available
   - May need to use alternative methods

---

## Summary

### Phone Contacts
- ✅ **No setup required** - Works out of the box
- ✅ Browser API - No third-party services
- ⚠️ Only works on mobile browsers

### Facebook Friends
- ⚠️ **Requires Facebook App setup**
- ⚠️ **Requires App Review** for production
- ⚠️ Only returns friends who use your app
- ✅ Already integrated in code

### Instagram Followers
- ⚠️ **Requires Business account**
- ⚠️ **Requires Facebook Page connection**
- ⚠️ **Requires App Review**
- ⚠️ Limited API access
- ⚠️ Partially implemented (placeholder)

---

## Quick Start (Minimum Setup)

To get started quickly:

1. **Phone Contacts**: ✅ Ready to use (no setup)

2. **Facebook Friends**: 
   - Create Facebook App
   - Add `user_friends` to scope (already in code)
   - Test in development mode
   - Submit for App Review when ready for production

3. **Instagram**: 
   - Not recommended for initial launch
   - Requires extensive setup
   - Consider manual contact entry instead

---

## Testing

### Test Phone Contacts:
1. Open app on mobile device (Chrome Android or Safari iOS)
2. Go to Send Invitations page
3. Click "Import from Phone"
4. Grant permission and select contacts

### Test Facebook Friends:
1. Sign in with Facebook
2. Ensure you have test users who also use your app
3. Go to Send Invitations page
4. Click "Import Facebook Friends"
5. Should see friends who use your app

---

## Troubleshooting

### Facebook Friends Not Showing:
- Check if user signed in with Facebook
- Verify `user_friends` permission is requested
- Check if friends have also connected with your app
- Verify App Review status (if in production)

### Phone Contacts Not Working:
- Ensure you're on mobile browser (Chrome Android or Safari iOS)
- Check if HTTPS is enabled (required for production)
- Verify browser supports Contacts API
- Check browser permissions

### Instagram Not Working:
- Verify Instagram account is Business type
- Check if connected to Facebook Page
- Verify permissions are granted
- Check App Review status

