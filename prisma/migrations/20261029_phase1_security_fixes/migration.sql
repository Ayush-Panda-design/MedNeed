-- AlterEnum: Add CUSTOMER to AdminRole
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'CUSTOMER';

-- AlterTable: Add isActive and pharmacistRegNo to AdminUser
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "pharmacistRegNo" TEXT;

-- Sync existing pharmacistLicenseNumber to pharmacistRegNo if set
UPDATE "AdminUser" SET "pharmacistRegNo" = "pharmacistLicenseNumber" WHERE "pharmacistRegNo" IS NULL AND "pharmacistLicenseNumber" IS NOT NULL;
