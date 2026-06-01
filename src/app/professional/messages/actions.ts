"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export async function markProfessionalConversationAsUnreadAction(
  formData: FormData
) {
  const user = await requireRole(["PROFESSIONAL"]);

  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) {
    redirect("/professional/messages");
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect("/professional/profile");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      professionalId: profile.id,
    },
    include: {
      messages: {
        where: {
          senderId: {
            not: user.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!conversation || conversation.messages.length === 0) {
    redirect("/professional/messages");
  }

  await prisma.message.update({
    where: {
      id: conversation.messages[0].id,
    },
    data: {
      readAt: null,
    },
  });

  redirect("/professional/messages");
}