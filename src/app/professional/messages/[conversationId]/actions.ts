"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export async function sendProfessionalMessageAction(formData: FormData) {
  const user = await requireRole(["PROFESSIONAL"]);

  const parsed = messageSchema.safeParse({
    conversationId: String(formData.get("conversationId") ?? ""),
    content: String(formData.get("content") ?? ""),
  });

  if (!parsed.success) {
    redirect("/professional/messages");
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect("/professional/messages");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: parsed.data.conversationId,
      professionalId: profile.id,
    },
  });

  if (!conversation) {
    redirect("/professional/messages");
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/professional/messages/${conversation.id}`);
  revalidatePath("/professional/messages");
}