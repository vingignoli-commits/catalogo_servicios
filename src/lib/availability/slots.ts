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

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getBlockIntervalsForDate({
  blocks,
  date,
}: {
  blocks: {
    startDateTime: Date;
    endDateTime: Date;
  }[];
  date: Date;
}) {
  const { start: dayStart, end: dayEnd } = getDayRange(date);

  return blocks
    .filter((block) => {
      return block.startDateTime < dayEnd && block.endDateTime > dayStart;
    })
    .map((block) => {
      const effectiveStart =
        block.startDateTime < dayStart ? dayStart : block.startDateTime;

      const effectiveEnd =
        block.endDateTime > dayEnd ? dayEnd : block.endDateTime;

      return {
        start: effectiveStart.getHours() * 60 + effectiveStart.getMinutes(),
        end: effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes(),
      };
    });
}

function generateSlotsFromBlocks({
  blocks,
  durationMinutes,
  occupied,
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
}) {
  const slots: Slot[] = [];

  for (const block of blocks) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

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
    orderBy: {
      startTime: "asc",
    },
  });

  let availabilityBlocks = availability.map((item) => ({
    startTime: item.startTime,
    endTime: item.endTime,
  }));

  if (exception?.type === "CUSTOM_HOURS") {
    if (!exception.startTime || !exception.endTime) {
      return [];
    }

    availabilityBlocks = [
      {
        startTime: exception.startTime,
        endTime: exception.endTime,
      },
    ];
  }

  if (availabilityBlocks.length === 0) {
    return [];
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

  const calendarBlocks = await prisma.calendarBlock.findMany({
    where: {
      professionalId,
      resourceId: null,
    },
  });

  const occupiedByAppointments = appointments.map((appointment) => ({
    start: timeToMinutes(appointment.startTime),
    end: timeToMinutes(appointment.endTime),
  }));

  const occupiedByBlocks = getBlockIntervalsForDate({
    blocks: calendarBlocks,
    date,
  });

  const occupied = [...occupiedByAppointments, ...occupiedByBlocks];

  return generateSlotsFromBlocks({
    blocks: availabilityBlocks,
    durationMinutes: service.durationMinutes,
    occupied,
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

  const globalCalendarBlocks = await prisma.calendarBlock.findMany({
    where: {
      professionalId,
      resourceId: null,
    },
  });

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

    const resourceCalendarBlocks = await prisma.calendarBlock.findMany({
      where: {
        professionalId,
        resourceId: resource.id,
      },
    });

    const occupiedByAppointments = appointments.map((appointment) => ({
      start: timeToMinutes(appointment.startTime),
      end: timeToMinutes(appointment.endTime),
    }));

    const occupiedByGlobalBlocks = getBlockIntervalsForDate({
      blocks: globalCalendarBlocks,
      date,
    });

    const occupiedByResourceBlocks = getBlockIntervalsForDate({
      blocks: resourceCalendarBlocks,
      date,
    });

    const occupied = [
      ...occupiedByAppointments,
      ...occupiedByGlobalBlocks,
      ...occupiedByResourceBlocks,
    ];

    const availabilityBlocks = resource.availability.map((availability) => ({
      startTime: availability.startTime,
      endTime: availability.endTime,
    }));

    if (availabilityBlocks.length === 0) {
      continue;
    }

    const resourceSlots = generateSlotsFromBlocks({
      blocks: availabilityBlocks,
      durationMinutes: service.durationMinutes,
      occupied,
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