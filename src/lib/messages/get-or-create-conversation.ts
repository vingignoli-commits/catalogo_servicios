import { prisma } from "@/lib/db/prisma";

export async function getOrCreateConversationByAppointment({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      conversation: true,
    },
  });

  if (!appointment) {
    return null;
  }

  if (appointment.conversation) {
    return appointment.conversation;
  }

  return prisma.conversation.create({
    data: {
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      appointmentId: appointment.id,
    },
  });
}