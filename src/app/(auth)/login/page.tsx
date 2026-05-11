import Link from "next/link";

import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
          Acceso
        </p>

        <h1 className="mt-3 text-3xl font-bold">Iniciar sesión</h1>

        <p className="mt-2 text-sm text-slate-300">
          Entrá a tu panel según tu rol.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-5">
          <div>
            <label
              className="text-sm font-medium text-slate-200"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              className="text-sm font-medium text-slate-200"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-emerald-400">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}