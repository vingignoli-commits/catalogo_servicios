import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

import { createReviewAction } from "./actions";

export default async function AppointmentReviewPage({
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
  });

  if (!appointment) {
    return notFound();
  }

  if (appointment.status !== "COMPLETED") {
    return notFound();
  }

  if (appointment.reviews.length > 0) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold">Ya dejaste una reseña</h1>

          <p className="mt-3 text-sm text-slate-500">
            Cada turno permite una única reseña.
          </p>

          <Link
            href={`/client/appointments/${appointment.id}`}
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Volver
          </Link>
        </section>
      </main>
    );
  }

  const professionalName =
    appointment.professional.user.name ?? appointment.professional.user.email;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
            Reseña
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            ¿Cómo fue tu experiencia?
          </h1>

          <p className="mt-3 max-w-2xl text-blue-100">
            Tu opinión ayuda a otros usuarios a elegir mejor.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold">{appointment.service.title}</h2>

            <p className="mt-2 text-sm text-slate-500">
              Profesional: {professionalName}
            </p>
          </div>

          <form action={createReviewAction} className="mt-8 space-y-6">
            <input
              type="hidden"
              name="appointmentId"
              value={appointment.id}
            />

            <div>
              <label className="text-sm font-bold text-slate-800">
                Calificación
              </label>

              <select
                name="rating"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
              >
                <option value="">Seleccionar</option>
                <option value="5">5 - Excelente</option>
                <option value="4">4 - Muy bueno</option>
                <option value="3">3 - Bueno</option>
                <option value="2">2 - Malo</option>
                <option value="1">1 - Muy malo</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="text-sm font-bold text-slate-800"
              >
                Comentario
              </label>

              <textarea
                id="comment"
                name="comment"
                rows={6}
                required
                minLength={5}
                maxLength={1000}
                placeholder="Contá cómo fue la experiencia..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Publicar reseña
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}