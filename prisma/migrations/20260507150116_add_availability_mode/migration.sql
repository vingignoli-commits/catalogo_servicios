-- CreateEnum
CREATE TYPE "AvailabilityMode" AS ENUM ('OPEN_HOURS', 'FIXED_SLOTS');

-- AlterTable
ALTER TABLE "ProfessionalProfile" ADD COLUMN     "availabilityMode" "AvailabilityMode" NOT NULL DEFAULT 'OPEN_HOURS';
