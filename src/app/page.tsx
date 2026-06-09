import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900">TurnoPro</span>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Iniciar sesión</Link>
          <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">Registrarse</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Encontrá el profesional ideal</h1>
        <p className="text-lg text-slate-500 mb-8">Reservá turnos con profesionales y locales en minutos.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/professionals" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Ver profesionales
          </Link>
          <Link href="/register" className="border border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-6 py-3 rounded-lg transition-colors">
            Publicar servicios
          </Link>
        </div>
      </main>
    </div>
  );
}
