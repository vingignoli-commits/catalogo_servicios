"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const resourceSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(120),
  type: z.enum(["PERSON", "ROOM", "CHAIR", "EQUIPMENT", "OTHER"]),
  description: z.string().max(500).optional(),
});

async function getCurrentProfessionalProfile() {
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect("/professional/profile");
  }

  return profile;
}

export async function createResourceAction(formData: FormData) {
  const profile = await getCurrentProfessionalProfile();

  const parsed = resourceSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "PERSON"),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/professional/resources?error=${encodeURIComponent(message)}`);
  }

  await prisma.resource.create({
    data: {
      professionalId: profile.id,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/professional/resources");
  revalidatePath("/professional");

  redirect("/professional/resources");
}

export async function toggleResourceStatusAction(resourceId: string) {
  const profile = await getCurrentProfessionalProfile();

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      professionalId: profile.id,
    },
  });

  if (!resource) {
    redirect("/professional/resources");
  }

  await prisma.resource.update({
    where: {
      id: resource.id,
    },
    data: {
      isActive: !resource.isActive,
    },
  });

  revalidatePath("/professional/resources");
  revalidatePath("/professional");
}

export async function deleteResourceAction(resourceId: string) {
  const profile = await getCurrentProfessionalProfile();

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      professionalId: profile.id,
    },
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  if (!resource) {
    redirect("/professional/resources");
  }

  if (resource._count.appointments > 0) {
    redirect(
      "/professional/resources?error=No podés eliminar un recurso con turnos asociados. Podés desactivarlo."
    );
  }

  await prisma.resource.delete({
    where: {
      id: resource.id,
    },
  });

  revalidatePath("/professional/resources");
  revalidatePath("/professional");

  redirect("/professional/resources");
}