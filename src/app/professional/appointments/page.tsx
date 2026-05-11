import Link from "next/link";

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

export default async function ProfessionalAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
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
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>
          <p className="mt-2 text-sm text-slate-500">
            Antes de gestionar turnos necesitás tener un perfil profesional.
          </p>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Turnos recibidos
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Gestioná solicitudes, aceptaciones, cancelaciones y turnos
              completados.
            </p>
          </div>

          <Link
            href="/professional"
            className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        {requestedAppointments.length > 0 ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-bold text-amber-900">
              Tenés {requestedAppointments.length} solicitud(es) pendiente(s)
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Respondé rápido. En marketplace, el silencio también comunica.
            </p>
          </div>
        ) : null}

        {appointments.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold">Todavía no recibiste turnos</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Cuando un cliente solicite un turno, aparecerá en este panel.
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            <AppointmentsSection
              title="Solicitudes pendientes"
              description="Turnos que todavía esperan tu aceptación o rechazo."
              count={requestedAppointments.length}
              appointments={requestedAppointments}
            />

            <AppointmentsSection
              title="Turnos aceptados"
              description="Turnos confirmados pendientes de completar."
              count={acceptedAppointments.length}
              appointments={acceptedAppointments}
            />

            <AppointmentsSection
              title="Historial"
              description="Turnos rechazados, cancelados, completados, ausentes o expirados."
              count={historicalAppointments.length}
              appointments={historicalAppointments}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function AppointmentsSection({
  title,
  description,
  count,
  appointments,
}: {
  title: string;
  description: string;
  count: number;
  appointments: AppointmentCardData[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <p className="text-sm font-bold text-blue-600">{count} registro(s)</p>
      </div>

      {appointments.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">No hay registros.</p>
      ) : (
        <div className="mt-6 grid gap-4">
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
};

function AppointmentCard({ appointment }: { appointment: AppointmentCardData }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            {appointment.service.title}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Cliente:{" "}
            {appointment.client.user.name ?? appointment.client.user.email}
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            <span>{formatDateDDMMYYYY(appointment.date)}</span>
            <span>
              {appointment.startTime} - {appointment.endTime}
            </span>
            <span>{appointment.service.durationMinutes} min</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white px-3 py-2 text-slate-600">
              Recurso: {appointment.resource?.name ?? "Agenda general"}
            </span>

            {appointment.resource ? (
              <span className="rounded-full bg-blue-100 px-3 py-2 text-blue-700">
                {appointment.resource.type}
              </span>
            ) : null}
          </div>

          {appointment.statusReason ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-bold text-slate-900">Motivo</p>
              <p className="mt-1">{appointment.statusReason}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
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
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
                  >
                    Aceptar
                  </button>
                </form>

                <form
                  action={rejectAppointmentAction}
                  className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-white p-3"
                >
                  <input
                    type="hidden"
                    name="appointmentId"
                    value={appointment.id}
                  />

                  <textarea
                    name="statusReason"
                    rows={2}
                    required
                    minLength={5}
                    placeholder="Motivo del rechazo"
                    className="w-full min-w-[260px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-red-500 focus:ring-2"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-100 active:scale-95"
                  >
                    Rechazar con motivo
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
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    Marcar como completado
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
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                  >
                    Cancelar
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>

        <StatusBadge status={appointment.status} />
      </div>
    </article>
  );
}