"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const replySchema = z.object({
  reviewId: z.string().uuid(),
  professionalReply: z.string().trim().min(2).max(1000),
});

export async function replyReviewAction(formData: FormData) {
  const user = await requireRole(["PROFESSIONAL"]);

  const parsed = replySchema.safeParse({
    reviewId: String(formData.get("reviewId") ?? ""),
    professionalReply: String(
      formData.get("professionalReply") ?? ""
    ),
  });

  if (!parsed.success) {
    redirect(
      "/professional/reviews?error=Respuesta inválida."
    );
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!professional) {
    redirect("/professional/profile");
  }

  const review = await prisma.review.findFirst({
    where: {
      id: parsed.data.reviewId,
      professionalId: professional.id,
    },
  });

  if (!review) {
    redirect(
      "/professional/reviews?error=La reseña no existe."
    );
  }

  await prisma.review.update({
    where: {
      id: review.id,
    },
    data: {
      professionalReply: parsed.data.professionalReply,
    },
  });

  revalidatePath("/professional/reviews");
  revalidatePath(`/professionals/${professional.id}`);

  redirect("/professional/reviews");
}