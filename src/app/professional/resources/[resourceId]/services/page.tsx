import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Settings } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { updateResourceServicesAction } from "./actions";

function getResourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PERSON: "Persona",
    ROOM: "Sala / consultorio",
    CHAIR: "Silla / puesto",
    EQUIPMENT: "Equipo",
    OTHER: "Otro",
  };

  return labels[type] ?? type;
}

type ResourceServicesPageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function ResourceServicesPage({
  params,
}: ResourceServicesPageProps) {
  const { resourceId } = await params;

  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    redirect("/professional/profile");
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      professionalId: profile.id,
    },
    include: {
      services: {
        select: {
          serviceId: true,
        },
      },
    },
  });

  if (!resource) {
    redirect("/professional/resources");
  }

  const services = await prisma.service.findMany({
    where: {
      professionalId: profile.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const selectedServiceIds = new Set(
    resource.services.map((resourceService) => resourceService.serviceId)
  );

  const updateResourceServicesWithId = updateResourceServicesAction.bind(
    null,
    resource.id
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Recursos
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Servicios de {resource.name}
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Definí qué servicios puede atender este recurso. Esto prepara el
              sistema para agendas por barbero, sala, puesto o consultorio.
            </p>
          </div>

          <Link
            href="/professional/resources"
            className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Settings size={34} />
              </div>

              <h2 className="mt-5 text-center text-xl font-bold">
                {resource.name}
              </h2>

              <p className="mt-2 text-center text-sm text-slate-500">
                {getResourceTypeLabel(resource.type)}
              </p>

              {resource.description ? (
                <p className="mt-5 text-center text-sm leading-relaxed text-slate-600">
                  {resource.description}
                </p>
              ) : null}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-bold text-slate-950">Estado</p>
                <p className="mt-1 text-slate-500">
                  {resource.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle2 size={18} />
                <h3 className="font-bold">Regla operativa</h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Si un recurso no tiene servicios vinculados, después no podrá
                aparecer como disponible para esos servicios. El sistema no lee
                mentes. Todavía.
              </p>
            </section>
          </aside>

          <form
            action={updateResourceServicesWithId}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Servicios disponibles</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Marcá los servicios que este recurso puede realizar.
                </p>
              </div>

              <p className="text-sm font-bold text-blue-600">
                {services.length} servicio(s)
              </p>
            </div>

            {services.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <BriefcaseBusiness
                  size={42}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 text-lg font-bold">
                  No hay servicios cargados
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Primero creá servicios. Después vas a poder asignarlos a este
                  recurso.
                </p>

                <Link
                  href="/professional/services"
                  className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Ir a servicios
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-4">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        name="serviceIds"
                        value={service.id}
                        defaultChecked={selectedServiceIds.has(service.id)}
                        className="mt-1 h-5 w-5 rounded border-slate-300"
                      />

                      <div className="flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="font-bold text-slate-950">
                              {service.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {service.description ||
                                "Sin descripción cargada."}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-white px-3 py-2 text-slate-600">
                              {service.durationMinutes} min
                            </span>
                            <span className="rounded-full bg-white px-3 py-2 text-blue-600">
                              ${service.price.toString()}
                            </span>
                            <span className="rounded-full bg-white px-3 py-2 text-slate-600">
                              {service.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                >
                  Guardar servicios del recurso
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}