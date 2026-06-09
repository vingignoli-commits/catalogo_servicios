import { requireRole } from "@/lib/auth/get-current-user";
export default async function ServicesPage() {
  await requireRole(["PROFESSIONAL"]);
  return <div className="p-8 text-slate-600">Próximamente: gestión de servicios</div>;
}
