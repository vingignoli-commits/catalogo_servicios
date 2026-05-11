"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { getOrCreateConversationByAppointment } from "@/lib/messages/get-or-create-conversation";

export async function openConversationFromClientAppointmentAction(
  appointmentId: string
) {
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    redirect("/client/appointments");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clientId: clientProfile.id,
    },
  });

  if (!appointment) {
    redirect("/client/appointments");
  }

  const conversation = await getOrCreateConversationByAppointment({
    appointmentId: appointment.id,
  });

  if (!conversation) {
    redirect("/client/appointments");
  }

  redirect(`/client/messages/${conversation.id}`);
}