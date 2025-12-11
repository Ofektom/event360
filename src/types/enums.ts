// Event Enums
export enum EventType {
  CELEBRATION = 'CELEBRATION',
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  CORPORATE = 'CORPORATE',
  CONFERENCE = 'CONFERENCE',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',          // Anyone on the application
  CONNECTED = 'CONNECTED',     // Anyone connected to the user on the app
  INVITED_ONLY = 'INVITED_ONLY', // Only invited guests on the app
}

// RSVP Enums
export enum RSVPStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  MAYBE = 'MAYBE',
}

// Invite Enums
export enum InviteChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  FACEBOOK_MESSENGER = 'FACEBOOK_MESSENGER',
  INSTAGRAM_DM = 'INSTAGRAM_DM',
  LINK = 'LINK',
  QR_CODE = 'QR_CODE',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

// Media Enums
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export enum MediaSource {
  UPLOAD = 'UPLOAD',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  EMAIL = 'EMAIL',
  LINK = 'LINK',
}

// Interaction Enums
export enum InteractionType {
  COMMENT = 'COMMENT',
  REACTION = 'REACTION',
  GUESTBOOK = 'GUESTBOOK',
  BLESSING = 'BLESSING',
  WISH = 'WISH',
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  CELEBRATE = 'CELEBRATE',
  CLAP = 'CLAP',
  THUMBS_UP = 'THUMBS_UP',
  HEART = 'HEART',
  FIRE = 'FIRE',
}

// User Enums
export enum UserRole {
  USER = 'USER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum FamilyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

// Notification Enums
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  FACEBOOK_MESSENGER = 'FACEBOOK_MESSENGER',
  INSTAGRAM_DM = 'INSTAGRAM_DM',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

