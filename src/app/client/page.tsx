import Link from "next/link";
import {
  Bell,
  CalendarDays,
  MessageCircle,
  Search,
  UserRoundCheck,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { StatusBadge } from "@/components/ui/status-badge";

function formatAppointmentStatus(status: string) {
  const labels: Record<string, string> = {
    REQUESTED: "Solicitado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    CANCELLED_BY_CLIENT: "Cancelado por cliente",
    CANCELLED_BY_PROFESSIONAL: "Cancelado por profesional",
    COMPLETED: "Completado",
    NO_SHOW: "No asistió",
    EXPIRED: "Expirado",
  };

  return labels[status] ?? status;
}

export default async function ClientDashboardPage() {
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  const activeAppointmentsCount = clientProfile
    ? await prisma.appointment.count({
        where: {
          clientId: clientProfile.id,
          status: {
            in: ["REQUESTED", "ACCEPTED"],
          },
        },
      })
    : 0;

  const completedAppointmentsCount = clientProfile
    ? await prisma.appointment.count({
        where: {
          clientId: clientProfile.id,
          status: "COMPLETED",
        },
      })
    : 0;

  const unreadMessagesCount = await prisma.message.count({
    where: {
      senderId: {
        not: user.id,
      },
      readAt: null,
      conversation: {
        client: {
          userId: user.id,
        },
      },
    },
  });

  const unreadNotifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const lastAppointment = clientProfile
    ? await prisma.appointment.findFirst({
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
        },
        orderBy: [{ updatedAt: "desc" }],
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Panel cliente
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Gestioná tus turnos
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Buscá profesionales, solicitá turnos, revisá estados, mensajes y
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
              href="/logout"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Salir
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="-mt-20 grid gap-5 md:grid-cols-4">
          <MetricCard
            label="Turnos activos"
            value={activeAppointmentsCount}
            description="Solicitados o aceptados"
          />
          <MetricCard
            label="Notificaciones"
            value={unreadNotifications.length}
            description="Sin leer"
          />
          <MetricCard
            label="Mensajes"
            value={unreadMessagesCount}
            description="No leídos"
          />
          <MetricCard
            label="Completados"
            value={completedAppointmentsCount}
            description="Servicios finalizados"
          />
        </div>

        {unreadNotifications.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center gap-3 text-blue-700">
              <Bell size={22} />
              <h2 className="text-xl font-bold text-blue-950">
                Notificaciones pendientes
              </h2>
            </div>

            <div className="mt-5 grid gap-3">
              {unreadNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.actionUrl ?? "/client"}
                  className="rounded-2xl border border-blue-100 bg-white p-4 transition hover:border-blue-300"
                >
                  <p className="font-bold text-slate-950">
                    {notification.title}
                  </p>
                  {notification.content ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {notification.content}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {unreadMessagesCount > 0 ? (
          <div className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-900">
              Tenés {unreadMessagesCount} mensaje(s) sin leer
            </h2>
            <p className="mt-2 text-sm text-blue-700">
              Revisá las conversaciones vinculadas a tus turnos.
            </p>
            <Link
              href="/client/messages"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Ver mensajes
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <DashboardAction
            href="/professionals"
            icon={<Search size={24} />}
            title="Buscar profesionales"
            description="Encontrá servicios, compará perfiles y reservá."
          />

          <DashboardAction
            href="/client/appointments"
            icon={<CalendarDays size={24} />}
            title="Mis turnos"
            description="Ver estados, historial, cancelaciones y reseñas."
          />

          <DashboardAction
            href="/client/messages"
            icon={<MessageCircle size={24} />}
            title="Mensajes"
            description={`${unreadMessagesCount} mensaje(s) sin leer.`}
          />

          <DashboardAction
            href="/client/appointments"
            icon={<UserRoundCheck size={24} />}
            title="Turnos activos"
            description={`${activeAppointmentsCount} turno(s) actualmente abiertos.`}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Último movimiento</h2>

              {!lastAppointment ? (
                <p className="mt-3 text-sm text-slate-500">
                  Todavía no solicitaste turnos.
                </p>
              ) : (
                <div className="mt-5">
                  <p className="text-lg font-bold">
                    {lastAppointment.service.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Profesional:{" "}
                    {lastAppointment.professional.user.name ??
                      lastAppointment.professional.user.email}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Estado: {formatAppointmentStatus(lastAppointment.status)}
                  </p>
                </div>
              )}
            </div>

            {lastAppointment ? (
              <StatusBadge status={lastAppointment.status} />
            ) : (
              <Link
                href="/professionals"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Buscar profesionales
              </Link>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/10">
      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
        {label}
      </p>
      <p className="mt-3 text-4xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function DashboardAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-xl"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </Link>
  );
}