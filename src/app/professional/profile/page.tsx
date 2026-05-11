import Link from "next/link";
import { CalendarClock, ImageIcon, MapPin, UserRound, Workflow } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/get-current-user";
import { upsertProfessionalProfileAction } from "./actions";

type ProfessionalProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ProfessionalProfilePage({
  searchParams,
}: ProfessionalProfilePageProps) {
  const params = await searchParams;
  const user = await requireRole(["PROFESSIONAL"]);

  const profile = await prisma.professionalProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              Profesional
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              Perfil profesional
            </h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Configurá tu imagen pública, dirección, descripción y modo de
              agenda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile ? (
              <Link
                href={`/professionals/${profile.id}`}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                Ver perfil público
              </Link>
            ) : null}

            <Link
              href="/professional"
              className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Volver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        {params.success ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">
            {params.success}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <form
            action={upsertProfessionalProfileAction}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="grid gap-6">
              <FieldGroup
                icon={<ImageIcon size={22} />}
                title="Imagen pública"
                description="Pegá la URL de una imagen. Luego podemos reemplazar esto por subida directa a Supabase Storage."
              >
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="avatarUrl"
                  >
                    URL de foto o imagen de portada
                  </label>
                  <input
                    id="avatarUrl"
                    name="avatarUrl"
                    type="url"
                    defaultValue={profile?.avatarUrl ?? ""}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Por ahora se usa URL externa. Más adelante lo hacemos con
                    carga de archivo real.
                  </p>
                </div>
              </FieldGroup>

              <FieldGroup
                icon={<UserRound size={22} />}
                title="Identidad profesional"
                description="Definí cómo te van a encontrar y entender los clientes."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      className="text-sm font-bold text-slate-800"
                      htmlFor="specialty"
                    >
                      Especialidad
                    </label>
                    <input
                      id="specialty"
                      name="specialty"
                      type="text"
                      defaultValue={profile?.specialty ?? ""}
                      placeholder="Ej: Barbería, nutrición, psicología"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div>
                    <label
                      className="text-sm font-bold text-slate-800"
                      htmlFor="experienceYears"
                    >
                      Años de experiencia
                    </label>
                    <input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min={0}
                      max={80}
                      defaultValue={profile?.experienceYears ?? 0}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                    />
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup
                icon={<MapPin size={22} />}
                title="Dirección"
                description="Usá una dirección completa. Luego esta información alimentará el mapa público."
              >
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="location"
                  >
                    Dirección completa
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    defaultValue={profile?.location ?? ""}
                    placeholder="Ej: San Martín 2500, Santa Fe, Argentina"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Cuanto más precisa sea la dirección, mejor funcionará el
                    mapa. Más adelante podemos guardar latitud/longitud.
                  </p>
                </div>
              </FieldGroup>

              <FieldGroup
                icon={<Workflow size={22} />}
                title="Descripción"
                description="Explicá qué hacés, para quién y por qué deberían elegirte."
              >
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="bio"
                  >
                    Descripción profesional
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={8}
                    defaultValue={profile?.bio ?? ""}
                    placeholder="Contá qué hacés, a quién ayudás y cómo trabajás."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                </div>
              </FieldGroup>

              <FieldGroup
                icon={<CalendarClock size={22} />}
                title="Modo de agenda"
                description="Define cómo se generan los turnos disponibles para tus servicios."
              >
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="availabilityMode"
                  >
                    Modo de agenda
                  </label>

                  <select
                    id="availabilityMode"
                    name="availabilityMode"
                    defaultValue={profile?.availabilityMode ?? "OPEN_HOURS"}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  >
                    <option value="OPEN_HOURS">
                      Horario abierto: calcular turnos según duración del
                      servicio
                    </option>
                    <option value="FIXED_SLOTS">
                      Turnos fijos: usar horarios exactos definidos
                    </option>
                  </select>
                </div>
              </FieldGroup>
            </div>

            <button
              type="submit"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
            >
              Guardar perfil
            </button>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-blue-100">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={user.name ?? user.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-blue-700">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="mt-5 text-center text-xl font-bold">
                Vista comercial
              </h2>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                Tu imagen y dirección aparecen en el perfil público.
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <InfoRow label="Email" value={user.email} />
                <InfoRow
                  label="Especialidad"
                  value={profile?.specialty || "Sin definir"}
                />
                <InfoRow
                  label="Dirección"
                  value={profile?.location || "Sin definir"}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="font-bold text-slate-950">
                Próxima mejora lógica
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Cambiar URL de imagen por carga directa con Supabase Storage y
                guardar coordenadas reales para Google Maps.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FieldGroup({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-950">{value}</span>
    </div>
  );
}