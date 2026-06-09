import { requireRole } from "@/lib/auth/get-current-user";
export default async function ProfAppointmentsPage() {
  await requireRole(["PROFESSIONAL"]);
  return <div className="p-8 text-slate-600">Próximamente: gestión de turnos</div>;
}
