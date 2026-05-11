"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { createNotification } from "@/lib/notifications/notifications";

async function getProfile() {
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

export async function acceptAppointmentAction(id: string) {
  const profile = await getProfile();

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      professionalId: profile.id,
    },
    include: {
      client: true,
      service: true,
    },
  });

  if (!appointment || appointment.status !== "REQUESTED") {
    redirect("/professional/appointments");
  }

  await prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status: "ACCEPTED",
      statusReason: null,
    },
  });

  await createNotification({
    userId: appointment.client.userId,
    type: "APPOINTMENT_ACCEPTED",
    title: "Turno aceptado",
    content: `Tu turno para ${appointment.service.title} fue aceptado.`,
    actionUrl: `/client/appointments/${appointment.id}`,
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  redirect("/professional/appointments");
}

export async function rejectAppointmentAction(formData: FormData) {
  const profile = await getProfile();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const statusReason = String(formData.get("statusReason") ?? "").trim();

  if (!appointmentId) {
    redirect("/professional/appointments");
  }

  if (statusReason.length < 5) {
    redirect(
      "/professional/appointments?error=Para rechazar un turno tenés que indicar un motivo claro."
    );
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      professionalId: profile.id,
    },
    include: {
      client: true,
      service: true,
    },
  });

  if (!appointment || appointment.status !== "REQUESTED") {
    redirect("/professional/appointments");
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "REJECTED",
      statusReason,
    },
  });

  await createNotification({
    userId: appointment.client.userId,
    type: "APPOINTMENT_REJECTED",
    title: "Turno rechazado",
    content: `Tu turno para ${appointment.service.title} fue rechazado. Motivo: ${statusReason}`,
    actionUrl: `/client/appointments/${appointment.id}`,
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  redirect("/professional/appointments");
}

export async function completeAppointmentAction(id: string) {
  const profile = await getProfile();

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      professionalId: profile.id,
    },
    include: {
      client: true,
      service: true,
    },
  });

  if (!appointment || appointment.status !== "ACCEPTED") {
    redirect("/professional/appointments");
  }

  await prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status: "COMPLETED",
    },
  });

  await createNotification({
    userId: appointment.client.userId,
    type: "APPOINTMENT_COMPLETED",
    title: "Turno completado",
    content: `Tu turno para ${appointment.service.title} fue marcado como completado. Ya podés dejar una reseña.`,
    actionUrl: `/client/appointments/${appointment.id}`,
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  redirect("/professional/appointments");
}

export async function cancelAppointmentByProfessionalAction(id: string) {
  const profile = await getProfile();

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      professionalId: profile.id,
    },
    include: {
      client: true,
      service: true,
    },
  });

  if (!appointment) {
    redirect("/professional/appointments");
  }

  if (!["REQUESTED", "ACCEPTED"].includes(appointment.status)) {
    redirect("/professional/appointments");
  }

  await prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status: "CANCELLED_BY_PROFESSIONAL",
      statusReason: "Cancelado por el profesional.",
    },
  });

  await createNotification({
    userId: appointment.client.userId,
    type: "APPOINTMENT_CANCELLED_BY_PROFESSIONAL",
    title: "Turno cancelado",
    content: `El profesional canceló tu turno para ${appointment.service.title}.`,
    actionUrl: `/client/appointments/${appointment.id}`,
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  redirect("/professional/appointments");
}