"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export async function markProfessionalNotificationAsReadAction(
  formData: FormData
) {
  const user = await requireRole(["PROFESSIONAL"]);

  const notificationId = String(formData.get("notificationId") ?? "");
  const actionUrl = String(formData.get("actionUrl") ?? "/professional");

  if (!notificationId) {
    redirect("/professional/notifications");
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  redirect(actionUrl || "/professional/notifications");
}

export async function markAllProfessionalNotificationsAsReadAction() {
  const user = await requireRole(["PROFESSIONAL"]);

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  redirect("/professional/notifications");
}