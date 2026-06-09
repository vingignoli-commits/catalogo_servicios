import { requireRole } from "@/lib/auth/get-current-user";
import Link from "next/link";

export default async function ClientDashboard() {
  const user = await requireRole(["CLIENT"]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-slate-900">TurnoPro</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user.name ?? user.email}</span>
          <Link href="/logout" className="text-sm text-slate-500 hover:text-slate-700">Salir</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Bienvenido, {user.name?.split(" ")[0] ?? "cliente"}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/professionals" className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
            <h2 className="font-semibold text-slate-900 mb-1">Buscar profesionales</h2>
            <p className="text-sm text-slate-500">Encontrá y reservá servicios</p>
          </Link>
          <Link href="/client/appointments" className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
            <h2 className="font-semibold text-slate-900 mb-1">Mis turnos</h2>
            <p className="text-sm text-slate-500">Ver y gestionar tus reservas</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
