import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock3, MapPin, Star } from "lucide-react";

import { prisma } from "@/lib/db/prisma";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageShell } from "@/components/ui/page-shell";
import { StarRating } from "@/components/reviews/star-rating";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatRating(value: number) {
  return value.toFixed(1);
}

function getMapEmbedUrl(location: string) {
  const query = encodeURIComponent(location);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

type PublicService = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  price: { toString: () => string };
  isActive: boolean;
  modality: string;
};

type ProfessionalListItem = {
  id: string;
  businessName: string | null;
  bio: string | null;
  averageRating: number;
  reviewCount: number;
  profileImageUrl: string | null;
  user: {
    name: string | null;
    email: string;
  };
  services: {
    id: string;
    title: string;
    price: {
      toString: () => string;
    };
  }[];
};

export default async function ProfessionalPublicPage({ params }: Props) {
  const { id } = await params;

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      services: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!professional || !professional.isActive) {
    return notFound();
  }

  const reviews = await prisma.review.findMany({
    where: {
      professionalId: professional.id,
    },
    include: {
      client: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  const displayName =
    professional.user.name ?? professional.user.email.split("@")[0];

  const mapUrl = professional.location
    ? getMapEmbedUrl(professional.location)
    : null;

  return (
    <PageShell
      variant="public"
      backHref="/professionals"
      eyebrow="Perfil profesional"
      title={displayName}
      subtitle={professional.specialty || "Servicios profesionales"}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <AppCard className="overflow-hidden p-0">
            <div className="relative h-80 overflow-hidden">
              <img
                src={
                  professional.avatarUrl ||
                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                }
                alt={displayName}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6">
                <span className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  Profesional verificado
                </span>

                <h1 className="mt-5 text-4xl font-extrabold text-white">
                  {displayName}
                </h1>

                <p className="mt-2 text-lg text-slate-200">
                  {professional.specialty || "Servicios profesionales"}
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>
                        {professional.location || "Ubicación no especificada"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 size={16} />
                      <span>{professional.services.length} servicio(s)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Star size={18} fill="currentColor" />
                    <span className="text-3xl font-extrabold">
                      {formatRating(professional.averageRating)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {professional.reviewCount} reseñas
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-xl font-bold text-slate-950">
                  Sobre el profesional
                </h2>

                <p className="mt-4 leading-relaxed text-slate-600">
                  {professional.bio ||
                    "Este profesional todavía no agregó una descripción detallada."}
                </p>
              </div>
            </div>
          </AppCard>

          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950">
                Servicios disponibles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Elegí el servicio y reservá online.
              </p>
            </div>

            {professional.services.length === 0 ? (
              <AppCard>
                <p className="text-sm text-slate-500">
                  Este profesional todavía no tiene servicios activos.
                </p>
              </AppCard>
            ) : (
              <div className="space-y-5">
                {professional.services.map((service: PublicService) => (
                  <AppCard
                    key={service.id}
                    className="border-slate-100 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">
                          {service.title}
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                          {service.description ||
                            "Servicio profesional disponible para reserva."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                            <Clock3 size={15} />
                            <span>{service.durationMinutes} min</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700">
                            <Calendar size={15} />
                            <span>{service.modality}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-4 md:items-end">
                        <span className="text-3xl font-extrabold text-blue-600">
                          ${service.price.toString()}
                        </span>

                        <AppButton
                          href={`/professionals/${professional.id}/slots?serviceId=${service.id}`}
                        >
                          Reservar turno
                        </AppButton>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950">Ubicación</h2>

              <p className="mt-1 text-sm text-slate-500">
                Dirección declarada por el profesional.
              </p>
            </div>

            <AppCard className="overflow-hidden p-0">
              {mapUrl ? (
                <>
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="mt-1 text-blue-600" />
                      <div>
                        <p className="font-bold text-slate-950">Dirección</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {professional.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  <iframe
                    src={mapUrl}
                    className="h-80 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-slate-500">
                    Este profesional todavía no cargó una dirección.
                  </p>
                </div>
              )}
            </AppCard>
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950">
                Reseñas reales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Opiniones verificadas de clientes que completaron un turno.
              </p>
            </div>

            {reviews.length === 0 ? (
              <AppCard>
                <p className="text-sm text-slate-500">
                  Este profesional todavía no tiene reseñas.
                </p>
              </AppCard>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: {
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
                }) => (
                  <AppCard key={review.id} className="border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.client.user.name ?? "Cliente verificado"}
                        </p>

                        <div className="mt-2">
                          <StarRating rating={review.rating} size="sm" />
                        </div>

                        <p className="mt-3 leading-relaxed text-slate-600">
                          {review.comment}
                        </p>

                        {review.professionalReply ? (
                          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-sm font-bold text-blue-900">
                              Respuesta del profesional
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {review.professionalReply}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-blue-50 px-4 py-2 text-blue-600">
                        <Star size={14} fill="currentColor" />
                        <span className="font-bold">{review.rating}/5</span>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <AppCard className="sticky top-24 border-blue-100">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-blue-100">
                {professional.avatarUrl ? (
                  <img
                    src={professional.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-blue-700">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                Reservá online
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Elegí un servicio, seleccioná disponibilidad y solicitá tu turno
                en minutos.
              </p>

              <div className="mt-8 space-y-3">
                {professional.services.slice(0, 3).map((service: PublicService) => (
                  <AppButton
                    key={service.id}
                    href={`/professionals/${professional.id}/slots?serviceId=${service.id}`}
                    className="w-full"
                  >
                    {service.title}
                  </AppButton>
                ))}
              </div>
            </div>
          </AppCard>

          <AppCard className="border-slate-100 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-950">
              Información rápida
            </h3>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Servicios activos</span>

                <span className="font-bold text-slate-900">
                  {professional.services.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Calificación</span>

                <span className="font-bold text-blue-600">
                  {formatRating(professional.averageRating)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reseñas</span>

                <span className="font-bold text-slate-900">
                  {professional.reviewCount}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-slate-500">Dirección</p>
                <p className="mt-1 font-bold text-slate-900">
                  {professional.location || "Sin dirección cargada"}
                </p>
              </div>
            </div>
          </AppCard>
        </aside>
      </div>
    </PageShell>
  );
}
