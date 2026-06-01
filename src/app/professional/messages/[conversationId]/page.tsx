import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  MessageCircle,
  Send,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

type ConversationMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
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

export default async function ProfessionalConversationPage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {
  const { conversationId } = await params;
  const user = await requireRole(["PROFESSIONAL"]);

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!professional) {
    redirect("/professional/profile");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      professionalId: professional.id,
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
          createdAt: "asc",
        },
        include: {
          sender: true,
        },
      },
    },
  });

  if (!conversation) {
    redirect("/professional/messages");
  }

  const messages: ConversationMessage[] = conversation.messages;

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: {
        not: user.id,
      },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  async function sendProfessionalMessageAction(formData: FormData) {
    "use server";

    const currentUser = await requireRole(["PROFESSIONAL"]);
    const content = String(formData.get("content") ?? "").trim();

    if (!content) {
      redirect(`/professional/messages/${conversationId}`);
    }

    const currentProfessional = await prisma.professionalProfile.findUnique({
      where: {
        userId: currentUser.id,
      },
    });

    if (!currentProfessional) {
      redirect("/professional/profile");
    }

    const validConversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        professionalId: currentProfessional.id,
      },
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!validConversation) {
      redirect("/professional/messages");
    }

    await prisma.message.create({
      data: {
        conversationId: validConversation.id,
        senderId: currentUser.id,
        content,
      },
    });

    await prisma.conversation.update({
      where: {
        id: validConversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: validConversation.client.user.id,
        type: "MESSAGE_RECEIVED",
        title: "Nuevo mensaje",
        content: "Tenés un nuevo mensaje del profesional.",
        actionUrl: `/client/messages/${validConversation.id}`,
        entityType: "CONVERSATION",
        entityId: validConversation.id,
      },
    });

    redirect(`/professional/messages/${validConversation.id}`);
  }

  const clientName =
    conversation.client.user.name ?? conversation.client.user.email;

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-950 md:pb-0">
      <section className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100 sm:text-sm">
              Conversación
            </p>

            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {clientName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              {conversation.appointment?.service.title ?? "Mensajes"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professional/messages"
              className="rounded-xl border border-blue-300 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h2 className="text-xl font-bold sm:text-2xl">Mensajes</h2>

            <p className="mt-1 text-sm text-slate-500">
              Los mensajes recibidos quedan marcados como leídos al abrir esta
              conversación.
            </p>
          </div>

          <div className="max-h-[62vh] space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Todavía no hay mensajes.
              </p>
            ) : (
              messages.map((message: ConversationMessage) => {
                const isMine = message.senderId === user.id;

                return (
                  <article
                    key={message.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-950"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>

                      <p
                        className={`mt-2 text-[11px] ${
                          isMine ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <form
            action={sendProfessionalMessageAction}
            className="border-t border-slate-200 p-4 sm:p-6"
          >
            <label className="text-sm font-bold text-slate-800">
              Nuevo mensaje
            </label>

            <textarea
              name="content"
              rows={4}
              required
              minLength={1}
              placeholder="Escribí tu mensaje..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
            />

            <button
              type="submit"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 sm:w-auto"
            >
              <Send size={18} />
              Enviar mensaje
            </button>
          </form>
        </section>
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