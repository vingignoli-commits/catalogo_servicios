import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers3,
  UserRound,
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

const visibleHours = Array.from({ length: 15 }).map((_, index) => index + 7);

const statusOptions = [
  { value: "ALL", label: "Todos" },
  { value: "REQUESTED", label: "Solicitados" },
  { value: "ACCEPTED", label: "Aceptados" },
  { value: "COMPLETED", label: "Completados" },
  { value: "REJECTED", label: "Rechazados" },
];

function formatDateYYYYMMDD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getHourFromTime(time: string) {
  return Number(time.split(":")[0]);
}

function getResourceLabel(resourceName?: string | null) {
  return resourceName || "Agenda general";
}

function getSlotKey(startTime: string) {
  return startTime;
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

function getCardClass(status: string) {
  const classes: Record<string, string> = {
    REQUESTED: "border-amber-300 bg-amber-50",
    ACCEPTED: "border-blue-300 bg-blue-50",
    REJECTED: "border-red-300 bg-red-50",
    CANCELLED_BY_CLIENT: "border-slate-300 bg-slate-100",
    CANCELLED_BY_PROFESSIONAL: "border-slate-300 bg-slate-100",
    COMPLETED: "border-emerald-300 bg-emerald-50",
    NO_SHOW: "border-fuchsia-300 bg-fuchsia-50",
    EXPIRED: "border-slate-300 bg-slate-100",
  };

  return classes[status] ?? "border-slate-300 bg-slate-50";
}

function blockTouchesHour(
  block: {
    startDateTime: Date;
    endDateTime: Date;
  },
  hour: number
) {
  const hourStart = new Date(block.startDateTime);
  hourStart.setHours(hour, 0, 0, 0);

  const hourEnd = new Date(block.startDateTime);
  hourEnd.setHours(hour + 1, 0, 0, 0);

  return block.startDateTime < hourEnd && block.endDateTime > hourStart;
}

type DayCalendarPageProps = {
  searchParams: Promise<{
    date?: string;
    resourceId?: string;
    status?: string;
    success?: string;
    error?: string;
  }>;
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

export default async function ProfessionalDayCalendarPage({
  searchParams,
}: DayCalendarPageProps) {
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
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white sm:w-auto"
          >
            Completar perfil
          </Link>
        </section>
      </main>
    );
  }

  const selectedDate = params.date
    ? new Date(`${params.date}T00:00:00`)
    : new Date();

  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const resourceId = params.resourceId ?? "ALL";
  const status = params.status ?? "ALL";

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: profile.id,
      date: {
        gte: dayStart,
        lte: dayEnd,
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
    orderBy: [{ startTime: "asc" }],
  });

  const calendarBlocks = await prisma.calendarBlock.findMany({
    where: {
      professionalId: profile.id,
      startDateTime: {
        lte: dayEnd,
      },
      endDateTime: {
        gte: dayStart,
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

  const previousDay = addDays(selectedDate, -1);
  const nextDay = addDays(selectedDate, 1);

  const redirectTo = buildDayUrl({
    date: formatDateYYYYMMDD(selectedDate),
    resourceId,
    status,
  });

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Agenda diaria
            </p>

            <h1 className="mt-2 text-3xl font-extrabold capitalize sm:text-4xl">
              {formatDateLong(selectedDate)}
            </h1>

            <p className="mt-2 text-sm text-blue-100 sm:text-base">
              Turnos simultáneos, bloqueos y acciones operativas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional/calendar/blocks"
              className="rounded-xl bg-red-600 px-5 py-3 text-center text-sm font-bold text-white"
            >
              Bloqueos
            </Link>

            <Link
              href="/professional/calendar"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-600"
            >
              Vista semanal
            </Link>

            <Link
              href="/professional"
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                {appointments.length} turno(s) · {calendarBlocks.length} bloqueo(s)
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Operación diaria filtrada.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={buildDayUrl({
                  date: formatDateYYYYMMDD(previousDay),
                  resourceId,
                  status,
                })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 sm:py-2"
              >
                <ChevronLeft size={18} />
                Día anterior
              </Link>

              <Link
                href="/professional/calendar/day"
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white sm:py-2"
              >
                Hoy
              </Link>

              <Link
                href={buildDayUrl({
                  date: formatDateYYYYMMDD(nextDay),
                  resourceId,
                  status,
                })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 sm:py-2"
              >
                Día siguiente
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="hidden"
              name="date"
              value={formatDateYYYYMMDD(selectedDate)}
            />

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

                {profile.resources.map((resource) => (
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
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white md:flex-none"
              >
                Filtrar
              </button>

              <Link
                href={buildDayUrl({
                  date: formatDateYYYYMMDD(selectedDate),
                })}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 md:flex-none"
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

        <section className="mt-5 space-y-4">
          {visibleHours.map((hour) => {
            const hourAppointments = appointments.filter(
              (appointment) => getHourFromTime(appointment.startTime) === hour
            );

            const hourBlocks = calendarBlocks.filter((block) =>
              blockTouchesHour(block, hour)
            );

            const groupedAppointments = new Map<string, AppointmentData[]>();

            for (const appointment of hourAppointments) {
              const slotKey = getSlotKey(appointment.startTime);
              const current = groupedAppointments.get(slotKey) ?? [];
              current.push(appointment);
              groupedAppointments.set(slotKey, current);
            }

            return (
              <div
                key={hour}
                className="grid grid-cols-[64px_1fr] gap-3 sm:grid-cols-[90px_1fr] sm:gap-4"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm sm:p-4">
                  <p className="text-xs font-black text-slate-900 sm:text-sm">
                    {String(hour).padStart(2, "0")}:00
                  </p>
                </div>

                <div className="space-y-3">
                  {hourBlocks.length === 0 &&
                  groupedAppointments.size === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 sm:p-5">
                      Sin turnos ni bloqueos
                    </div>
                  ) : null}

                  {hourBlocks.map((block) => (
                    <CalendarBlockCard key={block.id} block={block} />
                  ))}

                  {Array.from(groupedAppointments.entries()).map(
                    ([slotKey, slotAppointments]) => {
                      if (slotAppointments.length > 1) {
                        return (
                          <section
                            key={slotKey}
                            className="rounded-3xl border border-violet-200 bg-violet-50 p-4 sm:p-5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white">
                                <Layers3 size={20} />
                              </div>

                              <div>
                                <h3 className="text-base font-extrabold text-violet-950 sm:text-lg">
                                  {slotAppointments.length} turnos a las{" "}
                                  {slotAppointments[0].startTime}
                                </h3>

                                <p className="text-sm text-violet-700">
                                  Recursos simultáneos.
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4">
                              {slotAppointments.map((appointment) => (
                                <AppointmentCard
                                  key={appointment.id}
                                  appointment={appointment}
                                  redirectTo={redirectTo}
                                />
                              ))}
                            </div>
                          </section>
                        );
                      }

                      return (
                        <AppointmentCard
                          key={slotAppointments[0].id}
                          appointment={slotAppointments[0]}
                          redirectTo={redirectTo}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Clock3 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Vista diaria
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Agrupa reservas simultáneas y muestra bloqueos manuales.
              </p>
            </div>
          </div>
        </section>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          <MobileNavItem href="/professional" label="Inicio" />
          <MobileNavItem href="/professional/calendar/day" label="Día" />
          <MobileNavItem href="/professional/appointments" label="Turnos" />
          <MobileNavItem href="/professional/messages" label="Mensajes" />
        </div>
      </nav>
    </main>
  );
}

function CalendarBlockCard({ block }: { block: CalendarBlockData }) {
  return (
    <article className="rounded-3xl border border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
              <Ban size={13} />
              BLOQUEADO
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
              {getResourceLabel(block.resource?.name)}
            </span>
          </div>

          <p className="mt-4 text-sm font-bold text-slate-900">
            {formatDateTime(block.startDateTime)} —{" "}
            {formatDateTime(block.endDateTime)}
          </p>

          {block.reason ? (
            <p className="mt-2 text-sm text-slate-700">{block.reason}</p>
          ) : null}
        </div>

        <Link
          href="/professional/calendar/blocks"
          className="rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white md:py-2"
        >
          Gestionar
        </Link>
      </div>
    </article>
  );
}

function AppointmentCard({
  appointment,
  redirectTo,
}: {
  appointment: AppointmentData;
  redirectTo: string;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${getCardClass(
        appointment.status
      )}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-extrabold sm:text-lg">
              {appointment.service.title}
            </h3>

            <StatusBadge status={appointment.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="rounded-full bg-white px-3 py-2 font-bold">
              {appointment.startTime} - {appointment.endTime}
            </span>

            <span className="rounded-full bg-white px-3 py-2 font-bold">
              {appointment.service.durationMinutes} min
            </span>

            <span className="rounded-full bg-blue-600 px-3 py-2 font-black text-white">
              {getResourceLabel(appointment.resource?.name)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <UserRound size={16} />
            <span className="truncate">
              {appointment.client.user.name ?? appointment.client.user.email}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:w-[340px]">
          {appointment.status === "REQUESTED" ? (
            <>
              <form action={acceptAppointmentAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                  Aceptar turno
                </button>
              </form>

              <details className="rounded-2xl border border-red-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-black text-red-700">
                  Rechazar turno
                </summary>

                <form action={rejectAppointmentAction} className="mt-4">
                  <input
                    type="hidden"
                    name="appointmentId"
                    value={appointment.id}
                  />

                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <textarea
                    name="statusReason"
                    rows={4}
                    required
                    minLength={5}
                    placeholder="Motivo del rechazo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />

                  <button className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">
                    Confirmar rechazo
                  </button>
                </form>
              </details>
            </>
          ) : null}

          {appointment.status === "ACCEPTED" ? (
            <>
              <form action={completeAppointmentAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                  Marcar completado
                </button>
              </form>

              <form action={cancelAppointmentByProfessionalAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <button className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700">
                  Cancelar turno
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MobileNavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center rounded-2xl px-2 py-3 text-[11px] font-bold text-slate-600 active:bg-blue-50 active:text-blue-700"
    >
      {label}
    </Link>
  );
}