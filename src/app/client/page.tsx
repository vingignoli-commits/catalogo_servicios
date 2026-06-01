import Link from "next/link";
import {
  Bell,
  CalendarDays,
  MessageCircle,
  Search,
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

type DashboardNotification = {
  id: string;
  title: string;
  content: string | null;
};

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

  const unreadNotifications: DashboardNotification[] =
  await prisma.notification.findMany({
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
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Panel cliente
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Gestioná tus turnos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Buscá profesionales, solicitá turnos, revisá estados, mensajes y
              reseñas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professionals"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Buscar profesionales
            </Link>

            <Link
              href="/logout"
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Salir
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mt-6 grid grid-cols-2 gap-3 sm:-mt-20 sm:gap-5 md:grid-cols-4">
          <MetricCard
            label="Activos"
            value={activeAppointmentsCount}
            description="Solicitados o aceptados"
          />

          <MetricCard
            label="Avisos"
            value={unreadNotifications.length}
            description="Sin leer"
            highlight={unreadNotifications.length > 0}
          />

          <MetricCard
            label="Mensajes"
            value={unreadMessagesCount}
            description="No leídos"
            highlight={unreadMessagesCount > 0}
          />

          <MetricCard
            label="Completados"
            value={completedAppointmentsCount}
            description="Finalizados"
          />
        </div>

        {unreadNotifications.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:mt-8 sm:p-6">
            <div className="flex items-center gap-3 text-blue-700">
              <Bell size={22} />
              <h2 className="text-lg font-bold text-blue-950 sm:text-xl">
                Notificaciones pendientes
              </h2>
            </div>

            <div className="mt-5 grid gap-3">
              {unreadNotifications.map((notification: DashboardNotification) => (
                <Link
                  key={notification.id}
                  href="/client/notifications"
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-4">
          <DashboardAction
            href="/professionals"
            icon={<Search size={24} />}
            title="Buscar"
            description="Encontrá servicios."
          />

          <DashboardAction
            href="/client/appointments"
            icon={<CalendarDays size={24} />}
            title="Mis turnos"
            description="Estados e historial."
          />

          <DashboardAction
            href="/client/messages"
            icon={<MessageCircle size={24} />}
            title="Mensajes"
            description={`${unreadMessagesCount} sin leer.`}
          />

          <DashboardAction
            href="/client/notifications"
            icon={<Bell size={24} />}
            title="Avisos"
            description={`${unreadNotifications.length} sin leer.`}
          />
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:mt-8 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Último movimiento
              </h2>

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
                className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Buscar profesionales
              </Link>
            )}
          </div>
        </section>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          <MobileNavItem href="/client" label="Inicio" icon={<CalendarDays size={20} />} />
          <MobileNavItem href="/professionals" label="Buscar" icon={<Search size={20} />} />
          <MobileNavItem href="/client/appointments" label="Turnos" icon={<CalendarDays size={20} />} />
          <MobileNavItem href="/client/messages" label="Mensajes" icon={<MessageCircle size={20} />} />
        </div>
      </nav>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string | number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-xl shadow-blue-950/10 sm:p-6 ${
        highlight
          ? "border-blue-300 bg-blue-50"
          : "border-blue-100 bg-white"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-wide sm:text-sm ${
          highlight ? "text-blue-700" : "text-blue-600"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold text-slate-950 sm:mt-3 sm:text-4xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
        {description}
      </p>
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
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-xl sm:p-6"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white sm:mb-5 sm:h-12 sm:w-12">
        {icon}
      </div>

      <h2 className="text-sm font-bold text-slate-950 sm:text-lg">{title}</h2>

      <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">
        {description}
      </p>
    </Link>
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
