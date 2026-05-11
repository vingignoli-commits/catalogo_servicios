import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { updateAvailabilityExceptionAction } from "../../../actions";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

type EditExceptionPageProps = {
  params: Promise<{
    exceptionId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditExceptionPage({
  params,
  searchParams,
}: EditExceptionPageProps) {
  const { exceptionId } = await params;
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

  const exception = await prisma.availabilityException.findFirst({
    where: {
      id: exceptionId,
      professionalId: profile.id,
    },
  });

  if (!exception) {
    redirect("/professional/availability");
  }

  const updateExceptionWithId = updateAvailabilityExceptionAction.bind(
    null,
    exception.id
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Profesional
            </p>
            <h1 className="mt-3 text-3xl font-bold">Editar excepción</h1>
            <p className="mt-2 text-slate-300">
              Fecha actual: {formatDateDDMMYYYY(exception.date)}
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
          action={updateExceptionWithId}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium" htmlFor="date">
                Fecha
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={toDateInputValue(exception.date)}
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
                defaultValue={exception.type}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              >
                <option value="UNAVAILABLE">No disponible</option>
                <option value="CUSTOM_HOURS">Horario especial</option>
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                  defaultValue={exception.startTime ?? ""}
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
                  defaultValue={exception.endTime ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="reason">
                Motivo
              </label>
              <input
                id="reason"
                name="reason"
                type="text"
                defaultValue={exception.reason ?? ""}
                placeholder="Feriado, viaje, evento..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
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