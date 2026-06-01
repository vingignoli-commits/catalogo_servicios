export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/prisma";

export default async function DatabaseHealthPage() {
  const [
    usersCount,
    professionalProfilesCount,
    clientProfilesCount,
    servicesCount,
    appointmentsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.professionalProfile.count(),
    prisma.clientProfile.count(),
    prisma.service.count(),
    prisma.appointment.count(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
          System health
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Base de datos conectada correctamente
        </h1>

        <p className="mt-3 text-slate-300">
          Next.js está consultando Supabase PostgreSQL mediante Prisma.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <HealthCard label="Usuarios" value={usersCount} />
          <HealthCard
            label="Perfiles profesionales"
            value={professionalProfilesCount}
          />
          <HealthCard label="Perfiles cliente" value={clientProfilesCount} />
          <HealthCard label="Servicios" value={servicesCount} />
          <HealthCard label="Turnos" value={appointmentsCount} />
        </div>
      </section>
    </main>
  );
}

function HealthCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
