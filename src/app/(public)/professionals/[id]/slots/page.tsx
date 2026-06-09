import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notFound } from "next/navigation";
import Link from "next/link";
import { bookSlotAction } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ serviceId?: string }>;
};

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default async function SlotsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { serviceId } = await searchParams;

  if (!serviceId) notFound();

  const [professional, service] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { id, isActive: true },
      include: { user: { select: { name: true } } },
    }),
    prisma.service.findUnique({ where: { id: serviceId, isActive: true } }),
  ]);

  if (!professional || !service || service.professionalId !== professional.id) notFound();

  // Intentamos obtener el usuario pero NO redirigimos si no hay sesión
  const currentUser = await getCurrentUser();
  const isClient = currentUser?.role === "CLIENT";

  // URL correcta para el next después del login (encodeURIComponent del query string)
  const nextUrl = `/professionals/${id}/slots?serviceId=${serviceId}`;

  const days = getNext14Days();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href={`/professionals/${id}`} className="text-sm text-slate-600 hover:text-slate-900">
          ← Volver al perfil
        </Link>
        {currentUser ? (
          <span className="text-sm text-slate-600">{currentUser.name ?? currentUser.email}</span>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className="text-sm text-blue-600 font-medium hover:underline">
            Iniciar sesión
          </Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Reservar turno</h1>
        <p className="text-sm text-slate-500 mb-6">
          {service.title} con {professional.user.name} · {service.durationMinutes} min · ${Number(service.price).toLocaleString("es-AR")}
        </p>

        {!isClient ? (
          // Si no hay sesión de cliente, mostrar login inline — no redirigir
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-700 font-medium mb-2">Necesitás iniciar sesión para reservar</p>
            <p className="text-sm text-slate-500 mb-6">Creá una cuenta o iniciá sesión como cliente</p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/login?next=${encodeURIComponent(nextUrl)}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(nextUrl)}`}
                className="border border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <form action={bookSlotAction}>
              <input type="hidden" name="professionalId" value={id} />
              <input type="hidden" name="serviceId" value={serviceId} />

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Elegí un día</label>
                <div className="grid grid-cols-2 gap-2">
                  {days.map((d) => (
                    <label key={toDateStr(d)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="date" value={toDateStr(d)} required className="accent-blue-600" />
                      <span className="text-sm text-slate-700">{formatDate(d)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Elegí un horario</label>
                <div className="grid grid-cols-4 gap-2">
                  {["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30"].map((t) => (
                    <label key={t} className="flex items-center justify-center cursor-pointer">
                      <input type="radio" name="startTime" value={t} required className="sr-only peer" />
                      <span className="w-full text-center text-sm border border-slate-200 rounded-lg py-2 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:border-blue-300 transition-colors cursor-pointer">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                <textarea
                  name="notes" rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Alguna indicación o consulta..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Confirmar solicitud de turno
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
