import Link from "next/link";
import {
  Ban,
  Bell,
  CalendarClock,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

import {
  createCalendarBlockAction,
  deleteCalendarBlockAction,
} from "./actions";

type CalendarResourceOption = {
  id: string;
  name: string;
};

type CalendarBlockItem = {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  reason: string | null;
  resource: {
    name: string;
  } | null;
};

function formatDate(date: Date) {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CalendarBlocksPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const professional = await prisma.professionalProfile.findUnique({
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

  if (!professional) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Perfil inexistente</h1>
        </section>
      </main>
    );
  }

  const resources: CalendarResourceOption[] = professional.resources;

  const blocks: CalendarBlockItem[] = await prisma.calendarBlock.findMany({
    where: {
      professionalId: professional.id,
    },
    include: {
      resource: true,
    },
    orderBy: {
      startDateTime: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Agenda
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Bloqueos manuales
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Reservá tiempo para almuerzos, vacaciones, buffers, reuniones o
              cualquier situación real.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional/calendar"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-700"
            >
              Agenda semanal
            </Link>

            <Link
              href="/professional/calendar/day"
              className="rounded-xl bg-blue-900 px-5 py-3 text-center text-sm font-bold text-white"
            >
              Vista diaria
            </Link>

            <Link
              href="/professional"
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {params.success ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 sm:mb-6 sm:p-5">
            {params.success}
          </div>
        ) : null}

        {params.error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 sm:mb-6 sm:p-5">
            {params.error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:gap-8">
          <form
            action={createCalendarBlockAction}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 sm:h-12 sm:w-12">
                <Ban size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Nuevo bloqueo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Bloquear disponibilidad puntual.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5 sm:mt-8">
              <div>
                <label className="text-sm font-bold text-slate-800">
                  Recurso
                </label>

                <select
                  name="resourceId"
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-red-500 focus:ring-2"
                >
                  <option value="">Agenda general</option>

                  {resources.map((resource: CalendarResourceOption) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Fecha inicio
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Hora inicio
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Fecha fin
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Hora fin
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800">
                  Motivo
                </label>

                <textarea
                  name="reason"
                  rows={4}
                  placeholder="Ej: almuerzo, vacaciones, mantenimiento, reunión..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-red-500 focus:ring-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 sm:mt-8"
            >
              Crear bloqueo
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Bloqueos existentes
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Estos horarios quedan fuera de la agenda disponible.
              </p>
            </div>

            {blocks.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500 sm:mt-8">
                No hay bloqueos manuales.
              </p>
            ) : (
              <div className="mt-6 space-y-4 sm:mt-8">
                {blocks.map((block: CalendarBlockItem) => (
                  <article
                    key={block.id}
                    className="rounded-3xl border border-red-200 bg-red-50 p-5"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                            BLOQUEADO
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                            {block.resource?.name ?? "Agenda general"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-900">
                          {formatDate(block.startDateTime)}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          hasta {formatDate(block.endDateTime)}
                        </p>

                        {block.reason ? (
                          <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
                            <p className="text-sm font-bold text-slate-900">
                              Motivo
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {block.reason}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <form action={deleteCalendarBlockAction}>
                        <input
                          type="hidden"
                          name="blockId"
                          value={block.id}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 md:w-auto md:py-2"
                        >
                          Eliminar bloqueo
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          <MobileNavItem
            href="/professional"
            label="Inicio"
            icon={<CalendarDays size={20} />}
          />

          <MobileNavItem
            href="/professional/calendar/day"
            label="Día"
            icon={<CalendarClock size={20} />}
          />

          <MobileNavItem
            href="/professional/appointments"
            label="Turnos"
            icon={<CalendarClock size={20} />}
          />

          <MobileNavItem
            href="/professional/messages"
            label="Mensajes"
            icon={<MessageCircle size={20} />}
          />

          <MobileNavItem
            href="/professional/notifications"
            label="Avisos"
            icon={<Bell size={20} />}
          />
        </div>
      </nav>
    </main>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold text-slate-600 active:bg-blue-50 active:text-blue-700"
    >
      {icon}

      <span className="mt-1">{label}</span>
    </Link>
  );
}