/*import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getDashboardPathByRole(user.role));
}
*/

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  MapPin,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";

export default async function HomePage() {
  const user = await getCurrentUser();

  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      services: {
        some: {
          isActive: true,
        },
      },
    },
    include: {
      user: true,
      services: {
        where: {
          isActive: true,
        },
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
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
    take: 4,
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-black text-slate-950">
            MarketplaceSaaS
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/professionals" className="hover:text-blue-600">
              Profesionales
            </Link>
            <Link href="/register" className="hover:text-blue-600">
              Soy profesional
            </Link>
            {user ? (
              <Link
                href={getDashboardPathByRole(user.role)}
                className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Mi panel
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="relative flex h-[520px] items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          alt="Espacio profesional moderno"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.32]"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Encontrá profesionales de confianza y reservá en minutos
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-200 md:text-xl">
            Una plataforma para descubrir servicios, comparar profesionales,
            consultar disponibilidad y solicitar turnos online.
          </p>

          <form
            action="/professionals"
            className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 border-b border-slate-100 px-4 py-2 md:border-b-0 md:border-r">
              <Search size={20} className="text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="¿Qué servicio buscás?"
                className="w-full text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-1 items-center gap-3 border-b border-slate-100 px-4 py-2 md:border-b-0 md:border-r">
              <MapPin size={20} className="text-slate-400" />
              <input
                type="text"
                name="location"
                placeholder="Ubicación"
                className="w-full text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              BUSCAR
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900">
              Categorías populares
            </h2>
            <p className="text-slate-500">
              Explorá servicios frecuentes y encontrá profesionales disponibles.
            </p>
          </div>

          <Link
            href="/professionals"
            className="hidden items-center gap-1 font-semibold text-blue-600 hover:underline md:flex"
          >
            VER TODAS <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            href="/professionals"
            className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl shadow-lg md:col-span-1 md:row-span-2"
          >
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
              alt="Salud"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8">
              <h3 className="mb-2 text-2xl font-bold text-white">
                Salud & Bienestar
              </h3>
              <p className="text-sm text-slate-200">
                Profesionales, terapias y servicios de bienestar
              </p>
            </div>
          </Link>

          <Link
            href="/professionals"
            className="group relative h-60 cursor-pointer overflow-hidden rounded-3xl shadow-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"
              alt="Educación"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent p-6">
              <h3 className="mb-1 text-xl font-bold text-white">Educación</h3>
              <p className="text-xs text-slate-200">
                Clases, tutorías y formación profesional
              </p>
            </div>
          </Link>

          <div className="grid h-60 grid-cols-2 gap-6">
            <Link
              href="/professionals"
              className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=400"
                alt="Hogar"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-black/40 p-4">
                <h3 className="text-sm font-bold text-white">Hogar</h3>
              </div>
            </Link>

            <Link
              href="/professionals"
              className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=400"
                alt="Empresas"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-black/40 p-4">
                <h3 className="text-sm font-bold text-white">Empresas</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12">
            <h2 className="mb-2 text-3xl font-bold text-slate-900">
              Profesionales destacados
            </h2>
            <p className="text-slate-500">
              Basado en calificaciones, trayectoria y servicios disponibles.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {professionals.length > 0 ? (
              professionals.map((pro) => (
                <Link
                  key={pro.id}
                  href={`/professionals/${pro.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        pro.avatarUrl ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                      }
                      alt={pro.user.email}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow-md">
                      Verificado
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                        {pro.user.name ?? pro.user.email.split("@")[0]}
                      </h4>

                      <div className="flex items-center gap-1 text-blue-600">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-bold">
                          {pro.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <p className="mb-4 text-sm text-slate-500">
                      {pro.specialty || "Servicios profesionales"}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="font-bold text-blue-600">
                        {pro.services[0]
                          ? `$${pro.services[0].price.toString()}`
                          : "Consultar"}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 transition-all group-hover:bg-blue-600 group-hover:text-white">
                        RESERVAR
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-slate-500">
                No se encontraron profesionales registrados en este momento.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24">
        <h2 className="mb-20 text-center text-4xl font-bold text-slate-900">
          ¿Cómo funciona MarketplaceSaaS?
        </h2>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[40px] border border-blue-100 bg-blue-50/50 p-10">
            <div className="absolute right-0 top-0 p-8 text-blue-100">
              <PlayCircle size={120} />
            </div>

            <div className="relative z-10">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Search size={24} />
              </div>

              <h3 className="mb-8 text-2xl font-bold text-slate-900">
                Para clientes
              </h3>

              <ul className="space-y-8">
                {[
                  {
                    title: "Buscá el servicio",
                    desc: "Filtrá por especialidad, ubicación y disponibilidad.",
                  },
                  {
                    title: "Elegí un profesional",
                    desc: "Compará perfiles, servicios, horarios y reseñas reales.",
                  },
                  {
                    title: "Reservá online",
                    desc: "Solicitá el turno y seguí el estado desde tu panel.",
                  },
                ].map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="text-lg font-bold text-blue-600">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-10 text-white">
            <div className="absolute right-0 top-0 p-8 text-slate-800">
              <ShieldCheck size={120} />
            </div>

            <div className="relative z-10">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <UserPlus size={24} />
              </div>

              <h3 className="mb-8 text-2xl font-bold">Para profesionales</h3>

              <ul className="space-y-8">
                {[
                  {
                    title: "Creá tu perfil",
                    desc: "Mostrá tu experiencia, servicios y propuesta profesional.",
                  },
                  {
                    title: "Gestioná tu agenda",
                    desc: "Definí horarios, excepciones y disponibilidad real.",
                  },
                  {
                    title: "Hacé crecer tu demanda",
                    desc: "Recibí solicitudes, completá servicios y construí reputación.",
                  },
                ].map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="text-lg font-bold text-blue-400">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="mb-6 text-4xl font-extrabold md:text-5xl">
            Empezá a gestionar servicios mejor
          </h2>

          <p className="mb-10 text-lg text-blue-100">
            Clientes encuentran profesionales. Profesionales ordenan su agenda.
            Todos pierden menos tiempo.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-4 font-bold text-blue-600 shadow-xl transition-all hover:bg-blue-50 active:scale-95"
            >
              Crear cuenta gratis
            </Link>

            <Link
              href="/professionals"
              className="rounded-xl border border-blue-400 bg-blue-700/50 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
            >
              Ver profesionales
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-4 py-16 text-slate-400">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 border-b border-slate-900 pb-12 md:grid-cols-4">
          <div>
            <span className="mb-6 block text-xl font-bold text-white">
              MarketplaceSaaS
            </span>
            <p className="text-sm leading-relaxed">
              Plataforma para gestión, contratación y reputación de servicios
              profesionales.
            </p>
          </div>

          <FooterColumn
            title="Plataforma"
            items={[
              ["Marketplace", "/professionals"],
              ["Crear cuenta", "/register"],
              ["Ingresar", "/login"],
            ]}
          />

          <FooterColumn
            title="Profesionales"
            items={[
              ["Publicar servicios", "/register"],
              ["Panel profesional", "/professional"],
              ["Turnos", "/professional/appointments"],
            ]}
          />

          <FooterColumn
            title="Clientes"
            items={[
              ["Buscar profesionales", "/professionals"],
              ["Mis turnos", "/client/appointments"],
              ["Panel cliente", "/client"],
            ]}
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between pt-8 text-xs">
          <p>© 2026 MarketplaceSaaS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div>
      <h5 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">
        {title}
      </h5>

      <ul className="space-y-4 text-sm">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition-colors hover:text-blue-500">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}