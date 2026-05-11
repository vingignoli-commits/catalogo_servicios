import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { StatusBadge } from "@/components/ui/status-badge";
import { openConversationFromClientAppointmentAction } from "./actions";
import { markNotificationsAsRead } from "@/lib/notifications/notifications";

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export default async function ClientAppointmentDetailPage({
  params,
}: {
  params: Promise<{
    appointmentId: string;
  }>;
}) {
  const { appointmentId } = await params;
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    return notFound();
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clientId: clientProfile.id,
    },
    include: {
      service: true,
      resource: true,
      conversation: true,
      reviews: {
        where: {
          clientId: clientProfile.id,
        },
      },
      professional: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    return notFound();
  }

  await markNotificationsAsRead({
    userId: user.id,
    entityType: "APPOINTMENT",
    entityId: appointment.id,
  });

  const review = appointment.reviews[0] ?? null;

  const professionalName =
    appointment.professional.user.name ??
    appointment.professional.user.email.split("@")[0];

  const canReview = appointment.status === "COMPLETED" && !review;
  const alreadyReviewed = appointment.status === "COMPLETED" && Boolean(review);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Detalle del turno
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              {appointment.service.title}
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Revisá estado, profesional, dirección y datos de la reserva.
            </p>
          </div>

          <Link
            href="/client/appointments"
            className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Información del turno</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Este es el estado actual de tu solicitud.
                </p>
              </div>

              <StatusBadge status={appointment.status} />
            </div>

            {appointment.statusReason ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                <p className="font-bold text-red-900">Motivo informado</p>
                <p className="mt-1">{appointment.statusReason}</p>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4">
              <DetailRow
                icon={<ShieldCheck size={19} />}
                label="Servicio"
                value={appointment.service.title}
              />

              <DetailRow
                icon={<UserRound size={19} />}
                label="Profesional / negocio"
                value={professionalName}
              />

              {appointment.resource ? (
                <DetailRow
                  icon={<UserRound size={19} />}
                  label="Recurso asignado"
                  value={appointment.resource.name}
                />
              ) : null}

              <DetailRow
                icon={<CalendarDays size={19} />}
                label="Fecha"
                value={formatDateDDMMYYYY(appointment.date)}
              />

              <DetailRow
                icon={<Clock3 size={19} />}
                label="Horario"
                value={`${appointment.startTime} - ${appointment.endTime}`}
              />

              <DetailRow
                icon={<Clock3 size={19} />}
                label="Duración"
                value={`${appointment.service.durationMinutes} minutos`}
              />

              <DetailRow
                icon={<MapPin size={19} />}
                label="Dirección"
                value={
                  appointment.professional.location || "Sin dirección cargada"
                }
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/professionals/${appointment.professional.id}`}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Ver perfil profesional
              </Link>

              <Link
                href={`/professionals/${appointment.professional.id}/slots?serviceId=${appointment.service.id}`}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Ver otros horarios
              </Link>

              {canReview ? (
                <Link
                  href={`/client/appointments/${appointment.id}/review`}
                  className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
                >
                  Dejar reseña
                </Link>
              ) : null}

              {alreadyReviewed ? (
                <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                  Reseña enviada
                </span>
              ) : null}

              <form
                action={async () => {
                  "use server";
                  await openConversationFromClientAppointmentAction(
                    appointment.id
                  );
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  {appointment.conversation
                    ? "Abrir mensajes"
                    : "Enviar mensaje"}
                </button>
              </form>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="text-xl font-bold text-slate-950">
                Estado del turno
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Si está solicitado, todavía depende de la aceptación del
                profesional. Si está aceptado, el turno está confirmado.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-blue-600">
                <MessageCircle size={20} />
                <h3 className="font-bold text-slate-950">Mensajería</h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Usá mensajes para consultas puntuales sobre dirección,
                documentación, llegada o detalles del servicio.
              </p>
            </section>

            {review ? (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-xl font-bold text-slate-950">
                  Tu reseña
                </h3>

                <p className="mt-3 text-sm font-bold text-amber-700">
                  {review.rating}/5
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {review.comment}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mt-1 text-blue-600">{icon}</div>

      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-1 font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}