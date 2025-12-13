# Facebook App Review Guide for `user_friends` Permission

## Overview

The `user_friends` permission requires **Facebook App Review** before it can be used in production. This guide will walk you through submitting your app for review.

## Current Status

✅ **OAuth is working** - The connection flow is successful  
⚠️ **App Review Required** - The `user_friends` permission needs approval

## Step-by-Step: Submit for App Review

### Step 1: Complete App Basic Settings

Before submitting for review, ensure your app details are complete:

1. Go to [Facebook Developers](https://developers.facebook.com/apps/387945120557219/settings/basic/)
2. Verify these fields are filled:
   - ✅ **Display Name**: `gbedoo`
   - ✅ **App Domains**: `gbedoo.vercel.app`
   - ✅ **Site URL**: `https://gbedoo.vercel.app`
   - ✅ **Contact Email**: Your email (already set: `okpoho_t@yahoo.com`)
   - ⚠️ **Privacy Policy URL**: **REQUIRED** - Add your privacy policy URL
   - ⚠️ **Terms of Service URL**: **REQUIRED** - Add your terms of service URL
   - ⚠️ **Category**: Select an appropriate category (e.g., "Events", "Social", "Business")

3. Click **Save Changes**

### Step 2: Add Privacy Policy and Terms of Service

Facebook requires these URLs for App Review. You can:

**Option A: Create Simple Pages on Your Site**
- Create `/privacy` and `/terms` pages on your Vercel app
- Add the URLs: 
  - Privacy Policy: `https://gbedoo.vercel.app/privacy`
  - Terms of Service: `https://gbedoo.vercel.app/terms`

**Option B: Use a Privacy Policy Generator**
- Use a service like [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- Host the generated policy on your site

**Option C: Use a Third-Party Service**
- Host policies on services like GitHub Pages or a dedicated hosting service

### Step 3: Navigate to App Review

1. Go to [App Review Dashboard](https://developers.facebook.com/apps/387945120557219/app-review/)
2. Click on **"Permissions and Features"** in the left sidebar
3. Find **`user_friends`** in the list
4. Click **"Request"** or **"Get Started"** button next to it

### Step 4: Fill Out the Review Form

Facebook will ask for:

1. **Use Case Description:**
   ```
   Gbedoo allows users to create and manage events. Users can invite 
   their Facebook friends to events through Facebook Messenger. The 
   user_friends permission is used to:
   - Display a list of the user's Facebook friends
   - Allow users to select friends to invite to their events
   - Send event invitations via Facebook Messenger
   
   We only access friends who have also authorized our app, respecting 
   Facebook's privacy policies.
   ```

2. **Instructions for Reviewers:**
   ```
   To test this feature:
   1. Log in to Gbedoo with a Facebook account
   2. Create an event or go to an existing event
   3. Navigate to "Send Invitations"
   4. Click "Import Facebook Friends"
   5. You will see a list of your Facebook friends
   6. Select friends to invite to your event
   
   The friends list is only used for event invitations and is not stored 
   or shared with third parties.
   ```

3. **Screenshots/Videos:**
   - Take screenshots of:
     - The "Send Invitations" page
     - The "Import Facebook Friends" button
     - The friends list display
     - The invitation sending flow
   - Or create a short video (1-2 minutes) demonstrating the feature

4. **Data Usage:**
   - Explain that you only use friend data to:
     - Display friends list to the user
     - Allow user to select friends for invitations
     - Send invitations via Facebook Messenger
   - State that you do NOT:
     - Store friend data permanently
     - Share friend data with third parties
     - Use friend data for advertising

### Step 5: Submit for Review

1. Review all information you've entered
2. Click **"Submit for Review"**
3. Facebook will send you an email confirmation

### Step 6: Review Process Timeline

- **Initial Review**: 7-14 business days
- Facebook may request additional information
- You'll receive email notifications about the status

### Step 7: While Waiting for Review

**Development Mode:**
- Your app is in **Development Mode**
- Only you and test users can use the `user_friends` permission
- To add test users:
  1. Go to **Roles** → **Test Users**
  2. Click **"Add Test Users"**
  3. Add yourself and any test accounts

**Testing:**
- You can still test the feature with:
  - Your own Facebook account (as app admin)
  - Test users you create
  - Other developers added to the app

## Quick Checklist Before Submitting

- [ ] Privacy Policy URL added to App Settings
- [ ] Terms of Service URL added to App Settings
- [ ] App Category selected
- [ ] Use case description written
- [ ] Instructions for reviewers written
- [ ] Screenshots/videos prepared
- [ ] Data usage explanation written
- [ ] All app details complete in Basic Settings

## After Approval

Once Facebook approves your app:

1. Your app can be switched to **Live Mode**
2. All users can use the `user_friends` permission
3. Go to **Settings** → **Basic** → Change **App Mode** to **Live**

## Important Notes

- **Don't request unnecessary permissions** - Only request what you actually use
- **Be clear about data usage** - Facebook reviews how you use the data
- **Respond quickly to requests** - If Facebook asks for more info, respond promptly
- **Keep your app functional** - Facebook testers will actually use your app

## Alternative: Use Without App Review (Limited)

If you want to test without waiting for review:

1. Keep app in **Development Mode**
2. Add test users in **Roles** → **Test Users**
3. Only test users can use the feature
4. This is fine for development/testing, but not for production

## References

- [Facebook App Review Documentation](https://developers.facebook.com/docs/app-review)
- [user_friends Permission Documentation](https://developers.facebook.com/docs/graph-api/reference/user/friends)
- [App Review Best Practices](https://developers.facebook.com/docs/app-review/best-practices)

