import { prisma } from "../lib/db/prisma";

type ProfessionalService = {
  id: string;
};

type ProfessionalAvailability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

async function run() {
  const professionals = await prisma.professionalProfile.findMany({
    include: {
      user: true,
      resources: true,
      services: true,
      availability: true,
    },
  });

  for (const professional of professionals) {
    if (professional.resources.length > 0) {
      console.log(`Resource already exists for ${professional.user.email}`);
      continue;
    }

    const resource = await prisma.resource.create({
      data: {
        professionalId: professional.id,
        name:
          professional.user.name ??
          professional.user.email.split("@")[0] ??
          "Profesional principal",
        type: "PERSON",
        description: "Recurso principal creado automáticamente.",
      },
    });

    if (professional.services.length > 0) {
      await prisma.resourceService.createMany({
        data: professional.services.map((service: ProfessionalService) => ({
          resourceId: resource.id,
          serviceId: service.id,
        })),
        skipDuplicates: true,
      });
    }

    if (professional.availability.length > 0) {
      await prisma.resourceAvailability.createMany({
        data: professional.availability.map(
          (availability: ProfessionalAvailability) => ({
            resourceId: resource.id,
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            isActive: availability.isActive,
          })
        ),
      });
    }

    console.log(`Created resource for ${professional.user.email}`);
  }

  console.log("Backfill completed");
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
