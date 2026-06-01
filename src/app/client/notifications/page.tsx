import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  MessageCircle,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  markAllClientNotificationsAsReadAction,
  markClientNotificationAsReadAction,
} from "./actions";

type ClientNotificationItem = {
  id: string;
  type: string;
  title: string;
  content: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
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

function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    APPOINTMENT_REQUESTED: "Solicitud de turno",
    APPOINTMENT_ACCEPTED: "Turno aceptado",
    APPOINTMENT_REJECTED: "Turno rechazado",
    APPOINTMENT_COMPLETED: "Turno completado",
    APPOINTMENT_CANCELLED_BY_PROFESSIONAL: "Turno cancelado",
    MESSAGE_RECEIVED: "Mensaje recibido",
  };

  return labels[type] ?? type;
}

export default async function ClientNotificationsPage() {
  const user = await requireRole(["CLIENT"]);

  const notifications: ClientNotificationItem[] =
    await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
    });

  const unreadCount = notifications.filter(
    (notification: ClientNotificationItem) => !notification.readAt
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Cliente
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Notificaciones
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Novedades de turnos, mensajes y respuestas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/client"
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section
          className={`rounded-3xl border p-5 shadow-xl shadow-blue-950/10 sm:p-6 ${
            unreadCount > 0
              ? "border-blue-300 bg-blue-50"
              : "border-blue-100 bg-white"
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white sm:h-12 sm:w-12">
                <Bell size={24} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 sm:text-sm">
                  Sin leer
                </p>

                <p className="text-3xl font-extrabold text-slate-950">
                  {unreadCount}
                </p>
              </div>
            </div>

            {unreadCount > 0 ? (
              <form action={markAllClientNotificationsAsReadAction}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  <CheckCheck size={18} />
                  Marcar todas leídas
                </button>
              </form>
            ) : null}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mt-8 sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Bandeja</h2>

          {notifications.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 sm:mt-8">
              No hay notificaciones.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:mt-8">
              {notifications.map((notification: ClientNotificationItem) => {
                const isUnread = !notification.readAt;

                return (
                  <article
                    key={notification.id}
                    className={`rounded-3xl border p-5 transition sm:p-6 ${
                      isUnread
                        ? "border-blue-400 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              isUnread
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isUnread ? "Nueva" : "Leída"}
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        </div>

                        <h3
                          className={`mt-4 text-base sm:text-lg ${
                            isUnread
                              ? "font-extrabold text-blue-950"
                              : "font-bold text-slate-950"
                          }`}
                        >
                          {notification.title}
                        </h3>

                        {notification.content ? (
                          <p
                            className={`mt-2 text-sm ${
                              isUnread
                                ? "font-semibold text-slate-800"
                                : "text-slate-600"
                            }`}
                          >
                            {notification.content}
                          </p>
                        ) : null}

                        <p className="mt-3 text-xs text-slate-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 md:w-[180px]">
                        {notification.actionUrl ? (
                          <form action={markClientNotificationAsReadAction}>
                            <input
                              type="hidden"
                              name="notificationId"
                              value={notification.id}
                            />
                            <input
                              type="hidden"
                              name="actionUrl"
                              value={notification.actionUrl}
                            />

                            <button
                              type="submit"
                              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 md:py-2"
                            >
                              Abrir
                            </button>
                          </form>
                        ) : null}

                        {isUnread ? (
                          <form action={markClientNotificationAsReadAction}>
                            <input
                              type="hidden"
                              name="notificationId"
                              value={notification.id}
                            />
                            <input
                              type="hidden"
                              name="actionUrl"
                              value="/client/notifications"
                            />

                            <button
                              type="submit"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 md:py-2"
                            >
                              Marcar leída
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
