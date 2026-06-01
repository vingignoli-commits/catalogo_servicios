"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const calendarBlockSchema = z.object({
  resourceId: z.string().optional(),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endDate: z.string().min(1),
  endTime: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function createCalendarBlockAction(formData: FormData) {
  const user = await requireRole(["PROFESSIONAL"]);

  const parsed = calendarBlockSchema.safeParse({
    resourceId: String(formData.get("resourceId") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      "/professional/calendar/blocks?error=Datos inválidos."
    );
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!professional) {
    redirect("/professional/profile");
  }

  const startDateTime = combineDateTime(
    parsed.data.startDate,
    parsed.data.startTime
  );

  const endDateTime = combineDateTime(
    parsed.data.endDate,
    parsed.data.endTime
  );

  if (endDateTime <= startDateTime) {
    redirect(
      "/professional/calendar/blocks?error=La fecha final debe ser posterior."
    );
  }

  let resourceId: string | null = null;

  if (parsed.data.resourceId) {
    const resource = await prisma.resource.findFirst({
      where: {
        id: parsed.data.resourceId,
        professionalId: professional.id,
      },
    });

    if (!resource) {
      redirect(
        "/professional/calendar/blocks?error=El recurso no existe."
      );
    }

    resourceId = resource.id;
  }

  await prisma.calendarBlock.create({
    data: {
      professionalId: professional.id,
      resourceId,
      startDateTime,
      endDateTime,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath("/professional/calendar");
  revalidatePath("/professional/calendar/day");
  revalidatePath("/professional/calendar/blocks");

  redirect(
    "/professional/calendar/blocks?success=Bloqueo creado correctamente."
  );
}

export async function deleteCalendarBlockAction(formData: FormData) {
  const user = await requireRole(["PROFESSIONAL"]);

  const blockId = String(formData.get("blockId") ?? "");

  if (!blockId) {
    redirect("/professional/calendar/blocks");
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!professional) {
    redirect("/professional/profile");
  }

  const block = await prisma.calendarBlock.findFirst({
    where: {
      id: blockId,
      professionalId: professional.id,
    },
  });

  if (!block) {
    redirect("/professional/calendar/blocks");
  }

  await prisma.calendarBlock.delete({
    where: {
      id: block.id,
    },
  });

  revalidatePath("/professional/calendar");
  revalidatePath("/professional/calendar/day");
  revalidatePath("/professional/calendar/blocks");

  redirect(
    "/professional/calendar/blocks?success=Bloqueo eliminado."
  );
}