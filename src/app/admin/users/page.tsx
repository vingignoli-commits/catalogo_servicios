import { requireRole } from "@/lib/auth/get-current-user";
export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);
  return <div className="p-8 text-slate-600">Próximamente: gestión de usuarios</div>;
}
