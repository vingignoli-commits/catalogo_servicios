import Link from "next/link";
import {
  CalendarCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <div className="relative hidden overflow-hidden bg-blue-600 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.35),transparent_40%)]" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600">
              <CalendarCheck2 size={24} />
            </div>

            <div>
              <p className="text-lg font-black">TurnoPro</p>
              <p className="text-sm text-blue-100">Reservas online</p>
            </div>
          </Link>

          <div className="relative max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-blue-100">
              Marketplace de servicios
            </p>

            <h1 className="mt-4 text-5xl font-black leading-tight">
              Entrá, gestioná y reservá sin fricción.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-100">
              Clientes y profesionales en una misma plataforma: turnos,
              mensajes, agenda, reseñas y notificaciones.
            </p>
          </div>

          <div className="relative grid gap-3">
            <TrustItem text="Agenda integrada" />
            <TrustItem text="Mensajería directa" />
            <TrustItem text="Notificaciones operativas" />
          </div>
        </div>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <CalendarCheck2 size={22} />
                </div>

                <div>
                  <p className="font-black">TurnoPro</p>
                  <p className="text-xs text-slate-400">Reservas online</p>
                </div>
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200"
              >
                Inicio
              </Link>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-blue-950/30 sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  Ingresar
                </p>

                <h1 className="mt-3 text-3xl font-black">
                  Bienvenido de nuevo
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Accedé a tus turnos, mensajes, agenda y notificaciones.
                </p>
              </div>

              {params.error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {params.error}
                </div>
              ) : null}

              <form action="/auth/login" method="POST" className="mt-8 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Email
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 ring-blue-500 focus-within:ring-2">
                    <Mail size={18} className="text-slate-400" />

                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="tu@email.com"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-800">
                    Contraseña
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 ring-blue-500 focus-within:ring-2">
                    <LockKeyhole size={18} className="text-slate-400" />

                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Ingresar
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <p className="text-sm leading-relaxed text-slate-600">
                    Tu cuenta define si entrás como cliente, profesional o admin.
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                ¿No tenés cuenta?{" "}
                <Link href="/register" className="font-black text-blue-600">
                  Crear cuenta
                </Link>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">
      <ShieldCheck size={18} className="text-blue-100" />
      {text}
    </div>
  );
}
