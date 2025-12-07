-- AlterEnum: Add VENDOR to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VENDOR';

