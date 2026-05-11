"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

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

async function getOwnedResource(resourceId: string) {
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

  return { profile, resource };
}

export async function updateResourceServicesAction(
  resourceId: string,
  formData: FormData
) {
  const { profile, resource } = await getOwnedResource(resourceId);

  const selectedServiceIds = formData
    .getAll("serviceIds")
    .map((value) => String(value));

  const ownedServices = await prisma.service.findMany({
    where: {
      professionalId: profile.id,
      id: {
        in: selectedServiceIds,
      },
    },
    select: {
      id: true,
    },
  });

  const validServiceIds = ownedServices.map((service) => service.id);

  await prisma.resourceService.deleteMany({
    where: {
      resourceId: resource.id,
    },
  });

  if (validServiceIds.length > 0) {
    await prisma.resourceService.createMany({
      data: validServiceIds.map((serviceId) => ({
        resourceId: resource.id,
        serviceId,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/professional/resources");
  revalidatePath(`/professional/resources/${resource.id}/services`);

  redirect("/professional/resources");
}