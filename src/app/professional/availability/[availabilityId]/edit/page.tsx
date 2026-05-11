import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { updateAvailabilityAction } from "../../actions";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

type EditAvailabilityPageProps = {
  params: Promise<{
    availabilityId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditAvailabilityPage({
  params,
  searchParams,
}: EditAvailabilityPageProps) {
  const { availabilityId } = await params;
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

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      professionalId: profile.id,
    },
  });

  if (!availability) {
    redirect("/professional/availability");
  }

  const updateAvailabilityWithId = updateAvailabilityAction.bind(
    null,
    availability.id
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Profesional
            </p>
            <h1 className="mt-3 text-3xl font-bold">Editar horario</h1>
            <p className="mt-2 text-slate-300">
              Modificá día y horario recurrente.
            </p>
          </div>

          <Link
            href="/professional/availability"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            Volver
          </Link>
        </div>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
            {query.error}
          </div>
        ) : null}

        <form
          action={updateAvailabilityWithId}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium" htmlFor="dayOfWeek">
                Día
              </label>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                defaultValue={availability.dayOfWeek}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="startTime">
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
                  defaultValue={availability.startTime}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="endTime">
                  Hasta
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                  placeholder="09:00"
                  required
                  defaultValue={availability.endTime}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Guardar cambios
          </button>
        </form>
      </section>
    </main>
  );
}