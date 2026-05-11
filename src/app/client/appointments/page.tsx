import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { cancelAppointmentByClientAction } from "./actions";
import { StatusBadge } from "@/components/ui/status-badge";

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function canCancelAppointment(date: Date, status: string) {
  if (!["REQUESTED", "ACCEPTED"].includes(status)) {
    return false;
  }

  const now = new Date();
  const hoursUntilAppointment =
    (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilAppointment >= 24;
}

export default async function ClientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Perfil de cliente inexistente</h1>
          <p className="mt-2 text-sm text-red-600">
            Tu usuario no tiene perfil de cliente asociado.
          </p>
        </section>
      </main>
    );
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: clientProfile.id,
    },
    include: {
      service: true,
      professional: {
        include: {
          user: true,
        },
      },
      reviews: {
        where: {
          clientId: clientProfile.id,
        },
      },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const activeAppointments = appointments.filter((appointment) =>
    ["REQUESTED", "ACCEPTED"].includes(appointment.status)
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
              Cliente
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">Mis turnos</h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Revisá solicitudes, aceptaciones, cancelaciones, historial y
              reseñas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professionals"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Buscar profesionales
            </Link>

            <Link
              href="/client"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        {appointments.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold">Todavía no tenés turnos</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Buscá un profesional, elegí un servicio y solicitá tu primer
              turno.
            </p>

            <Link
              href="/professionals"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Buscar profesionales
            </Link>
          </section>
        ) : (
          <div className="space-y-8">
            <AppointmentsSection
              title="Turnos activos"
              description="Solicitudes pendientes o turnos aceptados."
              count={activeAppointments.length}
              appointments={activeAppointments}
            />

            <AppointmentsSection
              title="Historial"
              description="Turnos rechazados, cancelados, completados o expirados."
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
  appointments: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
    service: {
      title: string;
      durationMinutes: number;
    };
    professional: {
      user: {
        name: string | null;
        email: string;
      };
    };
    reviews: {
      id: string;
    }[];
  }[];
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

function AppointmentCard({
  appointment,
}: {
  appointment: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
    service: {
      title: string;
      durationMinutes: number;
    };
    professional: {
      user: {
        name: string | null;
        email: string;
      };
    };
    reviews: {
      id: string;
    }[];
  };
}) {
  const canReview =
    appointment.status === "COMPLETED" && appointment.reviews.length === 0;

  const alreadyReviewed =
    appointment.status === "COMPLETED" && appointment.reviews.length > 0;

  const canCancel = canCancelAppointment(appointment.date, appointment.status);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href={`/client/appointments/${appointment.id}`}
            className="text-lg font-bold text-slate-950 hover:text-blue-600"
          >
            {appointment.service.title}
          </Link>

          <p className="mt-2 text-sm text-slate-500">
            Profesional:{" "}
            {appointment.professional.user.name ??
              appointment.professional.user.email}
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            <span>{formatDateDDMMYYYY(appointment.date)}</span>
            <span>
              {appointment.startTime} - {appointment.endTime}
            </span>
            <span>{appointment.service.durationMinutes} min</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/client/appointments/${appointment.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
            >
              Ver detalle
            </Link>

            {canCancel ? (
              <form
                action={async () => {
                  "use server";
                  await cancelAppointmentByClientAction(appointment.id);
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                >
                  Cancelar turno
                </button>
              </form>
            ) : null}

            {canReview ? (
              <Link
                href={`/client/appointments/${appointment.id}/review`}
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-95"
              >
                Puntuar profesional
              </Link>
            ) : null}

            {alreadyReviewed ? (
              <span className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                Reseña enviada
              </span>
            ) : null}
          </div>

          {["REQUESTED", "ACCEPTED"].includes(appointment.status) &&
          !canCancel ? (
            <p className="mt-4 text-xs text-slate-500">
              Cancelación bloqueada: faltan menos de 24 horas.
            </p>
          ) : null}
        </div>

        <StatusBadge status={appointment.status} />
      </div>
    </article>
  );
}