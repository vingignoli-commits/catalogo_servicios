import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type Props = { params: Promise<{ id: string }> };

export default async function ProfessionalProfilePage({ params }: Props) {
  const { id } = await params;

  const professional = await prisma.professionalProfile.findUnique({
    where: { id, isActive: true },
    include: {
      user: { select: { name: true, email: true } },
      services: { where: { isActive: true }, orderBy: { title: "asc" } },
    },
  });

  if (!professional) notFound();

  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/professionals" className="text-sm text-slate-600 hover:text-slate-900">← Volver</Link>
        {currentUser ? (
          <span className="text-sm text-slate-600">{currentUser.name ?? currentUser.email}</span>
        ) : (
          <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">Iniciar sesión</Link>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Profile header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
              {(professional.user.name ?? professional.user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{professional.user.name}</h1>
              {professional.specialty && <p className="text-slate-500">{professional.specialty}</p>}
              {professional.location && <p className="text-sm text-slate-400">📍 {professional.location}</p>}
            </div>
          </div>
          {professional.bio && <p className="text-slate-600 text-sm">{professional.bio}</p>}
          {professional.reviewCount > 0 && (
            <p className="text-sm text-amber-600 mt-3">★ {professional.averageRating.toFixed(1)} · {professional.reviewCount} reseñas</p>
          )}
        </div>

        {/* Services */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">Servicios</h2>
        {professional.services.length === 0 ? (
          <p className="text-slate-400 text-sm">Este profesional aún no publicó servicios.</p>
        ) : (
          <div className="space-y-3">
            {professional.services.map((service) => (
              <div key={service.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{service.title}</h3>
                    {service.description && <p className="text-sm text-slate-500 mt-1">{service.description}</p>}
                    <p className="text-sm text-slate-400 mt-1">⏱ {service.durationMinutes} min</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">${Number(service.price).toLocaleString("es-AR")}</p>
                    {currentUser?.role === "CLIENT" ? (
                      <Link
                        href={`/professionals/${professional.id}/slots?serviceId=${service.id}`}
                        className="mt-2 inline-block text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Reservar
                      </Link>
                    ) : (
                      <Link
                        href={`/login?next=/professionals/${professional.id}/slots?serviceId=${service.id}`}
                        className="mt-2 inline-block text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Iniciar sesión para reservar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
