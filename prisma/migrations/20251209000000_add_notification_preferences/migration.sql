-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'FACEBOOK_MESSENGER', 'INSTAGRAM_DM', 'SMS', 'IN_APP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationChannels" "NotificationChannel"[] DEFAULT ARRAY['EMAIL']::"NotificationChannel"[],
ADD COLUMN     "whatsappChargesAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invitee" DROP COLUMN "preferredChannel",
ADD COLUMN     "notificationChannels" "NotificationChannel"[] DEFAULT ARRAY['EMAIL']::"NotificationChannel"[],
ADD COLUMN     "whatsappChargesAccepted" BOOLEAN NOT NULL DEFAULT false;

