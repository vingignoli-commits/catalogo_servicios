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

const updateAvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

const exceptionSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["UNAVAILABLE", "CUSTOM_HOURS"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().max(300).optional(),
});

type AvailabilityBlock = {
  id: string;
  startTime: string;
  endTime: string;
};

async function getCurrentProfessionalProfile() {
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect(
      "/professional/profile?error=Primero tenés que completar tu perfil profesional."
    );
  }

  return profile;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateTimeRange(startTime: string, endTime: string) {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
}

async function hasOverlap({
  professionalId,
  dayOfWeek,
  startTime,
  endTime,
  excludeAvailabilityId,
}: {
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeAvailabilityId?: string;
}) {
  const existingBlocks: AvailabilityBlock[] =
    await prisma.availability.findMany({
      where: {
        professionalId,
        dayOfWeek,
        isActive: true,
        id: excludeAvailabilityId
          ? {
              not: excludeAvailabilityId,
            }
          : undefined,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  return existingBlocks.some((block: AvailabilityBlock) => {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    return newStart < blockEnd && newEnd > blockStart;
  });
}

export async function createBulkAvailabilityAction(formData: FormData) {
  const profile = await getCurrentProfessionalProfile();

  const parsed = bulkAvailabilitySchema.safeParse({
    daysOfWeek: formData.getAll("daysOfWeek"),
    startTime: String(formData.get("bulkStartTime") ?? ""),
    endTime: String(formData.get("bulkEndTime") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      "/professional/availability?error=Seleccioná al menos un día y horarios válidos."
    );
  }

  const { daysOfWeek, startTime, endTime } = parsed.data;

  if (!validateTimeRange(startTime, endTime)) {
    redirect(
      "/professional/availability?error=La hora de fin debe ser posterior a la hora de inicio."
    );
  }

  for (const dayOfWeek of daysOfWeek) {
    const overlaps = await hasOverlap({
      professionalId: profile.id,
      dayOfWeek,
      startTime,
      endTime,
    });

    if (overlaps) {
      redirect(
        "/professional/availability?error=Uno o más días seleccionados se superponen con horarios activos existentes."
      );
    }
  }

  await prisma.availability.createMany({
    data: daysOfWeek.map((dayOfWeek) => ({
      professionalId: profile.id,
      dayOfWeek,
      startTime,
      endTime,
    })),
  });

  revalidatePath("/professional/availability");
  redirect("/professional/availability");
}

export async function updateAvailabilityAction(
  availabilityId: string,
  formData: FormData
) {
  const profile = await getCurrentProfessionalProfile();

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId: profile.id,
    },
  });

  if (!availability) {
    redirect("/professional/availability");
  }

  const parsed = updateAvailabilitySchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      `/professional/availability/${availabilityId}/edit?error=Datos inválidos.`
    );
  }

  const { dayOfWeek, startTime, endTime } = parsed.data;

  if (!validateTimeRange(startTime, endTime)) {
    redirect(
      `/professional/availability/${availabilityId}/edit?error=La hora de fin debe ser posterior a la hora de inicio.`
    );
  }

  const overlaps = await hasOverlap({
    professionalId: profile.id,
    dayOfWeek,
    startTime,
    endTime,
    excludeAvailabilityId: availability.id,
  });

  if (overlaps) {
    redirect(
      `/professional/availability/${availabilityId}/edit?error=Ese bloque se superpone con otro horario activo.`
    );
  }

  await prisma.availability.update({
    where: {
      id: availability.id,
    },
    data: {
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  revalidatePath("/professional/availability");
  redirect("/professional/availability");
}

export async function toggleAvailabilityStatusAction(availabilityId: string) {
  const profile = await getCurrentProfessionalProfile();

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId: profile.id,
    },
  });

  if (!availability) {
    redirect("/professional/availability");
  }

  await prisma.availability.update({
    where: {
      id: availability.id,
    },
    data: {
      isActive: !availability.isActive,
    },
  });

  revalidatePath("/professional/availability");
}

export async function deleteAvailabilityAction(availabilityId: string) {
  const profile = await getCurrentProfessionalProfile();

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId: profile.id,
    },
  });

  if (!availability) {
    redirect("/professional/availability");
  }

  await prisma.availability.delete({
    where: {
      id: availability.id,
    },
  });

  revalidatePath("/professional/availability");
}

export async function createAvailabilityExceptionAction(formData: FormData) {
  const profile = await getCurrentProfessionalProfile();

  const parsed = exceptionSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    type: String(formData.get("type") ?? "UNAVAILABLE"),
    startTime: String(formData.get("exceptionStartTime") ?? ""),
    endTime: String(formData.get("exceptionEndTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    redirect("/professional/availability?error=Datos de excepción inválidos.");
  }

  const { date, type, startTime, endTime, reason } = parsed.data;

  if (type === "CUSTOM_HOURS") {
    if (!startTime || !endTime) {
      redirect(
        "/professional/availability?error=Para horario especial debés indicar hora de inicio y fin."
      );
    }

    if (!validateTimeRange(startTime, endTime)) {
      redirect(
        "/professional/availability?error=La hora de fin debe ser posterior a la hora de inicio."
      );
    }
  }

  const exceptionDate = new Date(`${date}T00:00:00`);

  await prisma.availabilityException.upsert({
    where: {
      professionalId_date: {
        professionalId: profile.id,
        date: exceptionDate,
      },
    },
    create: {
      professionalId: profile.id,
      date: exceptionDate,
      type,
      startTime: type === "CUSTOM_HOURS" ? startTime : null,
      endTime: type === "CUSTOM_HOURS" ? endTime : null,
      reason: reason || null,
    },
    update: {
      type,
      startTime: type === "CUSTOM_HOURS" ? startTime : null,
      endTime: type === "CUSTOM_HOURS" ? endTime : null,
      reason: reason || null,
    },
  });

  revalidatePath("/professional/availability");
  redirect("/professional/availability");
}

export async function updateAvailabilityExceptionAction(
  exceptionId: string,
  formData: FormData
) {
  const profile = await getCurrentProfessionalProfile();

  const exception = await prisma.availabilityException.findFirst({
    where: {
      id: exceptionId,
      professionalId: profile.id,
    },
  });

  if (!exception) {
    redirect("/professional/availability");
  }

  const parsed = exceptionSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    type: String(formData.get("type") ?? "UNAVAILABLE"),
    startTime: String(formData.get("exceptionStartTime") ?? ""),
    endTime: String(formData.get("exceptionEndTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      `/professional/availability/exceptions/${exceptionId}/edit?error=Datos inválidos.`
    );
  }

  const { date, type, startTime, endTime, reason } = parsed.data;

  if (type === "CUSTOM_HOURS") {
    if (!startTime || !endTime) {
      redirect(
        `/professional/availability/exceptions/${exceptionId}/edit?error=Para horario especial debés indicar hora de inicio y fin.`
      );
    }

    if (!validateTimeRange(startTime, endTime)) {
      redirect(
        `/professional/availability/exceptions/${exceptionId}/edit?error=La hora de fin debe ser posterior a la hora de inicio.`
      );
    }
  }

  const exceptionDate = new Date(`${date}T00:00:00`);

  await prisma.availabilityException.update({
    where: {
      id: exception.id,
    },
    data: {
      date: exceptionDate,
      type,
      startTime: type === "CUSTOM_HOURS" ? startTime : null,
      endTime: type === "CUSTOM_HOURS" ? endTime : null,
      reason: reason || null,
    },
  });

  revalidatePath("/professional/availability");
  redirect("/professional/availability");
}

export async function deleteAvailabilityExceptionAction(exceptionId: string) {
  const profile = await getCurrentProfessionalProfile();

  const exception = await prisma.availabilityException.findFirst({
    where: {
      id: exceptionId,
      professionalId: profile.id,
    },
  });

  if (!exception) {
    redirect("/professional/availability");
  }

  await prisma.availabilityException.delete({
    where: {
      id: exception.id,
    },
  });

  revalidatePath("/professional/availability");
}
