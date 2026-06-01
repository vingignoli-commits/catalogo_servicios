import Link from "next/link";
import { MapPin, Search, Star } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { AppCard } from "@/components/ui/app-card";
import { AppButton } from "@/components/ui/app-button";
import { PageShell } from "@/components/ui/page-shell";

type ProfessionalsPageProps = {
  searchParams: Promise<{
    q?: string;
    location?: string;
  }>;
};

type ProfessionalListItem = {
  id: string;
  businessName: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  averageRating: number;
  reviewCount: number;

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

export default async function ProfessionalsPage({
  searchParams,
}: ProfessionalsPageProps) {
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const location = params.location?.trim() ?? "";

  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      AND: [
        q
          ? {
              OR: [
                {
                  specialty: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  bio: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  services: {
                    some: {
                      title: {
                        contains: q,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {},
        location
          ? {
              location: {
                contains: location,
                mode: "insensitive",
              },
            }
          : {},
      ],
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
        take: 2,
      },
    },
    orderBy: [
      {
        averageRating: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return (
    <PageShell
      variant="public"
      eyebrow="Marketplace"
      title="Encontrá profesionales disponibles"
      subtitle="Buscá por servicio, especialidad o ubicación. Entrá al perfil, revisá servicios y solicitá turno."
      actionHref="/"
      actionLabel="Inicio"
    >
      <form
        action="/professionals"
        className="mb-10 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Servicio o especialidad"
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <MapPin size={20} className="text-slate-400" />
            <input
              type="text"
              name="location"
              defaultValue={location}
              placeholder="Ubicación"
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <AppButton type="submit" size="md" className="w-full md:w-auto">
            Buscar
          </AppButton>
        </div>
      </form>

      {professionals.length === 0 ? (
        <AppCard className="py-12 text-center">
          <h2 className="text-xl font-bold text-slate-950">
            No encontramos profesionales
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Probá con otra especialidad, servicio o ubicación. La base todavía
            está creciendo; no culpemos al algoritmo, todavía está aprendiendo a
            caminar.
          </p>

          <AppButton href="/professionals" variant="secondary" className="mt-6">
            Limpiar búsqueda
          </AppButton>
        </AppCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <Link key={professional.id} href={`/professionals/${professional.id}`}>
              <AppCard className="h-full overflow-hidden p-0 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={
                      professional.avatarUrl ||
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"
                    }
                    alt={professional.user.name ?? professional.user.email}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />

                  <span className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                    Verificado
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">
                        {professional.user.name ??
                          professional.user.email.split("@")[0]}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {professional.specialty || "Servicios profesionales"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">
                        {professional.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {professional.bio ||
                      "Perfil profesional disponible para solicitudes de turno."}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />
                    <span>{professional.location || "Sin ubicación"}</span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    {professional.services.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Sin servicios activos.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {professional.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span className="font-medium text-slate-700">
                              {service.title}
                            </span>
                            <span className="font-bold text-blue-600">
                              ${service.price.toString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <span className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-blue-600 hover:text-white">
                      Ver perfil y reservar
                    </span>
                  </div>
                </div>
              </AppCard>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
