import Link from "next/link";

type Props = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">TurnoPro</h1>
          <p className="text-slate-500 mt-1 text-sm">Iniciá sesión en tu cuenta</p>
        </div>

        {params.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action="/auth/login" method="POST" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <input type="hidden" name="next" value={next} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              name="email" type="email" required autoComplete="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              name="password" type="password" required autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
