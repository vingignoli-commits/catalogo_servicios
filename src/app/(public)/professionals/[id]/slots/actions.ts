"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export async function bookSlotAction(formData: FormData) {
  const user = await requireRole(["CLIENT"]);

  const professionalId = String(formData.get("professionalId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!professionalId || !serviceId || !date || !startTime) {
    redirect(`/professionals/${professionalId}/slots?serviceId=${serviceId}&error=Completá+todos+los+campos`);
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) redirect(`/professionals/${professionalId}`);

  const [hours, minutes] = startTime.split(":").map(Number);
  const endMinutes = hours * 60 + minutes + service.durationMinutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });
  if (!clientProfile) redirect("/login");

  await prisma.appointment.create({
    data: {
      clientId: clientProfile.id,
      professionalId,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      notes: notes || null,
      status: "REQUESTED",
    },
  });

  redirect("/client/appointments?success=Turno+solicitado");
}
