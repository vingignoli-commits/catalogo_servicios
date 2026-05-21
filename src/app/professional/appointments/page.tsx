import Link from "next/link";
import { CalendarClock, CheckCircle2, MessageCircle } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { StatusBadge } from "@/components/ui/status-badge";

import {
  acceptAppointmentAction,
  cancelAppointmentByProfessionalAction,
  completeAppointmentAction,
  rejectAppointmentAction,
} from "./actions";

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getCardClass(status: string) {
  if (status === "REQUESTED") return "border-amber-300 bg-amber-50";
  if (status === "ACCEPTED") return "border-blue-300 bg-blue-50";
  if (status === "COMPLETED") return "border-emerald-300 bg-emerald-50";

  if (
    status === "REJECTED" ||
    status === "CANCELLED_BY_CLIENT" ||
    status === "CANCELLED_BY_PROFESSIONAL"
  ) {
    return "border-red-200 bg-red-50";
  }

  return "border-slate-200 bg-slate-50";
}

export default async function ProfessionalAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>
          <p className="mt-2 text-sm text-slate-500">
            Antes de gestionar turnos necesitás tener un perfil profesional.
          </p>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Completar perfil
          </Link>
        </section>
      </main>
    );
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: profile.id,
    },
    include: {
      client: {
        include: {
          user: true,
        },
      },
      service: true,
      resource: true,
      conversation: {
        include: {
          messages: {
            where: {
              senderId: {
                not: user.id,
              },
              readAt: null,
            },
          },
        },
      },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const requestedAppointments = appointments.filter(
    (appointment) => appointment.status === "REQUESTED"
  );

  const acceptedAppointments = appointments.filter(
    (appointment) => appointment.status === "ACCEPTED"
  );

  const historicalAppointments = appointments.filter(
    (appointment) => !["REQUESTED", "ACCEPTED"].includes(appointment.status)
  );

  const unreadMessagesCount = appointments.reduce((acc, appointment) => {
    return acc + (appointment.conversation?.messages.length ?? 0);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Profesional
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Gestión de turnos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Solicitudes, turnos aceptados, conversaciones e historial.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional/calendar"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-700"
            >
              Agenda
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
        {(requestedAppointments.length > 0 || unreadMessagesCount > 0) && (
          <section className="mb-6 rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-xl shadow-amber-950/10 sm:mb-8 sm:p-8">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700 sm:text-sm">
              Atención requerida
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
              {requestedAppointments.length > 0 ? (
                <Link
                  href="#pending-appointments"
                  className="rounded-2xl border border-amber-200 bg-white p-4 transition hover:border-amber-400 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock size={22} className="text-amber-600" />
                    <div>
                      <p className="text-lg font-extrabold text-slate-950">
                        {requestedAppointments.length} solicitud(es)
                      </p>
                      <p className="text-sm text-slate-600">
                        Pendientes de respuesta.
                      </p>
                    </div>
                  </div>
                </Link>
              ) : null}

              {unreadMessagesCount > 0 ? (
                <Link
                  href="/professional/messages"
                  className="rounded-2xl border border-blue-200 bg-white p-4 transition hover:border-blue-400 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle size={22} className="text-blue-600" />
                    <div>
                      <p className="text-lg font-extrabold text-slate-950">
                        {unreadMessagesCount} mensaje(s)
                      </p>
                      <p className="text-sm text-slate-600">
                        Nuevos sin leer.
                      </p>
                    </div>
                  </div>
                </Link>
              ) : null}
            </div>
          </section>
        )}

        {params.success ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 sm:mb-6 sm:p-5">
            <CheckCircle2 size={20} />
            <span>{params.success}</span>
          </div>
        ) : null}

        {params.error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 sm:mb-6 sm:p-5">
            {params.error}
          </div>
        ) : null}

        {appointments.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold">Todavía no recibiste turnos</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Cuando un cliente solicite un turno aparecerá acá.
            </p>
          </section>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <AppointmentsSection
              id="pending-appointments"
              title="Solicitudes pendientes"
              description="Requieren respuesta inmediata."
              appointments={requestedAppointments}
            />

            <AppointmentsSection
              title="Turnos aceptados"
              description="Pendientes de completar."
              appointments={acceptedAppointments}
            />

            <AppointmentsSection
              title="Historial"
              description="Turnos finalizados o cancelados."
              appointments={historicalAppointments}
            />
          </div>
        )}
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

function AppointmentsSection({
  id,
  title,
  description,
  appointments,
}: {
  id?: string;
  title: string;
  description: string;
  appointments: AppointmentCardData[];
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <p className="text-sm font-bold text-blue-600">
          {appointments.length} registro(s)
        </p>
      </div>

      {appointments.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          No hay registros disponibles.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </section>
  );
}

type AppointmentCardData = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  statusReason: string | null;
  service: {
    title: string;
    durationMinutes: number;
  };
  resource: {
    name: string;
    type: string;
  } | null;
  client: {
    user: {
      name: string | null;
      email: string;
    };
  };
  conversation: {
    id: string;
    messages: {
      id: string;
    }[];
  } | null;
};

function AppointmentCard({
  appointment,
}: {
  appointment: AppointmentCardData;
}) {
  const unreadMessages = appointment.conversation?.messages.length ?? 0;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${getCardClass(
        appointment.status
      )}`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-lg font-extrabold text-slate-950 sm:text-xl">
              {appointment.service.title}
            </h3>

            <StatusBadge status={appointment.status} />

            {unreadMessages > 0 ? (
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                {unreadMessages} mensaje(s) nuevo(s)
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Cliente:{" "}
            <span className="font-bold text-slate-900">
              {appointment.client.user.name ?? appointment.client.user.email}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-700">
              {formatDateDDMMYYYY(appointment.date)}
            </span>

            <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-700">
              {appointment.startTime} - {appointment.endTime}
            </span>

            <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-700">
              {appointment.service.durationMinutes} min
            </span>

            <span className="rounded-full bg-blue-600 px-3 py-2 font-black text-white">
              {appointment.resource?.name ?? "Agenda general"}
            </span>
          </div>

          {appointment.statusReason ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">Motivo</p>
              <p className="mt-1 text-sm text-slate-700">
                {appointment.statusReason}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-[320px]">
          {appointment.conversation ? (
            <Link
              href={`/professional/messages/${appointment.conversation.id}`}
              className={`rounded-xl px-4 py-3 text-center text-sm font-black transition ${
                unreadMessages > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {unreadMessages > 0
                ? "Ver mensajes nuevos"
                : "Abrir conversación"}
            </Link>
          ) : null}

          {appointment.status === "REQUESTED" ? (
            <>
              <form
                action={async () => {
                  "use server";
                  await acceptAppointmentAction(appointment.id);
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Aceptar solicitud
                </button>
              </form>

              <form
                action={rejectAppointmentAction}
                className="rounded-2xl border border-red-200 bg-white p-4"
              >
                <input
                  type="hidden"
                  name="appointmentId"
                  value={appointment.id}
                />

                <textarea
                  name="statusReason"
                  rows={3}
                  required
                  minLength={5}
                  placeholder="Motivo del rechazo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-red-500 focus:ring-2"
                />

                <button
                  type="submit"
                  className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  Rechazar solicitud
                </button>
              </form>
            </>
          ) : null}

          {appointment.status === "ACCEPTED" ? (
            <>
              <form
                action={async () => {
                  "use server";
                  await completeAppointmentAction(appointment.id);
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Marcar completado
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await cancelAppointmentByProfessionalAction(appointment.id);
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
                >
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