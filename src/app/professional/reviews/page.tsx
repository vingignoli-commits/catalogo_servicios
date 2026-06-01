import Link from "next/link";
import { Star } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

import { replyReviewAction } from "./actions";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  professionalReply: string | null;
  createdAt: Date;
  client: {
    user: {
      name: string | null;
      email: string;
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

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_: unknown, index: number) => (
    <Star
      key={index}
      size={16}
      className={
        index < rating
          ? "fill-amber-400 text-amber-400"
          : "text-slate-300"
      }
    />
  ));
}

export default async function ProfessionalReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await requireRole(["PROFESSIONAL"]);

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!professional) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Perfil profesional inexistente
          </h1>

          <p className="mt-2 text-sm text-red-600">
            Debés completar tu perfil.
          </p>
        </section>
      </main>
    );
  }

  const reviews: ReviewItem[] = await prisma.review.findMany({
    where: {
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const answeredReviewsCount = reviews.filter(
    (review: ReviewItem) => Boolean(review.professionalReply)
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">
              Reseñas recibidas
            </h1>

            <p className="mt-3 max-w-2xl text-blue-100">
              Gestioná reputación, respuestas públicas y experiencia de clientes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/professional"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Promedio
            </p>

            <p className="mt-3 text-4xl font-extrabold text-slate-950">
              {professional.averageRating.toFixed(1)}
            </p>
          </article>

          <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Cantidad
            </p>

            <p className="mt-3 text-4xl font-extrabold text-slate-950">
              {professional.reviewCount}
            </p>
          </article>

          <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Respondidas
            </p>

            <p className="mt-3 text-4xl font-extrabold text-slate-950">
              {answeredReviewsCount}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold">Opiniones verificadas</h2>

            <p className="mt-2 text-sm text-slate-500">
              Solo pueden opinar clientes que completaron un turno.
            </p>
          </div>

          {reviews.length === 0 ? (
            <p className="mt-8 text-sm text-slate-500">
              Todavía no recibiste reseñas.
            </p>
          ) : (
            <div className="mt-8 space-y-6">
              {reviews.map((review: ReviewItem) => (
                <article
                  key={review.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-950">
                        {review.client.user.name ?? review.client.user.email}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {review.appointment.service.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateDDMMYYYY(review.createdAt)}
                      </p>

                      {review.comment ? (
                        <p className="mt-5 leading-relaxed text-slate-700">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-5 text-sm text-slate-400">
                          Sin comentario escrito.
                        </p>
                      )}
                    </div>

                    <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                      {review.rating}/5
                    </div>
                  </div>

                  {review.professionalReply ? (
                    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <p className="text-sm font-bold text-blue-900">
                        Tu respuesta pública
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {review.professionalReply}
                      </p>
                    </div>
                  ) : (
                    <form action={replyReviewAction} className="mt-6 space-y-4">
                      <input type="hidden" name="reviewId" value={review.id} />

                      <div>
                        <label className="text-sm font-bold text-slate-800">
                          Respuesta pública
                        </label>

                        <textarea
                          name="professionalReply"
                          rows={4}
                          required
                          minLength={2}
                          maxLength={1000}
                          placeholder="Responder reseña..."
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Publicar respuesta
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
