import Link from "next/link";
import {
  BriefcaseBusiness,
  DoorOpen,
  Scissors,
  Settings,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  createResourceAction,
  deleteResourceAction,
  toggleResourceStatusAction,
} from "./actions";

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

function getResourceIcon(type: string) {
  if (type === "PERSON") return <UserRound size={22} />;
  if (type === "ROOM") return <DoorOpen size={22} />;
  if (type === "CHAIR") return <Scissors size={22} />;
  if (type === "EQUIPMENT") return <BriefcaseBusiness size={22} />;
  return <Settings size={22} />;
}

type ProfessionalResourcesPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProfessionalResourcesPage({
  searchParams,
}: ProfessionalResourcesPageProps) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      resources: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              availability: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Primero completá tu perfil</h1>
          <p className="mt-2 text-sm text-slate-500">
            Antes de crear recursos necesitás tener un perfil profesional.
          </p>

          <Link
            href="/professional/profile"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Completar perfil
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Recursos de agenda
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Creá barberos, consultorios, salas, cabinas o equipos. Cada
              recurso puede tener servicios y horarios propios.
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

      <section className="mx-auto max-w-6xl px-6 py-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <form
            action={createResourceAction}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold">Nuevo recurso</h2>
            <p className="mt-2 text-sm text-slate-500">
              Un recurso es quien o qué puede atender un turno.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  className="text-sm font-bold text-slate-800"
                  htmlFor="name"
                >
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej: Juan barbero, Consultorio 1, Cabina estética"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                />
              </div>

              <div>
                <label
                  className="text-sm font-bold text-slate-800"
                  htmlFor="type"
                >
                  Tipo
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue="PERSON"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                >
                  <option value="PERSON">Persona</option>
                  <option value="ROOM">Sala / consultorio</option>
                  <option value="CHAIR">Silla / puesto</option>
                  <option value="EQUIPMENT">Equipo</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label
                  className="text-sm font-bold text-slate-800"
                  htmlFor="description"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Ej: Especialista en cortes clásicos y barba."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
            >
              Crear recurso
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Recursos cargados</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Asigná servicios y horarios a cada recurso.
                </p>
              </div>

              <p className="text-sm font-bold text-blue-600">
                {profile.resources.length} recurso(s)
              </p>
            </div>

            {profile.resources.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-bold">Todavía no hay recursos</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Creá tu primer recurso. Si sos profesional individual, ese
                  recurso sos vos. Humilde pero cierto.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                {profile.resources.map((resource) => (
                  <article
                    key={resource.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                          {getResourceIcon(resource.type)}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-950">
                            {resource.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {getResourceTypeLabel(resource.type)}
                          </p>

                          {resource.description ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              {resource.description}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                            <span className="rounded-full bg-white px-3 py-2">
                              {resource._count.services} servicio(s)
                            </span>
                            <span className="rounded-full bg-white px-3 py-2">
                              {resource._count.availability} horario(s)
                            </span>
                            <span className="rounded-full bg-white px-3 py-2">
                              {resource._count.appointments} turno(s)
                            </span>
                            <span className="rounded-full bg-white px-3 py-2">
                              {resource.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>

                          {resource.services.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {resource.services.map((resourceService) => (
                                <span
                                  key={resourceService.serviceId}
                                  className="rounded-full bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700"
                                >
                                  {resourceService.service.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-xs font-medium text-amber-600">
                              Sin servicios vinculados.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/professional/resources/${resource.id}/services`}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          Servicios
                        </Link>

                        <Link
                          href={`/professional/resources/${resource.id}/availability`}
                          className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Horarios
                        </Link>

                        <form
                          action={async () => {
                            "use server";
                            await toggleResourceStatusAction(resource.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                          >
                            {resource.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </form>

                        <form
                          action={async () => {
                            "use server";
                            await deleteResourceAction(resource.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
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
          </section>
        </div>
      </section>
    </main>
  );
}