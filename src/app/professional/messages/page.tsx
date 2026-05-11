import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

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

  const conversations = profile
    ? await prisma.conversation.findMany({
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
            take: 1,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">Mensajes</h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Conversaciones vinculadas a tus turnos.
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

      <section className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} className="text-blue-600" />
            <h2 className="text-2xl font-bold">Conversaciones</h2>
          </div>

          {conversations.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Todavía no tenés conversaciones.
            </p>
          ) : (
            <div className="mt-8 grid gap-4">
              {conversations.map((conversation) => {
                const clientName =
                  conversation.client.user.name ?? conversation.client.user.email;

                const lastMessage = conversation.messages[0];

                return (
                  <Link
                    key={conversation.id}
                    href={`/professional/messages/${conversation.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {clientName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {conversation.appointment?.service.title ??
                            "Conversación"}
                        </p>

                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                          {lastMessage?.content ?? "Sin mensajes todavía."}
                        </p>
                      </div>

                      <p className="text-xs font-medium text-slate-500">
                        {lastMessage
                          ? formatDate(lastMessage.createdAt)
                          : formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}