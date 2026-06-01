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

function getRedirectPath(formData?: FormData, fallback = "/professional/appointments") {
  const redirectTo = String(formData?.get("redirectTo") ?? "").trim();

  if (!redirectTo) {
    return fallback;
  }

  if (!redirectTo.startsWith("/")) {
    return fallback;
  }

  return redirectTo;
}

function appendSuccess(url: string, message: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}success=${encodeURIComponent(message)}`;
}

export async function acceptAppointmentAction(
  idOrFormData: string | FormData
) {
  const profile = await getProfile();

  const appointmentId =
    typeof idOrFormData === "string"
      ? idOrFormData
      : String(idOrFormData.get("appointmentId") ?? "");

  const redirectTo =
    typeof idOrFormData === "string"
      ? "/professional/appointments"
      : getRedirectPath(idOrFormData);

  if (!appointmentId) {
    redirect(redirectTo);
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
    redirect(redirectTo);
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "ACCEPTED",
      statusReason: null,
    },
  });

  try {
    await createNotification({
      userId: appointment.client.userId,
      type: "APPOINTMENT_ACCEPTED",
      title: "Turno aceptado",
      content: `Tu turno para ${appointment.service.title} fue aceptado.`,
      actionUrl: `/client/appointments/${appointment.id}`,
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }

  redirect(appendSuccess(redirectTo, "Turno aceptado correctamente."));
}

export async function rejectAppointmentAction(formData: FormData) {
  const profile = await getProfile();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const statusReason = String(formData.get("statusReason") ?? "").trim();
  const redirectTo = getRedirectPath(formData);

  if (!appointmentId) {
    redirect(redirectTo);
  }

  if (statusReason.length < 5) {
    redirect(
      `${redirectTo}${
        redirectTo.includes("?") ? "&" : "?"
      }error=${encodeURIComponent(
        "Para rechazar un turno tenés que indicar un motivo claro."
      )}`
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
    redirect(redirectTo);
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

  try {
    await createNotification({
      userId: appointment.client.userId,
      type: "APPOINTMENT_REJECTED",
      title: "Turno rechazado",
      content: `Tu turno para ${appointment.service.title} fue rechazado. Motivo: ${statusReason}`,
      actionUrl: `/client/appointments/${appointment.id}`,
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }

  redirect(appendSuccess(redirectTo, "Turno rechazado correctamente."));
}

export async function completeAppointmentAction(
  idOrFormData: string | FormData
) {
  const profile = await getProfile();

  const appointmentId =
    typeof idOrFormData === "string"
      ? idOrFormData
      : String(idOrFormData.get("appointmentId") ?? "");

  const redirectTo =
    typeof idOrFormData === "string"
      ? "/professional/appointments"
      : getRedirectPath(idOrFormData);

  if (!appointmentId) {
    redirect(redirectTo);
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

  if (!appointment || appointment.status !== "ACCEPTED") {
    redirect(redirectTo);
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "COMPLETED",
    },
  });

  try {
    await createNotification({
      userId: appointment.client.userId,
      type: "APPOINTMENT_COMPLETED",
      title: "Turno completado",
      content: `Tu turno para ${appointment.service.title} fue marcado como completado. Ya podés dejar una reseña.`,
      actionUrl: `/client/appointments/${appointment.id}`,
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }

  redirect(appendSuccess(redirectTo, "Turno marcado como completado."));
}

export async function cancelAppointmentByProfessionalAction(
  idOrFormData: string | FormData
) {
  const profile = await getProfile();

  const appointmentId =
    typeof idOrFormData === "string"
      ? idOrFormData
      : String(idOrFormData.get("appointmentId") ?? "");

  const redirectTo =
    typeof idOrFormData === "string"
      ? "/professional/appointments"
      : getRedirectPath(idOrFormData);

  if (!appointmentId) {
    redirect(redirectTo);
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

  if (!appointment) {
    redirect(redirectTo);
  }

  if (!["REQUESTED", "ACCEPTED"].includes(appointment.status)) {
    redirect(redirectTo);
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED_BY_PROFESSIONAL",
      statusReason: "Cancelado por el profesional.",
    },
  });

  try {
    await createNotification({
      userId: appointment.client.userId,
      type: "APPOINTMENT_CANCELLED_BY_PROFESSIONAL",
      title: "Turno cancelado",
      content: `El profesional canceló tu turno para ${appointment.service.title}.`,
      actionUrl: `/client/appointments/${appointment.id}`,
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }

  redirect(appendSuccess(redirectTo, "Turno cancelado correctamente."));
}