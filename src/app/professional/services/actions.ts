"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const serviceSchema = z.object({
  title: z.string().min(2, "El título es obligatorio.").max(120),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive("El precio debe ser mayor a cero."),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, "La duración mínima es 15 minutos.")
    .max(480, "La duración máxima es 480 minutos."),
  modality: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]),
});

async function getCurrentProfessionalProfile() {
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect(
      "/professional/profile?error=Primero tenés que completar tu perfil profesional."
    );
  }

  return profile;
}

export async function createServiceAction(formData: FormData) {
  const profile = await getCurrentProfessionalProfile();

  const parsed = serviceSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    modality: String(formData.get("modality") ?? "IN_PERSON"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/professional/services/new?error=${encodeURIComponent(message)}`);
  }

  await prisma.service.create({
    data: {
      professionalId: profile.id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      durationMinutes: parsed.data.durationMinutes,
      modality: parsed.data.modality,
    },
  });

  revalidatePath("/professional/services");
  redirect("/professional/services");
}

export async function updateServiceAction(
  serviceId: string,
  formData: FormData
) {
  const profile = await getCurrentProfessionalProfile();

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId: profile.id,
    },
  });

  if (!service) {
    redirect("/professional/services");
  }

  const parsed = serviceSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
    modality: String(formData.get("modality") ?? "IN_PERSON"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(
      `/professional/services/${serviceId}/edit?error=${encodeURIComponent(
        message
      )}`
    );
  }

  await prisma.service.update({
    where: {
      id: service.id,
    },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      durationMinutes: parsed.data.durationMinutes,
      modality: parsed.data.modality,
    },
  });

  revalidatePath("/professional/services");
  revalidatePath(`/professional/services/${serviceId}/edit`);

  redirect("/professional/services");
}

export async function toggleServiceStatusAction(serviceId: string) {
  const profile = await getCurrentProfessionalProfile();

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId: profile.id,
    },
  });

  if (!service) {
    redirect("/professional/services");
  }

  await prisma.service.update({
    where: {
      id: service.id,
    },
    data: {
      isActive: !service.isActive,
    },
  });

  revalidatePath("/professional/services");
}

export async function deleteServiceAction(serviceId: string) {
  const profile = await getCurrentProfessionalProfile();

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
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

  if (!service) {
    redirect("/professional/services");
  }

  if (service._count.appointments > 0) {
    redirect(
      "/professional/services?error=No podés eliminar un servicio que ya tiene turnos asociados. Podés desactivarlo."
    );
  }

  await prisma.service.delete({
    where: {
      id: service.id,
    },
  });

  revalidatePath("/professional/services");
  redirect("/professional/services");
}