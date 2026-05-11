import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { sendClientMessageAction } from "./actions";

function formatDate(date: Date) {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ClientConversationPage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {
  const { conversationId } = await params;
  const user = await requireRole(["CLIENT"]);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!clientProfile) {
    return notFound();
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      clientId: clientProfile.id,
    },
    include: {
      professional: {
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
        include: {
          sender: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    return notFound();
  }

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

  const professionalName =
    conversation.professional.user.name ??
    conversation.professional.user.email;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Mensajes
            </p>
            <h1 className="mt-3 text-3xl font-extrabold">
              {professionalName}
            </h1>
            <p className="mt-2 text-blue-100">
              {conversation.appointment?.service.title ?? "Conversación"}
            </p>
          </div>

          <Link
            href="/client/messages"
            className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {conversation.messages.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Todavía no hay mensajes.
              </p>
            ) : (
              conversation.messages.map((message) => {
                const isMine = message.senderId === user.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`mt-2 text-xs ${
                          isMine ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form action={sendClientMessageAction} className="mt-6">
            <input type="hidden" name="conversationId" value={conversation.id} />

            <label
              className="text-sm font-bold text-slate-800"
              htmlFor="content"
            >
              Mensaje
            </label>

            <textarea
              id="content"
              name="content"
              rows={4}
              required
              placeholder="Escribí tu consulta..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
            />

            <button
              type="submit"
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}