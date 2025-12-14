# EmailJS Configuration Troubleshooting Guide

## Current Error
"EmailJS Public Key is invalid"

## Step-by-Step Fix

### 1. Check Your EmailJS Account Settings

1. Go to https://dashboard.emailjs.com/admin/account
2. Navigate to **Security** tab
3. Check if **"Use Private Key (recommended)"** is enabled:
   - **If ENABLED**: You MUST set both `EMAILJS_PUBLIC_KEY` AND `EMAILJS_PRIVATE_KEY` in Vercel
   - **If DISABLED**: You only need `EMAILJS_PUBLIC_KEY` in Vercel

### 2. Get Your Keys from EmailJS

1. Go to https://dashboard.emailjs.com/admin/account
2. Under **"API Keys"** section, you'll see:
   - **Public Key**: Copy this exactly (usually 16-20 characters, alphanumeric)
   - **Private Key** (if "Use Private Key" is enabled): Copy this exactly (usually starts with letters/numbers)

### 3. Update Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (gbedoo)
3. Go to **Settings** > **Environment Variables**
4. Check/Update these variables:

#### If "Use Private Key" is DISABLED in EmailJS:
```
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=your_public_key_here (NO QUOTES, NO SPACES)
```

#### If "Use Private Key" is ENABLED in EmailJS:
```
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=your_public_key_here (NO QUOTES, NO SPACES)
EMAILJS_PRIVATE_KEY=your_private_key_here (NO QUOTES, NO SPACES)
```

### 4. Common Mistakes to Avoid

❌ **DON'T** wrap keys in quotes in Vercel:
```
EMAILJS_PUBLIC_KEY="your_key"  ← WRONG
```

✅ **DO** use the key directly:
```
EMAILJS_PUBLIC_KEY=your_key  ← CORRECT
```

❌ **DON'T** add extra spaces:
```
EMAILJS_PUBLIC_KEY= your_key   ← WRONG (spaces before/after)
```

✅ **DO** ensure no spaces:
```
EMAILJS_PUBLIC_KEY=your_key  ← CORRECT
```

❌ **DON'T** copy the wrong key:
- Make sure you're copying the **Public Key**, not the Private Key (unless using private key mode)
- Make sure the key matches your EmailJS account

### 5. Verify Configuration

After updating Vercel environment variables:

1. **Redeploy** your application (Vercel will automatically redeploy, or trigger a new deployment)
2. Visit the diagnostic endpoint: `https://gbedoo.vercel.app/api/debug/emailjs-config`
3. Check that:
   - All keys are showing as "SET"
   - Key lengths look reasonable (10-50 characters)
   - No extra characters are visible

### 6. Test Again

After redeploying, try sending an invitation again. If it still fails:

1. Check the Vercel function logs for detailed error messages
2. Verify the keys in EmailJS dashboard match what's in Vercel
3. Make sure "Allow EmailJS API for non-browser applications" is enabled in EmailJS Account > Security

## Quick Checklist

- [ ] EmailJS "Use Private Key" setting matches your Vercel configuration
- [ ] All required environment variables are set in Vercel
- [ ] Keys have NO quotes, NO spaces, NO newlines
- [ ] Keys match exactly what's in EmailJS dashboard
- [ ] Application has been redeployed after updating variables
- [ ] "Allow EmailJS API for non-browser applications" is enabled in EmailJS

## Still Having Issues?

If the error persists after following all steps:

1. Double-check the keys are copied correctly (character by character)
2. Try removing and re-adding the environment variables in Vercel
3. Check EmailJS account status (make sure it's active)
4. Verify the service ID and template ID are correct

