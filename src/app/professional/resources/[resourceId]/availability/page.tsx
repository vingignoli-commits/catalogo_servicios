import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Settings } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  createResourceAvailabilityAction,
  deleteResourceAvailabilityAction,
  toggleResourceAvailabilityStatusAction,
} from "./actions";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

function getDayLabel(dayOfWeek: number) {
  return days.find((day) => day.value === dayOfWeek)?.label ?? "Día inválido";
}

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

type ResourceAvailabilityPageProps = {
  params: Promise<{
    resourceId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResourceAvailabilityPage({
  params,
  searchParams,
}: ResourceAvailabilityPageProps) {
  const { resourceId } = await params;
  const query = await searchParams;

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
      availability: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!resource) {
    redirect("/professional/resources");
  }

  const createAvailabilityWithResourceId =
    createResourceAvailabilityAction.bind(null, resource.id);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Recursos
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Disponibilidad de {resource.name}
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Definí los días y horarios en los que este recurso puede atender.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/professional/resources/${resource.id}/services`}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Servicios
            </Link>

            <Link
              href="/professional/resources"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {query.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {query.error}
          </div>
        ) : null}

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

              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold text-slate-950">Estado</p>
                  <p className="mt-1 text-slate-500">
                    {resource.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold text-slate-950">Servicios vinculados</p>
                  <p className="mt-1 text-slate-500">
                    {resource.services.length} servicio(s)
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold text-slate-950">Horarios activos</p>
                  <p className="mt-1 text-slate-500">
                    {
                      resource.availability.filter(
                        (availability) => availability.isActive
                      ).length
                    }{" "}
                    bloque(s)
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock3 size={18} />
                <h3 className="font-bold">Regla operativa</h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Esta disponibilidad se usará para calcular turnos cuando el
                flujo multi-recurso esté activo. La agenda por recurso evita que
                dos personas reserven el mismo barbero, sala o puesto.
              </p>
            </section>
          </aside>

          <section className="space-y-8">
            <form
              action={createAvailabilityWithResourceId}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold">Carga semanal</h2>
              <p className="mt-2 text-sm text-slate-500">
                Elegí uno o varios días y aplicá un mismo horario.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {days.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name="daysOfWeek"
                      value={day.value}
                      className="h-4 w-4"
                    />
                    {day.label}
                  </label>
                ))}
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="startTime"
                  >
                    Desde
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="text"
                    inputMode="numeric"
                    pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                    placeholder="09:00"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                </div>

                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="endTime"
                  >
                    Hasta
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="text"
                    inputMode="numeric"
                    pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                    placeholder="17:00"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                Agregar disponibilidad
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Horarios cargados</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Disponibilidad propia del recurso.
                  </p>
                </div>

                <p className="text-sm font-bold text-blue-600">
                  {resource.availability.length} bloque(s)
                </p>
              </div>

              {resource.availability.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-bold">
                    Todavía no hay horarios
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Cargá disponibilidad para que este recurso pueda aparecer en
                    turnos disponibles.
                  </p>
                </div>
              ) : (
                <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-4 text-left">Día</th>
                        <th className="p-4 text-left">Horario</th>
                        <th className="p-4 text-left">Estado</th>
                        <th className="p-4 text-left">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {resource.availability.map((availability) => (
                        <tr
                          key={availability.id}
                          className="border-t border-slate-200"
                        >
                          <td className="p-4 font-medium text-slate-900">
                            {getDayLabel(availability.dayOfWeek)}
                          </td>

                          <td className="p-4 text-slate-600">
                            {availability.startTime} - {availability.endTime}
                          </td>

                          <td className="p-4 text-slate-600">
                            {availability.isActive ? "Activo" : "Inactivo"}
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <form
                                action={async () => {
                                  "use server";
                                  await toggleResourceAvailabilityStatusAction(
                                    resource.id,
                                    availability.id
                                  );
                                }}
                              >
                                <button
                                  type="submit"
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                  {availability.isActive
                                    ? "Desactivar"
                                    : "Activar"}
                                </button>
                              </form>

                              <form
                                action={async () => {
                                  "use server";
                                  await deleteResourceAvailabilityAction(
                                    resource.id,
                                    availability.id
                                  );
                                }}
                              >
                                <button
                                  type="submit"
                                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Eliminar
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}