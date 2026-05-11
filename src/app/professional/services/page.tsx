import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  deleteServiceAction,
  toggleServiceStatusAction,
} from "./actions";

type ProfessionalServicesPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProfessionalServicesPage({
  searchParams,
}: ProfessionalServicesPageProps) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      services: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>
          <p className="mt-2 text-slate-300">
            Antes de publicar servicios necesitás tener un perfil profesional.
          </p>
          <Link
            href="/professional/profile"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Completar perfil
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Profesional
            </p>
            <h1 className="mt-3 text-3xl font-bold">Servicios</h1>
            <p className="mt-2 text-slate-300">
              Administrá los servicios que ofrecés a clientes.
            </p>
          </div>

          <Link
            href="/professional/services/new"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Nuevo servicio
          </Link>
        </div>

        {params.error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        {profile.services.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-xl font-semibold">Todavía no tenés servicios</h2>
            <p className="mt-2 text-slate-400">
              Creá tu primer servicio para que los clientes puedan solicitar
              turnos.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {profile.services.map((service) => (
              <article
                key={service.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{service.title}</h2>

                    <p className="mt-2 text-sm text-slate-400">
                      {service.description || "Sin descripción."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                      <span>${service.price.toString()}</span>
                      <span>{service.durationMinutes} min</span>
                      <span>{service.modality}</span>
                      <span>{service.isActive ? "Activo" : "Inactivo"}</span>
                      <span>{service._count.appointments} turnos</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/professional/services/${service.id}/edit`}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
                    >
                      Editar
                    </Link>

                    <form
                      action={async () => {
                        "use server";
                        await toggleServiceStatusAction(service.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
                      >
                        {service.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await deleteServiceAction(service.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border border-red-900 px-4 py-2 text-sm text-red-300"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Link
          href="/professional"
          className="mt-8 inline-block text-sm text-slate-400 hover:text-white"
        >
          Volver al panel
        </Link>
      </section>
    </main>
  );
}