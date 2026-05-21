"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export async function markClientConversationAsUnreadAction(formData: FormData) {
  const user = await requireRole(["CLIENT"]);

  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) {
    redirect("/client/messages");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      client: {
        userId: user.id,
      },
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
    redirect("/client/messages");
  }

  await prisma.message.update({
    where: {
      id: conversation.messages[0].id,
    },
    data: {
      readAt: null,
    },
  });

  redirect("/client/messages");
}