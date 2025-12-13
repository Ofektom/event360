# Vendor Invitation WhatsApp Template

## Template Name
`vendor_invitation`

## Template Status
APPROVED

## Template Category
MARKETING

## Template Language
`en_US` (English - United States)

## Template Type
Text Template (with optional media header)

## Template Content

### Header (Optional)
```
🎉 Vendor Invitation!
```

### Body
```
Hi {{1}}, you've been added as a vendor for {{2}}!

Click the link below to:
• Join our platform and manage your events
• Update your vendor profile
• Receive event reminders
• Get rated by clients

{{3}}
```

## Template Variables

1. `{{1}}` - Vendor Name (e.g., "John Doe" or "Elegant Events Co.")
2. `{{2}}` - Event Title (e.g., "John & Jane's Wedding")
3. `{{3}}` - Vendor Invitation Link (e.g., "https://gbedoo.com/vendor/invite/abc123...")

## Setup Instructions

### 1. Create Template in WhatsApp Business Manager

1. Go to WhatsApp Business Manager: https://business.facebook.com/
2. Navigate to **Message Templates**
3. Click **Create Template**
4. Select **Text** as template type
5. Fill in the template details:
   - **Name**: `vendor_invitation`
   - **Category**: `MARKETING`
   - **Language**: `English (US)` (`en_US`)
   - **Header**: `🎉 Vendor Invitation!` (optional, can add image)
   - **Body**: Copy the body text above with variables `{{1}}`, `{{2}}`, and `{{3}}`
6. Submit for approval

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Vendor Invitation Template
SENDZEN_VENDOR_TEMPLATE_NAME=vendor_invitation
SENDZEN_TEMPLATE_LANGUAGE=en_US
SENDZEN_USE_TEMPLATE=true
```

### 3. Template Variable Mapping

When sending the message, the variables are mapped as:
- `{{1}}` = Vendor Name (ownerName or businessName)
- `{{2}}` = Event Title
- `{{3}}` = Vendor Invitation Link (unique link to sign up)

## Message Flow

1. Event owner adds a vendor to their event (either existing or new vendor)
2. If vendor doesn't have an account (`userId` is null), system sends WhatsApp invitation
3. Vendor receives message with invitation link
4. Vendor clicks link and is prompted to sign up
5. After signup, vendor account is linked to their vendor profile
6. Vendor can now manage their profile and events

## Invitation Link Format

The invitation link format is:
```
https://your-domain.com/vendor/invite/{invitationToken}
```

Where `invitationToken` is a unique 64-character hex string generated for each vendor.

## Notes

- Vendors who already have accounts (signed up) will NOT receive invitation messages
- Only newly added vendors without accounts receive invitations
- The invitation link allows vendors to sign up and automatically link their account to their vendor profile
- If WhatsApp sending fails, the vendor is still added to the event (non-blocking)
- Template follows the same format as the guest invitation template (`event_invitation`) for consistency
