import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function ProfessionalsPage() {
  const professionals = await prisma.professionalProfile.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { averageRating: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-slate-900">TurnoPro</Link>
        <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">Iniciar sesión</Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Profesionales</h1>

        {professionals.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">Aún no hay profesionales registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((p) => (
              <Link
                key={p.id}
                href={`/professionals/${p.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {(p.user.name ?? p.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm">{p.user.name ?? p.user.email}</h2>
                    {p.specialty && <p className="text-xs text-slate-500">{p.specialty}</p>}
                  </div>
                </div>
                {p.bio && <p className="text-xs text-slate-600 line-clamp-2">{p.bio}</p>}
                {p.location && <p className="text-xs text-slate-400 mt-2">📍 {p.location}</p>}
                {p.reviewCount > 0 && (
                  <p className="text-xs text-amber-600 mt-1">★ {p.averageRating.toFixed(1)} ({p.reviewCount} reseñas)</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
