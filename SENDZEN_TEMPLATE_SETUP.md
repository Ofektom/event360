# SendZen Template Message Setup

## Overview

The WhatsApp invitation service now supports template messages for sending invitations to new contacts. Template messages are required by WhatsApp Business API for first-time contacts.

## Environment Variables

Add these environment variables to your `.env` file (local) and Vercel (production):

### Required Variables

```env
# SendZen WhatsApp API
SENDZEN_API_KEY=your_api_key_here
SENDZEN_PHONE_NUMBER=+1234567890  # Your WhatsApp Business number in E.164 format
SENDZEN_API_URL=https://api.sendzen.io
```

### Template Configuration (Optional)

```env
# Template settings (optional - defaults provided)
SENDZEN_TEMPLATE_NAME=event_invitation
SENDZEN_TEMPLATE_LANGUAGE=en_US
SENDZEN_USE_TEMPLATE=true  # Set to 'false' to disable template messages
```

## Template Variables

Your template `event_invitation` uses these variables:

- `{{1}}` = Event Title (e.g., "John & Sarah's Wedding")
- `{{2}}` = Invitee Name (e.g., "Sarah")
- `{{3}}` = Share Link (e.g., "https://event360-three.vercel.app/invite/abc123")

## How It Works

1. **Template Message (Default)**: When `SENDZEN_USE_TEMPLATE=true` (default), the system will:
   - Use your approved template `event_invitation`
   - Include the invitation design image as the header
   - Replace variables with actual event data
   - Works for new contacts (no prior interaction needed)

2. **Fallback to Regular Message**: If template message fails (e.g., template not approved yet), the system will:
   - Automatically retry with a regular message
   - Only works if recipient messaged you within 24 hours
   - Includes the invitation image and text

3. **Regular Message Only**: If `SENDZEN_USE_TEMPLATE=false`, the system will:
   - Send regular messages only
   - Requires recipient to have messaged you first (24-hour window)

## Template Status

Check your template status in SendZen Dashboard:
- **PENDING**: Template is waiting for WhatsApp approval (24-48 hours)
- **APPROVED**: Template is ready to use ✅
- **REJECTED**: Template needs to be fixed and resubmitted

## Testing

### Before Template Approval

While your template is pending:
- The system will try template message first
- If it fails, it will automatically fall back to regular message
- Regular messages only work if recipient messaged you within 24 hours

### After Template Approval

Once approved:
- Template messages will work for all contacts
- No need for prior interaction
- Invitation images will be included automatically

## Troubleshooting

### Error: "Template not found"
- Verify `SENDZEN_TEMPLATE_NAME` matches your template name exactly
- Check template status in SendZen dashboard
- Ensure template is approved

### Error: "Template not approved"
- Wait for WhatsApp approval (24-48 hours)
- System will automatically fall back to regular messages
- Check template status in SendZen dashboard

### Error: "Message cannot be delivered"
- Template may not be approved yet (system will try fallback)
- Recipient may need to message you first (for regular messages)
- Check SendZen dashboard for detailed error messages

## Next Steps

1. ✅ Template created in SendZen
2. ⏳ Wait for template approval (24-48 hours)
3. ✅ Code updated to use templates
4. 🧪 Test once template is approved

Once your template is approved, you can start sending invitations to new contacts without prior interaction!

