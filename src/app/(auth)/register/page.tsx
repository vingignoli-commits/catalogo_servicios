import Link from "next/link";

import { registerAction } from "./actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-400">
          Crear cuenta
        </p>

        <h1 className="mt-3 text-3xl font-bold">Registrarse</h1>

        <p className="mt-2 text-sm text-slate-300">
          Creá una cuenta como cliente o profesional.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <form action={registerAction} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Ej: Juan Pérez"
            />
          </div>

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
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="role">
              Tipo de cuenta
            </label>
            <select
              id="role"
              name="role"
              defaultValue="CLIENT"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-emerald-500 transition focus:ring-2"
            >
              <option value="CLIENT">Cliente</option>
              <option value="PROFESSIONAL">Profesional</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-emerald-400">
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}