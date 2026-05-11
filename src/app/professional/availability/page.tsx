import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import {
  createAvailabilityExceptionAction,
  createBulkAvailabilityAction,
  deleteAvailabilityAction,
  deleteAvailabilityExceptionAction,
  toggleAvailabilityStatusAction,
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

function formatExceptionType(type: "UNAVAILABLE" | "CUSTOM_HOURS") {
  if (type === "UNAVAILABLE") return "No disponible";
  return "Horario especial";
}

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

type ProfessionalAvailabilityPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProfessionalAvailabilityPage({
  searchParams,
}: ProfessionalAvailabilityPageProps) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      availability: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      availabilityExceptions: {
        orderBy: {
          date: "asc",
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
            Antes de configurar disponibilidad necesitás tener un perfil
            profesional.
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
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Profesional
            </p>
            <h1 className="mt-3 text-3xl font-bold">Disponibilidad</h1>
            <p className="mt-2 text-slate-300">
              Configurá tu agenda recurrente y excepciones puntuales.
            </p>
          </div>

          <Link
            href="/professional"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            Volver
          </Link>
        </div>

        {params.error ? (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <form
          action={createBulkAvailabilityAction}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-xl font-semibold">Carga semanal</h2>
          <p className="mt-2 text-sm text-slate-400">
            Elegí uno o varios días y aplicá un mismo horario. Luego podés
            editar cada bloque cargado.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {days.map((day) => (
              <label
                key={day.value}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm"
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

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="bulkStartTime">
                Desde
              </label>
              <input
                id="bulkStartTime"
                name="bulkStartTime"
                type="text"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="09:00"
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="bulkEndTime">
                Hasta
              </label>
              <input
                id="bulkEndTime"
                name="bulkEndTime"
                type="text"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="09:00"
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Aplicar horario
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Horarios recurrentes</h2>

          {profile.availability.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Todavía no cargaste disponibilidad semanal.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-4 text-left">Día</th>
                    <th className="p-4 text-left">Horario</th>
                    <th className="p-4 text-left">Estado</th>
                    <th className="p-4 text-left">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {profile.availability.map((block) => (
                    <tr key={block.id} className="border-t border-slate-800">
                      <td className="p-4">{getDayLabel(block.dayOfWeek)}</td>
                      <td className="p-4">
                        {block.startTime} - {block.endTime}
                      </td>
                      <td className="p-4">
                        {block.isActive ? "Activo" : "Inactivo"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/professional/availability/${block.id}/edit`}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-xs"
                          >
                            Editar
                          </Link>

                          <form
                            action={async () => {
                              "use server";
                              await toggleAvailabilityStatusAction(block.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-slate-700 px-4 py-2 text-xs"
                            >
                              {block.isActive ? "Desactivar" : "Activar"}
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await deleteAvailabilityAction(block.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-red-900 px-4 py-2 text-xs text-red-300"
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
        </div>

        <form
          action={createAvailabilityExceptionAction}
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-xl font-semibold">Excepción de calendario</h2>
          <p className="mt-2 text-sm text-slate-400">
            Marcá feriados, vacaciones, días sin atención o cambios puntuales de
            horario.
          </p>

          <div className="mt-5 grid gap-5 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium" htmlFor="date">
                Fecha
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Se mostrará como DD/MM/AAAA.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="type">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                defaultValue="UNAVAILABLE"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              >
                <option value="UNAVAILABLE">No disponible</option>
                <option value="CUSTOM_HOURS">Horario especial</option>
              </select>
            </div>

            <div>
              <label
                className="text-sm font-medium"
                htmlFor="exceptionStartTime"
              >
                Desde
              </label>
              <input
                id="exceptionStartTime"
                name="exceptionStartTime"
                type="text"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="09:00"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>

            <div>
              <label
                className="text-sm font-medium"
                htmlFor="exceptionEndTime"
              >
                Hasta
              </label>
              <input
                id="exceptionEndTime"
                name="exceptionEndTime"
                type="text"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="09:00"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="reason">
                Motivo
              </label>
              <input
                id="reason"
                name="reason"
                type="text"
                placeholder="Feriado, viaje, evento..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Guardar excepción
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Excepciones cargadas</h2>

          {profile.availabilityExceptions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Todavía no cargaste excepciones.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-4 text-left">Fecha</th>
                    <th className="p-4 text-left">Tipo</th>
                    <th className="p-4 text-left">Horario</th>
                    <th className="p-4 text-left">Motivo</th>
                    <th className="p-4 text-left">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {profile.availabilityExceptions.map((exception) => (
                    <tr key={exception.id} className="border-t border-slate-800">
                      <td className="p-4">
                        {formatDateDDMMYYYY(exception.date)}
                      </td>
                      <td className="p-4">
                        {formatExceptionType(exception.type)}
                      </td>
                      <td className="p-4">
                        {exception.type === "CUSTOM_HOURS"
                          ? `${exception.startTime} - ${exception.endTime}`
                          : "Sin atención"}
                      </td>
                      <td className="p-4">{exception.reason || "-"}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/professional/availability/exceptions/${exception.id}/edit`}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-xs"
                          >
                            Editar
                          </Link>

                          <form
                            action={async () => {
                              "use server";
                              await deleteAvailabilityExceptionAction(
                                exception.id
                              );
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-red-900 px-4 py-2 text-xs text-red-300"
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
        </div>
      </section>
    </main>
  );
}