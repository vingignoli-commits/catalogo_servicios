import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);

  const [
    usersCount,
    professionalsCount,
    clientsCount,
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
      <section className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-400">Admin</p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <Link
            href="/logout"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
          >
            Salir
          </Link>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat label="Usuarios" value={usersCount} />
          <Stat label="Profesionales" value={professionalsCount} />
          <Stat label="Clientes" value={clientsCount} />
          <Stat label="Servicios" value={servicesCount} />
          <Stat label="Turnos" value={appointmentsCount} />
        </div>

        <div className="mt-10">
          <Link
            href="/admin/users"
            className="inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black"
          >
            Gestionar usuarios
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}