import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { updateServiceAction } from "../../actions";

type EditServicePageProps = {
  params: Promise<{
    serviceId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditServicePage({
  params,
  searchParams,
}: EditServicePageProps) {
  const { serviceId } = await params;
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

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      professionalId: profile.id,
    },
  });

  if (!service) {
    redirect("/professional/services");
  }

  const updateServiceWithId = updateServiceAction.bind(null, service.id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
              Profesional
            </p>
            <h1 className="mt-3 text-3xl font-bold">Editar servicio</h1>
            <p className="mt-2 text-slate-300">
              Modificá los datos comerciales del servicio.
            </p>
          </div>

          <Link
            href="/professional/services"
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
          action={updateServiceWithId}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium" htmlFor="title">
                Título
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={service.title}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="description">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={service.description ?? ""}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="price">
                  Precio
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={1}
                  step="0.01"
                  required
                  defaultValue={service.price.toString()}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium"
                  htmlFor="durationMinutes"
                >
                  Duración en minutos
                </label>
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  required
                  defaultValue={service.durationMinutes}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="modality">
                Modalidad
              </label>
              <select
                id="modality"
                name="modality"
                defaultValue={service.modality}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
              >
                <option value="IN_PERSON">Presencial</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Híbrida</option>
              </select>
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