import { requireRole } from "@/lib/auth/get-current-user";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-slate-900">TurnoPro Admin</span>
        <Link href="/logout" className="text-sm text-slate-500 hover:text-slate-700">Salir</Link>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel de administración</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/users" className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
            <h2 className="font-semibold text-slate-900 mb-1">Usuarios</h2>
            <p className="text-sm text-slate-500">Gestionar usuarios de la plataforma</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
