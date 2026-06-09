import { requireRole } from "@/lib/auth/get-current-user";
export default async function AppointmentsPage() {
  await requireRole(["CLIENT"]);
  return <div className="p-8 text-slate-600">Próximamente: historial de turnos</div>;
}
