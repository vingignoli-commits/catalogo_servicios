"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export async function markClientNotificationAsReadAction(formData: FormData) {
  const user = await requireRole(["CLIENT"]);

  const notificationId = String(formData.get("notificationId") ?? "");
  const actionUrl = String(formData.get("actionUrl") ?? "/client");

  if (!notificationId) {
    redirect("/client/notifications");
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

  redirect(actionUrl || "/client/notifications");
}

export async function markAllClientNotificationsAsReadAction() {
  const user = await requireRole(["CLIENT"]);

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  redirect("/client/notifications");
}