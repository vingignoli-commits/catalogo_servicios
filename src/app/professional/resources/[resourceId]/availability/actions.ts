"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const bulkAvailabilitySchema = z.object({
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

async function getCurrentProfessionalProfile() {
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect("/professional/profile");
  }

  return profile;
}

async function getOwnedResource(resourceId: string) {
  const profile = await getCurrentProfessionalProfile();

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      professionalId: profile.id,
    },
  });

  if (!resource) {
    redirect("/professional/resources");
  }

  return resource;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateTimeRange(startTime: string, endTime: string) {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
}

async function hasOverlap({
  resourceId,
  dayOfWeek,
  startTime,
  endTime,
  excludeAvailabilityId,
}: {
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeAvailabilityId?: string;
}) {
  const existingBlocks = await prisma.resourceAvailability.findMany({
    where: {
      resourceId,
      dayOfWeek,
      isActive: true,
      id: excludeAvailabilityId
        ? {
            not: excludeAvailabilityId,
          }
        : undefined,
    },
  });

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  return existingBlocks.some((block) => {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    return newStart < blockEnd && newEnd > blockStart;
  });
}

export async function createResourceAvailabilityAction(
  resourceId: string,
  formData: FormData
) {
  const resource = await getOwnedResource(resourceId);

  const parsed = bulkAvailabilitySchema.safeParse({
    daysOfWeek: formData.getAll("daysOfWeek"),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      `/professional/resources/${resource.id}/availability?error=Seleccioná al menos un día y usá horarios válidos.`
    );
  }

  const { daysOfWeek, startTime, endTime } = parsed.data;

  if (!validateTimeRange(startTime, endTime)) {
    redirect(
      `/professional/resources/${resource.id}/availability?error=La hora de fin debe ser posterior a la hora de inicio.`
    );
  }

  for (const dayOfWeek of daysOfWeek) {
    const overlaps = await hasOverlap({
      resourceId: resource.id,
      dayOfWeek,
      startTime,
      endTime,
    });

    if (overlaps) {
      redirect(
        `/professional/resources/${resource.id}/availability?error=Uno o más días seleccionados se superponen con horarios activos existentes.`
      );
    }
  }

  await prisma.resourceAvailability.createMany({
    data: daysOfWeek.map((dayOfWeek) => ({
      resourceId: resource.id,
      dayOfWeek,
      startTime,
      endTime,
    })),
  });

  revalidatePath("/professional/resources");
  revalidatePath(`/professional/resources/${resource.id}/availability`);

  redirect(`/professional/resources/${resource.id}/availability`);
}

export async function toggleResourceAvailabilityStatusAction(
  resourceId: string,
  availabilityId: string
) {
  const resource = await getOwnedResource(resourceId);

  const availability = await prisma.resourceAvailability.findFirst({
    where: {
      id: availabilityId,
      resourceId: resource.id,
    },
  });

  if (!availability) {
    redirect(`/professional/resources/${resource.id}/availability`);
  }

  await prisma.resourceAvailability.update({
    where: {
      id: availability.id,
    },
    data: {
      isActive: !availability.isActive,
    },
  });

  revalidatePath("/professional/resources");
  revalidatePath(`/professional/resources/${resource.id}/availability`);
}

export async function deleteResourceAvailabilityAction(
  resourceId: string,
  availabilityId: string
) {
  const resource = await getOwnedResource(resourceId);

  const availability = await prisma.resourceAvailability.findFirst({
    where: {
      id: availabilityId,
      resourceId: resource.id,
    },
  });

  if (!availability) {
    redirect(`/professional/resources/${resource.id}/availability`);
  }

  await prisma.resourceAvailability.delete({
    where: {
      id: availability.id,
    },
  });

  revalidatePath("/professional/resources");
  revalidatePath(`/professional/resources/${resource.id}/availability`);

  redirect(`/professional/resources/${resource.id}/availability`);
}