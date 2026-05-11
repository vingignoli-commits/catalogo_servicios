"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  getAvailableResourceSlots,
  getAvailableSlots,
} from "@/lib/availability/slots";
import { createNotification } from "@/lib/notifications/notifications";

const confirmAppointmentSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid().optional().or(z.literal("")),
  date: z.string().min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

async function safeCreateNotification({
  userId,
  type,
  title,
  content,
  actionUrl,
  entityType,
  entityId,
}: {
  userId: string;
  type: string;
  title: string;
  content?: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await createNotification({
      userId,
      type,
      title,
      content,
      actionUrl,
      entityType,
      entityId,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
}

export async function confirmAppointmentAction(formData: FormData) {
  const user = await requireRole(["CLIENT"]);

  const parsed = confirmAppointmentSchema.safeParse({
    professionalId: String(formData.get("professionalId") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    resourceId: String(formData.get("resourceId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });

  if (!parsed.success) {
    redirect("/professionals?error=Datos de turno inválidos.");
  }

  const { professionalId, serviceId, resourceId, date, startTime, endTime } =
    parsed.data;

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    redirect("/client?error=No existe perfil de cliente.");
  }

  const selectedDate = new Date(`${date}T00:00:00`);

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId,
      isActive: true,
    },
  });

  if (!service) {
    redirect("/professionals?error=Servicio no disponible.");
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id: professionalId,
    },
  });

  if (!professional || !professional.isActive) {
    redirect("/professionals?error=Profesional no disponible.");
  }

  if (resourceId) {
    const resourceSlots = await getAvailableResourceSlots({
      professionalId,
      serviceId,
      date: selectedDate,
    });

    const selectedSlotIsAvailable = resourceSlots.some(
      (slot) =>
        slot.resourceId === resourceId &&
        slot.startTime === startTime &&
        slot.endTime === endTime
    );

    if (!selectedSlotIsAvailable) {
      redirect(
        `/professionals/${professionalId}/slots?serviceId=${serviceId}&date=${date}&error=El turno ya no está disponible.`
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: clientProfile.id,
        professionalId,
        resourceId,
        serviceId,
        date: selectedDate,
        startTime,
        endTime,
        status: "REQUESTED",
      },
    });

    await safeCreateNotification({
      userId: professional.userId,
      type: "APPOINTMENT_REQUESTED",
      title: "Nueva solicitud de turno",
      content: `Tenés una nueva solicitud para ${service.title}.`,
      actionUrl: "/professional/appointments",
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    });

    redirect(`/client/appointments/${appointment.id}`);
  }

  const availableSlots = await getAvailableSlots({
    professionalId,
    serviceId,
    date: selectedDate,
  });

  const selectedSlotIsAvailable = availableSlots.some(
    (slot) => slot.startTime === startTime && slot.endTime === endTime
  );

  if (!selectedSlotIsAvailable) {
    redirect(
      `/professionals/${professionalId}/slots?serviceId=${serviceId}&date=${date}&error=El turno ya no está disponible.`
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId: clientProfile.id,
      professionalId,
      serviceId,
      date: selectedDate,
      startTime,
      endTime,
      status: "REQUESTED",
    },
  });

  await safeCreateNotification({
    userId: professional.userId,
    type: "APPOINTMENT_REQUESTED",
    title: "Nueva solicitud de turno",
    content: `Tenés una nueva solicitud para ${service.title}.`,
    actionUrl: "/professional/appointments",
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  redirect(`/client/appointments/${appointment.id}`);
}