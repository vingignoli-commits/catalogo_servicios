"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

function canCancel(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);

  return hours >= 24;
}

export async function cancelAppointmentByClientAction(id: string) {
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: user.id },
  });

  if (!clientProfile) {
    redirect("/client/appointments");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      clientId: clientProfile.id,
    },
  });

  if (!appointment) {
    redirect("/client/appointments");
  }

  if (!["REQUESTED", "ACCEPTED"].includes(appointment.status)) {
    redirect("/client/appointments?error=No se puede cancelar.");
  }

  if (!canCancel(appointment.date)) {
    redirect(
      "/client/appointments?error=No podés cancelar con menos de 24h."
    );
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED_BY_CLIENT",
    },
  });

  redirect("/client/appointments");
}