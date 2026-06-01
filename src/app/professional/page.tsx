import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Clock3,
  MessageCircle,
  Settings,
  Star,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { StatusBadge } from "@/components/ui/status-badge";

type ActiveFlagItem = {
  isActive: boolean;
};

type DashboardNotification = {
  id: string;
  title: string;
  content: string | null;
};

type DashboardAppointment = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  service: {
    title: string;
    durationMinutes: number;
  };
  resource?: {
    name: string;
  } | null;
  client: {
    user: {
      name: string | null;
      email: string;
    };
  };
};

type DashboardReview = {
  id: string;
  rating: number;
  comment: string | null;
  client: {
    user: {
      name: string | null;
    };
  };
  appointment: {
    service: {
      title: string;
    };
  };
};

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getTodayRange() {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export default async function ProfessionalDashboardPage() {
  const user = await requireRole(["PROFESSIONAL"]);
  const { start, end } = getTodayRange();

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      services: true,
      resources: true,
      appointments: {
        orderBy: [{ updatedAt: "desc" }],
        take: 1,
        include: {
          service: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      },
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        include: {
          client: {
            include: {
              user: true,
            },
          },
          appointment: {
            include: {
              service: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/10 sm:p-8">
          <h1 className="text-2xl font-bold">Completá tu perfil</h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Antes de publicar servicios o recibir turnos, necesitás crear tu
            perfil profesional.
          </p>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Crear perfil profesional
          </Link>
        </section>
      </main>
    );
  }

  const services: ActiveFlagItem[] = profile.services;
  const resources: ActiveFlagItem[] = profile.resources;
  const reviews: DashboardReview[] = profile.reviews;
  const latestAppointments: DashboardAppointment[] = profile.appointments;

  const activeServicesCount = services.filter(
    (service: ActiveFlagItem) => service.isActive
  ).length;

  const activeResourcesCount = resources.filter(
    (resource: ActiveFlagItem) => resource.isActive
  ).length;

  const pendingAppointmentsCount = await prisma.appointment.count({
    where: {
      professionalId: profile.id,
      status: "REQUESTED",
    },
  });

  const acceptedAppointmentsCount = await prisma.appointment.count({
    where: {
      professionalId: profile.id,
      status: "ACCEPTED",
    },
  });

  const todayAppointments: DashboardAppointment[] =
    await prisma.appointment.findMany({
      where: {
        professionalId: profile.id,
        date: {
          gte: start,
          lte: end,
        },
        status: {
          in: ["REQUESTED", "ACCEPTED"],
        },
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

  const upcomingAppointments: DashboardAppointment[] =
    await prisma.appointment.findMany({
      where: {
        professionalId: profile.id,
        date: {
          gt: end,
        },
        status: {
          in: ["REQUESTED", "ACCEPTED"],
        },
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
      take: 5,
    });

  const unreadMessagesCount = await prisma.message.count({
    where: {
      senderId: {
        not: user.id,
      },
      readAt: null,
      conversation: {
        professionalId: profile.id,
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

  const lastAppointment = latestAppointments[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Panel profesional
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Operación diaria
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Turnos, agenda, solicitudes, mensajes, reputación y acciones
              rápidas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional/calendar"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Abrir agenda
            </Link>

            <Link
              href={`/professionals/${profile.id}`}
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Ver perfil público
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

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mt-6 grid grid-cols-2 gap-3 sm:-mt-20 sm:gap-5 md:grid-cols-5">
          <MetricCard
            label="Solicitudes"
            value={pendingAppointmentsCount}
            description="Pendientes"
            highlight={pendingAppointmentsCount > 0}
          />

          <MetricCard
            label="Aceptados"
            value={acceptedAppointmentsCount}
            description="Por completar"
            highlight={acceptedAppointmentsCount > 0}
          />

          <MetricCard
            label="Mensajes"
            value={unreadMessagesCount}
            description="No leídos"
            highlight={unreadMessagesCount > 0}
          />

          <MetricCard
            label="Rating"
            value={profile.averageRating.toFixed(1)}
            description={`${profile.reviewCount} reseña(s)`}
          />

          <MetricCard
            label="Servicios"
            value={activeServicesCount}
            description={`${activeResourcesCount} recurso(s) activos`}
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
              {unreadNotifications.map(
                (notification: DashboardNotification) => (
                  <Link
                    key={notification.id}
                    href="/professional/notifications"
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
                )
              )}
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9">
          <DashboardAction
            href="/professional/calendar"
            icon={<CalendarDays size={24} />}
            title="Agenda"
            description="Calendario semanal."
          />

          <DashboardAction
            href="/professional/calendar/day"
            icon={<CalendarClock size={24} />}
            title="Día"
            description="Operar agenda diaria."
          />

          <DashboardAction
            href="/professional/availability"
            icon={<Clock3 size={24} />}
            title="Disponibilidad"
            description="Reglas de horarios."
          />

          <DashboardAction
            href="/professional/appointments"
            icon={<CalendarClock size={24} />}
            title="Turnos"
            description={`${pendingAppointmentsCount} pendiente(s).`}
          />

          <DashboardAction
            href="/professional/messages"
            icon={<MessageCircle size={24} />}
            title="Mensajes"
            description={`${unreadMessagesCount} sin leer.`}
          />

          <DashboardAction
            href="/professional/notifications"
            icon={<Bell size={24} />}
            title="Notificaciones"
            description={`${unreadNotifications.length} sin leer.`}
          />

          <DashboardAction
            href="/professional/services"
            icon={<BriefcaseBusiness size={24} />}
            title="Servicios"
            description="Oferta comercial."
          />

          <DashboardAction
            href="/professional/resources"
            icon={<UsersRound size={24} />}
            title="Recursos"
            description="Personas o salas."
          />

          <DashboardAction
            href="/professional/reviews"
            icon={<Star size={24} />}
            title="Reseñas"
            description={`${profile.reviewCount} recibida(s).`}
          />
        </div>

        <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[1fr_420px] lg:gap-8">
          <section className="space-y-6 sm:space-y-8">
            <OperationalSection
              title="Turnos de hoy"
              description="Lo que requiere atención inmediata."
              emptyText="No hay turnos activos para hoy."
              appointments={todayAppointments}
            />

            <OperationalSection
              title="Próximos turnos"
              description="Agenda próxima confirmada o solicitada."
              emptyText="No hay próximos turnos activos."
              appointments={upcomingAppointments}
            />
          </section>

          <aside className="space-y-6 sm:space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold sm:text-2xl">
                Último movimiento
              </h2>

              {!lastAppointment ? (
                <p className="mt-3 text-sm text-slate-500">
                  Todavía no recibiste solicitudes.
                </p>
              ) : (
                <div className="mt-5">
                  <p className="text-lg font-bold">
                    {lastAppointment.service.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Cliente:{" "}
                    {lastAppointment.client.user.name ??
                      lastAppointment.client.user.email}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {lastAppointment.startTime} - {lastAppointment.endTime}
                  </p>

                  <div className="mt-4">
                    <StatusBadge status={lastAppointment.status} />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Últimas reseñas
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Señales de confianza pública.
                  </p>
                </div>

                <Link
                  href="/professional/reviews"
                  className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Ver todas
                </Link>
              </div>

              {reviews.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  Todavía no recibiste reseñas.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviews.map((review: DashboardReview) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: review.rating }).map(
                          (_: unknown, index: number) => (
                            <Star
                              key={index}
                              size={14}
                              fill="currentColor"
                            />
                          )
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-slate-700">
                        {review.comment}
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        {review.client.user.name ?? "Cliente verificado"} ·{" "}
                        {review.appointment.service.title}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Settings size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
                    Diferencia clave
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Agenda muestra turnos reales. Disponibilidad configura las
                    reglas.
                  </p>
                </div>
              </div>
            </section>
          </aside>
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
            icon={<Clock3 size={20} />}
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
          ? "border-amber-200 bg-amber-50"
          : "border-blue-100 bg-white"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-wide sm:text-sm ${
          highlight ? "text-amber-700" : "text-blue-600"
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
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-xl sm:p-5"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white sm:mb-4 sm:h-11 sm:w-11">
        {icon}
      </div>

      <h2 className="text-sm font-bold text-slate-950 sm:text-base">{title}</h2>

      <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">
        {description}
      </p>
    </Link>
  );
}

function OperationalSection({
  title,
  description,
  emptyText,
  appointments,
}: {
  title: string;
  description: string;
  emptyText: string;
  appointments: DashboardAppointment[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <Link
          href="/professional/calendar"
          className="text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          Ver agenda
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {appointments.map((appointment: DashboardAppointment) => (
            <article
              key={appointment.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-950">
                    {appointment.service.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Cliente:{" "}
                    {appointment.client.user.name ??
                      appointment.client.user.email}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 sm:gap-3 sm:text-sm">
                    <span>{formatDateDDMMYYYY(appointment.date)}</span>

                    <span>
                      {appointment.startTime} - {appointment.endTime}
                    </span>

                    <span>{appointment.service.durationMinutes} min</span>

                    <span>
                      Recurso:{" "}
                      {appointment.resource?.name ?? "Agenda general"}
                    </span>
                  </div>
                </div>

                <StatusBadge status={appointment.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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