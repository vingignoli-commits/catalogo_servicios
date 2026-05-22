import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";

const categories = [
  "Barbería",
  "Estética",
  "Salud",
  "Entrenamiento",
  "Consultoría",
  "Bienestar",
];

function formatRating(value: number) {
  return value.toFixed(1);
}

type FeaturedService = {
  id: string;
  title: string;
  price: {
    toString: () => string;
  };
};

type FeaturedProfessional = {
  id: string;
  businessName: string | null;
  bio: string | null;
  averageRating: number;
  reviewCount: number;
  user: {
    name: string | null;
    email: string;
  };
  services: FeaturedService[];
};

export default async function HomePage() {
  const featuredProfessionals: FeaturedProfessional[] =
  await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: true,
      services: {
        where: {
          isActive: true,
        },
        orderBy: {
          price: "asc",
        },
        take: 2,
      },
    },
    orderBy: [
      {
        averageRating: "desc",
      },
      {
        reviewCount: "desc",
      },
    ],
    take: 6,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white">
              <CalendarCheck2 size={22} />
            </div>

            <div>
              <p className="text-base font-extrabold leading-none">
                TurnoPro
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Reservas online
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/professionals"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Buscar profesionales
            </Link>

            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Ingresar
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
            >
              Crear cuenta
            </Link>
          </div>

          <Link
            href="/professionals"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 md:hidden"
          >
            Buscar
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.20),transparent_36%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Sparkles size={16} />
              Marketplace de servicios con agenda integrada
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Encontrá profesionales y reservá online sin vueltas.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Buscá servicios, compará perfiles, elegí horario disponible y
              gestioná tus turnos desde un solo lugar.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/professionals"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-600"
              >
                Buscar profesionales
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Soy profesional
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TrustItem icon={<Clock3 size={18} />} text="Reserva 24/7" />
              <TrustItem icon={<ShieldCheck size={18} />} text="Perfiles verificados" />
              <TrustItem icon={<MessageCircle size={18} />} text="Mensajes directos" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur sm:p-6">
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-950 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Search size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold">
                    ¿Qué necesitás reservar?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Elegí un profesional y un horario disponible.
                  </p>
                </div>
              </div>

              <form action="/professionals" className="mt-6 grid gap-3">
                <input
                  name="q"
                  placeholder="Ej: corte de pelo, masajes, nutrición..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none ring-blue-500 focus:ring-2"
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Buscar disponibilidad
                </button>
              </form>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {categories.slice(0, 4).map((category) => (
                  <Link
                    key={category}
                    href={`/professionals?category=${encodeURIComponent(
                      category
                    )}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-white px-4 py-12 text-slate-950 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                Categorías
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Servicios para reservar hoy
              </h2>
            </div>

            <Link
              href="/professionals"
              className="inline-flex items-center gap-2 text-sm font-black text-blue-600"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/professionals?category=${encodeURIComponent(category)}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <UserRoundCheck size={22} />
                </div>

                <h3 className="font-extrabold">{category}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Ver disponibilidad
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100 px-4 py-12 text-slate-950 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                Profesionales
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Perfiles destacados
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Elegí por reputación, servicios activos y disponibilidad.
              </p>
            </div>

            <Link
              href="/professionals"
              className="inline-flex items-center gap-2 text-sm font-black text-blue-600"
            >
              Explorar profesionales
              <ArrowRight size={16} />
            </Link>
          </div>

          {featuredProfessionals.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-500">
                Todavía no hay profesionales destacados.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredProfessionals.map((professional: FeaturedProfessional) => (
                <Link
                  key={professional.id}
                  href={`/professionals/${professional.id}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold">
                        {professional.businessName ??
                          professional.user.name ??
                          professional.user.email}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {professional.bio ??
                          "Profesional con agenda disponible online."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">
                      <Star size={14} fill="currentColor" />
                      {formatRating(professional.averageRating)}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {professional.services.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                        Sin servicios publicados.
                      </p>
                    ) : (
                      professional.services.map((service: FeaturedService) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                        >
                          <span className="truncate text-sm font-bold text-slate-700">
                            {service.title}
                          </span>

                          <span className="shrink-0 text-sm font-black text-blue-600">
                            ${service.price.toString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm font-black text-blue-600">
                    Ver perfil y reservar
                    <ArrowRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-4 py-12 text-slate-950 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            <StepCard
              number="1"
              title="Buscá"
              text="Encontrá profesionales por servicio, categoría o disponibilidad."
            />
            <StepCard
              number="2"
              title="Reservá"
              text="Elegí el horario que te conviene y solicitá el turno online."
            />
            <StepCard
              number="3"
              title="Gestioná"
              text="Recibí confirmaciones, mensajes, cambios y recordatorios."
            />
          </div>
        </div>
      </section>

      <section className="bg-blue-600 px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-100">
              Para profesionales
            </p>

            <h2 className="mt-3 max-w-3xl text-3xl font-black sm:text-4xl">
              Publicá tus servicios, organizá tu agenda y recibí reservas
              online.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Perfil público, disponibilidad, recursos, mensajes, reviews,
              bloqueos y calendario operativo.
            </p>
          </div>

          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-blue-700 transition hover:bg-blue-50"
          >
            Crear cuenta profesional
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 px-4 py-8 text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-white">TurnoPro</p>

          <div className="flex flex-wrap gap-4">
            <Link href="/professionals" className="hover:text-white">
              Buscar profesionales
            </Link>
            <Link href="/login" className="hover:text-white">
              Ingresar
            </Link>
            <Link href="/register" className="hover:text-white">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TrustItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100">
      <span className="text-blue-300">{icon}</span>
      {text}
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-black">{title}</h3>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>

      <div className="mt-5 flex items-center gap-2 text-sm font-black text-blue-600">
        <CheckCircle2 size={16} />
        Simple y online
      </div>
    </article>
  );
}
