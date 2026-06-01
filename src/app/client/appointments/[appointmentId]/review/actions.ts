"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});

export async function createReviewAction(formData: FormData) {
  const user = await requireRole(["CLIENT"]);

  const parsed = reviewSchema.safeParse({
    appointmentId: String(formData.get("appointmentId") ?? ""),
    rating: Number(formData.get("rating")),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!parsed.success) {
    redirect("/client/appointments");
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    redirect("/client/appointments");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      clientId: clientProfile.id,
    },
    include: {
      reviews: {
        where: {
          clientId: clientProfile.id,
        },
      },
    },
  });

  if (!appointment) {
    redirect("/client/appointments");
  }

  if (appointment.status !== "COMPLETED") {
    redirect("/client/appointments");
  }

  if (appointment.reviews.length > 0) {
    redirect(`/client/appointments/${appointment.id}`);
  }

  await prisma.review.create({
    data: {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  const reviews = await prisma.review.findMany({
    where: {
      professionalId: appointment.professionalId,
    },
    select: {
      rating: true,
    },
  });

  const average =
    reviews.reduce(
      (
        acc: number,
        review: {
          rating: number;
        }
      ) => acc + review.rating,
      0
    ) / reviews.length;

  await prisma.professionalProfile.update({
    where: {
      id: appointment.professionalId,
    },
    data: {
      averageRating: Number(average.toFixed(2)),
      reviewCount: reviews.length,
    },
  });

  revalidatePath("/client/appointments");
  revalidatePath(`/client/appointments/${appointment.id}`);
  revalidatePath(`/professionals/${appointment.professionalId}`);

  redirect(`/client/appointments/${appointment.id}`);
}
