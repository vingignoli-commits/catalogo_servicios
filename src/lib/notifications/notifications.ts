import { prisma } from "@/lib/db/prisma";

export async function createNotification({
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
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      actionUrl,
      entityType,
      entityId,
    },
  });
}

export async function markNotificationsAsRead({
  userId,
  entityType,
  entityId,
  type,
}: {
  userId: string;
  entityType?: string;
  entityId?: string;
  type?: string;
}) {
  return prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      entityType,
      entityId,
      type,
    },
    data: {
      readAt: new Date(),
    },
  });
}