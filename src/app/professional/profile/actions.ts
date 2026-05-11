"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

const profileSchema = z.object({
  avatarUrl: z.string().url("La URL de imagen no es válida.").optional().or(z.literal("")),
  bio: z.string().max(1000).optional(),
  specialty: z.string().max(120).optional(),
  experienceYears: z.coerce.number().min(0).max(80).optional(),
  location: z.string().max(240).optional(),
  availabilityMode: z.enum(["OPEN_HOURS", "FIXED_SLOTS"]),
});

export async function upsertProfessionalProfileAction(formData: FormData) {
  const user = await requireRole(["PROFESSIONAL"]);

  const parsed = profileSchema.safeParse({
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    specialty: String(formData.get("specialty") ?? ""),
    experienceYears: formData.get("experienceYears"),
    location: String(formData.get("location") ?? ""),
    availabilityMode: String(formData.get("availabilityMode") ?? "OPEN_HOURS"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/professional/profile?error=${encodeURIComponent(message)}`);
  }

  await prisma.professionalProfile.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      avatarUrl: parsed.data.avatarUrl || null,
      bio: parsed.data.bio,
      specialty: parsed.data.specialty,
      experienceYears: parsed.data.experienceYears,
      location: parsed.data.location,
      availabilityMode: parsed.data.availabilityMode,
    },
    update: {
      avatarUrl: parsed.data.avatarUrl || null,
      bio: parsed.data.bio,
      specialty: parsed.data.specialty,
      experienceYears: parsed.data.experienceYears,
      location: parsed.data.location,
      availabilityMode: parsed.data.availabilityMode,
    },
  });

  revalidatePath("/professional/profile");
  revalidatePath("/professional");
  revalidatePath("/professionals");

  redirect("/professional/profile?success=Perfil actualizado correctamente.");
}