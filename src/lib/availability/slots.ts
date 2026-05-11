import { prisma } from "@/lib/db/prisma";

export type Slot = {
  startTime: string;
  endTime: string;
};

export type ResourceSlot = {
  startTime: string;
  endTime: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");

  const mins = (minutes % 60).toString().padStart(2, "0");

  return `${hours}:${mins}`;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && endA > startB;
}

function generateSlotsFromBlocks({
  blocks,
  durationMinutes,
  occupied,
  mode,
}: {
  blocks: {
    startTime: string;
    endTime: string;
  }[];
  durationMinutes: number;
  occupied: {
    start: number;
    end: number;
  }[];
  mode: "OPEN_HOURS" | "FIXED_SLOTS";
}) {
  const slots: Slot[] = [];

  for (const block of blocks) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    if (mode === "FIXED_SLOTS") {
      const slotStart = blockStart;
      const slotEnd = slotStart + durationMinutes;

      const isTaken = occupied.some((occupiedSlot) =>
        overlaps(slotStart, slotEnd, occupiedSlot.start, occupiedSlot.end)
      );

      if (!isTaken && slotEnd <= blockEnd) {
        slots.push({
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotEnd),
        });
      }

      continue;
    }

    let current = blockStart;

    while (current + durationMinutes <= blockEnd) {
      const slotStart = current;
      const slotEnd = current + durationMinutes;

      const isTaken = occupied.some((occupiedSlot) =>
        overlaps(slotStart, slotEnd, occupiedSlot.start, occupiedSlot.end)
      );

      if (!isTaken) {
        slots.push({
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotEnd),
        });
      }

      current += durationMinutes;
    }
  }

  return slots;
}

export async function getAvailableSlots({
  professionalId,
  serviceId,
  date,
}: {
  professionalId: string;
  serviceId: string;
  date: Date;
}): Promise<Slot[]> {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId,
      isActive: true,
    },
  });

  if (!service) {
    return [];
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id: professionalId,
    },
  });

  if (!professional || !professional.isActive) {
    return [];
  }

  const dayOfWeek = date.getDay();

  const exception = await prisma.availabilityException.findFirst({
    where: {
      professionalId,
      date,
    },
  });

  if (exception?.type === "UNAVAILABLE") {
    return [];
  }

  const availability = await prisma.availability.findMany({
    where: {
      professionalId,
      dayOfWeek,
      isActive: true,
    },
  });

  let blocks = availability.map((item) => ({
    startTime: item.startTime,
    endTime: item.endTime,
  }));

  if (exception?.type === "CUSTOM_HOURS") {
    blocks = [
      {
        startTime: exception.startTime!,
        endTime: exception.endTime!,
      },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      date,
      status: {
        in: ["REQUESTED", "ACCEPTED"],
      },
    },
  });

  const occupied = appointments.map((appointment) => ({
    start: timeToMinutes(appointment.startTime),
    end: timeToMinutes(appointment.endTime),
  }));

  return generateSlotsFromBlocks({
    blocks,
    durationMinutes: service.durationMinutes,
    occupied,
    mode: professional.availabilityMode,
  });
}

export async function getAvailableResourceSlots({
  professionalId,
  serviceId,
  date,
}: {
  professionalId: string;
  serviceId: string;
  date: Date;
}): Promise<ResourceSlot[]> {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId,
      isActive: true,
    },
  });

  if (!service) {
    return [];
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id: professionalId,
    },
  });

  if (!professional || !professional.isActive) {
    return [];
  }

  const dayOfWeek = date.getDay();

  const resources = await prisma.resource.findMany({
    where: {
      professionalId,
      isActive: true,
      services: {
        some: {
          serviceId,
        },
      },
    },
    include: {
      availability: {
        where: {
          dayOfWeek,
          isActive: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (resources.length === 0) {
    return [];
  }

  const slots: ResourceSlot[] = [];

  for (const resource of resources) {
    const appointments = await prisma.appointment.findMany({
      where: {
        resourceId: resource.id,
        date,
        status: {
          in: ["REQUESTED", "ACCEPTED"],
        },
      },
    });

    const occupied = appointments.map((appointment) => ({
      start: timeToMinutes(appointment.startTime),
      end: timeToMinutes(appointment.endTime),
    }));

    const blocks = resource.availability.map((availability) => ({
      startTime: availability.startTime,
      endTime: availability.endTime,
    }));

    const resourceSlots = generateSlotsFromBlocks({
      blocks,
      durationMinutes: service.durationMinutes,
      occupied,
      mode: "OPEN_HOURS",
    });

    for (const slot of resourceSlots) {
      slots.push({
        ...slot,
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
      });
    }
  }

  return slots.sort((a, b) => {
    if (a.startTime === b.startTime) {
      return a.resourceName.localeCompare(b.resourceName);
    }

    return a.startTime.localeCompare(b.startTime);
  });
}