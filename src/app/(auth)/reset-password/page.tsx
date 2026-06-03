import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  let exchangeError: string | null = null;

  if (params.code) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      exchangeError = "El enlace expiró o no es válido. Pedí uno nuevo.";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-black uppercase tracking-wide text-blue-400">
          Nueva contraseña
        </p>

        <h1 className="mt-3 text-3xl font-black">Crear nueva contraseña</h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Definí una contraseña nueva para recuperar el acceso.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/60 p-4 text-sm font-bold text-red-200">
            {params.error}
          </div>
        ) : null}

        {exchangeError ? (
          <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/60 p-4 text-sm font-bold text-red-200">
            {exchangeError}
          </div>
        ) : null}

        <form action={resetPasswordAction} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-200">
              Nueva contraseña
            </label>

            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-200">
              Confirmar contraseña
            </label>

            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Repetí la contraseña"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Actualizar contraseña
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
