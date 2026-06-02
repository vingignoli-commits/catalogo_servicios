import Link from "next/link";

import { forgotPasswordAction } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-black uppercase tracking-wide text-blue-400">
          Recuperar acceso
        </p>

        <h1 className="mt-3 text-3xl font-black">Restablecer contraseña</h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Ingresá tu email y te enviamos un enlace para crear una nueva
          contraseña.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/60 p-4 text-sm font-bold text-red-200">
            {params.error}
          </div>
        ) : null}

        {params.success ? (
          <div className="mt-6 rounded-2xl border border-emerald-900 bg-emerald-950/60 p-4 text-sm font-bold text-emerald-200">
            {params.success}
          </div>
        ) : null}

        <form action={forgotPasswordAction} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-200">
              Email
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Enviar enlace
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="font-black text-blue-400">
            Volver a ingresar
          </Link>
        </p>
      </section>
    </main>
  );
}
