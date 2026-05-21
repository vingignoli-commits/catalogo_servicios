import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { markProfessionalConversationAsUnreadAction } from "./actions";

function formatDate(date: Date) {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProfessionalMessagesPage() {
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Perfil profesional inexistente</h1>
          <p className="mt-2 text-sm text-red-600">
            Primero completá tu perfil profesional.
          </p>
        </section>
      </main>
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      professionalId: profile.id,
    },
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
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const enrichedConversations = conversations.map((conversation) => {
    const unreadMessages = conversation.messages.filter(
      (message) => message.senderId !== user.id && !message.readAt
    );

    return {
      ...conversation,
      lastMessage: conversation.messages[0] ?? null,
      unreadMessagesCount: unreadMessages.length,
    };
  });

  const unreadTotal = enrichedConversations.reduce(
    (acc, conversation) => acc + conversation.unreadMessagesCount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Profesional
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Mensajes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Conversaciones vinculadas a turnos y clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional"
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
            unreadTotal > 0
              ? "border-blue-300 bg-blue-50"
              : "border-blue-100 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white sm:h-12 sm:w-12">
              <MessageCircle size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 sm:text-sm">
                Mensajes sin leer
              </p>
              <p className="text-3xl font-extrabold text-slate-950">
                {unreadTotal}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:mt-8 sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Conversaciones</h2>

          {enrichedConversations.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 sm:mt-8">
              Todavía no tenés conversaciones.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:mt-8">
              {enrichedConversations.map((conversation) => {
                const hasUnread = conversation.unreadMessagesCount > 0;
                const clientName =
                  conversation.client.user.name ?? conversation.client.user.email;

                return (
                  <article
                    key={conversation.id}
                    className={`rounded-3xl border p-5 transition sm:p-6 ${
                      hasUnread
                        ? "border-blue-400 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <Link
                        href={`/professional/messages/${conversation.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3
                            className={`text-base sm:text-lg ${
                              hasUnread
                                ? "font-extrabold text-blue-950"
                                : "font-bold text-slate-950"
                            }`}
                          >
                            {clientName}
                          </h3>

                          {hasUnread ? (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                              {conversation.unreadMessagesCount} nuevo(s)
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                              Leído
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {conversation.appointment?.service.title ??
                            "Conversación"}
                        </p>

                        {conversation.lastMessage ? (
                          <>
                            <p
                              className={`mt-4 line-clamp-2 text-sm ${
                                hasUnread
                                  ? "font-bold text-slate-950"
                                  : "text-slate-600"
                              }`}
                            >
                              {conversation.lastMessage.content}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              {formatDate(conversation.lastMessage.createdAt)}
                            </p>
                          </>
                        ) : null}
                      </Link>

                      <div className="flex w-full shrink-0 flex-col gap-2 md:w-[180px]">
                        <Link
                          href={`/professional/messages/${conversation.id}`}
                          className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700 md:py-2"
                        >
                          Abrir
                        </Link>

                        {!hasUnread && conversation.lastMessage ? (
                          <form
                            action={
                              markProfessionalConversationAsUnreadAction
                            }
                          >
                            <input
                              type="hidden"
                              name="conversationId"
                              value={conversation.id}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 md:py-2"
                            >
                              Marcar no leído
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
        <div className="grid grid-cols-5 gap-1">
          <MobileNavItem href="/professional" label="Inicio" icon={<CalendarDays size={20} />} />
          <MobileNavItem href="/professional/calendar/day" label="Día" icon={<CalendarClock size={20} />} />
          <MobileNavItem href="/professional/appointments" label="Turnos" icon={<CalendarClock size={20} />} />
          <MobileNavItem href="/professional/messages" label="Mensajes" icon={<MessageCircle size={20} />} />
          <MobileNavItem href="/professional/notifications" label="Avisos" icon={<Bell size={20} />} />
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