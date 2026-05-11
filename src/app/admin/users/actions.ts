"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";

export async function toggleUserStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/users");
}