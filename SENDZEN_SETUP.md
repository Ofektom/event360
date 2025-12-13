# SendZen WhatsApp Integration Setup

## Overview

SendZen provides WhatsApp Business API integration with:
- ✅ **600 free messages per month** (perfect for development)
- ✅ Official Meta WhatsApp Business API
- ✅ REST API integration
- ✅ No credit card required to start
- ✅ Full API access from day one

## Step 1: Sign Up for SendZen

1. Go to [SendZen Website](https://www.sendzen.io/)
2. Click **"Get Started"** or **"Sign Up"**
3. Create a free account (no credit card required)
4. Verify your email address

## Step 2: Get API Credentials

1. Log in to your SendZen dashboard
2. Navigate to **Settings** → **API Keys** (or **Developers** → **API**)
3. Copy your **API Key**
4. Note your **Phone Number ID** (this is your WhatsApp Business number)

## Step 3: Set Up WhatsApp Business Account

1. Follow SendZen's [WhatsApp Setup Guide](https://www.sendzen.io/docs/docs/whatsapp-setup-355788m0)
2. Create and verify your Meta Business Account
3. Register your phone number for WhatsApp Business API
4. Complete the verification process

## Step 4: Configure Environment Variables

Add these environment variables to your `.env` file (for local development) and Vercel (for production):

### Local Development (.env)

```env
# SendZen WhatsApp API
SENDZEN_API_KEY=your_api_key_here
SENDZEN_API_URL=https://api.sendzen.io
SENDZEN_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `gbedoo`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   - **Key**: `SENDZEN_API_KEY`
   - **Value**: (paste your API key from SendZen dashboard)
   - **Environment**: Production, Preview, Development

   - **Key**: `SENDZEN_API_URL`
   - **Value**: `https://api.sendzen.io`
   - **Environment**: Production, Preview, Development

   - **Key**: `SENDZEN_PHONE_NUMBER_ID`
   - **Value**: (paste your phone number ID from SendZen dashboard)
   - **Environment**: Production, Preview, Development

5. Click **Save**
6. **Redeploy** your application

## Step 5: Test the Integration

1. Make sure your environment variables are set
2. Redeploy your application (if using Vercel)
3. Go to your app's "Send Invitations" page
4. Select a WhatsApp number to test with
5. Send a test invitation
6. Check the recipient's WhatsApp for the message

## Phone Number Format

WhatsApp requires phone numbers in **E.164 format**:
- ✅ Correct: `+1234567890` (with country code)
- ❌ Wrong: `1234567890` (without country code)
- ❌ Wrong: `(123) 456-7890` (formatted)

The service automatically formats numbers, but ensure users enter numbers with country codes.

## API Endpoints

The implementation uses SendZen's REST API:

- **Base URL**: `https://api.sendzen.io`
- **Send Message**: `POST /v1/messages`
- **Authentication**: Bearer token (API key in Authorization header)

## Message Types Supported

1. **Text Messages**: Simple text invitations
2. **Image Messages**: Invitations with images (invitation design preview)

## Free Tier Limits

- **600 messages per month** (free tier)
- Perfect for development and testing
- Upgrade to paid plan when you need more

## Troubleshooting

### Error: "Invalid API key"

- Verify `SENDZEN_API_KEY` is set correctly in environment variables
- Make sure there are no extra spaces or quotes
- Check that you've copied the full API key from SendZen dashboard

### Error: "Phone number not configured"

- Verify `SENDZEN_PHONE_NUMBER_ID` is set correctly
- Make sure your phone number is verified in SendZen dashboard

### Error: "Invalid phone number format"

- Ensure phone numbers include country code (e.g., `+1234567890`)
- Remove any formatting characters (spaces, dashes, parentheses)

### Messages not being received

1. Check SendZen dashboard for message status
2. Verify the recipient's phone number is correct
3. Ensure the recipient has WhatsApp installed
4. Check that your WhatsApp Business account is fully verified

## Development Mode

If `SENDZEN_API_KEY` is not set and `NODE_ENV=development`, the service will:
- Log the message to console
- Return success (for testing without API calls)
- Not actually send messages

This allows you to develop and test the flow without using your free message quota.

## Production Checklist

Before going to production:

- [ ] SendZen account created and verified
- [ ] WhatsApp Business Account set up and verified
- [ ] API key obtained from SendZen dashboard
- [ ] Phone Number ID obtained
- [ ] Environment variables set in Vercel
- [ ] Application redeployed
- [ ] Test message sent successfully
- [ ] Error handling tested

## Documentation Links

- [SendZen Documentation](https://www.sendzen.io/docs)
- [WhatsApp Setup Guide](https://www.sendzen.io/docs/docs/whatsapp-setup-355788m0)
- [API Reference](https://www.sendzen.io/docs/api-reference)
- [Getting Started Guide](https://www.sendzen.io/docs)
- [Pricing](https://www.sendzen.io/)

## Support

If you encounter issues:
1. Check SendZen's documentation
2. Review error messages in your application logs
3. Check SendZen dashboard for message status
4. Contact SendZen support if needed

