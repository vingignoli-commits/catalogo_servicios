-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PERSON', 'ROOM', 'CHAIR', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingFlowMode" AS ENUM ('PROFESSIONAL_FIRST', 'SERVICE_FIRST', 'RESOURCE_FIRST', 'AUTO_ASSIGN');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "resourceId" TEXT;

-- AlterTable
ALTER TABLE "ProfessionalProfile" ADD COLUMN     "bookingFlowMode" "BookingFlowMode" NOT NULL DEFAULT 'PROFESSIONAL_FIRST';

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'PERSON',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceService" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAvailability" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resource_professionalId_idx" ON "Resource"("professionalId");

-- CreateIndex
CREATE INDEX "Resource_isActive_idx" ON "Resource"("isActive");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "ResourceService_resourceId_idx" ON "ResourceService"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceService_serviceId_idx" ON "ResourceService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceService_resourceId_serviceId_key" ON "ResourceService"("resourceId", "serviceId");

-- CreateIndex
CREATE INDEX "ResourceAvailability_resourceId_idx" ON "ResourceAvailability"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceAvailability_dayOfWeek_idx" ON "ResourceAvailability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Appointment_resourceId_idx" ON "Appointment"("resourceId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceService" ADD CONSTRAINT "ResourceService_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceService" ADD CONSTRAINT "ResourceService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAvailability" ADD CONSTRAINT "ResourceAvailability_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
