import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  X,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  acceptAppointmentAction,
  cancelAppointmentByProfessionalAction,
  completeAppointmentAction,
  rejectAppointmentAction,
} from "@/app/professional/appointments/actions";

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const visibleHours = Array.from({ length: 15 }).map(
  (_: unknown, index: number) => index + 7
);

const START_HOUR = 7;
const PIXELS_PER_MINUTE = 1.2;
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

const statusOptions = [
  { value: "ALL", label: "Todos" },
  { value: "REQUESTED", label: "Solicitados" },
  { value: "ACCEPTED", label: "Aceptados" },
  { value: "COMPLETED", label: "Completados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "CANCELLED_BY_CLIENT", label: "Cancelados por cliente" },
  { value: "CANCELLED_BY_PROFESSIONAL", label: "Cancelados por profesional" },
];

type CalendarPageProps = {
  searchParams: Promise<{
    week?: string;
    selected?: string;
    blockId?: string;
    slotKey?: string;
    resourceId?: string;
    status?: string;
    success?: string;
    error?: string;
  }>;
};

type ResourceOption = {
  id: string;
  name: string;
};

type AppointmentData = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  service: {
    title: string;
    durationMinutes: number;
  };
  resource: {
    name: string;
  } | null;
  client: {
    user: {
      name: string | null;
      email: string;
    };
  };
};

type CalendarBlockData = {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  reason: string | null;
  resource: {
    name: string;
  } | null;
};

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateYYYYMMDD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateDDMM(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatDateDDMMYYYY(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function sameDate(a: Date, b: Date) {
  return formatDateYYYYMMDD(a) === formatDateYYYYMMDD(b);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getTopFromMinutes(minutes: number) {
  return Math.max(0, (minutes - START_HOUR * 60) * PIXELS_PER_MINUTE);
}

function getHeightFromMinutes(startMinutes: number, endMinutes: number) {
  const duration = Math.max(15, endMinutes - startMinutes);
  return Math.max(34, duration * PIXELS_PER_MINUTE - 4);
}

function getTop(startTime: string) {
  return getTopFromMinutes(timeToMinutes(startTime));
}

function getHeight(startTime: string, endTime: string) {
  return getHeightFromMinutes(timeToMinutes(startTime), timeToMinutes(endTime));
}

function getResourceLabel(resourceName?: string | null) {
  return resourceName || "General";
}

function getCardClass(status: string) {
  const classes: Record<string, string> = {
    REQUESTED: "border-amber-300 bg-amber-50 text-amber-950",
    ACCEPTED: "border-blue-300 bg-blue-50 text-blue-950",
    REJECTED: "border-red-300 bg-red-50 text-red-950",
    CANCELLED_BY_CLIENT: "border-slate-300 bg-slate-100 text-slate-700",
    CANCELLED_BY_PROFESSIONAL: "border-slate-300 bg-slate-100 text-slate-700",
    COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-950",
    NO_SHOW: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950",
    EXPIRED: "border-slate-300 bg-slate-100 text-slate-700",
  };

  return classes[status] ?? "border-slate-300 bg-slate-50 text-slate-900";
}

function getSlotKey(date: Date, startTime: string) {
  return `${formatDateYYYYMMDD(date)}__${startTime}`;
}

function buildCalendarUrl({
  week,
  selected,
  resourceId,
  status,
  blockId,
  slotKey,
}: {
  week?: string;
  selected?: string;
  resourceId?: string;
  status?: string;
  blockId?: string;
  slotKey?: string;
}) {
  const params = new URLSearchParams();

  if (week) params.set("week", week);
  if (selected) params.set("selected", selected);
  if (blockId) params.set("blockId", blockId);
  if (slotKey) params.set("slotKey", slotKey);
  if (resourceId && resourceId !== "ALL") params.set("resourceId", resourceId);
  if (status && status !== "ALL") params.set("status", status);

  const query = params.toString();

  return query ? `/professional/calendar?${query}` : "/professional/calendar";
}

function buildDayUrl({
  date,
  resourceId,
  status,
}: {
  date: string;
  resourceId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  params.set("date", date);

  if (resourceId && resourceId !== "ALL") params.set("resourceId", resourceId);
  if (status && status !== "ALL") params.set("status", status);

  return `/professional/calendar/day?${params.toString()}`;
}

function getBlockTimeForDay(block: CalendarBlockData, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  if (block.endDateTime <= dayStart || block.startDateTime >= dayEnd) {
    return null;
  }

  const effectiveStart =
    block.startDateTime < dayStart ? dayStart : block.startDateTime;

  const effectiveEnd = block.endDateTime > dayEnd ? dayEnd : block.endDateTime;

  return {
    startMinutes: dateToMinutes(effectiveStart),
    endMinutes: dateToMinutes(effectiveEnd),
  };
}

export default async function ProfessionalCalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      resources: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white"
          >
            Completar perfil
          </Link>
        </section>
      </main>
    );
  }

  const resources: ResourceOption[] = profile.resources;

  const selectedWeekDate = params.week
    ? new Date(`${params.week}T00:00:00`)
    : new Date();

  const weekStart = getStartOfWeek(selectedWeekDate);
  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59, 999);

  const days = Array.from({ length: 7 }).map(
    (_: unknown, index: number) => addDays(weekStart, index)
  );

  const resourceId = params.resourceId ?? "ALL";
  const status = params.status ?? "ALL";

  const appointments: AppointmentData[] = await prisma.appointment.findMany({
    where: {
      professionalId: profile.id,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
      ...(resourceId !== "ALL"
        ? resourceId === "GENERAL"
          ? { resourceId: null }
          : { resourceId }
        : {}),
      ...(status !== "ALL"
        ? {
            status: status as any,
          }
        : {}),
    },
    include: {
      service: true,
      resource: true,
      client: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const calendarBlocks: CalendarBlockData[] =
    await prisma.calendarBlock.findMany({
      where: {
        professionalId: profile.id,
        startDateTime: {
          lte: weekEnd,
        },
        endDateTime: {
          gte: weekStart,
        },
        ...(resourceId !== "ALL"
          ? resourceId === "GENERAL"
            ? { resourceId: null }
            : { resourceId }
          : {}),
      },
      include: {
        resource: true,
      },
      orderBy: {
        startDateTime: "asc",
      },
    });

  const selectedAppointment =
    appointments.find(
      (appointment: AppointmentData) => appointment.id === params.selected
    ) ?? null;

  const selectedBlock =
    calendarBlocks.find(
      (block: CalendarBlockData) => block.id === params.blockId
    ) ?? null;

  const selectedSlotAppointments = params.slotKey
    ? appointments.filter(
        (appointment: AppointmentData) =>
          getSlotKey(appointment.date, appointment.startTime) === params.slotKey
      )
    : [];

  const today = new Date();
  const previousWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const currentUrl = buildCalendarUrl({
    week: params.week,
    selected: params.selected,
    blockId: params.blockId,
    slotKey: params.slotKey,
    resourceId,
    status,
  });

  const closeModalUrl = buildCalendarUrl({
    week: params.week,
    resourceId,
    status,
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">Agenda semanal</h1>

            <p className="mt-2 text-blue-100">
              Calendario visual con turnos, bloqueos y agrupación por horario.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professional/calendar/blocks"
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
            >
              Bloqueos
            </Link>

            <Link
              href="/professional/appointments"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600"
            >
              Ver turnos
            </Link>

            <Link
              href="/professional/calendar/day"
              className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white"
            >
              Vista diaria
            </Link>

            <Link
              href="/professional"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {formatDateDDMMYYYY(weekStart)} — {formatDateDDMMYYYY(weekEnd)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {appointments.length} turno(s) · {calendarBlocks.length}{" "}
                bloqueo(s)
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={buildCalendarUrl({
                  week: formatDateYYYYMMDD(previousWeek),
                  resourceId,
                  status,
                })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              >
                <ChevronLeft size={18} />
                Anterior
              </Link>

              <Link
                href={buildCalendarUrl({
                  resourceId,
                  status,
                })}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
              >
                Hoy
              </Link>

              <Link
                href={buildCalendarUrl({
                  week: formatDateYYYYMMDD(nextWeek),
                  resourceId,
                  status,
                })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              >
                Siguiente
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            {params.week ? (
              <input type="hidden" name="week" value={params.week} />
            ) : null}

            <div>
              <label className="text-sm font-bold text-slate-800">
                Recurso
              </label>

              <select
                name="resourceId"
                defaultValue={resourceId}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-blue-500 focus:ring-2"
              >
                <option value="ALL">Todos los recursos</option>
                <option value="GENERAL">Agenda general</option>

                {resources.map((resource: ResourceOption) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">
                Estado
              </label>

              <select
                name="status"
                defaultValue={status}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-blue-500 focus:ring-2"
              >
                {statusOptions.map(
                  (option: { value: string; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Filtrar
              </button>

              <Link
                href={buildCalendarUrl({
                  week: params.week,
                })}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        {params.success ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 size={20} />
            <span>{params.success}</span>
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {params.error}
          </div>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 p-3 text-xs font-bold text-slate-400">
              Hora
            </div>

            {days.map((day: Date) => {
              const isToday = sameDate(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-slate-200 p-3 text-center last:border-r-0 ${
                    isToday ? "bg-blue-50" : ""
                  }`}
                >
                  <p
                    className={`text-xs font-black ${
                      isToday ? "text-blue-700" : "text-slate-900"
                    }`}
                  >
                    {weekDays[day.getDay()]}
                  </p>

                  <div className="mt-1 flex flex-col items-center gap-1">
                    <p className="text-xs text-slate-500">
                      {formatDateDDMM(day)}
                    </p>

                    <Link
                      href={buildDayUrl({
                        date: formatDateYYYYMMDD(day),
                        resourceId,
                        status,
                      })}
                      className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      Ver día
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
            style={{
              height: visibleHours.length * HOUR_HEIGHT,
            }}
          >
            <div className="border-r border-slate-200 bg-slate-50">
              {visibleHours.map((hour: number) => (
                <div
                  key={hour}
                  className="border-b border-slate-200 px-2 py-2 text-xs font-bold text-slate-400"
                  style={{
                    height: HOUR_HEIGHT,
                  }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day: Date) => {
              const dayAppointments = appointments.filter(
                (appointment: AppointmentData) =>
                  sameDate(appointment.date, day)
              );

              const groupedAppointments = new Map<string, AppointmentData[]>();

              for (const appointment of dayAppointments) {
                const slotKey = getSlotKey(
                  appointment.date,
                  appointment.startTime
                );
                const current = groupedAppointments.get(slotKey) ?? [];
                current.push(appointment);
                groupedAppointments.set(slotKey, current);
              }

              const dayBlocks = calendarBlocks.filter(
                (block: CalendarBlockData) =>
                  getBlockTimeForDay(block, day) !== null
              );

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-r border-slate-100 last:border-r-0"
                >
                  {visibleHours.map((hour: number) => (
                    <div
                      key={hour}
                      className="border-b border-slate-100"
                      style={{
                        height: HOUR_HEIGHT,
                      }}
                    />
                  ))}

                  {dayBlocks.map((block: CalendarBlockData) => {
                    const blockTime = getBlockTimeForDay(block, day);

                    if (!blockTime) return null;

                    return (
                      <Link
                        key={block.id}
                        href={buildCalendarUrl({
                          week: params.week,
                          blockId: block.id,
                          resourceId,
                          status,
                        })}
                        className="absolute left-1 right-1 overflow-hidden rounded-lg border border-red-300 bg-red-100 px-2 py-1 text-red-950 shadow-sm transition hover:z-20 hover:shadow-md"
                        style={{
                          top: getTopFromMinutes(blockTime.startMinutes),
                          height: getHeightFromMinutes(
                            blockTime.startMinutes,
                            blockTime.endMinutes
                          ),
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Ban size={10} />
                          <p className="truncate text-[10px] font-black">
                            Bloqueado
                          </p>
                        </div>

                        <p className="truncate text-[10px] opacity-80">
                          {getResourceLabel(block.resource?.name)}
                        </p>

                        {block.reason ? (
                          <p className="truncate text-[10px] opacity-70">
                            {block.reason}
                          </p>
                        ) : null}
                      </Link>
                    );
                  })}

                  {Array.from(groupedAppointments.entries()).map(
                    ([slotKey, slotAppointments]: [
                      string,
                      AppointmentData[]
                    ]) => {
                      const firstAppointment = slotAppointments[0];
                      const hasMultiple = slotAppointments.length > 1;

                      if (hasMultiple) {
                        return (
                          <Link
                            key={slotKey}
                            href={buildCalendarUrl({
                              week: params.week,
                              slotKey,
                              resourceId,
                              status,
                            })}
                            className="absolute left-1 right-1 overflow-hidden rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-violet-950 shadow-sm transition hover:z-30 hover:shadow-md"
                            style={{
                              top: getTop(firstAppointment.startTime),
                              height: getHeight(
                                firstAppointment.startTime,
                                firstAppointment.endTime
                              ),
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <Layers3 size={10} />
                              <p className="truncate text-[10px] font-black">
                                {firstAppointment.startTime} ·{" "}
                                {slotAppointments.length} turnos
                              </p>
                            </div>

                            <p className="truncate text-[10px] opacity-80">
                              Hay recursos simultáneos
                            </p>

                            <p className="truncate text-[10px] opacity-70">
                              Clic para ver todos
                            </p>
                          </Link>
                        );
                      }

                      return (
                        <Link
                          key={firstAppointment.id}
                          href={buildCalendarUrl({
                            week: params.week,
                            selected: firstAppointment.id,
                            resourceId,
                            status,
                          })}
                          className={`absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1 shadow-sm transition hover:z-30 hover:shadow-md ${getCardClass(
                            firstAppointment.status
                          )}`}
                          style={{
                            top: getTop(firstAppointment.startTime),
                            height: getHeight(
                              firstAppointment.startTime,
                              firstAppointment.endTime
                            ),
                          }}
                        >
                          <p className="truncate text-[10px] font-black">
                            {firstAppointment.startTime}{" "}
                            {firstAppointment.service.title}
                          </p>

                          <p className="truncate text-[10px] opacity-80">
                            {getResourceLabel(firstAppointment.resource?.name)}
                          </p>

                          <p className="truncate text-[10px] opacity-70">
                            {firstAppointment.client.user.name ??
                              firstAppointment.client.user.email}
                          </p>
                        </Link>
                      );
                    }
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </section>

      {selectedSlotAppointments.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
                  Turnos simultáneos
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  {selectedSlotAppointments[0].startTime} ·{" "}
                  {selectedSlotAppointments.length} reservas
                </h2>
              </div>

              <Link
                href={closeModalUrl}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {selectedSlotAppointments.map(
                (appointment: AppointmentData) => (
                  <article
                    key={appointment.id}
                    className={`rounded-3xl border p-5 ${getCardClass(
                      appointment.status
                    )}`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-extrabold">
                          {appointment.service.title}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-white px-3 py-2 font-bold">
                            {appointment.startTime} - {appointment.endTime}
                          </span>

                          <span className="rounded-full bg-white px-3 py-2 font-bold">
                            {getResourceLabel(appointment.resource?.name)}
                          </span>

                          <span className="rounded-full bg-white px-3 py-2 font-bold">
                            {appointment.client.user.name ??
                              appointment.client.user.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <StatusBadge status={appointment.status} />

                        <Link
                          href={buildCalendarUrl({
                            week: params.week,
                            selected: appointment.id,
                            resourceId,
                            status,
                          })}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-black text-white"
                        >
                          Gestionar
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        </div>
      ) : null}

      {selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Turno seleccionado
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  {selectedAppointment.service.title}
                </h2>
              </div>

              <Link
                href={closeModalUrl}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </Link>
            </div>

            <div className="mt-4">
              <StatusBadge status={selectedAppointment.status} />
            </div>

            <div className="mt-6 grid gap-3 text-sm">
              <Info
                label="Fecha"
                value={formatDateDDMMYYYY(selectedAppointment.date)}
              />

              <Info
                label="Horario"
                value={`${selectedAppointment.startTime} - ${selectedAppointment.endTime}`}
              />

              <Info
                label="Cliente"
                value={
                  selectedAppointment.client.user.name ??
                  selectedAppointment.client.user.email
                }
              />

              <Info
                label="Recurso"
                value={getResourceLabel(selectedAppointment.resource?.name)}
              />

              <Info
                label="Duración"
                value={`${selectedAppointment.service.durationMinutes} minutos`}
              />
            </div>

            <div className="mt-6 space-y-3">
              {selectedAppointment.status === "REQUESTED" ? (
                <>
                  <form action={acceptAppointmentAction}>
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={selectedAppointment.id}
                    />

                    <input type="hidden" name="redirectTo" value={currentUrl} />

                    <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                      Aceptar turno
                    </button>
                  </form>

                  <details className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-red-700">
                      Rechazar turno
                    </summary>

                    <form action={rejectAppointmentAction} className="mt-4">
                      <input
                        type="hidden"
                        name="appointmentId"
                        value={selectedAppointment.id}
                      />

                      <input
                        type="hidden"
                        name="redirectTo"
                        value={currentUrl}
                      />

                      <textarea
                        name="statusReason"
                        rows={4}
                        required
                        minLength={5}
                        placeholder="Motivo del rechazo"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-red-500 focus:ring-2"
                      />

                      <button className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">
                        Confirmar rechazo
                      </button>
                    </form>
                  </details>
                </>
              ) : null}

              {selectedAppointment.status === "ACCEPTED" ? (
                <>
                  <form action={completeAppointmentAction}>
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={selectedAppointment.id}
                    />

                    <input type="hidden" name="redirectTo" value={currentUrl} />

                    <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                      Marcar completado
                    </button>
                  </form>

                  <form action={cancelAppointmentByProfessionalAction}>
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={selectedAppointment.id}
                    />

                    <input type="hidden" name="redirectTo" value={currentUrl} />

                    <button className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700">
                      Cancelar turno
                    </button>
                  </form>
                </>
              ) : null}

              {!["REQUESTED", "ACCEPTED"].includes(
                selectedAppointment.status
              ) ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                  Sin acciones disponibles para este estado.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {selectedBlock ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-600">
                  Bloqueo manual
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Horario bloqueado
                </h2>
              </div>

              <Link
                href={closeModalUrl}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </Link>
            </div>

            <div className="mt-6 grid gap-3 text-sm">
              <Info
                label="Inicio"
                value={selectedBlock.startDateTime.toLocaleString("es-AR")}
              />

              <Info
                label="Fin"
                value={selectedBlock.endDateTime.toLocaleString("es-AR")}
              />

              <Info
                label="Recurso"
                value={getResourceLabel(selectedBlock.resource?.name)}
              />

              <Info
                label="Motivo"
                value={selectedBlock.reason ?? "Sin motivo informado"}
              />
            </div>

            <div className="mt-6">
              <Link
                href="/professional/calendar/blocks"
                className="block w-full rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white"
              >
                Gestionar bloqueos
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}