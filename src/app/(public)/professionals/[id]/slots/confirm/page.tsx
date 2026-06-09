import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppCard } from "@/components/ui/app-card";
import { PageShell } from "@/components/ui/page-shell";
import { confirmAppointmentAction } from "./actions";

function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

type ConfirmAppointmentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    serviceId?: string;
    resourceId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>;
};

export default async function ConfirmAppointmentPage({
  params,
  searchParams,
}: ConfirmAppointmentPageProps) {
  const { id } = await params;
  const query = await searchParams;

  if (!query.serviceId || !query.date || !query.startTime || !query.endTime) {
    return notFound();
  }

  const user = await getCurrentUser();

  const currentUrl = `/professionals/${id}/slots/confirm?${new URLSearchParams({
    serviceId: query.serviceId,
    ...(query.resourceId ? { resourceId: query.resourceId } : {}),
    date: query.date,
    startTime: query.startTime,
    endTime: query.endTime,
  }).toString()}`;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(currentUrl)}`);
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
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

  const resource = query.resourceId
    ? await prisma.resource.findFirst({
        where: {
          id: query.resourceId,
          professionalId: professional.id,
          isActive: true,
        },
      })
    : null;

  if (query.resourceId && !resource) {
    redirect(
      `/professionals/${professional.id}/slots?serviceId=${service.id}&date=${query.date}`
    );
  }

  if (user.role !== "CLIENT") {
    return (
      <PageShell
        variant="public"
        backHref={`/professionals/${professional.id}/slots?serviceId=${service.id}&date=${query.date}`}
        eyebrow="Cuenta incorrecta"
        title="Para reservar necesitás una cuenta de cliente"
        subtitle="Estás logueado, pero tu cuenta no tiene rol de cliente."
      >
        <AppCard className="border-amber-200 bg-amber-50">
          <p className="text-sm leading-relaxed text-amber-800">
            Rol actual: <strong>{user.role}</strong>. Cerrá sesión e ingresá con
            una cuenta CLIENT, o creá una cuenta nueva como cliente.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white"
            >
              Cerrar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-700"
            >
              Crear cuenta cliente
            </Link>
          </div>
        </AppCard>
      </PageShell>
    );
  }

  const selectedDate = new Date(`${query.date}T00:00:00`);
  const displayName =
    professional.user.name ?? professional.user.email.split("@")[0];

  return (
    <PageShell
      variant="public"
      backHref={`/professionals/${professional.id}/slots?serviceId=${service.id}&date=${query.date}`}
      eyebrow="Confirmar reserva"
      title="Revisá los datos del turno"
      subtitle="El turno todavía no fue creado. Confirmalo solo si los datos son correctos."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <AppCard className="border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <CheckCircle2 size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Resumen de reserva
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Al confirmar, el turno queda como solicitado. El profesional
                deberá aceptarlo desde su panel.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <SummaryRow
              icon={<UserRound size={19} />}
              label="Profesional / negocio"
              value={displayName}
            />

            <SummaryRow
              icon={<ShieldCheck size={19} />}
              label="Servicio"
              value={service.title}
            />

            {resource ? (
              <SummaryRow
                icon={<UserRound size={19} />}
                label="Recurso asignado"
                value={resource.name}
              />
            ) : null}

            <SummaryRow
              icon={<CalendarDays size={19} />}
              label="Fecha"
              value={formatDateDDMMYYYY(selectedDate)}
            />

            <SummaryRow
              icon={<Clock3 size={19} />}
              label="Horario"
              value={`${query.startTime} - ${query.endTime}`}
            />

            <SummaryRow
              icon={<Clock3 size={19} />}
              label="Duración"
              value={`${service.durationMinutes} minutos`}
            />

            <SummaryRow
              icon={<MapPin size={19} />}
              label="Dirección"
              value={professional.location || "Sin dirección cargada"}
            />
          </div>

          <form
            action={confirmAppointmentAction}
            className="mt-8 flex flex-wrap gap-3"
          >
            <input type="hidden" name="professionalId" value={professional.id} />
            <input type="hidden" name="serviceId" value={service.id} />
            <input type="hidden" name="resourceId" value={resource?.id ?? ""} />
            <input type="hidden" name="date" value={query.date} />
            <input type="hidden" name="startTime" value={query.startTime} />
            <input type="hidden" name="endTime" value={query.endTime} />

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
            >
              Confirmar turno
            </button>

            <Link
              href={`/professionals/${professional.id}/slots?serviceId=${service.id}&date=${query.date}`}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </form>
        </AppCard>

        <aside className="space-y-6">
          <AppCard className="border-blue-100 bg-blue-50">
            <h3 className="text-xl font-bold text-slate-950">Importante</h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Este turno queda pendiente hasta que el profesional lo acepte.
              Podés ver el estado desde tu panel de turnos.
            </p>
          </AppCard>

          <AppCard>
            <h3 className="text-xl font-bold text-slate-950">Profesional</h3>

            <p className="mt-3 text-sm text-slate-500">{displayName}</p>

            <p className="mt-2 text-sm text-slate-500">
              {professional.location || "Sin dirección cargada"}
            </p>

            <Link
              href={`/professionals/${professional.id}`}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Ver perfil público
            </Link>
          </AppCard>
        </aside>
      </div>
    </PageShell>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mt-1 text-blue-600">{icon}</div>

      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-1 font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}
