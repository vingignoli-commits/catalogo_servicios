import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import {
  getAvailableResourceSlots,
  getAvailableSlots,
} from "@/lib/availability/slots";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageShell } from "@/components/ui/page-shell";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function buildConfirmUrl({
  professionalId,
  serviceId,
  resourceId,
  date,
  startTime,
  endTime,
}: {
  professionalId: string;
  serviceId: string;
  resourceId?: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const params = new URLSearchParams({
    serviceId,
    date,
    startTime,
    endTime,
  });

  if (resourceId) {
    params.set("resourceId", resourceId);
  }

  return `/professionals/${professionalId}/slots/confirm?${params.toString()}`;
}

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    serviceId?: string;
    date?: string;
    error?: string;
  }>;
};

export default async function SlotsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  if (!query.serviceId) {
    return notFound();
  }

  const user = await getCurrentUser();

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      resources: {
        where: {
          isActive: true,
          services: {
            some: {
              serviceId: query.serviceId,
            },
          },
        },
      },
    },
  });

  if (!professional || !professional.isActive) {
    return notFound();
  }

  const service = await prisma.service.findFirst({
    where: {
      id: query.serviceId,
      professionalId: professional.id,
      isActive: true,
    },
  });

  if (!service) {
    return notFound();
  }

  const dateInputValue = query.date ?? formatDateInputValue(new Date());
  const selectedDate = new Date(`${dateInputValue}T00:00:00`);

  const resourceSlots = await getAvailableResourceSlots({
    professionalId: professional.id,
    serviceId: service.id,
    date: selectedDate,
  });

  const legacySlots = await getAvailableSlots({
    professionalId: professional.id,
    serviceId: service.id,
    date: selectedDate,
  });

  const useResourceSlots = resourceSlots.length > 0;
  const isClient = user?.role === "CLIENT";

  return (
    <PageShell
      variant="public"
      backHref={`/professionals/${professional.id}`}
      eyebrow="Reserva online"
      title="Elegí fecha y horario"
      subtitle="Seleccioná un turno disponible. Antes de reservar vas a ver un resumen para confirmar."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <AppCard className="border-blue-100 bg-blue-50">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Servicio seleccionado
                </p>

                <h1 className="mt-3 text-3xl font-extrabold text-slate-950">
                  {service.title}
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {service.description ||
                    "Servicio profesional disponible para solicitud de turno."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-slate-600">
                    <Clock3 size={15} />
                    {service.durationMinutes} min
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-slate-600">
                    <CalendarDays size={15} />
                    {service.modality}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-blue-600">
                    ${service.price.toString()}
                  </span>

                  {useResourceSlots ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-blue-600">
                      <UserRound size={15} />
                      {professional.resources.length} recurso(s)
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-500">Profesional</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {professional.user.name ?? professional.user.email.split("@")[0]}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold">
                    {professional.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400">
                    ({professional.reviewCount})
                  </span>
                </div>
              </div>
            </div>
          </AppCard>

          {query.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
              {query.error}
            </div>
          ) : null}

          <AppCard>
            <form action={`/professionals/${professional.id}/slots`}>
              <input type="hidden" name="serviceId" value={service.id} />

              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label
                    className="text-sm font-bold text-slate-800"
                    htmlFor="date"
                  >
                    Seleccionar fecha
                  </label>

                  <input
                    id="date"
                    type="date"
                    name="date"
                    defaultValue={dateInputValue}
                    required
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Fecha seleccionada: {formatDateDDMMYYYY(selectedDate)}
                  </p>
                </div>

                <AppButton type="submit" size="lg">
                  Ver disponibilidad
                </AppButton>
              </div>
            </form>
          </AppCard>

          <AppCard>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Turnos disponibles
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDateDDMMYYYY(selectedDate)}
                </p>
              </div>

              <p className="text-sm font-medium text-slate-500">
                {useResourceSlots
                  ? `${resourceSlots.length} horario(s) por recurso`
                  : `${legacySlots.length} horario(s) disponibles`}
              </p>
            </div>

            {!isClient ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                Para solicitar un turno tenés que iniciar sesión como cliente.

                <div className="mt-5 flex flex-wrap gap-3">
                  <AppButton href="/login" size="sm">
                    Iniciar sesión
                  </AppButton>

                  <AppButton href="/register" variant="secondary" size="sm">
                    Crear cuenta cliente
                  </AppButton>
                </div>
              </div>
            ) : null}

            {useResourceSlots ? (
              resourceSlots.length === 0 ? (
                <EmptySlots />
              ) : (
                <div className="mt-6 grid gap-3">
                  {resourceSlots.map((slot) => {
                    const key = `${slot.resourceId}-${slot.startTime}-${slot.endTime}`;

                    if (!isClient) {
                      return (
                        <div
                          key={key}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-slate-900">
                              {slot.startTime}
                            </span>
                            <span>{slot.resourceName}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={key}
                        href={buildConfirmUrl({
                          professionalId: professional.id,
                          serviceId: service.id,
                          resourceId: slot.resourceId,
                          date: dateInputValue,
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                        })}
                        className="block rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left text-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-extrabold">{slot.startTime}</p>
                            <p className="mt-1 text-xs opacity-80">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold">{slot.resourceName}</p>
                            <p className="mt-1 text-xs opacity-80">
                              {slot.resourceType}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            ) : legacySlots.length === 0 ? (
              <EmptySlots />
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {legacySlots.map((slot) => {
                  if (!isClient) {
                    return (
                      <div
                        key={`${slot.startTime}-${slot.endTime}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-bold text-slate-400"
                      >
                        {slot.startTime}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={`${slot.startTime}-${slot.endTime}`}
                      href={buildConfirmUrl({
                        professionalId: professional.id,
                        serviceId: service.id,
                        date: dateInputValue,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                      })}
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center text-sm font-bold text-blue-700 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95"
                    >
                      {slot.startTime}
                    </Link>
                  );
                })}
              </div>
            )}
          </AppCard>
        </div>

        <aside className="space-y-6">
          <AppCard className="sticky top-24 border-slate-100">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-extrabold text-blue-700">
                {professional.avatarUrl ? (
                  <img
                    src={professional.avatarUrl}
                    alt={professional.user.name ?? professional.user.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (professional.user.name ?? professional.user.email)[0].toUpperCase()
                )}
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                {professional.user.name ?? professional.user.email.split("@")[0]}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {professional.specialty || "Servicios profesionales"}
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 text-blue-600">
                <Star size={16} fill="currentColor" />
                <span className="font-bold">
                  {professional.averageRating.toFixed(1)}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-left text-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-600">
                  <MapPin size={18} className="text-blue-600" />
                  <span>
                    {professional.location || "Ubicación no especificada"}
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-600">
                  <Clock3 size={18} className="text-blue-600" />
                  <span>{service.durationMinutes} minutos</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-600">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span>Turno sujeto a confirmación profesional</span>
                </div>
              </div>
            </div>
          </AppCard>
        </aside>
      </div>
    </PageShell>
  );
}

function EmptySlots() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
      <CalendarDays size={40} className="mx-auto text-slate-300" />
      <h3 className="mt-4 text-lg font-bold text-slate-950">
        No hay turnos disponibles
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Probá con otra fecha. Puede que no haya recursos disponibles, horarios
        cargados o que el profesional tenga excepciones.
      </p>
    </div>
  );
}